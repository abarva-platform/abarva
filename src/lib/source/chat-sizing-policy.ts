import type { SourceEventArtifactState } from "./canvas-substrate";
import { normalizeSourceStageKey } from "./constants";
import type { SourceStageKey } from "./types";

export type SourceChatDockMode = "side-rail" | "collapsed";

export interface SourceChatSizingPolicy {
  stage: SourceStageKey;
  widthPct: number;
  mode: SourceChatDockMode;
  collapsedSummary: string;
  resetKey: string;
}

const BASE_STAGE_WIDTH: Partial<Record<SourceStageKey, number>> = {
  strategy: 40,
  scope: 40,
  rfp: 40,
  responses: 30,
  evaluation: 30,
  pricing: 35,
  bafo: 35,
  executive_decision: 15,
  selection: 25,
  transition: 30,
  value: 25,
  intake: 40,
  sourcing_strategy: 40,
  rfp_rfi_package: 40,
  vendor_responses: 30,
  orals_bafo: 35,
  contract_mobilization: 30,
  value_realization: 25,
};

const DRAFTING_STAGES = new Set<SourceStageKey>([
  "strategy",
  "rfp",
  "bafo",
  "executive_decision",
  "sourcing_strategy",
  "rfp_rfi_package",
  "orals_bafo",
]);

const COLLAPSED_STAGES = new Set<SourceStageKey>(["executive_decision"]);

export function chatWidthForStage(
  stageKey: SourceStageKey,
  artifacts: readonly SourceEventArtifactState[] = [],
): SourceChatSizingPolicy {
  const stage = normalizeSourceStageKey(stageKey) ?? stageKey;
  const emptyDraftingStage =
    DRAFTING_STAGES.has(stage) &&
    artifacts.length > 0 &&
    artifacts.every(isNotAuthored);
  const widthPct = emptyDraftingStage
    ? Math.min(BASE_STAGE_WIDTH[stage] ?? 40, 30)
    : (BASE_STAGE_WIDTH[stage] ?? 40);
  const mode: SourceChatDockMode = COLLAPSED_STAGES.has(stage)
    ? "collapsed"
    : "side-rail";

  return {
    stage,
    widthPct,
    mode,
    collapsedSummary: "Click to expand · 3 stage-specific suggestions",
    resetKey: stage,
  };
}

function isNotAuthored(artifact: SourceEventArtifactState): boolean {
  if (artifact.body?.trim()) return false;
  return artifact.status === "not_started" || artifact.status === "drafting";
}
