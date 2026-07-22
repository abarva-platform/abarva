import {
  buildMovesLearningWritebackPlan,
  writeMovesLearningToEnterpriseContext,
  type MovesLearningMove,
  type MovesLearningWritebackStore,
} from "@/lib/programs/learning-writeback";

const move: MovesLearningMove = {
  id: "move-1",
  tenantKey: "arcturus",
  clientId: "client-1",
  name: "Commercial Lending Agent Assist",
  currentPhase: 2,
  functionPackKey: "financial_services_banking.commercial_lending_agent_assist",
  archetype: "commercial_lending_agent_assist",
};

describe("buildMovesLearningWritebackPlan", () => {
  it("builds reviewable enterprise-context candidates from approved Move material only", () => {
    const plan = buildMovesLearningWritebackPlan({
      move,
      committedAt: "2026-07-22T16:00:00.000Z",
      evidence: [
        {
          id: "ev-approved",
          tenantKey: "arcturus",
          clientId: "client-1",
          moveId: "move-1",
          phase: 2,
          evidenceType: "current_state_kpi_baseline",
          title: "Loan onboarding baseline",
          summary: "Cycle time is 11.8 days and KYC rework is 27%.",
          confidence: 0.88,
          reviewDecision: "approved",
          attachmentId: "artifact-input-1",
        },
        {
          id: "ev-pending",
          tenantKey: "arcturus",
          clientId: "client-1",
          moveId: "move-1",
          phase: 2,
          evidenceType: "draft_upload",
          title: "Unreviewed upload",
          summary: "This should not teach the context layer.",
          confidence: 0.8,
          reviewDecision: "pending",
        },
      ],
      deliverables: [
        {
          id: "del-approved",
          tenantKey: "arcturus",
          clientId: "client-1",
          moveId: "move-1",
          phase: 1,
          deliverableTypeKey: "charter",
          title: "Program Charter",
          status: "signed_off",
          signedOffVersion: 2,
          signedOffAt: "2026-07-22T15:00:00.000Z",
          signedOffBy: "user-1",
          approvedArtifactId: "artifact-approved-charter",
          latestContent:
            "Human-approved charter confirms the first slice is commercial lending onboarding.",
        },
        {
          id: "del-draft",
          tenantKey: "arcturus",
          clientId: "client-1",
          moveId: "move-1",
          phase: 2,
          deliverableTypeKey: "root_cause_worksheet",
          title: "Root Cause Worksheet",
          status: "draft",
          signedOffVersion: null,
          latestContent: "AI draft only.",
        },
      ],
      gateDecisions: [
        {
          id: "gate-1",
          tenantKey: "arcturus",
          clientId: "client-1",
          moveId: "move-1",
          phase: 1,
          title: "Phase Gate Decision - P1 to P2",
          status: "approved",
          sourceBasis: "governed_gate_evaluation",
          metadata: { softGapsCarried: false, carriedGaps: [] },
        },
      ],
    });

    expect(plan.records).toHaveLength(3);
    expect(plan.factDrafts).toHaveLength(3);
    expect(plan.readinessDrafts).toHaveLength(3);
    expect(plan.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: "ev-pending", reason: "not_approved" }),
        expect.objectContaining({ sourceId: "del-draft", reason: "not_signed_off" }),
      ]),
    );
    expect(plan.records.map((row) => row.record_subtype)).toEqual([
      "approved_evidence",
      "client_approved_deliverable",
      "gate_decision",
    ]);
    expect(plan.readinessDrafts.every((row) => row.agent_readiness_status === "not_reviewed")).toBe(true);
    expect(plan.records[0]?.payload.evidenceRefs).toEqual([
      "ev-approved",
      "artifact-input-1",
    ]);
  });

  it("does not write restricted evidence even when approved", () => {
    const plan = buildMovesLearningWritebackPlan({
      move,
      committedAt: "2026-07-22T16:00:00.000Z",
      evidence: [
        {
          id: "ev-restricted",
          tenantKey: "arcturus",
          clientId: "client-1",
          moveId: "move-1",
          phase: 2,
          evidenceType: "sensitive",
          title: "Restricted file",
          summary: "Restricted material",
          confidence: 0.92,
          reviewDecision: "approved",
          classification: "restricted",
        },
      ],
      deliverables: [],
      gateDecisions: [],
    });
    expect(plan.records).toHaveLength(0);
    expect(plan.skipped).toEqual([
      { sourceBasis: "approved_evidence", sourceId: "ev-restricted", reason: "restricted" },
    ]);
  });
});

describe("writeMovesLearningToEnterpriseContext", () => {
  it("persists records, facts, and readiness rows through the injected store", async () => {
    const calls: string[] = [];
    const readinessPayloads: Array<Record<string, unknown>> = [];
    const store: MovesLearningWritebackStore = {
      async upsertRecords(rows) {
        calls.push(`records:${rows.length}`);
        return new Map(rows.map((row, index) => [row.canonical_record_id, `rec-${index}`]));
      },
      async upsertFacts(rows) {
        calls.push(`facts:${rows.length}`);
        return rows.length;
      },
      async upsertReadiness(rows) {
        calls.push(`readiness:${rows.length}`);
        readinessPayloads.push(...rows);
        return rows.length;
      },
    };

    const result = await writeMovesLearningToEnterpriseContext(
      {
        move,
        committedAt: "2026-07-22T16:00:00.000Z",
        evidence: [
          {
            id: "ev-approved",
            tenantKey: "arcturus",
            clientId: "client-1",
            moveId: "move-1",
            phase: 2,
            evidenceType: "current_state_kpi_baseline",
            title: "Loan onboarding baseline",
            summary: "Cycle time is 11.8 days.",
            confidence: 0.88,
            reviewDecision: "approved",
          },
        ],
        deliverables: [],
        gateDecisions: [],
      },
      store,
    );

    expect(result).toEqual(
      expect.objectContaining({
        status: "written",
        recordsWritten: 1,
        factsWritten: 1,
        readinessRowsWritten: 1,
      }),
    );
    expect(calls).toEqual(["records:1", "facts:1", "readiness:1"]);
    expect(readinessPayloads).toHaveLength(1);
    expect(readinessPayloads[0]?.object_id).toBe("rec-0");
    expect(readinessPayloads[0]).not.toHaveProperty("canonical_record_id");
  });
});
