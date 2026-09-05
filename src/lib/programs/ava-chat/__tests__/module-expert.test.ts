import { classifyMovesAvaQuestion } from "../answer-modes";
import { MOVES_AVA_MODULE_EXPERT_CONTRACT } from "../module-expert";
import { buildMovesAvaChatPacket, type BuildMovesAvaChatPacketInput } from "../packet";
import { runMovesAvaQualityGate } from "../quality-gate";
import { formatMovesAvaChatPacketForPrompt } from "../system-prompt";

const BASE_INPUT: BuildMovesAvaChatPacketInput = {
  tenant: "Demo Tenant",
  moveId: "move-1",
  moveTitle: "Prior authorization automation",
  currentPhase: 2,
  currentPhaseClientLabel: "P2 Discover & Diagnose",
  currentPhaseQuestion: "What current-state friction makes this worth solving?",
  selectedBuildingBlocks: ["Workflow orchestration", "Clinical policy rules"],
  phaseTemplates: ["Current-state evidence map"],
  recommendedSessions: ["Operations diagnostic"],
  checklistStatus: {
    evidenceDone: true,
    evidenceLabel: "2 evidence items visible",
    gateDone: false,
    gateLabel: "1 hard gate open",
    canAdvance: false,
    nextPhaseLabel: "P3",
  },
  evidenceNeedPackets: ["Upload current authorization volume and exception evidence."],
  currentStateAssessment: "Manual queue triage is the current blocker.",
  uploadedTemplateMappings: ["workflow.csv -> Current-state evidence map"],
  whatChangedSummary: "Vendor pathway evidence was added.",
  gateCriteria: [{ label: "Current-state friction is evidenced", met: true, severity: "hard" }],
  nextPhaseFeedForwardPack: {
    headline: "Carry the evidenced friction into target design.",
    carriesForward: ["Exception-volume evidence"],
  },
  approvedInputsPackPresent: true,
};

describe("MOVES_AVA_MODULE_EXPERT_CONTRACT", () => {
  it("declares Moves as the module surface", () => {
    expect(MOVES_AVA_MODULE_EXPERT_CONTRACT.surface).toBe("moves");
  });

  it("delegates classification to the existing Moves classifier", () => {
    const question = "What evidence is missing before we can advance the gate?";

    expect(MOVES_AVA_MODULE_EXPERT_CONTRACT.classifyQuestion(question)).toEqual(
      classifyMovesAvaQuestion(question),
    );
  });

  it("delegates packet building to the existing Moves packet builder", () => {
    const question = "How does the vendor renewal affect this move?";

    expect(MOVES_AVA_MODULE_EXPERT_CONTRACT.buildPacket(BASE_INPUT, question)).toEqual(
      buildMovesAvaChatPacket(BASE_INPUT, question),
    );
  });

  it("delegates prompt formatting and quality gating without behavior changes", () => {
    const question = "What should Tower measure next?";
    const mode = classifyMovesAvaQuestion(question).mode;
    const packet = buildMovesAvaChatPacket(BASE_INPUT, question);
    const answer =
      "For this move, the next action is to review the P2 Discover & Diagnose gate evidence and ask Tower to carry the metric contract forward.";

    expect(MOVES_AVA_MODULE_EXPERT_CONTRACT.formatPrompt(packet, mode)).toBe(
      formatMovesAvaChatPacketForPrompt(packet, mode),
    );
    expect(MOVES_AVA_MODULE_EXPERT_CONTRACT.runQualityGate(answer, packet, mode)).toEqual(
      runMovesAvaQualityGate(answer, packet, mode),
    );
  });
});
