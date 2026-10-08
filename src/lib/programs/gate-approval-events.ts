// When a Move's gate approvals happened, for surfaces that show them in time.
//
// `approved-gate-phases.ts` answers *whether* a phase's gate is approved. A
// chronological surface needs one thing more — *when* — and the two records
// that can say a gate was approved do not carry a time equally well.
//
// `phase_snapshots` is datable. Both `runAdvancePhase` implementations in
// `programsWriteAdapter` insert a row for the phase being left, stamped
// `approved` when an approver is recorded, with `locked_at` set to the moment
// of the write; the P5 terminal handoff in the phase-gate-approval route
// inserts the same shape for phase 5. So every approval the product path
// performs leaves a timestamped row.
//
// `engagements.gates_passed` is not datable on the product path. The only
// reachable writer appends the BARE NUMBER 5 — no status field, no timestamp —
// and the advance SQL omits the column entirely, so a reader that asks this
// array for `status === 'approved' && signed_at` finds nothing at any phase.
// Seeded and legacy records may carry `signed_at`, and those are honoured, so
// a Move whose history predates the snapshot table still reads.
//
// Approval is decided by `isGateApprovedForPhase` rather than re-tested here:
// the vocabulary of what counts as approved is already stated once, and this
// module only dates what that predicate admits.
//
// An approval that no record can date is returned separately rather than
// dropped silently or given an invented time. A reverse-chronological stream
// has no honest position for an undated event, but a caller should still be
// able to say the approval happened.

import {
  isGateApprovedForPhase,
  type ApprovedGateSources,
  type ApprovedGateSnapshot,
} from "./approved-gate-phases";
import { PHASE_CODES, PHASE_LABELS_SHORT, TOTAL_PHASES } from "./phase-labels";

/** A `phase_snapshots` row as a timeline needs it: approval plus its time. */
export type DatedGateSnapshot = ApprovedGateSnapshot & {
  lockedAt?: string | null;
  locked_at?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  snapshot?: Record<string, unknown> | null;
  snapshot_jsonb?: Record<string, unknown> | null;
};

export type DatedGateSources = Omit<ApprovedGateSources, "snapshots"> & {
  snapshots?: readonly DatedGateSnapshot[] | null;
};

export type GateApprovalEvent = {
  /** The phase whose gate was approved. */
  phase: number;
  /** Canonical user-facing label, from `phase-labels.ts`. */
  label: string;
  /** Approver-supplied rationale when the record carries one. */
  detail: string | null;
  /** ISO timestamp the surface orders by. */
  at: string;
  /** Which record supplied the timestamp. */
  source: "snapshot" | "gates_passed";
};

export type GateApprovalEvents = {
  /** Dated approvals, newest first. */
  events: GateApprovalEvent[];
  /** Phases approved by some record that carries no usable timestamp. */
  undatedPhases: number[];
};

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

function isoOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number.isNaN(Date.parse(trimmed)) ? null : trimmed;
}

function namesPhase(value: unknown, phase: number): boolean {
  return value === phase || value === String(phase) || value === `P${phase}`;
}

function rationaleOf(snapshot: DatedGateSnapshot): string | null {
  const body = snapshot.snapshot ?? snapshot.snapshot_jsonb;
  const record = asRecord(body);
  if (!record) return null;
  const raw = record.humanRationale ?? record.human_rationale ?? record.summary;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

/**
 * The newest datable `approved` snapshot for a phase. `locked_at` is the
 * approving control's own stamp and is preferred; `created_at` is the row's
 * insert time and stands in when the stamp is absent.
 */
function latestSnapshotFor(
  snapshots: readonly DatedGateSnapshot[] | null | undefined,
  phase: number,
): { at: string; detail: string | null } | null {
  if (!Array.isArray(snapshots)) return null;
  let best: { at: string; detail: string | null } | null = null;
  for (const snapshot of snapshots) {
    const snapshotPhase = snapshot.phaseNumber ?? snapshot.phase_number;
    if (snapshotPhase !== phase) continue;
    const status = snapshot.approvalStatus ?? snapshot.approval_status;
    if (status !== "approved") continue;
    const at =
      isoOrNull(snapshot.lockedAt ?? snapshot.locked_at) ??
      isoOrNull(snapshot.createdAt ?? snapshot.created_at);
    if (!at) continue;
    if (!best || at > best.at) best = { at, detail: rationaleOf(snapshot) };
  }
  return best;
}

/**
 * The newest `signed_at` a `gates_passed` record carries for a phase. Only
 * object entries can be dated; a bare number names its phase and nothing more.
 */
function latestGatesPassedFor(
  gatesPassed: readonly unknown[] | null | undefined,
  phase: number,
): { at: string; detail: string | null } | null {
  if (!Array.isArray(gatesPassed)) return null;
  let best: { at: string; detail: string | null } | null = null;
  for (const entry of gatesPassed) {
    const gate = asRecord(entry);
    if (!gate) continue;
    if (!PHASE_KEYS.some((key) => namesPhase(gate[key], phase))) continue;
    const at = isoOrNull(gate.signed_at ?? gate.signedAt);
    if (!at) continue;
    const summary = typeof gate.summary === "string" ? gate.summary.trim() : "";
    if (!best || at > best.at) best = { at, detail: summary || null };
  }
  return best;
}

function labelFor(phase: number): string {
  const code = PHASE_CODES[phase] ?? `P${phase}`;
  const short = PHASE_LABELS_SHORT[phase];
  return short ? `${code} ${short} gate approved` : `${code} gate approved`;
}

/**
 * Dated gate-approval events for a Move, newest first.
 *
 * Both records are consulted for approval (neither is complete alone) and both
 * are consulted for a time, preferring the authoritative snapshot.
 */
export function buildGateApprovalEvents(
  sources: DatedGateSources,
): GateApprovalEvents {
  const events: GateApprovalEvent[] = [];
  const undatedPhases: number[] = [];

  for (let phase = 0; phase < TOTAL_PHASES; phase += 1) {
    if (!isGateApprovedForPhase(sources, phase)) continue;
    const fromSnapshot = latestSnapshotFor(sources.snapshots, phase);
    const fromArray = latestGatesPassedFor(sources.gatesPassed, phase);
    const dated = fromSnapshot ?? fromArray;
    if (!dated) {
      undatedPhases.push(phase);
      continue;
    }
    events.push({
      phase,
      label: labelFor(phase),
      detail: dated.detail,
      at: dated.at,
      source: fromSnapshot ? "snapshot" : "gates_passed",
    });
  }

  events.sort((a, b) => (a.at === b.at ? b.phase - a.phase : b.at.localeCompare(a.at)));
  return { events, undatedPhases };
}
