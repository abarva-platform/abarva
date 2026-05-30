/**
 * Service-role Pool for the Azure cost CLI. Lazily constructed so the parser
 * and validator can be exercised in pure-functional contexts (tests, dry runs,
 * template regeneration) without DATABASE_URL.
 */

import { Pool, type PoolClient } from 'pg';

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

export function getAzureCostPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for tower_cloud_cost ingest.');
  }
  pool = new Pool({
    connectionString,
    application_name: 'nexus-tower-ingest-azure-cost',
    ssl: shouldDisableSsl(connectionString) ? false : { rejectUnauthorized: false },
  });
  return pool;
}

export async function withAzureCostClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getAzureCostPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
