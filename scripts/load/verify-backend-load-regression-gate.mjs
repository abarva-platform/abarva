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

const packagePath = "package.json";
const workflowPath = ".github/workflows/backend-load-regression.yml";
const runbookPath = "docs/runbooks/backend-load-regression-gate.md";
const buildPath = "docs/build/BACKEND_LOAD_REGRESSION_GATE_2026-06-03.md";
const releasePath =
  "docs/releases/records/2026-06-03-backend-load-regression-gate.md";

const pkg = read(packagePath);
const workflow = read(workflowPath);
const runbook = read(runbookPath);
const build = read(buildPath);
const release = read(releasePath);

[
  '"load:backend-regression:check"',
  "scripts/load/azure-primary-surfaces.mjs",
  "--dry-run",
].forEach((snippet) => requireSnippet(packagePath, pkg, snippet));

[
  "name: Backend Load Regression",
  "pull_request:",
  "Backend load regression contract",
  "npm run load:backend-regression:check",
  "backend-load-regression-contract.json",
].forEach((snippet) => requireSnippet(workflowPath, workflow, snippet));

[
  "Backlog row: T160",
  "every PR for harness contract",
  "every major release for live load run",
  "T160 remains",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "Backlog: T160",
  "load:backend-regression:check",
  "does not run a live Azure/staging/production load test",
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  "2026-06-03-backend-load-regression-gate",
  "internal-admin",
  "Pass: `node scripts/load/verify-backend-load-regression-gate.mjs`",
  "T160 remains `In progress`",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === "fail");
console.log(
  JSON.stringify(
    {
      audit: "backend-load-regression-gate",
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
