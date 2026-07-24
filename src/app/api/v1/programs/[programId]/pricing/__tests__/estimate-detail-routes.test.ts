import { NextRequest } from "next/server";
const requireTenancyMock = jest.fn();
const getProgramByIdMock = jest.fn();
const getEstimateMock = jest.fn();
const listEstimateInputsMock = jest.fn();
const listLineItemsMock = jest.fn();
const upsertEstimateInputsMock = jest.fn();
const updateEstimateHeaderMock = jest.fn();
const listRequiredDriverCodesForArchetypeMock = jest.fn();
const validateEstimateForRunMock = jest.fn();
const readEffortEnginePackMock = jest.fn();
const runEstimateMock = jest.fn();

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
  readEffortEnginePack: (v: number) => readEffortEnginePackMock(v),
}));

class FakeEstimateNotReadyError extends Error {
  constructor(public readonly blockingReasons: { inputKey: string; reason: string }[]) {
    super("estimate_not_ready");
  }
}
class FakeEstimateNotFoundError extends Error {}
class FakeEstimateTenantMismatchError extends Error {}

jest.mock("@/lib/pricing/moves-workflow", () => ({
  getEstimate: (id: string) => getEstimateMock(id),
  listEstimateInputs: (id: string) => listEstimateInputsMock(id),
  listLineItems: (id: string) => listLineItemsMock(id),
  upsertEstimateInputs: (id: string, inputs: unknown) => upsertEstimateInputsMock(id, inputs),
  updateEstimateHeader: (id: string, patch: unknown) => updateEstimateHeaderMock(id, patch),
  listRequiredDriverCodesForArchetype: (pack: unknown, code: string) => listRequiredDriverCodesForArchetypeMock(pack, code),
  validateEstimateForRun: (header: unknown, keys: unknown, inputs: unknown) => validateEstimateForRunMock(header, keys, inputs),
  runEstimate: (opts: unknown) => runEstimateMock(opts),
  EstimateNotReadyError: FakeEstimateNotReadyError,
  EstimateNotFoundError: FakeEstimateNotFoundError,
  EstimateTenantMismatchError: FakeEstimateTenantMismatchError,
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
  target_start_date: "2026-09-01",
  target_duration_weeks: 12,
  selected_rate_card_id: "rc-1",
  status: "draft",
  last_run_id: null,
  last_run_at: null,
  created_by: "person-1",
  created_at: "2026-07-24T00:00:00Z",
  updated_at: "2026-07-24T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue(ctx);
  getProgramByIdMock.mockResolvedValue(program);
  getEstimateMock.mockResolvedValue(estimateRow);
});

describe("GET /api/v1/programs/[programId]/pricing/estimates/[estimateId]", () => {
  it("returns the draft state — estimate, inputs, and whether a run has ever completed", async () => {
    listEstimateInputsMock.mockResolvedValue([]);
    listLineItemsMock.mockResolvedValue([]);
    const { GET } = await import("../estimates/[estimateId]/route");
    const res = await GET(new NextRequest("http://test"), { params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }) });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, estimate: { id: "estimate-1" }, hasRun: false });
  });

  it("404s when the estimate belongs to a different tenant", async () => {
    getEstimateMock.mockResolvedValue({ ...estimateRow, tenant_key: "meridian-health" });
    const { GET } = await import("../estimates/[estimateId]/route");
    const res = await GET(new NextRequest("http://test"), { params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }) });
    expect(res.status).toBe(404);
  });

  it("404s when the estimate belongs to a different Move", async () => {
    getEstimateMock.mockResolvedValue({ ...estimateRow, move_id: "move-999" });
    const { GET } = await import("../estimates/[estimateId]/route");
    const res = await GET(new NextRequest("http://test"), { params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }) });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/programs/[programId]/pricing/estimates/[estimateId]/inputs", () => {
  it("upserts inputs and reports a bad_request for a missing sourceType", async () => {
    const { PATCH } = await import("../estimates/[estimateId]/inputs/route");
    const badRes = await PATCH(
      new NextRequest("http://test", { method: "PATCH", body: JSON.stringify({ inputs: [{ inputKey: "integration_count", value: 4 }] }) }),
      { params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }) },
    );
    expect(badRes.status).toBe(400);
    expect(upsertEstimateInputsMock).not.toHaveBeenCalled();
  });

  it("saves confirmed inputs, resolving confirmedBy from the SESSION, never from the request body", async () => {
    upsertEstimateInputsMock.mockResolvedValue([
      { id: "i1", estimate_id: "estimate-1", input_key: "integration_count", value: 4, unit: null, required: true, source_type: "client_input", source_ref: null, confidence: null, confirmed_by: "person-1", confirmed_at: "now", override_reason: null, model_version: 1, created_at: "now", updated_at: "now" },
    ]);
    const { PATCH } = await import("../estimates/[estimateId]/inputs/route");
    const res = await PATCH(
      new NextRequest("http://test", {
        method: "PATCH",
        // A client-supplied confirmedBy/actor identity is deliberately NOT
        // part of the contract — only a boolean `confirm` flag is accepted.
        body: JSON.stringify({ inputs: [{ inputKey: "integration_count", value: 4, sourceType: "client_input", confirm: true }] }),
      }),
      { params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }) },
    );
    expect(res.status).toBe(200);
    expect(upsertEstimateInputsMock).toHaveBeenCalledWith("estimate-1", [
      expect.objectContaining({ inputKey: "integration_count", value: 4, sourceType: "client_input", confirmedBy: "person-1" }),
    ]);
  });

  it("also accepts a header patch for step-1 fields", async () => {
    const { PATCH } = await import("../estimates/[estimateId]/inputs/route");
    const res = await PATCH(
      new NextRequest("http://test", { method: "PATCH", body: JSON.stringify({ header: { currency: "EUR" } }) }),
      { params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }) },
    );
    expect(res.status).toBe(200);
    expect(updateEstimateHeaderMock).toHaveBeenCalledWith("estimate-1", expect.objectContaining({ currency: "EUR" }));
  });
});

describe("POST /api/v1/programs/[programId]/pricing/estimates/[estimateId]/validate", () => {
  it("returns ready:true with no blocking reasons once the gate passes", async () => {
    readEffortEnginePackMock.mockResolvedValue({ modelVersion: 1 });
    listRequiredDriverCodesForArchetypeMock.mockReturnValue(["integration_count"]);
    listEstimateInputsMock.mockResolvedValue([]);
    validateEstimateForRunMock.mockReturnValue({ ready: true, blockingReasons: [], requiredInputKeys: ["integration_count"] });

    const { POST } = await import("../estimates/[estimateId]/validate/route");
    const res = await POST(new NextRequest("http://test", { method: "POST" }), {
      params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, ready: true, blockingReasons: [] });
  });

  it("returns ready:false with blocking reasons — this is a 200, not an error", async () => {
    readEffortEnginePackMock.mockResolvedValue({ modelVersion: 1 });
    listRequiredDriverCodesForArchetypeMock.mockReturnValue(["integration_count"]);
    listEstimateInputsMock.mockResolvedValue([]);
    validateEstimateForRunMock.mockReturnValue({
      ready: false,
      blockingReasons: [{ inputKey: "integration_count", reason: "not confirmed" }],
      requiredInputKeys: ["integration_count"],
    });

    const { POST } = await import("../estimates/[estimateId]/validate/route");
    const res = await POST(new NextRequest("http://test", { method: "POST" }), {
      params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, ready: false, blockingReasons: [{ inputKey: "integration_count" }] });
  });
});

describe("POST /api/v1/programs/[programId]/pricing/estimates/[estimateId]/run", () => {
  it("returns the execution result when the gate passes", async () => {
    runEstimateMock.mockResolvedValue({ estimateId: "estimate-1", runId: "run-1", totals: { totalCostCents: 100 } });
    const { POST } = await import("../estimates/[estimateId]/run/route");
    const res = await POST(new NextRequest("http://test", { method: "POST" }), {
      params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, result: { estimateId: "estimate-1", runId: "run-1" } });
  });

  it("409s with blocking reasons when the estimate is not ready", async () => {
    runEstimateMock.mockRejectedValue(new FakeEstimateNotReadyError([{ inputKey: "integration_count", reason: "not confirmed" }]));
    const { POST } = await import("../estimates/[estimateId]/run/route");
    const res = await POST(new NextRequest("http://test", { method: "POST" }), {
      params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }),
    });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "estimate_not_ready",
      blockingReasons: [{ inputKey: "integration_count" }],
    });
  });
});
