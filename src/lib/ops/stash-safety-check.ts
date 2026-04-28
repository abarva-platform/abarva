/**
 * Integration Stash Safety Check — TypeScript read model.
 *
 * Mirrors the output schema produced by
 * scripts/integration/stash_safety_check.py without invoking any subprocess.
 * All logic operates on fixture data passed by the caller, making this module
 * safe for use in test suites, build-time checks, and UI surfaces.
 *
 * No subprocess, no fs reads, no network, no Date.now(), no Math.random().
 * generatedAt is accepted as a caller-supplied string so callers control
 * determinism (pass new Date().toISOString() or a fixed string in tests).
 */

export interface StashRecord {
  index: number;
  branch: string;
  description: string;
  isCurrentBranch: boolean;
  recommendedAction: "inspect" | "create-recovery-branch" | "drop-after-confirmation";
}

export interface StashSafetyReport {
  generatedAt: string;
  currentBranch: string;
  totalStashes: number;
  stashesFromOtherBranches: number;
  isSafeToIntegrate: boolean;
  safetyWarning: string | null;
  stashes: StashRecord[];
  recommendedPreflightActions: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function deriveRecommendedAction(
  stash: StashRecord,
  currentBranch: string
): StashRecord["recommendedAction"] {
  if (!stash.branch) {
    return "inspect";
  }
  if (stash.branch === currentBranch) {
    return "inspect";
  }
  return "create-recovery-branch";
}

function buildPreflightActions(
  stashes: StashRecord[],
  currentBranch: string
): string[] {
  if (stashes.length === 0) {
    return [];
  }

  const actions: string[] = [
    "Run `git stash list` to review all stash entries.",
  ];

  for (const stash of stashes) {
    if (!stash.isCurrentBranch && stash.branch) {
      actions.push(
        `stash@{${stash.index}}: Create a recovery branch from this stash ` +
          `(branch '${stash.branch}') before integration: ` +
          `\`git stash branch recovery/${stash.branch}-stash-${stash.index} ` +
          `stash@{${stash.index}}\``
      );
    } else {
      actions.push(
        `stash@{${stash.index}}: Inspect with ` +
          `\`git stash show -p stash@{${stash.index}}\` ` +
          "and drop only after confirming it is safe: " +
          `\`git stash drop stash@{${stash.index}}\``
      );
    }
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a StashSafetyReport from fixture data.
 *
 * @param stashes      - Array of StashRecord objects (from fixture or test data).
 * @param currentBranch - The branch that integration will run on.
 * @param generatedAt  - ISO timestamp string; defaults to the empty string if
 *                       not provided (callers should supply a real timestamp).
 * @returns A fully populated StashSafetyReport.
 */
export function buildStashSafetyReportFromFixture(
  stashes: StashRecord[],
  currentBranch: string,
  generatedAt = ""
): StashSafetyReport {
  const normalizedStashes: StashRecord[] = stashes.map((s) => ({
    ...s,
    isCurrentBranch: Boolean(s.branch) && s.branch === currentBranch,
    recommendedAction: deriveRecommendedAction(s, currentBranch),
  }));

  const totalStashes = normalizedStashes.length;
  const stashesFromOtherBranches = normalizedStashes.filter(
    (s) => !s.isCurrentBranch && Boolean(s.branch)
  ).length;
  const isSafeToIntegrate = totalStashes === 0;

  let safetyWarning: string | null = null;
  if (stashesFromOtherBranches > 0) {
    safetyWarning =
      `${stashesFromOtherBranches} stash(es) from OTHER branches detected. ` +
      "A stash pop from a different branch can inject conflict markers " +
      "into the working tree. DO NOT run `git stash pop` until these " +
      "are resolved.";
  } else if (totalStashes > 0) {
    safetyWarning =
      `${totalStashes} stash(es) detected on the current branch. ` +
      "Inspect them before running integration steps.";
  }

  const recommendedPreflightActions = buildPreflightActions(
    normalizedStashes,
    currentBranch
  );

  return {
    generatedAt,
    currentBranch,
    totalStashes,
    stashesFromOtherBranches,
    isSafeToIntegrate,
    safetyWarning,
    stashes: normalizedStashes,
    recommendedPreflightActions,
  };
}
