import { NextRequest, NextResponse } from 'next/server';
import {
    AmadeusConfigError,
    AmadeusRequestError,
    formatPrice,
    priceFlightOffer,
} from '@/lib/amadeus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getFirstRecordArrayItem(
    parent: Record<string, unknown>,
    key: string
) {
    const value = parent[key];
    return Array.isArray(value) && isRecord(value[0]) ? value[0] : null;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const offer = isRecord(body?.offer) ? body.offer : null;

        if (!offer) {
            return NextResponse.json(
                { error: 'A valid flight offer is required.' },
                { status: 400 }
            );
        }

        const pricedData = await priceFlightOffer(offer);
        const pricedOffer = getFirstRecordArrayItem(pricedData, 'flightOffers');

        if (!pricedOffer) {
            return NextResponse.json(
                { error: 'Amadeus did not return a priced offer.' },
                { status: 502 }
            );
        }

        const price = isRecord(pricedOffer.price)
            ? pricedOffer.price
            : {};
        const validatingAirlineCodes = Array.isArray(pricedOffer.validatingAirlineCodes)
            ? pricedOffer.validatingAirlineCodes.filter(
                (code): code is string => typeof code === 'string'
            )
            : [];

        return NextResponse.json({
            data: {
                pricedOffer,
                summary: {
                    total: formatPrice(
                        String(price.total ?? '0'),
                        String(price.currency ?? 'INR')
                    ),
                    rawTotal: String(price.total ?? '0'),
                    currency: String(price.currency ?? 'INR'),
                    lastTicketingDate: typeof pricedOffer.lastTicketingDate === 'string'
                        ? pricedOffer.lastTicketingDate
                        : null,
                    numberOfBookableSeats: typeof pricedOffer.numberOfBookableSeats === 'number'
                        ? pricedOffer.numberOfBookableSeats
                        : null,
                    instantTicketingRequired: pricedOffer.instantTicketingRequired === true,
                    validatingAirlineCodes,
                },
            },
        });
    } catch (error) {
        if (error instanceof AmadeusConfigError || error instanceof AmadeusRequestError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error('Unhandled flight pricing route error:', error);
        return NextResponse.json(
            { error: 'Flight pricing failed unexpectedly.' },
            { status: 500 }
        );
    }
}
