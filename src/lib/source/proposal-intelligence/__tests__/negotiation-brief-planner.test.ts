import {
  buildEvaluationBafoReadinessView,
  buildScorecardAuthorityView,
  buildStage07BafoRoundConcessionView,
  buildStage07NegotiationBriefCandidate,
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
  type ScorecardAuthorityCriterionRecord,
  type ScorecardAuthorityScoreRecord,
  type Stage07BafoConcessionRecord,
  type Stage07BafoRoundRecord,
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
  const scorecardAuthorityView = buildScorecardAuthorityView({
    tenantKey: profileSet.tenantKey,
    sourceEventId: profileSet.sourceEventId,
    criteria: buildAuthorityCriteria({
      tenantKey: profileSet.tenantKey,
      sourceEventId: profileSet.sourceEventId,
    }),
    scores: buildAuthorityScores({
      tenantKey: profileSet.tenantKey,
      sourceEventId: profileSet.sourceEventId,
      vendorIds: profileSet.profiles.map((profile) => ({
        vendorId: profile.vendorId,
        vendorName: profile.vendorName,
      })),
    }),
  });
  const bafoRoundConcessionView = buildStage07BafoRoundConcessionView({
    tenantKey: profileSet.tenantKey,
    sourceEventId: profileSet.sourceEventId,
    rounds: buildReviewedRounds({
      tenantKey: profileSet.tenantKey,
      sourceEventId: profileSet.sourceEventId,
      vendorIds: profileSet.profiles.map((profile) => ({
        vendorId: profile.vendorId,
        vendorName: profile.vendorName,
      })),
    }),
    concessions: buildReviewedConcessions({
      tenantKey: profileSet.tenantKey,
      sourceEventId: profileSet.sourceEventId,
      vendorIds: profileSet.profiles.map((profile) => ({
        vendorId: profile.vendorId,
        vendorName: profile.vendorName,
      })),
    }),
  });

  return {
    profileSet,
    bafoInstructionPack,
    decisionView,
    readinessView,
    scorecardAuthorityView,
    bafoRoundConcessionView,
  };
}

describe("Stage 07 negotiation brief planner", () => {
  it("builds a read-only negotiation-brief candidate from accepted facts and proposed asks", () => {
    const {
      bafoInstructionPack,
      decisionView,
      readinessView,
      scorecardAuthorityView,
      bafoRoundConcessionView,
    } = buildReadyInputs();

    const candidate = buildStage07NegotiationBriefCandidate({
      readinessView,
      bafoInstructionPack,
      decisionView,
      scorecardAuthorityView,
      bafoRoundConcessionView,
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
        expect.objectContaining({
          category: "bafo_round",
          posture: "accepted_fact",
          reviewState: "reviewed",
        }),
        expect.objectContaining({
          category: "bafo_concession",
          posture: "accepted_fact",
          reviewState: "reviewed",
          citation: expect.stringContaining("EVID-BAFO-CONCESSION"),
        }),
      ]),
    );
    expect(candidate.acceptedFacts).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "bafo_condition" }),
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
    const {
      profileSet,
      bafoInstructionPack,
      decisionView,
      scorecardAuthorityView,
      bafoRoundConcessionView,
    } = buildReadyInputs();
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
      scorecardAuthorityView,
      bafoRoundConcessionView,
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
    const { bafoInstructionPack, readinessView, bafoRoundConcessionView } =
      buildReadyInputs();

    const candidate = buildStage07NegotiationBriefCandidate({
      readinessView,
      bafoInstructionPack,
      decisionView: null,
      bafoRoundConcessionView,
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

  it("refuses when scorecard authority is blocked for evaluator identity or weight lock", () => {
    const {
      profileSet,
      bafoInstructionPack,
      decisionView,
      readinessView,
      bafoRoundConcessionView,
    } = buildReadyInputs();
    const scorecardAuthorityView = buildScorecardAuthorityView({
      tenantKey: profileSet.tenantKey,
      sourceEventId: profileSet.sourceEventId,
      criteria: buildAuthorityCriteria({
        tenantKey: profileSet.tenantKey,
        sourceEventId: profileSet.sourceEventId,
      }).map((criterion) => ({ ...criterion, weightsFrozen: false })),
      scores: buildAuthorityScores({
        tenantKey: profileSet.tenantKey,
        sourceEventId: profileSet.sourceEventId,
        vendorIds: profileSet.profiles.map((profile) => ({
          vendorId: profile.vendorId,
          vendorName: profile.vendorName,
        })),
      }).map((score) => ({ ...score, evaluatorName: null })),
    });

    const candidate = buildStage07NegotiationBriefCandidate({
      readinessView,
      bafoInstructionPack,
      decisionView,
      scorecardAuthorityView,
      bafoRoundConcessionView,
    });

    expect(candidate.state).toBe("refused");
    expect(candidate.refusals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceFamily: "evaluator",
          vendorName: "All vendors",
          reason: expect.stringContaining("scorecard authority is blocked"),
        }),
      ]),
    );
    expect(candidate.proposedAsks).toEqual([]);
  });

  it("refuses until BAFO rounds and concessions are versioned and reviewed", () => {
    const {
      profileSet,
      bafoInstructionPack,
      decisionView,
      readinessView,
      scorecardAuthorityView,
    } = buildReadyInputs();
    const bafoRoundConcessionView = buildStage07BafoRoundConcessionView({
      tenantKey: profileSet.tenantKey,
      sourceEventId: profileSet.sourceEventId,
      rounds: buildReviewedRounds({
        tenantKey: profileSet.tenantKey,
        sourceEventId: profileSet.sourceEventId,
        vendorIds: profileSet.profiles.map((profile) => ({
          vendorId: profile.vendorId,
          vendorName: profile.vendorName,
        })),
      }).map((round) => ({
        ...round,
        evidenceReference: null,
        reviewState: "not_reviewed",
        reviewedBy: null,
        reviewedAt: null,
      })),
      concessions: buildReviewedConcessions({
        tenantKey: profileSet.tenantKey,
        sourceEventId: profileSet.sourceEventId,
        vendorIds: profileSet.profiles.map((profile) => ({
          vendorId: profile.vendorId,
          vendorName: profile.vendorName,
        })),
      }),
    });

    const candidate = buildStage07NegotiationBriefCandidate({
      readinessView,
      bafoInstructionPack,
      decisionView,
      scorecardAuthorityView,
      bafoRoundConcessionView,
    });

    expect(bafoRoundConcessionView.state).toBe("blocked");
    expect(candidate.state).toBe("refused");
    expect(candidate.refusals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceFamily: "bafo_round",
          reason: expect.stringContaining("BAFO round/concession review"),
        }),
      ]),
    );
    expect(candidate.acceptedFacts.map((fact) => fact.category)).not.toContain(
      "bafo_round",
    );
    expect(candidate.proposedAsks).toEqual([]);
  });
});

function buildAuthorityCriteria(args: {
  tenantKey: string;
  sourceEventId: string;
}): ScorecardAuthorityCriterionRecord[] {
  return [
    {
      tenantKey: args.tenantKey,
      sourceEventId: args.sourceEventId,
      criterionId: "transition",
      criterionVersion: "criteria-v1",
      label: "Transition certainty",
      weight: 100,
      weightsFrozen: true,
      approvedCriterionVersion: "criteria-v1",
      approvedBy: "named-procurement-lead",
      approvedAt: "2026-09-21T18:00:00Z",
    },
  ];
}

function buildAuthorityScores(args: {
  tenantKey: string;
  sourceEventId: string;
  vendorIds: { vendorId: string; vendorName: string }[];
}): ScorecardAuthorityScoreRecord[] {
  return args.vendorIds.map((vendor) => ({
    tenantKey: args.tenantKey,
    sourceEventId: args.sourceEventId,
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    criterionId: "transition",
    criterionVersion: "criteria-v1",
    evaluatorId: "eval-1",
    evaluatorName: "Named Evaluator",
    evaluatorScore: 8,
    evidenceReference: `EVID-SCORE-${vendor.vendorId}`,
    overrideReason: null,
    overrideReasonRequired: false,
    lockState: "locked",
    lockedBy: "eval-1",
    lockedAt: "2026-09-21T18:30:00Z",
  }));
}

function buildReviewedRounds(args: {
  tenantKey: string;
  sourceEventId: string;
  vendorIds: { vendorId: string; vendorName: string }[];
}): Stage07BafoRoundRecord[] {
  return args.vendorIds.map((vendor) => ({
    tenantKey: args.tenantKey,
    sourceEventId: args.sourceEventId,
    roundId: `bafo-round-1-${vendor.vendorId}`,
    roundVersion: "round-v1",
    roundLabel: "BAFO Round 1",
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    submittedAt: "2026-09-21T17:00:00Z",
    evidenceReference: `EVID-BAFO-ROUND-${vendor.vendorId}`,
    reviewedBy: "named-commercial-reviewer",
    reviewedAt: "2026-09-21T18:00:00Z",
    reviewState: "reviewed",
  }));
}

function buildReviewedConcessions(args: {
  tenantKey: string;
  sourceEventId: string;
  vendorIds: { vendorId: string; vendorName: string }[];
}): Stage07BafoConcessionRecord[] {
  return args.vendorIds.map((vendor) => ({
    tenantKey: args.tenantKey,
    sourceEventId: args.sourceEventId,
    concessionId: `concession-${vendor.vendorId}`,
    concessionVersion: "concession-v1",
    roundId: `bafo-round-1-${vendor.vendorId}`,
    roundVersion: "round-v1",
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    concessionType: "commercial",
    summary: "Reviewed concession summary; no value claim is created here.",
    condition: "Condition remains subject to reviewer acceptance.",
    expiryDate: "2026-10-15",
    acceptedFlag: null,
    evidenceReference: `EVID-BAFO-CONCESSION-${vendor.vendorId}`,
    reviewedBy: "named-commercial-reviewer",
    reviewedAt: "2026-09-21T18:05:00Z",
    reviewState: "reviewed",
  }));
}
