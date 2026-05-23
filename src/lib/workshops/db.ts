import { Pool, type PoolClient, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

function shouldDisableSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getWorkshopsPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for workshop data-layer access.');
  }
  pool = new Pool({
    connectionString,
    application_name: 'nexus-workshop-data-layer',
    ssl: shouldDisableSsl(connectionString) ? false : { rejectUnauthorized: false },
  });
  return pool;
}

export async function withWorkshopClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getWorkshopsPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withWorkshopTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withWorkshopClient(async (client) => {
    await client.query('BEGIN');
    try {
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export function firstRow<T extends QueryResultRow>(rows: T[]): T | null {
  return rows.length > 0 ? rows[0] : null;
}

export function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function toJsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function toJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
