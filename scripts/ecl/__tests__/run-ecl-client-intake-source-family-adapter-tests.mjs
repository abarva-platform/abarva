#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-source-family-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(47432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_source_family_adapter_test";
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
    "scripts/ecl/load_client_intake_source_family_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_files, 14, "all 14 source families must land as source_file rows");
  assert.equal(adapterSummary.source_records, 7080, "dense client-shaped source room must land every source row");
  assert.equal(adapterSummary.scope, "ecl_source landing only; no canonical, commercial, projection or serving rows written");

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
        'synthetic_source_files', (select count(*) from ecl_source.source_file where origin = 'synthetic_generator'),
        'source_records', (select count(*) from ecl_source.source_record),
        'record_types', (select count(distinct record_type) from ecl_source.source_record),
        'sp03_rows', (select count(*) from ecl_source.source_record where record_type = 'SP03_CMDB'),
        'sp14_rows', (select count(*) from ecl_source.source_record where record_type = 'SP14_Deployments_Hosting'),
        'context_objects', (select count(*) from ecl_context.object),
        'commercial_contracts', (select count(*) from ecl_commercial.contract),
        'projection_manifests', (select count(*) from ecl_projection.projection_manifest)
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 14, "all source files must be marked client_intake");
  assert.equal(counts.synthetic_source_files, 0, "client landing proof must not use synthetic_generator origin");
  assert.equal(counts.source_records, 7080, "source_record readback must match adapter output");
  assert.equal(counts.record_types, 14, "source_record types must cover all families");
  assert.equal(counts.sp03_rows, 750, "SP03 CMDB source family must retain dense row count");
  assert.equal(counts.sp14_rows, 1650, "SP14 deployment source family must retain dense row count");
  assert.equal(counts.context_objects, 0, "source-family landing adapter must not populate canonical context");
  assert.equal(counts.commercial_contracts, 0, "source-family landing adapter must not populate commercial rows");
  assert.equal(counts.projection_manifests, 0, "source-family landing adapter must not populate projections");

  const badType = psql(
    `
      insert into ecl_source.source_file (
        tenant_key,
        assessment_id,
        source_type,
        origin,
        file_name,
        blob_uri,
        file_hash,
        access_class,
        quality_state
      ) values (
        'meridian-health',
        'bad-source-type-proof',
        'spreadsheet_vibes',
        'client_intake',
        'bad.csv',
        'local-proof://bad.csv',
        'bad-source-type-hash',
        'internal',
        'partial'
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(badType.status, 0, "unknown source_file source_type must be rejected");
  assert.match(badType.stderr, /source_file_source_type_check|check constraint/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
