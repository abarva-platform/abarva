#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateAiBusinessCaseFieldSurvival } from "./validate-ai-business-case-field-survival.mjs";
import { validateToolRolloutFieldSurvival } from "./validate-tool-rollout-field-survival.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const PACKAGE_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);

const EXPECTED = {
  tenantKey: "meridian-health",
  totalItBudgetUsd: 1_050_000_000,
  reviewedProjectUsd: 703_100_000,
  projectRows: 140,
  monthlyPeriods: 12,
};

const REQUIRED_FILES = [
  "README.md",
  "00_layer1_readme.csv",
  "20_it_budget_by_domain.csv",
  "21_it_project_portfolio.csv",
  "22_ai_business_cases.csv",
  "23_ai_tool_rollout.csv",
  "24_monthly_value_tracking.csv",
  "25_finance_approval_ledger.csv",
  "26_evidence_register.csv",
  "layer_1_client_intake/00_layer1_readme.csv",
  "layer_1_client_intake/LAYER_1_SIGNOFF.md",
  "layer_1_client_intake/source_file_manifest.csv",
  "layer_1_client_intake/source_system_extracts/20_it_budget_by_domain.csv",
  "layer_1_client_intake/source_system_extracts/21_it_project_portfolio.csv",
  "layer_1_client_intake/source_system_extracts/22_ai_business_cases.csv",
  "layer_1_client_intake/source_system_extracts/23_ai_tool_rollout.csv",
  "layer_1_client_intake/source_system_extracts/24_monthly_value_tracking.csv",
  "layer_1_client_intake/source_system_extracts/25_finance_approval_ledger.csv",
  "layer_1_client_intake/source_system_extracts/26_evidence_register.csv",
  "layer_2_source_adapters/adapter_runs.csv",
  "layer_2_source_adapters/adapter_emitted_objects.csv",
  "layer_2_source_adapters/LAYER_2_SIGNOFF.md",
  "layer_3_canonical/canonical_budgets.csv",
  "layer_3_canonical/canonical_projects.csv",
  "layer_3_canonical/canonical_ai_use_cases.csv",
  "layer_3_canonical/canonical_tools.csv",
  "layer_3_canonical/canonical_monthly_value_observations.csv",
  "layer_3_canonical/canonical_finance_approval_events.csv",
  "layer_3_canonical/canonical_evidence_items.csv",
  "layer_3_canonical/canonical_relationships.csv",
  "layer_3_canonical/LAYER_3_SIGNOFF.md",
  "cube/tower_ai_case_cube.csv",
  "cube/tower_ai_portfolio_cube.csv",
  "cube/tower_ai_tool_rollout_cube.csv",
  "cube/cube_measures.csv",
  "cube/cube_dimensions.csv",
  "cube/cube_gate_flags.csv",
  "layer_4_read_models/tower_executive_summary.csv",
  "layer_4_read_models/tower_ai_initiatives_table.csv",
  "layer_4_read_models/tower_tools_table.csv",
  "layer_4_read_models/tower_value_proof_queue.csv",
  "package_manifest.json",
  "proof_manifest.json",
];

const AI_RELATED_CLASSES = new Set([
  "ai_use_case",
  "ai_enabled_tool_rollout",
  "ai_assisted_automation",
  "platform_foundation",
  "data_readiness",
]);

const TOOL_DOMAIN_RULES = {
  "Enterprise AI platform": new Set(["data_ai"]),
  "ServiceNow Now Assist": new Set(["apps", "corporate_it"]),
  "Microsoft 365 Copilot": new Set(["corporate_it", "digital"]),
  "GitHub Copilot": new Set(["data_ai", "architecture"]),
  "AI coding agents": new Set(["data_ai", "architecture"]),
  "Workday AI": new Set(["corporate_it"]),
  "Epic clinical AI assist": new Set(["clinical_epic"]),
  "Databricks Mosaic AI": new Set(["data_ai"]),
  "Power BI Copilot": new Set(["data_ai", "corporate_it"]),
  "Contact center agent assist": new Set(["digital"]),
  "Prior auth document AI": new Set(["apps"]),
  "Security operations assistant": new Set(["security"]),
  "Digital front door AI decisioning": new Set(["digital"]),
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
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
  row.push(field);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows
    .filter((values) => values.some((value) => value.trim()))
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
}

async function readCsv(name) {
  return parseCsv(await fs.readFile(path.join(PACKAGE_DIR, name), "utf8"));
}

async function listRelativeFiles(dir, prefix = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listRelativeFiles(absolutePath, relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

function num(value) {
  const parsed = Number(
    String(value ?? "")
      .replace(/[$,%]/g, "")
      .replace(/,/g, ""),
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(rows, column) {
  return rows.reduce((total, row) => total + num(row[column]), 0);
}

function countBy(rows, column) {
  const counts = new Map();
  for (const row of rows) {
    const key = String(row[column] ?? "").trim() || "(blank)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort());
}

function countValues(rows, column) {
  const counts = new Map();
  for (const row of rows) {
    const key = String(row[column] ?? "").trim() || "(blank)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function assertGate(gates, id, pass, detail) {
  gates.push({ id, status: pass ? "PASS" : "FAIL", detail });
}

function money(value) {
  return `$${Math.round(value / 100_000) / 10}M`;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`;
}

const SIMPLE_BUSINESS_VALUE_TYPES = new Set([
  "Build faster",
  "Reduce cost",
  "Create capacity",
  "Grow revenue",
  "Foundation",
]);

function expectedBusinessValueType(row) {
  const name = row.initiative_name.toLowerCase();
  if (name.includes("github") || name.includes("engineering")) {
    return "Build faster";
  }
  if (
    name.includes("workday") ||
    name.includes("finance") ||
    name.includes("hr ") ||
    name.includes("claims") ||
    name.includes("prior authorization")
  ) {
    return "Reduce cost";
  }
  if (
    name.includes("epic") ||
    name.includes("clinical") ||
    name.includes("ambulatory") ||
    name.includes("referral")
  ) {
    return "Create capacity";
  }
  if (
    name.includes("digital front door") ||
    name.includes("member mobile") ||
    name.includes("personalization")
  ) {
    return "Grow revenue";
  }
  if (
    name.includes("servicenow") ||
    name.includes("service management") ||
    name.includes("contact center") ||
    name.includes("member service") ||
    name.includes("provider service") ||
    row.domain_key === "security"
  ) {
    return "Reduce cost";
  }
  return "Reduce cost";
}

async function main() {
  const presentFiles = new Set(await listRelativeFiles(PACKAGE_DIR));
  const missingFiles = REQUIRED_FILES.filter((file) => !presentFiles.has(file));
  const budget = await readCsv("20_it_budget_by_domain.csv");
  const projects = await readCsv("21_it_project_portfolio.csv");
  const aiCases = await readCsv("22_ai_business_cases.csv");
  const rollouts = await readCsv("23_ai_tool_rollout.csv");
  const monthly = await readCsv("24_monthly_value_tracking.csv");
  const finance = await readCsv("25_finance_approval_ledger.csv");
  const evidence = await readCsv("26_evidence_register.csv");
  const adapterRuns = await readCsv("layer_2_source_adapters/adapter_runs.csv");
  const adapterObjects = await readCsv(
    "layer_2_source_adapters/adapter_emitted_objects.csv",
  );
  const canonicalBudgets = await readCsv(
    "layer_3_canonical/canonical_budgets.csv",
  );
  const canonicalProjects = await readCsv(
    "layer_3_canonical/canonical_projects.csv",
  );
  const canonicalCases = await readCsv(
    "layer_3_canonical/canonical_ai_use_cases.csv",
  );
  const canonicalTools = await readCsv("layer_3_canonical/canonical_tools.csv");
  const canonicalMonthly = await readCsv(
    "layer_3_canonical/canonical_monthly_value_observations.csv",
  );
  const canonicalFinance = await readCsv(
    "layer_3_canonical/canonical_finance_approval_events.csv",
  );
  const canonicalEvidence = await readCsv(
    "layer_3_canonical/canonical_evidence_items.csv",
  );
  const canonicalRelationships = await readCsv(
    "layer_3_canonical/canonical_relationships.csv",
  );
  const caseCube = await readCsv("cube/tower_ai_case_cube.csv");
  const portfolioCube = await readCsv("cube/tower_ai_portfolio_cube.csv");
  const toolRolloutCube = await readCsv("cube/tower_ai_tool_rollout_cube.csv");
  const executiveSummary = await readCsv(
    "layer_4_read_models/tower_executive_summary.csv",
  );
  const initiativeTable = await readCsv(
    "layer_4_read_models/tower_ai_initiatives_table.csv",
  );
  const toolTable = await readCsv("layer_4_read_models/tower_tools_table.csv");
  const proofQueue = await readCsv(
    "layer_4_read_models/tower_value_proof_queue.csv",
  );
  const manifest = JSON.parse(
    await fs.readFile(path.join(PACKAGE_DIR, "package_manifest.json"), "utf8"),
  );
  const toolRolloutSurvival = await validateToolRolloutFieldSurvival({
    packageDir: PACKAGE_DIR,
  });
  const aiCaseSurvival = await validateAiBusinessCaseFieldSurvival({
    packageDir: PACKAGE_DIR,
  });

  const gates = [];
  const projectById = new Map(projects.map((row) => [row.project_id, row]));
  const aiProjects = projects.filter((row) => row.is_ai_related === "true");
  const aiProjectIds = new Set(aiProjects.map((row) => row.project_id));
  const analyticsRows = projects.filter(
    (row) => row.project_classification === "analytics_bi",
  );
  const aiProjectBudget = sum(aiProjects, "approved_budget_usd");
  const reviewedProjectBudget = sum(projects, "approved_budget_usd");
  const totalItBudget = sum(budget, "approved_budget_usd");
  const projectPromisedAnnualValue = sum(projects, "promised_annual_value_usd");
  const aiCasePromisedValueLow = sum(aiCases, "projected_annual_value_low_usd");
  const aiCasePromisedValueHigh = sum(
    aiCases,
    "projected_annual_value_high_usd",
  );
  const monthlyBoardClaimableValue = sum(monthly, "board_claimable_value_usd");
  const aiPortfolioRoiLow = aiCasePromisedValueLow / aiProjectBudget;
  const aiPortfolioRoiHigh = aiCasePromisedValueHigh / aiProjectBudget;
  const directValueCases = aiCases.filter(
    (row) => num(row.projected_annual_value_low_usd) > 0,
  );
  const directValueMultiples = directValueCases.map(
    (row) =>
      num(row.projected_annual_value_low_usd) /
      Math.max(num(row.cost_to_build_high_usd), 1),
  );
  const noDirectRoiCases = aiCases.filter(
    (row) => num(row.projected_annual_value_high_usd) === 0,
  );
  const monthlyByCase = countBy(monthly, "business_case_id");
  const financeStates = new Set(finance.map((row) => row.approval_state));
  const classifications = new Set(
    projects.map((row) => row.project_classification),
  );
  const top10Projects = [...projects]
    .sort((a, b) => num(b.approved_budget_usd) - num(a.approved_budget_usd))
    .slice(0, 10);
  const top10NonAiProjects = top10Projects.filter(
    (row) => row.is_ai_related === "false",
  );
  const aiProjectsWithoutCases = aiProjects.filter(
    (row) => !aiCases.some((item) => item.project_id === row.project_id),
  );
  const duplicateCaseProjectIds = [
    ...countValues(aiCases, "project_id"),
  ].filter(([, count]) => count > 1);
  const invalidAiFlags = projects.filter((row) => {
    const expected = AI_RELATED_CLASSES.has(row.project_classification)
      ? "true"
      : "false";
    return row.is_ai_related !== expected;
  });
  const badMonthlyPromotion = monthly.filter(
    (row) =>
      num(row.board_claimable_value_usd) >
        num(row.finance_validated_value_usd) ||
      num(row.finance_validated_value_usd) >
        num(row.finance_reviewed_value_usd) ||
      num(row.finance_reviewed_value_usd) > num(row.sponsor_claimed_value_usd),
  );
  const mismatchedTools = aiCases.filter((row) => {
    const allowedDomains = TOOL_DOMAIN_RULES[row.primary_tool_or_platform];
    return !allowedDomains || !allowedDomains.has(row.domain_key);
  });
  const toolNames = new Set(rollouts.map((row) => row.tool_name));
  const unregisteredCaseTools = aiCases.filter(
    (row) => !toolNames.has(row.primary_tool_or_platform),
  );
  const directCasesMissingSimpleStory = directValueCases.filter(
    (row) =>
      !SIMPLE_BUSINESS_VALUE_TYPES.has(row.business_value_type) ||
      !row.business_value_story ||
      !row.success_metric ||
      !row.proof_needed ||
      !row.roi_low_multiple ||
      !row.roi_high_multiple,
  );
  const directCasesWithBadValueType = directValueCases.filter(
    (row) => row.business_value_type !== expectedBusinessValueType(row),
  );
  const expectedAdapterObjects =
    budget.length +
    projects.length +
    aiCases.length +
    rollouts.length +
    monthly.length +
    finance.length +
    evidence.length;
  const cubeProjectedLow = sum(portfolioCube, "projected_annual_value_low_usd");
  const cubeProjectedHigh = sum(
    portfolioCube,
    "projected_annual_value_high_usd",
  );
  const cubeAiInvestment = sum(portfolioCube, "approved_investment_usd");
  const executive = executiveSummary[0] ?? {};

  assertGate(
    gates,
    "package_files_complete",
    missingFiles.length === 0,
    missingFiles.length
      ? `missing ${missingFiles.join(", ")}`
      : "all required files present",
  );
  assertGate(
    gates,
    "manifest_no_runtime_load",
    manifest.no_runtime_load === true &&
      manifest.status === "offline_layer_cube_proof_no_load_no_deploy",
    "package is marked no_runtime_load for signoff only",
  );
  assertGate(
    gates,
    "tenant_key_consistent",
    [budget, projects, aiCases, rollouts, monthly, finance, evidence]
      .flat()
      .every((row) => row.tenant_key === EXPECTED.tenantKey),
    "all rows use canonical tenant key",
  );
  assertGate(
    gates,
    "it_budget_total",
    totalItBudget === EXPECTED.totalItBudgetUsd,
    `${money(totalItBudget)} total IT budget`,
  );
  assertGate(
    gates,
    "project_portfolio_total",
    reviewedProjectBudget === EXPECTED.reviewedProjectUsd,
    `${money(reviewedProjectBudget)} reviewed project portfolio`,
  );
  assertGate(
    gates,
    "project_row_count",
    projects.length === EXPECTED.projectRows,
    `${projects.length} project rows`,
  );
  assertGate(
    gates,
    "classification_variety",
    classifications.size >= 8,
    `${classifications.size} project classifications`,
  );
  assertGate(
    gates,
    "bi_not_ai",
    analyticsRows.length > 0 &&
      analyticsRows.every((row) => row.is_ai_related === "false"),
    `${analyticsRows.length} analytics_bi rows are not AI-related`,
  );
  assertGate(
    gates,
    "portfolio_not_all_ai",
    aiProjects.length < projects.length &&
      aiProjectBudget / reviewedProjectBudget < 0.45,
    `${money(aiProjectBudget)} explicit AI/AI-enabled subset inside ${money(reviewedProjectBudget)} reviewed IT portfolio`,
  );
  assertGate(
    gates,
    "top_investments_include_non_ai_context",
    top10Projects[0]?.is_ai_related === "false" &&
      top10NonAiProjects.length >= 4,
    `${top10NonAiProjects.length} of top 10 investments are non-AI, including the largest`,
  );
  assertGate(
    gates,
    "ai_subset_reasonable",
    aiProjectBudget >= 120_000_000 && aiProjectBudget <= 220_000_000,
    `${money(aiProjectBudget)} explicit AI/AI-enabled subset`,
  );
  assertGate(
    gates,
    "ai_flags_explicit",
    invalidAiFlags.length === 0,
    `${invalidAiFlags.length} inconsistent AI flags`,
  );
  assertGate(
    gates,
    "ai_business_case_count",
    aiCases.length === aiProjects.length,
    `${aiCases.length} AI business cases for ${aiProjects.length} explicit AI-related projects`,
  );
  assertGate(
    gates,
    "all_ai_projects_have_business_cases",
    aiProjectsWithoutCases.length === 0 && duplicateCaseProjectIds.length === 0,
    `${aiProjectsWithoutCases.length} AI projects without cases; ${duplicateCaseProjectIds.length} duplicate project links`,
  );
  assertGate(
    gates,
    "ai_cases_link_to_projects",
    aiCases.every((row) => projectById.has(row.project_id)),
    "every AI business case links to a project",
  );
  assertGate(
    gates,
    "ai_cases_use_ai_projects",
    aiCases.every((row) => aiProjectIds.has(row.project_id)),
    "AI business cases only attach to explicitly AI-related projects",
  );
  assertGate(
    gates,
    "business_case_tool_registered",
    unregisteredCaseTools.length === 0,
    `${unregisteredCaseTools.length} business cases use unregistered tools`,
  );
  assertGate(
    gates,
    "business_case_tool_domain_fit",
    mismatchedTools.length === 0,
    `${mismatchedTools.length} tool/domain mismatches`,
  );
  assertGate(
    gates,
    "roi_distribution",
    directValueMultiples.every((v) => v >= 3) &&
      directValueMultiples.some((v) => v >= 4),
    `value multiples range ${Math.min(...directValueMultiples).toFixed(1)}x-${Math.max(...directValueMultiples).toFixed(1)}x`,
  );
  assertGate(
    gates,
    "direct_value_exceeds_build_cost",
    directValueMultiples.every((v) => v >= 3),
    `${directValueCases.length} direct-value cases have at least 3x low-case value against build-cost high estimate`,
  );
  assertGate(
    gates,
    "ai_portfolio_roi_3_to_4x",
    aiPortfolioRoiLow >= 3 &&
      aiPortfolioRoiLow <= 3.35 &&
      aiPortfolioRoiHigh >= 3.85 &&
      aiPortfolioRoiHigh <= 4.15,
    `${aiPortfolioRoiLow.toFixed(1)}x low case and ${aiPortfolioRoiHigh.toFixed(1)}x high case on explicit AI/AI-enabled investment`,
  );
  assertGate(
    gates,
    "direct_value_story_is_simple",
    directCasesMissingSimpleStory.length === 0,
    `${directCasesMissingSimpleStory.length} direct-value cases missing simple value type, story, proof, or ROI`,
  );
  assertGate(
    gates,
    "direct_value_type_coherent",
    directCasesWithBadValueType.length === 0,
    `${directCasesWithBadValueType.length} direct-value cases have incoherent simple value types`,
  );
  assertGate(
    gates,
    "approved_and_promised_value_are_separate",
    reviewedProjectBudget !== projectPromisedAnnualValue &&
      aiCasePromisedValueLow !== monthlyBoardClaimableValue,
    `${money(reviewedProjectBudget)} approved vs ${money(projectPromisedAnnualValue)} project low-case promised annual value vs ${money(monthlyBoardClaimableValue)} board-claimable YTD`,
  );
  assertGate(
    gates,
    "layer_2_adapter_lineage_complete",
    adapterRuns.length === 7 &&
      adapterObjects.length === expectedAdapterObjects &&
      adapterObjects.every((row) => row.lineage_status === "preserved"),
    `${adapterObjects.length} emitted objects with preserved lineage`,
  );
  assertGate(
    gates,
    "layer_3_canonical_counts_match_source",
    canonicalBudgets.length === budget.length &&
      canonicalProjects.length === projects.length &&
      canonicalCases.length === aiCases.length &&
      canonicalTools.length === rollouts.length &&
      canonicalMonthly.length === monthly.length &&
      canonicalFinance.length === finance.length &&
      canonicalEvidence.length === evidence.length,
    `${canonicalProjects.length} projects, ${canonicalCases.length} AI use cases, ${canonicalMonthly.length} value observations`,
  );
  assertGate(
    gates,
    "layer_3_relationships_present",
    canonicalRelationships.length >= aiCases.length * 2,
    `${canonicalRelationships.length} canonical relationships`,
  );
  assertGate(
    gates,
    "cube_reconciles_to_canonical",
    caseCube.length === canonicalCases.length &&
      toolRolloutCube.length === canonicalTools.length &&
      cubeAiInvestment === aiProjectBudget &&
      cubeProjectedLow === aiCasePromisedValueLow &&
      cubeProjectedHigh === aiCasePromisedValueHigh,
    `${caseCube.length} case cube rows, ${toolRolloutCube.length} tool rollout cube rows; ${money(cubeAiInvestment)} cube AI investment`,
  );
  assertGate(
    gates,
    "read_models_reconcile_to_cube",
    initiativeTable.length === caseCube.length &&
      toolTable.length === rollouts.length &&
      proofQueue.length ===
        aiCases.filter(
          (row) => row.finance_status !== "finance_validated_actual",
        ).length &&
      num(executive.ai_related_investment_usd) === aiProjectBudget &&
      num(executive.projected_annual_value_low_usd) === aiCasePromisedValueLow,
    `${initiativeTable.length} initiative rows, ${toolTable.length} tool rows, ${proofQueue.length} proof queue rows`,
  );
  assertGate(
    gates,
    "foundation_no_direct_roi",
    noDirectRoiCases.length >= 4,
    `${noDirectRoiCases.length} foundation/readiness cases carry no direct ROI`,
  );
  assertGate(
    gates,
    "tool_rollout_goals",
    rollouts.length >= 8 &&
      rollouts.every(
        (row) => num(row.rollout_target_users) > 0 || row.rollout_stage,
      ),
    `${rollouts.length} tool rollout rows`,
  );
  assertGate(
    gates,
    "ai_business_case_field_survival_contract",
    aiCaseSurvival.status === "PASS",
    aiCaseSurvival.status === "PASS"
      ? `${aiCaseSurvival.source_rows} AI business-case rows preserve approved fields through L3, L4 and cube`
      : aiCaseSurvival.issues.join("; "),
  );
  assertGate(
    gates,
    "tool_rollout_field_survival_contract",
    toolRolloutSurvival.status === "PASS",
    toolRolloutSurvival.status === "PASS"
      ? `${toolRolloutSurvival.source_rows} tool rows preserve approved fields through L3, L4 and cube`
      : toolRolloutSurvival.issues.join("; "),
  );
  assertGate(
    gates,
    "monthly_tracking_complete",
    aiCases.every(
      (row) => monthlyByCase[row.business_case_id] === EXPECTED.monthlyPeriods,
    ),
    `${monthly.length} monthly value observations`,
  );
  assertGate(
    gates,
    "monthly_value_promotion_order",
    badMonthlyPromotion.length === 0,
    `${badMonthlyPromotion.length} rows violate sponsor -> finance -> claimable order`,
  );
  assertGate(
    gates,
    "finance_state_variety",
    [
      "sponsor_claimed",
      "finance_challenged",
      "cfo_approved_target",
      "finance_validated_actual",
    ].every((state) => financeStates.has(state)),
    `states: ${[...financeStates].sort().join(", ")}`,
  );
  assertGate(
    gates,
    "evidence_coverage",
    evidence.length >= projects.length &&
      aiCases.every((row) =>
        evidence.some((ev) => ev.related_object_id === row.business_case_id),
      ),
    `${evidence.length} evidence rows`,
  );

  const summary = {
    status: gates.every((gate) => gate.status === "PASS") ? "PASS" : "FAIL",
    packageDir: path.relative(ROOT, PACKAGE_DIR),
    totals: {
      totalItBudgetUsd: totalItBudget,
      reviewedProjectBudgetUsd: reviewedProjectBudget,
      explicitAiRelatedBudgetUsd: aiProjectBudget,
      aiShareOfReviewedPortfolioPct:
        Math.round((aiProjectBudget / reviewedProjectBudget) * 1000) / 10,
      aiCasePromisedValueLowUsd: aiCasePromisedValueLow,
      aiCasePromisedValueHighUsd: aiCasePromisedValueHigh,
      aiPortfolioRoiLowMultiple: Math.round(aiPortfolioRoiLow * 10) / 10,
      aiPortfolioRoiHighMultiple: Math.round(aiPortfolioRoiHigh * 10) / 10,
      projectRows: projects.length,
      aiBusinessCases: aiCases.length,
      toolRollouts: rollouts.length,
      monthlyValueRows: monthly.length,
      financeApprovalRows: finance.length,
      evidenceRows: evidence.length,
    },
    distributions: {
      domains: countBy(projects, "domain_name"),
      projectClassifications: countBy(projects, "project_classification"),
      committeeDecisions: countBy(projects, "committee_decision"),
      financeApprovalStates: countBy(aiCases, "finance_status"),
      validationStates: countBy(monthly, "validation_state"),
    },
    gates,
  };

  await fs.writeFile(
    path.join(PACKAGE_DIR, "validation_report.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  await fs.mkdir(path.join(PACKAGE_DIR, "validation"), { recursive: true });
  await fs.writeFile(
    path.join(PACKAGE_DIR, "validation/validation_results.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(PACKAGE_DIR, "validation/validation_results.csv"),
    toCsv(["id", "status", "detail"], gates),
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
  if (summary.status !== "PASS") process.exit(1);
}

await main();
