#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const generatorPath = path.join(repoRoot, "scripts/ecl/generate_dense_source_room_extracts.py");
const loaderPath = path.join(repoRoot, "scripts/ecl/load_dense_source_room_source_projection_layer.py");
const ddlPath = path.join(repoRoot, "docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql");
const migrationPath = path.join(repoRoot, "supabase/migrations/20260831123000_home_projection_active_intake_page_keys.sql");

const requiredApplicationFields = [
  "cloud_readiness",
  "authentication_method",
  "annual_cost_basis",
  "end_of_support_date",
];

const requiredPageKeys = [
  "metrics_outcomes",
  "risks_controls",
  "programs_initiatives",
  "org_ownership",
  "ai_use_cases",
];

const loader = fs.readFileSync(loaderPath, "utf8");
const ddl = fs.readFileSync(ddlPath, "utf8");
const migration = fs.readFileSync(migrationPath, "utf8");

for (const field of requiredApplicationFields) {
  assert.match(loader, new RegExp(`["']${field}["']`), `loader carries ${field}`);
}

for (const pageKey of requiredPageKeys) {
  assert.match(loader, new RegExp(`["']${pageKey}["']`), `loader emits ${pageKey}`);
  assert.match(ddl, new RegExp(`'${pageKey}'`), `DDL allows ${pageKey}`);
  assert.match(migration, new RegExp(`'${pageKey}'`), `migration allows ${pageKey}`);
}

for (const field of [
  "value_claim_status",
  "claim_readiness",
  "claim_blocked_reason",
  "unblock_action",
  "unblock_target_period",
]) {
  assert.match(loader, new RegExp(`["']${field}["']`), `metrics_outcomes preserves ${field}`);
}
assert.match(
  loader,
  /"source_file_id": f"active:\{TENANT_KEY\}:\{file_name\}"/,
  "active-intake Home rows carry citable source_file_id without creating false source_record FKs",
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "home-projection-page-key-loader-"));
const generated = spawnSync("python3", [generatorPath, "--out-dir", tmp], {
  cwd: repoRoot,
  encoding: "utf8",
});
assert.equal(generated.status, 0, generated.stderr || generated.stdout);
const appsCsv = path.join(tmp, "__synthetic_sources__", "SP03_CMDB", "ServiceNow_Business_Applications_SYNTHETIC.csv");
const header = fs.readFileSync(appsCsv, "utf8").split(/\r?\n/, 1)[0].split(",");
for (const field of requiredApplicationFields) {
  assert.ok(header.includes(field), `generated SP03_CMDB header includes ${field}`);
}

console.log("PASS: Home projection page-key loader contract is enforced.");
