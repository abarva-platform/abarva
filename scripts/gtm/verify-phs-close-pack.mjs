#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  pack: "docs/gtm/sales-assets/phs-close-pack.md",
  release: "docs/releases/records/2026-06-04-phs-close-pack.md",
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
  "Backlog rows: T252, T255, T256, T257, T262, T264, T285, T288, T290",
  "CXO Justification Memo Draft",
  "8-12 Slide Pitch Deck Outline",
  "Business Case Worksheet",
  "Joint CDAO + IT Sourcing Pitch",
  "PHS-Style Synthetic Data And Move Catalog Plan",
  "Pilot SOW Draft",
  "Legal / Procurement Pre-Handle Checklist",
  "Do not send numeric claims",
].forEach((snippet) => requireSnippet("pack", snippet));

[
  "2026-06-04-phs-close-pack",
  "public-demo",
  "T252",
  "T290",
  "No runtime rollout",
].forEach((snippet) => requireSnippet("release", snippet));

requireSnippet("packageJson", '"gtm:phs-close-pack:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "phs-close-pack",
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
