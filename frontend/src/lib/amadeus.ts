import Amadeus from 'amadeus';
import type {
    AmadeusFlightOffer,
    FlightContactInput,
    FlightTravelerInput,
} from './flights';

let amadeusClient: Amadeus | null = null;
type AmadeusMode = 'test' | 'production';

export class AmadeusConfigError extends Error {
    readonly status = 503;

    constructor(message: string) {
        super(message);
        this.name = 'AmadeusConfigError';
    }
}

export class AmadeusRequestError extends Error {
    readonly status = 502;

    constructor(message: string) {
        super(message);
        this.name = 'AmadeusRequestError';
    }
}

export function getAmadeusMode(): AmadeusMode {
    return process.env.AMADEUS_ENV === 'production'
        ? 'production'
        : 'test';
}

function getAmadeusClient(): Amadeus {
    if (amadeusClient) return amadeusClient;

    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new AmadeusConfigError(
            'Flight search is not configured on the server. Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to the deployment environment.'
        );
    }

    amadeusClient = new Amadeus({
        clientId,
        clientSecret,
        hostname: getAmadeusMode(),
    });

    return amadeusClient;
}

export default getAmadeusClient;

function describeAmadeusError(error: unknown, fallbackMessage: string) {
    const response = (error as {
        response?: {
            result?: {
                error?: string;
                error_description?: string;
                errors?: Array<{ detail?: string; title?: string; code?: number | string }>;
            };
        };
    })?.response?.result;

    const firstError = response?.errors?.[0];

    if (response?.error === 'invalid_client') {
        return 'Amadeus credentials do not match the selected environment. Use test credentials with AMADEUS_ENV=test, or production credentials with AMADEUS_ENV=production.';
    }

    if (firstError?.code === 38192 || firstError?.title?.toLowerCase().includes('quota')) {
        return 'The Amadeus API quota has been exhausted for this environment. Reset the quota or move the app to production credentials.';
    }

    return firstError?.detail
        ?? response?.error_description
        ?? fallbackMessage;
}

// ── Airport search ──────────────────────────────
export async function searchAirports(
    keyword: string
) {
    const amadeus = getAmadeusClient();

    try {
        const response = await amadeus
            .referenceData.locations.get({
                keyword,
                subType: 'AIRPORT,CITY',
                page: { limit: 8 },
            });

        return (response.data ?? []).map(
            (loc: Record<string, unknown>) => {
                const addr = loc.address as
                    Record<string, string> ?? {};
                const iata = loc.iataCode as string ?? '';
                const name = loc.name as string ?? '';
                const city = addr.cityName ?? name;
                const country = addr.countryName ?? '';

                return { code: iata, name, city, country };
            }
        );
    } catch (error) {
        console.error('Airport search error:', error);
        throw new AmadeusRequestError(
            describeAmadeusError(
                error,
                'Airport search is temporarily unavailable.'
            )
        );
    }
}

// ── Flight search ───────────────────────────────
export async function searchFlights({
    originCode,
    destinationCode,
    departureDate,
    returnDate,
    adults,
    travelClass,
    nonStop,
}: {
    originCode: string;
    destinationCode: string;
    departureDate: string; // YYYY-MM-DD
    returnDate?: string;
    adults: number;
    travelClass: string;
    nonStop?: boolean;
}) {
    const amadeus = getAmadeusClient();

    try {
        const params: Record<string, unknown> = {
            originLocationCode: originCode,
            destinationLocationCode: destinationCode,
            departureDate,
            adults,
            travelClass: travelClass.toUpperCase()
                .replace(' ', '_'),
            max: 10,
            currencyCode: 'INR',
        };

        if (returnDate) params.returnDate = returnDate;
        if (nonStop) params.nonStop = true;

        const response = await amadeus
            .shopping.flightOffersSearch.get(params);

        return response.data ?? [];
    } catch (error) {
        console.error('Flight search error:', error);
        throw new AmadeusRequestError(
            describeAmadeusError(
                error,
                'Flight search is temporarily unavailable.'
            )
        );
    }
}

type FlightOffersPricingClient = {
    flightOffers: {
        pricing: {
            post: (
                payload: Record<string, unknown>,
                params?: Record<string, string>
            ) => Promise<{ data?: Record<string, unknown> }>;
        };
    };
};

type FlightOrdersClient = {
    flightOrders: {
        post: (payload: Record<string, unknown>) => Promise<{ data?: Record<string, unknown> }>;
    };
};

function normalizeUppercase(value: string) {
    return value.trim().toUpperCase();
}

function normalizeDigits(value: string) {
    return value.replace(/\D/g, '');
}

export async function priceFlightOffer(
    offer: AmadeusFlightOffer
) {
    const amadeus = getAmadeusClient();

    try {
        const shopping = amadeus.shopping as unknown as FlightOffersPricingClient;
        const response = await shopping.flightOffers.pricing.post(
            {
                data: {
                    type: 'flight-offers-pricing',
                    flightOffers: [offer],
                },
            },
            { include: 'credit-card-fees,detailed-fare-rules' }
        );

        return response.data ?? {};
    } catch (error) {
        console.error('Flight pricing error:', error);
        throw new AmadeusRequestError(
            describeAmadeusError(
                error,
                'Flight pricing is temporarily unavailable.'
            )
        );
    }
}

export async function createFlightOrder({
    pricedOffer,
    travelers,
    contact,
}: {
    pricedOffer: AmadeusFlightOffer;
    travelers: FlightTravelerInput[];
    contact: FlightContactInput;
}) {
    const amadeus = getAmadeusClient();

    try {
        const booking = (
            amadeus as unknown as { booking: FlightOrdersClient }
        ).booking;
        const response = await booking.flightOrders.post({
            data: {
                type: 'flight-order',
                flightOffers: [pricedOffer],
                travelers: travelers.map((traveler, index) => ({
                    id: String(index + 1),
                    dateOfBirth: traveler.dateOfBirth,
                    name: {
                        firstName: normalizeUppercase(traveler.firstName),
                        lastName: normalizeUppercase(traveler.lastName),
                    },
                    gender: normalizeUppercase(traveler.gender),
                    ...(index === 0 ? {
                        contact: {
                            emailAddress: contact.email.trim(),
                            phones: [
                                {
                                    deviceType: 'MOBILE',
                                    countryCallingCode: normalizeDigits(contact.countryCallingCode),
                                    number: normalizeDigits(contact.phoneNumber),
                                },
                            ],
                        },
                    } : {}),
                    documents: [
                        {
                            documentType: normalizeUppercase(traveler.documentType),
                            birthPlace: traveler.birthPlace.trim(),
                            issuanceLocation: traveler.issuanceLocation.trim(),
                            issuanceDate: traveler.issuanceDate,
                            number: traveler.documentNumber.trim(),
                            expiryDate: traveler.expiryDate,
                            issuanceCountry: normalizeUppercase(traveler.issuanceCountry),
                            validityCountry: normalizeUppercase(traveler.validityCountry),
                            nationality: normalizeUppercase(traveler.nationality),
                            holder: true,
                        },
                    ],
                })),
            },
        });

        return response.data ?? {};
    } catch (error) {
        console.error('Flight booking error:', error);
        throw new AmadeusRequestError(
            describeAmadeusError(
                error,
                'Flight booking is temporarily unavailable.'
            )
        );
    }
}

// ── Format duration ─────────────────────────────
// Converts PT8H30M → "8h 30m"
export function formatDuration(iso: string): string {
    if (!iso) return '—';
    const h = iso.match(/(\d+)H/)?.[1] ?? '0';
    const m = iso.match(/(\d+)M/)?.[1] ?? '0';
    return m === '0' ? `${h}h` : `${h}h ${m}m`;
}

// ── Format price ────────────────────────────────
export function formatPrice(
    amount: string,
    currency: string
): string {
    const num = parseFloat(amount);
    if (currency === 'INR') {
        return `₹${num.toLocaleString('en-IN')}`;
    }
    return `${currency} ${num.toLocaleString()}`;
}

// ── Get airline name ────────────────────────────
const AIRLINES: Record<string, string> = {
    AI: 'Air India',
    UK: 'Vistara',
    '6E': 'IndiGo',
    SG: 'SpiceJet',
    IX: 'Air Asia India',
    NH: 'All Nippon Airways',
    JL: 'Japan Airlines',
    SQ: 'Singapore Airlines',
    EK: 'Emirates',
    QR: 'Qatar Airways',
    EY: 'Etihad Airways',
    BA: 'British Airways',
    LH: 'Lufthansa',
    AF: 'Air France',
    KL: 'KLM',
    TG: 'Thai Airways',
    MH: 'Malaysia Airlines',
    CX: 'Cathay Pacific',
    OZ: 'Asiana Airlines',
    KE: 'Korean Air',
    TK: 'Turkish Airlines',
    QF: 'Qantas',
    UA: 'United Airlines',
    AA: 'American Airlines',
    DL: 'Delta Air Lines',
};

export function getAirlineName(code: string): string {
    return AIRLINES[code] ?? code;
}

// ── Hotel search by city ────────────────────────
export async function searchHotelsByCity(
    cityCode: string
) {
    const amadeus = getAmadeusClient();

    try {
        const response = await amadeus
            .referenceData.locations.hotels.byCity
            .get({ cityCode });
        return response.data ?? [];
    } catch (error) {
        console.error('Hotel city search error:', error);
        throw new AmadeusRequestError(
            describeAmadeusError(
                error,
                'Hotel search is temporarily unavailable.'
            )
        );
    }
}

// ── Hotel search by geocode ─────────────────────
export async function searchHotelsByGeocode(
    latitude: number,
    longitude: number,
    radius: number = 20
) {
    const amadeus = getAmadeusClient();

    try {
        const hotels = amadeus.referenceData.locations.hotels;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (hotels as any).byGeocode.get({
            latitude,
            longitude,
            radius,
            radiusUnit: 'KM'
        });
        return response.data ?? [];
    } catch (error) {
        console.error('Hotel geocode search error:', error);
        throw new AmadeusRequestError(
            describeAmadeusError(
                error,
                'Hotel geocode search is temporarily unavailable.'
            )
        );
    }
}

// ── Hotel offers/pricing ────────────────────────
export async function searchHotelOffers({
    hotelIds,
    checkInDate,
    checkOutDate,
    adults,
}: {
    hotelIds: string[];
    checkInDate: string;
    checkOutDate: string;
    adults: number;
}) {
    const amadeus = getAmadeusClient();

    try {
        const response = await amadeus
            .shopping.hotelOffersSearch.get({
                hotelIds: hotelIds.slice(0, 10).join(','),
                checkInDate,
                checkOutDate,
                adults,
                currency: 'INR',
                bestRateOnly: true,
        });
        return response.data ?? [];
    } catch (error) {
        console.error('Hotel offers error:', error);
        throw new AmadeusRequestError(
            describeAmadeusError(
                error,
                'Hotel offers are temporarily unavailable.'
            )
        );
    }
}

// ── City name → IATA code ───────────────────────
const CITY_CODES: Record<string, string> = {
    tokyo: 'TYO', delhi: 'DEL', mumbai: 'BOM',
    bangalore: 'BLR', bengaluru: 'BLR',
    chennai: 'MAA', kolkata: 'CCU',
    hyderabad: 'HYD', paris: 'PAR', london: 'LON',
    dubai: 'DXB', singapore: 'SIN', bangkok: 'BKK',
    newyork: 'NYC', 'new york': 'NYC', sydney: 'SYD',
    rome: 'ROM', barcelona: 'BCN', amsterdam: 'AMS',
    istanbul: 'IST', kualalumpur: 'KUL',
    'kuala lumpur': 'KUL', bali: 'DPS',
    hongkong: 'HKG', 'hong kong': 'HKG',
    seoul: 'SEL', osaka: 'OSA', milan: 'MIL',
    zurich: 'ZRH', vienna: 'VIE', prague: 'PRG',
};

export function getCityCode(destination: string): string | null {
    const key = destination.toLowerCase().trim();
    if (CITY_CODES[key]) return CITY_CODES[key];
    for (const [city, code] of Object.entries(CITY_CODES)) {
        if (key.includes(city) || city.includes(key)) return code;
    }
    return null;
}

// ── Format hotel price ──────────────────────────
export function formatHotelPrice(
    amount: string | number,
    currency: string = 'INR'
): string {
    const num = typeof amount === 'string'
        ? parseFloat(amount) : amount;
    if (currency === 'INR') {
        return `₹${Math.round(num).toLocaleString('en-IN')}`;
    }
    return `${currency} ${Math.round(num).toLocaleString()}`;
}
