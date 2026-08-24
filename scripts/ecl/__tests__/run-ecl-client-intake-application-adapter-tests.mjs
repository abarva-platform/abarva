#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-app-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(46432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_intake_app_adapter_test";
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
    ...options,
  });
  if (options.allowFailure) {
    return result;
  }
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

  const adapter = run("python3", ["scripts/ecl/load_client_intake_applications_layer.py", "--out-dir", outDir]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_rows, 306, "active reference application intake should stay at 306 source rows");
  assert.equal(adapterSummary.source_origin, "client_intake", "adapter must mark source_file origin as client_intake");
  assert.ok(adapterSummary.application < adapterSummary.source_rows, "environment variants must not inflate base application count");
  assert.ok(adapterSummary.application_deployment > 0, "environment variants must become deployment objects");

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
        'applications', (select count(*) from ecl_context.application_v),
        'application_deployments', (select count(*) from ecl_context.application_deployment_v),
        'deployment_rows_in_application_view', (
          select count(*)
          from ecl_context.application_v app
          where app.display_name ~ '(Production|Test|Training)$'
        ),
        'deployment_of_relationships', (
          select count(*)
          from ecl_context.relationship
          where relationship_type = 'DEPLOYMENT_OF'
        ),
        'measures', (select count(*) from ecl_context.measure),
        'metric_definitions', (select count(*) from ecl_context.metric_definition)
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "one source_file row must be structurally client_intake");
  assert.equal(counts.synthetic_source_files, 0, "this adapter proof must not use synthetic source_file origin");
  assert.equal(counts.source_records, 306, "every intake row must be represented as a source_record");
  assert.equal(counts.applications, adapterSummary.application, "application_v must match adapter base app count");
  assert.equal(counts.application_deployments, adapterSummary.application_deployment, "deployment view must match adapter deployment count");
  assert.equal(counts.deployment_rows_in_application_view, 0, "environment-suffixed deployment rows must not appear in application_v");
  assert.equal(counts.deployment_of_relationships, adapterSummary.application_deployment, "each deployment should have DEPLOYMENT_OF");
  assert.equal(counts.measures, adapterSummary.measure, "measures should FK-load from client intake source records");
  assert.equal(counts.metric_definitions, 2, "adapter-local metrics must be defined before measures");

  const badOrigin = psql(
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
        'bad-origin-proof',
        'cmdb',
        'spreadsheet_vibes',
        'bad.csv',
        'local-proof://bad.csv',
        'bad-hash',
        'internal',
        'partial'
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(badOrigin.status, 0, "unknown source_file origin must be rejected");
  assert.match(badOrigin.stderr, /source_file_origin_check|check constraint/i);

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
