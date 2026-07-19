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
      "Which Healthcare Demo facts are strongest, inferred, or still missing?",
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
      "What evidence would certify the fraud or dispute backlog value case for FS Demo?",
      "Which data-readiness gaps block the next AI funding decision for FS Demo?",
    ]);
    expect(result.questions.join("\n")).not.toContain(
      "What can AbarVa confirm from loaded evidence?",
    );
  });
});
