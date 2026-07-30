#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = findRepoRoot(scriptDir);

const REQUIRED_FILES = [
  "FOUNDATION_V1_LESSONS_LEARNED.md",
  "FOUNDATION_V1_DEFECT_TO_DESIGN_CONTROL.csv",
  "ACTUAL_VS_TARGET_MODEL_GAP_REGISTER.csv",
  "AIRLINE_DEFECT_ROOT_CAUSE_TO_MODEL_GAP.csv",
  "FOUNDATION_V2_TEST_AND_GATE_REVIEW.csv",
  "FOUNDATION_V2_BLOCKER_CLOSURE_REGISTER.csv",
  "FOUNDATION_V2_TARGET_TABLE_CONTRACTS.csv",
  "FOUNDATION_V2_TARGET_COLUMN_CONTRACTS.csv",
  "FOUNDATION_V2_COMPLETED_SOURCE_TO_TARGET_MAPPING.csv",
  "FOUNDATION_V2_BASELINE_MEMBERSHIP_CONTRACT.md",
  "FOUNDATION_V2_LINEAGE_EXPORT_CONTRACT.md",
  "FOUNDATION_V2_LINEAGE_VALIDATION_QUERIES.sql",
  "FOUNDATION_V2_GATE_SPECIFIC_TEST_CATALOG.csv",
  "FOUNDATION_V2_GATE_ASSERTION_LIBRARY.csv",
  "FOUNDATION_V2_GATE_EXECUTION_MATRIX.csv",
  "FOUNDATION_V2_GOLDEN_SLICE_FIXTURE_MATRIX.csv",
];

const args = parseArgs(process.argv.slice(2));
const architecturePackage = requireDir(args["architecture-package"], "--architecture-package");
const proofOutput = resolveOptionalPath(args["proof-output"]) ?? path.join(repoRoot, "proof", "foundation-v2-implementation-20260730", "foundation-v2-package-validation.json");

const checks = [];

checkFileHash("--architecture-zip", args["architecture-zip"], args["expected-architecture-sha256"], "approved_architecture_zip_sha256");
checkFileHash("--checkpoint-zip", args["checkpoint-zip"], args["expected-checkpoint-sha256"], "frozen_v1_checkpoint_zip_sha256");

for (const file of REQUIRED_FILES) {
  const fullPath = path.join(architecturePackage, file);
  checks.push({
    check: `required_file_${file}`,
    status: existsSync(fullPath) && statSync(fullPath).isFile() && statSync(fullPath).size > 0 ? "PASS" : "FAIL",
    detail: existsSync(fullPath) ? String(statSync(fullPath).size) : "missing",
  });
}

const blockerRows = readCsv("FOUNDATION_V2_BLOCKER_CLOSURE_REGISTER.csv");
const b1 = blockerRows.find((row) => row.blocker_id === "F2-ARB-001");
checks.push({
  check: "B1_closure_register",
  status: b1?.closure_status === "CLOSED_BY_FROZEN_V1_CHECKPOINT" && b1?.ready_for_reapproval === "YES" ? "PASS" : "FAIL",
  detail: b1 ? `${b1.closure_status}/${b1.ready_for_reapproval}` : "missing",
});

const b1Rows = readCsv("FOUNDATION_V1_DEFECT_TO_DESIGN_CONTROL.csv");
const requiredB1Fields = [
  "gate_id",
  "affected_layer",
  "direct_root_cause",
  "architectural_root_cause",
  "failed_or_missing_control",
  "v2_prevention_control",
  "v2_regression_tests",
  "validation_query",
  "proof_reference",
  "owner",
  "phase_gate",
  "proof_requirement",
  "closure_status",
];
const badB1Rows = b1Rows.filter((row) => requiredB1Fields.some((field) => !nonEmpty(row[field])));
checks.push({
  check: "B1_rows_have_control_test_owner_gate_proof",
  status: badB1Rows.length === 0 ? "PASS" : "FAIL",
  detail: badB1Rows.map((row) => row.gate_id || "unknown").join("|") || `${b1Rows.length} rows`,
});

const catalogIds = new Set(readCsv("FOUNDATION_V2_GATE_SPECIFIC_TEST_CATALOG.csv").map((row) => row.test_id));
const assertionIds = new Set(readCsv("FOUNDATION_V2_GATE_ASSERTION_LIBRARY.csv").map((row) => row.test_id));
const matrixIds = new Set(readCsv("FOUNDATION_V2_GATE_EXECUTION_MATRIX.csv").map((row) => row.test_id));
const missingB1Tests = [];
for (const row of b1Rows) {
  for (const testId of splitPipe(row.v2_regression_tests)) {
    if (!catalogIds.has(testId) || !assertionIds.has(testId) || !matrixIds.has(testId)) {
      missingB1Tests.push(testId);
    }
  }
}
checks.push({
  check: "B1_regression_tests_resolve",
  status: missingB1Tests.length === 0 ? "PASS" : "FAIL",
  detail: [...new Set(missingB1Tests)].sort().join("|") || "all referenced tests resolve",
});

const tableRows = readCsv("FOUNDATION_V2_TARGET_TABLE_CONTRACTS.csv");
const requiredTableFields = [
  "schema",
  "table_name",
  "owning_layer",
  "owning_module",
  "row_grain",
  "primary_key",
  "business_key",
  "tenant_key",
  "foreign_keys",
  "unique_constraints",
  "check_constraints",
  "row_level_security",
  "quality_controls",
  "critical_contract_complete",
];
const badTables = tableRows.filter((row) => requiredTableFields.some((field) => !nonEmpty(row[field])) || row.critical_contract_complete !== "YES");
checks.push({
  check: "B2_table_contracts_complete",
  status: badTables.length === 0 ? "PASS" : "FAIL",
  detail: badTables.map((row) => `${row.schema}.${row.table_name}`).slice(0, 20).join("|") || `${tableRows.length} tables`,
});

const columnRows = readCsv("FOUNDATION_V2_TARGET_COLUMN_CONTRACTS.csv");
const requiredColumnFields = [
  "schema",
  "table_name",
  "column_name",
  "postgresql_type",
  "nullability",
  "semantic_definition",
  "allowed_values",
  "source",
  "transformation",
  "authority_semantics",
  "lineage_semantics",
  "validation_rule",
];
const badColumns = columnRows.filter((row) => requiredColumnFields.some((field) => !nonEmpty(row[field])));
checks.push({
  check: "B2_column_contracts_complete",
  status: badColumns.length === 0 ? "PASS" : "FAIL",
  detail: badColumns.map((row) => `${row.schema}.${row.table_name}.${row.column_name}`).slice(0, 20).join("|") || `${columnRows.length} columns`,
});

const mappingRows = readCsv("FOUNDATION_V2_COMPLETED_SOURCE_TO_TARGET_MAPPING.csv");
const unresolvedPattern = /\b(TBD|TODO|PLACEHOLDER|UNRESOLVED|MAYBE|UNKNOWN)\b/i;
const unresolvedMappings = mappingRows
  .map((row, index) => ({ row, index: index + 2 }))
  .filter(({ row }) => unresolvedPattern.test(Object.values(row).join("|")));
const badDispositions = mappingRows
  .map((row, index) => ({ row, index: index + 2 }))
  .filter(({ row }) => !nonEmpty(row.primary_disposition) || !nonEmpty(row.explicit_final_disposition));
checks.push({
  check: "B3_no_placeholder_mappings",
  status: unresolvedMappings.length === 0 ? "PASS" : "FAIL",
  detail: unresolvedMappings.map(({ index }) => index).slice(0, 20).join("|") || "none",
});
checks.push({
  check: "B3_source_fields_have_disposition",
  status: badDispositions.length === 0 ? "PASS" : "FAIL",
  detail: badDispositions.map(({ index }) => index).slice(0, 20).join("|") || `${mappingRows.length} fields`,
});

const lineageContract = readText("FOUNDATION_V2_LINEAGE_EXPORT_CONTRACT.md");
const lineageSql = readText("FOUNDATION_V2_LINEAGE_VALIDATION_QUERIES.sql");
const requiredLineageTerms = [
  "source_row_lineage_exports",
  "source_field_lineage_exports",
  "baseline_object_memberships",
  "baseline_projection_lineage",
  "projection_cube_lineage",
];
const missingLineageTerms = requiredLineageTerms.filter((term) => !lineageContract.includes(term) && !lineageSql.includes(term));
checks.push({
  check: "B4_lineage_exports_and_queries_specified",
  status: missingLineageTerms.length === 0 ? "PASS" : "FAIL",
  detail: missingLineageTerms.join("|") || "lineage exports and trace queries present",
});

const gateRows = readCsv("FOUNDATION_V2_GATE_SPECIFIC_TEST_CATALOG.csv");
const proseOnlyGates = gateRows.filter((row) => !nonEmpty(row.execution_command) || !nonEmpty(row.assertion_id) || !nonEmpty(row.proof_artifact));
checks.push({
  check: "B5_no_prose_only_gates",
  status: proseOnlyGates.length === 0 ? "PASS" : "FAIL",
  detail: proseOnlyGates.map((row) => row.test_id).slice(0, 20).join("|") || `${gateRows.length} executable gate rows`,
});

const fixtureRows = readCsv("FOUNDATION_V2_GOLDEN_SLICE_FIXTURE_MATRIX.csv");
const fixtureRequired = [
  "expected_object_ids",
  "L0_source_rows",
  "L1_landed_rows",
  "L2_parsed_rows",
  "L3_normalized_records",
  "L4_candidates",
  "L5_review_decisions",
  "L6_canonical_objects",
  "L7_publication_items",
  "L8_baseline_memberships",
  "L9_projection_rows",
  "L10_cube_outputs",
  "L11_product_claims",
  "L12_ava_outputs",
];
const badFixtures = fixtureRows.filter((row) => fixtureRequired.some((field) => !nonEmpty(row[field])));
checks.push({
  check: "B5_golden_slice_ids_counts_L0_L12",
  status: badFixtures.length === 0 ? "PASS" : "FAIL",
  detail: badFixtures.map((row) => row.fixture_id).slice(0, 20).join("|") || `${fixtureRows.length} fixtures`,
});

const status = checks.every((check) => check.status === "PASS") ? "READY_FOR_FORMAL_FOUNDATION_V2_REAPPROVAL" : "REAPPROVAL_VALIDATION_FAILED";
const output = {
  status,
  generated_at: new Date().toISOString(),
  repo_root: repoRoot,
  script_path: scriptPath,
  architecture_package: architecturePackage,
  architecture_zip: resolveOptionalPath(args["architecture-zip"]),
  checkpoint_zip: resolveOptionalPath(args["checkpoint-zip"]),
  full_reload_approved: false,
  offline_augmentation_ingested: false,
  database_or_azure_mutated: false,
  checks,
};

mkdirSync(path.dirname(proofOutput), { recursive: true });
writeFileSync(proofOutput, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));

if (status !== "READY_FOR_FORMAL_FOUNDATION_V2_REAPPROVAL") {
  process.exitCode = 1;
}

function readCsv(relativePath) {
  const fullPath = path.join(architecturePackage, relativePath);
  const csv = readFileSync(fullPath, "utf8");
  return parseCsv(csv, relativePath);
}

function readText(relativePath) {
  return readFileSync(path.join(architecturePackage, relativePath), "utf8");
}

function checkFileHash(argName, rawPath, expected, checkName) {
  if (!rawPath && expected) {
    checks.push({ check: checkName, status: "FAIL", detail: `${argName} missing while expected hash supplied` });
    return;
  }
  if (!rawPath) {
    return;
  }
  if (!expected) {
    checks.push({ check: checkName, status: "FAIL", detail: "expected hash missing" });
    return;
  }
  const fullPath = requireFile(rawPath, argName);
  const actual = sha256(fullPath);
  checks.push({
    check: checkName,
    status: actual === expected ? "PASS" : "FAIL",
    detail: actual,
  });
}

function sha256(fullPath) {
  const digest = createHash("sha256");
  digest.update(readFileSync(fullPath));
  return digest.digest("hex");
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = rawArgs[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    parsed[key] = value;
    index += 1;
  }
  return parsed;
}

function requireDir(value, argName) {
  if (!value) {
    throw new Error(`${argName} is required`);
  }
  const fullPath = path.resolve(process.cwd(), value);
  if (!existsSync(fullPath) || !statSync(fullPath).isDirectory()) {
    throw new Error(`${argName} must point to an existing directory: ${fullPath}`);
  }
  return fullPath;
}

function requireFile(value, argName) {
  const fullPath = path.resolve(process.cwd(), value);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    throw new Error(`${argName} must point to an existing file: ${fullPath}`);
  }
  return fullPath;
}

function resolveOptionalPath(value) {
  return value ? path.resolve(process.cwd(), value) : undefined;
}

function findRepoRoot(start) {
  let cursor = start;
  while (true) {
    if (existsSync(path.join(cursor, "package.json")) && existsSync(path.join(cursor, ".git"))) {
      return cursor;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) {
      throw new Error(`Could not locate repo root from ${start}`);
    }
    cursor = parent;
  }
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function splitPipe(value) {
  return String(value ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseCsv(csv, label) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error(`CSV parse failed for ${label}: unterminated quoted field`);
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
  const [headers, ...dataRows] = nonEmptyRows;
  if (!headers || headers.length === 0) {
    throw new Error(`CSV parse failed for ${label}: missing header`);
  }
  return dataRows.map((cells, rowIndex) => {
    if (cells.length !== headers.length) {
      throw new Error(`CSV parse failed for ${label}: row ${rowIndex + 2} has ${cells.length} cells, expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}
