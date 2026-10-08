// Which of a Move's phase gates have actually been approved.
//
// Two records can say a gate was approved, and they do not cover the same
// phases.
//
// `engagements.gates_passed` is a denormalized array. On the Moves path the
// only reachable control that appends to it is the terminal P5 handoff in the
// phase-gate-approval route, and it appends the bare number 5. Both writers
// that would record phases 1-4 are unreachable: the legacy
// `/api/programs/phase-gate` route has no product fetcher, and
// `recordGateApproval` has no callers at all. So for a Move walked through the
// product the array holds whatever its seed wrote and nothing more — approving
// the P1, P2, P3 or P4 gate appends nothing to it.
//
// `phase_snapshots` is the authoritative record. The gate-approval route
// inserts an `approved` row for the phase it approved, and that row is what the
// phase surfaces re-read when they check whether an approval still holds.
//
// Asking only `gates_passed` therefore reads a silent array as "no gate has
// been approved". That is what `loadDecisions` and `loadPhaseCapture` in
// `moves-generate-deps.ts` did, while their sibling `gateApproved` in the same
// file consulted the snapshots as well. For `loadPhaseCapture` the difference
// is not cosmetic: earlier-phase capture is inherited into a phase's generation
// context only for phases whose gate it believes passed, so a deliverable
// drafted at P3 or later was written without any capture from the phases before
// it, and nothing reported the omission — an inherited block is additive, so
// being handed none is byte-identical to a phase that genuinely had none.
//
// One predicate, asked of both records, so a reader cannot consult only the one
// that is never written.
//
// Each arm keeps the rule its original caller used, so this is a union of two
// existing rules and not a new one: the `gates_passed` arm accepts the bare
// phase, its string forms, and the seven recorded phase-key spellings with an
// `approved`/`passed`/`complete`/`completed` status (absent status means
// approved, as the denormalized array has always been read); the snapshot arm
// requires `approved` exactly, as `gateApproved` required it.

/** A `phase_snapshots` row, in either the camelCase or raw-column spelling. */
export type ApprovedGateSnapshot = {
  phaseNumber?: number | null;
  phase_number?: number | null;
  approvalStatus?: string | null;
  approval_status?: string | null;
};

export type ApprovedGateSources = {
  /** `engagements.gates_passed`, in any of the shapes it has been written in. */
  gatesPassed?: readonly unknown[] | null;
  /** `phase_snapshots` rows for the Move. Omit when none were loaded. */
  snapshots?: readonly ApprovedGateSnapshot[] | null;
};

const GATES_PASSED_APPROVED_STATUSES = [
  "approved",
  "passed",
  "complete",
  "completed",
];

/** The phase keys `gates_passed` records have been written under. */
const PHASE_KEYS = [
  "phase",
  "phase_number",
  "phaseNumber",
  "fromPhase",
  "from_phase",
  "completedPhase",
  "completed_phase",
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function namesPhase(value: unknown, phase: number): boolean {
  return (
    value === phase || value === String(phase) || value === `P${phase}`
  );
}

/**
 * The `engagements.gates_passed` rule on its own. Exported because a caller
 * that has only the array — and knows it has only the array — should be able to
 * say so explicitly rather than pass `snapshots: []` and imply it looked.
 */
export function gatesPassedContainsPhase(
  gatesPassed: readonly unknown[] | null | undefined,
  phase: number,
): boolean {
  if (!Array.isArray(gatesPassed)) return false;
  return gatesPassed.some((entry) => {
    if (namesPhase(entry, phase)) return true;
    const gate = asRecord(entry);
    if (!gate) return false;
    const status = String(
      gate.status ?? gate.approval_status ?? "approved",
    ).toLowerCase();
    if (!GATES_PASSED_APPROVED_STATUSES.includes(status)) return false;
    return PHASE_KEYS.some((key) => namesPhase(gate[key], phase));
  });
}

/** The `phase_snapshots` rule on its own: an `approved` row for the phase. */
export function snapshotsApprovePhase(
  snapshots: readonly ApprovedGateSnapshot[] | null | undefined,
  phase: number,
): boolean {
  if (!Array.isArray(snapshots)) return false;
  return snapshots.some((snapshot) => {
    const snapshotPhase = snapshot.phaseNumber ?? snapshot.phase_number;
    if (snapshotPhase !== phase) return false;
    const status = snapshot.approvalStatus ?? snapshot.approval_status;
    return status === "approved";
  });
}

/**
 * Has this phase's gate been approved, according to either record?
 *
 * Both are consulted because neither is complete on its own: the array is not
 * written for phases 1-4 by any reachable control, and a Move may carry seeded
 * gate records that predate any snapshot.
 */
export function isGateApprovedForPhase(
  sources: ApprovedGateSources,
  phase: number,
): boolean {
  return (
    gatesPassedContainsPhase(sources.gatesPassed, phase) ||
    snapshotsApprovePhase(sources.snapshots, phase)
  );
}
