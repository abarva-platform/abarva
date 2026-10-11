#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FUNCTIONS, MIGRATIONS, VIEWS, anonymize, functionPredicates, inspect, migrationStatus,
} from "../probe-tower-serving-preflight.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const join = `join serving.tower_active_assessment_keys() active
  on active.tenant_key = p.tenant_key
 and active.assessment_id = p.assessment_id
 and active.projection_version = p.projection_version`;
const pages = {
  tower_ai_rows: "where coalesce(p.display_payload_json ->> 'page_key', 'ai_portfolio') = page_key_arg",
  tower_command_rows: "where page_key_arg = 'all' or p.page_key = page_key_arg",
  tower_value_rows: "where page_key_arg = 'all' or p.page_key = page_key_arg",
  tower_evidence_rows: "where p.page_key = page_key_arg",
};
for (const name of FUNCTIONS) {
  assert.deepEqual(functionPredicates(`${join} ${pages[name]}`, name), { activeJoin: true, page: true });
  assert.equal(functionPredicates(`-- ${join}\n${pages[name]}`, name).activeJoin, false,
    `${name} must not count a comment as a join`);
  assert.equal(functionPredicates(join, name).page, false, `${name} must require its page filter`);
  assert.equal(functionPredicates(pages[name], name).activeJoin, false, `${name} must require active identity`);
  assert.equal(functionPredicates(join.replace("and active.projection_version = p.projection_version", ""), name).activeJoin,
    false, `${name} must join on all three identity fields`);
}
assert.equal(migrationStatus(null, "same"), "missing");
assert.equal(migrationStatus({ sha256: null }, "same"), "applied_unhashed");
assert.equal(migrationStatus({ sha256: "old" }, "same"), "hash_mismatch");
assert.equal(migrationStatus({ sha256: "same" }, "same"), "match");

const labels = anonymize([
  { tenant_key: "secret-client", assessment_id: "secret-assessment", projection_version: 2 },
]);
assert.equal(labels({ tenant_key: "secret-client", assessment_id: "secret-assessment", projection_version: 2 }),
  "tenant_1\tassessment_1\tv2");

function fakeClient({ omitPage = false, lifecycleState = "active", missingMigration = false } = {}) {
  const tenant_key = "secret-client";
  const assessment_id = "secret-assessment";
  const identity = { tenant_key, assessment_id, projection_version: 2 };
  return {
    async query(sql, params) {
      if (sql.includes("to_regclass('schema_migrations')")) return { rows: [{ present: true }] };
      if (sql.includes("information_schema.columns")) return { rows: [{ present: true }] };
      if (sql.includes("from schema_migrations")) return { rows: MIGRATIONS.slice(missingMigration ? 1 : 0).map((name) => ({ name, sha256: "same" })) };
      if (sql.includes("pg_get_functiondef")) return { rows: FUNCTIONS.map((proname) => ({
        proname, body: `${join} ${omitPage && proname === "tower_ai_rows" ? "" : pages[proname]}`,
      })) };
      if (sql.includes("to_regclass('ecl_projection.tower_assessment_lifecycle')")) return { rows: [{ present: true }] };
      if (sql.includes("from ecl_projection.tower_assessment_lifecycle")) return { rows: [{ ...identity, state: lifecycleState }] };
      if (sql.includes("to_regprocedure('serving.tower_active_assessment_keys()')")) return { rows: [{ present: true }] };
      if (sql.includes("from serving.tower_active_assessment_keys()")) return { rows: [identity] };
      if (sql.includes("to_regclass('ecl_projection.tower_ai_portfolio')")) return { rows: [{ present: true }] };
      if (sql.includes("from ecl_projection.tower_ai_portfolio")) return { rows: [
        { ...identity, page_key: "ai_portfolio", rows: 42 },
        { ...identity, page_key: "adoption_lens", rows: 13 },
      ] };
      if (sql.includes("from pg_class c join pg_namespace n")) return { rows: VIEWS.map((relname) => ({ relname })) };
      if (sql.includes("from serving.")) {
        assert.ok(VIEWS.some((name) => sql.includes(`from serving.${name} `)), "only allowlisted views may be queried");
        return { rows: [{ ...identity, rows: 4 }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}

const hashes = Object.fromEntries(MIGRATIONS.map((name) => [name, "same"]));
const report = await inspect(fakeClient(), hashes);
assert.deepEqual(report.gaps, []);
assert.equal(report.lines.filter((line) => line.startsWith("MIGRATION\t")).length, 4);
assert.equal(report.lines.filter((line) => line.startsWith("FUNCTION\t")).length, 4);
assert.equal(report.lines.filter((line) => line.startsWith("VIEW\t")).length, 9);
assert.equal(report.lines.filter((line) => line.startsWith("VIEW_ROWS\t")).length, 9);
assert.equal(report.lines.filter((line) => line.startsWith("AI_PHYSICAL\t")).length, 2);
assert.ok(report.lines.some((line) => line.includes("status=match")));
assert.doesNotMatch(report.lines.join("\n"), /secret-client|secret-assessment/);
assert.ok((await inspect(fakeClient({ omitPage: true }), hashes)).gaps.includes("function_predicate:tower_ai_rows"));
assert.ok((await inspect(fakeClient({ lifecycleState: "retired" }), hashes)).gaps.includes("active_fallback"));
assert.ok((await inspect(fakeClient({ missingMigration: true }), hashes)).gaps.some((gap) => gap.startsWith("migration_missing:")));

const source = readFileSync(path.resolve(here, "../probe-tower-serving-preflight.mjs"), "utf8");
assert.match(source, /BEGIN READ ONLY/);
assert.doesNotMatch(source, /\b(?:insert|update|delete|truncate|drop|alter|create)\s+(?:into\s+)?(?:table\s+)?[a-z_.]+/i);
console.log("tower serving preflight tests: PASS");
