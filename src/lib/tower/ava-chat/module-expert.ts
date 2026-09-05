// Tower aVa chat — module expert contract binding.

import type { AvaModuleExpertContract } from "@/lib/agent/module-expert-contract";
import {
  classifyTowerAvaQuestion,
  shouldBuildTowerAvaPacketForMode,
  type TowerAvaAnswerModeClassification,
} from "./answer-modes";
import {
  buildTowerAvaChatPacket,
  type BuildTowerAvaChatPacketInput,
} from "./packet";
import { runTowerAvaQualityGate, type TowerAvaQualityGateResult } from "./quality-gate";
import { formatTowerAvaChatPacketForPrompt } from "./system-prompt";
import type { TowerAvaAnswerMode, TowerAvaChatPacket } from "./types";

export const TOWER_AVA_MODULE_EXPERT_CONTRACT: AvaModuleExpertContract<
  "tower",
  TowerAvaChatPacket,
  BuildTowerAvaChatPacketInput,
  TowerAvaAnswerMode,
  TowerAvaQualityGateResult,
  TowerAvaAnswerModeClassification
> = {
  surface: "tower",
  classifyQuestion: classifyTowerAvaQuestion,
  shouldBuildPacket: shouldBuildTowerAvaPacketForMode,
  buildPacket: buildTowerAvaChatPacket,
  formatPrompt: formatTowerAvaChatPacketForPrompt,
  runQualityGate: runTowerAvaQualityGate,
};
