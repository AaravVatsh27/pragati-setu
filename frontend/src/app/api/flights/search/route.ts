import { NextRequest, NextResponse } from 'next/server';
import {
    AmadeusConfigError,
    AmadeusRequestError,
    getAmadeusMode,
    searchFlights,
    searchAirports,
    formatDuration,
    formatPrice,
    getAirlineName,
} from '@/lib/amadeus';
import type { FlightResult } from '@/lib/flights';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — flight search
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const origin = searchParams.get('origin');
        const destination = searchParams.get('destination');
        const departureDate = searchParams.get('departure');
        const returnDate = searchParams.get('return') ?? undefined;
        const adults = parseInt(searchParams.get('adults') ?? '1');
        const travelClass = searchParams.get('class') ?? 'ECONOMY';
        const nonStop = searchParams.get('nonStop') === 'true';

        if (!origin || !destination || !departureDate) {
            return NextResponse.json(
                { error: 'origin, destination, and departure are required' },
                { status: 400 }
            );
        }

        const raw = await searchFlights({
            originCode: origin,
            destinationCode: destination,
            departureDate,
            returnDate,
            adults,
            travelClass,
            nonStop,
        });

        if (!raw.length) {
            if (process.env.VERCEL_ENV === 'production' && getAmadeusMode() === 'test') {
                return NextResponse.json(
                    {
                        error: 'Flight search is still using Amadeus test mode on the deployed site. Add production Amadeus credentials and set AMADEUS_ENV=production in Vercel to get live offers.',
                    },
                    { status: 503 }
                );
            }

            return NextResponse.json({ data: [] });
        }

        // Transform Amadeus response to shape the flights page expects
        const flights: FlightResult[] = raw.map(
            (offer: Record<string, unknown>, index: number) => {
                const itineraries = offer.itineraries as Record<string, unknown>[];
                const outbound = itineraries?.[0];
                const segments = outbound?.segments as Record<string, unknown>[];
                const firstSeg = segments?.[0];
                const lastSeg = segments?.[segments.length - 1];

                const price = offer.price as Record<string, string>;
                const carrierCode = firstSeg?.carrierCode as string ?? '';
                const flightNumber = `${carrierCode} ${firstSeg?.number ?? ''}`;

                const dep = firstSeg?.departure as Record<string, string>;
                const arr = lastSeg?.arrival as Record<string, string>;

                const depTime = dep?.at
                    ? new Date(dep.at).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: false,
                    })
                    : '—';

                const arrTime = arr?.at
                    ? new Date(arr.at).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: false,
                    })
                    : '—';

                const stops = segments.length - 1;
                const stopsLabel = stops === 0
                    ? 'Direct'
                    : stops === 1 ? '1 Stop' : `${stops} Stops`;

                const duration = formatDuration(
                    String(outbound?.duration ?? '')
                );
                const formattedPrice = formatPrice(
                    price?.total ?? '0',
                    price?.currency ?? 'INR'
                );

                // Simple confidence score based on stops, duration, price rank
                const confidence = Math.max(60, 100 - (stops * 15) - (index * 3));

                return {
                    id: String(offer.id ?? index),
                    airline: getAirlineName(carrierCode),
                    code: carrierCode,
                    flightNo: flightNumber,
                    departure: depTime,
                    arrival: arrTime,
                    duration,
                    stops: stopsLabel,
                    price: formattedPrice,
                    rawPrice: parseFloat(price?.total ?? '0'),
                    onTime: null,
                    luggage: 'Check airline',
                    meal: false,
                    confidence,
                    recommended: index === 0,
                    reason: index === 0
                        ? `${getAirlineName(carrierCode)} — ${stopsLabel} · ${duration} · Best value for this route.`
                        : undefined,
                    amadeusOffer: offer,
                };
            }
        );

        // Sort by confidence descending
        flights.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence);

        // Mark top result as recommended
        if (flights.length > 0) {
            flights[0].recommended = true;
            flights.slice(1).forEach((f: { recommended: boolean }) => { f.recommended = false; });
        }

        return NextResponse.json({ data: flights });
    } catch (error) {
        if (error instanceof AmadeusConfigError || error instanceof AmadeusRequestError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error('Unhandled flight search route error:', error);
        return NextResponse.json(
            { error: 'Flight search failed unexpectedly.' },
            { status: 500 }
        );
    }
}

// POST — airport search (for live dropdown)
export async function POST(req: NextRequest) {
    try {
        const { keyword } = await req.json();
        if (!keyword || keyword.length < 2) {
            return NextResponse.json({ data: [] });
        }

        const airports = await searchAirports(keyword);
        return NextResponse.json({ data: airports });
    } catch (error) {
        if (error instanceof AmadeusConfigError || error instanceof AmadeusRequestError) {
            return NextResponse.json(
                { data: [], error: error.message },
                { status: error.status }
            );
        }

        console.error('Unhandled airport search route error:', error);
        return NextResponse.json(
            { data: [], error: 'Airport search failed unexpectedly.' },
            { status: 500 }
        );
    }
}
