// Azure Postgres-backed parallel-run read adapter.
//
// Targets the Azure lab Postgres directly over `pg`. It mirrors the
// Supabase adapter's query semantics row-for-row so the route response
// shape is identical regardless of which data plane is selected.
//
// Connection string resolution goes through the tenant connection resolver. If
// an active client scope is present, only that client's projected database URL
// secret may be used. Unscoped preview/runtime paths keep the legacy
// ABARVA_AZURE_DATABASE_URL -> DATABASE_URL fallback order.
//
// All queries are read-only. A missing optional table returns 0 / [] —
// the adapter never throws for absent data.

import { Client, type ClientConfig } from 'pg';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import { resolveDatabaseUrlCandidatesForScope } from '../tenantConnectionResolver';
import {
  TENANT_COUNT_TABLES,
  emptyTenantInvariants,
  type ParallelRunReadAdapter,
  type TenantCountKey,
  type TenantInvariants,
} from './types';

/** A parameterized query runner bound to a live connection. */
export type SqlRunner = <R = Record<string, unknown>>(
  sql: string,
  params: unknown[],
) => Promise<R[]>;

/** Runs `fn` with a connected SQL runner, guaranteeing teardown. */
export type SessionRunner = <T>(fn: (run: SqlRunner) => Promise<T>) => Promise<T>;

/** Allowlist of tables this adapter is permitted to read from. */
const ALLOWED_TABLES: ReadonlySet<string> = new Set<string>([
  ...Object.values(TENANT_COUNT_TABLES),
  'clients',
  'engagements',
  'kpis',
  'pattern_packs',
]);

function assertAllowedTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    // Defense in depth: table names are interpolated (not parameterizable
    // in SQL), so they must only ever come from the allowlist above.
    throw new Error(`azure_read_adapter_table_not_allowed: ${table}`);
  }
}

function disableSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function resolveAzureUrl(): string | null {
  return resolveDatabaseUrlCandidatesForScope()[0] ?? null;
}

/** Default session runner — opens one `pg` connection for the whole call. */
const defaultSession: SessionRunner = async (fn) => {
  const url = resolveAzureUrl();
  if (!url) {
    throw new Error(
      'azure_read_adapter_no_connection: set ABARVA_AZURE_DATABASE_URL or DATABASE_URL',
    );
  }
  const config: ClientConfig = {
    connectionString: url,
    application_name: 'abarva-data-plane-read',
    ssl: disableSsl(url) ? false : { rejectUnauthorized: false },
  };
  const client = new Client(config);
  await client.connect();
  try {
    const run: SqlRunner = async <R>(sql: string, params: unknown[]) =>
      (await client.query(sql, params)).rows as R[];
    return await fn(run);
  } finally {
    await client.end();
  }
};

async function countWhereTenant(
  run: SqlRunner,
  table: string,
  tenantKey: string,
): Promise<number> {
  assertAllowedTable(table);
  try {
    const rows = await run<{ n: number }>(
      `SELECT count(*)::int AS n FROM ${table} WHERE tenant_key = $1`,
      [tenantKey],
    );
    const n = rows[0]?.n;
    return typeof n === 'number' ? n : 0;
  } catch {
    return 0;
  }
}

async function countEngagementsForClient(
  run: SqlRunner,
  clientId: string,
): Promise<number> {
  try {
    const rows = await run<{ n: number }>(
      `SELECT count(*)::int AS n FROM engagements
        WHERE client_id = $1 AND archived_at IS NULL AND deleted_at IS NULL`,
      [clientId],
    );
    const n = rows[0]?.n;
    return typeof n === 'number' ? n : 0;
  } catch {
    return 0;
  }
}

async function topColumn(
  run: SqlRunner,
  table: string,
  clientId: string,
  column: string,
  limit = 3,
): Promise<string[]> {
  assertAllowedTable(table);
  // `column` is a fixed literal supplied by this module ('name' / 'id'),
  // never user input — but keep it constrained for defense in depth.
  if (!/^[a-z_]+$/.test(column)) return [];
  try {
    const rows = await run<Record<string, unknown>>(
      `SELECT ${column} FROM ${table} WHERE client_id = $1 ORDER BY id ASC LIMIT ${limit}`,
      [clientId],
    );
    return rows
      .map((r) => (typeof r[column] === 'string' ? (r[column] as string) : ''))
      .filter((v) => v.length > 0);
  } catch {
    return [];
  }
}

async function clientLookup(
  run: SqlRunner,
  tenantKey: string,
): Promise<{ id: string; name: string } | null> {
  try {
    const rows = await run<{ id: string; name: string | null }>(
      `SELECT id, name FROM clients WHERE tenant_key = $1 LIMIT 1`,
      [tenantKey],
    );
    const row = rows[0];
    if (!row) return null;
    return { id: row.id, name: row.name ?? tenantKey };
  } catch {
    return null;
  }
}

async function gatherTenant(
  run: SqlRunner,
  rawKey: string,
): Promise<TenantInvariants> {
  const tenantKey = canonicalTenantKey(rawKey) ?? rawKey;
  const base = emptyTenantInvariants(tenantKey);
  const client = await clientLookup(run, tenantKey);

  const countKeys = Object.keys(TENANT_COUNT_TABLES) as TenantCountKey[];
  const countByKey = {} as Record<TenantCountKey, number>;
  for (const k of countKeys) {
    countByKey[k] = await countWhereTenant(run, TENANT_COUNT_TABLES[k], tenantKey);
  }

  const programs = client
    ? await countEngagementsForClient(run, client.id)
    : 0;
  const topKpiNames = client ? await topColumn(run, 'kpis', client.id, 'name') : [];
  const topPatternIds = client
    ? await topColumn(run, 'pattern_packs', client.id, 'id')
    : [];

  return {
    ...base,
    clientId: client?.id ?? null,
    clientName: client?.name ?? null,
    nodes: countByKey.nodes,
    edges: countByKey.edges,
    contextChunks: countByKey.contextChunks,
    segments: countByKey.segments,
    sourceEvents: countByKey.sourceEvents,
    programs,
    topKpiNames,
    topPatternIds,
  };
}

/**
 * Build an Azure Postgres read adapter. The session runner is injectable
 * so tests can drive the adapter with an in-memory fake instead of a live
 * Postgres connection.
 */
export function createAzurePostgresReadAdapter(
  session: SessionRunner = defaultSession,
): ParallelRunReadAdapter {
  return {
    name: 'azure-postgres',
    async getTenantInvariants(tenantKeys) {
      return session(async (run) => {
        const out: TenantInvariants[] = [];
        for (const key of tenantKeys) {
          out.push(await gatherTenant(run, key));
        }
        return out;
      });
    },
  };
}

/** Default singleton — connects via `pg` to the resolved Azure Postgres URL. */
export const azurePostgresReadAdapter: ParallelRunReadAdapter =
  createAzurePostgresReadAdapter();
