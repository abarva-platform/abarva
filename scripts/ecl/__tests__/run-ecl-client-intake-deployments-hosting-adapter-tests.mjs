#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync("/tmp/eclpg-deployments-hosting-adapter-");
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(55432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_client_deployments_hosting_adapter_test";
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
    "scripts/ecl/load_client_intake_deployments_hosting_layer.py",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    outDir,
  ]);
  const adapterSummary = JSON.parse(adapter.stdout);
  assert.equal(adapterSummary.source_origin, "client_intake");
  assert.equal(adapterSummary.source_file, 1);
  assert.equal(adapterSummary.source_record, 1650);
  assert.equal(adapterSummary.application_reference, 663);
  assert.equal(adapterSummary.infrastructure_reference, 220);
  assert.equal(adapterSummary.application_deployment, 1650);
  assert.equal(adapterSummary.deployment_of, 1650);
  assert.equal(adapterSummary.hosted_on, 1650);
  assert.equal(adapterSummary.relationship, 3300);
  assert.equal(adapterSummary.partial_source_record, 309);
  assert.equal(adapterSummary.known_gap_rows, 86);
  assert.equal(adapterSummary.unresolved_application_reference, 0);
  assert.equal(adapterSummary.unresolved_platform_reference, 0);
  assert.equal(adapterSummary.planned_deployments, 70);
  assert.equal(adapterSummary.retired_deployments, 44);
  assert.deepEqual(adapterSummary.environments, ["DR", "Production", "Test", "Training"]);
  assert.deepEqual(adapterSummary.hosting_models, ["aws_hosted", "azure_hosted", "on_prem", "private_cloud", "saas"]);
  assert.deepEqual(adapterSummary.runtime_states, ["active", "planned", "retired"]);
  assert.deepEqual(adapterSummary.dr_tiers, ["tier_1_active_active", "tier_2_warm", "tier_3_backup_only", "unknown"]);

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
        'source_records', (select count(*) from ecl_source.source_record where record_type = 'SP14_Deployments_Hosting'),
        'applications', (select count(*) from ecl_context.object where object_type = 'application'),
        'infrastructure', (select count(*) from ecl_context.object where object_type = 'infrastructure'),
        'application_deployments', (select count(*) from ecl_context.object where object_type = 'application_deployment'),
        'current_deployments', (select count(*) from ecl_context.object where object_type = 'application_deployment' and lifecycle_state = 'current'),
        'planned_deployments', (select count(*) from ecl_context.object where object_type = 'application_deployment' and lifecycle_state = 'planned'),
        'retired_deployments', (select count(*) from ecl_context.object where object_type = 'application_deployment' and lifecycle_state = 'retired'),
        'deployment_of', (select count(*) from ecl_context.relationship where relationship_type = 'DEPLOYMENT_OF'),
        'hosted_on', (select count(*) from ecl_context.relationship where relationship_type = 'HOSTED_ON'),
        'known_gap_relationships', (
          select count(*)
          from ecl_context.relationship
          where basis = 'unknown'
            and value_state = 'unknown'
        ),
        'in_review_relationships', (
          select count(*)
          from ecl_context.relationship
          where review_state = 'in_review'
        ),
        'partial_source_records', (select count(*) from ecl_source.source_record where parse_state = 'partial'),
        'known_gap_records', (
          select count(*)
          from ecl_source.source_record
          where parse_notes = 'known_gap_requires_review'
        ),
        'distinct_deployment_ids', (
          select count(distinct object_key)
          from ecl_context.object
          where object_type = 'application_deployment'
        ),
        'environment_values', (
          select count(distinct attributes_json->>'environment')
          from ecl_context.object
          where object_type = 'application_deployment'
        ),
        'hosting_model_values', (
          select count(distinct attributes_json->>'hosting_model')
          from ecl_context.object
          where object_type = 'application_deployment'
        ),
        'unresolved_app_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'application'
            and attributes_json->>'lookup_resolved' = 'false'
        ),
        'unresolved_platform_refs', (
          select count(*)
          from ecl_context.object
          where object_type = 'infrastructure'
            and attributes_json->>'lookup_resolved' = 'false'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.client_source_files, 1, "adapter must mark source_file origin as client_intake");
  assert.equal(counts.source_records, 1650, "every SP14 row must land as a source_record");
  assert.equal(counts.applications, 663, "application refs must not be inflated by deployment count");
  assert.equal(counts.infrastructure, 220, "hosting platform refs must resolve to infrastructure objects");
  assert.equal(counts.application_deployments, 1650, "every deployment row must land at deployment grain");
  assert.equal(counts.current_deployments, 1536);
  assert.equal(counts.planned_deployments, 70);
  assert.equal(counts.retired_deployments, 44);
  assert.equal(counts.deployment_of, 1650);
  assert.equal(counts.hosted_on, 1650);
  assert.equal(counts.known_gap_relationships, 172, "known-gap rows must remain unknown across both relationship types");
  assert.equal(counts.in_review_relationships, 618, "partial deployment rows must route to in_review on both relationships");
  assert.equal(counts.partial_source_records, 309);
  assert.equal(counts.known_gap_records, 86);
  assert.equal(counts.distinct_deployment_ids, 1650, "deployment IDs must not collapse");
  assert.equal(counts.environment_values, 4);
  assert.equal(counts.hosting_model_values, 5);
  assert.equal(counts.unresolved_app_refs, 0);
  assert.equal(counts.unresolved_platform_refs, 0);

  const brokenFk = psql(
    `
      update ecl_context.relationship
      set to_object_id = gen_random_uuid()
      where id = (
        select id
        from ecl_context.relationship
        where relationship_type = 'HOSTED_ON'
        limit 1
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(brokenFk.status, 0, "HOSTED_ON endpoint FK must reject unresolved platform refs");
  assert.match(brokenFk.stderr, /relationship_to_object_fk|foreign key/i);

  const noAppInflation = psql(
    `
      select count(*)
      from ecl_context.object
      where object_type = 'application'
        and object_key in (
          select attributes_json->>'application_id'
          from ecl_context.object
          where object_type = 'application_deployment'
        );
    `,
  );
  assert.equal(Number(noAppInflation.stdout.trim()), 663, "deployment refs must resolve to base applications, not application copies");

  console.log(JSON.stringify({ accepted: true, adapterSummary, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
