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
const runbookPath = "docs/runbooks/hot-path-optimization.md";
const pressureRunbookPath = "docs/runbooks/pressure-test-harness.md";
const releasePath = "docs/releases/records/2026-06-03-hot-path-optimization.md";

const pkg = read(packagePath);
const runbook = read(runbookPath);
const pressureRunbook = read(pressureRunbookPath);
const release = read(releasePath);

[
  '"load:hot-path-optimization:verify"',
  "scripts/load/verify-hot-path-optimization.mjs",
].forEach((snippet) => requireSnippet(packagePath, pkg, snippet));

[
  "Backlog row: T158",
  "Do not mark T158 `Done` from this runbook alone.",
  "top three hot paths",
  "Hot Path Ranking",
  "Hot Path Taxonomy",
  "Optimization Packet",
  "Before / After Measurement",
  "Pilot Go / No-Go Use",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "T158 remains blocked until the live runs identify the top three hot paths to optimize.",
].forEach((snippet) => requireSnippet(pressureRunbookPath, pressureRunbook, snippet));

[
  "2026-06-03-hot-path-optimization",
  "internal-admin",
  "T158",
  "T158 remains `In progress`",
  "live pressure-test evidence",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "hot-path-optimization",
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
