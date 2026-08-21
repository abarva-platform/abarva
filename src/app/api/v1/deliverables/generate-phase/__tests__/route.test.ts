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
      freshness: { evidenceFingerprint: "ctx-hash-1" },
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
jest.mock("@/lib/programs/approved-solution-approach", () => ({
  loadApprovedSolutionApproach: () => loadApprovedSolutionApproach(),
  formatApprovedSolutionApproach: (approved: { chosenOption: string }) =>
    `APPROVED SOLUTION APPROACH - AUTHORITATIVE INPUT\nChosen option: ${approved.chosenOption}\nBuild only to the approved option.`,
  ARCHITECTURE_MODEL_VERSION: "moves-architecture-model-v2",
}));

import { POST } from "../route";

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
        idempotencyKey: "m-1:3:decision-hash-1:ctx-hash-1:extract-1",
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
        }),
      );
    }
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
