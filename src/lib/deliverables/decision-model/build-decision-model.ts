// Assemble + validate a MoveDecisionModel.
//
// PR1 scope: the deterministic convergence layer. It takes the decision CONTENT a draft
// (today hand-authored / later an Intelligence-pass output) plus the deterministic INPUTS
// (governed evidence + an optional Workforce Economics estimate) and produces ONE validated
// model. No LLM call here — this is the typed contract + integrity check that every later
// stage (Story Director, Visual Director, authors, gate) builds on.

import type {
  GovernedEvidenceItem,
  MissingEvidenceItem,
  ApprovedAssumption,
} from "@/lib/deliverables/orchestrator/types";
import type {
  MoveDecisionModel,
  DecisionClaim,
  DecisionRisk,
  DecisionDependency,
  OpenQuestion,
  RequiredDecision,
  ArchitectureModel,
  OperatingModel,
  ValueModel,
  EstimateTwice,
  DecisionModelValidationIssue,
} from "./types";

/** The decision content an upstream pass supplies (everything that is judgement, not plumbing). */
export interface DecisionModelDraft {
  governingDecision: string;
  answerFirstRecommendation: string;
  claims: DecisionClaim[];
  /** Citation numbers that cut against the recommendation. */
  contradictoryEvidence: number[];
  risks: DecisionRisk[];
  dependencies: DecisionDependency[];
  openQuestions: OpenQuestion[];
  architectureModel?: ArchitectureModel;
  operatingModel?: OperatingModel;
  valueThesis?: string;
  valuePools?: ValueModel["valuePools"];
  requiredDecisions: RequiredDecision[];
}

export interface AssembleDecisionModelInput {
  moveId: string;
  clientDisplayName: string;
  initiativeDisplayName: string;
  draft: DecisionModelDraft;
  governedEvidence: GovernedEvidenceItem[];
  missingEvidence?: MissingEvidenceItem[];
  approvedAssumptions?: ApprovedAssumption[];
  /** Workforce Economics estimate (WE-2 output). When present it becomes ValueModel.estimateTwice. */
  weEstimate?: EstimateTwice;
  /** Injected for deterministic tests; defaults to now. */
  nowIso?: string;
}

/**
 * THE Workforce Economics convergence seam. A WE estimate + value thesis → a ValueModel.
 * Kept separate so WE-3 binds here, not by patching a generator.
 */
export function valueModelFromEstimate(
  valueThesis: string | undefined,
  valuePools: ValueModel["valuePools"],
  weEstimate: EstimateTwice | undefined,
): ValueModel | undefined {
  if (!valueThesis && !valuePools?.length && !weEstimate) return undefined;
  return {
    valueThesis: valueThesis ?? "",
    ...(valuePools?.length ? { valuePools } : {}),
    ...(weEstimate ? { estimateTwice: weEstimate } : {}),
  };
}

export function assembleMoveDecisionModel(
  input: AssembleDecisionModelInput,
): MoveDecisionModel {
  const { draft } = input;
  const valueModel = valueModelFromEstimate(
    draft.valueThesis,
    draft.valuePools,
    input.weEstimate,
  );

  return {
    moveId: input.moveId,
    clientDisplayName: input.clientDisplayName,
    initiativeDisplayName: input.initiativeDisplayName,
    governingDecision: draft.governingDecision,
    answerFirstRecommendation: draft.answerFirstRecommendation,
    evidenceBundle: input.governedEvidence,
    missingEvidence: input.missingEvidence ?? [],
    approvedAssumptions: input.approvedAssumptions ?? [],
    claims: draft.claims,
    contradictoryEvidence: draft.contradictoryEvidence,
    risks: draft.risks,
    dependencies: draft.dependencies,
    openQuestions: draft.openQuestions,
    ...(draft.architectureModel ? { architectureModel: draft.architectureModel } : {}),
    ...(draft.operatingModel ? { operatingModel: draft.operatingModel } : {}),
    ...(valueModel ? { valueModel } : {}),
    requiredDecisions: draft.requiredDecisions,
    meta: {
      builtAtIso: input.nowIso ?? new Date().toISOString(),
      source: "deterministic_assembly",
      weEstimateBound: Boolean(input.weEstimate),
    },
  };
}

/**
 * Structural integrity of the single source of truth. Every claim/risk must cite real evidence;
 * every required decision must offer options and recommend one that exists; the estimate-twice,
 * if present, must be internally consistent. Returns [] when valid.
 */
export function validateMoveDecisionModel(
  model: MoveDecisionModel,
): DecisionModelValidationIssue[] {
  const issues: DecisionModelValidationIssue[] = [];
  const known = new Set(model.evidenceBundle.map((e) => e.citationNumber));

  if (!model.governingDecision.trim()) {
    issues.push({ code: "empty_governing_decision", detail: "governingDecision is empty." });
  }
  if (!model.answerFirstRecommendation.trim()) {
    issues.push({ code: "empty_recommendation", detail: "answerFirstRecommendation is empty." });
  }

  const checkCites = (
    cites: number[],
    code: DecisionModelValidationIssue["code"],
    where: string,
  ) => {
    for (const n of cites) {
      if (!known.has(n)) {
        issues.push({ code, detail: `${where} cites evidence [${n}] not in the bundle.` });
      }
    }
  };

  for (const c of model.claims) {
    checkCites(c.supportingEvidence, "claim_cites_unknown_evidence", `claim ${c.id} (supporting)`);
    checkCites(c.contradictingEvidence, "claim_cites_unknown_evidence", `claim ${c.id} (contradicting)`);
  }
  checkCites(model.contradictoryEvidence, "contradictory_cites_unknown_evidence", "contradictoryEvidence");
  for (const r of model.risks) {
    checkCites(r.evidence, "risk_cites_unknown_evidence", `risk ${r.id}`);
  }

  for (const d of model.requiredDecisions) {
    if (d.options.length === 0) {
      issues.push({
        code: "required_decision_without_options",
        detail: `required decision ${d.id} has no options.`,
      });
      continue;
    }
    if (!d.options.some((o) => o.id === d.recommendedOptionId)) {
      issues.push({
        code: "recommended_option_missing",
        detail: `required decision ${d.id} recommends option '${d.recommendedOptionId}' which is not in its options.`,
      });
    }
  }

  const est = model.valueModel?.estimateTwice;
  if (est) {
    // The estimate-twice promise (WE capacity model): AI-native is cheaper and not slower.
    if (est.aiNative.costUsd > est.traditional.costUsd) {
      issues.push({
        code: "value_model_estimate_inconsistent",
        detail: "estimateTwice: aiNative.costUsd exceeds traditional.costUsd (AI-native should be cheaper).",
      });
    }
    if (est.aiNative.durationMonths > est.traditional.durationMonths) {
      issues.push({
        code: "value_model_estimate_inconsistent",
        detail: "estimateTwice: aiNative.durationMonths exceeds traditional (AI-native should not be slower).",
      });
    }
  }

  return issues;
}
