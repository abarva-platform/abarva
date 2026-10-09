/**
 * ROM increment 1 — engine options: program friction, pricing basis (pod),
 * unit-hours overrides, structured formula terms, and the portfolio
 * roll-up's shared-line dedup with those options in play.
 *
 * Every number below is invented for this test and hand-computable; each
 * expectation carries its worked arithmetic in a comment.
 */
import { rollUpPortfolio } from "../cost-engine";
import {
  InvalidPricingBasisError,
  InvalidProgramFactorError,
  InvalidUnitHoursOverrideError,
  MissingRoleRateEntryError,
  runEffortEngine,
  type EffortEngineInput,
} from "../effort-engine";
import {
  appendCostTerms,
  closeHoursTerms,
  evaluateFormulaTerms,
  FormulaTermsReconciliationError,
} from "../formula-terms";
import { resolveActivityPacksForArchetype } from "../activity-packs";
import { pricePod } from "../pod-pricer";
import {
  createReferencePodRateResolver,
  type PodRateReference,
} from "../pod-rate-adapter";
import { loadRealEffortEnginePack } from "../__fixtures__/test-fixtures";
import type {
  EffortEngineOutput,
  EffortEnginePack,
  EffortLineItem,
  PricingBasis,
  ResolvedRate,
} from "../types";

const V = 7;

function activityPack(
  code: string,
  category: "technical" | "shared_nontechnical",
) {
  return {
    model_version: V,
    activity_pack_code: code,
    activity_pack_name: code,
    category,
    tower_code: null,
    capability_code: null,
    description: null,
    status: "active",
  };
}
function rule(
  packCode: string,
  suffix: string,
  operation: EffortEnginePack["effortRules"][number]["operation"],
  driver: string | null,
  parameters: Record<string, unknown>,
  sequence: number,
) {
  return {
    model_version: V,
    activity_pack_code: packCode,
    rule_code: `${packCode}-${suffix}`,
    operation,
    driver_code: driver,
    parameters,
    classification: "initiative_specific" as const,
    sequence,
    status: "active",
  };
}
function mix(packCode: string, roleCode: string, pct: number) {
  return {
    model_version: V,
    activity_pack_code: packCode,
    role_code: roleCode,
    allocation_pct: pct,
    level_hint: null,
    status: "active",
  };
}
function mapRow(
  arch: string,
  packCode: string,
  applicability: "required" | "conditional" = "required",
) {
  return {
    model_version: V,
    archetype_code: arch,
    activity_pack_code: packCode,
    applicability,
    notes: null,
    status: "active",
  };
}

// AP-BUILD (technical): 30h fixed + 8h × units; role mix DEV 60% / QA 40%.
// AP-RUN (technical): 6h × weeks + tiered sites [<=2 @ 20h, rest @ 10h]; DEV 100%.
// AP-PMO (shared): 20% of the technical packs' expected hours; PM 100%.
// AP-FEE: a manual cost line of $2,500.00.
// AP-NOMIX (shared, conditional): 10h fixed and NO role mix (a configuration gap in role_mix mode).
const PACK: EffortEnginePack = {
  modelVersion: V,
  archetypes: [
    {
      model_version: V,
      archetype_code: "ARCH-ROM",
      archetype_name: "ROM test",
      description: null,
      status: "active",
    },
  ],
  activityPacks: [
    activityPack("AP-BUILD", "technical"),
    activityPack("AP-RUN", "technical"),
    activityPack("AP-PMO", "shared_nontechnical"),
    activityPack("AP-FEE", "shared_nontechnical"),
    activityPack("AP-NOMIX", "shared_nontechnical"),
  ],
  effortDrivers: [],
  effortRules: [
    rule("AP-BUILD", "R1", "fixed_hours", null, { hours: 30 }, 1),
    rule("AP-BUILD", "R2", "per_unit_hours", "d_units", { unitHours: 8 }, 2),
    rule("AP-RUN", "R1", "hours_per_week", "d_weeks", { hoursPerWeek: 6 }, 1),
    rule(
      "AP-RUN",
      "R2",
      "tiered_unit_hours",
      "d_sites",
      {
        tiers: [
          { uptoQuantity: 2, unitHours: 20 },
          { uptoQuantity: null, unitHours: 10 },
        ],
      },
      2,
    ),
    rule(
      "AP-PMO",
      "R1",
      "percentage_of_selected_labor",
      null,
      { percentage: 0.2, selectionScope: "technical_packs_in_archetype" },
      1,
    ),
    rule(
      "AP-FEE",
      "R1",
      "manual_cost_line",
      null,
      { costCents: 250_000, rationale: "Fixed tooling fee" },
      1,
    ),
    rule("AP-NOMIX", "R1", "fixed_hours", null, { hours: 10 }, 1),
  ],
  roleMix: [
    mix("AP-BUILD", "ROL-DEV", 60),
    mix("AP-BUILD", "ROL-QA", 40),
    mix("AP-RUN", "ROL-DEV", 100),
    mix("AP-PMO", "ROL-PM", 100),
  ],
  archetypeActivityMap: [
    mapRow("ARCH-ROM", "AP-BUILD"),
    mapRow("ARCH-ROM", "AP-RUN"),
    mapRow("ARCH-ROM", "AP-PMO"),
    mapRow("ARCH-ROM", "AP-FEE"),
    mapRow("ARCH-ROM", "AP-NOMIX", "conditional"),
  ],
  rangePolicies: [],
  agentCosts: [],
};

function rate(roleCode: string, hourlyRateCents: number | null): ResolvedRate {
  return {
    resolvedFromScope:
      hourlyRateCents === null ? "missing" : "rate_band_default",
    roleCode,
    levelCode: null,
    hourlyRateCents,
    currency: "USD",
    rateCardVersionId: null,
    gapReason: hourlyRateCents === null ? "no rate for this test role" : null,
  };
}

const RATES = new Map<string, ResolvedRate>([
  ["ROL-DEV", rate("ROL-DEV", 9_000)], // $90.00/hr
  ["ROL-QA", rate("ROL-QA", 7_000)], // $70.00/hr
  ["ROL-PM", rate("ROL-PM", 11_000)], // $110.00/hr
]);

function input(overrides: Partial<EffortEngineInput> = {}): EffortEngineInput {
  return {
    archetypeCode: "ARCH-ROM",
    tenantKey: "test-tenant",
    scenarioKey: "traditional",
    scopeDrivers: { d_units: 5, d_weeks: 5, d_sites: 4 },
    rates: RATES,
    ...overrides,
  };
}

function find(
  output: EffortEngineOutput,
  ruleCode: string,
  roleCode: string | null = null,
): EffortLineItem {
  const line = output.lineItems.find(
    (l) => l.ruleCode === ruleCode && l.roleCode === roleCode,
  );
  if (!line) throw new Error(`no line ${ruleCode}/${roleCode}`);
  return line;
}

/** The hours a line carries: role hours on a role line, the rule's expected share otherwise. */
function lineHours(line: EffortLineItem): number | null {
  if (line.roleHours !== null) return line.roleHours;
  return line.moduleHours ? line.moduleHours.expected : null;
}

function assertTermsReconcile(output: EffortEngineOutput): number {
  let checked = 0;
  for (const line of output.lineItems) {
    expect(line.formulaTerms).toBeDefined();
    const terms = line.formulaTerms!;
    const hours = lineHours(line);
    if (hours === null) {
      expect(terms).toEqual([]);
      expect(evaluateFormulaTerms(terms)).toBeNull();
      continue;
    }
    const evaluated = evaluateFormulaTerms(terms)!;
    expect(evaluated.hours).toBe(hours);
    expect(
      terms.filter((t) => t.cellRole === "result").map((t) => t.value),
    ).toEqual([hours]);
    expect(evaluated.costCents).toBe(line.laborCostCents);
    if (line.laborCostCents !== null) {
      expect(
        terms.filter((t) => t.cellRole === "cost_result").map((t) => t.value),
      ).toEqual([line.laborCostCents]);
    }
    checked += 1;
  }
  return checked;
}

describe("baseline — no new options (the arithmetic every new option is measured against)", () => {
  it("prices the pack exactly as the original engine would, with no friction anywhere in the trace", () => {
    const out = runEffortEngine(PACK, input());
    // BUILD raw 30 + 5×8 = 70; DEV 60%: 18h + 24h; QA 40%: 12h + 16h.
    expect(find(out, "AP-BUILD-R1", "ROL-DEV").roleHours).toBe(18);
    expect(find(out, "AP-BUILD-R2", "ROL-QA").roleHours).toBe(16);
    // RUN raw 5×6 + (2×20 + 2×10) = 90; PMO 20% × (70 + 90) = 32h.
    expect(find(out, "AP-PMO-R1", "ROL-PM").roleHours).toBe(32);
    // labor: DEV (18+24+30+60)h×$90 + QA 28h×$70 + PM 32h×$110 = 1,736,000 cents.
    expect(out.totals.totalLaborCostCents).toBe(1_736_000);
    expect(out.totals.totalCostCents).toBe(1_736_000 + 250_000);
    expect(out.pricingBasis).toBe("role_mix");
    for (const line of out.lineItems) {
      expect(line.formulaTrace).not.toContain("friction");
      expect(
        line.moduleHours === null || !("frictionFactor" in line.moduleHours),
      ).toBe(true);
      expect(line.unitHoursOverride).toBeUndefined();
    }
    expect(find(out, "AP-BUILD-R2", "ROL-DEV").formulaTrace).toBe(
      "5 × 8h/d_units = 40h raw share; × complexity 1 × novelty 1 × assurance 1 × scenario 1 = 40h expected share; " +
        "× 60% allocation = 24h role-hours; × $90.00/hr (rate_band_default) = $2160.00",
    );
  });
});

describe("programFactors.frictionFactor — applied after module factors, exactly once", () => {
  let out: EffortEngineOutput;
  beforeAll(() => {
    out = runEffortEngine(
      PACK,
      input({ programFactors: { frictionFactor: 1.1 } }),
    );
  });

  it("multiplies every hours line by the friction factor", () => {
    // BUILD expected 70 × 1.1 = 77; R1 share 33, R2 share 44; DEV 60%: 19.8 / 26.4; QA 40%: 13.2 / 17.6.
    expect(find(out, "AP-BUILD-R1", "ROL-DEV").roleHours).toBe(19.8);
    expect(find(out, "AP-BUILD-R2", "ROL-DEV").roleHours).toBe(26.4);
    expect(find(out, "AP-BUILD-R1", "ROL-QA").roleHours).toBe(13.2);
    expect(find(out, "AP-BUILD-R2", "ROL-QA").roleHours).toBe(17.6);
    // RUN expected 90 × 1.1 = 99; R1 33, R2 66.
    expect(find(out, "AP-RUN-R1", "ROL-DEV").roleHours).toBe(33);
    expect(find(out, "AP-RUN-R2", "ROL-DEV").roleHours).toBe(66);
  });

  it("a percentage line reads PRE-friction hours, so friction is not compounded (32 × 1.1 = 35.2, not 0.2 × 176 × 1.1)", () => {
    expect(find(out, "AP-PMO-R1", "ROL-PM").roleHours).toBe(35.2);
    expect(find(out, "AP-PMO-R1", "ROL-PM").moduleHours?.raw).toBe(32);
  });

  it("scales the labor total by exactly 1.1 (1,736,000 → 1,909,600) and leaves the manual line alone", () => {
    expect(out.totals.totalLaborCostCents).toBe(1_909_600);
    expect(out.totals.totalManualCostCents).toBe(250_000);
  });

  it("is visible in the trace as '× friction 1.10' and on moduleHours", () => {
    const line = find(out, "AP-BUILD-R2", "ROL-DEV");
    expect(line.formulaTrace).toContain(
      "× scenario 1 × friction 1.10 = 44h expected share",
    );
    expect(line.moduleHours?.frictionFactor).toBe(1.1);
    expect(
      runEffortEngine(
        PACK,
        input({ programFactors: { frictionFactor: 1.125 } }),
      ).lineItems[0].formulaTrace,
    ).toContain("× friction 1.125 ");
  });

  it("an explicit factor of 1 changes no number, only discloses itself", () => {
    const base = runEffortEngine(PACK, input());
    const one = runEffortEngine(
      PACK,
      input({ programFactors: { frictionFactor: 1 } }),
    );
    expect(one.totals).toEqual(base.totals);
    expect(one.lineItems.map(lineHours)).toEqual(base.lineItems.map(lineHours));
    expect(one.lineItems[0].formulaTrace).toContain("× friction 1.00");
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "refuses frictionFactor %p",
    (bad) => {
      expect(() =>
        runEffortEngine(
          PACK,
          input({ programFactors: { frictionFactor: bad } }),
        ),
      ).toThrow(InvalidProgramFactorError);
    },
  );
});

describe("pricingBasis: 'pod' — hours-only lines", () => {
  let out: EffortEngineOutput;
  beforeAll(() => {
    out = runEffortEngine(
      PACK,
      input({
        pricingBasis: "pod",
        programFactors: { frictionFactor: 1.1 },
        includeConditionalPackCodes: ["AP-NOMIX"],
        rates: new Map(),
      }),
    );
  });

  it("emits one line per hours rule with no role, rate, cost or allocation gap — and never reads the rates map", () => {
    const hoursLines = out.lineItems.filter((l) => l.moduleHours !== null);
    expect(hoursLines.map((l) => l.ruleCode)).toEqual([
      "AP-BUILD-R1",
      "AP-BUILD-R2",
      "AP-RUN-R1",
      "AP-RUN-R2",
      "AP-NOMIX-R1",
      "AP-PMO-R1",
    ]);
    for (const line of hoursLines) {
      expect(line.roleCode).toBeNull();
      expect(line.allocationPct).toBeNull();
      expect(line.roleHours).toBeNull();
      expect(line.rate).toBeNull();
      expect(line.laborCostCents).toBeNull();
      expect(line.gapReason).toBeNull();
      expect(line.formulaTrace).toContain("pod basis — hours only");
    }
    expect(out.pricingBasis).toBe("pod");
    expect(out.totals.gapCount).toBe(0);
    expect(out.totals.totalLaborCostCents).toBe(0);
    expect(out.totals.totalManualCostCents).toBe(250_000);
  });

  it("carries the full adjusted hours: 33 + 44 + 33 + 66 + 35.2 + 11 = 222.2", () => {
    expect(find(out, "AP-NOMIX-R1").moduleHours?.expected).toBe(11);
    expect(out.totals.totalExpectedHours).toBe(222.2);
  });

  it("the same pack in role_mix mode reports the missing role mix as a gap (pod mode is what removes it)", () => {
    const roleMix = runEffortEngine(
      PACK,
      input({ includeConditionalPackCodes: ["AP-NOMIX"] }),
    );
    expect(find(roleMix, "AP-NOMIX-R1").gapReason).toContain(
      "no pricing_activity_role_mix rows",
    );
  });

  it("role_mix mode still demands a rate per role (the pod path is the only one that skips it)", () => {
    expect(() => runEffortEngine(PACK, input({ rates: new Map() }))).toThrow(
      MissingRoleRateEntryError,
    );
  });

  it("hands its adjusted hours to the pod pricer, rated from the reference foundation: ceil(222.2 / 65) = 4 weeks", () => {
    const reference: PodRateReference = {
      basis: "loaded_cost",
      // Real role / level / location codes; invented rates and multipliers.
      rateBands: [
        {
          rate_band_code: "ROL-002-LVL-04",
          role_code: "ROL-002",
          level_code: "LVL-04",
          currency: "USD",
          rate_basis: "onshore_si_t1_benchmark",
          loaded_rate: 90,
          scarcity_adj_rate: 100,
          indicative_bill_rate: 180,
          confidence: "medium",
          approval_status: "unapproved",
        },
        {
          rate_band_code: "ROL-150-LVL-03",
          role_code: "ROL-150",
          level_code: "LVL-03",
          currency: "USD",
          rate_basis: "onshore_si_t1_benchmark",
          loaded_rate: 150,
          scarcity_adj_rate: 160,
          indicative_bill_rate: 300,
          confidence: "medium",
          approval_status: "unapproved",
        },
      ],
      locations: [
        {
          location_code: "LOC-DALLAS",
          shore_category: "onshore",
          salary_multiplier: 1,
          rate_multiplier: 1,
        },
        {
          location_code: "LOC-INDIA-TIER-1",
          shore_category: "offshore",
          salary_multiplier: 0.4,
          rate_multiplier: 0.5,
        },
      ],
      providerClasses: [
        { provider_class_code: "SI-T1", tier_multiplier: 1.25 },
      ],
    };
    const priced = pricePod({
      adjustedHours: out.totals.totalExpectedHours,
      pod: {
        podCode: "POD-T",
        members: [
          {
            roleCode: "ROL-002",
            levelCode: "LVL-04",
            locationCode: "LOC-DALLAS",
            fte: 1.5,
          },
          {
            roleCode: "ROL-150",
            levelCode: "LVL-03",
            locationCode: "LOC-INDIA-TIER-1",
            fte: 1,
          },
        ],
      },
      hoursPerFteWeek: 40,
      productiveShare: 0.65,
      rateResolver: createReferencePodRateResolver(reference),
    });
    if (!priced.ok) throw new Error(priced.message);
    // 2.5 FTE × 40 × 0.65 = 65 productive h/week; 222.2 / 65 = 3.42 → 4 weeks; capacity 260, slack 37.8.
    expect(priced.weeks).toBe(4);
    expect(priced.roundingSlack.productiveHours).toBe(37.8);
    // $90 × 1 = $90/hr; $150 × 0.4 = $60/hr. 1.5 × 4 × 40 = 240h × $90 + 160h × $60 = 3,120,000 cents.
    expect(priced.memberLines.map((l) => l.rate.hourlyRateCents)).toEqual([
      9_000, 6_000,
    ]);
    expect(priced.laborCostCents).toBe(3_120_000);
  });

  it("refuses an unknown basis at runtime", () => {
    expect(() =>
      runEffortEngine(
        PACK,
        input({ pricingBasis: "headcount" as PricingBasis }),
      ),
    ).toThrow(InvalidPricingBasisError);
  });
});

describe("unitHoursOverrides — a reasoned replacement for reference unit hours", () => {
  let out: EffortEngineOutput;
  beforeAll(() => {
    out = runEffortEngine(
      PACK,
      input({
        unitHoursOverrides: {
          "AP-BUILD-R2": { unitHours: 10, reason: "older interfaces" },
        },
      }),
    );
  });

  it("recomputes the rule with the new unit hours: 5 × 10 = 50h; BUILD raw 80; DEV 30h, QA 20h", () => {
    expect(find(out, "AP-BUILD-R2", "ROL-DEV").roleHours).toBe(30);
    expect(find(out, "AP-BUILD-R2", "ROL-QA").roleHours).toBe(20);
    expect(find(out, "AP-BUILD-R2", "ROL-DEV").moduleHours?.raw).toBe(50);
  });

  it("ripples traceably into the percentage line: 20% × (80 + 90) = 34h", () => {
    expect(find(out, "AP-PMO-R1", "ROL-PM").roleHours).toBe(34);
  });

  it("shows '<ref> h (reference) → <new> h (override: <reason>)' in the trace and records the override on the line", () => {
    const line = find(out, "AP-BUILD-R2", "ROL-DEV");
    expect(line.formulaTrace).toContain(
      "8 h (reference) → 10 h (override: older interfaces)",
    );
    expect(
      line.formulaTrace.startsWith(
        "5 × 10h/d_units [8 h (reference) → 10 h (override: older interfaces)] = 50h raw share",
      ),
    ).toBe(true);
    expect(line.unitHoursOverride).toEqual({
      referenceUnitHours: 8,
      unitHours: 10,
      reason: "older interfaces",
    });
    expect(line.overrideRationale).toBe(
      "unit-hours override: older interfaces",
    );
    const unitTerm = line.formulaTerms!.find(
      (t) => t.cellRole === "unit_hours",
    )!;
    expect(unitTerm.value).toBe(10);
    expect(unitTerm.source).toBe("override:AP-BUILD-R2");
    // The sibling rule is untouched.
    expect(
      find(out, "AP-BUILD-R1", "ROL-DEV").unitHoursOverride,
    ).toBeUndefined();
    expect(find(out, "AP-BUILD-R1", "ROL-DEV").formulaTrace).not.toContain(
      "reference",
    );
  });

  it("supports a fixed rule's base hours and an hours-per-week rule", () => {
    const o = runEffortEngine(
      PACK,
      input({
        unitHoursOverrides: {
          "AP-BUILD-R1": { unitHours: 20, reason: "template reuse" },
          "AP-RUN-R1": { unitHours: 4, reason: "light cadence" },
        },
      }),
    );
    // BUILD raw 20 + 40 = 60 → R1 DEV 60% of 20 = 12h; RUN R1 5 × 4 = 20h.
    expect(find(o, "AP-BUILD-R1", "ROL-DEV").roleHours).toBe(12);
    expect(find(o, "AP-RUN-R1", "ROL-DEV").roleHours).toBe(20);
    expect(find(o, "AP-RUN-R1", "ROL-DEV").formulaTrace).toContain(
      "6 h (reference) → 4 h (override: light cadence)",
    );
    expect(
      find(o, "AP-BUILD-R1", "ROL-DEV").formulaTerms!.find(
        (t) => t.cellRole === "base_hours",
      ),
    ).toMatchObject({ value: 20, source: "override:AP-BUILD-R1" });
  });

  it("accepts zero unit hours and composes with friction", () => {
    const o = runEffortEngine(
      PACK,
      input({
        programFactors: { frictionFactor: 1.1 },
        unitHoursOverrides: {
          "AP-BUILD-R2": { unitHours: 0, reason: "already built" },
        },
      }),
    );
    // BUILD raw 30 → 33 expected; R2 contributes 0.
    expect(find(o, "AP-BUILD-R2", "ROL-DEV").roleHours).toBe(0);
    expect(find(o, "AP-BUILD-R1", "ROL-DEV").roleHours).toBe(19.8);
  });

  it.each([
    ["AP-RUN-R2", { unitHours: 5, reason: "x" }, "unsupported_operation"],
    ["AP-PMO-R1", { unitHours: 5, reason: "x" }, "unsupported_operation"],
    ["AP-FEE-R1", { unitHours: 5, reason: "x" }, "unsupported_operation"],
    ["AP-NOMIX-R1", { unitHours: 5, reason: "x" }, "unknown_rule"],
    ["AP-NOPE-R9", { unitHours: 5, reason: "x" }, "unknown_rule"],
    ["AP-BUILD-R2", { unitHours: -1, reason: "x" }, "invalid_value"],
    ["AP-BUILD-R2", { unitHours: Number.NaN, reason: "x" }, "invalid_value"],
    ["AP-BUILD-R2", { unitHours: 5, reason: "   " }, "missing_reason"],
  ] as const)(
    "refuses an override on %s (%p) as %s",
    (ruleCode, override, refusal) => {
      let caught: unknown;
      try {
        runEffortEngine(
          PACK,
          input({ unitHoursOverrides: { [ruleCode]: override } }),
        );
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(InvalidUnitHoursOverrideError);
      expect((caught as InvalidUnitHoursOverrideError).refusal).toBe(refusal);
    },
  );
});

describe("formulaTerms — structured terms reconcile exactly to every line", () => {
  it("lists the exact cells for a priced role line", () => {
    const out = runEffortEngine(
      PACK,
      input({ programFactors: { frictionFactor: 1.1 } }),
    );
    const terms = find(out, "AP-BUILD-R2", "ROL-DEV").formulaTerms!;
    expect(terms.map((t) => [t.cellRole, t.value, t.source])).toEqual([
      ["count", 5, "driver:d_units"],
      ["unit_hours", 8, "rule:AP-BUILD-R2"],
      ["factor", 1, "module:AP-BUILD"],
      ["factor", 1, "module:AP-BUILD"],
      ["factor", 1, "module:AP-BUILD"],
      ["factor", 1, "scenario:traditional"],
      ["factor", 1.1, "program"],
      ["allocation", 0.6, "role_mix:ROL-DEV"],
      ["result", 26.4, "engine"],
      ["rate", 9_000, "rate:rate_band_default"],
      ["cost_result", 237_600, "engine"],
    ]);
  });

  it("describes a percentage line as share × selected (pre-friction) hours", () => {
    const out = runEffortEngine(
      PACK,
      input({ programFactors: { frictionFactor: 1.1 } }),
    );
    const terms = find(out, "AP-PMO-R1", "ROL-PM").formulaTerms!;
    expect(terms.slice(0, 2).map((t) => [t.cellRole, t.value])).toEqual([
      ["percentage", 0.2],
      ["base_hours", 160],
    ]);
  });

  it("refuses to close terms that cannot reconcile (an off-grid result, or a cost that is not hours × rate)", () => {
    const base = [
      {
        label: "fixed",
        value: 1,
        source: "rule:X",
        cellRole: "base_hours" as const,
      },
    ];
    expect(() => closeHoursTerms(base, 1.23456, "hours")).toThrow(
      FormulaTermsReconciliationError,
    );
    expect(
      closeHoursTerms(base, 1.2346, "hours").map((t) => t.cellRole),
    ).toEqual(["base_hours", "rounding", "result"]);
    expect(() =>
      appendCostTerms(
        closeHoursTerms(base, 1, "hours"),
        5_000,
        "rate:x",
        5_001,
      ),
    ).toThrow(FormulaTermsReconciliationError);
    expect(
      appendCostTerms(
        closeHoursTerms(base, 1, "hours"),
        5_000,
        "rate:x",
        5_000,
      ).map((t) => t.cellRole),
    ).toEqual(["base_hours", "result", "rate", "cost_result"]);
  });

  it("an unpriced role line carries hours terms but no rate or cost cells", () => {
    const gappedRates = new Map(RATES);
    gappedRates.set("ROL-QA", rate("ROL-QA", null));
    const out = runEffortEngine(PACK, input({ rates: gappedRates }));
    const terms = find(out, "AP-BUILD-R1", "ROL-QA").formulaTerms!;
    expect(
      terms.some((t) => t.cellRole === "rate" || t.cellRole === "cost_result"),
    ).toBe(false);
    expect(evaluateFormulaTerms(terms)).toEqual({ hours: 12, costCents: null });
  });

  it("carries the engine's step rounding as an explicit term when a plain product would miss by 0.0001h", () => {
    // Two 2h fixed rules, complexity 1.0833, friction 1.05: pack expected
    // round4(4 × 1.0833 × 1.05) = 4.5499; each rule's share round4(4.5499 / 2)
    // = 2.275 — while 2 × 1.0833 × 1.05 = 2.27493 rounds to 2.2749.
    const pack: EffortEnginePack = {
      ...PACK,
      effortRules: [
        rule("AP-BUILD", "R1", "fixed_hours", null, { hours: 2 }, 1),
        rule("AP-BUILD", "R3", "fixed_hours", null, { hours: 2 }, 3),
      ],
      roleMix: [mix("AP-BUILD", "ROL-DEV", 100)],
      archetypeActivityMap: [mapRow("ARCH-ROM", "AP-BUILD")],
    };
    const out = runEffortEngine(
      pack,
      input({
        moduleMultipliers: { "AP-BUILD": { complexityFactor: 1.0833 } },
        programFactors: { frictionFactor: 1.05 },
      }),
    );
    const line = find(out, "AP-BUILD-R1", "ROL-DEV");
    expect(line.roleHours).toBe(2.275);
    const rounding = line.formulaTerms!.filter(
      (t) => t.cellRole === "rounding",
    );
    expect(rounding).toHaveLength(1);
    expect(rounding[0].value).toBeCloseTo(0.00007, 10);
    expect(evaluateFormulaTerms(line.formulaTerms!)?.hours).toBe(2.275);
    expect(evaluateFormulaTerms(line.formulaTerms!)?.costCents).toBe(
      line.laborCostCents,
    );
    assertTermsReconcile(out);
  });

  it.each<[string, Partial<EffortEngineInput>]>([
    ["baseline", {}],
    ["friction", { programFactors: { frictionFactor: 1.1 } }],
    [
      "override + factors",
      {
        unitHoursOverrides: { "AP-BUILD-R2": { unitHours: 7.5, reason: "r" } },
        moduleMultipliers: {
          "AP-RUN": { complexityFactor: 1.17, noveltyFactor: 0.93 },
        },
      },
    ],
    [
      "pod basis",
      {
        pricingBasis: "pod",
        programFactors: { frictionFactor: 1.07 },
        includeConditionalPackCodes: ["AP-NOMIX"],
      },
    ],
    [
      "role-mix gap line",
      {
        includeConditionalPackCodes: ["AP-NOMIX"],
        programFactors: { frictionFactor: 1.3 },
      },
    ],
  ])("every line reconciles on the synthetic pack (%s)", (_name, overrides) => {
    const out = runEffortEngine(PACK, input(overrides));
    expect(assertTermsReconcile(out)).toBeGreaterThan(0);
  });

  it("every line of every archetype in the committed reference pack reconciles, in both bases, with friction and module factors", () => {
    const real = loadRealEffortEnginePack();
    let lines = 0;
    for (const archetype of real.archetypes) {
      const code = archetype.archetype_code;
      const resolved = resolveActivityPacksForArchetype(real, code);
      const drivers: Record<string, number> = {};
      const roles = new Map<string, ResolvedRate>();
      const multipliers: Record<
        string,
        { complexityFactor: number; noveltyFactor: number }
      > = {};
      resolved.forEach((p, i) => {
        for (const r of p.rules)
          if ("driverCode" in r.operation)
            drivers[r.operation.driverCode] = 3 + (i % 4);
        for (const rm of p.roleMix)
          roles.set(rm.roleCode, rate(rm.roleCode, 8_500 + 250 * (i % 5)));
        multipliers[p.pack.activity_pack_code] = {
          complexityFactor: 1 + 0.0417 * (i % 3),
          noveltyFactor: 1 - 0.0333 * (i % 2),
        };
      });
      for (const basis of ["role_mix", "pod"] as const) {
        const out = runEffortEngine(real, {
          archetypeCode: code,
          tenantKey: "test-tenant",
          scenarioKey: "traditional",
          scopeDrivers: drivers,
          rates: roles,
          moduleMultipliers: multipliers,
          programFactors: { frictionFactor: 1.0833 },
          pricingBasis: basis,
        });
        lines += assertTermsReconcile(out);
      }
    }
    expect(lines).toBeGreaterThan(100);
  });
});

describe("rollUpPortfolio — a shared foundation line priced across two use cases counts once", () => {
  // Two use-case archetypes, each with its own build pack, both mapping one
  // shared foundation pack (40h fixed, ARCH role 100% @ $120/hr).
  const pack: EffortEnginePack = {
    modelVersion: V,
    archetypes: [
      {
        model_version: V,
        archetype_code: "ARCH-UC1",
        archetype_name: "UC1",
        description: null,
        status: "active",
      },
      {
        model_version: V,
        archetype_code: "ARCH-UC2",
        archetype_name: "UC2",
        description: null,
        status: "active",
      },
    ],
    activityPacks: [
      activityPack("AP-UC1", "technical"),
      activityPack("AP-UC2", "technical"),
      activityPack("AP-FOUNDATION", "shared_nontechnical"),
    ],
    effortDrivers: [],
    effortRules: [
      rule("AP-UC1", "R1", "fixed_hours", null, { hours: 20 }, 1),
      rule("AP-UC2", "R1", "fixed_hours", null, { hours: 50 }, 1),
      rule("AP-FOUNDATION", "R1", "fixed_hours", null, { hours: 40 }, 1),
    ],
    roleMix: [
      mix("AP-UC1", "ROL-DEV", 100),
      mix("AP-UC2", "ROL-DEV", 100),
      mix("AP-FOUNDATION", "ROL-ARCH", 100),
    ],
    archetypeActivityMap: [
      mapRow("ARCH-UC1", "AP-UC1"),
      mapRow("ARCH-UC1", "AP-FOUNDATION"),
      mapRow("ARCH-UC2", "AP-UC2"),
      mapRow("ARCH-UC2", "AP-FOUNDATION"),
    ],
    rangePolicies: [],
    agentCosts: [],
  };
  const rates = new Map<string, ResolvedRate>([
    ["ROL-DEV", rate("ROL-DEV", 9_000)],
    ["ROL-ARCH", rate("ROL-ARCH", 12_000)],
  ]);
  const shared: Partial<EffortEngineInput> = {
    programFactors: { frictionFactor: 1.1 },
    classificationOverrides: { "AP-FOUNDATION": "shared_program" },
    sharedCostRefs: { "AP-FOUNDATION": "SHARED::foundation" },
    rates,
    scopeDrivers: {},
  };
  let uc1: EffortEngineOutput;
  let uc2: EffortEngineOutput;
  beforeAll(() => {
    uc1 = runEffortEngine(
      pack,
      input({ ...shared, archetypeCode: "ARCH-UC1" }),
    );
    uc2 = runEffortEngine(
      pack,
      input({
        ...shared,
        archetypeCode: "ARCH-UC2",
        unitHoursOverrides: {
          "AP-UC2-R1": { unitHours: 50, reason: "confirmed" },
        },
      }),
    );
  });

  it("prices the foundation identically in both use cases (40h × 1.1 = 44h × $120 = 528,000 cents)", () => {
    expect(find(uc1, "AP-FOUNDATION-R1", "ROL-ARCH").laborCostCents).toBe(
      528_000,
    );
    expect(find(uc2, "AP-FOUNDATION-R1", "ROL-ARCH").laborCostCents).toBe(
      528_000,
    );
  });

  it("counts it once: 198,000 + 495,000 + 528,000 = 1,221,000 (naive 1,749,000)", () => {
    const rollup = rollUpPortfolio([uc1, uc2]);
    // UC1 20h × 1.1 = 22h × $90 = 198,000; UC2 50h × 1.1 = 55h × $90 = 495,000.
    expect(rollup.totalCostCents).toBe(1_221_000);
    expect(rollup.naiveSumCents).toBe(1_749_000);
    expect(
      rollup.lines.find((l) => l.sharedCostRef === "SHARED::foundation")
        ?.occurrenceCount,
    ).toBe(2);
  });
});
