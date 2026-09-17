import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { readOpportunityOwnershipManifest } from "./opportunity-ownership.mjs";

const SPINE = [
  "optimization_opportunity", "opportunity_evidence", "calculation_rule",
  "calculation_run", "calculation_input", "calculation_output",
  "opportunity_valuation", "evidence_requirement", "opportunity_requirement_status",
  "evidence_request", "opportunity_stage_event", "opportunity_overlap",
  "optimization_baseline", "optimization_case", "case_opportunity",
  "approval_request", "approval_decision", "negotiated_outcome",
  "finance_realization", "finance_realization_evidence", "opportunity_claim",
];

// Children first. Rules and requirements are reusable; they are archived only
// when their identifiers have no remaining consumer in the scoped dataset.
const DELETE_ORDER = [
  "approval_decision", "finance_realization_evidence", "calculation_input",
  "calculation_output", "opportunity_claim", "opportunity_evidence",
  "opportunity_valuation", "opportunity_requirement_status", "evidence_request",
  "opportunity_stage_event", "opportunity_overlap", "case_opportunity",
  "negotiated_outcome", "finance_realization", "approval_request",
  "calculation_run", "optimization_case", "optimization_baseline",
  "calculation_rule", "evidence_requirement", "optimization_opportunity",
];

const DIRECT = {
  optimization_opportunity: "opportunity_id",
  opportunity_evidence: "opportunity_id",
  calculation_run: "opportunity_id",
  opportunity_valuation: "opportunity_id",
  opportunity_requirement_status: "opportunity_id",
  evidence_request: "opportunity_id",
  opportunity_stage_event: "opportunity_id",
  opportunity_overlap: "opportunity_id",
  case_opportunity: "opportunity_id",
  negotiated_outcome: "opportunity_id",
  finance_realization: "opportunity_id",
  opportunity_claim: "opportunity_id",
};
const OWN_ID = {
  calculation_run: "calculation_run_id",
  optimization_case: "optimization_case_id",
  optimization_baseline: "baseline_id",
  approval_request: "approval_request_id",
  finance_realization: "realization_id",
};

const KNOWN_SOFT = new Set([
  "opportunity_overlap.overlaps_opportunity_id",
  "optimization_case.baseline_id",
  "approval_request.optimization_case_id", "approval_request.opportunity_id",
  "negotiated_outcome.optimization_case_id", "negotiated_outcome.opportunity_id",
  "finance_realization.optimization_case_id", "finance_realization.opportunity_id",
  "opportunity_valuation.source_run_id", "opportunity_claim.calculation_run_id",
  "contract_insight.calculation_run_id",
]);
const EXPLICIT_REFERENCE_TABLES = ["opportunity_cutover_run", "opportunity_cutover_archive", "sourcing_opportunity"];

const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sorted = (values) => [...values].sort();
const key = (table, id) => `${table}/${id}`;

function referenceIdsFromRows(rowsByTable) {
  return sorted(new Set([
    ...(rowsByTable.optimization_opportunity ?? []).map((row) => row.opportunity_id),
    ...(rowsByTable.optimization_case ?? []).map((row) => row.optimization_case_id),
    ...(rowsByTable.optimization_baseline ?? []).map((row) => row.baseline_id),
    ...(rowsByTable.calculation_run ?? []).map((row) => row.calculation_run_id),
    ...(rowsByTable.approval_request ?? []).map((row) => row.approval_request_id),
    ...(rowsByTable.finance_realization ?? []).map((row) => row.realization_id),
  ].filter(Boolean)));
}

function referenceIdsFromArchive(archiveRows) {
  const byTable = Object.fromEntries(SPINE.map((table) => [table, []]));
  for (const archived of archiveRows) {
    const table = archived.source_table.replace(/^source\./, "");
    assert(SPINE.includes(table), "Archive contains unknown table");
    byTable[table].push(JSON.parse(archived.raw));
  }
  return referenceIdsFromRows(byTable);
}

export function resolveScope(manifest) {
  assert(manifest?.schema_version === 1 && Array.isArray(manifest.packages), "Invalid ownership manifest");
  const pairs = [];
  for (const entry of manifest.packages) {
    for (const contract of entry.contracts ?? []) {
      if (contract.role !== "evidence_only") continue;
      const writer = manifest.packages.find((candidate) =>
        candidate.tenant_key === entry.tenant_key &&
        candidate.dataset_version === contract.canonical_writer_dataset_version &&
        candidate.contracts?.some((item) => item.contract_id === contract.contract_id && item.role === "canonical_writer" &&
          item.evidence_only_dataset_versions?.includes(entry.dataset_version)));
      assert(writer, "Evidence-only declaration has no reciprocal canonical writer");
      pairs.push({ tenantKey: entry.tenant_key, datasetVersion: entry.dataset_version,
        contractId: contract.contract_id, writerDatasetVersion: writer.dataset_version });
    }
  }
  assert(pairs.length === 1, "Cutover job requires exactly one reciprocal evidence-only tuple");
  return pairs[0];
}

export function selectRows(rowsByTable, scope, expectedIds) {
  const all = Object.fromEntries(SPINE.map((table) => [table, rowsByTable[table] ?? []]));
  const roots = all.optimization_opportunity.filter((row) => row.contract_id === scope.contractId);
  const ids = sorted(roots.map((row) => row.opportunity_id));
  if (expectedIds) assert(JSON.stringify(ids) === JSON.stringify(sorted(expectedIds)), "Opportunity ID set does not match exact approval");
  assert(new Set(ids).size === ids.length, "Duplicate opportunity ID");
  const idSet = new Set(ids);
  const cases = all.optimization_case.filter((row) => row.contract_id === scope.contractId);
  const caseIds = new Set(cases.map((row) => row.optimization_case_id));
  const baselines = all.optimization_baseline.filter((row) => row.contract_id === scope.contractId);
  const baselineIds = new Set(baselines.map((row) => row.baseline_id));
  const runs = all.calculation_run.filter((row) => idSet.has(row.opportunity_id));
  const runIds = new Set(runs.map((row) => row.calculation_run_id));
  const requests = all.approval_request.filter((row) => caseIds.has(row.optimization_case_id) || idSet.has(row.opportunity_id));
  const requestIds = new Set(requests.map((row) => row.approval_request_id));
  const realizations = all.finance_realization.filter((row) => idSet.has(row.opportunity_id) || caseIds.has(row.optimization_case_id));
  const realizationIds = new Set(realizations.map((row) => row.realization_id));
  const selected = Object.fromEntries(SPINE.map((table) => [table, []]));
  for (const table of SPINE) {
    selected[table] = all[table].filter((row) => {
      if (DIRECT[table]) return idSet.has(row[DIRECT[table]]);
      if (table === "optimization_case") return caseIds.has(row.optimization_case_id);
      if (table === "optimization_baseline") return baselineIds.has(row.baseline_id);
      if (table === "calculation_input" || table === "calculation_output") return runIds.has(row.calculation_run_id);
      if (table === "approval_request") return requestIds.has(row.approval_request_id);
      if (table === "approval_decision") return requestIds.has(row.approval_request_id);
      if (table === "finance_realization_evidence") return realizationIds.has(row.realization_id);
      if (table === "calculation_rule") return runs.some((run) => run.rule_id === row.rule_id && run.rule_version === row.rule_version);
      return false;
    });
  }
  selected.evidence_requirement = all.evidence_requirement.filter((row) =>
    selected.opportunity_requirement_status.some((status) => status.requirement_id === row.requirement_id) ||
    selected.evidence_request.some((request) => request.requirement_id === row.requirement_id));
  const selectedIds = new Set(Object.entries(selected).flatMap(([table, rows]) => rows.map((row) => key(table, row.id))));
  for (const [table, rows] of Object.entries(all)) {
    for (const row of rows) {
      const isSelected = selectedIds.has(key(table, row.id));
      if (isSelected) {
        if ("contract_id" in row) assert(row.contract_id === scope.contractId, `Cross-contract row in ${table}`);
        if (row.opportunity_id) assert(idSet.has(row.opportunity_id), `Cross-opportunity row in ${table}`);
        if (row.optimization_case_id) assert(caseIds.has(row.optimization_case_id), `Cross-case row in ${table}`);
      } else {
        const references = [row.opportunity_id, row.overlaps_opportunity_id, row.optimization_case_id,
          row.baseline_id, row.calculation_run_id, row.approval_request_id, row.realization_id];
        assert(!references.some((value) => idSet.has(value) || caseIds.has(value) || baselineIds.has(value) ||
          runIds.has(value) || requestIds.has(value) || realizationIds.has(value)), `Unselected ${table} row references cutover scope`);
        const payload = JSON.stringify([row.payload, row.source_refs, row.tower_claim_refs]);
        assert(![...idSet, ...caseIds, ...baselineIds, ...runIds, ...requestIds, ...realizationIds]
          .some((value) => payload.includes(value)), `Unselected ${table} payload references cutover scope`);
      }
    }
  }
  for (const run of all.calculation_run) {
    if (selectedIds.has(key("calculation_run", run.id))) continue;
    assert(!selected.calculation_rule.some((rule) => rule.rule_id === run.rule_id && rule.rule_version === run.rule_version),
      "Calculation rule is shared with an unrelated run");
  }
  for (const table of ["opportunity_requirement_status", "evidence_request"]) {
    for (const row of all[table]) {
      if (selectedIds.has(key(table, row.id))) continue;
      assert(!selected.evidence_requirement.some((rule) => rule.requirement_id === row.requirement_id),
        "Evidence requirement is shared with an unrelated opportunity");
    }
  }
  return { selected, ids, selectedIds, rootCount: roots.length };
}

function canonicalInventory(rowsByTable, selectedIds) {
  const all = Object.entries(rowsByTable).flatMap(([table, rows]) => rows.map((row) => ({
    table, id: row.id, rowHash: sha(row.raw), selected: selectedIds.has(key(table, row.id)),
  })));
  all.sort((a, b) => key(a.table, a.id).localeCompare(key(b.table, b.id)));
  const withoutSelection = (rows) => rows.map(({ selected: _selected, ...row }) => row);
  return { inventoryHash: sha(JSON.stringify(withoutSelection(all))),
    archiveHash: sha(JSON.stringify(withoutSelection(all.filter((row) => row.selected)))),
    archiveCount: all.filter((row) => row.selected).length,
    controlHash: sha(JSON.stringify(withoutSelection(all.filter((row) => !row.selected)))), all };
}

function ident(value) { assert(/^[a-z][a-z0-9_]*$/.test(value), "Unsafe SQL identifier"); return `"${value}"`; }
async function loadRows(client, scope, table) {
  const result = await client.query(`SELECT t.*, to_jsonb(t)::text AS __cutover_raw FROM source.${ident(table)} t WHERE tenant_key=$1 AND dataset_version=$2 ORDER BY id`,
    [scope.tenantKey, scope.datasetVersion]);
  return result.rows.map(({ __cutover_raw: raw, ...row }) => ({ ...row, raw }));
}

async function inspectLegacy(client, scope, opportunityIds) {
  const view = await client.query("SELECT pg_get_viewdef('consumption.sourcing_opportunity_v1'::regclass, true) AS definition");
  assert(view.rows[0]?.definition, "Installed opportunity projection is unavailable");
  const result = await client.query(`SELECT id,contract_id,opportunity_id,to_jsonb(legacy)::text AS raw
    FROM source.sourcing_opportunity legacy
    WHERE tenant_key=$1 AND (contract_id=$2 OR opportunity_id=ANY($3::text[])) ORDER BY id`,
  [scope.tenantKey, scope.contractId, opportunityIds]);
  return { count: result.rows.length, rows: result.rows.map(({ id, contract_id, opportunity_id, raw }) => ({
    id, contract_id, opportunity_id, row_sha256: sha(raw),
  })), projection_sha256: sha(view.rows[0].definition) };
}

function assertNoLegacy(legacy) {
  assert(legacy.count === 0, "Legacy opportunity rows could reappear after canonical retirement");
}

async function inspectSchema(client) {
  const names = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='source' AND tablename=ANY($1::text[])", [SPINE]);
  assert(names.rows.length === SPINE.length, "Opportunity spine table missing");
  const constraints = await client.query(`SELECT child_ns.nspname || '.' || child.relname AS child,
      parent_ns.nspname || '.' || parent.relname AS parent, con.conname, con.confdeltype
    FROM pg_constraint con JOIN pg_class child ON child.oid=con.conrelid
    JOIN pg_namespace child_ns ON child_ns.oid=child.relnamespace
    JOIN pg_class parent ON parent.oid=con.confrelid
    JOIN pg_namespace parent_ns ON parent_ns.oid=parent.relnamespace
    WHERE con.contype='f' AND (child_ns.nspname='source' AND child.relname=ANY($1::text[])
      OR parent_ns.nspname='source' AND parent.relname=ANY($1::text[]))`, [SPINE]);
  for (const row of constraints.rows) {
    assert(SPINE.includes(row.child.replace(/^source\./, "")) && SPINE.includes(row.parent.replace(/^source\./, "")) &&
      row.child.startsWith("source.") && row.parent.startsWith("source."), `Unknown FK ${row.child}.${row.conname}`);
  }
  const triggers = await client.query(`SELECT event_object_table, trigger_name FROM information_schema.triggers
    WHERE event_object_schema='source' AND event_object_table=ANY($1::text[])`, [SPINE]);
  assert(triggers.rows.length === 0, "Opportunity spine trigger requires manual review");
  const columns = await client.query(`SELECT table_name,column_name,data_type FROM information_schema.columns
    WHERE table_schema='source' AND column_name ~ '(opportunity|optimization_case|baseline|calculation_run|approval_request|realization)_id$'`);
  for (const row of columns.rows) {
    if (!SPINE.includes(row.table_name)) continue;
    assert((DIRECT[row.table_name] === row.column_name || OWN_ID[row.table_name] === row.column_name ||
      KNOWN_SOFT.has(`${row.table_name}.${row.column_name}`) ||
      ["calculation_input", "calculation_output"].includes(row.table_name) && row.column_name === "calculation_run_id" ||
      row.table_name === "approval_decision" && row.column_name === "approval_request_id" ||
      row.table_name === "finance_realization_evidence" && row.column_name === "realization_id" ||
      row.table_name === "case_opportunity" && row.column_name === "optimization_case_id" ||
      row.table_name === "optimization_case" && row.column_name === "baseline_id"),
      `Unrecognized logical reference ${row.table_name}.${row.column_name}`);
  }
  return { constraints: constraints.rows, columns: columns.rows };
}

async function inspectExternalReferences(client, scope, selected, referenceIds = selected.ids) {
  const ids = new Set(referenceIds);
  const caseIds = new Set(selected.selected.optimization_case.map((row) => row.optimization_case_id));
  const baselineIds = new Set(selected.selected.optimization_baseline.map((row) => row.baseline_id));
  const runIds = new Set(selected.selected.calculation_run.map((row) => row.calculation_run_id));
  const candidates = await client.query(`SELECT tenant_key,dataset_version,contract_id,calculation_run_id FROM source.contract_insight
    WHERE tenant_key=$1 AND (contract_id=$2 OR calculation_run_id=ANY($3::text[]))`,
    [scope.tenantKey, scope.contractId, [...runIds]]);
  assert(!candidates.rows.some((row) => runIds.has(row.calculation_run_id)), "Contract insight references a retiring calculation run");
  const overlapRows = selected.selected.opportunity_overlap;
  assert(!overlapRows.some((row) => row.overlaps_opportunity_id && !ids.has(row.overlaps_opportunity_id)), "Overlap references outside scope");
  assert(!selected.selected.optimization_case.some((row) => row.baseline_id && !baselineIds.has(row.baseline_id)), "Case baseline outside scope");
  assert(!selected.selected.approval_request.some((row) => row.opportunity_id && !ids.has(row.opportunity_id)), "Approval request outside scope");
  assert(!selected.selected.opportunity_claim.some((row) => row.calculation_run_id && !runIds.has(row.calculation_run_id)), "Claim run outside scope");
  assert(caseIds.size === selected.selected.optimization_case.length, "Duplicate case identifier");
  const references = [...ids, ...caseIds, ...baselineIds, ...runIds,
    ...selected.selected.approval_request.map((row) => row.approval_request_id),
    ...selected.selected.finance_realization.map((row) => row.realization_id)];
  const columns = await client.query(`SELECT c.table_name,c.column_name
    FROM information_schema.columns c JOIN pg_tables base ON base.schemaname=c.table_schema AND base.tablename=c.table_name
    JOIN information_schema.columns tenant
      ON tenant.table_schema=c.table_schema AND tenant.table_name=c.table_name AND tenant.column_name='tenant_key'
    WHERE c.table_schema='source' AND (c.column_name ~ '(opportunity|optimization_case|baseline|calculation_run|approval_request|realization)_id$'
      OR c.column_name='entity_id')
      AND c.table_name<>ALL($1::text[])`, [[...SPINE, ...EXPLICIT_REFERENCE_TABLES]]);
  for (const column of columns.rows) {
    const result = await client.query(`SELECT count(*)::int AS count FROM source.${ident(column.table_name)}
      WHERE tenant_key=$1 AND ${ident(column.column_name)}::text=ANY($2::text[])`, [scope.tenantKey, references]);
    assert(result.rows[0].count === 0, `External logical reference ${column.table_name}.${column.column_name}`);
  }
  // JSON references are not governed FKs. Scan tenant-scoped source JSON columns
  // rather than assuming named reference columns are exhaustive.
  const jsonColumns = await client.query(`SELECT c.table_name,c.column_name FROM information_schema.columns c
    JOIN pg_tables base ON base.schemaname=c.table_schema AND base.tablename=c.table_name
    JOIN information_schema.columns tenant ON tenant.table_schema=c.table_schema AND tenant.table_name=c.table_name
      AND tenant.column_name='tenant_key'
    WHERE c.table_schema='source' AND c.data_type IN ('json','jsonb') AND c.table_name<>ALL($1::text[])`,
  [[...SPINE, ...EXPLICIT_REFERENCE_TABLES]]);
  for (const column of jsonColumns.rows) {
    const result = await client.query(`SELECT count(*)::int AS count FROM source.${ident(column.table_name)}
      WHERE tenant_key=$1 AND EXISTS
      (SELECT 1 FROM unnest($2::text[]) ref WHERE ${ident(column.column_name)}::text LIKE '%' || ref || '%')`,
    [scope.tenantKey, references]);
    assert(result.rows[0].count === 0, `External JSON reference ${column.table_name}.${column.column_name}`);
  }
  const crossVersionColumns = await client.query(`SELECT table_name,column_name FROM information_schema.columns
    WHERE table_schema='source' AND table_name=ANY($1::text[])
      AND column_name ~ '(opportunity|optimization_case|baseline|calculation_run|approval_request|realization)_id$'`, [SPINE]);
  for (const column of crossVersionColumns.rows) {
    const result = await client.query(`SELECT count(*)::int AS count FROM source.${ident(column.table_name)}
      WHERE tenant_key=$1 AND dataset_version<>$2 AND ${ident(column.column_name)}::text=ANY($3::text[])`,
    [scope.tenantKey, scope.datasetVersion, references]);
    assert(result.rows[0].count === 0, `Cross-version reference ${column.table_name}.${column.column_name}`);
  }
  const crossVersionJson = await client.query(`SELECT table_name,column_name FROM information_schema.columns
    WHERE table_schema='source' AND table_name=ANY($1::text[]) AND data_type IN ('json','jsonb')`, [SPINE]);
  for (const column of crossVersionJson.rows) {
    const result = await client.query(`SELECT count(*)::int AS count FROM source.${ident(column.table_name)}
      WHERE tenant_key=$1 AND dataset_version<>$2 AND EXISTS
      (SELECT 1 FROM unnest($3::text[]) ref WHERE ${ident(column.column_name)}::text LIKE '%' || ref || '%')`,
    [scope.tenantKey, scope.datasetVersion, references]);
    assert(result.rows[0].count === 0, `Cross-version JSON reference ${column.table_name}.${column.column_name}`);
  }
}

async function inventory(client, scope, expectedIds, retiredIds = expectedIds, retiredReferences = retiredIds) {
  const schema = await inspectSchema(client);
  const rowsByTable = {};
  for (const table of SPINE) rowsByTable[table] = await loadRows(client, scope, table);
  const selected = selectRows(rowsByTable, scope, expectedIds);
  const references = retiredReferences ?? referenceIdsFromRows(selected.selected);
  for (const [table, rows] of Object.entries(rowsByTable)) {
    for (const row of rows) {
      if (selected.selectedIds.has(key(table, row.id))) continue;
      assert(!references.some((ref) => [row.opportunity_id, row.overlaps_opportunity_id, row.optimization_case_id,
        row.baseline_id, row.calculation_run_id, row.approval_request_id, row.realization_id]
        .includes(ref) || JSON.stringify([row.payload, row.source_refs, row.tower_claim_refs]).includes(ref)),
      `Residual ${table} reference to retired scope`);
    }
  }
  await inspectExternalReferences(client, scope, selected, references);
  const hashes = canonicalInventory(rowsByTable, selected.selectedIds);
  const legacy = await inspectLegacy(client, scope, retiredIds ?? selected.ids);
  const writerRows = {};
  for (const table of SPINE) writerRows[table] = await loadRows(client, { ...scope, datasetVersion: scope.writerDatasetVersion }, table);
  const writerHash = canonicalInventory(writerRows, new Set()).inventoryHash;
  return { ...selected, ...hashes, writerHash, legacy, schema, rowsByTable };
}

function requiredEnv(env, name) { assert(env[name]?.trim(), `${name} is required`); return env[name].trim(); }
function metadata(env, mode) {
  const result = { runId: requiredEnv(env, "SOURCE_CUTOVER_RUN_ID"), operator: requiredEnv(env, "SOURCE_CUTOVER_OPERATOR"),
    jobName: requiredEnv(env, "SOURCE_CUTOVER_JOB_NAME"), buildVersion: requiredEnv(env, "SOURCE_CUTOVER_BUILD_VERSION"),
    inputVersion: requiredEnv(env, "SOURCE_CUTOVER_INPUT_VERSION"), idempotencyKey: requiredEnv(env, "SOURCE_CUTOVER_IDEMPOTENCY_KEY"),
    gitSha: requiredEnv(env, "SOURCE_CUTOVER_GIT_SHA"), imageDigest: requiredEnv(env, "SOURCE_CUTOVER_IMAGE_DIGEST"),
    executionId: env.CONTAINER_APP_JOB_EXECUTION_NAME ?? env.SOURCE_CUTOVER_ACA_EXECUTION_ID ?? null };
  assert(/^[a-zA-Z0-9._-]+$/.test(result.runId), "Invalid run ID");
  assert(/^sha256:[a-f0-9]{64}$/.test(result.imageDigest), "Digest-pinned image required");
  if (result.executionId) assert(result.executionId !== result.runId, "ACA execution ID must not be the run ID");
  if (mode === "apply" || mode === "restore") {
    assert(env.SOURCE_CUTOVER_APPROVED === mode.toUpperCase(), `Explicit ${mode} approval required`);
    assert(env.ACA_JOB_NAME === result.jobName, "ACA job identity mismatch");
  }
  return result;
}

function expected(env, mode) {
  if (mode === "plan") return { ids: null, hash: null, writerHash: null };
  const ids = JSON.parse(requiredEnv(env, "SOURCE_CUTOVER_EXPECTED_OPPORTUNITY_IDS"));
  assert(Array.isArray(ids) && ids.length > 0 && ids.every((id) => typeof id === "string" && id.length > 0), "Invalid expected IDs");
  const hash = requiredEnv(env, "SOURCE_CUTOVER_EXPECTED_HASH");
  assert(/^[a-f0-9]{64}$/.test(hash), "Invalid expected inventory hash");
  const writerHash = requiredEnv(env, "SOURCE_CUTOVER_EXPECTED_WRITER_HASH");
  assert(/^[a-f0-9]{64}$/.test(writerHash), "Invalid expected writer hash");
  if (mode !== "plan") assert(env.SOURCE_CUTOVER_EXPECTED_MANIFEST_HASH, "Expected manifest hash required");
  return { ids, hash, writerHash };
}

function reconstructedInventoryHash(currentRowsByTable, archiveRows) {
  const merged = Object.fromEntries(SPINE.map((table) => [table, [...currentRowsByTable[table]]]));
  for (const archived of archiveRows) {
    const table = archived.source_table.replace(/^source\./, "");
    assert(SPINE.includes(table), "Archive contains unknown table");
    merged[table].push({ id: archived.source_row_id, raw: archived.raw });
  }
  return canonicalInventory(merged, new Set()).inventoryHash;
}

async function proofTarget(env, mode) {
  if (mode === "plan" && !env.SOURCE_CUTOVER_BLOB_ACCOUNT_URL) return null;
  const url = requiredEnv(env, "SOURCE_CUTOVER_BLOB_ACCOUNT_URL");
  const container = requiredEnv(env, "SOURCE_CUTOVER_BLOB_CONTAINER");
  const prefix = requiredEnv(env, "SOURCE_CUTOVER_BLOB_PREFIX");
  assert(/^https:\/\/[a-z0-9-]+\.blob\.core\.windows\.net\/?$/.test(url), "Private Azure Blob account URL required");
  assert(/^[a-z0-9-]+$/.test(container) && /^[a-zA-Z0-9/_-]+$/.test(prefix), "Invalid proof location");
  const service = new BlobServiceClient(url, new DefaultAzureCredential());
  return { client: service.getContainerClient(container), prefix };
}

async function uploadProof(target, name, proof) {
  const body = JSON.stringify(proof);
  const blob = target.client.getBlockBlobClient(`${target.prefix}/${name}.json`);
  await blob.uploadData(Buffer.from(body), { blobHTTPHeaders: { blobContentType: "application/json" } });
  const response = await blob.download();
  const chunks = [];
  for await (const chunk of response.readableStreamBody) chunks.push(chunk);
  assert(sha(Buffer.concat(chunks)) === sha(body), "Blob proof readback mismatch");
  return blob.url;
}

async function archiveAndDelete(client, scope, meta, manifestHash, snapshot, proofLocation) {
  await client.query(`INSERT INTO source.opportunity_cutover_run
    (run_id,tenant_key,dataset_version,contract_id,writer_dataset_version,ownership_manifest_sha256,inventory_sha256,opportunity_ids,archive_row_count,state,operator_identity,proof_location)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,'retired',$10,$11)`,
  [meta.runId, scope.tenantKey, scope.datasetVersion, scope.contractId, scope.writerDatasetVersion,
    manifestHash, snapshot.inventoryHash, JSON.stringify(snapshot.ids), snapshot.archiveCount, meta.operator, proofLocation]);
  for (const table of SPINE) {
    for (const row of snapshot.selected[table]) {
      await client.query(`INSERT INTO source.opportunity_cutover_archive
        (run_id,tenant_key,dataset_version,contract_id,source_table,source_row_id,row_payload,row_sha256)
        VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
      [meta.runId, scope.tenantKey, scope.datasetVersion, scope.contractId, `source.${table}`, row.id, row.raw, sha(row.raw)]);
    }
  }
  for (const table of DELETE_ORDER) {
    const rows = snapshot.selected[table];
    if (rows.length === 0) continue;
    const result = await client.query(`DELETE FROM source.${ident(table)} WHERE tenant_key=$1 AND dataset_version=$2 AND id=ANY($3::uuid[])`,
      [scope.tenantKey, scope.datasetVersion, rows.map((row) => row.id)]);
    assert(result.rowCount === rows.length, `Delete count mismatch for ${table}`);
  }
}

async function archiveReadback(client, runId) {
  const rows = await client.query(`SELECT source_table, source_row_id, row_payload::text AS raw, row_sha256
    FROM source.opportunity_cutover_archive WHERE run_id=$1 ORDER BY source_table,source_row_id`, [runId]);
  assert(rows.rows.every((row) => sha(row.raw) === row.row_sha256), "Archived row hash mismatch");
  const all = rows.rows.map((row) => ({ table: row.source_table.replace(/^source\./, ""), id: row.source_row_id,
    rowHash: row.row_sha256 }));
  all.sort((a, b) => key(a.table, a.id).localeCompare(key(b.table, b.id)));
  return { rows: rows.rows, count: all.length, hash: sha(JSON.stringify(all)) };
}

async function runJob({ mode, env = process.env, pool, targetOverride } = {}) {
  assert(["plan", "apply", "verify", "restore"].includes(mode), "Mode must be plan, apply, verify, or restore");
  const manifest = readOpportunityOwnershipManifest(mode);
  const scope = resolveScope(manifest);
  const manifestHash = sha(JSON.stringify(manifest));
  const meta = metadata(env, mode);
  const approval = expected(env, mode);
  assert(env.SOURCE_CUTOVER_EXPECTED_MANIFEST_HASH === undefined || env.SOURCE_CUTOVER_EXPECTED_MANIFEST_HASH === manifestHash,
    "Ownership manifest hash mismatch");
  assert(meta.inputVersion === scope.datasetVersion, "Input version does not match ownership tuple");
  const target = targetOverride ?? await proofTarget(env, mode);
  const client = await pool.connect();
  const proof = { mode, run_id: meta.runId, job_name: meta.jobName, tenant_scope: scope.tenantKey,
    input_source_version: meta.inputVersion, build_version: meta.buildVersion, idempotency_key: meta.idempotencyKey,
    operator_identity: meta.operator, git_sha: meta.gitSha, image_digest: meta.imageDigest,
    aca_execution_id: meta.executionId, aca_execution_id_source: meta.executionId ? "runtime_or_wrapper" : "wrapper_readback_required",
    ownership_manifest_sha256: manifestHash, scope, started_at: new Date().toISOString() };
  let committed = false;
  try {
    await client.query(mode === "plan" || mode === "verify" ? "BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY" : "BEGIN ISOLATION LEVEL SERIALIZABLE");
    if (mode === "plan" || mode === "apply") {
      const snapshot = await inventory(client, scope, approval.ids);
      Object.assign(proof, { inventory_sha256: snapshot.inventoryHash, archive_sha256: snapshot.archiveHash,
        archive_row_count: snapshot.archiveCount, opportunity_ids: snapshot.ids,
        table_counts: Object.fromEntries(SPINE.map((table) => [table, snapshot.selected[table].length])),
        control_sha256: snapshot.controlHash, canonical_writer_sha256: snapshot.writerHash,
        legacy_opportunity_blockers: snapshot.legacy,
        installed_constraints: snapshot.schema.constraints,
        quality_gate: snapshot.legacy.count === 0 ? "inventory_pass" : "BLOCKED_LEGACY_PROJECTION_ROWS" });
      if (mode === "apply") {
        assertNoLegacy(snapshot.legacy);
        assert(snapshot.inventoryHash === approval.hash, "Exact inventory hash changed since approval");
        assert(snapshot.writerHash === approval.writerHash, "Canonical writer changed since approval");
        assert(snapshot.rootCount > 0, "No evidence-only opportunities to retire");
        const existing = await client.query("SELECT run_id FROM source.opportunity_cutover_run WHERE run_id=$1", [meta.runId]);
        assert(existing.rows.length === 0, "Run ID already used");
        const preparedUrl = await uploadProof(target, `${meta.runId}-prepared`, { ...proof, status: "prepared_uncommitted" });
        await archiveAndDelete(client, scope, meta, manifestHash, snapshot, preparedUrl);
        const archive = await archiveReadback(client, meta.runId);
        assert(archive.count === snapshot.archiveCount && archive.hash === snapshot.archiveHash, "Archive parity failed");
        const after = await inventory(client, scope, [], approval.ids, referenceIdsFromRows(snapshot.selected));
        assert(after.archiveCount === 0 && after.controlHash === snapshot.controlHash &&
          after.writerHash === snapshot.writerHash && after.legacy.count === 0 &&
          after.legacy.projection_sha256 === snapshot.legacy.projection_sha256, "Post-delete quality gate failed");
        Object.assign(proof, { status: "retired", quality_gate: "PASS", archive_readback_sha256: archive.hash,
          control_readback_sha256: after.controlHash, prepared_proof_url: preparedUrl });
      }
    } else {
      const result = await client.query(`SELECT * FROM source.opportunity_cutover_run WHERE run_id=$1${mode === "restore" ? " FOR UPDATE" : ""}`, [meta.runId]);
      assert(result.rows.length === 1, "Cutover run not found");
      const prior = result.rows[0];
      assert(prior.tenant_key === scope.tenantKey && prior.dataset_version === scope.datasetVersion &&
        prior.contract_id === scope.contractId && prior.writer_dataset_version === scope.writerDatasetVersion &&
        prior.ownership_manifest_sha256 === manifestHash && prior.inventory_sha256 === approval.hash,
      "Archived run scope/hash mismatch");
      assert(JSON.stringify(sorted(prior.opportunity_ids)) === JSON.stringify(sorted(approval.ids)), "Archived IDs mismatch");
      const archive = await archiveReadback(client, meta.runId);
      assert(archive.count === prior.archive_row_count, "Archive count mismatch");
      Object.assign(proof, { inventory_sha256: prior.inventory_sha256, archive_sha256: archive.hash,
        archive_row_count: archive.count, opportunity_ids: prior.opportunity_ids });
      if (mode === "restore") {
        assert(prior.state === "retired", "Only a retired run can be restored");
        const before = await inventory(client, scope, [], approval.ids, referenceIdsFromArchive(archive.rows));
        assert(before.archiveCount === 0, "Restore would overwrite live opportunity rows");
        assertNoLegacy(before.legacy);
        assert(before.writerHash === approval.writerHash &&
          reconstructedInventoryHash(before.rowsByTable, archive.rows) === approval.hash,
        "Unrelated or canonical writer rows changed since retirement");
        const preparedUrl = await uploadProof(target, `${meta.runId}-restore-prepared`, { ...proof, status: "restore_prepared_uncommitted" });
        for (const table of [...DELETE_ORDER].reverse()) {
          const rows = archive.rows.filter((row) => row.source_table === `source.${table}`);
          for (const row of rows) {
            const fields = Object.keys(JSON.parse(row.raw));
            assert(fields.every((field) => /^[a-z][a-z0-9_]*$/.test(field)), "Unsafe archive column");
            await client.query(`INSERT INTO source.${ident(table)} (${fields.map(ident).join(",")})
              SELECT ${fields.map((field) => `data.${ident(field)}`).join(",")}
              FROM jsonb_populate_record(NULL::source.${ident(table)}, $1::jsonb) data`, [row.raw]);
          }
        }
        const restored = await inventory(client, scope, approval.ids);
        assert(restored.inventoryHash === approval.hash && restored.archiveHash === archive.hash &&
          restored.controlHash === before.controlHash && restored.writerHash === before.writerHash,
        "Restored inventory mismatch");
        await client.query("UPDATE source.opportunity_cutover_run SET state='restored',completed_at=now(),proof_location=$2 WHERE run_id=$1", [meta.runId, preparedUrl]);
        Object.assign(proof, { status: "restored", quality_gate: "PASS", prepared_proof_url: preparedUrl });
      } else {
        assert(prior.state === "retired", "Run is not retired");
        const now = await inventory(client, scope, [], approval.ids, referenceIdsFromArchive(archive.rows));
        assert(now.archiveCount === 0, "Residual evidence-only opportunity rows");
        assertNoLegacy(now.legacy);
        assert(now.writerHash === approval.writerHash &&
          reconstructedInventoryHash(now.rowsByTable, archive.rows) === approval.hash,
        "Unrelated or canonical writer rows changed since retirement");
        Object.assign(proof, { status: "verified", quality_gate: "PASS", residual_rows: 0 });
      }
    }
    await client.query("COMMIT");
    committed = true;
    proof.finished_at = new Date().toISOString();
    if (target && mode !== "plan") proof.proof_url = await uploadProof(target, `${meta.runId}-${mode}-final`, proof);
    return proof;
  } catch (error) {
    if (committed) {
      throw new Error(`Database transaction committed but final Blob proof failed for ${meta.runId}; run verify and retain the prepared proof`,
        { cause: error });
    }
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { client.release(); }
}

export { SPINE, DELETE_ORDER, assertNoLegacy, canonicalInventory, expected, inspectLegacy, metadata, reconstructedInventoryHash, runJob };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const mode = process.argv.find((arg) => arg.startsWith("--mode="))?.slice(7);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  runJob({ mode, pool }).then((proof) => {
    console.log(JSON.stringify(proof));
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "source-cutover-proof-"));
    try {
      fs.writeFileSync(path.join(dir, "summary.json"), `${JSON.stringify(proof, null, 2)}\n`);
      const tarPath = `${dir}.tgz`;
      const tar = spawnSync("tar", ["-czf", tarPath, "-C", dir, "summary.json"], { encoding: "utf8" });
      assert(tar.status === 0, `Proof tar failed: ${tar.stderr}`);
      const encoded = fs.readFileSync(tarPath).toString("base64");
      console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
      for (let index = 0; index < encoded.length; index += 7600) console.log(encoded.slice(index, index + 7600));
      console.log("__SEMANTIC2_PROOF_TGZ_END__");
      fs.rmSync(tarPath);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }).catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
}
