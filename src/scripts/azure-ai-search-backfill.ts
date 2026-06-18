#!/usr/bin/env -S npx tsx
// Backfill synthetic tenant context chunks from Azure Postgres into
// Azure AI Search `tenant-context-v1`.

import { DefaultAzureCredential } from '@azure/identity';
import { Pool } from 'pg';
import {
  canonicalTenantKey,
  tenantKeyAliasesFor,
  toTenantContextDeleteDocument,
  toTenantContextSearchDocument,
  type EnterpriseContextChunkRow,
} from '@/lib/azure-search/tenant-context-backfill';
import type { SearchDocument } from '@/lib/azure-search/types';

type Mode = 'plan' | 'apply' | 'verify';

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid integer env var ${name}: ${raw}`);
  }
  return parsed;
}

function mode(): Mode {
  const value = readEnv('AZURE_SEARCH_BACKFILL_MODE', process.argv[2] ?? 'plan') as Mode;
  if (value === 'plan' || value === 'apply' || value === 'verify') return value;
  throw new Error(`Unsupported AZURE_SEARCH_BACKFILL_MODE: ${value}`);
}

function argValue(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return null;
  return process.argv[idx + 1]?.trim() || null;
}

function tenantFilter(): string[] | null {
  const raw =
    argValue('--tenant') ??
    argValue('--tenants') ??
    process.env.AZURE_SEARCH_BACKFILL_TENANTS?.trim() ??
    null;
  if (!raw) return null;
  const tenants = raw
    .split(',')
    .map((value) => canonicalTenantKey(value))
    .filter(Boolean);
  return Array.from(new Set(tenants)).sort();
}

function requireScopedMutation(runMode: Mode, tenants: string[] | null): void {
  if (runMode === 'plan') return;
  if (tenants && tenants.length > 0) return;
  if (process.env.AZURE_SEARCH_BACKFILL_ALL_TENANTS === 'true') return;
  throw new Error(
    'tenant_scope_required: pass --tenant <tenant-key> or set AZURE_SEARCH_BACKFILL_ALL_TENANTS=true',
  );
}

function endpoint(): string {
  const explicit = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const serviceName = readEnv('AZURE_SEARCH_SERVICE_NAME', 'srch-abarva-context-lab-eastus');
  return `https://${serviceName}.search.windows.net`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (apiKey) return { 'api-key': apiKey };

  const credential = new DefaultAzureCredential(
    process.env.AZURE_CLIENT_ID?.trim()
      ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID.trim() }
      : undefined,
  );
  const token = await credential.getToken('https://search.azure.com/.default');
  if (!token?.token) throw new Error('azure_search_aad_token_unavailable');
  return { Authorization: `Bearer ${token.token}` };
}

async function searchRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const apiVersion = readEnv('AZURE_SEARCH_API_VERSION', '2024-07-01');
  const sep = path.includes('?') ? '&' : '?';
  return fetch(`${endpoint()}${path}${sep}api-version=${apiVersion}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(await authHeaders()),
      ...(init.headers ?? {}),
    },
  });
}

function tenantSqlScope(tenants: string[] | null): { where: string; params: string[][] } {
  if (!tenants || tenants.length === 0) return { where: '', params: [] };
  const aliases = Array.from(new Set(tenants.flatMap((tenant) => tenantKeyAliasesFor(tenant))));
  return {
    where: 'where tenant_key = any($1::text[])',
    params: [aliases],
  };
}

function dbPool(): Pool {
  return new Pool({
    connectionString: readEnv('DATABASE_URL'),
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
}

async function sourceCounts(db: Pool, tenants: string[] | null): Promise<Record<string, number>> {
  const scope = tenantSqlScope(tenants);
  const result = await db.query<{ tenant_key: string; count: string }>(`
    select tenant_key, count(*)::text as count
    from enterprise_context_chunks
    ${scope.where}
    group by tenant_key
    order by tenant_key
  `, scope.params);
  const counts: Record<string, number> = {};
  for (const row of result.rows) {
    const tenantKey = canonicalTenantKey(row.tenant_key);
    counts[tenantKey] = (counts[tenantKey] ?? 0) + Number.parseInt(row.count, 10);
  }
  return counts;
}

async function* readChunks(
  db: Pool,
  batchSize: number,
  tenants: string[] | null,
): AsyncGenerator<EnterpriseContextChunkRow[]> {
  const scope = tenantSqlScope(tenants);
  let offset = 0;
  for (;;) {
    const result = await db.query<EnterpriseContextChunkRow>(`
      select
        tenant_key,
        chunk_id,
        source_segment_id,
        source_record_id,
        source_doc,
        source_path,
        chunk_index,
        chunk_text,
        embedded_at,
        provenance,
        chunk_metadata
      from enterprise_context_chunks
      ${scope.where}
      order by tenant_key, chunk_id
      limit $${scope.params.length + 1} offset $${scope.params.length + 2}
    `, [...scope.params, batchSize, offset]);
    if (result.rows.length === 0) return;
    yield result.rows;
    offset += result.rows.length;
  }
}

async function uploadBatch(docs: SearchDocument[]): Promise<void> {
  if (docs.length === 0) return;
  const res = await searchRequest('/indexes/tenant-context-v1/docs/index', {
    method: 'POST',
    body: JSON.stringify({ value: docs }),
  });
  if (!res.ok) {
    throw new Error(`azure_search_upload_failed:${res.status}:${await res.text()}`);
  }
  const body = await res.json() as {
    value?: Array<{
      key?: string;
      status?: boolean;
      succeeded?: boolean;
      statusCode?: number;
      errorMessage?: string;
    }>;
  };
  const failures = (body.value ?? []).filter((item) => item.succeeded === false || item.status === false);
  if (failures.length > 0) {
    throw new Error(`azure_search_upload_item_failed:${failures
      .slice(0, 5)
      .map((item) => `${item.key ?? 'unknown'}:${item.statusCode ?? 'unknown'}:${item.errorMessage ?? 'no message'}`)
      .join('; ')}`);
  }
}

function staleAliasDeleteDocs(rows: EnterpriseContextChunkRow[]): SearchDocument[] {
  return rows
    .filter((row) => canonicalTenantKey(row.tenant_key) !== row.tenant_key)
    .map((row) => toTenantContextDeleteDocument(row.tenant_key, row.chunk_id));
}

async function searchCount(filter?: string): Promise<number> {
  const body: Record<string, unknown> = {
    search: '*',
    count: true,
    top: 0,
  };
  if (filter) body.filter = filter;
  const res = await searchRequest('/indexes/tenant-context-v1/docs/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`azure_search_count_failed:${res.status}:${await res.text()}`);
  }
  const json = await res.json() as { '@odata.count'?: number };
  return json['@odata.count'] ?? 0;
}

async function searchDocumentIds(filter: string): Promise<string[]> {
  const ids: string[] = [];
  const top = 1000;
  for (let skip = 0; ; skip += top) {
    const res = await searchRequest('/indexes/tenant-context-v1/docs/search', {
      method: 'POST',
      body: JSON.stringify({
        search: '*',
        filter,
        select: 'id',
        top,
        skip,
      }),
    });
    if (!res.ok) {
      throw new Error(`azure_search_id_scan_failed:${res.status}:${await res.text()}`);
    }
    const json = await res.json() as { value?: Array<{ id?: string }> };
    const batch = (json.value ?? []).map((item) => item.id).filter((id): id is string => Boolean(id));
    ids.push(...batch);
    if (batch.length < top) return ids;
  }
}

async function purgeTenantDocs(tenants: string[]): Promise<void> {
  for (const tenant of tenants) {
    const escapedTenant = tenant.replace(/'/g, "''");
    const ids = await searchDocumentIds(`tenant_key eq '${escapedTenant}'`);
    for (let i = 0; i < ids.length; i += 1000) {
    const batch = ids.slice(i, i + 1000).map((id) => ({
        '@search.action': 'delete' as const,
        id,
      }));
      await uploadBatch(batch);
    }
    console.log(JSON.stringify({
      event: 'azure_search_backfill_tenant_purged',
      tenant,
      deleted: ids.length,
    }));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verify(expected: Record<string, number>, attempts = 1): Promise<void> {
  const observed: Record<string, number> = {};
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    for (const tenant of Object.keys(expected).sort()) {
      observed[tenant] = await searchCount(`tenant_key eq '${tenant.replace(/'/g, "''")}'`);
    }
    const mismatches = Object.entries(expected)
      .filter(([tenant, count]) => observed[tenant] !== count)
      .map(([tenant, count]) => `${tenant}: expected ${count}, got ${observed[tenant] ?? 0}`);
    if (mismatches.length === 0) break;
    if (attempt === attempts) {
      throw new Error(`azure_search_backfill_count_mismatch:${mismatches.join('; ')}`);
    }
    console.log(JSON.stringify({
      event: 'azure_search_backfill_verify_retry',
      attempt,
      observed,
      mismatches,
    }));
    await sleep(5000);
  }
  console.log(JSON.stringify({
    event: 'azure_search_backfill_verified',
    observed,
  }));
}

async function main(): Promise<void> {
  const runMode = mode();
  const tenants = tenantFilter();
  requireScopedMutation(runMode, tenants);
  const db = dbPool();
  try {
    const counts = await sourceCounts(db, tenants);
    if (runMode === 'plan') {
      console.log(JSON.stringify({
        event: 'azure_search_backfill_plan',
        endpoint: endpoint(),
        index: 'tenant-context-v1',
        tenantFilter: tenants ?? 'all',
        sourceCounts: counts,
      }, null, 2));
      return;
    }

    if (runMode === 'apply') {
      const batchSize = readIntEnv('AZURE_SEARCH_BACKFILL_BATCH_SIZE', 500);
      await purgeTenantDocs(Object.keys(counts).sort());
      let uploaded = 0;
      for await (const rows of readChunks(db, batchSize, tenants)) {
        const now = new Date();
        const deletes = staleAliasDeleteDocs(rows);
        if (deletes.length > 0) {
          await uploadBatch(deletes);
        }
        await uploadBatch(rows.map((row) => toTenantContextSearchDocument(row, now)));
        uploaded += rows.length;
        console.log(JSON.stringify({ event: 'azure_search_backfill_batch_uploaded', uploaded }));
      }
    }

    await verify(counts, runMode === 'apply' ? 6 : 1);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: 'azure_search_backfill_failed',
    error: err instanceof Error ? err.message : String(err),
  }));
  process.exit(1);
});
