import { Pool } from 'pg';

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
  pool = new Pool({
    connectionString,
    application_name: 'nexus-tower-cmdb-ingest',
    ssl: shouldDisableSsl(connectionString) ? false : { rejectUnauthorized: false },
    max: 2,
  });
  return pool;
}

export async function closeCmdbIngestPool(): Promise<void> {
  if (!pool) return;
  const p = pool;
  pool = null;
  await p.end().catch(() => undefined);
}
