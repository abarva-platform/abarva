// Whether the gate attestation ledger's sign-off column is a fact, and what it
// may say about a gate document when it is not.
//
// The ledger in `PhaseApproveAndBuild` renders one row per gate deliverable and
// joins its build row with per-deliverable sign-off state. That state rides on
// the artifact rows as `deliverableId` / `currentVersion` / `signedOffVersion`,
// and only `GET .../artifacts` carries it: the route reads the
// `deliverables_v2` projection separately from the artifact vault.
//
// Which left one shape — "no sign-off record on this row" — standing for three
// different facts:
//
//  1. The projection was read and holds no row for this deliverable key. There
//     is nothing to sign off against; the ledger's "On record. No sign-off
//     version is tracked for this document yet." is true.
//  2. The projection read FAILED. The loader fail-opens to an empty map, so
//     every gate document on the phase loses its sign-off columns at once —
//     including documents that ARE signed off. The ledger then states
//     "0/N signed off" in its neutral tone and annotates each document as
//     having no sign-off version tracked, which is a negative assertion about
//     a state nothing read.
//  3. The rows were never carried by that route at all. The server-rendered
//     phase page builds its artifact list from the vault directly and declares
//     no sign-off columns, so on first paint — and permanently, on the host
//     that renders only those rows — the ledger says the same thing.
//
// Cases 2 and 3 also quietly release the ledger's own hold: the submit control
// is held only by a KNOWN-unsigned built document (`state === "draft"`), which
// requires a sign-off record to exist. With no record the entries fall to
// "unverified", the hold does not engage, and no control offers sign-off —
// so the reader is shown neither the sign-off state nor the fact that it is
// missing.
//
// This module owns the distinction. It is the sibling of
// `evidence-cabinet-readback.ts`, which does the same job for the same route's
// evidence-review lists, and it follows that module's rules: a failed read
// outranks whatever is on screen, and an absent or unrecognised status is
// `unknown` rather than available, so a route that stops sending the field
// cannot make the ledger assert health it was never told about. No database
// access and no `server-only`, so a suite can import it directly.

/**
 * What is known about the sign-off state rendered beside each gate document.
 *
 * - `unread` — no read of the sign-off projection has completed on this
 *   screen. Nothing on screen is stale, because nothing was ever stated; this
 *   is the state of the server-rendered artifact list, which carries no
 *   sign-off columns by construction.
 * - `available` — the route read the projection and said so. The columns are
 *   current and the ledger may state a count.
 * - `unavailable` — the route answered and reported that its own sign-off
 *   sub-read failed. The artifact list is current; the sign-off columns are
 *   absent for every row, whatever each document's real state is.
 * - `unknown` — the artifact read itself did not complete, or answered without
 *   saying. Whatever sign-off state is on screen came from an earlier read, if
 *   any.
 *
 * `unread` and `unknown` are deliberately separate: both mean the sign-off
 * state is not known, but only `unknown` means a read was attempted and lost,
 * which is the one worth warning about. A warning on `unread` would fire on
 * every initial paint.
 */
export type GateSignOffReadbackState =
  | "unread"
  | "available"
  | "unavailable"
  | "unknown";

export interface GateSignOffReadback {
  state: GateSignOffReadbackState;
  /**
   * True only when "N/M signed off" is a fact. False means the ledger must
   * show `countLabel` instead: a tally of recorded sign-offs taken from rows
   * that carry no sign-off columns always reads zero, which is indistinguishable
   * from a phase whose documents are genuinely all unsigned.
   */
  canStateSignedCount: boolean;
  /** Pill text to use in place of the count. Null when the count is a fact. */
  countLabel: string | null;
  /** Section-level warning, or null when there is nothing to warn about. */
  warning: string | null;
  /**
   * Badge for a gate document whose row carries no sign-off record. Worded
   * distinctly from `countLabel`: the two render in the same section, so a
   * badge that repeats the section's own pill says nothing about the document
   * it sits on — and a test reading either one would then be satisfied by the
   * other.
   */
  noRecordLabel: string;
  /** Sentence under a gate document whose row carries no sign-off record. */
  noRecordNote: string;
}

const AVAILABLE_NO_RECORD_LABEL = "On record";
const AVAILABLE_NO_RECORD_NOTE =
  "On the record. No sign-off version is tracked for this document yet.";

const UNREAD_NO_RECORD_NOTE =
  "The sign-off record for this document has not been read on this screen, " +
  "so nothing here says whether it is signed off.";

const DEGRADED_NO_RECORD_NOTE =
  "The sign-off record for this document could not be read, so this is not a " +
  "statement that it is unsigned.";

const UNAVAILABLE_WARNING =
  "The sign-off records for this phase could not be read, so no document " +
  "below is being reported as unsigned — its state is unknown, not negative. " +
  "Reload before submitting the gate, and sign off from Files & Evidence if " +
  "you need to act now.";

const UNKNOWN_WARNING =
  "The document list could not be refreshed, so the sign-off state beside " +
  "each gate document may be out of date — a sign-off that was recorded can " +
  "still read as untracked here. Reload before submitting the gate.";

/**
 * Classify what the ledger knows about its sign-off column.
 *
 * `completed: false` is the un-run read: the state the gate step holds before
 * its first artifact fetch resolves, and the permanent state of a host that
 * renders only server-provided artifact rows. `loadFailed` outranks the status
 * field, because a status can only describe a response that arrived.
 */
export function describeGateSignOffReadback(input: {
  completed?: boolean;
  loadFailed?: boolean;
  deliverableSignOffStatus?: unknown;
}): GateSignOffReadback {
  if (input.completed === false || input.completed === undefined) {
    return {
      state: "unread",
      canStateSignedCount: false,
      countLabel: "Sign-off state not read",
      warning: null,
      noRecordLabel: "Not read",
      noRecordNote: UNREAD_NO_RECORD_NOTE,
    };
  }
  if (input.loadFailed) {
    return {
      state: "unknown",
      canStateSignedCount: false,
      countLabel: "Sign-off state unknown",
      warning: UNKNOWN_WARNING,
      noRecordLabel: "Read failed",
      noRecordNote: DEGRADED_NO_RECORD_NOTE,
    };
  }
  if (input.deliverableSignOffStatus === "available") {
    return {
      state: "available",
      canStateSignedCount: true,
      countLabel: null,
      warning: null,
      noRecordLabel: AVAILABLE_NO_RECORD_LABEL,
      noRecordNote: AVAILABLE_NO_RECORD_NOTE,
    };
  }
  if (input.deliverableSignOffStatus === "unavailable") {
    return {
      state: "unavailable",
      canStateSignedCount: false,
      countLabel: "Sign-off state unavailable",
      warning: UNAVAILABLE_WARNING,
      noRecordLabel: "Record unreadable",
      noRecordNote: DEGRADED_NO_RECORD_NOTE,
    };
  }
  return {
    state: "unknown",
    canStateSignedCount: false,
    countLabel: "Sign-off state unknown",
    warning: UNKNOWN_WARNING,
    noRecordLabel: "Read failed",
    noRecordNote: DEGRADED_NO_RECORD_NOTE,
  };
}
