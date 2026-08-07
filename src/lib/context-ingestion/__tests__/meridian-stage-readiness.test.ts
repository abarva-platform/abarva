import type { MeridianPhase0Manifest } from "../meridian-phase0-manifest";
import { MERIDIAN_PHASE0_TEMPLATE_DEFINITIONS } from "../meridian-phase0-templates";
import { evaluateMeridianStageReadiness } from "../meridian-stage-readiness";

function chunksForEveryMeridianTemplate() {
  return MERIDIAN_PHASE0_TEMPLATE_DEFINITIONS.map((template) => ({
    chunkMetadata: { template_id: template.id },
    provenance: { template_id: template.id },
  }));
}

function validManifest(): MeridianPhase0Manifest {
  return {
    manifestId: "meridian-phase0-001",
    tenantKey: "meridian-health",
    clientName: "Meridian Health",
    generatedAt: "2026-06-05T12:00:00.000Z",
    evidenceItems: [
      {
        citationKey: "Meridian-STARS-2026",
        title: "Stars baseline",
        sourceType: "public",
        owner: "Data steward",
        evidenceDate: "2026-06-05",
        sensitivity: "public",
        confidence: "high",
        summary: "CMS Stars baseline for the Meridian strategy demo.",
        usableBySurface: ["moves", "admin"],
      },
    ],
    uploadedArtifacts: [
      {
        artifactId: "artifact-stars-baseline",
        displayName: "Stars baseline extract",
        artifactType: "market_research",
        phase: "0",
        owner: "Program steward",
        storagePath: "azure://context/meridian/stars.csv",
        parseStatus: "parsed",
        approvalStatus: "approved",
        sensitivity: "public",
        sourceEvidenceIds: ["Meridian-STARS-2026"],
      },
    ],
    workloadRecords: [
      {
        workloadId: "wrk-epic-analytics",
        workloadName: "Epic analytics mart",
        domain: "clinical_analytics",
        currentPlatform: "Epic Clarity",
        dataSources: ["Epic Clarity"],
        phiLevel: "high",
        owner: "CDAO",
        businessCriticality: "tier_1",
        modernizationDisposition: "replatform",
        effortSize: "large",
        risk: "medium",
      },
    ],
    rateCardRows: [
      {
        rateCardId: "rate-data-engineer",
        role: "Data engineer",
        internalOrExternal: "internal",
        location: "US",
        hourlyRateUsd: 125,
        utilizationAssumption: 0.8,
        source: "approved Meridian setup rate card",
        effectiveDate: "2026-06-05",
      },
    ],
    gateCriteria: [
      {
        gateId: "gate-setup-evidence",
        phase: "0",
        criterion: "Evidence register loaded and cited.",
        blockerLevel: "P0",
        requiredEvidence: ["Meridian-STARS-2026"],
        owner: "Program steward",
        status: "met",
        waiverAllowed: false,
      },
    ],
    approvalRecords: [
      {
        approvalId: "approval-stars-baseline",
        artifactId: "artifact-stars-baseline",
        approverName: "Anita Krishnamurthy",
        role: "CDIO",
        decision: "approved",
        note: "Approved for synthetic Meridian strategy demo use.",
        timestamp: "2026-06-05T12:30:00.000Z",
        conditions: ["No PHI in demo artifacts"],
      },
    ],
  };
}

describe("Meridian stage readiness", () => {
  it("does not treat parsed Meridian templates as stage-ready without ledger evidence and manifest validation", () => {
    const readiness = evaluateMeridianStageReadiness({
      contextChunks: chunksForEveryMeridianTemplate(),
      evidenceRows: [],
    });

    expect(readiness.loaderCoverageComplete).toBe(true);
    expect(readiness.readyForStageAdvance).toBe(false);
    expect(readiness.blockers).toEqual([
      "No Meridian evidence-register rows have been appended to the evidence ledger.",
      "No validated Meridian Phase 0 manifest is available.",
    ]);
  });

  it("marks Meridian stage advance ready only when templates, ledger rows, and manifest validation all pass", () => {
    const readiness = evaluateMeridianStageReadiness({
      contextChunks: chunksForEveryMeridianTemplate(),
      evidenceRows: [
        {
          artifactRef: "Meridian-STARS-2026",
          sourceRef: { template_id: "meridian-evidence-register" },
        },
      ],
      manifest: validManifest(),
    });

    expect(readiness.missingTemplateIds).toEqual([]);
    expect(readiness.evidenceLedgerRows).toBe(1);
    expect(readiness.manifestValidation?.readyForStageAdvance).toBe(true);
    expect(readiness.readyForStageAdvance).toBe(true);
    expect(readiness.blockers).toEqual([]);
  });
});
