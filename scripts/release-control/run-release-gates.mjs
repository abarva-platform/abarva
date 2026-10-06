/**
 * Runs every release gate as its own process and reports each verdict.
 *
 * A gate is a script whose exit status is its verdict, and gates end themselves
 * in different ways: some fall off the end of the module, some call
 * `process.exit(0)` on a success path, some call `process.exit(1)`, and some let
 * an error escape. Evaluated inside one shared process, the first gate that
 * calls `process.exit` on success ends the whole run with status 0, and every
 * gate listed after it is never evaluated. Nothing in the output says so: the
 * run simply stops after a line that reads as a pass.
 *
 * So no gate is imported here. Each one is started as a child of the same Node
 * binary, which makes `process.exit` inside a gate end that gate only, and
 * turns every way a gate can finish (an exit status, an uncaught error, a
 * signal) into the one thing this module reads: the child's result.
 *
 * What a caller can rely on, each proven in `__tests__` by running fixture
 * gates rather than by reading this file:
 *
 *   - every listed gate is started, whatever the gates before it did;
 *   - the exit code is non-zero if any gate did anything other than exit 0;
 *   - the summary names every gate that ran with its verdict, and an empty list
 *     is a failure, so a run that checked nothing cannot be read as a pass.
 *
 * This module is a library: it decides nothing about being run or imported and
 * reads no arguments of its own. `scripts/release-check.mjs` is the entry point.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';

function verdictOf(run) {
  if (run.error) {
    return { passed: false, detail: `could not start: ${run.error.message}` };
  }
  if (run.status === 0) return { passed: true, detail: 'exit 0' };
  if (run.signal) return { passed: false, detail: `killed by ${run.signal}` };
  return { passed: false, detail: `exit ${run.status}` };
}

/**
 * @param {object} options
 * @param {readonly string[]} options.gates gate scripts, relative to `rootDir`, in run order
 * @param {readonly string[]} [options.args] arguments handed to every gate unchanged
 * @param {string} options.rootDir directory the gate paths are relative to
 * @returns {{ results: Array<{ gate: string, passed: boolean, detail: string }>, exitCode: number }}
 */
export function runReleaseGates({ gates, args = [], rootDir }) {
  const results = [];

  for (const [index, gate] of gates.entries()) {
    console.log(`\nrelease-check: running gate ${index + 1} of ${gates.length}: ${gate}`);
    const run = spawnSync(process.execPath, [path.resolve(rootDir, gate), ...args], {
      stdio: 'inherit',
    });
    results.push({ gate, ...verdictOf(run) });
  }

  const failed = results.filter((result) => !result.passed);
  const exitCode = results.length === 0 || failed.length > 0 ? 1 : 0;
  const print = exitCode === 0 ? console.log : console.error;

  print('');
  print(`release-check: summary - ${results.length} of ${gates.length} listed gates ran`);
  for (const result of results) {
    print(`  ${result.passed ? 'PASS' : 'FAIL'}  ${result.gate} (${result.detail})`);
  }
  if (results.length === 0) {
    print('release-check: FAILED - no gates are listed, so nothing was checked.');
  } else if (failed.length > 0) {
    print(`release-check: FAILED - ${failed.length} of ${results.length} gates failed.`);
  } else {
    print(`release-check: PASSED - all ${results.length} gates ran and passed.`);
  }

  return { results, exitCode };
}
