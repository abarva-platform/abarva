#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_PACKAGE_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_ASSESSMENT_ID = "meridian-tower-layer2-source-adapters-v2026-08";
const DEFAULT_BUILD_VERSION = "tower-layer3-canonical-v2026-08";
const DEFAULT_INPUT_SOURCE_VERSION = "tower-layer1-v2026-08-business-case";
const DEFAULT_OUT_DIR = path.join(ROOT, "reports/meridian-tower-layer3-canonical");
const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";
const TRUTHY = new Set(["1", "true", "yes", "on"]);

const CANONICAL_FILES = {
  budgets: "canonical_budgets.csv",
  projects: "canonical_projects.csv",
  aiUseCases: "canonical_ai_use_cases.csv",
  tools: "canonical_tools.csv",
  valueObservations: "canonical_monthly_value_observations.csv",
  approvalEvents: "canonical_finance_approval_events.csv",
  evidenceItems: "canonical_evidence_items.csv",
  relationships: "canonical_relationships.csv",
};

const SOURCE_RELATIVE_PREFIX = "layer_1_client_intake/source_system_extracts";

const PHYSICAL_OBJECT_TYPE_BY_CANONICAL_TYPE = new Map([
  ["budget", "metric"],
  ["value_observation", "metric"],
  ["finance_approval_event", "control"],
  ["evidence_item", "control"],
]);

const EXPECTED_OBJECT_SEMANTIC_TYPES = {
  budget: 8,
  program: 140,
  ai_use_case: 42,
  ai_tool: 13,
  value_observation: 504,
  finance_approval_event: 84,
  evidence_item: 196,
};

const METRIC_DEFINITIONS = [
  ["approved_it_budget_usd", "Approved IT budget", "Approved IT budget for the domain.", "USD", "neutral", "annual", "sum"],
  ["tower_reviewed_project_budget_usd", "Tower reviewed project budget", "Project budget in Tower review scope.", "USD", "neutral", "annual", "sum"],
  ["project_approved_budget_usd", "Project approved budget", "Approved capital for a project.", "USD", "neutral", "annual", "sum"],
  ["project_promised_annual_value_low_usd", "Project promised annual value low", "Low-case annual value promised for the project.", "USD", "higher_is_better", "annual", "sum"],
  ["use_case_promised_annual_value_low_usd", "Use case promised annual value low", "Low-case annual value promised in the business case.", "USD", "higher_is_better", "annual", "sum"],
  ["use_case_promised_annual_value_high_usd", "Use case promised annual value high", "High-case annual value promised in the business case.", "USD", "higher_is_better", "annual", "sum"],
  ["use_case_roi_low_multiple", "Use case ROI low multiple", "Low-case value multiple against the approved project investment.", "multiple", "higher_is_better", "annual", "avg"],
  ["use_case_roi_high_multiple", "Use case ROI high multiple", "High-case value multiple against the approved project investment.", "multiple", "higher_is_better", "annual", "avg"],
  ["payback_months_target", "Target payback months", "Target months for promised value to repay the investment.", "months", "lower_is_better", "point_in_time", "avg"],
  ["readiness_score", "Readiness score", "Execution readiness score derived from source discovery fields.", "score_0_100", "higher_is_better", "point_in_time", "avg"],
  ["linked_business_case_count", "Linked business cases", "Business cases linked to a tool rollout.", "count", "higher_is_better", "point_in_time", "sum"],
  ["rollout_target_users", "Rollout target users", "Target users for an AI tool rollout.", "users", "higher_is_better", "point_in_time", "sum"],
  ["monthly_active_users", "Monthly active users", "Active users observed in the latest tool usage source.", "users", "higher_is_better", "monthly", "sum"],
  ["adoption_target_pct", "Adoption target percent", "Target adoption percent for a tool rollout.", "percent", "higher_is_better", "point_in_time", "avg"],
  ["adoption_actual_pct", "Adoption actual percent", "Observed adoption percent for a tool rollout.", "percent", "higher_is_better", "monthly", "avg"],
  ["sponsor_claimed_value_usd", "Sponsor claimed value", "Value claimed by the business sponsor for a reporting month.", "USD", "higher_is_better", "monthly", "sum"],
  ["finance_reviewed_value_usd", "Finance reviewed value", "Value reviewed by Finance for a reporting month.", "USD", "higher_is_better", "monthly", "sum"],
  ["finance_validated_value_usd", "Finance validated value", "Value Finance has validated for a reporting month.", "USD", "higher_is_better", "monthly", "sum"],
  ["board_claimable_value_usd", "Board claimable value", "Validated value cleared for board-level reporting.", "USD", "higher_is_better", "monthly", "sum"],
  ["finance_approval_amount_usd", "Finance approval amount", "Amount attached to a finance approval event.", "USD", "higher_is_better", "point_in_time", "sum"],
];

const LIFECYCLE_STATE_MAP = new Map([
  ["business_case", "candidate"],
  ["build", "planned"],
  ["controlled_rollout", "current"],
  ["funded", "planned"],
  ["intake", "candidate"],
  ["pilot", "current"],
  ["scale", "current"],
]);

const REVIEW_STATE_MAP = new Map([
  ["cfo_approved_target", "confirmed"],
  ["challenge", "in_review"],
  ["continue", "confirmed"],
  ["defer", "blocked"],
  ["finance_challenged", "in_review"],
  ["finance_validated_actual", "confirmed"],
  ["fund", "confirmed"],
  ["not_submitted", "not_reviewed"],
  ["not_yet_measurable", "not_reviewed"],
  ["shape", "in_review"],
  ["sponsor_claimed", "in_review"],
]);

function envFlag(name) {
  return TRUTHY.has(String(process.env[name] ?? "").trim().toLowerCase());
}

function argValue(argv, name) {
  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function gitSha() {
  const operatorCommit = process.env.ABARVA_OPERATOR_BRANCH_COMMIT?.trim();
  if (operatorCommit) return operatorCommit;
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function parseArgs(argv) {
  return {
    packageDir: path.resolve(argValue(argv, "--package-dir") ?? process.env.TOWER_LAYER3_PACKAGE_DIR ?? DEFAULT_PACKAGE_DIR),
    outDir: path.resolve(argValue(argv, "--out-dir") ?? process.env.TOWER_LAYER3_OUT_DIR ?? DEFAULT_OUT_DIR),
    tenantKey: argValue(argv, "--tenant-key") ?? process.env.TOWER_LAYER3_TENANT_KEY ?? DEFAULT_TENANT_KEY,
    assessmentId:
      argValue(argv, "--assessment-id") ?? process.env.TOWER_LAYER3_ASSESSMENT_ID ?? DEFAULT_ASSESSMENT_ID,
    buildVersion:
      argValue(argv, "--build-version") ?? process.env.TOWER_LAYER3_BUILD_VERSION ?? DEFAULT_BUILD_VERSION,
    inputSourceVersion:
      argValue(argv, "--input-source-version") ??
      process.env.TOWER_LAYER3_INPUT_SOURCE_VERSION ??
      DEFAULT_INPUT_SOURCE_VERSION,
    idempotencyKey:
      argValue(argv, "--idempotency-key") ??
      process.env.TOWER_LAYER3_IDEMPOTENCY_KEY ??
      `${DEFAULT_BUILD_VERSION}:${gitSha()}`,
    write: argv.includes("--write") || envFlag("TOWER_LAYER3_WRITE"),
    emitProofBundle: argv.includes("--emit-proof-bundle") || envFlag("TOWER_LAYER3_EMIT_PROOF_BUNDLE"),
    readbackOnly: argv.includes("--readback-only"),
  };
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableUuid(...parts) {
  const hex = sha256Text(parts.join("|")).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
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
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift()?.map((value) => value.trim()) ?? [];
  return rows
    .filter((cells) => cells.some((cell) => String(cell).trim()))
    .map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function sqlText(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  if (value === null || value === undefined || value === "") return "null";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "null";
}

function sqlJson(value) {
  return `${sqlText(stableJson(value))}::jsonb`;
}

function insertSql(table, columns, rows, batchSize = 500) {
  if (!rows.length) return `-- no rows for ${table}\n`;
  const chunks = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const values = batch.map((row) => `(${columns.map((column) => row[column]).join(", ")})`).join(",\n");
    chunks.push(`insert into ${table} (${columns.join(", ")}) values\n${values};`);
  }
  return `${chunks.join("\n")}\n`;
}

function upsertSql(table, columns, rows, conflictClause, batchSize = 500) {
  if (!rows.length) return `-- no rows for ${table}\n`;
  const chunks = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const values = batch.map((row) => `(${columns.map((column) => row[column]).join(", ")})`).join(",\n");
    chunks.push(`insert into ${table} (${columns.join(", ")}) values\n${values}\n${conflictClause};`);
  }
  return `${chunks.join("\n")}\n`;
}

function ensureTenant(rows, tenantKey, label) {
  const badRows = rows.filter((row) => row.tenant_key !== tenantKey);
  if (badRows.length) throw new Error(`${label} contains ${badRows.length} row(s) outside tenant ${tenantKey}`);
}

function sourceRecordUuid(tenantKey, assessmentId, sourceFile, sourceRow, sourceRecordId) {
  return stableUuid(
    "source_record",
    tenantKey,
    assessmentId,
    `${SOURCE_RELATIVE_PREFIX}/${sourceFile}`,
    Number(sourceRow),
    sourceRecordId,
  );
}

function readCanonicalPackage(options) {
  const layerDir = path.join(options.packageDir, "layer_3_canonical");
  const packageManifest = JSON.parse(fs.readFileSync(path.join(options.packageDir, "package_manifest.json"), "utf8"));
  if (packageManifest.tenant_key !== options.tenantKey) {
    throw new Error(`Package tenant ${packageManifest.tenant_key} does not match requested ${options.tenantKey}`);
  }
  const read = (name) => {
    const rows = readCsv(path.join(layerDir, name));
    ensureTenant(rows, options.tenantKey, name);
    return rows;
  };
  return {
    packageManifest,
    budgets: read(CANONICAL_FILES.budgets),
    projects: read(CANONICAL_FILES.projects),
    aiUseCases: read(CANONICAL_FILES.aiUseCases),
    tools: read(CANONICAL_FILES.tools),
    valueObservations: read(CANONICAL_FILES.valueObservations),
    approvalEvents: read(CANONICAL_FILES.approvalEvents),
    evidenceItems: read(CANONICAL_FILES.evidenceItems),
    relationships: read(CANONICAL_FILES.relationships),
  };
}

function objectUuid(options, objectType, canonicalId) {
  return stableUuid("object", options.tenantKey, options.assessmentId, physicalObjectType(objectType), canonicalId);
}

function physicalObjectType(objectType) {
  return PHYSICAL_OBJECT_TYPE_BY_CANONICAL_TYPE.get(objectType) ?? objectType;
}

function reviewStateFrom(value) {
  return REVIEW_STATE_MAP.get(String(value ?? "").trim()) ?? "in_review";
}

function lifecycleStateFrom(...values) {
  for (const value of values) {
    const mapped = LIFECYCLE_STATE_MAP.get(String(value ?? "").trim());
    if (mapped) return mapped;
  }
  return "current";
}

function confidenceNumber(value) {
  if (value === "high") return "0.8500";
  if (value === "medium") return "0.6500";
  if (value === "low") return "0.4000";
  return "0.6000";
}

function numericPresent(value) {
  return value !== null && value !== undefined && String(value).trim() !== "" && Number.isFinite(Number(value));
}

function objectRow(options, objectType, canonicalId, displayName, source, attrs = {}, domain = null, review = "in_review") {
  const physicalType = physicalObjectType(objectType);
  return {
    id: sqlText(objectUuid(options, physicalType, canonicalId)),
    tenant_key: sqlText(options.tenantKey),
    assessment_id: sqlText(options.assessmentId),
    object_key: sqlText(canonicalId),
    object_type: sqlText(physicalType),
    display_name: sqlText(displayName),
    business_domain: sqlText(domain),
    lifecycle_state: sqlText(lifecycleStateFrom(attrs.lifecycle_stage, attrs.rollout_stage)),
    source_record_id: sqlText(sourceRecordUuid(options.tenantKey, options.assessmentId, source.source_file, source.source_row, source.source_record_id)),
    basis: sqlText("source_recorded"),
    value_state: sqlText("known"),
    review_state: sqlText(review),
    confidence: confidenceNumber(attrs.confidence_level ?? attrs.confidence),
    __canonicalSemanticType: objectType,
    attributes_json: sqlJson({
      ...attrs,
      canonical_semantic_type: objectType,
      layer3_build_version: options.buildVersion,
      input_source_version: options.inputSourceVersion,
      canonical_source_file: source.source_file,
      canonical_source_row: source.source_row,
      canonical_source_system: source.source_system,
      canonical_source_record_id: source.source_record_id,
    }),
  };
}

function measureRow(options, subjectObjectType, subjectCanonicalId, metricKey, value, source, attrs = {}, valueState = "known", qualityState = "usable", reviewState = "in_review") {
  return {
    id: sqlText(stableUuid("measure", options.tenantKey, options.assessmentId, subjectObjectType, subjectCanonicalId, metricKey, attrs.period_start ?? "", attrs.period_end ?? "", source.source_record_id)),
    tenant_key: sqlText(options.tenantKey),
    assessment_id: sqlText(options.assessmentId),
    subject_object_id: sqlText(objectUuid(options, subjectObjectType, subjectCanonicalId)),
    metric_key: sqlText(metricKey),
    value_number: valueState === "known" || valueState === "estimated" ? sqlNum(value) : "null",
    value_text: "null",
    unit: sqlText(metricUnit(metricKey)),
    period_start: sqlText(attrs.period_start),
    period_end: sqlText(attrs.period_end),
    scenario: sqlText(attrs.scenario ?? "current"),
    source_record_id: sqlText(sourceRecordUuid(options.tenantKey, options.assessmentId, source.source_file, source.source_row, source.source_record_id)),
    document_extraction_id: "null",
    basis: sqlText(attrs.basis ?? "source_recorded"),
    value_state: sqlText(valueState),
    quality_state: sqlText(qualityState),
    review_state: sqlText(reviewState),
    attributes_json: sqlJson({
      ...attrs,
      layer3_build_version: options.buildVersion,
      input_source_version: options.inputSourceVersion,
    }),
  };
}

function metricUnit(metricKey) {
  return METRIC_DEFINITIONS.find(([key]) => key === metricKey)?.[3] ?? "count";
}

function addNumericMeasure(rows, options, subjectObjectType, subjectCanonicalId, metricKey, value, source, attrs = {}, valueState = "known", qualityState = "usable", reviewState = "in_review") {
  if (!numericPresent(value)) return;
  rows.push(measureRow(options, subjectObjectType, subjectCanonicalId, metricKey, value, source, attrs, valueState, qualityState, reviewState));
}

function assertObjectSemanticCounts(objectSemanticTypes) {
  for (const [semanticType, expectedCount] of Object.entries(EXPECTED_OBJECT_SEMANTIC_TYPES)) {
    const actualCount = Number(objectSemanticTypes[semanticType] ?? 0);
    if (actualCount !== expectedCount) {
      throw new Error(`Layer 3 semantic count drift: ${semanticType} expected ${expectedCount}, got ${actualCount}`);
    }
  }
  const unexpectedTypes = Object.keys(objectSemanticTypes).filter(
    (semanticType) => EXPECTED_OBJECT_SEMANTIC_TYPES[semanticType] === undefined,
  );
  if (unexpectedTypes.length) {
    throw new Error(`Layer 3 unexpected semantic object types: ${unexpectedTypes.sort().join(", ")}`);
  }
}

function buildCanonicalRows(options) {
  const data = readCanonicalPackage(options);
  const objects = [];
  const measures = [];
  const relationships = [];
  const objectAliasToId = new Map();
  const countsBySourceFile = {};

  const register = (alias, objectType, canonicalId) => {
    objectAliasToId.set(alias, objectUuid(options, objectType, canonicalId));
    objectAliasToId.set(canonicalId, objectUuid(options, objectType, canonicalId));
  };
  const trackSource = (sourceFile) => {
    countsBySourceFile[sourceFile] = (countsBySourceFile[sourceFile] ?? 0) + 1;
  };

  for (const row of data.budgets) {
    register(row.canonical_budget_id, "budget", row.canonical_budget_id);
    objects.push(objectRow(options, "budget", row.canonical_budget_id, `${row.domain_name} budget ${row.fiscal_year}`, row, row, row.domain_key, "confirmed"));
    addNumericMeasure(measures, options, "budget", row.canonical_budget_id, "approved_it_budget_usd", row.approved_budget_usd, row, { fiscal_year: row.fiscal_year, scenario: "current" }, "known", "usable", "confirmed");
    addNumericMeasure(measures, options, "budget", row.canonical_budget_id, "tower_reviewed_project_budget_usd", row.tower_reviewed_project_budget_usd, row, { fiscal_year: row.fiscal_year, scenario: "current" }, "known", "usable", "confirmed");
    trackSource(row.source_file);
  }

  for (const row of data.projects) {
    register(row.canonical_project_id, "program", row.canonical_project_id);
    register(row.project_id, "program", row.canonical_project_id);
    objects.push(objectRow(options, "program", row.canonical_project_id, row.project_name, row, row, row.domain_key, reviewStateFrom(row.committee_decision)));
    addNumericMeasure(measures, options, "program", row.canonical_project_id, "project_approved_budget_usd", row.approved_budget_usd, row, { scenario: "current", project_classification: row.project_classification }, "known", "usable", "confirmed");
    if (row.is_ai_related === "true" && Number(row.projected_annual_value_low_usd) > 0) {
      addNumericMeasure(measures, options, "program", row.canonical_project_id, "project_promised_annual_value_low_usd", row.projected_annual_value_low_usd, row, { scenario: "planned", project_classification: row.project_classification }, "estimated", "estimated", "in_review");
    }
    trackSource(row.source_file);
  }

  for (const row of data.aiUseCases) {
    register(row.canonical_ai_use_case_id, "ai_use_case", row.canonical_ai_use_case_id);
    register(row.business_case_id, "ai_use_case", row.canonical_ai_use_case_id);
    objects.push(objectRow(options, "ai_use_case", row.canonical_ai_use_case_id, row.initiative_name, row, row, row.domain_key, reviewStateFrom(row.finance_status)));
    const directValue = row.business_value_type !== "Foundation";
    if (directValue) {
      addNumericMeasure(measures, options, "ai_use_case", row.canonical_ai_use_case_id, "use_case_promised_annual_value_low_usd", row.projected_annual_value_low_usd, row, { scenario: "planned", business_value_type: row.business_value_type }, "estimated", "estimated", reviewStateFrom(row.finance_status));
      addNumericMeasure(measures, options, "ai_use_case", row.canonical_ai_use_case_id, "use_case_promised_annual_value_high_usd", row.projected_annual_value_high_usd, row, { scenario: "planned", business_value_type: row.business_value_type }, "estimated", "estimated", reviewStateFrom(row.finance_status));
      addNumericMeasure(measures, options, "ai_use_case", row.canonical_ai_use_case_id, "use_case_roi_low_multiple", row.roi_low_multiple, row, { scenario: "planned" }, "estimated", "estimated", reviewStateFrom(row.finance_status));
      addNumericMeasure(measures, options, "ai_use_case", row.canonical_ai_use_case_id, "use_case_roi_high_multiple", row.roi_high_multiple, row, { scenario: "planned" }, "estimated", "estimated", reviewStateFrom(row.finance_status));
      addNumericMeasure(measures, options, "ai_use_case", row.canonical_ai_use_case_id, "payback_months_target", row.payback_months_target, row, { scenario: "target" }, "estimated", "estimated", reviewStateFrom(row.finance_status));
    }
    addNumericMeasure(measures, options, "ai_use_case", row.canonical_ai_use_case_id, "readiness_score", row.readiness_score, row, { scenario: "current" }, "known", "usable", reviewStateFrom(row.finance_status));
    trackSource(row.source_file);
  }

  for (const row of data.tools) {
    register(row.canonical_tool_id, "ai_tool", row.canonical_tool_id);
    register(row.tool_rollout_id, "ai_tool", row.canonical_tool_id);
    objects.push(objectRow(options, "ai_tool", row.canonical_tool_id, row.tool_name, row, row, row.domain_key, "in_review"));
    addNumericMeasure(measures, options, "ai_tool", row.canonical_tool_id, "linked_business_case_count", row.linked_business_case_count, row, { scenario: "current" }, "known", "usable", "in_review");
    addNumericMeasure(measures, options, "ai_tool", row.canonical_tool_id, "rollout_target_users", row.rollout_target_users, row, { scenario: "target" }, "known", "usable", "in_review");
    addNumericMeasure(measures, options, "ai_tool", row.canonical_tool_id, "monthly_active_users", row.monthly_active_users, row, { scenario: "actual" }, "known", "usable", "in_review");
    addNumericMeasure(measures, options, "ai_tool", row.canonical_tool_id, "adoption_target_pct", row.adoption_target_pct, row, { scenario: "target" }, "known", "usable", "in_review");
    addNumericMeasure(measures, options, "ai_tool", row.canonical_tool_id, "adoption_actual_pct", row.adoption_actual_pct, row, { scenario: "actual" }, "known", "usable", "in_review");
    trackSource(row.source_file);
  }

  for (const row of data.valueObservations) {
    register(row.canonical_value_observation_id, "value_observation", row.canonical_value_observation_id);
    register(row.source_record_id, "value_observation", row.canonical_value_observation_id);
    objects.push(objectRow(options, "value_observation", row.canonical_value_observation_id, `${row.business_case_id} value ${row.reporting_month}`, row, row, null, reviewStateFrom(row.validation_state)));
    const attrs = { period_start: `${row.reporting_month}-01`, period_end: `${row.reporting_month}-28`, reporting_month: row.reporting_month, validation_state: row.validation_state, scenario: "actual" };
    const quality = row.validation_state === "finance_validated_actual" ? "usable" : row.validation_state === "sponsor_claimed" ? "estimated" : "insufficient";
    const review = reviewStateFrom(row.validation_state);
    addNumericMeasure(measures, options, "value_observation", row.canonical_value_observation_id, "sponsor_claimed_value_usd", row.sponsor_claimed_value_usd, row, attrs, "known", quality, review);
    addNumericMeasure(measures, options, "value_observation", row.canonical_value_observation_id, "finance_reviewed_value_usd", row.finance_reviewed_value_usd, row, attrs, "known", quality, review);
    addNumericMeasure(measures, options, "value_observation", row.canonical_value_observation_id, "finance_validated_value_usd", row.finance_validated_value_usd, row, attrs, "known", quality, review);
    addNumericMeasure(measures, options, "value_observation", row.canonical_value_observation_id, "board_claimable_value_usd", row.board_claimable_value_usd, row, attrs, "known", quality, review);
    trackSource(row.source_file);
  }

  for (const row of data.approvalEvents) {
    register(row.canonical_approval_event_id, "finance_approval_event", row.canonical_approval_event_id);
    objects.push(objectRow(options, "finance_approval_event", row.canonical_approval_event_id, `${row.business_case_id} ${row.event_type}`, row, row, null, reviewStateFrom(row.approval_state)));
    addNumericMeasure(measures, options, "finance_approval_event", row.canonical_approval_event_id, "finance_approval_amount_usd", row.amount_usd, row, { event_type: row.event_type, approval_state: row.approval_state, amount_basis: row.amount_basis, event_date: row.event_date, scenario: "current" }, "known", row.approval_state === "finance_validated_actual" ? "usable" : "estimated", reviewStateFrom(row.approval_state));
    trackSource(row.source_file);
  }

  for (const row of data.evidenceItems) {
    register(row.canonical_evidence_id, "evidence_item", row.canonical_evidence_id);
    register(row.evidence_id, "evidence_item", row.canonical_evidence_id);
    objects.push(objectRow(options, "evidence_item", row.canonical_evidence_id, row.evidence_name, row, row, null, row.freshness_state === "current" ? "confirmed" : "in_review"));
    trackSource(row.source_file);
  }

  for (const row of data.relationships) {
    const relation = canonicalRelationship(row, objectAliasToId);
    if (!relation) continue;
    relationships.push({
      id: sqlText(stableUuid("relationship", options.tenantKey, options.assessmentId, relation.fromId, relation.type, relation.toId, row.source_file, row.source_record_id)),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      from_object_id: sqlText(relation.fromId),
      relationship_type: sqlText(relation.type),
      to_object_id: sqlText(relation.toId),
      direction_label: sqlText(relation.label),
      source_record_id: sqlText(sourceRecordUuid(options.tenantKey, options.assessmentId, row.source_file, sourceRowForRelationship(data, row), row.source_record_id)),
      basis: sqlText("source_recorded"),
      value_state: sqlText("known"),
      review_state: sqlText("in_review"),
      confidence: "0.6500",
      attributes_json: sqlJson({
        layer3_build_version: options.buildVersion,
        input_source_version: options.inputSourceVersion,
        source_relationship_type: row.relationship_type,
        source_from_object_type: row.from_object_type,
        source_to_object_type: row.to_object_type,
        quality_state: row.quality_state,
        as_of_date: row.as_of_date,
      }),
    });
  }

  const metricDefinitions = METRIC_DEFINITIONS.map(([key, name, definition, unit, directionality, cadence, aggregationRule]) => ({
    id: sqlText(stableUuid("metric_definition", options.tenantKey, key)),
    tenant_key: sqlText(options.tenantKey),
    metric_key: sqlText(key),
    metric_name: sqlText(name),
    definition: sqlText(definition),
    unit: sqlText(unit),
    directionality: sqlText(directionality),
    cadence: sqlText(cadence),
    aggregation_rule: sqlText(aggregationRule),
  }));

  const objectTypes = objects.reduce((acc, row) => {
    const type = row.object_type.replace(/^'|'$/g, "");
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
  const objectSemanticTypes = objects.reduce((acc, row) => {
    acc[row.__canonicalSemanticType] = (acc[row.__canonicalSemanticType] ?? 0) + 1;
    return acc;
  }, {});
  assertObjectSemanticCounts(objectSemanticTypes);

  return {
    data,
    objects,
    measures,
    relationships,
    metricDefinitions,
    countsBySourceFile,
    objectTypes,
    objectSemanticTypes,
  };
}

function sourceRowForRelationship(data, relationshipRow) {
  const collections = [
    data.projects,
    data.aiUseCases,
    data.tools,
    data.valueObservations,
    data.approvalEvents,
    data.evidenceItems,
    data.budgets,
  ];
  for (const rows of collections) {
    const found = rows.find((row) => row.source_file === relationshipRow.source_file && row.source_record_id === relationshipRow.source_record_id);
    if (found?.source_row) return found.source_row;
  }
  throw new Error(`Relationship source row not found for ${relationshipRow.source_file}:${relationshipRow.source_record_id}`);
}

function canonicalRelationship(row, objectAliasToId) {
  const fromId = objectAliasToId.get(row.from_object_id);
  const toId = objectAliasToId.get(row.to_object_id);
  if (row.relationship_type === "implements" && fromId && toId) {
    return { fromId, type: "CHANGES", toId, label: "implements" };
  }
  if (row.relationship_type === "supports" && fromId && toId) {
    return { fromId: toId, type: "SUPPORTED_BY", toId: fromId, label: "supported by" };
  }
  throw new Error(`Cannot canonicalize relationship ${row.from_object_id} ${row.relationship_type} ${row.to_object_id}`);
}

function writeLoadSql(outPath, options, rows) {
  const tenant = sqlText(options.tenantKey);
  const assessment = sqlText(options.assessmentId);
  const metricSql = upsertSql(
    "ecl_context.metric_definition",
    ["id", "tenant_key", "metric_key", "metric_name", "definition", "unit", "directionality", "cadence", "aggregation_rule"],
    rows.metricDefinitions,
    "on conflict (tenant_key, metric_key) do update set metric_name = excluded.metric_name, definition = excluded.definition, unit = excluded.unit, directionality = excluded.directionality, cadence = excluded.cadence, aggregation_rule = excluded.aggregation_rule",
  );

  const sql = [
    "begin;",
    `delete from ecl_context.measure where tenant_key = ${tenant} and assessment_id = ${assessment} and attributes_json ->> 'layer3_build_version' = ${sqlText(options.buildVersion)};`,
    `delete from ecl_context.relationship where tenant_key = ${tenant} and assessment_id = ${assessment} and attributes_json ->> 'layer3_build_version' = ${sqlText(options.buildVersion)};`,
    upsertSql(
      "ecl_context.object",
      ["id", "tenant_key", "assessment_id", "object_key", "object_type", "display_name", "business_domain", "lifecycle_state", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
      rows.objects,
      "on conflict (tenant_key, assessment_id, object_type, object_key) do update set display_name = excluded.display_name, business_domain = excluded.business_domain, lifecycle_state = excluded.lifecycle_state, source_record_id = excluded.source_record_id, basis = excluded.basis, value_state = excluded.value_state, review_state = excluded.review_state, confidence = excluded.confidence, attributes_json = excluded.attributes_json, updated_at = now()",
    ),
    metricSql,
    insertSql(
      "ecl_context.measure",
      ["id", "tenant_key", "assessment_id", "subject_object_id", "metric_key", "value_number", "value_text", "unit", "period_start", "period_end", "scenario", "source_record_id", "document_extraction_id", "basis", "value_state", "quality_state", "review_state", "attributes_json"],
      rows.measures,
    ),
    insertSql(
      "ecl_context.relationship",
      ["id", "tenant_key", "assessment_id", "from_object_id", "relationship_type", "to_object_id", "direction_label", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
      rows.relationships,
    ),
    "commit;",
  ].join("\n");
  fs.writeFileSync(outPath, sql, "utf8");
}

function readbackSql(options) {
  const tenant = sqlText(options.tenantKey);
  const assessment = sqlText(options.assessmentId);
  const buildVersion = sqlText(options.buildVersion);
  return `
with readback as (
  select jsonb_build_object(
    'tenant_key', ${tenant},
    'assessment_id', ${assessment},
    'source_records_available', (
      select count(*) from ecl_source.source_record
      where tenant_key = ${tenant} and assessment_id = ${assessment}
    ),
    'object', (
      select count(*) from ecl_context.object
      where tenant_key = ${tenant} and assessment_id = ${assessment}
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
    ),
    'relationship', (
      select count(*) from ecl_context.relationship
      where tenant_key = ${tenant} and assessment_id = ${assessment}
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
    ),
    'measure', (
      select count(*) from ecl_context.measure
      where tenant_key = ${tenant} and assessment_id = ${assessment}
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
    ),
    'metric_definition', (
      select count(*) from ecl_context.metric_definition
      where tenant_key = ${tenant}
        and metric_key in (${METRIC_DEFINITIONS.map(([key]) => sqlText(key)).join(", ")})
    ),
    'objects_by_type', (
      select coalesce(jsonb_object_agg(object_type, row_count), '{}'::jsonb)
      from (
        select object_type, count(*) as row_count
        from ecl_context.object
        where tenant_key = ${tenant} and assessment_id = ${assessment}
          and attributes_json ->> 'layer3_build_version' = ${buildVersion}
        group by object_type
      ) counts
    ),
    'objects_by_semantic_type', (
      select coalesce(jsonb_object_agg(canonical_semantic_type, row_count), '{}'::jsonb)
      from (
        select canonical_semantic_type, count(*) as row_count
        from ecl_context.object
        where tenant_key = ${tenant} and assessment_id = ${assessment}
          and attributes_json ->> 'layer3_build_version' = ${buildVersion}
          and coalesce(canonical_semantic_type, '') <> ''
        group by canonical_semantic_type
      ) counts
    ),
    'objects_missing_semantic_type', (
      select count(*) from ecl_context.object
      where tenant_key = ${tenant} and assessment_id = ${assessment}
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
        and coalesce(canonical_semantic_type, '') = ''
    ),
    'objects_missing_semantic_type_attribute', (
      select count(*) from ecl_context.object
      where tenant_key = ${tenant} and assessment_id = ${assessment}
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
        and coalesce(attributes_json ->> 'canonical_semantic_type', '') = ''
    ),
    'objects_semantic_column_json_mismatch', (
      select count(*) from ecl_context.object
      where tenant_key = ${tenant} and assessment_id = ${assessment}
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
        and canonical_semantic_type <> attributes_json ->> 'canonical_semantic_type'
    ),
    'measures_by_metric', (
      select coalesce(jsonb_object_agg(metric_key, row_count), '{}'::jsonb)
      from (
        select metric_key, count(*) as row_count
        from ecl_context.measure
        where tenant_key = ${tenant} and assessment_id = ${assessment}
          and attributes_json ->> 'layer3_build_version' = ${buildVersion}
        group by metric_key
      ) counts
    ),
    'objects_missing_source_record', (
      select count(*) from ecl_context.object
      where tenant_key = ${tenant} and assessment_id = ${assessment} and source_record_id is null
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
    ),
    'relationships_missing_source_record', (
      select count(*) from ecl_context.relationship
      where tenant_key = ${tenant} and assessment_id = ${assessment} and source_record_id is null
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
    ),
    'measures_missing_source_record', (
      select count(*) from ecl_context.measure
      where tenant_key = ${tenant} and assessment_id = ${assessment} and source_record_id is null
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
    ),
    'tenant_payload_drift', (
      select count(*) from ecl_context.object
      where tenant_key = ${tenant}
        and assessment_id = ${assessment}
        and attributes_json ->> 'layer3_build_version' = ${buildVersion}
        and attributes_json ? 'tenant_key'
        and attributes_json ->> 'tenant_key' <> ${tenant}
    ),
    'canonical_to_source_gap', (
      select count(*)
      from ecl_context.object o
      where o.tenant_key = ${tenant}
        and o.assessment_id = ${assessment}
        and o.attributes_json ->> 'layer3_build_version' = ${buildVersion}
        and not exists (
          select 1
          from ecl_source.source_record sr
          where sr.tenant_key = o.tenant_key
            and sr.assessment_id = o.assessment_id
            and sr.id = o.source_record_id
        )
    ),
    'product_projection_rows_written', 0
  ) as payload
)
select payload::text from readback;
`.trim();
}

function writeReadbackSql(outPath, options) {
  fs.writeFileSync(outPath, `${readbackSql(options)}\n`, "utf8");
}

function expectedCounts(rows) {
  return {
    source_records_available: 1981,
    object: rows.objects.length,
    relationship: rows.relationships.length,
    measure: rows.measures.length,
    metric_definition: rows.metricDefinitions.length,
    objects_by_type: rows.objectTypes,
    objects_by_semantic_type: rows.objectSemanticTypes,
  };
}

function validateReadback(readback, expected) {
  const issues = [];
  for (const key of ["source_records_available", "object", "relationship", "measure", "metric_definition"]) {
    if (Number(readback[key]) !== Number(expected[key])) {
      issues.push(`${key}_expected_${expected[key]}_got_${readback[key]}`);
    }
  }
  for (const [type, count] of Object.entries(expected.objects_by_type)) {
    if (Number(readback.objects_by_type?.[type] ?? 0) !== Number(count)) {
      issues.push(`object_type_${type}_expected_${count}_got_${readback.objects_by_type?.[type] ?? 0}`);
    }
  }
  for (const [semanticType, count] of Object.entries(expected.objects_by_semantic_type)) {
    if (Number(readback.objects_by_semantic_type?.[semanticType] ?? 0) !== Number(count)) {
      issues.push(`semantic_type_${semanticType}_expected_${count}_got_${readback.objects_by_semantic_type?.[semanticType] ?? 0}`);
    }
  }
  if (Number(readback.objects_missing_semantic_type ?? 1) !== 0) issues.push("objects_missing_semantic_type");
  if (Number(readback.objects_missing_semantic_type_attribute ?? 1) !== 0) issues.push("objects_missing_semantic_type_attribute");
  if (Number(readback.objects_semantic_column_json_mismatch ?? 1) !== 0) issues.push("objects_semantic_column_json_mismatch");
  if (Number(readback.objects_missing_source_record ?? 1) !== 0) issues.push("objects_missing_source_record");
  if (Number(readback.relationships_missing_source_record ?? 1) !== 0) issues.push("relationships_missing_source_record");
  if (Number(readback.measures_missing_source_record ?? 1) !== 0) issues.push("measures_missing_source_record");
  if (Number(readback.tenant_payload_drift ?? 1) !== 0) issues.push("tenant_payload_drift");
  if (Number(readback.canonical_to_source_gap ?? 1) !== 0) issues.push("canonical_to_source_gap");
  if (Number(readback.product_projection_rows_written ?? 1) !== 0) issues.push("product_projection_rows_written");
  return issues;
}

function run(command, label, outDir, sensitive = false) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, PGCONNECT_TIMEOUT: process.env.PGCONNECT_TIMEOUT ?? "30" },
  });
  fs.writeFileSync(path.join(outDir, `${label}.stdout.log`), sensitive ? "<redacted>\n" : result.stdout, "utf8");
  fs.writeFileSync(path.join(outDir, `${label}.stderr.log`), sensitive ? "<redacted>\n" : result.stderr, "utf8");
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${(result.stderr || result.stdout).slice(0, 1200)}`);
  }
  return result.stdout;
}

function runPsqlFile(databaseUrl, sqlPath, outDir, label) {
  return run(["psql", databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], label, outDir, true);
}

function runPsqlReadback(databaseUrl, options, outDir) {
  const stdout = run(["psql", databaseUrl, "-v", "ON_ERROR_STOP=1", "-At", "-c", readbackSql(options)], "03-readback", outDir);
  const parsed = JSON.parse(stdout.trim());
  fs.writeFileSync(path.join(outDir, "03-readback.json"), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function emitProofBundle(outDir) {
  const tarPath = path.join(os.tmpdir(), `meridian-tower-layer3-proof-${Date.now()}.tgz`);
  const rootName = path.basename(outDir);
  const result = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), rootName], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr || "proof bundle tar failed");
  process.stdout.write(`${PROOF_BEGIN}\n`);
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write(`\n${PROOF_END}\n`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  fs.mkdirSync(options.outDir, { recursive: true });

  const rows = buildCanonicalRows(options);
  const expected = expectedCounts(rows);
  const loadSqlPath = path.join(options.outDir, "tower_layer3_ecl_context_load.sql");
  const readbackSqlPath = path.join(options.outDir, "tower_layer3_ecl_context_readback.sql");
  writeLoadSql(loadSqlPath, options, rows);
  writeReadbackSql(readbackSqlPath, options);

  const summary = {
    generated_at: new Date().toISOString(),
    status: "dry_run_ready",
    boundary: {
      layer: "layer_3_canonical",
      azure_write_requested: options.write,
      source_layer_written: false,
      product_projection_written: false,
      cube_layer_written: false,
    },
    job_contract: {
      job_name: process.env.ACA_OPERATOR_JOB ?? "job-abarva-private-operator-eus",
      tenant_scope: options.tenantKey,
      assessment_id: options.assessmentId,
      build_version: options.buildVersion,
      input_source_version: options.inputSourceVersion,
      idempotency_key: options.idempotencyKey,
      operator_identity: process.env.USER ?? "unknown",
      git_sha: gitSha(),
      image_digest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? null,
    },
    package_dir: options.packageDir,
    out_dir: options.outDir,
    expected_counts: expected,
    counts_by_source_file: rows.countsBySourceFile,
    load_sql: loadSqlPath,
    readback_sql: readbackSqlPath,
    readback: null,
    issues: [],
  };

  if (options.write || options.readbackOnly) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --write or --readback-only");
  }

  if (options.write) {
    if (!envFlag("TOWER_LAYER3_AZURE_WRITE_APPROVED")) {
      throw new Error("Refusing Azure write without TOWER_LAYER3_AZURE_WRITE_APPROVED=true");
    }
    runPsqlFile(process.env.DATABASE_URL, loadSqlPath, options.outDir, "02-load");
    summary.status = "write_applied";
  }

  if (options.write || options.readbackOnly) {
    const readback = runPsqlReadback(process.env.DATABASE_URL, options, options.outDir);
    summary.readback = readback;
    summary.issues = validateReadback(readback, expected);
    summary.status = summary.issues.length ? "failed" : options.write ? "write_verified" : "readback_verified";
  }

  writeJson(path.join(options.outDir, "tower_layer3_ecl_context_load_summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));

  if (options.emitProofBundle) emitProofBundle(options.outDir);
  if (summary.issues.length) process.exitCode = 1;
}

main();
