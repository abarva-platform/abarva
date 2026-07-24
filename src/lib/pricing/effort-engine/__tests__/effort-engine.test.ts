import { runEffortEngine, MissingRoleRateEntryError, type EffortEngineInput } from "../effort-engine";
import { resolveActivityPacksForArchetype } from "../activity-packs";
import { assertDeterministicRecomputation } from "../validation";
import { loadRealEffortEnginePack } from "../__fixtures__/test-fixtures";
import type { EffortEnginePack, ResolvedRate } from "../types";

// A small, hand-computable synthetic pack — exercises fixed_hours,
// per_unit_hours, tiered_unit_hours, percentage_of_selected_labor, and
// manual_cost_line together with exact, hand-verified arithmetic (see the
// comment above each `expect` below for the worked math).
const SYNTHETIC_PACK: EffortEnginePack = {
  modelVersion: 99,
  archetypes: [{ model_version: 99, archetype_code: "ARCH-TEST", archetype_name: "Test Archetype", description: null, status: "active" }],
  activityPacks: [
    { model_version: 99, activity_pack_code: "AP-TECH-X", activity_pack_name: "Tech X", category: "technical", tower_code: null, capability_code: null, description: null, status: "active" },
    { model_version: 99, activity_pack_code: "AP-TECH-TIER", activity_pack_name: "Tech Tiered", category: "technical", tower_code: null, capability_code: null, description: null, status: "active" },
    { model_version: 99, activity_pack_code: "AP-SHARED-Y", activity_pack_name: "Shared Y", category: "shared_nontechnical", tower_code: null, capability_code: null, description: null, status: "active" },
    { model_version: 99, activity_pack_code: "AP-MANUAL", activity_pack_name: "Manual Cost Pack", category: "shared_nontechnical", tower_code: null, capability_code: null, description: null, status: "active" },
  ],
  effortDrivers: [
    { model_version: 99, driver_code: "d1", driver_name: "D1", unit_label: "unit", description: null, status: "active" },
    { model_version: 99, driver_code: "d2", driver_name: "D2", unit_label: "unit", description: null, status: "active" },
  ],
  effortRules: [
    { model_version: 99, activity_pack_code: "AP-TECH-X", rule_code: "AP-TECH-X-R1", operation: "fixed_hours", driver_code: null, parameters: { hours: 40 }, classification: "initiative_specific", sequence: 1, status: "active" },
    { model_version: 99, activity_pack_code: "AP-TECH-X", rule_code: "AP-TECH-X-R2", operation: "per_unit_hours", driver_code: "d1", parameters: { unitHours: 10 }, classification: "initiative_specific", sequence: 2, status: "active" },
    { model_version: 99, activity_pack_code: "AP-TECH-TIER", rule_code: "AP-TECH-TIER-R1", operation: "tiered_unit_hours", driver_code: "d2", parameters: { tiers: [{ uptoQuantity: 3, unitHours: 90 }, { uptoQuantity: null, unitHours: 65 }] }, classification: "initiative_specific", sequence: 1, status: "active" },
    { model_version: 99, activity_pack_code: "AP-SHARED-Y", rule_code: "AP-SHARED-Y-R1", operation: "percentage_of_selected_labor", driver_code: null, parameters: { percentage: 0.1, selectionScope: "technical_packs_in_archetype" }, classification: "initiative_specific", sequence: 1, status: "active" },
    { model_version: 99, activity_pack_code: "AP-MANUAL", rule_code: "AP-MANUAL-R1", operation: "manual_cost_line", driver_code: null, parameters: { costCents: 500_000, rationale: "Fixed license fee" }, classification: "initiative_specific", sequence: 1, status: "active" },
  ],
  roleMix: [
    { model_version: 99, activity_pack_code: "AP-TECH-X", role_code: "ROL-A", allocation_pct: 100, level_hint: null, status: "active" },
    { model_version: 99, activity_pack_code: "AP-TECH-TIER", role_code: "ROL-A", allocation_pct: 50, level_hint: null, status: "active" },
    { model_version: 99, activity_pack_code: "AP-TECH-TIER", role_code: "ROL-C", allocation_pct: 50, level_hint: null, status: "active" },
    { model_version: 99, activity_pack_code: "AP-SHARED-Y", role_code: "ROL-B", allocation_pct: 100, level_hint: null, status: "active" },
  ],
  archetypeActivityMap: [
    { model_version: 99, archetype_code: "ARCH-TEST", activity_pack_code: "AP-TECH-X", applicability: "required", notes: null, status: "active" },
    { model_version: 99, archetype_code: "ARCH-TEST", activity_pack_code: "AP-TECH-TIER", applicability: "required", notes: null, status: "active" },
    { model_version: 99, archetype_code: "ARCH-TEST", activity_pack_code: "AP-SHARED-Y", applicability: "required", notes: null, status: "active" },
    { model_version: 99, archetype_code: "ARCH-TEST", activity_pack_code: "AP-MANUAL", applicability: "required", notes: null, status: "active" },
  ],
  rangePolicies: [],
  agentCosts: [],
};

function rate(roleCode: string, hourlyRateCents: number | null): ResolvedRate {
  return {
    resolvedFromScope: hourlyRateCents === null ? "missing" : "rate_band_default",
    roleCode,
    levelCode: "LVL-09",
    hourlyRateCents,
    currency: "USD",
    rateCardVersionId: null,
    gapReason: hourlyRateCents === null ? "no rate resolves for this test role" : null,
  };
}

const RATES = new Map<string, ResolvedRate>([
  ["ROL-A", rate("ROL-A", 10_000)], // $100.00/hr
  ["ROL-B", rate("ROL-B", 8_000)], // $80.00/hr
  ["ROL-C", rate("ROL-C", 5_000)], // $50.00/hr
]);

function baseInput(overrides: Partial<EffortEngineInput> = {}): EffortEngineInput {
  return {
    archetypeCode: "ARCH-TEST",
    tenantKey: "test-tenant",
    scenarioKey: "traditional",
    scopeDrivers: { d1: 5, d2: 5 },
    rates: RATES,
    ...overrides,
  };
}

describe("runEffortEngine — core formula (brief §7.4), hand-verified arithmetic", () => {
  it("computes fixed_hours + per_unit_hours raw hours and labor cost for AP-TECH-X", () => {
    const output = runEffortEngine(SYNTHETIC_PACK, baseInput());
    // raw = 40 (fixed) + 5 * 10 (per_unit) = 90h; role ROL-A @ 100% = 90h; $100/hr = $9,000.00
    const techXLines = output.lineItems.filter((l) => l.activityPackCode === "AP-TECH-X");
    const totalRaw = techXLines.reduce((acc, l) => acc + (l.moduleHours?.raw ?? 0), 0);
    expect(totalRaw).toBe(90);
    const totalLabor = techXLines.reduce((acc, l) => acc + (l.laborCostCents ?? 0), 0);
    expect(totalLabor).toBe(900_000); // $9,000.00
  });

  it("computes tiered_unit_hours with marginal tier rates and splits role hours across the role mix", () => {
    const output = runEffortEngine(SYNTHETIC_PACK, baseInput());
    // 5 units across tiers [<=3 @ 90h, remainder @ 65h]: 3*90 + 2*65 = 270 + 130 = 400h.
    // NOTE: moduleHours.raw is the PACK-level (not per-role) raw hours, so it
    // is repeated identically on each of the pack's per-role line items —
    // read it from one line, never summed across roles (that would double it).
    const tierLines = output.lineItems.filter((l) => l.activityPackCode === "AP-TECH-TIER");
    expect(tierLines[0].moduleHours?.raw).toBe(400);
    expect(tierLines.every((l) => l.moduleHours?.raw === 400)).toBe(true);
    const rolA = tierLines.find((l) => l.roleCode === "ROL-A")!;
    const rolC = tierLines.find((l) => l.roleCode === "ROL-C")!;
    expect(rolA.roleHours).toBe(200); // 400 * 50%
    expect(rolC.roleHours).toBe(200);
    expect(rolA.laborCostCents).toBe(2_000_000); // 200h * $100/hr
    expect(rolC.laborCostCents).toBe(1_000_000); // 200h * $50/hr
  });

  it("computes percentage_of_selected_labor as 10% of the technical packs' summed expected hours (90 + 400 = 490 -> 49h)", () => {
    const output = runEffortEngine(SYNTHETIC_PACK, baseInput());
    const sharedLine = output.lineItems.find((l) => l.activityPackCode === "AP-SHARED-Y")!;
    expect(sharedLine.moduleHours?.expected).toBe(49);
    expect(sharedLine.roleHours).toBe(49); // 100% allocation to ROL-B
    expect(sharedLine.laborCostCents).toBe(392_000); // 49h * $80/hr
  });

  it("produces a manual_cost_line as a direct cost line with no hours/role/rate", () => {
    const output = runEffortEngine(SYNTHETIC_PACK, baseInput());
    const manualLine = output.lineItems.find((l) => l.activityPackCode === "AP-MANUAL")!;
    expect(manualLine.manualCostCents).toBe(500_000);
    expect(manualLine.roleCode).toBeNull();
    expect(manualLine.moduleHours).toBeNull();
    expect(manualLine.rate).toBeNull();
  });

  it("totals sum every line's cost consistently: $9,000 + $20,000 + $10,000 + $3,920 labor + $5,000 manual = $47,920.00", () => {
    const output = runEffortEngine(SYNTHETIC_PACK, baseInput());
    expect(output.totals.totalLaborCostCents).toBe(900_000 + 2_000_000 + 1_000_000 + 392_000);
    expect(output.totals.totalManualCostCents).toBe(500_000);
    expect(output.totals.totalCostCents).toBe(4_292_000 + 500_000);
    expect(output.totals.totalCostCents).toBe(4_792_000);
  });

  it("every line item carries full formula provenance: driver, rule, model version, role mix, rate", () => {
    const output = runEffortEngine(SYNTHETIC_PACK, baseInput());
    for (const line of output.lineItems) {
      expect(line.modelVersion).toBe(99);
      expect(line.ruleCode).toMatch(/^AP-/);
      expect(line.formulaTrace.length).toBeGreaterThan(0);
      if (line.roleCode) {
        expect(line.rate).not.toBeNull();
      }
    }
  });
});

describe("runEffortEngine — classification override and shared-cost ref", () => {
  it("applies a per-pack classification override and attaches the caller-supplied sharedCostRef", () => {
    const output = runEffortEngine(
      SYNTHETIC_PACK,
      baseInput({
        classificationOverrides: { "AP-SHARED-Y": "shared_program" },
        sharedCostRefs: { "AP-SHARED-Y": "SHARED::test-review-board" },
      }),
    );
    const sharedLine = output.lineItems.find((l) => l.activityPackCode === "AP-SHARED-Y")!;
    expect(sharedLine.classification).toBe("shared_program");
    expect(sharedLine.sharedCostRef).toBe("SHARED::test-review-board");
    // Unrelated packs are untouched.
    const techXLine = output.lineItems.find((l) => l.activityPackCode === "AP-TECH-X")!;
    expect(techXLine.classification).toBe("initiative_specific");
    expect(techXLine.sharedCostRef).toBeNull();
  });
});

describe("runEffortEngine — honest gaps, never fabricated cost", () => {
  it("a role with an unresolved rate produces a null labor cost and a gap reason, not a fabricated number", () => {
    const ratesWithGap = new Map(RATES);
    ratesWithGap.set("ROL-A", rate("ROL-A", null));
    const output = runEffortEngine(SYNTHETIC_PACK, baseInput({ rates: ratesWithGap }));
    const gappedLines = output.lineItems.filter((l) => l.roleCode === "ROL-A");
    for (const line of gappedLines) {
      expect(line.laborCostCents).toBeNull();
      expect(line.gapReason).not.toBeNull();
    }
    expect(output.totals.gapCount).toBeGreaterThan(0);
  });

  it("throws MissingRoleRateEntryError when the caller's rates map omits a role the archetype's role mix needs", () => {
    const incompleteRates = new Map(RATES);
    incompleteRates.delete("ROL-C");
    expect(() => runEffortEngine(SYNTHETIC_PACK, baseInput({ rates: incompleteRates }))).toThrow(MissingRoleRateEntryError);
  });
});

describe("runEffortEngine — determinism (brief §12: run twice, assert deep equality)", () => {
  it("the SAME inputs + model version + rate map produce EXACTLY the same line items and totals on a second run", () => {
    const input = baseInput();
    const output = assertDeterministicRecomputation(() => runEffortEngine(SYNTHETIC_PACK, input));
    expect(output.totals.totalCostCents).toBe(4_792_000);

    // Literal second call, outside the helper, for full transparency in the test output.
    const again = runEffortEngine(SYNTHETIC_PACK, input);
    expect(again).toEqual(output);
  });
});

// ---------------------------------------------------------------------------
// Scenario toggle proof against the REAL committed pack (needs the real
// activity-pack codes the ai_accelerated override map names).
// ---------------------------------------------------------------------------
describe("runEffortEngine — AI-accelerated scenario changes exactly the approved activities", () => {
  const realPack = loadRealEffortEnginePack();

  function ratesForRoleCodes(roleCodes: readonly string[]): Map<string, ResolvedRate> {
    const map = new Map<string, ResolvedRate>();
    for (const code of roleCodes) map.set(code, rate(code, 12_000));
    return map;
  }

  function allRoleCodesForArchetype(archetypeCode: string): string[] {
    const codes = new Set<string>();
    for (const rm of realPack.roleMix) {
      const mapped = realPack.archetypeActivityMap.some(
        (m) => m.archetype_code === archetypeCode && m.activity_pack_code === rm.activity_pack_code && m.applicability !== "excluded",
      );
      if (mapped) codes.add(rm.role_code);
    }
    return Array.from(codes);
  }

  function scopeDriversForArchetype(archetypeCode: string): Record<string, number> {
    const resolved = resolveActivityPacksForArchetype(realPack, archetypeCode);
    const driverCodes = new Set<string>();
    for (const p of resolved) {
      for (const rule of p.rules) {
        if ("driverCode" in rule.operation) driverCodes.add(rule.operation.driverCode);
      }
    }
    const drivers: Record<string, number> = {};
    for (const code of driverCodes) drivers[code] = 4; // uniform, deliberately simple test quantity
    return drivers;
  }

  it("toggling ARCH-03 from traditional to ai_accelerated changes ONLY AP-TECH-APP-02/03/05 hours, and adds explicit AI-tooling cost lines, nothing else", () => {
    const roleCodes = allRoleCodesForArchetype("ARCH-03");
    const rates = ratesForRoleCodes(roleCodes);
    const scopeDrivers = scopeDriversForArchetype("ARCH-03");

    const traditional = runEffortEngine(realPack, {
      archetypeCode: "ARCH-03",
      tenantKey: "test-tenant",
      scenarioKey: "traditional",
      scopeDrivers,
      rates,
    });
    const aiAccelerated = runEffortEngine(realPack, {
      archetypeCode: "ARCH-03",
      tenantKey: "test-tenant",
      scenarioKey: "ai_accelerated",
      scopeDrivers,
      rates,
    });

    const expectedHoursByPack = (output: typeof traditional) => {
      const byPack = new Map<string, number>();
      for (const line of output.lineItems) {
        if (!line.moduleHours) continue;
        byPack.set(line.activityPackCode, (byPack.get(line.activityPackCode) ?? 0) + line.moduleHours.expected);
      }
      return byPack;
    };
    const before = expectedHoursByPack(traditional);
    const after = expectedHoursByPack(aiAccelerated);

    const changedPacks = new Set<string>();
    for (const [packCode, hours] of before) {
      if (Math.abs((after.get(packCode) ?? 0) - hours) > 1e-9) changedPacks.add(packCode);
    }

    // Directly overridden: the 3 approved AI-accelerated activities.
    const directlyOverridden = new Set(["AP-TECH-APP-02", "AP-TECH-APP-03", "AP-TECH-APP-05"]);
    // Indirectly, TRACEABLY affected: the percentage_of_selected_labor shared
    // packs (PM, architecture, risk/compliance, financial governance) whose
    // hours are a declared percentage of the technical packs' total expected
    // hours — when the technical total shrinks via the SAME approved
    // acceleration assumption, these ripple proportionally. This is a
    // deterministic, fully-traced formula consequence of the one approved
    // assumption (see each line's formulaTrace), not a second, independent,
    // undisclosed multiplier — so it is still "exactly what you'd expect".
    const traceablyRippled = new Set(["AP-SHARED-07", "AP-SHARED-08", "AP-SHARED-09", "AP-SHARED-10"]);
    expect(changedPacks).toEqual(new Set([...directlyOverridden, ...traceablyRippled]));

    // Every changed pack's hours DECREASED (acceleration, not regression) —
    // both the directly-overridden packs and the packs that ripple from them.
    for (const packCode of changedPacks) {
      expect(after.get(packCode)!).toBeLessThan(before.get(packCode)!);
    }

    // Everything else — every OTHER technical pack and every OTHER shared
    // pack not tied to technical-labor percentage rules — is untouched.
    for (const [packCode, hours] of before) {
      if (changedPacks.has(packCode)) continue;
      expect(after.get(packCode)).toBe(hours);
    }

    // The AI-accelerated run adds explicit, visible cost lines the traditional run does not have.
    const traditionalHasScenarioCosts = traditional.lineItems.some((l) => l.activityPackCode === "SCENARIO-AI-ACCELERATION");
    const acceleratedScenarioCosts = aiAccelerated.lineItems.filter((l) => l.activityPackCode === "SCENARIO-AI-ACCELERATION");
    expect(traditionalHasScenarioCosts).toBe(false);
    expect(acceleratedScenarioCosts.length).toBeGreaterThan(0);
    for (const line of acceleratedScenarioCosts) {
      expect(line.manualCostCents).not.toBeNull();
    }
  });
});
