import { auditSuggestedQuestions } from "../suggested-question-audit";
import { PHASE_CONFIGS } from "@/components/strategic-moves/StrategicMovePhaseClient";

describe("auditSuggestedQuestions — unit behavior", () => {
  it("flags a workflow-bypass trap question", () => {
    const violations = auditSuggestedQuestions(["Can Moves approve the phase for me?"]);
    expect(violations.length).toBe(1);
  });

  it("flags a capability-overreach trap question", () => {
    const violations = auditSuggestedQuestions(["Does Source classify legacy MSAs automatically?"]);
    expect(violations.length).toBe(1);
  });

  it("flags a third-party replacement trap question", () => {
    const violations = auditSuggestedQuestions(["Does this replace Gartner's research for us?"]);
    expect(violations.length).toBe(1);
  });

  it("passes safe, workflow-appropriate questions", () => {
    const violations = auditSuggestedQuestions([
      "What baseline metrics do we need to capture?",
      "Walk me through the P2 gate criteria",
    ]);
    expect(violations).toEqual([]);
  });
});

describe("auditSuggestedQuestions — regression against the real Moves phase-workspace static list", () => {
  it("every phase's curated suggestedPrompts pass the safety audit", () => {
    for (const [phaseNum, config] of Object.entries(PHASE_CONFIGS)) {
      const violations = auditSuggestedQuestions(config.suggestedPrompts);
      expect({ phase: phaseNum, violations }).toEqual({ phase: phaseNum, violations: [] });
    }
  });
});
