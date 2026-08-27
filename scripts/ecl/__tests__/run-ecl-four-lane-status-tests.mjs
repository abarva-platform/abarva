#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const tmp = mkdtempSync(path.join(os.tmpdir(), "ecl-four-lane-status-"));
const compactSummary = path.join(tmp, "compact-summary.json");
const browserSummary = path.join(tmp, "browser-summary.json");
const evalSummary = path.join(tmp, "eval-summary.json");
const cleanupSummary = path.join(tmp, "cleanup-summary.json");
const out = path.join(tmp, "status.json");
const ref = process.env.ECL_RECONCILE_REF || "origin/main";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      LC_ALL: "C.UTF-8",
      LANG: "C.UTF-8",
    },
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result;
}

function gitShow(file) {
  return run("git", ["show", `${ref}:${file}`]).stdout;
}

try {
  writeFileSync(
    compactSummary,
    `${JSON.stringify(
      {
        accepted: true,
        checked_at: "2026-08-26T17:48:15.791Z",
        base_url: "https://app.abarva.ai",
        tenant_key: "meridian-health",
        proof_execution: "aca_private_operator",
        default_entry_routes: {
          numerator: 4,
          denominator: 4,
          accepted: true,
        },
        named_surfaces_browser_proven: {
          metric: "named surfaces browser-proven",
          numerator: 40,
          denominator: 40,
          accepted: true,
          product_counts: {
            Home: { numerator: 16, denominator: 16 },
            Source: { numerator: 9, denominator: 9 },
            Tower: { numerator: 9, denominator: 9 },
            Intelligence: { numerator: 6, denominator: 6 },
          },
        },
        findings_demonstrable_on_real_surface: {
          metric: "findings demonstrable on a real surface",
          numerator: 10,
          denominator: 10,
          accepted: true,
        },
        ava_eval: {
          accepted: true,
          answers_accepted: 13,
          answers_evaluated: 13,
          ablation_answers_accepted: 0,
          ablation_answers_evaluated: 13,
          ablation_demo_findings_accepted: 0,
          ablation_accepted: true,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  writeFileSync(
    browserSummary,
    `${JSON.stringify(
      {
        image: "acrabarvalab001.azurecr.io/abarva/web@sha256:test-digest",
        proof: {
          events: [
            {
              structured_event: "ecl_product_browser_smoke_summary",
              accepted: true,
              actual_browser_execution: true,
              actual_route_repointing: true,
            },
          ],
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  writeFileSync(
    evalSummary,
    `${JSON.stringify(
      {
        proof: {
          events: [
            {
              event: "ecl_ava_consultant_eval_compact_summary",
              summary: {
                accepted: true,
                alias_policy: { status: "frozen" },
              },
            },
          ],
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  writeFileSync(
    cleanupSummary,
    `${JSON.stringify(
      {
        schema_version: "ecl_retired_layer_cleanup_proof/v1",
        accepted: true,
        run_id: "cleanup-proof-fixture",
        workflow_url: "https://github.com/abarva-platform/abarva/actions/runs/cleanup-proof-fixture",
        timestamp: "2026-08-26T22:48:00.000Z",
        mode: "dry_run",
        schema_summaries: [
          {
            schema: "source_registry",
            exists: false,
            table_count: 0,
            view_count: 0,
            routine_count: 0,
            row_count: 0,
          },
        ],
        object_summaries: [
          {
            object: "knowledge.entity_source_identity",
            exists: false,
            relkind: null,
            row_count: 0,
          },
        ],
        dependencies_outside_retired_schemas_count: 0,
        active_code_references_count: 0,
        retirement_status_gate: {
          apply_allowed: true,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  run("node", [
    "scripts/ecl/write_ecl_four_lane_completion_status.mjs",
    "--ref",
    ref,
    "--out",
    out,
    "--live-proof-summary",
    compactSummary,
    "--browser-operator-summary",
    browserSummary,
    "--eval-operator-summary",
    evalSummary,
    "--cleanup-proof-summary",
    cleanupSummary,
    "--run-id",
    "proof-run-fixture",
    "--timestamp",
    "2026-08-26T18:00:00.000Z",
  ]);

  const status = JSON.parse(readFileSync(out, "utf8"));
  const committedStatus = JSON.parse(gitShow("docs/architecture/ecl-four-lane-completion-status.json"));
  assert.equal(status.schema_version, "ecl_four_lane_completion_status/v1");
  assert.equal(status.policy.aggregate_percentage_retired, true);
  assert.equal(status.policy.lane_percentages_reported_separately, true);
  assert(!Object.hasOwn(status, "overall_percentage"), "four-lane status must not report one blended percentage");

  const lanes = Object.fromEntries(status.lanes.map((lane) => [lane.lane, lane]));
  const committedLanes = Object.fromEntries(committedStatus.lanes.map((lane) => [lane.lane, lane]));
  assert.deepEqual(
    Object.keys(lanes).sort(),
    ["L-CLEANUP", "L-CLIENT", "L-CUTOVER", "L-PROOF"],
    "status must report exactly the four completion lanes",
  );
  assert.deepEqual(
    {
      cutover: `${lanes["L-CUTOVER"].numerator}/${lanes["L-CUTOVER"].denominator}`,
      proof: `${lanes["L-PROOF"].numerator}/${lanes["L-PROOF"].denominator}`,
      cleanup: `${lanes["L-CLEANUP"].numerator}/${lanes["L-CLEANUP"].denominator}`,
      client: `${lanes["L-CLIENT"].numerator}/${lanes["L-CLIENT"].denominator}`,
    },
    {
      cutover: "4/4",
      proof: "63/63",
      cleanup: "35/851",
      client: "14/14",
    },
  );
  assert.deepEqual(
    {
      cutover: `${committedLanes["L-CUTOVER"].numerator}/${committedLanes["L-CUTOVER"].denominator}`,
      proof: `${committedLanes["L-PROOF"].numerator}/${committedLanes["L-PROOF"].denominator}`,
      cleanup: `${committedLanes["L-CLEANUP"].numerator}/${committedLanes["L-CLEANUP"].denominator}`,
      client: `${committedLanes["L-CLIENT"].numerator}/${committedLanes["L-CLIENT"].denominator}`,
    },
    {
      cutover: `${lanes["L-CUTOVER"].numerator}/${lanes["L-CUTOVER"].denominator}`,
      proof: `${lanes["L-PROOF"].numerator}/${lanes["L-PROOF"].denominator}`,
      cleanup: `${lanes["L-CLEANUP"].numerator}/${lanes["L-CLEANUP"].denominator}`,
      client: `${lanes["L-CLIENT"].numerator}/${lanes["L-CLIENT"].denominator}`,
    },
    "committed four-lane status artifact must match the computed status lane counts",
  );
  assert.equal(status.live_product_proof.actual_route_repointing, true);
  assert.equal(status.live_product_proof.routes_accepted.numerator, 4);
  assert.equal(status.live_product_proof.surfaces_proven.numerator, 40);
  assert.equal(status.live_product_proof.findings_demonstrable.numerator, 10);
  assert.equal(status.live_product_proof.eval_baseline_accepted, 13);
  assert.equal(status.live_product_proof.eval_ablation_accepted, 0);
  assert.equal(status.live_product_proof.alias_count, 77);
  assert.equal(status.repo_denominators.serving_views.denominator, 40);
  assert.equal(status.repo_denominators.client_intake_adapters.denominator, 14);
  assert.equal(status.repo_denominators.client_intake_adapters.numerator, 14);
  assert.equal(status.repo_denominators.legacy_cleanup.live_absent_schema_credit.numerator, 9);
  assert.deepEqual(status.repo_denominators.legacy_cleanup.live_absent_schema_credit.schemas, ["source_registry"]);
  assert.equal(status.repo_denominators.legacy_cleanup.live_absent_object_credit.numerator, 1);
  assert.deepEqual(status.repo_denominators.legacy_cleanup.live_absent_object_credit.objects, [
    "knowledge.entity_source_identity",
  ]);
  assert.equal(committedStatus.repo_denominators.client_intake_adapters.denominator, 14);
  assert.equal(committedStatus.repo_denominators.client_intake_adapters.numerator, 14);
  assert.equal(status.repo_denominators.client_intake_source_family_landing.numerator, 14);
  assert.equal(status.repo_denominators.client_intake_source_family_landing.denominator, 14);
  assert.equal(
    status.repo_denominators.client_intake_source_family_landing.scope,
    "ecl_source.source_file/source_record landing only; does not count as canonical adapter completion",
  );

  console.log(JSON.stringify({ accepted: true, out }, null, 2));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
