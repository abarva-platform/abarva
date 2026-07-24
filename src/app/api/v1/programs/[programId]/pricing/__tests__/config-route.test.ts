import { NextRequest } from "next/server";
const requireTenancyMock = jest.fn();
const getProgramByIdMock = jest.fn();
const getCurrentModelVersionMock = jest.fn();
const readEffortEnginePackMock = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) => getProgramByIdMock(ctx, programId),
}));
jest.mock("@/lib/pricing/effort-engine", () => ({
  getCurrentModelVersion: () => getCurrentModelVersionMock(),
  readEffortEnginePack: (v: number) => readEffortEnginePackMock(v),
}));
jest.mock("@/lib/pricing/moves-workflow", () => ({
  buildEstimateConfig: (pack: unknown) => ({ modelVersion: (pack as { modelVersion: number }).modelVersion, archetypes: [], requiredInputsByArchetype: {} }),
}));
const getCurrentRateCardMock = jest.fn();
jest.mock("@/lib/pricing/rate-card-repository", () => ({
  getCurrentRateCard: (...args: unknown[]) => getCurrentRateCardMock(...args),
}));
jest.mock("@/lib/pricing/governed-load/constants", () => ({
  CLIENT_ENTERPRISE_RATE_CARD_CODE: "ENTERPRISE",
}));

const ctx = { clientId: "client-1", clientKey: "apexretail", userId: "person-1" };
const program = { id: "move-1", name: "Contact center AI", archivedAt: null, deletedAt: null };

describe("GET /api/v1/programs/[programId]/pricing/config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancyMock.mockResolvedValue(ctx);
    getProgramByIdMock.mockResolvedValue(program);
    getCurrentModelVersionMock.mockResolvedValue({ version: 1 });
    readEffortEnginePackMock.mockResolvedValue({ modelVersion: 1 });
  });

  it("returns the estimate config for a Move the tenant can see", async () => {
    const { GET } = await import("../config/route");
    const res = await GET(new NextRequest("http://test/pricing/config"), { params: Promise.resolve({ programId: "move-1" }) });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, programId: "move-1", config: { modelVersion: 1 } });
  });

  it("returns not_found when the Move is outside the active tenant", async () => {
    getProgramByIdMock.mockResolvedValue(null);
    const { GET } = await import("../config/route");
    const res = await GET(new NextRequest("http://test/pricing/config"), { params: Promise.resolve({ programId: "move-1" }) });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "not_found" });
  });

  it("returns 503 when no PR4 reference pack has been loaded yet", async () => {
    getCurrentModelVersionMock.mockResolvedValue(null);
    const { GET } = await import("../config/route");
    const res = await GET(new NextRequest("http://test/pricing/config"), { params: Promise.resolve({ programId: "move-1" }) });
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ error: "pricing_model_not_loaded" });
  });
});
