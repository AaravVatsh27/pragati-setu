import { neon } from '@neondatabase/serverless';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sql: any = null;

function getDb() {
    if (!_sql) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not set');
        }
        _sql = neon(process.env.DATABASE_URL);
    }
    return _sql;
}

// Tagged-template proxy so callers can still write  sql`SELECT ...`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql: any = new Proxy((() => {}) as any, {
    apply(_target, _thisArg, args) {
        return getDb()(...args);
    },
    get(_target, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (getDb() as any)[prop];
    },
});

// Type-safe query helper — returns rows array
export async function query<T>(
    queryText: string,
    params?: unknown[]
): Promise<T[]> {
    try {
        const db = getDb();
        const result = await db.query(queryText, params ?? []);
        if (Array.isArray(result)) {
            return result as T[];
        }
        return (result.rows ?? result) as T[];
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Single row helper
export async function queryOne<T>(
    queryText: string,
    params?: unknown[]
): Promise<T | null> {
    const rows = await query<T>(queryText, params);
    return rows[0] ?? null;
}
