#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  commandCenter: "docs/gtm/sales-assets/pilot-candidate-command-center.md",
  release: "docs/releases/records/2026-06-04-pilot-candidate-command-center.md",
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
  "Backlog rows: T063, T254, T272, T279, T284, T286, T287, T289, T291, T292, T293, T295, T297, T298, T299, T300, T303, T304",
  "Ranked Pilot Candidates",
  "PHS Day 1-2 Usage Debrief",
  "Delta / KK Day 1-2 Usage Debrief",
  "Surekha First-Touch / New-Leader Conversation",
  "PHS Two-Week Sprint",
  "Delta / KK Two-Week Sprint",
  "Surekha Nurture Path",
  "Do not mark external rows Done because this command center exists.",
].forEach((snippet) => requireSnippet("commandCenter", snippet));

[
  "2026-06-04-pilot-candidate-command-center",
  "public-demo",
  "T063",
  "T304",
  "No runtime rollout",
].forEach((snippet) => requireSnippet("release", snippet));

requireSnippet("packageJson", '"gtm:pilot-command-center:verify"');

const failed = checks.filter((check) => check.status === "fail");

console.log(
  JSON.stringify(
    {
      audit: "pilot-candidate-command-center",
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
