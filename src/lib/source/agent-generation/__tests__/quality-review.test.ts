import {
  buildMalformedSourceConsultingGradeReview,
  buildSourceConsultingGradeCompactRetryPrompt,
  buildSourceQualityGateMetadata,
  buildSourceQualitySourceContext,
  requiresSourceConsultingGradeGate,
} from "../quality-review";
import type { SourceGenerationContext } from "../types";
import { CONSULTING_GRADE_DIMENSIONS } from "@/lib/deliverables/quality/consulting-grade-rubric";

function makeContext(): SourceGenerationContext {
  return {
    tenantKey: "skyharbor",
    tenantName: "SkyHarbor Air",
    event: {
      id: "event-1",
      code: "GLOBAL_NETWORK_AIRLINE-IROPS-2026",
      name: "IT Outsourcing E2E",
      archetype: "it-outsourcing",
      rigor: "enhanced",
      currentStageKey: "rfp",
      statusLabel: "RFP",
      owner: "cover-name-only",
      triggerDescription: "Board mandate",
      scopeDescription: "Full IT outsourcing event",
      estimatedValueUsd: 300_000_000,
    },
    artifactStates: [],
    gateCriteria: [
      {
        id: "gate-1",
        sourceEventId: "event-1",
        tenantKey: "skyharbor",
        criterionId: "rfp-package-complete",
        fromStage: "rfp",
        toStage: "responses",
        state: "pending",
        reviewerUserId: null,
        reviewedAt: null,
        notes: "Must pass partner-grade review.",
        evidenceArtifactIds: [],
        waiverApprovalId: null,
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      },
    ],
    evidence: [
      {
        id: "evidence-1",
        sourceEventId: "event-1",
        tenantKey: "skyharbor",
        requirementId: "dc-infra-inventory",
        stage: "scope",
        currentState: "Usable Evidence",
        sourceArtifactId: "artifact-1",
        notes: "Data center and private cloud footprint loaded.",
        lastSyncedAt: "2026-06-12T00:00:00.000Z",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      },
      {
        id: "evidence-2",
        sourceEventId: "event-1",
        tenantKey: "skyharbor",
        requirementId: "EVID-SRC-EVAL-WEIGHT-RATIONALE",
        stage: "rfp",
        currentState: "Not Requested",
        sourceArtifactId: null,
        notes: "Scaffold state is stale when the approved weights upload is present.",
        lastSyncedAt: "2026-06-12T00:00:00.000Z",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      },
    ],
    uploadedEvidence: [
      {
        id: "artifact-1",
        originalName: "11_Data_Center_Infrastructure_Inventory.csv",
        artifactFamily: "other",
        sourceFormat: "csv",
        parseStatus: "parsed",
        evidenceState: "parsed_uncited",
        stageKey: "scope",
        chunkExcerpts: ["7 data centers with VMware Cloud Foundation footprint."],
        factSummaries: ["artifact_summary: {\"chunk_count\":1}"],
      },
      {
        id: "artifact-2",
        originalName: "09_Evaluation_Criteria_Weights_APPROVED.csv",
        artifactFamily: "other",
        sourceFormat: "csv",
        parseStatus: "parsed",
        evidenceState: "parsed_uncited",
        stageKey: "rfp",
        chunkExcerpts: ["Technical 35%, commercial 30%, transition 20%, governance 15%."],
        factSummaries: ["artifact_summary: {\"chunk_count\":1}"],
      },
    ],
  };
}

describe("Source consulting-grade quality gate helpers", () => {
  const originalExpandedFlag = process.env.SOURCE_QUALITY_GATE_EXPANDED;

  afterEach(() => {
    if (originalExpandedFlag === undefined) {
      delete process.env.SOURCE_QUALITY_GATE_EXPANDED;
    } else {
      process.env.SOURCE_QUALITY_GATE_EXPANDED = originalExpandedFlag;
    }
  });

  it("always requires Gate B for the RFP package", () => {
    delete process.env.SOURCE_QUALITY_GATE_EXPANDED;
    expect(requiresSourceConsultingGradeGate("d09_rfp_pack")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d01_strategy_memo")).toBe(false);
  });

  it("gates the expanded high-stakes narrative codes only when the flag is on", () => {
    delete process.env.SOURCE_QUALITY_GATE_EXPANDED;
    expect(requiresSourceConsultingGradeGate("d01_strategy_memo")).toBe(false);
    expect(requiresSourceConsultingGradeGate("d05_scope_memo")).toBe(false);
    expect(requiresSourceConsultingGradeGate("d24_decision_brief")).toBe(false);
    expect(requiresSourceConsultingGradeGate("d27_selection_memo")).toBe(false);

    process.env.SOURCE_QUALITY_GATE_EXPANDED = "1";
    expect(requiresSourceConsultingGradeGate("d01_strategy_memo")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d05_scope_memo")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d24_decision_brief")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d27_selection_memo")).toBe(true);
    // Untouched artifact types stay ungated even with the flag on.
    expect(requiresSourceConsultingGradeGate("d04_app_inv")).toBe(false);
  });

  it("summarizes evidence, upstream bodies, and gate states for the reviewer", () => {
    const context = buildSourceQualitySourceContext({
      ctx: makeContext(),
      upstreamBound: {
        d01_strategy_memo: "Strategy memo with $300M baseline.",
      },
      artifactCode: "d09_rfp_pack",
    });

    expect(context).toContain("SkyHarbor Air");
    expect(context).toContain("Estimated value: $300,000,000");
    expect(context).toContain("dc-infra-inventory");
    expect(context).toContain("11_Data_Center_Infrastructure_Inventory.csv");
    expect(context).toContain("D09 RFP evidence coverage semantics");
    expect(context).toContain("Exhibit 09 — Approved evaluation criteria");
    expect(context).toContain("satisfies=EVID-SRC-EVAL-WEIGHT-RATIONALE");
    expect(context).toContain(
      "Available parsed evidence — citation review pending (normalized from uploaded D09 coverage map)",
    );
    expect(context).not.toContain("EVID-SRC-EVAL-WEIGHT-RATIONALE; state=Not Requested");
    expect(context).toContain(
      "Blocking gaps are only items still missing after this coverage map",
    );
    expect(context).toContain("rfp-package-complete");
    expect(context).toContain("Artifact-specific requirements (from source-artifact-profiles.ts)");
    expect(context).toContain("Decision purpose:");
  });

  it("does not leak D09 RFP evidence-coverage language into other artifact codes", () => {
    const context = buildSourceQualitySourceContext({
      ctx: makeContext(),
      upstreamBound: {},
      artifactCode: "d01_strategy_memo",
    });

    expect(context).not.toContain("D09 RFP evidence coverage semantics");
    expect(context).not.toContain("normalized from uploaded D09 coverage map");
    // Stale scaffold rows are reported as-is when the D09 override doesn't apply.
    expect(context).toContain("EVID-SRC-EVAL-WEIGHT-RATIONALE; state=Not Requested");
    // Profile-derived context still shows up for a recognized short code.
    expect(context).toContain("Approve the sourcing event and authorize scope and RFP preparation work.");
  });

  it("falls back gracefully for an unregistered artifact code", () => {
    const context = buildSourceQualitySourceContext({
      ctx: makeContext(),
      upstreamBound: {},
      artifactCode: "dz99_unregistered",
    });

    expect(context).toContain("No registered profile for this artifact code.");
  });

  it("marks the quality gate failed when any review dimension is below threshold", () => {
    const gate = buildSourceQualityGateMetadata({
      rewriteAttempted: true,
      reviews: [
        {
          standardId: "partner-grade-consulting-deliverable-v1",
          minRequiredScore: 8,
          artifactCode: "d09_rfp_pack",
          artifactName: "RFP Package",
          pass: false,
          overallScore: 7,
          dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
            id: dimension.id,
            score: dimension.id === "evidence_grounding" ? 7 : 8,
            rationale: "Needs stronger support.",
            requiredFixes: ["Bind source evidence."],
          })),
          unsupportedClaims: ["Uncited scale claim."],
          missingEvidence: [],
          rewriteGuidance: ["Add evidence table."],
        },
      ],
    });

    expect(gate.passed).toBe(false);
    expect(gate.finalSummary).toContain("evidence_grounding");
  });

  it("keeps compact reviewer retries source-aware and dimension-complete", () => {
    const context = buildSourceQualitySourceContext({
      ctx: makeContext(),
      upstreamBound: {
        d01_strategy_memo: "Strategy memo with $300M baseline.",
      },
      artifactCode: "d09_rfp_pack",
    });
    const prompt = buildSourceConsultingGradeCompactRetryPrompt({
      artifactCode: "d09_rfp_pack",
      artifactName: "RFP Package",
      bodyMarkdown: "# RFP Package\n\n## Source register\n\nEvidence-backed body.",
      sourceContext: context,
      previousError: "Quality review is missing dimensionScores array.",
    });

    expect(prompt).toContain("SkyHarbor Air");
    expect(prompt).toContain("d09_rfp_pack");
    for (const dimension of CONSULTING_GRADE_DIMENSIONS) {
      expect(prompt).toContain(dimension.id);
    }
  });

  it("records malformed reviewer output as a failed Gate B review", () => {
    const gate = buildSourceQualityGateMetadata({
      rewriteAttempted: false,
      reviews: [
        buildMalformedSourceConsultingGradeReview({
          artifactCode: "d09_rfp_pack",
          artifactName: "RFP Package",
          reason: "missing dimensionScores",
        }),
      ],
    });

    expect(gate.passed).toBe(false);
    expect(gate.finalSummary).toContain("Failed");
    expect(gate.reviews[0]?.dimensionScores).toHaveLength(
      CONSULTING_GRADE_DIMENSIONS.length,
    );
  });
});
