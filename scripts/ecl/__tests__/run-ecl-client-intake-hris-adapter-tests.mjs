#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-hris-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(55432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_hris_adapter_test";
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
    "scripts/ecl/load_client_intake_hris_layer.py",
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
  assert.equal(adapterSummary.role_family, 8);
  assert.equal(adapterSummary.location_segment, 4);
  assert.equal(adapterSummary.workforce_segment, 88);
  assert.equal(adapterSummary.organization, 92);
  assert.equal(adapterSummary.persona, 8);
  assert.equal(adapterSummary.relationship, 176);
  assert.equal(adapterSummary.metric_definition, 4);
  assert.equal(adapterSummary.measure, 1440);
  assert.equal(adapterSummary.partial_source_record, 67);
  assert.equal(adapterSummary.known_gap_rows, 18);
  assert.equal(adapterSummary.owner_estimated_rows, 31);

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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP02_HRIS'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'known_gap_records', (
          select count(*)
          from ecl_source.source_record
          where parse_notes = 'known_gap_requires_review'
        ),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'personas', (select count(*) from ecl_context.object where object_type = 'persona'),
        'organizations', (select count(*) from ecl_context.object where object_type = 'organization'),
        'workforce_segments', (
          select count(*)
          from ecl_context.object
          where object_type = 'organization'
            and attributes_json->>'organization_type' = 'workforce_segment'
        ),
        'location_segments', (
          select count(*)
          from ecl_context.object
          where object_type = 'organization'
            and attributes_json->>'organization_type' = 'location_segment'
        ),
        'relationships', (select count(*) from ecl_context.relationship),
        'segment_function_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'OWNED_BY'
            and attributes_json->>'relationship_basis' = 'workforce_segment_function'
        ),
        'segment_role_links', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'USED_BY'
            and attributes_json->>'relationship_basis' = 'workforce_segment_role_family'
        ),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'unknown_measures', (select count(*) from ecl_context.measure where value_state = 'unknown'),
        'estimated_measures', (select count(*) from ecl_context.measure where quality_state = 'estimated'),
        'in_review_measures', (select count(*) from ecl_context.measure where review_state = 'in_review'),
        'distinct_functions_in_measures', (
          select count(distinct attributes_json->>'function')
          from ecl_context.measure
        ),
        'distinct_roles_in_measures', (
          select count(distinct attributes_json->>'role_family')
          from ecl_context.measure
        ),
        'distinct_locations_in_measures', (
          select count(distinct attributes_json->>'location_segment')
          from ecl_context.measure
        ),
        'employee_level_records', (
          select count(*)
          from ecl_source.source_record
          where payload_json ? 'employee_id'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 360, "every SP02 row must land as a source_record");
  assert.equal(counts.partial_source_records, 67, "known gaps and follow-up rows must remain partial");
  assert.equal(counts.known_gap_records, 18);
  assert.equal(counts.business_functions, 12);
  assert.equal(counts.personas, 8);
  assert.equal(counts.organizations, 92);
  assert.equal(counts.workforce_segments, 88, "workforce segment count must follow observed combinations, not a cartesian product");
  assert.equal(counts.location_segments, 4);
  assert.equal(counts.relationships, 176);
  assert.equal(counts.segment_function_links, 88);
  assert.equal(counts.segment_role_links, 88);
  assert.equal(counts.metric_definitions, 4);
  assert.equal(counts.measures, 1440);
  assert.equal(counts.unknown_measures, 72, "known-gap rows must not become zero-valued measures");
  assert.equal(counts.estimated_measures, 124, "owner-estimated rows must remain estimated");
  assert.equal(counts.in_review_measures, 268);
  assert.equal(counts.distinct_functions_in_measures, 12);
  assert.equal(counts.distinct_roles_in_measures, 8);
  assert.equal(counts.distinct_locations_in_measures, 4);
  assert.equal(counts.employee_level_records, 0, "SP02 must not pretend to hold employee-level detail");

  const brokenFk = psql(
    `
      update ecl_context.relationship
      set to_object_id = gen_random_uuid()
      where id = (
        select id
        from ecl_context.relationship
        where relationship_type = 'OWNED_BY'
        limit 1
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "workforce segment function FK must reject unresolved endpoints");
  assert.match(brokenFk.stderr, /relationship_to_object_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
