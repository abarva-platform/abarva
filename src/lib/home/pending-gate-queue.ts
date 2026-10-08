// Which phase gate a Move is waiting on, for Home's attention queue.
//
// Home's queue used to derive "a gate is pending" from the PRESENCE of a
// `gates_passed` entry that is not approved. Nothing writes such an entry, so
// the item was structurally unreachable:
//
//   - `advancePhase` (the only path a product gate approval takes) writes
//     `current_phase` and never touches `gates_passed`, so the array does not
//     grow as gates are approved.
//   - The one live `gates_passed` write appends a BARE NUMBER at the terminal
//     P5 handoff, and the old reader skipped non-objects outright.
//   - Seeds write APPROVED records.
//
// So every entry the reader could ever see was either approved or skipped, and
// Home never reported a gate awaiting approval for any Move.
//
// The question is asked the other way round here: a Move sitting at phase N is
// waiting on phase N's gate unless something affirmatively records that gate as
// approved. That is self-correcting against the write behaviour above — an
// approval advances `current_phase`, so the pending phase moves forward with
// the Move instead of latching on a phase whose approval the array never
// receives.
//
// This reads `gates_passed` ONLY. It is not a statement about `phase_snapshots`,
// which is where a product gate approval's canonical record actually lands; a
// Move whose gate is approved still reports pending here until it advances.
// Advancement is part of the same approval call, so that window is the request,
// not a state the product rests in.

/** Approval words a recorded gate entry may carry. */
const APPROVED_STATUSES = new Set([
  "approved",
  "signed_off",
  "complete",
  "completed",
]);

/** Timestamp/actor fields whose presence records an approval. */
const APPROVAL_SIGNAL_FIELDS = [
  "approved_at",
  "approved_by",
  "signed_at",
  "signed_by",
] as const;

function phaseOf(entry: Record<string, unknown>): number | null {
  const raw = entry.phase ?? entry.phase_number ?? entry.phaseNumber;
  return typeof raw === "number" && Number.isInteger(raw) ? raw : null;
}

/**
 * Does this `gates_passed` entry affirmatively record `phase`'s gate as
 * approved?
 *
 * A bare number counts: that is the form the terminal P5 write appends, and it
 * is written only once that gate has passed. An object must both name the phase
 * and carry an approval signal — a record that names the phase and says nothing
 * else is NOT an approval, which is the one case the previous reader handled and
 * is preserved here.
 */
export function recordsGateApproval(entry: unknown, phase: number): boolean {
  if (typeof entry === "number") return entry === phase;
  if (typeof entry !== "object" || entry === null) return false;
  const gate = entry as Record<string, unknown>;
  if (phaseOf(gate) !== phase) return false;
  const status = gate.status;
  if (typeof status === "string" && APPROVED_STATUSES.has(status.toLowerCase()))
    return true;
  return APPROVAL_SIGNAL_FIELDS.some((field) => Boolean(gate[field]));
}

/** The lowest and highest phase a Move can be waiting on a gate for. */
const FIRST_PHASE = 0;
const LAST_PHASE = 5;

/**
 * The phase whose gate the Move is waiting on, or `null` when it is waiting on
 * none.
 *
 * `null` when the Move's phase is outside P0–P5 — a terminal handoff advances
 * past the last gate (`newPhase: 6`), and there is no further gate to approve —
 * or when an entry records the current phase's gate as approved.
 */
export function pendingGatePhase(input: {
  currentPhase: unknown;
  gatesPassed: unknown;
}): number | null {
  const phase = input.currentPhase;
  if (typeof phase !== "number" || !Number.isInteger(phase)) return null;
  if (phase < FIRST_PHASE || phase > LAST_PHASE) return null;
  const entries = Array.isArray(input.gatesPassed) ? input.gatesPassed : [];
  if (entries.some((entry) => recordsGateApproval(entry, phase))) return null;
  return phase;
}
