#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function read(path) {
  const fullPath = join(root, path);
  const exists = existsSync(fullPath);
  checks.push({ file: path, check: "exists", status: exists ? "pass" : "fail" });
  return exists ? readFileSync(fullPath, "utf8") : "";
}

function requireSnippet(file, body, snippet) {
  checks.push({
    file,
    check: snippet,
    status: body.includes(snippet) ? "pass" : "fail",
  });
}

function requireReference(path) {
  checks.push({
    file: path,
    check: "reference exists",
    status: existsSync(join(root, path)) ? "pass" : "fail",
  });
}

const docPath = "docs/legal/AI_LIABILITY_LIVE_EVIDENCE_MATRIX_2026-06-04.md";
const releasePath = "docs/releases/records/2026-06-04-ai-liability-live-evidence-matrix.md";

const doc = read(docPath);
const release = read(releasePath);

[
  "Backlog rows: T206, T207, T209, T210, T216, T217, T218, T219, T220, T221, T222, T227, T238, T240, T242, T243, T244, T245, T247, T248, T250, T251, T336, T337, T339",
  "Do not mark a row Done from this matrix alone",
  "Live product E2E proof",
  "Durable evidence/export proof",
  "Counsel or insurance proof",
  "Broader source-binding proof",
  "Anand, counsel, broker, carrier, or client-side reviewers are required",
].forEach((snippet) => requireSnippet(docPath, doc, snippet));

for (const taskId of [
  "T206",
  "T207",
  "T209",
  "T210",
  "T216",
  "T217",
  "T218",
  "T219",
  "T220",
  "T221",
  "T222",
  "T227",
  "T238",
  "T240",
  "T242",
  "T243",
  "T244",
  "T245",
  "T247",
  "T248",
  "T250",
  "T251",
  "T336",
  "T337",
  "T339",
]) {
  requireSnippet(docPath, doc, taskId);
}

[
  "node scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs",
  "node scripts/ai-liability/verify-approval-pattern-review.mjs",
  "node scripts/admin/verify-setup-ai-governance.mjs",
  "node scripts/audit/ai-surface-control-catalog.mjs",
  "npm run release:check -- --base origin/main --head HEAD",
].forEach((snippet) => requireSnippet(docPath, doc, snippet));

[
  "2026-06-04-ai-liability-live-evidence-matrix",
  "internal-admin",
  "AI Liability live evidence matrix",
  "Pass: `node scripts/ai-liability/verify-live-evidence-matrix.mjs`",
  "This matrix does not close the AI Liability Defense rows by itself",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

[
  "docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md",
  "docs/runbooks/ai-liability-retrofit-checkpoint.md",
  "docs/legal/ai-sow-clause-playbook.md",
  "docs/runbooks/approval-pattern-review.md",
  "scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs",
  "scripts/ai-liability/verify-approval-pattern-review.mjs",
  "scripts/admin/verify-setup-ai-governance.mjs",
].forEach(requireReference);

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "ai-liability-live-evidence-matrix",
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
