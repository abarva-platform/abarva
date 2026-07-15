import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { validateAvaAnswerClaims } from "@/lib/ava-answer/claim-source-validation";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

function answerFixture(overrides: Partial<AvaAnswerPacket> = {}): AvaAnswerPacket {
  return {
    surface: "intelligence",
    mode: "ANALYZE",
    tenantKey: "lakeshore",
    question: "What can Source do?",
    intent: "product_truth",
    status: "answered",
    directAnswer:
      "The business context shows a $39M value line and 63% current accuracy.",
    factsUsed: [],
    metricsUsed: [
      {
        id: "m1",
        label: "Value line",
        value: "$39M",
        citationIds: ["c1"],
      },
      {
        id: "m2",
        label: "Accuracy",
        value: "63%",
        citationIds: ["c1"],
      },
    ],
    relationshipsUsed: [],
    artifacts: [],
    tables: [],
    charts: [],
    graphs: [],
    citations: [
      {
        id: "c1",
        label: "Lakeshore value metric",
        sourceClass: "tenant-fact",
        excerpt: "Value line $39M and current forecast accuracy 63%.",
      },
    ],
    gaps: [],
    caveats: [],
    nextSteps: [],
    quality: {
      confidence: "high",
      evidenceStrength: "strong",
      tenantGrounding: "complete",
      answerCompleteness: "complete",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
    ...overrides,
  };
}

describe("validateAvaAnswerClaims", () => {
  it("maps material numeric claims to packet support", () => {
    const report = validateAvaAnswerClaims(answerFixture());

    expect(report.passed).toBe(true);
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claim: "$39M",
          support: "exact_source_fact",
          severity: "pass",
        }),
        expect.objectContaining({
          claim: "63%",
          support: "exact_source_fact",
          severity: "pass",
        }),
      ]),
    );
  });

  it("fails source-framed numbers that are absent from the packet", () => {
    const report = validateAvaAnswerClaims(
      answerFixture({
        directAnswer:
          "The loaded evidence confirms a $54.2B revenue claim for the holding company.",
      }),
    );

    expect(report.passed).toBe(false);
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claim: "$54.2B",
          support: "unsupported",
          severity: "fail",
        }),
      ]),
    );
  });

  it("does not fail safe negations about unproven systems", () => {
    const report = validateAvaAnswerClaims(
      answerFixture({
        surface: "home",
        directAnswer:
          "The AWS Databricks aspiration, medallion architecture, platform/network/security foundation, and formal data governance operating model are not yet available as grounded context here.",
      }),
    );

    expect(report.passed).toBe(true);
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claim: "Databricks",
          support: "caveated_gap",
          severity: "pass",
        }),
      ]),
    );
  });

  it("blocks unsupported live product capability claims during packet validation", () => {
    const validation = validateAvaAnswerPacket(
      answerFixture({
        surface: "source",
        directAnswer:
          "AbarVa Source automatically negotiates contract positions and approves the contract.",
      }),
    );

    expect(validation.passed).toBe(false);
    expect(validation.violations.map((violation) => violation.code)).toContain(
      "claim-product_capability",
    );
  });
});
