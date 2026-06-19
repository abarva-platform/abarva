// Source reasoning · framework registry (Phase 1, Slice 1.2)
//
// A framework (§5.2) runs one reasoning model and emits a structured AnalysisResult.
// This registry is the seed library, reusing the EXISTING analytical modules
// ("one definition, two callers"): the chat path already runs them via
// source-answer-engine.ts; the Analysis stage (Slice 1.3) runs them here.
//
// Slice 1.2 wires the CLASSIFIER framework end-to-end. should-cost, delivery-model,
// and proposal-normalization are declared with the exact input each still needs —
// wired in later slices. Pure; the live generate path is untouched.

import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import {
  classifySourcingEvent,
  type RiskSeverity,
} from "@/lib/source/classifier/category-classifier";
import type { ConfidenceBand } from "./reasoning-envelope";
import type { AnalysisResult, Framework } from "./types";
import { toClassifierInput, toRigorLevel } from "./context-adapter";

export type FrameworkKey =
  | "archetype_method_set"
  | "should_cost_baseline"
  | "delivery_model_gate"
  | "proposal_normalization";

export interface FrameworkEntry {
  key: FrameworkKey;
  /** "wired" = runnable on the generate path now; "pending" = awaiting input wiring. */
  status: "wired" | "pending";
  /** The existing module the framework reuses. */
  module: string;
  /** For a pending framework: the exact input it still needs. */
  pendingInput?: string;
  /** Present iff status === "wired". */
  run?: Framework<SourceGenerationContext>;
}

/** Map the classifier's severity-style confidence onto a ConfidenceBand. */
function bandFromSeverity(sev: RiskSeverity): ConfidenceBand {
  const score = sev === "high" ? 0.85 : sev === "medium" ? 0.6 : 0.35;
  const label = sev === "high" ? "high" : sev === "medium" ? "moderate" : "low";
  return {
    label,
    score,
    interval: [Math.max(0, score - 0.1), Math.min(1, score + 0.1)],
    factors: {
      evidenceSufficiency: score,
      evidenceRecency: score,
      corroboration: score,
      modelUncertainty: 1 - score,
    },
  };
}

const runArchetypeMethodSet: Framework<SourceGenerationContext> = (ctx) => {
  const { attributes, signals } = toClassifierInput(ctx);
  const c = classifySourcingEvent(attributes, signals);
  const result: AnalysisResult = {
    framework: "archetype_method_set",
    finding: {
      categoryId: c.categoryId,
      buyingMotion: c.buyingMotion,
      riskSeverity: c.riskProfile.severity,
      evidenceGaps: c.evidenceGaps.map((g) => g.segment),
    },
    confidence: bandFromSeverity(c.confidence),
    // The classifier is deterministic over event attributes and cites no evidence
    // states; evidence-anchored frameworks (should-cost, etc.) populate this.
    evidence: [],
  };
  return result;
};

export const FRAMEWORK_REGISTRY: Record<FrameworkKey, FrameworkEntry> = {
  archetype_method_set: {
    key: "archetype_method_set",
    status: "wired",
    module: "classifier/category-classifier.ts:classifySourcingEvent",
    run: runArchetypeMethodSet,
  },
  should_cost_baseline: {
    key: "should_cost_baseline",
    status: "pending",
    module: "should-cost/should-cost-model.ts:buildShouldCostEstimate",
    pendingInput:
      "a value-at-stake adapter that reuses estimateEventShouldCost without coupling generation to SourceAgentContextBundle",
  },
  delivery_model_gate: {
    key: "delivery_model_gate",
    status: "pending",
    module: "delivery-model/delivery-model-gate.ts:runDeliveryModelGate",
    pendingInput: "a category-signal adapter for runDeliveryModelGate",
  },
  proposal_normalization: {
    key: "proposal_normalization",
    status: "pending",
    module:
      "proposal-normalization/proposal-normalization.ts:buildProposalNormalizationMatrix",
    pendingInput:
      "parsed vendor proposals on the context (net-new binary extraction, Phase 2 d13/d15)",
  },
};

/** The framework keys runnable on the generate path today. */
export function listWiredFrameworks(): FrameworkKey[] {
  return (Object.keys(FRAMEWORK_REGISTRY) as FrameworkKey[]).filter(
    (k) => FRAMEWORK_REGISTRY[k].status === "wired",
  );
}

/**
 * Run a wired framework against generation context. Returns null for a
 * pending/unknown key so the Analysis stage can skip it without throwing.
 */
export function runFramework(
  key: FrameworkKey,
  ctx: SourceGenerationContext,
): AnalysisResult | null {
  const entry = FRAMEWORK_REGISTRY[key];
  if (!entry || entry.status !== "wired" || !entry.run) return null;
  return entry.run(ctx, { rigor: toRigorLevel(ctx) });
}
