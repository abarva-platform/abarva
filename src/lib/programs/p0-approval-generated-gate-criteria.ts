// Which open P0 hard gate criteria a reader can actually act on.
//
// The P0 -> P1 rule in `governance.ts` carries three hard checks. Two of them
// — `program_seed_recorded` and `value_hypothesis_seed` — are evaluated from
// `hasSignedOriginationBrief`, and the ONLY thing that signs the origination
// brief is `closeP0OnApproval`, which runs as part of approving the P0 gate.
// So in the normal ready-to-approve state both read as open hard criteria, and
// there is no control anywhere in the product that can clear either one first.
//
// Treating them as blockers made a ready P0 describe itself as blocked: the
// decision card titled itself "P0 cannot advance yet", the next action read
// "Clear hard blockers", and a note headed "Why some checks are still open"
// told the reader to upload and review a source file they had already uploaded
// and reviewed — all beside an enabled, working "Approve gate" button, and
// directly above the same two criteria annotated "Completed by approving this
// gate". The partition below is what separates the two readings.
//
// `sponsor_assigned` is deliberately NOT in this set. It passes on `hasSponsor`
// alone, so recording a sponsor is a real control a reader can use before
// approval, and it stays a genuine blocker.
//
// The carve-out is P0-only: its whole basis is the brief that the P0 close
// signs. At P1+ every open hard criterion is actionable.

export const P0_APPROVAL_GENERATED_CRITERION_KEYS = [
  "program_seed_recorded",
  "value_hypothesis_seed",
] as const;

export type P0ApprovalGeneratedCriterionKey =
  (typeof P0_APPROVAL_GENERATED_CRITERION_KEYS)[number];

const KEY_SET: ReadonlySet<string> = new Set(
  P0_APPROVAL_GENERATED_CRITERION_KEYS,
);

/**
 * True when `key` names a P0 hard criterion that the P0 gate approval itself
 * completes. Only meaningful at phase 0; see the module note.
 */
export function isP0ApprovalGeneratedCriterion(key: string): boolean {
  return KEY_SET.has(key);
}

/**
 * Split the open hard criteria of a phase into the ones a reader can act on
 * and the ones that the gate approval completes on its own.
 *
 * At any phase other than 0 the second list is always empty, so callers can
 * use `actionable` unconditionally for blocked-state reckoning.
 */
export function partitionOpenHardGateCriteria<T extends { id: string }>(args: {
  phase: number;
  openHardCriteria: readonly T[];
}): { actionable: T[]; approvalGenerated: T[] } {
  if (args.phase !== 0) {
    return { actionable: [...args.openHardCriteria], approvalGenerated: [] };
  }
  const actionable: T[] = [];
  const approvalGenerated: T[] = [];
  for (const criterion of args.openHardCriteria) {
    if (isP0ApprovalGeneratedCriterion(criterion.id)) {
      approvalGenerated.push(criterion);
    } else {
      actionable.push(criterion);
    }
  }
  return { actionable, approvalGenerated };
}
