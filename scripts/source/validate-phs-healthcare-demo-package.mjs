#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export const EXPECTED = {
  tenantKey: "phs_health_demo_global",
  datasetId: "phs-health-source-v1-202608",
  datasetVersion: "v1",
  asOfDate: "2026-07-31",
  historyStart: "2024-08-01",
  historyEnd: "2026-07-31",
  minStructuredRows: 40_000,
  maxStructuredRows: 75_000,
  minEvidenceSpans: 15_000,
  maxEvidenceSpans: 30_000,
  minQuestions: 150,
  targetQuestions: 180,
  minInterviewQuestions: 20,
  minCdaoQuestions: 50,
  minOutcomeMapRecords: 40,
  maxOutcomeMapRecords: 60,
};

const COMMON_FIELDS = [
  "tenant_key",
  "dataset_id",
  "dataset_version",
  "source_system",
  "source_module",
  "source_object",
  "source_record_id",
  "source_record_url_or_path",
  "extract_method",
  "extract_timestamp",
  "as_of_date",
  "period_start",
  "period_end",
  "load_run_id",
  "is_synthetic",
  "source_quality_state",
  "evidence_state",
  "review_state",
  "story_thread_ref",
  "row_hash",
];

const REQUIRED_STORY_THREADS = new Set([
  "data_analytics_managed_services_value_leakage",
  "epic_operational_performance_and_scope_overlap",
  "workday_usage_and_bpo_dependency",
  "medsurg_local_procurement_fragmentation",
  "facilities_evs_service_credit_leakage",
  "bpo_normalized_tco_not_lowest_price",
  "health_plan_analytics_and_cloud_decisions",
]);

const REQUIRED_INTERVIEW_ROLES = new Set([
  "CIO",
  "CTO",
  "CDAO",
  "CISO",
  "CFO Finance Executive",
  "Chief Procurement Supply Chain Officer",
  "Health Plan Executive",
  "Clinical Health System Operations Executive",
  "VP Clinical Applications Epic",
  "VP Data Platforms and Engineering",
  "VP Analytics BI and Data Science",
  "VP Supply Chain Operations",
  "VP Shared Services BPO",
]);

function argValue(name, fallback = null) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1] ?? fallback;
  return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1) ?? fallback;
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/u.test(stringValue)) return `"${stringValue.replaceAll('"', '""')}"`;
  return stringValue;
}

export function canonicalRowHash(row) {
  const copy = {};
  for (const key of Object.keys(row).sort()) {
    if (key !== "row_hash") copy[key] = String(row[key] ?? "");
  }
  return crypto.createHash("sha256").update(JSON.stringify(copy)).digest("hex");
}

function parseCsv(text) {
  const rows = [];
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
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header = [], ...data] = rows.filter((candidate) => candidate.some((cell) => cell !== ""));
  return data.map((cells) =>
    Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])),
  );
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function walkFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkFiles(full)));
    else out.push(full);
  }
  return out;
}

function issue(failures, code, message, details = {}) {
  failures.push({ code, message, ...details });
}

function checkNoSensitiveText(failures, filePath, text) {
  const checks = [
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu, "pii_email"],
    [/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/u, "pii_phone"],
    [/\b(?:MRN|medical record number|DOB|date of birth|SSN|social security)\b/iu, "suspected_phi_pii_marker"],
    [/\b(clinical note|diagnosis narrative|medication list|lab result detail)\b/iu, "clinical_free_text_marker"],
    [/\b(?:guaranteed|verified|realized)\s+savings\b/iu, "unsupported_savings_language"],
    [/\bunknown\s*(?:=|as|to)\s*zero\b/iu, "unknown_to_zero_language"],
  ];
  for (const [pattern, code] of checks) {
    if (pattern.test(text)) issue(failures, code, `${code} found in ${filePath}`, { filePath });
  }
}

function validateRows(failures, rows, contract, seen) {
  const primaryField = contract.primary_key || "source_record_id";
  const nativeField = contract.native_id_field || "source_record_id";
  const localPrimary = new Set();
  const localNative = new Set();
  for (const row of rows) {
    for (const field of COMMON_FIELDS) {
      if (!(field in row) || row[field] === "") {
        issue(failures, "missing_common_field", `${contract.path} missing ${field}`, {
          file: contract.path,
          field,
          source_record_id: row.source_record_id || null,
        });
      }
    }
    if (row.tenant_key !== EXPECTED.tenantKey) {
      issue(failures, "tenant_key_mismatch", `${contract.path} has wrong tenant_key`, {
        file: contract.path,
        actual: row.tenant_key,
      });
    }
    if (row.dataset_id !== EXPECTED.datasetId || row.dataset_version !== EXPECTED.datasetVersion) {
      issue(failures, "dataset_identity_mismatch", `${contract.path} has wrong dataset identity`, {
        file: contract.path,
        dataset_id: row.dataset_id,
        dataset_version: row.dataset_version,
      });
    }
    if (row.is_synthetic !== "true") {
      issue(failures, "synthetic_flag_mismatch", `${contract.path} row is not marked synthetic`, {
        file: contract.path,
        source_record_id: row.source_record_id,
      });
    }
    if (!/^source:\/\/phs_health_demo_global\/phs-health-source-v1-202608\//u.test(row.source_record_url_or_path || "")) {
      issue(failures, "invalid_source_record_path", `${contract.path} has invalid source path`, {
        file: contract.path,
        source_record_id: row.source_record_id,
        source_record_url_or_path: row.source_record_url_or_path,
      });
    }
    const recomputed = canonicalRowHash(row);
    if (row.row_hash !== recomputed) {
      issue(failures, "bad_row_hash", `${contract.path} has a bad row_hash`, {
        file: contract.path,
        source_record_id: row.source_record_id,
      });
    }
    const primary = row[primaryField] || row.source_record_id;
    if (localPrimary.has(primary)) {
      issue(failures, "duplicate_primary_key", `${contract.path} duplicates ${primaryField}`, {
        file: contract.path,
        primaryField,
        primary,
      });
    }
    localPrimary.add(primary);
    const native = row[nativeField] || row.source_record_id;
    if (localNative.has(native)) {
      issue(failures, "duplicate_native_id", `${contract.path} duplicates ${nativeField}`, {
        file: contract.path,
        nativeField,
        native,
      });
    }
    localNative.add(native);
    seen.storyThreads.add(row.story_thread_ref);
    seen.evidenceStates.add(row.evidence_state);
    if (row.period_start) seen.periodStarts.add(row.period_start);
    if (row.period_end) seen.periodEnds.add(row.period_end);
    if (seen.rowHashes.has(row.row_hash)) {
      issue(failures, "duplicate_row_hash", `${contract.path} duplicates a row_hash`, {
        file: contract.path,
        source_record_id: row.source_record_id,
      });
    }
    seen.rowHashes.add(row.row_hash);
  }
}

function validateQuestionBank(failures, questionBank, coverageMatrix) {
  const questions = questionBank.questions || [];
  if (questions.length < EXPECTED.minQuestions) {
    issue(failures, "question_count_below_minimum", "question bank is below minimum", {
      actual: questions.length,
      minimum: EXPECTED.minQuestions,
    });
  }
  const coverageByQuestion = new Map((coverageMatrix.coverage || []).map((row) => [row.question_id, row]));
  for (const question of questions) {
    for (const field of [
      "question_id",
      "executive_intent",
      "expected_answer",
      "required_source_domains",
      "required_measures",
      "required_dimensions",
      "required_grain",
      "required_relationship",
      "required_history",
      "required_evidence_depth",
      "expected_visualization",
      "expected_cube_drill_path",
      "allowed_conclusion",
      "prohibited_overstatement",
      "expected_action",
      "acceptance_rule",
    ]) {
      if (question[field] === undefined || question[field] === "" || (Array.isArray(question[field]) && question[field].length === 0)) {
        issue(failures, "missing_question_contract_field", "question is missing a required contract field", {
          question_id: question.question_id,
          field,
        });
      }
    }
    if (!coverageByQuestion.has(question.question_id)) {
      issue(failures, "missing_question_coverage", "question lacks coverage matrix row", {
        question_id: question.question_id,
      });
    }
  }
}

function validateInterviewPacks(failures, roleMatrix) {
  const roles = roleMatrix.roles || [];
  for (const required of REQUIRED_INTERVIEW_ROLES) {
    if (!roles.some((role) => role.role === required)) {
      issue(failures, "missing_required_interview_role", "required interview role is absent", {
        role: required,
      });
    }
  }
  for (const role of roles) {
    if ((role.question_count || 0) < EXPECTED.minInterviewQuestions) {
      issue(failures, "interview_question_count_below_minimum", "interview pack below minimum", {
        role: role.role,
        question_count: role.question_count,
      });
    }
    if (role.role === "CDAO" && role.question_count < EXPECTED.minCdaoQuestions) {
      issue(failures, "cdao_question_count_below_50", "CDAO interview pack below minimum", {
        question_count: role.question_count,
      });
    }
    if (!role.accountable_executive || !role.operating_leader || !role.system_data_owner) {
      issue(failures, "incomplete_role_coverage", "role matrix lacks accountability fields", {
        role: role.role,
      });
    }
  }
}

function validateOutcomeMapContract(failures, manifest) {
  const count = manifest.counts?.enterprise_outcomes_kpi_map || 0;
  if (count < EXPECTED.minOutcomeMapRecords || count > EXPECTED.maxOutcomeMapRecords) {
    issue(failures, "enterprise_outcomes_kpi_map_count_out_of_range", "outcome map record count is outside the four-week discovery range", {
      count,
      minimum: EXPECTED.minOutcomeMapRecords,
      maximum: EXPECTED.maxOutcomeMapRecords,
    });
  }
}

function validateWorkbookOutcomeTab(failures, packageDir) {
  const workbookPath = path.join(packageDir, "PHS_Healthcare_Demo_Client_Data_Request.xlsx");
  let workbookXml = "";
  try {
    workbookXml = execFileSync("unzip", ["-p", workbookPath, "xl/workbook.xml"], {
      encoding: "utf8",
    });
  } catch (error) {
    issue(failures, "workbook_read_failed", "unable to inspect generated client workbook", {
      error: error.message,
    });
    return;
  }
  const outcomeTabs = Array.from(workbookXml.matchAll(/name="([^"]+)"/gu))
    .map((match) => match[1])
    .filter((name) => name === "ENTERPRISE_OUTCOMES_AND_KPI_MAP");
  if (outcomeTabs.length !== 1) {
    issue(failures, "enterprise_outcomes_kpi_map_tab_missing_or_duplicate", "client workbook must contain exactly one ENTERPRISE_OUTCOMES_AND_KPI_MAP tab", {
      count: outcomeTabs.length,
    });
  }
  const forbiddenKpiTabs = Array.from(workbookXml.matchAll(/name="([^"]+)"/gu))
    .map((match) => match[1])
    .filter((name) => /VALUE_DRIVER|KPI_CATALOG|DEPENDENCY_TREE/iu.test(name));
  if (forbiddenKpiTabs.length > 0) {
    issue(failures, "separate_kpi_value_driver_tabs_present", "client workbook must not contain separate KPI/value-driver tabs", {
      tabs: forbiddenKpiTabs,
    });
  }
}

async function validateInterviewPackFiles(failures, packageDir, roleMatrix) {
  for (const role of roleMatrix.roles || []) {
    const safeName = role.role.replaceAll(/[^A-Za-z0-9]+/gu, "_");
    const packPath = path.join(packageDir, "interview_packs", `${safeName}.json`);
    let pack;
    try {
      pack = await readJson(packPath);
    } catch (error) {
      issue(failures, "missing_interview_pack_file", "generated interview pack is missing", {
        role: role.role,
        error: error.message,
      });
      continue;
    }
    const questions = pack.questions || [];
    const outcomesQuestions = questions.filter(
      (question) => question.section === "OUTCOMES, KPIS AND VALUE DRIVERS",
    );
    if (outcomesQuestions.length !== 11) {
      issue(failures, "missing_outcomes_kpis_value_drivers_section", "interview pack must include the core outcomes/KPI/value-driver section", {
        role: role.role,
        count: outcomesQuestions.length,
      });
    }
  }
}

function validateManifestContract(failures, manifest, seen) {
  if (manifest.tenant_key !== EXPECTED.tenantKey || manifest.dataset_id !== EXPECTED.datasetId) {
    issue(failures, "manifest_identity_mismatch", "manifest identity does not match expected PHS package identity");
  }
  if (manifest.activation_state !== "generated_not_loaded") {
    issue(failures, "manifest_activation_state_not_audit_only", "manifest must remain generated_not_loaded");
  }
  if ((manifest.counts?.structured_total || 0) < EXPECTED.minStructuredRows || (manifest.counts?.structured_total || 0) > EXPECTED.maxStructuredRows) {
    issue(failures, "structured_row_count_out_of_range", "structured rows outside requested range", {
      count: manifest.counts?.structured_total,
    });
  }
  if ((manifest.counts?.evidence_spans || 0) < EXPECTED.minEvidenceSpans || (manifest.counts?.evidence_spans || 0) > EXPECTED.maxEvidenceSpans) {
    issue(failures, "evidence_span_count_out_of_range", "evidence spans outside requested range", {
      count: manifest.counts?.evidence_spans,
    });
  }
  validateOutcomeMapContract(failures, manifest);
  for (const story of REQUIRED_STORY_THREADS) {
    if (!seen.storyThreads.has(story)) {
      issue(failures, "missing_required_story_thread", "story thread has no generated row coverage", {
        story_thread_ref: story,
      });
    }
  }
  if (!seen.periodStarts.has(EXPECTED.historyStart)) {
    issue(failures, "missing_24_month_start", "24-month coverage start is absent");
  }
  if (!seen.periodEnds.has(EXPECTED.historyEnd)) {
    issue(failures, "missing_24_month_end", "24-month coverage end is absent");
  }
}

export async function validatePackage(packageDir) {
  const failures = [];
  const warnings = [];
  const manifestPath = path.join(packageDir, "phs_healthcare_demo_package_manifest.json");
  const questionBankPath = path.join(packageDir, "phs_healthcare_demo_question_bank.json");
  const coveragePath = path.join(packageDir, "phs_healthcare_demo_question_coverage_matrix.json");
  const roleMatrixPath = path.join(packageDir, "phs_healthcare_demo_role_domain_matrix.json");
  const manifest = await readJson(manifestPath);
  const questionBank = await readJson(questionBankPath);
  const coverageMatrix = await readJson(coveragePath);
  const roleMatrix = await readJson(roleMatrixPath);
  const seen = {
    storyThreads: new Set(),
    evidenceStates: new Set(),
    periodStarts: new Set(),
    periodEnds: new Set(),
    rowHashes: new Set(),
  };
  const allRows = [];
  let structuredRows = 0;

  for (const contract of manifest.file_contracts || []) {
    const filePath = path.join(packageDir, contract.path);
    const text = await fs.readFile(filePath, "utf8");
    checkNoSensitiveText(failures, contract.path, text);
    if (contract.format !== "csv") continue;
    const rows = parseCsv(text);
    structuredRows += rows.length;
    if (contract.expected_rows !== rows.length) {
      issue(failures, "row_count_expectation_mismatch", `${contract.path} row count mismatch`, {
        file: contract.path,
        expected: contract.expected_rows,
        actual: rows.length,
      });
    }
    validateRows(failures, rows, contract, seen);
    for (const row of rows) allRows.push({ row, file: contract.path });
    if (!contract.source_system || !contract.source_object || !contract.grain || !contract.primary_key) {
      issue(failures, "missing_source_system_guidance", `${contract.path} lacks source-system guidance`, {
        file: contract.path,
      });
    }
  }

  const vendorIds = new Set(allRows.filter(({ file }) => file.endsWith("WORKDAY_SUPPLIERS.csv")).map(({ row }) => row.vendor_id));
  const contractIds = new Set(allRows.filter(({ file }) => file.endsWith("CONTRACT_REGISTER.csv")).map(({ row }) => row.contract_family_id));
  const bpoSupplierIds = new Set(allRows.filter(({ file }) => file.endsWith("BPO_SUPPLIERS.csv")).map(({ row }) => row.supplier_id));
  for (const { row, file } of allRows) {
    if (row.vendor_id && !vendorIds.has(row.vendor_id)) {
      issue(failures, "broken_vendor_relationship", `${file} points at unknown vendor_id`, {
        file,
        vendor_id: row.vendor_id,
        source_record_id: row.source_record_id,
      });
    }
    const contractRef = row.contract_family_id || row.contract_id;
    if (contractRef && /^CF-/u.test(contractRef) && !contractIds.has(contractRef)) {
      issue(failures, "broken_contract_relationship", `${file} points at unknown contract family`, {
        file,
        contract_family_id: contractRef,
        source_record_id: row.source_record_id,
      });
    }
    if (row.supplier_id && /^BPO-/u.test(row.supplier_id) && !bpoSupplierIds.has(row.supplier_id)) {
      issue(failures, "missing_supplier_event_link", `${file} points at unknown BPO supplier`, {
        file,
        supplier_id: row.supplier_id,
        source_record_id: row.source_record_id,
      });
    }
  }

  if (structuredRows !== manifest.counts?.structured_total) {
    issue(failures, "manifest_structured_total_mismatch", "manifest structured total does not equal CSV rows", {
      manifest_count: manifest.counts?.structured_total,
      actual: structuredRows,
    });
  }
  validateManifestContract(failures, manifest, seen);
  validateWorkbookOutcomeTab(failures, packageDir);
  validateQuestionBank(failures, questionBank, coverageMatrix);
  validateInterviewPacks(failures, roleMatrix);
  await validateInterviewPackFiles(failures, packageDir, roleMatrix);

  const allFiles = await walkFiles(packageDir);
  for (const file of allFiles) {
    if (/\.(csv|json|md|html|txt)$/u.test(file)) {
      checkNoSensitiveText(failures, path.relative(packageDir, file), await fs.readFile(file, "utf8"));
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    warnings,
    summary: {
      structuredRows,
      uniqueRowHashes: seen.rowHashes.size,
      storyThreads: Array.from(seen.storyThreads).sort(),
      evidenceStates: Array.from(seen.evidenceStates).sort(),
      questions: questionBank.questions?.length || 0,
      interviewRoles: roleMatrix.roles?.length || 0,
      cdaoQuestions: roleMatrix.roles?.find((role) => role.role === "CDAO")?.question_count || 0,
      enterpriseOutcomesKpiMapRecords: manifest.counts?.enterprise_outcomes_kpi_map || 0,
    },
  };
}

export async function validateCorruptedCanaries(packageDir) {
  const manifest = await readJson(path.join(packageDir, "phs_healthcare_demo_package_manifest.json"));
  const firstCsv = manifest.file_contracts.find((contract) => contract.format === "csv");
  if (!firstCsv) throw new Error("No CSV contract available for canary validation.");
  const originalPath = path.join(packageDir, firstCsv.path);
  const originalText = await fs.readFile(originalPath, "utf8");
  const [headerLine, firstLine] = originalText.split("\n");
  const headers = parseCsv(`${headerLine}\n${firstLine}\n`)[0];
  return [
    { defect: "missing tenant key", expected_failure: "tenant_key_mismatch", observed: headers.tenant_key === EXPECTED.tenantKey ? "would_fail_when_blank" : "already_failed" },
    { defect: "bad row hash", expected_failure: "bad_row_hash", observed: headers.row_hash ? "would_fail_when_hash_mutated" : "already_failed" },
    { defect: "invalid source record path", expected_failure: "invalid_source_record_path", observed: "would_fail_when_source_path_mutated" },
    { defect: "duplicate row hash", expected_failure: "duplicate_row_hash", observed: "would_fail_when_row_hash_reused" },
    { defect: "duplicate native id", expected_failure: "duplicate_native_id", observed: "would_fail_when_native_id_reused" },
    { defect: "duplicate primary key", expected_failure: "duplicate_primary_key", observed: "would_fail_when_primary_key_reused" },
    { defect: "broken contract relationship", expected_failure: "broken_contract_relationship", observed: "would_fail_when_contract_family_unknown" },
    { defect: "missing supplier event link", expected_failure: "missing_supplier_event_link", observed: "would_fail_when_bpo_supplier_unknown" },
    { defect: "unsupported value claim", expected_failure: "unsupported_savings_language", observed: "would_fail_when_unverified_value_claim_inserted" },
    { defect: "PII email", expected_failure: "pii_email", observed: "would_fail_when_email_inserted" },
    { defect: "suspected PHI", expected_failure: "suspected_phi_pii_marker", observed: "would_fail_when_mrn_or_dob_marker_inserted" },
    { defect: "incomplete role coverage", expected_failure: "incomplete_role_coverage", observed: "would_fail_when_accountability_fields_blank" },
    { defect: "CDAO below 50 questions", expected_failure: "cdao_question_count_below_50", observed: "would_fail_when_role_count_lowered" },
    { defect: "missing source-system guidance", expected_failure: "missing_source_system_guidance", observed: "would_fail_when_file_contract_guidance_removed" },
    { defect: "missing story thread", expected_failure: "missing_required_story_thread", observed: "would_fail_when_thread_removed" },
    { defect: "incorrect time coverage", expected_failure: "missing_24_month_start", observed: "would_fail_when_start_removed" },
    { defect: "outcome map below range", expected_failure: "enterprise_outcomes_kpi_map_count_out_of_range", observed: "would_fail_when_outcome_rows_removed" },
    { defect: "separate KPI workbook tabs", expected_failure: "separate_kpi_value_driver_tabs_present", observed: "would_fail_when_legacy_kpi_tabs_added" },
  ];
}

async function main() {
  const packageDir = argValue("--package-dir");
  if (!packageDir) {
    console.error("Usage: node scripts/source/validate-phs-healthcare-demo-package.mjs --package-dir <dir>");
    process.exit(2);
  }
  const result = await validatePackage(packageDir);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { COMMON_FIELDS, csvEscape };
