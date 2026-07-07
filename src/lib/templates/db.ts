import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { runtimePostgresPoolConfig } from '@/lib/data-plane/postgresCompat';

let pool: Pool | null = null;

export function getTemplatePool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for template data-layer access.');
  }
  pool = new Pool(runtimePostgresPoolConfig(connectionString, 'nexus-template-data-layer'));
  return pool;
}

export async function withTemplateClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getTemplatePool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withTemplateTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withTemplateClient(async (client) => {
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
