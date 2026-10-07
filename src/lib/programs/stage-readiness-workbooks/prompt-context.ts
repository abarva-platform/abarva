import "server-only";

/**
 * The accepted workbook answers a phase's generation prompt may use.
 *
 * The transition workbook exists so the next phase is written from answers a
 * human accepted and sourced. Both prompt readings — the phase build route and
 * the Moves generation dependency bundle — reached those answers through
 * `loadAcceptedStageReadinessContext`, which returns null unless the review is
 * FINISHED: `pendingCount === 0 && needsValidationCount === 0 &&
 * acceptedCount > 0`, counted over every proposal regardless of whether it was
 * required. A single undecided response therefore deleted the whole set from
 * the prompt, silently.
 *
 * That is reachable, and on the demo path it is likely. A non-required
 * evidence family's questions are all written `recommended`, an empty cell
 * parses as `blank`, and a blank response cannot be accepted or rejected at
 * all — so one optional question left unanswered is a permanent `pending`.
 * The forward controls now read a partial review for exactly this reason, so
 * the phase advances while the prompt is handed nothing: dozens of accepted,
 * sourced answers discarded with no warning anywhere.
 *
 * The strict reading was never what kept unaccepted answers out of a prompt.
 * `buildStageReadinessProposalReview` writes `acceptedResponses` from
 * proposals whose disposition is `accepted` and nothing else, so pending,
 * rejected and needs-validation responses are already excluded by
 * construction — the governance line the formatter prints is true of a partial
 * review too. The counts gate answers a different question ("is this review
 * finished"), which is a forward-control policy and stays with the forward
 * controls.
 *
 * So this module reads the review as it stands and reports how much of it is
 * still open, and the prompt says so rather than presenting a partial set as a
 * completed transition. It does not loosen any gate: nothing here is consulted
 * by `applyStageReadinessToEvidencePackets`, the phase-gate approval route, or
 * `assessStageReadinessGate`.
 */

import type { TenancyCtx } from "@/lib/programs/types.db";

import {
  formatAcceptedStageReadinessContextForPrompt,
  loadStoredStageReadinessReview,
  type AcceptedStageReadinessContext,
} from "./accepted-context";

export interface StageReadinessPromptContext {
  context: AcceptedStageReadinessContext;
  /** Responses carrying no decision yet: `pending` plus `needs_validation`. */
  openResponseCount: number;
  /** True while any response is still undecided. */
  reviewOpen: boolean;
}

function countFrom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0;
}

/**
 * Every accepted response on the stored transition review, finished or not.
 * Returns null only when there is no review for this transition, or when the
 * review records no acceptance at all — in which case there is nothing a
 * prompt could honestly be given.
 */
export async function loadStageReadinessPromptContext(
  ctx: TenancyCtx,
  moveId: string,
  targetPhase: number,
): Promise<StageReadinessPromptContext | null> {
  const stored = await loadStoredStageReadinessReview(ctx, moveId, targetPhase);
  if (!stored) return null;
  if (stored.acceptedResponses.length === 0) return null;

  const openResponseCount =
    countFrom(stored.summary?.pendingCount) +
    countFrom(stored.summary?.needsValidationCount);

  return {
    context: {
      moveId: stored.moveId,
      sourcePhase: stored.sourcePhase,
      targetPhase: stored.targetPhase,
      reviewArtifactId: stored.reviewArtifactId,
      reviewArtifactVersion: stored.reviewArtifactVersion,
      proposals: stored.proposals,
      acceptedResponses: stored.acceptedResponses,
      readiness: stored.readiness,
    },
    openResponseCount,
    reviewOpen: openResponseCount > 0,
  };
}

/**
 * The prompt block for a transition review, through the one renderer both
 * readings share. A still-open review is labelled as such inside the block.
 */
export function formatStageReadinessPromptContext(
  promptContext: StageReadinessPromptContext | null,
): string {
  if (!promptContext) return "";
  return formatAcceptedStageReadinessContextForPrompt(promptContext.context, {
    openResponseCount: promptContext.openResponseCount,
  });
}
