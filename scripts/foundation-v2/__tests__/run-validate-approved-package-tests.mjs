#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const testPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testPath), "../../..");
const scriptPath = path.join(repoRoot, "scripts/foundation-v2/validate-approved-package.mjs");
const supportModulePath = path.join(repoRoot, "scripts/foundation-v2/golden-slice-support.mjs");
const tempRoot = mkdtempSync(path.join(tmpdir(), "foundation-v2-package-test-"));
const packageDir = path.join(tempRoot, "architecture-package");
mkdirSync(packageDir, { recursive: true });

writeMiniPackage(packageDir);

const runs = [
  { name: "repo-root-cwd", cwd: repoRoot },
  { name: "script-dir-cwd", cwd: path.dirname(scriptPath) },
  { name: "external-temp-cwd", cwd: tempRoot },
];

for (const run of runs) {
  const proofOutput = path.join(tempRoot, `${run.name}.json`);
  const stdout = execFileSync(
    process.execPath,
    [
      scriptPath,
      "--architecture-package",
      packageDir,
      "--proof-output",
      proofOutput,
    ],
    { cwd: run.cwd, encoding: "utf8" },
  );
  const parsed = JSON.parse(stdout);
  if (parsed.status !== "READY_FOR_FORMAL_FOUNDATION_V2_REAPPROVAL") {
    throw new Error(`${run.name} returned ${parsed.status}`);
  }
  if (!existsSync(proofOutput)) {
    throw new Error(`${run.name} did not write proof output`);
  }
  const proof = JSON.parse(readFileSync(proofOutput, "utf8"));
  const failed = proof.checks.filter((check) => check.status !== "PASS");
  if (failed.length > 0) {
    throw new Error(`${run.name} failed checks: ${failed.map((check) => check.check).join(", ")}`);
  }
}

const packagedRoot = path.join(tempRoot, "packaged-app");
writePackagedRuntimeRoot(packagedRoot);
const { findRepoRoot } = await import(`file://${supportModulePath}`);
const resolvedPackagedRoot = findRepoRoot(path.join(packagedRoot, "scripts/foundation-v2"));
if (resolvedPackagedRoot !== packagedRoot) {
  throw new Error(`packaged-runtime-root resolved ${resolvedPackagedRoot}, expected ${packagedRoot}`);
}

const dockerfile = readFileSync(path.join(repoRoot, "Dockerfile"), "utf8");
if (!dockerfile.includes("/app/fixtures/foundation-v2/golden-slice ./fixtures/foundation-v2/golden-slice")) {
  throw new Error("Dockerfile does not copy the approved Foundation V2 golden-slice fixture directory into runtime");
}

console.log(
  JSON.stringify(
    { status: "PASS", runs: [...runs.map((run) => run.name), "packaged-runtime-root"], packageDir },
    null,
    2,
  ),
);

function writePackagedRuntimeRoot(dir) {
  mkdirSync(path.join(dir, "scripts/foundation-v2"), { recursive: true });
  mkdirSync(path.join(dir, "fixtures/foundation-v2/golden-slice"), { recursive: true });
  mkdirSync(path.join(dir, "supabase/migrations"), { recursive: true });
  writeFileSync(path.join(dir, "package.json"), "{}\n");
  copyFileSync(
    path.join(repoRoot, "fixtures/foundation-v2/golden-slice/fixture-matrix.json"),
    path.join(dir, "fixtures/foundation-v2/golden-slice/fixture-matrix.json"),
  );
  copyFileSync(
    path.join(repoRoot, "fixtures/foundation-v2/golden-slice/release-contract.json"),
    path.join(dir, "fixtures/foundation-v2/golden-slice/release-contract.json"),
  );
  copyFileSync(
    path.join(repoRoot, "supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql"),
    path.join(dir, "supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql"),
  );
  copyFileSync(
    path.join(repoRoot, "supabase/migrations/20260730133000_foundation_v2_golden_slice_write_policies.sql"),
    path.join(dir, "supabase/migrations/20260730133000_foundation_v2_golden_slice_write_policies.sql"),
  );
  copyFileSync(
    path.join(repoRoot, "supabase/migrations/20260730152000_foundation_v2_golden_slice_identity_controls.sql"),
    path.join(dir, "supabase/migrations/20260730152000_foundation_v2_golden_slice_identity_controls.sql"),
  );
}

function writeMiniPackage(dir) {
  writeFileSync(path.join(dir, "FOUNDATION_V1_LESSONS_LEARNED.md"), "# Lessons\n");
  writeCsv(path.join(dir, "FOUNDATION_V2_BLOCKER_CLOSURE_REGISTER.csv"), [
    ["blocker_id", "title", "original_classification", "closure_status", "closure_artifacts", "remaining_condition", "ready_for_reapproval"],
    ["F2-ARB-001", "Frozen V1 checkpoint consumed for B1", "BLOCKER_BEFORE_IMPLEMENTATION", "CLOSED_BY_FROZEN_V1_CHECKPOINT", "FOUNDATION_V1_FINDINGS_INTAKE.csv", "none", "YES"],
  ]);
  writeCsv(path.join(dir, "FOUNDATION_V1_DEFECT_TO_DESIGN_CONTROL.csv"), [
    ["gate_id", "affected_layer", "direct_root_cause", "architectural_root_cause", "failed_or_missing_control", "v2_prevention_control", "v2_regression_tests", "validation_query", "proof_reference", "owner", "phase_gate", "proof_requirement", "closure_status"],
    ["gate:001", "L0->L1", "direct", "architectural", "missing", "control", "TEST-001", "query.sql", "proof.json", "owner", "Gate L1", "proof rows", "CLOSED_BY_FROZEN_V1_CHECKPOINT"],
  ]);
  writeCsv(path.join(dir, "ACTUAL_VS_TARGET_MODEL_GAP_REGISTER.csv"), [["object_type", "schema_or_projection", "object_name", "classification", "actual_state", "target_state", "first_architectural_cause", "evidence", "required_remediation", "priority"], ["gate", "L0", "gate:001", "CLOSED", "actual", "target", "cause", "evidence", "repair", "P0"]]);
  writeCsv(path.join(dir, "AIRLINE_DEFECT_ROOT_CAUSE_TO_MODEL_GAP.csv"), [["defect_id", "symptom", "first_architectural_cause", "broken_layer", "affected_model_object", "evidence", "required_model_gap_closure", "must_not"], ["gate:001", "symptom", "cause", "L0", "object", "evidence", "closure", "overwrite"]]);
  writeCsv(path.join(dir, "FOUNDATION_V2_TEST_AND_GATE_REVIEW.csv"), [["gate_id", "test_id", "transition", "phase_gate", "owner", "executable", "execution_command", "assertion_id", "proof_requirement", "proof_reference", "review_result"], ["gate:001", "TEST-001", "L0->L1", "Gate L1", "owner", "YES", "node test.js", "ASSERT-001", "proof", "proof.json", "ACCEPTED"]]);
  writeCsv(path.join(dir, "FOUNDATION_V2_TARGET_TABLE_CONTRACTS.csv"), [
    ["schema", "table_name", "owning_layer", "owning_module", "business_purpose", "row_grain", "primary_key", "business_key", "tenant_key", "foreign_keys", "mandatory_relationships", "optional_relationships", "effective_dating", "versioning", "authority_state", "review_state", "source_lineage", "immutability", "permitted_writers", "permitted_readers", "retention", "indexes", "unique_constraints", "check_constraints", "row_level_security", "quality_controls", "downstream_consumers", "critical_contract_complete"],
    ["foundation_v2", "source_release", "L0", "Knowledge", "purpose", "one row", "source_release_id", "tenant_key|source_release_id", "tenant_key", "tenant", "tenant", "none", "from/to", "hash", "enum", "enum", "required", "append-only", "jobs", "auditors", "retain", "idx", "unique", "checks", "tenant scoped", "controls", "downstream", "YES"],
  ]);
  writeCsv(path.join(dir, "FOUNDATION_V2_TARGET_COLUMN_CONTRACTS.csv"), [
    ["schema", "table_name", "column_name", "postgresql_type", "nullability", "semantic_definition", "allowed_values", "default", "source", "transformation", "sensitivity", "authority_semantics", "lineage_semantics", "example", "validation_rule"],
    ["foundation_v2", "source_release", "source_release_id", "text", "NO", "id", "non-empty", "none", "input", "copy", "internal", "no elevation", "lineage required", "rel-1", "not null"],
  ]);
  writeCsv(path.join(dir, "FOUNDATION_V2_COMPLETED_SOURCE_TO_TARGET_MAPPING.csv"), [
    ["source_release", "source_file", "source_family", "source_record_grain", "source_field", "source_type", "source_business_key", "parser_contract", "parsed_destination", "evidence_destination", "normalized_destination", "identity_resolution_behavior", "candidate_type", "candidate_grain", "review_policy_class", "canonical_destination", "publication_domain", "baseline_membership_behavior", "projection_destination", "cube_dimension_or_measure", "product_consumer", "transformation", "unit_currency_conversion", "null_handling", "duplicate_handling", "contradiction_handling", "reject_defer_behavior", "source_row_lineage", "source_field_lineage", "primary_disposition", "secondary_uses", "explicit_final_disposition"],
    ["rel-v2", "source.csv", "family", "one row", "field", "text", "tenant|row", "parser.v2", "landing.field", "evidence.field", "knowledge.field", "declared", "entity", "tenant|entity", "review", "knowledge.entity", "publication.entity", "accepted only", "consumption.entity", "cube.dim", "preview", "copy", "not_applicable", "preserve null", "idempotent", "candidate", "defer", "row lineage", "field lineage", "NORMALIZED_TO_CANONICAL_FIELD", "display", "final"],
  ]);
  writeFileSync(path.join(dir, "FOUNDATION_V2_BASELINE_MEMBERSHIP_CONTRACT.md"), "baseline_object_memberships\n");
  writeFileSync(path.join(dir, "FOUNDATION_V2_LINEAGE_EXPORT_CONTRACT.md"), "source_row_lineage_exports\nsource_field_lineage_exports\nbaseline_projection_lineage\nprojection_cube_lineage\n");
  writeFileSync(path.join(dir, "FOUNDATION_V2_LINEAGE_VALIDATION_QUERIES.sql"), "select * from baseline_object_memberships;\n");
  writeCsv(path.join(dir, "FOUNDATION_V2_GATE_SPECIFIC_TEST_CATALOG.csv"), [["test_id", "transition", "business_purpose", "preconditions", "fixture_or_input", "execution_command", "assertion_id", "sql_query_or_assertion", "expected_count_or_result", "allowed_variance", "failure_classification", "failure_message", "proof_artifact", "owner", "repair_responsibility", "rerun_scope", "approval_authority", "automated_manual", "execution_lane"], ["TEST-001", "L0->L1", "purpose", "pre", "fixture.json", "node run.js", "ASSERT-001", "assertion", "PASS", "0", "BLOCKING", "fail", "proof.json", "owner", "owner", "all", "reviewer", "automated", "CI"]]);
  writeCsv(path.join(dir, "FOUNDATION_V2_GATE_ASSERTION_LIBRARY.csv"), [["assertion_id", "test_id", "transition", "assertion_type", "assertion_contract", "fixture_path", "expected_result", "proof_table_or_artifact", "must_exist_before_execution"], ["ASSERT-001", "TEST-001", "L0->L1", "FUNCTIONAL", "contract", "fixture.json", "PASS", "proof.json", "YES"]]);
  writeCsv(path.join(dir, "FOUNDATION_V2_GATE_EXECUTION_MATRIX.csv"), [["phase_gate", "test_id", "transition", "required_before", "blocking", "proof_artifact", "execution_lane", "approval_authority"], ["Gate L1", "TEST-001", "L0->L1", "next", "YES", "proof.json", "CI", "reviewer"]]);
  writeCsv(path.join(dir, "FOUNDATION_V2_GOLDEN_SLICE_FIXTURE_MATRIX.csv"), [["fixture_id", "fixture_name", "source_family", "purpose", "expected_object_ids", "expected_state", "L0_source_rows", "L1_landed_rows", "L2_parsed_rows", "L3_normalized_records", "L4_candidates", "L5_review_decisions", "L6_canonical_objects", "L7_publication_items", "L8_baseline_memberships", "L9_projection_rows", "L10_cube_outputs", "L11_product_claims", "L12_ava_outputs"], ["FIX-001", "accepted", "family", "purpose", "obj-1|lineage-1", "accepted", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1"]]);
}

function writeCsv(file, rows) {
  writeFileSync(file, `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`);
}

function csvEscape(value) {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}
