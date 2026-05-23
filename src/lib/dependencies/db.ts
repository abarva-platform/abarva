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

export function getDependenciesPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for dependency DAG access.');
  }
  pool = new Pool({
    connectionString,
    application_name: 'nexus-dependency-dag',
    ssl: shouldDisableSsl(connectionString) ? false : { rejectUnauthorized: false },
  });
  return pool;
}

export async function withDependencyClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getDependenciesPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withDependencyTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withDependencyClient(async (client) => {
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
