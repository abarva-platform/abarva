export interface GovernedStageEvidenceReadinessRow {
  label: string;
  required: boolean;
  ready: boolean;
}

export interface GovernedStageEvidenceReadinessBrief {
  requiredReady: number;
  requiredTotal: number;
  missingLabels: string[];
  missingLine: string;
  nextAction: string;
}

/**
 * Compact, deterministic projection of the same governed requirement rows the
 * Files workspace renders. It carries no analytics math; it only keeps adjacent
 * Intelligence copy honest about evidence and the operator's next action.
 */
export function buildGovernedStageEvidenceReadinessBrief(
  rows: readonly GovernedStageEvidenceReadinessRow[],
): GovernedStageEvidenceReadinessBrief | null {
  const requiredRows = rows.filter((row) => row.required);
  if (requiredRows.length === 0) return null;

  const missingLabels = requiredRows
    .filter((row) => !row.ready)
    .map((row) => row.label);
  const requiredReady = requiredRows.length - missingLabels.length;

  return {
    requiredReady,
    requiredTotal: requiredRows.length,
    missingLabels,
    missingLine:
      missingLabels.length === 0
        ? `${requiredRows.length} of ${requiredRows.length} required evidence items ready`
        : `${requiredReady} of ${requiredRows.length} required evidence items ready. Missing: ${missingLabels.join(", ")}`,
    nextAction:
      missingLabels.length === 0
        ? "Required evidence is ready; continue with the governed review path."
        : `Open Files and load or review required evidence: ${missingLabels.join(", ")}.`,
  };
}
