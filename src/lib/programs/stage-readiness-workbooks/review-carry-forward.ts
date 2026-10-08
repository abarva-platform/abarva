/**
 * A corrected re-upload keeps the decisions a human already made.
 *
 * A required Response cell that comes back blank cannot be given any
 * disposition at all — `isWorkbookProposalAcceptable` refuses it, so the
 * review API's 422 `blank_workbook_response` and
 * `buildStageReadinessProposalReview`'s own throw both stand. Completing the
 * cell and uploading the workbook again is, deliberately, its only path.
 *
 * The cost of taking that path was the whole review. `buildProposal` mints
 * `proposalId` as a hash over `uploadedWorkbookSha256` as well as the answer,
 * so every row of a re-uploaded file gets a NEW id even when its text is
 * byte-identical; and `buildStageReadinessProposalSet` folds those ids into
 * `proposalSetId`, so the stored review no longer belongs to the current set
 * and `loadPriorStageReadinessReviewProposals` correctly returns null for it.
 * Both readings are right on their own terms, and together they meant one
 * corrected cell returned every other response to `pending`.
 *
 * The widest archetype in the catalog carries 55 required answers across one
 * transition, so that is 55 answers re-judged to fix one — and a 55-cell
 * workbook coming back complete on the first attempt is not the case to design
 * for. So the transition stayed reachable only in theory.
 *
 * What a reviewer actually judged is the answer, not the file it arrived in:
 * the question it answers, the response, the context, and the source named for
 * it. Keying the carry-forward on exactly those four fields restores a decision
 * when all four are unchanged and withholds it the moment any of them moves —
 * an edited answer is a new answer and must be judged again. Nothing here can
 * manufacture a decision a human never made: every carried disposition is one
 * that was recorded against identical text, and it is recorded with a note
 * saying so.
 */

import type {
  StageReadinessProposalDecision,
  StageReadinessWorkbookProposal,
} from "./proposals";
import type { PriorReviewedProposal } from "./review-accumulation";
import { isWorkbookProposalAcceptable } from "./review-selection";

/** The dispositions worth restoring; `pending` is the absence of a decision. */
const CARRYABLE_DISPOSITIONS = new Set([
  "accepted",
  "rejected",
  "needs_validation",
]);

/** Excel round-trips add and drop surrounding whitespace; that is not an edit. */
function normalizeAnswerField(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/**
 * The four fields a human judged, as one comparable key. Returns null when the
 * row names no question, because an answer that cannot be tied to a question
 * cannot be matched to a decision about one.
 */
export function stageReadinessAnswerIdentity(
  input: {
    questionId?: unknown;
    response?: unknown;
    context?: unknown;
    evidenceOrSource?: unknown;
  } | null | undefined,
): string | null {
  const questionId = normalizeAnswerField(input?.questionId);
  if (!questionId) return null;
  return JSON.stringify([
    questionId,
    normalizeAnswerField(input?.response),
    normalizeAnswerField(input?.context),
    normalizeAnswerField(input?.evidenceOrSource),
  ]);
}

export interface StageReadinessCarryForwardResult {
  /** `input.decisions` first and unchanged, then the restored ones. */
  decisions: StageReadinessProposalDecision[];
  /** How many decisions this reading restored, for the route to report. */
  carriedForwardCount: number;
}

/**
 * Decisions recorded against an earlier upload of the same transition,
 * restored onto the current proposal set wherever the answer is identical.
 *
 * `input.decisions` is passed through first and untouched: a decision taken in
 * this batch always wins over a restored one, and an id this reading does not
 * recognise still reaches `buildStageReadinessProposalReview`'s refusal rather
 * than being dropped here.
 */
export function carryForwardStageReadinessDecisions(input: {
  proposals: readonly Pick<
    StageReadinessWorkbookProposal,
    | "proposalId"
    | "questionId"
    | "response"
    | "context"
    | "evidenceOrSource"
    | "answerState"
  >[];
  priorReviewProposals: readonly PriorReviewedProposal[] | null | undefined;
  decisions: readonly StageReadinessProposalDecision[];
}): StageReadinessCarryForwardResult {
  const decidedNow = new Set(
    input.decisions.map((decision) => decision.proposalId),
  );

  // One answer, one decision. The same text reviewed twice to opposite
  // conclusions is a disagreement this reading must not silently resolve, so
  // an identity whose recorded dispositions conflict carries nothing and the
  // response is judged again.
  const dispositionByIdentity = new Map<string, string | null>();
  for (const prior of input.priorReviewProposals ?? []) {
    const identity = stageReadinessAnswerIdentity(prior);
    if (!identity) continue;
    const disposition =
      typeof prior?.disposition === "string" &&
      CARRYABLE_DISPOSITIONS.has(prior.disposition)
        ? prior.disposition
        : null;
    if (disposition === null) continue;
    if (!dispositionByIdentity.has(identity)) {
      dispositionByIdentity.set(identity, disposition);
      continue;
    }
    if (dispositionByIdentity.get(identity) !== disposition) {
      dispositionByIdentity.set(identity, null);
    }
  }

  const carriedForward: StageReadinessProposalDecision[] = [];
  for (const proposal of input.proposals) {
    if (decidedNow.has(proposal.proposalId)) continue;
    const identity = stageReadinessAnswerIdentity(proposal);
    if (!identity) continue;
    const disposition = dispositionByIdentity.get(identity);
    if (!disposition) continue;
    // A restored acceptance of a response this set reports as blank would make
    // `buildStageReadinessProposalReview` throw and hard-block the transition.
    // Identical text cannot classify as blank in one set and answered in
    // another, so this guards a review stored before that refusal existed.
    if (disposition === "accepted" && !isWorkbookProposalAcceptable(proposal)) {
      continue;
    }
    carriedForward.push({
      proposalId: proposal.proposalId,
      disposition: disposition as StageReadinessProposalDecision["disposition"],
      note: "Carried forward from the previous upload of this workbook: same question, same answer, same source.",
    });
  }

  return {
    decisions: [...input.decisions, ...carriedForward],
    carriedForwardCount: carriedForward.length,
  };
}
