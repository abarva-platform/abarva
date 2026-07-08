// Deterministic classification of a Source aVa question into one of the 16
// modes. Phase A implements 6 modes (grounding + quality gate); the other 10
// must still classify correctly and fall through to existing chat behavior —
// this suite proves both halves of that contract.

import {
  classifySourceAnswerMode,
  isPhaseAImplementedMode,
  isPhaseBImplementedMode,
  isPhaseCImplementedMode,
  isGroundedAnswerMode,
  PHASE_A_IMPLEMENTED_MODES,
  PHASE_B_IMPLEMENTED_MODES,
  PHASE_C_IMPLEMENTED_MODES,
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

describe("classifySourceAnswerMode — Phase B implemented modes + the 2 remaining deferred modes", () => {
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

  it.each(cases)("classifies '$question' as $expected", ({ question, expected }) => {
    const result = classifySourceAnswerMode({ question });
    expect(result.mode).toBe(expected);
    // Phase A's predicate stays false for every Phase B/C mode — Phase A's
    // implemented-mode set is unchanged by this slice.
    expect(isPhaseAImplementedMode(result.mode)).toBe(false);
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

  it("PHASE_B_IMPLEMENTED_MODES lists exactly the 8 Phase B modes", () => {
    expect([...PHASE_B_IMPLEMENTED_MODES].sort()).toEqual(
      [
        "value_at_stake",
        "vendor_comparison",
        "should_cost",
        "risk_exposure",
        "clause_coverage",
        "bafo_strategy",
        "committed_value",
        "value_realization",
      ].sort(),
    );
  });

  it("isPhaseBImplementedMode is true for all 8 Phase B modes and false otherwise", () => {
    for (const mode of PHASE_B_IMPLEMENTED_MODES) {
      expect(isPhaseBImplementedMode(mode)).toBe(true);
    }
    expect(isPhaseBImplementedMode("event_status")).toBe(false);
    expect(isPhaseBImplementedMode("stakeholder_alignment")).toBe(false);
    expect(isPhaseBImplementedMode("general_advisory")).toBe(false);
  });

  it("isGroundedAnswerMode is true for every Phase A or Phase B mode (general_advisory is grounded by Phase C — see the Phase C describe block below — but is not itself a Phase B mode)", () => {
    for (const mode of [...PHASE_A_IMPLEMENTED_MODES, ...PHASE_B_IMPLEMENTED_MODES]) {
      expect(isGroundedAnswerMode(mode)).toBe(true);
    }
    // stakeholder_alignment is the ONLY mode left ungrounded after Phase C.
    expect(isGroundedAnswerMode("stakeholder_alignment")).toBe(false);
  });
});

describe("classifySourceAnswerMode — Phase C implemented modes", () => {
  const cases: Array<{ question: string; expected: SourceAnswerMode }> = [
    { question: "What should we do here?", expected: "decision_recommendation" },
    { question: "Recommend an award for this event", expected: "decision_recommendation" },
    { question: "Which vendor should we award?", expected: "decision_recommendation" },
    { question: "Renew or rebid this contract?", expected: "contract_optimization" },
    { question: "Should we renegotiate the current vendor?", expected: "contract_optimization" },
    { question: "What's the incumbent contract economics?", expected: "contract_optimization" },
  ];

  it.each(cases)("classifies '$question' as $expected", ({ question, expected }) => {
    const result = classifySourceAnswerMode({ question });
    expect(result.mode).toBe(expected);
    expect(result.isFallback).toBe(false);
  });

  it("PHASE_C_IMPLEMENTED_MODES lists exactly the 3 Phase C modes", () => {
    expect([...PHASE_C_IMPLEMENTED_MODES].sort()).toEqual(
      ["decision_recommendation", "contract_optimization", "general_advisory"].sort(),
    );
  });

  it("isPhaseCImplementedMode is true for all 3 Phase C modes and false otherwise", () => {
    for (const mode of PHASE_C_IMPLEMENTED_MODES) {
      expect(isPhaseCImplementedMode(mode)).toBe(true);
    }
    expect(isPhaseCImplementedMode("event_status")).toBe(false);
    expect(isPhaseCImplementedMode("value_at_stake")).toBe(false);
    expect(isPhaseCImplementedMode("stakeholder_alignment")).toBe(false);
  });

  it("isGroundedAnswerMode is true for every Phase A/B/C mode and false ONLY for stakeholder_alignment", () => {
    for (const mode of [
      ...PHASE_A_IMPLEMENTED_MODES,
      ...PHASE_B_IMPLEMENTED_MODES,
      ...PHASE_C_IMPLEMENTED_MODES,
    ]) {
      expect(isGroundedAnswerMode(mode)).toBe(true);
    }
    expect(isGroundedAnswerMode("stakeholder_alignment")).toBe(false);
  });

  it("general_advisory (the fallback) is grounded even though it is reached via isFallback=true", () => {
    const result = classifySourceAnswerMode({
      question: "Tell me a joke about procurement",
    });
    expect(result.mode).toBe("general_advisory");
    expect(result.isFallback).toBe(true);
    expect(isGroundedAnswerMode(result.mode)).toBe(true);
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
