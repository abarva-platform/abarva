// Batch enqueue proof: POST /generate-phase enqueues one queued run per deliverable
// in the phase, scoped to the caller's tenant, and reports per-deliverable status.

const tenancy = {
  clientId: "client-uuid",
  clientKey: "skyharbor-air",
  userId: "u1",
};
const createCalls: Array<Record<string, unknown>> = [];
const sequentialCalls: Array<{
  inputs: Array<Record<string, unknown>>;
  opts: Record<string, unknown>;
}> = [];
let createBehavior: (input: Record<string, unknown>) => {
  id: string;
} = () => ({ id: "run-default" });
const createMoveContextExtract = jest.fn(
  async (input: Record<string, unknown>): Promise<Record<string, unknown>> => {
    void input;
    return {
      status: "created",
      extractId: "extract-1",
      artifactId: "artifact-1",
      evidenceId: "evidence-1",
      sourceMode: "active_home_context",
      attachedEvidenceItems: [],
      suggestedContextItems: [],
      excludedContextItems: [],
      gapItems: [],
      freshness: {
        evidenceFingerprint: "ctx-hash-1",
        approvedEvidenceRevision: "approved-revision-1",
      },
    };
  },
);
const loadApprovedSolutionApproach: jest.Mock = jest.fn(async () => ({
  decisionId: "decision-1",
  decisionVersion: "1",
  decisionHash: "decision-hash-1",
  selectedOptionId: "B",
  selectedOptionVersion: "1",
  chosenOption: "Option B",
  approach: "Governed agent assist",
  options: [
    { id: "A", name: "Option A", summary: "Workflow optimization" },
    { id: "B", name: "Option B", summary: "Governed agent assist" },
  ],
  tradeoffsAccepted: ["Phased integration"],
  rejectedOptions: [],
  scope: [],
  exclusions: [],
  assumptions: [],
  constraints: [],
  unresolvedDecisions: [],
  decision: {
    phase: 3,
    decision: "Approved solution option: Option B",
    rationale: "Best balance of value and control.",
    approvedBy: "u1",
    approvedAt: "2026-07-23T00:00:00.000Z",
  },
}));
const getModuleState: jest.Mock = jest.fn(async () => []);
let evidencePacketsForTest: MoveEvidenceNeedPacket[] = [];
const buildMoveEvidenceNeedPackets = jest.fn(
  (input: { moveId?: string; currentPhase?: number }) => {
    if (evidencePacketsForTest.length > 0) return evidencePacketsForTest;
    const phase = Math.max(2, input.currentPhase ?? 2);
    return [
      {
        moveId: input.moveId ?? "move-1",
        phase,
        artifactType: "discovery_report",
        evidenceSlot: "Contact center KPI baseline",
        familyId: "contact_center_kpis",
        priority: "required",
        ownerSource: "Operations and Finance",
        acceptedFormats: ["CSV"],
        exampleTemplate: "KPI baseline",
        exampleContent: [],
        whyItMatters: "Evidence-backed baseline",
        guidanceBasis: "generic",
        blockedArtifacts: [
          {
            artifactType: "discovery_report",
            title: "Discovery Report",
            phase: phase + 1,
            reason: "Required evidence",
          },
        ],
        canDraftBoundary: {
          canDraft: true,
          canDraftLabel: "Can draft",
          cannotDraftLabel: "Cannot draft",
        },
        preliminaryGenerationCaveat: null,
        waiverOption: null,
        nextAction: "Review the approved KPI file.",
        status: "covered",
        evidenceIds: ["ev-kpi"],
        evidenceTitles: ["contact-center-kpis.csv"],
      } as MoveEvidenceNeedPacket,
    ];
  },
);
const loadDiscoveryEvidenceReadiness = jest.fn(async () => ({}));
const loadAcceptedStageReadinessContext: jest.Mock = jest.fn(async (...args: unknown[]) => {
  void args;
  return {
    moveId: "move-1",
    sourcePhase: 1,
    targetPhase: 2,
    reviewArtifactId: "review-1",
    reviewArtifactVersion: 1,
    proposals: [
      {
        proposalId: "proposal-kpi",
        questionId: "q_kpi_baseline",
        dimensionId: "contact_center_kpis",
        requirement: "required" as const,
        answerState: "answered" as const,
        disposition: "accepted" as const,
        evidenceOrSource: "Existing evidence: ev-kpi",
      },
    ],
    acceptedResponses: [],
    readiness: { ready: 1, partial: 0, insufficientEvidence: 0, unknown: 0 },
  };
});
const formatAcceptedStageReadinessContextForPrompt = jest.fn(
  (...args: unknown[]) => {
    void args;
    return "ACCEPTED STAGE READINESS RESPONSE: contact_center_kpis is supported by ev-kpi.";
  },
);
// The PROMPT reading is a different policy from the gate reading above: it
// accepts a review that is still open. Separate mocks so a case can drive the
// two apart, which is the only thing that pins the route to the right one.
const loadStageReadinessPromptContext: jest.Mock = jest.fn(async (...args: unknown[]) => {
  void args;
  return null;
});
const formatStageReadinessPromptContext = jest.fn((...args: unknown[]) => {
  void args;
  return "ACCEPTED STAGE READINESS RESPONSE: contact_center_kpis is supported by ev-kpi.";
});
const mockLoadApprovedMoveEvidenceSnapshot = jest.fn();
const listApprovedPhaseEvidence: jest.Mock = jest.fn(async () => [
  {
    evidenceId: "evidence-approved-1",
    title: "Approved evidence",
    familyKey: "workshop_notes",
  },
]);

function confirmedRouteModules(
  route: "technical_product" | "process_change",
  processImpact: "limited" | "material" = "material",
) {
  const businessChangeAssessment = {
    expectedWorkflowChange: "none",
    expectedRoleAccountabilityChange: "none",
    adoptionOwner: "Business product owner",
    adoptionResponsibility: "business",
    evidenceReference: "interview-notes",
    validatedBy: "Sponsor",
  };
  const technical = route === "technical_product";
  return [
    {
      moduleKey: "phase_1_business_change_assessment",
      state: { value: JSON.stringify(businessChangeAssessment) },
    },
    {
      moduleKey: "phase_2_solution_route_validation",
      state: {
        value: JSON.stringify({
          businessChangeAssessmentSnapshot: businessChangeAssessment,
          solutionOutput: technical
            ? "reports_dashboards"
            : "workflow_automation",
          workflowChange: technical ? "none" : processImpact,
          roleAccountabilityChange: "none",
          evidenceReference: "evidence-approved-1",
          decision: "confirm",
          selectedRoute: route,
          correctionRationale: "",
          validatedBy: "Sponsor",
        }),
      },
    },
    {
      moduleKey: "phase_4_estimates_capacity",
      state: { value: JSON.stringify(reviewedEstimateModel()) },
    },
  ];
}

function reviewedEstimateModel() {
  const shared = {
    pairId: "pair-1",
    workPackage: "Read-only reporting foundation",
    role: "Data engineer",
    lowHours: 10,
    baseHours: 20,
    highHours: 30,
    rateSource: "Synthetic planning assumption",
    inputBasis: "assumption",
    evidenceReference: "",
    assumption: "Scope is a bounded first release",
    confidence: "low",
    aiEligiblePct: 10,
    aiToolAssumption:
      "Claude Code assists scaffolding; engineer reviews and tests",
    humanReviewHours: 2,
  };
  return {
    currency: "USD",
    reviewer: "Finance reviewer",
    reviewConfirmed: true,
    sourceNotes: "",
    rows: [
      { ...shared, deliveryModel: "internal", ratePerHour: 100 },
      { ...shared, deliveryModel: "vendor", ratePerHour: 150 },
    ],
  };
}

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("not a tenancy error");
  }),
}));
jest.mock("@/lib/deliverables/orchestrator/runs-repository", () => ({
  createDeliverableRun: jest.fn(async (input: Record<string, unknown>) => {
    createCalls.push(input);
    return createBehavior(input);
  }),
  createSequentialDeliverableRunBatch: jest.fn(
    async (
      inputs: Array<Record<string, unknown>>,
      opts: Record<string, unknown>,
    ) => {
      createCalls.push(...inputs);
      sequentialCalls.push({ inputs, opts });
      return inputs.map((input, index) => ({
        id: `run-${index}`,
        sequenceNo: index,
        jobPayload: input.jobPayload,
      }));
    },
  ),
}));
const validateDeliverableTenantInvariant = jest.fn(
  async (input: Record<string, unknown>): Promise<Record<string, unknown>> => {
    void input;
    return {
      ok: true,
      sourceKind: "move",
      sourceId: "m-1",
    };
  },
);
jest.mock("@/lib/deliverables/orchestrator/tenant-invariant", () => ({
  validateDeliverableTenantInvariant: (input: Record<string, unknown>) =>
    validateDeliverableTenantInvariant(input),
  tenantInvariantHttpStatus: () => 403,
}));
jest.mock("@/lib/programs/move-context-extract", () => ({
  createMoveContextExtract: (input: Record<string, unknown>) =>
    createMoveContextExtract(input),
}));
jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  ...jest.requireActual("@/lib/programs/approved-move-evidence-snapshot"),
  loadApprovedMoveEvidenceSnapshot: (...args: unknown[]) =>
    mockLoadApprovedMoveEvidenceSnapshot(...args),
}));
jest.mock("@/lib/programs/approved-solution-approach", () => ({
  loadApprovedSolutionApproach: () => loadApprovedSolutionApproach(),
  formatApprovedSolutionApproach: (approved: { chosenOption: string }) =>
    `APPROVED SOLUTION APPROACH - AUTHORITATIVE INPUT\nChosen option: ${approved.chosenOption}\nBuild only to the approved option.`,
  ARCHITECTURE_MODEL_VERSION: "moves-architecture-model-v2",
}));
jest.mock("@/lib/programs/queries", () => ({
  getModuleState: (...args: unknown[]) => getModuleState(...args),
}));
jest.mock("@/lib/programs/approved-phase-evidence", () => ({
  listApprovedPhaseEvidence: (...args: unknown[]) =>
    listApprovedPhaseEvidence(...args),
}));
jest.mock("@/lib/programs/discovery/evidence-readiness", () => ({
  loadDiscoveryEvidenceReadiness: () => loadDiscoveryEvidenceReadiness(),
}));
jest.mock(
  "@/lib/programs/evidence-readiness/move-evidence-need-packet",
  () => ({
    buildMoveEvidenceNeedPackets: (input: unknown) =>
      buildMoveEvidenceNeedPackets(input as { moveId?: string; currentPhase?: number }),
  }),
);
jest.mock("@/lib/programs/stage-readiness-workbooks/accepted-context", () => ({
  loadAcceptedStageReadinessContext: (...args: unknown[]) =>
    loadAcceptedStageReadinessContext(...args),
  formatAcceptedStageReadinessContextForPrompt: (...args: unknown[]) =>
    formatAcceptedStageReadinessContextForPrompt(...args),
}));
jest.mock("@/lib/programs/stage-readiness-workbooks/prompt-context", () => ({
  loadStageReadinessPromptContext: (...args: unknown[]) =>
    loadStageReadinessPromptContext(...args),
  formatStageReadinessPromptContext: (...args: unknown[]) =>
    formatStageReadinessPromptContext(...args),
}));
// The route reads the stored transition review from two modules, each with its
// own policy: the gate reading applies a required-only test, the prompt reading
// takes every accepted answer whether or not the review is finished. By default
// one stored review stands behind the gate reading, in the same call order, so
// every `mockResolvedValueOnce` below still lands there — and a test can drive
// the readings apart to pin which module each caller uses.
const loadStageReadinessGateProposals: jest.Mock = jest.fn(
  async (...args: unknown[]) => {
    const context = (await loadAcceptedStageReadinessContext(...args)) as
      | { proposals?: unknown[] }
      | null
      | undefined;
    return context?.proposals ?? null;
  },
);
jest.mock(
  "@/lib/programs/stage-readiness-workbooks/gate-proposal-context",
  () => ({
    loadStageReadinessGateProposals: (...args: unknown[]) =>
      loadStageReadinessGateProposals(...args),
  }),
);

import { POST } from "../route";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";

function req(body: unknown, headers: Record<string, string> = {}) {
  return {
    json: async () => body,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as never;
}

beforeEach(() => {
  createCalls.length = 0;
  sequentialCalls.length = 0;
  createBehavior = (input) => ({
    id: `run-${(input as { deliverableType: string }).deliverableType}`,
  });
  validateDeliverableTenantInvariant.mockClear();
  validateDeliverableTenantInvariant.mockResolvedValue({
    ok: true,
    sourceKind: "move",
    sourceId: "m-1",
  });
  createMoveContextExtract.mockClear();
  loadApprovedSolutionApproach.mockClear();
  getModuleState.mockClear();
  getModuleState.mockResolvedValue(confirmedRouteModules("process_change"));
  listApprovedPhaseEvidence.mockClear();
  evidencePacketsForTest = [];
  buildMoveEvidenceNeedPackets.mockClear();
  loadDiscoveryEvidenceReadiness.mockClear();
  loadAcceptedStageReadinessContext.mockClear();
  loadAcceptedStageReadinessContext.mockResolvedValue({
    moveId: "move-1",
    sourcePhase: 1,
    targetPhase: 2,
    reviewArtifactId: "review-1",
    reviewArtifactVersion: 1,
    proposals: [
      {
        proposalId: "proposal-kpi",
        questionId: "q_kpi_baseline",
        dimensionId: "contact_center_kpis",
        requirement: "required",
        answerState: "answered",
        disposition: "accepted",
        evidenceOrSource: "Existing evidence: ev-kpi",
      },
    ],
    acceptedResponses: [],
    readiness: { ready: 1, partial: 0, insufficientEvidence: 0, unknown: 0 },
  });
  formatAcceptedStageReadinessContextForPrompt.mockClear();
  loadStageReadinessPromptContext.mockClear();
  loadStageReadinessPromptContext.mockResolvedValue({
    context: {
      moveId: "move-1",
      sourcePhase: 1,
      targetPhase: 2,
      reviewArtifactId: "review-1",
      reviewArtifactVersion: 1,
      proposals: [],
      acceptedResponses: [
        {
          proposalId: "proposal-kpi",
          questionId: "q_kpi_baseline",
          dimensionId: "contact_center_kpis",
          requirement: "required",
          sourceClass: "client_metric",
          question: "Provide the KPI baseline.",
          response: "Confirmed",
          context: "",
          evidenceOrSource: "Existing evidence: ev-kpi",
          owner: "Operations",
          workbookLocation: { sheetName: "Performance", rowNumber: 2 },
          answerState: "answered",
          acceptedAt: "2026-10-07T00:00:00.000Z",
          acceptedBy: "user-1",
        },
      ],
      readiness: { ready: 1, partial: 0, insufficientEvidence: 0, unknown: 0 },
    },
    openResponseCount: 0,
    reviewOpen: false,
  });
  formatStageReadinessPromptContext.mockClear();
  mockLoadApprovedMoveEvidenceSnapshot.mockReset();
  mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
    tenantKey: "skyharbor-air",
    moveId: "m-1",
    revision: "approved-revision-1",
    approvedEvidenceCount: 1,
    rows: [],
    latestEvidenceActivityAt: null,
    revisionByPhase: {
      1: "approved-revision-1",
      2: "approved-revision-1",
      3: "approved-revision-1",
      4: "approved-revision-1",
      5: "approved-revision-1",
    },
    latestEvidenceActivityAtByPhase: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
    },
  });
  listApprovedPhaseEvidence.mockResolvedValue([
    {
      evidenceId: "evidence-approved-1",
      title: "Approved evidence",
      familyKey: "workshop_notes",
    },
  ]);
  loadApprovedSolutionApproach.mockResolvedValue({
    decisionId: "decision-1",
    decisionVersion: "1",
    decisionHash: "decision-hash-1",
    selectedOptionId: "B",
    selectedOptionVersion: "1",
    chosenOption: "Option B",
    approach: "Governed agent assist",
    options: [
      { id: "A", name: "Option A", summary: "Workflow optimization" },
      { id: "B", name: "Option B", summary: "Governed agent assist" },
    ],
    tradeoffsAccepted: ["Phased integration"],
    rejectedOptions: [],
    scope: [],
    exclusions: [],
    assumptions: [],
    constraints: [],
    unresolvedDecisions: [],
    decision: {
      phase: 3,
      decision: "Approved solution option: Option B",
      rationale: "Best balance of value and control.",
      approvedBy: "u1",
      approvedAt: "2026-07-23T00:00:00.000Z",
    },
  });
});

describe("POST /api/v1/deliverables/generate-phase", () => {
  // The route used to resolve the phase's canonical keys with
  // `.map(find).filter(Boolean)`, so a key with no registry entry was dropped
  // without a word: the build reported success having queued fewer documents
  // than the phase declares, and the phase's exit gate then refused the Move
  // for a document this build never attempted. Proving the pure resolver
  // reports the key is not enough — this asserts the ROUTE refuses on it.
  it("500 naming the keys when a declared phase document has no registry entry", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@/lib/programs/deliverable-registry", () => {
        const actual = jest.requireActual("@/lib/programs/deliverable-registry");
        return {
          ...actual,
          phaseCanonicalKeysForRoute: () => [
            "business_case",
            "a_key_no_registry_entry_declares",
          ],
        };
      });
      const { POST: drifted } = await import("../route");
      const res = await drifted(
        req({ moveId: "m-drift", phase: 4, useCaseArchetype: "ams" }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "phase_build_set_unresolvable",
        unresolvedDeliverableKeys: ["a_key_no_registry_entry_declares"],
      });
      expect(body.detail).toContain("a_key_no_registry_entry_declares");
      expect(body.detail).toContain("No phase build was queued");
      // Nothing was queued — not even the key that DID resolve.
      expect(createCalls).toHaveLength(0);
      expect(sequentialCalls).toHaveLength(0);
    });
  });

  it("400 when phase is out of range", async () => {
    const res = await POST(
      req({ moveId: "m1", phase: 9, useCaseArchetype: "ams" }),
    );
    expect(res.status).toBe(400);
    expect(createCalls.length).toBe(0);
  });

  it("400 when moveId or archetype is missing", async () => {
    expect(
      (await POST(req({ phase: 1, useCaseArchetype: "ams" }))).status,
    ).toBe(400);
    expect((await POST(req({ moveId: "m1", phase: 1 }))).status).toBe(400);
  });

  it("rejects direct build requests while required evidence is open", async () => {
    evidencePacketsForTest = [
      {
        phase: 1,
        priority: "required",
        status: "missing",
        evidenceSlot: "Sponsor-backed charter evidence",
        nextAction: "Upload and approve the source evidence.",
      } as MoveEvidenceNeedPacket,
    ];

    const res = await POST(
      req({ moveId: "m-p1", phase: 1, useCaseArchetype: "ai_member_service" }),
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: "required_evidence_open",
      requiredEvidenceGaps: [
        { evidenceSlot: "Sponsor-backed charter evidence", status: "missing" },
      ],
    });
    expect(createMoveContextExtract).not.toHaveBeenCalled();
    expect(createCalls).toHaveLength(0);
    expect(sequentialCalls).toHaveLength(0);
  });

  it("queues a phase build from the review as it stands, not only from a finished one", async () => {
    // Every REQUIRED response accepted, answered and sourced, and one
    // RECOMMENDED response left blank — a state the review surface cannot
    // decide, so it stays pending. The finished-only reading returns null for
    // it, and a null gate reading means no workbook at all, so the build stayed
    // held by a workbook that was complete for everything the gate requires.
    loadAcceptedStageReadinessContext.mockResolvedValue(null);
    loadStageReadinessGateProposals.mockResolvedValueOnce([
      {
        questionId: "q_kpi_baseline",
        dimensionId: "contact_center_kpis",
        requirement: "required",
        answerState: "answered",
        disposition: "accepted",
        evidenceOrSource: "Existing evidence: ev-kpi",
      },
      {
        questionId: "q_optional_context",
        dimensionId: "nice_to_have_context",
        requirement: "recommended",
        answerState: "blank",
        disposition: "pending",
        evidenceOrSource: "",
      },
    ]);

    const res = await POST(
      req({ moveId: "m-p2", phase: 2, useCaseArchetype: "ai_member_service" }),
    );

    expect(res.status).toBe(202);
    expect(loadStageReadinessGateProposals).toHaveBeenCalledWith(
      expect.anything(),
      "m-p2",
      3,
    );
  });

  it("blocks a phase build when the accepted workbook still marks required evidence unknown", async () => {
    loadAcceptedStageReadinessContext.mockResolvedValueOnce({
      moveId: "m-p2",
      sourcePhase: 2,
      targetPhase: 3,
      reviewArtifactId: "review-p2",
      reviewArtifactVersion: 1,
      proposals: [
        {
          proposalId: "proposal-kpi",
          questionId: "q_kpi_baseline",
          dimensionId: "contact_center_kpis",
          requirement: "required",
          answerState: "unknown",
          disposition: "accepted",
          evidenceOrSource: "Existing evidence: ev-kpi",
        },
      ],
      acceptedResponses: [],
      readiness: { ready: 0, partial: 0, insufficientEvidence: 0, unknown: 1 },
    });

    const res = await POST(
      req({ moveId: "m-p2", phase: 2, useCaseArchetype: "ai_member_service" }),
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: "required_evidence_open",
      requiredEvidenceGaps: [
        expect.objectContaining({
          evidenceSlot: "Contact center KPI baseline",
          status: "partial",
          nextAction: expect.stringMatching(/replace unknown/i),
        }),
      ],
    });
    expect(createMoveContextExtract).not.toHaveBeenCalled();
    expect(createCalls).toHaveLength(0);
  });

  it("fails closed when evidence readiness cannot be verified", async () => {
    loadDiscoveryEvidenceReadiness.mockRejectedValueOnce(
      new Error("readiness store unavailable"),
    );

    const res = await POST(
      req({ moveId: "m-p1", phase: 1, useCaseArchetype: "ai_member_service" }),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({
      error: "evidence_readiness_unavailable",
    });
    expect(createMoveContextExtract).not.toHaveBeenCalled();
    expect(createCalls).toHaveLength(0);
  });

  it("queues P1 Charter and Discovery Workshop Guide with authoritative phase capture", async () => {
    getModuleState.mockResolvedValueOnce([
      {
        moduleKey: "phase_1_sponsor_commitment",
        moduleName: "Sponsor commitment",
        phaseNumber: 1,
        status: "completed",
        state: {
          value: "VP Member Services sponsors the Move and owns the cadence.",
        },
      },
      {
        moduleKey: "phase_1_scope_boundary",
        moduleName: "Scope boundary",
        phaseNumber: 1,
        status: "completed",
        state: {
          value:
            "Include member-service contacts and exclude autonomous clinical advice.",
        },
      },
    ]);

    const res = await POST(
      req({
        moveId: "m-p1",
        phase: 1,
        useCaseArchetype: "ai_member_service",
        moveName: "Member Service Agent Assist",
        clientDisplayName: "Client",
  }),
    );

    expect(res.status).toBe(202);
    const json = (await res.json()) as {
      deliverables: Array<{
        deliverableTypeKey: string;
        deliverableType: string;
      }>;
    };
    expect(json.deliverables.map((d) => d.deliverableTypeKey)).toEqual([
      "charter",
      "discovery_plan",
    ]);
    expect(json.deliverables.map((d) => d.deliverableType)).toEqual([
      "charter",
      "discovery_plan",
    ]);

    expect(createCalls).toHaveLength(2);
    for (const call of createCalls) {
      const decisionContext = (call.jobPayload as { decisionContext: string })
        .decisionContext;
      expect(decisionContext).toContain(
        "SAVED PHASE CAPTURE (authoritative input for this build)",
      );
      expect(decisionContext).toContain(
        "Sponsor contact and progress updates: VP Member Services sponsors the Move",
      );
      expect(decisionContext).toContain(
        "Scope boundary: Include member-service contacts",
      );
    }
  });

  it("enqueues one queued run per phase deliverable, scoped to the tenant", async () => {
    // P3 has several deliverables, so this proves the batch is real (not a single enqueue).
    const res = await POST(
      req({
        moveId: "m-1",
        phase: 3,
        useCaseArchetype: "ams",
        moveName: "Contact Center AI",
        clientDisplayName: "Apex",
      }),
    );
    expect(res.status).toBe(202);
    const json = (await res.json()) as {
      phase: number;
      queued: number;
      total: number;
      deliverables: Array<Record<string, unknown>>;
    };
    expect(json.phase).toBe(3);
    expect(json.total).toBeGreaterThanOrEqual(5);
    expect(json.queued).toBe(json.total);
    expect(json.deliverables.map((d) => d.deliverableTypeKey)).toEqual([
      "target_state_architecture",
      "solution_design",
      "operating_model_design",
      "requirements_traceability",
      "sourcing_strategy",
      "planning_workshop_guide",
    ]);
    expect(
      json.deliverables.every(
        (d) => d.status === "queued" && typeof d.runId === "string",
      ),
    ).toBe(true);
    expect(validateDeliverableTenantInvariant).toHaveBeenCalledWith({
      module: "moves",
      sourceArtifactRef: "m-1",
      clientId: "client-uuid",
      tenantKey: "skyharbor-air",
    });
    expect(createMoveContextExtract).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "m-1",
        tenantKey: "skyharbor-air",
        phase: 3,
      }),
    );
    expect(sequentialCalls[0]?.opts).toEqual(
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(
          /^m-1:3:decision-hash-1:ctx-hash-1:extract-1:[a-f0-9-]+$/,
        ),
      }),
    );
    const extractInput = createMoveContextExtract.mock.calls[0]?.[0] as {
      candidatePreview: { enabled: boolean };
    };
    expect(extractInput.candidatePreview.enabled).toBe(false);
    // every enqueue carried the caller's tenant + the move as the source ref
    expect(createCalls.length).toBe(json.total);
    expect(createCalls.map((c) => c.deliverableType)).toEqual([
      "target_state_architecture",
      "solution_design",
      "operating_model",
      "requirements_traceability",
      "sourcing_strategy",
      "planning_workshop_guide",
    ]);
    for (const c of createCalls) {
      expect(c.clientId).toBe("client-uuid");
      expect(c.tenantKey).toBe("skyharbor-air");
      expect(c.module).toBe("moves");
      expect(
        (c.jobPayload as { sourceArtifactRef: string }).sourceArtifactRef,
      ).toBe("m-1");
      expect(c.jobPayload).toEqual(
        expect.objectContaining({
          approvedSolutionApproach: expect.stringContaining(
            "Chosen option: Option B",
          ),
          decisionContext: expect.stringContaining(
            "APPROVED SOLUTION APPROACH",
          ),
          decisionLineage: expect.objectContaining({
            decisionHash: "decision-hash-1",
            contextSnapshotHash: "ctx-hash-1",
          }),
          evidenceSnapshotHash: "approved-revision-1",
          phase: 3,
        }),
      );
    }
  });

  it("builds only estimation-stage outputs for an evidence-validated technical route", async () => {
    getModuleState.mockResolvedValue(
      confirmedRouteModules("technical_product"),
    );
    const res = await POST(
      req({
        moveId: "m-technical",
        phase: 3,
        useCaseArchetype: "straightforward_dashboard",
      }),
    );

    expect(res.status).toBe(202);
    const json = (await res.json()) as {
      confirmedSolutionRoute: { route: string; evidenceReference: string };
      deliverables: Array<{ deliverableTypeKey: string }>;
    };
    expect(json.confirmedSolutionRoute).toEqual(
      expect.objectContaining({
        route: "technical_product",
        evidenceReference: "evidence-approved-1",
      }),
    );
    expect(json.deliverables.map((item) => item.deliverableTypeKey)).toEqual([
      "target_state_architecture",
      "requirements_traceability",
    ]);
    expect(createCalls.map((call) => call.deliverableType)).toEqual([
      "target_state_architecture",
      "requirements_traceability",
    ]);
    for (const call of createCalls) {
      const payload = call.jobPayload as { decisionContext: string };
      expect(payload.decisionContext).toContain(
        "VALIDATED SOLUTION ROUTE: Technical product / data solution.",
      );
      expect(payload.decisionContext).toContain(
        "Do not request an end-to-end process redesign or a full target operating model.",
      );
      expect(payload.decisionContext).toContain("Adoption owner:");
      expect(payload.decisionContext).toContain("Claude Code/Codex");
    }
  });

  it("builds bounded process-delta outputs for a validated limited workflow change", async () => {
    getModuleState.mockResolvedValueOnce(
      confirmedRouteModules("process_change", "limited"),
    );
    const res = await POST(
      req({
        moveId: "m-limited-process",
        phase: 3,
        useCaseArchetype: "workflow_automation",
      }),
    );

    expect(res.status).toBe(202);
    const json = (await res.json()) as {
      deliverables: Array<{ deliverableTypeKey: string }>;
    };
    expect(json.deliverables.map((item) => item.deliverableTypeKey)).toEqual([
      "target_state_architecture",
      "process_change_estimate_brief",
      "requirements_traceability",
    ]);
    expect(createCalls.map((call) => call.deliverableType)).toEqual([
      "target_state_architecture",
      "process_change_estimate_brief",
      "requirements_traceability",
    ]);
  });

  it("carries the evidence-validated route and transparent estimate method into P4 jobs", async () => {
    getModuleState.mockResolvedValue(
      confirmedRouteModules("technical_product"),
    );
    const res = await POST(
      req({
        moveId: "m-p4-technical",
        phase: 4,
        useCaseArchetype: "ams",
      }),
    );

    expect(res.status).toBe(202);
    const decisionContext = (
      createCalls[0]?.jobPayload as { decisionContext: string }
    ).decisionContext;
    expect(decisionContext).toContain("ACCEPTED STAGE READINESS RESPONSE");
    expect(decisionContext).toContain(
      "APPROVED SCOPE BASIS: Technical product / data solution.",
    );
    expect(decisionContext).toContain("Do not add end-to-end process redesign");
    expect(decisionContext).toContain("effort × rate arithmetic");
    expect(decisionContext).toContain("Claude Code/Codex");
    expect(decisionContext).toContain("named human reviewer");
  });

  it("hands the prompt a transition review that is still open for review", async () => {
    // The two readings driven apart: the gate reading (target phase + 1) stays
    // satisfied, while the finished-review policy applied to THIS phase's own
    // transition refuses — which is what a single undecided response does. The
    // accepted answers must still reach the job, so reverting the prompt
    // reading to that policy fails this case.
    loadAcceptedStageReadinessContext.mockImplementation(
      async (...args: unknown[]) =>
        args[2] === 5
          ? {
              moveId: "move-1",
              sourcePhase: 4,
              targetPhase: 5,
              reviewArtifactId: "review-gate",
              reviewArtifactVersion: 1,
              proposals: [
                {
                  proposalId: "proposal-kpi",
                  questionId: "q_kpi_baseline",
                  dimensionId: "contact_center_kpis",
                  requirement: "required",
                  answerState: "answered",
                  disposition: "accepted",
                  evidenceOrSource: "Existing evidence: ev-kpi",
                },
              ],
              acceptedResponses: [],
              readiness: {
                ready: 1,
                partial: 0,
                insufficientEvidence: 0,
                unknown: 0,
              },
            }
          : null,
    );
    formatStageReadinessPromptContext.mockReturnValue(
      "ACCEPTED STAGE READINESS RESPONSE: one response is still open for review.",
    );

    const res = await POST(
      req({ moveId: "m-p4-technical", phase: 4, useCaseArchetype: "ams" }),
    );

    expect(res.status).toBe(202);
    expect(loadStageReadinessPromptContext).toHaveBeenCalledWith(
      expect.anything(),
      "m-p4-technical",
      4,
    );
    const decisionContext = (
      createCalls[0]?.jobPayload as { decisionContext: string }
    ).decisionContext;
    expect(decisionContext).toContain(
      "one response is still open for review",
    );
  });

  it("asks for no prompt block when the transition has no review at all", async () => {
    loadStageReadinessPromptContext.mockResolvedValue(null);
    formatStageReadinessPromptContext.mockReturnValue("");

    const res = await POST(
      req({ moveId: "m-p4-technical", phase: 4, useCaseArchetype: "ams" }),
    );

    expect(res.status).toBe(202);
    const decisionContext = (
      createCalls[0]?.jobPayload as { decisionContext: string }
    ).decisionContext;
    expect(decisionContext).not.toContain("ACCEPTED STAGE READINESS RESPONSE");
  });

  it("separates legitimate P3 reruns with an explicit generation attempt id", async () => {
    const first = await POST(
      req({
        moveId: "m-1",
        phase: 3,
        useCaseArchetype: "ams",
        generationAttemptId: "attempt-one",
      }),
    );
    const second = await POST(
      req({
        moveId: "m-1",
        phase: 3,
        useCaseArchetype: "ams",
        generationAttemptId: "attempt-two",
      }),
    );

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(sequentialCalls).toHaveLength(2);
    expect(sequentialCalls.map((call) => call.opts.idempotencyKey)).toEqual([
      "m-1:3:decision-hash-1:ctx-hash-1:extract-1:attempt-one",
      "m-1:3:decision-hash-1:ctx-hash-1:extract-1:attempt-two",
    ]);
    await expect(first.json()).resolves.toEqual(
      expect.objectContaining({ generationAttemptId: "attempt-one" }),
    );
    await expect(second.json()).resolves.toEqual(
      expect.objectContaining({ generationAttemptId: "attempt-two" }),
    );
  });

  it("blocks P3 before context extraction or enqueue when no option is approved", async () => {
    loadApprovedSolutionApproach.mockResolvedValueOnce(null);
    const res = await POST(
      req({
        moveId: "m-p3-unapproved",
        phase: 3,
        useCaseArchetype: "commercial_lending_agent_assist",
      }),
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        error: "solution_approach_approval_required",
      }),
    );
    expect(createMoveContextExtract).not.toHaveBeenCalled();
    expect(createCalls).toHaveLength(0);
  });

  it("fails closed before P3 enqueue when the validated route lacks approved evidence", async () => {
    listApprovedPhaseEvidence.mockResolvedValueOnce([]);
    const res = await POST(
      req({ moveId: "m-unverified-route", phase: 3, useCaseArchetype: "ams" }),
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(
      expect.objectContaining({ error: "solution_route_validation_required" }),
    );
    expect(createMoveContextExtract).not.toHaveBeenCalled();
    expect(createCalls).toHaveLength(0);
  });

  it("does not enqueue not-applicable or merged P3 artifacts for a straightforward dashboard use case", async () => {
    getModuleState.mockResolvedValueOnce(
      confirmedRouteModules("technical_product"),
    );
    loadApprovedSolutionApproach.mockResolvedValueOnce({
      decisionId: "decision-dashboard",
      decisionVersion: "1",
      decisionHash: "decision-hash-dashboard",
      selectedOptionId: "reuse",
      selectedOptionVersion: "1",
      chosenOption: "Reuse the approved dashboard pattern",
      approach: "Reusable dashboard pattern",
      options: [
        {
          id: "reuse",
          name: "Reusable dashboard pattern",
          summary: "Use existing governed reporting pattern.",
        },
      ],
      tradeoffsAccepted: ["No new platform or vendor selection"],
      rejectedOptions: [],
      scope: [],
      exclusions: [],
      assumptions: [],
      constraints: [],
      unresolvedDecisions: [],
      decision: {
        phase: 3,
        decision: "Approved solution option: reusable dashboard pattern",
        rationale: "One credible approved pattern exists.",
        approvedBy: "u1",
        approvedAt: "2026-07-23T00:00:00.000Z",
      },
    });
    const res = await POST(
      req({
        moveId: "m-dashboard",
        phase: 3,
        useCaseArchetype: "straightforward_dashboard",
        moveName: "Executive KPI Dashboard",
        clientDisplayName: "Client",
      }),
    );

    expect(res.status).toBe(202);
    const json = (await res.json()) as {
      adaptiveDepth: { complexityTier: string };
      deliverables: Array<{ deliverableTypeKey: string }>;
    };
    expect(json.adaptiveDepth.complexityTier).toBe("straightforward");
    expect(json.deliverables.map((d) => d.deliverableTypeKey)).toEqual([
      "target_state_architecture",
      "requirements_traceability",
    ]);
    expect(
      createCalls.map(
        (c) =>
          (c.jobPayload as { adaptiveDepth: { complexityTier: string } })
            .adaptiveDepth.complexityTier,
      ),
    ).toEqual(["straightforward", "straightforward"]);
  });

  it("queues P2 root-cause with its own type and canonical registry key", async () => {
    // P2 discovery and root-cause are sibling artifacts, not two copies of the
    // same discovery binder. The queue payload must preserve the registry key
    // and now routes root-cause through its own issue-tree brief.
    const res = await POST(
      req({
        moveId: "m-2",
        phase: 2,
        useCaseArchetype: "commercial_lending_agent_assist",
        moveName: "Commercial Lending Agent Assist",
        clientDisplayName: "First Capital",
      }),
    );
    expect(res.status).toBe(202);
    const json = (await res.json()) as {
      deliverables: Array<{
        deliverableTypeKey: string;
        deliverableType: string;
        status: string;
      }>;
    };
    const rootCauseResponse = json.deliverables.find(
      (d) => d.deliverableTypeKey === "root_cause_worksheet",
    );
    expect(rootCauseResponse).toEqual(
      expect.objectContaining({
        deliverableTypeKey: "root_cause_worksheet",
        deliverableType: "root_cause_worksheet",
        status: "queued",
      }),
    );

    const rootCauseCreate = createCalls.find(
      (c) =>
        (c.jobPayload as { deliverableTypeKey?: string }).deliverableTypeKey ===
        "root_cause_worksheet",
    );
    expect(rootCauseCreate).toEqual(
      expect.objectContaining({
        deliverableType: "root_cause_worksheet",
      }),
    );
    expect(rootCauseCreate?.jobPayload).toEqual(
      expect.objectContaining({
        deliverableTypeKey: "root_cause_worksheet",
        deliverableType: "root_cause_worksheet",
        sourceArtifactRef: "m-2",
      }),
    );
  });

  it("creates a candidate-preview extract only for an explicit acknowledged preview request", async () => {
    const res = await POST(
      req(
        {
          moveId: "m-preview",
          phase: 3,
          useCaseArchetype: "ams",
          contextExtract: {
            candidatePreview: {
              enabled: true,
              candidateVersionId:
                "skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run",
              acknowledgedNotActiveRuntimeTruth: true,
            },
          },
        },
        { "x-abarva-candidate-preview-mode": "enabled" },
      ),
    );
    expect(res.status).toBe(202);
    expect(createMoveContextExtract).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "m-preview",
        tenantKey: "skyharbor-air",
        candidatePreview: {
          enabled: true,
          candidateVersionId:
            "skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run",
          acknowledgedNotActiveRuntimeTruth: true,
        },
      }),
    );
  });

  it("strips the internal phase-label prefix from decisionContext before it reaches the model (regression 2026-07-09)", async () => {
    // Live-observed: decisionContext = "<move> — P4 Roadmap & Business Case: <purpose>"
    // reached the model prompt verbatim, and the model faithfully echoed "P4" into the
    // client-facing narrative ("...at this stage of the P4 roadmap...") — which the
    // non_mechanical_writing gate then correctly blocked as a leaked phase label. The
    // registry's phaseLabel must never reach decisionContext with its "P<n>" prefix intact.
    await POST(
      req({
        moveId: "m-4",
        phase: 4,
        useCaseArchetype: "risk_control",
        moveName: "Legal and Vendor Contract Obligation Control",
      }),
    );
    expect(createCalls.length).toBeGreaterThan(0);
    for (const c of createCalls) {
      const decisionContext = (c.jobPayload as { decisionContext: string })
        .decisionContext;
      expect(decisionContext).not.toMatch(
        /(?<![A-Za-z0-9-])P\d(?![A-Za-z0-9])/,
      );
    }
  });

  it("blocks the roadmap build until a human-reviewed deterministic estimate model is saved", async () => {
    getModuleState.mockResolvedValueOnce(
      confirmedRouteModules("process_change").filter(
        (module) => module.moduleKey !== "phase_4_estimates_capacity",
      ),
    );
    const res = await POST(
      req({ moveId: "m-estimate-open", phase: 4, useCaseArchetype: "ams" }),
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(
      expect.objectContaining({ error: "estimate_model_review_required" }),
    );
    expect(createMoveContextExtract).not.toHaveBeenCalled();
    expect(createCalls).toHaveLength(0);
  });

  it("passes calculated internal/vendor ranges and their reviewed basis to the roadmap build", async () => {
    const res = await POST(
      req({ moveId: "m-estimate-ready", phase: 4, useCaseArchetype: "ams" }),
    );

    expect(res.status).toBe(202);
    const decisionContext = (
      createCalls[0]?.jobPayload as { decisionContext: string }
    ).decisionContext;
    expect(decisionContext).toContain("DETERMINISTIC ROADMAP ESTIMATE MODEL");
    expect(decisionContext).toContain(
      "Read-only reporting foundation / Data engineer / internal",
    );
    expect(decisionContext).toContain(
      "Read-only reporting foundation / Data engineer / vendor",
    );
    expect(decisionContext).toContain("$1,100/$2,000/$2,900");
    expect(decisionContext).toContain("$1,650/$3,000/$4,350");
    expect(decisionContext).toContain("Reviewed by: Finance reviewer");
  });

  it("reports a per-deliverable error without aborting the batch, staying 202 if any queued", async () => {
    let n = 0;
    createBehavior = () => {
      n += 1;
      if (n === 1) throw new Error("boom");
      return { id: `run-${n}` };
    };
    const res = await POST(
      req({ moveId: "m-2", phase: 2, useCaseArchetype: "ams" }),
    );
    expect(res.status).toBe(202);
    const json = (await res.json()) as {
      queued: number;
      total: number;
      deliverables: Array<Record<string, unknown>>;
    };
    expect(json.queued).toBe(json.total - 1);
    expect(json.deliverables.some((d) => d.status === "error")).toBe(true);
  });

  it("500 when every deliverable fails to enqueue", async () => {
    createBehavior = () => {
      throw new Error("db down");
    };
    const res = await POST(
      req({ moveId: "m-3", phase: 1, useCaseArchetype: "ams" }),
    );
    expect(res.status).toBe(500);
  });

  it("403s before enqueueing when the Move belongs to another tenant", async () => {
    validateDeliverableTenantInvariant.mockResolvedValueOnce({
      ok: false,
      code: "tenant_mismatch",
      sourceKind: "move",
      sourceId: "m-fc",
      detail: "move source tenant does not match the active generation tenant.",
      expectedClientId: "client-lakeshore",
      expectedTenantKey: "lakeshore-holdings",
      actualClientId: "client-first-capital",
      actualTenantKey: "first-capital",
    });
    const res = await POST(
      req({ moveId: "m-fc", phase: 3, useCaseArchetype: "ams" }),
    );
    expect(res.status).toBe(403);
    expect(createCalls).toHaveLength(0);
    expect(createMoveContextExtract).not.toHaveBeenCalled();
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toBe("tenant_mismatch");
  });
});
