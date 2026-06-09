import { neon } from '@neondatabase/serverless';

type NeonClient = ReturnType<typeof neon>;
type SqlRow = Record<string, unknown>;
type SqlResult = SqlRow[];

interface SqlClient {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<SqlResult>;
    query: NeonClient['query'];
}

let _sql: NeonClient | null = null;

function getDb(): NeonClient {
    if (!_sql) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not set');
        }
        _sql = neon(process.env.DATABASE_URL);
    }
    return _sql;
}

// Tagged-template proxy so callers can still write  sql`SELECT ...`
const sqlProxyTarget = ((
    strings: TemplateStringsArray,
    ...values: unknown[]
) => getDb()(strings, ...values) as Promise<SqlResult>) as SqlClient;

export const sql = new Proxy(sqlProxyTarget, {
    apply(_target, _thisArg, args: [TemplateStringsArray, ...unknown[]]) {
        const [strings, ...values] = args;
        return getDb()(strings, ...values) as Promise<SqlResult>;
    },
    get(_target, prop, receiver) {
        if (prop === 'query') {
            return getDb().query.bind(getDb());
        }

        return Reflect.get(sqlProxyTarget as object, prop, receiver);
    },
}) as SqlClient;

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
