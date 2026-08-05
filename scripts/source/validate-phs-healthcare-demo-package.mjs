#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
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

const REQUIRED_CORE_SOURCE_EXTRACTS = new Set([
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
]);

const RESTRICTED_DETAIL_SOURCE_EXTRACTS = new Set([
  "PAYER_CLAIMS_ENROLLMENT_MONTHLY.csv",
  "STARS_HEDIS_MEASURE_PERFORMANCE.csv",
]);

const OPTIONAL_HEALTH_PLAN_SNAPSHOT = "HEALTH_PLAN_OUTCOME_SNAPSHOT.csv";

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

const REQUIRED_OUTCOME_PORTFOLIOS = new Set([
  "enterprise",
  "health plan",
  "hospitals and clinical operations",
  "revenue cycle",
  "finance",
  "supply chain and procurement",
  "human resources",
  "shared services",
  "digital and patient/member experience",
  "information technology",
  "data, analytics and AI",
  "cybersecurity",
  "quality, compliance and enterprise risk",
]);

const OUTCOME_CLASSIFICATIONS = new Set([
  "enterprise_outcome",
  "business_unit_outcome",
  "leading_driver",
  "operational_indicator",
  "risk_guardrail",
]);

const DESIRED_DIRECTIONS = new Set([
  "increase",
  "decrease",
  "maintain",
  "optimize",
  "monitor",
]);

const CONFIDENCE_STATES = new Set([
  "confirmed",
  "reported",
  "estimated",
  "unresolved",
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

function basename(filePath) {
  return path.basename(filePath);
}

function decodeXml(value) {
  return String(value)
    .replaceAll("&quot;", '"')
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");
}

function readWorkbookSheetRows(workbookPath, sheetNumber) {
  const xml = execFileSync("unzip", ["-p", workbookPath, `xl/worksheets/sheet${sheetNumber}.xml`], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return Array.from(xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gu)).map((rowMatch) =>
    Array.from(rowMatch[1].matchAll(/<t>([\s\S]*?)<\/t>/gu)).map((cell) =>
      decodeXml(cell[1]),
    ),
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizedJoinValue(key, row) {
  const aliases = {
    contract_family_id: ["contract_family_id", "contract_id"],
    contract_id: ["contract_id", "contract_family_id"],
    application_id: ["application_id", "application_ref"],
    application_ref: ["application_ref", "application_id"],
    downstream_mart_id: ["downstream_mart_id", "mart_id"],
    mart_id: ["mart_id", "downstream_mart_id"],
  };
  for (const field of aliases[key] || [key]) {
    const value = row[field];
    if (value === undefined || value === null || value === "") continue;
    if (key === "normalized_location_model" || field === "location_model") {
      const normalized = String(value).trim().toLowerCase().replaceAll(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
      if (["us", "us_based_internal", "us_internal"].includes(normalized)) return "us_internal";
      return normalized;
    }
    return String(value).trim().toLowerCase();
  }
  return "";
}

function validatePlantedSourceJoins(failures, row, plantedRows) {
  const joinKeys = asArray(row.planted_source_join_keys);
  const multiRecordRows = plantedRows.map((entry) => entry.row);
  if (multiRecordRows.length > 1 && joinKeys.length === 0 && asArray(row.cross_domain_relationships).length === 0) {
    issue(failures, "planted_source_join_keys_missing", "multi-record coverage row lacks explicit scenario join keys", {
      question_id: row.question_id,
      planted_scenario_records: row.planted_scenario_records,
    });
  }
  for (const key of joinKeys) {
    const values = multiRecordRows
      .map((candidate) => normalizedJoinValue(key, candidate))
      .filter(Boolean);
    if (values.length < 2) continue;
    const distinct = Array.from(new Set(values));
    if (distinct.length > 1) {
      issue(failures, "planted_source_join_mismatch", "planted source records exist but do not join on the declared scenario key", {
        question_id: row.question_id,
        join_key: key,
        observed_values: distinct.sort(),
        planted_scenario_records: row.planted_scenario_records,
      });
    }
  }
}

async function writeCsvFile(filePath, rows) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const text = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ].join("\n") + "\n";
  await fs.writeFile(filePath, text);
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

function validateQuestionBank(failures, questionBank, coverageMatrix, indexes) {
  const questions = questionBank.questions || [];
  if (questions.length < EXPECTED.minQuestions) {
    issue(failures, "question_count_below_minimum", "question bank is below minimum", {
      actual: questions.length,
      minimum: EXPECTED.minQuestions,
    });
  }
  const coverageByQuestion = new Map((coverageMatrix.coverage || []).map((row) => [row.question_id, row]));
  const normalizedQuestions = new Set();
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
    const normalized = String(question.question || "")
      .toLowerCase()
      .replace(/\bphs-hq-\d+\b/gu, "")
      .replace(/\d+/gu, "#")
      .replace(/\s+/gu, " ")
      .trim();
    normalizedQuestions.add(normalized);
    if (/synthetic story thread|which .+ pattern requires executive action|from which/iu.test(question.question || "")) {
      issue(failures, "placeholder_hard_question", "question text still uses scaffold pattern", {
        question_id: question.question_id,
        question: question.question,
      });
    }
    if (!coverageByQuestion.has(question.question_id)) {
      issue(failures, "missing_question_coverage", "question lacks coverage matrix row", {
        question_id: question.question_id,
      });
    } else {
      validateCoverageRow(failures, coverageByQuestion.get(question.question_id), question, indexes);
    }
  }
  if (normalizedQuestions.size < Math.floor(questions.length * 0.9)) {
    issue(failures, "hard_question_repetition_excessive", "hard-question bank has too much repeated language", {
      unique: normalizedQuestions.size,
      total: questions.length,
    });
  }
}

function validateCoverageRow(failures, row, question, indexes) {
  const files = asArray(row.required_source_files);
  const plantedRows = [];
  const sourceContractRefs = new Set();
  if (files.length === 0) {
    issue(failures, "question_missing_source_files", "coverage row has no required source files", {
      question_id: row.question_id,
    });
  }
  const unionColumns = new Set();
  for (const file of files) {
    if (!indexes.rowsByBasename.has(file)) {
      issue(failures, "mapped_source_file_missing", "question maps to a source file that does not exist", {
        question_id: row.question_id,
        file,
      });
      continue;
    }
    for (const column of indexes.columnsByBasename.get(file) || []) unionColumns.add(column);
  }
  for (const column of asArray(row.required_columns)) {
    if (!unionColumns.has(column)) {
      issue(failures, "mapped_column_missing", "required coverage column is absent from mapped source files", {
        question_id: row.question_id,
        column,
        files,
      });
    }
  }
  for (const measure of asArray(row.required_measures || question.required_measures)) {
    if (!unionColumns.has(measure)) {
      issue(failures, "mapped_measure_missing", "required measure is absent from mapped source files", {
        question_id: row.question_id,
        measure,
        files,
      });
    }
  }
  for (const dimension of asArray(row.required_dimensions || question.required_dimensions)) {
    if (!unionColumns.has(dimension)) {
      issue(failures, "mapped_dimension_missing", "required dimension is absent from mapped source files", {
        question_id: row.question_id,
        dimension,
        files,
      });
    }
  }
  for (const recordId of asArray(row.planted_scenario_records)) {
    const recordFiles = indexes.recordToBasenames.get(recordId);
    if (!recordFiles) {
      issue(failures, "planted_record_missing", "planted scenario record does not resolve to a generated source_record_id", {
        question_id: row.question_id,
        recordId,
      });
      continue;
    }
    if (!files.some((file) => recordFiles.has(file))) {
      issue(failures, "planted_record_irrelevant_to_source_mapping", "planted record exists but not in the mapped source files", {
        question_id: row.question_id,
        recordId,
        mappedFiles: files,
        actualFiles: Array.from(recordFiles),
      });
    }
    for (const recordEntry of indexes.recordRows.get(recordId) || []) {
      if (!files.includes(recordEntry.file)) continue;
      plantedRows.push(recordEntry);
      const actualStory = recordEntry.row.story_thread_ref;
      const expectedStory = row.story_thread_ref || question.story_thread_ref;
      const crossDomainJustified = asArray(row.cross_domain_relationships).some((entry) => {
        const text = String(entry).toLowerCase();
        return text.includes(recordId.toLowerCase()) || text.includes(recordEntry.file.toLowerCase()) || (actualStory && text.includes(actualStory.toLowerCase()));
      });
      if (expectedStory && actualStory !== expectedStory && !crossDomainJustified) {
        issue(failures, "planted_record_story_thread_mismatch", "planted source record exists but does not align to the question story thread", {
          question_id: row.question_id,
          recordId,
          file: recordEntry.file,
          expectedStory,
          actualStory,
        });
      }
      const contractRef = recordEntry.row.contract_family_id || recordEntry.row.contract_id;
      if (contractRef && /^CF-/u.test(contractRef)) sourceContractRefs.add(contractRef);
    }
  }
  validatePlantedSourceJoins(failures, row, plantedRows);
  const evidenceRows = [];
  for (const evidenceRef of asArray(row.evidence_refs)) {
    if (!indexes.evidenceRefs.has(evidenceRef)) {
      issue(failures, "mapped_evidence_ref_missing", "mapped evidence reference does not exist", {
        question_id: row.question_id,
        evidenceRef,
      });
      continue;
    }
    const evidenceRow = indexes.evidenceRowsByRef.get(evidenceRef);
    if (evidenceRow) {
      evidenceRows.push(evidenceRow);
      const expectedStory = row.story_thread_ref || question.story_thread_ref;
      if (expectedStory && evidenceRow.story_thread_ref !== expectedStory) {
        issue(failures, "mapped_evidence_story_thread_mismatch", "mapped evidence exists but does not align to the question story thread", {
          question_id: row.question_id,
          evidenceRef,
          expectedStory,
          actualStory: evidenceRow.story_thread_ref,
        });
      }
      if (Array.isArray(row.expected_evidence_span_types) && !row.expected_evidence_span_types.includes(evidenceRow.span_type)) {
        issue(failures, "mapped_evidence_type_mismatch", "mapped evidence type does not support the question evidence need", {
          question_id: row.question_id,
          evidenceRef,
          expectedTypes: row.expected_evidence_span_types,
          actualType: evidenceRow.span_type,
        });
      }
      const expectedSubjectTerms = asArray(row.expected_evidence_subject_terms);
      if (expectedSubjectTerms.length > 0) {
        const subjectText = `${evidenceRow.evidence_subject || ""} ${evidenceRow.accepted_extraction || ""}`.toLowerCase();
        const matched = expectedSubjectTerms.some((term) => subjectText.includes(String(term).toLowerCase()));
        if (!matched) {
          issue(failures, "mapped_evidence_subject_mismatch", "mapped evidence has the right reference shape but does not support the question subject", {
            question_id: row.question_id,
            evidenceRef,
            expectedSubjectTerms,
            evidenceSubject: evidenceRow.evidence_subject || "",
          });
        }
      }
    }
  }
  const evidenceContractRefs = new Set(evidenceRows.map((evidenceRow) => evidenceRow.contract_family_id).filter(Boolean));
  if (sourceContractRefs.size > 0 && evidenceContractRefs.size > 0) {
    const joined = Array.from(sourceContractRefs).some((contractRef) => evidenceContractRefs.has(contractRef));
    if (!joined) {
      issue(failures, "mapped_evidence_contract_mismatch", "mapped evidence exists but does not align to the planted source contract family", {
        question_id: row.question_id,
        sourceContractRefs: Array.from(sourceContractRefs).sort(),
        evidenceContractRefs: Array.from(evidenceContractRefs).sort(),
      });
      issue(failures, "source_evidence_join_mismatch", "planted source and evidence records exist but do not join to one another", {
        question_id: row.question_id,
        sourceContractRefs: Array.from(sourceContractRefs).sort(),
        evidenceContractRefs: Array.from(evidenceContractRefs).sort(),
      });
    }
  }
  validateQuestionPredicate(failures, row, question, plantedRows.map((entry) => entry.row));
  if (files.length > 0 && asArray(row.planted_scenario_records).length < files.length) {
    issue(failures, "insufficient_planted_records_for_mapping", "coverage row has fewer planted records than mapped source files", {
      question_id: row.question_id,
      files,
      planted_scenario_records: row.planted_scenario_records,
    });
  }
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validateQuestionPredicate(failures, row, question, plantedRows) {
  const predicate = row.question_predicate || question.question_predicate;
  if (!predicate) {
    issue(failures, "question_predicate_missing", "coverage row lacks a semantic predicate for the planted records", {
      question_id: row.question_id,
    });
    return;
  }
  const any = (fn) => plantedRows.some(fn);
  const all = (fn) => plantedRows.length > 0 && plantedRows.every(fn);
  const checks = {
    rate_overbilling: () => any((candidate) => numberValue(candidate.billed_rate_observed || candidate.billed_rate) > numberValue(candidate.contracted_rate) || /variance|above_contract/iu.test(`${candidate.rate_card_match_state || ""} ${candidate.variance_state || ""}`)),
    unclaimed_credit: () => any((candidate) => numberValue(candidate.eligible_amount || candidate.service_credit_eligible_amount) > numberValue(candidate.claimed_amount || candidate.service_credit_claimed_amount)),
    incident_or_backlog_pressure: () => any((candidate) => numberValue(candidate.p1_count) > 0 || numberValue(candidate.p2_count) > 0 || numberValue(candidate.sla_breach_count) > 0 || numberValue(candidate.backlog_over_30_days) > 0),
    unresolved_scope: () => any((candidate) => /unresolved|inferred_requires_review|overlap_requires_resolution/iu.test(`${candidate.responsibility_state || ""} ${candidate.relationship_confidence || ""} ${candidate.support_scope_state || ""}`)),
    low_utilization: () => any((candidate) => candidate.low_usage_flag === "true" || (numberValue(candidate.entitled_users) > 0 && numberValue(candidate.active_users) / numberValue(candidate.entitled_users) < 0.5)),
    workforce_transition_cost: () => any((candidate) => numberValue(candidate.fte_count || candidate.resource_count) > 0 || numberValue(candidate.loaded_labor_cost || candidate.loaded_labor_cost_annual) > 0),
    off_contract_purchase: () => any((candidate) => candidate.purchase_channel === "off_contract_local"),
    rebate_gap: () => any((candidate) => numberValue(candidate.earned_rebate_amount) > numberValue(candidate.reconciled_rebate_amount)),
    service_credit_gap: () => any((candidate) => numberValue(candidate.breach_count) > 0 || numberValue(candidate.actual_pct) < numberValue(candidate.target_pct) || numberValue(candidate.eligible_amount) > numberValue(candidate.claimed_amount)),
    normalized_tco_recommendation: () => any((candidate) => candidate.recommendation_state === "recommended_after_normalization") && any((candidate) => numberValue(candidate.transition_cost) + numberValue(candidate.retained_org_cost) + numberValue(candidate.risk_adjustment) > 0),
    supplier_quality_tradeoff: () => any((candidate) => /exception|partially/iu.test(`${candidate.response_state || ""}`) || numberValue(candidate.score) < 4 || numberValue(candidate.weighted_score) < 5),
    bafo_exception: () => any((candidate) => /exception_remains|open/iu.test(`${candidate.bafo_exception_state || ""} ${candidate.status || ""}`)),
    legacy_dependency: () => any((candidate) => /needs_decision|contract_scope|overlap|migration_candidate/iu.test(`${candidate.retirement_dependency || ""} ${candidate.migration_state || ""} ${candidate.redundancy_state || ""}`)),
    cloud_prerequisite: () => any((candidate) => Boolean(candidate.prerequisite_decision)),
    architecture_sequence: () => any((candidate) => candidate.decision_required === "true" || Boolean(candidate.target_quarter)),
    risk_control_gap: () => any((candidate) => /gap_requires_validation|must_have/iu.test(`${candidate.observation_state || ""} ${candidate.criticality || ""}`)),
    vendor_scope_ambiguity: () => any((candidate) => /inferred_requires_review|strategic/iu.test(`${candidate.relationship_confidence || ""} ${candidate.risk_tier || ""}`)),
    renewal_leverage: () => any((candidate) => /partial_evidence|renewal|termination|exit/iu.test(`${candidate.extracted_state || ""} ${candidate.clause_type || ""}`) || numberValue(candidate.financial_effect) !== 0),
    evidence_blocker: () => any((candidate) => /needs_audit_review|medium|partial_evidence/iu.test(`${candidate.review_state || ""} ${candidate.extraction_confidence || ""} ${candidate.extracted_state || ""}`)),
    substitution_cost: () => any((candidate) => numberValue(candidate.backorder_count) > 0 || numberValue(candidate.substitution_count) > 0 || numberValue(candidate.incremental_cost) > 0),
    workforce_mix_variance: () => any((candidate) => numberValue(candidate.billed_mix_pct) !== numberValue(candidate.contracted_mix_pct)),
    finance_reconciliation_gap: () => any((candidate) => numberValue(candidate.payment_amount) > 0 || numberValue(candidate.line_amount) > 0),
    bpo_baseline_exposure: () => any((candidate) => numberValue(candidate.monthly_volume) > 0 || numberValue(candidate.labor_cost) > 0 || numberValue(candidate.technology_cost) > 0 || numberValue(candidate.controls_cost) > 0),
    document_complete: () => all((candidate) => /audit_ready|high|accepted_extraction|MSA|SOW|Amendment|Pricing|SLA|Security|Exit/iu.test(`${candidate.review_state || ""} ${candidate.extraction_confidence || ""} ${candidate.instrument_type || ""}`)),
    supplier_requirement_coverage: () => any((candidate) => candidate.invitation_state === "invited" || /must_have|weighted/iu.test(candidate.criticality || "")),
  };
  if (!checks[predicate]) {
    issue(failures, "question_predicate_unknown", "coverage row names an unsupported semantic predicate", {
      question_id: row.question_id,
      predicate,
    });
    return;
  }
  if (!checks[predicate]()) {
    issue(failures, "question_predicate_not_satisfied", "planted source records exist but do not satisfy the question predicate", {
      question_id: row.question_id,
      predicate,
      planted_scenario_records: row.planted_scenario_records,
    });
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

function validateOutcomeMapSubstance(failures, outcomeMap, indexes) {
  const rows = outcomeMap.rows || [];
  const portfolios = new Set(rows.map((row) => row.portfolio_or_function));
  for (const portfolio of REQUIRED_OUTCOME_PORTFOLIOS) {
    if (!portfolios.has(portfolio)) {
      issue(failures, "missing_outcome_portfolio", "enterprise outcome map misses a required portfolio", {
        portfolio,
      });
    }
  }
  const classifications = new Set(rows.map((row) => row.classification));
  for (const classification of OUTCOME_CLASSIFICATIONS) {
    if (!classifications.has(classification)) {
      issue(failures, "missing_outcome_classification", "enterprise outcome map misses a required classification", {
        classification,
      });
    }
  }
  const definitions = new Map();
  const placeholderPattern = /\b(outcome|indicator)\s+\d+$|lightweight discovery record|enterprise outcome \d|business unit outcome \d/iu;
  for (const row of rows) {
    for (const field of [
      "record_id",
      "portfolio_or_function",
      "business_purpose",
      "outcome_or_indicator_name",
      "classification",
      "plain-English definition",
      "why_it_matters",
      "desired_direction",
      "executive_owner_role",
      "operating_owner_role",
      "primary_decision_supported",
      "review_forum",
      "key_systems_or_data_sources",
      "material_vendor_or_contract_dependency",
      "related_initiatives",
      "evidence_source",
      "confidence_state",
      "validation_owner_role",
    ]) {
      if (!row[field]) {
        issue(failures, "outcome_map_missing_required_field", "outcome-map row has a blank required field", {
          record_id: row.record_id || null,
          field,
        });
      }
    }
    if (!OUTCOME_CLASSIFICATIONS.has(row.classification)) {
      issue(failures, "invalid_outcome_classification", "outcome-map classification is invalid", {
        record_id: row.record_id,
        classification: row.classification,
      });
    }
    if (!DESIRED_DIRECTIONS.has(row.desired_direction)) {
      issue(failures, "invalid_desired_direction", "outcome-map desired direction is invalid", {
        record_id: row.record_id,
        desired_direction: row.desired_direction,
      });
    }
    if (!CONFIDENCE_STATES.has(row.confidence_state)) {
      issue(failures, "invalid_confidence_state", "outcome-map confidence state is invalid", {
        record_id: row.record_id,
        confidence_state: row.confidence_state,
      });
    }
    if (placeholderPattern.test(row.outcome_or_indicator_name || "") || placeholderPattern.test(row["plain-English definition"] || "")) {
      issue(failures, "placeholder_outcome_language", "outcome-map row uses scaffold language", {
        record_id: row.record_id,
        outcome_or_indicator_name: row.outcome_or_indicator_name,
      });
    }
    const definition = (row["plain-English definition"] || "").toLowerCase().trim();
    definitions.set(definition, (definitions.get(definition) || 0) + 1);
    if (!/(Workday|ServiceNow|Epic|Clarity|Caboodle|GRC|BPO|scorecard|strategy|CONTRACT|RISK|AWS|DATABRICKS|SAS|HADOOP|SQL_SERVER|MEDSURG|LOCAL_HOSPITAL|evidence|PMO|validation report|model-fit|test-load|validator|application|dependency map)/iu.test(row.key_systems_or_data_sources || "")) {
      issue(failures, "outcome_map_weak_source_state", "outcome-map row lacks credible source or evidence state", {
        record_id: row.record_id,
        key_systems_or_data_sources: row.key_systems_or_data_sources,
      });
    }
    validateOutcomeReference(failures, row, indexes);
  }
  for (const [definition, count] of definitions.entries()) {
    if (definition && count > 2) {
      issue(failures, "repeated_outcome_definition", "outcome-map repeats a definition excessively", {
        count,
        definition,
      });
    }
  }
}

function validateOutcomeReference(failures, row, indexes) {
  const ref = String(row.material_vendor_or_contract_dependency || "").toLowerCase();
  if (!ref || ref.includes("unresolved relationship candidate") || ref === "not applicable" || ref.includes("all material contract families")) return;
  const matched =
    indexes.vendorNames.some((name) => ref.includes(name.toLowerCase())) ||
    indexes.contractNames.some((name) => ref.includes(name.toLowerCase())) ||
    [
      "bpo sourcing event",
      "aws",
      "databricks",
      "aws and databricks",
      "cybersecurity managed detection",
      "workday saas and services",
      "data analytics managed services",
      "data and analytics managed services",
      "medical surgical distribution",
      "epic managed services",
    ].some((known) => ref.includes(known));
  if (!matched) {
    issue(failures, "unresolved_outcome_dependency_reference", "outcome-map material vendor/platform/contract reference does not resolve or mark itself unresolved", {
      record_id: row.record_id,
      material_vendor_or_contract_dependency: row.material_vendor_or_contract_dependency,
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

function validateWorkbookQuality(failures, packageDir) {
  const workbookPath = path.join(packageDir, "PHS_Healthcare_Demo_Client_Data_Request.xlsx");
  for (let sheetNumber = 1; sheetNumber <= 3; sheetNumber += 1) {
    const xml = execFileSync("unzip", ["-p", workbookPath, `xl/worksheets/sheet${sheetNumber}.xml`], {
      encoding: "utf8",
    });
    if (!xml.includes("<pane ") || !xml.includes('state="frozen"')) {
      issue(failures, "workbook_missing_frozen_headers", "workbook sheet lacks frozen header pane", {
        sheetNumber,
      });
    }
    if (!xml.includes("<cols>")) {
      issue(failures, "workbook_missing_column_widths", "workbook sheet lacks readable column width metadata", {
        sheetNumber,
      });
    }
    if (sheetNumber > 1 && !xml.includes("<autoFilter ")) {
      issue(failures, "workbook_missing_filters", "data-bearing workbook sheet lacks filters", {
        sheetNumber,
      });
    }
  }
}

function validateFieldSourceMap(failures, packageDir, indexes) {
  const workbookPath = path.join(packageDir, "PHS_Healthcare_Demo_Client_Data_Request.xlsx");
  const rows = readWorkbookSheetRows(workbookPath, 5);
  const [header = [], ...dataRows] = rows;
  const tabIndex = header.indexOf("tab");
  const exportIndex = header.indexOf("exact report/API/export name");
  const targetIndex = header.indexOf("target field");
  const nativeIndex = header.indexOf("native source field");
  const transformIndex = header.indexOf("transformation/mapping");
  const sourceIndex = header.indexOf("preferred source system");
  const objectIndex = header.indexOf("exact source object/table");
  const ownerIndex = header.indexOf("responsible collecting role");
  if ([tabIndex, exportIndex, targetIndex, nativeIndex, transformIndex, sourceIndex, objectIndex, ownerIndex].some((index) => index < 0)) {
    issue(failures, "field_source_map_header_missing", "field/source map lacks required guidance columns");
    return;
  }
  for (const row of dataRows) {
    const tab = row[tabIndex] || "";
    const source = row[sourceIndex] || "";
    if (/^(12_VENDORS|13_CONTRACT_FAMILIES|14_LEGAL_INSTRUMENTS|16_INVOICES_AND_SPEND|17_PURCHASE_ORDERS)/u.test(tab) && /Epic/iu.test(source)) {
      issue(failures, "inappropriate_epic_source_mapping", "non-clinical vendor/contract/finance tab maps to Epic", {
        tab,
        source,
      });
    }
    if (!source || !row[objectIndex] || !row[ownerIndex]) {
      issue(failures, "field_source_guidance_incomplete", "field/source guidance row lacks source, object or owner", {
        tab,
      });
    }
    if (!row[targetIndex] || !row[nativeIndex] || !row[transformIndex]) {
      issue(failures, "field_source_mapping_incomplete", "field/source row does not separate target field, native source field and transformation", {
        tab,
      });
    }
    const nativeField = row[nativeIndex] || "";
    if (nativeField !== "client_native_field_to_confirm") {
      const exportFiles = (row[exportIndex] || "")
        .split(";")
        .map((entry) => entry.trim())
        .filter((entry) => entry.endsWith(".csv"));
      const existsInNamedExtract = exportFiles.some((file) => indexes.columnsByBasename.get(file)?.has(nativeField));
      if (!existsInNamedExtract) {
        issue(failures, "native_source_field_missing", "field/source row names a native source field absent from the generated extract headers", {
          tab,
          nativeField,
          exportFiles,
        });
      }
    }
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
  const sourceExtractContracts = asArray(manifest.file_contracts).filter(
    (contract) => String(contract.path || "").startsWith("source_system_extracts/") && contract.format === "csv",
  );
  const sourceExtractBasenames = new Set(sourceExtractContracts.map((contract) => basename(contract.path)));
  for (const requiredFile of REQUIRED_CORE_SOURCE_EXTRACTS) {
    if (!sourceExtractBasenames.has(requiredFile)) {
      issue(failures, "missing_core_source_extract", "required core source-system extract is missing", {
        file: requiredFile,
      });
    }
  }
  for (const restrictedFile of RESTRICTED_DETAIL_SOURCE_EXTRACTS) {
    if (sourceExtractBasenames.has(restrictedFile)) {
      issue(failures, "restricted_detail_source_extract_present", "detailed health-plan operational extracts must stay out of the core Phase A package unless separately approved", {
        file: restrictedFile,
      });
    }
  }
  if (sourceExtractContracts.length < REQUIRED_CORE_SOURCE_EXTRACTS.size) {
    issue(failures, "source_system_core_extract_count_below_required", "source-system extract set is smaller than the required core enterprise package", {
      required_core_extracts: REQUIRED_CORE_SOURCE_EXTRACTS.size,
      actual: sourceExtractContracts.length,
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

function validateOptionalDomainExtracts(failures, indexes) {
  const snapshotRows = indexes.rowsByBasename.get(OPTIONAL_HEALTH_PLAN_SNAPSHOT) || [];
  if (snapshotRows.length === 0) return;
  if (snapshotRows.length > 25) {
    issue(failures, "optional_health_plan_snapshot_too_detailed", "optional health-plan outcome snapshot must stay lightweight and aggregate-only", {
      file: OPTIONAL_HEALTH_PLAN_SNAPSHOT,
      rows: snapshotRows.length,
      max_rows: 25,
    });
  }
  const columns = indexes.columnsByBasename.get(OPTIONAL_HEALTH_PLAN_SNAPSHOT) || new Set();
  for (const requiredColumn of [
    "health_plan_outcome_snapshot_id",
    "outcome_name",
    "outcome_category",
    "current_value_optional",
    "target_value_optional",
    "trend_state",
    "measurement_period",
    "data_owner_role",
    "evidence_status",
    "attestation_status",
    "decision_linkage",
    "sensitivity_classification",
  ]) {
    if (!columns.has(requiredColumn)) {
      issue(failures, "optional_health_plan_snapshot_missing_field", "optional health-plan outcome snapshot is missing an aggregate governance field", {
        file: OPTIONAL_HEALTH_PLAN_SNAPSHOT,
        field: requiredColumn,
      });
    }
  }
  for (const restrictedColumn of [
    "member_months",
    "claim_count",
    "allowed_amount",
    "paid_amount",
    "denied_claim_count",
    "risk_adjustment_gap_count",
    "numerator_count",
    "denominator_count",
    "observed_rate",
    "target_rate",
    "gap_to_target",
  ]) {
    if (columns.has(restrictedColumn)) {
      issue(failures, "restricted_health_plan_operational_field_present", "optional health-plan snapshot must not include detailed claims, enrollment or measure-performance operational fields", {
        file: OPTIONAL_HEALTH_PLAN_SNAPSHOT,
        field: restrictedColumn,
      });
    }
  }
}

export async function validatePackage(packageDir) {
  const failures = [];
  const warnings = [];
  const manifestPath = path.join(packageDir, "phs_healthcare_demo_package_manifest.json");
  const questionBankPath = path.join(packageDir, "phs_healthcare_demo_question_bank.json");
  const coveragePath = path.join(packageDir, "phs_healthcare_demo_question_coverage_matrix.json");
  const roleMatrixPath = path.join(packageDir, "phs_healthcare_demo_role_domain_matrix.json");
  const outcomeMapPath = path.join(packageDir, "phs_healthcare_demo_enterprise_outcomes_kpi_map.json");
  const manifest = await readJson(manifestPath);
  const questionBank = await readJson(questionBankPath);
  const coverageMatrix = await readJson(coveragePath);
  const roleMatrix = await readJson(roleMatrixPath);
  const outcomeMap = await readJson(outcomeMapPath);
  const seen = {
    storyThreads: new Set(),
    evidenceStates: new Set(),
    periodStarts: new Set(),
    periodEnds: new Set(),
    rowHashes: new Set(),
  };
  const allRows = [];
  const indexes = {
    rowsByBasename: new Map(),
    columnsByBasename: new Map(),
    recordToBasenames: new Map(),
    recordRows: new Map(),
    evidenceRefs: new Set(),
    evidenceRowsByRef: new Map(),
    vendorNames: [],
    contractNames: [],
  };
  let structuredRows = 0;

  for (const contract of manifest.file_contracts || []) {
    const filePath = path.join(packageDir, contract.path);
    const text = await fs.readFile(filePath, "utf8");
    checkNoSensitiveText(failures, contract.path, text);
    if (contract.format !== "csv") continue;
    const rows = parseCsv(text);
    const base = basename(contract.path);
    indexes.rowsByBasename.set(base, rows);
    indexes.columnsByBasename.set(base, new Set(rows.flatMap((row) => Object.keys(row))));
    for (const row of rows) {
      if (row.source_record_id) {
        if (!indexes.recordToBasenames.has(row.source_record_id)) indexes.recordToBasenames.set(row.source_record_id, new Set());
        indexes.recordToBasenames.get(row.source_record_id).add(base);
        if (!indexes.recordRows.has(row.source_record_id)) indexes.recordRows.set(row.source_record_id, []);
        indexes.recordRows.get(row.source_record_id).push({ file: base, row });
      }
      if (row.evidence_ref) indexes.evidenceRefs.add(row.evidence_ref);
      if (base === "EVIDENCE_SPANS.csv" && row.evidence_ref) {
        indexes.evidenceRefs.add(row.evidence_ref);
        indexes.evidenceRowsByRef.set(row.evidence_ref, row);
      }
      if (base === "WORKDAY_SUPPLIERS.csv" && row.legal_name) indexes.vendorNames.push(row.legal_name);
      if (base === "CONTRACT_REGISTER.csv" && row.contract_name) indexes.contractNames.push(row.contract_name);
    }
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
  validateOptionalDomainExtracts(failures, indexes);
  validateWorkbookOutcomeTab(failures, packageDir);
  validateWorkbookQuality(failures, packageDir);
  validateFieldSourceMap(failures, packageDir, indexes);
  validateOutcomeMapSubstance(failures, outcomeMap, indexes);
  validateQuestionBank(failures, questionBank, coverageMatrix, indexes);
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
      sourceSystemExtractCsvs: asArray(manifest.file_contracts).filter(
        (contract) => String(contract.path || "").startsWith("source_system_extracts/") && contract.format === "csv",
      ).length,
      coreSourceExtracts: REQUIRED_CORE_SOURCE_EXTRACTS.size,
      optionalHealthPlanOutcomeSnapshotRows: (indexes.rowsByBasename.get(OPTIONAL_HEALTH_PLAN_SNAPSHOT) || []).length,
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
  async function manifestFor(root) {
    return readJson(path.join(root, "phs_healthcare_demo_package_manifest.json"));
  }

  async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
  }

  async function mutateCsv(root, targetBase, mutateRows, { rehash = true } = {}) {
    const manifest = await manifestFor(root);
    const contract = (manifest.file_contracts || []).find((candidate) => basename(candidate.path) === targetBase);
    if (!contract) throw new Error(`Canary target CSV not found: ${targetBase}`);
    const filePath = path.join(root, contract.path);
    const rows = parseCsv(await fs.readFile(filePath, "utf8"));
    mutateRows(rows);
    if (rehash) {
      for (const row of rows) row.row_hash = canonicalRowHash(row);
    }
    await writeCsvFile(filePath, rows);
  }

  async function mutateAllCsv(root, mutateRows) {
    const manifest = await manifestFor(root);
    for (const contract of manifest.file_contracts || []) {
      if (contract.format !== "csv") continue;
      const filePath = path.join(root, contract.path);
      const rows = parseCsv(await fs.readFile(filePath, "utf8"));
      mutateRows(rows);
      for (const row of rows) row.row_hash = canonicalRowHash(row);
      await writeCsvFile(filePath, rows);
    }
  }

  async function runCanary({ defect, expected_failure, inject }) {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "phs-canary-"));
    try {
      await fs.cp(packageDir, tmp, { recursive: true });
      await inject(tmp);
      const result = await validatePackage(tmp);
      const observed = Array.from(new Set(result.failures.map((failure) => failure.code))).sort();
      return {
        defect,
        expected_failure,
        observed_failure_codes: observed,
        passed: observed.includes(expected_failure),
      };
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  }

  async function coverageMatrixFor(root) {
    return readJson(path.join(root, "phs_healthcare_demo_question_coverage_matrix.json"));
  }

  async function writeCoverageMatrix(root, matrix) {
    await writeJsonFile(path.join(root, "phs_healthcare_demo_question_coverage_matrix.json"), matrix);
  }

  async function rowsFor(root, targetBase) {
    const manifest = await manifestFor(root);
    const contract = (manifest.file_contracts || []).find((candidate) => basename(candidate.path) === targetBase);
    if (!contract) throw new Error(`Canary target CSV not found: ${targetBase}`);
    return parseCsv(await fs.readFile(path.join(root, contract.path), "utf8"));
  }

  function coverageByPredicate(matrix, predicate) {
    const coverage = matrix.coverage.find((candidate) => candidate.question_predicate === predicate);
    if (!coverage) throw new Error(`Coverage row not found for predicate ${predicate}`);
    return coverage;
  }

  const canaries = [
    {
      defect: "missing tenant key",
      expected_failure: "tenant_key_mismatch",
      inject: (root) => mutateCsv(root, "WORKDAY_SUPPLIERS.csv", (rows) => {
        rows[0].tenant_key = "";
      }),
    },
    {
      defect: "bad row hash",
      expected_failure: "bad_row_hash",
      inject: (root) => mutateCsv(root, "WORKDAY_SUPPLIERS.csv", (rows) => {
        rows[0].row_hash = "bad-row-hash";
      }, { rehash: false }),
    },
    {
      defect: "invalid source record path",
      expected_failure: "invalid_source_record_path",
      inject: (root) => mutateCsv(root, "WORKDAY_SUPPLIERS.csv", (rows) => {
        rows[0].source_record_url_or_path = "source://wrong-tenant/wrong-dataset/WORKDAY_SUPPLIERS.csv/VND-001";
      }),
    },
    {
      defect: "duplicate row hash",
      expected_failure: "duplicate_row_hash",
      inject: (root) => mutateCsv(root, "WORKDAY_SUPPLIERS.csv", (rows) => {
        rows[1].row_hash = rows[0].row_hash;
      }, { rehash: false }),
    },
    {
      defect: "duplicate native id",
      expected_failure: "duplicate_native_id",
      inject: (root) => mutateCsv(root, "WORKDAY_SUPPLIERS.csv", (rows) => {
        rows[1].vendor_id = rows[0].vendor_id;
      }),
    },
    {
      defect: "duplicate primary key",
      expected_failure: "duplicate_primary_key",
      inject: (root) => mutateCsv(root, "CONTRACT_INSTRUMENTS.csv", (rows) => {
        rows[1].instrument_id = rows[0].instrument_id;
      }),
    },
    {
      defect: "broken contract relationship",
      expected_failure: "broken_contract_relationship",
      inject: (root) => mutateCsv(root, "WORKDAY_SUPPLIER_INVOICES.csv", (rows) => {
        rows[0].contract_family_id = "CF-BAD";
      }),
    },
    {
      defect: "missing supplier event link",
      expected_failure: "missing_supplier_event_link",
      inject: (root) => mutateCsv(root, "BPO_SUPPLIER_RESPONSES.csv", (rows) => {
        rows[0].supplier_id = "BPO-Z";
      }),
    },
    {
      defect: "unsupported value claim",
      expected_failure: "unsupported_savings_language",
      inject: (root) => fs.writeFile(path.join(root, "canary-unsupported-value-claim.txt"), "This synthetic package has guaranteed savings."),
    },
    {
      defect: "PII email",
      expected_failure: "pii_email",
      inject: (root) => fs.writeFile(path.join(root, "canary-email.txt"), "Contact leader@example.com for source evidence."),
    },
    {
      defect: "suspected PHI",
      expected_failure: "suspected_phi_pii_marker",
      inject: (root) => fs.writeFile(path.join(root, "canary-phi.txt"), "Patient aggregate includes MRN marker."),
    },
    {
      defect: "incomplete role coverage",
      expected_failure: "incomplete_role_coverage",
      inject: async (root) => {
        const rolePath = path.join(root, "phs_healthcare_demo_role_domain_matrix.json");
        const roleMatrix = await readJson(rolePath);
        roleMatrix.roles[0].accountable_executive = "";
        await writeJsonFile(rolePath, roleMatrix);
      },
    },
    {
      defect: "CDAO below 50 questions",
      expected_failure: "cdao_question_count_below_50",
      inject: async (root) => {
        const rolePath = path.join(root, "phs_healthcare_demo_role_domain_matrix.json");
        const roleMatrix = await readJson(rolePath);
        roleMatrix.roles.find((role) => role.role === "CDAO").question_count = 49;
        await writeJsonFile(rolePath, roleMatrix);
      },
    },
    {
      defect: "missing source-system guidance",
      expected_failure: "missing_source_system_guidance",
      inject: async (root) => {
        const manifestPath = path.join(root, "phs_healthcare_demo_package_manifest.json");
        const manifest = await readJson(manifestPath);
        manifest.file_contracts[0].source_system = "";
        await writeJsonFile(manifestPath, manifest);
      },
    },
    {
      defect: "restricted detailed health-plan extract in core package",
      expected_failure: "restricted_detail_source_extract_present",
      inject: async (root) => {
        const manifestPath = path.join(root, "phs_healthcare_demo_package_manifest.json");
        const manifest = await readJson(manifestPath);
        const snapshotContract = (manifest.file_contracts || []).find((candidate) => basename(candidate.path) === OPTIONAL_HEALTH_PLAN_SNAPSHOT);
        if (!snapshotContract) throw new Error("Optional health-plan snapshot contract not found");
        const restrictedPath = "source_system_extracts/PAYER_CLAIMS_ENROLLMENT_MONTHLY.csv";
        await fs.copyFile(path.join(root, snapshotContract.path), path.join(root, restrictedPath));
        manifest.file_contracts.push({
          ...snapshotContract,
          path: restrictedPath,
          source_system: "Payer Claims Enrollment Analytics",
          source_object: "Claims Enrollment Monthly Aggregate",
        });
        manifest.counts_by_file[restrictedPath] = snapshotContract.expected_rows;
        await writeJsonFile(manifestPath, manifest);
      },
    },
    {
      defect: "optional health-plan snapshot too detailed",
      expected_failure: "optional_health_plan_snapshot_too_detailed",
      inject: (root) => mutateCsv(root, OPTIONAL_HEALTH_PLAN_SNAPSHOT, (rows) => {
        while (rows.length < 26) {
          const nextId = `HPO-X-${String(rows.length + 1).padStart(3, "0")}`;
          rows.push({
            ...rows[0],
            health_plan_outcome_snapshot_id: nextId,
            source_record_id: nextId,
            source_record_url_or_path: `source://${EXPECTED.tenantKey}/${EXPECTED.datasetId}/source_system_extracts/${OPTIONAL_HEALTH_PLAN_SNAPSHOT}/${nextId}`,
          });
        }
      }),
    },
    {
      defect: "missing required story domain",
      expected_failure: "missing_required_story_thread",
      inject: (root) => mutateAllCsv(root, (rows) => {
        for (const row of rows) {
          if (row.story_thread_ref === "data_analytics_managed_services_value_leakage") {
            row.story_thread_ref = "health_plan_analytics_and_cloud_decisions";
          }
        }
      }),
    },
    {
      defect: "incorrect time coverage",
      expected_failure: "missing_24_month_start",
      inject: (root) => mutateAllCsv(root, (rows) => {
        for (const row of rows) {
          if (row.period_start === EXPECTED.historyStart) row.period_start = "2024-09-01";
        }
      }),
    },
    {
      defect: "outcome map below range",
      expected_failure: "enterprise_outcomes_kpi_map_count_out_of_range",
      inject: async (root) => {
        const manifestPath = path.join(root, "phs_healthcare_demo_package_manifest.json");
        const outcomePath = path.join(root, "phs_healthcare_demo_enterprise_outcomes_kpi_map.json");
        const manifest = await readJson(manifestPath);
        const outcomeMap = await readJson(outcomePath);
        manifest.counts.enterprise_outcomes_kpi_map = 10;
        outcomeMap.record_count = 10;
        outcomeMap.rows = outcomeMap.rows.slice(0, 10);
        await writeJsonFile(manifestPath, manifest);
        await writeJsonFile(outcomePath, outcomeMap);
      },
    },
    {
      defect: "separate KPI value-driver tabs",
      expected_failure: "separate_kpi_value_driver_tabs_present",
      inject: async (root) => {
        const workbookPath = path.join(root, "PHS_Healthcare_Demo_Client_Data_Request.xlsx");
        const unzipDir = await fs.mkdtemp(path.join(os.tmpdir(), "phs-xlsx-canary-"));
        try {
          execFileSync("unzip", ["-q", workbookPath, "-d", unzipDir]);
          const workbookXmlPath = path.join(unzipDir, "xl", "workbook.xml");
          const xml = await fs.readFile(workbookXmlPath, "utf8");
          await fs.writeFile(workbookXmlPath, xml.replace('name="03_SOURCE_SYSTEM_INVENTORY"', 'name="KPI_CATALOG_LEGACY"'));
          await fs.rm(workbookPath, { force: true });
          execFileSync("zip", ["-qr", workbookPath, "."], { cwd: unzipDir });
        } finally {
          await fs.rm(unzipDir, { recursive: true, force: true });
        }
      },
    },
    {
      defect: "missing outcomes section in interview pack",
      expected_failure: "missing_outcomes_kpis_value_drivers_section",
      inject: async (root) => {
        const packPath = path.join(root, "interview_packs", "CDAO.json");
        const pack = await readJson(packPath);
        pack.questions = pack.questions.filter((question) => question.section !== "OUTCOMES, KPIS AND VALUE DRIVERS");
        await writeJsonFile(packPath, pack);
      },
    },
    {
      defect: "irrelevant hard-question coverage",
      expected_failure: "mapped_measure_missing",
      inject: async (root) => {
        const coveragePath = path.join(root, "phs_healthcare_demo_question_coverage_matrix.json");
        const matrix = await readJson(coveragePath);
        matrix.coverage[0].required_source_files = ["WORKDAY_SUPPLIERS.csv"];
        await writeJsonFile(coveragePath, matrix);
      },
    },
    {
      defect: "broken question-to-evidence lineage",
      expected_failure: "mapped_evidence_ref_missing",
      inject: async (root) => {
        const coveragePath = path.join(root, "phs_healthcare_demo_question_coverage_matrix.json");
        const matrix = await readJson(coveragePath);
        matrix.coverage[0].evidence_refs = ["EVID-SPAN-99999"];
        await writeJsonFile(coveragePath, matrix);
      },
    },
    {
      defect: "existing source record from wrong story thread",
      expected_failure: "planted_record_story_thread_mismatch",
      inject: async (root) => {
        const coveragePath = path.join(root, "phs_healthcare_demo_question_coverage_matrix.json");
        const matrix = await readJson(coveragePath);
        matrix.coverage[0].planted_scenario_records = ["WD-INV-L-000005", matrix.coverage[0].planted_scenario_records[1]];
        await writeJsonFile(coveragePath, matrix);
      },
    },
    {
      defect: "existing evidence reference from wrong contract family",
      expected_failure: "mapped_evidence_contract_mismatch",
      inject: async (root) => {
        const coveragePath = path.join(root, "phs_healthcare_demo_question_coverage_matrix.json");
        const matrix = await readJson(coveragePath);
        matrix.coverage[0].evidence_refs = ["EVID-SPAN-00002"];
        await writeJsonFile(coveragePath, matrix);
      },
    },
    {
      defect: "existing source record fails question predicate",
      expected_failure: "question_predicate_not_satisfied",
      inject: async (root) => {
        const coveragePath = path.join(root, "phs_healthcare_demo_question_coverage_matrix.json");
        const matrix = await readJson(coveragePath);
        const [invoiceId, rateCardId] = matrix.coverage[0].planted_scenario_records;
        await mutateCsv(root, "WORKDAY_SUPPLIER_INVOICES.csv", (rows) => {
          const row = rows.find((candidate) => candidate.invoice_line_id === invoiceId);
          if (row) row.rate_card_match_state = "matched_or_expected";
        });
        await mutateCsv(root, "CONTRACT_RATE_CARDS.csv", (rows) => {
          const row = rows.find((candidate) => candidate.rate_card_id === rateCardId);
          if (row) row.billed_rate_observed = String(Math.max(0, numberValue(row.contracted_rate) - 25));
        });
      },
    },
    {
      defect: "source and evidence records exist but do not join",
      expected_failure: "source_evidence_join_mismatch",
      inject: async (root) => {
        const coveragePath = path.join(root, "phs_healthcare_demo_question_coverage_matrix.json");
        const matrix = await readJson(coveragePath);
        matrix.coverage[0].evidence_refs = ["EVID-SPAN-00003"];
        await writeJsonFile(coveragePath, matrix);
      },
    },
    {
      defect: "same story different BPO supplier",
      expected_failure: "planted_source_join_mismatch",
      inject: async (root) => {
        const matrix = await coverageMatrixFor(root);
        const coverage = coverageByPredicate(matrix, "supplier_quality_tradeoff");
        const response = (await rowsFor(root, "BPO_SUPPLIER_RESPONSES.csv")).find((row) => row.source_record_id === coverage.planted_scenario_records[0]);
        const mismatchedScore = (await rowsFor(root, "BPO_EVALUATION_SCORES.csv")).find((row) => row.story_thread_ref === coverage.story_thread_ref && row.supplier_id !== response.supplier_id);
        coverage.planted_scenario_records = [response.source_record_id, mismatchedScore.source_record_id];
        await writeCoverageMatrix(root, matrix);
      },
    },
    {
      defect: "same contract different invoice",
      expected_failure: "planted_source_join_mismatch",
      inject: async (root) => {
        const matrix = await coverageMatrixFor(root);
        const coverage = coverageByPredicate(matrix, "finance_reconciliation_gap");
        const payment = (await rowsFor(root, "WORKDAY_PAYMENTS.csv")).find((row) => row.source_record_id === coverage.planted_scenario_records[0]);
        const mismatchedInvoice = (await rowsFor(root, "WORKDAY_SUPPLIER_INVOICES.csv")).find((row) => row.story_thread_ref === coverage.story_thread_ref && row.vendor_id === payment.vendor_id && row.invoice_id !== payment.invoice_id);
        coverage.planted_scenario_records = [payment.source_record_id, mismatchedInvoice.source_record_id];
        await writeCoverageMatrix(root, matrix);
      },
    },
    {
      defect: "same domain different item and facility",
      expected_failure: "planted_source_join_mismatch",
      inject: async (root) => {
        const matrix = await coverageMatrixFor(root);
        const coverage = coverageByPredicate(matrix, "substitution_cost");
        const substitution = (await rowsFor(root, "MEDSURG_BACKORDERS_SUBSTITUTIONS.csv")).find((row) => row.source_record_id === coverage.planted_scenario_records[0]);
        const mismatchedPurchase = (await rowsFor(root, "LOCAL_HOSPITAL_PURCHASES.csv")).find((row) => row.story_thread_ref === coverage.story_thread_ref && row.facility !== substitution.facility && row.item_id !== substitution.item_id);
        coverage.planted_scenario_records = [substitution.source_record_id, mismatchedPurchase.source_record_id];
        await writeCoverageMatrix(root, matrix);
      },
    },
    {
      defect: "same contract different document reference",
      expected_failure: "planted_source_join_mismatch",
      inject: async (root) => {
        const matrix = await coverageMatrixFor(root);
        const coverage = coverageByPredicate(matrix, "document_complete");
        const instrument = (await rowsFor(root, "CONTRACT_INSTRUMENTS.csv")).find((row) => row.source_record_id === coverage.planted_scenario_records[0]);
        const mismatchedEvidence = (await rowsFor(root, "EVIDENCE_SPANS.csv")).find((row) =>
          row.story_thread_ref === coverage.story_thread_ref &&
          row.contract_family_id === instrument.contract_family_id &&
          row.document_ref !== instrument.document_ref &&
          row.review_state === "audit_ready" &&
          asArray(coverage.expected_evidence_span_types).includes(row.span_type));
        coverage.planted_scenario_records = [instrument.source_record_id, mismatchedEvidence.source_record_id];
        coverage.evidence_refs = [mismatchedEvidence.evidence_ref];
        await writeCoverageMatrix(root, matrix);
      },
    },
    {
      defect: "correct span type with unrelated evidence subject",
      expected_failure: "mapped_evidence_subject_mismatch",
      inject: async (root) => {
        const matrix = await coverageMatrixFor(root);
        const coverage = matrix.coverage.find((candidate) => asArray(candidate.expected_evidence_subject_terms).length > 0 && asArray(candidate.evidence_refs).length > 0);
        await mutateCsv(root, "EVIDENCE_SPANS.csv", (rows) => {
          const evidence = rows.find((candidate) => candidate.evidence_ref === coverage.evidence_refs[0]);
          if (evidence) evidence.evidence_subject = "Cybersecurity managed detection SLA evidence unrelated to the planted business scenario.";
        });
      },
    },
  ];

  const outputs = [];
  for (const canary of canaries) outputs.push(await runCanary(canary));
  const failed = outputs.filter((output) => !output.passed);
  if (failed.length > 0) {
    throw new Error(`Corrupted canary validation did not observe expected failures: ${JSON.stringify(failed, null, 2)}`);
  }
  return outputs;
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
