#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-ppm-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(50432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_ppm_adapter_test";
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
    "scripts/ecl/load_client_intake_ppm_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 140);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.program, 140);
  assert.equal(adapterSummary.application_reference, 238);
  assert.equal(adapterSummary.unresolved_application_reference, 0);
  assert.equal(adapterSummary.relationship, 420);
  assert.equal(adapterSummary.metric_definition, 3);
  assert.equal(adapterSummary.measure, 420);
  assert.deepEqual(adapterSummary.statuses, ["approved", "at_risk", "closed", "in_flight", "proposed"]);

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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP07_PPM'),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'programs', (select count(*) from ecl_context.object where object_type = 'program'),
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
        'funded_by', (select count(*) from ecl_context.relationship where relationship_type = 'FUNDED_BY'),
        'changes', (select count(*) from ecl_context.relationship where relationship_type = 'CHANGES'),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'budget_measures', (select count(*) from ecl_context.measure where metric_key = 'approved_budget_usd'),
        'forecast_measures', (select count(*) from ecl_context.measure where metric_key = 'forecast_usd'),
        'target_value_measures', (select count(*) from ecl_context.measure where metric_key = 'target_value_usd'),
        'estimated_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'estimated'),
        'insufficient_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'insufficient'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'in_review_measures', (select count(*) from ecl_context.measure where review_state = 'in_review'),
        'planned_programs', (select count(*) from ecl_context.object where object_type = 'program' and lifecycle_state = 'planned'),
        'retired_programs', (select count(*) from ecl_context.object where object_type = 'program' and lifecycle_state = 'retired')
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 140, "every SP07 row must land as a source_record");
  assert.equal(counts.business_functions, 12, "sponsor functions must become canonical business_function objects");
  assert.equal(counts.programs, 140, "every program row must become a program object");
  assert.equal(counts.application_refs, 238, "dependent application references must be preserved");
  assert.equal(counts.unresolved_application_refs, 0, "all dependent app refs should resolve against the generated CMDB lookup");
  assert.equal(counts.funded_by, 140, "every program must be linked to its sponsor function");
  assert.equal(counts.changes, 280, "every dependent application reference must become a CHANGES edge");
  assert.equal(counts.metric_definitions, 3);
  assert.equal(counts.measures, 420, "budget, forecast, and target value measures must exist for every program");
  assert.equal(counts.budget_measures, 140);
  assert.equal(counts.forecast_measures, 140);
  assert.equal(counts.target_value_measures, 140);
  assert.ok(counts.estimated_quality_measures > 0, "owner-estimated rows must remain visibly estimated");
  assert.ok(counts.insufficient_quality_measures > 0, "known-gap rows must remain visibly insufficient");
  assert.ok(counts.partial_source_records > 0, "needs-follow-up or known-gap rows must remain partial intake");
  assert.ok(counts.in_review_measures > 0, "needs-follow-up rows must map to in_review canonical review state");
  assert.equal(counts.planned_programs, 56, "approved/proposed programs map to planned lifecycle");
  assert.equal(counts.retired_programs, 28, "closed programs map to retired lifecycle");

  const brokenFk = psql(
    `
      update ecl_context.relationship
      set to_object_id = gen_random_uuid()
      where relationship_type = 'CHANGES'
      and id = (select id from ecl_context.relationship where relationship_type = 'CHANGES' limit 1);
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "program application dependency FK must reject unresolved application refs");
  assert.match(brokenFk.stderr, /relationship_to_object_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
