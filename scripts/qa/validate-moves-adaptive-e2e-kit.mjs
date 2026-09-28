#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");
const DEFAULT_PACKAGE = path.join(
  REPO_ROOT,
  "tests/fixtures/moves-adaptive-e2e-kit",
);
const EXPECTED_UPLOADS = [
  "01_p1_charter/charter_decisions.md",
  "01_p1_charter/business_change_hypothesis.csv",
  "01_p1_charter/evidence_plan.csv",
  "01_p1_charter/red_lines_draft.csv",
  "02_p2_discover/operations_workshop_45m.md",
  "02_p2_discover/security_controls_session_20m.md",
  "02_p2_discover/monthly_kpi_baseline.csv",
  "02_p2_discover/metric_dictionary.csv",
  "02_p2_discover/conflict_register.csv",
  "02_p2_discover/workflow_walkthrough.csv",
  "02_p2_discover/system_inventory.csv",
  "02_p2_discover/knowledge_inventory.csv",
  "02_p2_discover/data_quality_lineage.csv",
  "02_p2_discover/red_lines_validated.csv",
];

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${path.basename(filePath)}: ${error.message}`);
    return null;
  }
}

function readCsv(filePath, errors) {
  try {
    const result = Papa.parse(fs.readFileSync(filePath, "utf8"), {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    if (result.errors.length) {
      errors.push(`${path.basename(filePath)}: ${result.errors[0].message}`);
    }
    return result.data;
  } catch (error) {
    errors.push(`${path.basename(filePath)}: ${error.message}`);
    return [];
  }
}

const number = (value) => Number(value);
const close = (actual, expected, tolerance = 0.011) =>
  Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;

function validateEstimate(packageRoot, errors) {
  const estimateDir = path.join(packageRoot, "04_p4_roadmap_estimate");
  const rows = readCsv(path.join(estimateDir, "internal_vs_vendor_estimate.csv"), errors);
  const summary = readCsv(path.join(estimateDir, "estimate_summary.csv"), errors);
  const grouped = new Map();
  const totals = {
    internal: { low: 0, base: 0, high: 0, aiSaved: 0, review: 0 },
    vendor: { low: 0, base: 0, high: 0, aiSaved: 0, review: 0 },
  };

  if (rows.length !== 14) errors.push(`Estimate must contain 14 role/scenario rows; found ${rows.length}.`);
  for (const [index, row] of rows.entries()) {
    const label = `Estimate row ${index + 2}`;
    const model = row.delivery_model;
    if (!row.work_package?.trim() || !row.lead_role?.trim()) errors.push(`${label}: work package and lead role are required.`);
    if (!row.evidence_basis?.trim() || !row.assumption?.trim()) errors.push(`${label}: both evidence basis and assumption must be stated.`);
    if (!row.confidence?.trim()) errors.push(`${label}: confidence is required.`);
    if (!['internal', 'vendor'].includes(model)) {
      errors.push(`${label}: delivery_model must be internal or vendor.`);
      continue;
    }
    const low = number(row.low_hours);
    const base = number(row.base_hours);
    const high = number(row.high_hours);
    const rate = number(row.planning_rate_usd_hour);
    const aiPct = number(row.ai_eligible_pct);
    const review = number(row.human_review_hours);
    if (![low, base, high, rate, aiPct, review].every(Number.isFinite)) {
      errors.push(`${label}: numeric inputs must be finite.`);
      continue;
    }
    if (!(0 <= low && low <= base && base <= high && rate > 0 && aiPct >= 0 && aiPct <= 100 && review >= 0)) {
      errors.push(`${label}: invalid hours range, rate, AI sensitivity, or review effort.`);
      continue;
    }
    const factor = 1 - aiPct / 100;
    const adjusted = [low, base, high].map((hours) => hours * factor + review);
    const expected = {
      ai_hours_saved_base: base * aiPct / 100,
      low_adjusted_hours: adjusted[0],
      base_adjusted_hours: adjusted[1],
      high_adjusted_hours: adjusted[2],
      low_cost_usd: adjusted[0] * rate,
      base_cost_usd: adjusted[1] * rate,
      high_cost_usd: adjusted[2] * rate,
    };
    for (const [field, value] of Object.entries(expected)) {
      if (!close(number(row[field]), value)) errors.push(`${label}: ${field} does not match the disclosed formula.`);
    }
    if (aiPct > 0 && !/claude code|codex/i.test(row.assumption)) {
      errors.push(`${label}: AI-assisted estimate must name Claude Code or Codex in its assumption.`);
    }
    const key = row.work_package;
    const pair = grouped.get(key) ?? new Set();
    if (pair.has(model)) errors.push(`${label}: duplicate ${model} scenario for ${key}.`);
    pair.add(model);
    grouped.set(key, pair);
    totals[model].low += expected.low_adjusted_hours;
    totals[model].base += expected.base_adjusted_hours;
    totals[model].high += expected.high_adjusted_hours;
    totals[model].aiSaved += expected.ai_hours_saved_base;
    totals[model].review += review;
  }

  for (const [workPackage, pair] of grouped) {
    if (pair.size !== 2) errors.push(`${workPackage}: internal and vendor alternatives must be comparable.`);
  }
  if (grouped.size !== 7) errors.push(`Expected 7 comparable work packages; found ${grouped.size}.`);

  const summaryByModel = new Map(summary.map((row) => [row.delivery_case, row]));
  for (const model of ['internal', 'vendor']) {
    const row = summaryByModel.get(model);
    if (!row) {
      errors.push(`Estimate summary is missing ${model}.`);
      continue;
    }
    const expected = {
      low_adjusted_hours: totals[model].low,
      base_adjusted_hours: totals[model].base,
      high_adjusted_hours: totals[model].high,
      ai_hours_saved_at_base: totals[model].aiSaved,
      human_review_hours: totals[model].review,
      low_planning_cost_usd: totals[model].low,
      base_planning_cost_usd: totals[model].base,
      high_planning_cost_usd: totals[model].high,
    };
    expected.low_planning_cost_usd = rows
      .filter((estimate) => estimate.delivery_model === model)
      .reduce((sum, estimate) => sum + number(estimate.low_cost_usd), 0);
    expected.base_planning_cost_usd = rows
      .filter((estimate) => estimate.delivery_model === model)
      .reduce((sum, estimate) => sum + number(estimate.base_cost_usd), 0);
    expected.high_planning_cost_usd = rows
      .filter((estimate) => estimate.delivery_model === model)
      .reduce((sum, estimate) => sum + number(estimate.high_cost_usd), 0);
    for (const [field, value] of Object.entries(expected)) {
      if (!close(number(row[field]), value, 0.02)) errors.push(`${model} summary ${field} does not reconcile to role rows.`);
    }
    if (!row.not_included?.trim()) errors.push(`${model} summary must list excluded commercial items.`);
  }
}

export function validatePackage(
  packageRoot = DEFAULT_PACKAGE,
  governanceManifestPath = path.join(
    REPO_ROOT,
    "docs/governance/dataset-manifests/nexus-moves-adaptive-e2e-synthetic-20260927.json",
  ),
) {
  const errors = [];
  const root = path.resolve(packageRoot);
  const uploadManifest = readJson(path.join(root, "00_demo/upload_manifest.json"), errors);
  const packageManifest = readJson(path.join(root, "package_manifest.json"), errors);
  const governanceManifest = readJson(governanceManifestPath, errors);

  if (uploadManifest) {
    const actual = (uploadManifest.primary_uploads ?? []).map((item) => item.path);
    if (JSON.stringify(actual) !== JSON.stringify(EXPECTED_UPLOADS)) {
      errors.push("Primary upload list differs from the reviewed 14-file P1/P2 allowlist.");
    }
    if (uploadManifest.default_review_state !== "pending") errors.push("Uploaded evidence must start pending human review.");
    for (const item of uploadManifest.primary_uploads ?? []) {
      const resolved = path.resolve(root, item.path);
      if (!resolved.startsWith(`${root}${path.sep}`)) errors.push(`Upload path escapes package: ${item.path}`);
      if (!fs.existsSync(resolved)) errors.push(`Upload file is missing: ${item.path}`);
      const expectedPhase = item.path.startsWith("01_p1_") ? 1 : item.path.startsWith("02_p2_") ? 2 : null;
      if (item.phase !== expectedPhase) errors.push(`Upload phase does not match the P1/P2 path: ${item.path}`);
      if (!['uploaded_evidence', 'session_artifact'].includes(item.evidence_type)) errors.push(`Unsupported evidence type: ${item.path}`);
      const sessionFile = /workshop|_session_/i.test(path.basename(item.path));
      const expectedType = sessionFile ? "session_artifact" : "uploaded_evidence";
      if (item.evidence_type !== expectedType) errors.push(`Upload type should be ${expectedType}: ${item.path}`);
    }
    for (const item of uploadManifest.exclusions ?? []) {
      if (item.endsWith("/")) continue;
      if ((uploadManifest.primary_uploads ?? []).some((upload) => upload.path === item)) errors.push(`Excluded file is also on the upload allowlist: ${item}`);
    }
  }

  if (packageManifest) {
    if (packageManifest.synthetic !== true || packageManifest.contains_phi !== false || packageManifest.contains_real_personal_data !== false) {
      errors.push("Package must remain synthetic, PHI-free, and free of real personal data.");
    }
    if (packageManifest.loading_status !== "offline_only_not_loaded_not_indexed_not_agent_ready" || packageManifest.agent_ready !== false || packageManifest.registry_activation !== false) {
      errors.push("Fixture must remain offline and not agent-ready until governed review and indexing proofs exist.");
    }
  }

  if (governanceManifest) {
    if (governanceManifest.client_key !== null || governanceManifest.tenant_scope !== "move_registry") {
      errors.push("Move-scoped fixture manifest must not pin a tenant identity.");
    }
    if (governanceManifest.expected_object_count !== EXPECTED_UPLOADS.length) errors.push("Governance manifest object count must match the upload allowlist.");
  }

  const routeCasesPath = path.join(root, "90_QA_ONLY/route_switch_scenarios.csv");
  const routeCases = readCsv(routeCasesPath, errors);
  const expectedRoutes = new Set(["technical_product", "process_change", "operating_model_change", "unresolved"]);
  for (const route of expectedRoutes) {
    if (!routeCases.some((row) => row.expected_route === route)) errors.push(`Adaptive-route smoke case is missing ${route}.`);
  }
  if (!fs.existsSync(path.join(root, "06_technical_only_case/intake.md"))) errors.push("Separate technical-only route fixture is missing.");
  validateEstimate(root, errors);
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validatePackage(process.argv[2] ?? DEFAULT_PACKAGE, process.argv[3]);
  if (errors.length) {
    console.error(`Moves adaptive E2E kit failed validation (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Moves adaptive E2E kit valid: ${EXPECTED_UPLOADS.length} allowlisted inputs; adaptive routes and estimate arithmetic reconcile.`);
  }
}
