import type { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockBuildSummary = jest.fn();
const mockIsFeatureEnabled = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (error: unknown) => {
    throw error;
  },
}));

jest.mock("@/lib/programs/phase-intelligence-summary", () => ({
  buildPhaseIntelligenceSummary: (ctx: unknown, input: unknown) =>
    mockBuildSummary(ctx, input),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (tenant: unknown, key: string) =>
    mockIsFeatureEnabled(tenant, key),
}));

const ctx = {
  clientId: "tenant-1",
  clientKey: "demo-app",
  userId: "operator-1",
};
const params = Promise.resolve({ programId: "move-1" });

function req(query: string): NextRequest {
  return {
    nextUrl: new URL(
      `https://example.test/api/v1/programs/move-1/phase-intelligence?${query}`,
    ),
  } as NextRequest;
}

describe("phase intelligence evaluator readback", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue(ctx);
    mockBuildSummary.mockResolvedValue({
      ok: true,
      moveId: "move-1",
      phase: 2,
      items: [],
    });
  });

  it("keeps the ordinary response unchanged when readback was not requested", async () => {
    const { GET } = await import("../route");
    const response = await GET(req("phase=2"), { params });
    expect(response.status).toBe(200);
    expect(mockBuildSummary).toHaveBeenCalledWith(ctx, {
      moveId: "move-1",
      phase: 2,
      includeGateReadback: false,
    });
    expect(mockIsFeatureEnabled).not.toHaveBeenCalled();
  });

  it("refuses the extra readback when the step-page flag is off", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const { GET } = await import("../route");
    await GET(req("phase=2&includeGateReadback=1"), { params });
    expect(mockBuildSummary).toHaveBeenCalledWith(ctx, {
      moveId: "move-1",
      phase: 2,
      includeGateReadback: false,
    });
  });

  it("exposes readback only for the flagged tenant and explicit request", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { GET } = await import("../route");
    await GET(req("phase=2&includeGateReadback=1"), { params });
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_step_pages_v3",
    );
    expect(mockBuildSummary).toHaveBeenCalledWith(ctx, {
      moveId: "move-1",
      phase: 2,
      includeGateReadback: true,
    });
  });
});
