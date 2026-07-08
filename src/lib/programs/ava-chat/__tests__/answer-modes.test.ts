import { classifyMovesAvaQuestion, buildOutOfScopeRedirect } from "../answer-modes";

// The 12 prompts specified for Moves aVa chat hardening, each with the
// answer mode (or out-of-scope redirect) it must resolve to.
const PROMPTS: Array<{ question: string; mode: string; outOfScope?: boolean }> = [
  { question: "What should I do next in this phase?", mode: "phase_guidance" },
  { question: "What evidence is missing?", mode: "evidence_gap" },
  { question: "What did this upload mean?", mode: "upload_mapping" },
  { question: "What changed between draft and final?", mode: "draft_final_change" },
  { question: "Can we move to the next phase?", mode: "next_phase_readiness" },
  { question: "Which solution lanes are affected?", mode: "solution_lane_explanation" },
  { question: "What should the P3 workshop focus on?", mode: "workshop_preparation" },
  { question: "Should we automate legal review?", mode: "risk_control" },
  { question: "How does this affect Source?", mode: "source_implication" },
  { question: "What should Tower measure?", mode: "tower_measurement" },
  {
    question: "What are the top AI trends in supply chain?",
    mode: "out_of_scope_redirect",
    outOfScope: true,
  },
  {
    question: "How do we create an AI strategy for executive council?",
    mode: "out_of_scope_redirect",
    outOfScope: true,
  },
];

describe("classifyMovesAvaQuestion — the 12 specified Moves aVa prompts", () => {
  it.each(PROMPTS)("classifies %j correctly", ({ question, mode, outOfScope }) => {
    const result = classifyMovesAvaQuestion(question);
    expect(result.mode).toBe(mode);
    expect(result.isOutOfScope).toBe(Boolean(outOfScope));
  });
});

describe("classifyMovesAvaQuestion — additional coverage", () => {
  it("defaults unmatched free-form questions to phase_guidance, not a false out-of-scope hit", () => {
    const result = classifyMovesAvaQuestion("Tell me about this Move.");
    expect(result.mode).toBe("phase_guidance");
    expect(result.isOutOfScope).toBe(false);
  });

  it("treats gate-blocker language as gate_blocker, not next_phase_readiness", () => {
    expect(classifyMovesAvaQuestion("What's blocking progress?").mode).toBe("gate_blocker");
  });
});

describe("buildOutOfScopeRedirect", () => {
  it("names the Move, offers the bounded answer, and points to Intelligence for the general case", () => {
    const text = buildOutOfScopeRedirect("Legal and Vendor Contract Obligation Control");
    expect(text).toContain("Legal and Vendor Contract Obligation Control");
    expect(text).toContain("broader than this Move");
    expect(text).toContain("Intelligence");
    // Never a flat refusal — must not be a bare "I can't help with that."
    expect(text.toLowerCase()).not.toMatch(/^i can'?t help/);
  });
});
