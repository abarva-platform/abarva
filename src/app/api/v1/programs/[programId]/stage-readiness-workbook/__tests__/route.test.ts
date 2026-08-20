const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockLoadDiscoveryEvidenceReadiness = jest.fn();
const mockBuildMoveEvidenceNeedPackets = jest.fn();
const mockBuildStageReadinessWorkbookSpec = jest.fn();
const mockRenderStageReadinessWorkbookXlsx = jest.fn();

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

export {};
