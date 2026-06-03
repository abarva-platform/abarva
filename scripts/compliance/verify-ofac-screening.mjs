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

const modelPath = "src/lib/compliance/ofac-screening.ts";
const testPath = "src/lib/compliance/__tests__/ofac-screening.test.ts";
const configPath = "src/lib/admin/compliance-config.ts";
const brokerPath = "src/lib/admin/broker/compliance-posture-broker.ts";
const brokerTestPath = "src/lib/admin/broker/__tests__/compliance-posture-broker.test.ts";
const gridPath = "src/components/admin/CompliancePostureGrid.tsx";
const gridTestPath = "src/components/admin/__tests__/CompliancePostureGrid.test.tsx";
const runbookPath = "docs/runbooks/ofac-screening.md";
const buildPath = "docs/build/OFAC_SCREENING_2026-06-03.md";
const releasePath = "docs/releases/records/2026-06-03-ofac-screening.md";

const model = read(modelPath);
const test = read(testPath);
const config = read(configPath);
const broker = read(brokerPath);
const brokerTest = read(brokerTestPath);
const grid = read(gridPath);
const gridTest = read(gridTestPath);
const runbook = read(runbookPath);
const build = read(buildPath);
const release = read(releasePath);

[
  "blocked",
  "possible_match",
  "manual_review_required",
  "compliance_clearance",
  "manual_review_disposition",
].forEach((snippet) => requireSnippet(modelPath, model, snippet));

[
  "blocks high-confidence OFAC matches",
  "requires manual review for possible matches",
  "fails closed on low-confidence hits",
].forEach((snippet) => requireSnippet(testPath, test, snippet));

[
  "OfacScreeningPosture",
  "ofacScreening",
  "screen before customer onboarding",
  "manual_review_disposition",
].forEach((snippet) => requireSnippet(configPath, config, snippet));

requireSnippet(brokerPath, broker, "ofacScreening");
requireSnippet(brokerTestPath, brokerTest, "commits to sanctions screening before customer onboarding");
requireSnippet(gridPath, grid, "Customer sanctions screening");
requireSnippet(gridPath, grid, "ofacScreening.evidenceRequired");
requireSnippet(gridTestPath, gridTest, "renders all five posture card titles");
requireSnippet(gridTestPath, gridTest, "manual_review_disposition");

[
  "T121",
  "OFAC",
  "Possible matches fail closed",
  "T121 remains `In progress`",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "T121",
  "OFAC",
  "No live OFAC API integration",
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  "2026-06-03-ofac-screening",
  "internal-admin",
  "Pass: `node scripts/compliance/verify-ofac-screening.mjs`",
  "T121 remains `In progress`",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === "fail");
console.log(
  JSON.stringify(
    {
      audit: "ofac-screening",
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
