#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-physical-upgrade-test-"));
const dataDir = path.join(tmpRoot, "data");
const socketDir = tmpRoot;
const port = String(48432 + Math.floor(Math.random() * 1000));
const dbName = "ecl_physical_upgrade_test";
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
    create schema if not exists ecl_context;

    create table ecl_context.object_type_catalog (
      object_type text primary key,
      display_label text not null,
      grain text not null,
      counting_class text not null,
      description text not null,
      constraint object_type_catalog_grain_check check (
        grain in (
          'enterprise', 'business_segment', 'business_function', 'organization',
          'process', 'application', 'application_deployment', 'data_platform', 'data_product',
          'infrastructure', 'vendor', 'contract', 'program', 'metric',
          'risk', 'control'
        )
      ),
      constraint object_type_catalog_counting_class_check check (
        counting_class in (
          'enterprise_scope',
          'business_entity',
          'deployment_instance',
          'technical_component',
          'commercial_entity',
          'initiative',
          'risk_control',
          'metric_definition'
        )
      )
    );

    insert into ecl_context.object_type_catalog (
      object_type,
      display_label,
      grain,
      counting_class,
      description
    ) values (
      'application',
      'Application',
      'application',
      'business_entity',
      'Legacy app row'
    );

    create table ecl_context.object (
      id uuid primary key default gen_random_uuid(),
      tenant_key text not null,
      assessment_id text not null,
      object_key text not null,
      object_type text not null,
      display_name text not null,
      business_domain text,
      lifecycle_state text not null,
      source_record_id uuid,
      basis text not null,
      value_state text not null,
      review_state text not null,
      confidence numeric(5,4),
      attributes_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint object_type_check check (
        object_type in (
          'enterprise', 'business_segment', 'business_function', 'organization',
          'process', 'application', 'application_deployment', 'data_platform', 'data_product',
          'infrastructure', 'vendor', 'contract', 'program', 'metric',
          'risk', 'control'
        )
      ),
      constraint object_key_unique unique (tenant_key, assessment_id, object_type, object_key),
      constraint object_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
    );

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
      'APP-001',
      'application',
      'Legacy Application',
      'current',
      'source_recorded',
      'known',
      'not_reviewed'
    );

    create view ecl_context.application_v as
    select
      o.*,
      otc.grain,
      otc.counting_class
    from ecl_context.object o
    join ecl_context.object_type_catalog otc on otc.object_type = o.object_type
    where otc.grain = 'application'
      and otc.counting_class = 'business_entity';
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
        'catalog_count', (select count(*) from ecl_context.object_type_catalog),
        'persona_catalog_rows', (
          select count(*) from ecl_context.object_type_catalog
          where object_type = 'persona'
            and grain = 'persona'
            and counting_class = 'persona'
        ),
        'semantic_column_count', (
          select count(*)
          from information_schema.columns
          where table_schema = 'ecl_context'
            and table_name = 'object'
            and column_name = 'canonical_semantic_type'
        ),
        'semantic_key_constraint_count', (
          select count(*)
          from pg_constraint
          where conrelid = 'ecl_context.object'::regclass
            and conname = 'object_semantic_key_unique'
        ),
        'legacy_key_constraint_count', (
          select count(*)
          from pg_constraint
          where conrelid = 'ecl_context.object'::regclass
            and conname = 'object_key_unique'
        ),
        'catalog_fk_constraint_count', (
          select count(*)
          from pg_constraint
          where conrelid = 'ecl_context.object'::regclass
            and conname = 'object_type_catalog_fk'
        ),
        'application_view_column_order', (
          select jsonb_agg(column_name order by ordinal_position)
          from information_schema.columns
          where table_schema = 'ecl_context'
            and table_name = 'application_v'
        )
      )::text;
    `).stdout.trim(),
  );

  assert.ok(counts.catalog_count >= 20, `expected current object catalog, got ${counts.catalog_count}`);
  assert.equal(counts.persona_catalog_rows, 1, "catalog constraint upgrade must admit persona rows");
  assert.equal(counts.semantic_column_count, 1, "older object table must receive canonical_semantic_type");
  assert.equal(counts.semantic_key_constraint_count, 1, "older object table must receive semantic uniqueness");
  assert.equal(counts.legacy_key_constraint_count, 0, "legacy object_key_unique must be replaced");
  assert.equal(counts.catalog_fk_constraint_count, 1, "older object table must receive catalog FK");
  assert.ok(
    counts.application_view_column_order.includes("canonical_semantic_type"),
    "older application_v must be recreated with canonical_semantic_type from upgraded object table",
  );
  assert.ok(counts.application_view_column_order.includes("grain"), "application_v must preserve catalog grain");

  console.log(JSON.stringify({ accepted: true, counts }, null, 2));
} finally {
  if (started) {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
