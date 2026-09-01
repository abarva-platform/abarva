#!/usr/bin/env node
/**
 * Fails when the Home suites have stopped covering the surface.
 *
 * A green test run proves the tests that ran passed. It does not prove that any
 * particular thing is still tested: a suite deleted, a describe block skipped,
 * or a directory renamed all leave a passing run behind them. The floor below is
 * the cheapest check that notices, and it is deliberately well under the current
 * count so ordinary refactoring does not trip it.
 *
 * Raise the floor when the surface grows. Lowering it is a decision to cover
 * less, and should be argued for in the PR that does it.
 */
import fs from "node:fs";

const FLOOR = 300;
const [reportPath] = process.argv.slice(2);

if (!reportPath || !fs.existsSync(reportPath)) {
  console.error(
    `Home surface guard: no Jest report at ${reportPath ?? "(no path given)"}.\n` +
      "The test step did not produce one, which means it did not run to completion.",
  );
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const { numTotalTests = 0, numPassedTests = 0, numFailedTests = 0, numTotalTestSuites = 0 } = report;

if (numFailedTests > 0 || report.success === false) {
  console.error(`Home surface guard: ${numFailedTests} failing tests.`);
  process.exit(1);
}

if (numTotalTests < FLOOR) {
  console.error(
    `Home surface guard: ${numTotalTests} tests ran across ${numTotalTestSuites} suites, ` +
      `below the floor of ${FLOOR}.\n` +
      "Either coverage was removed, or a suite is no longer being picked up. " +
      "If the reduction is intended, lower the floor in this file and say why in the PR.",
  );
  process.exit(1);
}

console.log(
  `Home surface guard: ${numPassedTests}/${numTotalTests} tests passed across ` +
    `${numTotalTestSuites} suites (floor ${FLOOR}).`,
);
