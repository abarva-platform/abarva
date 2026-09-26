import {
  holdsTransientProbeOwnership,
  releaseTransientProbeOwnership,
} from "./transient-probe-ownership";
import { removeTransientProbeFiles, transientProbeRoot } from "./transient-probe-files";

/**
 * Runs once after every worker has exited (items T-759, T-485).
 *
 * This is the only place a file added during the run may be removed. Removing
 * it inside the run is what made the gated behaviors directory
 * non-deterministically red: thirty-one suites enumerate the test files under
 * `src/` and then read them, and a file that vanishes between those two steps
 * kills the reader with ENOENT.
 *
 * T-485: "after every worker has exited" is true of this run's workers, not of
 * the outer run's when this one is nested inside it. A nested run removes
 * nothing and leaves the claim alone; the owner's teardown, which runs when its
 * own workers are gone, does the removal.
 */
export default function globalTeardown(): void {
  const root = transientProbeRoot();
  if (!holdsTransientProbeOwnership(root)) return;
  removeTransientProbeFiles(root);
  releaseTransientProbeOwnership(root);
}
