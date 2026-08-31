#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const migrationName = "20260831031000_ecl_substrate_baseline.sql";
const migrationPath = path.join(repoRoot, "supabase/migrations", migrationName);
const referencePath = path.join(repoRoot, "docs/architecture/TOWER_PROJECTION_SCHEMA_REFERENCE.md");

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("baseline migration creates all four Tower projection tables", () => {
  const sql = fs.readFileSync(migrationPath, "utf8");
  for (const table of [
    "tower_ai_portfolio",
    "tower_command_center",
    "tower_evidence_queue",
    "tower_value_chain",
  ]) {
    assert.match(
      sql,
      new RegExp(`create table if not exists "ecl_projection"\\."${table}"`),
      `${table} must be created by the ECL substrate baseline`,
    );
  }
});

test("baseline migration leaves transaction boundaries to the migration runner", () => {
  const sql = fs.readFileSync(migrationPath, "utf8");
  assert.doesNotMatch(sql, /^begin;$/im);
  assert.doesNotMatch(sql, /^commit;$/im);
});

test("schema reference no longer claims the Tower projection tables are unversioned", () => {
  const doc = fs.readFileSync(referencePath, "utf8");
  assert.match(doc, new RegExp(migrationName));
  assert.doesNotMatch(doc, /No migration in this repository creates any of the four tables Tower reads/i);
  assert.doesNotMatch(doc, /Why this is not yet a migration/i);
});

test("npm exposes dry-run and apply entrypoints for the baseline", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  assert.match(pkg.scripts["ecl:migrate:substrate-baseline:dry"], new RegExp(`--dry --force ${migrationName}`));
  assert.match(pkg.scripts["ecl:migrate:substrate-baseline:apply"], new RegExp(`--ci --force ${migrationName}`));
  assert.equal(
    pkg.scripts["test:ecl-substrate-baseline-migration"],
    "node scripts/ops/__tests__/run-ecl-substrate-baseline-migration-tests.mjs",
  );
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${error.message}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
