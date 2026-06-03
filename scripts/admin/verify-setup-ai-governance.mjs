#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function read(path) {
  const body = readFileSync(join(root, path), "utf8");
  checks.push({ name: `file.${path}`, status: "pass" });
  return body;
}

function requireSnippet(path, body, snippet) {
  checks.push({
    name: `snippet.${path}.${snippet}`,
    status: body.includes(snippet) ? "pass" : "fail",
  });
}

const modelPath = "src/lib/admin/setup-ai-governance.ts";
const viewPath = "src/lib/admin/setup-load-studio-view.ts";
const modelTestPath = "src/lib/admin/__tests__/setup-ai-governance.test.ts";
const viewTestPath = "src/lib/admin/__tests__/setup-load-studio-view.test.ts";
const runbookPath = "docs/runbooks/setup-ai-governance.md";
const buildPath = "docs/build/SETUP_AI_GOVERNANCE_2026-06-03.md";
const releasePath = "docs/releases/records/2026-06-03-setup-ai-governance.md";

const model = read(modelPath);
const view = read(viewPath);
const modelTest = read(modelTestPath);
const viewTest = read(viewTestPath);
const runbook = read(runbookPath);
const build = read(buildPath);
const release = read(releasePath);

[
  "SetupAiGovernanceBacklogId = \"T244\" | \"T245\"",
  "admin_approval",
  "admin_reason",
  "triage_acknowledgement",
  "triage_acknowledged_at",
].forEach((snippet) => requireSnippet(modelPath, model, snippet));

[
  "AI setup suggestions",
  "Admin approval required",
  "AI anomaly triage",
  "No silent remediation",
].forEach((snippet) => requireSnippet(viewPath, view, snippet));

[
  "blocks AI-suggested tenant config changes",
  "blocks AI-detected anomaly remediation",
].forEach((snippet) => requireSnippet(modelTestPath, modelTest, snippet));

requireSnippet(viewTestPath, viewTest, "surfaces AI setup approval and anomaly triage guardrails");

[
  "T244",
  "T245",
  "Admin approval with a recorded reason",
  "Human triage acknowledgement",
  "T244 and T245 remain `In progress`",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "T244",
  "T245",
  "No automatic application",
  "No silent remediation",
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  "2026-06-03-setup-ai-governance",
  "internal-admin",
  "Pass: `node scripts/admin/verify-setup-ai-governance.mjs`",
  "T244 and T245 remain `In progress`",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === "fail");
console.log(
  JSON.stringify(
    {
      audit: "setup-ai-governance",
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
