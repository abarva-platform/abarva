import {
  evidenceForStage,
  specByCode,
  type SourceEvidenceRequirement,
} from "@/lib/source/canonical-specs";
import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";
import {
  resolveStageNextMove,
  type StageNextMoveView,
} from "@/lib/source/stage-next-move";
import type { SourceStageKey } from "@/lib/source/types";

const SIMPLE_STAGE_DELIVERABLE: Partial<Record<SourceStageKey, string>> = {
  strategy: "d01_strategy_memo",
  scope: "d05_scope_memo",
  rfp: "d09_rfp_pack",
  responses: "d11_response_checklist",
  evaluation: "d16_scorecard",
  pricing: "d19_pricing_workbook",
  bafo: "d22_bafo_question_pack",
  executive_decision: "d24_decision_brief",
  selection: "d27_selection_memo",
  transition: "d29_transition_plan",
  value: "d32_value_ledger",
};

export interface SimpleStageScreenEvent {
  artifactStates?: SourceEventArtifactState[];
  gateCriterionStates?: SourceEventGateCriterion[];
  evidenceStates?: SourceEventEvidence[];
}

export interface SimpleStageRequirementView {
  requirementId: string;
  label: string;
  why: string;
  acceptHint: string;
  state: SourceEventEvidence["currentState"] | "Not Requested";
  sourceLabel: string;
  sourceSystems: readonly string[];
  acceptedFileTypes: readonly string[];
  recordGrain: string;
  criticalFields: readonly string[];
  minimumState: SourceEvidenceRequirement["minimumState"];
  level: SourceEvidenceRequirement["level"];
}

export interface SimpleStageScreenView {
  stageLabel: string;
  required: SimpleStageRequirementView[];
  extras: SimpleStageRequirementView[];
  deliverable: {
    artifactCode: string;
    name: string;
  };
  nextStep: {
    label: string;
    stage?: SourceStageKey;
  };
}

export function resolveSimpleStageScreen(
  event: SimpleStageScreenEvent,
  stage: SourceStageKey,
): SimpleStageScreenView {
  const evidenceByRequirement = new Map(
    (event.evidenceStates ?? []).map((row) => [row.requirementId, row]),
  );
  const canonicalRequirements = evidenceForStage(stage);
  const orderByRequirementId = new Map(
    canonicalRequirements.map((requirement, index) => [
      requirement.requirementId,
      index,
    ]),
  );
  const requirements = canonicalRequirements.map((requirement) =>
    toRequirementView(
      requirement,
      evidenceByRequirement.get(requirement.requirementId),
    ),
  );
  const ranked = [...requirements].sort((a, b) => {
    const sourceA = canonicalRequirements.find(
      (req) => req.requirementId === a.requirementId,
    );
    const sourceB = canonicalRequirements.find(
      (req) => req.requirementId === b.requirementId,
    );
    const requiredRank =
      (sourceA?.level === "required" ? 0 : 1) -
      (sourceB?.level === "required" ? 0 : 1);
    if (requiredRank !== 0) return requiredRank;
    return (
      (orderByRequirementId.get(a.requirementId) ?? 999) -
      (orderByRequirementId.get(b.requirementId) ?? 999)
    );
  });
  const nextMove = resolveStageNextMove({
    stage,
    artifacts: (event.artifactStates ?? []).filter(
      (row) => row.stage === stage,
    ),
    criteria: (event.gateCriterionStates ?? []).filter(
      (row) => row.fromStage === stage,
    ),
  });
  const artifactCode = resolveSimpleDeliverableCode(stage, nextMove);
  const artifactSpec = specByCode(artifactCode);

  return {
    stageLabel: SOURCE_STAGE_LABELS[stage] ?? stage,
    required: ranked.slice(0, 3),
    extras: ranked.slice(3),
    deliverable: {
      artifactCode,
      name: artifactSpec?.name ?? humanizeArtifactCode(artifactCode),
    },
    nextStep: {
      label: nextMove.nextStage
        ? `Issue the ${SOURCE_STAGE_LABELS[nextMove.nextStage] ?? nextMove.nextStage}`
        : nextMove.primaryLabel,
      stage: nextMove.nextStage,
    },
  };
}

function toRequirementView(
  requirement: SourceEvidenceRequirement,
  current?: SourceEventEvidence,
): SimpleStageRequirementView {
  return {
    requirementId: requirement.requirementId,
    label: requirement.label,
    why: requirement.unlocks,
    acceptHint: `${requirement.sourceLabel} · needs ${requirement.minimumState.toLowerCase()}`,
    state: current?.currentState ?? "Not Requested",
    sourceLabel: requirement.sourceLabel,
    sourceSystems: requirement.sourceSystems,
    acceptedFileTypes: requirement.acceptedFileTypes,
    recordGrain: requirement.recordGrain,
    criticalFields: requirement.criticalFields,
    minimumState: requirement.minimumState,
    level: requirement.level,
  };
}

function resolveSimpleDeliverableCode(
  stage: SourceStageKey,
  nextMove: StageNextMoveView,
): string {
  return (
    SIMPLE_STAGE_DELIVERABLE[stage] ??
    nextMove.draftArtifactCode ??
    `source_${stage}_deliverable`
  );
}

function humanizeArtifactCode(code: string): string {
  return code
    .replace(/^d\d+_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
