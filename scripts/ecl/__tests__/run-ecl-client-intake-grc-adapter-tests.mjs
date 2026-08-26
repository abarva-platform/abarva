#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-grc-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(51432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_grc_adapter_test";
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
    "scripts/ecl/load_client_intake_grc_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 200);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.risk, 100);
  assert.equal(adapterSummary.control, 100);
  assert.equal(adapterSummary.target_reference, 174);
  assert.equal(adapterSummary.unresolved_target_reference, 0);
  assert.equal(adapterSummary.relationship, 200);
  assert.equal(adapterSummary.metric_definition, 1);
  assert.equal(adapterSummary.measure, 200);
  assert.deepEqual(adapterSummary.severities, ["critical", "high", "low", "medium"]);
  assert.deepEqual(adapterSummary.control_states, ["effective", "missing", "partially_effective", "unknown"]);

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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP09_GRC'),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'risks', (select count(*) from ecl_context.object where object_type = 'risk'),
        'controls', (select count(*) from ecl_context.object where object_type = 'control'),
        'application_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'application'
            and attributes_json->>'reference_only' = 'true'
        ),
        'infrastructure_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'infrastructure'
            and attributes_json->>'reference_only' = 'true'
        ),
        'unresolved_target_refs', (
          select count(*)
          from ecl_context.object
          where object_type in ('application', 'infrastructure')
            and attributes_json->>'lookup_resolved' = 'false'
        ),
        'depends_on', (select count(*) from ecl_context.relationship where relationship_type = 'DEPENDS_ON'),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'open_exception_measures', (select count(*) from ecl_context.measure where metric_key = 'open_exception_count'),
        'estimated_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'estimated'),
        'insufficient_quality_measures', (select count(*) from ecl_context.measure where quality_state = 'insufficient'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'in_review_measures', (select count(*) from ecl_context.measure where review_state = 'in_review'),
        'critical_risks_or_controls', (
          select count(*)
          from ecl_context.object
          where object_type in ('risk', 'control')
            and attributes_json->>'severity' = 'critical'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 200, "every SP09 row must land as a source_record");
  assert.equal(counts.business_functions, 12, "business functions must become canonical objects");
  assert.equal(counts.risks, 100, "RISK rows must become risk objects");
  assert.equal(counts.controls, 100, "CTRL rows must become control objects");
  assert.equal(counts.application_refs, 132, "application object refs must be preserved");
  assert.equal(counts.infrastructure_refs, 42, "platform object refs must be preserved");
  assert.equal(counts.unresolved_target_refs, 0, "all GRC object refs should resolve against lookup extracts");
  assert.equal(counts.depends_on, 200, "every GRC row must retain a dependency target");
  assert.equal(counts.metric_definitions, 1);
  assert.equal(counts.measures, 200, "open exception count measure must exist for every row");
  assert.equal(counts.open_exception_measures, 200);
  assert.ok(counts.estimated_quality_measures > 0, "owner-estimated rows must remain visibly estimated");
  assert.ok(counts.insufficient_quality_measures > 0, "known-gap rows must remain visibly insufficient");
  assert.ok(counts.partial_source_records > 0, "needs-follow-up or known-gap rows must remain partial intake");
  assert.ok(counts.in_review_measures > 0, "needs-follow-up rows must map to in_review canonical review state");
  assert.ok(counts.critical_risks_or_controls > 0, "critical severity must survive mapping for risk lenses");

  const brokenFk = psql(
    `
      update ecl_context.relationship
      set to_object_id = gen_random_uuid()
      where relationship_type = 'DEPENDS_ON'
      and id = (select id from ecl_context.relationship where relationship_type = 'DEPENDS_ON' limit 1);
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "GRC target dependency FK must reject unresolved object refs");
  assert.match(brokenFk.stderr, /relationship_to_object_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
