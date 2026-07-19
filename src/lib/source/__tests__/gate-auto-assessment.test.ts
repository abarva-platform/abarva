import {
  mappedEvidenceCriterionIds,
  validateEvidenceGateMap,
} from "@/lib/source/canonical-specs";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";
import {
  AUTO_EVIDENCE_REVIEWER_ID,
  assessStageGate,
  buildStageRecommendation,
} from "@/lib/source/gate-auto-assessment";

function criterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: "criterion-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor-air",
    criterionId: "GATE-SCOPE-01",
    fromStage: "scope",
    toStage: "rfp",
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z",
    ...overrides,
  };
}

function evidence(
  overrides: Partial<SourceEventEvidence> = {},
): SourceEventEvidence {
  return {
    id: "evidence-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor-air",
    requirementId: "EVID-SRC-SCOPE-APP-INV",
    stage: "scope",
    currentState: "Usable Evidence",
    sourceArtifactId: "artifact-1",
    notes: null,
    lastSyncedAt: "2026-06-15T00:00:00.000Z",
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z",
    ...overrides,
  };
}

function artifact(
  overrides: Partial<SourceEventArtifactState> = {},
): SourceEventArtifactState {
  return {
    id: "artifact-state-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor-air",
    artifactCode: "d04_app_inv",
    stage: "scope",
    family: "scope_document",
    tier: "rich",
    status: "approved",
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body: "Human-reviewed artifact body.",
    bodyFormat: "markdown",
    bodyAuthoredBy: "user-1",
    bodyUpdatedAt: "2026-06-15T00:00:00.000Z",
    bodyGenerationMetadata: null,
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z",
    ...overrides,
  };
}

function scopeEvidence(
  currentState: SourceEventEvidence["currentState"],
  sourceArtifactId: string | null,
): SourceEventEvidence[] {
  return [
    evidence({
      id: "evidence-app-inv",
      requirementId: "EVID-SRC-SCOPE-APP-INV",
      currentState,
      sourceArtifactId,
    }),
    evidence({
      id: "evidence-org",
      requirementId: "EVID-SRC-SCOPE-ORG",
      currentState,
      sourceArtifactId,
    }),
    evidence({
      id: "evidence-ticket-history",
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      currentState,
      sourceArtifactId,
    }),
    evidence({
      id: "evidence-fy-contract",
      requirementId: "EVID-SRC-SCOPE-FY-CONTRACT",
      currentState,
      sourceArtifactId,
    }),
  ];
}

function scopeEvidenceAtMinimum(
  sourceArtifactId: string | null,
): SourceEventEvidence[] {
  return [
    evidence({
      id: "evidence-app-inv",
      requirementId: "EVID-SRC-SCOPE-APP-INV",
      currentState: "Usable Evidence",
      sourceArtifactId,
    }),
    evidence({
      id: "evidence-org",
      requirementId: "EVID-SRC-SCOPE-ORG",
      currentState: "Available",
      sourceArtifactId,
    }),
    evidence({
      id: "evidence-ticket-history",
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      currentState: "Available",
      sourceArtifactId,
    }),
    evidence({
      id: "evidence-fy-contract",
      requirementId: "EVID-SRC-SCOPE-FY-CONTRACT",
      currentState: "Available",
      sourceArtifactId,
    }),
  ];
}

describe("Source gate auto assessment", () => {
  it("marks a pending criterion met when required evidence is at threshold", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion()],
      artifacts: [artifact()],
      evidence: scopeEvidenceAtMinimum("source-artifact-1"),
    });

    expect(assessment.criteria[0]).toMatchObject({
      criterionId: "GATE-SCOPE-01",
      displayState: "met_auto_evidence",
      provenance: "auto-evidence",
      reason: "Auto-assessed from evidence",
    });
    expect(assessment.criteria[0]?.evidence[0]).toMatchObject({
      requirementId: "EVID-SRC-SCOPE-APP-INV",
      currentState: "Usable Evidence",
      satisfied: true,
    });
  });

  it("blocks a criterion when required evidence is below threshold", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion()],
      artifacts: [artifact()],
      evidence: [evidence({ currentState: "Parsed" })],
    });

    expect(assessment.criteria[0]).toMatchObject({
      displayState: "blocked_evidence",
      provenance: "auto-evidence",
    });
    expect(assessment.criteria[0]?.reason).toContain("must be at least");
  });

  it("does not satisfy stale or low-confidence evidence", () => {
    for (const currentState of ["Stale", "Low Confidence"] as const) {
      const assessment = assessStageGate({
        fromStage: "scope",
        criteria: [criterion()],
        artifacts: [artifact()],
        evidence: [evidence({ currentState })],
      });

      expect(assessment.criteria[0]).toMatchObject({
        displayState: "blocked_evidence",
      });
      expect(assessment.criteria[0]?.reason).toContain(currentState);
    }
  });

  it("keeps a human not-met decision even when evidence is ready", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion({ state: "not_met" })],
      artifacts: [],
      evidence: [evidence()],
    });

    expect(assessment.criteria[0]).toMatchObject({
      displayState: "not_met_manual",
      provenance: "manual",
      reason: "Manual override",
    });
  });

  it("renders a persisted system evidence assessment as auto-assessed after reload", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [
        criterion({
          state: "met",
          reviewerUserId: AUTO_EVIDENCE_REVIEWER_ID,
          notes: "Auto-met from evidence: EVID-SRC-SCOPE-APP-INV",
          evidenceArtifactIds: ["artifact-1"],
        }),
      ],
      artifacts: [artifact()],
      evidence: scopeEvidenceAtMinimum("source-artifact-1"),
    });

    expect(assessment.criteria[0]).toMatchObject({
      displayState: "met_auto_evidence",
      provenance: "auto-evidence",
      reason: "Auto-met from evidence: EVID-SRC-SCOPE-APP-INV",
    });
    expect(assessment.criteria[0]?.evidence[0]).toMatchObject({
      requirementId: "EVID-SRC-SCOPE-APP-INV",
      sourceArtifactId: "source-artifact-1",
    });
  });

  it("keeps unmapped criteria in human review instead of auto-meeting them", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion({ criterionId: "GATE-SCOPE-03" })],
      artifacts: [],
      evidence: [evidence()],
    });

    expect(assessment.criteria[0]).toMatchObject({
      displayState: "pending_review",
      provenance: "none",
      reason: "Needs human review",
    });
  });

  it("blocks hard mapped criteria when sufficient-rank evidence is client-stated only", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion({ criterionId: "GATE-SCOPE-04" })],
      artifacts: [artifact({ artifactCode: "d05_scope_memo" })],
      evidence: scopeEvidenceAtMinimum(null),
    });

    expect(assessment.criteria[0]).toMatchObject({
      criterionId: "GATE-SCOPE-04",
      displayState: "blocked_evidence",
      provenance: "auto-evidence",
    });
    expect(assessment.criteria[0]?.reason).toContain("client-stated answer");
  });

  it("auto-meets hard mapped criteria when sufficient evidence is fact-backed", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion({ criterionId: "EVID-SCOPE-01" })],
      artifacts: [
        artifact({
          artifactCode: "d07_ticket_synth",
          status: "approved",
          body: "Human-reviewed ticket synthesis.",
        }),
      ],
      evidence: scopeEvidenceAtMinimum("source-artifact-1").map((row) =>
        row.requirementId === "EVID-SRC-SCOPE-TICKET-HISTORY"
          ? evidence({
              ...row,
              requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
              currentState: "Available",
              sourceArtifactId: null,
              sourceEventFactIds: ["fact-ticket-history"],
            })
          : row,
      ),
    });

    expect(assessment.criteria[0]).toMatchObject({
      criterionId: "EVID-SCOPE-01",
      displayState: "met_auto_evidence",
      provenance: "auto-evidence",
      reason: "Auto-assessed from evidence",
    });
    expect(assessment.criteria[0]?.evidence[0]).toMatchObject({
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      sourceArtifactId: null,
      sourceEventFactIds: ["fact-ticket-history"],
    });
  });

  it("does not inflate fact-backed Available evidence into Usable Evidence", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion({ criterionId: "GATE-SCOPE-01" })],
      artifacts: [artifact()],
      evidence: [
        evidence({
          requirementId: "EVID-SRC-SCOPE-APP-INV",
          currentState: "Available",
          sourceArtifactId: null,
          sourceEventFactIds: ["fact-app-inventory"],
        }),
      ],
    });

    expect(assessment.criteria[0]).toMatchObject({
      criterionId: "GATE-SCOPE-01",
      displayState: "blocked_evidence",
      provenance: "auto-evidence",
    });
    expect(assessment.criteria[0]?.reason).toContain("must be at least");
  });

  it("auto-meets hard mapped criteria when client-stated evidence is explicitly usable", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion({ criterionId: "GATE-SCOPE-04" })],
      artifacts: [artifact({ artifactCode: "d05_scope_memo" })],
      evidence: scopeEvidence("Usable Evidence", null),
    });

    expect(assessment.criteria[0]).toMatchObject({
      criterionId: "GATE-SCOPE-04",
      displayState: "met_auto_evidence",
      provenance: "auto-evidence",
      reason: "Auto-assessed from evidence",
    });
  });

  it("auto-meets hard mapped criteria when qualifying uploaded evidence is present", () => {
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: [criterion({ criterionId: "GATE-SCOPE-04" })],
      artifacts: [artifact({ artifactCode: "d05_scope_memo" })],
      evidence: scopeEvidenceAtMinimum("source-artifact-1"),
    });

    expect(assessment.criteria[0]).toMatchObject({
      criterionId: "GATE-SCOPE-04",
      displayState: "met_auto_evidence",
      provenance: "auto-evidence",
      reason: "Auto-assessed from evidence",
    });
  });

  it("builds blocked, ready, and ready-with-warnings recommendations", () => {
    const blocked = buildStageRecommendation(
      assessStageGate({
        fromStage: "scope",
        criteria: [criterion()],
        artifacts: [artifact()],
        evidence: [evidence({ currentState: "Parsed" })],
      }),
    );
    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers[0]?.criterionId).toBe("GATE-SCOPE-01");

    const ready = buildStageRecommendation(
      assessStageGate({
        fromStage: "scope",
        criteria: [criterion({ state: "met" })],
        artifacts: [],
        evidence: [],
      }),
    );
    expect(ready.status).toBe("ready");

    const warnings = buildStageRecommendation(
      assessStageGate({
        fromStage: "evaluation",
        criteria: [
          criterion({
            criterionId: "GATE-EVAL-01",
            fromStage: "evaluation",
            toStage: "pricing",
            state: "met",
          }),
          criterion({
            criterionId: "GATE-EVAL-03",
            fromStage: "evaluation",
            toStage: "pricing",
          }),
        ],
        artifacts: [],
        evidence: [],
      }),
    );
    expect(warnings.status).toBe("ready_with_warnings");
    expect(warnings.reasonCodes).toContain("SOFT_CRITERIA_OPEN");
  });

  it("keeps the evidence-gate map pointed at real catalog IDs", () => {
    expect(mappedEvidenceCriterionIds().length).toBeGreaterThanOrEqual(2);
    expect(validateEvidenceGateMap()).toEqual({
      danglingCriterionIds: [],
      danglingRequirementIds: [],
    });
  });
});
