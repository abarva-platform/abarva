#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-object-semantic-type-test-"));
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(46432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_object_semantic_type_test";
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
    [
      "-h",
      socketDir,
      "-p",
      port,
      "-d",
      dbName,
      "-v",
      "ON_ERROR_STOP=1",
      "-A",
      "-t",
      "-c",
      sql,
    ],
    options,
  );
}

let started = false;
try {
  run("initdb", ["-D", dataDir, "--encoding=UTF8", "--locale=C.UTF-8"]);
  run("pg_ctl", [
    "-D",
    dataDir,
    "-l",
    path.join(tmpRoot, "postgres.log"),
    "-o",
    `-p ${port} -k ${socketDir}`,
    "start",
  ]);
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
    path.join(repo, "supabase/migrations/20260828211000_ecl_object_semantic_type_identity.sql"),
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
    path.join(repo, "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql"),
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
    path.join(repo, "supabase/migrations/20260828211000_ecl_object_semantic_type_identity.sql"),
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
      review_state,
      attributes_json
    ) values
    (
      'aaaaaaaa-0000-0000-0000-000000000011',
      'tenant-a',
      'assessment-a',
      'SHARED-001',
      'metric',
      'Budget row',
      'current',
      'source_recorded',
      'known',
      'not_reviewed',
      '{"canonical_semantic_type":"budget"}'::jsonb
    ),
    (
      'aaaaaaaa-0000-0000-0000-000000000012',
      'tenant-a',
      'assessment-a',
      'SHARED-001',
      'metric',
      'Value observation row',
      'current',
      'source_recorded',
      'known',
      'not_reviewed',
      '{"canonical_semantic_type":"value_observation"}'::jsonb
    ),
    (
      'aaaaaaaa-0000-0000-0000-000000000013',
      'tenant-a',
      'assessment-a',
      'APP-001',
      'application',
      'Application row',
      'current',
      'source_recorded',
      'known',
      'not_reviewed',
      '{}'::jsonb
    );
  `);

  const counts = JSON.parse(
    psql(`
      select jsonb_build_object(
        'object_count', (select count(*) from ecl_context.object),
        'semantic_counts', (
          select jsonb_object_agg(canonical_semantic_type, row_count)
          from (
            select canonical_semantic_type, count(*) as row_count
            from ecl_context.object
            group by canonical_semantic_type
            order by canonical_semantic_type
          ) counts
        ),
        'semantic_key_constraint_count', (
          select count(*)
          from pg_constraint
          where conname = 'object_semantic_key_unique'
        ),
        'legacy_key_name_constraint_count', (
          select count(*)
          from pg_constraint
          where conname = 'object_key_unique'
        ),
        'legacy_key_shape_constraint_count', (
          select count(*)
          from pg_constraint c
          join lateral (
            select array_agg(a.attname order by keys.ord) as key_columns
            from unnest(c.conkey) with ordinality as keys(attnum, ord)
            join pg_attribute a
              on a.attrelid = c.conrelid
             and a.attnum = keys.attnum
          ) columns on true
          where c.conrelid = 'ecl_context.object'::regclass
            and c.contype = 'u'
            and columns.key_columns = array[
              'tenant_key',
              'assessment_id',
              'object_type',
              'object_key'
            ]::name[]
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.object_count, 3, "fixture should insert all three objects");
  assert.equal(counts.semantic_counts.budget, 1, "budget semantic type should materialize");
  assert.equal(counts.semantic_counts.value_observation, 1, "value observation semantic type should materialize");
  assert.equal(counts.semantic_counts.application, 1, "missing semantic type should fall back to object_type");
  assert.equal(counts.semantic_key_constraint_count, 1, "semantic uniqueness constraint must exist");
  assert.equal(counts.legacy_key_name_constraint_count, 0, "legacy object key uniqueness name must not remain");
  assert.equal(counts.legacy_key_shape_constraint_count, 0, "legacy object key uniqueness shape must not remain");

  const duplicate = psql(
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
        review_state,
        attributes_json
      ) values (
        'tenant-a',
        'assessment-a',
        'SHARED-001',
        'metric',
        'Duplicate budget row',
        'current',
        'source_recorded',
        'known',
        'not_reviewed',
        '{"canonical_semantic_type":"budget"}'::jsonb
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(duplicate.status, 0, "same semantic object identity must still be unique");
  assert.match(duplicate.stderr, /object_semantic_key_unique|duplicate key/i);

  console.log(JSON.stringify({ accepted: true, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
