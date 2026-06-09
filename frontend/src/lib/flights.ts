export type AmadeusFlightOffer = Record<string, unknown>;

export interface Airport {
    code: string;
    name: string;
    city: string;
    country: string;
}

export interface FlightResult {
    id: string;
    airline: string;
    code: string;
    flightNo: string;
    departure: string;
    arrival: string;
    duration: string;
    stops: string;
    price: string;
    rawPrice: number;
    onTime: number | null;
    luggage: string;
    meal: boolean;
    confidence: number;
    recommended: boolean;
    reason?: string;
    warning?: string;
    amadeusOffer: AmadeusFlightOffer;
}

export interface FlightSearchContext {
    from: Airport;
    to: Airport;
    departureDate: string;
    returnDate: string | null;
    passengers: number;
    cabinClass: string;
    oneWay: boolean;
}

export interface FlightSelection {
    selectedAt: string;
    search: FlightSearchContext;
    flight: FlightResult;
}

export const FLIGHT_SELECTION_STORAGE_KEY = 'pragati-setu.flight-selection';

export interface FlightContactInput {
    email: string;
    countryCallingCode: string;
    phoneNumber: string;
}

export interface FlightTravelerInput {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    documentType: string;
    documentNumber: string;
    birthPlace: string;
    issuanceLocation: string;
    issuanceDate: string;
    expiryDate: string;
    issuanceCountry: string;
    validityCountry: string;
    nationality: string;
}
