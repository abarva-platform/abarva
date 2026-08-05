#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { EXPECTED, validatePackage } from "./validate-phs-healthcare-demo-package.mjs";

const DEFAULT_OUT_DIR = "/Users/anand/Downloads";
const SOURCE_VOLUME_RELEASE_VERSION = "source-volume-v1";
const SOURCE_VOLUME_EXECUTION_SUFFIX = "source-volume-plan-v1";
const DATABASE_SCHEMA = "foundation_v2_phs_demo";
const TEST_NAMESPACE = "phs-healthcare-demo-source-volume-v1";
const FOUNDATION_RELEASE_ALIAS = "phs-healthcare-demo-phase-a-source-volume-v1";
const EXPECTED_SOURCE_RELEASE_ID = "phs-health-source-v1-202608:source-volume-v1:447910ac3c16";
const ISOLATION_SCOPE = "ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY";
const WRITER_ROLE = "foundation_v2_phs_demo_writer";
const READER_ROLE = "foundation_v2_phs_demo_reader";
const LAYER1_SOURCE_GROUPS = ["enterprise_context", "optional_domain_context", "bpo_sourcing_event", "bpo_transformation_event"];
const RESTRICTED_DETAIL_HEALTH_PLAN_FILES = ["PAYER_CLAIMS_ENROLLMENT_MONTHLY.csv", "STARS_HEDIS_MEASURE_PERFORMANCE.csv"];
const REQUIRED_LAYER1_RELEASE_FILES = [
  "WORKDAY_SUPPLIERS.csv",
  "WORKDAY_SUPPLIER_INVOICES.csv",
  "WORKDAY_PAYMENTS.csv",
  "WORKDAY_COST_CENTERS.csv",
  "WORKDAY_SPEND_CATEGORIES.csv",
  "WORKDAY_WORKER_ROLE_SUMMARY.csv",
  "LOCAL_HOSPITAL_PURCHASES.csv",
  "MEDSURG_ITEM_MASTER.csv",
  "MEDSURG_PRICE_TIERS.csv",
  "MEDSURG_BACKORDERS_SUBSTITUTIONS.csv",
  "MEDSURG_REBATES_CREDITS.csv",
  "CONTRACT_REGISTER.csv",
  "CONTRACT_INSTRUMENTS.csv",
  "CONTRACT_AMENDMENTS.csv",
  "CONTRACT_RATE_CARDS.csv",
  "CONTRACT_SLA_TERMS.csv",
  "CONTRACT_RENEWAL_EXIT_TERMS.csv",
  "SERVICENOW_VENDOR_SERVICES.csv",
  "SERVICENOW_CMDB_APPLICATIONS.csv",
  "SERVICENOW_CSDM_BUSINESS_SERVICES.csv",
  "SERVICENOW_MONTHLY_ITSM_SUMMARY.csv",
  "SERVICENOW_MONTHLY_SLA_SUMMARY.csv",
  "SERVICENOW_SERVICE_CREDITS.csv",
  "EPIC_MODULE_INVENTORY.csv",
  "EPIC_INTERFACE_INVENTORY.csv",
  "CLARITY_CABOODLE_ASSET_INVENTORY.csv",
  "HEALTH_PLAN_OUTCOME_SNAPSHOT.csv",
  "HADOOP_CLUSTER_WORKLOADS.csv",
  "SQL_SERVER_DATA_MARTS.csv",
  "SAS_APPLICATIONS_AND_USERS.csv",
  "ANALYTICS_PLATFORM_DEPENDENCIES.csv",
  "SAAS_MODULE_USAGE_MONTHLY.csv",
  "AWS_TARGET_COMMITMENT_SCENARIOS.csv",
  "DATABRICKS_TARGET_COMMITMENT_SCENARIOS.csv",
  "VENDOR_WORKFORCE_MONTHLY.csv",
  "VENDOR_RATE_CARD_INVOICES.csv",
  "CONTRACT_SCOPE_RELATIONSHIPS.csv",
  "PROGRAMS_INITIATIVES_DEPENDENCIES.csv",
  "RISK_CONTROL_OBSERVATIONS.csv",
  "BPO_CURRENT_STATE_PROCESS_VOLUMES.csv",
  "BPO_CURRENT_STATE_WORKFORCE.csv",
  "BPO_CURRENT_STATE_COST_BASELINE.csv",
  "BPO_RFP_REQUIREMENTS.csv",
  "BPO_SUPPLIERS.csv",
  "BPO_SUPPLIER_RESPONSES.csv",
  "BPO_COMMERCIAL_LINES.csv",
  "BPO_EVALUATION_SCORES.csv",
  "BPO_CLARIFICATIONS.csv",
  "BPO_BAFO_RESPONSES.csv",
  "BPO_NORMALIZED_TCO.csv",
  "BPO_REBADGE_RETENTION_PLAN.csv",
  "BPO_TRANSITION_KNOWLEDGE_TRANSFER_PLAN.csv",
  "BPO_AI_AUTOMATION_TRANSFORMATION_COMMITMENTS.csv",
  "BPO_RETAINED_ORGANIZATION_SCENARIOS.csv",
];

async function main() {
  const packageDir = resolvePackageDir();
  const outDir = path.resolve(argValue("--out-dir", DEFAULT_OUT_DIR));
  const timestamp = new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
  const proofDir = path.join(outDir, `phs_healthcare_demo_data_layer_plan_${timestamp}`);
  await fs.rm(proofDir, { recursive: true, force: true });
  await fs.mkdir(proofDir, { recursive: true });

  const packageValidation = await validatePackage(packageDir);
  if (!packageValidation.ok) {
    throw new Error(`PHS package validation failed: ${JSON.stringify(packageValidation.failures.slice(0, 5))}`);
  }

  const packageManifest = await readJson(path.join(packageDir, "phs_healthcare_demo_package_manifest.json"));
  const phaseResult = await readJson(path.join(packageDir, "phase_a_result.json"));
  const proofZip = resolveProofZip(packageDir, phaseResult);
  const proofZipSha256 = await sha256File(proofZip);
  const proofZipAttestation = `${proofZip}.sha256`;
  const attestationText = await fs.readFile(proofZipAttestation, "utf8");
  if (!attestationText.includes(proofZipSha256)) {
    throw new Error(`Proof ZIP attestation mismatch for ${proofZip}`);
  }
  execFileSync("unzip", ["-t", proofZip], { stdio: "ignore" });

  let sourceFiles = await sourceFilePlans(packageDir, packageManifest);
  const releaseHash = sha256(
    stableJson(sourceFiles.map((file) => ({
      relative_path: file.relative_path,
      content_sha256: file.content_sha256,
      row_count: file.row_count,
      field_count: file.field_count,
      source_group: file.source_group,
      context_treatment: file.context_treatment,
      demo_priority: file.demo_priority,
      event_id: file.event_id,
      effective_as_of: file.effective_as_of,
    }))),
  );
  const sourceReleaseId = `${EXPECTED.datasetId}:${SOURCE_VOLUME_RELEASE_VERSION}:${releaseHash.slice(0, 12)}`;
  if (sourceReleaseId !== EXPECTED_SOURCE_RELEASE_ID) {
    throw new Error(`PHS source release drift: expected ${EXPECTED_SOURCE_RELEASE_ID}, got ${sourceReleaseId}`);
  }
  sourceFiles = sourceFiles.map((file) => ({
    ...file,
    source_file_id: `${sourceReleaseId}:source-file:${shortHash(file.relative_path, 16)}`,
  }));
  const sourceRows = sourceFiles.reduce((sum, file) => sum + file.row_count, 0);
  const sourceFieldSlots = sourceFiles.reduce((sum, file) => sum + file.field_count, 0);
  const sourceGroupCounts = groupedCounts(sourceFiles, "source_group");
  const demoPriorityCounts = groupedCounts(sourceFiles, "demo_priority");
  const databaseTargetContract = databaseTargetContractFor(sourceFiles);
  const schemaProofTests = phsSchemaProofTests();

  const layer0 = {
    status: "PHS_HEALTHCARE_DEMO_LAYER0_PACKAGE_PROOF_READY",
    generated_at: new Date().toISOString(),
    mutation_executed: false,
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    activation_state: packageManifest.activation_state,
    package_dir: packageDir,
    proof_zip: proofZip,
    proof_zip_sha256: proofZipSha256,
    proof_zip_sha256_attestation: proofZipAttestation,
    package_validation_summary: packageValidation.summary,
    package_validation_failures: packageValidation.failures.length,
    package_validation_warnings: packageValidation.warnings.length,
  };

  const layer1 = {
    status: "PHS_HEALTHCARE_DEMO_LAYER1_SOURCE_VOLUME_PLAN_READY",
    generated_at: new Date().toISOString(),
    mutation_executed: false,
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    as_of_date: EXPECTED.asOfDate,
    database_schema: DATABASE_SCHEMA,
    test_namespace: TEST_NAMESPACE,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    isolation_scope: ISOLATION_SCOPE,
    source_release_id: sourceReleaseId,
    source_volume_execution_id: `${sourceReleaseId}:${SOURCE_VOLUME_EXECUTION_SUFFIX}`,
    source_volume_release_version: `${SOURCE_VOLUME_RELEASE_VERSION}:${releaseHash.slice(0, 12)}`,
    source_volume_release_hash: releaseHash,
    source_files: sourceFiles.length,
    required_layer1_release_files: REQUIRED_LAYER1_RELEASE_FILES.length,
    source_group_counts: sourceGroupCounts,
    demo_priority_counts: demoPriorityCounts,
    required_core_source_extracts: packageValidation.summary.coreSourceExtracts,
    existing_bpo_event_files: sourceGroupCounts.bpo_sourcing_event?.files || 0,
    bpo_transformation_files: sourceGroupCounts.bpo_transformation_event?.files || 0,
    optional_health_plan_outcome_snapshot_rows: packageValidation.summary.optionalHealthPlanOutcomeSnapshotRows,
    source_records: sourceRows,
    source_field_values: sourceFieldSlots,
    source_file_context_rows: sourceFiles.length,
    source_field_value_rule: "insert_all_field_slots_including_explicit_blank_cells",
    max_columns: Math.max(...sourceFiles.map((file) => file.headers.length)),
    database_target_contract: databaseTargetContract,
    schema_proof_tests: schemaProofTests,
    restricted_detail_health_plan_extracts_present: sourceFiles
      .map((file) => file.file_name)
      .filter((fileName) => RESTRICTED_DETAIL_HEALTH_PLAN_FILES.includes(fileName)),
    apply_gate: "NOT_AUTHORIZED_IN_PLAN_MODE",
    next_required_gate: "approved ACA data-build job with isolated lab target and explicit package SHA",
    files: sourceFiles.map(({ rows, ...file }) => file),
  };

  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_LAYER0_PACKAGE_PROOF.json"), layer0);
  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_LAYER1_SOURCE_VOLUME_PLAN.json"), layer1);
  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_DATABASE_TARGET_CONTRACT.json"), databaseTargetContract);
  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_SCHEMA_PROOF_TESTS.json"), schemaProofTests);
  await writeCsv(path.join(proofDir, "PHS_HEALTHCARE_DEMO_SOURCE_FILES.csv"), [
    "file_index",
    "source_group",
    "context_treatment",
    "demo_priority",
    "event_id",
    "effective_as_of",
    "file_name",
    "domain_contract",
    "source_system",
    "source_object",
    "grain",
    "row_count",
    "field_count",
    "content_sha256",
  ], sourceFiles);
  await fs.writeFile(path.join(proofDir, "PHS_HEALTHCARE_DEMO_DATA_LAYER_EXECUTION_PLAN.md"), buildExecutionPlan(layer0, layer1));

  const proofZipPath = path.join(outDir, `PHS_Healthcare_Demo_Data_Layer_Plan_${timestamp}.zip`);
  const result = {
    status: "PHS_HEALTHCARE_DEMO_DATA_LAYER_PLAN_READY",
    mutation_executed: false,
    package_dir: packageDir,
    proof_dir: proofDir,
    proof_zip: proofZipPath,
    proof_zip_sha256: "RECORDED_IN_SHA256_SIDECAR_AFTER_ZIP_CREATION",
    proof_zip_sha256_attestation: `${proofZipPath}.sha256`,
    source_files: layer1.source_files,
    source_group_counts: layer1.source_group_counts,
    demo_priority_counts: layer1.demo_priority_counts,
    existing_bpo_event_files: layer1.existing_bpo_event_files,
    bpo_transformation_files: layer1.bpo_transformation_files,
    source_records: layer1.source_records,
    source_field_values: layer1.source_field_values,
    source_file_context_rows: layer1.source_file_context_rows,
    source_field_value_rule: layer1.source_field_value_rule,
    database_target_contract: layer1.database_target_contract,
    schema_proof_tests: layer1.schema_proof_tests,
    next_required_gate: layer1.next_required_gate,
  };
  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_DATA_LAYER_PLAN_RESULT.json"), result);
  await fs.rm(proofZipPath, { force: true });
  execFileSync("zip", ["-qr", proofZipPath, "."], { cwd: proofDir });
  const dataLayerPlanSha256 = await sha256File(proofZipPath);
  await fs.writeFile(`${proofZipPath}.sha256`, `${dataLayerPlanSha256}  ${path.basename(proofZipPath)}\n`);
  result.proof_zip_sha256 = dataLayerPlanSha256;
  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_DATA_LAYER_PLAN_RESULT.json"), result);
  console.log(JSON.stringify(result, null, 2));
}

function argValue(name, fallback = null) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1] ?? fallback;
  return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1) ?? fallback;
}

function resolvePackageDir() {
  const explicit = argValue("--package-dir");
  if (explicit) return path.resolve(explicit);
  throw new Error("Explicit --package-dir is required for the PHS Layer 0/Layer 1 plan; latest Downloads auto-selection is not allowed");
}

function resolveProofZip(packageDir, phaseResult) {
  const proofZipName = phaseResult.proof_zip;
  if (!proofZipName) throw new Error("phase_a_result.json does not declare proof_zip");
  const candidate = path.join(path.dirname(packageDir), proofZipName);
  return candidate;
}

async function sourceFilePlans(packageDir, packageManifest) {
  const required = new Set(REQUIRED_LAYER1_RELEASE_FILES);
  const contracts = (packageManifest.file_contracts || [])
    .filter((contract) => contract.format === "csv" && required.has(path.basename(contract.path)) && LAYER1_SOURCE_GROUPS.includes(contract.source_group))
    .sort((left, right) => String(left.path).localeCompare(String(right.path)));
  const present = new Set(contracts.map((contract) => path.basename(contract.path)));
  for (const file of REQUIRED_LAYER1_RELEASE_FILES) {
    if (!present.has(file)) throw new Error(`Required Layer 1 release file is missing: ${file}`);
  }
  if (contracts.length !== 54) throw new Error(`Layer 1 release must contain exactly 54 CSV files, got ${contracts.length}`);
  const files = [];
  for (let index = 0; index < contracts.length; index += 1) {
    const contract = contracts[index];
    const relativePath = contract.path;
    const absolutePath = path.join(packageDir, relativePath);
    const content = await fs.readFile(absolutePath, "utf8");
    const rows = parseCsv(content);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : parseCsvHeaders(content);
    const contentSha256 = sha256(content);
    const stats = await fs.stat(absolutePath);
    if (contract.expected_rows !== rows.length) {
      throw new Error(`${relativePath} row count mismatch: expected ${contract.expected_rows}, got ${rows.length}`);
    }
    files.push({
      file_index: index + 1,
      relative_path: relativePath,
      file_name: path.basename(relativePath),
      source_file_id: `${EXPECTED.datasetId}:source-file:${shortHash(relativePath, 16)}`,
      source_group: contract.source_group,
      context_treatment: contract.context_treatment,
      demo_priority: contract.demo_priority,
      event_id: contract.event_id || "",
      effective_as_of: contract.effective_as_of,
      domain_contract: contract.domain_contract,
      source_system: contract.source_system,
      source_object: contract.source_object,
      grain: contract.grain,
      primary_key: contract.primary_key,
      content_sha256: contentSha256,
      bytes: stats.size,
      headers,
      row_count: rows.length,
      field_count: rows.length * headers.length,
      rows,
    });
  }
  return files;
}

function groupedCounts(files, field) {
  const counts = {};
  for (const file of files) {
    const key = file[field] || "unclassified";
    if (!counts[key]) counts[key] = { files: 0, records: 0, field_slots: 0 };
    counts[key].files += 1;
    counts[key].records += file.row_count;
    counts[key].field_slots += file.field_count;
  }
  return counts;
}

function databaseTargetContractFor(sourceFiles) {
  return {
    database_schema: DATABASE_SCHEMA,
    tenant_key: EXPECTED.tenantKey,
    test_namespace: TEST_NAMESPACE,
    writer_role: WRITER_ROLE,
    reader_role: READER_ROLE,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    expected_source_release_id: EXPECTED_SOURCE_RELEASE_ID,
    isolation_scope: ISOLATION_SCOPE,
    expected_source_file_context_rows: sourceFiles.length,
    apply_required_env: [
      "PHS_HEALTHCARE_DEMO_LAYER1_APPLY_APPROVED=true",
      "PHS_HEALTHCARE_DEMO_APPROVED_PROOF_SHA256=<exact approved proof ZIP SHA>",
      "ACA_JOB_NAME=<approved ACA data-build job identity>",
    ],
    disallowed_apply_bypass_env: "PHS_HEALTHCARE_DEMO_ALLOW_NON_ACA_APPLY",
    verification_contract: [
      "release_id_and_release_hash",
      "all_54_filenames",
      "per_file_content_sha256",
      "per_file_row_and_field_counts",
      "source_group_counts",
      "demo_priority_counts",
      "source_file_context_54_rows",
      "total_source_records",
      "total_source_field_values",
    ],
  };
}

function phsSchemaProofTests() {
  return [
    {
      case_id: "wrong_schema",
      expected: "blocked_before_db_mutation",
      expected_value: DATABASE_SCHEMA,
    },
    {
      case_id: "wrong_tenant",
      expected: "blocked_before_db_mutation",
      expected_value: EXPECTED.tenantKey,
    },
    {
      case_id: "wrong_namespace",
      expected: "blocked_before_db_mutation",
      expected_value: TEST_NAMESPACE,
    },
    {
      case_id: "wrong_release",
      expected: "blocked_before_db_mutation",
      expected_value: EXPECTED_SOURCE_RELEASE_ID,
    },
    {
      case_id: "wrong_isolation_scope",
      expected: "blocked_before_db_mutation",
      expected_value: ISOLATION_SCOPE,
    },
    {
      case_id: "writer_role_mismatch",
      expected: "blocked_before_db_mutation",
      expected_value: WRITER_ROLE,
    },
    {
      case_id: "reader_role_mismatch",
      expected: "blocked_before_db_mutation",
      expected_value: READER_ROLE,
    },
    {
      case_id: "missing_rls_policy",
      expected: "blocked_by_schema_proof",
      required_tables: ["source_releases", "source_files", "source_file_context", "source_records", "source_field_values", "parser_executions", "gate_results"],
    },
    {
      case_id: "non_aca_execution",
      expected: "blocked_before_db_connect",
      required_env: ["ACA_JOB_NAME"],
    },
    {
      case_id: "file_hash_mismatch",
      expected: "blocked_by_plan_or_readback",
      comparison: "content_sha256 must match source_files and source_file_context rows",
    },
    {
      case_id: "same_counts_different_content",
      expected: "blocked_by_release_id_or_per_file_hash",
      comparison: "counts alone are insufficient",
    },
  ];
}

function parseCsvHeaders(text) {
  const [first = ""] = text.split(/\n/u);
  return parseCsv(`${first}\n`).length > 0 ? Object.keys(parseCsv(`${first}\n`)[0]) : first.split(",");
}

function parseCsv(text) {
  const rawRows = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rawRows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rawRows.push(row);
  }
  const [header = [], ...data] = rawRows.filter((candidate) => candidate.some((cell) => cell !== ""));
  return data.map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function sha256File(filePath) {
  return sha256(await fs.readFile(filePath));
}

function shortHash(value, length) {
  return sha256(value).slice(0, length);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function writeCsv(filePath, headers, rows) {
  const text = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ].join("\n") + "\n";
  await fs.writeFile(filePath, text);
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/u.test(stringValue)) return `"${stringValue.replaceAll('"', '""')}"`;
  return stringValue;
}

function buildExecutionPlan(layer0, layer1) {
  return `# PHS Healthcare Demo Data-Layer Execution Plan

Status: plan_ready, not_loaded

No database load, migration, Cube refresh, runtime deploy, tenant activation or existing-tenant mutation was executed by this plan.

## Layer 0 Package Proof

- Package: ${layer0.package_dir}
- Proof ZIP: ${layer0.proof_zip}
- Proof SHA-256: ${layer0.proof_zip_sha256}
- Validation failures: ${layer0.package_validation_failures}
- Validation warnings: ${layer0.package_validation_warnings}

## Layer 1 Source Volume Plan

- Tenant key: ${layer1.tenant_key}
- Dataset id: ${layer1.dataset_id}
- Database schema: ${layer1.database_schema}
- Test namespace: ${layer1.test_namespace}
- Writer role: ${layer1.database_target_contract.writer_role}
- Reader role: ${layer1.database_target_contract.reader_role}
- Isolation scope: ${layer1.isolation_scope}
- Source release id: ${layer1.source_release_id}
- Source files: ${layer1.source_files}
- Source-file context rows: ${layer1.source_file_context_rows}
- Required named Layer 1 release files: ${layer1.required_layer1_release_files}
- Source-group counts: ${JSON.stringify(layer1.source_group_counts)}
- Demo-priority counts: ${JSON.stringify(layer1.demo_priority_counts)}
- Source records: ${layer1.source_records}
- Source field slots: ${layer1.source_field_values}
- Source field rule: ${layer1.source_field_value_rule}
- Existing BPO event files: ${layer1.existing_bpo_event_files}
- BPO transition/transformation files: ${layer1.bpo_transformation_files}
- Required core source extracts: ${layer1.required_core_source_extracts}
- Optional health-plan outcome snapshot rows: ${layer1.optional_health_plan_outcome_snapshot_rows}
- Restricted detailed health-plan extracts present: ${layer1.restricted_detail_health_plan_extracts_present.length}

## Next Gate

Run only after approval through an isolated ACA data-build job:

1. Preflight against the lab database with writer context and transaction rollback.
2. Apply Layer 1 source release/files/context metadata/records/field values only if the approved package SHA and exact PHS target contract match.
3. Verify with independent reader readback of release hash, all 54 filenames, per-file SHA/counts, source-group counts, demo-priority counts, source-file context rows, total records and total field slots.
4. Continue to source adapters and canonical candidates as separate gated jobs.
`;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "PHS_HEALTHCARE_DEMO_DATA_LAYER_PLAN_FAILED", error: error.message }, null, 2));
  process.exit(1);
});
