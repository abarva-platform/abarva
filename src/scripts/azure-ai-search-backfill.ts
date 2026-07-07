#!/usr/bin/env -S npx tsx
// Backfill synthetic tenant context chunks from Azure Postgres into
// Azure AI Search `tenant-context-v1`.

import { DefaultAzureCredential } from "@azure/identity";
import { Pool } from "pg";
import {
  canonicalTenantKey,
  toTenantContextDeleteDocument,
  toTenantContextSearchDocument,
  type EnterpriseContextChunkRow,
} from "@/lib/azure-search/tenant-context-backfill";
import type { SearchDocument } from "@/lib/azure-search/types";
import {
  collectFailedIndexResults,
  countMismatches,
} from "@/lib/azure-search/index-results";

type Mode = "plan" | "apply" | "verify";

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

function scopedTenantKeys(): string[] {
  const raw = process.env.TENANT_KEY?.trim();
  if (!raw) return [];
  return [...new Set([raw, canonicalTenantKey(raw)])];
}

function canonicalScopeTenants(scope: string[]): string[] {
  return [...new Set(scope.map((tenant) => canonicalTenantKey(tenant)))];
}

function mode(): Mode {
  const value = readEnv(
    "AZURE_SEARCH_BACKFILL_MODE",
    process.argv[2] ?? "plan",
  ) as Mode;
  if (value === "plan" || value === "apply" || value === "verify") return value;
  throw new Error(`Unsupported AZURE_SEARCH_BACKFILL_MODE: ${value}`);
}

function endpoint(): string {
  const explicit = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const serviceName = readEnv(
    "AZURE_SEARCH_SERVICE_NAME",
    "srch-abarva-context-lab-eastus",
  );
  return `https://${serviceName}.search.windows.net`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (apiKey) return { "api-key": apiKey };

  const credential = new DefaultAzureCredential(
    process.env.AZURE_CLIENT_ID?.trim()
      ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID.trim() }
      : undefined,
  );
  const token = await credential.getToken("https://search.azure.com/.default");
  if (!token?.token) throw new Error("azure_search_aad_token_unavailable");
  return { Authorization: `Bearer ${token.token}` };
}

async function searchRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const apiVersion = readEnv("AZURE_SEARCH_API_VERSION", "2024-07-01");
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`${endpoint()}${path}${sep}api-version=${apiVersion}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(await authHeaders()),
      ...(init.headers ?? {}),
    },
  });
}

function dbPool(): Pool {
  return new Pool({
    connectionString: readEnv("DATABASE_URL"),
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
}

async function sourceCounts(
  db: Pool,
  scope: string[],
): Promise<Record<string, number>> {
  const params = scope.length > 0 ? [scope] : [];
  const scopeSql = scope.length > 0 ? "and tenant_key = any($1::text[])" : "";
  const result = await db.query<{ tenant_key: string; count: string }>(
    `
    select tenant_key, count(*)::text as count
    from enterprise_context_chunks
    where coalesce(lifecycle_state, 'active') = 'active'
      ${scopeSql}
    group by tenant_key
    order by tenant_key
  `,
    params,
  );
  const counts: Record<string, number> = {};
  for (const row of result.rows) {
    const tenantKey = canonicalTenantKey(row.tenant_key);
    counts[tenantKey] =
      (counts[tenantKey] ?? 0) + Number.parseInt(row.count, 10);
  }
  return counts;
}

async function* readChunks(
  db: Pool,
  batchSize: number,
  scope: string[],
): AsyncGenerator<EnterpriseContextChunkRow[]> {
  let offset = 0;
  const params =
    scope.length > 0 ? [batchSize, offset, scope] : [batchSize, offset];
  const scopeSql = scope.length > 0 ? "and c.tenant_key = any($3::text[])" : "";
  for (;;) {
    const result = await db.query<EnterpriseContextChunkRow>(
      `
      select
        c.client_id::text as client_id,
        c.tenant_key,
        c.chunk_id,
        c.source_segment_id,
        c.source_record_id,
        c.source_doc,
        c.source_path,
        c.chunk_index,
        c.chunk_text,
        coalesce(c.lifecycle_state, 'active') as lifecycle_state,
        c.embedded_at,
        c.provenance,
        c.chunk_metadata,
        gor.agent_readiness_status,
        coalesce(
          nullif(c.chunk_metadata->>'source_file_id', ''),
          nullif(c.provenance->>'source_file_id', '')
        ) as source_file_id,
        case
          when coalesce(c.chunk_metadata->>'source_row_number', c.provenance->>'source_row') ~ '^[0-9]+$'
          then coalesce(c.chunk_metadata->>'source_row_number', c.provenance->>'source_row')::int
          else null
        end as source_row_number
      from enterprise_context_chunks c
      left join governed_object_readiness gor
        on gor.object_table = 'enterprise_context_chunks'
       and gor.object_id = c.chunk_id
       and gor.client_key = c.tenant_key
      where coalesce(c.lifecycle_state, 'active') = 'active'
        ${scopeSql}
      order by c.tenant_key, c.chunk_id
      limit $1 offset $2
    `,
      params,
    );
    if (result.rows.length === 0) return;
    yield result.rows;
    offset += result.rows.length;
    params[1] = offset;
  }
}

async function* readNonActiveChunkDeletes(
  db: Pool,
  batchSize: number,
  scope: string[],
): AsyncGenerator<SearchDocument[]> {
  let offset = 0;
  const params =
    scope.length > 0 ? [batchSize, offset, scope] : [batchSize, offset];
  const scopeSql = scope.length > 0 ? "and tenant_key = any($3::text[])" : "";
  for (;;) {
    const result = await db.query<{ tenant_key: string; chunk_id: string }>(
      `
      select tenant_key, chunk_id
      from enterprise_context_chunks
      where coalesce(lifecycle_state, 'active') <> 'active'
        ${scopeSql}
      order by tenant_key, chunk_id
      limit $1 offset $2
    `,
      params,
    );
    if (result.rows.length === 0) return;
    yield result.rows.map((row) =>
      toTenantContextDeleteDocument(
        canonicalTenantKey(row.tenant_key),
        row.chunk_id,
      ),
    );
    offset += result.rows.length;
    params[1] = offset;
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function uploadBatch(docs: SearchDocument[]): Promise<void> {
  const res = await searchRequest("/indexes/tenant-context-v1/docs/index", {
    method: "POST",
    body: JSON.stringify({ value: docs }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`azure_search_upload_failed:${res.status}:${text}`);
  }
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  const failed = collectFailedIndexResults(parsed);
  if (failed.length > 0) {
    const detail = failed
      .slice(0, 5)
      .map((f) => `${f.key}:${f.statusCode}:${f.errorMessage}`)
      .join(" | ");
    throw new Error(
      `azure_search_doc_index_failed:${failed.length} document(s) rejected with HTTP 200: ${detail}`,
    );
  }
}

async function collectTenantSearchDocs(
  tenant: string,
): Promise<Array<{ tenant_key: string; chunk_id: string }>> {
  const docs: Array<{ tenant_key: string; chunk_id: string }> = [];
  const filter = `tenant_key eq '${tenant.replace(/'/g, "''")}'`;
  for (let skip = 0; ; skip += 1000) {
    const res = await searchRequest("/indexes/tenant-context-v1/docs/search", {
      method: "POST",
      body: JSON.stringify({
        search: "*",
        filter,
        select: "tenant_key,chunk_id",
        top: 1000,
        skip,
      }),
    });
    if (!res.ok) {
      throw new Error(
        `azure_search_purge_query_failed:${res.status}:${await res.text()}`,
      );
    }
    const json = (await res.json()) as {
      value?: Array<{ tenant_key?: string; chunk_id?: string }>;
    };
    const rows = json.value ?? [];
    for (const row of rows) {
      if (row.tenant_key && row.chunk_id) {
        docs.push({ tenant_key: row.tenant_key, chunk_id: row.chunk_id });
      }
    }
    if (rows.length < 1000) break;
  }
  return docs;
}

async function purgeTenantSearchDocs(tenants: string[]): Promise<void> {
  for (const tenant of tenants) {
    const rows = await collectTenantSearchDocs(tenant);
    let deleted = 0;
    for (let index = 0; index < rows.length; index += 1000) {
      const batch = rows.slice(index, index + 1000);
      await uploadBatch(
        batch.map((row) =>
          toTenantContextDeleteDocument(row.tenant_key, row.chunk_id),
        ),
      );
      deleted += batch.length;
    }
    console.log(
      JSON.stringify({
        event: "azure_search_backfill_tenant_purged",
        tenant,
        deleted,
      }),
    );
  }
}

function staleAliasDeleteDocs(
  rows: EnterpriseContextChunkRow[],
): SearchDocument[] {
  return rows
    .filter((row) => canonicalTenantKey(row.tenant_key) !== row.tenant_key)
    .map((row) => toTenantContextDeleteDocument(row.tenant_key, row.chunk_id));
}

async function searchCount(filter?: string): Promise<number> {
  const body: Record<string, unknown> = {
    search: "*",
    count: true,
    top: 0,
  };
  if (filter) body.filter = filter;
  const res = await searchRequest("/indexes/tenant-context-v1/docs/search", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `azure_search_count_failed:${res.status}:${await res.text()}`,
    );
  }
  const json = (await res.json()) as { "@odata.count"?: number };
  return json["@odata.count"] ?? 0;
}

async function verify(expected: Record<string, number>): Promise<void> {
  // Azure AI Search `$count` is eventually consistent: a count taken
  // immediately after an upload can undercount until the index commits. Poll a
  // bounded number of times before asserting a real mismatch.
  const maxAttempts = readIntEnv("AZURE_SEARCH_VERIFY_ATTEMPTS", 6);
  const delayMs = readIntEnv("AZURE_SEARCH_VERIFY_DELAY_MS", 5_000);
  let observed: Record<string, number> = {};
  let mismatches: string[] = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    observed = {};
    for (const tenant of Object.keys(expected).sort()) {
      observed[tenant] = await searchCount(
        `tenant_key eq '${tenant.replace(/'/g, "''")}'`,
      );
    }
    mismatches = countMismatches(expected, observed);
    if (mismatches.length === 0) break;
    if (attempt < maxAttempts) await sleep(delayMs);
  }
  if (mismatches.length > 0) {
    throw new Error(
      `azure_search_backfill_count_mismatch:${mismatches.join("; ")}`,
    );
  }
  console.log(
    JSON.stringify({
      event: "azure_search_backfill_verified",
      observed,
    }),
  );
}

async function main(): Promise<void> {
  const runMode = mode();
  const db = dbPool();
  try {
    const scope = scopedTenantKeys();
    const counts = await sourceCounts(db, scope);
    if (runMode === "plan") {
      console.log(
        JSON.stringify(
          {
            event: "azure_search_backfill_plan",
            endpoint: endpoint(),
            index: "tenant-context-v1",
            tenantScope: scope,
            sourceCounts: counts,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (runMode === "apply") {
      const batchSize = readIntEnv("AZURE_SEARCH_BACKFILL_BATCH_SIZE", 500);
      if (process.env.AZURE_SEARCH_BACKFILL_PURGE_BEFORE_APPLY === "true") {
        const tenants = canonicalScopeTenants(scope);
        if (tenants.length === 0) {
          throw new Error("azure_search_backfill_purge_requires_tenant_scope");
        }
        await purgeTenantSearchDocs(tenants);
      }
      let uploaded = 0;
      for await (const rows of readChunks(db, batchSize, scope)) {
        const now = new Date();
        const deletes = staleAliasDeleteDocs(rows);
        if (deletes.length > 0) {
          await uploadBatch(deletes);
        }
        await uploadBatch(
          rows.map((row) => toTenantContextSearchDocument(row, now)),
        );
        uploaded += rows.length;
        console.log(
          JSON.stringify({
            event: "azure_search_backfill_batch_uploaded",
            uploaded,
          }),
        );
      }
      for await (const deletes of readNonActiveChunkDeletes(
        db,
        batchSize,
        scope,
      )) {
        if (deletes.length > 0) {
          await uploadBatch(deletes);
          console.log(
            JSON.stringify({
              event: "azure_search_backfill_non_active_deleted",
              deleted: deletes.length,
            }),
          );
        }
      }
    }

    await verify(counts);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      event: "azure_search_backfill_failed",
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(1);
});
