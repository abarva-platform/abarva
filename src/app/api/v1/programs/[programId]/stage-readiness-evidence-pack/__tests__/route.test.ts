const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockIsFoundationTenantKey = jest.fn();
const mockLoadDiscoveryEvidenceReadiness = jest.fn();
const mockBuildMoveEvidenceNeedPackets = jest.fn();
const mockBuildStageReadinessWorkbookSpec = jest.fn();
const mockRenderSyntheticStageReadinessEvidencePackZip = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/tenant/foundation-tenants", () => ({
  isFoundationTenantKey: (tenantKey: string | null | undefined) =>
    mockIsFoundationTenantKey(tenantKey),
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

jest.mock(
  "@/lib/programs/stage-readiness-workbooks/synthetic-evidence-pack",
  () => ({
    renderSyntheticStageReadinessEvidencePackZip: (spec: unknown) =>
      mockRenderSyntheticStageReadinessEvidencePackZip(spec),
  }),
);

const params = Promise.resolve({ programId: "move-1" });
const ctx = {
  clientId: "client-1",
  clientKey: "foundation-demo",
  userId: "person-1",
};

function req(
  url = "http://test/api/v1/programs/move-1/stage-readiness-evidence-pack",
) {
  return new Request(url);
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(ctx);
  mockIsFoundationTenantKey.mockReturnValue(true);
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
  });
  mockRenderSyntheticStageReadinessEvidencePackZip.mockResolvedValue(
    Buffer.from("zip"),
  );
});

describe("GET /api/v1/programs/[programId]/stage-readiness-evidence-pack", () => {
  it("renders a synthetic zip pack for foundation/demo tenants", async () => {
    const { GET } = await import("../route");
    const res = await GET(req(), { params });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(res.headers.get("content-disposition")).toContain(
      "predictive-reliability-p1-p2-synthetic-evidence-pack.zip",
    );
    expect(res.headers.get("x-abarva-evidence-pack")).toBe("synthetic-demo");
    await expect(res.text()).resolves.toBe("zip");
    expect(mockBuildStageReadinessWorkbookSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "move-1",
        phase: 1,
        nextPhase: 2,
      }),
    );
    expect(mockRenderSyntheticStageReadinessEvidencePackZip).toHaveBeenCalledWith(
      { workbookId: "move-1:p1-p2:stage-readiness" },
    );
  });

  it("does not expose synthetic sample packs outside foundation/demo tenants", async () => {
    mockIsFoundationTenantKey.mockReturnValue(false);
    const { GET } = await import("../route");
    const res = await GET(req(), { params });

    expect(res.status).toBe(403);
    expect(mockGetProgramById).not.toHaveBeenCalled();
    expect(mockRenderSyntheticStageReadinessEvidencePackZip).not.toHaveBeenCalled();
  });
});

export {};
