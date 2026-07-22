import {
  buildMovesLearningPromotionPreview,
  buildMovesLearningPromotionRollup,
  buildMovesLearningReviewPacket,
  buildMovesLearningWritebackPlan,
  getMovesLearningReviewQueue,
  summarizeMovesLearningReadback,
  summarizeMovesLearningReviewCandidates,
  writeMovesLearningToEnterpriseContext,
  type MovesLearningMove,
  type MovesLearningWritebackStore,
} from "@/lib/programs/learning-writeback";
import type { AzureReadClient } from "@/lib/data-plane/azureRead";

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

describe("summarizeMovesLearningReadback", () => {
  it("passes only when records, facts, and unpromoted readiness rows align", () => {
    const report = summarizeMovesLearningReadback({
      clientKey: "arcturus",
      moveId: "move-1",
      records: [
        {
          id: "rec-1",
          tenant_key: "arcturus",
          canonical_record_id: "moves-learning-move-1-approved_evidence-ev-1",
          record_type: "moves_learning",
          record_subtype: "approved_evidence",
          source_system: "moves_learning_ledger",
          source_record_id: "ev-1",
          lifecycle_state: "active",
          payload: {
            moveId: "move-1",
            moveName: "Commercial Lending Agent Assist",
            tenantKey: "arcturus",
            phase: 2,
            sourceBasis: "approved_evidence",
            sourceId: "ev-1",
            claimType: "evidence",
            title: "Evidence",
            summary: "Approved evidence",
            evidenceRefs: ["ev-1"],
            confidenceLevel: "high",
            writebackSchemaVersion: 1,
          },
        },
      ],
      facts: [
        {
          id: "fact-1",
          record_id: "rec-1",
          tenant_key: "arcturus",
          source_system: "moves_learning_ledger",
          source_record_id: "ev-1",
          lifecycle_state: "active",
        },
      ],
      readinessRows: [
        {
          object_table: "enterprise_context_records",
          object_id: "rec-1",
          client_key: "arcturus",
          source_layer: "tenant_context",
          source_basis: "approved_evidence",
          agent_readiness_status: "not_reviewed",
          retrievability: "committed_not_indexed",
          policy_validation_status: "pending",
          provenance: { moveId: "move-1" },
        },
      ],
    });

    expect(report.status).toBe("pass");
    expect(report.counts).toEqual({ records: 1, facts: 1, readinessRows: 1 });
    expect(report.bySourceBasis).toEqual({ approved_evidence: 1 });
    expect(report.activePromotionViolations).toEqual([]);
  });

  it("fails if a Move learning row has already been promoted to agent-ready context", () => {
    const report = summarizeMovesLearningReadback({
      clientKey: "arcturus",
      moveId: "move-1",
      records: [
        {
          id: "rec-1",
          tenant_key: "arcturus",
          canonical_record_id: "moves-learning-move-1-approved_evidence-ev-1",
          record_type: "moves_learning",
          record_subtype: "approved_evidence",
          source_system: "moves_learning_ledger",
          source_record_id: "ev-1",
          lifecycle_state: "active",
          payload: { moveId: "move-1" },
        },
      ],
      facts: [
        {
          record_id: "rec-1",
          tenant_key: "arcturus",
          source_system: "moves_learning_ledger",
          source_record_id: "ev-1",
          lifecycle_state: "active",
        },
      ],
      readinessRows: [
        {
          object_table: "enterprise_context_records",
          object_id: "rec-1",
          client_key: "arcturus",
          source_layer: "tenant_context",
          source_basis: "approved_evidence",
          agent_readiness_status: "agent_ready",
          retrievability: "search_indexed",
          policy_validation_status: "pass",
          provenance: { moveId: "move-1" },
        },
      ],
    });

    expect(report.status).toBe("fail");
    expect(report.activePromotionViolations).toEqual([
      {
        objectId: "rec-1",
        agentReadinessStatus: "agent_ready",
        retrievability: "search_indexed",
        policyValidationStatus: "pass",
      },
    ]);
  });
});

describe("Moves learning review queue", () => {
  it("summarizes persisted learning rows as reviewable, not agent-ready context", () => {
    const queue = summarizeMovesLearningReviewCandidates("arcturus", [
      {
        id: "rec-1",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-approved_evidence-ev-1",
        record_subtype: "approved_evidence",
        title: "Loan onboarding baseline",
        source_record_id: "ev-1",
        last_synced_at: "2026-07-22T18:00:00.000Z",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          tenantKey: "first-capital",
          phase: 2,
          sourceBasis: "approved_evidence",
          sourceId: "ev-1",
          claimType: "evidence",
          title: "Loan onboarding baseline",
          summary: "Cycle time is 11.8 days and KYC rework is 27%.",
          evidenceRefs: ["ev-1", "artifact-input-1"],
          confidenceLevel: "high",
          writebackSchemaVersion: 1,
        },
        agent_readiness_status: "not_reviewed",
        retrievability: "committed_not_indexed",
        policy_validation_status: "pending",
        confidence_level: "high",
        confidence_rationale: "Approved Move evidence, pending steward review.",
      },
    ]);

    expect(queue.canonicalTenantKey).toBe("first-capital");
    expect(queue.counts.total).toBe(1);
    expect(queue.counts.bySourceBasis).toEqual({ "approved evidence": 1 });
    expect(queue.counts.byReadiness).toEqual({
      "not_reviewed / committed_not_indexed / pending": 1,
    });
    expect(queue.candidates[0]).toMatchObject({
      moveId: "move-1",
      moveName: "Commercial Lending Agent Assist",
      phase: 2,
      readinessStatus: "not_reviewed",
      retrievability: "committed_not_indexed",
      policyValidationStatus: "pending",
      evidenceRefs: ["ev-1", "artifact-input-1"],
    });
  });

  it("builds a steward packet that keeps reviewable Moves learning out of active context", () => {
    const queue = summarizeMovesLearningReviewCandidates("arcturus", [
      {
        id: "rec-1",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-approved_evidence-ev-1",
        record_subtype: "approved_evidence",
        title: "Loan onboarding baseline",
        source_record_id: "ev-1",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          phase: 2,
          sourceBasis: "approved_evidence",
          sourceId: "ev-1",
          title: "Loan onboarding baseline",
          summary: "Cycle time is 11.8 days and KYC rework is 27%.",
          evidenceRefs: ["ev-1", "artifact-input-1"],
          confidenceLevel: "high",
        },
        agent_readiness_status: "not_reviewed",
        retrievability: "committed_not_indexed",
        policy_validation_status: "pending",
      },
    ]);

    const packet = buildMovesLearningReviewPacket(queue.candidates[0]!);

    expect(packet.action).toBe("hold_for_policy_review");
    expect(packet.actionLabel).toBe("Review required");
    expect(packet.whyHere).toContain("P2 approved evidence");
    expect(packet.inspect).toEqual(
      expect.arrayContaining([
        "Move: Commercial Lending Agent Assist",
        "Source id: ev-1",
        "Evidence refs: ev-1, artifact-input-1",
      ]),
    );
    expect(packet.blockers).toEqual(
      expect.arrayContaining([
        "Not indexed in Azure retrieval.",
        "Context/corpus policy has not passed.",
        "Not agent-ready; held for stewardship.",
      ]),
    );
    expect(packet.safeNextStep).toContain("Promotion remains separate");
  });

  it("builds a promotion preview that explains why a reviewable candidate is not active-context ready", () => {
    const queue = summarizeMovesLearningReviewCandidates("arcturus", [
      {
        id: "rec-1",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-approved_evidence-ev-1",
        record_subtype: "approved_evidence",
        title: "Loan onboarding baseline",
        source_record_id: "ev-1",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          phase: 2,
          sourceBasis: "approved_evidence",
          sourceId: "ev-1",
          title: "Loan onboarding baseline",
          summary: "Cycle time is 11.8 days and KYC rework is 27%.",
          evidenceRefs: ["ev-1", "artifact-input-1"],
          confidenceLevel: "high",
        },
        agent_readiness_status: "not_reviewed",
        retrievability: "committed_not_indexed",
        policy_validation_status: "pending",
      },
    ]);

    const preview = buildMovesLearningPromotionPreview(queue.candidates[0]!);

    expect(preview.status).toBe("blocked");
    expect(preview.statusLabel).toBe("Not ready");
    expect(preview.summary).toContain("canonical promotion gates are not complete");
    expect(preview.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Source lineage", status: "pass" }),
        expect.objectContaining({ label: "Context policy", status: "pending" }),
        expect.objectContaining({
          label: "Agent context eligibility",
          status: "blocked",
        }),
        expect.objectContaining({
          label: "Azure retrieval index",
          status: "blocked",
        }),
        expect.objectContaining({
          label: "Citation rendering proof",
          status: "pending",
        }),
        expect.objectContaining({ label: "Steward decision", status: "blocked" }),
      ]),
    );
    expect(preview.nextAction).toContain("cite-render verification");
  });

  it("flags any already active-looking Moves learning row as an investigation", () => {
    const queue = summarizeMovesLearningReviewCandidates("arcturus", [
      {
        id: "rec-1",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-gate_decision-gate-1",
        record_subtype: "gate_decision",
        title: "Phase Gate Decision",
        source_record_id: "gate-1",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          phase: 2,
          sourceBasis: "gate_decision",
          sourceId: "gate-1",
          title: "Phase Gate Decision",
          summary: "P2 approved with carried gaps.",
          evidenceRefs: ["gate-1"],
          confidenceLevel: "medium",
        },
        agent_readiness_status: "agent_ready",
        retrievability: "search_indexed",
        tenant_id: "client-1",
        source_layer: "tenant_context",
        classification: "internal",
        readiness_source_basis: "gate_decision",
        policy_validation_status: "pass",
        confidence_level: "medium",
        applicable_agents: ["nexus", "tower", "steward"],
        cited_render_verified_at: "2026-07-22T19:00:00.000Z",
        provenance: { moveId: "move-1", sourceId: "gate-1" },
      },
    ]);

    const packet = buildMovesLearningReviewPacket(queue.candidates[0]!);

    expect(packet.action).toBe("investigate_active_promotion_violation");
    expect(packet.actionLabel).toBe("Investigate before use");
    expect(packet.safeNextStep).toContain("explicit steward decision");
  });

  it("promotion preview flags active-looking candidates for investigation", () => {
    const queue = summarizeMovesLearningReviewCandidates("arcturus", [
      {
        id: "rec-1",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-gate_decision-gate-1",
        record_subtype: "gate_decision",
        title: "Phase Gate Decision",
        source_record_id: "gate-1",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          phase: 2,
          sourceBasis: "gate_decision",
          sourceId: "gate-1",
          title: "Phase Gate Decision",
          summary: "P2 approved with carried gaps.",
          evidenceRefs: ["gate-1"],
          confidenceLevel: "medium",
        },
        agent_readiness_status: "agent_ready",
        retrievability: "search_indexed",
        tenant_id: "client-1",
        source_layer: "tenant_context",
        classification: "internal",
        readiness_source_basis: "gate_decision",
        policy_validation_status: "pass",
        confidence_level: "medium",
        applicable_agents: ["nexus", "tower", "steward"],
        cited_render_verified_at: "2026-07-22T19:00:00.000Z",
        provenance: { moveId: "move-1", sourceId: "gate-1" },
      },
    ]);

    const preview = buildMovesLearningPromotionPreview(queue.candidates[0]!);

    expect(preview.status).toBe("investigate");
    expect(preview.statusLabel).toBe("Investigate");
    expect(preview.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Azure retrieval index",
          status: "pass",
        }),
        expect.objectContaining({
          label: "Citation rendering proof",
          status: "pass",
        }),
        expect.objectContaining({
          label: "Steward decision",
          status: "investigate",
        }),
      ]),
    );
    expect(preview.nextAction).toContain("Audit the promotion trail");
  });

  it("marks fully gated but not-yet-stewarded candidates preview-ready", () => {
    const queue = summarizeMovesLearningReviewCandidates("arcturus", [
      {
        id: "rec-1",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-approved_evidence-ev-1",
        record_subtype: "approved_evidence",
        title: "Loan onboarding baseline",
        source_record_id: "ev-1",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          phase: 2,
          sourceBasis: "approved_evidence",
          sourceId: "ev-1",
          title: "Loan onboarding baseline",
          summary: "Cycle time is 11.8 days and KYC rework is 27%.",
          evidenceRefs: ["ev-1", "artifact-input-1"],
          confidenceLevel: "high",
        },
        agent_readiness_status: "not_reviewed",
        retrievability: "search_indexed",
        tenant_id: "client-1",
        source_layer: "tenant_context",
        classification: "internal",
        readiness_source_basis: "approved_evidence",
        policy_validation_status: "pass",
        confidence_level: "high",
        applicable_agents: ["nexus", "tower", "steward"],
        cited_render_verified_at: "2026-07-22T19:00:00.000Z",
        provenance: { moveId: "move-1", sourceId: "ev-1" },
      },
    ]);

    const preview = buildMovesLearningPromotionPreview(queue.candidates[0]!);

    expect(preview.status).toBe("preview_ready");
    expect(preview.statusLabel).toBe("Preview ready");
    expect(preview.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Source lineage", status: "pass" }),
        expect.objectContaining({ label: "Context policy", status: "pass" }),
        expect.objectContaining({
          label: "Agent context eligibility",
          status: "pass",
        }),
        expect.objectContaining({
          label: "Azure retrieval index",
          status: "pass",
        }),
        expect.objectContaining({
          label: "Citation rendering proof",
          status: "pass",
        }),
        expect.objectContaining({
          label: "Steward decision",
          status: "pending",
        }),
      ]),
    );
    expect(preview.nextAction).toContain("read-only promotion preview");
  });

  it("builds a promotion rollup that summarizes why candidates are not active-context ready", () => {
    const queue = summarizeMovesLearningReviewCandidates("arcturus", [
      {
        id: "rec-1",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-approved_evidence-ev-1",
        record_subtype: "approved_evidence",
        title: "Loan onboarding baseline",
        source_record_id: "ev-1",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          phase: 2,
          sourceBasis: "approved_evidence",
          sourceId: "ev-1",
          title: "Loan onboarding baseline",
          summary: "Cycle time is 11.8 days and KYC rework is 27%.",
          evidenceRefs: ["ev-1", "artifact-input-1"],
          confidenceLevel: "high",
        },
        agent_readiness_status: "not_reviewed",
        retrievability: "committed_not_indexed",
        policy_validation_status: "pending",
        tenant_id: "client-1",
        source_layer: "tenant_context",
        classification: "internal",
        readiness_source_basis: "approved_evidence",
        confidence_level: "high",
        applicable_agents: ["nexus", "tower", "steward"],
        provenance: { moveId: "move-1", sourceId: "ev-1" },
      },
      {
        id: "rec-2",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-client_approved_deliverable-del-1",
        record_subtype: "client_approved_deliverable",
        title: "Client-approved charter",
        source_record_id: "del-1",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          phase: 1,
          sourceBasis: "client_approved_deliverable",
          sourceId: "del-1",
          title: "Client-approved charter",
          summary: "Human-approved charter confirms the bounded first slice.",
          evidenceRefs: ["del-1", "artifact-approved-charter"],
          confidenceLevel: "medium",
        },
        agent_readiness_status: "not_reviewed",
        retrievability: "committed_not_indexed",
        policy_validation_status: "pass",
        tenant_id: "client-1",
        source_layer: "tenant_context",
        classification: "internal",
        readiness_source_basis: "client_approved_deliverable",
        confidence_level: "medium",
        applicable_agents: ["nexus", "tower", "steward"],
        provenance: { moveId: "move-1", sourceId: "del-1" },
      },
    ]);

    const rollup = buildMovesLearningPromotionRollup(queue.candidates);

    expect(rollup.status).toBe("blocked");
    expect(rollup.statusLabel).toBe("Not ready");
    expect(rollup.totals).toEqual({
      candidates: 2,
      blockedCandidates: 2,
      investigateCandidates: 0,
      previewReadyCandidates: 0,
    });
    expect(rollup.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Source lineage",
          passed: 2,
          blocked: 0,
        }),
        expect.objectContaining({
          label: "Context policy",
          passed: 1,
          pending: 1,
        }),
        expect.objectContaining({
          label: "Agent context eligibility",
          passed: 2,
          blocked: 0,
        }),
        expect.objectContaining({
          label: "Azure retrieval index",
          passed: 0,
          blocked: 2,
        }),
        expect.objectContaining({
          label: "Citation rendering proof",
          pending: 2,
        }),
        expect.objectContaining({
          label: "Steward decision",
          blocked: 2,
        }),
      ]),
    );
    expect(rollup.topBlockers).toEqual(
      expect.arrayContaining([
        "Azure retrieval index: 2",
        "Citation rendering proof: 2",
        "Steward decision: 2",
      ]),
    );
    expect(rollup.nextAction).toContain("keeping all candidates out of default agent context");
  });

  it("promotion rollup escalates when any candidate has active-use signals", () => {
    const queue = summarizeMovesLearningReviewCandidates("arcturus", [
      {
        id: "rec-1",
        tenant_key: "first-capital",
        canonical_record_id: "moves-learning-move-1-gate_decision-gate-1",
        record_subtype: "gate_decision",
        title: "Phase Gate Decision",
        source_record_id: "gate-1",
        payload: {
          moveId: "move-1",
          moveName: "Commercial Lending Agent Assist",
          phase: 2,
          sourceBasis: "gate_decision",
          sourceId: "gate-1",
          title: "Phase Gate Decision",
          summary: "P2 approved with carried gaps.",
          evidenceRefs: ["gate-1"],
          confidenceLevel: "medium",
        },
        agent_readiness_status: "agent_ready",
        retrievability: "search_indexed",
        policy_validation_status: "pass",
      },
    ]);

    const rollup = buildMovesLearningPromotionRollup(queue.candidates);

    expect(rollup.status).toBe("investigate");
    expect(rollup.statusLabel).toBe("Investigate");
    expect(rollup.totals.investigateCandidates).toBe(1);
    expect(rollup.summary).toContain("active-use signals");
    expect(rollup.nextAction).toContain("Audit active-looking rows first");
  });

  it("reads using canonical and legacy tenant aliases", async () => {
    const queries: Array<{ sql: string; params: readonly unknown[] }> = [];
    const reader: AzureReadClient = {
      async query(sql, params = []) {
        queries.push({ sql, params });
        return [];
      },
      async select() {
        return [];
      },
      async maybeSingle() {
        return null;
      },
      async count() {
        return 0;
      },
      async withSession(fn) {
        return fn(async () => []);
      },
    };

    const queue = await getMovesLearningReviewQueue("arcturus", {
      reader,
      limit: 25,
    });

    expect(queue.tenantKey).toBe("arcturus");
    expect(queue.canonicalTenantKey).toBe("first-capital");
    expect(queries).toHaveLength(1);
    expect(queries[0]?.params[0]).toEqual(
      expect.arrayContaining(["arcturus", "first-capital"]),
    );
    expect(queries[0]?.params).toEqual(
      expect.arrayContaining(["moves_learning", "moves_learning_ledger", 25]),
    );
  });
});
