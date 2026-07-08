// Deterministic classification of a Source aVa question into one of the 16
// modes. Phase A implements 6 modes (grounding + quality gate); the other 10
// must still classify correctly and fall through to existing chat behavior —
// this suite proves both halves of that contract.

import {
  classifySourceAnswerMode,
  isPhaseAImplementedMode,
  PHASE_A_IMPLEMENTED_MODES,
  type SourceAnswerMode,
} from "../answer-mode";

describe("classifySourceAnswerMode — Phase A implemented modes", () => {
  const cases: Array<{ question: string; expected: SourceAnswerMode }> = [
    { question: "Where are we on this event?", expected: "event_status" },
    { question: "What stage is this event on?", expected: "event_status" },
    { question: "How much is left to do?", expected: "event_status" },
    {
      question: "What do I need to do to advance the stage?",
      expected: "stage_gate",
    },
    { question: "What's blocking the gate?", expected: "stage_gate" },
    {
      question: "What evidence do I still need to provide?",
      expected: "evidence_readiness",
    },
    {
      question: "What data is missing for this stage?",
      expected: "evidence_readiness",
    },
    {
      question: "Which version is the final one?",
      expected: "artifact_finality",
    },
    {
      question: "Is this the authoritative copy?",
      expected: "artifact_finality",
    },
    {
      question: "Where did this document come from?",
      expected: "artifact_lineage",
    },
    { question: "What's the upload history here?", expected: "artifact_lineage" },
    {
      question: "How do I upload the final reviewed version?",
      expected: "workflow_how_to",
    },
    { question: "How do I advance the stage?", expected: "stage_gate" },
  ];

  it.each(cases)("classifies '$question' as $expected", ({ question, expected }) => {
    const result = classifySourceAnswerMode({ question });
    expect(result.mode).toBe(expected);
    expect(result.isFallback).toBe(false);
  });

  it("PHASE_A_IMPLEMENTED_MODES lists exactly the 6 Phase A modes", () => {
    expect([...PHASE_A_IMPLEMENTED_MODES].sort()).toEqual(
      [
        "event_status",
        "workflow_how_to",
        "evidence_readiness",
        "artifact_lineage",
        "artifact_finality",
        "stage_gate",
      ].sort(),
    );
  });

  it("isPhaseAImplementedMode is true for all 6 Phase A modes and false otherwise", () => {
    for (const mode of PHASE_A_IMPLEMENTED_MODES) {
      expect(isPhaseAImplementedMode(mode)).toBe(true);
    }
    expect(isPhaseAImplementedMode("value_at_stake")).toBe(false);
    expect(isPhaseAImplementedMode("general_advisory")).toBe(false);
  });
});

describe("classifySourceAnswerMode — the 10 deferred (classify-only-passthrough) modes", () => {
  const cases: Array<{ question: string; expected: SourceAnswerMode }> = [
    { question: "What's our value at stake?", expected: "value_at_stake" },
    { question: "Compare vendors for this event", expected: "vendor_comparison" },
    { question: "What's the transition risk exposure?", expected: "risk_exposure" },
    { question: "What's our clause coverage?", expected: "clause_coverage" },
    { question: "What's the BAFO strategy here?", expected: "bafo_strategy" },
    { question: "What's the should-cost for this vendor?", expected: "should_cost" },
    { question: "What's the committed value on this award?", expected: "committed_value" },
    { question: "How is value realization tracking?", expected: "value_realization" },
    {
      question: "Is the committee aligned on this decision?",
      expected: "stakeholder_alignment",
    },
    { question: "What do you think about this vendor's culture fit?", expected: "general_advisory" },
  ];

  it.each(cases)("classifies '$question' as $expected (deferred)", ({ question, expected }) => {
    const result = classifySourceAnswerMode({ question });
    expect(result.mode).toBe(expected);
    if (expected !== "general_advisory") {
      expect(isPhaseAImplementedMode(result.mode)).toBe(false);
    }
  });

  it("falls back to general_advisory (isFallback=true) for an empty question", () => {
    const result = classifySourceAnswerMode({ question: "" });
    expect(result.mode).toBe("general_advisory");
    expect(result.isFallback).toBe(true);
  });

  it("falls back to general_advisory for an unmatched question", () => {
    const result = classifySourceAnswerMode({
      question: "Tell me a joke about procurement",
    });
    expect(result.mode).toBe("general_advisory");
    expect(result.isFallback).toBe(true);
  });
});

describe("classifySourceAnswerMode — determinism", () => {
  it("is pure: same input always yields the same output", () => {
    const input = { question: "What stage is this event on?" };
    const first = classifySourceAnswerMode(input);
    const second = classifySourceAnswerMode(input);
    expect(first).toEqual(second);
  });
});
