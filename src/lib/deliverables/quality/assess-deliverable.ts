// Deliverable Quality Transformation — the blocking assessment gate (§0b)
//
// The single function the pipeline calls before persistence. It evaluates a
// generated client artifact against its profile via the Deliverable Quality
// Contract and returns a result STATE — not a boolean. A non-`client_ready`
// deliverable must be persisted only as `internal_draft` with failure reasons.

import {
  getDeliverableProfile,
  type DeliverableKey,
} from "@/lib/deliverables/profiles";
import type { BusinessCaseMode } from "@/lib/deliverables/profiles/types";
import {
  evaluateDeliverableQuality,
  type ContractInput,
  type DeliverableQualityResult,
  type DeliverableResultState,
} from "./deliverable-quality-contract";

export type AssessmentInput = Omit<ContractInput, "profile"> & {
  deliverableKey: DeliverableKey;
};

export interface DeliverableAssessment {
  deliverableKey: DeliverableKey;
  /** Title to render, applying business-case mode-downgrade. */
  resolvedTitle: string;
  /** The contract result state. */
  state: DeliverableResultState;
  /** True only when state === 'client_ready'. */
  clientReady: boolean;
  quality: DeliverableQualityResult;
}

const BUSINESS_MODE_TITLE: Record<BusinessCaseMode, string> = {
  readiness_memo: "Business Case Readiness Memo",
  investment_thesis: "Investment Thesis",
  full_business_case: "Business Case",
};

export function resolveArtifactTitle(
  deliverableKey: DeliverableKey,
  mode?: BusinessCaseMode,
): string {
  const profile = getDeliverableProfile(deliverableKey);
  if (profile.supportsModeDowngrade && mode) return BUSINESS_MODE_TITLE[mode];
  return profile.title;
}

/**
 * Evaluate a generated client artifact: run the quality contract and resolve the
 * title. This is the blocking gate — the caller persists `client_ready` artifacts
 * as client-ready and everything else as `internal_draft`.
 */
export function assessClientDeliverable(
  input: AssessmentInput,
): DeliverableAssessment {
  const profile = getDeliverableProfile(input.deliverableKey);
  const quality = evaluateDeliverableQuality({ ...input, profile });
  return {
    deliverableKey: input.deliverableKey,
    resolvedTitle: resolveArtifactTitle(
      input.deliverableKey,
      quality.businessCaseMode,
    ),
    state: quality.state,
    clientReady: quality.clientReady,
    quality,
  };
}
