#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const packetPath = "docs/ip/brand-and-ip-readiness-packet.md";
const releasePath = "docs/releases/records/2026-06-03-brand-ip-readiness.md";
const packagePath = "package.json";

const packet = readFileSync(join(root, packetPath), "utf8");
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
  "Backlog rows: T066, T067, T068, T069, T071, T075",
  "## Readiness Rule",
  "## T066 - AbarVa Trademark",
  "## T067 - Agent Brand Knockout Search",
  "## T068 - Agent Brand Filing Plan",
  "## T069 - Corpus Database Copyright",
  "## T071 - Trade-Secret Inventory and Marking",
  "## T075 - Contractor and Employee NDA/IP Assignment",
  "Do not commit confidential search reports",
  "Keep all six rows out of Done",
].forEach((snippet) => requireSnippet(packetPath, packet, snippet));

[
  "Sentinel",
  "Atlas",
  "Steward",
  "Nexus",
  "Maestro",
  "AbarVa Confidential - Trade Secret Candidate",
].forEach((snippet) => requireSnippet(packetPath, packet, snippet));

[
  "2026-06-03-brand-ip-readiness",
  "internal-admin",
  "T066",
  "T075",
  "No IP & Trademark row should be marked Done solely because of this release.",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

requireSnippet(packagePath, pkg, '"ip:brand-readiness:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "brand-ip-readiness",
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
