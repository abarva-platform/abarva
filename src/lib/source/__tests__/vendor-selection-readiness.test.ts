import {
  buildSourceVendorSelectionReadiness,
  formatSourceVendorSelectionReadinessAsMarkdown,
  getSourceVendorSelectionBlockers,
  getSourceVendorSelectionNextActions,
  summarizeSourceVendorSelectionReadiness,
} from "../vendor-selection-readiness";
import type { SourceCommercialSignals } from "../commercial-signal-types";
import type { SourceExecutiveDecisionSummary } from "../executive-decision-types";
import type { SourceArtifactStatusStripSeedItem } from "../mock-seed";
import type { SourceStageGateReadiness } from "../source-stage-gate-types";

const generatedAt = "2026-08-10T12:00:00.000Z";

function commercialSignals(
  overrides: Partial<SourceCommercialSignals> = {},
): SourceCommercialSignals {
  return {
    eventId: "event-1",
    generatedAt,
    pricingSignals: {
      status: "comparable",
      readinessScore: 92,
      comparableVendors: 3,
      notComparableVendors: 0,
      topTraps: [],
      blockers: [],
      narrative: "Pricing inputs are comparable.",
    },
    bafoSignals: {
      overallReadiness: "ready",
      vendorReadyCount: 3,
      vendorConditionalCount: 0,
      vendorBlockedCount: 0,
      priorities: [],
      blockers: [],
      nextAction: "Proceed to review.",
    },
    riskSignals: {
      overallRiskLevel: "low",
      totalCount: 0,
      criticalCount: 0,
      highCount: 0,
      openExceptionTitles: [],
    },
    vendorTradeoffs: [],
    commercialReadiness: "ready",
    executiveImplications: {
      nexusGuidance: "Proceed with explicit residual assumptions.",
      atlasExecutiveImplication: "Ready for steering review.",
      sentinelEvidenceNotes: [],
      stewardGateNotes: [],
    },
    blockers: [],
    recommendedNextAction: "Proceed to review.",
    sourceModulesUsed: ["pricing-normalization"],
    ...overrides,
  };
}

function executiveSummary(
  overrides: Partial<SourceExecutiveDecisionSummary> = {},
): SourceExecutiveDecisionSummary {
  return {
    eventId: "event-1",
    generatedAt,
    decisionNeeded: "Confirm selection-review posture.",
    decisionPosture: "ready_for_selection_review",
    recommendedDecisionPosture: "ready_for_selection_review",
    viableVendors: ["Vendor A"],
    vendorTradeoffs: [
      {
        vendorId: "vendor-a",
        vendorName: "Vendor A",
        viability: "viable",
        valuePotential: "Best overall posture.",
        costPosition: "Competitive",
        pricingRank: 1,
        pricingStatus: "comparable",
        bafoReadiness: "ready",
        commercialRisk: "low",
        transitionRisk: "medium",
        evidenceConfidence: "high",
        blockers: [],
        unresolvedAssumptions: [],
      },
      {
        vendorId: "vendor-b",
        vendorName: "Vendor B",
        viability: "conditional",
        valuePotential: "Needs clarification.",
        costPosition: "Higher transition risk",
        pricingRank: 2,
        pricingStatus: "partially_comparable",
        bafoReadiness: "conditional",
        commercialRisk: "medium",
        transitionRisk: "medium",
        evidenceConfidence: "medium",
        blockers: ["Transition plan requires clarification."],
        unresolvedAssumptions: ["Transition staffing baseline unresolved."],
      },
    ],
    valueAtStake: {
      amountUsd: 12_000_000,
      note: "Planning value only.",
    },
    commercialRisk: "low",
    transitionRisk: "medium",
    evidenceConfidence: "high",
    unresolvedAssumptions: [],
    blockers: [],
    decisionOptions: ["Select Vendor A", "Defer for clarification"],
    recommendedNextAction: "Hold selection review.",
    nexusRecommendation: "Proceed with a structured selection review.",
    sentinelCautions: [],
    stewardGateNotes: [],
    atlasExecutiveBrief: "Ready for steering review.",
    sourceModulesUsed: ["executive-decision-summary"],
    missionSummary: {
      total: 0,
      critical: 0,
      high: 0,
      blocked: 0,
      byPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    },
    ...overrides,
  };
}

function gateReadiness(
  overrides: Partial<SourceStageGateReadiness> = {},
): SourceStageGateReadiness {
  return {
    eventId: "event-1",
    eventName: "Selection Review Event",
    generatedAt,
    currentStageKey: "selection",
    currentStageLabel: "Selection",
    overallState: "ready",
    gates: [],
    blockers: [],
    recommendedNextAction: "Proceed to review.",
    summary: "All gates ready.",
    ...overrides,
  };
}

function approvedArtifacts(): SourceArtifactStatusStripSeedItem[] {
  return [
    {
      artifactName: "Selection Recommendation",
      status: "approved",
      ownerAgent: "Atlas",
      version: "v1.0",
      evidenceState: "seeded",
      approvalState: "approved",
    },
  ];
}

describe("buildSourceVendorSelectionReadiness", () => {
  it("blocks selection review when pricing evidence is incomplete", () => {
    const readiness = buildSourceVendorSelectionReadiness({
      event: {
        id: "event-1",
        name: "Selection Review Event",
        currentStageKey: "selection",
        currentStageLabel: "Selection",
        valueAtStakeUsd: 12_000_000,
      },
      generatedAt,
      commercialSignals: commercialSignals({
        commercialReadiness: "blocked",
        blockers: ["Pricing template missing for one finalist."],
      }),
      executiveDecisionSummary: executiveSummary({
        decisionPosture: "blocked_missing_pricing",
        blockers: ["Pricing template missing for one finalist."],
      }),
      stageGateReadiness: gateReadiness(),
      artifactStatus: approvedArtifacts(),
    });

    expect(readiness.readinessStatus).toBe("blocked_missing_pricing");
    expect(readiness.selectionReviewReady).toBe(false);
    expect(getSourceVendorSelectionBlockers(readiness)).toContain(
      "Pricing template missing for one finalist.",
    );
    expect(getSourceVendorSelectionNextActions(readiness)[0]).toBe(
      "Pricing template missing for one finalist.",
    );
  });

  it("marks readiness only when commercial, evidence, artifact, and gate inputs are clean", () => {
    const readiness = buildSourceVendorSelectionReadiness({
      event: {
        id: "event-1",
        name: "Selection Review Event",
        currentStageKey: "selection",
        currentStageLabel: "Selection",
        valueAtStakeUsd: 12_000_000,
      },
      generatedAt,
      commercialSignals: commercialSignals(),
      executiveDecisionSummary: executiveSummary(),
      stageGateReadiness: gateReadiness(),
      artifactStatus: approvedArtifacts(),
    });

    expect(readiness.readinessStatus).toBe("ready_for_selection_review");
    expect(readiness.selectionReviewReady).toBe(true);
    expect(readiness.viableVendors).toEqual(["Vendor A"]);
    expect(readiness.blockedVendors).toEqual(["Vendor B"]);
    expect(summarizeSourceVendorSelectionReadiness(readiness)).toContain(
      "Selection ready: yes",
    );
  });

  it("keeps the markdown export framed as readiness, not final award automation", () => {
    const readiness = buildSourceVendorSelectionReadiness({
      event: {
        id: "event-1",
        name: "Selection Review Event",
        currentStageKey: "selection",
        currentStageLabel: "Selection",
        valueAtStakeUsd: 12_000_000,
      },
      generatedAt,
      commercialSignals: commercialSignals(),
      executiveDecisionSummary: executiveSummary(),
      stageGateReadiness: gateReadiness(),
      artifactStatus: approvedArtifacts(),
    });

    const markdown = formatSourceVendorSelectionReadinessAsMarkdown(readiness);
    expect(markdown).toContain("Source Vendor Selection Readiness");
    expect(markdown).toContain("Selection-ready: Yes");
    expect(markdown).not.toMatch(/final award|auto[- ]?select/i);
  });
});
