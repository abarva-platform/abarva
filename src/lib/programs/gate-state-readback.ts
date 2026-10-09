// Did the gate evaluator READ this Move's recorded state, or merely fail to?
//
// `evaluateGate` is the single evaluator behind every phase gate. It reads the
// Move's state NINE times: five parallel reads (`deliverables_v2`,
// `program_modules`, `engagement_participants`, `program_approval_requests`,
// `program_milestones`), two conditional latest-version reads over
// `deliverable_versions` for the origination brief and the discovery report,
// one over `move_artifacts` for the artifacts deliverables point at, and one
// over `program_evidence_items` issued from INSIDE the criterion loop. Every
// one of those nine destructured `{ data }` ALONE and dropped `error`.
//
// The ninth was missed when the other eight were fixed, because the first pass
// enumerated the reads whose text sits in `evaluateGate`'s own body and this
// one sits a frame deeper, in a helper the `discovery_notes_ingested` branch
// awaits — the same shape as
// [[feedback_an_enumeration_built_from_a_predicates_name_misses_its_wrapper]].
//
// The fluent compat client never throws: `execute()` catches internally and
// returns `{ data: null, error: { message } }` for a connection failure, a
// permission denial, a timeout or a bad column. So `error` was the only signal
// there was, and with it dropped a failed read arrived as `data: null`, which
// each collector coerces to `[]`:
//
//   * `deliverableRows = []` makes `findDeliverable` answer `undefined` for
//     every key, and 30 of the 38 criterion branches read a deliverable row;
//   * `moduleRows = []` makes `moduleCompleted`, `phaseModulesCompleted`,
//     `captureValue` and `phaseCaptureText` all empty, which is what the
//     CAPTURE-based rescue arm of those same criteria tests;
//   * `participants = []` clears `hasSponsor`; `approvalRequests = []` empties
//     `briefString`, the seed text behind the P0 funding/scope/evidence-family
//     criteria; `milestones = []` empties `milestoneRows`;
//   * an unreadable `deliverable_versions` row leaves `latestDiscoveryReportText`
//     `""`, which is the P2 criterion's own "a report exists and says
//     something" test;
//   * an empty `move_artifacts` read fires `isSignedOff`'s linked-artifact
//     veto, so every deliverable carrying an `approved_artifact_id` reads as
//     not signed off.
//
// An empty read is a legitimate state — a Move really can have produced no
// deliverable and completed no module — so the collapse is SILENT and states
// its conclusion as fact. The phase-gate-approval route joins
// `failedChecks[].reason` into the `detail` of its 409 `gate_blocked`, so a
// signed-in reviewer at a finished phase reads a list of absences for documents
// visibly on screen in the cabinet, each with a remedy attached: approve or
// upload the Discovery Report, regenerate it, name a sponsor, capture a
// baseline.
//
// The regenerate remedy is the one that does damage. `programsWriteAdapter`'s
// generation path updates an EXISTING deliverable with
// `SET current_version = $1, status = 'draft'`, so regenerating a signed-off
// Discovery Report un-signs it — and `discovery_report_signed_off` is a sibling
// HARD criterion in the SAME P2→P3 rule. Acting on the fabricated sentence
// turns one failing criterion into two, and no retry can undo it.
//
// `evaluateGate` already holds the rule this module applies, written 25 lines
// BELOW the five reads that did not follow it: the approved-evidence basis is
// deliberately `{ evaluable }`-shaped rather than `snapshot | null` because
// "a null conflates 'nothing approved' with 'I could not read the basis', and
// only the first of those may veto a recorded human approval"
// (`approved-evidence-currency-basis.ts`). Same function, same class of fact,
// opposite treatment.
//
// This module does not change any verdict. An unreadable read still refuses the
// gate — failing closed is correct, because an unread state cannot clear a HARD
// criterion. What changes is that the refusal says the state could not be read,
// instead of asserting seven absences that were never observed.
//
// [[feedback_a_failed_authoritative_read_must_not_leave_a_healthy_value_standing]]

/** The reads `evaluateGate` derives its criterion answers from. */
export type GateStateRead =
  /** `deliverables_v2` — backs every `findDeliverable` criterion. */
  | "deliverables"
  /** `program_modules` — backs the capture/module-completion rescue arms. */
  | "program_modules"
  /** `engagement_participants` — backs `sponsor_assigned`. */
  | "engagement_participants"
  /** `program_approval_requests` — backs the P0 seed-brief text. */
  | "approval_requests"
  /** `program_milestones` — backs the milestone criterion. */
  | "milestones"
  /** `deliverable_versions` for the origination brief's latest version. */
  | "origination_brief_version"
  /** `deliverable_versions` for the discovery report's latest version. */
  | "discovery_report_version"
  /**
   * `move_artifacts` for the artifacts deliverables point at. An empty read
   * here fires `isSignedOff`'s linked-artifact veto, so every deliverable
   * carrying an `approved_artifact_id` reads as not signed off — the same
   * failure `approved-evidence-currency-basis.ts` documents for the OTHER
   * input to that same comparison.
   */
  | "linked_artifacts"
  /**
   * `program_evidence_items` — the ingested-evidence arm of
   * `discovery_notes_ingested`, a HARD criterion on the P2→P3 gate. Issued
   * from inside the criterion loop rather than with the other eight, and only
   * when no in-memory arm has already cleared the criterion, so it is the one
   * read whose failure is always decisive when it happens.
   */
  | "program_evidence";

/**
 * The only part of a compat-client result this classification reads.
 *
 * `data` is deliberately NOT consulted. A falsy `data` with no `error` is a
 * legitimate empty read and keeps its existing meaning, so no caller and no
 * fixture changes behaviour; only a reported `error` is a failed read.
 */
export interface GateStateReadResult {
  error?: { message?: string | null } | null;
}

export type GateStateReadback =
  | { readable: true; unreadable: readonly [] }
  | { readable: false; unreadable: readonly GateStateRead[] };

/** The `failedChecks[].check` id for a gate whose state could not be read. */
export const GATE_STATE_UNREADABLE_CHECK = "gate_state_unreadable";

/** Human-facing names, in the order a refusal lists them. */
const READ_LABELS: Record<GateStateRead, string> = {
  deliverables: "the Move's deliverable records",
  program_modules: "the phase capture modules",
  engagement_participants: "the engagement participants",
  approval_requests: "the origination approval request",
  milestones: "the Move's milestones",
  origination_brief_version: "the Origination Brief's latest version",
  discovery_report_version: "the Discovery Report's latest version",
  linked_artifacts: "the artifacts those deliverables point at",
  program_evidence: "the Move's ingested discovery evidence",
};

/**
 * Declaration order, so a refusal's wording is stable across runs.
 *
 * Exported because the only other way to enumerate the reads is to hand-type
 * them, and a hand-typed list silently omits the next read someone adds —
 * which is exactly how `program_evidence` went unclassified for a release.
 */
export const GATE_STATE_READS: readonly GateStateRead[] = [
  "deliverables",
  "program_modules",
  "engagement_participants",
  "approval_requests",
  "milestones",
  "origination_brief_version",
  "discovery_report_version",
  "linked_artifacts",
  "program_evidence",
];

/**
 * Classify the gate's state reads.
 *
 * A read that was never issued — the two version reads are conditional on their
 * deliverable row existing — is passed as `null`/`undefined` and is not
 * unreadable: not asking is not failing.
 */
export function classifyGateStateReads(
  reads: Partial<Record<GateStateRead, GateStateReadResult | null | undefined>>,
): GateStateReadback {
  const unreadable = GATE_STATE_READS.filter((key) =>
    Boolean(reads[key]?.error),
  );
  if (unreadable.length === 0) return { readable: true, unreadable: [] };
  return { readable: false, unreadable };
}

/**
 * The sentence for a gate refused because its state could not be read.
 *
 * Written against the three things the collapsed version got wrong: it names
 * the failure as a read failure, it states that nothing was concluded about any
 * document or captured answer, and it rules out the remedy that would un-sign
 * signed work.
 */
export function describeUnreadableGateState(
  unreadable: readonly GateStateRead[],
): string {
  const named = GATE_STATE_READS.filter((key) => unreadable.includes(key)).map(
    (key) => READ_LABELS[key],
  );
  const list = named.length > 0 ? named.join("; ") : "the Move's gate state";
  return (
    `This gate could not be evaluated: reading ${list} failed. ` +
    `Nothing was concluded about any deliverable, sign-off, captured answer or ` +
    `sponsor — in particular this is NOT a finding that a document is missing, ` +
    `unsigned or empty. Retry Approve & Build; if it keeps failing, the data ` +
    `plane is unavailable and an operator needs to look. Do not regenerate or ` +
    `re-upload a deliverable to clear this: regeneration resets a signed-off ` +
    `document to draft and would un-sign work this gate has already accepted.`
  );
}
