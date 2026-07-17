#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DEFAULT_REPORT_DIR = path.join(ROOT, "reports/meridian-v3-cio-tower-projection");
const reportDir = arg("--report-dir") ?? DEFAULT_REPORT_DIR;
const projectionPath = path.join(reportDir, "projection.json");
const failures = [];
const warnings = [];

function arg(name) {
  const prefix = `${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function approx(actual, expected, label) {
  if (Math.abs(Number(actual ?? 0) - expected) > 0.01) {
    fail(`${label} expected ${expected} but found ${actual}`);
  }
}

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) fail(`Missing ${filePath}`);
}

function includesMeasure(projection, measureKey) {
  return projection.measure_results?.some((row) => row.measure_key === measureKey);
}

function valueFor(projection, measureKey) {
  return Number(projection.measure_results?.find((row) => row.measure_key === measureKey)?.value_numeric ?? 0);
}

requireFile(projectionPath);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

const projection = JSON.parse(fs.readFileSync(projectionPath, "utf8"));

if (projection.tenant_key !== "meridian-health") fail(`Wrong tenant_key ${projection.tenant_key}`);
if (projection.source_standard !== "standard-2026-07-v3") fail(`Wrong source_standard ${projection.source_standard}`);
if (projection.truth_split?.azure_postgres_written_by_this_run !== false) fail("Dry-run projection must not claim Azure/Postgres write.");
if (projection.truth_split?.active_tenant_access_updated !== false) fail("Projection must not claim Active Tenant Access update.");
if (projection.truth_split?.tower_command_mart_projected !== true) fail("Projection must declare Tower command mart projection.");
if (projection.truth_split?.realized_value_language_allowed !== false) fail("Projection must block realized/proven value wording.");

approx(projection.headline?.total_it_budget_fy26, 650_000_000, "Headline FY26 total technology budget");
approx(projection.headline?.run_budget_fy26, 487_500_000, "Headline FY26 run budget");
approx(projection.headline?.change_budget_fy26, 162_500_000, "Headline FY26 change budget");
approx(projection.headline?.approved_program_budget_fy26, 291_900_000, "Approved program budget");
approx(projection.headline?.ai_tagged_spend_fy26_non_additive, 53_700_000, "AI-tagged spend lens");
approx(projection.headline?.promised_value_fy26, 35_500_000, "Promised AI value");
approx(projection.headline?.partial_finance_validated_value_ytd, 3_800_000, "Partial finance-validated value");
approx(projection.headline?.realized_value_ytd_allowed, 0, "Realized value allowed");

if (String(JSON.stringify(projection)).includes("1069500000")) fail("Projection still contains stale $1.0695B Tower value.");
if (String(JSON.stringify(projection)).includes("$1.1B")) fail("Projection still contains stale $1.1B display text.");
if (String(JSON.stringify(projection)).includes("713000000")) fail("Projection still contains stale $713M run value.");
if (String(JSON.stringify(projection)).includes("356500000")) fail("Projection still contains stale $356.5M change value.");

for (const measureKey of [
  "total_it_budget_fy26",
  "run_budget_fy26",
  "change_budget_fy26",
  "initiative_budget_fy26",
  "ai_tagged_spend_fy26",
  "promised_value_fy26",
  "partial_finance_validated_value_ytd",
  "measured_value_ytd",
  "ai_usage_signal",
  "candidate_ai_opportunity_count",
  "tower_watch_pressure_signal",
]) {
  if (!includesMeasure(projection, measureKey)) fail(`Missing measure result ${measureKey}`);
}

approx(valueFor(projection, "total_it_budget_fy26"), 650_000_000, "Measure total_it_budget_fy26");
approx(valueFor(projection, "run_budget_fy26"), 487_500_000, "Measure run_budget_fy26");
approx(valueFor(projection, "change_budget_fy26"), 162_500_000, "Measure change_budget_fy26");
approx(valueFor(projection, "ai_tagged_spend_fy26"), 53_700_000, "Measure ai_tagged_spend_fy26");
approx(valueFor(projection, "partial_finance_validated_value_ytd"), 3_800_000, "Measure partial_finance_validated_value_ytd");
approx(valueFor(projection, "measured_value_ytd"), 0, "Measure measured_value_ytd");

const programLens = projection.decision_lenses?.program_portfolio ?? [];
if (programLens.length < 12) fail(`Expected at least 12 program portfolio rows, found ${programLens.length}`);
for (const required of ["PROG-COPILOT-ADOPT", "PROG-SNOW-AI", "PROG-WORKDAY-AI", "PROG-DEV-PRODUCTIVITY", "PROG-AI-GOV", "PROG-DATA-FOUNDATION"]) {
  if (!programLens.some((row) => row.program_code === required)) fail(`Missing program lens row ${required}`);
}
const copilot = programLens.find((row) => row.program_code === "PROG-COPILOT-ADOPT");
if (!copilot) {
  fail("Missing Copilot program row.");
} else {
  approx(copilot.approved_funding_usd, 10_500_000, "Copilot approved funding");
  approx(copilot.ai_tagged_spend_usd, 10_500_000, "Copilot AI-tagged approved funding");
  approx(copilot.usage_actual, 4_800, "Copilot monthly active users");
  approx(copilot.partial_finance_validated_value_usd, 2_100_000, "Copilot partial finance validated value");
  if (copilot.posture !== "working_partial_value") fail(`Copilot posture expected working_partial_value, found ${copilot.posture}`);
  if (!/not yet labor-released/i.test(copilot.caveat)) fail("Copilot caveat must mention not labor-released.");
}

const usageRows = projection.decision_lenses?.usage_and_benefits ?? [];
if (usageRows.length !== 8) fail(`Expected 8 SA08 usage/benefit rows, found ${usageRows.length}`);
for (const tool of ["Microsoft 365 Copilot", "ServiceNow AI Agent Assist", "Workday AI HR/Finance Assist", "GitHub Copilot Enterprise"]) {
  if (!usageRows.some((row) => row.tool_name === tool)) fail(`Missing usage row for ${tool}`);
}
const candidateAssist = usageRows.find((row) => row.tool_name === "Member Service AI Assist");
if (!candidateAssist) {
  fail("Missing Member Service AI Assist candidate boundary row.");
} else {
  approx(candidateAssist.finance_validated_value_usd, 0, "Member Service AI Assist finance value");
  if (candidateAssist.tower_claim_allowed !== "no") fail("Member Service AI Assist must not allow Tower claim.");
  if (!/Candidate only/i.test(candidateAssist.caveat)) fail("Member Service AI Assist caveat must say candidate only.");
}

const candidateRows = projection.decision_lenses?.candidate_ai_opportunities ?? [];
if (candidateRows.length < 200) warn(`Candidate AI opportunity list has ${candidateRows.length}; expected broad legacy/candidate coverage.`);
if (!candidateRows.some((row) => /member service/i.test(row.use_case || "") && row.funding_status !== "approved")) {
  fail("Expected Member Service AI Assist as candidate/not-approved opportunity.");
}

const aiCategories = new Set((projection.decision_lenses?.ai_spend_by_category ?? []).map((row) => row.category));
for (const category of ["copilot_productivity", "servicenow_ai", "workday_ai", "developer_productivity_ai", "data_ai_platform", "ai_governance"]) {
  if (!aiCategories.has(category)) fail(`Missing AI spend category ${category}`);
}

const mart = projection.mart ?? {};
if (!mart.command_center?.length) fail("Missing mart.command_center.");
if (!mart.value_funnel?.length) fail("Missing mart.value_funnel.");
if (!mart.program_decision_lanes?.length) fail("Missing mart.program_decision_lanes.");
if (!mart.ai_portfolio?.length) fail("Missing mart.ai_portfolio.");
if (!mart.cxo_actions?.length) fail("Missing mart.cxo_actions.");
if (!mart.evidence_lineage?.length) fail("Missing mart.evidence_lineage.");
const command = mart.command_center?.[0];
if (command) {
  approx(command.total_it_budget_fy26, 650_000_000, "Mart total IT budget");
  approx(command.run_budget_fy26, 487_500_000, "Mart run budget");
  approx(command.change_budget_fy26, 162_500_000, "Mart change budget");
  approx(command.ai_tagged_spend_fy26_non_additive, 53_700_000, "Mart AI-tagged spend");
  approx(command.promised_value_fy26, 35_500_000, "Mart promised value");
  approx(command.partial_finance_validated_value_ytd, 3_800_000, "Mart partial finance value");
  approx(command.realized_value_ytd_allowed, 0, "Mart realized value allowed");
  if (!/fund, fix, freeze, or stop/i.test(command.decision_question || "")) fail("Mart decision question must use fund/fix/freeze/stop posture.");
  if (!Array.isArray(command.source_files) || command.source_files.length < 8) fail("Mart command center must carry source_files lineage.");
}
const funnelStages = new Set((mart.value_funnel ?? []).map((row) => row.stage_key));
for (const stage of ["funded_change_spend", "promised_value", "finance_validated_partial", "realized_allowed"]) {
  if (!funnelStages.has(stage)) fail(`Missing mart value funnel stage ${stage}`);
}
const realizedStage = (mart.value_funnel ?? []).find((row) => row.stage_key === "realized_allowed");
if (realizedStage) {
  approx(realizedStage.value_numeric, 0, "Mart value funnel realized allowed");
  if (!/blocked/i.test(realizedStage.claim_status || "")) fail("Realized value funnel stage must be blocked.");
}
if ((mart.program_decision_lanes ?? []).length < 12) fail(`Expected at least 12 mart program decision lanes, found ${(mart.program_decision_lanes ?? []).length}`);
const laneSet = new Set((mart.program_decision_lanes ?? []).map((row) => row.decision_lane));
for (const lane of ["fund", "fix", "freeze", "stop"]) {
  if (!laneSet.has(lane)) warn(`Mart decision lanes do not currently include ${lane}; verify source data supports this posture.`);
}
const copilotLane = (mart.program_decision_lanes ?? []).find((row) => row.program_code === "PROG-COPILOT-ADOPT");
if (!copilotLane) {
  fail("Missing Copilot mart decision lane.");
} else {
  approx(copilotLane.approved_funding_usd, 10_500_000, "Copilot mart approved funding");
  approx(copilotLane.finance_validated_value_usd, 2_100_000, "Copilot mart partial finance validated value");
  if (!copilotLane.source_file || !copilotLane.source_row) fail("Copilot mart lane must retain source_file/source_row.");
}
const aiPortfolioNames = new Set((mart.ai_portfolio ?? []).map((row) => row.item_name));
for (const item of ["Microsoft 365 Copilot", "ServiceNow AI Agent Assist", "Workday AI HR/Finance Assist", "GitHub Copilot Enterprise", "Member Service AI Assist"]) {
  if (!aiPortfolioNames.has(item)) fail(`Missing mart AI portfolio item ${item}`);
}
const memberAssist = (mart.ai_portfolio ?? []).find((row) => row.item_name === "Member Service AI Assist");
if (memberAssist) {
  approx(memberAssist.approved_funding_usd, 0, "Member Service AI Assist mart approved funding");
  approx(memberAssist.finance_validated_value_usd, 0, "Member Service AI Assist mart finance value");
  if (memberAssist.tower_claim_allowed !== "no") fail("Member Service AI Assist mart row must not allow Tower claim.");
  if (!/candidate/i.test(memberAssist.caveat || "")) fail("Member Service AI Assist mart caveat must preserve candidate boundary.");
}
const blockingGaps = (mart.required_field_gaps ?? []).filter((row) => row.blocking === true || row.severity === "blocking");
if (blockingGaps.length) {
  fail(`Tower mart has blocking required-field gaps: ${blockingGaps.map((row) => `${row.mart_record_key}:${row.required_field}`).slice(0, 10).join("; ")}`);
}

const sourceFiles = new Set(Object.values(projection.source_volumetrics ?? {}).map((row) => row.file));
for (const file of [
  "08_it_budget_spend_value.csv",
  "09_programs_initiatives.csv",
  "10_ai_automation_use_cases.csv",
  "SA02_IT_Finance_Budget_Spend_Extract.csv",
  "SA04_Program_Portfolio_Extract.csv",
  "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
  "14_metrics_outcomes.csv",
  "18_operational_process_evidence.csv",
]) {
  if (!sourceFiles.has(file)) fail(`Missing source volumetric for ${file}`);
}

for (const output of [
  "summary.md",
  "proof.html",
  "measure-results.csv",
  "source-to-fact-lineage.csv",
  "program-portfolio-lens.csv",
  "usage-benefit-lens.csv",
  "mart-command-center.csv",
  "mart-value-funnel.csv",
  "mart-program-decision-lanes.csv",
  "mart-ai-portfolio.csv",
  "mart-cxo-actions.csv",
  "mart-evidence-lineage.csv",
  "mart-required-field-gaps.csv",
]) {
  requireFile(path.join(reportDir, output));
}

if (failures.length) {
  console.error("Meridian V3 CIO Tower projection audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length) {
    console.error("\nWarnings:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

if (warnings.length) {
  console.warn("Meridian V3 CIO Tower projection audit passed with warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
} else {
  console.log("Meridian V3 CIO Tower projection audit passed.");
}
