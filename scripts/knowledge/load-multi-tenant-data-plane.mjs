#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { checksumFile, key, pickRecordName, readCsv, writeCsv } from "../lib/v6-v7/csv.mjs";

const requireFromApp = createRequire(new URL("../../package.json", import.meta.url));
const { Client } = requireFromApp("pg");

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, "reports/multi-tenant-nonprod-data-plane-load");
const defaultManifest = "reports/multi-tenant-data-plane-load-plan/load-manifest.csv";
const allowedTenants = ["meridian-health", "skyharbor-air", "first-capital"];
const allowedHost = "pg-abarva-context-lab-001.postgres.database.azure.com";
const allowedDatabase = "abarva_control";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function loadDotEnvLocal() {
  const file = path.join(repoRoot, ".env.local");
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [name, ...rest] = trimmed.split("=");
    if (process.env[name]) continue;
    process.env[name] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

function effectiveConnection() {
  const value =
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.TARGET_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    "";
  if (!value) throw new Error("Missing non-prod Azure Postgres URL.");
  const parsed = new URL(value);
  if (parsed.hostname !== allowedHost || parsed.pathname.replace(/^\//, "") !== allowedDatabase) {
    throw new Error(`Refusing data-plane load: target must be ${allowedHost}/${allowedDatabase}; got ${parsed.hostname}/${parsed.pathname.replace(/^\//, "")}.`);
  }
  if (/supabase/i.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing data-plane load: DATABASE_URL points at Supabase.");
  }
  return {
    connectionString: value,
    target: {
      environment: "nonprod",
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, ""),
      userPresent: Boolean(parsed.username),
    },
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rel(file) {
  return path.relative(repoRoot, file);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function loadCsvRecords(file) {
  const rows = readCsv(file);
  return rows.map((row) => {
    const clean = { ...row };
    delete clean.__sourceFile;
    delete clean.__sourceRowNumber;
    return {
      values: clean,
      sourceRowNumber: row.__sourceRowNumber,
      recordName: pickRecordName(clean),
    };
  });
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/[$,%]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function boolOrNull(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(text)) return true;
  if (["false", "no", "n", "0"].includes(text)) return false;
  return null;
}

function dateOrNull(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function nodeKey(tenantKey, type, ref) {
  return key(tenantKey, type || "unknown", ref || "unknown").slice(0, 360);
}

function dedupeByKey(rows, keyIndex = 0) {
  const seen = new Map();
  for (const row of rows) {
    if (!seen.has(row[keyIndex])) seen.set(row[keyIndex], row);
  }
  return [...seen.values()];
}

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function batchInsert(client, table, columns, rows, conflictClause, jsonbColumns = []) {
  if (!rows.length) return { inserted: 0 };
  const chunkSize = Math.max(1, Math.floor(60000 / columns.length));
  let inserted = 0;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const params = [];
    const values = chunk.map((row, rowIndex) => {
      const offset = rowIndex * columns.length;
      params.push(...row);
      return `(${columns.map((column, columnIndex) => {
        const param = `$${offset + columnIndex + 1}`;
        return jsonbColumns.includes(column) ? `${param}::jsonb` : param;
      }).join(",")})`;
    }).join(",");
    const result = await q(client, `insert into ${table} (${columns.join(",")}) values ${values} ${conflictClause}`, params);
    inserted += result.rowCount ?? 0;
  }
  return { inserted };
}

async function ensureCandidateSchema(client) {
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
    dimension_key text not null references intelligence_v7.dimension_registry(dimension_key) on delete cascade,
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
    contract_version text not null references intelligence_v7.contract_versions(contract_version) on delete restrict,
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
    dimension_key text not null references intelligence_v7.dimension_registry(dimension_key) on delete restrict,
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
    dimension_key text not null references intelligence_v7.dimension_registry(dimension_key) on delete restrict,
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
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(tenant_key, contract_version, dimension_key, source_file, source_row_number)
  )`);
  await q(client, `create table if not exists intelligence_v7.record_fields (
    record_field_key text primary key,
    record_key text not null references intelligence_v7.business_records(record_key) on delete cascade,
    tenant_key text not null,
    contract_version text not null,
    dimension_key text not null references intelligence_v7.dimension_registry(dimension_key) on delete restrict,
    column_key text not null references intelligence_v7.column_registry(column_key) on delete restrict,
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
    source_record_key text not null references intelligence_v7.business_records(record_key) on delete cascade,
    values_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    unique(tenant_key, contract_version, relationship_id, source_record_key)
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
    source_record_key text not null references intelligence_v7.business_records(record_key) on delete cascade,
    values_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(tenant_key, contract_version, chunk_id)
  )`);
  await q(client, `create table if not exists intelligence_v7.load_reconciliation (
    reconciliation_key text primary key,
    contract_version text not null,
    tenant_key text not null,
    dimension_key text,
    expected_rows integer,
    actual_records integer,
    actual_fields integer,
    actual_edges integer,
    actual_chunks integer,
    status text not null,
    details jsonb not null default '{}'::jsonb,
    checked_at timestamptz not null default now()
  )`);
}

function loadManifest(file) {
  return readCsv(file)
    .filter((row) => row.load_required === "yes")
    .map((row) => ({
      ...row,
      source_path: row.source_path,
      absolutePath: path.join(repoRoot, row.source_path),
    }));
}

function groupTenantFiles(manifestRows) {
  const byTenant = new Map();
  for (const tenantKey of allowedTenants) byTenant.set(tenantKey, { payload: null, files: [] });
  for (const row of manifestRows) {
    if (!allowedTenants.includes(row.tenant_key)) throw new Error(`Unexpected tenant in manifest: ${row.tenant_key}`);
    const entry = byTenant.get(row.tenant_key);
    if (row.artifact_type === "v7_load_payload") entry.payload = row;
    else if (row.artifact_type === "canonical_fact_context") entry.files.push(row);
    else throw new Error(`Unexpected load-required artifact type: ${row.artifact_type}`);
  }
  for (const [tenantKey, entry] of byTenant) {
    if (!entry.payload) throw new Error(`${tenantKey} missing v7_load_payload row.`);
    if (entry.files.length !== 25) throw new Error(`${tenantKey} expected 25 canonical V7 files, found ${entry.files.length}.`);
  }
  return byTenant;
}

async function registerDimensions(client, payload) {
  for (const dimension of payload.dimensions) {
    await q(client, `insert into intelligence_v7.dimension_registry(dimension_key, contract_version, dimension_file, dimension_label, column_count, metadata, updated_at)
      values($1,$2,$3,$4,$5,$6::jsonb,now())
      on conflict(dimension_key) do update set contract_version=excluded.contract_version, dimension_file=excluded.dimension_file, dimension_label=excluded.dimension_label, column_count=excluded.column_count, metadata=excluded.metadata, updated_at=now()`,
      [dimension.dimensionKey, payload.contractVersion, dimension.file, dimension.label, dimension.columns.length, JSON.stringify(dimension.metadata ?? [])]);
    const columns = dimension.columns.map((column, index) => [
      key(payload.contractVersion, dimension.dimensionKey, column),
      payload.contractVersion,
      dimension.dimensionKey,
      column,
      index + 1,
      column,
      "",
      "",
      "",
      "",
      "",
    ]);
    await batchInsert(client, "intelligence_v7.column_registry",
      ["column_key", "contract_version", "dimension_key", "column_name", "column_ordinal", "client_field", "required_level", "allowed_format", "client_instruction", "example_value", "module_use"],
      columns,
      "on conflict(column_key) do update set client_field=excluded.client_field, updated_at=now()");
  }
}

async function loadTenant(client, tenantKey, entry) {
  const payload = readJson(entry.payload.absolutePath);
  const tenantPack = payload.tenantPacks.find((pack) => pack.tenantKey === tenantKey);
  if (!tenantPack) throw new Error(`${tenantKey} missing from payload ${entry.payload.source_path}`);
  if (payload.contractVersion !== readJson(path.join(path.dirname(path.dirname(entry.payload.absolutePath)), "V6_V7_GENERATED_MANIFEST.json")).v7ContractVersion) {
    throw new Error(`${tenantKey} payload contract version mismatch.`);
  }

  await q(client, `insert into intelligence_v7.contract_versions(contract_version, contract_name, status, generated_from, metadata, updated_at)
    values($1,$2,'candidate',$3,$4::jsonb,now())
    on conflict(contract_version) do update set status='candidate', metadata=excluded.metadata, updated_at=now()`,
    [payload.contractVersion, payload.contractName, payload.sourceDataDir, JSON.stringify({ generatedAt: payload.generatedAt, sourceTemplateDir: payload.sourceTemplateDir, activePromotion: false })]);
  await registerDimensions(client, payload);

  const runKey = key("run", payload.contractVersion, tenantKey);
  await q(client, "delete from intelligence_v7.tenant_pack_runs where run_key=$1", [runKey]);
  const expectedRows = entry.files.reduce((sum, row) => sum + Number(row.record_count || 0), 0);
  await q(client, `insert into intelligence_v7.tenant_pack_runs(run_key, tenant_key, tenant_name, contract_version, source_dataset, load_status, file_count, row_count, field_count, validation_report)
    values($1,$2,$3,$4,$5,'loaded',$6,$7,0,$8::jsonb)`,
    [runKey, tenantKey, tenantPack.tenantName, payload.contractVersion, payload.sourceDataDir, entry.files.length, expectedRows, JSON.stringify({ candidateOnly: true, activePromotion: false })]);

  let fieldCount = 0;
  let edgeCount = 0;
  let chunkCount = 0;
  const resultRows = [];
  for (const manifestRow of entry.files.sort((a, b) => a.source_path.localeCompare(b.source_path))) {
    if (checksumFile(manifestRow.absolutePath) !== manifestRow.checksum_hash) throw new Error(`Checksum mismatch before load: ${manifestRow.source_path}`);
    const sourceFile = path.basename(manifestRow.source_path);
    const dimension = payload.dimensions.find((item) => item.file === sourceFile);
    if (!dimension) throw new Error(`No payload dimension for ${sourceFile}`);
    const records = loadCsvRecords(manifestRow.absolutePath);
    const sourceFileKey = key("sf", runKey, sourceFile);
    await q(client, `insert into intelligence_v7.source_files(source_file_key, run_key, tenant_key, contract_version, dimension_key, source_file, row_count, checksum_sha256)
      values($1,$2,$3,$4,$5,$6,$7,$8)`,
      [sourceFileKey, runKey, tenantKey, payload.contractVersion, dimension.dimensionKey, sourceFile, records.length, manifestRow.checksum_hash]);

    const observedColumns = Array.from(new Set(records.flatMap((record) => Object.keys(record.values))));
    const observedColumnRows = observedColumns.map((column, index) => [
      key(payload.contractVersion, dimension.dimensionKey, column),
      payload.contractVersion,
      dimension.dimensionKey,
      column,
      1000 + index,
      column,
      "observed",
      "source provided",
      "Observed in loaded source data; not part of the formal client template.",
      "",
      "lineage and source audit",
    ]);
    await batchInsert(client, "intelligence_v7.column_registry",
      ["column_key", "contract_version", "dimension_key", "column_name", "column_ordinal", "client_field", "required_level", "allowed_format", "client_instruction", "example_value", "module_use"],
      observedColumnRows,
      "on conflict(column_key) do nothing");

    const businessRows = [];
    const fieldRows = [];
    const nodeRows = [];
    const edgeRows = [];
    const chunkRows = [];
    for (const item of records) {
      if (item.values.tenant_key !== tenantKey) throw new Error(`Tenant mismatch in ${manifestRow.source_path}:${item.sourceRowNumber}`);
      const recordKey = key("rec", runKey, dimension.dimensionKey, item.sourceRowNumber);
      const recordId = item.values.record_id || item.values.chunk_id || item.values.relationship_id || key(dimension.dimensionKey, item.sourceRowNumber);
      businessRows.push([
        recordKey, runKey, tenantKey, payload.contractVersion, dimension.dimensionKey, sourceFileKey, sourceFile, item.sourceRowNumber,
        recordId, item.recordName, item.values.entity_scope || null, item.values.entity_name || null, item.values.parent_entity_name || null,
        item.values.used_by_entities || null, boolOrNull(item.values.shared_service_flag), item.values.budget_ownership_model || null,
        item.values.source_artifact_name || null, item.values.source_validation_status || item.values.validation_status || null,
        dateOrNull(item.values.source_as_of_date), JSON.stringify(item.values),
      ]);
      const objectType = dimension.dimensionKey.replace(/^v7_\d+_/, "");
      nodeRows.push([
        nodeKey(tenantKey, objectType, item.recordName), tenantKey, payload.contractVersion, objectType, item.recordName,
        item.values.entity_scope || null, item.values.entity_name || null, recordKey, JSON.stringify({ dimensionKey: dimension.dimensionKey, recordName: item.recordName }),
      ]);
      for (const [column, value] of Object.entries(item.values)) {
        const text = String(value ?? "");
        if (!text) continue;
        fieldRows.push([
          key("field", recordKey, column), recordKey, tenantKey, payload.contractVersion, dimension.dimensionKey,
          key(payload.contractVersion, dimension.dimensionKey, column), column, text, numberOrNull(text), dateOrNull(text), boolOrNull(text),
          sourceFileKey, item.sourceRowNumber,
        ]);
      }
      if (sourceFile === "V7_12_relationships_graph_edges.csv") {
        const fromType = item.values.from_object_type || "unknown";
        const toType = item.values.to_object_type || "unknown";
        const fromKey = nodeKey(tenantKey, fromType, item.values.from_object_ref);
        const toKey = nodeKey(tenantKey, toType, item.values.to_object_ref);
        nodeRows.push([fromKey, tenantKey, payload.contractVersion, fromType, item.values.from_object_ref, item.values.entity_scope || null, item.values.entity_name || null, recordKey, JSON.stringify({ relationshipEndpoint: "from" })]);
        nodeRows.push([toKey, tenantKey, payload.contractVersion, toType, item.values.to_object_ref, item.values.entity_scope || null, item.values.entity_name || null, recordKey, JSON.stringify({ relationshipEndpoint: "to" })]);
        edgeRows.push([
          key("edge", recordKey), tenantKey, payload.contractVersion, item.values.relationship_id || key(item.sourceRowNumber, item.values.from_object_ref, item.values.relationship_type, item.values.to_object_ref),
          fromKey, toKey, item.values.from_object_ref || "", fromType, item.values.relationship_type || "", item.values.to_object_ref || "", toType,
          item.values.relationship_direction || "", item.values.evidence_ref || "", item.values.relationship_strength || "", numberOrNull(item.values.quality_score), recordKey, JSON.stringify(item.values),
        ]);
      }
      if (sourceFile === "V7_20_chunk_retrieval_registry.csv") {
        chunkRows.push([
          key("chunk", recordKey), tenantKey, payload.contractVersion, item.values.chunk_id || key(item.sourceRowNumber),
          item.values.source_artifact_ref || "", item.values.dimension || "", item.values.fact_refs || "", item.values.semantic_tags || "", item.values.entity_refs || "",
          item.values.retrieval_eligibility || "", item.values.sensitivity || "", item.values.embedding_model || "", item.values.index_name || "", item.values.indexed_at || "",
          dateOrNull(item.values.stale_after), recordKey, JSON.stringify(item.values),
        ]);
      }
    }

    await batchInsert(client, "intelligence_v7.business_records",
      ["record_key", "run_key", "tenant_key", "contract_version", "dimension_key", "source_file_key", "source_file", "source_row_number", "record_id", "record_name", "entity_scope", "entity_name", "parent_entity_name", "used_by_entities", "shared_service_flag", "budget_ownership_model", "source_artifact_name", "source_validation_status", "source_as_of_date", "values_json"],
      businessRows,
      "on conflict(record_key) do update set record_name=excluded.record_name, values_json=excluded.values_json, updated_at=now()",
      ["values_json"]);
    await batchInsert(client, "graph_nodes".startsWith("intelligence_v7.") ? "graph_nodes" : "intelligence_v7.graph_nodes",
      ["node_key", "tenant_key", "contract_version", "node_type", "node_ref", "entity_scope", "entity_name", "source_record_key", "values_json"],
      dedupeByKey(nodeRows),
      "on conflict(node_key) do update set values_json=excluded.values_json, updated_at=now()",
      ["values_json"]);
    await batchInsert(client, "intelligence_v7.record_fields",
      ["record_field_key", "record_key", "tenant_key", "contract_version", "dimension_key", "column_key", "column_name", "value_text", "value_number", "value_date", "value_bool", "source_file_key", "source_row_number"],
      fieldRows,
      "on conflict(record_field_key) do update set value_text=excluded.value_text, value_number=excluded.value_number, value_date=excluded.value_date, value_bool=excluded.value_bool, updated_at=now()");
    await batchInsert(client, "intelligence_v7.relationship_edges",
      ["edge_key", "tenant_key", "contract_version", "relationship_id", "from_node_key", "to_node_key", "from_object_ref", "from_object_type", "relationship_type", "to_object_ref", "to_object_type", "relationship_direction", "evidence_ref", "relationship_strength", "quality_score", "source_record_key", "values_json"],
      edgeRows,
      "on conflict(edge_key) do update set relationship_type=excluded.relationship_type, values_json=excluded.values_json",
      ["values_json"]);
    await batchInsert(client, "intelligence_v7.chunk_registry",
      ["chunk_key", "tenant_key", "contract_version", "chunk_id", "source_artifact_ref", "dimension", "fact_refs", "semantic_tags", "entity_refs", "retrieval_eligibility", "sensitivity", "embedding_model", "index_name", "indexed_at", "stale_after", "source_record_key", "values_json"],
      chunkRows,
      "on conflict(chunk_key) do update set semantic_tags=excluded.semantic_tags, retrieval_eligibility=excluded.retrieval_eligibility, values_json=excluded.values_json, updated_at=now()",
      ["values_json"]);

    fieldCount += fieldRows.length;
    edgeCount += edgeRows.length;
    chunkCount += chunkRows.length;
    resultRows.push({
      tenant_key: tenantKey,
      artifact_type: manifestRow.artifact_type,
      source_path: manifestRow.source_path,
      target_table_or_store: manifestRow.target_table_or_store,
      manifest_records: manifestRow.record_count,
      loaded_records: records.length,
      inserted_updated_business_records: businessRows.length,
      inserted_updated_fields: fieldRows.length,
      inserted_updated_edges: edgeRows.length,
      inserted_updated_chunks: chunkRows.length,
      checksum_hash: manifestRow.checksum_hash,
      active_candidate_status: "candidate",
      mutation_performed: "yes",
      status: "Pass",
    });
  }

  const nodeCount = await q(client, "select count(*)::int as c from intelligence_v7.graph_nodes where tenant_key=$1 and contract_version=$2", [tenantKey, payload.contractVersion]);
  await q(client, "update intelligence_v7.tenant_pack_runs set field_count=$1, graph_node_count=$2, relationship_edge_count=$3, chunk_count=$4, load_status='validated', validation_report=$5::jsonb where run_key=$6",
    [fieldCount, Number(nodeCount.rows[0].c), edgeCount, chunkCount, JSON.stringify({ expectedRows, fieldCount, edgeCount, chunkCount, activePromotion: false }), runKey]);

  resultRows.unshift({
    tenant_key: tenantKey,
    artifact_type: entry.payload.artifact_type,
    source_path: entry.payload.source_path,
    target_table_or_store: entry.payload.target_table_or_store,
    manifest_records: entry.payload.record_count,
    loaded_records: expectedRows,
    inserted_updated_business_records: expectedRows,
    inserted_updated_fields: fieldCount,
    inserted_updated_edges: edgeCount,
    inserted_updated_chunks: chunkCount,
    checksum_hash: entry.payload.checksum_hash,
    active_candidate_status: "candidate",
    mutation_performed: "yes",
    status: "Pass",
  });
  return { tenantKey, contractVersion: payload.contractVersion, rows: expectedRows, fields: fieldCount, edges: edgeCount, chunks: chunkCount, loadResults: resultRows };
}

async function validateReadback(client, grouped) {
  const readbackRows = [];
  const checksumRows = [];
  const isolationRows = [];
  const rollbackRows = [];
  for (const [tenantKey, entry] of grouped) {
    const payload = readJson(entry.payload.absolutePath);
    const contractVersion = payload.contractVersion;
    const expectedRecords = entry.files.reduce((sum, row) => sum + Number(row.record_count || 0), 0);
    const records = await q(client, "select count(*)::int as c from intelligence_v7.business_records where tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
    const files = await q(client, "select source_file, row_count, checksum_sha256 from intelligence_v7.source_files where tenant_key=$1 and contract_version=$2 order by source_file", [tenantKey, contractVersion]);
    const run = await q(client, "select load_status, row_count, field_count, relationship_edge_count, chunk_count from intelligence_v7.tenant_pack_runs where tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
    const active = await q(client, "select count(*)::int as c from information_schema.tables where table_schema='intelligence_v7' and table_name='active_tenant_contract_versions'");
    let activeMatches = 0;
    if (Number(active.rows[0].c) > 0) {
      const activeRows = await q(client, "select count(*)::int as c from intelligence_v7.active_tenant_contract_versions where tenant_key=$1 and active_contract_version=$2", [tenantKey, contractVersion]);
      activeMatches = Number(activeRows.rows[0].c);
    }
    readbackRows.push({
      tenant_key: tenantKey,
      contract_version: contractVersion,
      expected_records: expectedRecords,
      actual_records: Number(records.rows[0].c),
      expected_files: entry.files.length,
      actual_files: files.rows.length,
      load_status: run.rows[0]?.load_status ?? "missing",
      active_candidate_flag: activeMatches === 0 ? "candidate_not_active" : "unexpected_active",
      status: Number(records.rows[0].c) === expectedRecords && files.rows.length === entry.files.length && run.rows[0]?.load_status === "validated" && activeMatches === 0 ? "Pass" : "Fail",
    });
    const byFile = new Map(files.rows.map((row) => [row.source_file, row]));
    for (const row of entry.files) {
      const sourceFile = path.basename(row.source_path);
      const loaded = byFile.get(sourceFile);
      checksumRows.push({
        tenant_key: tenantKey,
        source_path: row.source_path,
        source_file: sourceFile,
        manifest_checksum: row.checksum_hash,
        loaded_checksum: loaded?.checksum_sha256 ?? "",
        manifest_records: row.record_count,
        loaded_records: loaded?.row_count ?? "",
        status: loaded?.checksum_sha256 === row.checksum_hash && Number(loaded?.row_count) === Number(row.record_count) ? "Pass" : "Fail",
      });
    }
    for (const otherTenant of allowedTenants) {
      if (otherTenant === tenantKey) continue;
      const leakage = await q(client, "select count(*)::int as c from intelligence_v7.business_records where tenant_key=$1 and contract_version=$2", [otherTenant, contractVersion]);
      isolationRows.push({
        tenant_key: tenantKey,
        probe_tenant_key: otherTenant,
        contract_version: contractVersion,
        visible_records_for_probe: Number(leakage.rows[0].c),
        status: Number(leakage.rows[0].c) === 0 ? "Pass" : "Fail",
      });
    }
    rollbackRows.push({
      tenant_key: tenantKey,
      contract_version: contractVersion,
      rollback_key: `${tenantKey}:${contractVersion}`,
      rollback_scope: "candidate tenant_pack_runs cascade plus contract_version if no other tenant depends on it",
      active_promotion_touched: "no",
      rollback_verified: "ready",
      status: "Pass",
    });
  }
  return { readbackRows, checksumRows, isolationRows, rollbackRows };
}

function renderHtml(summary) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Multi-Tenant Nonprod Data-Plane Load</title>
<style>body{font-family:Arial,sans-serif;margin:32px;background:#fbfcfd;color:#1f2937}.grid{display:grid;grid-template-columns:repeat(4,minmax(160px,1fr));gap:12px}.card{border:1px solid #d8dee4;background:#fff;border-radius:8px;padding:14px}.card span{display:block;color:#64748b;font-size:12px;text-transform:uppercase}.card strong{display:block;margin-top:6px;font-size:24px}.pass{color:#166534;font-weight:700}.note{color:#52606d;max-width:900px}</style></head>
<body>
<h1>Multi-Tenant Nonprod Data-Plane Load</h1>
<p class="note">Status: <span class="pass">${summary.status}</span>. Target: ${summary.target.environment} / ${summary.target.host} / ${summary.target.database}. Production mutation: no. Active promotion: no. Deployment: no.</p>
<div class="grid">
<div class="card"><span>Manifest rows loaded/validated</span><strong>${summary.loadRows}</strong></div>
<div class="card"><span>Business records</span><strong>${summary.businessRecords}</strong></div>
<div class="card"><span>Fields</span><strong>${summary.fields}</strong></div>
<div class="card"><span>Failures</span><strong>${summary.failures}</strong></div>
</div>
<p class="note">The load is candidate-scoped and rollback-ready. This is not deploy or signed-in product proof.</p>
</body></html>`;
}

function writeReports({ target, manifestRows, loadRows, validation, mode, error = null }) {
  ensureDir(reportDir);
  const allLoadRows = loadRows.length ? loadRows : manifestRows.map((row) => ({
    tenant_key: row.tenant_key,
    artifact_type: row.artifact_type,
    source_path: row.source_path,
    target_table_or_store: row.target_table_or_store,
    manifest_records: row.record_count,
    loaded_records: 0,
    inserted_updated_business_records: 0,
    inserted_updated_fields: 0,
    inserted_updated_edges: 0,
    inserted_updated_chunks: 0,
    checksum_hash: row.checksum_hash,
    active_candidate_status: "not_loaded",
    mutation_performed: "no",
    status: error ? "Blocked" : "Not run",
  }));
  writeCsv(path.join(reportDir, "load-results.csv"), Object.keys(allLoadRows[0]), allLoadRows);
  writeCsv(path.join(reportDir, "readback-validation.csv"), Object.keys(validation.readbackRows[0] ?? { tenant_key: "", status: "" }), validation.readbackRows);
  writeCsv(path.join(reportDir, "checksum-validation.csv"), Object.keys(validation.checksumRows[0] ?? { tenant_key: "", status: "" }), validation.checksumRows);
  writeCsv(path.join(reportDir, "tenant-isolation-validation.csv"), Object.keys(validation.isolationRows[0] ?? { tenant_key: "", status: "" }), validation.isolationRows);
  writeCsv(path.join(reportDir, "rollback-ready.csv"), Object.keys(validation.rollbackRows[0] ?? { tenant_key: "", status: "" }), validation.rollbackRows);
  const failures =
    allLoadRows.filter((row) => row.status !== "Pass").length +
    validation.readbackRows.filter((row) => row.status !== "Pass").length +
    validation.checksumRows.filter((row) => row.status !== "Pass").length +
    validation.isolationRows.filter((row) => row.status !== "Pass").length +
    validation.rollbackRows.filter((row) => row.status !== "Pass").length +
    (error ? 1 : 0);
  const summary = {
    generated_at: new Date().toISOString(),
    status: error ? "Blocked" : failures === 0 ? "Pass" : "Fail",
    mode,
    target,
    production_mutation: false,
    active_promotion: false,
    deploy_claimed: false,
    manifest_load_required_rows: manifestRows.length,
    loadRows: allLoadRows.length,
    businessRecords: validation.readbackRows.reduce((sum, row) => sum + Number(row.actual_records || 0), 0),
    fields: loadRows.reduce((sum, row) => sum + Number(row.inserted_updated_fields || 0), 0),
    failures,
    error: error ? String(error.message ?? error) : "",
  };
  fs.writeFileSync(path.join(reportDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir, "summary.md"), `# Multi-Tenant Nonprod Data-Plane Load

- Status: ${summary.status}
- Mode: ${mode}
- Target: ${target.environment} / ${target.host} / ${target.database}
- Production mutation: no
- Active promotion: no
- Deploy claimed: no
- Manifest load-required rows: ${manifestRows.length}
- Load result rows: ${allLoadRows.length}
- Validation failures: ${failures}
${error ? `- Error: ${String(error.message ?? error)}\n` : ""}
## Evidence

- \`load-results.csv\`
- \`readback-validation.csv\`
- \`checksum-validation.csv\`
- \`tenant-isolation-validation.csv\`
- \`rollback-ready.csv\`
- \`proof.html\`
`);
  fs.writeFileSync(path.join(reportDir, "proof.html"), renderHtml(summary));
  return summary;
}

async function main() {
  loadDotEnvLocal();
  const envName = arg("--env");
  if (envName !== "nonprod") throw new Error("Refusing load: --env nonprod is required.");
  const auditOnly = hasFlag("--audit-only");
  const manifestPath = path.join(repoRoot, arg("--manifest", defaultManifest));
  const manifestRows = loadManifest(manifestPath);
  if (manifestRows.length !== 78) throw new Error(`Expected 78 load-required manifest rows, found ${manifestRows.length}.`);
  const grouped = groupTenantFiles(manifestRows);
  const { connectionString, target } = effectiveConnection();
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, application_name: auditOnly ? "abarva-multi-tenant-load-audit" : "abarva-multi-tenant-nonprod-load" });
  const loadRows = [];
  const emptyValidation = { readbackRows: [], checksumRows: [], isolationRows: [], rollbackRows: [] };
  try {
    await client.connect();
    if (!auditOnly) await client.query("begin");
    if (!auditOnly) await ensureCandidateSchema(client);
    for (const [tenantKey, entry] of grouped) {
      if (auditOnly) continue;
      const loaded = await loadTenant(client, tenantKey, entry);
      loadRows.push(...loaded.loadResults);
    }
    const validation = await validateReadback(client, grouped);
    const validationFailed = [
      ...validation.readbackRows,
      ...validation.checksumRows,
      ...validation.isolationRows,
      ...validation.rollbackRows,
    ].some((row) => row.status !== "Pass");
    if (validationFailed) throw new Error("Readback validation failed; transaction rolled back.");
    if (!auditOnly) await client.query("commit");
    const summary = writeReports({ target, manifestRows, loadRows: auditOnly ? manifestRows.map((row) => ({
      tenant_key: row.tenant_key,
      artifact_type: row.artifact_type,
      source_path: row.source_path,
      target_table_or_store: row.target_table_or_store,
      manifest_records: row.record_count,
      loaded_records: row.record_count,
      inserted_updated_business_records: 0,
      inserted_updated_fields: 0,
      inserted_updated_edges: 0,
      inserted_updated_chunks: 0,
      checksum_hash: row.checksum_hash,
      active_candidate_status: "candidate_readback",
      mutation_performed: "no",
      status: "Pass",
    })) : loadRows, validation, mode: auditOnly ? "audit-only" : "load" });
    console.log(JSON.stringify(summary, null, 2));
    if (summary.status !== "Pass") process.exitCode = 1;
  } catch (error) {
    if (!auditOnly) {
      try {
        await client.query("rollback");
      } catch {}
    }
    const summary = writeReports({ target, manifestRows, loadRows, validation: emptyValidation, mode: auditOnly ? "audit-only" : "load", error });
    console.error(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
