#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  delta: "docs/gtm/sales-assets/delta-modernization-program-os.md",
  morgan: "docs/gtm/sales-assets/morgan-street-100-day-framework.md",
  release: "docs/releases/records/2026-06-04-sales-asset-conversion-pack.md",
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
  "Backlog rows: T266, T267, T280, T294, T296",
  "Modernization Program OS",
  "Lane A / Lane B Pilot SOW Outline",
  "Do not claim AbarVa has a complete software-delivery corpus today.",
  "Do not imply autonomous decisions",
  "What Would Need To Be True",
].forEach((snippet) => requireSnippet("delta", snippet));

[
  "Backlog rows: T273, T275, T301",
  "Two-Page Teaser Draft",
  "Candidate Move Catalog",
  "Thoughtful Value Piece",
  "Do not claim Surekha's exact mandate",
  "Keep AbarVa as decision-support infrastructure",
].forEach((snippet) => requireSnippet("morgan", snippet));

[
  "2026-06-04-sales-asset-conversion-pack",
  "public-demo",
  "T266",
  "T301",
  "No runtime rollout",
].forEach((snippet) => requireSnippet("release", snippet));

requireSnippet("packageJson", '"gtm:sales-assets:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "sales-asset-conversion-pack",
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
