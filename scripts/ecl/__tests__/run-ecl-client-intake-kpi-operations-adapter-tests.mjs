#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-kpi-operations-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(52432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_kpi_operations_adapter_test";
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
    "scripts/ecl/load_client_intake_kpi_operations_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 260);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.application_reference, 233);
  assert.equal(adapterSummary.unresolved_application_reference, 0);
  assert.equal(adapterSummary.relationship, 253);
  assert.equal(adapterSummary.metric_definition, 10);
  assert.equal(adapterSummary.measure, 260);
  assert.equal(adapterSummary.unit_mismatch_rows, 208);
  assert.deepEqual(adapterSummary.periods, ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]);
  assert.deepEqual(adapterSummary.units, ["count", "days", "percent", "usd"]);
  assert.deepEqual(adapterSummary.kpi_names, [
    "appointment access days",
    "claims auto-adjudication rate",
    "cloud cost variance",
    "days in AR",
    "denial overturn rate",
    "member NPS",
    "nursing vacancy rate",
    "operating margin",
    "report freshness SLA",
    "supply fill rate",
  ]);

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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP10_KPI_Operations'),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'application_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'application'
            and attributes_json->>'reference_only' = 'true'
        ),
        'unresolved_application_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'application'
            and attributes_json->>'lookup_resolved' = 'false'
        ),
        'supported_by', (select count(*) from ecl_context.relationship where relationship_type = 'SUPPORTED_BY'),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'quarterly_measures', (select count(*) from ecl_context.measure where period_start is not null and period_end is not null),
        'insufficient_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'insufficient'),
        'estimated_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'estimated'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'in_review_measures', (select count(*) from ecl_context.measure where review_state = 'in_review'),
        'unit_mismatch_measures', (
          select count(*)
          from ecl_context.measure
          where attributes_json->>'unit_mismatch' = 'true'
        ),
        'unit_mismatch_records', (
          select count(*)
          from ecl_source.source_record
          where parse_notes = 'unit_mismatch_requires_review'
        ),
        'known_gap_measures', (select count(*) from ecl_context.measure where basis = 'unknown' and value_state = 'unknown')
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 260, "every SP10 row must land as a source_record");
  assert.equal(counts.business_functions, 12, "function segments must become canonical business_function objects");
  assert.equal(counts.application_refs, 233, "source application refs must be preserved");
  assert.equal(counts.unresolved_application_refs, 0, "SP10 application refs must resolve against CMDB lookup");
  assert.equal(counts.supported_by, 253, "function-to-source-application links must preserve KPI source context");
  assert.equal(counts.metric_definitions, 10, "one metric definition per KPI name");
  assert.equal(counts.measures, 260, "one operational measure per KPI source row");
  assert.equal(counts.quarterly_measures, 260, "quarter labels must become period ranges");
  assert.equal(counts.unit_mismatch_measures, 208, "semantic unit mismatches must remain explicit");
  assert.equal(counts.unit_mismatch_records, 208, "unit mismatch rows must route to partial source review");
  assert.equal(counts.insufficient_quality_measures, 210, "known gaps and unit mismatches must remain insufficient");
  assert.equal(counts.estimated_quality_measures, 4, "owner-estimated rows without unit mismatch remain estimated");
  assert.ok(counts.partial_source_records > counts.unit_mismatch_records, "known-gap and follow-up rows must also remain partial");
  assert.ok(counts.in_review_measures > 0, "needs-follow-up or unit-mismatch rows must map to in_review");
  assert.equal(counts.known_gap_measures, 13, "known gaps must remain unknown, not zero");

  const brokenFk = psql(
    `
      update ecl_context.measure
      set subject_object_id = gen_random_uuid()
      where id = (select id from ecl_context.measure limit 1);
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "KPI measure subject FK must reject unresolved application refs");
  assert.match(brokenFk.stderr, /measure_subject_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
