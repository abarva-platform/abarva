// Moves aVa chat hardening — deterministic packet builder.
//
// Builds a MovesAvaChatPacket from whatever real Move state the caller has
// already loaded this turn. Fields the caller doesn't have are recorded in
// `missingInputs` (and surfaced as a caveat) rather than guessed — matching
// the "a phase should never start blank, but also never be faked" contract
// used throughout the Moves phase-workspace slice.

import {
  buildAvaModuleCaveats,
  collectMissingAvaModuleInputs,
  type AvaModuleOptionalInputField,
} from "@/lib/agent/module-expert-contract";
import {
  MOVES_AVA_ALLOWED_ACTIONS,
  MOVES_AVA_DISALLOWED_ACTIONS,
  type MovesAvaChatPacket,
  type MovesAvaChecklistStatus,
  type MovesAvaFeedForwardSummary,
  type MovesAvaGateCriterion,
} from "./types";
import { detectSourceAwareness, detectTowerAwareness } from "./source-tower-awareness";

export interface BuildMovesAvaChatPacketInput {
  tenant: string;
  moveId: string;
  moveTitle: string;
  currentPhase: number;
  currentPhaseClientLabel: string;
  currentPhaseQuestion?: string | null;
  selectedBuildingBlocks?: string[];
  phaseTemplates?: string[];
  recommendedSessions?: string[];
  checklistStatus?: MovesAvaChecklistStatus | null;
  evidenceNeedPackets?: string[];
  currentStateAssessment?: string | null;
  uploadedTemplateMappings?: string[];
  whatChangedSummary?: string | null;
  gateCriteria?: MovesAvaGateCriterion[];
  nextPhaseFeedForwardPack?: MovesAvaFeedForwardSummary | null;
  approvedInputsPackPresent?: boolean;
}

const OPTIONAL_FIELD_LABELS: ReadonlyArray<
  AvaModuleOptionalInputField<BuildMovesAvaChatPacketInput>
> = [
  { key: "checklistStatus", label: "phase checklist status" },
  { key: "evidenceNeedPackets", label: "evidence-need packets" },
  { key: "currentStateAssessment", label: "current-state assessment" },
  { key: "uploadedTemplateMappings", label: "uploaded template mappings" },
  { key: "whatChangedSummary", label: "What Changed summary" },
  { key: "gateCriteria", label: "gate criteria" },
  { key: "nextPhaseFeedForwardPack", label: "next-phase feed-forward pack" },
];

export function buildMovesAvaChatPacket(
  input: BuildMovesAvaChatPacketInput,
  questionText: string,
): MovesAvaChatPacket {
  const missingInputs = collectMissingAvaModuleInputs(input, OPTIONAL_FIELD_LABELS);
  const caveats = buildAvaModuleCaveats(missingInputs);

  return {
    surface: "moves",
    tenant: input.tenant,
    moveId: input.moveId,
    moveTitle: input.moveTitle,
    currentPhase: input.currentPhase,
    currentPhaseClientLabel: input.currentPhaseClientLabel,
    currentPhaseQuestion: input.currentPhaseQuestion ?? null,
    selectedBuildingBlocks: input.selectedBuildingBlocks ?? [],
    phaseTemplates: input.phaseTemplates ?? [],
    recommendedSessions: input.recommendedSessions ?? [],
    checklistStatus: input.checklistStatus ?? null,
    evidenceNeedPackets: input.evidenceNeedPackets ?? [],
    currentStateAssessment: input.currentStateAssessment ?? null,
    uploadedTemplateMappings: input.uploadedTemplateMappings ?? [],
    whatChangedSummary: input.whatChangedSummary ?? null,
    gateCriteria: input.gateCriteria ?? [],
    nextPhaseFeedForwardPack: input.nextPhaseFeedForwardPack ?? null,
    approvedInputsPackPresent: input.approvedInputsPackPresent ?? false,
    sourceImplication: detectSourceAwareness(questionText),
    towerMeasurement: detectTowerAwareness(questionText),
    missingInputs,
    caveats,
    allowedActions: [...MOVES_AVA_ALLOWED_ACTIONS],
    disallowedActions: [...MOVES_AVA_DISALLOWED_ACTIONS],
  };
}
