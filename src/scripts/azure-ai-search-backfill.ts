#!/usr/bin/env -S npx tsx
// Backfill synthetic tenant context chunks from Azure Postgres into
// Azure AI Search `tenant-context-v1`.

import { DefaultAzureCredential } from '@azure/identity';
import { Pool } from 'pg';
import {
  canonicalTenantKey,
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

function dbPool(): Pool {
  return new Pool({
    connectionString: readEnv('DATABASE_URL'),
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
}

async function sourceCounts(db: Pool): Promise<Record<string, number>> {
  const result = await db.query<{ tenant_key: string; count: string }>(`
    select tenant_key, count(*)::text as count
    from enterprise_context_chunks
    group by tenant_key
    order by tenant_key
  `);
  const counts: Record<string, number> = {};
  for (const row of result.rows) {
    const tenantKey = canonicalTenantKey(row.tenant_key);
    counts[tenantKey] = (counts[tenantKey] ?? 0) + Number.parseInt(row.count, 10);
  }
  return counts;
}

async function* readChunks(db: Pool, batchSize: number): AsyncGenerator<EnterpriseContextChunkRow[]> {
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
      order by tenant_key, chunk_id
      limit $1 offset $2
    `, [batchSize, offset]);
    if (result.rows.length === 0) return;
    yield result.rows;
    offset += result.rows.length;
  }
}

async function uploadBatch(docs: SearchDocument[]): Promise<void> {
  const res = await searchRequest('/indexes/tenant-context-v1/docs/index', {
    method: 'POST',
    body: JSON.stringify({ value: docs }),
  });
  if (!res.ok) {
    throw new Error(`azure_search_upload_failed:${res.status}:${await res.text()}`);
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

async function verify(expected: Record<string, number>): Promise<void> {
  const observed: Record<string, number> = {};
  for (const tenant of Object.keys(expected).sort()) {
    observed[tenant] = await searchCount(`tenant_key eq '${tenant.replace(/'/g, "''")}'`);
  }
  const mismatches = Object.entries(expected)
    .filter(([tenant, count]) => observed[tenant] !== count)
    .map(([tenant, count]) => `${tenant}: expected ${count}, got ${observed[tenant] ?? 0}`);
  if (mismatches.length > 0) {
    throw new Error(`azure_search_backfill_count_mismatch:${mismatches.join('; ')}`);
  }
  console.log(JSON.stringify({
    event: 'azure_search_backfill_verified',
    observed,
  }));
}

async function main(): Promise<void> {
  const runMode = mode();
  const db = dbPool();
  try {
    const counts = await sourceCounts(db);
    if (runMode === 'plan') {
      console.log(JSON.stringify({
        event: 'azure_search_backfill_plan',
        endpoint: endpoint(),
        index: 'tenant-context-v1',
        sourceCounts: counts,
      }, null, 2));
      return;
    }

    if (runMode === 'apply') {
      const batchSize = readIntEnv('AZURE_SEARCH_BACKFILL_BATCH_SIZE', 500);
      let uploaded = 0;
      for await (const rows of readChunks(db, batchSize)) {
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

    await verify(counts);
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
