#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const zipPath = path.join(
  repoRoot,
  "scripts/source/fixtures/skyharbor-global-v3/SkyHarbor_Global_Synthetic_Current_State_v3.zip",
);

const entries = {
  projects: "csv/enterprise_it/6_projects_investments.csv",
  aiUsage: "csv/enterprise_it/10_ai_adoption_usage.csv",
  kpis: "csv/enterprise_it/7_kpis_outcomes.csv",
  budget: "csv/enterprise_it/5_it_budget_allocations.csv",
};

function readZipEntry(entry) {
  return execFileSync("unzip", ["-p", zipPath, entry], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const out = {};
    headers.forEach((header, index) => {
      out[header] = values[index] ?? "";
    });
    return out;
  });
}

function numberValue(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return String(value ?? "").trim();
}

function countBy(rows, field) {
  const counts = new Map();
  for (const row of rows) {
    const key = text(row[field]) || "(blank)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function sum(rows, field) {
  return rows.reduce((total, row) => total + numberValue(row[field]), 0);
}

function assertGate(gates, id, ok, message, detail = null) {
  gates.push({ id, status: ok ? "PASS" : "FAIL", message, detail });
}

if (!existsSync(zipPath)) {
  console.error(`Missing Tower demo source package: ${zipPath}`);
  process.exit(1);
}

const projects = parseCsv(readZipEntry(entries.projects));
const aiUsage = parseCsv(readZipEntry(entries.aiUsage));
const kpis = parseCsv(readZipEntry(entries.kpis));
const budget = parseCsv(readZipEntry(entries.budget));

const approvedBudget = sum(projects, "Approved Budget");
const expectedValue = sum(projects, "Expected Business / Technology Value *");
const valueAtStake = expectedValue > 0 ? expectedValue : approvedBudget;
const nonzeroApprovedProjects = projects.filter((row) => numberValue(row["Approved Budget"]) > 0);
const nonzeroValueProjects = projects.filter(
  (row) => numberValue(row["Expected Business / Technology Value *"]) > 0,
);
const valueAtStakeProjects =
  nonzeroValueProjects.length > 0 ? nonzeroValueProjects : nonzeroApprovedProjects;
const aiComponentProjects = projects.filter((row) =>
  text(row["AI / Automation Component"]).toLowerCase().includes("yes"),
);
const statusCounts = countBy(projects, "Status *");
const fundingCounts = countBy(projects, "Funding Status");
const linkedKpis = kpis.filter((row) => text(row.related_initiative_ref).length > 0);
const kpiProjects = new Set(linkedKpis.map((row) => text(row.related_initiative_ref)));
const kpiConfidenceCounts = countBy(kpis, "Confidence");
const businessOutcomeRows = aiUsage.filter((row) => {
  const value = text(row["Business Outcome / Value Evidence"]).toLowerCase();
  return value.length > 0 && value !== "telemetry only";
});

const aiMathIssues = aiUsage
  .map((row, index) => {
    const purchased = numberValue(row["Seats Purchased"]);
    const assigned = numberValue(row["Seats Assigned"]);
    const active = numberValue(row["Active Users"]);
    const sourceRate = numberValue(row["Active Rate"]);
    const computedRate = assigned > 0 ? active / assigned : 0;
    const hasBadSeatMath = active > assigned || assigned > purchased;
    const hasBadRate =
      sourceRate > 0 && Math.abs(sourceRate - computedRate) > 0.025;
    return hasBadSeatMath || hasBadRate
      ? {
          row: index + 2,
          tool: text(row["Tool / Agent / Product *"]),
          purchased,
          assigned,
          active,
          sourceRate,
          computedRate: Number(computedRate.toFixed(4)),
        }
      : null;
  })
  .filter(Boolean);

const gates = [];
assertGate(gates, "command-center-budget", budget.length >= 100 && sum(budget, "Budget Amount *") > 1_000_000_000, "Tower landing has enough budget facts to narrate investment posture.", {
  rows: budget.length,
  budgetAmount: sum(budget, "Budget Amount *"),
});
assertGate(gates, "command-center-projects", projects.length >= 40, "Tower landing has a material project portfolio.", {
  rows: projects.length,
});
assertGate(gates, "value-proof-value-at-stake", valueAtStake > 50_000_000 && valueAtStakeProjects.length >= 20, "Value Proof has numeric value-at-stake, separate from claimable value.", {
  expectedValue,
  approvedBudget,
  valueAtStake,
  valueBasis: expectedValue > 0 ? "explicit_expected_value" : "approved_budget_fallback",
  nonzeroValueProjects: nonzeroValueProjects.length,
  valueAtStakeProjects: valueAtStakeProjects.length,
});
assertGate(gates, "decision-lanes-funding", approvedBudget > 50_000_000 && nonzeroApprovedProjects.length >= 20, "Decision Lanes can show funded programs instead of zero-dollar rows.", {
  approvedBudget,
  nonzeroApprovedProjects: nonzeroApprovedProjects.length,
});
assertGate(gates, "decision-lanes-variety", statusCounts.size >= 4 && fundingCounts.size >= 3, "Decision Lanes has enough status and funding variety for scale/fix/freeze/stop narration.", {
  statuses: Object.fromEntries(statusCounts),
  funding: Object.fromEntries(fundingCounts),
});
assertGate(gates, "ai-portfolio-usage", aiUsage.length >= 100 && aiMathIssues.length === 0, "AI Portfolio usage math is internally consistent.", {
  rows: aiUsage.length,
  issueCount: aiMathIssues.length,
  sampleIssues: aiMathIssues.slice(0, 5),
});
assertGate(gates, "ai-portfolio-outcome-evidence", businessOutcomeRows.length >= 20, "AI Portfolio can distinguish telemetry-only usage from named outcome evidence.", {
  businessOutcomeRows: businessOutcomeRows.length,
});
assertGate(gates, "evidence-kpi-linkage", linkedKpis.length >= 100 && kpiProjects.size >= 20, "Evidence tab can connect KPI observations back to initiatives.", {
  linkedKpis: linkedKpis.length,
  linkedProjects: kpiProjects.size,
  confidence: Object.fromEntries(kpiConfidenceCounts),
});
assertGate(gates, "recommended-actions-ai-projects", aiComponentProjects.length >= 10, "Recommended Actions has enough AI-enabled projects for intervention narration.", {
  aiComponentProjects: aiComponentProjects.length,
});

const narrativeContract = [
  {
    tab: "Command Center",
    clientNarration:
      "Investment and adoption are visible; outcome proof is still being earned.",
    requiredFacts: ["budget rows", "program rows", "AI tagged spend", "claim counts"],
  },
  {
    tab: "Value Proof",
    clientNarration:
      "Investment value-at-stake exists, but claimability must move through baseline, usage, outcome, Finance, and attestation gates.",
    requiredFacts: ["project value-at-stake", "linked KPI observations", "claim gate state"],
  },
  {
    tab: "Decision Lanes",
    clientNarration:
      "Executives should act by lane: fix evidence, freeze weak cases, stop unfunded work, and fund only when proof is ready.",
    requiredFacts: ["approved budget", "program status", "funding status", "next gate"],
  },
  {
    tab: "AI Portfolio",
    clientNarration:
      "Tool adoption proves activity; it does not prove business value until outcomes and guardrails are linked.",
    requiredFacts: ["seats", "active users", "use cost", "business outcome evidence"],
  },
  {
    tab: "Evidence",
    clientNarration:
      "Tower groups proof gaps by what exists, what is missing, who owns it, and which decision is blocked.",
    requiredFacts: ["source provenance", "KPI links", "confidence", "attestation state"],
  },
  {
    tab: "Recommended Actions",
    clientNarration:
      "The system prescribes measurement work before scale decisions.",
    requiredFacts: ["gap owner", "next action", "AI-enabled project set"],
  },
];

const report = {
  status: gates.every((gate) => gate.status === "PASS") ? "PASS" : "FAIL",
  sourcePackage: path.relative(repoRoot, zipPath),
  generatedAt: new Date().toISOString(),
  metrics: {
    projectRows: projects.length,
    aiUsageRows: aiUsage.length,
    kpiRows: kpis.length,
    budgetRows: budget.length,
    approvedBudget,
    expectedValue,
    valueAtStake,
    valueBasis: expectedValue > 0 ? "explicit_expected_value" : "approved_budget_fallback",
    nonzeroApprovedProjects: nonzeroApprovedProjects.length,
    nonzeroValueProjects: nonzeroValueProjects.length,
    aiComponentProjects: aiComponentProjects.length,
    linkedKpiRows: linkedKpis.length,
    linkedKpiProjects: kpiProjects.size,
  },
  narrativeContract,
  gates,
};

console.log(JSON.stringify(report, null, 2));

if (report.status !== "PASS") {
  process.exit(1);
}
