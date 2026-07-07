#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

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
const runnerPath = "scripts/load/pressure-test-matrix.mjs";
const runbookPath = "docs/runbooks/pressure-test-harness.md";
const releasePath = "docs/releases/records/2026-06-03-pressure-test-harness.md";

const pkg = read(packagePath);
const runner = read(runnerPath);
const runbook = read(runbookPath);
const release = read(releasePath);

[
  '"load:pressure-matrix"',
  '"load:pressure-matrix:check"',
].forEach((snippet) => requireSnippet(packagePath, pkg, snippet));

[
  "pilot-baseline-10-user-soak",
  "year-one-50-user-soak",
  "llm-stream-burst-10",
  "parallel-document-upload-50",
  "db-pool-sizing",
  "cold-start-primary-routes",
  "token-runaway-1m",
  "Rows move to Done only after a live evidence packet",
].forEach((snippet) => requireSnippet(runnerPath, runner, snippet));

[
  "Backlog rows: T151, T152, T153, T154, T155, T156, T157, T159, T160",
  "Completion Rule",
  "Live Run Evidence Packet",
  "Do not mark T151-T157 Done from this harness alone.",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "2026-06-03-pressure-test-harness",
  "internal-admin",
  "T151",
  "T157",
  "No pressure-test row should be marked Done solely because of this release.",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const dryRun = spawnSync(
  process.execPath,
  [runnerPath, "--base-url", "https://example.com", "--dry-run", "--json"],
  { cwd: root, encoding: "utf8" },
);

let dryRunJson;
try {
  dryRunJson = JSON.parse(dryRun.stdout);
} catch {
  dryRunJson = null;
}

checks.push({ name: "dry-run.exit-zero", status: dryRun.status === 0 ? "pass" : "fail" });
checks.push({ name: "dry-run.status-pass", status: dryRunJson?.status === "pass" ? "pass" : "fail" });
checks.push({
  name: "dry-run.seven-profiles",
  status: dryRunJson?.profiles?.length === 7 ? "pass" : "fail",
});
checks.push({
  name: "dry-run.done-rule",
  status: dryRunJson?.completionRule?.includes("Rows move to Done only after") ? "pass" : "fail",
});

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "pressure-test-harness",
      status: failed.length === 0 ? "pass" : "fail",
      summary: {
        pass: checks.length - failed.length,
        fail: failed.length,
      },
      checks,
      dryRun: dryRunJson,
      stderr: dryRun.stderr,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}
