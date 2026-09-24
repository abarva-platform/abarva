import { removeTransientProbeFiles } from "./transient-probe-files";

/**
 * Runs once before any worker starts (item T-759).
 *
 * A probe file leaked by a killed run is in the tree when the next run
 * enumerates it, and `t743-agent-tests-directory-ci.test.ts` then measures
 * "one more file than before" against a directory that already holds it. Clear
 * it here, where no worker exists to observe the removal.
 */
export default function globalSetup(): void {
  const removed = removeTransientProbeFiles();
  if (removed.length > 0) {
    console.log(
      `[t759] cleared ${removed.length} probe file(s) leaked by an earlier run: ${removed.join(", ")}`,
    );
  }
}
