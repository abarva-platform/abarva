#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-infrastructure-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(49432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_infrastructure_adapter_test";
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
    "scripts/ecl/load_client_intake_infrastructure_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 220);
  assert.equal(adapterSummary.business_function, 12);
  assert.equal(adapterSummary.infrastructure, 220);
  assert.equal(adapterSummary.relationship, 220);
  assert.equal(adapterSummary.metric_definition, 3);
  assert.equal(adapterSummary.measure, 660);
  assert.deepEqual(adapterSummary.platform_types, [
    "aws_account",
    "azure_subscription",
    "citrix_farm",
    "epic_aws",
    "mainframe",
    "netezza_appliance",
    "network_segment",
    "security_platform",
    "sql_server_cluster",
    "storage_platform",
    "teradata_appliance",
    "vmware_cluster",
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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP05_Infrastructure'),
        'business_functions', (select count(*) from ecl_context.object where object_type = 'business_function'),
        'infrastructure', (select count(*) from ecl_context.object where object_type = 'infrastructure'),
        'supported_by', (select count(*) from ecl_context.relationship where relationship_type = 'SUPPORTED_BY'),
        'metric_definitions', (select count(*) from ecl_context.metric_definition),
        'measures', (select count(*) from ecl_context.measure),
        'capacity_measures', (select count(*) from ecl_context.measure where metric_key = 'platform_capacity_value'),
        'utilization_measures', (select count(*) from ecl_context.measure where metric_key = 'platform_utilization_percent'),
        'support_measures', (select count(*) from ecl_context.measure where metric_key = 'support_days_remaining'),
        'support_known_measures', (select count(*) from ecl_context.measure where metric_key = 'support_days_remaining' and value_state = 'known'),
        'support_unknown_measures', (select count(*) from ecl_context.measure where metric_key = 'support_days_remaining' and value_state = 'unknown'),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'in_review_measures', (select count(*) from ecl_context.measure where review_state = 'in_review'),
        'platform_types', (
          select count(distinct attributes_json->>'platform_type')
          from ecl_context.object
          where object_type = 'infrastructure'
        ),
        'hosting_locations', (
          select count(distinct attributes_json->>'hosting_location')
          from ecl_context.object
          where object_type = 'infrastructure'
        ),
        'mainframes', (
          select count(*)
          from ecl_context.object
          where object_type = 'infrastructure'
            and attributes_json->>'platform_type' = 'mainframe'
        ),
        'teradata', (
          select count(*)
          from ecl_context.object
          where object_type = 'infrastructure'
            and attributes_json->>'platform_type' = 'teradata_appliance'
        ),
        'netezza', (
          select count(*)
          from ecl_context.object
          where object_type = 'infrastructure'
            and attributes_json->>'platform_type' = 'netezza_appliance'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 220, "every SP05 row must land as a source_record");
  assert.equal(counts.business_functions, 12, "function segments must become canonical business_function objects");
  assert.equal(counts.infrastructure, 220, "each platform row must become one infrastructure object");
  assert.equal(counts.supported_by, 220, "each infrastructure object must be tied to its supported function");
  assert.equal(counts.metric_definitions, 3, "infrastructure metrics must be declared once each");
  assert.equal(counts.measures, 660, "three infrastructure measures must exist for every source row");
  assert.equal(counts.capacity_measures, 220);
  assert.equal(counts.utilization_measures, 220);
  assert.equal(counts.support_measures, 220);
  assert.ok(counts.support_known_measures > 0, "support end dates must produce calculated days remaining");
  assert.ok(counts.support_unknown_measures > 0, "blank support dates must remain unknown, not zero");
  assert.ok(counts.partial_source_records > 0, "needs_follow_up rows must remain visible as partial intake");
  assert.ok(counts.in_review_measures > 0, "needs_follow_up rows must map to in_review canonical review state");
  assert.equal(counts.platform_types, 12, "all modeled platform types must survive canonical mapping");
  assert.equal(counts.hosting_locations, 5, "hosting-location spread must survive canonical mapping");
  assert.ok(counts.mainframes > 0, "mainframe platforms must survive canonical mapping");
  assert.ok(counts.teradata > 0, "Teradata platforms must survive canonical mapping");
  assert.ok(counts.netezza > 0, "Netezza platforms must survive canonical mapping");

  const brokenFk = psql(
    `
      update ecl_context.measure
      set subject_object_id = gen_random_uuid()
      where id = (
        select id
        from ecl_context.measure
        where metric_key = 'platform_utilization_percent'
        limit 1
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "measure subject FK must reject unresolved infrastructure objects");
  assert.match(brokenFk.stderr, /measure_subject_object_fk|foreign key/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
