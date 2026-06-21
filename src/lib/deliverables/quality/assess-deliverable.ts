// Deliverable Quality Transformation — assessment entry point (W1/W4 seam)
//
// The single function the generation/persistence path calls to evaluate a
// client-facing artifact against its profile and the transformation gates, and
// to resolve the correct title (business-case mode-downgrade).
//
// Inert until imported. Pure + deterministic — safe to call anywhere.

import {
  getDeliverableProfile,
  type DeliverableKey,
} from "@/lib/deliverables/profiles";
import {
  runTransformationGates,
  type FinancialInputs,
  type GateInput,
  type GateReport,
} from "./transformation-gates";
import type { BusinessCaseMode, ExhibitId } from "@/lib/deliverables/profiles/types";

export interface AssessmentInput {
  deliverableKey: DeliverableKey;
  narrativeText: string;
  renderedExhibits?: ReadonlyArray<ExhibitId>;
  sourceRegisterInBody?: boolean;
  scatteredPlaceholderCount?: number;
  financialInputs?: FinancialInputs;
}

export interface DeliverableAssessment {
  deliverableKey: DeliverableKey;
  /** The client-facing title to render (downgraded when finance-grade data is absent). */
  resolvedTitle: string;
  report: GateReport;
}

const BUSINESS_MODE_TITLE: Record<BusinessCaseMode, string> = {
  readiness_memo: "Business Case Readiness Memo",
  investment_thesis: "Investment Thesis",
  full_business_case: "Business Case",
};

/**
 * Resolve the title for an artifact, applying business-case mode-downgrade so a
 * thin-data "Business Case" is honestly retitled rather than over-promising.
 */
export function resolveArtifactTitle(
  deliverableKey: DeliverableKey,
  mode?: BusinessCaseMode,
): string {
  const profile = getDeliverableProfile(deliverableKey);
  if (profile.supportsModeDowngrade && mode) {
    return BUSINESS_MODE_TITLE[mode];
  }
  return profile.title;
}

/** Evaluate a generated client artifact: run the gates and resolve its title. */
export function assessClientDeliverable(
  input: AssessmentInput,
): DeliverableAssessment {
  const profile = getDeliverableProfile(input.deliverableKey);
  const gateInput: GateInput = {
    profile,
    narrativeText: input.narrativeText,
    renderedExhibits: input.renderedExhibits,
    sourceRegisterInBody: input.sourceRegisterInBody,
    scatteredPlaceholderCount: input.scatteredPlaceholderCount,
    financialInputs: input.financialInputs,
  };
  const report = runTransformationGates(gateInput);
  return {
    deliverableKey: input.deliverableKey,
    resolvedTitle: resolveArtifactTitle(
      input.deliverableKey,
      report.businessCaseMode,
    ),
    report,
  };
}
