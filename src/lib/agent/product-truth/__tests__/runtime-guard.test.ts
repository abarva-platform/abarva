import {
  classifySuggestedQuestion,
  applyProductTruthRuntimeGuard,
  sanitizeSuggestedQuestions,
} from "../runtime-guard";

describe("applyProductTruthRuntimeGuard", () => {
  it("replaces raw internal retired-fact errors with a client-safe fallback", () => {
    const result = applyProductTruthRuntimeGuard(
      "[error] retired_fact_violation: old_alias_lakeshore_industries@surfaceContext",
      {
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
        surface: "intelligence",
      },
    );

    expect(result.text).toContain("I can't safely answer");
    expect(result.text).not.toMatch(
      /retired_fact_violation|surfaceContext|old_alias/i,
    );
    expect(result.blocked).toBe(true);
  });

  it("repairs third-party replacement positioning", () => {
    const result = applyProductTruthRuntimeGuard(
      "Source replaces Gartner and Big Four vendor shortlisting for this renewal.",
      {
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
        surface: "source",
      },
    );

    expect(result.text).toContain("supports work");
    expect(result.text).not.toMatch(/\breplaces Gartner\b/i);
    expect(result.violations.map((v) => v.category)).toContain(
      "third_party_replacement_claim",
    );
  });

  it("repairs phrasing that makes Tower sound like the certifying authority", () => {
    const result = applyProductTruthRuntimeGuard(
      "Stand up Tower to certify the measured-value pool every month.",
      {
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
        surface: "intelligence",
      },
    );

    expect(result.text).toContain(
      "use Tower to track evidence for Finance and outcome-owner certification",
    );
    expect(result.text).not.toMatch(/Tower to certify/i);
  });

  it("maps the old Moves shorthand under the canonical P0-P5 contract", () => {
    const result = applyProductTruthRuntimeGuard(
      "The Moves model is Charter / Diagnose / Decide / Commit.",
      {
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
        surface: "moves",
      },
    );

    expect(result.text).toContain("P0 Originate");
    expect(result.text).toContain("P5 Prepare to Execute");
    expect(result.text).toContain("Tower Track Outcomes");
    expect(result.text).not.toContain("Charter / Diagnose / Decide / Commit");
    expect(result.violations.map((v) => v.category)).toContain(
      "wrong_moves_model",
    );
  });

  it("removes internal evidence codes from client-visible repaired answers", () => {
    const result = applyProductTruthRuntimeGuard(
      "Tower tracks the value baseline from BASE-007 and CTX-AI-001-42.",
      {
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
        surface: "tower",
      },
    );

    expect(result.text).not.toMatch(/\b(?:BASE-007|CTX-AI-001-42)\b/);
  });

  it("keeps public Source contract ids visible while removing other raw codes", () => {
    const result = applyProductTruthRuntimeGuard(
      "Source should optimize contract CTR-090, while BASE-007 stays internal.",
      {
        tenantKey: "skyharbor_global",
        tenantName: "SkyHarbor Global",
        surface: "source",
      },
    );

    expect(result.text).toContain("CTR-090");
    expect(result.text).not.toMatch(/\bBASE-007\b/);
  });

  it("uses a surface boundary for obvious out-of-scope questions", () => {
    const result = applyProductTruthRuntimeGuard("France won it.", {
      tenantKey: "lakeshore",
      tenantName: "Lakeshore Holdings",
      surface: "intelligence",
      query: "Who won the 2018 World Cup?",
    });

    expect(result.text).toMatch(/outside what I'm here for/i);
    expect(result.text).toContain("Lakeshore Holdings");
    expect(result.blocked).toBe(true);
  });
});

describe("sanitizeSuggestedQuestions", () => {
  it("classifies safe and risky generated follow-ups", () => {
    expect(
      classifySuggestedQuestion("What evidence supports this recommendation?"),
    ).toBe("safe_deeper_evidence");
    expect(
      classifySuggestedQuestion("How would this connect to Moves and Tower?"),
    ).toBe("safe_surface_transition");
    expect(
      classifySuggestedQuestion("Can Tower certify savings automatically?"),
    ).toBe("risky_unsupported_capability");
    expect(classifySuggestedQuestion("Does this replace Gartner for us?")).toBe(
      "risky_external_claim",
    );
  });

  it("drops unsafe suggested questions and supplies safe replacements", () => {
    const result = sanitizeSuggestedQuestions(
      [
        "Does Source compare all OpCo MSAs automatically?",
        "Can Tower certify value automatically?",
        "Does this replace Gartner for us?",
      ],
      {
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
        surface: "source",
      },
    );

    expect(result.questions).toEqual([
      "What vendor or contract evidence is confirmed versus missing?",
      "What should Legal and Procurement review before acting?",
      "How would this connect to Moves and Tower if it becomes a funded initiative?",
    ]);
    expect(result.violations.map((v) => v.category)).toContain(
      "unsafe_suggested_question",
    );
  });

  it("fills partial safe follow-ups to exactly three governed questions", () => {
    const result = sanitizeSuggestedQuestions(
      ["What evidence supports this recommendation?"],
      {
        tenantKey: "meridian",
        tenantName: "Healthcare Demo",
        surface: "intelligence",
      },
    );

    expect(result.questions).toHaveLength(3);
    expect(result.questions[0]).toBe(
      "What evidence supports this recommendation?",
    );
    expect(result.questions).toContain(
      "What would change this recommendation after the next evidence review?",
    );
  });

  it("uses client-specific Intelligence fallbacks instead of generic evidence fillers", () => {
    const result = sanitizeSuggestedQuestions(
      [
        "Can Tower certify value automatically?",
        "Does this replace Gartner for us?",
      ],
      {
        tenantKey: "arcturus",
        tenantName: "FS Demo",
        surface: "intelligence",
        query:
          "Should FS Demo prioritize contact center agent assist and fraud dispute automation?",
        groundingText:
          "FS Demo evidence mentions contact-center systems, fraud dispute backlog, ACI platform, CFO value proof, data readiness, and evidence owner gaps.",
      },
    );

    expect(result.questions).toEqual([
      "Which FS Demo contact-center systems, data feeds, and escalation owners should we validate first?",
      "What evidence would make the fraud or dispute backlog value case board-safe for FS Demo?",
      "What current-state evidence would most change the agent assist recommendation?",
    ]);
    expect(result.questions.join("\n")).not.toContain(
      "What can AbarVa confirm from loaded evidence?",
    );
  });

  it("locks Intelligence fallbacks to the query topic before broad grounding", () => {
    const result = sanitizeSuggestedQuestions([], {
      tenantKey: "arcturus",
      tenantName: "FS Demo",
      surface: "intelligence",
      query:
        "What does FS Demo know about current data foundation readiness for AI?",
      groundingText:
        "FS Demo evidence mentions contact-center systems, fraud dispute backlog, ACI platform, credit spreading, and capital markets automation.",
    });

    expect(result.questions).toEqual([
      "Which data-readiness gaps block the next AI funding decision for FS Demo?",
      "What lineage, metric-basis, or ownership evidence should FS Demo validate next?",
      "What current-state evidence would most change the data foundation recommendation?",
    ]);
    expect(result.questions.join("\n")).not.toMatch(/contact-center|fraud/i);
  });

  it("drops long generated follow-ups and replaces them with concise topic-aware questions", () => {
    const result = sanitizeSuggestedQuestions(
      [
        "Of the 72% versus 83% first-contact resolution gap, how much is mapped to next-best-action gaps versus agent capability, training, or process issues, and do we have agent-level adoption and usage data on the existing assist as a measured baseline?",
      ],
      {
        tenantKey: "arcturus",
        tenantName: "FS Demo",
        surface: "intelligence",
        query:
          "Should FS Demo prioritize contact center agent assist, and what current-state evidence should decide that?",
      },
    );

    expect(result.questions).toHaveLength(3);
    expect(result.questions[0]).toBe(
      "Which FS Demo contact-center systems, data feeds, and escalation owners should we validate first?",
    );
    expect(result.questions.every((question) => question.length <= 140)).toBe(
      true,
    );
  });

  it("rejects certification phrasing in generated Intelligence follow-ups", () => {
    const result = sanitizeSuggestedQuestions(
      [
        "What's blocking FS Demo's data foundation certification today: schema, quality, governance, or integration across core systems?",
      ],
      {
        tenantKey: "arcturus",
        tenantName: "FS Demo",
        surface: "intelligence",
        query:
          "What industry case studies matter most for FS Demo's AI roadmap?",
      },
    );

    expect(result.violations.map((violation) => violation.category)).toContain(
      "unsafe_suggested_question",
    );
    expect(result.questions.join("\n")).not.toMatch(/certification/i);
  });

  it("keeps Intelligence fallbacks varied across a strategy question pack", () => {
    const prompts = [
      "For FS Demo, what are the top AI investment themes in financial services right now, and where should we focus first?",
      "Rank five AI use cases for FS Demo by business value and implementation complexity.",
      "Should FS Demo prioritize contact center agent assist, and what current-state evidence should decide that?",
      "What does FS Demo know about current data foundation readiness for AI?",
      "What does FS Demo know about its current technology stack that affects AI execution?",
      "Which AI use cases are ready to fund now versus hold for evidence?",
      "Build a CFO read on where AI can create measurable value for FS Demo in the next 12 months.",
      "What governance or risk controls should FS Demo put around AI before scaling?",
      "Compare credit automation, fraud operations, and capital markets research automation.",
      "What industry case studies matter most for FS Demo's AI roadmap?",
    ];

    const followups = prompts.flatMap(
      (query) =>
        sanitizeSuggestedQuestions([], {
          tenantKey: "arcturus",
          tenantName: "FS Demo",
          surface: "intelligence",
          query,
        }).questions,
    );
    const counts = new Map<string, number>();
    for (const question of followups) {
      counts.set(question, (counts.get(question) ?? 0) + 1);
    }

    expect(new Set(followups).size).toBeGreaterThanOrEqual(24);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(3);
    expect(followups.join("\n")).not.toContain(
      "Which FS Demo evidence is strongest, inferred, or still missing?",
    );
  });
});
