import { buildSourceNewEventIntelligence } from "./event-intelligence";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

const TEST_TENANT_KEY = CANONICAL_TENANT_KEYS[0]!;

describe("buildSourceNewEventIntelligence", () => {
  it("recognizes a current loaded scope artifact through the canonical filename contract", () => {
    const view = buildSourceNewEventIntelligence({
      event: {
        id: "event-live-shaped",
        clientId: "client-example",
        clientKey: TEST_TENANT_KEY,
        eventType: "managed_service",
        category: null,
        currentStage: "scope",
      },
      artifacts: [
        {
          id: "artifact-app-inventory",
          title: "Application Inventory & Tiering",
          fileName: "Application_Inventory-example.md",
          artifactType: "d04_app_inv",
          artifactFamily: "minimum_data_request",
          lifecycleState: "current",
          sourceBasis: "source_event_artifact_states:artifact-app-inventory",
          confidence: null,
          citationReady: false,
          evidenceFamiliesUsed: ["minimum_data_request"],
          sourceRegisterId: null,
          contextBundleTraceId: null,
          missingInputs: [],
          generatedAt: "2026-09-01T00:00:00Z",
        },
      ],
    });

    expect(view.requiredEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "application_inventory",
          state: "gap",
        }),
      ]),
    );
    expect(view.governedContext.available).toEqual([]);
    expect(view.nextQuestion).toBe(
      "CMDB export / application portfolio is already loaded but not ready. Which governance review or promotion step should clear it?",
    );
    expect(view.nextAction).toEqual({
      label: "Review loaded evidence",
      detail:
        "Complete governance review or promotion for Application & system inventory before relying on this intelligence.",
    });
  });

  it("uses the registered archetype, industry metrics, and governed bundle instead of raw context", () => {
    const view = buildSourceNewEventIntelligence({
      event: {
        id: "event-1",
        clientId: "client-example",
        clientKey: TEST_TENANT_KEY,
        eventType: "managed_service",
        category: "ams",
        currentStage: "rfp",
      },
      artifacts: [
        {
          id: "artifact-ready",
          title: "Tower scope matrix",
          artifactType: "scope_matrix",
          artifactFamily: "service_tower_scope",
          lifecycleState: "current",
          sourceBasis: "source_artifacts:artifact-ready",
          confidence: "high",
          citationReady: true,
          evidenceFamiliesUsed: ["service_tower_scope"],
          sourceRegisterId: "source-register-1",
          contextBundleTraceId: "ctx-trace-1",
          missingInputs: [],
          generatedAt: "2026-09-01T00:00:00Z",
        },
        {
          id: "artifact-loaded-only",
          title: "Unpromoted SLA schedule",
          artifactType: "sla_schedule",
          artifactFamily: "sla_baseline",
          lifecycleState: "current",
          sourceBasis: "source_artifacts:artifact-loaded-only",
          confidence: "medium",
          citationReady: false,
          evidenceFamiliesUsed: ["sla_baseline"],
          sourceRegisterId: null,
          contextBundleTraceId: null,
          missingInputs: ["SLA schedule needs citation-render verification."],
          generatedAt: "2026-09-01T00:00:00Z",
        },
      ],
    });

    expect(view.archetype.id).toBe("AMS_MANAGED_SERVICES");
    expect(view.currentStage).toBe("rfp");
    expect(view.requiredEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "service_tower_scope",
          state: "available",
        }),
        expect.objectContaining({
          key: "sla_baseline",
          state: "gap",
        }),
        expect.objectContaining({
          key: "transition_constraints",
          state: "gap",
        }),
      ]),
    );
    expect(view.industryMetrics.map((metric) => metric.key)).toContain(
      "ams_productivity_glidepath",
    );
    expect(view.governedContext.available).toEqual([
      expect.objectContaining({
        id: "artifact-ready",
        contextBundleTraceId: "ctx-trace-1",
      }),
    ]);
    expect(view.allowedStatement).toContain(
      "Source can use Tower scope matrix",
    );
    expect(view.allowedStatement).toContain("SLA baseline");
    expect(view.governedContext.blocked).toEqual([
      expect.objectContaining({
        id: "artifact-loaded-only",
        reasons: expect.arrayContaining([
          expect.stringContaining(
            "agent_readiness_status is committed_not_indexed",
          ),
        ]),
      }),
    ]);
    expect(view.gaps).toEqual(
      expect.arrayContaining([
        expect.stringContaining("SLA baseline"),
        "SLA schedule needs citation-render verification.",
      ]),
    );
    expect(view.refusals.join(" ")).toContain("Unpromoted SLA schedule");
    expect(view.refusals.join(" ")).not.toContain("agent_readiness_status");
    expect(view.nextQuestion).toBe(
      "Current SLA schedule is already loaded but not ready. Which governance review or promotion step should clear it?",
    );
    expect(view.nextQuestion).not.toContain("Can you provide");
    expect(view.nextAction).toEqual({
      label: "Review loaded evidence",
      detail:
        "Complete governance review or promotion for SLA baseline before relying on this intelligence.",
    });
  });

  it("does not convert reviewed artifact metadata into governed confidence", () => {
    const view = buildSourceNewEventIntelligence({
      event: {
        id: "event-3",
        clientId: "client-example",
        clientKey: TEST_TENANT_KEY,
        eventType: "managed_service",
        category: "ams",
        currentStage: "strategy",
      },
      artifacts: [
        {
          id: "artifact-reviewed",
          title: "Reviewed strategy memo",
          artifactType: "strategy_memo",
          artifactFamily: "run_cost_baseline",
          lifecycleState: "current",
          sourceBasis: "source_artifacts:artifact-reviewed",
          confidence: "reviewed",
          citationReady: true,
          evidenceFamiliesUsed: ["run_cost_baseline"],
          sourceRegisterId: "source-register-2",
          contextBundleTraceId: "ctx-trace-2",
          missingInputs: [],
          generatedAt: "2026-09-01T00:00:00Z",
        },
      ],
    });

    expect(view.posture).toBe("blocked");
    expect(view.governedContext.available).toEqual([]);
    expect(view.governedContext.blocked).toEqual([
      expect.objectContaining({
        id: "artifact-reviewed",
        reasons: expect.arrayContaining([
          expect.stringContaining(
            "agent_readiness_status is committed_not_indexed",
          ),
        ]),
      }),
    ]);
    expect(view.allowedStatement).toContain("it cannot make a recommendation");
  });

  it("uses managed-services evidence requirements for a managed-services RFP when category is absent", () => {
    const view = buildSourceNewEventIntelligence({
      event: {
        id: "event-managed-services",
        clientId: "client-example",
        clientKey: TEST_TENANT_KEY,
        eventType: "managed_service",
        category: null,
        currentStage: "rfp",
      },
      artifacts: [],
    });

    expect(view.archetype.id).toBe("AMS_MANAGED_SERVICES");
    expect(view.archetype.name).toBe("IT Outsourcing / AMS / Managed Services");
    expect(view.requiredEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "service_tower_scope",
          label: "Service tower scope",
          severity: "hard",
        }),
        expect.objectContaining({
          key: "sla_baseline",
          label: "SLA baseline",
          severity: "hard",
        }),
      ]),
    );
    expect(view.requiredEvidence.map((item) => item.key)).not.toContain(
      "current_contract",
    );
    expect(view.nextQuestion).toBe(
      "Can you provide Tower scope matrix (XLSX)?",
    );
    expect(view.nextAction).toEqual({
      label: "Resolve evidence gap",
      detail:
        "Add or review Service tower scope before relying on this intelligence.",
    });
  });

  it("keeps renewal-category inputs on the renewal evidence contract", () => {
    const view = buildSourceNewEventIntelligence({
      event: {
        id: "event-renewal",
        clientId: "client-example",
        clientKey: TEST_TENANT_KEY,
        eventType: "managed_service",
        category: "saas_renewal",
        currentStage: "strategy",
      },
      artifacts: [],
    });

    expect(view.archetype.id).toBe("CONTRACT_RENEWAL");
    expect(view.archetype.name).toBe("Contract Renewal / Renegotiation");
    expect(view.requiredEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "current_contract",
          label: "Current contract",
          severity: "hard",
        }),
        expect.objectContaining({
          key: "renewal_timeline",
          label: "Renewal date & timeline",
          severity: "hard",
        }),
      ]),
    );
    expect(view.requiredEvidence.map((item) => item.key)).not.toContain(
      "service_tower_scope",
    );
  });

  it("refuses when the event cannot resolve to a shipped archetype", () => {
    const view = buildSourceNewEventIntelligence({
      event: {
        id: "event-2",
        clientId: "client-example",
        clientKey: TEST_TENANT_KEY,
        eventType: "other",
        category: null,
        currentStage: "strategy",
      },
      artifacts: [],
    });

    expect(view.posture).toBe("blocked");
    expect(view.archetype.id).toBeNull();
    expect(view.allowedStatement).toContain(
      "does not yet map to a supported sourcing playbook",
    );
    expect(view.refusals).toEqual([
      "This event does not yet map to a supported sourcing playbook.",
    ]);
    expect(view.gaps).toContain("No current evidence is ready to cite yet.");
    expect(view.nextAction.label).toBe("Review governed context");
  });

  it("keeps a resolved completed event distinct from an unresolved archetype", () => {
    const view = buildSourceNewEventIntelligence({
      event: {
        id: "event-completed",
        clientId: "client-example",
        clientKey: TEST_TENANT_KEY,
        eventType: "managed_service",
        category: "ams",
        currentStage: "value",
      },
      artifacts: [],
    });

    expect(view.archetype.id).toBe("AMS_MANAGED_SERVICES");
    expect(view.stageEvidenceContract).toBe("not_defined");
    expect(view.requiredEvidence).toEqual([]);
    expect(view.allowedStatement).toContain(
      "does not define a separate evidence contract for the final Value stage",
    );
    expect(view.nextQuestion).toBe(
      "Which governed evidence supports the recorded final value outcome?",
    );
    expect(view.nextAction).toEqual({
      label: "Review lifecycle evidence",
      detail:
        "Review the governed evidence and unresolved gaps from the completed lifecycle before relying on a final value claim.",
    });
    expect(view.refusals).not.toContain(
      "This event does not yet map to a supported sourcing playbook.",
    );
  });
});
