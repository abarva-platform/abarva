#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports", "tower-mart-data-loading-qa");

const targets = [
  {
    tenant: "meridian-health",
    summary: "reports/tower-mart-projection-meridian-health/projection-summary.json",
  },
  {
    tenant: "apex-retail",
    summary: "reports/tower-mart-projection-apex-retail/projection-summary.json",
  },
  {
    tenant: "skyharbor-air",
    summary: "reports/tower-mart-projection-skyharbor-air/projection-summary.json",
  },
  {
    tenant: "first-capital-financial",
    summary:
      "reports/tower-mart-projection-first-capital-financial/projection-summary.json",
  },
  {
    tenant: "lakeshore-holdings",
    summary:
      "reports/tower-mart-projection-lakeshore-holdings/projection-summary.json",
  },
  {
    tenant: "lakeshore-industries",
    summary:
      "reports/tower-mart-projection-lakeshore-industries/projection-summary.json",
  },
];

function readJson(relativePath) {
  const full = path.join(repoRoot, relativePath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing projection summary: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function near(a, b) {
  return Math.abs(a - b) <= 2;
}

const rows = [];
let pass = true;

for (const target of targets) {
  const summary = readJson(target.summary);
  const cc = summary.command_center;
  const tenantPasses = [];
  const check = (id, ok, evidence) => {
    tenantPasses.push({ id, pass: Boolean(ok), evidence });
    if (!ok) pass = false;
  };

  check("tenant_key", summary.tenant_key === target.tenant, summary.tenant_key);
  check("command_center_present", Boolean(cc), cc ? "present" : "missing");
  if (!cc) {
    rows.push({ tenant: target.tenant, checks: tenantPasses });
    continue;
  }

  const totalBudget = Number(cc.total_it_budget_fy26 ?? 0);
  const runBudget = Number(cc.run_budget_fy26 ?? 0);
  const changeBudget = Number(cc.change_budget_fy26 ?? 0);
  const approvedBudget = Number(cc.approved_program_budget_fy26 ?? 0);
  const aiTagged = Number(cc.ai_tagged_spend_fy26_non_additive ?? 0);
  const promised = Number(cc.promised_value_fy26 ?? 0);
  const realized = Number(cc.realized_value_ytd_allowed ?? 0);

  check("budget_envelope_nonzero", totalBudget > 0, totalBudget);
  check(
    "run_change_reconciles_to_total",
    near(runBudget + changeBudget, totalBudget),
    `${runBudget}+${changeBudget}=${runBudget + changeBudget}; total=${totalBudget}`,
  );
  check("promised_value_nonzero", promised > 0, promised);
  check("approved_program_budget_nonzero", approvedBudget > 0, approvedBudget);
  check(
    "ai_tagged_spend_nonzero_when_ai_programs_exist",
    approvedBudget <= 0 || aiTagged > 0,
    aiTagged,
  );
  check("realized_value_not_auto_claimed", realized === 0, realized);
  check(
    "mart_rows_present",
    Number(summary.mart_counts?.program_decision_lanes ?? 0) > 0 &&
      Number(summary.mart_counts?.ai_portfolio ?? 0) > 0,
    JSON.stringify(summary.mart_counts ?? {}),
  );

  rows.push({ tenant: target.tenant, checks: tenantPasses });
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "summary.json"),
  JSON.stringify({ pass, checked_at: new Date().toISOString(), rows }, null, 2),
);

const markdown = [
  "# Tower Mart Data Loading QA",
  "",
  `Status: ${pass ? "PASS" : "FAIL"}`,
  "",
  "| Tenant | Check | Status | Evidence |",
  "| --- | --- | --- | --- |",
  ...rows.flatMap((row) =>
    row.checks.map(
      (check) =>
        `| ${row.tenant} | ${check.id} | ${check.pass ? "PASS" : "FAIL"} | ${String(
          check.evidence,
        ).replace(/\|/g, "\\|")} |`,
    ),
  ),
  "",
].join("\n");

fs.writeFileSync(path.join(outDir, "summary.md"), markdown);

if (!pass) {
  console.error(markdown);
  process.exit(1);
}

console.log(markdown);
