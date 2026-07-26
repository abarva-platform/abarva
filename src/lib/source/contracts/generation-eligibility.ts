// Shared generation-eligibility resolver (PR 4B). Both live generation
// entry points — the AI-generate route
// ([eventId]/artifacts/[artifactCode]/generate/route.ts) and the chat-save
// route ([eventId]/artifacts/generate/route.ts) — call this instead of
// hand-rolling their own eligibility logic, closing the "no shared
// eligibility function" gap ADR-0015 found.
//
// Scope, stated honestly (see ADR-0015's "Known Gaps"/this PR's release
// record): this resolver adds a genuinely NEW check (stage eligibility —
// nothing today blocks generating an artifact before its earliest eligible
// stage). The existing upstream-required-presence check
// (agent-generation/prompt-registry.ts's findMissingUpstreamCodes) is
// deliberately left where it is on the AI-generate route and NOT applied to
// chat-save: chat-save persists content a human already authored, which may
// legitimately be written out of order, unlike AI-generate which drafts FROM
// upstream evidence and has no meaning without it. Also not attempted here:
// tightening "upstream present" to "upstream accepted authoritative" (the
// contract's fuller rule) — that needs a real definition of "accepted" for
// general d-code artifacts, which today only exists via
// client-final-artifacts.ts's slot-based resolver, itself never wired to
// generation at all. Both are named, deliberate follow-ups, not oversights.

import type { SourceStageKey } from "@/lib/source/types";
import { isArtifactEligibleAtStage, requireSourceArtifactContract } from "./registry";

export type GenerationEligibilityBlockerCode =
  | "stage_not_eligible"
  | "missing_required_upstream";

export interface GenerationEligibilityBlocker {
  code: GenerationEligibilityBlockerCode;
  detail: string;
  meta: Record<string, unknown>;
}

export interface GenerationEligibilityResult {
  eligible: boolean;
  blockers: GenerationEligibilityBlocker[];
}

/**
 * Pure — takes the already-resolved "which required upstream codes are
 * missing a body" list rather than resolving it itself, so callers with
 * different data-access shapes (a full SourceGenerationContext vs. no
 * upstream check at all, passing `[]`) can share this function. Stage
 * eligibility always applies; the upstream blocker only fires if the caller
 * passes a non-empty list.
 */
export function evaluateGenerationEligibility(params: {
  artifactCode: string;
  currentStage: SourceStageKey;
  missingRequiredUpstreamCodes: string[];
}): GenerationEligibilityResult {
  const contract = requireSourceArtifactContract(params.artifactCode);
  const blockers: GenerationEligibilityBlocker[] = [];

  if (!isArtifactEligibleAtStage(params.artifactCode, params.currentStage)) {
    blockers.push({
      code: "stage_not_eligible",
      detail: `${contract.displayName} (${contract.code}) is not eligible to generate before stage "${contract.earliestEligibleStage}" — the event is currently at "${params.currentStage}".`,
      meta: {
        earliestEligibleStage: contract.earliestEligibleStage,
        currentStage: params.currentStage,
      },
    });
  }

  if (params.missingRequiredUpstreamCodes.length > 0) {
    blockers.push({
      code: "missing_required_upstream",
      detail: `Cannot generate ${contract.code} — author these upstream artifacts first: ${params.missingRequiredUpstreamCodes.join(", ")}.`,
      meta: { missingUpstream: params.missingRequiredUpstreamCodes },
    });
  }

  return { eligible: blockers.length === 0, blockers };
}
