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

const modelPath = "src/lib/ai-liability/approval-pattern-review.ts";
const testPath = "src/lib/ai-liability/__tests__/approval-pattern-review.test.ts";
const runbookPath = "docs/runbooks/approval-pattern-review.md";
const buildPath = "docs/build/APPROVAL_PATTERN_REVIEW_2026-06-03.md";
const releasePath = "docs/releases/records/2026-06-03-approval-pattern-review.md";

const model = read(modelPath);
const test = read(testPath);
const runbook = read(runbookPath);
const build = read(buildPath);
const release = read(releasePath);

[
  "fastApprovalSeconds: 30",
  "thinRationaleChars: 24",
  "high_risk_fast_approval",
  "criticalReviewerCount",
  "tenant-admin and AbarVa review",
].forEach((snippet) => requireSnippet(modelPath, model, snippet));

[
  "flags high-risk approvals decided too quickly",
  "flags thin rationale and missing evidence",
  "repeated fast approval patterns",
].forEach((snippet) => requireSnippet(testPath, test, snippet));

[
  "quarterly anti-rubber-stamp review",
  "approvals made too quickly",
  "tenant admin and AbarVa owner",
  "T218 remains `In progress`",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "T218",
  "anti-rubber-stamp",
  "No DB writes",
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  "2026-06-03-approval-pattern-review",
  "internal-admin",
  "Pass: `npx jest src/lib/ai-liability/__tests__/approval-pattern-review.test.ts --runInBand`",
  "T218 remains `In progress`",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === "fail");
console.log(
  JSON.stringify(
    {
      audit: "approval-pattern-review",
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
