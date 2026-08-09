#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sealPath = path.join(root, "docs/releases/migration-seals.json");
const migrationsDir = path.join(root, "supabase/migrations");

function fail(message) {
  console.error(`migration-seals: ${message}`);
  process.exit(1);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

let parsed;
try {
  parsed = JSON.parse(readFileSync(sealPath, "utf8"));
} catch (error) {
  fail(`unable to read ${sealPath}: ${error instanceof Error ? error.message : String(error)}`);
}

const seals = parsed?.sealed_migrations;
if (!Array.isArray(seals)) {
  fail("docs/releases/migration-seals.json must contain sealed_migrations[]");
}

const problems = [];
for (const seal of seals) {
  const name = seal?.migration_name;
  const expected = seal?.migration_sha256;
  if (typeof name !== "string" || !name.endsWith(".sql")) {
    problems.push(`invalid migration_name: ${JSON.stringify(name)}`);
    continue;
  }
  if (typeof expected !== "string" || !/^[0-9a-f]{64}$/.test(expected)) {
    problems.push(`${name}: invalid migration_sha256`);
    continue;
  }

  const filePath = path.join(migrationsDir, name);
  let current;
  try {
    current = sha256(readFileSync(filePath, "utf8"));
  } catch (error) {
    problems.push(`${name}: unable to read migration file (${error instanceof Error ? error.message : String(error)})`);
    continue;
  }
  if (current !== expected) {
    problems.push(`${name}: sealed SHA mismatch; expected ${expected}, current ${current}. Restore the applied file and create a new additive migration.`);
  }
}

if (problems.length > 0) {
  fail(`failed\n${problems.map((problem) => `- ${problem}`).join("\n")}`);
}

console.log(`migration-seals: verified ${seals.length} sealed migration${seals.length === 1 ? "" : "s"}`);
