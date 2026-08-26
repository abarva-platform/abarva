#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-evidence-room-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(55432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_evidence_room_adapter_test";
const sourceRoomDir = path.join(tmpRoot, "source-room");
const outDir = path.join(tmpRoot, "adapter-output");
const postgresLog = path.join(tmpRoot, "postgres.log");
const env = {
  ...process.env,
  LC_ALL: "C",
  LANG: "C",
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    env,
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  if (options.allowFailure) return result;
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result;
}

function startPostgres() {
  const result = run(
    "pg_ctl",
    ["-D", dataDir, "-l", postgresLog, "-o", `-p ${port} -k ${socketDir}`, "-w", "-t", "30", "start"],
    { allowFailure: true },
  );
  if (result.status !== 0) {
    const logText = fs.existsSync(postgresLog) ? fs.readFileSync(postgresLog, "utf8") : "(postgres log not written)";
    assert.equal(
      result.status,
      0,
      `pg_ctl start failed on port ${port}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}\nPOSTGRES LOG:\n${logText}`,
    );
  }
}

function psql(sql, options = {}) {
  return run(
    "psql",
    ["-h", socketDir, "-p", port, "-d", dbName, "-v", "ON_ERROR_STOP=1", "-A", "-t", "-c", sql],
    options,
  );
}

let started = false;
try {
  run("python3", ["scripts/ecl/generate_dense_source_room_extracts.py", "--out-dir", sourceRoomDir]);
  run("python3", ["scripts/ecl/validate_dense_source_room_extracts.py", "--out-dir", sourceRoomDir]);

  run("initdb", ["-D", dataDir, "--encoding=UTF8", "--locale=C.UTF-8"]);
  startPostgres();
  started = true;
  run("createdb", ["-h", socketDir, "-p", port, dbName]);
  run("psql", [
    "-h",
    socketDir,
    "-p",
    port,
    "-d",
    dbName,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    path.join(repo, "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql"),
  ]);

  const adapter = run("python3", [
    "scripts/ecl/load_client_intake_evidence_room_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 500);
  assert.equal(adapterSummary.document, 500);
  assert.equal(adapterSummary.document_extraction, 250);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.metric_definition, 4);
  assert.equal(adapterSummary.measure, 48);
  assert.equal(adapterSummary.partial_source_record, 297);
  assert.equal(adapterSummary.known_gap_rows, 26);
  assert.equal(adapterSummary.supported_contract_refs, 230);
  assert.equal(adapterSummary.supported_application_refs, 52);
  assert.equal(adapterSummary.verified_extractions, 125);
  assert.equal(adapterSummary.unverified_extractions, 125);

  run("psql", [
    "-h",
    socketDir,
    "-p",
    port,
    "-d",
    dbName,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    adapterSummary.load_sql,
  ]);

  const counts = JSON.parse(
    psql(`
      select jsonb_build_object(
        'client_source_files', (select count(*) from ecl_source.source_file where origin = 'client_intake'),
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP12_Evidence_Room'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'known_gap_records', (
          select count(*)
          from ecl_source.source_record
          where parse_notes = 'known_gap_requires_review'
        ),
        'documents', (select count(*) from ecl_source.document),
        'contract_documents', (select count(*) from ecl_source.document where document_type = 'contract'),
        'document_extractions', (select count(*) from ecl_source.document_extraction),
        'distinct_extraction_spans', (select count(distinct span_reference) from ecl_source.document_extraction),
        'verified_extractions', (
          select count(*)
          from ecl_source.document_extraction
          where human_verification_state = 'verified'
        ),
        'unverified_extractions', (
          select count(*)
          from ecl_source.document_extraction
          where human_verification_state = 'unverified'
        ),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'artifact_count_sum', (
          select sum(value_number)::int
          from ecl_context.measure
          where metric_key = 'evidence_artifact_count'
        ),
        'extraction_count_sum', (
          select sum(value_number)::int
          from ecl_context.measure
          where metric_key = 'evidence_extraction_pointer_count'
        ),
        'known_gap_count_sum', (
          select sum(value_number)::int
          from ecl_context.measure
          where metric_key = 'evidence_known_gap_count'
        ),
        'function_measure_subjects', (
          select count(distinct subject_object_id)
          from ecl_context.measure
        ),
        'contract_ref_extractions', (
          select count(distinct normalized_value_json->>'supports_object_ref')
          from ecl_source.document_extraction
          where normalized_value_json->>'supports_object_ref' like 'CTR-%'
        ),
        'application_ref_extractions', (
          select count(distinct normalized_value_json->>'supports_object_ref')
          from ecl_source.document_extraction
          where normalized_value_json->>'supports_object_ref' like 'APP-%'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 500, "every SP12 row must land as a source_record");
  assert.equal(counts.partial_source_records, 297);
  assert.equal(counts.known_gap_records, 26);
  assert.equal(counts.documents, 500);
  assert.equal(counts.contract_documents, 420);
  assert.equal(counts.document_extractions, 250);
  assert.equal(counts.distinct_extraction_spans, 250, "page/span pointers must not collapse to constants");
  assert.equal(counts.verified_extractions, 125);
  assert.equal(counts.unverified_extractions, 125);
  assert.equal(counts.business_functions, 12);
  assert.equal(counts.metric_definitions, 4);
  assert.equal(counts.measures, 48);
  assert.equal(counts.artifact_count_sum, 500);
  assert.equal(counts.extraction_count_sum, 250);
  assert.equal(counts.known_gap_count_sum, 26);
  assert.equal(counts.function_measure_subjects, 12);
  assert.equal(counts.contract_ref_extractions, 115);
  assert.equal(counts.application_ref_extractions, 26);

  const brokenFk = psql(
    `
      update ecl_source.document_extraction
      set document_id = gen_random_uuid()
      where id = (select id from ecl_source.document_extraction limit 1);
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "document extraction FK must reject unresolved document refs");
  assert.match(brokenFk.stderr, /document_extraction_document_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
