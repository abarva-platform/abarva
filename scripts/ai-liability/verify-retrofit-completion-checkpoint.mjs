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

const checkpointPath = "docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md";
const runbookPath = "docs/runbooks/ai-liability-retrofit-checkpoint.md";
const buildPath = "docs/build/AI_LIABILITY_RETROFIT_CHECKPOINT_2026-06-03.md";
const releasePath =
  "docs/releases/records/2026-06-03-ai-liability-retrofit-checkpoint.md";

const checkpoint = read(checkpointPath);
const runbook = read(runbookPath);
const build = read(buildPath);
const release = read(releasePath);

[
  "Backlog row: T251",
  "Strict completion: 10 / 20 rows = 50%.",
  "Weighted signal: 15 / 20 = 75%.",
  "| Done | T231, T232, T233, T235, T236, T237, T239, T241, T246, T249 | 10 |",
  "| Not started | None | 0 |",
  "| T234 | PR #2902 is open with the consuming Intelligence pattern-to-Move approval dialog",
  "T251 closes only when strict completion reaches 100%.",
].forEach((snippet) => requireSnippet(checkpointPath, checkpoint, snippet));

[
  "Do not treat the wave as pilot-complete",
  "T234: merge the consuming pattern-to-Move approval dialog",
  "T250: CI coverage across every audited surface",
  "node scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs",
].forEach((snippet) => requireSnippet(runbookPath, runbook, snippet));

[
  "Backlog: T251",
  "Strict completion: 10 / 20 rows = 50%.",
  "Not-started blockers: none.",
  "does not\nclaim pilot completion",
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  "2026-06-03-ai-liability-retrofit-checkpoint",
  "internal-admin",
  "T251 remains `In progress`",
  "Pass: `node scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs`",
  "10 / 20 rows = 50%",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "ai-liability-retrofit-completion-checkpoint",
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
