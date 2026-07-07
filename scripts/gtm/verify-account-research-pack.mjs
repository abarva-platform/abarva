#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  index: "docs/gtm/account-research/README.md",
  delta: "docs/gtm/account-research/delta-technology-modernization-brief.md",
  morgan: "docs/gtm/account-research/morgan-street-new-leader-brief.md",
  phs: "docs/gtm/account-research/phs-evidence-caveat.md",
  release: "docs/releases/records/2026-06-04-account-research-pack.md",
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
  "Backlog rows: T253, T260, T261, T263, T265, T274, T278",
  "Do not imply that AbarVa knows private client data",
  "Rows covered by this pack should move from Not started to In progress",
].forEach((snippet) => requireSnippet("index", snippet));

[
  "Backlog rows: T265, T278",
  "Amala Duggirala",
  "Delta Concierge",
  "Do not claim Delta has a $3B IT budget unless Anand supplies a verified source.",
  "https://news.delta.com/amala-duggirala-evp-and-chief-digital-and-technology-officer",
].forEach((snippet) => requireSnippet("delta", snippet));

[
  "Backlog rows: T274",
  "10,000+ people employed",
  "Chief Information Officer",
  "Do not invent Morgan Street revenue",
  "https://morganstreet.com/",
].forEach((snippet) => requireSnippet("morgan", snippet));

[
  "Backlog rows: T253, T260, T261, T263",
  "public-research pass did not identify a reliable public",
  "Do not cite PHS revenue",
  "Rows T253, T260, T261, and T263 should be moved to In progress",
].forEach((snippet) => requireSnippet("phs", snippet));

[
  "2026-06-04-account-research-pack",
  "public-demo",
  "T253",
  "T278",
  "No runtime rollout",
].forEach((snippet) => requireSnippet("release", snippet));

requireSnippet("packageJson", '"gtm:account-research:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "account-research-pack",
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
