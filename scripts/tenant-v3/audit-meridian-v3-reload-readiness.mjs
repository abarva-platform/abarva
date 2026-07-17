#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const baseDir = path.join(repoRoot, "datasets/tenant-inputs/meridian-health/standard-2026-07-v3");
const interviewsPath = path.join(repoRoot, "datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv");
const reportDir = path.join(repoRoot, "reports/meridian-v3-real-repo-integration");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += ch;
    }
  }
  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows.filter((r) => r.some((c) => c !== "")).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function readCsv(name) {
  return parseCsv(fs.readFileSync(path.join(baseDir, name), "utf8"));
}

function num(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

const failures = [];
const checks = [];
function check(name, pass, details = {}) {
  checks.push({ name, result: pass ? "PASS" : "FAIL", ...details });
  if (!pass) failures.push({ name, ...details });
}

const f08 = readCsv("08_it_budget_spend_value.csv");
const f09 = readCsv("09_programs_initiatives.csv");
const f10 = readCsv("10_ai_automation_use_cases.csv");
const f13 = readCsv("13_evidence_sources.csv");
const f14 = readCsv("14_metrics_outcomes.csv");
const sa02 = readCsv("SA02_IT_Finance_Budget_Spend_Extract.csv");
const sa04 = readCsv("SA04_Program_Portfolio_Extract.csv");
const sa08 = readCsv("SA08_AI_Benefits_Realization_Usage_Ledger.csv");
const interviews = parseCsv(fs.readFileSync(interviewsPath, "utf8"));

const additive08 = f08.filter((row) => row.additive_status === "additive_budget_fact");
const total08 = additive08.reduce((sum, row) => sum + num(row.budget_amount_usd), 0);
const run08 = additive08.reduce((sum, row) => sum + num(row.run_budget_usd), 0);
const change08 = additive08.reduce((sum, row) => sum + num(row.change_budget_usd), 0);
const ai08 = f08.reduce((sum, row) => sum + num(row.ai_tagged_budget_usd), 0);
const totalSa02 = sa02.reduce((sum, row) => sum + num(row.budget_amount_usd), 0);
const runSa02 = sa02.filter((row) => row.run_change_flag === "run").reduce((sum, row) => sum + num(row.budget_amount_usd), 0);
const changeSa02 = sa02.filter((row) => row.run_change_flag === "change").reduce((sum, row) => sum + num(row.budget_amount_usd), 0);

check("08 additive budget totals $650M", total08 === 650000000, { actual: total08 });
check("08 run budget totals $487.5M", run08 === 487500000, { actual: run08 });
check("08 change budget totals $162.5M", change08 === 162500000, { actual: change08 });
check("SA02 budget totals reconcile to 08", totalSa02 === total08 && runSa02 === run08 && changeSa02 === change08, { totalSa02, runSa02, changeSa02 });
check("AI tagged budget is explicit non-additive lens", ai08 === 53700000, { actual: ai08 });

const sa02Ids = new Set(sa02.map((row) => row.source_record_id));
const budgetIds = new Set(additive08.map((row) => row.record_id.replace("MER-V3-BUD-", "")));
const programFailures = [];
for (const row of sa04) {
  const approved = row.funding_status === "approved";
  const linkedBudget = (row.linked_budget_record_ids || "").split(";").filter(Boolean);
  const linkedSa02 = (row.linked_sa02_records || "").split(";").filter(Boolean);
  if (approved && num(row.approved_funding_usd) <= 0) programFailures.push(`${row.program_code}: approved with no approved_funding_usd`);
  if (approved && !linkedBudget.length) programFailures.push(`${row.program_code}: approved with no budget links`);
  if (approved && !linkedSa02.length) programFailures.push(`${row.program_code}: approved with no SA02 links`);
  for (const id of linkedBudget) if (!budgetIds.has(id)) programFailures.push(`${row.program_code}: missing 08 budget ${id}`);
  for (const id of linkedSa02) if (!sa02Ids.has(id)) programFailures.push(`${row.program_code}: missing SA02 ${id}`);
}
check("All approved SA04 programs have budget and finance ties", programFailures.length === 0, { failures: programFailures.join(" | ") });

const f09ApprovedWithoutBudget = f09.filter((row) => row.funding_status === "approved" && (!row.linked_budget_record_ids || num(row.approved_funding_usd) <= 0));
check("No approved 09 program lacks budget/funding", f09ApprovedWithoutBudget.length === 0, { count: f09ApprovedWithoutBudget.length });

const aiAssistPrograms = sa04.filter((row) => /AI Assist/i.test(row.program_name || ""));
check("AI Assist program remains not approved and zero funded", aiAssistPrograms.length === 1 && aiAssistPrograms.every((row) => row.funding_status === "not_approved" && num(row.approved_funding_usd) === 0 && !row.linked_budget_record_ids), { count: aiAssistPrograms.length });
const aiAssistUseCases = f10.filter((row) => /Member Service AI Assist/i.test(row.business_name || row.use_case || ""));
check("AI Assist use case remains candidate/discovery with no approved funding", aiAssistUseCases.length >= 1 && aiAssistUseCases.every((row) => row.funding_status === "not_approved" && num(row.approved_funding_usd) === 0 && row.tower_tracking_status === "opportunity_only"), { count: aiAssistUseCases.length });

const benefitFailures = [];
for (const row of sa08) {
  if (!row.ai_program_id) benefitFailures.push(`${row.source_record_id}: missing ai_program_id`);
  if (!row.evidence_id) benefitFailures.push(`${row.source_record_id}: missing evidence_id`);
  if (row.tower_claim_allowed === "yes" && num(row.finance_validated_value_usd) <= 0) benefitFailures.push(`${row.source_record_id}: claim allowed without finance value`);
}
check("SA08 benefits ledger has program/evidence/value-claim boundaries", benefitFailures.length === 0, { failures: benefitFailures.join(" | ") });

const evidenceIds = new Set(f13.map((row) => row.evidence_id));
const evidenceFailures = [];
for (const [name, rows] of Object.entries({ "08": f08, "09": f09, "10": f10, "14": f14, sa02, sa04, sa08 })) {
  for (const row of rows) {
    const id = row.evidence_id;
    if (id && !evidenceIds.has(id) && !String(id).startsWith("MER-SA07-INT-EVID-")) evidenceFailures.push(`${name}:${row.record_id || row.source_record_id}:${id}`);
  }
}
check("Evidence IDs resolve for generated reload rows", evidenceFailures.length === 0, { failures: evidenceFailures.slice(0, 10).join(" | "), count: evidenceFailures.length });

check("SA07 interview file includes approved five-row gap fill", interviews.length === 221 && ["MER-INT-19", "MER-INT-20", "MER-INT-21", "MER-INT-22", "MER-INT-23"].every((id) => interviews.some((row) => row.interview_id === id)), { actual: interviews.length });
check("SA07 has budget_or_value_mentioned column", interviews.every((row) => Object.hasOwn(row, "budget_or_value_mentioned")), {});

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "reload-readiness-audit.json"), `${JSON.stringify({ status: failures.length ? "FAIL" : "PASS", checks, failures }, null, 2)}\n`);
fs.writeFileSync(path.join(reportDir, "reload-readiness-audit.md"), `# Meridian V3 Reload Readiness Audit\n\nStatus: **${failures.length ? "FAIL" : "PASS"}**\n\n${checks.map((row) => `- ${row.result}: ${row.name}`).join("\n")}\n`);
console.log(JSON.stringify({ status: failures.length ? "FAIL" : "PASS", failures }, null, 2));
if (failures.length) process.exit(1);
