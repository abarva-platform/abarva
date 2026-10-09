// When the phase gate cannot measure transition evidence, WHICH step failed?
//
// `POST /api/v1/programs/:id/phase-gate-approval` holds P1-P4 open until the
// Move's required transition evidence is closed. It establishes that in one
// helper, `transitionEvidenceReadiness`, which runs five steps in sequence:
//
//   1. read the Move's discovery evidence readiness;
//   2. expand it into evidence need packets;
//   3. read the NEXT phase's stage-readiness workbook review as it stands;
//   4. overlay that review onto the packets;
//   5. reduce the overlaid packets to this phase's open required slots.
//
// All five sat inside ONE bare `try`, whose `catch` returned `available: false`
// and discarded the error. The route answered that single flag with a single
// refusal — HTTP 503 `transition_evidence_readiness_unavailable`, "The current
// transition evidence and workbook review could not be verified. The phase gate
// was not submitted." — and nothing was logged.
//
// Three things were wrong with that, and only the third is cosmetic:
//
//   * 503 is a retry instruction. Steps 2, 4 and 5 are pure functions over data
//     already on the record: if one throws, re-submitting recomputes the same
//     inputs and throws again. The refusal prescribed the one action it had
//     already ruled out — the defect `approved-evidence-basis-refusal.ts` exists
//     to prevent on the write paths, here on the gate itself.
//   * The two reads fail for different reasons and are closed at different
//     surfaces (the Move's discovery evidence vs. the next phase's readiness
//     workbook), and the text named neither. It also said the workbook review
//     "could not be verified" when step 1 was what failed and the workbook had
//     not been reached at all.
//   * The cause reached neither the operator nor the server log, so a Move stuck
//     at this refusal left no trace of which step to look at.
//
// This module is that distinction, taken once. It relaxes nothing: every cause
// still refuses, the gate still does not advance, and no evidence requirement is
// waived or assumed closed. It changes which refusal is sent, what it claims,
// and whether it tells the operator to try again.

/** The step of the transition-evidence read that did not complete. */
export type TransitionEvidenceBasisCause =
  /**
   * Step 1. The Move's discovery evidence readiness read did not answer, so
   * nothing about its evidence was measured and no later step ran.
   */
  | "discovery_readiness_unreadable"
  /**
   * Step 3. Discovery readiness answered, but the next phase's stage-readiness
   * workbook review read did not, so the overlay that credits workbook answers
   * against evidence slots could not be applied.
   */
  | "workbook_review_unreadable"
  /**
   * Steps 2, 4 or 5. Both reads answered; turning them into this phase's open
   * required slots threw. Pure computation over data already on the record.
   */
  | "gap_assessment_failed";

export interface TransitionEvidenceBasisRefusal {
  cause: TransitionEvidenceBasisCause;
  /** Stable machine code, distinct per cause. */
  code: string;
  /** HTTP status: 503 only where a re-submission can plausibly answer. */
  status: 503 | 422;
  /**
   * Whether submitting the gate again can satisfy this refusal. False for
   * `gap_assessment_failed`: the same inputs are re-reduced the same way. A
   * refusal that prescribes an action it has ruled out is the defect this
   * module prevents.
   */
  resubmitCanSatisfy: boolean;
  /** Operator-readable text. Says what was and was not established. */
  detail: string;
}

const REFUSALS: Readonly<
  Record<TransitionEvidenceBasisCause, Omit<TransitionEvidenceBasisRefusal, "cause">>
> = {
  discovery_readiness_unreadable: {
    code: "transition_discovery_readiness_unreadable",
    status: 503,
    resubmitCanSatisfy: true,
    detail:
      "This Move's discovery evidence readiness could not be read, so none of its transition " +
      "evidence was measured and the next phase's readiness workbook was not reached. The phase " +
      "gate was not submitted and no evidence requirement was waived. Submit the gate again; if " +
      "the read keeps failing it is an operational fault, not an open evidence item.",
  },
  workbook_review_unreadable: {
    code: "transition_workbook_review_unreadable",
    status: 503,
    resubmitCanSatisfy: true,
    detail:
      "This Move's discovery evidence readiness was read, but the next phase's stage-readiness " +
      "workbook review could not be, so workbook answers could not be credited against the " +
      "evidence slots they close. The phase gate was not submitted and no evidence requirement " +
      "was waived. Submit the gate again; if the read keeps failing it is an operational fault, " +
      "not an open evidence item.",
  },
  gap_assessment_failed: {
    code: "transition_evidence_assessment_failed",
    status: 422,
    resubmitCanSatisfy: false,
    detail:
      "This Move's discovery evidence readiness and the next phase's workbook review were both " +
      "read, but they could not be reduced to this phase's required evidence slots. Submitting " +
      "the gate again will not change the answer — the same records are reduced the same way. " +
      "The phase gate was not submitted and no evidence requirement was waived; this is an " +
      "operational fault in the evidence assessment to resolve, not an open evidence item.",
  },
};

/** The refusal a given cause yields. */
export function classifyTransitionEvidenceBasisRefusal(
  cause: TransitionEvidenceBasisCause,
): TransitionEvidenceBasisRefusal {
  return { cause, ...REFUSALS[cause] };
}

/**
 * One line for the server log, so a Move stuck at this refusal leaves a trace of
 * which step to look at. Separate from `detail` on purpose: the operator text
 * must not carry an error message, and the log must.
 */
export function describeTransitionEvidenceBasisFault(args: {
  cause: TransitionEvidenceBasisCause;
  programId: string;
  phase: number;
  error: unknown;
}): string {
  const message =
    args.error instanceof Error ? args.error.message : String(args.error);
  return `[phase-gate] transition evidence basis unevaluable: cause=${args.cause} program=${args.programId} phase=${args.phase} error=${message}`;
}
