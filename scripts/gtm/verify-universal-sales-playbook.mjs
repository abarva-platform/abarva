#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const playbookPath = "docs/gtm/universal-sales-playbook.md";
const releasePath = "docs/releases/records/2026-06-03-universal-sales-playbook.md";
const packagePath = "package.json";

const playbook = readFileSync(join(root, playbookPath), "utf8");
const release = readFileSync(join(root, releasePath), "utf8");
const pkg = readFileSync(join(root, packagePath), "utf8");

const checks = [];

function requireSnippet(label, source, snippet) {
  checks.push({
    name: `${label}.${snippet}`,
    status: source.includes(snippet) ? "pass" : "fail",
  });
}

[
  "Backlog rows: T269, T277",
  "## Play 1 - No AI Leader Ready",
  "## Play 2 - New Leader",
  "## First-100-Days Framework",
  "Modernization Program OS",
  "First-100-Days Decision OS",
  "Keep AbarVa positioned as decision-support",
  "Rows T269 and T277 can be marked Done when this playbook and verifier are merged to `main`.",
].forEach((snippet) => requireSnippet(playbookPath, playbook, snippet));

[
  "2026-06-03-universal-sales-playbook",
  "public-demo",
  "T269",
  "T277",
  "Account-specific derivatives remain out of scope.",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

requireSnippet(packagePath, pkg, '"gtm:universal-sales:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "universal-sales-playbook",
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
