import {
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
    expect(result.text).not.toMatch(/retired_fact_violation|surfaceContext|old_alias/i);
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

  it("maps the old Moves shorthand under the canonical P0-P5 contract", () => {
    const result = applyProductTruthRuntimeGuard(
      "The Moves model is Charter / Diagnose / Decide / Commit.",
      {
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
        surface: "moves",
      },
    );

    expect(result.text).toContain("P0 — Intake & Decision Framing");
    expect(result.text).toContain("Tower Track Outcomes");
    expect(result.violations.map((v) => v.category)).toContain(
      "wrong_moves_model",
    );
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
});
