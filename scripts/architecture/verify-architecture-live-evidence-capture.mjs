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

const docPath = "docs/architecture/ARCHITECTURE_LIVE_EVIDENCE_CAPTURE_2026-06-04.md";
const releasePath = "docs/releases/records/2026-06-04-architecture-live-evidence-capture.md";

const doc = read(docPath);
const release = read(releasePath);

[
  "Backlog rows: T029, T030, T031, T032, T033, T034, T035, T041, T043, T186, T187, T189, T194, T195, T199, T200",
  "Do not mark any row Done from this runbook alone",
  "Wave 1: Identity And Tenant Substrate",
  "Wave 2: Upload And Document Processing",
  "Wave 3: Cost, Usage, And Ops Control",
  "Wave 4: External Assurance And Communications",
  "Founder Or External Work Required",
  "Use the private evidence vault for secrets, identities, vendor reports, live screenshots, tenant data, or customer-specific logs",
  "Update the tracker only with the truthful state",
].forEach((snippet) => requireSnippet(docPath, doc, snippet));

for (const taskId of [
  "T029",
  "T030",
  "T031",
  "T032",
  "T033",
  "T034",
  "T035",
  "T041",
  "T043",
  "T186",
  "T187",
  "T189",
  "T194",
  "T195",
  "T199",
  "T200",
]) {
  requireSnippet(docPath, doc, taskId);
}

[
  "npm run auth:clerk-sso:verify",
  "npm run azure:client-tenant-iac:verify",
  "npm run data-plane:tenant-connection:verify",
  "npm run azure:immutable-audit-log:verify",
  "npm run azure:defender-storage-malware:verify",
  "npm run release:check -- --base origin/main --head HEAD",
].forEach((snippet) => requireSnippet(docPath, doc, snippet));

[
  "2026-06-04-architecture-live-evidence-capture",
  "internal-admin",
  "Architecture live evidence capture runbook",
  "Pass: `node scripts/architecture/verify-architecture-live-evidence-capture.mjs`",
  "This runbook does not close the Architecture rows by itself",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

[
  "docs/architecture/ARCHITECTURE_CLOSURE_CONTROL_2026-06-04.md",
  "scripts/architecture/verify-architecture-closure-control.mjs",
].forEach(requireReference);

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "architecture-live-evidence-capture",
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
