#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  kit: "docs/gtm/sales-assets/sales-execution-proof-kit.md",
  release: "docs/releases/records/2026-06-04-sales-execution-proof-kit.md",
  packageJson: "package.json",
};

const content = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [
    key,
    readFileSync(join(root, path), "utf8"),
  ]),
);

const checks = [];

function requireSnippet(fileKey, snippet) {
  checks.push({
    file: files[fileKey],
    snippet,
    status: content[fileKey].includes(snippet) ? "pass" : "fail",
  });
}

[
  "Backlog rows: T063, T254, T256, T257, T258, T264, T269, T277, T284-T304",
  "Proof Rule",
  "Evidence Log Schema",
  "Founder Approval Checklist",
  "PHS Execution Proof Path",
  "KK / Delta Execution Proof Path",
  "Surekha / Morgan Street Execution Proof Path",
  "Backup Prospect Business Case Proof",
  "Outreach Log Template",
  "Meeting Notes Template",
  "Do not move rows to `Done` because this kit exists",
].forEach((snippet) => requireSnippet("kit", snippet));

[
  "2026-06-04-sales-execution-proof-kit",
  "public-demo",
  "No runtime rollout",
  "T063",
  "T284-T304",
].forEach((snippet) => requireSnippet("release", snippet));

requireSnippet("packageJson", '"gtm:sales-execution-proof:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "sales-execution-proof-kit",
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
