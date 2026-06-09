import { NextRequest, NextResponse } from 'next/server';
import {
    AmadeusConfigError,
    AmadeusRequestError,
    createFlightOrder,
} from '@/lib/amadeus';
import type {
    FlightContactInput,
    FlightTravelerInput,
} from '@/lib/flights';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function readString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

function parseContact(value: unknown): FlightContactInput | null {
    if (!isRecord(value)) return null;

    const email = readString(value.email);
    const countryCallingCode = readString(value.countryCallingCode);
    const phoneNumber = readString(value.phoneNumber);

    if (!email || !countryCallingCode || !phoneNumber) {
        return null;
    }

    return { email, countryCallingCode, phoneNumber };
}

function parseTraveler(value: unknown): FlightTravelerInput | null {
    if (!isRecord(value)) return null;

    const traveler: FlightTravelerInput = {
        firstName: readString(value.firstName),
        lastName: readString(value.lastName),
        dateOfBirth: readString(value.dateOfBirth),
        gender: readString(value.gender),
        documentType: readString(value.documentType),
        documentNumber: readString(value.documentNumber),
        birthPlace: readString(value.birthPlace),
        issuanceLocation: readString(value.issuanceLocation),
        issuanceDate: readString(value.issuanceDate),
        expiryDate: readString(value.expiryDate),
        issuanceCountry: readString(value.issuanceCountry),
        validityCountry: readString(value.validityCountry),
        nationality: readString(value.nationality),
    };

    const requiredFields = Object.values(traveler);
    if (requiredFields.some((field) => !field)) {
        return null;
    }

    return traveler;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const pricedOffer = isRecord(body?.pricedOffer) ? body.pricedOffer : null;
        const contact = parseContact(body?.contact);
        const travelers = Array.isArray(body?.travelers)
            ? body.travelers
                .map(parseTraveler)
                .filter(
                    (traveler: FlightTravelerInput | null): traveler is FlightTravelerInput =>
                        traveler !== null
                )
            : [];

        if (!pricedOffer) {
            return NextResponse.json(
                { error: 'A priced flight offer is required before booking.' },
                { status: 400 }
            );
        }

        if (!contact) {
            return NextResponse.json(
                { error: 'A valid contact email and phone number are required.' },
                { status: 400 }
            );
        }

        if (!travelers.length) {
            return NextResponse.json(
                { error: 'At least one complete traveler is required.' },
                { status: 400 }
            );
        }

        const order = await createFlightOrder({
            pricedOffer,
            travelers,
            contact,
        });

        const associatedRecords = Array.isArray(order.associatedRecords)
            ? order.associatedRecords
            : [];
        const firstRecord = isRecord(associatedRecords[0])
            ? associatedRecords[0]
            : null;

        return NextResponse.json({
            data: {
                id: typeof order.id === 'string' ? order.id : null,
                reference: firstRecord && typeof firstRecord.reference === 'string'
                    ? firstRecord.reference
                    : null,
                provider: 'Amadeus',
                status: typeof order.type === 'string' ? order.type : null,
                order,
            },
        });
    } catch (error) {
        if (error instanceof AmadeusConfigError || error instanceof AmadeusRequestError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error('Unhandled flight booking route error:', error);
        return NextResponse.json(
            { error: 'Flight booking failed unexpectedly.' },
            { status: 500 }
        );
    }
}
