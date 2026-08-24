#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(new URL("../../..", import.meta.url).pathname);
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-azure-gate-validator-"));

const ackKeys = [
  "approved_for_future_aca_job_submission",
  "tenant_scope_confirmed",
  "digest_pinned_image_confirmed",
  "private_data_plane_target_confirmed",
  "idempotency_key_confirmed",
  "proof_bundle_hash_confirmed",
  "independent_readback_required",
  "no_product_route_change",
  "no_active_source_promotion",
  "human_review_after_readback_required",
];

const expectedReadback = {
  source: {
    source_record: 7080,
    source_file: 14,
    document: 720,
    document_extraction: 250,
    extraction_distinct_spans: 250,
    client_attested_rows: 0,
  },
  context: {
    object_type_catalog: 20,
    object: 3825,
    application: 750,
    application_deployment: 1650,
    vendor: 215,
    data_platform: 263,
    infrastructure: 220,
    relationship: 8972,
    deployment_of: 1650,
    hosted_on: 1650,
    integrates_with: 972,
    metric_definition: 127,
    measure: 13190,
    measure_metric_drift: 0,
    relationship_endpoint_drift: 0,
  },
  commercial: {
    contract: 230,
    contract_service_line: 230,
    contract_scope: 690,
    invoice_line: 480,
    sla_observation: 260,
    contract_scope_object_drift: 0,
    contract_vendor_drift: 0,
    sla_metric_drift: 0,
  },
  review: {
    review_event: 658,
    review_contract_subjects: 277,
    review_invoice_subjects: 120,
    review_sla_subjects: 260,
    review_context_pack_subjects: 1,
    review_contract_drift: 0,
    review_invoice_drift: 0,
    review_sla_drift: 0,
    review_source_record_drift: 0,
  },
  projection: {
    projection_manifest: 7,
    home_enterprise_landscape: 2946,
    source_contract_360: 230,
    source_vendor_360: 101,
    source_value_levers: 230,
    source_event_workspace: 173,
    tower_command_center: 930,
    intelligence_context_pack: 9,
    home_primary_object_drift: 0,
    home_refusal_without_payload: 0,
    home_application_count_basis_drift: 0,
    home_application_page_deployment_rows: 0,
    contract_projection_contract_drift: 0,
    event_review_drift: 0,
    event_rows_without_evidence_payload: 0,
    source_value_claimable_rows: 0,
    source_value_gated_rows: 230,
    tower_primary_object_drift: 0,
    tower_gated_without_reason: 0,
    intelligence_context_pack_drift: 0,
    intelligence_primary_object_drift: 0,
    value_lever_metric_drift: 0,
    vendor_projection_vendor_drift: 0,
  },
  cube: {
    cube_manifest: 9,
    cube_slice: 29,
    cube_slice_metric: 103,
    cube_slice_measure: 4320,
    cube_key_count: 9,
    cube_metric_drift: 0,
    cube_measure_drift: 0,
    json_metric_without_fk: 0,
  },
};

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function buildPackage(dir, mutate) {
  fs.mkdirSync(dir, { recursive: true });
  const readback = structuredClone(expectedReadback);
  if (mutate) mutate(readback);
  const runContractPath = path.join(dir, "ecl_dense_azure_load_run_contract.json");
  const readbackContractPath = path.join(dir, "ecl_dense_azure_row_for_row_readback_contract.json");
  writeJson(runContractPath, {
    actual_azure_execution: false,
    dry_run_only: true,
    image_digest: "${ECL_DENSE_IMAGE_DIGEST_PINNED}",
    mode: "gate_package_not_executed",
    readback_contract: readbackContractPath,
    status: "planned_not_executed",
  });
  writeJson(readbackContractPath, {
    actual_readback_execution: false,
    comparison_type: "row_for_row_against_local_dense_all_layer_proof",
    expected_readback_by_layer: readback,
    field_hash_required: true,
    status: "contract_ready_not_executed",
  });
  writeJson(path.join(dir, "ecl_dense_azure_command_plan.json"), {
    az_invoked: false,
    command_was_executed: false,
    dry_run_selected_command: ["npm", "run", "ops:aca-job", "--", "--plan-only"],
    future_execute_command_not_run: ["npm", "run", "ops:aca-job", "--"],
  });
  writeJson(path.join(dir, "ecl_dense_azure_load_gate_manifest.template.json"), {
    acknowledgements: Object.fromEntries(ackKeys.map((key) => [key, false])),
    approval_file_purpose: "template_only_not_approval",
    approved: false,
    readback_contract: {
      path: readbackContractPath,
      sha256: "a".repeat(64),
    },
  });
  writeJson(path.join(dir, "ecl_dense_azure_load_approval_checklist.json"), {
    checks: [
      "digest_pinned_image",
      "private_data_plane_target",
      "database_secret_binding",
      "blob_proof_bundle_binding",
    ].map((name) => ({ name, status: "pending_future_approval" })).concat([
      { name: "product_route_repointing", status: "explicitly_not_authorized" },
      { name: "legacy_retirement", status: "explicitly_not_authorized" },
    ]),
  });
  writeJson(path.join(dir, "ecl_dense_azure_load_gate_status.json"), {
    events: [{ name: "azure_execution_refused_by_design" }],
    status: "ready_for_explicit_future_gate_review",
  });
  writeJson(path.join(dir, "ecl_dense_azure_execution_progress.json"), {
    overall_percent_complete: 50,
    steps: [
      { step: 1, percent_complete: 100 },
      { step: 2, percent_complete: 100 },
      { step: 3, percent_complete: 100 },
      { step: 4, percent_complete: 100 },
      { step: 5, percent_complete: 0, state: "blocked_by_hard_gate" },
      { step: 6, percent_complete: 0, state: "blocked_by_hard_gate" },
      { step: 7, percent_complete: 0, state: "blocked_by_hard_gate" },
    ],
  });
  writeJson(path.join(dir, "ecl_dense_azure_load_gate_package_summary.json"), {
    run_contract: runContractPath,
    status: "gate_package_ready_not_executed",
  });
  fs.writeFileSync(path.join(dir, "AZURE_LOAD_GATE_PACKAGE.md"), "Actual Azure execution: `false`\nThis package does not load Azure.\n");
}

function validate(dir) {
  let output;
  try {
    output = execFileSync("python3", ["scripts/ecl/validate_ecl_dense_azure_load_gate_package.py", "--out-dir", dir], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  } catch (error) {
    output = error.stdout;
  }
  return JSON.parse(output);
}

const passingPackage = path.join(tmpRoot, "passing");
buildPackage(passingPackage);
assert.equal(validate(passingPackage).accepted, true, "current higher readback counts should pass");

const missingKeyPackage = path.join(tmpRoot, "missing-key");
buildPackage(missingKeyPackage, (readback) => {
  delete readback.context.data_platform;
});
const missingKeyResult = validate(missingKeyPackage);
assert.equal(missingKeyResult.accepted, false, "missing required readback keys should fail");
assert(missingKeyResult.issues.some((issue) => issue.includes("readback.context.data_platform")));

const nonZeroDriftPackage = path.join(tmpRoot, "non-zero-drift");
buildPackage(nonZeroDriftPackage, (readback) => {
  readback.projection.tower_gated_without_reason = 1;
});
const nonZeroDriftResult = validate(nonZeroDriftPackage);
assert.equal(nonZeroDriftResult.accepted, false, "non-zero drift keys should fail");
assert(nonZeroDriftResult.issues.some((issue) => issue.includes("tower_gated_without_reason")));

console.log(JSON.stringify({ accepted: true, cases: 3 }, null, 2));
