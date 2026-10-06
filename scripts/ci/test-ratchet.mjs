#!/usr/bin/env node
/**
 * Runs a surface's Jest suites and compares the result against a recorded baseline.
 *
 * The problem this solves: a surface with tests that nobody runs accumulates failures nobody sees.
 * The obvious fix -- run them all and fail on red -- cannot be adopted when the surface is already
 * red, because a check that is red on the day it lands teaches everyone to ignore it. So the
 * baseline records exactly which suites fail today and by how much, and the check fails on any
 * movement away from it.
 *
 * It ratchets in one direction only. A new failure fails. A new failure inside an
 * already-failing suite fails, because the count is compared and not just the name. And a suite
 * that has been FIXED also fails, with an instruction to re-record -- otherwise the baseline keeps
 * room for a failure that no longer exists, and the surface can quietly get worse again without
 * ever exceeding it.
 *
 * Usage:
 *   node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json
 *   node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json --update
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [baselinePath, ...flags] = process.argv.slice(2);
const update = flags.includes("--update");

if (!baselinePath || !fs.existsSync(baselinePath)) {
  console.error(
    `test-ratchet: no baseline at ${baselinePath ?? "(no path given)"}`,
  );
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const { name, paths, floor = 0, knownFailing = {} } = baseline;

if (!Array.isArray(paths) || paths.length === 0) {
  console.error(`test-ratchet: baseline ${baselinePath} declares no paths.`);
  process.exit(1);
}

const reportFile = path.join(
  os.tmpdir(),
  `test-ratchet-${name}-${process.pid}.json`,
);
// Jest exits non-zero when tests fail, which is the normal case here -- the report is what decides,
// not the exit code. It also exits non-zero when a path matches nothing, and that case is caught
// below by the suite count rather than by trusting the status.
// Jest's own failure output goes to stderr. It is worth seeing when the check fails in CI, and it
// is pure noise when re-recording a baseline that is expected to be full of failures.
spawnSync(
  "npx",
  ["jest", ...paths, "--silent", "--json", `--outputFile=${reportFile}`],
  {
    stdio: ["ignore", "ignore", update ? "ignore" : "inherit"],
  },
);

if (!fs.existsSync(reportFile)) {
  console.error(
    `test-ratchet: Jest wrote no report. It did not run to completion.`,
  );
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
fs.rmSync(reportFile, { force: true });

const root = process.cwd() + path.sep;
/** Failing suites as { relative path: {failing, ran} }. A suite that could not even be imported
 *  reports zero failing assertions, so the two facts are recorded separately. */
const observed = {};
for (const suite of report.testResults ?? []) {
  if (suite.status === "passed") continue;
  const ran = (suite.assertionResults ?? []).length > 0;
  observed[suite.name.replace(root, "")] = {
    failing: (suite.assertionResults ?? []).filter((a) => a.status === "failed")
      .length,
    ran,
  };
}

if (update) {
  fs.writeFileSync(
    baselinePath,
    JSON.stringify(
      {
        ...baseline,
        recordedAt: new Date().toISOString().slice(0, 10),
        totalTests: report.numTotalTests,
        totalSuites: report.numTotalTestSuites,
        knownFailing: Object.fromEntries(
          Object.entries(observed).sort(([a], [b]) => a.localeCompare(b)),
        ),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  console.log(
    `test-ratchet: recorded ${Object.keys(observed).length} failing suites ` +
      `across ${report.numTotalTestSuites} for "${name}".`,
  );
  process.exit(0);
}

const problems = [];

if (report.numTotalTests < floor) {
  problems.push(
    `Only ${report.numTotalTests} tests ran, below the floor of ${floor}. Either coverage was ` +
      `removed or a suite is no longer being picked up.`,
  );
}

for (const [suite, seen] of Object.entries(observed)) {
  const known = knownFailing[suite];
  if (!known) {
    problems.push(
      `NEW FAILURE  ${suite} — ${seen.failing || "the suite could not run"}`,
    );
  } else if (seen.failing > known.failing) {
    problems.push(
      `WORSE        ${suite} — ${known.failing} failing before, ${seen.failing} now`,
    );
  } else if (seen.ran && !known.ran) {
    problems.push(
      `CHANGED      ${suite} — it could not run before and now fails while running`,
    );
  }
}

const fixed = Object.keys(knownFailing).filter((suite) => {
  const seen = observed[suite];
  return !seen || seen.failing < knownFailing[suite].failing;
});

console.log(
  `test-ratchet "${name}": ${report.numPassedTests}/${report.numTotalTests} tests, ` +
    `${Object.keys(observed).length} failing suites (baseline ${Object.keys(knownFailing).length}).`,
);

if (fixed.length > 0) {
  problems.push(
    `${fixed.length} baselined ${fixed.length === 1 ? "suite has" : "suites have"} improved and the baseline still allows the old failures:\n` +
      fixed.map((s) => `    ${s}`).join("\n") +
      `\n  Re-record with: node scripts/ci/test-ratchet.mjs ${baselinePath} --update`,
  );
}

if (problems.length > 0) {
  console.error(`\ntest-ratchet "${name}" failed:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    `\nThe baseline is a record of what was already broken when the check landed, not a ` +
      `budget to spend.\n`,
  );
  process.exit(1);
}

console.log("test-ratchet: no movement away from the baseline.");
