#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-data-bi-etl-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(49432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_data_bi_etl_adapter_test";
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
    "scripts/ecl/load_client_intake_data_bi_etl_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 360);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.data_platform, 265);
  assert.equal(adapterSummary.relationship, 265);
  assert.equal(adapterSummary.metric_definition, 3);
  assert.equal(adapterSummary.measure, 1080);
  assert.deepEqual(adapterSummary.workload_types, [
    "dashboards",
    "data_marts",
    "etl_jobs",
    "notebooks",
    "reports",
    "scripts",
    "semantic_models",
    "stored_procedures",
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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP04_Data_BI_ETL'),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'data_platforms', (select count(*) from ecl_context.object where object_type = 'data_platform'),
        'used_by', (select count(*) from ecl_context.relationship where relationship_type = 'USED_BY'),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'workload_count_measures', (select count(*) from ecl_context.measure where metric_key = 'workload_count'),
        'active_user_measures', (select count(*) from ecl_context.measure where metric_key = 'active_user_count'),
        'data_volume_measures', (select count(*) from ecl_context.measure where metric_key = 'data_volume_tb'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'in_review_measures', (select count(*) from ecl_context.measure where review_state = 'in_review'),
        'workload_types', (
          select count(distinct attributes_json->>'workload_type')
          from ecl_context.object
          where object_type = 'data_platform'
        ),
        'governance_states', (
          select count(distinct attributes_json->>'governance_state')
          from ecl_context.object
          where object_type = 'data_platform'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 360, "every SP04 row must land as a source_record");
  assert.equal(counts.business_functions, 12, "function segments must become canonical business_function objects");
  assert.equal(counts.data_platforms, 265, "platform/technology/workload segments must collapse by identity");
  assert.equal(counts.used_by, 265, "each distinct platform segment must point to its function once");
  assert.equal(counts.metric_definitions, 3, "generic volumetric metrics must be declared once each");
  assert.equal(counts.measures, 1080, "three volumetric measures must exist for every source row");
  assert.equal(counts.workload_count_measures, 360);
  assert.equal(counts.active_user_measures, 360);
  assert.equal(counts.data_volume_measures, 360);
  assert.ok(counts.partial_source_records > 0, "needs_follow_up rows must remain visible as partial intake");
  assert.ok(counts.in_review_measures > 0, "needs_follow_up rows must map to in_review canonical review state");
  assert.equal(counts.workload_types, 8, "all modeled workload types must survive canonical mapping");
  assert.equal(counts.governance_states, 5, "governance posture spread must survive canonical mapping");

  const brokenFk = psql(
    `
      update ecl_context.measure
      set subject_object_id = gen_random_uuid()
      where id = (
        select id
        from ecl_context.measure
        where metric_key = 'data_volume_tb'
        limit 1
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "measure subject FK must reject unresolved data-platform objects");
  assert.match(brokenFk.stderr, /measure_subject_object_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
