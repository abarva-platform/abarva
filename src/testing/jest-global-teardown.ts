import { removeTransientProbeFiles } from "./transient-probe-files";

/**
 * Runs once after every worker has exited (item T-759).
 *
 * This is the only place a file added during the run may be removed. Removing
 * it inside the run is what made the gated behaviors directory
 * non-deterministically red: thirty-one suites enumerate the test files under
 * `src/` and then read them, and a file that vanishes between those two steps
 * kills the reader with ENOENT.
 */
export default function globalTeardown(): void {
  removeTransientProbeFiles();
}
