import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

describe("Ava answer quality gate", () => {
  it("fails row-count-first and old scaffold language", () => {
    const packet = composeAvaAnswer({
      surface: "home",
      mode: "KNOW",
      tenantKey: "skyharbor",
      question: "How is IT organized?",
      intent: "lookup",
      status: "partial",
      directAnswer:
        "Home found 38 IT org rows. Evidence: the current-state read uses mv_home_it_org_view.",
      interpretation: "The loaded context is useful.",
      gaps: [
        {
          id: "g1",
          label: "Named leader",
          detail: "Named portfolio leaders are not loaded.",
        },
      ],
    });

    const result = validateAvaAnswerPacket(packet);

    expect(result.passed).toBe(false);
    expect(result.violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining(["forbidden-language", "row-count-first"]),
    );
  });

  it("blocks Home recommendations and expert leakage", () => {
    const result = validateAvaAnswerPacket({
      surface: "home",
      mode: "KNOW",
      tenantKey: "skyharbor",
      question: "Where should we invest?",
      intent: "decision_handoff",
      status: "handoff",
      directAnswer: "That question needs Intelligence before it becomes a recommendation.",
      interpretation:
        "Home can show what is loaded, but this needs an advisory workspace.",
      recommendation: "Invest in IROPS automation.",
      factsUsed: [],
      metricsUsed: [],
      relationshipsUsed: [],
      expertsUsed: [{ id: "xp.airline.operations", name: "Airline Expert" }],
      artifacts: [],
      citations: [],
      gaps: [],
      caveats: [],
      nextSteps: [],
      quality: {
        confidence: "medium",
        evidenceStrength: "thin",
        tenantGrounding: "missing",
        answerCompleteness: "partial",
      },
      safety: {
        tenantFencePassed: true,
        rawIdsSuppressed: true,
        forbiddenLanguagePassed: true,
        unsupportedClaimsBlocked: true,
      },
    });

    expect(result.passed).toBe(false);
    expect(result.violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining([
        "home-recommendation-forbidden",
        "home-experts-forbidden",
      ]),
    );
  });
});
