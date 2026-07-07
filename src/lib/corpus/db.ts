import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { resolvePostgresPoolMax } from '@/lib/data-plane/postgresCompat';

let pool: Pool | null = null;

export function isLegacySupabaseCorpusUrl(connectionString: string): boolean {
  try {
    const hostname = new URL(connectionString).hostname.toLowerCase();
    return hostname.includes('supabase.co') || hostname.includes('supabase.com');
  } catch {
    return false;
  }
}

export function resolveCorpusConnectionString(env: NodeJS.ProcessEnv = process.env): string {
  const azureUrl = env.ABARVA_AZURE_DATABASE_URL?.trim();
  if (azureUrl) return azureUrl;

  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('ABARVA_AZURE_DATABASE_URL is required for corpus data-layer access.');
  }

  if (
    isLegacySupabaseCorpusUrl(databaseUrl) &&
    env.ALLOW_LEGACY_SUPABASE_CORPUS !== '1'
  ) {
    throw new Error(
      'Refusing to use Supabase DATABASE_URL for corpus data-layer access. Set ABARVA_AZURE_DATABASE_URL, or set ALLOW_LEGACY_SUPABASE_CORPUS=1 for an explicit legacy read/write window.',
    );
  }

  return databaseUrl;
}

function shouldDisableSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getCorpusPool(): Pool {
  if (pool) return pool;
  const connectionString = resolveCorpusConnectionString();
  pool = new Pool({
    connectionString,
    application_name: 'nexus-corpus-data-layer',
    max: resolvePostgresPoolMax(),
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    ssl: shouldDisableSsl(connectionString) ? false : { rejectUnauthorized: false },
  });
  return pool;
}

export async function withCorpusClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getCorpusPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withCorpusTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withCorpusClient(async (client) => {
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
