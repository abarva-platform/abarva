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

describe("runEstimate — grouped buckets carry true hours, not hours repeated per role line", () => {
  // A small synthetic pack (invented codes and numbers). No module or program
  // factors, so expected hours = raw hours.
  //   AP-BUILD      R1 60h + R2 20h, ROL-X 75% / ROL-Y 25%
  //   AP-SHARED-01  R1 40.4h,        ROL-Y 50% / ROL-Z 50%  (change/adoption bucket)
  //   AP-SHARED-02  R1 12h,          ROL-Y 50% / ROL-Z 46%  (SAME bucket, SAME rule code "R1", 96% allocated)
  //   AP-SOLO       R1 10.1h,        ROL-Z 100%; R2 9h out_of_scope (excluded everywhere)
  //   AP-NOMIX      R1 7h,           no role mix (an allocation gap: hours, no role)
  //   AP-PARTIAL    R1 50h,          ROL-X 60% / ROL-Y 36%  (96%: inside the 95-105% tolerance, so
  //                                  the pack's hours (50) and its allocated role hours (48) differ)
  const V = pack.modelVersion;
  const activityPack = (code: string, category: "technical" | "shared_nontechnical") => ({
    model_version: V, activity_pack_code: code, activity_pack_name: `${code} name`, category, tower_code: null, capability_code: null, description: null, status: "active",
  });
  const fixedRule = (packCode: string, ruleCode: string, hours: number, sequence: number) => ({
    model_version: V, activity_pack_code: packCode, rule_code: ruleCode, operation: "fixed_hours" as const, driver_code: null, parameters: { hours }, classification: "initiative_specific" as const, sequence, status: "active",
  });
  const mix = (packCode: string, roleCode: string, allocationPct: number) => ({
    model_version: V, activity_pack_code: packCode, role_code: roleCode, allocation_pct: allocationPct, level_hint: null, status: "active",
  });
  const mapRow = (packCode: string) => ({
    model_version: V, archetype_code: "ARCH-01", activity_pack_code: packCode, applicability: "required" as const, notes: null, status: "active",
  });
  const SYNTHETIC = {
    ...pack,
    archetypes: [{ model_version: V, archetype_code: "ARCH-01", archetype_name: "Synthetic", description: null, status: "active" }],
    activityPacks: [activityPack("AP-BUILD", "technical"), activityPack("AP-SHARED-01", "shared_nontechnical"), activityPack("AP-SHARED-02", "shared_nontechnical"), activityPack("AP-SOLO", "technical"), activityPack("AP-NOMIX", "technical"), activityPack("AP-PARTIAL", "technical")],
    effortDrivers: [],
    effortRules: [
      fixedRule("AP-BUILD", "AP-BUILD-R1", 60, 1),
      fixedRule("AP-BUILD", "AP-BUILD-R2", 20, 2),
      fixedRule("AP-SHARED-01", "R1", 40.4, 1),
      fixedRule("AP-SHARED-02", "R1", 12, 1),
      fixedRule("AP-SOLO", "AP-SOLO-R1", 10.1, 1),
      { ...fixedRule("AP-SOLO", "AP-SOLO-R2", 9, 2), classification: "out_of_scope" as const },
      fixedRule("AP-NOMIX", "AP-NOMIX-R1", 7, 1),
      fixedRule("AP-PARTIAL", "AP-PARTIAL-R1", 50, 1),
    ],
    roleMix: [mix("AP-BUILD", "ROL-X", 75), mix("AP-BUILD", "ROL-Y", 25), mix("AP-SHARED-01", "ROL-Y", 50), mix("AP-SHARED-01", "ROL-Z", 50), mix("AP-SHARED-02", "ROL-Y", 50), mix("AP-SHARED-02", "ROL-Z", 46), mix("AP-SOLO", "ROL-Z", 100), mix("AP-PARTIAL", "ROL-X", 60), mix("AP-PARTIAL", "ROL-Y", 36)],
    archetypeActivityMap: [mapRow("AP-BUILD"), mapRow("AP-SHARED-01"), mapRow("AP-SHARED-02"), mapRow("AP-SOLO"), mapRow("AP-NOMIX"), mapRow("AP-PARTIAL")],
    agentCosts: [],
  };
  const rate = (roleCode: string, hourlyRateCents: number) => ({
    resolvedFromScope: "rate_band_default" as const, roleCode, levelCode: "LVL-04", hourlyRateCents, currency: "USD", rateCardVersionId: null, gapReason: null,
  });

  async function run() {
    readEffortEnginePackMock.mockResolvedValue(SYNTHETIC);
    resolveRoleRatesForTenantMock.mockResolvedValue(
      new Map([
        ["ROL-X", rate("ROL-X", 9_500)], // $95/hr
        ["ROL-Y", rate("ROL-Y", 7_000)], // $70/hr
        ["ROL-Z", rate("ROL-Z", 12_500)], // $125/hr
      ]),
    );
    getEstimateMock.mockResolvedValue(ESTIMATE);
    listEstimateInputsMock.mockResolvedValue([]);
    return runEstimate({ estimateId: ESTIMATE.id, tenantKey: "apex-retail" });
  }
  const bucket = (buckets: { key: string; expectedHours: number; totalCostCents: number }[], key: string) => {
    const found = buckets.find((b) => b.key === key);
    if (!found) throw new Error(`no bucket '${key}'`);
    return found;
  };

  it("by pack: each rule's hours once (80, 40.4, 10.1, 7, 50), not once per role line (160, 80.8, …); costs unchanged", async () => {
    const result = await run();
    expect(bucket(result.costByActivityPack, "AP-BUILD")).toMatchObject({ expectedHours: 80, totalCostCents: 427_500 + 105_000 + 142_500 + 35_000 });
    expect(bucket(result.costByActivityPack, "AP-SHARED-01")).toMatchObject({ expectedHours: 40.4, totalCostCents: 141_400 + 252_500 });
    expect(bucket(result.costByActivityPack, "AP-SHARED-02")).toMatchObject({ expectedHours: 12, totalCostCents: 42_000 + 69_000 });
    // AP-SOLO-R2 (9h, out_of_scope) is excluded.
    expect(bucket(result.costByActivityPack, "AP-SOLO")).toMatchObject({ expectedHours: 10.1, totalCostCents: 126_250 });
    expect(bucket(result.costByActivityPack, "AP-NOMIX")).toMatchObject({ expectedHours: 7, totalCostCents: 0 });
    // The pack's own hours (50), not its 96% allocated role hours (30 + 18 = 48).
    expect(bucket(result.costByActivityPack, "AP-PARTIAL")).toMatchObject({ expectedHours: 50, totalCostCents: 285_000 + 126_000 });
    expect(result.totals.totalExpectedHours).toBe(199.5);
    expect(result.costByActivityPack.reduce((acc, b) => acc + b.expectedHours, 0)).toBe(199.5);
  });

  it("by role: each role its own allocated hours (90, 64.2, 35.82), not the rule's full hours; a role-less gap line keeps its rule's hours", async () => {
    const result = await run();
    // ROL-X: 45 + 15 + 30. ROL-Y: 15 + 5 + 20.2 + 6 + 18. ROL-Z: 20.2 + 5.52 + 10.1.
    expect(bucket(result.costByRole, "ROL-X")).toMatchObject({ expectedHours: 90, totalCostCents: 570_000 + 285_000 });
    expect(bucket(result.costByRole, "ROL-Y")).toMatchObject({ expectedHours: 64.2, totalCostCents: 105_000 + 35_000 + 141_400 + 42_000 + 126_000 });
    expect(bucket(result.costByRole, "ROL-Z")).toMatchObject({ expectedHours: 35.82, totalCostCents: 252_500 + 69_000 + 126_250 });
    expect(bucket(result.costByRole, "__manual__")).toMatchObject({ expectedHours: 7, totalCostCents: 0 });
    // Role hours sum to the ALLOCATED hours: 199.5 less 2h (AP-PARTIAL) and 0.48h (AP-SHARED-02) unallocated.
    expect(result.costByRole.reduce((acc, b) => acc + b.expectedHours, 0)).toBeCloseTo(197.02, 10);
  });

  it("change/adoption: each pack's rule counted once (40.4 + 12 = 52.4h, not 104.8h), two packs' same rule code kept apart", async () => {
    const result = await run();
    // AP-SHARED-02 counts its full 12h, not its 96% allocated 11.52h.
    expect(result.changeAdoptionBreakdown).toEqual([
      { key: "Change & stakeholder engagement", label: "Change & stakeholder engagement", laborCostCents: 504_900, manualCostCents: 0, totalCostCents: 504_900, expectedHours: 52.4 },
    ]);
  });
});
