#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  bindFoundationV2SqlContext,
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  stableJson,
  writeCsv,
  writeJson,
} from "./golden-slice-support.mjs";

const EXPECTED = {
  tenantKey: "phs_health_demo_global",
  datasetId: "phs-health-source-v1-202608",
  datasetVersion: "v1",
  asOfDate: "2026-07-31",
};

const SOURCE_VOLUME_RELEASE_VERSION = "source-volume-v1";
const SOURCE_RELEASE_ID = `${EXPECTED.datasetId}:${SOURCE_VOLUME_RELEASE_VERSION}`;
const SOURCE_VOLUME_EXECUTION_ID = `${EXPECTED.datasetId}:source-volume-apply-v1`;
const TEST_NAMESPACE = "phs-healthcare-demo-source-volume-v1";
const FOUNDATION_RELEASE_ALIAS = "phs-healthcare-demo-phase-a-source-volume-v1";
const ISOLATION_SCOPE = "ISOLATED_PHS_HEALTHCARE_DEMO_LAB_ONLY";
const SOURCE_VOLUME_GATE_IDS = ["PHS-SOURCE-VOLUME-L0-L1", "PHS-SOURCE-VOLUME-L1-L2"];
const WRITER_ROLE = process.env.PHS_HEALTHCARE_DEMO_DB_WRITER_ROLE || "foundation_v2_healthcare_gs_writer";
const READER_ROLE = process.env.PHS_HEALTHCARE_DEMO_DB_READER_ROLE || "foundation_v2_healthcare_gs_reader";

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({
    status: "PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_FAILED",
    error: error.message,
  }, null, 2));
  process.exit(1);
});

async function main() {
  if (args.mode === "self-test") {
    fs.mkdirSync(args.outDir, { recursive: true });
    const result = await runSourceVolumeSelfTest();
    writeJson(proofRef(args.outDir, "PHS_SOURCE_VOLUME_SELF_TEST.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const plan = buildSourceVolumePlan();
  fs.mkdirSync(args.outDir, { recursive: true });
  writePlanProof(args.outDir, plan);

  if (args.mode === "plan") {
    const result = manifest("PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_PLAN_READY", plan, {});
    writeJson(proofRef(args.outDir, "PHS_SOURCE_VOLUME_PLAN.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.mode === "apply") assertApplyApproved(plan);
  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("phs-healthcare-demo-source-volume"));
  bindFoundationV2SqlContext(client);
  await client.connect();
  try {
    if (args.mode === "preflight") {
      const result = await preflight(client, plan);
      writeJson(proofRef(args.outDir, "PHS_SOURCE_VOLUME_PREFLIGHT.json"), result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client, plan);
      writeJson(proofRef(args.outDir, "PHS_SOURCE_VOLUME_VERIFY.json"), result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const result = await apply(client, plan);
    writeJson(proofRef(args.outDir, "PHS_SOURCE_VOLUME_APPLY.json"), result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.PHS_SOURCE_VOLUME_MODE || "plan",
    packageDir: process.env.PHS_HEALTHCARE_DEMO_PACKAGE_DIR || latestPackageDir(),
    outDir: process.env.PHS_SOURCE_VOLUME_OUT_DIR || path.join(os.tmpdir(), "phs-healthcare-demo-source-volume"),
    approvedProofSha256: process.env.PHS_HEALTHCARE_DEMO_APPROVED_PROOF_SHA256 || "",
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.PHS_SOURCE_VOLUME_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--package-dir") parsed.packageDir = path.resolve(next());
    else if (arg === "--out-dir") parsed.outDir = path.resolve(next());
    else if (arg === "--approved-proof-sha256") parsed.approvedProofSha256 = next();
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["plan", "preflight", "apply", "verify", "self-test"].includes(parsed.mode)) {
    throw new Error(`Unsupported mode ${parsed.mode}`);
  }
  return parsed;
}

function latestPackageDir() {
  const downloads = "/Users/anand/Downloads";
  const matches = fs.readdirSync(downloads, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("phs_healthcare_demo_phase_a_"))
    .map((entry) => path.join(downloads, entry.name))
    .sort();
  if (matches.length === 0) throw new Error("No PHS healthcare demo package found in /Users/anand/Downloads");
  return matches[matches.length - 1];
}

function buildSourceVolumePlan() {
  const packageDir = path.resolve(args.packageDir);
  const packageManifestPath = path.join(packageDir, "phs_healthcare_demo_package_manifest.json");
  const phaseResultPath = path.join(packageDir, "phase_a_result.json");
  assertFile(packageManifestPath);
  assertFile(phaseResultPath);
  const packageManifest = readJson(packageManifestPath);
  const phaseResult = readJson(phaseResultPath);
  assertPackageIdentity(packageManifest);
  const proofZip = path.join(path.dirname(packageDir), phaseResult.proof_zip);
  assertFile(proofZip);
  const proofZipSha256 = sha256(fs.readFileSync(proofZip));
  const proofZipAttestation = `${proofZip}.sha256`;
  assertFile(proofZipAttestation);
  const attestation = fs.readFileSync(proofZipAttestation, "utf8");
  if (!attestation.includes(proofZipSha256)) {
    throw new Error(`Proof ZIP SHA attestation mismatch for ${proofZip}`);
  }
  execFileSync("unzip", ["-t", proofZip], { stdio: "ignore" });

  const files = sourceFilePlans(packageDir, packageManifest);
  const totalRows = files.reduce((sum, file) => sum + file.row_count, 0);
  const totalFields = files.reduce((sum, file) => sum + file.field_count, 0);
  const releaseHash = sha256(stableJson(files.map((file) => ({
    relative_path: file.relative_path,
    content_sha256: file.content_sha256,
    row_count: file.row_count,
    field_count: file.field_count,
  }))));

  return {
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    execution_id: SOURCE_VOLUME_EXECUTION_ID,
    release_version: SOURCE_VOLUME_RELEASE_VERSION,
    release_hash: releaseHash,
    isolation_scope: ISOLATION_SCOPE,
    package_dir: packageDir,
    proof_zip: proofZip,
    proof_zip_sha256: proofZipSha256,
    file_count: files.length,
    total_source_rows: totalRows,
    total_field_values: totalFields,
    max_columns: Math.max(...files.map((file) => file.headers.length)),
    restricted_detail_health_plan_extracts_present: files
      .map((file) => file.file_name)
      .filter((fileName) => ["PAYER_CLAIMS_ENROLLMENT_MONTHLY.csv", "STARS_HEDIS_MEASURE_PERFORMANCE.csv"].includes(fileName)),
    files,
  };
}

function assertPackageIdentity(manifest) {
  if (manifest.tenant_key !== EXPECTED.tenantKey) throw new Error(`Unexpected tenant_key ${manifest.tenant_key}`);
  if (manifest.dataset_id !== EXPECTED.datasetId) throw new Error(`Unexpected dataset_id ${manifest.dataset_id}`);
  if (manifest.dataset_version !== EXPECTED.datasetVersion) throw new Error(`Unexpected dataset_version ${manifest.dataset_version}`);
  if (manifest.activation_state !== "generated_not_loaded") throw new Error(`Package activation state must be generated_not_loaded, got ${manifest.activation_state}`);
}

function sourceFilePlans(packageDir, packageManifest) {
  const contracts = (packageManifest.file_contracts || [])
    .filter((contract) => String(contract.path || "").startsWith("source_system_extracts/") && contract.format === "csv")
    .sort((left, right) => String(left.path).localeCompare(String(right.path)));
  return contracts.map((contract, index) => {
    const relativePath = contract.path;
    const absolutePath = path.join(packageDir, relativePath);
    assertFile(absolutePath);
    const content = fs.readFileSync(absolutePath, "utf8");
    const rows = parseCsv(content);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : parseCsvHeaders(content);
    if (contract.expected_rows !== rows.length) {
      throw new Error(`${relativePath} row count mismatch: expected ${contract.expected_rows}, got ${rows.length}`);
    }
    return {
      file_index: index + 1,
      relative_path: relativePath,
      file_name: path.basename(relativePath),
      source_file_id: `${SOURCE_RELEASE_ID}:source-file:${shortHash(relativePath, 16)}`,
      source_family: contract.domain_contract,
      object_type: slug(contract.source_object || contract.grain || path.basename(relativePath, ".csv")).replace(/-/g, "_"),
      content_sha256: sha256(content),
      bytes: fs.statSync(absolutePath).size,
      headers,
      row_count: rows.length,
      field_count: rows.length * headers.length,
      rows,
    };
  });
}

async function preflight(client, plan) {
  await client.query("BEGIN");
  try {
    await setContext(client, WRITER_ROLE);
    const existing = await sourceVolumeCounts(client);
    await client.query("ROLLBACK");
    const existingTotal = Object.values(existing).reduce((sum, value) => sum + Number(value || 0), 0);
    const exact = exactSourceVolumeCounts(plan, existing);
    return manifest(existingTotal === 0 || exact ? "PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_PREFLIGHT_PASSED" : "PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_PREFLIGHT_FAILED", plan, {
      existing_counts: existing,
      existing_total: existingTotal,
      existing_exact_match: exact,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function apply(client, plan) {
  const startedAt = new Date().toISOString();
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`foundation-v2:${EXPECTED.tenantKey}:${TEST_NAMESPACE}:source-volume`]);
    await setContext(client, WRITER_ROLE);
    const existing = await sourceVolumeCounts(client);
    if (Object.values(existing).some((value) => Number(value || 0) > 0)) {
      if (!exactSourceVolumeCounts(plan, existing)) {
        throw new Error(`Existing PHS source-volume rows do not match expected counts: ${JSON.stringify(existing)}`);
      }
      await client.query("ROLLBACK");
      return manifest("PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_ALREADY_APPLIED_EXACT_MATCH", plan, {
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        existing_counts: existing,
      });
    }

    await insertSourceRelease(client, plan);
    await insertSourceFiles(client, plan);
    for (const file of plan.files) {
      await insertSourceRowsAndFields(client, plan, file);
    }
    await insertParserExecution(client, plan);
    await insertGateResults(client, plan);
    const counts = await sourceVolumeCounts(client);
    if (!exactSourceVolumeCounts(plan, counts)) {
      throw new Error(`PHS source-volume variance after write: ${JSON.stringify(counts)}`);
    }
    await client.query("COMMIT");
    return manifest("PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_APPLIED", plan, {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      actual_counts: counts,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function verify(client, plan) {
  await client.query("BEGIN");
  try {
    const role = process.env.PHS_SOURCE_VOLUME_DB_ROLE === "writer" ? WRITER_ROLE : READER_ROLE;
    await setContext(client, role);
    const counts = await sourceVolumeCounts(client);
    await client.query("ROLLBACK");
    const exact = exactSourceVolumeCounts(plan, counts);
    return manifest(exact ? "PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_VERIFIED" : "PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_VERIFY_FAILED", plan, {
      actual_counts: counts,
      exact_match: exact,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

function assertApplyApproved(plan) {
  if (process.env.PHS_HEALTHCARE_DEMO_LAYER1_APPLY_APPROVED !== "true") {
    throw new Error("PHS_HEALTHCARE_DEMO_LAYER1_APPLY_APPROVED=true is required for apply");
  }
  const approvedSha = args.approvedProofSha256 || process.env.PHS_HEALTHCARE_DEMO_APPROVED_PROOF_SHA256 || "";
  if (!approvedSha || approvedSha !== plan.proof_zip_sha256) {
    throw new Error("Approved proof SHA is required and must match the PHS proof ZIP SHA");
  }
  if (!process.env.ACA_JOB_NAME && process.env.PHS_HEALTHCARE_DEMO_ALLOW_NON_ACA_APPLY !== "true") {
    throw new Error("Apply must run from an ACA data-build job unless PHS_HEALTHCARE_DEMO_ALLOW_NON_ACA_APPLY=true is explicitly set");
  }
  if (plan.restricted_detail_health_plan_extracts_present.length > 0) {
    throw new Error(`Restricted detailed health-plan extracts present: ${plan.restricted_detail_health_plan_extracts_present.join(", ")}`);
  }
}

async function setContext(client, roleName) {
  await client.query("SET LOCAL row_security = on");
  await q(client, "SELECT set_config('app.tenant_key', $1, true)", [EXPECTED.tenantKey]);
  await q(client, "SELECT set_config('app.client_key', $1, true)", [EXPECTED.tenantKey]);
  await q(client, "SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
  await q(client, "SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [SOURCE_RELEASE_ID]);
  await q(client, "SELECT set_config('app.foundation_v2_release_alias', $1, true)", [FOUNDATION_RELEASE_ALIAS]);
  await client.query(`SET LOCAL ROLE ${quoteIdent(roleName)}`);
}

async function sourceVolumeCounts(client) {
  const output = {};
  for (const table of ["source_releases", "source_files", "source_records", "source_field_values", "parser_executions", "gate_results"]) {
    if (table === "gate_results") {
      output[table] = Number((await rows(
        client,
        `SELECT count(*)::int AS count
           FROM foundation_v2.gate_results
          WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id = ANY($3::text[])`,
        [EXPECTED.tenantKey, TEST_NAMESPACE, SOURCE_VOLUME_GATE_IDS],
      ))[0].count);
      continue;
    }
    output[table] = Number((await rows(
      client,
      `SELECT count(*)::int AS count
         FROM foundation_v2.${table}
        WHERE tenant_key=$1 AND test_namespace=$2`,
      [EXPECTED.tenantKey, TEST_NAMESPACE],
    ))[0].count);
  }
  return output;
}

function exactSourceVolumeCounts(plan, counts) {
  return (
    Number(counts.source_releases || 0) === 1 &&
    Number(counts.source_files || 0) === plan.file_count &&
    Number(counts.source_records || 0) === plan.total_source_rows &&
    Number(counts.source_field_values || 0) === plan.total_field_values &&
    Number(counts.parser_executions || 0) === 1 &&
    Number(counts.gate_results || 0) === 2
  );
}

async function insertSourceRelease(client, plan) {
  await q(
    client,
    `INSERT INTO foundation_v2.source_releases
      (source_release_id, tenant_key, test_namespace, release_version, release_hash, source_release_state,
       isolation_scope, v1_component_classification, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,'isolated_golden_slice',$6,'SUPERSEDE_WITH_V2',$7)`,
    [SOURCE_RELEASE_ID, EXPECTED.tenantKey, TEST_NAMESPACE, plan.release_version, plan.release_hash, ISOLATION_SCOPE, plan.execution_id],
  );
}

async function insertSourceFiles(client, plan) {
  await insertBatches(
    client,
    `INSERT INTO foundation_v2.source_files
      (source_file_id, source_release_id, tenant_key, test_namespace, source_uri, file_name,
       content_sha256, row_count, field_count, writer_job_id)
     VALUES `,
    ["source_file_id", "source_release_id", "tenant_key", "test_namespace", "source_uri", "file_name", "content_sha256", "row_count", "field_count", "writer_job_id"],
    plan.files.map((file) => ({
      source_file_id: file.source_file_id,
      source_release_id: SOURCE_RELEASE_ID,
      tenant_key: EXPECTED.tenantKey,
      test_namespace: TEST_NAMESPACE,
      source_uri: `package://${EXPECTED.datasetId}/${file.relative_path}`,
      file_name: file.file_name,
      content_sha256: file.content_sha256,
      row_count: file.row_count,
      field_count: file.field_count,
      writer_job_id: plan.execution_id,
    })),
  );
}

async function insertSourceRowsAndFields(client, plan, file) {
  const recordBatch = [];
  const fieldBatch = [];
  const flushReadyRowsAndFields = async () => {
    if (recordBatch.length === 0) return;
    await flushRecordBatch(client, recordBatch);
    recordBatch.length = 0;
    if (fieldBatch.length > 0) {
      await flushFieldBatch(client, fieldBatch);
      fieldBatch.length = 0;
    }
  };

  for (let rowIndex = 0; rowIndex < file.rows.length; rowIndex += 1) {
    const row = file.rows[rowIndex];
    const rowNumber = rowIndex + 1;
    const rowHash = sha256(stableJson({ path: file.relative_path, rowNumber, row }));
    const sourceRecordId = `${SOURCE_RELEASE_ID}:source-record:${shortHash(file.relative_path, 10)}:${rowNumber}`;
    recordBatch.push({
      source_record_id: sourceRecordId,
      source_file_id: file.source_file_id,
      source_release_id: SOURCE_RELEASE_ID,
      tenant_key: EXPECTED.tenantKey,
      test_namespace: TEST_NAMESPACE,
      source_row_number: rowNumber,
      source_row_hash: rowHash,
      row_disposition: "MATCHED",
      row_disposition_reason: `phs-source-volume:${file.file_name}`,
      writer_job_id: plan.execution_id,
    });
    for (let fieldIndex = 0; fieldIndex < file.headers.length; fieldIndex += 1) {
      const header = file.headers[fieldIndex];
      const value = row[header] == null ? "" : String(row[header]);
      fieldBatch.push({
        source_field_value_id: `${SOURCE_RELEASE_ID}:sfv:${rowHash.slice(0, 24)}:${String(fieldIndex + 1).padStart(2, "0")}`,
        source_record_id: sourceRecordId,
        source_file_id: file.source_file_id,
        source_release_id: SOURCE_RELEASE_ID,
        tenant_key: EXPECTED.tenantKey,
        test_namespace: TEST_NAMESPACE,
        source_field_id: `${shortHash(file.relative_path, 10)}:${String(fieldIndex + 1).padStart(2, "0")}:${slug(header)}`,
        source_field_name: header,
        raw_value: value,
        normalized_value: value,
        field_disposition: "PRESERVED_AS_EVIDENCE",
        target_object_type: file.object_type,
        target_field_name: slug(header),
        adapter_rule_id: `phs-healthcare-source-volume-v1:${file.object_type}:${slug(header)}`,
        evidence_ref: `package://${EXPECTED.datasetId}/${file.relative_path}#row=${rowNumber}`,
        restricted: file.file_name === "HEALTH_PLAN_OUTCOME_SNAPSHOT.csv",
        writer_job_id: plan.execution_id,
      });
    }
    if (recordBatch.length >= 1000) await flushReadyRowsAndFields();
  }
  await flushReadyRowsAndFields();
}

async function flushRecordBatch(client, batch) {
  await insertBatches(
    client,
    `INSERT INTO foundation_v2.source_records
      (source_record_id, source_file_id, source_release_id, tenant_key, test_namespace, source_row_number,
       source_row_hash, row_disposition, row_disposition_reason, writer_job_id)
     VALUES `,
    ["source_record_id", "source_file_id", "source_release_id", "tenant_key", "test_namespace", "source_row_number", "source_row_hash", "row_disposition", "row_disposition_reason", "writer_job_id"],
    batch,
  );
}

async function flushFieldBatch(client, batch) {
  await insertBatches(
    client,
    `INSERT INTO foundation_v2.source_field_values
      (source_field_value_id, source_record_id, source_file_id, source_release_id, tenant_key, test_namespace,
       source_field_id, source_field_name, raw_value, normalized_value, field_disposition, target_object_type,
       target_field_name, adapter_rule_id, evidence_ref, restricted, writer_job_id)
     VALUES `,
    ["source_field_value_id", "source_record_id", "source_file_id", "source_release_id", "tenant_key", "test_namespace", "source_field_id", "source_field_name", "raw_value", "normalized_value", "field_disposition", "target_object_type", "target_field_name", "adapter_rule_id", "evidence_ref", "restricted", "writer_job_id"],
    batch,
  );
}

async function insertParserExecution(client, plan) {
  await q(
    client,
    `INSERT INTO foundation_v2.parser_executions
      (parser_execution_id, source_release_id, tenant_key, test_namespace, parser_contract_version,
       input_file_count, output_record_count, output_field_count, rejected_record_count, parser_status, writer_job_id)
     VALUES ($1,$2,$3,$4,'phs-healthcare-source-volume-v1',$5,$6,$7,0,'passed',$8)`,
    [
      `${SOURCE_RELEASE_ID}:parser-execution-001`,
      SOURCE_RELEASE_ID,
      EXPECTED.tenantKey,
      TEST_NAMESPACE,
      plan.file_count,
      plan.total_source_rows,
      plan.total_field_values,
      plan.execution_id,
    ],
  );
}

async function insertGateResults(client, plan) {
  const gates = [
    ["PHS-SOURCE-VOLUME-L0-L1", "source files to landed rows", plan.total_source_rows, plan.total_source_rows],
    ["PHS-SOURCE-VOLUME-L1-L2", "landed rows to parsed fields", plan.total_source_rows, plan.total_field_values],
  ];
  await insertBatches(
    client,
    `INSERT INTO foundation_v2.gate_results
      (gate_result_id, tenant_key, test_namespace, gate_id, transition, input_count, output_count,
       unexplained_variance, gate_status, failure_classification, repair_owner, rerun_scope, proof_uri, writer_job_id)
     VALUES `,
    ["gate_result_id", "tenant_key", "test_namespace", "gate_id", "transition", "input_count", "output_count", "unexplained_variance", "gate_status", "failure_classification", "repair_owner", "rerun_scope", "proof_uri", "writer_job_id"],
    gates.map(([gateId, transition, inputCount, outputCount]) => ({
      gate_result_id: `${SOURCE_RELEASE_ID}:${gateId}`,
      tenant_key: EXPECTED.tenantKey,
      test_namespace: TEST_NAMESPACE,
      gate_id: gateId,
      transition,
      input_count: inputCount,
      output_count: outputCount,
      unexplained_variance: 0,
      gate_status: "passed",
      failure_classification: null,
      repair_owner: "foundation-v2-agent",
      rerun_scope: "phs-source-volume",
      proof_uri: `proof://foundation-v2/${SOURCE_VOLUME_EXECUTION_ID}/${gateId}`,
      writer_job_id: plan.execution_id,
    })),
  );
}

async function runSourceVolumeSelfTest() {
  const calls = [];
  const client = {
    async query(sql, params = []) {
      if (String(sql).includes("source_records")) calls.push({ table: "source_records", param_count: params.length });
      if (String(sql).includes("source_field_values")) calls.push({ table: "source_field_values", param_count: params.length });
      return { rows: [] };
    },
  };
  const headers = Array.from({ length: 1001 }, (_, index) => `field_${String(index + 1).padStart(4, "0")}`);
  const row = Object.fromEntries(headers.map((header, index) => [header, `value-${index + 1}`]));
  await insertSourceRowsAndFields(
    client,
    { execution_id: "phs-source-volume-self-test" },
    {
      relative_path: "source_system_extracts/self-test.csv",
      file_name: "self-test.csv",
      source_file_id: "phs-source-volume-self-test:file",
      object_type: "self_test_object",
      headers,
      rows: [row],
    },
  );
  const firstWrite = calls[0]?.table || "";
  const recordWrites = calls.filter((call) => call.table === "source_records").length;
  const fieldWrites = calls.filter((call) => call.table === "source_field_values").length;
  const passed = firstWrite === "source_records" && recordWrites === 1 && fieldWrites === 1;
  if (!passed) {
    throw new Error(`PHS source-volume row/field FK write order failed: ${JSON.stringify(calls)}`);
  }
  return {
    status: "PHS_HEALTHCARE_DEMO_SOURCE_VOLUME_SELF_TEST_PASSED",
    first_write: firstWrite,
    record_writes: recordWrites,
    field_writes: fieldWrites,
    field_values_replayed: headers.length,
  };
}

async function insertBatches(client, sqlPrefix, columns, rowsToInsert) {
  if (rowsToInsert.length === 0) return;
  const chunkSize = Math.max(1, Math.floor(60000 / columns.length));
  for (let offset = 0; offset < rowsToInsert.length; offset += chunkSize) {
    const chunk = rowsToInsert.slice(offset, offset + chunkSize);
    const params = [];
    const valuesSql = chunk.map((row, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        params.push(row[column]);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(",")})`;
    });
    await client.query(`${sqlPrefix}${valuesSql.join(",")}`, params);
  }
}

function writePlanProof(outDir, plan) {
  writeJson(proofRef(outDir, "PHS_SOURCE_VOLUME_EXPECTED_COUNTS.json"), publicPlanSummary(plan));
  writeCsv(
    proofRef(outDir, "PHS_SOURCE_VOLUME_FILES.csv"),
    ["file_name", "source_family", "row_count", "field_count", "content_sha256"],
    plan.files.map((file) => ({
      file_name: file.file_name,
      source_family: file.source_family,
      row_count: file.row_count,
      field_count: file.field_count,
      content_sha256: file.content_sha256,
    })),
  );
}

function manifest(status, plan, extra) {
  return {
    status,
    generated_at: new Date().toISOString(),
    mutation_executed: status.endsWith("_APPLIED"),
    ...publicPlanSummary(plan),
    ...extra,
  };
}

function publicPlanSummary(plan) {
  return {
    tenant_key: plan.tenant_key,
    dataset_id: plan.dataset_id,
    dataset_version: plan.dataset_version,
    test_namespace: plan.test_namespace,
    source_release_id: plan.source_release_id,
    foundation_release_alias: plan.foundation_release_alias,
    execution_id: plan.execution_id,
    release_version: plan.release_version,
    release_hash: plan.release_hash,
    isolation_scope: plan.isolation_scope,
    package_dir: plan.package_dir,
    proof_zip: plan.proof_zip,
    proof_zip_sha256: plan.proof_zip_sha256,
    file_count: plan.file_count,
    total_source_rows: plan.total_source_rows,
    total_field_values: plan.total_field_values,
    max_columns: plan.max_columns,
    restricted_detail_health_plan_extracts_present: plan.restricted_detail_health_plan_extracts_present,
  };
}

function parseCsvHeaders(text) {
  const [first = ""] = text.split(/\n/u);
  return first.split(",").map((header) => header.replace(/^"|"$/g, ""));
}

function parseCsv(text) {
  const rawRows = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rawRows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rawRows.push(row);
  }
  const [header = [], ...data] = rawRows.filter((candidate) => candidate.some((cell) => cell !== ""));
  return data.map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function rows(client, sql, params = []) {
  return (await client.query(sql, params)).rows;
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertFile(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function shortHash(value, length = 12) {
  return sha256(value).slice(0, length);
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function quoteIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value.replace(/"/g, '""')}"`;
}
