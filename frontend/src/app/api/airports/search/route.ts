import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface AirportSearchRow {
    id: number;
    name: string;
    iata_code: string;
    city_id: number | null;
    city_name: string | null;
    country_name: string | null;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') ?? '8');

    if (!q || q.length < 2) {
        return NextResponse.json({ data: [] });
    }

    try {
        const queryTerm = `%${q}%`;
        const data = await query<AirportSearchRow>(
            `
            SELECT
                a.id,
                a.name,
                a.iata_code,
                a.city_id,
                c.name as city_name,
                NULL::text as country_name
            FROM airports a
            LEFT JOIN cities c ON a.city_id = c.id
            WHERE a.name ILIKE $1 OR a.iata_code ILIKE $1
            LIMIT $2
        `,
            [queryTerm, limit]
        );

        const formattedData = data.map((row) => ({
            id: row.id,
            name: row.name,
            iata_code: row.iata_code,
            city_id: row.city_id,
            cities: {
                name: row.city_name,
                countries: { name: row.country_name }
            }
        }));

        return NextResponse.json({ data: formattedData });
    } catch (error: unknown) {
        console.error('API: airports search error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
