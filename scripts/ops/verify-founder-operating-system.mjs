#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const runbookPath = "docs/runbooks/founder-operating-system.md";
const releasePath = "docs/releases/records/2026-06-03-founder-operating-system.md";
const packagePath = "package.json";

const runbook = readFileSync(join(root, runbookPath), "utf8");
const release = readFileSync(join(root, releasePath), "utf8");
const pkg = readFileSync(join(root, packagePath), "utf8");

const checks = [];

function requireSnippet(label, source, snippet) {
  checks.push({
    name: `${label}.${snippet}`,
    status: source.includes(snippet) ? "pass" : "fail",
  });
}

[
  "Backlog rows: T305, T106, T117, T123",
  "## Two Parallel Close Sprints",
  "approximately 20 hours per week",
  "## Weekly Cadence",
  "## Hire Plan",
  "## SaaS Metrics Dashboard",
  "MRR",
  "ARR",
  "CAC",
  "Churn",
  "NRR",
  "Rows T305, T106, T117, and T123 can move to `In progress`",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "2026-06-03-founder-operating-system",
  "internal-admin",
  "T305",
  "T106",
  "T117",
  "T123",
  "live adoption evidence remains open",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

requireSnippet(packagePath, pkg, '"ops:founder-operating-system:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "founder-operating-system",
      status: failed.length === 0 ? "pass" : "fail",
      summary: {
        pass: checks.length - failed.length,
        fail: failed.length,
      },
      checks,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}
