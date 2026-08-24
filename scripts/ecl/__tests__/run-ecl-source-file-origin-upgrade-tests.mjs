#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-origin-upgrade-test-"));
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(47432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_origin_upgrade_test";
const env = { ...process.env, LC_ALL: "C", LANG: "C" };

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    env,
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

  psql(`
    create extension if not exists pgcrypto;
    create schema if not exists ecl_source;
    create table ecl_source.source_file (
      id uuid primary key default gen_random_uuid(),
      tenant_key text not null,
      assessment_id text not null,
      source_type text not null,
      source_owner text,
      file_name text not null,
      blob_uri text not null,
      file_hash text not null,
      source_date date,
      received_at timestamptz not null default now(),
      access_class text not null,
      quality_state text not null,
      metadata_json jsonb not null default '{}'::jsonb,
      constraint source_file_source_type_check check (
        source_type in (
          'cmdb', 'erp', 'ppm', 'clm', 'grc', 'bi', 'etl', 'ai_telemetry',
          'document', 'interview', 'manual_workbook', 'synthetic_source_room'
        )
      ),
      constraint source_file_access_class_check check (
        access_class in ('public_demo', 'internal', 'client_confidential', 'restricted')
      ),
      constraint source_file_quality_state_check check (
        quality_state in ('accepted', 'partial', 'blocked', 'superseded')
      ),
      constraint source_file_hash_unique unique (tenant_key, assessment_id, file_hash),
      constraint source_file_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
    );

    insert into ecl_source.source_file (
      tenant_key,
      assessment_id,
      source_type,
      file_name,
      blob_uri,
      file_hash,
      access_class,
      quality_state
    ) values (
      'tenant-a',
      'assessment-a',
      'cmdb',
      'legacy-cmdb.csv',
      'legacy://legacy-cmdb.csv',
      'legacy-hash',
      'internal',
      'accepted'
    );
  `);

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

  const counts = JSON.parse(
    psql(`
      select jsonb_build_object(
        'legacy_rows_backfilled', (
          select count(*) from ecl_source.source_file where origin = 'synthetic_generator'
        ),
        'origin_column_not_null', (
          select count(*)
          from information_schema.columns
          where table_schema = 'ecl_source'
            and table_name = 'source_file'
            and column_name = 'origin'
            and is_nullable = 'NO'
        ),
        'origin_check_constraints', (
          select count(*)
          from pg_constraint
          where conrelid = 'ecl_source.source_file'::regclass
            and conname = 'source_file_origin_check'
        ),
        'origin_indexes', (
          select count(*)
          from pg_indexes
          where schemaname = 'ecl_source'
            and tablename = 'source_file'
            and indexname = 'idx_source_file_tenant_origin'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.equal(counts.legacy_rows_backfilled, 1, "existing source_file rows must receive synthetic_generator origin");
  assert.equal(counts.origin_column_not_null, 1, "origin must be upgraded to not-null");
  assert.equal(counts.origin_check_constraints, 1, "origin check constraint must exist after upgrade");
  assert.equal(counts.origin_indexes, 1, "origin index must be creatable after upgrade");

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
        'tenant-a',
        'bad-origin',
        'cmdb',
        'made_up_origin',
        'bad.csv',
        'legacy://bad.csv',
        'bad-hash',
        'internal',
        'partial'
      );
    `,
    { allowFailure: true },
  );
  assert.notEqual(badOrigin.status, 0, "invalid origin must be refused after upgrade");
  assert.match(badOrigin.stderr, /source_file_origin_check|check constraint/i);

  console.log(JSON.stringify({ accepted: true, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
