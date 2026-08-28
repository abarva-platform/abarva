#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "meridian-phs-moves-activation-execute-"));

function run(args, env = {}) {
  return spawnSync("node", ["scripts/ecl/execute_meridian_phs_moves_activation_load.mjs", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
      LC_ALL: "C.UTF-8",
      LANG: "C.UTF-8",
    },
    maxBuffer: 128 * 1024 * 1024,
  });
}

const refusalDir = path.join(tmp, "refusal");
const refused = run(["--out-dir", refusalDir, "--json"], {
  DATABASE_URL: "",
  MERIDIAN_PHS_MOVES_ACTIVATION_MODE: "",
  MERIDIAN_PHS_MOVES_ACTIVATION_APPROVED: "",
  MERIDIAN_PHS_MOVES_TARGET_DATA_PLANE: "",
});
assert.notEqual(refused.status, 0, "execution must refuse without approved execute env");
const refusal = JSON.parse(fs.readFileSync(path.join(refusalDir, "meridian_phs_moves_activation_refusal.json"), "utf8"));
assert.equal(refusal.accepted, false);
assert.equal(refusal.actual_database_mutation, false);
assert.deepEqual(refusal.issues.sort(), [
  "DATABASE_URL_missing",
  "MERIDIAN_PHS_MOVES_ACTIVATION_APPROVED_must_be_true",
  "MERIDIAN_PHS_MOVES_ACTIVATION_MODE_must_be_execute",
  "MERIDIAN_PHS_MOVES_TARGET_DATA_PLANE_not_allowed_or_missing",
]);

const planDir = path.join(tmp, "plan");
const planned = run(["--out-dir", planDir, "--plan-only", "--json"]);
assert.equal(planned.status, 0, planned.stderr);
const plan = JSON.parse(planned.stdout);
assert.equal(plan.accepted, true);
assert.equal(plan.actual_database_mutation, false);
assert.equal(plan.plan_only, true);
assert.equal(plan.activation_summary.activation_program_count, 38);
assert.equal(plan.activation_summary.generated_rows.engagements, 38);
assert.equal(plan.activation_summary.generated_rows.program_modules, 490);
assert.equal(plan.activation_summary.generated_rows.phase_capture_modules, 262);
assert.match(plan.sql_sha256, /^[0-9a-f]{64}$/);
assert.equal(plan.activation_summary.proof_checks.idempotent_upserts, true);
assert.equal(
  fs.existsSync(path.join(planDir, "activation", "meridian_phs_moves_activation.sql")),
  true,
  "plan-only mode must write the SQL package",
);
const generatedSql = fs.readFileSync(path.join(planDir, "activation", "meridian_phs_moves_activation.sql"), "utf8");
assert.match(generatedSql, /on conflict \(id\) do update set/i);
assert.match(generatedSql, /client_id = excluded\.client_id/i);
assert.match(generatedSql, /solution = excluded\.solution/i);
assert.match(generatedSql, /phase_2_current_state_findings/i);
assert.match(generatedSql, /phase_3_solution_approach/i);
assert.doesNotMatch(generatedSql, /on conflict \(client_id, solution\)/i);
assert.doesNotMatch(generatedSql, /on conflict \(engagement_id, module_key\)/i);

const script = fs.readFileSync(path.join(ROOT, "scripts/ecl/execute_meridian_phs_moves_activation_load.mjs"), "utf8");
assert.match(script, /MERIDIAN_PHS_MOVES_ACTIVATION_MODE_must_be_execute/);
assert.match(script, /MERIDIAN_PHS_MOVES_ACTIVATION_APPROVED_must_be_true/);
assert.match(script, /idempotency_proven/);
assert.match(script, /charter ->> 'activation_basis'/);
assert.match(script, /__SEMANTIC2_PROOF_TGZ_BEGIN__/);
assert.match(script, /function sqlString\(value\)/);
assert.doesNotMatch(script, /:'client_id'|:'tenant_key'|:'activation_basis'/);

console.log(
  JSON.stringify(
    {
      accepted: true,
      refusal_issues: refusal.issues.length,
      plan_moves: plan.activation_summary.activation_program_count,
      sql_sha256: plan.sql_sha256,
    },
    null,
    2,
  ),
);
