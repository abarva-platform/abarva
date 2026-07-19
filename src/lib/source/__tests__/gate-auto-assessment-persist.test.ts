import type { SourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";
import { AUTO_EVIDENCE_REVIEWER_ID } from "@/lib/source/gate-auto-assessment";
import { persistAutoAssessment } from "@/lib/source/gate-auto-assessment-persist";

function criterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: "criterion-row-1",
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
    id: "evidence-row-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor-air",
    requirementId: "EVID-SRC-SCOPE-APP-INV",
    stage: "scope",
    currentState: "Usable Evidence",
    sourceArtifactId: "source-artifact-1",
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

function fakeAdapter(
  updateResult: Awaited<
    ReturnType<SourceWriteAdapter["updateGateCriterion"]>
  > = { ok: true, data: { id: "criterion-row-1" } },
): {
  adapter: SourceWriteAdapter;
  updates: Parameters<SourceWriteAdapter["updateGateCriterion"]>[0][];
  logs: Parameters<SourceWriteAdapter["insertActivityLog"]>[0][];
} {
  const updates: Parameters<SourceWriteAdapter["updateGateCriterion"]>[0][] =
    [];
  const logs: Parameters<SourceWriteAdapter["insertActivityLog"]>[0][] = [];
  const adapter: SourceWriteAdapter = {
    name: "azure-postgres",
    insertParticipant: jest.fn(),
    applyApproval: jest.fn(),
    insertCriterionApproval: jest.fn(),
    updateStage: jest.fn(),
    transitionLifecycle: jest.fn(),
    updateGateCriterion: jest.fn(async (input) => {
      updates.push(input);
      return updateResult;
    }),
    updateArtifactBody: jest.fn(),
    updateArtifactStatus: jest.fn(),
    linkAttachments: jest.fn(),
    insertActivityLog: jest.fn(async (input) => {
      logs.push(input);
      return { ok: true };
    }),
  };
  return { adapter, updates, logs };
}

describe("persistAutoAssessment", () => {
  it("writes a pending auto-met criterion with system provenance and evidence ids", async () => {
    const { adapter, updates, logs } = fakeAdapter();
    const result = await persistAutoAssessment(
      {
        eventId: "event-1",
        clientKey: "skyharbor-air",
        fromStage: "scope",
        criteria: [criterion()],
        artifacts: [artifact()],
        evidence: scopeEvidenceAtMinimum("source-artifact-1"),
      },
      {
        writeAdapter: adapter,
        now: () => "2026-06-15T12:00:00.000Z",
      },
    );

    expect(result).toEqual({
      written: ["GATE-SCOPE-01"],
      skipped: [],
      failed: [],
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      criterionRowId: "criterion-row-1",
      state: "met",
      reviewerUserId: AUTO_EVIDENCE_REVIEWER_ID,
      reviewedAtIso: "2026-06-15T12:00:00.000Z",
      evidenceArtifactIds: ["source-artifact-1"],
    });
    expect(updates[0]?.notes).toContain("EVID-SRC-SCOPE-APP-INV");
    expect(logs[0]).toMatchObject({
      actionType: "gate_criterion_auto_assessed",
      criterionId: "GATE-SCOPE-01",
      actorDisplayName: "AbarVa auto evidence assessment",
    });
  });

  it("does not write a pending hard criterion met from client-stated-only evidence", async () => {
    const { adapter, updates, logs } = fakeAdapter();
    const result = await persistAutoAssessment(
      {
        eventId: "event-1",
        clientKey: "skyharbor-air",
        fromStage: "scope",
        criteria: [criterion({ criterionId: "GATE-SCOPE-04" })],
        artifacts: [artifact({ artifactCode: "d05_scope_memo" })],
        evidence: scopeEvidenceAtMinimum(null),
      },
      { writeAdapter: adapter },
    );

    expect(result).toEqual({
      written: [],
      skipped: ["GATE-SCOPE-04"],
      failed: [],
    });
    expect(updates).toHaveLength(0);
    expect(logs).toHaveLength(0);
  });

  it("persists fact ids for auto-met fact-backed criteria", async () => {
    const { adapter, updates } = fakeAdapter();
    const result = await persistAutoAssessment(
      {
        eventId: "event-1",
        clientKey: "skyharbor-air",
        fromStage: "scope",
        criteria: [criterion({ criterionId: "EVID-SCOPE-01" })],
        artifacts: [
          artifact({
            artifactCode: "d07_ticket_synth",
            body: "Human-reviewed ticket synthesis.",
          }),
        ],
        evidence: scopeEvidenceAtMinimum("source-artifact-1").map((row) =>
          row.requirementId === "EVID-SRC-SCOPE-TICKET-HISTORY"
            ? evidence({
                ...row,
                id: "fact-derived:event-1:EVID-SRC-SCOPE-TICKET-HISTORY",
                requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
                currentState: "Available",
                sourceArtifactId: null,
                sourceEventFactIds: ["fact-ticket-history"],
              })
            : row,
        ),
      },
      { writeAdapter: adapter },
    );

    expect(result.written).toEqual(["EVID-SCOPE-01"]);
    expect(updates[0]?.evidenceArtifactIds).toEqual(["fact-ticket-history"]);
  });

  it("does not override a persisted human not-met decision", async () => {
    const { adapter, updates } = fakeAdapter();
    const result = await persistAutoAssessment(
      {
        eventId: "event-1",
        clientKey: "skyharbor-air",
        fromStage: "scope",
        criteria: [criterion({ state: "not_met" })],
        artifacts: [artifact()],
        evidence: [evidence()],
      },
      { writeAdapter: adapter },
    );

    expect(result.written).toEqual([]);
    expect(result.skipped).toEqual(["GATE-SCOPE-01"]);
    expect(updates).toHaveLength(0);
  });

  it("is idempotent once the criterion is already met", async () => {
    const { adapter, updates } = fakeAdapter();
    const result = await persistAutoAssessment(
      {
        eventId: "event-1",
        clientKey: "skyharbor-air",
        fromStage: "scope",
        criteria: [
          criterion({
            state: "met",
            reviewerUserId: AUTO_EVIDENCE_REVIEWER_ID,
          }),
        ],
        artifacts: [artifact()],
        evidence: [evidence()],
      },
      { writeAdapter: adapter },
    );

    expect(result.written).toEqual([]);
    expect(result.skipped).toEqual(["GATE-SCOPE-01"]);
    expect(updates).toHaveLength(0);
  });

  it("records adapter failures without throwing", async () => {
    const { adapter } = fakeAdapter({ ok: false, error: "write failed" });
    await expect(
      persistAutoAssessment(
        {
          eventId: "event-1",
          clientKey: "skyharbor-air",
          fromStage: "scope",
          criteria: [criterion()],
          artifacts: [artifact()],
          evidence: scopeEvidenceAtMinimum("source-artifact-1"),
        },
        { writeAdapter: adapter },
      ),
    ).resolves.toEqual({
      written: [],
      skipped: [],
      failed: ["GATE-SCOPE-01"],
    });
  });
});
