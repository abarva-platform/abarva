import { loadRealEffortEnginePack, loadRealRoleRateSnapshot } from "../../effort-engine/__fixtures__/test-fixtures";
import { resolveActivityPacksForArchetype } from "../../effort-engine/activity-packs";
import type { PricingEstimateInputRow, PricingEstimateLineItemRow, PricingEstimateRow, PricingRoleRow } from "../../types";

jest.mock("../../effort-engine/model-registry", () => ({
  readEffortEnginePack: jest.fn(),
}));
jest.mock("../../reference-repository", () => ({
  getCurrentTaxonomyVersion: jest.fn(),
  listRoles: jest.fn(),
}));
jest.mock("../../governed-load/coverage-report", () => ({
  buildRateCardCoverageReport: jest.fn(),
}));
jest.mock("../../effort-engine/rate-card-resolver", () => {
  const actual = jest.requireActual("../../effort-engine/rate-card-resolver");
  return { ...actual, resolveRoleRatesForTenant: jest.fn() };
});
jest.mock("../estimate-repository", () => ({
  getEstimate: jest.fn(),
  listEstimateInputs: jest.fn(),
  listLineItems: jest.fn(),
  replaceLineItems: jest.fn(),
}));

import { readEffortEnginePack } from "../../effort-engine/model-registry";
import { getCurrentTaxonomyVersion, listRoles } from "../../reference-repository";
import { buildRateCardCoverageReport } from "../../governed-load/coverage-report";
import { resolveRoleRate, resolveRoleRatesForTenant } from "../../effort-engine/rate-card-resolver";
import { getEstimate, listEstimateInputs, listLineItems, replaceLineItems } from "../estimate-repository";
import { EstimateNotReadyError, runEstimate } from "../execution-service";

const readEffortEnginePackMock = readEffortEnginePack as jest.Mock;
const getCurrentTaxonomyVersionMock = getCurrentTaxonomyVersion as jest.Mock;
const listRolesMock = listRoles as jest.Mock;
const buildRateCardCoverageReportMock = buildRateCardCoverageReport as jest.Mock;
const resolveRoleRatesForTenantMock = resolveRoleRatesForTenant as jest.Mock;
const getEstimateMock = getEstimate as jest.Mock;
const listEstimateInputsMock = listEstimateInputs as jest.Mock;
const listLineItemsMock = listLineItems as jest.Mock;
const replaceLineItemsMock = replaceLineItems as jest.Mock;

const pack = loadRealEffortEnginePack();
const roleRateSnapshot = loadRealRoleRateSnapshot();

const ESTIMATE: PricingEstimateRow = {
  id: "estimate-1",
  tenant_key: "apex-retail",
  move_id: "move-1",
  scenario_group_id: "group-1",
  scenario_name: "Traditional",
  scenario_key: "traditional",
  archetype_code: "ARCH-01",
  model_version: pack.modelVersion,
  currency: "USD",
  target_start_date: "2026-09-01",
  target_duration_weeks: 12,
  selected_rate_card_id: "rate-card-1",
  status: "draft",
  last_run_id: null,
  last_run_at: null,
  created_by: null,
  created_at: "2026-07-24T00:00:00Z",
  updated_at: "2026-07-24T00:00:00Z",
};

function requiredDriverInputRows(): PricingEstimateInputRow[] {
  const resolved = resolveActivityPacksForArchetype(pack, "ARCH-01");
  const driverCodes = new Set<string>();
  for (const p of resolved) {
    for (const rule of p.rules) {
      if ("driverCode" in rule.operation && rule.operation.driverCode) driverCodes.add(rule.operation.driverCode);
    }
  }
  const now = "2026-07-24T00:00:00Z";
  return Array.from(driverCodes).map((driverCode, i) => ({
    id: `input-${i}`,
    estimate_id: ESTIMATE.id,
    input_key: driverCode,
    value: 3,
    unit: null,
    required: true,
    source_type: "client_input",
    source_ref: null,
    confidence: null,
    confirmed_by: "person-1",
    confirmed_at: now,
    override_reason: null,
    model_version: pack.modelVersion,
    created_at: now,
    updated_at: now,
  }));
}

function buildRatesMap(archetypeCode: string) {
  const resolved = resolveActivityPacksForArchetype(pack, archetypeCode);
  const roleCodes = Array.from(new Set(resolved.flatMap((p) => p.roleMix.map((r) => r.roleCode))));
  const rates = new Map();
  for (const roleCode of roleCodes) {
    rates.set(roleCode, resolveRoleRate(roleCode, null, roleRateSnapshot));
  }
  return rates;
}

beforeEach(() => {
  jest.clearAllMocks();
  readEffortEnginePackMock.mockResolvedValue(pack);
  getCurrentTaxonomyVersionMock.mockResolvedValue({ version: 1 });
  const roles: PricingRoleRow[] = roleRateSnapshot.roles.map((r) => ({
    id: `role-${r.role_code}`,
    taxonomy_version: 1,
    role_code: r.role_code,
    canonical_name: r.role_code,
    tower_code: "TWR-01",
    capability_code: "CAP-001",
    role_family_code: "RF-0001",
    role_type: "delivery",
    allowed_level_min: "Manager",
    allowed_level_max: "Director",
    default_rate_band_code: r.default_rate_band_code,
    internal_external_default: "internal",
    billable_default: true,
    source_artifact: null,
    source_row: null,
    source_label: null,
    status: "active",
    tenant_key: null,
    content_hash: "hash",
    created_at: "now",
  }));
  listRolesMock.mockResolvedValue(roles);
  buildRateCardCoverageReportMock.mockResolvedValue({
    tenantKey: "apex-retail",
    taxonomyVersion: 1,
    totalRoles: roles.length,
    direct: { count: 0, roles: [] },
    inherited: { count: roles.length, roles: [] },
    missing: { count: 0, roles: [] },
    coveragePct: 100,
  });
  resolveRoleRatesForTenantMock.mockImplementation(async () => buildRatesMap("ARCH-01"));
  listLineItemsMock.mockResolvedValue([]);
  replaceLineItemsMock.mockResolvedValue({ runId: "run-1", ranAt: "2026-07-24T01:00:00Z" });
});

describe("runEstimate — validation gate blocking behavior", () => {
  it("throws EstimateNotReadyError when a required driver input is missing", async () => {
    getEstimateMock.mockResolvedValue(ESTIMATE);
    listEstimateInputsMock.mockResolvedValue([]); // nothing confirmed

    await expect(runEstimate({ estimateId: ESTIMATE.id, tenantKey: "apex-retail" })).rejects.toThrow(EstimateNotReadyError);
    expect(replaceLineItemsMock).not.toHaveBeenCalled();
  });

  it("throws EstimateNotReadyError when the header (e.g. currency) is incomplete even with every driver confirmed", async () => {
    getEstimateMock.mockResolvedValue({ ...ESTIMATE, currency: null });
    listEstimateInputsMock.mockResolvedValue(requiredDriverInputRows());

    await expect(runEstimate({ estimateId: ESTIMATE.id, tenantKey: "apex-retail" })).rejects.toThrow(EstimateNotReadyError);
  });
});

describe("runEstimate — passing behavior", () => {
  it("runs PR4's real effort engine, persists line items, and returns the results shape once every required input is settled", async () => {
    getEstimateMock.mockResolvedValue(ESTIMATE);
    listEstimateInputsMock.mockResolvedValue(requiredDriverInputRows());
    listLineItemsMock.mockResolvedValue([{ id: "li-1" } as unknown as PricingEstimateLineItemRow]);

    const result = await runEstimate({ estimateId: ESTIMATE.id, tenantKey: "apex-retail" });

    expect(replaceLineItemsMock).toHaveBeenCalledTimes(1);
    const [estimateIdArg, tenantKeyArg, rowsArg] = replaceLineItemsMock.mock.calls[0];
    expect(estimateIdArg).toBe(ESTIMATE.id);
    expect(tenantKeyArg).toBe("apex-retail");
    expect(Array.isArray(rowsArg)).toBe(true);
    expect(rowsArg.length).toBeGreaterThan(0);

    expect(result.estimateId).toBe(ESTIMATE.id);
    expect(result.runId).toBe("run-1");
    expect(result.totals.totalCostCents).toBeGreaterThan(0);
    expect(result.range.lowCents).toBeLessThanOrEqual(result.range.expectedCents);
    expect(result.range.expectedCents).toBeLessThanOrEqual(result.range.highCents);
    expect(result.rateCardCoverage.coveragePct).toBe(100);
    expect(result.costByActivityPack.length).toBeGreaterThan(0);
    expect(result.internalVsExternal.internalCostCents).toBeGreaterThan(0);
    expect(result.internalVsExternal.externalCostCents).toBe(0); // seed taxonomy has no external roles yet — honest finding
    expect(result.cashVsAbsorbedCapacity.absorbedCapacityCostCents).toBe(result.internalVsExternal.internalCostCents);
    expect(result.lineItems).toEqual([{ id: "li-1" }]);
  });

  it("passes when a required driver is explicitly marked unknown with an accepted range-policy override instead of confirmed", async () => {
    getEstimateMock.mockResolvedValue(ESTIMATE);
    const inputs = requiredDriverInputRows().map((row) => ({
      ...row,
      confirmed_by: null,
      confirmed_at: null,
      override_reason: "Not yet discovered — planning placeholder",
      confidence: "low" as const,
    }));
    listEstimateInputsMock.mockResolvedValue(inputs);

    const result = await runEstimate({ estimateId: ESTIMATE.id, tenantKey: "apex-retail" });
    expect(result.estimateId).toBe(ESTIMATE.id);
  });
});
