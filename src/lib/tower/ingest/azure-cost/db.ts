/**
 * Service-role Pool for the Azure cost CLI. Lazily constructed so the parser
 * and validator can be exercised in pure-functional contexts (tests, dry runs,
 * template regeneration) without DATABASE_URL.
 */

import { Pool, type PoolClient } from 'pg';
import { runtimePostgresPoolConfig } from '@/lib/data-plane/postgresCompat';

let pool: Pool | null = null;

export function getAzureCostPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for tower_cloud_cost ingest.');
  }
  pool = new Pool(runtimePostgresPoolConfig(connectionString, 'nexus-tower-ingest-azure-cost'));
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
