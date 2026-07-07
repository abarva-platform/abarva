// Shared Azure Postgres session plumbing for data-plane read adapters.
//
// Slice 1's `azurePostgresReadAdapter` kept its `defaultSession` private.
// Slice 2 adds per-domain Azure adapters that all need the same connection
// behavior, so the connection-string resolution + `pg` session lifecycle is
// extracted here as the single source of truth.
//
// Connection string resolution (first non-empty wins):
//   1. ABARVA_AZURE_DATABASE_URL — explicit override (handy for a local dry
//      run while DATABASE_URL still points at production)
//   2. DATABASE_URL              — the deployed Azure container projects its
//      Azure Postgres connection string here
//
// All consumers run read-only queries. The session guarantees teardown.

import { Pool, type PoolClient, type PoolConfig } from 'pg';
import { resolveDatabaseUrlCandidatesForScope } from '../tenantConnectionResolver';

/** A parameterized query runner bound to a live connection. */
export type SqlRunner = <R = Record<string, unknown>>(
  sql: string,
  params: unknown[],
) => Promise<R[]>;

/** Runs `fn` with a connected SQL runner, guaranteeing teardown. */
export type SessionRunner = <T>(fn: (run: SqlRunner) => Promise<T>) => Promise<T>;

function disableSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

/** Resolve the Azure Postgres connection string, or null if unconfigured. */
export function resolveAzureUrl(): string | null {
  return (
    process.env.ABARVA_AZURE_DATABASE_URL?.trim()
    || process.env.DATABASE_URL?.trim()
    || null
  );
}

export function resolveAzureUrlCandidates(env: NodeJS.ProcessEnv = process.env): string[] {
  return resolveDatabaseUrlCandidatesForScope(env);
}

export function isAzureSessionFallbackError(error: unknown): boolean {
  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record?.code === 'string' ? record.code : '';
  const message = typeof record?.message === 'string' ? record.message : String(error ?? '');
  return (
    ['ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET'].includes(code) ||
    /getaddrinfo|connect\s+etimedout|connection\s+timeout|connection\s+terminated|econnrefused|enotfound/i.test(message)
  );
}

const pools = new Map<string, Pool>();

/**
 * Resolve the per-instance Postgres pool size.
 *
 * Default: 1 (single connection) — kept conservative for backwards
 * compatibility on bare/preview/CI environments where pool capacity
 * is unknown.
 *
 * Cap: 20 (raised from 5 on 2026-05-30). Azure Postgres Flexible
 * Server B-tier supports 100+ concurrent connections per instance;
 * the prior 5-cap was throttling production /admin renders that
 * fan out across ~12 distinct queries per request (broker throw
 * diagnosis · `docs/build/BROKER_THROW_DIAGNOSIS_2026-05-30.md`).
 *
 * Operators set `ABARVA_PG_POOL_MAX` (preferred) or `PGPOOL_MAX`
 * (legacy) at deploy time; any positive integer below the cap is
 * honored, values above the cap are clamped, garbage is treated
 * as "use the default".
 */
export function resolveAzurePoolMax(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.ABARVA_PG_POOL_MAX?.trim() || env.PGPOOL_MAX?.trim();
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 20);
}

function clientConfig(connectionString: string, applicationName: string): PoolConfig {
  return {
    connectionString,
    application_name: applicationName,
    max: resolveAzurePoolMax(),
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    ssl: disableSsl(connectionString) ? false : { rejectUnauthorized: false },
  };
}

function poolKey(connectionString: string): string {
  return connectionString;
}

function getPool(connectionString: string, applicationName: string): Pool {
  const key = poolKey(connectionString);
  const existing = pools.get(key);
  if (existing) return existing;
  const pool = new Pool(clientConfig(connectionString, applicationName));
  pools.set(key, pool);
  return pool;
}

async function retirePool(connectionString: string): Promise<void> {
  const key = poolKey(connectionString);
  const pool = pools.get(key);
  if (!pool) return;
  pools.delete(key);
  await pool.end().catch(() => undefined);
}

/**
 * Default session runner — opens one `pg` connection for the whole call and
 * tears it down afterward. `applicationName` tags the connection for easier
 * server-side attribution per adapter.
 */
export function createDefaultSession(applicationName: string): SessionRunner {
  return async (fn) => {
    const urls = resolveAzureUrlCandidates();
    if (urls.length === 0) {
      throw new Error(
        'azure_read_adapter_no_connection: set ABARVA_AZURE_DATABASE_URL or DATABASE_URL',
      );
    }

    let lastError: unknown = null;
    for (let index = 0; index < urls.length; index++) {
      const url = urls[index]!;
      const pool = getPool(url, applicationName);
      let client: PoolClient | null = null;
      let shouldRetirePool = false;
      try {
        client = await pool.connect();
        const run: SqlRunner = async <R>(sql: string, params: unknown[]) =>
          (await client!.query(sql, params)).rows as R[];
        return await fn(run);
      } catch (error) {
        lastError = error;
        const canFallback = index < urls.length - 1 && isAzureSessionFallbackError(error);
        if (!canFallback) throw error;
        shouldRetirePool = true;
        console.warn('[azure-session] primary database connection failed; trying fallback DATABASE_URL', {
          code: (error as { code?: unknown })?.code,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        client?.release();
        if (shouldRetirePool) await retirePool(url);
      }
    }

    throw lastError;
  };
}

/** Runs `fn` inside a real `BEGIN`/`COMMIT` transaction, rolling back on error. */
export type TxSessionRunner = <T>(fn: (run: SqlRunner) => Promise<T>) => Promise<T>;

/**
 * Transaction-capable session runner for the write seam. Opens one `pg`
 * connection, wraps `fn` in `BEGIN`/`COMMIT`, and `ROLLBACK`s if `fn` throws —
 * giving Azure the real client-side atomicity Supabase lacks (design doc §2).
 * The connection is always torn down.
 */
export function createTxSession(applicationName: string): TxSessionRunner {
  return async (fn) => {
    const urls = resolveAzureUrlCandidates();
    if (urls.length === 0) {
      throw new Error(
        'azure_write_adapter_no_connection: set ABARVA_AZURE_DATABASE_URL or DATABASE_URL',
      );
    }

    let lastError: unknown = null;
    for (let index = 0; index < urls.length; index++) {
      const url = urls[index]!;
      const pool = getPool(url, applicationName);
      let client: PoolClient | null = null;
      let shouldRetirePool = false;
      try {
        client = await pool.connect();
        const run: SqlRunner = async <R>(sql: string, params: unknown[]) =>
          (await client!.query(sql, params)).rows as R[];
        await client.query('BEGIN');
        const result = await fn(run);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        try {
          if (client) await client.query('ROLLBACK');
        } catch {
          // The connection is being torn down regardless; swallow rollback noise.
        }
        lastError = error;
        const canFallback = index < urls.length - 1 && isAzureSessionFallbackError(error);
        if (!canFallback) throw error;
        shouldRetirePool = true;
        console.warn('[azure-session] primary database connection failed; trying fallback DATABASE_URL', {
          code: (error as { code?: unknown })?.code,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        client?.release();
        if (shouldRetirePool) await retirePool(url);
      }
    }

    throw lastError;
  };
}
