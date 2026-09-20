import {
  buildEvaluationBafoReadinessView,
  buildStage07NegotiationBriefCandidate,
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";

function buildReadyInputs() {
  const profileSet = buildVendorResponseMveProfiles({
    id: "client-a-test-event",
    code: "CLIENT-A-LAKE-AMS-OUTSOURCING-2026",
    name: "Client A AMS Outsourcing RFP",
    accountName: "Client A",
  });
  if (!profileSet) throw new Error("expected test profile set");
  const intelligence = buildVendorChallengeIntelligence(profileSet);
  const bafoInstructionPack = buildVendorBafoInstructionPack(intelligence);
  const decisionView = buildVendorEvaluationDecisionView(
    profileSet,
    intelligence,
    bafoInstructionPack,
  );
  const readinessView = buildEvaluationBafoReadinessView({
    profileSet,
    challengeIntelligence: intelligence,
    bafoInstructionPack,
    decisionView,
  });

  return { profileSet, bafoInstructionPack, decisionView, readinessView };
}

describe("Stage 07 negotiation brief planner", () => {
  it("builds a read-only negotiation-brief candidate from accepted facts and proposed asks", () => {
    const { bafoInstructionPack, decisionView, readinessView } =
      buildReadyInputs();

    const candidate = buildStage07NegotiationBriefCandidate({
      readinessView,
      bafoInstructionPack,
      decisionView,
    });

    expect(candidate.state).toBe("candidate");
    expect(candidate.exportReadiness).toBe("candidate_read_only");
    expect(candidate.acceptedFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "pricing_comparability",
          posture: "accepted_fact",
          statement: expect.stringContaining("Five-year TCO"),
        }),
        expect.objectContaining({
          category: "governed_blocker",
          posture: "accepted_fact",
        }),
        expect.objectContaining({
          category: "evaluator_evidence",
          posture: "accepted_fact",
          citation: expect.any(String),
        }),
      ]),
    );
    expect(candidate.proposedAsks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          posture: "proposed_ask",
          source: expect.stringMatching(/governed_blocker|bafo_question/),
          evidenceBasis: expect.any(Array),
        }),
      ]),
    );
    expect(JSON.stringify(candidate)).not.toMatch(
      /round created|score locked|award approved|guaranteed savings|benchmark range/i,
    );
    expect(candidate.guardrails.join(" ")).toMatch(/does not dispatch/i);
    expect(candidate.guardrails.join(" ")).toMatch(/does not claim savings/i);
  });

  it("refuses the export candidate when pricing comparability evidence is missing", () => {
    const { profileSet, bafoInstructionPack, decisionView } =
      buildReadyInputs();
    const profileWithMissingPricing = {
      ...profileSet.profiles[0],
      pricingSummary: {
        ...profileSet.profiles[0].pricingSummary,
        fiveYearTcoUsd: null,
        yearOneRunCostUsd: null,
        pricingBasis: "",
      },
    };
    const readinessView = buildEvaluationBafoReadinessView({
      profileSet: {
        ...profileSet,
        profiles: [profileWithMissingPricing],
      },
      bafoInstructionPack,
      decisionView,
    });

    const candidate = buildStage07NegotiationBriefCandidate({
      readinessView,
      bafoInstructionPack,
      decisionView,
    });

    expect(candidate.state).toBe("refused");
    expect(candidate.exportReadiness).toBe("refused_missing_evidence");
    expect(candidate.refusals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceFamily: "pricing",
          vendorName: profileWithMissingPricing.vendorName,
          reason: expect.stringContaining("pricing comparison stays blocked"),
        }),
      ]),
    );
    expect(candidate.proposedAsks).toEqual([]);
  });

  it("refuses when governed response evidence is missing", () => {
    const readinessView = buildEvaluationBafoReadinessView({});

    const candidate = buildStage07NegotiationBriefCandidate({
      readinessView,
    });

    expect(candidate.state).toBe("refused");
    expect(candidate.refusals).toEqual([
      expect.objectContaining({
        evidenceFamily: "response",
        vendorName: "All vendors",
        reason: expect.stringContaining("No governed response package rows"),
      }),
    ]);
    expect(candidate.acceptedFacts).toEqual([]);
    expect(candidate.proposedAsks).toEqual([]);
  });

  it("refuses when evaluator evidence is unavailable instead of treating advisory scores as accepted", () => {
    const { bafoInstructionPack, readinessView } = buildReadyInputs();

    const candidate = buildStage07NegotiationBriefCandidate({
      readinessView,
      bafoInstructionPack,
      decisionView: null,
    });

    expect(candidate.state).toBe("refused");
    expect(candidate.refusals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceFamily: "evaluator",
          vendorName: "All vendors",
          reason: expect.stringContaining("scorecard evidence"),
        }),
      ]),
    );
    expect(candidate.acceptedFacts.map((fact) => fact.category)).not.toContain(
      "evaluator_evidence",
    );
  });
});
