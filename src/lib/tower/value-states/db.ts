import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { runtimePostgresPoolConfig } from '@/lib/data-plane/postgresCompat';

let pool: Pool | null = null;

export function getValueStatePool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for Tower value-state access.');
  }
  pool = new Pool(runtimePostgresPoolConfig(connectionString, 'nexus-tower-value-states'));
  return pool;
}

export async function withValueStateClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getValueStatePool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withValueStateTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withValueStateClient(async (client) => {
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

export function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
