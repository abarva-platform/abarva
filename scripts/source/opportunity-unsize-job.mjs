import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import Papa from "papaparse";
import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";
import { readOpportunityOwnershipManifest, resolveOpportunityOwnership } from "./opportunity-ownership.mjs";
import { SPINE, selectRows } from "./opportunity-ownership-cutover-job.mjs";

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const check = (condition, message) => { if (!condition) throw new Error(message); };
const hex = (value) => /^[a-f0-9]{64}$/.test(value ?? "");
const sorted = (values) => [...values].sort();
const ident = (value) => { check(/^[a-z][a-z0-9_]*$/.test(value), "Invalid SQL identifier"); return `"${value}"`; };
const LEGACY_INPUT_REASON = "Cloud package opportunity cites this evidence row.";
const UNSIZED_INPUT_REASON = "Evidence reference only; numeric formula input is not mapped.";

export function packageScope(manifest, csvText) {
  check(manifest?.schema_version === 1 && Array.isArray(manifest.packages), "Invalid ownership manifest");
  const writers = manifest.packages.flatMap((entry) => (entry.contracts ?? [])
    .filter((contract) => contract.role === "canonical_writer")
    .map((contract) => ({ tenantKey: entry.tenant_key, datasetVersion: entry.dataset_version,
      contractId: contract.contract_id, packageDir: entry.package_dir })));
  check(writers.length === 1, "Unsizing requires exactly one declared canonical writer");
  const scope = writers[0];
  check(scope.packageDir === "datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908" &&
    scope.tenantKey === "meridian-health" && scope.datasetVersion === "meridian-databricks-consumption-commit-v1-20260908" &&
    scope.contractId === "MER-TECH-DBX-001", "Unexpected writer scope");
  const ownership = resolveOpportunityOwnership(manifest, scope, [scope.contractId], [scope.contractId]);
  check(JSON.stringify(ownership.canonical_contract_ids) === JSON.stringify([scope.contractId]),
    "Writer ownership declaration is not reciprocal");
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  check(parsed.errors.length === 0 && parsed.data.length === 6, "Package must contain six valid opportunities");
  const ids = parsed.data.map((row) => {
    check(row.tenant_key === scope.tenantKey && row.dataset_version === scope.datasetVersion &&
      row.contract_id === scope.contractId && typeof row.opportunity_id === "string" && row.opportunity_id,
    "Package opportunity scope mismatch");
    return row.opportunity_id;
  });
  check(new Set(ids).size === 6, "Package IDs must be unique");
  return { ...scope, ids: sorted(ids) };
}

function sourceFiles() {
  const manifest = readOpportunityOwnershipManifest("plan");
  const csv = fs.readFileSync(path.join(process.cwd(),
    "datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908/source-files/optimization_opportunities.csv"), "utf8");
  return { scope: packageScope(manifest, csv), manifestHash: hash(JSON.stringify(manifest)), packageHash: hash(csv) };
}

function metadata(env, mode) {
  const required = (name) => { check(env[name]?.trim(), `${name} is required`); return env[name].trim(); };
  const result = { runId: required("SOURCE_UNSIZE_RUN_ID"), operator: required("SOURCE_UNSIZE_OPERATOR"),
    jobName: required("SOURCE_UNSIZE_JOB_NAME"), buildVersion: required("SOURCE_UNSIZE_BUILD_VERSION"),
    inputVersion: required("SOURCE_UNSIZE_INPUT_VERSION"), idempotencyKey: required("SOURCE_UNSIZE_IDEMPOTENCY_KEY"),
    gitSha: required("SOURCE_UNSIZE_GIT_SHA"), imageDigest: required("SOURCE_UNSIZE_IMAGE_DIGEST"),
    executionId: env.CONTAINER_APP_JOB_EXECUTION_NAME ?? env.SOURCE_UNSIZE_ACA_EXECUTION_ID ?? null };
  check(/^[a-zA-Z0-9._-]+$/.test(result.runId) && /^sha256:[a-f0-9]{64}$/.test(result.imageDigest),
    "Invalid run ID or unpinned image");
  if (["apply", "restore"].includes(mode)) {
    check(env.SOURCE_UNSIZE_MODE_TOKEN === `SOURCE_UNSIZE_${mode.toUpperCase()}`,
      "Explicit mode token required");
    check(env.ACA_JOB_NAME === result.jobName, "ACA job identity mismatch");
  }
  return result;
}

function expected(env, mode, files) {
  if (mode === "plan") return;
  check(env.SOURCE_UNSIZE_EXPECTED_MANIFEST_SHA256 === files.manifestHash &&
    env.SOURCE_UNSIZE_EXPECTED_PACKAGE_SHA256 === files.packageHash,
  "Ownership or package hash changed");
  check(hex(env.SOURCE_UNSIZE_EXPECTED_BEFORE_SHA256), "Exact before-image plan hash required");
  const ids = JSON.parse(env.SOURCE_UNSIZE_EXPECTED_IDS ?? "null");
  check(Array.isArray(ids) && JSON.stringify(sorted(ids)) === JSON.stringify(files.scope.ids), "Exact six-ID approval required");
  if (mode === "restore") check(hex(env.SOURCE_UNSIZE_EXPECTED_AFTER_SHA256), "Exact after-image hash required");
}

async function blobTarget(env, mode) {
  if (mode === "plan" && !env.SOURCE_UNSIZE_BLOB_ACCOUNT_URL) return null;
  const url = env.SOURCE_UNSIZE_BLOB_ACCOUNT_URL;
  const container = env.SOURCE_UNSIZE_BLOB_CONTAINER;
  const prefix = env.SOURCE_UNSIZE_BLOB_PREFIX;
  check(/^https:\/\/[a-z0-9-]+\.blob\.core\.windows\.net\/?$/.test(url ?? "") &&
    /^[a-z0-9-]+$/.test(container ?? "") && /^[a-zA-Z0-9/_-]+$/.test(prefix ?? "") &&
    /^[a-f0-9-]{36}$/i.test(env.AZURE_CLIENT_ID ?? ""), "Private Blob proof target required");
  const client = new BlobServiceClient(url, new ManagedIdentityCredential(env.AZURE_CLIENT_ID))
    .getContainerClient(container);
  const properties = await client.getProperties();
  check(!properties.blobPublicAccess, "Blob proof container must be private");
  return { client, prefix };
}

async function upload(target, name, proof) {
  const body = Buffer.from(JSON.stringify(proof));
  const blob = target.client.getBlockBlobClient(`${target.prefix}/${name}.json`);
  await blob.uploadData(body, { blobHTTPHeaders: { blobContentType: "application/json" }, conditions: { ifNoneMatch: "*" } });
  const response = await blob.download();
  const chunks = [];
  for await (const chunk of response.readableStreamBody) chunks.push(chunk);
  check(hash(Buffer.concat(chunks)) === hash(body), "Blob proof readback mismatch");
  return blob.url;
}

async function snapshot(client, scope) {
  const rowsByTable = {};
  for (const table of SPINE) {
    const result = await client.query(`SELECT t.*, to_jsonb(t)::text AS __raw FROM source.${ident(table)} t
      WHERE tenant_key=$1 AND dataset_version=$2 ORDER BY id FOR UPDATE`, [scope.tenantKey, scope.datasetVersion]);
    rowsByTable[table] = result.rows.map(({ __raw, ...row }) => ({ ...row, raw: __raw }));
  }
  const selection = selectRows(rowsByTable, { ...scope, contractId: scope.contractId }, scope.ids);
  check(selection.rootCount === 6, "Exactly six canonical roots required");
  const inventory = Object.entries(rowsByTable).flatMap(([table, rows]) => rows.map((row) =>
    ({ table, id: row.id, row_sha256: hash(row.raw) })));
  inventory.sort((a, b) => `${a.table}/${a.id}`.localeCompare(`${b.table}/${b.id}`));
  return { rowsByTable, selected: selection.selected, inventory, sha256: hash(JSON.stringify(inventory)) };
}

function blockers(selected) {
  const decisions = ["approval_request", "approval_decision", "negotiated_outcome", "finance_realization",
    "finance_realization_evidence", "opportunity_stage_event"];
  for (const table of decisions) check(selected[table].length === 0, `Human action exists in ${table}`);
  check(selected.optimization_opportunity.every((row) => row.approval_state === "requires_review" &&
    ["quantified", "signal"].includes(row.stage) && row.payload?.finance_confirmation_state === "not_confirmed"),
  "Opportunity approval or stage changed");
  check(selected.optimization_opportunity.filter((row) => row.stage === "quantified" &&
    row.amount_state === "exact" && row.amount_usd !== null).length === 4 &&
    selected.optimization_opportunity.filter((row) => row.stage === "signal" &&
      row.amount_state === "range" && row.amount_usd !== null).length === 2,
  "Expected quantified/exact and signal/range composition changed");
  check(selected.optimization_case.every((row) => row.case_state === "evidence_review" && !row.door1_event_id),
    "Case review advanced");
  check(selected.opportunity_evidence.every((row) => row.review_state === "system_evidenced"),
    "Evidence has human review");
  check(selected.case_opportunity.every((row) => !row.selected_for_action &&
    Object.keys(row.payload ?? {}).length === 0), "Case selected or annotated for action");
  check(selected.evidence_request.every((row) => row.request_state === "open" &&
    Object.keys(row.payload ?? {}).length === 0), "Evidence request has been reviewed");
  check(selected.opportunity_requirement_status.every((row) => row.status === "workflow_required" &&
    Object.keys(row.payload ?? {}).length === 0), "Requirement has been reviewed");
  check(selected.opportunity_claim.every((row) => row.review_status === "draft" && !row.reviewer_ref &&
    !row.reviewed_at && row.produced_by !== "human_reviewer" && row.amount_usd === null &&
    row.amount_low_usd === null && row.amount_high_usd === null), "Claim reviewed or priced");
  check(selected.opportunity_valuation.every((row) => row.valuation_type === "potential"),
    "Approved valuation exists");
  check(selected.calculation_run.every((row) => row.rule_id === "source.cloud_consumption_package.opportunity.v1"),
    "Executable calculation may exist");
  check(selected.calculation_rule.every((row) => row.rule_id === "source.cloud_consumption_package.opportunity.v1" &&
    row.formula === "Native cloud recommendations become candidate value only after CLM terms, AP-paid spend, CMDB ownership, and evidence rows reconcile."),
    "Calculation rule is not the known methodless description");
  check(selected.calculation_input.every((row) => row.inclusion_state === "pending_review" ||
    (row.inclusion_state === "included" && row.source_table === "source.cloud_consumption_adapter_row" &&
      row.source_record_id && row.value_numeric === null && row.inclusion_reason === LEGACY_INPUT_REASON &&
      Object.keys(row.payload ?? {}).length === 0)),
  "Calculation input has an unrecognized inclusion or review state");
  check(selected.calculation_output.every((row) => Object.keys(row.payload ?? {}).length === 0),
    "Unrecognized calculation output payload");
  check(selected.optimization_opportunity.length === 6 && selected.opportunity_claim.length === 12,
    "Expected opportunity or claim row count changed");
}

async function projection(client, scope, unsized, expectedState = "active") {
  const definition = await client.query("SELECT pg_get_viewdef('consumption.sourcing_opportunity_v1'::regclass, true) AS sql");
  check(definition.rows[0]?.sql?.includes("optimization_opportunity"), "Canonical Layer 4 projection required");
  const actionDefinition = await client.query("SELECT pg_get_viewdef('source.contract_action_candidate_v1'::regclass, true) AS sql");
  check(actionDefinition.rows[0]?.sql?.includes("sourcing_opportunity_v1"),
    "Action candidate must derive from the governed opportunity projection");
  const rows = await client.query(`SELECT opportunity_id,annual_value_exposed FROM consumption.sourcing_opportunity_v1
    WHERE tenant_key=$1 AND contract_id=$2 AND opportunity_id=ANY($3::text[]) ORDER BY opportunity_id`,
  [scope.tenantKey, scope.contractId, scope.ids]);
  const actions = await client.query(`SELECT opportunity_id,candidate_amount_usd FROM source.contract_action_candidate_v1
    WHERE tenant_key=$1 AND contract_id=$2 AND opportunity_id=ANY($3::text[]) ORDER BY opportunity_id`,
  [scope.tenantKey, scope.contractId, scope.ids]);
  const opportunityIds = rows.rows.map((row) => row.opportunity_id);
  const actionIds = actions.rows.map((row) => row.opportunity_id);
  if (expectedState === "preactivation") {
    check(opportunityIds.length === 0 && actionIds.length === 0,
      "Preactivation requires zero writer rows in both Layer 4 projections");
  } else {
    check(JSON.stringify(opportunityIds) === JSON.stringify(scope.ids),
      "Layer 4 opportunity set mismatch");
    check(JSON.stringify(actionIds) === JSON.stringify(scope.ids),
      "Layer 4 action set mismatch");
  }
  if (unsized) check(rows.rows.every((row) => row.annual_value_exposed === null),
    "Layer 4 still prices an unsized opportunity");
  if (unsized) check(actions.rows.every((row) => row.candidate_amount_usd === null),
    "Layer 4 still prices an action candidate");
  return { definition_sha256: hash(JSON.stringify([definition.rows[0].sql, actionDefinition.rows[0].sql])),
    state: expectedState, rows: rows.rows, actions: actions.rows };
}

async function readArchive(client, runId) {
  const result = await client.query(`SELECT source_table,source_row_id,row_payload::text AS raw,row_sha256
    FROM source.opportunity_unsize_archive WHERE run_id=$1 ORDER BY source_table,source_row_id`, [runId]);
  check(result.rows.every((row) => hash(row.raw) === row.row_sha256 && SPINE.includes(row.source_table)),
    "Archive row tampered or unknown table");
  return result.rows;
}

function reconstructedBeforeHash(current, archive) {
  const rows = new Map(current.inventory.map((row) => [`${row.table}/${row.id}`, row]));
  for (const row of archive) {
    const key = `${row.source_table}/${row.source_row_id}`;
    check(rows.has(key), "Archived row no longer exists");
    rows.set(key, { table: row.source_table, id: row.source_row_id, row_sha256: row.row_sha256 });
  }
  const inventory = [...rows.values()].sort((a, b) =>
    `${a.table}/${a.id}`.localeCompare(`${b.table}/${b.id}`));
  return hash(JSON.stringify(inventory));
}

function assertArchiveCoverage(current, archive) {
  const expected = SPINE.flatMap((table) => current.selected[table].map((row) => `${table}/${row.id}`)).sort();
  const actual = archive.map((row) => `${row.source_table}/${row.source_row_id}`).sort();
  check(JSON.stringify(actual) === JSON.stringify(expected), "Archive does not cover every scoped before-image");
}

function assertOnlyAllowedChanges(before, after) {
  const allowed = {
    optimization_opportunity: ["amount_usd", "amount_state", "stage"],
    opportunity_valuation: ["amount_usd", "amount_low_usd", "amount_high_usd", "valuation_state"],
    calculation_input: ["inclusion_state", "inclusion_reason"],
    calculation_output: ["amount_usd"],
    calculation_run: ["run_state"],
  };
  for (const table of SPINE) {
    const oldRows = before.rowsByTable[table];
    const newRows = after.rowsByTable[table];
    check(oldRows.length === newRows.length && oldRows.every((row, i) => row.id === newRows[i].id),
      `Row identity changed in ${table}`);
    for (let i = 0; i < oldRows.length; i++) {
      const oldRow = JSON.parse(oldRows[i].raw);
      const newRow = JSON.parse(newRows[i].raw);
      for (const column of allowed[table] ?? []) {
        delete oldRow[column];
        delete newRow[column];
      }
      check(JSON.stringify(oldRow) === JSON.stringify(newRow), `Protected row content changed in ${table}`);
    }
  }
}

async function updateRows(client, snapshotRows, restore = false) {
  const ops = snapshotRows.optimization_opportunity;
  for (const row of ops) {
    const result = await client.query(`UPDATE source.optimization_opportunity SET amount_usd=$4,amount_state=$5,stage=$6
      WHERE tenant_key=$1 AND dataset_version=$2 AND id=$3`,
    [row.tenant_key, row.dataset_version, row.id, restore ? row.amount_usd : null,
      restore ? row.amount_state : "not_sized", restore ? row.stage : "signal"]);
    check(result.rowCount === 1, "Opportunity update count mismatch");
  }
  for (const row of snapshotRows.opportunity_valuation) {
    const result = await client.query(`UPDATE source.opportunity_valuation
      SET amount_usd=$4,amount_low_usd=$5,amount_high_usd=$6,valuation_state=$7
      WHERE tenant_key=$1 AND dataset_version=$2 AND id=$3`,
    [row.tenant_key, row.dataset_version, row.id, restore ? row.amount_usd : null,
      restore ? row.amount_low_usd : null, restore ? row.amount_high_usd : null,
      restore ? row.valuation_state : "not_sized"]);
    check(result.rowCount === 1, "Valuation update count mismatch");
  }
  for (const row of snapshotRows.calculation_input) {
    if (row.inclusion_state !== "included") continue;
    const result = await client.query(`UPDATE source.calculation_input
      SET inclusion_state=$4,inclusion_reason=$5
      WHERE tenant_key=$1 AND dataset_version=$2 AND id=$3`,
    [row.tenant_key, row.dataset_version, row.id, restore ? row.inclusion_state : "pending_review",
      restore ? row.inclusion_reason : UNSIZED_INPUT_REASON]);
    check(result.rowCount === 1, "Calculation input update count mismatch");
  }
  for (const row of snapshotRows.calculation_output) {
    const result = await client.query(`UPDATE source.calculation_output SET amount_usd=$4
      WHERE tenant_key=$1 AND dataset_version=$2 AND id=$3`,
    [row.tenant_key, row.dataset_version, row.id, restore ? row.amount_usd : null]);
    check(result.rowCount === 1, "Calculation output update count mismatch");
  }
  for (const row of snapshotRows.calculation_run) {
    const result = await client.query(`UPDATE source.calculation_run SET run_state=$4
      WHERE tenant_key=$1 AND dataset_version=$2 AND id=$3`,
    [row.tenant_key, row.dataset_version, row.id, restore ? row.run_state : "blocked"]);
    check(result.rowCount === 1, "Calculation run update count mismatch");
  }
}

export async function runJob({ mode, env = process.env, pool, targetOverride, filesOverride } = {}) {
  check(["plan", "apply", "verify", "restore"].includes(mode), "Invalid job mode");
  const files = filesOverride ?? sourceFiles();
  const meta = metadata(env, mode);
  const layer4State = env.SOURCE_UNSIZE_LAYER4_STATE === "PREACTIVATION" ? "preactivation" : "active";
  check(env.SOURCE_UNSIZE_LAYER4_STATE === undefined ||
    env.SOURCE_UNSIZE_LAYER4_STATE === "PREACTIVATION", "Invalid Layer 4 state token");
  check(meta.inputVersion === files.scope.datasetVersion, "Input version mismatch");
  expected(env, mode, files);
  const target = targetOverride ?? await blobTarget(env, mode);
  const client = await pool.connect();
  const proof = { mode, run_id: meta.runId, job_name: meta.jobName, tenant_scope: files.scope.tenantKey,
    dataset_version: files.scope.datasetVersion, contract_id: files.scope.contractId,
    opportunity_ids: files.scope.ids, build_version: meta.buildVersion, input_source_version: meta.inputVersion,
    idempotency_key: meta.idempotencyKey, operator_identity: meta.operator, git_sha: meta.gitSha,
    image_digest: meta.imageDigest, aca_execution_id: meta.executionId,
    manifest_sha256: files.manifestHash, package_sha256: files.packageHash,
    started_at: new Date().toISOString() };
  let committed = false;
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SET LOCAL row_security = off");
    const role = await client.query(`SELECT COALESCE((SELECT rolsuper OR rolbypassrls FROM pg_roles
      WHERE rolname=current_user),false) AS unfiltered`);
    check(role.rows[0]?.unfiltered === true, "Unfiltered operator role required");
    await client.query("SELECT set_config('app.tenant_key',$1,true)", [files.scope.tenantKey]);
    if (mode === "plan" || mode === "apply") {
      const before = await snapshot(client, files.scope);
      blockers(before.selected);
      const l4 = await projection(client, files.scope, false, layer4State);
      Object.assign(proof, { before_sha256: before.sha256, row_count: before.inventory.length,
        table_counts: Object.fromEntries(SPINE.map((table) => [table, before.selected[table].length])),
        layer4_definition_sha256: l4.definition_sha256, layer4_state: l4.state, quality_gate: "PASS" });
      if (mode === "apply") {
        check(before.sha256 === env.SOURCE_UNSIZE_EXPECTED_BEFORE_SHA256 &&
          l4.definition_sha256 === env.SOURCE_UNSIZE_EXPECTED_LAYER4_SHA256 &&
          l4.state === env.SOURCE_UNSIZE_EXPECTED_LAYER4_STATE,
        "Exact plan hash or Layer 4 definition changed");
        const existing = await client.query("SELECT run_id FROM source.opportunity_unsize_run WHERE run_id=$1", [meta.runId]);
        check(existing.rows.length === 0, "Run ID already used");
        const prepared = await upload(target, `${meta.runId}-prepared`, { ...proof, status: "prepared_uncommitted",
          before_rows: Object.fromEntries(SPINE.map((table) => [table, before.selected[table].map((row) => JSON.parse(row.raw))])) });
        await client.query(`INSERT INTO source.opportunity_unsize_run
          (run_id,tenant_key,dataset_version,contract_id,opportunity_ids,manifest_sha256,package_sha256,
           before_sha256,after_sha256,archive_row_count,state,operator_identity,prepared_proof_url)
          VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,'applied',$11,$12)`,
        [meta.runId, files.scope.tenantKey, files.scope.datasetVersion, files.scope.contractId,
          JSON.stringify(files.scope.ids), files.manifestHash, files.packageHash, before.sha256,
          "0".repeat(64), before.selected && Object.values(before.selected).reduce((n, rows) => n + rows.length, 0),
          meta.operator, prepared]);
        for (const table of SPINE) for (const row of before.selected[table]) {
          await client.query(`INSERT INTO source.opportunity_unsize_archive
            (run_id,tenant_key,dataset_version,contract_id,source_table,source_row_id,row_payload,row_sha256)
            VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
          [meta.runId, files.scope.tenantKey, files.scope.datasetVersion, files.scope.contractId,
            table, row.id, row.raw, hash(row.raw)]);
        }
        const archive = await readArchive(client, meta.runId);
        check(archive.length === Object.values(before.selected).reduce((n, rows) => n + rows.length, 0),
          "Durable archive count mismatch");
        await updateRows(client, before.selected);
        const after = await snapshot(client, files.scope);
        assertOnlyAllowedChanges(before, after);
        check(after.selected.calculation_input.every((row) => row.inclusion_state === "pending_review"),
          "Unsized calculation input remained included");
        const afterL4 = await projection(client, files.scope, true, layer4State);
        check(afterL4.definition_sha256 === l4.definition_sha256, "Layer 4 definition changed during apply");
        await client.query("UPDATE source.opportunity_unsize_run SET after_sha256=$2 WHERE run_id=$1",
          [meta.runId, after.sha256]);
        Object.assign(proof, { status: "applied", after_sha256: after.sha256,
          prepared_proof_url: prepared, archive_row_count: archive.length });
      }
    } else {
      const result = await client.query(`SELECT * FROM source.opportunity_unsize_run WHERE run_id=$1
        ${mode === "restore" ? "FOR UPDATE" : ""}`, [meta.runId]);
      check(result.rows.length === 1, "Archive run missing");
      const prior = result.rows[0];
      check(prior.tenant_key === files.scope.tenantKey && prior.dataset_version === files.scope.datasetVersion &&
        prior.contract_id === files.scope.contractId && prior.manifest_sha256 === files.manifestHash &&
        prior.package_sha256 === files.packageHash && prior.before_sha256 === env.SOURCE_UNSIZE_EXPECTED_BEFORE_SHA256 &&
        JSON.stringify(prior.opportunity_ids) === JSON.stringify(files.scope.ids), "Archived plan scope changed");
      const archive = await readArchive(client, meta.runId);
      check(archive.length === prior.archive_row_count, "Archive incomplete");
      const now = await snapshot(client, files.scope);
      check(now.sha256 === prior.after_sha256, "After-image changed; restore/verify refused");
      assertArchiveCoverage(now, archive);
      check(reconstructedBeforeHash(now, archive) === prior.before_sha256,
        "Archive does not reconstruct the approved before-image");
      check(layer4State === env.SOURCE_UNSIZE_EXPECTED_LAYER4_STATE,
        "Exact Layer 4 state confirmation required");
      await projection(client, files.scope, true, layer4State);
      Object.assign(proof, { before_sha256: prior.before_sha256, after_sha256: now.sha256,
        archive_row_count: archive.length });
      if (mode === "restore") {
        check(prior.state === "applied" && env.SOURCE_UNSIZE_EXPECTED_AFTER_SHA256 === now.sha256,
          "Exact after-image restore approval required");
        const prepared = await upload(target, `${meta.runId}-restore-prepared`,
          { ...proof, status: "restore_prepared_uncommitted" });
        const archived = Object.fromEntries(SPINE.map((table) => [table,
          archive.filter((row) => row.source_table === table).map((row) => JSON.parse(row.raw))]));
        await updateRows(client, archived, true);
        const restored = await snapshot(client, files.scope);
        check(restored.sha256 === prior.before_sha256, "Restored before-image mismatch");
        await client.query(`UPDATE source.opportunity_unsize_run
          SET state='restored',restored_at=now(),restore_proof_url=$2 WHERE run_id=$1`, [meta.runId, prepared]);
        Object.assign(proof, { status: "restored", restored_sha256: restored.sha256,
          prepared_proof_url: prepared, quality_gate: "PASS" });
      } else {
        check(prior.state === "applied", "Run is not applied");
        proof.status = "verified";
        proof.quality_gate = "PASS";
      }
    }
    await client.query("COMMIT");
    committed = true;
    proof.finished_at = new Date().toISOString();
    if (target && mode !== "plan") {
      const proofName = mode === "verify" ? `${meta.runId}-verify-${crypto.randomUUID()}-final` :
        `${meta.runId}-${mode}-final`;
      proof.proof_url = await upload(target, proofName, proof);
    }
    return proof;
  } catch (error) {
    if (committed) throw new Error(`Database committed but final Blob proof failed for ${meta.runId}; run verify`, { cause: error });
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { client.release(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const mode = process.argv.find((arg) => arg.startsWith("--mode="))?.slice(7);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  runJob({ mode, pool }).then((proof) => {
    console.log(JSON.stringify(proof));
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "source-unsize-proof-"));
    try {
      fs.writeFileSync(path.join(dir, "summary.json"), `${JSON.stringify(proof, null, 2)}\n`);
      const tarPath = `${dir}.tgz`;
      const tar = spawnSync("tar", ["-czf", tarPath, "-C", dir, "summary.json"], { encoding: "utf8" });
      check(tar.status === 0, `Proof tar failed: ${tar.stderr}`);
      const encoded = fs.readFileSync(tarPath).toString("base64");
      console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
      for (let i = 0; i < encoded.length; i += 7600) console.log(encoded.slice(i, i + 7600));
      console.log("__SEMANTIC2_PROOF_TGZ_END__");
      fs.rmSync(tarPath);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }).catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
}
