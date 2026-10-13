#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import { readbackSql, validateReadback } from "../load-healthcare-demo-layer4-products.mjs";

const options = { tenantKey: "fixture-tenant", assessmentId: "fixture-assessment" };
const expected = {
  projection_manifest: 0,
  projection_entry: 1,
  projection_entry_source_record_ref: 0,
  tower_command_center: 1,
  tower_value_chain: 0,
  tower_evidence_queue: 0,
  tower_ai_portfolio: 0,
  cube_manifest: 0,
  cube_slice: 0,
  cube_slice_metric: 0,
  cube_slice_measure: 0,
  serving: { tower_command_center: 1 },
  executive: {},
};

function readback() {
  return {
    tenant_key: options.tenantKey,
    assessment_id: options.assessmentId,
    active_assessments: [{ assessment_id: "retained-assessment", projection_version: 2 }],
    projection_manifest: 0,
    projection_entry: 2,
    projection_entry_source_record_ref: 0,
    tower_command_center: 2,
    tower_value_chain: 0,
    tower_evidence_queue: 0,
    tower_ai_portfolio: 0,
    cube_manifest: 0,
    cube_slice: 0,
    cube_slice_metric: 0,
    cube_slice_measure: 0,
    base_counts: {
      projection_entry: 1,
      tower_command_center: 1,
      tower_value_chain: 0,
      tower_evidence_queue: 0,
      cube_slice: 0,
    },
    bridge_counts: {
      projection_entry: 1,
      tower_command_center: 1,
      tower_value_chain: 0,
      tower_evidence_queue: 0,
      cube_slice: 0,
    },
    serving_counts: { tower_command_center: 0 },
    serving_target_counts: { tower_command_center: 0 },
    serving_base_counts: { tower_command_center: 0 },
    serving_bridge_counts: { tower_command_center: 0 },
    bridge_source_counts: { tower_command_center: 1 },
    physical_page_rows: { tower_command_center: [{ page_key: "command_center", row_key: "executive_summary", source_hash: "a".repeat(64) }] },
    source_ref_missing: 0,
    tower_value_chain_measure_drift: 0,
    tower_ai_primary_object_drift: 0,
    cube_metric_drift: 0,
    cube_measure_drift: 0,
    executive_totals: {},
  };
}

const sql = readbackSql(options);
assert.match(sql, /'active_assessments'/);
assert.match(sql, /'base_counts'/);
assert.match(sql, /'bridge_counts'/);
assert.match(sql, /'serving_target_counts'/);
assert.match(sql, /'serving_bridge_counts'/);
assert.match(sql, /'bridge_source_counts'/);
assert.match(sql, /serving\.tower_command_center where tenant_key = 'fixture-tenant' and assessment_id = 'fixture-assessment' and projection_version = 2/);
assert.match(sql, /row_key like 'source_cloud:%'/);
assert.match(sql, /row_key like 'source_contract_depth:%'/);
assert.match(sql, /from ecl_projection\.tower_ai_portfolio where[^\n]+coalesce\(display_payload_json ->> 'page_key', 'ai_portfolio'\) = 'adoption_lens'/);

const baseline = fs.readFileSync(
  new URL("../../../supabase/migrations/20260831031000_ecl_substrate_baseline.sql", import.meta.url),
  "utf8",
);
const aiTable = baseline.split('create table if not exists "ecl_projection"."tower_ai_portfolio" (')[1]?.split("\n);", 1)[0];
assert.ok(aiTable, "AI physical table definition missing");
assert.match(aiTable, /"row_key" text not null/);
assert.doesNotMatch(aiTable, /"page_key"/);
for (const view of ["tower_ai_portfolio", "tower_adoption_lens"]) {
  const viewSql = baseline.split(`create or replace view "serving"."${view}" as`)[1]?.split(";", 1)[0];
  assert.ok(viewSql, `${view} definition missing`);
  assert.match(viewSql, /\brow_key\b/);
  assert.match(viewSql, /\bpage_key\b/);
}

assert.deepEqual(validateReadback(readback(), expected, options), []);

const crossSection = readback();
crossSection.physical_page_rows.tower_command_center.push({
  page_key: "decision_lanes", row_key: "executive_summary", source_hash: "b".repeat(64),
});
const crossSectionExpected = {
  ...expected,
  serving: { ...expected.serving, tower_command_center: 2 },
};
assert.ok(!validateReadback(crossSection, crossSectionExpected, options)
  .includes("staged_tower_command_center_row_identity_or_hash_invalid"));
crossSection.physical_page_rows.tower_command_center[1].page_key = "command_center";
assert.ok(validateReadback(crossSection, crossSectionExpected, options)
  .includes("staged_tower_command_center_row_identity_or_hash_invalid"));

const leakedGeneration = readback();
leakedGeneration.serving_target_counts.tower_command_center = 7;
assert.ok(validateReadback(leakedGeneration, expected, options).includes("staged_tower_command_center_visible_before_serving_approval"));

const unknownExtra = readback();
unknownExtra.tower_command_center = 3;
assert.ok(validateReadback(unknownExtra, expected, options).includes("tower_command_center_contains_unclassified_rows"));

const lostPackageRow = readback();
lostPackageRow.base_counts.tower_command_center = 0;
assert.ok(validateReadback(lostPackageRow, expected, options).some((issue) => issue.startsWith("tower_command_center_base_expected_1")));

const missingBridgeInServing = readback();
missingBridgeInServing.serving_bridge_counts.tower_command_center = 1;
assert.ok(validateReadback(missingBridgeInServing, expected, options).includes("staged_tower_command_center_visible_before_serving_approval"));

const activeTarget = readback();
activeTarget.active_assessments = [{ assessment_id: options.assessmentId, projection_version: 2 }];
assert.ok(validateReadback(activeTarget, expected, options).includes("staged_assessment_must_remain_inactive"));

console.log("Layer 4 readback scope: 7 checks passed");
