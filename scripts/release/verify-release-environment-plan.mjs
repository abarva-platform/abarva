#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  const body = readFileSync(join(root, relativePath), "utf8");
  checks.push({ name: `file.${relativePath}`, status: "pass" });
  return body;
}

function requireSnippet(path, body, snippet) {
  const ok = body.includes(snippet);
  checks.push({
    name: `snippet.${path}.${snippet}`,
    status: ok ? "pass" : "fail",
  });
}

const runbookPath = "docs/runbooks/release-environment-and-rollback-drill.md";
const buildPath = "docs/build/RELEASE_ENVIRONMENT_ROLLBACK_DRILL_2026-06-03.md";
const releasePath = "docs/releases/records/2026-06-03-release-environment-rollback-drill.md";
const rollbackPath = "docs/runbooks/rollback.md";

const runbook = read(runbookPath);
const build = read(buildPath);
const release = read(releasePath);
const rollback = read(rollbackPath);

[
  "Local worktree",
  "PR preview",
  "Pre-prod preview",
  "Pilot production, first client",
  "Multi-client production",
  "Do not promote a client-data change from PR preview directly to production.",
  "First-client pilot production is ready only when",
  "Multi-client production is ready only when",
  "T039 remains `In progress`",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "T039",
  "first-client pilot production",
  "multi-client production",
  "rollback drill evidence packet",
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  "2026-06-03-release-environment-rollback-drill",
  "internal-admin",
  "Pass: `node scripts/release/verify-release-environment-plan.mjs`",
  "T039 remains `In progress`",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

requireSnippet(rollbackPath, rollback, "Release Environment and Rollback Drill Runbook");

const failed = checks.filter((check) => check.status === "fail");
console.log(
  JSON.stringify(
    {
      audit: "release-environment-rollback-drill",
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
