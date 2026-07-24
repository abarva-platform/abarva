import { NextRequest } from "next/server";

const requireTenancyMock = jest.fn();
const getProgramByIdMock = jest.fn();
const getEstimateMock = jest.fn();
const listEstimateInputsMock = jest.fn();
const updateEstimateHeaderMock = jest.fn();
const runEstimateMock = jest.fn();
const createEstimateSnapshotMock = jest.fn();
const getCurrentTaxonomyVersionMock = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) => getProgramByIdMock(ctx, programId),
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
  updateEstimateHeader: (id: string, patch: unknown) => updateEstimateHeaderMock(id, patch),
  runEstimate: (opts: unknown) => runEstimateMock(opts),
  EstimateNotReadyError: FakeEstimateNotReadyError,
  EstimateNotFoundError: FakeEstimateNotFoundError,
  EstimateTenantMismatchError: FakeEstimateTenantMismatchError,
}));

class FakeSelfApprovalViolationError extends Error {
  constructor(public readonly approvedBy: string, public readonly preparedBy: string) {
    super(`self_approval_violation: '${approvedBy}' === '${preparedBy}'`);
  }
}
class FakeUnresolvedRateGapError extends Error {
  constructor(public readonly gapCount: number) {
    super(`unresolved_rate_gap: ${gapCount} line item(s)`);
  }
}

jest.mock("@/lib/pricing/effort-engine/snapshot-service", () => ({
  createEstimateSnapshot: (candidate: unknown) => createEstimateSnapshotMock(candidate),
  resolvePreparedBy: (estimate: { created_by: string | null }, inputs: { confirmed_by: string | null; confirmed_at: string | null }[]) => {
    const confirmed = inputs.filter((i) => i.confirmed_by && i.confirmed_at).sort((a, b) => (a.confirmed_at! > b.confirmed_at! ? -1 : 1));
    return confirmed[0]?.confirmed_by ?? estimate.created_by ?? null;
  },
  toScopeFingerprintInput: (row: { input_key: string; value: unknown; confirmed_at: string | null; override_reason: string | null; confidence: string | null }) => ({
    inputKey: row.input_key,
    value: row.value,
    confirmedAt: row.confirmed_at,
    overrideReason: row.override_reason,
    confidence: row.confidence,
  }),
  SelfApprovalViolationError: FakeSelfApprovalViolationError,
  UnresolvedRateGapError: FakeUnresolvedRateGapError,
}));

jest.mock("@/lib/pricing/reference-repository", () => ({
  getCurrentTaxonomyVersion: () => getCurrentTaxonomyVersionMock(),
}));

const ctx = { clientId: "client-1", clientKey: "apexretail", userId: "approver-1" };
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
  status: "ready_for_review",
  last_run_id: "run-1",
  last_run_at: "2026-07-24T00:00:00Z",
  created_by: "preparer-1",
  created_at: "2026-07-24T00:00:00Z",
  updated_at: "2026-07-24T00:00:00Z",
};

const runResult = {
  estimateId: "estimate-1",
  runId: "run-2",
  ranAt: "2026-07-24T06:00:00Z",
  modelVersion: 1,
  scenarioKey: "traditional",
  archetypeCode: "ARCH-01",
  totals: {
    totalRawHours: 1000,
    totalExpectedHours: 950,
    totalLaborCostCents: 5_000_000,
    totalManualCostCents: 500_000,
    totalCostCents: 5_500_000,
    gapCount: 0,
  },
  range: {
    policyCode: "RANGE-DEFAULT",
    policyName: "Default range policy",
    score: 0.5,
    lowCents: 4_400_000,
    expectedCents: 5_500_000,
    highCents: 6_600_000,
  },
  costByActivityPack: [],
  costByRole: [],
  internalVsExternal: { internalCostCents: 0, externalCostCents: 0, unknownCostCents: 0 },
  cashVsAbsorbedCapacity: { cashCostCents: 0, absorbedCapacityCostCents: 0, unknownCostCents: 0 },
  oneTimeVsRecurring: { oneTimeCostCents: 0, recurringCostCents: 0 },
  changeAdoptionBreakdown: [],
  technologyThirdPartyCostCents: 0,
  rateCardCoverage: { coveragePct: 100, directCount: 1, inheritedCount: 0, missingCount: 0 },
  topAssumptions: [],
  topUncertaintyDrivers: [],
  lineItems: [],
};

const snapshotRow = {
  id: "snapshot-1",
  tenant_key: "apex-retail",
  move_id: "move-1",
  estimate_id: "estimate-1",
  model_version: 1,
  taxonomy_version: 1,
  rate_card_version_id: "rc-1",
  client_profile_version_id: null,
  upstream_scope_fingerprint: "fingerprint-hash",
  totals: { currency: "USD", range: runResult.range, topAssumptions: [], topUncertaintyDrivers: [] },
  status: "approved",
  approved_by: "approver-1",
  approved_at: "2026-07-24T06:00:00Z",
  approval_rationale: "Reviewed and holds up.",
  created_at: "2026-07-24T06:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue(ctx);
  getProgramByIdMock.mockResolvedValue(program);
  getEstimateMock.mockResolvedValue(estimateRow);
  listEstimateInputsMock.mockResolvedValue([
    { input_key: "integration_count", value: 4, confirmed_by: "preparer-1", confirmed_at: "2026-07-24T00:00:00Z", override_reason: null, confidence: null },
  ]);
  getCurrentTaxonomyVersionMock.mockResolvedValue({ version: 1 });
  runEstimateMock.mockResolvedValue(runResult);
  createEstimateSnapshotMock.mockResolvedValue(snapshotRow);
});

async function postApprove(body: unknown) {
  const { POST } = await import("../estimates/[estimateId]/approve/route");
  return POST(
    new NextRequest("http://test", { method: "POST", body: JSON.stringify(body) }),
    { params: Promise.resolve({ programId: "move-1", estimateId: "estimate-1" }) },
  );
}

describe("POST /api/v1/programs/[programId]/pricing/estimates/[estimateId]/approve", () => {
  it("success: runs the estimate, writes an approved snapshot, and flips the estimate header to approved", async () => {
    const res = await postApprove({ approvalRationale: "Reviewed and holds up." });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.snapshot.id).toBe("snapshot-1");
    expect(json.snapshot.status).toBe("approved");

    expect(runEstimateMock).toHaveBeenCalledWith({ estimateId: "estimate-1", tenantKey: "apex-retail" });
    expect(createEstimateSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        estimateId: "estimate-1",
        tenantKey: "apex-retail",
        moveId: "move-1",
        approvedBy: "approver-1",
        preparedBy: "preparer-1",
        approvalRationale: "Reviewed and holds up.",
      }),
    );
    expect(updateEstimateHeaderMock).toHaveBeenCalledWith("estimate-1", { status: "approved" });
  });

  it("bad_request: rejects a missing/empty approvalRationale before running anything", async () => {
    const res = await postApprove({});
    expect(res.status).toBe(400);
    expect(runEstimateMock).not.toHaveBeenCalled();
    expect(createEstimateSnapshotMock).not.toHaveBeenCalled();
  });

  it("not ready: surfaces the SAME estimate_not_ready shape /run uses, with blockingReasons, when the gate fails", async () => {
    runEstimateMock.mockRejectedValue(new FakeEstimateNotReadyError([{ inputKey: "integration_count", reason: "not confirmed" }]));

    const res = await postApprove({ approvalRationale: "Reviewed and holds up." });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("estimate_not_ready");
    expect(json.blockingReasons).toEqual([{ inputKey: "integration_count", reason: "not confirmed" }]);
    expect(createEstimateSnapshotMock).not.toHaveBeenCalled();
    expect(updateEstimateHeaderMock).not.toHaveBeenCalled();
  });

  it("same-user violation: rejects when the approver is the same identity that last confirmed the estimate's inputs", async () => {
    // The approving session IS the preparer this time.
    listEstimateInputsMock.mockResolvedValue([
      { input_key: "integration_count", value: 4, confirmed_by: "approver-1", confirmed_at: "2026-07-24T00:00:00Z", override_reason: null, confidence: null },
    ]);
    createEstimateSnapshotMock.mockRejectedValue(new FakeSelfApprovalViolationError("approver-1", "approver-1"));

    const res = await postApprove({ approvalRationale: "Reviewed and holds up." });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("self_approval_violation");
    expect(updateEstimateHeaderMock).not.toHaveBeenCalled();
  });

  // PR7 hardening: brief §12's "missing all fallbacks blocks the estimate" —
  // approving a run with ANY unresolved role-rate gap must fail with a
  // distinct, actionable 409, never silently succeed with an incomplete
  // total locked into a permanent snapshot.
  it("unresolved_rate_gap: rejects approval when createEstimateSnapshot reports an unpriced-role gap", async () => {
    createEstimateSnapshotMock.mockRejectedValue(new FakeUnresolvedRateGapError(2));

    const res = await postApprove({ approvalRationale: "Reviewed and holds up." });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("unresolved_rate_gap");
    expect(json.gapCount).toBe(2);
    expect(updateEstimateHeaderMock).not.toHaveBeenCalled();
  });

  it("404s when the estimate belongs to a different tenant", async () => {
    getEstimateMock.mockResolvedValue({ ...estimateRow, tenant_key: "meridian-health" });
    const res = await postApprove({ approvalRationale: "Reviewed and holds up." });
    expect(res.status).toBe(404);
    expect(runEstimateMock).not.toHaveBeenCalled();
  });
});
