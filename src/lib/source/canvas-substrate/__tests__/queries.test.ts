import {
  getStageSubstrate,
  listArtifactStatesForEventStage,
  listEffectiveEvidenceStatesForEvent,
} from "../queries";
import type {
  SourceEventArtifactStateRow,
  SourceEventEvidenceStateRow,
  SourceEventFactRow,
  SourceEventGateCriterionStateRow,
} from "../types";

const mockAdapter = {
  listArtifactStateRows: jest.fn(),
  listArtifactStateMetadataRows: jest.fn(),
  listArtifactStateReviewRows: jest.fn(),
  listGateCriterionStateRows: jest.fn(),
  listEvidenceStateRows: jest.fn(),
  listEventFactRows: jest.fn(),
};

jest.mock(
  "@/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter",
  () => ({
    selectSourceCanvasSubstrateReadAdapter: jest.fn(() => mockAdapter),
  }),
);

describe("canvas substrate queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdapter.listArtifactStateRows.mockResolvedValue([]);
    mockAdapter.listArtifactStateMetadataRows.mockResolvedValue([]);
    mockAdapter.listArtifactStateReviewRows.mockResolvedValue([]);
    mockAdapter.listGateCriterionStateRows.mockResolvedValue([]);
    mockAdapter.listEvidenceStateRows.mockResolvedValue([]);
    mockAdapter.listEventFactRows.mockResolvedValue([]);
  });

  it("scopes artifact-state body hydration to the viewed stage", async () => {
    mockAdapter.listArtifactStateMetadataRows.mockResolvedValue([
      artifactRow({ artifact_code: "d09_rfp_pack", stage_key: "rfp" }),
    ]);

    const rows = await listArtifactStatesForEventStage("event-1", "rfp");

    expect(mockAdapter.listArtifactStateMetadataRows).toHaveBeenCalledWith(
      "event-1",
      "rfp",
    );
    expect(rows[0]?.artifactCode).toBe("d09_rfp_pack");
    expect(rows[0]?.body).toBeNull();
    expect(rows[0]?.bodyGenerationMetadata).toBeNull();
  });

  it("projects only a current-stage review receipt without sending body or reasoning", async () => {
    mockAdapter.listArtifactStateMetadataRows.mockResolvedValue([
      artifactRow({ id: "state-1", linked_artifact_id: "registry-1", artifact_code: "d01_strategy_memo", stage_key: "strategy" }),
    ]);
    mockAdapter.listArtifactStateReviewRows.mockResolvedValue([
      artifactRow({
        id: "state-1",
        linked_artifact_id: "registry-1",
        artifact_code: "d01_strategy_memo",
        stage_key: "strategy",
        body: "Large confidential draft body.",
        body_generation_metadata: {
          generatedAt: "2026-09-28T19:00:00Z",
          reasoningEnvelope: { internal: "Do not forward" },
          qualityGate: {
            passed: false,
            finalSummary: "Unsupported claim.",
            reviews: [{ privateReasoning: "Do not forward review notes" }],
          },
        },
      }),
    ]);

    const rows = await listArtifactStatesForEventStage("event-1", "strategy");

    expect(mockAdapter.listArtifactStateReviewRows).toHaveBeenCalledWith("event-1", "strategy");
    expect(rows[0]).toMatchObject({
      linkedArtifactId: "registry-1",
      body: null,
      bodyGenerationMetadata: {
        qualityGate: { passed: false, finalSummary: "Unsupported claim." },
      },
    });
    expect(JSON.stringify(rows[0])).not.toContain("Large confidential draft body");
    expect(JSON.stringify(rows[0])).not.toContain("Do not forward");
  });

  it("does not project a review receipt after a later human body edit", async () => {
    mockAdapter.listArtifactStateMetadataRows.mockResolvedValue([
      artifactRow({ id: "state-1", linked_artifact_id: "registry-1", stage_key: "strategy" }),
    ]);
    mockAdapter.listArtifactStateReviewRows.mockResolvedValue([
      artifactRow({
        id: "state-1",
        stage_key: "strategy",
        body_generation_metadata: {
          generatedAt: "2026-09-28T19:00:00Z",
          humanEditedAt: "2026-09-28T19:01:00Z",
          qualityGate: { passed: true, finalSummary: "Prior body passed." },
        },
      }),
    ]);

    const rows = await listArtifactStatesForEventStage("event-1", "strategy");
    expect(rows[0]?.bodyGenerationMetadata).toBeNull();
  });

  it("does not project a review receipt when a human edit cannot be ordered", async () => {
    mockAdapter.listArtifactStateMetadataRows.mockResolvedValue([
      artifactRow({ id: "state-1", stage_key: "strategy" }),
    ]);
    mockAdapter.listArtifactStateReviewRows.mockResolvedValue([
      artifactRow({
        id: "state-1",
        body_generation_metadata: {
          humanEditedAt: "unknown",
          qualityGate: { passed: true },
        },
      }),
    ]);

    const rows = await listArtifactStatesForEventStage("event-1", "strategy");
    expect(rows[0]?.bodyGenerationMetadata).toBeNull();
  });

  it("merges cited source_event_facts into effective evidence", async () => {
    mockAdapter.listEvidenceStateRows.mockResolvedValue([
      evidenceRow({
        id: "client-stated-ticket-history",
        requirement_id: "EVID-SRC-SCOPE-TICKET-HISTORY",
        current_state: "Available",
        source_artifact_id: null,
      }),
    ]);
    mockAdapter.listEventFactRows.mockResolvedValue([
      factRow({
        id: "fact-ticket-history",
        fact_key: "annual_change_order_spend",
      }),
    ]);

    const evidence = await listEffectiveEvidenceStatesForEvent("event-1");

    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      id: "fact-derived:event-1:EVID-SRC-SCOPE-TICKET-HISTORY",
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      currentState: "Available",
      sourceArtifactId: null,
      sourceEventFactIds: ["fact-ticket-history"],
    });
  });

  it("returns stage substrate with fact-backed evidence filtered to the requested stage", async () => {
    mockAdapter.listArtifactStateRows.mockResolvedValue([
      artifactRow({ artifact_code: "d07_ticket_synth" }),
    ]);
    mockAdapter.listGateCriterionStateRows.mockResolvedValue([
      criterionRow({ criterion_id: "EVID-SCOPE-01" }),
    ]);
    mockAdapter.listEventFactRows.mockResolvedValue([
      factRow({
        id: "fact-ticket-history",
        fact_key: "annual_change_order_spend",
      }),
      factRow({
        id: "fact-pricing",
        fact_key: "vendor_headline_bid",
      }),
    ]);

    const substrate = await getStageSubstrate("event-1", "scope");

    expect(substrate.artifacts.map((row) => row.artifactCode)).toEqual([
      "d07_ticket_synth",
    ]);
    expect(substrate.criteria.map((row) => row.criterionId)).toEqual([
      "EVID-SCOPE-01",
    ]);
    expect(substrate.evidence).toHaveLength(1);
    expect(substrate.evidence[0]).toMatchObject({
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      sourceEventFactIds: ["fact-ticket-history"],
    });
  });
});

function artifactRow(
  overrides: Partial<SourceEventArtifactStateRow> = {},
): SourceEventArtifactStateRow {
  return {
    id: "artifact-state-1",
    source_event_id: "event-1",
    tenant_key: "skyharbor-air",
    artifact_code: "d07_ticket_synth",
    stage_key: "scope",
    artifact_family: "scope_document",
    tier: "rich",
    status: "approved",
    requirement_level: "required",
    gate_defining: true,
    linked_artifact_id: null,
    notes: null,
    body: "Ticket synthesis.",
    body_format: "markdown",
    body_authored_by: "user-1",
    body_updated_at: "2026-07-18T00:00:00.000Z",
    body_generation_metadata: null,
    created_at: "2026-07-18T00:00:00.000Z",
    updated_at: "2026-07-18T00:00:00.000Z",
    ...overrides,
  };
}

function criterionRow(
  overrides: Partial<SourceEventGateCriterionStateRow> = {},
): SourceEventGateCriterionStateRow {
  return {
    id: "criterion-1",
    source_event_id: "event-1",
    tenant_key: "skyharbor-air",
    criterion_id: "EVID-SCOPE-01",
    from_stage: "scope",
    to_stage: "rfp",
    state: "pending",
    reviewer_user_id: null,
    reviewed_at: null,
    notes: null,
    evidence_artifact_ids: [],
    waiver_approval_id: null,
    created_at: "2026-07-18T00:00:00.000Z",
    updated_at: "2026-07-18T00:00:00.000Z",
    ...overrides,
  };
}

function evidenceRow(
  overrides: Partial<SourceEventEvidenceStateRow> = {},
): SourceEventEvidenceStateRow {
  return {
    id: "evidence-1",
    source_event_id: "event-1",
    tenant_key: "skyharbor-air",
    requirement_id: "EVID-SRC-SCOPE-TICKET-HISTORY",
    stage_key: "scope",
    current_state: "Available",
    source_artifact_id: null,
    notes: null,
    last_synced_at: "2026-07-18T00:00:00.000Z",
    created_at: "2026-07-18T00:00:00.000Z",
    updated_at: "2026-07-18T00:00:00.000Z",
    ...overrides,
  };
}

function factRow(
  overrides: Partial<SourceEventFactRow> = {},
): SourceEventFactRow {
  return {
    id: "fact-1",
    source_event_id: "event-1",
    client_key: "skyharbor-air",
    fact_key: "annual_change_order_spend",
    entity_kind: "event",
    entity_ref: null,
    value_numeric: 1200000,
    value_text: null,
    unit: "usd",
    source_method: "structured_map",
    source_citation: {
      doc: "VOLUMETRICS_V1",
      locator: "annual_change_order_spend",
    },
    confidence: "high",
    captured_at: "2026-07-18T00:00:00.000Z",
    is_stale: false,
    ...overrides,
  };
}
