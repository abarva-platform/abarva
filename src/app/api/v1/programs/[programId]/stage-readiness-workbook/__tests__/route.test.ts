const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockLoadDiscoveryEvidenceReadiness = jest.fn();
const mockBuildMoveEvidenceNeedPackets = jest.fn();
const mockBuildStageReadinessWorkbookSpec = jest.fn();
const mockRenderStageReadinessWorkbookXlsx = jest.fn();
const mockParseStageReadinessWorkbookXlsx = jest.fn();
const mockPersistStageReadinessProposalSet = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
}));

jest.mock("@/lib/programs/discovery/evidence-readiness", () => ({
  loadDiscoveryEvidenceReadiness: (ctx: unknown, programId: string) =>
    mockLoadDiscoveryEvidenceReadiness(ctx, programId),
}));

jest.mock(
  "@/lib/programs/evidence-readiness/move-evidence-need-packet",
  () => ({
    buildMoveEvidenceNeedPackets: (input: unknown) =>
      mockBuildMoveEvidenceNeedPackets(input),
  }),
);

jest.mock("@/lib/programs/stage-readiness-workbooks/resolver", () => ({
  buildStageReadinessWorkbookSpec: (input: unknown) =>
    mockBuildStageReadinessWorkbookSpec(input),
}));

jest.mock("@/lib/programs/stage-readiness-workbooks/xlsx", () => ({
  renderStageReadinessWorkbookXlsx: (spec: unknown) =>
    mockRenderStageReadinessWorkbookXlsx(spec),
}));

jest.mock("@/lib/programs/stage-readiness-workbooks/parser", () => ({
  parseStageReadinessWorkbookXlsx: (input: unknown, options: unknown) =>
    mockParseStageReadinessWorkbookXlsx(input, options),
}));

jest.mock("@/lib/programs/stage-readiness-workbooks/proposals", () => ({
  persistStageReadinessProposalSet: (input: unknown) =>
    mockPersistStageReadinessProposalSet(input),
}));

const params = Promise.resolve({ programId: "move-1" });
const ctx = {
  clientId: "client-1",
  clientKey: "tenant-1",
  userId: "person-1",
};

function req(
  url = "http://test/api/v1/programs/move-1/stage-readiness-workbook",
) {
  return new Request(url);
}

function uploadReq(
  url = "http://test/api/v1/programs/move-1/stage-readiness-workbook",
) {
  const form = new FormData();
  form.set("file", new File([Buffer.from("xlsx")], "workbook.xlsx"));
  return new Request(url, { method: "POST", body: form });
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(ctx);
  mockGetProgramById.mockResolvedValue({
    id: "move-1",
    name: "Predictive Reliability",
    currentPhase: 1,
    archivedAt: null,
    deletedAt: null,
  });
  mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
    archetypeLabel: "Data-Intensive Predictive Use Case",
  });
  mockBuildMoveEvidenceNeedPackets.mockReturnValue([
    { familyId: "kpi_baseline" },
  ]);
  mockBuildStageReadinessWorkbookSpec.mockReturnValue({
    workbookId: "move-1:p1-p2:stage-readiness",
    metadata: { workbookContentHash: "abc123" },
  });
  mockRenderStageReadinessWorkbookXlsx.mockResolvedValue(Buffer.from("xlsx"));
  mockParseStageReadinessWorkbookXlsx.mockResolvedValue({
    ok: true,
    metadata: {
      workbookId: "move-1:p1-p2:stage-readiness",
      moveId: "move-1",
      phase: 1,
      nextPhase: 2,
    },
    responses: [
      {
        questionId: "q-1",
        dimensionId: "business_process",
        response: "Confirmed",
      },
    ],
    issues: [],
    summary: {
      totalQuestions: 1,
      answeredQuestions: 1,
      requiredAnswered: 1,
      requiredTotal: 1,
      warningCount: 0,
      errorCount: 0,
    },
  });
  mockPersistStageReadinessProposalSet.mockResolvedValue({
    artifactId: "proposal-artifact-1",
    artifactVersion: 1,
    blobStored: true,
    proposalSet: {
      proposalSetId: "proposal-set-1",
      summary: {
        proposalCount: 1,
        pendingCount: 1,
        answerStates: {
          answered: 1,
          unknown: 0,
          insufficient_evidence: 0,
          blank: 0,
        },
      },
    },
  });
});

describe("GET /api/v1/programs/[programId]/stage-readiness-workbook", () => {
  it("renders a deterministic XLSX workbook for the current phase", async () => {
    const { GET } = await import("../route");
    const res = await GET(req(), { params });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers.get("content-disposition")).toContain(
      "predictive-reliability-p1-p2-readiness-workbook.xlsx",
    );
    expect(res.headers.get("x-abarva-workbook-id")).toBe(
      "move-1:p1-p2:stage-readiness",
    );
    await expect(res.arrayBuffer()).resolves.toHaveProperty("byteLength", 4);

    expect(mockBuildMoveEvidenceNeedPackets).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "move-1",
        moveName: "Predictive Reliability",
        currentPhase: 1,
      }),
    );
    expect(mockBuildStageReadinessWorkbookSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "move-1",
        phase: 1,
        nextPhase: 2,
        archetype: "Data-Intensive Predictive Use Case",
      }),
    );
  });

  it("allows an explicit phase query within the transition range", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      req(
        "http://test/api/v1/programs/move-1/stage-readiness-workbook?phase=3",
      ),
      { params },
    );

    expect(res.status).toBe(200);
    expect(mockBuildStageReadinessWorkbookSpec).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 3, nextPhase: 4 }),
    );
  });

  it("rejects phases outside supported next-phase transitions", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      req(
        "http://test/api/v1/programs/move-1/stage-readiness-workbook?phase=5",
      ),
      { params },
    );

    expect(res.status).toBe(400);
    expect(mockRenderStageReadinessWorkbookXlsx).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/programs/[programId]/stage-readiness-workbook", () => {
  it("stores an uploaded workbook as a pending proposal set without accepting the responses", async () => {
    const { POST } = await import("../route");
    const res = await POST(uploadReq(), { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      metadata: {
        workbookId: "move-1:p1-p2:stage-readiness",
        moveId: "move-1",
      },
      summary: { totalQuestions: 1, answeredQuestions: 1 },
      proposalSet: {
        proposalSetId: "proposal-set-1",
        artifactId: "proposal-artifact-1",
        status: "review_required",
        proposalCount: 1,
        pendingCount: 1,
        message:
          "Workbook responses were stored as pending proposals. They do not feed P2 until accepted.",
      },
    });
    expect(mockParseStageReadinessWorkbookXlsx).toHaveBeenCalledWith(
      expect.any(Buffer),
      { expectedMoveId: "move-1", expectedPhase: 1 },
    );
    expect(mockPersistStageReadinessProposalSet).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx,
        parsed: expect.objectContaining({ ok: true }),
        uploadedWorkbookSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(mockBuildStageReadinessWorkbookSpec).not.toHaveBeenCalled();
    expect(mockRenderStageReadinessWorkbookXlsx).not.toHaveBeenCalled();
  });

  it("returns 422 when workbook metadata does not match the route context", async () => {
    mockParseStageReadinessWorkbookXlsx.mockResolvedValueOnce({
      ok: false,
      metadata: {
        workbookId: "other:p1-p2:stage-readiness",
        moveId: "other",
        phase: 1,
        nextPhase: 2,
      },
      responses: [],
      issues: [
        {
          severity: "error",
          code: "move_mismatch",
          message:
            "Workbook moveId other does not match expected moveId move-1.",
        },
      ],
      summary: {
        totalQuestions: 0,
        answeredQuestions: 0,
        requiredAnswered: 0,
        requiredTotal: 0,
        warningCount: 0,
        errorCount: 1,
      },
    });

    const { POST } = await import("../route");
    const res = await POST(uploadReq(), { params });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "move_mismatch" })],
      proposalSet: null,
    });
    expect(mockPersistStageReadinessProposalSet).not.toHaveBeenCalled();
  });

  it("rejects requests without a workbook file", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      new Request(
        "http://test/api/v1/programs/move-1/stage-readiness-workbook",
        {
          method: "POST",
          body: new FormData(),
        },
      ),
      { params },
    );

    expect(res.status).toBe(400);
    expect(mockParseStageReadinessWorkbookXlsx).not.toHaveBeenCalled();
  });
});

export {};
