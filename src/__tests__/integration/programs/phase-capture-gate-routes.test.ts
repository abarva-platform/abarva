const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const getProgramById = jest.fn();
const getModuleState = jest.fn();
const getPhaseSnapshots = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();
const getAzureWriteFluentClient = jest.fn();
const writeProgramAuditLogBestEffort = jest.fn();
const closeP0OnApproval = jest.fn();

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
  evaluateGate: jest.fn(),
}));

jest.mock("@/lib/programs/mutations", () => ({
  advancePhase: jest.fn(),
}));

jest.mock("@/lib/programs/deliverables/gate-override-artifact", () => ({
  saveGateDecisionArtifact: jest.fn(),
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
    eq: jest.fn(() => builder),
    in: jest.fn(async () => ({ data: [], error: null })),
    update: jest.fn(() => builder),
    insert: jest.fn(async () => ({ data: null, error: null })),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => ({ data: null, error: null })),
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
});

export {};
