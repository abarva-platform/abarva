#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  pack: "docs/gtm/sales-assets/sales-tail-pack.md",
  release: "docs/releases/records/2026-06-04-sales-tail-pack.md",
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
  "Backlog rows: T065, T258, T268, T276, T302",
  "T276: Surekha Pilot SOW Starter",
  "T302: Week 4-5 Peer Success Follow-Up",
  "T258: Backup Prospect Business Cases",
  "T065: Founder Health Coverage Decision Packet",
  "T268: Delta IMS / Source Landscape Scout",
  "no confirmed IMS/AMS renewal calendar",
  "HealthCare.gov self-employed coverage",
  "Delta 2025 Form 10-K on SEC EDGAR",
  "Done Criteria",
].forEach((snippet) => requireSnippet("pack", snippet));

[
  "2026-06-04-sales-tail-pack",
  "public-demo",
  "T065",
  "T302",
  "No runtime rollout",
].forEach((snippet) => requireSnippet("release", snippet));

requireSnippet("packageJson", '"gtm:sales-tail-pack:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "sales-tail-pack",
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
