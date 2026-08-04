import fs from "node:fs/promises";
import path from "node:path";

const BASE_DIR = path.join("docs", "source", "skyharbor-v4");
const DEFAULT_QUESTION_BANK = path.join(
  BASE_DIR,
  "source_v4_question_bank.json",
);
const DEFAULT_COVERAGE_MATRIX = path.join(
  BASE_DIR,
  "source_v4_question_coverage_matrix.json",
);
const DEFAULT_MODEL_FIT_AUDIT = path.join(
  BASE_DIR,
  "source_v4_model_fit_audit.json",
);
const EXPECTED_COUNT = 150;
const EXPECTED_TENANT = "skyharbor_global";
const EXPECTED_DATASET_VERSION = "v4";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const requiredQuestionFields = [
  "question_id",
  "domain",
  "question",
  "executive_intent",
  "required_source_domains",
  "required_measures",
  "required_dimensions",
  "required_grain",
  "required_story_thread",
  "required_evidence_depth",
  "expected_visual",
  "expected_drill_path",
  "allowed_conclusion",
  "prohibited_overstatement",
  "expected_action",
  "acceptance_rule",
];

const allowedSourceDomains = new Set([
  "supplier_master",
  "contract_header",
  "legal_evidence",
  "financial_line",
  "saas_usage",
  "cloud_consumption",
  "service_performance",
  "workforce_rate_card",
  "sourcing_event",
  "scope_mapping",
]);

const requiredStoryThreads = new Set([
  "saas_rationalization",
  "managed_service_value_leakage",
  "cloud_commitment_exposure",
  "app_retirement_contract_conflict",
  "ai_value_proof_gap",
  "supplier_bafo_normalization",
  "evidence_conflict_resolution",
]);

const allowedVisuals = new Set([
  "table",
  "waterfall",
  "time_series",
  "scatter",
  "sankey",
  "heatmap",
  "funnel",
  "evidence_drawer",
]);
const allowedFitStates = new Set(["covered", "partial", "gap"]);

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function notBlank(value) {
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value))
    return value.length > 0 && value.every((item) => notBlank(item));
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== null && value !== undefined;
}

function validateIdentity(name, artifact, failures) {
  if (artifact.tenant_key !== EXPECTED_TENANT)
    failures.push({
      artifact: name,
      issue: "tenant_key_mismatch",
      expected: EXPECTED_TENANT,
      actual: artifact.tenant_key,
    });
  if (artifact.dataset_version !== EXPECTED_DATASET_VERSION) {
    failures.push({
      artifact: name,
      issue: "dataset_version_mismatch",
      expected: EXPECTED_DATASET_VERSION,
      actual: artifact.dataset_version,
    });
  }
  if (!artifact.dataset_id)
    failures.push({ artifact: name, issue: "missing_dataset_id" });
  if (!artifact.contract_id)
    failures.push({ artifact: name, issue: "missing_contract_id" });
}

function validateQuestion(question, failures) {
  for (const field of requiredQuestionFields) {
    if (!notBlank(question[field]))
      failures.push({
        question_id: question.question_id || null,
        issue: "missing_or_blank_question_field",
        field,
      });
  }
  if (!/^SRCV4-\d{3}$/u.test(question.question_id || ""))
    failures.push({
      question_id: question.question_id || null,
      issue: "invalid_question_id_format",
    });
  if (question.question && !question.question.endsWith("?"))
    failures.push({
      question_id: question.question_id,
      issue: "question_text_must_end_with_question_mark",
    });
  for (const sourceDomain of question.required_source_domains || []) {
    if (!allowedSourceDomains.has(sourceDomain))
      failures.push({
        question_id: question.question_id,
        issue: "unknown_required_source_domain",
        sourceDomain,
      });
  }
  if (!allowedVisuals.has(question.expected_visual))
    failures.push({
      question_id: question.question_id,
      issue: "unknown_expected_visual",
      expected_visual: question.expected_visual,
    });
  const depth = question.required_evidence_depth || {};
  if (
    !Number.isInteger(depth.min_source_records) ||
    depth.min_source_records < 1
  ) {
    failures.push({
      question_id: question.question_id,
      issue: "invalid_required_evidence_depth_min_source_records",
    });
  }
  if (
    !Number.isInteger(depth.min_source_domains) ||
    depth.min_source_domains < 1
  ) {
    failures.push({
      question_id: question.question_id,
      issue: "invalid_required_evidence_depth_min_source_domains",
    });
  }
  if (
    depth.min_source_domains > (question.required_source_domains || []).length
  ) {
    failures.push({
      question_id: question.question_id,
      issue: "evidence_depth_exceeds_required_domains",
    });
  }
  if (
    !/(do not|must not|cannot|without|unless)/iu.test(
      question.prohibited_overstatement || "",
    )
  ) {
    failures.push({
      question_id: question.question_id,
      issue: "weak_prohibited_overstatement",
    });
  }
  if (
    !/(pass if|cites|source records|drill)/iu.test(
      question.acceptance_rule || "",
    )
  ) {
    failures.push({
      question_id: question.question_id,
      issue: "weak_acceptance_rule",
    });
  }
}

function validateMatrixRow(row, question, failures) {
  const prefix = {
    question_id: row?.question_id || question?.question_id || null,
  };
  if (!row) {
    failures.push({ ...prefix, issue: "missing_coverage_matrix_row" });
    return;
  }
  for (const field of [
    "required_source_files",
    "required_columns",
    "planted_scenario_records",
    "cube_view",
    "drill_members",
    "expected_answer",
    "evidence_requirement",
  ]) {
    if (!notBlank(row[field]))
      failures.push({
        ...prefix,
        issue: "missing_or_blank_matrix_field",
        field,
      });
  }
  for (const sourceDomain of question.required_source_domains || []) {
    if (!row.required_columns?.[sourceDomain]?.length)
      failures.push({
        ...prefix,
        issue: "matrix_missing_columns_for_required_domain",
        sourceDomain,
      });
  }
  for (const drillMember of question.expected_drill_path || []) {
    if (!row.drill_members?.includes(drillMember))
      failures.push({
        ...prefix,
        issue: "matrix_missing_question_drill_member",
        drillMember,
      });
  }
  if (row.evidence_requirement?.source_record_required !== true)
    failures.push({
      ...prefix,
      issue: "matrix_must_require_source_record_evidence",
    });
  if (row.evidence_requirement?.no_pii !== true)
    failures.push({ ...prefix, issue: "matrix_must_reject_pii" });
}

function validateModelFit(modelFit, questions, failures) {
  if (
    !Array.isArray(modelFit.observed_cube_views) ||
    modelFit.observed_cube_views.length < 8
  ) {
    failures.push({
      artifact: "model_fit_audit",
      issue: "too_few_observed_cube_views",
      actual: modelFit.observed_cube_views?.length || 0,
    });
  }
  const domains = new Map(
    (modelFit.domains || []).map((domain) => [domain.domain, domain]),
  );
  const questionDomains = new Set(questions.map((question) => question.domain));
  for (const domain of questionDomains) {
    const audit = domains.get(domain);
    if (!audit) {
      failures.push({
        artifact: "model_fit_audit",
        issue: "missing_domain_model_fit_audit",
        domain,
      });
      continue;
    }
    if (!allowedFitStates.has(audit.model_fit_state))
      failures.push({
        artifact: "model_fit_audit",
        issue: "invalid_model_fit_state",
        domain,
        state: audit.model_fit_state,
      });
    if (
      audit.model_fit_state !== "covered" &&
      !audit.required_next_views?.length
    ) {
      failures.push({
        artifact: "model_fit_audit",
        issue: "non_covered_domain_missing_required_next_views",
        domain,
      });
    }
    const actualQuestionCount = questions.filter(
      (question) => question.domain === domain,
    ).length;
    if (audit.question_count !== actualQuestionCount) {
      failures.push({
        artifact: "model_fit_audit",
        issue: "domain_question_count_mismatch",
        domain,
        expected: actualQuestionCount,
        actual: audit.question_count,
      });
    }
  }
}

async function main() {
  const questionBankPath = args.get("question-bank") || DEFAULT_QUESTION_BANK;
  const matrixPath = args.get("coverage-matrix") || DEFAULT_COVERAGE_MATRIX;
  const modelFitPath = args.get("model-fit") || DEFAULT_MODEL_FIT_AUDIT;

  const [questionBank, coverageMatrix, modelFitAudit] = await Promise.all([
    readJson(questionBankPath),
    readJson(matrixPath),
    readJson(modelFitPath),
  ]);
  const failures = [];
  validateIdentity("question_bank", questionBank, failures);
  validateIdentity("coverage_matrix", coverageMatrix, failures);
  validateIdentity("model_fit_audit", modelFitAudit, failures);

  const questions = questionBank.questions || [];
  if (questions.length !== EXPECTED_COUNT)
    failures.push({
      artifact: "question_bank",
      issue: "question_count_mismatch",
      expected: EXPECTED_COUNT,
      actual: questions.length,
    });
  if (questionBank.question_count !== EXPECTED_COUNT) {
    failures.push({
      artifact: "question_bank",
      issue: "declared_question_count_mismatch",
      expected: EXPECTED_COUNT,
      actual: questionBank.question_count,
    });
  }
  const ids = new Set();
  const duplicateIds = new Set();
  const questionTexts = new Set();
  const duplicateQuestionTexts = new Set();
  const domainCounts = new Map();
  const sourceDomainCoverage = new Set();
  const storyCoverage = new Set();
  for (const question of questions) {
    if (ids.has(question.question_id)) duplicateIds.add(question.question_id);
    ids.add(question.question_id);
    const normalizedText = String(question.question || "")
      .trim()
      .toLowerCase();
    if (questionTexts.has(normalizedText))
      duplicateQuestionTexts.add(question.question);
    questionTexts.add(normalizedText);
    domainCounts.set(
      question.domain,
      (domainCounts.get(question.domain) || 0) + 1,
    );
    for (const sourceDomain of question.required_source_domains || [])
      sourceDomainCoverage.add(sourceDomain);
    if (requiredStoryThreads.has(question.required_story_thread))
      storyCoverage.add(question.required_story_thread);
    validateQuestion(question, failures);
  }
  if (duplicateIds.size)
    failures.push({
      artifact: "question_bank",
      issue: "duplicate_question_ids",
      ids: [...duplicateIds].sort(),
    });
  if (duplicateQuestionTexts.size) {
    failures.push({
      artifact: "question_bank",
      issue: "duplicate_question_texts",
      questions: [...duplicateQuestionTexts].sort().slice(0, 10),
    });
  }
  for (const sourceDomain of allowedSourceDomains) {
    if (!sourceDomainCoverage.has(sourceDomain))
      failures.push({
        artifact: "question_bank",
        issue: "source_domain_not_covered",
        sourceDomain,
      });
  }
  for (const storyThread of requiredStoryThreads) {
    if (!storyCoverage.has(storyThread))
      failures.push({
        artifact: "question_bank",
        issue: "story_thread_not_covered",
        storyThread,
      });
  }
  for (const [domain, expected] of Object.entries(
    questionBank.distribution || {},
  )) {
    const actual = domainCounts.get(domain) || 0;
    if (actual !== expected)
      failures.push({
        artifact: "question_bank",
        issue: "distribution_mismatch",
        domain,
        expected,
        actual,
      });
  }

  const matrixRows = coverageMatrix.rows || [];
  if (matrixRows.length !== questions.length)
    failures.push({
      artifact: "coverage_matrix",
      issue: "matrix_row_count_mismatch",
      expected: questions.length,
      actual: matrixRows.length,
    });
  const matrixByQuestion = new Map(
    matrixRows.map((row) => [row.question_id, row]),
  );
  for (const question of questions)
    validateMatrixRow(
      matrixByQuestion.get(question.question_id),
      question,
      failures,
    );
  for (const row of matrixRows) {
    if (!ids.has(row.question_id))
      failures.push({
        artifact: "coverage_matrix",
        issue: "matrix_row_without_question",
        question_id: row.question_id,
      });
  }

  validateModelFit(modelFitAudit, questions, failures);

  const report = {
    ok: failures.length === 0,
    question_bank_path: path.resolve(questionBankPath),
    coverage_matrix_path: path.resolve(matrixPath),
    model_fit_audit_path: path.resolve(modelFitPath),
    question_count: questions.length,
    domain_count: domainCounts.size,
    source_domains_covered: [...sourceDomainCoverage].sort(),
    story_threads_covered: [...storyCoverage].sort(),
    failures,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      { ok: false, error: error.message, details: error.details || {} },
      null,
      2,
    ),
  );
  process.exit(1);
});
