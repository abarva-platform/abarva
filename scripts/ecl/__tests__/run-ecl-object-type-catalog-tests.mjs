#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-object-type-catalog-test-"));
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(45432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_object_type_catalog_test";
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
  run("pg_ctl", ["-D", dataDir, "-l", path.join(tmpRoot, "postgres.log"), "-o", `-p ${port} -k ${socketDir}`, "start"]);
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

  psql(`
    insert into ecl_context.object (
      id,
      tenant_key,
      assessment_id,
      object_key,
      object_type,
      display_name,
      lifecycle_state,
      basis,
      value_state,
      review_state
    ) values
    (
      'aaaaaaaa-0000-0000-0000-000000000001',
      'tenant-a',
      'assessment-a',
      'APP-001',
      'application',
      'Claims Platform',
      'current',
      'source_recorded',
      'known',
      'not_reviewed'
    ),
    (
      'aaaaaaaa-0000-0000-0000-000000000002',
      'tenant-a',
      'assessment-a',
      'APP-001-PROD',
      'application_deployment',
      'Claims Platform Production',
      'current',
      'source_recorded',
      'known',
      'not_reviewed'
    ),
    (
      'aaaaaaaa-0000-0000-0000-000000000003',
      'tenant-a',
      'assessment-a',
      'PLAT-001',
      'data_platform',
      'Claims Analytics Mart',
      'current',
      'source_recorded',
      'known',
      'not_reviewed'
    );
  `);

  const counts = JSON.parse(
    psql(`
      select jsonb_build_object(
        'catalog_count', (select count(*) from ecl_context.object_type_catalog),
        'object_count', (select count(*) from ecl_context.object),
        'application_count', (select count(*) from ecl_context.application_v),
        'application_deployment_count', (select count(*) from ecl_context.application_deployment_v),
        'technical_component_count', (select count(*) from ecl_context.technical_component_v),
        'business_object_count', (select count(*) from ecl_context.business_object_v),
        'object_type_fk_count', (
          select count(*)
          from pg_constraint
          where conname = 'object_type_catalog_fk'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.ok(counts.catalog_count >= 20, `expected seeded object-type catalog, got ${counts.catalog_count}`);
  assert.equal(counts.object_type_fk_count, 1, "object_type must be FK-backed by object_type_catalog");
  assert.equal(counts.object_count, 3, "fixture should contain one app, one deployment, and one platform");
  assert.equal(counts.application_count, 1, "deployments must not enter application_v counts");
  assert.equal(counts.application_deployment_count, 1, "deployment instances must be countable separately");
  assert.equal(counts.technical_component_count, 2, "deployment and data platform are technical components");
  assert.equal(counts.business_object_count, 1, "deployment instances must not enter business_object_v");

  const badType = psql(
    `
      insert into ecl_context.object (
        tenant_key,
        assessment_id,
        object_key,
        object_type,
        display_name,
        lifecycle_state,
        basis,
        value_state,
        review_state
      ) values (
        'tenant-a',
        'assessment-a',
        'APP-BOGUS',
        'applicationish',
        'Bogus Object',
        'current',
        'source_recorded',
        'known',
        'not_reviewed'
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(badType.status, 0, "unknown object_type must be refused by the catalog FK");
  assert.match(badType.stderr, /object_type_catalog_fk|foreign key/i);

  const readbackSql = run(
    "python3",
    [
      "-c",
      [
        "import sys",
        "sys.path.insert(0, 'scripts/ecl')",
        "import execute_dense_all_layer_load as load",
        "print(load.readback_sql())",
      ].join("; "),
    ],
  ).stdout;
  assert.match(readbackSql, /ecl_context\.application_v/, "all-layer readback must use application_v");
  assert.match(readbackSql, /ecl_context\.application_deployment_v/, "all-layer readback must use application_deployment_v");
  assert.doesNotMatch(
    readbackSql,
    /object\s+where\s+tenant_key\s*=\s*\{tenant\}[^)]*object_type\s*=\s*'application'/s,
    "application business counts must not be raw object filters",
  );

  console.log(JSON.stringify({ accepted: true, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
