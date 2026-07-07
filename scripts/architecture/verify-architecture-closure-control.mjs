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

const docPath = "docs/architecture/ARCHITECTURE_CLOSURE_CONTROL_2026-06-04.md";
const releasePath = "docs/releases/records/2026-06-04-architecture-closure-control.md";
const packagePath = "package.json";

const doc = read(docPath);
const release = read(releasePath);
const pkg = read(packagePath);

[
  "Backlog rows: T029, T030, T031, T032, T033, T034, T035, T041, T043, T186, T187, T189, T194, T195, T199, T200",
  "Do not mark an Architecture row Done unless all three are true",
  "Target-subscription what-if/deploy output",
  "Clerk Organization, SAML/OIDC config",
  "External status provider",
  "Clean and malicious upload samples with Defender scan-result tags",
  "Repeated parsed-document or agent-system call evidence showing cache creation/read tokens",
  "Architecture is not blocked by lack of planning",
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
  "2026-06-04-architecture-closure-control",
  "internal-admin",
  "Pass: `npm run architecture:closure-control:verify`",
  "This packet is the closure map",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

requireSnippet(packagePath, pkg, "\"architecture:closure-control:verify\"");

[
  "scripts/auth/verify-clerk-sso-readiness.mjs",
  "scripts/auth/verify-fakeclient-sso-rehearsal.mjs",
  "scripts/ops/verify-status-page-readiness.mjs",
  "scripts/azure/verify-client-tenant-iac.mjs",
  "scripts/data-plane/verify-tenant-connection-resolution.mjs",
  "scripts/azure/verify-defender-storage-malware.mjs",
  "scripts/admin/verify-admin-ops-surface.mjs",
  "scripts/azure/verify-immutable-audit-log.mjs",
  "scripts/security/verify-pen-test-readiness.mjs",
  "docs/build/COST_PER_DOCUMENT_DASHBOARD_2026-06-03.md",
  "docs/architecture/azure/PERSISTENT_PARSE_CACHE_CONTRACT.md",
].forEach(requireReference);

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "architecture-closure-control",
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
