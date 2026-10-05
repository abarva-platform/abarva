// Approvals overview labels — what the per-phase approvals table may state,
// and what it must withhold.
//
// The overview is headed "Gate-approval status across every phase of this
// Move". Three of its four reading columns were asserting more than anything
// on the screen had measured:
//
//  1. THE APPROVER COLUMN WAS A LITERAL. Its source was a function that took
//     a phase number, ignored it, and returned one constant string for all six
//     rows — so the column answered "who approved this gate?" without any
//     approval record being read. Nothing threaded to this surface carries an
//     approver: a client-side `StrategicMove` has no gate-approval record at
//     all. `formatApproverCell` therefore takes the record as its only
//     argument, so a caller that has none cannot produce a name: the invariant
//     lives in the signature, not in a test.
//
//  2. "APPROVED" NAMED A DECISION NOBODY READ. A row's `state: "done"` is
//     inferred by `getMovePhaseTallies` from the Move having advanced past the
//     phase (`phase < currentPhase`, or `terminalComplete`). That inference is
//     sound for the GATE — advancement really is gated by the gate criteria —
//     but it does not evidence an approval event, an approver or a date, which
//     is precisely what a column headed "Status" beside a column headed
//     "Approver" is read as asserting. The row now states the sound part
//     ("Gate passed") and carries its basis in a title.
//
//  3. THE SAME QUANTITY APPEARED TWICE IN ONE ROW, IN TWO NOTATIONS. The gate
//     criteria cell read `0 of 2 met` while the status cell beside it read
//     `0/2 met - not yet submitted` — one quantity, two forms, so a reader
//     could take them for two different measurements. The status cell now
//     states only the status; the tally lives in the tally column, where the
//     column head supplies its noun, and the noun is agreed to the count in
//     the cell's title.

export interface ApprovalsRow {
  met: number;
  total: number;
  state: "done" | "current" | "upcoming";
}

/** The noun agreed to the count, so a row can never read "1 gate criteria". */
export function agreeGateCriterionNoun(total: number): string {
  return total === 1 ? "gate criterion" : "gate criteria";
}

/**
 * The tally column's own text. Bare of the noun by design — the column head
 * carries it, and `formatGateCriteriaTitle` names the set on hover. Keeping
 * the bare form here is what lets the status column drop its duplicate.
 */
export function formatGateCriteriaCell(row: ApprovalsRow): string {
  return `${row.met} of ${row.total} met`;
}

/** Names the set the tally counts, with the noun agreed to the total. */
export function formatGateCriteriaTitle(row: ApprovalsRow): string {
  return `${row.met} of ${row.total} ${agreeGateCriterionNoun(row.total)} met`;
}

/**
 * The status column. "Gate passed" rather than "Approved": the state is
 * inferred from advancement, and no approval record reaches this surface.
 */
export function approvalsRowStatusText(row: ApprovalsRow): string {
  if (row.state === "done") return "Gate passed";
  if (row.state === "current") {
    return row.met === row.total ? "Ready to submit" : "Not yet submitted";
  }
  return "Not reached";
}

/** Where a status's reading comes from, for the cell's title. */
export function approvalsRowStatusBasis(row: ApprovalsRow): string | undefined {
  if (row.state === "done") {
    return "Inferred from this Move having advanced past the phase - no approval record is read on this view.";
  }
  if (row.state === "current") {
    return `${formatGateCriteriaTitle(row)} on the Move's live gate evaluation.`;
  }
  return undefined;
}

export function approvalsRowStatusClass(row: ApprovalsRow): string {
  if (row.state === "done") return "passed";
  if (row.state === "current") {
    return row.met === row.total ? "ready" : "pending";
  }
  return "upcoming";
}

export interface ApproverCell {
  text: string;
  /** False whenever the text is an absence, so the host can style it as one. */
  recorded: boolean;
}

/**
 * The approver column. Takes the recorded approver and nothing else: with no
 * record there is no name to render, and an absence is spelled out rather than
 * dashed, because a dash reads as "zero" as readily as "not known".
 */
export function formatApproverCell(
  recordedApprover: string | null | undefined,
): ApproverCell {
  const trimmed = (recordedApprover ?? "").trim();
  if (trimmed.length === 0) {
    return { text: "Not recorded", recorded: false };
  }
  return { text: trimmed, recorded: true };
}
