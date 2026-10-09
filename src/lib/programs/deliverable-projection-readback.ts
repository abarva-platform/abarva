// Whether the Documents tab's sign-off column is a fact, and what a document
// row may say about itself when it is not.
//
// `PhaseDocumentsPanel` (the /evidence Documents tab) renders one row per
// canonical deliverable and joins two independent reads:
//
//   • the `deliverables_v2` projection, which owns `signed_off_version` /
//     `current_version` and the row id that `DeliverableApprovalAction` signs
//     off against; and
//   • the orchestrator run history, which owns "was a file built for this
//     slot" and the artifact to preview or download.
//
// Nothing ties the two together, so one can answer while the other does not.
// The projection read resolved a failed query to `{ data: null, error }` and
// the panel destructured `data` alone, fail-opening to an EMPTY MAP — which is
// the identical row shape to "this Move has no document on record for that
// key". One failed read therefore stripped the sign-off columns from EVERY row
// at once, and the panel went on making a positive assertion about each one:
// the "Signed off" badge disappeared, the AI-draft badge appeared in its place,
// and the approve control — mounted only where a row exists — was withheld
// without a word. A phase whose gate documents were all signed off read as a
// phase of unapproved drafts with nothing to approve, while the exit gate went
// on refusing the Move with "<document> is not signed off".
//
// `GET .../artifacts` reads the SAME projection for the in-workspace
// attestation ledger and already got this right: its loader returns
// `available` alongside the map, and `gate-sign-off-readback.ts` turns that
// into what the ledger may assert. That fix bounded the ROUTE. This module is
// its sibling for the SURFACE — the panel that originally owned the badge and
// the approve control, and the one a walker opens to sign a phase's documents
// off.
//
// Two causes reach "this row has a built file and no approvable document", and
// they differ in what the reader should do, so they get two sentences:
//
//   • `available` — the register was read and holds no row for this slot. The
//     file is real and downloadable; the approvable record is genuinely
//     absent, and the phase gate will still ask for its sign-off. Rebuilding
//     is the wrong remedy: the orchestrator writes an artifact and a run
//     record, not a `deliverables_v2` row, so another build produces another
//     file and the same gap.
//   • `unavailable` — the register was not read. Nothing on the row is a
//     statement about sign-off, so the badges are withheld rather than
//     asserted, and reloading is the action.
//
// No database access and no `server-only`, so a suite imports it directly.

/**
 * What is known about the `deliverables_v2` projection behind the Documents
 * tab on this render.
 *
 * - `available` — the projection was read. A key with no row means no document
 *   is on record for it.
 * - `unavailable` — the read did not answer. Every row lost its sign-off
 *   columns at once, whatever each document's real state is.
 */
export type DeliverableProjectionReadbackState = "available" | "unavailable";

export interface DeliverableProjectionReadback {
  state: DeliverableProjectionReadbackState;
  /**
   * True only when the approved / AI-draft badges are facts. False means the
   * row must render neither: both are read off `signed_off_version`, which an
   * unread projection cannot supply, so either badge would assert a sign-off
   * state nothing on this render established.
   */
  canStateSignOff: boolean;
  /**
   * Panel-level warning, shown once above the document list. Null when there
   * is nothing to warn about.
   */
  warning: string | null;
  /**
   * Sentence rendered where the approve control would have been, on a row that
   * has a built file but no approvable document. Worded per CAUSE, and
   * deliberately distinct from `warning`: the two render on the same screen, so
   * a row note that repeated the panel's own warning would say nothing about
   * the document it sits on.
   */
  noApprovableDocumentNote: string;
}

const AVAILABLE_NO_APPROVABLE_DOCUMENT_NOTE =
  "This build produced a file, but no approvable document is on record for " +
  "it, so the phase gate will still ask for its sign-off. Building again " +
  "produces another file, not the missing record.";

const UNAVAILABLE_NO_APPROVABLE_DOCUMENT_NOTE =
  "The document register could not be read on this load, so nothing on this " +
  "row says whether it is signed off. Reload before acting on it — the " +
  "sign-off state here is unknown, not missing.";

const UNAVAILABLE_WARNING =
  "The document register could not be read on this load. Sign-off state is " +
  "unknown for every document below: a document that is signed off looks the " +
  "same here as one that was never approved, so the approval badges and the " +
  "approve control are withheld rather than shown against a record this page " +
  "could not confirm.";

/** The single decision point. Every caller reads its answer, not the state. */
export function describeDeliverableProjectionReadback(
  state: DeliverableProjectionReadbackState,
): DeliverableProjectionReadback {
  switch (state) {
    case "available":
      return {
        state,
        canStateSignOff: true,
        warning: null,
        noApprovableDocumentNote: AVAILABLE_NO_APPROVABLE_DOCUMENT_NOTE,
      };
    case "unavailable":
      return {
        state,
        canStateSignOff: false,
        warning: UNAVAILABLE_WARNING,
        noApprovableDocumentNote: UNAVAILABLE_NO_APPROVABLE_DOCUMENT_NOTE,
      };
  }
}
