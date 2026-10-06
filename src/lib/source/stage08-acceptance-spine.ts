import { buildSourceAwardSowHandoffReadiness } from "./award-sow-handoff-readiness";
import type {
  SourceAwardSowHandoffReadiness,
  SourceAwardSowHandoffReadinessInput,
} from "./award-sow-handoff-readiness-types";
import {
  buildEvaluationBafoReadinessView,
  type EvaluationBafoReadinessView,
} from "./proposal-intelligence/evaluation-bafo-readiness";
import type { VendorBafoInstructionPack } from "./proposal-intelligence/types";
import type { VendorResponseProfileSet } from "./proposal-intelligence/mve-profile";
import type {
  VendorChallengeIntelligence,
  VendorEvaluationDecisionView,
} from "./proposal-intelligence/types";
import type { ScorecardAuthorityView } from "./proposal-intelligence/scorecard-authority";

export type SourceStage08AcceptanceStepKey =
  | "normalized_response_questions"
  | "evaluator_scorecard"
  | "pricing_tco_comparison"
  | "clarification_bafo_round"
  | "named_human_selection_evidence"
  | "award_sow_formation_readiness"
  | "canonical_contract_handoff"
  | "optimize_route_identity";

export type SourceStage08AcceptanceStepStatus = "passed" | "blocked";

export interface SourceStage08AcceptanceStep {
  key: SourceStage08AcceptanceStepKey;
  label: string;
  status: SourceStage08AcceptanceStepStatus;
  evidence: string[];
  blockers: string[];
}

export interface SourceStage08AcceptanceWriteAuthority {
  tenantWriteAuthorized: false;
  canonicalContractWriteAllowed: false;
  contract360PublicationAllowed: false;
  optimizeLaunchAllowed: false;
  supplierContactAuthorized: false;
  awardApproved: false;
  signatureFabricated: false;
}

export interface SourceStage08AcceptanceSpine {
  status: "passed_read_only_acceptance" | "blocked";
  eventId: string;
  eventName: string;
  steps: SourceStage08AcceptanceStep[];
  evaluationView: EvaluationBafoReadinessView;
  handoffReadiness: SourceAwardSowHandoffReadiness;
  writeAuthority: SourceStage08AcceptanceWriteAuthority;
  guardrail: string;
}

export function buildSourceStage08AcceptanceSpine(input: {
  evaluation: {
    profileSet?: VendorResponseProfileSet | null;
    challengeIntelligence?: VendorChallengeIntelligence | null;
    bafoInstructionPack?: VendorBafoInstructionPack | null;
    decisionView?: VendorEvaluationDecisionView | null;
    scorecardAuthorityView?: ScorecardAuthorityView | null;
  };
  handoff: SourceAwardSowHandoffReadinessInput;
}): SourceStage08AcceptanceSpine {
  const evaluationView = buildEvaluationBafoReadinessView({
    profileSet: input.evaluation.profileSet,
    challengeIntelligence: input.evaluation.challengeIntelligence,
    bafoInstructionPack: input.evaluation.bafoInstructionPack,
    decisionView: input.evaluation.decisionView,
    scorecardAuthorityView: input.evaluation.scorecardAuthorityView,
  });
  const handoffReadiness = buildSourceAwardSowHandoffReadiness(input.handoff);

  const steps: SourceStage08AcceptanceStep[] = [
    normalizedResponseQuestionsStep(evaluationView),
    evaluatorScorecardStep(evaluationView),
    pricingTcoComparisonStep(evaluationView),
    clarificationBafoRoundStep(evaluationView),
    namedHumanSelectionEvidenceStep(evaluationView, handoffReadiness),
    awardSowFormationReadinessStep(handoffReadiness),
    canonicalContractHandoffStep(handoffReadiness),
    optimizeRouteIdentityStep(handoffReadiness),
  ];

  return {
    status: steps.every((step) => step.status === "passed")
      ? "passed_read_only_acceptance"
      : "blocked",
    eventId: handoffReadiness.eventId,
    eventName: handoffReadiness.eventName,
    steps,
    evaluationView,
    handoffReadiness,
    writeAuthority: {
      tenantWriteAuthorized: false,
      canonicalContractWriteAllowed:
        handoffReadiness.canonicalContractProjection.writeAllowed,
      contract360PublicationAllowed:
        handoffReadiness.publicationPlanner.publicationAllowed,
      optimizeLaunchAllowed: handoffReadiness.optimizePath.launchAllowed,
      supplierContactAuthorized: false,
      awardApproved: false,
      signatureFabricated: false,
    },
    guardrail:
      "Read-only synthetic acceptance spine: proves projection continuity across governed Source builders, but does not approve awards, fabricate signatures, contact suppliers, write tenant data, create canonical contract rows, publish Contract 360 rows, or launch Optimize.",
  };
}

function normalizedResponseQuestionsStep(
  view: EvaluationBafoReadinessView,
): SourceStage08AcceptanceStep {
  const rows = view.questionResponses.filter(
    (row) => row.normalizedResponse !== "No normalized response note recorded.",
  );
  const passed = rows.length > 0;
  return step({
    key: "normalized_response_questions",
    label: "Normalized response questions",
    passed,
    evidence: rows.map(
      (row) =>
        `${row.vendorName} ${row.questionId}: ${row.questionLabel} -> ${row.evidenceReference}`,
    ),
    blocker:
      "No normalized requirement/question response rows are available for evaluator review.",
  });
}

function evaluatorScorecardStep(
  view: EvaluationBafoReadinessView,
): SourceStage08AcceptanceStep {
  const lockedRows = view.evaluatorScorecards.filter(
    (row) => row.reviewState === "locked_named_human_review",
  );
  const passed = lockedRows.length > 0;
  return step({
    key: "evaluator_scorecard",
    label: "Evaluator scorecard",
    passed,
    evidence: lockedRows
      .slice(0, 3)
      .map(
        (row) =>
          `${row.evaluatorName} locked ${row.vendorName} ${row.criterionLabel} at ${row.scoreLabel} using ${row.evidenceReference}`,
      ),
    blocker:
      "No locked named-human evaluator scorecard row with evidence is available.",
  });
}

function pricingTcoComparisonStep(
  view: EvaluationBafoReadinessView,
): SourceStage08AcceptanceStep {
  const comparableRows = view.commercialComparison.filter(
    (row) =>
      row.supportOnlyTcoLabel !== "Not recorded" &&
      row.includedAmountLabels.length > 0,
  );
  const passed = comparableRows.length > 0;
  return step({
    key: "pricing_tco_comparison",
    label: "Pricing/TCO comparison",
    passed,
    evidence: comparableRows
      .slice(0, 3)
      .map(
        (row) =>
          `${row.vendorName}: ${row.supportOnlyTcoLabel}; ${row.guardrail}`,
      ),
    blocker:
      "No support-only normalized TCO comparison row is available from governed pricing fields.",
  });
}

function clarificationBafoRoundStep(
  view: EvaluationBafoReadinessView,
): SourceStage08AcceptanceStep {
  const hasDraftClarifications = view.clarificationRequests.some(
    (request) => request.dispatchState === "draft_only_not_sent",
  );
  const passed =
    hasDraftClarifications &&
    view.bafoRound.roundLabel.trim().length > 0 &&
    view.bafoRound.state === "candidate_not_dispatched";
  return step({
    key: "clarification_bafo_round",
    label: "Clarification/BAFO round",
    passed,
    evidence: [
      `${view.bafoRound.roundLabel}: ${view.bafoRound.state}`,
      ...view.clarificationRequests
        .slice(0, 2)
        .map(
          (request) =>
            `${request.vendorName}: ${request.question} (${request.dispatchState})`,
        ),
    ],
    blocker:
      "No draft-only clarification asks are tied to a governed candidate BAFO round.",
  });
}

function namedHumanSelectionEvidenceStep(
  view: EvaluationBafoReadinessView,
  readiness: SourceAwardSowHandoffReadiness,
): SourceStage08AcceptanceStep {
  const namedEvaluatorRows = view.evaluatorScorecards.filter(
    (row) => row.reviewState === "locked_named_human_review",
  );
  const candidateSelection = readiness.checkpoints.find(
    (checkpoint) => checkpoint.key === "candidate_selection",
  );
  const selectionEvidence = readiness.contractFormationPackage.evidence.filter(
    (item) =>
      /selection memo|named approval authority|reviewed selection memo/i.test(
        item,
      ),
  );
  const passed =
    namedEvaluatorRows.length > 0 &&
    candidateSelection?.status === "completed" &&
    selectionEvidence.length > 0;
  return step({
    key: "named_human_selection_evidence",
    label: "Named human selection evidence",
    passed,
    evidence: [
      ...namedEvaluatorRows.map(
        (row) => `${row.evaluatorName}: ${row.vendorName}`,
      ),
      ...selectionEvidence.slice(0, 3),
    ],
    blocker:
      "Named evaluator review, completed candidate selection, and governed selection memo evidence are not all present.",
  });
}

function awardSowFormationReadinessStep(
  readiness: SourceAwardSowHandoffReadiness,
): SourceStage08AcceptanceStep {
  const passed =
    readiness.readinessStatus === "ready_for_contract360_handoff" &&
    readiness.contractFormationState === "executed";
  return step({
    key: "award_sow_formation_readiness",
    label: "Award/SOW formation readiness",
    passed,
    evidence: [
      readiness.readinessStatus,
      readiness.contractFormationState,
      ...readiness.contractFormationPackage.includedComponents.map(
        (component) => `formation_component:${component}`,
      ),
    ],
    blocker:
      readiness.blockers[0] ??
      "Stage 08 Award/SOW formation readiness is not complete.",
  });
}

function canonicalContractHandoffStep(
  readiness: SourceAwardSowHandoffReadiness,
): SourceStage08AcceptanceStep {
  const plan = readiness.canonicalContractProjection;
  const passed =
    plan.state === "ready_for_identity_review" &&
    Boolean(plan.candidateIdentityKey) &&
    !plan.writeAllowed;
  return step({
    key: "canonical_contract_handoff",
    label: "Canonical contract handoff",
    passed,
    evidence: [
      plan.candidateIdentityKey ?? "",
      ...plan.identityBasis,
      ...plan.blockedWrites.map((write) => `blocked_write:${write}`),
    ],
    blocker:
      plan.blockers[0] ??
      "Canonical contract identity review is not ready as a read-only handoff plan.",
  });
}

function optimizeRouteIdentityStep(
  readiness: SourceAwardSowHandoffReadiness,
): SourceStage08AcceptanceStep {
  const optimizePath = readiness.optimizePath;
  const passed =
    optimizePath.state === "ready_for_optimize_review" &&
    optimizePath.route === "/source/optimize" &&
    optimizePath.prefillContractId === null &&
    !optimizePath.launchAllowed;
  return step({
    key: "optimize_route_identity",
    label: "Optimize route identity",
    passed,
    evidence: [
      optimizePath.route,
      optimizePath.state,
      ...optimizePath.evidence,
      ...optimizePath.blockers,
    ],
    blocker:
      optimizePath.blockers[0] ??
      "Optimize route identity is not available as a blocked read-only plan.",
  });
}

function step(input: {
  key: SourceStage08AcceptanceStepKey;
  label: string;
  passed: boolean;
  evidence: string[];
  blocker: string;
}): SourceStage08AcceptanceStep {
  return {
    key: input.key,
    label: input.label,
    status: input.passed ? "passed" : "blocked",
    evidence: compactUnique(input.evidence),
    blockers: input.passed ? [] : [input.blocker],
  };
}

function compactUnique(values: readonly string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}
