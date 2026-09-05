import type { AvaModuleExpertContract } from "@/lib/agent/module-expert-contract";
import {
  classifyMovesAvaQuestion,
  shouldBuildMovesAvaPacketForMode,
  type MovesAvaAnswerModeClassification,
} from "./answer-modes";
import {
  buildMovesAvaChatPacket,
  type BuildMovesAvaChatPacketInput,
} from "./packet";
import {
  runMovesAvaQualityGate,
  type MovesAvaQualityGateResult,
} from "./quality-gate";
import { formatMovesAvaChatPacketForPrompt } from "./system-prompt";
import type { MovesAvaAnswerMode, MovesAvaChatPacket } from "./types";

export const MOVES_AVA_MODULE_EXPERT_CONTRACT: AvaModuleExpertContract<
  "moves",
  MovesAvaChatPacket,
  BuildMovesAvaChatPacketInput,
  MovesAvaAnswerMode,
  MovesAvaQualityGateResult,
  MovesAvaAnswerModeClassification
> = {
  surface: "moves",
  classifyQuestion: classifyMovesAvaQuestion,
  shouldBuildPacket: shouldBuildMovesAvaPacketForMode,
  buildPacket: buildMovesAvaChatPacket,
  formatPrompt: formatMovesAvaChatPacketForPrompt,
  runQualityGate: runMovesAvaQualityGate,
};
