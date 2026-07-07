// Source reasoning · archetype resolver (Phase 1, Slice 1.4)
//
// Given a (archetype, rigor, stage), returns the ordered set of frameworks the
// Analysis stage should run plus the evidence threshold a gate-defining claim must
// reach. Pure. This is the ANALYTICAL resolver (§5.6) — it must NOT be conflated
// with src/lib/source/source-shape-resolver.ts, which is the UI
// WorkingPaneShapeResolver (presentation only).

import type { SourceRigorLevel, SourceStageKey } from "@/lib/source/types";
import type { SourceDataReadinessState } from "@/lib/source/types";
import type { FrameworkKey } from "./framework-registry";

export interface ResolvedAnalysisPlan {
  archetype: string;
  rigor: SourceRigorLevel;
  stage: SourceStageKey;
  /** Frameworks to run, in order. (Pending frameworks are still listed; the
   *  Analysis stage skips any that are not yet wired.) */
  frameworks: FrameworkKey[];
  /** Minimum readiness a gate-defining claim's evidence must reach (§5.6). */
  gateEvidenceThreshold: SourceDataReadinessState;
}

// Per the spec §5.2 framework-to-stage mapping. The classifier (archetype method
// set) runs at every stage; the others attach where their reasoning is relevant.
const STAGE_FRAMEWORKS: Partial<Record<SourceStageKey, FrameworkKey[]>> = {
  intake: ["archetype_method_set"],
  strategy: [
    "archetype_method_set",
    "should_cost_baseline",
    "delivery_model_gate",
  ],
  sourcing_strategy: [
    "archetype_method_set",
    "should_cost_baseline",
    "delivery_model_gate",
  ],
  scope: ["archetype_method_set", "delivery_model_gate"],
  responses: ["archetype_method_set", "proposal_normalization"],
  evaluation: ["archetype_method_set", "proposal_normalization"],
  pricing: [
    "archetype_method_set",
    "proposal_normalization",
    "should_cost_baseline",
  ],
  bafo: [
    "archetype_method_set",
    "proposal_normalization",
    "should_cost_baseline",
  ],
};

/** Strategic rigor demands the strongest evidence for gate-defining claims. */
function thresholdForRigor(rigor: SourceRigorLevel): SourceDataReadinessState {
  switch (rigor) {
    case "strategic":
      return "Usable Evidence";
    case "enhanced":
      return "Available";
    default:
      return "Parsed";
  }
}

export function resolveAnalysisPlan(
  archetype: string,
  rigor: SourceRigorLevel,
  stage: SourceStageKey,
): ResolvedAnalysisPlan {
  const frameworks = STAGE_FRAMEWORKS[stage] ?? ["archetype_method_set"];
  return {
    archetype,
    rigor,
    stage,
    frameworks,
    gateEvidenceThreshold: thresholdForRigor(rigor),
  };
}
