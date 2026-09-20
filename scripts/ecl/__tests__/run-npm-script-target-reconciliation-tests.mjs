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

// And the other direction, which this gate used to leave open.
//
// The baseline could only be appended to. An entry whose script was deleted,
// whose target came back, or whose script stopped naming that token kept
// sitting in the list describing nothing, and the gate stayed green — so the
// baseline slowly stopped describing the repository. One entry was already
// stale when this check was written.
//
// It is the same shape the repository's quarantine checks already refuse,
// where a list BELOW its ceiling fails because silent headroom is how a
// carve-out becomes permanent. Cleaning an entry is one line in the change
// that made it stale; leaving it is a claim nobody re-measures.
const missingKeys = new Set(
  missing.map((item) => `${item.scriptName}\u0000${item.token}`),
);
const staleBaselineEntries = (baseline.known_missing ?? [])
  .filter(
    (item) => !missingKeys.has(`${item.scriptName}\u0000${item.token}`),
  )
  .map((item) => {
    const command = packageJson.scripts?.[item.scriptName];
    const why =
      typeof command !== "string"
        ? "the script no longer exists"
        : gitPathExists(item.token)
          ? "the target file exists again"
          : "the script no longer names that token";
    return { scriptName: item.scriptName, token: item.token, why };
  });

assert.deepEqual(
  staleBaselineEntries,
  [],
  `the reconciliation baseline holds entries that no longer describe anything at ${REF}. `
    + `Remove each one in the change that made it stale:\n${staleBaselineEntries
      .map((item) => `- ${item.scriptName}: ${item.token} (${item.why})`)
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
      stale_baseline_entries: staleBaselineEntries.length,
      baseline_entries: (baseline.known_missing ?? []).length,
    },
    null,
    2,
  ),
);
