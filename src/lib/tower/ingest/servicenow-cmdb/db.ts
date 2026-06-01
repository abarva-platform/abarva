import { Pool } from 'pg';
import { runtimePostgresPoolConfig } from '@/lib/data-plane/postgresCompat';

let pool: Pool | null = null;

/**
 * Lazy-initialised pg.Pool for the CMDB ingest CLI. The CLI is the only
 * caller; the API path uses the platform-wide write fluent client.
 */
export function getCmdbIngestPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for the ServiceNow CMDB ingest CLI.');
  }
  pool = new Pool(runtimePostgresPoolConfig(connectionString, 'nexus-tower-cmdb-ingest'));
  return pool;
}

export async function closeCmdbIngestPool(): Promise<void> {
  if (!pool) return;
  const p = pool;
  pool = null;
  await p.end().catch(() => undefined);
}
