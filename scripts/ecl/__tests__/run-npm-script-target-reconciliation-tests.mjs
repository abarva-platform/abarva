#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const REF = process.env.ECL_RECONCILE_REF || process.env.NPM_SCRIPT_REF || "HEAD";
const PACKAGE_JSON = "package.json";
const BASELINE_PATH = "docs/architecture/npm-script-target-reconciliation-baseline.json";

function gitShow(path) {
  const result = spawnSync("git", ["show", `${REF}:${path}`], { encoding: "utf8" });
  assert.equal(
    result.status,
    0,
    `git show ${REF}:${path} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result.stdout;
}

function gitPathExists(path) {
  const result = spawnSync("git", ["cat-file", "-e", `${REF}:${path}`], {
    encoding: "utf8",
  });
  return result.status === 0;
}

const packageJson = JSON.parse(gitShow(PACKAGE_JSON));
assert(packageJson.scripts && typeof packageJson.scripts === "object", "package.json must declare scripts");
let baseline = { known_missing: [] };
try {
  baseline = JSON.parse(gitShow(BASELINE_PATH));
} catch (error) {
  if (process.env.NPM_SCRIPT_TARGET_BASELINE_REQUIRED === "1") {
    throw error;
  }
}
const baselineKeys = new Set(
  (baseline.known_missing ?? []).map((item) => `${item.scriptName}\u0000${item.token}`),
);

const pathTokenPattern =
  /(?<![\w@./-])((?:src|scripts|tests|docs|datasets|supabase|infra|clients|fixtures|runtime-tenant-boundaries)\/[^\s'"`$;|&()<>]+?\.(?:[cm]?js|ts|tsx|json|jsonl|ya?ml|sql|py|sh))/g;

const ignoredTokens = new Set([
  // Template/example references in help text, not executable targets.
  "docs/releases/templates/release-record-template.md",
]);

const missing = [];
for (const [scriptName, command] of Object.entries(packageJson.scripts)) {
  if (typeof command !== "string") continue;
  const tokens = [...command.matchAll(pathTokenPattern)].map((match) =>
    match[1].replace(/^['"]|['"]$/g, ""),
  );
  for (const token of [...new Set(tokens)]) {
    if (ignoredTokens.has(token)) continue;
    if (token.includes("*") || token.includes("{") || token.includes("[")) continue;
    if (!gitPathExists(token)) {
      missing.push({ scriptName, token });
    }
  }
}

const unbaselinedMissing = missing.filter(
  (item) => !baselineKeys.has(`${item.scriptName}\u0000${item.token}`),
);
assert.deepEqual(
  unbaselinedMissing,
  [],
  `package.json scripts must not reference unbaselined missing repo files at ${REF}:\n${unbaselinedMissing
    .map((item) => `- ${item.scriptName}: ${item.token}`)
    .join("\n")}`,
);

console.log(
  JSON.stringify(
    {
      accepted: true,
      ref: REF,
      scripts_checked: Object.keys(packageJson.scripts).length,
      missing_targets: missing.length,
      baselined_missing_targets: missing.length - unbaselinedMissing.length,
      unbaselined_missing_targets: unbaselinedMissing.length,
    },
    null,
    2,
  ),
);
