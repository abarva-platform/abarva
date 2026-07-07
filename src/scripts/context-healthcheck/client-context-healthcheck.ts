import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { Pool } from "pg";
import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import {
  evaluatePromotion,
  type ReadinessRow,
} from "@/lib/governance/promotion-evaluator";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

type Json = Record<string, unknown>;

type TargetClient = {
  label: string;
  canonicalKey: string;
  aliases: string[];
  clientId: string | null;
  liveTenantKey: string | null;
  liveClientKey: string | null;
  liveName: string | null;
  workspaceKey: string | null;
  dbRow: Json | null;
  keyMismatchRisks: string[];
};

type TableSnapshot = {
  exists: boolean;
  columns: string[];
  count: number | null;
  by?: Record<string, number>;
  samples?: Json[];
  issues?: Json;
};

type SearchDoc = Record<string, unknown>;

type RetrievalProbe = {
  dimension: string;
  query: string;
  count: number | null;
  topDocs: SearchDoc[];
  tenantIsolation: "pass" | "fail" | "unknown";
  citationMetadataPresent: boolean;
  sourceBasisConfidencePresent: boolean;
  staleSupersededExcluded: boolean | "unknown";
  error?: string;
};

type BundleProbe = {
  module: "Intelligence" | "Moves" | "Source" | "Tower";
  tenantResolved: boolean;
  moduleResolved: boolean;
  evidenceRequirementsResolved: boolean;
  currentFactsSelected: boolean;
  wrongTenantFactsExcluded: boolean;
  supersededFactsExcluded: boolean;
  unreadyFactsExcluded: boolean;
  corpusPatternsIncluded: boolean | "not_observed";
  assembledBeforeModel: boolean;
  modelInputContextHash: string;
  citationsEmitted: number;
  unsupportedClaimsFlagged: boolean;
  tenantLeakageCheckPassed: boolean;
  decision: string;
  usable: number;
  blocked: number;
  agentReadyCount: number;
  warnings: string[];
};

type ClientHealth = {
  identity: TargetClient;
  blobProof: {
    account: string | null;
    container: string | null;
    listed: number;
    matchingBlobs: Json[];
    missingOriginals: number | null;
    stagedButNotProcessed: number | null;
    error?: string;
  };
  db: {
    tables: Record<string, TableSnapshot>;
    factsByLifecycle: Record<string, number>;
    readinessByStatus: Record<string, number>;
    promotionRecommendations: Record<string, number>;
    promotionFailures: Record<string, number>;
  };
  idempotency: Json;
  search: {
    indexName: string;
    availableFields: string[];
    documentCount: number | null;
    sampleDocs: SearchDoc[];
    tenantFilterUsed: string | null;
    fieldPresence: Json;
    error?: string;
  };
  retrieval: RetrievalProbe[];
  contextBundles: BundleProbe[];
  moduleReadiness: Record<string, { status: string; why: string[] }>;
  artifactReadiness: Record<string, TableSnapshot>;
  defects: string[];
  remediation: string[];
};

type HealthReport = {
  generatedAt: string;
  mode: "read_only";
  gitSha: string | null;
  azure: {
    subscriptionId: string | null;
    jobName: string | null;
    executionName: string | null;
    imageTag: string | null;
    imageDigest: string | null;
    searchService: string | null;
    searchIndex: string;
    blobAccount: string | null;
    blobContainer: string | null;
  };
  targets: ClientHealth[];
  globalDefects: string[];
};

const TARGETS = [
  { label: "SkyHarbor Air", canonicalKey: "skyharbor-air" },
  { label: "Lakeshore Holdings", canonicalKey: "lakeshore-holdings" },
  { label: "Apex Retail", canonicalKey: "apex-retail" },
  { label: "Meridian Health", canonicalKey: "meridian-health" },
] as const;

const RECORD_TABLES = [
  "enterprise_context_sources",
  "enterprise_context_source_files",
  "enterprise_context_records",
  "enterprise_context_facts",
  "enterprise_context_chunks",
  "governed_object_readiness",
  "agent_context_traces",
  "data_inventory_records",
] as const;

const ARTIFACT_TABLES = [
  "move_artifacts",
  "source_artifacts",
  "deliverables_v2",
  "program_evidence_items",
  "program_attachments",
] as const;

const RETRIEVAL_DIMENSIONS = [
  ["enterprise profile", "enterprise profile revenue employees business units"],
  [
    "leadership/org",
    "CIO CTO CFO CDAO leadership organization reporting lines",
  ],
  ["applications/systems", "application portfolio ERP CRM EHR core systems"],
  [
    "infrastructure/cloud",
    "cloud infrastructure data center AWS Azure mainframe",
  ],
  ["integrations", "integration topology APIs ETL interfaces"],
  ["vendor contracts", "vendor contracts renewal annual value sourcing"],
  ["IT financials", "IT budget run spend capital operating cost"],
  ["KPIs/value", "KPI value baseline target benefits"],
  [
    "DORA/engineering metrics",
    "DORA deployment frequency lead time change failure MTTR",
  ],
  ["incidents/ITSM", "incidents problems changes ITSM service management"],
  ["SLAs", "SLA service level uptime availability response"],
  ["initiatives/moves", "AI initiatives strategic moves roadmap portfolio"],
  ["risks/controls", "risk controls compliance audit security"],
  [
    "artifacts/evidence",
    "evidence artifacts documents deliverables source citations",
  ],
  ["AI/data/use cases", "AI use cases data platform analytics governance"],
] as const;

const MODULE_QUERIES = {
  Intelligence: "executive brief AI opportunities KPIs risks leadership",
  Moves: "strategic moves initiatives sponsors phase gate evidence value",
  Source: "vendor contracts renewals sourcing spend optimization suppliers",
  Tower: "controls value KPIs operating metrics governance risks",
} as const;

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sqlIdent(identifier: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function truncate(value: unknown, length = 220): string {
  const text = String(value ?? "");
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

async function queryRows<T = Json>(
  pool: Pool,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

async function tableColumns(pool: Pool, tableName: string): Promise<string[]> {
  const rows = await queryRows<{ column_name: string }>(
    pool,
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [tableName],
  );
  return rows.map((row) => row.column_name);
}

function scopedPredicate(
  columns: Set<string>,
  client: TargetClient,
  alias = "",
): {
  where: string;
  params: unknown[];
} {
  const prefix = alias ? `${alias}.` : "";
  const clauses: string[] = [];
  const params: unknown[] = [];
  const aliases = Array.from(
    new Set([client.canonicalKey, ...client.aliases]),
  ).filter(Boolean);

  if (columns.has("client_id") && client.clientId) {
    params.push(client.clientId);
    clauses.push(`${prefix}client_id = $${params.length}`);
  }
  if (columns.has("tenant_id") && client.clientId) {
    params.push(client.clientId);
    clauses.push(`${prefix}tenant_id = $${params.length}`);
  }
  if (columns.has("tenant_key")) {
    params.push(aliases);
    clauses.push(`${prefix}tenant_key = ANY($${params.length})`);
  }
  if (columns.has("client_key")) {
    params.push(aliases);
    clauses.push(`${prefix}client_key = ANY($${params.length})`);
  }
  if (columns.has("workspace_key")) {
    params.push(aliases);
    clauses.push(`${prefix}workspace_key = ANY($${params.length})`);
  }

  return {
    where: clauses.length ? `(${clauses.join(" OR ")})` : "FALSE",
    params,
  };
}

async function resolveClients(pool: Pool): Promise<TargetClient[]> {
  const clientColumns = await tableColumns(pool, "clients");
  const clients = clientColumns.length
    ? await queryRows(pool, `SELECT * FROM public.clients LIMIT 500`)
    : [];

  return TARGETS.map((target) => {
    const aliases = tenantAliasesFor(target.canonicalKey);
    const aliasSet = new Set(
      [...aliases, target.canonicalKey, target.label].map(normalize),
    );
    const row =
      clients.find((candidate) =>
        Object.entries(candidate).some(([key, value]) => {
          if (!/(name|key|slug|alias|workspace|tenant|client)/i.test(key))
            return false;
          if (value == null) return false;
          if (Array.isArray(value)) {
            return value.some((item) => aliasSet.has(normalize(item)));
          }
          if (typeof value === "object") return false;
          return (
            aliasSet.has(normalize(value)) ||
            aliasSet.has(normalize(String(value).replace(/\s+/g, "-")))
          );
        }),
      ) ?? null;

    const clientId = row ? String(row.id ?? row.client_id ?? "") || null : null;
    const liveTenantKey = row
      ? String(row.tenant_key ?? row.key ?? row.client_key ?? "") || null
      : null;
    const liveClientKey = row
      ? String(row.client_key ?? row.key ?? row.tenant_key ?? "") || null
      : null;
    const liveName = row
      ? String(row.legal_name ?? row.name ?? row.display_name ?? "") || null
      : null;
    const workspaceKey = row
      ? String(row.workspace_key ?? row.slug ?? row.key ?? "") || null
      : null;
    const risks: string[] = [];
    if (!row) risks.push("No matching clients row found in live DB");
    for (const key of [liveTenantKey, liveClientKey, workspaceKey].filter(
      Boolean,
    )) {
      if (key && !aliasSet.has(normalize(key))) {
        risks.push(`Live key "${key}" is outside known aliases`);
      }
    }

    return {
      label: target.label,
      canonicalKey: target.canonicalKey,
      aliases,
      clientId,
      liveTenantKey,
      liveClientKey,
      liveName,
      workspaceKey,
      dbRow: row,
      keyMismatchRisks: risks,
    };
  });
}

async function tableCount(
  pool: Pool,
  table: string,
  client: TargetClient,
): Promise<TableSnapshot> {
  const columns = await tableColumns(pool, table);
  if (columns.length === 0) return { exists: false, columns: [], count: null };
  const columnSet = new Set(columns);
  const scoped = scopedPredicate(columnSet, client);
  const countRows = await queryRows<{ count: string }>(
    pool,
    `SELECT count(*)::text AS count FROM public.${sqlIdent(table)} WHERE ${scoped.where}`,
    scoped.params,
  );
  const snapshot: TableSnapshot = {
    exists: true,
    columns,
    count: numberValue(countRows[0]?.count),
  };

  const groupColumn = [
    "record_type",
    "lifecycle_state",
    "source_segment_id",
    "segment",
    "agent_readiness_status",
    "artifact_type",
  ].find((column) => columnSet.has(column));
  if (groupColumn) {
    const groupRows = await queryRows<{ k: string | null; count: string }>(
      pool,
      `SELECT COALESCE(${sqlIdent(groupColumn)}::text, '<null>') AS k, count(*)::text AS count
         FROM public.${sqlIdent(table)}
        WHERE ${scoped.where}
        GROUP BY 1
        ORDER BY count(*) DESC, 1
        LIMIT 80`,
      scoped.params,
    );
    snapshot.by = Object.fromEntries(
      groupRows.map((row) => [String(row.k), numberValue(row.count)]),
    );
  }

  const wanted = columns
    .filter((column) =>
      [
        "id",
        "tenant_key",
        "client_key",
        "client_id",
        "record_type",
        "source_file",
        "blob_path",
        "storage_path",
        "lifecycle_state",
        "agent_readiness_status",
        "fact_key",
        "title",
        "name",
      ].includes(column),
    )
    .slice(0, 14);
  if (wanted.length) {
    const sampleRows = await queryRows(
      pool,
      `SELECT ${wanted.map(sqlIdent).join(", ")}
         FROM public.${sqlIdent(table)}
        WHERE ${scoped.where}
        LIMIT 5`,
      scoped.params,
    );
    snapshot.samples = sampleRows;
  }

  return snapshot;
}

async function countFactsByLifecycle(
  pool: Pool,
  client: TargetClient,
): Promise<Record<string, number>> {
  const columns = await tableColumns(pool, "enterprise_context_facts");
  if (columns.length === 0) return {};
  const scoped = scopedPredicate(new Set(columns), client);
  const rows = await queryRows<{ state: string; count: string }>(
    pool,
    `SELECT COALESCE(lifecycle_state, '<null>') AS state, count(*)::text AS count
       FROM public.enterprise_context_facts
      WHERE ${scoped.where}
      GROUP BY 1
      ORDER BY count(*) DESC`,
    scoped.params,
  );
  return Object.fromEntries(
    rows.map((row) => [row.state, numberValue(row.count)]),
  );
}

async function readiness(
  pool: Pool,
  client: TargetClient,
): Promise<{
  byStatus: Record<string, number>;
  recommendations: Record<string, number>;
  failures: Record<string, number>;
  rows: ReadinessRow[];
}> {
  const columns = await tableColumns(pool, "governed_object_readiness");
  if (columns.length === 0)
    return { byStatus: {}, recommendations: {}, failures: {}, rows: [] };
  const scoped = scopedPredicate(new Set(columns), client);
  const select = [
    "object_table",
    "object_id",
    "client_key",
    "tenant_id",
    "source_layer",
    "agent_readiness_status",
    "retrievability",
    "classification",
    "source_basis",
    "confidence_level",
    "applicable_agents",
    "cited_render_verified_at",
    "policy_validation_status",
    "provenance",
  ].filter((column) => columns.includes(column));
  const rows = await queryRows<ReadinessRow>(
    pool,
    `SELECT ${select.map(sqlIdent).join(", ")}
       FROM public.governed_object_readiness
      WHERE ${scoped.where}
      LIMIT 50000`,
    scoped.params,
  );
  const byStatus: Record<string, number> = {};
  const recommendations: Record<string, number> = {};
  const failures: Record<string, number> = {};
  for (const row of rows) {
    const status = String(row.agent_readiness_status ?? "<null>");
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    const evaluation = evaluatePromotion({
      ...row,
      applicable_agents: row.applicable_agents ?? [],
    });
    recommendations[evaluation.recommendation] =
      (recommendations[evaluation.recommendation] ?? 0) + 1;
    for (const reason of evaluation.failure_reasons) {
      failures[reason] = (failures[reason] ?? 0) + 1;
    }
  }
  return { byStatus, recommendations, failures, rows };
}

async function idempotency(pool: Pool, client: TargetClient): Promise<Json> {
  const factsColumns = await tableColumns(pool, "enterprise_context_facts");
  const chunksColumns = await tableColumns(pool, "enterprise_context_chunks");
  const sourceFileColumns = await tableColumns(
    pool,
    "enterprise_context_source_files",
  );
  const result: Json = {};

  if (factsColumns.length) {
    const factSet = new Set(factsColumns);
    const scoped = scopedPredicate(factSet, client, "f");
    const duplicates = await queryRows(
      pool,
      `SELECT f.tenant_key, f.record_id::text, f.fact_key, count(*)::text AS count
         FROM public.enterprise_context_facts f
        WHERE ${scoped.where}
          AND COALESCE(f.lifecycle_state, 'active') = 'active'
        GROUP BY 1, 2, 3
       HAVING count(*) > 1
        ORDER BY count(*) DESC
        LIMIT 25`,
      scoped.params,
    );
    const orphanFacts = await queryRows<{ count: string }>(
      pool,
      `SELECT count(*)::text AS count
         FROM public.enterprise_context_facts f
         LEFT JOIN public.enterprise_context_records r ON r.id = f.record_id
        WHERE ${scoped.where} AND r.id IS NULL`,
      scoped.params,
    );
    const supersededActive = factSet.has("supersedes_fact_id")
      ? await queryRows<{ count: string }>(
          pool,
          `SELECT count(*)::text AS count
             FROM public.enterprise_context_facts f
            WHERE ${scoped.where}
              AND COALESCE(f.lifecycle_state, 'active') = 'active'
              AND f.supersedes_fact_id IS NOT NULL`,
          scoped.params,
        )
      : [];
    result.duplicateActiveFacts = duplicates;
    result.orphanFacts = numberValue(orphanFacts[0]?.count);
    result.supersededFactsStillActive = numberValue(supersededActive[0]?.count);
  }

  if (chunksColumns.length) {
    const chunkSet = new Set(chunksColumns);
    const scoped = scopedPredicate(chunkSet, client, "c");
    const idColumn = chunksColumns.includes("chunk_id")
      ? "chunk_id"
      : chunksColumns.includes("id")
        ? "id"
        : null;
    if (idColumn) {
      const activeClause = chunkSet.has("lifecycle_state")
        ? "AND COALESCE(c.lifecycle_state, 'active') = 'active'"
        : "";
      result.duplicateActiveChunks = await queryRows(
        pool,
        `SELECT ${sqlIdent(idColumn)}::text AS chunk_id, count(*)::text AS count
           FROM public.enterprise_context_chunks c
          WHERE ${scoped.where}
            ${activeClause}
          GROUP BY 1
         HAVING count(*) > 1
          ORDER BY count(*) DESC
          LIMIT 25`,
        scoped.params,
      );
    }
  }

  if (sourceFileColumns.length) {
    const fileSet = new Set(sourceFileColumns);
    const scoped = scopedPredicate(fileSet, client, "sf");
    const fileKey =
      [
        "content_hash",
        "blob_path",
        "storage_path",
        "source_file",
        "file_name",
        "name",
      ].find((column) => fileSet.has(column)) ?? null;
    if (fileKey) {
      result.duplicateSourceFiles = await queryRows(
        pool,
        `SELECT ${sqlIdent(fileKey)}::text AS file_key, count(*)::text AS count
           FROM public.enterprise_context_source_files sf
          WHERE ${scoped.where}
          GROUP BY 1
         HAVING count(*) > 1
          ORDER BY count(*) DESC
          LIMIT 25`,
        scoped.params,
      );
    }
  }

  return result;
}

async function blobProof(
  pool: Pool,
  client: TargetClient,
): Promise<ClientHealth["blobProof"]> {
  const account =
    process.env.DATA_PLANE_OBJECT_STORE_ACCOUNT ??
    process.env.AZURE_STORAGE_ACCOUNT_NAME ??
    null;
  const containerName =
    process.env.DATA_PLANE_OBJECT_STORE_CONTAINER ?? "context-drops";
  const proof: ClientHealth["blobProof"] = {
    account,
    container: containerName,
    listed: 0,
    matchingBlobs: [],
    missingOriginals: null,
    stagedButNotProcessed: null,
  };
  if (!account) {
    proof.error =
      "No DATA_PLANE_OBJECT_STORE_ACCOUNT/AZURE_STORAGE_ACCOUNT_NAME configured";
    return proof;
  }
  try {
    const credential = new DefaultAzureCredential({
      managedIdentityClientId: process.env.AZURE_CLIENT_ID,
    });
    const service = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      credential,
    );
    const container = service.getContainerClient(containerName);
    const needles = new Set(client.aliases.map(normalize));
    const matches: Json[] = [];
    let listed = 0;
    for await (const blob of container.listBlobsFlat()) {
      listed += 1;
      const name = normalize(blob.name);
      if ([...needles].some((needle) => name.includes(needle))) {
        matches.push({
          name: blob.name,
          contentLength: blob.properties.contentLength ?? null,
          lastModified: blob.properties.lastModified?.toISOString() ?? null,
          contentType: blob.properties.contentType ?? null,
        });
      }
      if (listed >= 10000 || matches.length >= 80) break;
    }
    proof.listed = listed;
    proof.matchingBlobs = matches;

    const sourceFileColumns = await tableColumns(
      pool,
      "enterprise_context_source_files",
    );
    if (sourceFileColumns.length && matches.length) {
      const scoped = scopedPredicate(new Set(sourceFileColumns), client);
      const dbFileRows = await queryRows<{ path: string | null }>(
        pool,
        `SELECT COALESCE(${[
          "blob_path",
          "storage_path",
          "source_file",
          "file_name",
          "name",
        ]
          .filter((column) => sourceFileColumns.includes(column))
          .map(sqlIdent)
          .join(", ")}) AS path
           FROM public.enterprise_context_source_files
          WHERE ${scoped.where}
          LIMIT 2000`,
        scoped.params,
      );
      const dbPaths = new Set(
        dbFileRows.map((row) => normalize(row.path)).filter(Boolean),
      );
      proof.stagedButNotProcessed = matches.filter(
        (blob) => !dbPaths.has(normalize(blob.name)),
      ).length;
    }
  } catch (error) {
    proof.error = error instanceof Error ? error.message : String(error);
  }
  return proof;
}

async function searchRequest<T = Json>(path: string, body?: Json): Promise<T> {
  const service = process.env.AZURE_SEARCH_SERVICE_NAME;
  if (!service) throw new Error("AZURE_SEARCH_SERVICE_NAME is not set");
  const apiVersion = process.env.AZURE_SEARCH_API_VERSION ?? "2024-07-01";
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: process.env.AZURE_CLIENT_ID,
  });
  const token = await credential.getToken("https://search.azure.com/.default");
  const response = await fetch(
    `https://${service}.search.windows.net${path}${path.includes("?") ? "&" : "?"}api-version=${apiVersion}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token?.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}: ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

function searchFilter(
  client: TargetClient,
  fields: Set<string>,
): string | null {
  const clauses: string[] = [];
  const aliases = Array.from(
    new Set([client.canonicalKey, ...client.aliases]),
  ).filter(Boolean);
  const escaped = (value: string) => value.replace(/'/g, "''");
  if (fields.has("tenant_key"))
    clauses.push(
      ...aliases.map((alias) => `tenant_key eq '${escaped(alias)}'`),
    );
  if (fields.has("client_key"))
    clauses.push(
      ...aliases.map((alias) => `client_key eq '${escaped(alias)}'`),
    );
  if (fields.has("client_id") && client.clientId)
    clauses.push(`client_id eq '${escaped(client.clientId)}'`);
  return clauses.length ? `(${clauses.join(" or ")})` : null;
}

async function searchProof(
  client: TargetClient,
): Promise<ClientHealth["search"]> {
  const indexName =
    process.env.TENANT_CONTEXT_INDEX_NAME ?? "tenant-context-v1";
  const proof: ClientHealth["search"] = {
    indexName,
    availableFields: [],
    documentCount: null,
    sampleDocs: [],
    tenantFilterUsed: null,
    fieldPresence: {},
  };
  try {
    const schema = await searchRequest<{ fields: { name: string }[] }>(
      `/indexes/${indexName}`,
    );
    const fields = new Set(schema.fields.map((field) => field.name));
    proof.availableFields = [...fields].sort();
    proof.tenantFilterUsed = searchFilter(client, fields);
    const select = [
      "id",
      "tenant_key",
      "client_key",
      "client_id",
      "source_segment",
      "source_segment_id",
      "record_id",
      "chunk_id",
      "title",
      "source_uri",
      "source_file",
      "confidence",
      "classification",
      "lifecycle_state",
      "content",
    ].filter((field) => fields.has(field));
    const result = await searchRequest<{
      "@odata.count"?: number;
      value?: SearchDoc[];
    }>(`/indexes/${indexName}/docs/search`, {
      search: "*",
      count: true,
      top: 5,
      filter: proof.tenantFilterUsed,
      select: select.join(","),
    });
    proof.documentCount = result["@odata.count"] ?? null;
    proof.sampleDocs = (result.value ?? []).map((doc) => ({
      ...doc,
      content: doc.content ? truncate(doc.content, 260) : undefined,
    }));
    proof.fieldPresence = {
      tenant_key: fields.has("tenant_key"),
      client_id: fields.has("client_id"),
      client_key: fields.has("client_key"),
      sourceCitation: [
        "source_uri",
        "source_file",
        "record_id",
        "chunk_id",
      ].some((field) => fields.has(field)),
      lifecycle_state: fields.has("lifecycle_state"),
      confidence: fields.has("confidence"),
    };
  } catch (error) {
    proof.error = error instanceof Error ? error.message : String(error);
  }
  return proof;
}

async function retrievalProbe(
  client: TargetClient,
  dimension: string,
  query: string,
): Promise<RetrievalProbe> {
  const indexName =
    process.env.TENANT_CONTEXT_INDEX_NAME ?? "tenant-context-v1";
  try {
    const schema = await searchRequest<{ fields: { name: string }[] }>(
      `/indexes/${indexName}`,
    );
    const fields = new Set(schema.fields.map((field) => field.name));
    const filter = searchFilter(client, fields);
    const select = [
      "id",
      "tenant_key",
      "client_key",
      "client_id",
      "source_segment",
      "record_id",
      "chunk_id",
      "title",
      "source_uri",
      "source_file",
      "confidence",
      "source_basis",
      "classification",
      "lifecycle_state",
      "content",
    ].filter((field) => fields.has(field));
    const result = await searchRequest<{
      "@odata.count"?: number;
      value?: SearchDoc[];
    }>(`/indexes/${indexName}/docs/search`, {
      search: query,
      count: true,
      top: 3,
      filter,
      select: select.join(","),
    });
    const docs: SearchDoc[] = (result.value ?? []).map((doc) => ({
      ...doc,
      content: doc.content ? truncate(doc.content, 240) : undefined,
    }));
    const aliases = new Set(client.aliases.map(normalize));
    const tenantIsolation =
      docs.length === 0
        ? "unknown"
        : docs.every((doc) =>
              [doc.tenant_key, doc.client_key, doc.client_id].some(
                (value) =>
                  value &&
                  (aliases.has(normalize(value)) ||
                    String(value) === client.clientId),
              ),
            )
          ? "pass"
          : "fail";
    const citationMetadataPresent = docs.every((doc) =>
      [
        doc.source_uri,
        doc.source_file,
        doc.record_id,
        doc.chunk_id,
        doc.id,
      ].some(Boolean),
    );
    const sourceBasisConfidencePresent = docs.every(
      (doc) => doc.confidence != null || doc.source_basis != null,
    );
    const staleSupersededExcluded = docs.some(
      (doc) => doc.lifecycle_state != null,
    )
      ? docs.every(
          (doc) =>
            !["superseded", "retired", "stale"].includes(
              String(doc.lifecycle_state),
            ),
        )
      : "unknown";
    return {
      dimension,
      query,
      count: result["@odata.count"] ?? null,
      topDocs: docs,
      tenantIsolation,
      citationMetadataPresent,
      sourceBasisConfidencePresent,
      staleSupersededExcluded,
    };
  } catch (error) {
    return {
      dimension,
      query,
      count: null,
      topDocs: [],
      tenantIsolation: "unknown",
      citationMetadataPresent: false,
      sourceBasisConfidencePresent: false,
      staleSupersededExcluded: "unknown",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function candidateFromDoc(
  client: TargetClient,
  doc: SearchDoc,
  moduleName: BundleProbe["module"],
): GovernedCandidate {
  const citation = String(
    doc.source_uri ??
      doc.source_file ??
      doc.record_id ??
      doc.chunk_id ??
      doc.id ??
      "",
  );
  const confidenceRaw = doc.confidence;
  const confidenceLevel =
    typeof confidenceRaw === "number"
      ? confidenceRaw >= 0.85
        ? "high"
        : confidenceRaw >= 0.6
          ? "medium"
          : "low"
      : ["low", "medium", "high"].includes(String(confidenceRaw))
        ? String(confidenceRaw)
        : "medium";
  return {
    id: String(
      doc.id ??
        doc.chunk_id ??
        `${client.canonicalKey}:${moduleName}:${citation}`,
    ),
    client_key: client.canonicalKey,
    tenant_id: client.clientId,
    source_layer: "search_chunk",
    source_basis: citation || "azure-search",
    classification: String(
      doc.classification ?? "internal",
    ) as GovernedCandidate["classification"],
    retrievability: "search_indexed",
    agent_readiness_status: "agent_ready",
    confidence_level: confidenceLevel as GovernedCandidate["confidence_level"],
    cited_render_verified_at: citation ? new Date().toISOString() : null,
    title: String(doc.title ?? doc.source_segment ?? doc.id ?? moduleName),
    citations: citation ? [citation] : [],
  };
}

async function bundleProbe(
  client: TargetClient,
  moduleName: BundleProbe["module"],
): Promise<BundleProbe> {
  const retrieval = await retrievalProbe(
    client,
    moduleName,
    MODULE_QUERIES[moduleName],
  );
  const candidates = retrieval.topDocs.map((doc) =>
    candidateFromDoc(client, doc, moduleName),
  );
  const bundle = buildValidatedAgentContextBundle(candidates);
  const hash = createHash("sha256")
    .update(
      JSON.stringify(
        bundle.usable.map((candidate) => [
          candidate.id,
          candidate.source_basis,
          candidate.citations,
        ]),
      ),
    )
    .digest("hex");
  return {
    module: moduleName,
    tenantResolved: !!client.clientId && !client.keyMismatchRisks.length,
    moduleResolved: true,
    evidenceRequirementsResolved:
      candidates.length > 0 && bundle.citations.length > 0,
    currentFactsSelected: retrieval.staleSupersededExcluded === true,
    wrongTenantFactsExcluded: retrieval.tenantIsolation !== "fail",
    supersededFactsExcluded: retrieval.staleSupersededExcluded === true,
    unreadyFactsExcluded: bundle.blocked.length === 0,
    corpusPatternsIncluded: "not_observed",
    assembledBeforeModel: true,
    modelInputContextHash: hash,
    citationsEmitted: bundle.citations.length,
    unsupportedClaimsFlagged: bundle.usable.length === 0,
    tenantLeakageCheckPassed: retrieval.tenantIsolation !== "fail",
    decision: bundle.decision,
    usable: bundle.usable.length,
    blocked: bundle.blocked.length,
    agentReadyCount: bundle.agentReadyCount,
    warnings: bundle.warnings.slice(0, 8),
  };
}

function classifyModule(
  dbRecords: number,
  factsActive: number,
  searchCount: number | null,
  retrieval: RetrievalProbe[],
  bundle: BundleProbe,
): { status: string; why: string[] } {
  const why: string[] = [];
  const retrievalPasses = retrieval.filter(
    (probe) => (probe.count ?? 0) > 0 && probe.tenantIsolation !== "fail",
  ).length;
  if (dbRecords === 0)
    why.push("No scoped enterprise_context_records were found.");
  if (factsActive === 0)
    why.push("No active/current enterprise_context_facts were found.");
  if (!searchCount)
    why.push("No Azure AI Search documents were proven for this client.");
  if (retrievalPasses < 4)
    why.push(
      `Only ${retrievalPasses} retrieval dimensions returned tenant-scoped evidence.`,
    );
  if (bundle.usable === 0)
    why.push(`${bundle.module} context bundle had no usable candidates.`);
  if (bundle.citationsEmitted === 0)
    why.push(`${bundle.module} emitted no citation locators.`);
  if (!bundle.currentFactsSelected) {
    why.push(
      `${bundle.module} could not prove current-only selection from the search result payload.`,
    );
  }
  if (!bundle.supersededFactsExcluded) {
    why.push(
      `${bundle.module} could not prove stale/superseded exclusion from the search result payload.`,
    );
  }
  if (!bundle.unsupportedClaimsFlagged) {
    why.push(
      `${bundle.module} did not exercise the unsupported-claim response validator because this probe stopped before model generation.`,
    );
  }

  if (!why.length)
    return {
      status: "READY",
      why: ["Fact-backed, indexed, retrievable, cited, and bundle-proven."],
    };
  if (dbRecords > 0 && factsActive > 0 && searchCount && bundle.usable > 0) {
    return { status: "READY_WITH_GAPS", why };
  }
  if (dbRecords > 0 || factsActive > 0 || searchCount)
    return { status: "PRELIMINARY_ONLY", why };
  return { status: "NOT_READY", why };
}

async function artifactReadiness(
  pool: Pool,
  client: TargetClient,
): Promise<Record<string, TableSnapshot>> {
  const result: Record<string, TableSnapshot> = {};
  for (const table of ARTIFACT_TABLES) {
    result[table] = await tableCount(pool, table, client);
  }
  return result;
}

async function collectClient(
  pool: Pool,
  client: TargetClient,
): Promise<ClientHealth> {
  const tables: Record<string, TableSnapshot> = {};
  for (const table of RECORD_TABLES) {
    tables[table] = await tableCount(pool, table, client);
  }
  const factsByLifecycle = await countFactsByLifecycle(pool, client);
  const readinessResult = await readiness(pool, client);
  const idempotencyProof = await idempotency(pool, client);
  const blob = await blobProof(pool, client);
  const search = await searchProof(client);
  const retrieval: RetrievalProbe[] = [];
  for (const [dimension, query] of RETRIEVAL_DIMENSIONS) {
    retrieval.push(await retrievalProbe(client, dimension, query));
  }
  const contextBundles: BundleProbe[] = [];
  for (const moduleKey of Object.keys(
    MODULE_QUERIES,
  ) as BundleProbe["module"][]) {
    contextBundles.push(await bundleProbe(client, moduleKey));
  }
  const artifacts = await artifactReadiness(pool, client);

  const dbRecords = tables.enterprise_context_records.count ?? 0;
  const activeFacts = factsByLifecycle.active ?? factsByLifecycle.current ?? 0;
  const moduleReadiness = Object.fromEntries(
    contextBundles.map((probe) => [
      probe.module,
      classifyModule(
        dbRecords,
        activeFacts,
        search.documentCount,
        retrieval,
        probe,
      ),
    ]),
  );

  const defects: string[] = [];
  const remediation: string[] = [];
  if (client.keyMismatchRisks.length) defects.push(...client.keyMismatchRisks);
  if ((tables.enterprise_context_records.count ?? 0) === 0)
    defects.push(
      "No enterprise_context_records found for resolved client scope.",
    );
  if (activeFacts === 0)
    defects.push("No active/current enterprise_context_facts found.");
  if (!search.documentCount)
    defects.push("No Azure AI Search indexed documents proven.");
  if (search.fieldPresence && search.fieldPresence.client_id !== true) {
    defects.push(
      "Azure AI Search index does not expose client_id; tenant isolation was proven with tenant_key/client_key filters only.",
    );
  }
  if (search.fieldPresence && search.fieldPresence.lifecycle_state !== true) {
    defects.push(
      "Azure AI Search index does not expose lifecycle_state; stale/superseded exclusion cannot be proven at the search-result layer.",
    );
  }
  if ((idempotencyProof.duplicateActiveFacts as unknown[])?.length)
    defects.push("Duplicate active facts found.");
  if (retrieval.some((probe) => probe.tenantIsolation === "fail"))
    defects.push("Tenant leakage risk in Azure Search retrieval.");
  if (retrieval.some((probe) => probe.staleSupersededExcluded === "unknown")) {
    defects.push(
      "One or more retrieval dimensions returned results without lifecycle_state, so current-only proof is DB-level/search-loader-inferred rather than index-field-proven.",
    );
  }
  if (
    retrieval.filter((probe) => (probe.count ?? 0) > 0).length <
    RETRIEVAL_DIMENSIONS.length
  ) {
    defects.push("Not every required retrieval dimension returned evidence.");
  }
  if (
    Object.values(moduleReadiness).some((entry) => entry.status !== "READY")
  ) {
    remediation.push(
      "Use module-specific retrieval gaps to load or index the missing context dimensions before pilot claims.",
    );
  }
  if ((readinessResult.recommendations.agent_ready ?? 0) === 0) {
    remediation.push(
      "Keep rows not_reviewed/promotion_candidate until cite-render and bundle proof is captured; do not auto-promote.",
    );
  }
  if (!blob.matchingBlobs.length)
    remediation.push(
      "Verify original files are staged in Blob under a tenant-identifiable prefix.",
    );

  return {
    identity: client,
    blobProof: blob,
    db: {
      tables,
      factsByLifecycle,
      readinessByStatus: readinessResult.byStatus,
      promotionRecommendations: readinessResult.recommendations,
      promotionFailures: readinessResult.failures,
    },
    idempotency: idempotencyProof,
    search,
    retrieval,
    contextBundles,
    moduleReadiness,
    artifactReadiness: artifacts,
    defects,
    remediation,
  };
}

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
    max: 4,
  });
  try {
    const clients = await resolveClients(pool);
    const targets: ClientHealth[] = [];
    for (const client of clients) {
      console.log(
        `healthcheck: collecting ${client.label} (${client.canonicalKey})`,
      );
      targets.push(await collectClient(pool, client));
    }
    const report: HealthReport = {
      generatedAt: new Date().toISOString(),
      mode: "read_only",
      gitSha: process.env.ABARVA_GIT_SHA ?? null,
      azure: {
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID ?? null,
        jobName: process.env.ABARVA_HEALTHCHECK_JOB_NAME ?? null,
        executionName: process.env.ABARVA_HEALTHCHECK_EXECUTION_NAME ?? null,
        imageTag: process.env.ABARVA_HEALTHCHECK_IMAGE_TAG ?? null,
        imageDigest: process.env.ABARVA_HEALTHCHECK_IMAGE_DIGEST ?? null,
        searchService: process.env.AZURE_SEARCH_SERVICE_NAME ?? null,
        searchIndex:
          process.env.TENANT_CONTEXT_INDEX_NAME ?? "tenant-context-v1",
        blobAccount:
          process.env.DATA_PLANE_OBJECT_STORE_ACCOUNT ??
          process.env.AZURE_STORAGE_ACCOUNT_NAME ??
          null,
        blobContainer:
          process.env.DATA_PLANE_OBJECT_STORE_CONTAINER ?? "context-drops",
      },
      targets,
      globalDefects: [],
    };
    const payload = gzipSync(
      Buffer.from(JSON.stringify(report), "utf8"),
    ).toString("base64");
    console.log(`HEALTHCHECK_RESULT_GZIP_BASE64:${payload}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(
    `HEALTHCHECK_ERROR:${JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })}`,
  );
  process.exit(1);
});
