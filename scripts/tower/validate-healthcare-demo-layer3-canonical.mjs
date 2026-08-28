#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_PACKAGE_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);
const DEFAULT_SUMMARY = "/tmp/tower-layer3-local-proof-v1/tower_layer3_ecl_context_load_summary.json";
const DEFAULT_READBACK = "/tmp/tower-layer3-local-proof-v1/postgres_readback.json";

const FILES = {
  budgets: "canonical_budgets.csv",
  projects: "canonical_projects.csv",
  aiUseCases: "canonical_ai_use_cases.csv",
  tools: "canonical_tools.csv",
  valueObservations: "canonical_monthly_value_observations.csv",
  approvalEvents: "canonical_finance_approval_events.csv",
  evidenceItems: "canonical_evidence_items.csv",
  relationships: "canonical_relationships.csv",
};

const EXPECTED_OBJECT_SEMANTIC_TYPES = {
  budget: 8,
  program: 140,
  ai_use_case: 42,
  ai_tool: 13,
  value_observation: 504,
  finance_approval_event: 84,
  evidence_item: 196,
};

function argValue(argv, name, fallback) {
  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(name);
  if (index === -1) return fallback;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
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

function readJsonIfPresent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sum(rows, field) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

function gate(gates, id, pass, detail) {
  gates.push({ id, status: pass ? "PASS" : "FAIL", detail });
}

function exactCountMatch(actualCounts, expectedCounts) {
  const expectedKeys = Object.keys(expectedCounts).sort();
  const actualKeys = Object.keys(actualCounts ?? {}).sort();
  if (expectedKeys.join("|") !== actualKeys.join("|")) return false;
  return expectedKeys.every((key) => Number(actualCounts?.[key] ?? 0) === Number(expectedCounts[key]));
}

function formatCounts(counts) {
  return Object.entries(counts ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

function main() {
  const argv = process.argv.slice(2);
  const packageDir = path.resolve(argValue(argv, "--package-dir", process.env.TOWER_LAYER3_PACKAGE_DIR ?? DEFAULT_PACKAGE_DIR));
  const summaryPath = argValue(argv, "--summary", process.env.TOWER_LAYER3_SUMMARY ?? DEFAULT_SUMMARY);
  const readbackPath = argValue(argv, "--readback", process.env.TOWER_LAYER3_READBACK ?? DEFAULT_READBACK);

  const layerDir = path.join(packageDir, "layer_3_canonical");
  const rows = Object.fromEntries(
    Object.entries(FILES).map(([key, fileName]) => [key, readCsv(path.join(layerDir, fileName))]),
  );
  const summary = readJsonIfPresent(summaryPath);
  const readback = readJsonIfPresent(readbackPath);
  const gates = [];

  const aiProjects = rows.projects.filter((row) => row.is_ai_related === "true");
  const valueBearingAiProjects = aiProjects.filter((row) => Number(row.projected_annual_value_low_usd) > 0);
  const nonAiProjects = rows.projects.filter((row) => row.is_ai_related !== "true");
  const directValueUseCases = rows.aiUseCases.filter((row) => row.business_value_type !== "Foundation");
  const foundationUseCases = rows.aiUseCases.filter((row) => row.business_value_type === "Foundation");
  const validatedObservations = rows.valueObservations.filter((row) => row.validation_state === "finance_validated_actual");
  const sourceSemanticCounts = {
    budget: rows.budgets.length,
    program: rows.projects.length,
    ai_use_case: rows.aiUseCases.length,
    ai_tool: rows.tools.length,
    value_observation: rows.valueObservations.length,
    finance_approval_event: rows.approvalEvents.length,
    evidence_item: rows.evidenceItems.length,
  };

  gate(gates, "canonical_budget_rows", rows.budgets.length === 8, `${rows.budgets.length} budget domain rows`);
  gate(gates, "canonical_project_rows", rows.projects.length === 140, `${rows.projects.length} total IT project rows`);
  gate(gates, "canonical_ai_project_subset", aiProjects.length === 42 && nonAiProjects.length === 98, `${aiProjects.length} AI-related projects; ${nonAiProjects.length} non-AI projects`);
  gate(gates, "canonical_ai_use_case_rows", rows.aiUseCases.length === 42, `${rows.aiUseCases.length} AI use cases`);
  gate(gates, "canonical_tool_rows", rows.tools.length === 13, `${rows.tools.length} AI tool rollouts`);
  gate(gates, "canonical_monthly_observation_rows", rows.valueObservations.length === 504, `${rows.valueObservations.length} monthly value observations`);
  gate(gates, "canonical_finance_event_rows", rows.approvalEvents.length === 84, `${rows.approvalEvents.length} finance approval events`);
  gate(gates, "canonical_evidence_rows", rows.evidenceItems.length === 196, `${rows.evidenceItems.length} evidence items`);
  gate(gates, "canonical_relationship_rows", rows.relationships.length === 280, `${rows.relationships.length} relationship rows`);
  gate(gates, "canonical_semantic_object_counts", exactCountMatch(sourceSemanticCounts, EXPECTED_OBJECT_SEMANTIC_TYPES), formatCounts(sourceSemanticCounts));
  gate(gates, "non_ai_projects_do_not_claim_value", sum(nonAiProjects, "projected_annual_value_low_usd") === 0, `$${sum(nonAiProjects, "projected_annual_value_low_usd")} promised value on non-AI rows`);
  gate(gates, "foundation_cases_separate_from_roi", foundationUseCases.length === 14 && directValueUseCases.length === 28, `${foundationUseCases.length} foundation cases; ${directValueUseCases.length} direct-value cases`);
  gate(gates, "validated_value_is_separate_observation", validatedObservations.length === 10, `${validatedObservations.length} finance-validated monthly observations`);
  gate(gates, "promised_value_exceeds_ai_investment", sum(valueBearingAiProjects, "projected_annual_value_low_usd") > sum(aiProjects, "approved_budget_usd") * 3, `$${sum(valueBearingAiProjects, "projected_annual_value_low_usd")} promised low-case value against $${sum(aiProjects, "approved_budget_usd")} AI project budget`);

  if (summary) {
    const expected = summary.expected_counts ?? {};
    gate(gates, "summary_status", ["dry_run_ready", "readback_verified", "write_verified"].includes(summary.status), `summary status ${summary.status ?? "missing"}`);
    gate(gates, "summary_boundary", summary.boundary?.layer === "layer_3_canonical" && summary.boundary?.source_layer_written === false && summary.boundary?.product_projection_written === false && summary.boundary?.cube_layer_written === false, "Layer 3 only; no source, projection, or cube writes");
    gate(gates, "summary_object_count", Number(expected.object) === 987, `${expected.object ?? "missing"} expected canonical objects`);
    gate(gates, "summary_relationship_count", Number(expected.relationship) === 280, `${expected.relationship ?? "missing"} expected relationships`);
    gate(gates, "summary_metric_definition_count", Number(expected.metric_definition) === 20, `${expected.metric_definition ?? "missing"} expected metric definitions`);
    gate(gates, "summary_measure_count_present", Number(expected.measure) > 2500, `${expected.measure ?? "missing"} expected measures`);
    gate(gates, "summary_semantic_object_counts", exactCountMatch(expected.objects_by_semantic_type, EXPECTED_OBJECT_SEMANTIC_TYPES), formatCounts(expected.objects_by_semantic_type));
  } else {
    gate(gates, "summary_present", false, `missing ${summaryPath}`);
  }

  if (readback) {
    gate(gates, "readback_source_records_available", Number(readback.source_records_available) === 1981, `${readback.source_records_available} Layer 2 source records available`);
    gate(gates, "readback_object_count", Number(readback.object) === Number(summary?.expected_counts?.object), `${readback.object} canonical objects`);
    gate(gates, "readback_relationship_count", Number(readback.relationship) === Number(summary?.expected_counts?.relationship), `${readback.relationship} relationships`);
    gate(gates, "readback_measure_count", Number(readback.measure) === Number(summary?.expected_counts?.measure), `${readback.measure} measures`);
    gate(gates, "readback_metric_definition_count", Number(readback.metric_definition) === Number(summary?.expected_counts?.metric_definition), `${readback.metric_definition} metric definitions`);
    gate(gates, "readback_semantic_object_counts", exactCountMatch(readback.objects_by_semantic_type, EXPECTED_OBJECT_SEMANTIC_TYPES), formatCounts(readback.objects_by_semantic_type));
    gate(gates, "readback_no_missing_semantic_type", Number(readback.objects_missing_semantic_type) === 0, `${readback.objects_missing_semantic_type ?? "missing"} objects missing canonical semantic type`);
    gate(gates, "readback_no_missing_lineage", Number(readback.objects_missing_source_record) === 0 && Number(readback.relationships_missing_source_record) === 0 && Number(readback.measures_missing_source_record) === 0, "no object, relationship, or measure lineage gaps");
    gate(gates, "readback_no_tenant_or_source_drift", Number(readback.tenant_payload_drift) === 0 && Number(readback.canonical_to_source_gap) === 0, "no tenant payload drift or canonical-source gap");
    gate(gates, "readback_no_product_projection", Number(readback.product_projection_rows_written) === 0, "no Layer 4 projection rows written");
  } else {
    gate(gates, "readback_present", false, `missing ${readbackPath}`);
  }

  const result = {
    status: gates.every((item) => item.status === "PASS") ? "PASS" : "FAIL",
    packageDir,
    summaryPath,
    readbackPath,
    gates,
  };
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "PASS") process.exitCode = 1;
}

main();
