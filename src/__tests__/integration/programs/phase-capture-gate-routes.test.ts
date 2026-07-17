const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const getProgramById = jest.fn();
const getModuleState = jest.fn();
const getPhaseSnapshots = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();
const getAzureWriteFluentClient = jest.fn();
const writeProgramAuditLogBestEffort = jest.fn();
const closeP0OnApproval = jest.fn();
const evaluateGate = jest.fn();
const advancePhase = jest.fn();
const ensurePhaseGateDeliverable = jest.fn();
const signOffDeliverable = jest.fn();
const saveGateDecisionArtifact = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById,
  getModuleState,
  getPhaseSnapshots,
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy,
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient,
}));

jest.mock("@/lib/programs/audit-log", () => ({
  writeProgramAuditLogBestEffort,
}));

jest.mock("@/lib/programs/origination-close", () => ({
  closeP0OnApproval,
}));

jest.mock("@/lib/programs/governance", () => ({
  evaluateGate,
}));

jest.mock("@/lib/programs/mutations", () => ({
  advancePhase,
  ensurePhaseGateDeliverable,
  signOffDeliverable,
}));

jest.mock("@/lib/programs/deliverables/gate-override-artifact", () => ({
  saveGateDecisionArtifact,
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/v1/programs/move_1/phase-capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeWriteClient() {
  const builder: Record<string, unknown> = {
    select: jest.fn(() => builder),
    single: jest.fn(async () => ({ data: { id: "snapshot_terminal" }, error: null })),
    eq: jest.fn(() => builder),
    in: jest.fn(async () => ({ data: [], error: null })),
    update: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => ({ data: null, error: null })),
    then: jest.fn((resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
    ),
  };
  return {
    from: jest.fn(() => builder),
    __builder: builder,
  };
}

const ctx = {
  clientId: "client_lakeshore",
  clientKey: "lakeshore",
  userId: "user_1",
  role: "admin",
  email: "lakeshore-agent@abarva.example.com",
};

const program = {
  id: "move_1",
  name: "Vendor Invoice Exception Handling Redesign",
  currentPhase: 0,
  charter: {},
  problemStatement: null,
  targetOutcome: null,
  gatesPassed: [],
};

describe("Moves signed-in phase capture/gate routes", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue(ctx);
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
    getProgramById.mockResolvedValue(program);
    getModuleState.mockResolvedValue([]);
    getPhaseSnapshots.mockResolvedValue([]);
    loadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: true });
    getAzureWriteFluentClient.mockReturnValue(makeWriteClient());
    writeProgramAuditLogBestEffort.mockResolvedValue(undefined);
    evaluateGate.mockResolvedValue({ pass: true, failedChecks: [] });
    advancePhase.mockResolvedValue({ programId: "move_1", newPhase: 2, snapshotId: "snapshot_1" });
    ensurePhaseGateDeliverable.mockResolvedValue({
      deliverableId: "deliverable_1",
      status: "in_review",
      created: true,
    });
    signOffDeliverable.mockResolvedValue(true);
    saveGateDecisionArtifact.mockResolvedValue(null);
    closeP0OnApproval.mockResolvedValue({
      briefEnsured: true,
      briefSigned: true,
      advanced: true,
      newPhase: 1,
      blockedBy: [],
    });
  });

  it("saves completed P0 capture sections into the durable capture path", async () => {
    const { POST } = await import(
      "@/app/api/v1/programs/[programId]/phase-capture/route"
    );
    const sections = {
      business_trigger: "AP exception volume is delaying close.",
      problem_statement: "Invoice exceptions are fragmented across email, ERP, and manual follow-up.",
      affected_function_process: "Back-office AP invoice exception handling.",
      initial_value_hypothesis: "Reduce cycle time, duplicate payments, and manual rework.",
      stakeholder_owner_view: "CIO, Finance Operations, AP manager, procurement operations.",
      known_evidence: "Uploaded exception logs, aging baseline, process notes, controls checklist, interviews.",
      missing_evidence_open_questions: "Final HR owner mapping and finance validation remain open.",
      recommendation_to_advance: "Advance to Charter with evidence caveats carried forward.",
    };
    const res = await POST(
      makeRequest({ phase: 0, sections, complete: true }) as never,
      { params: Promise.resolve({ programId: "move_1" }) },
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      phase: 0,
      persisted: true,
      generationEligibility: {
        captureComplete: true,
        gateApprovalRequired: true,
      },
    });
    expect(getAzureWriteFluentClient().from).toHaveBeenCalledWith("program_modules");
    const updateCalls = (getAzureWriteFluentClient().__builder.update as jest.Mock).mock.calls;
    expect(updateCalls).toEqual(
      expect.arrayContaining([
        [
          expect.objectContaining({
            charter: expect.objectContaining({
              evidence_family: sections.known_evidence,
              known_evidence: sections.known_evidence,
            }),
          }),
        ],
      ]),
    );
  });

  it("blocks capture completion when required sections are missing", async () => {
    const { POST } = await import(
      "@/app/api/v1/programs/[programId]/phase-capture/route"
    );
    const res = await POST(
      makeRequest({
        phase: 0,
        complete: true,
        sections: { business_trigger: "AP exception backlog" },
      }) as never,
      { params: Promise.resolve({ programId: "move_1" }) },
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "capture_incomplete",
      missing: expect.arrayContaining(["Problem statement"]),
    });
  });

  it("blocks gate approval when capture is incomplete", async () => {
    const { POST } = await import(
      "@/app/api/v1/programs/[programId]/phase-gate-approval/route"
    );
    const res = await POST(
      makeRequest({ phase: 0, rationale: "Approve" }) as never,
      { params: Promise.resolve({ programId: "move_1" }) },
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "capture_incomplete",
    });
    expect(closeP0OnApproval).not.toHaveBeenCalled();
  });

  it("repairs missing P0 capture rows from the saved Originate charter before approval", async () => {
    getProgramById.mockResolvedValue({
      ...program,
      name: "Member Service Agent Assist",
      problemStatement:
        "Members experience long calls because agents navigate multiple systems.",
      targetOutcome:
        "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
      timelineHorizon:
        "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
      charter: {
        scaffold: {
          problem_statement:
            "Members experience long calls because agents navigate multiple systems.",
          archetype: "Contact Center Agent Assist",
          sponsor_candidate: "Chief Digital and Information Officer",
          scope_boundary:
            "In: claims status, prior auth, eligibility, benefits, CRM history, knowledge lookup. Out: clinical decisions.",
          evidence_family:
            "Member-service metrics, call transcripts, CRM history, claims/auth/benefits samples, knowledge base, systems inventory.",
          value_hypothesis:
            "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
          foundation_readiness:
            "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
        },
      },
    });

    const { POST } = await import(
      "@/app/api/v1/programs/[programId]/phase-gate-approval/route"
    );
    const res = await POST(
      makeRequest({ phase: 0, rationale: "Sponsor approves P0." }) as never,
      { params: Promise.resolve({ programId: "move_1" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      phase: 0,
      approved: true,
      newPhase: 1,
    });
    const insertCalls = (getAzureWriteFluentClient().__builder.insert as jest.Mock).mock.calls;
    expect(insertCalls.length).toBeGreaterThanOrEqual(8);
    expect(insertCalls).toEqual(
      expect.arrayContaining([
        [
          expect.objectContaining({
            module_key: "phase_0_problem_statement",
            status: "completed",
            state_jsonb: expect.objectContaining({
              completed_from_origination_charter: true,
            }),
          }),
        ],
        [
          expect.objectContaining({
            module_key: "phase_0_recommendation_to_advance",
            status: "completed",
          }),
        ],
      ]),
    );
    expect(closeP0OnApproval).toHaveBeenCalled();
  });

  it("approves P0 through the existing close helper after capture is complete", async () => {
    getModuleState.mockResolvedValue(
      [
        "business_trigger",
        "problem_statement",
        "affected_function_process",
        "initial_value_hypothesis",
        "stakeholder_owner_view",
        "known_evidence",
        "missing_evidence_open_questions",
        "recommendation_to_advance",
      ].map((key) => ({
        moduleKey: `phase_0_${key}`,
        status: "completed",
        state: { value: key },
      })),
    );
    const { POST } = await import(
      "@/app/api/v1/programs/[programId]/phase-gate-approval/route"
    );
    const res = await POST(
      makeRequest({ phase: 0, rationale: "Sponsor approves P0." }) as never,
      { params: Promise.resolve({ programId: "move_1" }) },
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      phase: 0,
      approved: true,
      newPhase: 1,
    });
    expect(closeP0OnApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        programId: "move_1",
        tenantKey: "lakeshore",
        actorTenancy: expect.objectContaining({ clientKey: "lakeshore" }),
      }),
    );
  });

  it("approves P5 as the terminal Tower handoff instead of rejecting the phase", async () => {
    getProgramById.mockResolvedValue({
      ...program,
      currentPhase: 5,
    });
    getModuleState.mockResolvedValue(
      [
        "mobilization_plan",
        "launch_readiness",
        "value_proof_rules",
        "first_90_days",
        "governance_cadence",
        "risks_open_items",
        "recommendation",
      ].map((key) => ({
        moduleKey: `phase_5_${key}`,
        status: "completed",
        state: { value: key },
      })),
    );
    const { POST } = await import(
      "@/app/api/v1/programs/[programId]/phase-gate-approval/route"
    );
    const res = await POST(
      makeRequest({ phase: 5, rationale: "Sponsor accepts Tower handoff." }) as never,
      { params: Promise.resolve({ programId: "move_1" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      phase: 5,
      approved: true,
      newPhase: 6,
      terminalHandoff: true,
    });
    expect(ensurePhaseGateDeliverable).toHaveBeenCalledWith(
      expect.anything(),
      "move_1",
      expect.objectContaining({ deliverableTypeKey: "handoff_package" }),
      expect.anything(),
    );
    expect(ensurePhaseGateDeliverable).toHaveBeenCalledWith(
      expect.anything(),
      "move_1",
      expect.objectContaining({ deliverableTypeKey: "value_measurement_contract" }),
      expect.anything(),
    );
    expect(advancePhase).not.toHaveBeenCalled();
    expect(getAzureWriteFluentClient().from).toHaveBeenCalledWith("phase_snapshots");
    const updateCalls = (getAzureWriteFluentClient().__builder.update as jest.Mock).mock.calls;
    expect(updateCalls).toEqual(
      expect.arrayContaining([
        [
          expect.objectContaining({
            lifecycle_state: "completed",
          }),
        ],
      ]),
    );
    expect(updateCalls).not.toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ current_phase: 6 })],
      ]),
    );
  });
});

export {};
