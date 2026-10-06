import {
  buildEvaluationBafoReadinessView,
  buildScorecardAuthorityView,
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { deriveVendorResponseProfilesFromNormalized } from "@/lib/source/vendor-response-completeness-from-normalized";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EvaluationBafoReadinessPanel } from "@/components/source/canvas/responses/EvaluationBafoReadinessPanel";

const acceptedPackage: NormalizedVendorResponsePackage = {
  artifactId: "accepted-artifact-1",
  originalName: "supplier-response.xlsx",
  receivedAt: "2026-09-22T12:00:00Z",
  vendorId: "supplier-1",
  vendorName: "Example Supplier",
  rows: [
    {
      questionId: "question:supplier-1:REQ-1",
      requirementId: "REQ-1",
      category: "service scope",
      section: "Service model",
      requirement: "Describe service coverage.",
      requirementLevel: "Scored",
      responseType: "Narrative",
      evidenceRequired: true,
      evaluationCriterionId: "coverage",
      responseDisposition: "Comply",
      responseNarrative: "Twenty-four hour coverage.",
      evidenceRefs: ["exhibit-1"],
      reviewState: "accepted",
      provenance: {
        artifactId: "accepted-artifact-1",
        artifactName: "supplier-response.xlsx",
        receivedAt: "2026-09-22T12:00:00Z",
        parser: "source_normalized_vendor_response_v1",
        factKey: "fact-1",
      },
    },
    {
      questionId: "question:supplier-1:REQ-2",
      requirementId: "REQ-2",
      category: "service scope",
      section: "Service model",
      requirement: "Describe regional handoff.",
      requirementLevel: "Mandatory",
      responseType: "Narrative",
      evidenceRequired: false,
      responseDisposition: null,
      responseNarrative: null,
      reviewState: "accepted",
      provenance: {
        artifactId: "accepted-artifact-1",
        artifactName: "supplier-response.xlsx",
        receivedAt: "2026-09-22T12:00:00Z",
        parser: "source_normalized_vendor_response_v1",
        factKey: "fact-2",
      },
    },
  ],
  analytics: {
    requirementCount: 2,
    requirementCoverageScore: 50,
    mandatoryCompletenessScore: 0,
    evidenceCoverageScore: 50,
    pricingTraceabilityScore: 0,
    slaTraceabilityScore: 0,
    exceptionDisclosureScore: 100,
    criterionLinkageScore: 50,
    readyForEvaluation: "no",
    nonConformances: [],
    clarificationQuestions: [],
  },
  parserWarnings: [],
  syntheticDemo: false,
  reviewState: "accepted",
  authority: {
    acceptedArtifactOnly: true,
    source: "artifact_acceptance",
    acceptedAt: "2026-09-22T13:00:00Z",
    downstreamContextPolicy: "include",
  },
};

describe("evaluation / BAFO readiness decision support", () => {
  it("renders accepted requirement questions with stable IDs without promoting them to evaluator scores", () => {
    const profileSet = deriveVendorResponseProfilesFromNormalized({
      packages: [acceptedPackage],
      event: { id: "event-1" },
      tenantKey: "example-client",
    });
    const view = buildEvaluationBafoReadinessView({
      profileSet,
      normalizedPackages: [acceptedPackage],
    });

    expect(view.questionResponses).toEqual([
      expect.objectContaining({
        questionId: "question:supplier-1:REQ-1",
        questionLabel: "Describe service coverage.",
        answerState: "complete",
        normalizedResponse: "Twenty-four hour coverage.",
        evidenceReference: "exhibit-1",
      }),
      expect.objectContaining({
        questionId: "question:supplier-1:REQ-2",
        questionLabel: "Describe regional handoff.",
        answerState: "missing",
        normalizedResponse: "No response recorded.",
      }),
    ]);
    expect(view.evaluatorScorecards[0].reviewState).toBe("not_loaded");
    expect(view.state).not.toBe("ready_for_evaluator_review");
    const html = renderToStaticMarkup(
      createElement(EvaluationBafoReadinessPanel, { view }),
    );
    expect(html).toContain("Describe service coverage.");
    expect(html).toContain("Twenty-four hour coverage.");
    expect(html).toContain("Describe regional handoff.");
    expect(html).not.toContain("2 requirement row(s)");
  });

  it("does not label unaccepted parsed rows as governed questions", () => {
    const profileSet = deriveVendorResponseProfilesFromNormalized({
      packages: [acceptedPackage],
      event: { id: "event-1" },
      tenantKey: "example-client",
    });
    const view = buildEvaluationBafoReadinessView({
      profileSet,
      normalizedPackages: [{ ...acceptedPackage, authority: undefined }],
    });
    expect(view.questionResponses).toEqual([]);
  });

  it("fails closed when no governed vendor response profiles are loaded", () => {
    const view = buildEvaluationBafoReadinessView({});

    expect(view.state).toBe("no_records");
    expect(view.received).toEqual([]);
    expect(view.comparable).toEqual([]);
    expect(view.blockers).toEqual([
      expect.objectContaining({
        vendorName: "All vendors",
        severity: "blocker",
        nextAction:
          "Load normalized vendor response packages before comparing vendors.",
      }),
    ]);
    expect(view.guardrail).toMatch(/does not select a winner/i);
  });

  it("exposes normalized question rows, named evaluator review, support-only TCO, clarifications, and one governed BAFO round", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "client-a-test-event",
      code: "CLIENT-A-LAKE-AMS-OUTSOURCING-2026",
      name: "Client A AMS Outsourcing RFP",
      accountName: "Client A",
    });
    if (!profileSet) throw new Error("expected test profile set");
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(intelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profileSet,
      intelligence,
      bafoPack,
    );
    const scorecardAuthorityView = buildScorecardAuthorityView({
      tenantKey: profileSet.tenantKey,
      sourceEventId: profileSet.sourceEventId,
      criteria: [
        {
          tenantKey: profileSet.tenantKey,
          sourceEventId: profileSet.sourceEventId,
          criterionId: "transition",
          criterionVersion: "criteria-v1",
          label: "Transition certainty",
          weight: 100,
          weightsFrozen: true,
          approvedCriterionVersion: "criteria-v1",
          approvedBy: "named-procurement-lead",
          approvedAt: "2026-09-21T18:00:00Z",
        },
      ],
      scores: profileSet.profiles.map((profile) => ({
        tenantKey: profileSet.tenantKey,
        sourceEventId: profileSet.sourceEventId,
        vendorId: profile.vendorId,
        vendorName: profile.vendorName,
        criterionId: "transition",
        criterionVersion: "criteria-v1",
        evaluatorId: "eval-1",
        evaluatorName: "Named Evaluator",
        evaluatorScore: 8,
        evidenceReference: `EVID-SCORE-${profile.vendorId}`,
        overrideReason: null,
        overrideReasonRequired: false,
        lockState: "locked" as const,
        lockedBy: "eval-1",
        lockedAt: "2026-09-21T18:30:00Z",
      })),
    });

    const view = buildEvaluationBafoReadinessView({
      profileSet,
      challengeIntelligence: intelligence,
      bafoInstructionPack: bafoPack,
      decisionView,
      scorecardAuthorityView,
    });

    expect(view.questionResponses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor A"),
          questionId: "section-7",
          questionLabel: "Transition Plan",
          answerState: "partial",
          evidenceReference: "Narrative pp. 46-58",
        }),
      ]),
    );
    expect(view.questionResponses.every((row) => row.vendorId)).toBe(true);
    expect(view.evaluatorScorecards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor A"),
          criterionLabel: "Transition certainty",
          evaluatorName: "Named Evaluator",
          reviewState: "locked_named_human_review",
          evidenceReference: expect.stringContaining("EVID-SCORE-"),
        }),
      ]),
    );
    expect(view.commercialComparison).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor A"),
          supportOnlyTcoLabel: "$96.4M",
          includedAmountLabels: [
            "Five-year TCO: $96.4M",
            "Year-one run cost: $18.6M",
          ],
          excludedUnsupportedAmountLabels: [
            "Transition cost shown for review only: $4.8M",
            "One-time cost shown for review only: $1.2M",
            "Optional cost shown for review only: $2.1M",
          ],
        }),
      ]),
    );
    expect(view.clarificationRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor A"),
          source: expect.stringMatching(/blocker|bafo_question/),
          dispatchState: "draft_only_not_sent",
        }),
      ]),
    );
    expect(view.bafoRound).toEqual(
      expect.objectContaining({
        roundLabel: "BAFO Round 1",
        state: "candidate_not_dispatched",
        nextAction: expect.stringMatching(/named commercial review/i),
      }),
    );
    expect(JSON.stringify(view)).not.toMatch(
      /award approved|selected vendor|recommended supplier|guaranteed savings|realized savings/i,
    );
  });

  it("summarizes received packages, comparability, blockers, and one next action without award claims", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "client-a-test-event",
      code: "CLIENT-A-LAKE-AMS-OUTSOURCING-2026",
      name: "Client A AMS Outsourcing RFP",
      accountName: "Client A",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(intelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profileSet,
      intelligence,
      bafoPack,
    );

    const view = buildEvaluationBafoReadinessView({
      profileSet,
      challengeIntelligence: intelligence,
      bafoInstructionPack: bafoPack,
      decisionView,
    });

    expect(view.state).toBe("blocked");
    expect(view.received).toHaveLength(3);
    expect(view.received.map((row) => row.vendorName).join(" ")).toMatch(
      /Vendor A|Vendor B|Vendor C/,
    );
    expect(view.comparable).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor B"),
          comparability: "blocked",
        }),
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor A"),
          evidenceBasis: expect.any(Array),
        }),
      ]),
    );
    expect(view.pricing).toHaveLength(3);
    expect(view.pricing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor A"),
          comparability: "comparable",
          fiveYearTcoLabel: "$96.4M",
          pricingBasis: expect.stringContaining("Complete workbook"),
        }),
        expect.objectContaining({
          vendorName: expect.stringContaining("Vendor B"),
          comparability: "conditional",
          rationale: expect.stringContaining("assumptions"),
        }),
      ]),
    );
    expect(view.blockers.length).toBeGreaterThan(0);
    expect(view.singleNextAction).toMatch(/baseline|pricing|staffing|coverage|SLA|evidence|score/i);
    expect(view.guardrail).toMatch(/does not select a winner/i);
    expect(JSON.stringify(view)).not.toMatch(
      /award approved|guaranteed savings|industry benchmark/i,
    );
  });

  it("keeps event profile sets separate so archetype language does not bleed across events", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "18439aee-9889-4e97-a444-4d9e43a85bd5",
      code: "SHARED-SERVICES-LAKE-AMS-2026",
      name: "Client B Shared Services AMS",
      accountName: "Client B",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(intelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profileSet,
      intelligence,
      bafoPack,
    );

    const view = buildEvaluationBafoReadinessView({
      profileSet,
      challengeIntelligence: intelligence,
      bafoInstructionPack: bafoPack,
      decisionView,
    });
    const text = JSON.stringify(view);

    expect(view.archetypeLine).toContain("Client B Shared Services AMS");
    expect(view.archetypeLine).toBe(
      "Client B Shared Services AMS uses the current governed response profile set; comparisons stay inside that event profile.",
    );
    expect(text).toMatch(/Vendor A|Vendor B|Vendor C/i);
    expect(text).not.toMatch(/Airline Operations Support|IROPS|airport operations/i);
  });

  it("blocks pricing comparability when governed TCO or pricing basis is missing", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "client-a-test-event",
      code: "CLIENT-A-LAKE-AMS-OUTSOURCING-2026",
      name: "Client A AMS Outsourcing RFP",
      accountName: "Client A",
    });
    if (!profileSet) throw new Error("expected test profile set");
    const profileWithMissingPricing = {
      ...profileSet.profiles[0],
      pricingSummary: {
        ...profileSet.profiles[0].pricingSummary,
        fiveYearTcoUsd: null,
        pricingBasis: "",
      },
    };

    const view = buildEvaluationBafoReadinessView({
      profileSet: {
        ...profileSet,
        profiles: [profileWithMissingPricing],
      },
    });

    expect(view.pricing).toEqual([
      expect.objectContaining({
        vendorName: profileWithMissingPricing.vendorName,
        comparability: "blocked",
        fiveYearTcoLabel: "Not recorded",
        pricingBasis: "Not recorded",
        rationale: expect.stringContaining("five-year TCO"),
      }),
    ]);
    expect(view.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Pricing comparison blocked",
          nextAction: expect.stringContaining("normalized pricing workbook"),
        }),
      ]),
    );
    expect(view.state).toBe("blocked");
  });

  it("does not claim optional pricing fields were validated when they are absent", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "client-a-test-event",
      code: "CLIENT-A-LAKE-AMS-OUTSOURCING-2026",
      name: "Client A AMS Outsourcing RFP",
      accountName: "Client A",
    });
    if (!profileSet) throw new Error("expected test profile set");
    const profile = {
      ...profileSet.profiles[0],
      pricingSummary: {
        ...profileSet.profiles[0].pricingSummary,
        transitionCostUsd: null,
        oneTimeCostUsd: null,
        optionalCostUsd: null,
        pricingBasis: "Complete workbook",
      },
    };

    const view = buildEvaluationBafoReadinessView({
      profileSet: { ...profileSet, profiles: [profile] },
    });

    expect(view.pricing).toEqual([
      expect.objectContaining({
        comparability: "comparable",
        transitionCostLabel: "Not recorded",
        oneTimeCostLabel: "Not recorded",
        optionalCostLabel: "Not recorded",
        rationale:
          "Five-year TCO, year-one run cost, and pricing basis are present for comparison.",
      }),
    ]);
  });
});
