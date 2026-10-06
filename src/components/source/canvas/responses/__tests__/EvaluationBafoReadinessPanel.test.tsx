import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildEvaluationBafoReadinessView,
  buildScorecardAuthorityView,
  buildStage07BafoRoundConcessionView,
  buildStage07NegotiationBriefCandidate,
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { EvaluationBafoReadinessPanel } from "../EvaluationBafoReadinessPanel";

describe("EvaluationBafoReadinessPanel", () => {
  it("renders received/comparable/blocker posture and the deterministic guardrail", () => {
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
    const scorecardAuthorityView = buildReadyScorecardAuthorityView(
      profileSet?.tenantKey ?? "tenant-a",
      profileSet?.sourceEventId ?? "event-1",
      profileSet?.profiles.map((profile) => ({
        vendorId: profile.vendorId,
        vendorName: profile.vendorName,
      })) ?? [],
    );
    const view = buildEvaluationBafoReadinessView({
      profileSet,
      challengeIntelligence: intelligence,
      bafoInstructionPack: bafoPack,
      decisionView,
      scorecardAuthorityView,
    });
    const negotiationBriefCandidate = buildStage07NegotiationBriefCandidate({
      readinessView: view,
      bafoInstructionPack: bafoPack,
      decisionView,
      scorecardAuthorityView,
      bafoRoundConcessionView: buildReadyBafoRoundConcessionView(
        profileSet?.tenantKey ?? "tenant-a",
        profileSet?.sourceEventId ?? "event-1",
        profileSet?.profiles.map((profile) => ({
          vendorId: profile.vendorId,
          vendorName: profile.vendorName,
        })) ?? [],
      ),
    });

    const html = renderToStaticMarkup(
      createElement(EvaluationBafoReadinessPanel, {
        view,
        negotiationBriefCandidate,
      }),
    );

    expect(html).toContain("Stage 07 decision support");
    expect(html).toContain("Next action");
    expect(html).toContain("Received");
    expect(html).toContain("Comparable");
    expect(html).toContain("Pricing comparability");
    expect(html).toContain("$96.4M");
    expect(html).toContain("$91.8M");
    expect(html).toContain("Normalized question rows");
    expect(html).toContain("Transition Plan");
    expect(html).toContain("Named evaluator review");
    expect(html).toContain("Named Evaluator");
    expect(html).toContain("Support-only TCO comparison");
    expect(html).toContain("shown for review only");
    expect(html).toContain("Clarification drafts");
    expect(html).toContain("draft only");
    expect(html).toContain("BAFO Round 1");
    expect(html).toContain("candidate, not dispatched");
    expect(html).toContain("Blockers and evidence gaps");
    expect(html).toContain("Negotiation brief candidate");
    expect(html).toContain("Accepted facts");
    expect(html).toContain("Proposed asks");
    expect(html).toContain("Review state: reviewed");
    expect(html).toContain("Citation: EVID-BAFO-CONCESSION");
    expect(html).toContain("Vendor A");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Vendor C");
    expect(html).toContain("Deterministic read");
    expect(html).toContain("does not select a winner");
    expect(html).toContain("does not dispatch");
    expect(html).not.toMatch(
      /award approved|guaranteed savings|industry benchmark/i,
    );
  });

  it("renders an honest empty state when no records exist", () => {
    const view = buildEvaluationBafoReadinessView({});

    const html = renderToStaticMarkup(
      createElement(EvaluationBafoReadinessPanel, { view }),
    );

    expect(html).toContain("No records");
    expect(html).toContain("No governed response profiles loaded.");
    expect(html).toContain(
      "Load normalized vendor response packages before comparing vendors.",
    );
  });

  it("renders planner refusal when scorecard evidence is absent", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "client-a-test-event",
      code: "CLIENT-A-LAKE-AMS-OUTSOURCING-2026",
      name: "Client A AMS Outsourcing RFP",
      accountName: "Client A",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(intelligence);
    const view = buildEvaluationBafoReadinessView({
      profileSet,
      challengeIntelligence: intelligence,
      bafoInstructionPack: bafoPack,
      decisionView: null,
    });
    const negotiationBriefCandidate = buildStage07NegotiationBriefCandidate({
      readinessView: view,
      bafoInstructionPack: bafoPack,
      decisionView: null,
    });

    const html = renderToStaticMarkup(
      createElement(EvaluationBafoReadinessPanel, {
        view,
        negotiationBriefCandidate,
      }),
    );

    expect(html).toContain("Negotiation brief candidate");
    expect(html).toContain("Refused");
    expect(html).toContain("No scorecard evidence rows are available");
    expect(html).not.toContain("Proposed asks");
  });
});

function buildReadyScorecardAuthorityView(
  tenantKey: string,
  sourceEventId: string,
  vendors: { vendorId: string; vendorName: string }[],
) {
  return buildScorecardAuthorityView({
    tenantKey,
    sourceEventId,
    criteria: [
      {
        tenantKey,
        sourceEventId,
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
    scores: vendors.map((vendor) => ({
      tenantKey,
      sourceEventId,
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
    })),
  });
}

function buildReadyBafoRoundConcessionView(
  tenantKey: string,
  sourceEventId: string,
  vendors: { vendorId: string; vendorName: string }[],
) {
  return buildStage07BafoRoundConcessionView({
    tenantKey,
    sourceEventId,
    rounds: vendors.map((vendor) => ({
      tenantKey,
      sourceEventId,
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
    })),
    concessions: vendors.map((vendor) => ({
      tenantKey,
      sourceEventId,
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
    })),
  });
}
