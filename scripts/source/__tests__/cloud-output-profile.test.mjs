import assert from "node:assert/strict";
import { test } from "node:test";
import { reconcileCloudOutputProfile } from "../cloud-output-profile.mjs";

const runs = ["run-a", "run-b"];
const evidence = runs.map((calculation_run_id) => ({ calculation_run_id,
  output_key: "evidence_row_count", priced: false }));
const prior = runs.map((calculation_run_id) => ({ calculation_run_id,
  output_key: "calculated_amount_usd", priced: true }));

test("accepts current evidence-only outputs", () => {
  assert.deepEqual(reconcileCloudOutputProfile(evidence, runs), {
    mode: "current_evidence_only", output_rows: 2, evidence_count_rows: 2,
    historical_amount_rows: 0, historical_priced_rows: 0,
  });
});

test("classifies the exact historical dual-output shape before and after unsizing", () => {
  assert.equal(reconcileCloudOutputProfile([...evidence, ...prior], runs).historical_priced_rows, 2);
  assert.equal(reconcileCloudOutputProfile([...evidence, ...prior.map((row) => ({ ...row, priced: false }))], runs)
    .historical_priced_rows, 0);
});

test("rejects unknown, uneven, duplicated, or partially priced outputs", () => {
  assert.throws(() => reconcileCloudOutputProfile([...evidence, { ...prior[0], output_key: "other" }, prior[1]], runs));
  assert.throws(() => reconcileCloudOutputProfile([...evidence, prior[0]], runs));
  assert.throws(() => reconcileCloudOutputProfile([...evidence, prior[0], prior[0], prior[1]], runs));
  assert.throws(() => reconcileCloudOutputProfile([...evidence, prior[0], { ...prior[1], priced: false }], runs));
});
