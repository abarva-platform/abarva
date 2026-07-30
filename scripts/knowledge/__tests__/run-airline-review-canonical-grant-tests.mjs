#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const repoRoot = path.resolve(new URL("../../..", import.meta.url).pathname);
const migrationPath = path.join(repoRoot, "supabase/migrations/20260730234500_airline_review_canonical_promotion_grants.sql");
const sql = fs.readFileSync(migrationPath, "utf8");

const required = [
  /GRANT USAGE ON SCHEMA knowledge TO airline_demo_new_reviewer/i,
  /knowledge\.entity/i,
  /knowledge\.fact_assertion/i,
  /knowledge\.relationship_type/i,
  /knowledge\.relationship_assertion/i,
  /GRANT SELECT, INSERT, UPDATE ON TABLE/i,
];

for (const pattern of required) {
  assert.match(sql, pattern);
}

assert.doesNotMatch(sql, /GRANT\s+ALL\s+PRIVILEGES/i);
assert.doesNotMatch(sql, /GRANT\s+DELETE/i);
assert.doesNotMatch(sql, /publication\./i);
assert.doesNotMatch(sql, /consumption\./i);
assert.doesNotMatch(sql, /metrics\./i);

console.log("airline review canonical grant migration tests passed");
