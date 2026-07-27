#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPO_ROOT = process.cwd();
const PHASE_ROOT = "18-phase2b3c-azure-lab-implementation";
const TENANTS = [
  {
    tenantKey: "hc-demo-new",
    database: "abarva_hc_demo_new_knowledge_lab",
    rolePrefix: "hc_demo_new",
    migrationJob: "job-hcdn-db-migration-lab",
  },
  {
    tenantKey: "airline-demo-new",
    database: "abarva_airline_demo_new_knowledge_lab",
    rolePrefix: "airline_demo_new",
    migrationJob: "job-airdn-db-migration-lab",
  },
];

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

function csvRows(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = !quoted;
      } else if (ch === "," && !quoted) {
        values.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

execFileSync("node", ["scripts/knowledge/build-phase2b3c-postgres-plan.mjs"], {
  cwd: REPO_ROOT,
  stdio: "inherit",
});

for (const tenant of TENANTS) {
  const root = `clients/${tenant.tenantKey}/${PHASE_ROOT}`;
  const out = `${root}/12-postgres-security-plan`;
  const plan = readJson(`${out}/POSTGRES_IDENTITY_RLS_PLAN.json`);
  const validation = readJson(`${root}/validation/phase2b3c2c-postgres-readiness-validation-summary.json`);
  const sql = read(`${out}/phase2b3c2c-postgres-readiness.sql`);
  const rollback = read(`${out}/phase2b3c2c-rollback-rehearsal.sql`);
  const grants = csvRows(read(`${out}/ROLE_GRANT_MATRIX.csv`));
  const rls = csvRows(read(`${out}/RLS_TABLE_COVERAGE.csv`));
  const jobs = csvRows(read(`${out}/MIGRATION_JOB_CONTRACT.csv`));
  const checklist = csvRows(read(`${out}/MIGRATION_REPLAY_CHECKLIST.csv`));

  assert.equal(plan.tenantKey, tenant.tenantKey);
  assert.equal(plan.database, tenant.database);
  assert.equal(plan.azureApplyBlocked, true);
  assert.equal(plan.databaseMigrationBlocked, true);
  assert.equal(validation.status, "pass");

  for (const suffix of ["ingest", "reviewer", "publisher", "reader", "evaluator", "admin"]) {
    assert.equal(plan.roles[suffix], `${tenant.rolePrefix}_${suffix}`);
    assert.match(sql, new RegExp(`${tenant.rolePrefix}_${suffix}`));
  }

  assert.match(sql, new RegExp(`current_database\\(\\) <> '${tenant.database}'`));
  assert.match(sql, new RegExp(`target_tenant <> '${tenant.tenantKey}'`));
  assert.match(sql, /wildcard tenant is not allowed/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /force row level security/);
  assert.match(sql, /revoke all on schema working/);
  assert.match(sql, /revoke insert, update, delete on all tables in schema publication, consumption/);
  assert.match(sql, /alter table consumption\.strategic_insight alter column authority_state set default 'planning_grade'/);
  assert.match(rollback, /No tables are dropped here/);
  assert.match(rollback, new RegExp(`current_database\\(\\) <> '${tenant.database}'`));

  assert.ok(grants.some((row) => row.role === `${tenant.rolePrefix}_ingest` && row.schema === "working" && row.insert === "yes"));
  assert.ok(grants.some((row) => row.role === `${tenant.rolePrefix}_reader` && row.schema === "consumption" && row.insert === "no"));
  assert.ok(grants.some((row) => row.role === `${tenant.rolePrefix}_evaluator` && row.schema === "evidence" && row.update === "no"));

  assert.ok(rls.length >= 50, `${tenant.tenantKey} should cover governed tenant-key tables`);
  assert.ok(rls.every((row) => row.tenant_column === "tenant_key"));
  assert.ok(rls.some((row) => row.schema === "working" && row.boundary === "reader_denied_candidates"));
  assert.ok(rls.some((row) => row.schema === "evidence" && row.boundary === "runtime_denied_hidden_truth"));
  assert.ok(jobs.every((row) => row.job_name === tenant.migrationJob));
  assert.ok(jobs.some((row) => row.mode === "migration_replay" && row.command.includes("phase2b3c2c-postgres-readiness.sql")));
  assert.ok(checklist.some((row) => row.check === "idempotent_second_replay"));
  assert.ok(checklist.some((row) => row.check === "evaluator_cannot_mutate_knowledge"));
}

const airlineRoot = `clients/airline-demo-new/${PHASE_ROOT}`;
const airlineText = execFileSync("find", [airlineRoot, "-type", "f"], { cwd: REPO_ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.includes("validation/"))
  .map((file) => read(file))
  .join("\n");
assert.doesNotMatch(airlineText, /skyharbor-air|SkyHarbor/);

const rollup = readJson("reports/phase2b3c-postgres-readiness/rollup.json");
assert.equal(rollup.azureApplyBlocked, true);
assert.equal(rollup.databaseMigrationBlocked, true);
assert.deepEqual(
  rollup.tenants.map((tenant) => tenant.tenantKey).sort(),
  TENANTS.map((tenant) => tenant.tenantKey).sort(),
);

console.log("Phase 2B-3C PostgreSQL readiness tests passed.");
