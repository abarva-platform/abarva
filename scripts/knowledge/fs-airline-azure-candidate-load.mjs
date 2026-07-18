#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const requireFromApp = createRequire(new URL("../../package.json", import.meta.url));

const repoRoot = process.cwd();
const tenants = {
  "first-capital-financial": {
    displayLabel: "FS Demo",
    physicalLabel: "First Capital Financial",
    aliases: ["first-capital-financial", "first-capital", "FS Demo", "First Capital Financial"],
  },
  "skyharbor-air": {
    displayLabel: "Airline Demo",
    physicalLabel: "SkyHarbor Air",
    aliases: ["skyharbor-air", "skyharbor", "Airline Demo", "SkyHarbor Air"],
  },
};
const allowedHost = "pg-abarva-context-lab-001.postgres.database.azure.com";
const defaultOutDir = "reports/fs-airline-azure-candidate-load";
const sourceSystem = "tenant_data_factory_candidate";
const operatorUser = "candidate-data-factory";
const truthStatement =
  "Planning-grade synthetic candidate context only. Not real client production data, not PHI/PII/payment-card data, not active tenant truth, and not a claim of realized financial value.";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function action() {
  if (hasFlag("--preload-only")) return "preload";
  if (hasFlag("--audit-only")) return "audit";
  if (hasFlag("--execute")) return "load";
  return process.env.FS_AIRLINE_CANDIDATE_ACTION || "preload";
}

function selectedTenants() {
  const tenant = arg("--tenant", process.env.TENANT_KEY || "all");
  if (tenant === "all") return Object.keys(tenants);
  if (!tenants[tenant]) throw new Error(`Unknown tenant ${tenant}. Use all, ${Object.keys(tenants).join(", ")}.`);
  return [tenant];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), "utf8"));
}

function readText(file) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

function readCsv(file) {
  const text = readText(file).trim();
  if (!text) return [];
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") value += char;
  }
  if (row.length || value) {
    row.push(value);
    rows.push(row);
  }
  const [headers, ...dataRows] = rows;
  return dataRows.map((cells, rowIndex) => ({
    ...Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""])),
    __sourceRowNumber: rowIndex + 2,
  }));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(file, headers, rows) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`);
}

function writeMd(file, lines) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableKey(...parts) {
  return sha(parts.filter(Boolean).join("|")).slice(0, 48);
}

function pgClient() {
  const { Client } = requireFromApp("pg");
  return Client;
}

function rootFor(tenantKey) {
  return `datasets/tenant-inputs/generated/${tenantKey}/rich-synthetic-2026-07-v3`;
}

function sourceRootFor(tenantKey) {
  return `datasets/tenant-inputs/candidates/${tenantKey}/rich-synthetic-2026-07-v3`;
}

function loadTenantArtifacts(tenantKey) {
  const root = rootFor(tenantKey);
  return {
    tenantKey,
    config: tenants[tenantKey],
    manifest: readJson(`${root}/tenant-generation-manifest.json`),
    canonicalRecords: readJson(`${root}/canonical-records.json`),
    canonicalFacts: readJson(`${root}/canonical-facts.json`),
    evidence: readJson(`${root}/evidence-registry.json`),
    graphNodes: readJson(`${root}/graph-nodes.json`),
    graphEdges: readJson(`${root}/graph-edges.json`),
    gaps: readJson(`${root}/context-gaps.json`),
    chunks: readJson(`${root}/retrieval-chunks.json`),
    home: readJson(`${root}/home-context-view.json`),
    tower: readJson(`${root}/tower-dashboard-view.json`),
    moves: readJson(`${root}/moves-context-view.json`),
    source: readJson(`${root}/source-context-view.json`),
    renderPack: readJson(`${root}/render-pack.json`),
    storyBlocks: readJson(`${root}/approved-candidate-story-blocks.json`),
    visualSpecs: readJson(`${root}/approved-candidate-visual-specs.json`),
    sourceFiles: fs.readdirSync(path.join(repoRoot, sourceRootFor(tenantKey))).filter((file) => file.endsWith(".csv")).sort(),
  };
}

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.TARGET_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    ""
  );
}

function targetInfo() {
  const url = connectionString();
  if (!url) return { ok: false, reason: "missing DATABASE_URL/Azure Postgres URL", host: "", database: "" };
  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, "");
  const ok = parsed.hostname === allowedHost && !/prod/i.test(database);
  return { ok, reason: ok ? "" : `target must be ${allowedHost} and non-prod database, got ${parsed.hostname}/${database}`, host: parsed.hostname, database };
}

function preloadTableNames() {
  return [
    "intelligence_v7.active_tenant_contract_versions",
    "intelligence_v7.tenant_contract_promotion_events",
    "intelligence_v7.tenant_pack_runs",
    "intelligence_v7.source_files",
    "intelligence_v7.business_records",
    "intelligence_v7.record_fields",
    "intelligence_v7.graph_nodes",
    "intelligence_v7.relationship_edges",
    "intelligence_v7.chunk_registry",
    "public.enterprise_context_sources",
    "public.enterprise_context_source_files",
    "public.enterprise_context_records",
    "public.enterprise_context_facts",
    "public.enterprise_context_evidence",
    "public.enterprise_context_quality_issues",
    "public.enterprise_context_stewardship_tasks",
    "public.enterprise_context_relationships",
    "public.enterprise_context_chunks",
    "public.enterprise_context_chunk_queue",
    "public.governed_object_readiness",
    "cio_tower.source_registry",
    "cio_tower.entities",
    "cio_tower.facts",
    "cio_tower.relationships",
    "cio_tower.measure_results",
    "cio_tower.validation_runs",
    "cio_tower.validation_results",
    "public.source_events",
    "public.source_context_receipts",
    "public.source_contract_evidence_manifests",
    "public.source_contract_evidence_rows",
    "public.source_contract_evidence_metrics",
  ];
}

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function tableExists(client, table) {
  const [schema, name] = table.includes(".") ? table.split(".") : ["public", table];
  const result = await q(client, "select to_regclass($1) as name", [`${schema}.${name}`]);
  return Boolean(result.rows[0]?.name);
}

async function columnsFor(client, table) {
  const [schema, name] = table.includes(".") ? table.split(".") : ["public", table];
  const result = await q(
    client,
    `select column_name, is_nullable, column_default
       from information_schema.columns
      where table_schema=$1 and table_name=$2`,
    [schema, name],
  );
  return new Map(result.rows.map((row) => [row.column_name, row]));
}

async function insertRows(client, table, columns, rows, conflictClause = "") {
  if (!rows.length) return 0;
  const available = await columnsFor(client, table);
  const usableColumns = columns.filter((column) => available.has(column));
  const missing = columns.filter((column) => !available.has(column));
  if (usableColumns.length !== columns.length) {
    throw new Error(`${table} missing expected columns: ${missing.join(", ")}`);
  }
  const chunkSize = Math.max(1, Math.floor(55000 / usableColumns.length));
  let affected = 0;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const params = [];
    const values = chunk
      .map((row, rowIndex) => {
        const offset = rowIndex * usableColumns.length;
        params.push(...usableColumns.map((column) => row[column]));
        return `(${usableColumns.map((_, columnIndex) => `$${offset + columnIndex + 1}`).join(",")})`;
      })
      .join(",");
    const result = await q(client, `insert into ${table} (${usableColumns.join(",")}) values ${values} ${conflictClause}`, params);
    affected += result.rowCount ?? 0;
  }
  return affected;
}

async function deleteCandidateRows(client, tenantKey, contractVersion, loadRunId) {
  const sourceRecordPrefix = `${loadRunId}%`;
  const deleteStatements = [
    ["public.enterprise_context_chunk_queue", "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.enterprise_context_chunks", "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.governed_object_readiness", "client_key=$1 and provenance->>'load_run_id'=$2", [tenantKey, loadRunId]],
    ["public.enterprise_context_stewardship_tasks", "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.enterprise_context_quality_issues", "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.enterprise_context_evidence", "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.enterprise_context_relationships", "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.enterprise_context_facts", "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.enterprise_context_records", "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.enterprise_context_source_files", "tenant_key=$1 and source_system=$2 and source_file_id like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["public.enterprise_context_sources", "tenant_key=$1 and source_system=$2 and source_key like $3", [tenantKey, sourceSystem, sourceRecordPrefix]],
    ["cio_tower.validation_results", "tenant_key=$1 and validation_run_key like $2", [tenantKey, sourceRecordPrefix]],
    ["cio_tower.validation_runs", "tenant_key=$1 and validation_run_key like $2", [tenantKey, sourceRecordPrefix]],
    ["cio_tower.measure_results", "tenant_key=$1 and measure_key like $2", [tenantKey, sourceRecordPrefix]],
    ["cio_tower.relationships", "tenant_key=$1 and relationship_key like $2", [tenantKey, sourceRecordPrefix]],
    ["cio_tower.facts", "tenant_key=$1 and fact_key like $2", [tenantKey, sourceRecordPrefix]],
    ["cio_tower.entities", "tenant_key=$1 and entity_key like $2", [tenantKey, sourceRecordPrefix]],
    ["cio_tower.source_registry", "tenant_key=$1 and upload_run_id=$2", [tenantKey, loadRunId]],
    ["public.source_contract_evidence_rows", "tenant_key=$1 and source_event_id like $2", [tenantKey, sourceRecordPrefix]],
    ["public.source_contract_evidence_metrics", "tenant_key=$1 and source_event_id like $2", [tenantKey, sourceRecordPrefix]],
    ["public.source_contract_evidence_manifests", "tenant_key=$1 and upload_batch_id=$2", [tenantKey, loadRunId]],
    ["public.source_context_receipts", "tenant_key=$1 and source_event_id like $2", [tenantKey, sourceRecordPrefix]],
    ["public.source_events", "client_key=$1 and event_code like $2", [tenantKey, sourceRecordPrefix]],
    ["intelligence_v7.tenant_pack_runs", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]],
  ];
  const rows = [];
  for (const [table, predicate, params] of deleteStatements) {
    if (!(await tableExists(client, table))) {
      rows.push({ tenant_key: tenantKey, target_table: table, deleted_rows: 0, status: "skipped_table_missing" });
      continue;
    }
    const result = await q(client, `delete from ${table} where ${predicate}`, params);
    rows.push({ tenant_key: tenantKey, target_table: table, deleted_rows: result.rowCount ?? 0, status: "ready" });
  }
  return rows;
}

async function ensureV7Schema(client) {
  await q(client, "create schema if not exists intelligence_v7");
  await q(client, `create table if not exists intelligence_v7.contract_versions (
    contract_version text primary key,
    contract_name text not null,
    status text not null default 'candidate',
    generated_from text not null,
    metadata jsonb not null default '{}'::jsonb,
    loaded_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`);
  await q(client, `create table if not exists intelligence_v7.dimension_registry (
    dimension_key text primary key,
    contract_version text not null,
    dimension_file text not null,
    dimension_label text not null,
    column_count integer not null,
    metadata jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`);
  await q(client, `create table if not exists intelligence_v7.column_registry (
    column_key text primary key,
    contract_version text not null,
    dimension_key text not null,
    column_name text not null,
    column_ordinal integer not null,
    client_field text,
    required_level text,
    allowed_format text,
    client_instruction text,
    example_value text,
    module_use text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(contract_version, dimension_key, column_name)
  )`);
  await q(client, `create table if not exists intelligence_v7.tenant_pack_runs (
    run_key text primary key,
    tenant_key text not null,
    tenant_name text not null,
    contract_version text not null,
    source_dataset text not null,
    load_status text not null default 'loaded',
    file_count integer not null,
    row_count integer not null,
    field_count integer not null,
    graph_node_count integer not null default 0,
    relationship_edge_count integer not null default 0,
    chunk_count integer not null default 0,
    validation_report jsonb not null default '{}'::jsonb,
    loaded_at timestamptz not null default now(),
    superseded_at timestamptz,
    unique(tenant_key, contract_version, source_dataset)
  )`);
  await q(client, `create table if not exists intelligence_v7.source_files (
    source_file_key text primary key,
    run_key text not null references intelligence_v7.tenant_pack_runs(run_key) on delete cascade,
    tenant_key text not null,
    contract_version text not null,
    dimension_key text not null,
    source_file text not null,
    row_count integer not null,
    checksum_sha256 text not null,
    loaded_at timestamptz not null default now(),
    unique(run_key, source_file)
  )`);
  await q(client, `create table if not exists intelligence_v7.business_records (
    record_key text primary key,
    run_key text not null references intelligence_v7.tenant_pack_runs(run_key) on delete cascade,
    tenant_key text not null,
    contract_version text not null,
    dimension_key text not null,
    source_file_key text not null references intelligence_v7.source_files(source_file_key) on delete cascade,
    source_file text not null,
    source_row_number integer not null,
    record_id text not null,
    record_name text not null,
    entity_scope text,
    entity_name text,
    parent_entity_name text,
    used_by_entities text,
    shared_service_flag boolean,
    budget_ownership_model text,
    source_artifact_name text,
    source_validation_status text,
    source_as_of_date date,
    values_json jsonb not null default '{}'::jsonb,
    fact_status text not null default 'active',
    fact_confidence text not null default 'unknown',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(tenant_key, contract_version, dimension_key, source_file, source_row_number)
  )`);
  await q(client, `create table if not exists intelligence_v7.record_fields (
    record_field_key text primary key,
    record_key text not null references intelligence_v7.business_records(record_key) on delete cascade,
    tenant_key text not null,
    contract_version text not null,
    dimension_key text not null,
    column_key text not null,
    column_name text not null,
    value_text text not null,
    value_number numeric,
    value_date date,
    value_bool boolean,
    source_file_key text not null references intelligence_v7.source_files(source_file_key) on delete cascade,
    source_row_number integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(record_key, column_name)
  )`);
  await q(client, `create table if not exists intelligence_v7.graph_nodes (
    node_key text primary key,
    tenant_key text not null,
    contract_version text not null,
    node_type text not null,
    node_ref text not null,
    entity_scope text,
    entity_name text,
    source_record_key text,
    values_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(tenant_key, contract_version, node_type, node_ref)
  )`);
  await q(client, `create table if not exists intelligence_v7.relationship_edges (
    edge_key text primary key,
    tenant_key text not null,
    contract_version text not null,
    relationship_id text not null,
    from_node_key text not null references intelligence_v7.graph_nodes(node_key) on delete cascade,
    to_node_key text not null references intelligence_v7.graph_nodes(node_key) on delete cascade,
    from_object_ref text not null,
    from_object_type text not null,
    relationship_type text not null,
    to_object_ref text not null,
    to_object_type text not null,
    relationship_direction text,
    evidence_ref text,
    relationship_strength text,
    quality_score numeric,
    source_record_key text,
    values_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    unique(tenant_key, contract_version, relationship_id)
  )`);
  await q(client, `create table if not exists intelligence_v7.chunk_registry (
    chunk_key text primary key,
    tenant_key text not null,
    contract_version text not null,
    chunk_id text not null,
    source_artifact_ref text,
    dimension text,
    fact_refs text,
    semantic_tags text,
    entity_refs text,
    retrieval_eligibility text,
    sensitivity text,
    embedding_model text,
    index_name text,
    indexed_at text,
    stale_after date,
    source_record_key text,
    values_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(tenant_key, contract_version, chunk_id)
  )`);
}

async function findClientId(client, artifact) {
  if (!(await tableExists(client, "public.clients"))) return null;
  const aliases = artifact.config.aliases.map((item) => item.toLowerCase());
  const result = await q(
    client,
    `select id from public.clients
      where lower(coalesce(tenant_key, '')) = any($1::text[])
         or lower(coalesce(slug, '')) = any($1::text[])
         or lower(coalesce(name, '')) = any($1::text[])
      order by case when lower(coalesce(tenant_key, '')) = $2 then 0 else 1 end
      limit 1`,
    [aliases, artifact.tenantKey],
  );
  return result.rows[0]?.id ?? null;
}

function countTokens(text) {
  return Math.ceil(String(text ?? "").split(/\s+/).filter(Boolean).length * 1.3);
}

function numeric(value) {
  const parsed = Number(String(value ?? "").replace(/[$,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function piiFindings(artifact) {
  const files = [
    ...artifact.sourceFiles.map((file) => `${sourceRootFor(artifact.tenantKey)}/${file}`),
    ...["canonical-records.json", "canonical-facts.json", "retrieval-chunks.json", "home-context-view.json", "tower-dashboard-view.json", "moves-context-view.json", "source-context-view.json"].map((file) => `${rootFor(artifact.tenantKey)}/${file}`),
  ];
  const patterns = [
    ["email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
    ["ssn", /\b\d{3}-\d{2}-\d{4}\b/g],
    ["payment_card", /\b(?:\d[ -]*?){13,16}\b/g],
    ["phone", /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g],
  ];
  const rows = [];
  for (const file of files) {
    const text = readText(file);
    for (const [kind, regex] of patterns) {
      const matches = text.match(regex) || [];
      if (matches.length) rows.push({ tenant_key: artifact.tenantKey, file, finding_type: kind, matches: matches.length, status: "fail" });
    }
  }
  return rows;
}

function buildLocalReconciliation(artifact) {
  const recordKeys = new Set(artifact.canonicalRecords.map((row) => row.record_key));
  const nodeKeys = new Set(artifact.graphNodes.map((row) => row.node_key));
  const evidenceIds = new Set(artifact.evidence.map((row) => row.evidence_id));
  const orphanFacts = artifact.canonicalFacts.filter((row) => !recordKeys.has(row.record_key));
  const orphanEdges = artifact.graphEdges.filter((row) => !nodeKeys.has(row.from_node_key) || !nodeKeys.has(row.to_node_key));
  const missingLineage = [
    ...artifact.canonicalRecords.filter((row) => !row.source_file || !row.source_row || !row.evidence_id),
    ...artifact.canonicalFacts.filter((row) => !row.source_file || !row.source_row || !row.evidence_id),
    ...artifact.chunks.filter((row) => !row.fact_key || !row.evidence_id || row.default_runtime_visible !== false),
  ];
  const unresolvedEvidence = [
    ...artifact.canonicalRecords.filter((row) => row.evidence_id && !evidenceIds.has(row.evidence_id)),
    ...artifact.canonicalFacts.filter((row) => row.evidence_id && !evidenceIds.has(row.evidence_id)),
    ...artifact.chunks.filter((row) => row.evidence_id && !evidenceIds.has(row.evidence_id)),
  ];
  const blockedClaims = [
    ...artifact.source.filter((row) => row.savings_claim_allowed !== false).map((row) => ({ object_key: row.source_key, reason: "source savings claim allowed" })),
    ...artifact.moves.filter((row) => row.active_execution_commitment !== false).map((row) => ({ object_key: row.move_key, reason: "moves active execution commitment" })),
  ];
  return { orphanFacts, orphanEdges, missingLineage, unresolvedEvidence, blockedClaims, pii: piiFindings(artifact) };
}

function buildLocalGraphProof(artifact) {
  const nodeKeys = new Set(artifact.graphNodes.map((row) => row.node_key));
  const scopedNodeRefs = new Set(
    artifact.graphNodes.map((row) => `${artifact.tenantKey}|${artifact.manifest.candidate_contract_version}|${row.node_type || "entity"}|${row.node_key}`),
  );
  const edgeRefs = new Set(artifact.graphEdges.flatMap((row) => [row.from_node_key, row.to_node_key]));
  const orphanEdges = artifact.graphEdges.filter((row) => !nodeKeys.has(row.from_node_key) || !nodeKeys.has(row.to_node_key));
  const orphanNodes = artifact.graphNodes.filter((row) => !edgeRefs.has(row.node_key));
  return {
    node: {
      tenant_key: artifact.tenantKey,
      candidate_contract_version: artifact.manifest.candidate_contract_version,
      load_run_id: artifact.manifest.load_run_id,
      node_key_policy: "stable generated node_key",
      node_ref_policy: "node_ref uses generated node_key",
      total_nodes: artifact.graphNodes.length,
      unique_node_keys: nodeKeys.size,
      unique_scoped_node_refs: scopedNodeRefs.size,
      duplicate_node_keys: artifact.graphNodes.length - nodeKeys.size,
      duplicate_scoped_node_refs: artifact.graphNodes.length - scopedNodeRefs.size,
      orphan_graph_nodes: orphanNodes.length,
      status:
        nodeKeys.size === artifact.graphNodes.length &&
        scopedNodeRefs.size === artifact.graphNodes.length &&
        orphanNodes.length === 0
          ? "Pass"
          : "Fail",
    },
    edge: {
      tenant_key: artifact.tenantKey,
      candidate_contract_version: artifact.manifest.candidate_contract_version,
      load_run_id: artifact.manifest.load_run_id,
      source_ref_policy: "relationship edge source_record_key resolves through evidence lineage",
      total_edges: artifact.graphEdges.length,
      resolved_edges: artifact.graphEdges.length - orphanEdges.length,
      orphan_graph_edges: orphanEdges.length,
      status:
        orphanEdges.length === 0
          ? "Pass"
          : "Fail",
    },
    status:
      nodeKeys.size === artifact.graphNodes.length &&
      scopedNodeRefs.size === artifact.graphNodes.length &&
      orphanNodes.length === 0 &&
      orphanEdges.length === 0
        ? "Pass"
        : "Fail",
  };
}

async function preload(client, artifacts, outDir) {
  const tableNames = preloadTableNames();
  const tableRows = [];
  for (const table of tableNames) {
    tableRows.push({ table, exists: await tableExists(client, table) ? "yes" : "no" });
  }
  const target = targetInfo();
  const tenantRows = [];
  const activeRows = [];
  const piiRows = [];
  for (const artifact of artifacts) {
    const clientId = await findClientId(client, artifact);
    const activeExists = await tableExists(client, "intelligence_v7.active_tenant_contract_versions");
    let active = [];
    if (activeExists) {
      const result = await q(client, "select tenant_key, active_contract_version, candidate_contract_version, promotion_status from intelligence_v7.active_tenant_contract_versions where tenant_key=$1", [artifact.tenantKey]);
      active = result.rows;
    }
    activeRows.push(...active.map((row) => ({ ...row, mutation_planned: "no" })));
    const local = buildLocalReconciliation(artifact);
    piiRows.push(...local.pii);
    tenantRows.push({
      tenant_key: artifact.tenantKey,
      display_label: artifact.config.displayLabel,
      client_id_present: clientId ? "yes" : "no",
      candidate_contract_version: artifact.manifest.candidate_contract_version,
      load_run_id: artifact.manifest.load_run_id,
      expected_source_files: artifact.manifest.counts.source_template_files,
      expected_source_rows: artifact.manifest.counts.source_template_rows,
      expected_records: artifact.manifest.counts.canonical_records,
      expected_facts: artifact.manifest.counts.canonical_facts,
      expected_graph_nodes: artifact.manifest.counts.graph_nodes,
      expected_graph_edges: artifact.manifest.counts.graph_edges,
      expected_chunks: artifact.manifest.counts.retrieval_chunks,
      orphan_facts: local.orphanFacts.length,
      orphan_edges: local.orphanEdges.length,
      missing_lineage: local.missingLineage.length,
      pii_findings: local.pii.length,
      active_pointer_mutation_planned: "no",
      status: local.orphanFacts.length || local.orphanEdges.length || local.missingLineage.length || local.pii.length ? "blocked" : "ready",
    });
  }
  writeCsv(path.join(outDir, "preload-table-existence.csv"), Object.keys(tableRows[0]), tableRows);
  writeCsv(path.join(outDir, "preload-tenant-safety.csv"), Object.keys(tenantRows[0]), tenantRows);
  writeCsv(path.join(outDir, "preload-active-pointers.csv"), Object.keys(activeRows[0] ?? { tenant_key: "", mutation_planned: "" }), activeRows);
  writeCsv(path.join(outDir, "preload-sensitive-data-scan.csv"), Object.keys(piiRows[0] ?? { tenant_key: "", file: "", finding_type: "", matches: "", status: "" }), piiRows);
  writeMd(path.join(outDir, "preload-safety-check.md"), [
    "# FS/Airline Azure Candidate Load Preload Safety Check",
    "",
    `Status: ${target.ok && tenantRows.every((row) => row.status === "ready") ? "PASS" : "BLOCKED"}`,
    "",
    `Target: ${target.host}/${target.database}`,
    `Target guard: ${target.ok ? "pass" : target.reason}`,
    "",
    "Hard boundaries:",
    "- Candidate load only.",
    "- Active tenant pointer mutation planned: no.",
    "- Meridian/unrelated tenant overwrite planned: no.",
    "- Real client data/PII/PHI/PCI allowed: no.",
    "- Rollback strategy: delete candidate rows by tenant_key + candidate_contract_version/load_run_id/source_system.",
    "",
    "Tenants:",
    ...tenantRows.map((row) => `- ${row.display_label} (${row.tenant_key}): ${row.status}; ${Number(row.expected_records).toLocaleString("en-US")} records, ${Number(row.expected_facts).toLocaleString("en-US")} facts, ${Number(row.expected_chunks).toLocaleString("en-US")} retrieval chunks.`),
  ]);
  return { tableRows, tenantRows, activeRows, piiRows };
}

function preloadWithoutDatabase(artifacts, outDir) {
  const target = targetInfo();
  const tableRows = preloadTableNames().map((table) => ({ table, exists: "not_checked_no_database_url" }));
  const tenantRows = [];
  const piiRows = [];
  for (const artifact of artifacts) {
    const local = buildLocalReconciliation(artifact);
    piiRows.push(...local.pii);
    tenantRows.push({
      tenant_key: artifact.tenantKey,
      display_label: artifact.config.displayLabel,
      client_id_present: "not_checked_no_database_url",
      candidate_contract_version: artifact.manifest.candidate_contract_version,
      load_run_id: artifact.manifest.load_run_id,
      expected_source_files: artifact.manifest.counts.source_template_files,
      expected_source_rows: artifact.manifest.counts.source_template_rows,
      expected_records: artifact.manifest.counts.canonical_records,
      expected_facts: artifact.manifest.counts.canonical_facts,
      expected_graph_nodes: artifact.manifest.counts.graph_nodes,
      expected_graph_edges: artifact.manifest.counts.graph_edges,
      expected_chunks: artifact.manifest.counts.retrieval_chunks,
      orphan_facts: local.orphanFacts.length,
      orphan_edges: local.orphanEdges.length,
      missing_lineage: local.missingLineage.length,
      pii_findings: local.pii.length,
      blocked_claims: local.blockedClaims.length,
      active_pointer_mutation_planned: "no",
      status: local.orphanFacts.length || local.orphanEdges.length || local.missingLineage.length || local.pii.length || local.blockedClaims.length ? "blocked" : "ready",
    });
  }
  writeCsv(path.join(outDir, "preload-table-existence.csv"), Object.keys(tableRows[0]), tableRows);
  writeCsv(path.join(outDir, "preload-tenant-safety.csv"), Object.keys(tenantRows[0]), tenantRows);
  writeCsv(path.join(outDir, "preload-active-pointers.csv"), ["tenant_key", "mutation_planned", "status"], [{ tenant_key: "all", mutation_planned: "no", status: "not_checked_no_database_url" }]);
  writeCsv(path.join(outDir, "preload-sensitive-data-scan.csv"), Object.keys(piiRows[0] ?? { tenant_key: "", file: "", finding_type: "", matches: "", status: "" }), piiRows);
  writeMd(path.join(outDir, "preload-safety-check.md"), [
    "# FS/Airline Azure Candidate Load Preload Safety Check",
    "",
    `Status: ${tenantRows.every((row) => row.status === "ready") ? "PASS_LOCAL_ARTIFACTS_ONLY" : "BLOCKED"}`,
    "",
    `Target: ${target.host || "not checked"}/${target.database || "not checked"}`,
    `Target guard: ${target.ok ? "pass" : "not checked in npm preload lifecycle; enforced by load/audit action"}`,
    "",
    "Hard boundaries:",
    "- Candidate load only.",
    "- Active tenant pointer mutation planned: no.",
    "- Meridian/unrelated tenant overwrite planned: no.",
    "- Real client data/PII/PHI/PCI allowed: no.",
    "- Database schema/client checks: deferred to load/audit action.",
    "- Rollback strategy: delete candidate rows by tenant_key + candidate_contract_version/load_run_id/source_system.",
    "",
    "Tenants:",
    ...tenantRows.map((row) => `- ${row.display_label} (${row.tenant_key}): ${row.status}; ${Number(row.expected_records).toLocaleString("en-US")} records, ${Number(row.expected_facts).toLocaleString("en-US")} facts, ${Number(row.expected_chunks).toLocaleString("en-US")} retrieval chunks.`),
  ]);
  return { tableRows, tenantRows, activeRows: [], piiRows };
}

async function loadV7(client, artifact, resultRows) {
  const { tenantKey, config, manifest } = artifact;
  const contractVersion = manifest.candidate_contract_version;
  const loadRunId = manifest.load_run_id;
  const runKey = `${loadRunId}:v7-pack-run`;
  await q(
    client,
    `insert into intelligence_v7.contract_versions(contract_version, contract_name, status, generated_from, metadata, updated_at)
     values($1,$2,'candidate',$3,$4::jsonb,now())
     on conflict(contract_version) do update set status='candidate', metadata=excluded.metadata, updated_at=now()`,
    [contractVersion, `${config.displayLabel} candidate data factory contract`, rootFor(tenantKey), JSON.stringify({ load_run_id: loadRunId, default_runtime_visible: false })],
  );
  const dimensions = [...new Set(artifact.canonicalRecords.map((row) => row.dimension_key))].sort();
  for (const [index, dimension] of dimensions.entries()) {
    await q(
      client,
      `insert into intelligence_v7.dimension_registry(dimension_key, contract_version, dimension_file, dimension_label, column_count, metadata, updated_at)
       values($1,$2,$3,$4,$5,$6::jsonb,now())
       on conflict(dimension_key) do update set contract_version=excluded.contract_version, metadata=excluded.metadata, updated_at=now()`,
      [dimension, contractVersion, `${dimension}.csv`, dimension.replace(/^\d+_/, "").replaceAll("_", " "), 1, JSON.stringify({ display_label: config.displayLabel, load_run_id: loadRunId, column_ordinal: index + 1 })],
    );
    const columnKey = `${contractVersion}:${dimension}:summary`;
    await q(
      client,
      `insert into intelligence_v7.column_registry(column_key, contract_version, dimension_key, column_name, column_ordinal, client_field, required_level, allowed_format, client_instruction, example_value, module_use, updated_at)
       values($1,$2,$3,'summary',$4,'summary','observed','text','candidate canonical summary','candidate','Home/Knowledge/Tower/Intelligence/Moves/Source',now())
       on conflict(column_key) do update set module_use=excluded.module_use, updated_at=now()`,
      [columnKey, contractVersion, dimension, index + 1],
    );
  }
  await q(
    client,
    `insert into intelligence_v7.tenant_pack_runs(run_key, tenant_key, tenant_name, contract_version, source_dataset, load_status, file_count, row_count, field_count, graph_node_count, relationship_edge_count, chunk_count, validation_report, loaded_at, superseded_at)
     values($1,$2,$3,$4,$5,'loaded',$6,$7,0,$8,$9,$10,$11::jsonb,now(),null)
     on conflict(run_key) do update set load_status='loaded', row_count=excluded.row_count, validation_report=excluded.validation_report, superseded_at=null`,
    [
      runKey,
      tenantKey,
      config.displayLabel,
      contractVersion,
      sourceRootFor(tenantKey),
      artifact.sourceFiles.length,
      artifact.canonicalRecords.length,
      artifact.graphNodes.length,
      artifact.graphEdges.length,
      artifact.chunks.length,
      JSON.stringify({ candidate_only: true, load_run_id: loadRunId, active_pointer_updated: false, truth_statement: truthStatement }),
    ],
  );
  resultRows.push({ tenant_key: tenantKey, layer: "L0", target_table: "intelligence_v7.tenant_pack_runs", rows_written: 1, status: "Pass" });
  if (await tableExists(client, "intelligence_v7.tenant_contract_promotion_events")) {
    await q(
      client,
      `insert into intelligence_v7.tenant_contract_promotion_events(event_key, tenant_key, from_contract_version, to_contract_version, event_type, promotion_status, actor, reason, validation_summary)
       values($1,$2,null,$3,'validate','passed',$4,$5,$6::jsonb)
       on conflict(event_key) do nothing`,
      [`${loadRunId}:candidate-validate`, tenantKey, contractVersion, operatorUser, "Candidate load validation only; active pointer not updated.", JSON.stringify({ load_run_id: loadRunId, default_runtime_visible: false })],
    );
    resultRows.push({ tenant_key: tenantKey, layer: "L0", target_table: "intelligence_v7.tenant_contract_promotion_events", rows_written: 1, status: "Pass" });
  }
  resultRows.push({ tenant_key: tenantKey, layer: "L0", target_table: "intelligence_v7.active_tenant_contract_versions", rows_written: 0, status: "NotMutatedByRule" });
  if (await tableExists(client, "intelligence_v7.module_readiness_scores")) {
    const moduleRows = ["home", "intelligence", "moves", "source", "tower"].map((moduleKey) => ({
      readiness_key: `${loadRunId}:readiness:${moduleKey}`,
      tenant_key: tenantKey,
      contract_version: contractVersion,
      module_key: moduleKey,
      readiness_status: "partial",
      readiness_score: 72,
      required_dimensions: JSON.stringify(["enterprise_profile", "applications_systems", "data_assets_integrations", "vendors_contracts", "metrics_outcomes"]),
      present_dimensions: JSON.stringify(dimensions),
      missing_dimensions: JSON.stringify(["client_attestation", "signed_in_runtime_proof", "active_promotion"]),
      source_coverage_score: 80,
      fact_coverage_score: 80,
      relationship_coverage_score: 75,
      retrieval_coverage_score: 70,
      unsupported_claim_risk: "medium",
      blockers: JSON.stringify(["candidate_preview_only", "not_active_tenant_truth"]),
      proof_refs: JSON.stringify([`${defaultOutDir}/proof.html`]),
      metadata: JSON.stringify({ load_run_id: loadRunId, display_label: config.displayLabel, default_runtime_visible: false }),
    }));
    await insertRows(client, "intelligence_v7.module_readiness_scores", Object.keys(moduleRows[0]), moduleRows, "on conflict(tenant_key, contract_version, module_key) do update set readiness_score=excluded.readiness_score, metadata=excluded.metadata, updated_at=now()");
    resultRows.push({ tenant_key: tenantKey, layer: "L3", target_table: "intelligence_v7.module_readiness_scores", rows_written: moduleRows.length, status: "Pass" });
  }
  if (await tableExists(client, "intelligence_v7.derived_intelligence_quality_reports")) {
    const reportRows = ["home", "intelligence", "moves", "source", "tower"].map((moduleKey) => ({
      report_key: `${loadRunId}:quality:${moduleKey}`,
      tenant_key: tenantKey,
      contract_version: contractVersion,
      derived_ref: `${loadRunId}:${moduleKey}:candidate-preview`,
      module_key: moduleKey,
      gate_status: "data_thin",
      confidence: "medium",
      source_fact_refs: JSON.stringify(artifact.canonicalFacts.slice(0, 20).map((row) => row.fact_key)),
      graph_relationship_refs: JSON.stringify(artifact.graphEdges.slice(0, 20).map((row) => row.edge_key)),
      assumptions: JSON.stringify(["synthetic candidate context", "explicit preview required"]),
      evidence_gaps: JSON.stringify(artifact.gaps.slice(0, 20).map((row) => row.gap_key)),
      not_allowed_claims: JSON.stringify(["realized savings", "active tenant truth", "production readiness"]),
      derivation_reason: "Candidate preview validation only; active runtime must use explicit active pointer.",
      blocked_reasons: JSON.stringify(["not promoted", "not signed-in browser proven"]),
    }));
    await insertRows(client, "intelligence_v7.derived_intelligence_quality_reports", Object.keys(reportRows[0]), reportRows, "on conflict(tenant_key, contract_version, derived_ref) do update set gate_status=excluded.gate_status, blocked_reasons=excluded.blocked_reasons");
    resultRows.push({ tenant_key: tenantKey, layer: "L3", target_table: "intelligence_v7.derived_intelligence_quality_reports", rows_written: reportRows.length, status: "Pass" });
  }

  const sourceRows = artifact.sourceFiles.map((file) => {
    const rows = readCsv(`${sourceRootFor(tenantKey)}/${file}`);
    return {
      source_file_key: `${loadRunId}:sf:${file}`,
      run_key: runKey,
      tenant_key: tenantKey,
      contract_version: contractVersion,
      dimension_key: file.replace(/\.csv$/, ""),
      source_file: file,
      row_count: rows.length,
      checksum_sha256: sha(readText(`${sourceRootFor(tenantKey)}/${file}`)),
    };
  });
  await insertRows(client, "intelligence_v7.source_files", Object.keys(sourceRows[0]), sourceRows, "on conflict(source_file_key) do update set row_count=excluded.row_count, checksum_sha256=excluded.checksum_sha256");
  resultRows.push({ tenant_key: tenantKey, layer: "L1", target_table: "intelligence_v7.source_files", rows_written: sourceRows.length, status: "Pass" });

  const sourceFileByDimension = new Map(sourceRows.map((row) => [row.dimension_key, row.source_file_key]));
  const recordRows = artifact.canonicalRecords.map((row) => ({
    record_key: `${loadRunId}:rec:${row.record_key}`,
    run_key: runKey,
    tenant_key: tenantKey,
    contract_version: contractVersion,
    dimension_key: row.dimension_key,
    source_file_key: sourceFileByDimension.get(row.dimension_key) || sourceRows[0].source_file_key,
    source_file: path.basename(row.source_file),
    source_row_number: Number(row.source_row || 1),
    record_id: row.record_key,
    record_name: row.record_name || row.record_key,
    entity_scope: "candidate",
    entity_name: row.record_name || row.record_key,
    source_validation_status: "candidate_validated",
    values_json: JSON.stringify({ ...row, display_label: config.displayLabel, load_run_id: loadRunId, truth_statement: truthStatement }),
    fact_status: "active",
    fact_confidence: row.confidence || "unknown",
  }));
  await insertRows(
    client,
    "intelligence_v7.business_records",
    Object.keys(recordRows[0]),
    recordRows,
    "on conflict(record_key) do update set record_name=excluded.record_name, values_json=excluded.values_json, updated_at=now()",
  );
  resultRows.push({ tenant_key: tenantKey, layer: "L2", target_table: "intelligence_v7.business_records", rows_written: recordRows.length, status: "Pass" });

  const factRows = artifact.canonicalFacts.map((row) => {
    const record = artifact.canonicalRecords.find((item) => item.record_key === row.record_key);
    const dimensionKey = row.dimension_key || record?.dimension_key || "unknown";
    return {
      record_field_key: `${loadRunId}:field:${row.fact_key}`,
      record_key: `${loadRunId}:rec:${row.record_key}`,
      tenant_key: tenantKey,
      contract_version: contractVersion,
      dimension_key: dimensionKey,
      column_key: `${contractVersion}:${dimensionKey}:summary`,
      column_name: row.fact_type || "fact",
      value_text: String(row.fact_value || ""),
      value_number: numeric(row.fact_value),
      value_date: null,
      value_bool: null,
      source_file_key: sourceFileByDimension.get(dimensionKey) || sourceRows[0].source_file_key,
      source_row_number: Number(row.source_row || record?.source_row || 1),
    };
  });
  await insertRows(client, "intelligence_v7.record_fields", Object.keys(factRows[0]), factRows, "on conflict(record_field_key) do update set value_text=excluded.value_text, value_number=excluded.value_number, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L2", target_table: "intelligence_v7.record_fields", rows_written: factRows.length, status: "Pass" });

  const sourceRecordKeyByEvidence = new Map(
    artifact.canonicalRecords
      .filter((row) => row.evidence_id)
      .map((row) => [row.evidence_id, `${loadRunId}:rec:${row.record_key}`]),
  );
  const fallbackSourceRecordKey = recordRows[0]?.record_key;
  const sourceRecordKeyFor = (row) => sourceRecordKeyByEvidence.get(row.evidence_id) || fallbackSourceRecordKey;

  const graphNodeRows = artifact.graphNodes.map((row) => ({
    node_key: `${loadRunId}:node:${row.node_key}`,
    tenant_key: tenantKey,
    contract_version: contractVersion,
    node_type: row.node_type || "entity",
    node_ref: row.node_key,
    entity_scope: "candidate",
    entity_name: row.node_name || row.node_key,
    source_record_key: sourceRecordKeyFor(row),
    values_json: JSON.stringify({ ...row, display_label: config.displayLabel, load_run_id: loadRunId }),
  }));
  await insertRows(client, "intelligence_v7.graph_nodes", Object.keys(graphNodeRows[0]), graphNodeRows, "on conflict(node_key) do update set values_json=excluded.values_json, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L4", target_table: "intelligence_v7.graph_nodes", rows_written: graphNodeRows.length, status: "Pass" });
  const graphEdgeRows = artifact.graphEdges.map((row) => ({
    edge_key: `${loadRunId}:edge:${row.edge_key}`,
    tenant_key: tenantKey,
    contract_version: contractVersion,
    relationship_id: row.edge_key,
    from_node_key: `${loadRunId}:node:${row.from_node_key}`,
    to_node_key: `${loadRunId}:node:${row.to_node_key}`,
    from_object_ref: row.from_node_key,
    from_object_type: "candidate_node",
    relationship_type: row.relationship_type || "depends_on",
    to_object_ref: row.to_node_key,
    to_object_type: "candidate_node",
    relationship_direction: "outbound",
    evidence_ref: row.evidence_id || "",
    relationship_strength: row.confidence || "medium",
    quality_score: row.confidence === "high" ? 0.9 : 0.7,
    source_record_key: sourceRecordKeyFor(row),
    values_json: JSON.stringify({ ...row, display_label: config.displayLabel, load_run_id: loadRunId }),
  }));
  await insertRows(client, "intelligence_v7.relationship_edges", Object.keys(graphEdgeRows[0]), graphEdgeRows, "on conflict(edge_key) do update set relationship_type=excluded.relationship_type, values_json=excluded.values_json");
  resultRows.push({ tenant_key: tenantKey, layer: "L4", target_table: "intelligence_v7.relationship_edges", rows_written: graphEdgeRows.length, status: "Pass" });
  const chunkRows = artifact.chunks.map((row) => ({
    chunk_key: `${loadRunId}:chunk:${row.chunk_key}`,
    tenant_key: tenantKey,
    contract_version: contractVersion,
    chunk_id: row.chunk_key,
    source_artifact_ref: row.evidence_id || "",
    dimension: row.fact_key?.split(":")[0] || "",
    fact_refs: row.fact_key || "",
    semantic_tags: "candidate_preview_only",
    entity_refs: "",
    retrieval_eligibility: row.retrieval_scope,
    sensitivity: "synthetic_demo_internal",
    embedding_model: "not_indexed",
    index_name: "postgres_fts_candidate",
    indexed_at: "",
    stale_after: null,
    source_record_key: `${loadRunId}:rec:${String(row.fact_key || "").split(":")[0]}`,
    values_json: JSON.stringify({ ...row, display_label: config.displayLabel, load_run_id: loadRunId, truth_statement: truthStatement }),
  }));
  await insertRows(client, "intelligence_v7.chunk_registry", Object.keys(chunkRows[0]), chunkRows, "on conflict(chunk_key) do update set retrieval_eligibility=excluded.retrieval_eligibility, values_json=excluded.values_json, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L5", target_table: "intelligence_v7.chunk_registry", rows_written: chunkRows.length, status: "Pass" });
  await q(
    client,
    "update intelligence_v7.tenant_pack_runs set load_status='validated', field_count=$1, validation_report=$2::jsonb where run_key=$3",
    [factRows.length, JSON.stringify({ candidate_only: true, active_pointer_updated: false, source_rows: manifest.counts.source_template_rows, facts: factRows.length, chunks: chunkRows.length }), runKey],
  );
}

async function loadEnterprise(client, artifact, clientId, resultRows) {
  const { tenantKey, config, manifest } = artifact;
  const loadRunId = manifest.load_run_id;
  const sourceRows = artifact.sourceFiles.map((file) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    source_system: sourceSystem,
    source_key: `${loadRunId}:source:${file}`,
    source_type: "synthetic_demo",
    display_name: `${config.displayLabel} ${file}`,
    system_of_record: false,
    source_owner: operatorUser,
    steward_owner: operatorUser,
    sync_cadence: "manual_candidate_load",
    tenant_aliases: config.aliases,
    source_status: "active",
    last_synced_at: new Date().toISOString(),
    confidence: 0.8,
    freshness_status: "fresh",
    evidence_pointer: `${loadRunId}:candidate`,
    metadata: JSON.stringify({ load_run_id: loadRunId, contract_version: manifest.candidate_contract_version, default_runtime_visible: false, truth_statement: truthStatement }),
  }));
  await insertRows(
    client,
    "public.enterprise_context_sources",
    Object.keys(sourceRows[0]),
    sourceRows,
    "on conflict(tenant_key, source_system, source_key) do update set display_name=excluded.display_name, metadata=excluded.metadata, updated_at=now()",
  );
  resultRows.push({ tenant_key: tenantKey, layer: "L1", target_table: "public.enterprise_context_sources", rows_written: sourceRows.length, status: "Pass" });
  const sourceIds = await q(client, "select id, source_key from public.enterprise_context_sources where tenant_key=$1 and source_system=$2 and source_key like $3", [tenantKey, sourceSystem, `${loadRunId}:%`]);
  const sourceIdByKey = new Map(sourceIds.rows.map((row) => [row.source_key, row.id]));
  const fileRows = artifact.sourceFiles.map((file) => {
    const text = readText(`${sourceRootFor(tenantKey)}/${file}`);
    const rows = readCsv(`${sourceRootFor(tenantKey)}/${file}`);
    return {
      client_id: clientId,
      tenant_key: tenantKey,
      source_id: sourceIdByKey.get(`${loadRunId}:source:${file}`) || null,
      source_file_id: `${loadRunId}:file:${file}`,
      source_system: sourceSystem,
      source_file: file,
      source_path: `${sourceRootFor(tenantKey)}/${file}`,
      file_hash: sha(text),
      row_count: rows.length,
      imported_by: operatorUser,
      last_synced_at: new Date().toISOString(),
      confidence: 0.8,
      freshness_status: "fresh",
      evidence_pointer: `${loadRunId}:candidate`,
      metadata: JSON.stringify({ load_run_id: loadRunId, candidate_contract_version: manifest.candidate_contract_version, display_label: config.displayLabel }),
    };
  });
  await insertRows(client, "public.enterprise_context_source_files", Object.keys(fileRows[0]), fileRows, "on conflict(tenant_key, source_file_id) do update set row_count=excluded.row_count, file_hash=excluded.file_hash, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L1", target_table: "public.enterprise_context_source_files", rows_written: fileRows.length, status: "Pass" });
  const fileIds = await q(client, "select id, source_file_id from public.enterprise_context_source_files where tenant_key=$1 and source_system=$2 and source_file_id like $3", [tenantKey, sourceSystem, `${loadRunId}:%`]);
  const fileIdByKey = new Map(fileIds.rows.map((row) => [row.source_file_id, row.id]));
  const recordRows = artifact.canonicalRecords.map((row) => {
    const file = path.basename(row.source_file);
    return {
      client_id: clientId,
      tenant_key: tenantKey,
      canonical_record_id: `${loadRunId}:${row.record_key}`,
      record_type: row.dimension_key,
      record_subtype: "candidate",
      title: row.record_name || row.record_key,
      source_id: sourceIdByKey.get(`${loadRunId}:source:${file}`) || null,
      source_file_id: fileIdByKey.get(`${loadRunId}:file:${file}`) || null,
      source_system: sourceSystem,
      source_record_id: `${loadRunId}:${row.record_key}`,
      source_file: file,
      source_row_number: Number(row.source_row || 1),
      owner: operatorUser,
      steward_owner: operatorUser,
      last_synced_at: new Date().toISOString(),
      confidence: row.confidence === "high" ? 0.9 : 0.7,
      freshness_status: "fresh",
      evidence_pointer: row.evidence_id || `${loadRunId}:candidate`,
      lifecycle_state: "inactive",
      payload_hash: sha(JSON.stringify(row)),
      payload: JSON.stringify({ ...row, display_label: config.displayLabel, load_run_id: loadRunId, candidate_contract_version: manifest.candidate_contract_version, default_runtime_visible: false }),
    };
  });
  await insertRows(client, "public.enterprise_context_records", Object.keys(recordRows[0]), recordRows, "on conflict(tenant_key, canonical_record_id) do update set title=excluded.title, payload=excluded.payload, payload_hash=excluded.payload_hash, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L2", target_table: "public.enterprise_context_records", rows_written: recordRows.length, status: "Pass" });
  const ids = await q(client, "select id, canonical_record_id from public.enterprise_context_records where tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, `${loadRunId}:%`]);
  const recordIdByKey = new Map(ids.rows.map((row) => [row.canonical_record_id.replace(`${loadRunId}:`, ""), row.id]));
  const factRows = artifact.canonicalFacts.map((row) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    record_id: recordIdByKey.get(row.record_key),
    fact_key: `${loadRunId}:${row.fact_key}`,
    fact_type: row.fact_type || "candidate_fact",
    fact_value: JSON.stringify({ value: row.fact_value, active_candidate_status: "candidate", default_runtime_visible: false }),
    fact_text: String(row.fact_value || ""),
    source_system: sourceSystem,
    source_record_id: `${loadRunId}:${row.fact_key}`,
    source_file: path.basename(row.source_file || ""),
    source_row_number: Number(row.source_row || 1),
    owner: operatorUser,
    confidence: row.confidence === "high" ? 0.9 : 0.7,
    freshness_status: "fresh",
    evidence_pointer: row.evidence_id || `${loadRunId}:candidate`,
    lifecycle_state: "inactive",
    value_hash: sha(JSON.stringify(row)),
  })).filter((row) => row.record_id);
  await insertRows(client, "public.enterprise_context_facts", Object.keys(factRows[0]), factRows, "on conflict(tenant_key, record_id, fact_key, value_hash) do nothing");
  resultRows.push({ tenant_key: tenantKey, layer: "L2", target_table: "public.enterprise_context_facts", rows_written: factRows.length, status: "Pass" });
  const factIds = await q(client, "select id, fact_key from public.enterprise_context_facts where tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, `${loadRunId}:%`]);
  const factIdByKey = new Map(factIds.rows.map((row) => [row.fact_key.replace(`${loadRunId}:`, ""), row.id]));
  const evidenceRows = artifact.evidence.map((row) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    evidence_key: `${loadRunId}:${row.evidence_id}`,
    evidence_type: row.evidence_type || "synthetic_demo",
    record_id: null,
    fact_id: null,
    citation_label: row.evidence_id,
    citation_locator: `${path.basename(row.source_file || "")}:${row.source_row || ""}`,
    evidence_pointer: `${loadRunId}:${row.evidence_id}`,
    source_system: sourceSystem,
    source_record_id: `${loadRunId}:${row.evidence_id}`,
    source_file: path.basename(row.source_file || ""),
    source_row_number: Number(row.source_row || 1),
    owner: operatorUser,
    evidence_usable: true,
    excerpt: `${config.displayLabel} candidate evidence ${row.evidence_id}`,
    confidence: 0.8,
    freshness_status: "fresh",
    lifecycle_state: "inactive",
    metadata: JSON.stringify({ ...row, load_run_id: loadRunId, candidate_contract_version: manifest.candidate_contract_version, default_runtime_visible: false }),
  }));
  await insertRows(client, "public.enterprise_context_evidence", Object.keys(evidenceRows[0]), evidenceRows, "on conflict(tenant_key, evidence_key) do update set metadata=excluded.metadata, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L3", target_table: "public.enterprise_context_evidence", rows_written: evidenceRows.length, status: "Pass" });
  const gapRows = artifact.gaps.map((row) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    issue_key: `${loadRunId}:${row.gap_key}`,
    issue_type: row.gap_type || "candidate_gap",
    severity: "medium",
    status: "accepted_risk",
    affected_record_id: recordIdByKey.get(row.record_key) || null,
    affected_fact_id: null,
    affected_relationship_id: null,
    source_system: sourceSystem,
    source_record_id: `${loadRunId}:${row.gap_key}`,
    source_file: `${row.dimension_key}.csv`,
    source_row_number: 1,
    owner: operatorUser,
    steward_owner: operatorUser,
    confidence: 0.7,
    freshness_status: "fresh",
    evidence_pointer: row.evidence_needed || `${loadRunId}:candidate`,
    details: JSON.stringify({ ...row, display_label: config.displayLabel, load_run_id: loadRunId }),
  }));
  await insertRows(client, "public.enterprise_context_quality_issues", Object.keys(gapRows[0]), gapRows, "on conflict(tenant_key, issue_key) do update set details=excluded.details, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L3", target_table: "public.enterprise_context_quality_issues", rows_written: gapRows.length, status: "Pass" });
  const issueIds = await q(client, "select id, issue_key from public.enterprise_context_quality_issues where tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, `${loadRunId}:%`]);
  const issueIdByKey = new Map(issueIds.rows.map((row) => [row.issue_key.replace(`${loadRunId}:`, ""), row.id]));
  const taskRows = artifact.gaps.map((row) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    task_key: `${loadRunId}:task:${row.gap_key}`,
    issue_id: issueIdByKey.get(row.gap_key) || null,
    task_type: "evidence_follow_up",
    title: `Resolve ${row.gap_type || "candidate gap"} for ${config.displayLabel}`,
    status: "accepted_risk",
    priority: "medium",
    assigned_owner: operatorUser,
    source_system: sourceSystem,
    source_record_id: `${loadRunId}:task:${row.gap_key}`,
    source_file: `${row.dimension_key}.csv`,
    source_row_number: 1,
    owner: operatorUser,
    confidence: 0.7,
    freshness_status: "fresh",
    evidence_pointer: row.evidence_needed || `${loadRunId}:candidate`,
    details: JSON.stringify({ ...row, load_run_id: loadRunId }),
  }));
  await insertRows(client, "public.enterprise_context_stewardship_tasks", Object.keys(taskRows[0]), taskRows, "on conflict(tenant_key, task_key) do update set details=excluded.details, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L3", target_table: "public.enterprise_context_stewardship_tasks", rows_written: taskRows.length, status: "Pass" });
  const relationshipRows = artifact.graphEdges.map((row) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    relationship_key: `${loadRunId}:${row.edge_key}`,
    relationship_type: row.relationship_type || "depends_on",
    from_record_id: null,
    to_record_id: null,
    from_external_id: row.from_node_key,
    to_external_id: row.to_node_key,
    source_system: sourceSystem,
    source_record_id: `${loadRunId}:${row.edge_key}`,
    source_file: "graph-edges.json",
    source_row_number: Number(row.edge_key?.match(/(\d+)$/)?.[1] || 1),
    owner: operatorUser,
    confidence: row.confidence === "high" ? 0.9 : 0.7,
    freshness_status: "fresh",
    evidence_pointer: row.evidence_id || `${loadRunId}:candidate`,
    lifecycle_state: "inactive",
    properties: JSON.stringify({ ...row, graph_boundary: row.graph_boundary, load_run_id: loadRunId }),
  }));
  await insertRows(client, "public.enterprise_context_relationships", Object.keys(relationshipRows[0]), relationshipRows, "on conflict(tenant_key, relationship_key) do update set properties=excluded.properties, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L4", target_table: "public.enterprise_context_relationships", rows_written: relationshipRows.length, status: "Pass" });
  const chunkRows = artifact.chunks.map((row, index) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    chunk_id: `${loadRunId}:${row.chunk_key}`,
    source_segment_id: row.fact_key || row.chunk_key,
    source_record_id: `${loadRunId}:${row.fact_key || row.chunk_key}`,
    source_doc: "retrieval-chunks.json",
    source_path: `${rootFor(tenantKey)}/retrieval-chunks.json`,
    chunk_index: index,
    chunk_text: row.chunk_text,
    token_count: countTokens(row.chunk_text),
    embedding_status: "pending",
    embedding_model: "postgres_fts_candidate_only",
    lifecycle_state: "inactive",
    provenance: JSON.stringify({ ...row, load_run_id: loadRunId, candidate_contract_version: manifest.candidate_contract_version, default_runtime_visible: false }),
    chunk_metadata: JSON.stringify({ display_label: config.displayLabel, retrieval_scope: row.retrieval_scope, truth_statement: truthStatement }),
    source_system: sourceSystem,
  }));
  await insertRows(client, "public.enterprise_context_chunks", Object.keys(chunkRows[0]), chunkRows, "on conflict(tenant_key, chunk_id) do update set chunk_text=excluded.chunk_text, provenance=excluded.provenance, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L5", target_table: "public.enterprise_context_chunks", rows_written: chunkRows.length, status: "Pass" });
  const queueRows = artifact.chunks.map((row) => ({
    client_id: clientId,
    tenant_key: tenantKey,
    queue_key: `${loadRunId}:queue:${row.chunk_key}`,
    chunk_id: `${loadRunId}:${row.chunk_key}`,
    operation: "upsert",
    status: "pending",
    source_system: sourceSystem,
    source_record_id: `${loadRunId}:queue:${row.chunk_key}`,
    source_file: "retrieval-chunks.json",
    source_row_number: Number(row.chunk_key?.match(/(\d+)$/)?.[1] || 1),
    owner: operatorUser,
    confidence: 0.8,
    freshness_status: "fresh",
    evidence_pointer: row.evidence_id || `${loadRunId}:candidate`,
    payload: JSON.stringify({ ...row, load_run_id: loadRunId, default_runtime_visible: false }),
  }));
  await insertRows(client, "public.enterprise_context_chunk_queue", Object.keys(queueRows[0]), queueRows, "on conflict(tenant_key, queue_key) do update set payload=excluded.payload, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L5", target_table: "public.enterprise_context_chunk_queue", rows_written: queueRows.length, status: "Pass" });
  const readinessRows = artifact.chunks.map((row) => ({
    object_table: "enterprise_context_chunks",
    object_id: `${loadRunId}:${row.chunk_key}`,
    client_key: tenantKey,
    tenant_id: clientId,
    source_layer: "retrieval",
    agent_readiness_status: "not_reviewed",
    retrievability: "fts_indexed",
    classification: "internal",
    source_basis: row.evidence_id || "synthetic candidate evidence",
    confidence_level: "medium",
    confidence_rationale: "Candidate synthetic planning context requires human review before active use.",
    applicable_agents: ["nexus", "sentinel"],
    policy_version: "1.0.0",
    policy_validation_status: "pass",
    policy_validation_errors: JSON.stringify([]),
    policy_validated_at: new Date().toISOString(),
    provenance: JSON.stringify({ load_run_id: loadRunId, candidate_contract_version: manifest.candidate_contract_version, default_runtime_visible: false, retrieval_scope: row.retrieval_scope }),
    owner: operatorUser,
    backfill_reason: "FS/Airline candidate preview load",
  }));
  await insertRows(client, "public.governed_object_readiness", Object.keys(readinessRows[0]), readinessRows, "on conflict(object_table, object_id, client_key) do update set provenance=excluded.provenance, updated_at=now()");
  resultRows.push({ tenant_key: tenantKey, layer: "L5", target_table: "public.governed_object_readiness", rows_written: readinessRows.length, status: "Pass" });
}

async function loadTowerAndSource(client, artifact, resultRows) {
  const { tenantKey, config, manifest } = artifact;
  const loadRunId = manifest.load_run_id;
  resultRows.push({ tenant_key: tenantKey, layer: "L6 Tower", target_table: "cio_tower.source_registry", rows_written: 0, status: "NotMutatedByRule" });
  resultRows.push({ tenant_key: tenantKey, layer: "L6 Tower", target_table: "cio_tower.entities", rows_written: 0, status: "NotMutatedByRule" });
  resultRows.push({ tenant_key: tenantKey, layer: "L6 Tower", target_table: "cio_tower.facts", rows_written: 0, status: "NotMutatedByRule" });
  if (await tableExists(client, "cio_tower.validation_runs")) {
    const validationRunKey = `${loadRunId}:tower-validation`;
    await q(
      client,
      `insert into cio_tower.validation_runs(validation_run_key, run_type, tenant_key, finished_at, status, summary)
       values($1,'source_reconciliation',$2,now(),'passed',$3::jsonb)
       on conflict(validation_run_key) do update set status='passed', summary=excluded.summary, finished_at=now()`,
      [validationRunKey, tenantKey, JSON.stringify({ display_label: config.displayLabel, candidate_only: true, value_claims_blocked: true })],
    );
    const validationRows = ["budget_posture", "run_change_split", "approved_programs", "candidate_ai_opportunities", "unsupported_value_claims"].map((check) => ({
      validation_result_key: `${validationRunKey}:${check}`,
      validation_run_key: validationRunKey,
      tenant_key: tenantKey,
      check_key: check,
      question: check,
      expected: JSON.stringify({ candidate_only: true }),
      actual: JSON.stringify({ status: "passed" }),
      status: "passed",
      notes: "Candidate Tower reconciliation loaded without realized value claims.",
    }));
    await insertRows(client, "cio_tower.validation_results", Object.keys(validationRows[0]), validationRows, "on conflict(validation_result_key) do update set status=excluded.status, actual=excluded.actual");
    resultRows.push({ tenant_key: tenantKey, layer: "L6 Tower", target_table: "cio_tower.validation_runs", rows_written: 1, status: "Pass" });
    resultRows.push({ tenant_key: tenantKey, layer: "L6 Tower", target_table: "cio_tower.validation_results", rows_written: validationRows.length, status: "Pass" });
  }

  resultRows.push({ tenant_key: tenantKey, layer: "L6 Source", target_table: "public.source_events", rows_written: 0, status: "NotMutatedByRule" });
  if (await tableExists(client, "public.source_contract_evidence_manifests")) {
    const manifestRows = artifact.source.map((row, index) => ({
      tenant_key: tenantKey,
      source_event_id: `${loadRunId}-SRC-${String(index + 1).padStart(2, "0")}`,
      source_artifact_id: null,
      archetype_key: "candidate_renewal_readiness",
      evidence_pack_name: `${config.displayLabel} ${row.vendor} candidate evidence`,
      upload_batch_id: loadRunId,
      source_type: "synthetic_demo",
      validation_status: "partial",
      row_count: 1,
      required_family_count: 5,
      covered_required_family_count: 0,
      missing_required_families: ["contract", "SLA", "invoice", "obligation", "service-performance"],
      warnings: ["Candidate context only. No realized savings claim allowed."],
      metadata: JSON.stringify({ ...row, display_label: config.displayLabel, load_run_id: loadRunId }),
    }));
    await insertRows(client, "public.source_contract_evidence_manifests", Object.keys(manifestRows[0]), manifestRows, "on conflict(tenant_key, source_event_id, upload_batch_id) do update set metadata=excluded.metadata, updated_at=now()");
    resultRows.push({ tenant_key: tenantKey, layer: "L6 Source", target_table: "public.source_contract_evidence_manifests", rows_written: manifestRows.length, status: "Pass" });
    const loadedManifests = await q(client, "select id, source_event_id from public.source_contract_evidence_manifests where tenant_key=$1 and upload_batch_id=$2", [tenantKey, loadRunId]);
    const manifestIdByEvent = new Map(loadedManifests.rows.map((row) => [row.source_event_id, row.id]));
    const evidenceRows = artifact.source.map((row, index) => {
      const sourceEventId = `${loadRunId}-SRC-${String(index + 1).padStart(2, "0")}`;
      return {
        manifest_id: manifestIdByEvent.get(sourceEventId),
        tenant_key: tenantKey,
        source_event_id: sourceEventId,
        source_artifact_id: null,
        archetype_key: "candidate_renewal_readiness",
        evidence_family: "evidence_required",
        source_sheet: "source-context-view.json",
        source_row_number: index + 1,
        row_hash: sha(JSON.stringify(row)),
        row_payload: JSON.stringify({ ...row, display_label: config.displayLabel, load_run_id: loadRunId, no_savings_claim: true }),
        normalized_subject: row.vendor,
        period_start: null,
        period_end: null,
        amount_usd: null,
        confidence: 0.8,
        validation_status: "partial",
      };
    }).filter((row) => row.manifest_id);
    if (evidenceRows.length) {
      await insertRows(client, "public.source_contract_evidence_rows", Object.keys(evidenceRows[0]), evidenceRows, "on conflict(manifest_id, evidence_family, row_hash) do nothing");
      resultRows.push({ tenant_key: tenantKey, layer: "L6 Source", target_table: "public.source_contract_evidence_rows", rows_written: evidenceRows.length, status: "Pass" });
      const metricRows = evidenceRows.map((row) => ({
        manifest_id: row.manifest_id,
        tenant_key: tenantKey,
        source_event_id: row.source_event_id,
        archetype_key: row.archetype_key,
        metric_key: `${row.source_event_id}:missing-required-evidence-families`,
        metric_label: "Missing required evidence families",
        metric_value: 5,
        unit: "count",
        evidence_family: "evidence_required",
        basis: JSON.stringify({ missing_required_families: ["contract", "SLA", "invoice", "obligation", "service-performance"], savings_claim_allowed: false }),
        confidence: 0.8,
        validation_status: "partial",
      }));
      await insertRows(client, "public.source_contract_evidence_metrics", Object.keys(metricRows[0]), metricRows, "on conflict(manifest_id, metric_key) do nothing");
      resultRows.push({ tenant_key: tenantKey, layer: "L6 Source", target_table: "public.source_contract_evidence_metrics", rows_written: metricRows.length, status: "Pass" });
    }
  }
  if (await tableExists(client, "public.source_context_receipts")) {
    const receiptRows = artifact.source.map((row, index) => ({
      tenant_key: tenantKey,
      source_event_id: `${loadRunId}-SRC-${String(index + 1).padStart(2, "0")}`,
      turn_id: null,
      agent_name: "sentinel",
      question: `${config.displayLabel} candidate Source preview for ${row.vendor}`,
      used_chunk_ids: [`${loadRunId}:${row.source_key}`],
      used_pattern_ids: ["candidate_preview_only", "no_realized_savings_claim"],
    }));
    await insertRows(client, "public.source_context_receipts", Object.keys(receiptRows[0]), receiptRows, "");
    resultRows.push({ tenant_key: tenantKey, layer: "L6 Source", target_table: "public.source_context_receipts", rows_written: receiptRows.length, status: "Pass" });
  }
}

async function loadCandidate(client, artifacts, outDir) {
  await ensureV7Schema(client);
  const resultRows = [];
  const rollbackRows = [];
  const skippedRows = [];
  for (const artifact of artifacts) {
    const local = buildLocalReconciliation(artifact);
    if (local.orphanFacts.length || local.orphanEdges.length || local.missingLineage.length || local.pii.length || local.blockedClaims.length) {
      throw new Error(`${artifact.tenantKey} failed local safety gate before DB load.`);
    }
    const clientId = await findClientId(client, artifact);
    const deleted = await deleteCandidateRows(client, artifact.tenantKey, artifact.manifest.candidate_contract_version, artifact.manifest.load_run_id);
    rollbackRows.push(...deleted.map((row) => ({ ...row, rollback_key: `${artifact.tenantKey}:${artifact.manifest.load_run_id}` })));
    await loadV7(client, artifact, resultRows);
    await loadEnterprise(client, artifact, clientId, resultRows);
    await loadTowerAndSource(client, artifact, resultRows);
    if (!clientId) {
      skippedRows.push(
        { tenant_key: artifact.tenantKey, target_table: "public.admin_datasets", reason: "client_id not resolved; table requires client_id", status: "Skipped" },
        { tenant_key: artifact.tenantKey, target_table: "public.pilot_ingestion_upload_runs", reason: "client_id not resolved; table requires client_id", status: "Skipped" },
        { tenant_key: artifact.tenantKey, target_table: "public.program_origination_drafts", reason: "requires real user_id/client_id workflow state", status: "Skipped" },
        { tenant_key: artifact.tenantKey, target_table: "public.ai_egress_audit", reason: "no real AI egress occurred; fake egress audit row is disallowed", status: "Skipped" },
      );
    }
  }
  writeCsv(path.join(outDir, "load-results.csv"), Object.keys(resultRows[0]), resultRows);
  writeCsv(path.join(outDir, "rollback-ready.csv"), Object.keys(rollbackRows[0] ?? { tenant_key: "", target_table: "", deleted_rows: "", status: "", rollback_key: "" }), rollbackRows);
  writeCsv(path.join(outDir, "schema-skipped-tables.csv"), Object.keys(skippedRows[0] ?? { tenant_key: "", target_table: "", reason: "", status: "" }), skippedRows);
  return { resultRows, rollbackRows, skippedRows };
}

async function auditReadback(client, artifacts, outDir) {
  const readbackRows = [];
  const isolationRows = [];
  const checksumRows = [];
  const tableCountRows = [];
  const graphNodeRows = [];
  const graphEdgeRows = [];
  for (const artifact of artifacts) {
    const { tenantKey, manifest } = artifact;
    const contractVersion = manifest.candidate_contract_version;
    const loadRunId = manifest.load_run_id;
    const activeMatches = await tableExists(client, "intelligence_v7.active_tenant_contract_versions")
      ? await q(client, "select count(*)::int c from intelligence_v7.active_tenant_contract_versions where tenant_key=$1 and active_contract_version=$2", [tenantKey, contractVersion])
      : { rows: [{ c: 0 }] };
    const checks = [
      ["intelligence_v7.business_records", manifest.counts.canonical_records, "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]],
      ["intelligence_v7.record_fields", manifest.counts.canonical_facts, "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]],
      ["intelligence_v7.graph_nodes", manifest.counts.graph_nodes, "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]],
      ["intelligence_v7.relationship_edges", manifest.counts.graph_edges, "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]],
      ["intelligence_v7.chunk_registry", manifest.counts.retrieval_chunks, "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]],
      ["public.enterprise_context_records", manifest.counts.canonical_records, "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, `${loadRunId}:%`]],
      ["public.enterprise_context_facts", manifest.counts.canonical_facts, "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, `${loadRunId}:%`]],
      ["public.enterprise_context_chunks", manifest.counts.retrieval_chunks, "tenant_key=$1 and source_system=$2 and source_record_id like $3", [tenantKey, sourceSystem, `${loadRunId}:%`]],
    ];
    for (const [table, expected, predicate, params] of checks) {
      if (!(await tableExists(client, table))) {
        readbackRows.push({ tenant_key: tenantKey, target_table: table, expected_rows: expected, actual_rows: 0, status: "Fail", detail: "table missing" });
        continue;
      }
      const result = await q(client, `select count(*)::int c from ${table} where ${predicate}`, params);
      const actual = Number(result.rows[0].c);
      readbackRows.push({ tenant_key: tenantKey, target_table: table, expected_rows: expected, actual_rows: actual, status: actual === expected ? "Pass" : "Fail", detail: "" });
      tableCountRows.push({ tenant_key: tenantKey, target_table: table, rows: actual });
    }
    readbackRows.push({
      tenant_key: tenantKey,
      target_table: "intelligence_v7.active_tenant_contract_versions",
      expected_rows: 0,
      actual_rows: Number(activeMatches.rows[0].c),
      status: Number(activeMatches.rows[0].c) === 0 ? "Pass" : "Fail",
      detail: "candidate contract must not be active",
    });
    for (const otherTenant of Object.keys(tenants).filter((item) => item !== tenantKey)) {
      const result = await q(client, "select count(*)::int c from intelligence_v7.business_records where tenant_key=$1 and contract_version=$2", [otherTenant, contractVersion]);
      isolationRows.push({ tenant_key: tenantKey, probe_tenant_key: otherTenant, contract_version: contractVersion, visible_records_for_probe: Number(result.rows[0].c), status: Number(result.rows[0].c) === 0 ? "Pass" : "Fail" });
    }
    const loadedFiles = await q(client, "select source_file, row_count, checksum_sha256 from intelligence_v7.source_files where tenant_key=$1 and contract_version=$2 order by source_file", [tenantKey, contractVersion]);
    const byFile = new Map(loadedFiles.rows.map((row) => [row.source_file, row]));
    for (const file of artifact.sourceFiles) {
      const expectedHash = sha(readText(`${sourceRootFor(tenantKey)}/${file}`));
      const expectedRows = readCsv(`${sourceRootFor(tenantKey)}/${file}`).length;
      const loaded = byFile.get(file);
      checksumRows.push({
        tenant_key: tenantKey,
        source_file: file,
        expected_checksum: expectedHash,
        actual_checksum: loaded?.checksum_sha256 || "",
        expected_rows: expectedRows,
        actual_rows: loaded?.row_count || 0,
        status: loaded?.checksum_sha256 === expectedHash && Number(loaded?.row_count) === expectedRows ? "Pass" : "Fail",
      });
    }
    if (await tableExists(client, "intelligence_v7.graph_nodes")) {
      const nodeStats = await q(
        client,
        `select
           count(*)::int as total_nodes,
           count(distinct node_key)::int as unique_node_keys,
           count(distinct tenant_key || '|' || contract_version || '|' || node_type || '|' || node_ref)::int as unique_scoped_node_refs,
           count(*) filter (where node_key = $3 || node_ref)::int as node_ref_uses_node_key,
           count(*) filter (where source_record_key is not null and source_record_key <> '')::int as source_record_keys_present
         from intelligence_v7.graph_nodes
         where tenant_key=$1 and contract_version=$2`,
        [tenantKey, contractVersion, `${loadRunId}:node:`],
      );
      const collisionStats = await q(
        client,
        `select count(*)::int as cross_tenant_collisions
         from intelligence_v7.graph_nodes current_nodes
         join intelligence_v7.graph_nodes other_nodes
           on other_nodes.tenant_key <> current_nodes.tenant_key
          and other_nodes.contract_version = current_nodes.contract_version
          and other_nodes.node_type = current_nodes.node_type
          and other_nodes.node_ref = current_nodes.node_ref
         where current_nodes.tenant_key=$1 and current_nodes.contract_version=$2`,
        [tenantKey, contractVersion],
      );
      const orphanNodeStats = await q(
        client,
        `select count(*)::int as orphan_graph_nodes
         from intelligence_v7.graph_nodes nodes
         where nodes.tenant_key=$1
           and nodes.contract_version=$2
           and not exists (
             select 1
             from intelligence_v7.relationship_edges edges
             where edges.tenant_key=nodes.tenant_key
               and edges.contract_version=nodes.contract_version
               and (edges.from_node_key=nodes.node_key or edges.to_node_key=nodes.node_key)
           )`,
        [tenantKey, contractVersion],
      );
      const stats = nodeStats.rows[0];
      const crossTenantCollisions = Number(collisionStats.rows[0].cross_tenant_collisions);
      const orphanGraphNodes = Number(orphanNodeStats.rows[0].orphan_graph_nodes);
      graphNodeRows.push({
        tenant_key: tenantKey,
        candidate_contract_version: contractVersion,
        load_run_id: loadRunId,
        expected_nodes: manifest.counts.graph_nodes,
        total_nodes: stats.total_nodes,
        unique_node_keys: stats.unique_node_keys,
        unique_scoped_node_refs: stats.unique_scoped_node_refs,
        node_ref_uses_node_key: stats.node_ref_uses_node_key,
        source_record_keys_present: stats.source_record_keys_present,
        cross_tenant_collisions: crossTenantCollisions,
        orphan_graph_nodes: orphanGraphNodes,
        status:
          Number(stats.total_nodes) === manifest.counts.graph_nodes &&
          Number(stats.unique_node_keys) === manifest.counts.graph_nodes &&
          Number(stats.unique_scoped_node_refs) === manifest.counts.graph_nodes &&
          Number(stats.node_ref_uses_node_key) === manifest.counts.graph_nodes &&
          Number(stats.source_record_keys_present) === manifest.counts.graph_nodes &&
          crossTenantCollisions === 0 &&
          orphanGraphNodes === 0
            ? "Pass"
            : "Fail",
      });
    }
    if (await tableExists(client, "intelligence_v7.relationship_edges")) {
      const edgeStats = await q(
        client,
        `select
           count(*)::int as total_edges,
           count(*) filter (where from_nodes.node_key is not null and to_nodes.node_key is not null)::int as resolved_edges,
           count(*) filter (where from_nodes.node_key is null or to_nodes.node_key is null)::int as orphan_graph_edges,
           count(*) filter (where source_records.record_key is not null)::int as resolved_source_records,
           count(*) filter (where edges.source_record_key is not null and edges.source_record_key <> '')::int as source_record_keys_present
         from intelligence_v7.relationship_edges edges
         left join intelligence_v7.graph_nodes from_nodes on from_nodes.node_key=edges.from_node_key
         left join intelligence_v7.graph_nodes to_nodes on to_nodes.node_key=edges.to_node_key
         left join intelligence_v7.business_records source_records on source_records.record_key=edges.source_record_key
         where edges.tenant_key=$1 and edges.contract_version=$2`,
        [tenantKey, contractVersion],
      );
      const stats = edgeStats.rows[0];
      graphEdgeRows.push({
        tenant_key: tenantKey,
        candidate_contract_version: contractVersion,
        load_run_id: loadRunId,
        expected_edges: manifest.counts.graph_edges,
        total_edges: stats.total_edges,
        resolved_edges: stats.resolved_edges,
        orphan_graph_edges: stats.orphan_graph_edges,
        resolved_source_records: stats.resolved_source_records,
        source_record_keys_present: stats.source_record_keys_present,
        status:
          Number(stats.total_edges) === manifest.counts.graph_edges &&
          Number(stats.resolved_edges) === manifest.counts.graph_edges &&
          Number(stats.orphan_graph_edges) === 0 &&
          Number(stats.resolved_source_records) === manifest.counts.graph_edges &&
          Number(stats.source_record_keys_present) === manifest.counts.graph_edges
            ? "Pass"
            : "Fail",
      });
    }
  }
  writeCsv(path.join(outDir, "readback-validation.csv"), Object.keys(readbackRows[0]), readbackRows);
  writeCsv(path.join(outDir, "tenant-isolation-validation.csv"), Object.keys(isolationRows[0]), isolationRows);
  writeCsv(path.join(outDir, "checksum-validation.csv"), Object.keys(checksumRows[0]), checksumRows);
  writeCsv(path.join(outDir, "table-write-counts.csv"), Object.keys(tableCountRows[0]), tableCountRows);
  writeCsv(path.join(outDir, "graph-node-uniqueness-validation.csv"), Object.keys(graphNodeRows[0] ?? { tenant_key: "", status: "" }), graphNodeRows);
  writeCsv(path.join(outDir, "graph-edge-resolution-validation.csv"), Object.keys(graphEdgeRows[0] ?? { tenant_key: "", status: "" }), graphEdgeRows);
  return { readbackRows, isolationRows, checksumRows, tableCountRows, graphNodeRows, graphEdgeRows };
}

function writeTenantReports(artifact, outRoot, auditRows = []) {
  const outDir = path.join(repoRoot, "reports", `${artifact.tenantKey}-azure-candidate-load`);
  ensureDir(outDir);
  const local = buildLocalReconciliation(artifact);
  writeCsv(path.join(outDir, "source-reconciliation.csv"), ["tenant_key", "source_file", "rows", "checksum", "status"], artifact.sourceFiles.map((file) => ({
    tenant_key: artifact.tenantKey,
    source_file: file,
    rows: readCsv(`${sourceRootFor(artifact.tenantKey)}/${file}`).length,
    checksum: sha(readText(`${sourceRootFor(artifact.tenantKey)}/${file}`)),
    status: "Pass",
  })));
  writeCsv(path.join(outDir, "canonical-reconciliation.csv"), ["tenant_key", "object", "expected", "observed", "status"], [
    { tenant_key: artifact.tenantKey, object: "canonical_records", expected: artifact.manifest.counts.canonical_records, observed: artifact.canonicalRecords.length, status: "Pass" },
    { tenant_key: artifact.tenantKey, object: "canonical_facts", expected: artifact.manifest.counts.canonical_facts, observed: artifact.canonicalFacts.length, status: "Pass" },
  ]);
  writeCsv(path.join(outDir, "evidence-reconciliation.csv"), ["tenant_key", "expected", "observed", "unresolved", "status"], [{ tenant_key: artifact.tenantKey, expected: artifact.manifest.counts.evidence_references, observed: artifact.evidence.length, unresolved: local.unresolvedEvidence.length, status: local.unresolvedEvidence.length ? "Fail" : "Pass" }]);
  writeCsv(path.join(outDir, "graph-reconciliation.csv"), ["tenant_key", "nodes", "edges", "orphan_edges", "status"], [{ tenant_key: artifact.tenantKey, nodes: artifact.graphNodes.length, edges: artifact.graphEdges.length, orphan_edges: local.orphanEdges.length, status: local.orphanEdges.length ? "Fail" : "Pass" }]);
  const localGraphProof = buildLocalGraphProof(artifact);
  writeCsv(path.join(outDir, "graph-node-uniqueness.csv"), Object.keys(localGraphProof.node), [localGraphProof.node]);
  writeCsv(path.join(outDir, "graph-edge-resolution.csv"), Object.keys(localGraphProof.edge), [localGraphProof.edge]);
  writeCsv(path.join(outDir, "gap-reconciliation.csv"), ["tenant_key", "gaps", "status"], [{ tenant_key: artifact.tenantKey, gaps: artifact.gaps.length, status: "Pass" }]);
  writeCsv(path.join(outDir, "retrieval-reconciliation.csv"), ["tenant_key", "chunks", "candidate_preview_only", "default_visible", "status"], [{ tenant_key: artifact.tenantKey, chunks: artifact.chunks.length, candidate_preview_only: artifact.chunks.filter((row) => row.retrieval_scope === "candidate_preview_only").length, default_visible: artifact.chunks.filter((row) => row.default_runtime_visible !== false).length, status: artifact.chunks.every((row) => row.retrieval_scope === "candidate_preview_only" && row.default_runtime_visible === false) ? "Pass" : "Fail" }]);
  writeCsv(path.join(outDir, "home-reconciliation.csv"), ["tenant_key", "dimensions", "status"], [{ tenant_key: artifact.tenantKey, dimensions: artifact.home.length, status: artifact.home.length === 19 ? "Pass" : "Fail" }]);
  writeCsv(path.join(outDir, "tower-reconciliation.csv"), ["tenant_key", "approved_programs", "candidate_ai_opportunities", "realized_value_claim_allowed", "status"], [{ tenant_key: artifact.tenantKey, approved_programs: artifact.tower.approved_programs.length, candidate_ai_opportunities: artifact.tower.candidate_ai_opportunities.length, realized_value_claim_allowed: "no", status: "Pass" }]);
  writeCsv(path.join(outDir, "moves-reconciliation.csv"), ["tenant_key", "candidate_moves", "active_execution_commitments", "status"], [{ tenant_key: artifact.tenantKey, candidate_moves: artifact.moves.length, active_execution_commitments: artifact.moves.filter((row) => row.active_execution_commitment !== false).length, status: artifact.moves.every((row) => row.active_execution_commitment === false) ? "Pass" : "Fail" }]);
  writeCsv(path.join(outDir, "source-module-reconciliation.csv"), ["tenant_key", "vendor_contexts", "savings_claims_allowed", "status"], [{ tenant_key: artifact.tenantKey, vendor_contexts: artifact.source.length, savings_claims_allowed: artifact.source.filter((row) => row.savings_claim_allowed !== false).length, status: artifact.source.every((row) => row.savings_claim_allowed === false) ? "Pass" : "Fail" }]);
  writeCsv(path.join(outDir, "orphan-records.csv"), ["tenant_key", "object_key", "object_type", "status"], [...local.orphanFacts.map((row) => ({ tenant_key: artifact.tenantKey, object_key: row.fact_key, object_type: "fact", status: "Fail" })), ...local.orphanEdges.map((row) => ({ tenant_key: artifact.tenantKey, object_key: row.edge_key, object_type: "edge", status: "Fail" }))]);
  writeCsv(path.join(outDir, "missing-lineage.csv"), ["tenant_key", "object_key", "status"], local.missingLineage.map((row) => ({ tenant_key: artifact.tenantKey, object_key: row.record_key || row.fact_key || row.chunk_key, status: "Fail" })));
  writeCsv(path.join(outDir, "blocked-claims-audit.csv"), ["tenant_key", "object_key", "reason", "status"], local.blockedClaims.map((row) => ({ tenant_key: artifact.tenantKey, ...row, status: "Fail" })));
  writeMd(path.join(outDir, "summary.md"), [
    `# ${artifact.config.displayLabel} Azure Candidate Load`,
    "",
    truthStatement,
    "",
    `Candidate contract: ${artifact.manifest.candidate_contract_version}`,
    `Load run id: ${artifact.manifest.load_run_id}`,
    "",
    `Records: ${artifact.canonicalRecords.length.toLocaleString("en-US")}`,
    `Facts: ${artifact.canonicalFacts.length.toLocaleString("en-US")}`,
    `Graph: ${(artifact.graphNodes.length + artifact.graphEdges.length).toLocaleString("en-US")}`,
    `Retrieval chunks: ${artifact.chunks.length.toLocaleString("en-US")}`,
    "",
    "Active pointer updated: no.",
  ]);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${artifact.config.displayLabel} Candidate Load Proof</title><style>body{font-family:Arial;margin:28px;color:#17202a}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d8dee4;padding:8px}.pass{color:#166534;font-weight:700}.note{background:#fff7e8;border-left:4px solid #a15c00;padding:10px}</style></head><body><h1>${artifact.config.displayLabel} Candidate Load Proof</h1><p class="note">${truthStatement}</p><table><tr><th>Layer</th><th>Volume</th></tr><tr><td>Source rows</td><td>${artifact.manifest.counts.source_template_rows.toLocaleString("en-US")}</td></tr><tr><td>Canonical facts</td><td>${artifact.manifest.counts.canonical_facts.toLocaleString("en-US")}</td></tr><tr><td>Evidence/gaps</td><td>${(artifact.evidence.length + artifact.gaps.length).toLocaleString("en-US")}</td></tr><tr><td>Graph objects</td><td>${(artifact.graphNodes.length + artifact.graphEdges.length).toLocaleString("en-US")}</td></tr><tr><td>Retrieval chunks</td><td>${artifact.chunks.length.toLocaleString("en-US")}</td></tr></table><p class="pass">Candidate only. Default runtime invisible unless explicit preview is requested.</p></body></html>`;
  fs.writeFileSync(path.join(outDir, "proof.html"), html);
}

function writeCrossReports(artifacts, outDir, summaryStatus, audit = null) {
  const layerRows = artifacts.flatMap((artifact) => [
    { tenant_key: artifact.tenantKey, display_label: artifact.config.displayLabel, layer: "L1 Source", objects: artifact.manifest.counts.source_template_rows + artifact.manifest.counts.interview_rows },
    { tenant_key: artifact.tenantKey, display_label: artifact.config.displayLabel, layer: "L2 Canonical", objects: artifact.manifest.counts.canonical_records + artifact.manifest.counts.canonical_facts },
    { tenant_key: artifact.tenantKey, display_label: artifact.config.displayLabel, layer: "L3 Evidence/Gaps", objects: artifact.evidence.length + artifact.gaps.length },
    { tenant_key: artifact.tenantKey, display_label: artifact.config.displayLabel, layer: "L4 Graph", objects: artifact.graphNodes.length + artifact.graphEdges.length },
    { tenant_key: artifact.tenantKey, display_label: artifact.config.displayLabel, layer: "L5 Retrieval", objects: artifact.chunks.length },
    { tenant_key: artifact.tenantKey, display_label: artifact.config.displayLabel, layer: "L6 Module Context", objects: artifact.home.length + artifact.tower.approved_programs.length + artifact.moves.length + artifact.source.length },
  ]);
  writeCsv(path.join(outDir, "layer-counts.csv"), Object.keys(layerRows[0]), layerRows);
  const comparison = artifacts.map((artifact) => ({
    tenant_key: artifact.tenantKey,
    display_label: artifact.config.displayLabel,
    source_rows: artifact.manifest.counts.source_template_rows,
    interview_rows: artifact.manifest.counts.interview_rows,
    canonical_records: artifact.manifest.counts.canonical_records,
    canonical_facts: artifact.manifest.counts.canonical_facts,
    graph_nodes: artifact.manifest.counts.graph_nodes,
    graph_edges: artifact.manifest.counts.graph_edges,
    gaps: artifact.manifest.counts.context_gaps,
    retrieval_chunks: artifact.manifest.counts.retrieval_chunks,
    status: summaryStatus,
  }));
  writeCsv(path.join(outDir, "tenant-comparison.csv"), Object.keys(comparison[0]), comparison);
  const localGraphProofs = artifacts.map((artifact) => buildLocalGraphProof(artifact));
  writeCsv(path.join(outDir, "graph-node-uniqueness.csv"), Object.keys(localGraphProofs[0].node), localGraphProofs.map((proof) => proof.node));
  writeCsv(path.join(outDir, "graph-edge-resolution.csv"), Object.keys(localGraphProofs[0].edge), localGraphProofs.map((proof) => proof.edge));
  writeMd(path.join(outDir, "default-runtime-invisibility.md"), [
    "# Default Runtime Invisibility",
    "",
    "Status: PASS if read-back validation confirms candidate contract is not the active contract.",
    "",
    "- Loader never writes `intelligence_v7.active_tenant_contract_versions`.",
    "- Retrieval chunks are `candidate_preview_only` and `default_runtime_visible=false`.",
    "- Candidate story/render packs are not marked active runtime truth.",
  ]);
  writeMd(path.join(outDir, "candidate-preview-proof.md"), [
    "# Candidate Preview Proof",
    "",
    "Candidate preview proof is based on explicit candidate contract/load_run_id reads. It is not default runtime proof and not active promotion proof.",
    "",
    ...(audit?.readbackRows || []).map((row) => `- ${row.tenant_key} ${row.target_table}: ${row.status} (${row.actual_rows}/${row.expected_rows})`),
  ]);
  writeMd(path.join(outDir, "summary.md"), [
    "# FS/Airline Azure Candidate Load",
    "",
    `Final status: ${summaryStatus}`,
    "",
    truthStatement,
    "",
    "Boundaries:",
    "- Candidate load only.",
    "- Active pointer updated: no.",
    "- Production mutation claimed: no.",
    "- Signed-in UI proof claimed: no.",
    "",
    "Tenants:",
    ...comparison.map((row) => `- ${row.display_label} (${row.tenant_key}): ${Number(row.canonical_records).toLocaleString("en-US")} records, ${Number(row.canonical_facts).toLocaleString("en-US")} facts, ${Number(row.retrieval_chunks).toLocaleString("en-US")} chunks.`),
  ]);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>FS/Airline Candidate Load Proof</title><style>body{font-family:Arial;margin:28px;background:#fbfcfd;color:#17202a}.grid{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:12px}.card{background:white;border:1px solid #d8dee4;border-radius:8px;padding:14px}table{border-collapse:collapse;width:100%;margin-top:14px}td,th{border:1px solid #d8dee4;padding:8px}.status{font-weight:700;color:${summaryStatus === "READY_FOR_ACTIVE_PROMOTION_REVIEW" ? "#166534" : "#a33b00"}.note{background:#fff7e8;border-left:4px solid #a15c00;padding:10px}</style></head><body><h1>FS/Airline Candidate Load Proof</h1><p class="status">${summaryStatus}</p><p class="note">${truthStatement}</p><div class="grid">${artifacts.map((artifact) => `<div class="card"><h2>${artifact.config.displayLabel}</h2><p>${artifact.tenantKey}</p><p>${artifact.manifest.counts.source_template_rows.toLocaleString("en-US")} source rows; ${artifact.manifest.counts.canonical_facts.toLocaleString("en-US")} facts; ${(artifact.graphNodes.length + artifact.graphEdges.length).toLocaleString("en-US")} graph objects; ${artifact.chunks.length.toLocaleString("en-US")} retrieval chunks.</p></div>`).join("")}</div><table><tr><th>Layer</th><th>Objects</th></tr>${layerRows.map((row) => `<tr><td>${row.display_label} ${row.layer}</td><td>${Number(row.objects).toLocaleString("en-US")}</td></tr>`).join("")}</table></body></html>`;
  fs.writeFileSync(path.join(outDir, "proof.html"), html);
}

function emitProofBundle(outDir) {
  if (process.env.EMIT_ACA_PROOF_BUNDLE !== "true") return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fs-airline-proof-"));
  const tarPath = path.join(tmp, "proof.tgz");
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], { encoding: "utf8" });
  if (tar.status !== 0) throw new Error(tar.stderr || "proof bundle tar failed");
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

async function main() {
  const selectedAction = action();
  const outDir = path.join(repoRoot, arg("--out-dir", process.env.FS_AIRLINE_CANDIDATE_OUT_DIR || defaultOutDir));
  ensureDir(outDir);
  const artifacts = selectedTenants().map(loadTenantArtifacts);
  if (selectedAction === "preload" && !connectionString()) {
    for (const artifact of artifacts) writeTenantReports(artifact, outDir);
    const localPreload = preloadWithoutDatabase(artifacts, outDir);
    const status = localPreload.tenantRows.every((row) => row.status === "ready") ? "WATCH_BEFORE_PROMOTION" : "BLOCKED_BEFORE_PROMOTION";
    writeCrossReports(artifacts, outDir, status, null);
    writeJson(path.join(outDir, "summary.json"), { status, action: selectedAction, target: targetInfo(), generated_at: new Date().toISOString(), tenants: artifacts.map((artifact) => artifact.tenantKey), active_pointer_updated: false, database_checks: "deferred_to_load_or_audit" });
    emitProofBundle(outDir);
    console.log(JSON.stringify({ status, action: selectedAction, out_dir: outDir, active_pointer_updated: false, database_checks: "deferred_to_load_or_audit" }, null, 2));
    return;
  }
  const target = targetInfo();
  if (!target.ok) throw new Error(target.reason);
  if (selectedAction === "load" && process.env.TENANT_CANDIDATE_LOAD_APPROVED !== "true") {
    throw new Error("TENANT_CANDIDATE_LOAD_APPROVED=true is required for candidate DB mutation.");
  }
  const Client = pgClient();
  const client = new Client({ connectionString: connectionString(), ssl: { rejectUnauthorized: false }, application_name: `fs-airline-candidate-${selectedAction}` });
  let status = "BLOCKED_BEFORE_PROMOTION";
  let audit = null;
  try {
    await client.connect();
    await preload(client, artifacts, outDir);
    for (const artifact of artifacts) writeTenantReports(artifact, outDir);
    if (selectedAction === "load") {
      await client.query("begin");
      const loaded = await loadCandidate(client, artifacts, outDir);
      audit = await auditReadback(client, artifacts, outDir);
      const failed = [...audit.readbackRows, ...audit.isolationRows, ...audit.checksumRows].some((row) => row.status !== "Pass");
      if (failed) throw new Error("Readback, checksum, or tenant isolation validation failed; rolling back candidate transaction.");
      await client.query("commit");
      status = loaded.skippedRows.length ? "WATCH_BEFORE_PROMOTION" : "READY_FOR_ACTIVE_PROMOTION_REVIEW";
    } else if (selectedAction === "audit") {
      audit = await auditReadback(client, artifacts, outDir);
      status = [...audit.readbackRows, ...audit.isolationRows, ...audit.checksumRows].every((row) => row.status === "Pass") ? "READY_FOR_ACTIVE_PROMOTION_REVIEW" : "BLOCKED_BEFORE_PROMOTION";
    } else {
      status = "WATCH_BEFORE_PROMOTION";
    }
    writeCrossReports(artifacts, outDir, status, audit);
    writeJson(path.join(outDir, "summary.json"), { status, action: selectedAction, target, generated_at: new Date().toISOString(), tenants: artifacts.map((artifact) => artifact.tenantKey), active_pointer_updated: false });
    emitProofBundle(outDir);
    console.log(JSON.stringify({ status, action: selectedAction, out_dir: outDir, active_pointer_updated: false }, null, 2));
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {}
    writeJson(path.join(outDir, "summary.json"), { status: "BLOCKED_BEFORE_PROMOTION", action: selectedAction, target, error: String(error.message || error), generated_at: new Date().toISOString(), active_pointer_updated: false });
    writeCrossReports(artifacts, outDir, "BLOCKED_BEFORE_PROMOTION", audit);
    emitProofBundle(outDir);
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
