import { NextRequest } from "next/server";
const requireTenancyMock = jest.fn();
const getProgramByIdMock = jest.fn();
const getCurrentModelVersionMock = jest.fn();
const createDraftEstimateMock = jest.fn();
const getEstimateMock = jest.fn();

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
}));
jest.mock("@/lib/pricing/moves-workflow", () => ({
  createDraftEstimate: (input: unknown) => createDraftEstimateMock(input),
  getEstimate: (id: string) => getEstimateMock(id),
}));

const ctx = { clientId: "client-1", clientKey: "apexretail", userId: "person-1" };
const program = { id: "move-1", name: "Contact center AI", archivedAt: null, deletedAt: null };
const estimateRow = {
  id: "estimate-1",
  tenant_key: "apex-retail",
  move_id: "move-1",
  scenario_group_id: "group-1",
  scenario_name: "Traditional",
  scenario_key: "traditional",
  archetype_code: "ARCH-01",
  model_version: 1,
  currency: "USD",
  target_start_date: null,
  target_duration_weeks: null,
  selected_rate_card_id: null,
  status: "draft",
  last_run_id: null,
  last_run_at: null,
  created_by: "person-1",
  created_at: "2026-07-24T00:00:00Z",
  updated_at: "2026-07-24T00:00:00Z",
};

describe("POST /api/v1/programs/[programId]/pricing/estimates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancyMock.mockResolvedValue(ctx);
    getProgramByIdMock.mockResolvedValue(program);
    getCurrentModelVersionMock.mockResolvedValue({ version: 1 });
    createDraftEstimateMock.mockResolvedValue(estimateRow);
  });

  function postWithBody(body: unknown) {
    return new NextRequest("http://test/pricing/estimates", { method: "POST", body: JSON.stringify(body) });
  }

  it("creates a draft, canonicalizing the tenant key at the write boundary", async () => {
    const { POST } = await import("../estimates/route");
    const res = await POST(postWithBody({ scenarioName: "Traditional", archetypeCode: "ARCH-01" }), {
      params: Promise.resolve({ programId: "move-1" }),
    });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ ok: true, estimate: { id: "estimate-1", scenarioName: "Traditional" } });
    expect(createDraftEstimateMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenantKey: "apex-retail", moveId: "move-1", scenarioName: "Traditional", archetypeCode: "ARCH-01", modelVersion: 1 }),
    );
  });

  it("400s when scenarioName is missing", async () => {
    const { POST } = await import("../estimates/route");
    const res = await POST(postWithBody({ archetypeCode: "ARCH-01" }), { params: Promise.resolve({ programId: "move-1" }) });
    expect(res.status).toBe(400);
    expect(createDraftEstimateMock).not.toHaveBeenCalled();
  });

  it("400s when archetypeCode is missing", async () => {
    const { POST } = await import("../estimates/route");
    const res = await POST(postWithBody({ scenarioName: "Traditional" }), { params: Promise.resolve({ programId: "move-1" }) });
    expect(res.status).toBe(400);
  });

  it("404s when the Move is not visible to the tenant", async () => {
    getProgramByIdMock.mockResolvedValue(null);
    const { POST } = await import("../estimates/route");
    const res = await POST(postWithBody({ scenarioName: "Traditional", archetypeCode: "ARCH-01" }), {
      params: Promise.resolve({ programId: "move-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("503s when no PR4 reference pack has been loaded yet", async () => {
    getCurrentModelVersionMock.mockResolvedValue(null);
    const { POST } = await import("../estimates/route");
    const res = await POST(postWithBody({ scenarioName: "Traditional", archetypeCode: "ARCH-01" }), {
      params: Promise.resolve({ programId: "move-1" }),
    });
    expect(res.status).toBe(503);
  });
});
