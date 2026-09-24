import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * One declaration of every file a test is allowed to add to the working tree
 * for the duration of a Jest run, and the only sanctioned way to add or remove
 * one (item T-759).
 *
 * The defect this replaces: `t743-agent-tests-directory-ci.test.ts` proves the
 * agent-unit CI wire reaches a file that did not exist when the wire was
 * written, by writing one into `src/lib/agent/__tests__` mid-run and deleting
 * it in a `finally`. That deletion is the bug. Thirty-one suites under
 * `src/__tests__/behaviors` reach `scripts/quality/test-ci-coverage-census.mjs`,
 * which enumerates the test files under `src/` and then reads each one; a file
 * that disappears between those two steps kills the census with an unhandled
 * ENOENT and takes the suite with it. Measured on a tree at `origin/main`
 * `15e0e9994` with a cold Jest cache, three runs of three over the gated
 * directory: 4, 3 and 4 suites failing of 114, all on that exact path. The
 * moving count is what makes it a race rather than a broken assertion.
 *
 * WHY THE WRITER AND NOT THE READERS. The acceptance offered "make the readers
 * tolerate a file that disappears", and four readers were named because four
 * were observed failing — but four is the sample, not the population. Any of
 * the thirty who happen to be reading inside the window will fail, and a
 * thirty-second one written tomorrow inherits the race by default. A rule every
 * future reader has to remember is the same omission-by-default that put 28
 * agent suites outside CI in the first place, which is the defect the probe
 * exists to disprove. So the invariant is placed where one line enforces it for
 * every reader that exists or ever will:
 *
 *   **during a Jest run the set of files under `src/` only grows.**
 *
 * A suite adds its file and leaves it. `jest-global-setup.ts` clears a copy
 * leaked by a killed run BEFORE any worker starts, so a leak cannot fail the
 * next run, and `jest-global-teardown.ts` removes it AFTER every worker has
 * exited, where no reader is left to observe the removal.
 *
 * `root` is injectable so the control suite can drive these functions over a
 * temporary directory. A test that created and removed a real file under `src/`
 * to prove this would be the very race it is testing for.
 */
export const TRANSIENT_PROBE_FILES = [
  "src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts",
] as const;

/**
 * The repository root these functions act on. `ABARVA_TRANSIENT_PROBE_ROOT` is
 * read only so the control suite can point the real functions at a scratch
 * tree; nothing in normal operation sets it.
 */
export function transientProbeRoot(): string {
  return process.env.ABARVA_TRANSIENT_PROBE_ROOT ?? process.cwd();
}

/**
 * Remove every registered probe file under `root`, and nothing else. Returns
 * the repo-relative paths it actually removed, so a caller can report a leak
 * rather than swallow it.
 */
export function removeTransientProbeFiles(root: string = transientProbeRoot()): string[] {
  const removed: string[] = [];
  for (const relative of TRANSIENT_PROBE_FILES) {
    const absolute = path.join(root, relative);
    if (!existsSync(absolute)) continue;
    rmSync(absolute, { force: true });
    removed.push(relative);
  }
  return removed;
}

/**
 * Write a registered probe file. Refuses an unregistered path: the teardown
 * removes exactly what is registered, so a file written outside the registry
 * would be left behind in the working tree.
 */
export function writeTransientProbeFile(
  relative: string,
  contents: string,
  root: string = transientProbeRoot(),
): string {
  if (!(TRANSIENT_PROBE_FILES as readonly string[]).includes(relative)) {
    throw new Error(
      `${relative} is not registered in TRANSIENT_PROBE_FILES, so nothing would clean it up. ` +
        `Add it there before writing it.`,
    );
  }
  const absolute = path.join(root, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents, "utf8");
  return absolute;
}
