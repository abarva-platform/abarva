#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

import {
  FOUNDATION_RELEASE_ALIAS,
  ISOLATION_SCOPE,
  READER_ROLE,
  SOURCE_RELEASE_ID,
  TENANT_KEY,
  TEST_NAMESPACE,
  WRITER_ROLE,
  bindFoundationV2SqlContext,
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  sha256,
  stableJson,
  writeCsv,
  writeJson,
} from "./golden-slice-support.mjs";

const PACKAGE_ROOT = process.env.HEALTHCARE_SOURCE_PACKAGE_ROOT
  ? path.resolve(process.env.HEALTHCARE_SOURCE_PACKAGE_ROOT)
  : path.resolve("clients/healthcare-demo-new/19-template-instantiation-source-corpus");
const FREEZE_MANIFEST = path.resolve(
  "clients/healthcare-demo-new/execution/healthcare-demo-new-source-corpus-v1.0.0.freeze-manifest.json",
);
const PACKAGE_MANIFEST = path.join(PACKAGE_ROOT, "PACKAGE_MANIFEST.json");
const PARSER_VISIBLE_MANIFEST = path.join(PACKAGE_ROOT, "03-source-corpus-design/parser-visible-source-manifest.csv");
const SOURCE_VOLUME_RELEASE_VERSION = "source-volume-v1";
const SOURCE_VOLUME_EXECUTION_ID = `${SOURCE_RELEASE_ID}:source-volume-execution-v1`;

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_FAILED",
        error: error.message,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

async function main() {
  const plan = buildSourceVolumePlan();
  fs.mkdirSync(args.outDir, { recursive: true });
  writePlanProof(args.outDir, plan);

  if (args.mode === "plan") {
    const result = manifest("HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_PLAN_READY", plan, {});
    writeJson(proofRef(args.outDir, "HEALTHCARE_SOURCE_VOLUME_PLAN.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("foundation-v2-healthcare-source-volume"));
  bindFoundationV2SqlContext(client);
  await client.connect();
  try {
    if (args.mode === "preflight") {
      const result = await preflight(client, plan);
      writeJson(proofRef(args.outDir, "HEALTHCARE_SOURCE_VOLUME_PREFLIGHT.json"), result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client, plan);
      writeJson(proofRef(args.outDir, "HEALTHCARE_SOURCE_VOLUME_VERIFY.json"), result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const result = await apply(client, plan);
    writeJson(proofRef(args.outDir, "HEALTHCARE_SOURCE_VOLUME_APPLY.json"), result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.FOUNDATION_V2_SOURCE_VOLUME_MODE || "plan",
    outDir: process.env.FOUNDATION_V2_SOURCE_VOLUME_OUT_DIR || path.join(process.cwd(), "proof/healthcare-source-volume"),
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.FOUNDATION_V2_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(next());
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["plan", "preflight", "apply", "verify"].includes(parsed.mode)) {
    throw new Error(`Unsupported mode ${parsed.mode}`);
  }
  return parsed;
}

function buildSourceVolumePlan() {
  assertFile(PACKAGE_MANIFEST);
  assertFile(FREEZE_MANIFEST);
  assertFile(PARSER_VISIBLE_MANIFEST);
  const packageManifest = readJson(PACKAGE_MANIFEST);
  const freezeManifest = readJson(FREEZE_MANIFEST);
  const csvEntries = packageManifest.files
    .filter((entry) => String(entry.path).startsWith("03-source-corpus-design/synthetic-source-samples/"))
    .filter((entry) => String(entry.path).endsWith(".csv"))
    .sort((left, right) => String(left.path).localeCompare(String(right.path)));
  if (csvEntries.length !== 40) throw new Error(`Expected 40 CSV source files, found ${csvEntries.length}`);

  const files = csvEntries.map((entry, fileIndex) => {
    const relativePath = String(entry.path);
    const absolutePath = path.join(PACKAGE_ROOT, relativePath);
    assertFile(absolutePath);
    const bytes = fs.statSync(absolutePath).size;
    const content = fs.readFileSync(absolutePath, "utf8");
    const actualSha = sha256(content);
    if (actualSha !== entry.sha256 || bytes !== entry.bytes) {
      throw new Error(`Source package manifest mismatch for ${relativePath}`);
    }
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
      throw new Error(`CSV parse failed for ${relativePath}: ${parsed.errors.map((error) => error.message).join("; ")}`);
    }
    const headers = parsed.meta.fields || [];
    const rowCount = parsed.data.length;
    return {
      file_index: fileIndex + 1,
      relative_path: relativePath,
      file_name: path.basename(relativePath),
      source_file_id: `${SOURCE_RELEASE_ID}:source-file:${shortHash(relativePath, 16)}`,
      source_family: sourceFamilyFor(relativePath),
      object_type: objectTypeFor(relativePath),
      content_sha256: actualSha,
      bytes,
      headers,
      row_count: rowCount,
      field_count: rowCount * headers.length,
      rows: parsed.data,
    };
  });

  const totalRows = files.reduce((sum, file) => sum + file.row_count, 0);
  const totalFields = files.reduce((sum, file) => sum + file.field_count, 0);
  const domainCounts = freezeManifest.expected_record_counts_by_domain || {};
  const expectedDomainSubtotal = Object.values(domainCounts).reduce((sum, value) => sum + Number(value || 0), 0);
  const parserVisibleRows = countCsvDataRows(PARSER_VISIBLE_MANIFEST);
  const contentHash = sha256(
    stableJson(files.map((file) => ({ path: file.relative_path, sha256: file.content_sha256, rows: file.row_count }))),
  );

  return {
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    execution_id: SOURCE_VOLUME_EXECUTION_ID,
    release_version: SOURCE_VOLUME_RELEASE_VERSION,
    release_hash: contentHash,
    isolation_scope: ISOLATION_SCOPE,
    package_root: PACKAGE_ROOT,
    file_count: files.length,
    total_source_rows: totalRows,
    total_field_values: totalFields,
    max_columns: Math.max(...files.map((file) => file.headers.length)),
    parser_visible_source_families: parserVisibleRows,
    expected_domain_counts: domainCounts,
    expected_domain_subtotal: expectedDomainSubtotal,
    supporting_row_delta: totalRows - expectedDomainSubtotal,
    files,
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertFile(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

function countCsvDataRows(file) {
  const parsed = Papa.parse(fs.readFileSync(file, "utf8"), { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) throw new Error(`CSV parse failed for ${file}`);
  return parsed.data.length;
}

async function preflight(client, plan) {
  await client.query("BEGIN");
  try {
    await setContext(client, WRITER_ROLE);
    const existing = await sourceVolumeCounts(client);
    await client.query("ROLLBACK");
    const existingTotal = Object.values(existing).reduce((sum, value) => sum + Number(value || 0), 0);
    const status =
      existingTotal === 0 || exactSourceVolumeCounts(plan, existing)
        ? "HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_PREFLIGHT_PASSED"
        : "HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_PREFLIGHT_FAILED";
    return manifest(status, plan, {
      existing_counts: existing,
      existing_total: existingTotal,
      existing_exact_match: exactSourceVolumeCounts(plan, existing),
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
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`foundation-v2:${TENANT_KEY}:${TEST_NAMESPACE}:source-volume`]);
    await setContext(client, WRITER_ROLE);
    const existing = await sourceVolumeCounts(client);
    if (Object.values(existing).some((value) => Number(value || 0) > 0)) {
      if (!exactSourceVolumeCounts(plan, existing)) {
        throw new Error(`Existing source-volume rows do not match expected counts: ${JSON.stringify(existing)}`);
      }
      await client.query("ROLLBACK");
      return manifest("HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_ALREADY_APPLIED_EXACT_MATCH", plan, {
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
      throw new Error(`Source-volume variance after write: ${JSON.stringify(counts)}`);
    }
    await client.query("COMMIT");
    return manifest("HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_APPLIED", plan, {
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
    const role = process.env.FOUNDATION_V2_SOURCE_VOLUME_DB_ROLE === "writer" ? WRITER_ROLE : READER_ROLE;
    await setContext(client, role);
    const counts = await sourceVolumeCounts(client);
    await client.query("ROLLBACK");
    const exact = exactSourceVolumeCounts(plan, counts);
    return manifest(exact ? "HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_VERIFIED" : "HEALTHCARE_FOUNDATION_V2_SOURCE_VOLUME_VERIFY_FAILED", plan, {
      actual_counts: counts,
      exact_match: exact,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function setContext(client, roleName) {
  await client.query("SET LOCAL row_security = on");
  await q(client, "SELECT set_config('app.tenant_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.client_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
  await q(client, "SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [SOURCE_RELEASE_ID]);
  await q(client, "SELECT set_config('app.foundation_v2_release_alias', $1, true)", [FOUNDATION_RELEASE_ALIAS]);
  await client.query(`SET LOCAL ROLE ${quoteIdent(roleName)}`);
}

async function sourceVolumeCounts(client) {
  const output = {};
  for (const table of ["source_releases", "source_files", "source_records", "source_field_values", "parser_executions", "gate_results"]) {
    output[table] = Number(
      (
        await rows(
          client,
          `SELECT count(*)::int AS count FROM foundation_v2.${table} WHERE tenant_key=$1 AND test_namespace=$2`,
          [TENANT_KEY, TEST_NAMESPACE],
        )
      )[0].count,
    );
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
    [SOURCE_RELEASE_ID, TENANT_KEY, TEST_NAMESPACE, plan.release_version, plan.release_hash, ISOLATION_SCOPE, plan.execution_id],
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
      tenant_key: TENANT_KEY,
      test_namespace: TEST_NAMESPACE,
      source_uri: `repo://${file.relative_path}`,
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
  for (let rowIndex = 0; rowIndex < file.rows.length; rowIndex += 1) {
    const row = file.rows[rowIndex];
    const rowNumber = rowIndex + 1;
    const rowHash = sha256(stableJson({ path: file.relative_path, rowNumber, row }));
    const sourceRecordId = `${SOURCE_RELEASE_ID}:source-record:${shortHash(file.relative_path, 10)}:${rowNumber}`;
    recordBatch.push({
      source_record_id: sourceRecordId,
      source_file_id: file.source_file_id,
      source_release_id: SOURCE_RELEASE_ID,
      tenant_key: TENANT_KEY,
      test_namespace: TEST_NAMESPACE,
      source_row_number: rowNumber,
      source_row_hash: rowHash,
      row_disposition: "MATCHED",
      row_disposition_reason: `source-volume:${file.file_name}`,
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
        tenant_key: TENANT_KEY,
        test_namespace: TEST_NAMESPACE,
        source_field_id: `${shortHash(file.relative_path, 10)}:${String(fieldIndex + 1).padStart(2, "0")}:${slug(header)}`,
        source_field_name: header,
        raw_value: value,
        normalized_value: value,
        field_disposition: "PRESERVED_AS_EVIDENCE",
        target_object_type: file.object_type,
        target_field_name: slug(header),
        adapter_rule_id: `healthcare-source-volume-v1:${file.object_type}:${slug(header)}`,
        evidence_ref: `repo://${file.relative_path}#row=${rowNumber}`,
        restricted: false,
        writer_job_id: plan.execution_id,
      });
      if (fieldBatch.length >= 1000) {
        await flushFieldBatch(client, fieldBatch);
        fieldBatch.length = 0;
      }
    }
    if (recordBatch.length >= 1000) {
      await flushRecordBatch(client, recordBatch);
      recordBatch.length = 0;
    }
  }
  if (recordBatch.length > 0) await flushRecordBatch(client, recordBatch);
  if (fieldBatch.length > 0) await flushFieldBatch(client, fieldBatch);
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
     VALUES ($1,$2,$3,$4,'healthcare-source-volume-parser-visible-v1',$5,$6,$7,0,'passed',$8)`,
    [
      `${SOURCE_RELEASE_ID}:source-volume-parser-execution-001`,
      SOURCE_RELEASE_ID,
      TENANT_KEY,
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
    ["F2-SOURCE-VOLUME-L0-L1", "source files to landed rows", plan.total_source_rows, plan.total_source_rows],
    ["F2-SOURCE-VOLUME-L1-L2", "landed rows to parsed fields", plan.total_source_rows, plan.total_field_values],
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
      tenant_key: TENANT_KEY,
      test_namespace: TEST_NAMESPACE,
      gate_id: gateId,
      transition,
      input_count: inputCount,
      output_count: outputCount,
      unexplained_variance: 0,
      gate_status: "passed",
      failure_classification: null,
      repair_owner: "foundation-v2-agent",
      rerun_scope: "source-volume",
      proof_uri: `proof://foundation-v2/${SOURCE_VOLUME_EXECUTION_ID}/${gateId}`,
      writer_job_id: plan.execution_id,
    })),
  );
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

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function rows(client, sql, params = []) {
  return (await client.query(sql, params)).rows;
}

function writePlanProof(outDir, plan) {
  writeJson(proofRef(outDir, "HEALTHCARE_SOURCE_VOLUME_EXPECTED_COUNTS.json"), publicPlanSummary(plan));
  writeCsv(
    proofRef(outDir, "HEALTHCARE_SOURCE_VOLUME_FILES.csv"),
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
    ...publicPlanSummary(plan),
    ...extra,
  };
}

function publicPlanSummary(plan) {
  return {
    tenant_key: plan.tenant_key,
    test_namespace: plan.test_namespace,
    source_release_id: plan.source_release_id,
    foundation_release_alias: plan.foundation_release_alias,
    execution_id: plan.execution_id,
    release_version: plan.release_version,
    release_hash: plan.release_hash,
    isolation_scope: plan.isolation_scope,
    package_root: plan.package_root,
    file_count: plan.file_count,
    total_source_rows: plan.total_source_rows,
    total_field_values: plan.total_field_values,
    max_columns: plan.max_columns,
    parser_visible_source_families: plan.parser_visible_source_families,
    expected_domain_counts: plan.expected_domain_counts,
    expected_domain_subtotal: plan.expected_domain_subtotal,
    supporting_row_delta: plan.supporting_row_delta,
  };
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}

function sourceFamilyFor(relativePath) {
  return path.basename(relativePath, ".csv").replace(/-/g, "_");
}

function objectTypeFor(relativePath) {
  return slug(path.basename(relativePath, ".csv")).replace(/-/g, "_");
}

function shortHash(value, length = 12) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, length);
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
