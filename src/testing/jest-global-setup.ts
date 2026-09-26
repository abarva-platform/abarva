import { claimTransientProbeOwnership } from "./transient-probe-ownership";
import { removeTransientProbeFiles, transientProbeRoot } from "./transient-probe-files";

/**
 * Runs once before any worker starts (items T-759, T-485).
 *
 * A probe file leaked by a killed run is in the tree when the next run
 * enumerates it, and `t743-agent-tests-directory-ci.test.ts` then measures
 * "one more file than before" against a directory that already holds it. Clear
 * it here, where no worker exists to observe the removal.
 *
 * T-485: "no worker exists" is only true for the run that owns this tree. A
 * Jest run nested inside another one — this repository starts one from
 * `check-source-integration-quarantine.mjs`, which spawns Jest over eight
 * Source integration suites with `cwd: REPO` — executes this same hook while
 * the outer run's workers are mid-read, and clearing the probe there is what
 * kept the gated behaviors directory non-deterministically red. So the run
 * asks first whether it owns the tree, and a nested run clears nothing.
 */
export default function globalSetup(): void {
  const root = transientProbeRoot();
  const outcome = claimTransientProbeOwnership(root);
  if (!outcome.owner) {
    console.log(
      `[t485] nested Jest run: probe files under ${root} belong to pid ${outcome.heldBy}; ` +
        "clearing nothing.",
    );
    return;
  }

  const removed = removeTransientProbeFiles(root);
  if (removed.length > 0) {
    console.log(
      `[t759] cleared ${removed.length} probe file(s) leaked by an earlier run: ${removed.join(", ")}`,
    );
  }
}
