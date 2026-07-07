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

const docPath = "docs/runbooks/operational-readiness-live-evidence.md";
const releasePath = "docs/releases/records/2026-06-04-operational-readiness-live-evidence.md";

const doc = read(docPath);
const release = read(releasePath);

[
  "Backlog rows: T106, T110, T115, T121, T123, T305",
  "Do not mark these rows Done from this runbook alone",
  "Hosted synthetic demo environment is not proven live",
  "Disaster scenarios are documented but not drilled",
  "OFAC screening foundation exists but live/manual evidence is not retained",
  "Founder Or External Work Required",
  "Keep all six rows In progress until those proofs exist",
].forEach((snippet) => requireSnippet(docPath, doc, snippet));

for (const taskId of ["T106", "T110", "T115", "T121", "T123", "T305"]) {
  requireSnippet(docPath, doc, taskId);
}

[
  "npm run demo:environment:verify",
  "node scripts/compliance/verify-ofac-screening.mjs",
  "npm run ops:founder-operating-system:verify",
  "npm run release:check -- --base origin/main --head HEAD",
].forEach((snippet) => requireSnippet(docPath, doc, snippet));

[
  "2026-06-04-operational-readiness-live-evidence",
  "internal-admin",
  "Operational Readiness live evidence runbook",
  "Pass: `node scripts/ops/verify-operational-readiness-live-evidence.mjs`",
  "This runbook does not close the six Operational Readiness rows by itself",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

[
  "docs/demo/DEMO_ENVIRONMENT_OPERATIONS.md",
  "docs/runbooks/disaster-scenario-drills.md",
  "docs/runbooks/ofac-screening.md",
  "docs/runbooks/founder-operating-system.md",
  "scripts/compliance/verify-ofac-screening.mjs",
  "scripts/ops/verify-founder-operating-system.mjs",
].forEach(requireReference);

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "operational-readiness-live-evidence",
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
