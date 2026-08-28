#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "meridian-phs-moves-activation-"));
const sourceRoomDir = path.join(tmp, "source-room");
const outDir = path.join(tmp, "activation");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      LC_ALL: "C.UTF-8",
      LANG: "C.UTF-8",
    },
    maxBuffer: 64 * 1024 * 1024,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result;
}

run("python3", [
  "scripts/ecl/generate_dense_source_room_extracts.py",
  "--profile",
  "meridian-health",
  "--out-dir",
  sourceRoomDir,
]);

const result = run("node", [
  "scripts/ecl/write_meridian_phs_moves_activation_plan.mjs",
  "--source-room-dir",
  sourceRoomDir,
  "--out-dir",
  outDir,
  "--client-id",
  "00000000-0000-4000-8000-000000000102",
  "--json",
]);

const summary = JSON.parse(result.stdout);
assert.equal(summary.accepted, true, "activation proof must be accepted");
assert.equal(summary.tenant_key, "meridian-health");
assert.equal(summary.declared_program_count, 38);
assert.equal(summary.activation_program_count, 38);
assert.equal(summary.programs_from_home_snapshot, 28);
assert.equal(summary.programs_from_source_room_ppm, 10);
assert.equal(summary.unresolved_gap_count, 0);
assert.deepEqual(summary.generated_rows, {
  engagements: 38,
  program_modules: 490,
  phase_capture_modules: 262,
  program_milestones: 228,
  program_work_items: 228,
  program_risks: 38,
  pattern_match_logs: 38,
});
assert.deepEqual(summary.proof_checks, {
  deterministic_ids: true,
  idempotent_upserts: true,
  no_database_connection: true,
  no_value_claimable_until_tower_gate: true,
  contains_named_phs_moves: true,
});

const names = new Set(summary.programs.map((program) => program.name));
for (const required of [
  "STARS 5.0 Improvement Program",
  "RAF Capture & Risk Adjustment Modernization",
  "Ambient Clinical Documentation (DAX) Rollout",
]) {
  assert.equal(names.has(required), true, `${required} must be activated`);
}

const moveIds = summary.programs.map((program) => program.move_id);
assert.equal(new Set(moveIds).size, moveIds.length, "move ids must be deterministic and unique");
assert.equal(
  summary.programs.every((program) => program.value_verified_status === "pending"),
  true,
  "activation must not create claimable value",
);

const sql = fs.readFileSync(path.join(outDir, "meridian_phs_moves_activation.sql"), "utf8");
assert.match(sql, /on conflict \(id\) do update set/i);
assert.match(sql, /client_id = excluded\.client_id/i);
assert.match(sql, /solution = excluded\.solution/i);
assert.doesNotMatch(sql, /on conflict \(client_id, solution\)/i);
assert.doesNotMatch(sql, /on conflict \(engagement_id, module_key\)/i);
assert.doesNotMatch(sql, /\bdelete\s+from\b/i, "activation SQL must not delete existing Move rows");
assert.doesNotMatch(sql, /\bdatabase_url\b/i, "activation plan must not embed runtime database credentials");
assert.match(sql, /value_is_not_claimable_until_tower_gate_passes/);
assert.match(sql, /phs_executive_value_chain/);
assert.match(sql, /phase_2_current_state_findings/);
assert.match(sql, /phase_3_solution_approach/);
assert.match(sql, /source_basis/);
assert.match(sql, /review_state/);

console.log(
  JSON.stringify(
    {
      accepted: true,
      programs: `${summary.activation_program_count} of ${summary.declared_program_count}`,
      generated_rows: summary.generated_rows,
      output: summary.output,
    },
    null,
    2,
  ),
);
