#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-data-flows-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(54432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_data_flows_adapter_test";
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
    "scripts/ecl/load_client_intake_data_flows_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 1350);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.application_reference, 712);
  assert.equal(adapterSummary.data_platform_reference, 3);
  assert.equal(adapterSummary.unresolved_application_reference, 0);
  assert.equal(adapterSummary.unresolved_platform_reference, 3);
  assert.equal(adapterSummary.relationship, 1350);
  assert.equal(adapterSummary.partial_source_record, 269);
  assert.equal(adapterSummary.known_gap_rows, 71);
  assert.equal(adapterSummary.unknown_layer_rows, 18);
  assert.equal(adapterSummary.regulated_flow_count, 337);
  assert.deepEqual(adapterSummary.integration_patterns, [
    "api",
    "batch_file",
    "database_replication",
    "edi",
    "etl",
    "hl7",
    "message_queue",
    "streaming",
  ]);
  assert.deepEqual(adapterSummary.cadences, ["daily", "hourly", "monthly", "real_time", "weekly"]);
  assert(adapterSummary.landing_layers.includes("unknown"));
  assert(adapterSummary.consumption_layers.includes("unknown"));

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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP13_Data_Flows_Integrations'),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'application_refs', (select count(*) from ecl_context.object where object_type = 'application'),
        'data_platform_refs', (select count(*) from ecl_context.object where object_type = 'data_platform'),
        'unresolved_application_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'application'
            and attributes_json->>'lookup_resolved' = 'false'
        ),
        'unresolved_platform_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'data_platform'
            and attributes_json->>'lookup_resolved' = 'false'
        ),
        'integrates_with', (select count(*) from ecl_context.relationship where relationship_type = 'INTEGRATES_WITH'),
        'known_gap_relationships', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'INTEGRATES_WITH'
            and basis = 'unknown'
            and value_state = 'unknown'
        ),
        'in_review_relationships', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'INTEGRATES_WITH'
            and review_state = 'in_review'
        ),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'unknown_layer_records', (
          select count(*)
          from ecl_source.source_record
          where parse_notes = 'layer_classification_unknown'
        ),
        'regulated_flows', (
          select count(*)
          from ecl_context.relationship
          where attributes_json->>'regulated_data_flag' = 'yes'
        ),
        'distinct_flow_ids', (
          select count(distinct attributes_json->>'flow_id')
          from ecl_context.relationship
          where relationship_type = 'INTEGRATES_WITH'
        ),
        'special_platform_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'data_platform'
            and object_key in ('PLAT-DATA-HUB-001', 'PLAT-EPIC-COGITO-001', 'PLAT-FIN-MART-001')
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 1350, "every SP13 row must land as a source_record");
  assert.equal(counts.business_functions, 12, "source/target functions must become canonical objects");
  assert.equal(counts.application_refs, 712, "application endpoints must be preserved as reference objects");
  assert.equal(counts.data_platform_refs, 3, "platform endpoints must be preserved as reference objects");
  assert.equal(counts.unresolved_application_refs, 0, "application refs must resolve against CMDB lookup");
  assert.equal(counts.unresolved_platform_refs, 3, "special platform refs remain explicit unresolved placeholders");
  assert.equal(counts.integrates_with, 1350, "one INTEGRATES_WITH relationship per source flow");
  assert.equal(counts.known_gap_relationships, 71, "known-gap rows must remain unknown, not zero");
  assert.equal(counts.in_review_relationships, 269, "partial flow rows must route to in_review");
  assert.equal(counts.partial_source_records, 269, "partial source rows must remain explicit");
  assert.equal(counts.unknown_layer_records, 18, "unknown landing/consumption layers must not be coerced");
  assert.equal(counts.regulated_flows, 337, "regulated-data flags must survive into relationship payloads");
  assert.equal(counts.distinct_flow_ids, 1350, "flow IDs must not collapse during canonicalization");
  assert.equal(counts.special_platform_refs, 3, "named platform refs from flow extract must remain visible");

  const brokenFk = psql(
    `
      update ecl_context.relationship
      set to_object_id = gen_random_uuid()
      where id = (
        select id
        from ecl_context.relationship
        where relationship_type = 'INTEGRATES_WITH'
        limit 1
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "data-flow relationship endpoint FK must reject unresolved objects");
  assert.match(brokenFk.stderr, /relationship_to_object_fk|foreign key/i);

  const deleteEndpoint = psql(
    `
      delete from ecl_context.object
      where id = (
        select to_object_id
        from ecl_context.relationship
        where relationship_type = 'INTEGRATES_WITH'
        limit 1
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(deleteEndpoint.status, 0, "relationship FKs must prevent deleting referenced endpoints");
  assert.match(deleteEndpoint.stderr, /foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
