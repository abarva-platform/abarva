/**
 * ROM increment 1 — pod rate adapter over the cost foundation.
 *
 * The first suites use REAL role / level / location / provider-class codes
 * with INVENTED rates and multipliers, so every expectation is
 * hand-computable. The last suite runs against the committed reference CSVs
 * and asserts only relationships computed from the rows it reads.
 */
import { evaluateRateTerms } from "../formula-terms";
import { dollarsToCents } from "../money";
import {
  pricePod,
  type PodMember,
  type PodRateRefusal,
  type ResolvedPodRate,
} from "../pod-pricer";
import {
  createReferencePodRateResolver,
  toolLicenceFromAgentCost,
  type PodRateReference,
} from "../pod-rate-adapter";
import { resolveRoleRate } from "../rate-card-resolver";
import {
  loadRealEffortEnginePack,
  loadRealPodRateReference,
} from "../__fixtures__/test-fixtures";

function band(
  code: string,
  loaded: number | null,
  scarcity: number | null,
  bill: number | null,
  rateBasis = "onshore_si_t1_benchmark",
) {
  return {
    rate_band_code: code,
    role_code: code.slice(0, 7),
    level_code: code.slice(8),
    currency: "USD",
    rate_basis: rateBasis,
    loaded_rate: loaded,
    scarcity_adj_rate: scarcity,
    indicative_bill_rate: bill,
    confidence: "medium",
    approval_status: "global_starter_unapproved",
  };
}

const REFERENCE: Omit<PodRateReference, "basis"> = {
  rateBands: [
    band("ROL-002-LVL-04", 80, 96, 150),
    band("ROL-150-LVL-03", 60, 70, 120),
    band("ROL-001-LVL-01", 200, 240, 400, "offshore_custom_benchmark"),
    band("ROL-003-LVL-05", null, 90, 170),
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
      salary_multiplier: 0.35,
      rate_multiplier: 0.45,
    },
    {
      location_code: "LOC-NYC",
      shore_category: "onshore",
      salary_multiplier: 1.2,
      rate_multiplier: 1.15,
    },
  ],
  providerClasses: [
    { provider_class_code: "SI-T1", tier_multiplier: 1.25 },
    { provider_class_code: "CONS-T1", tier_multiplier: 1.5 },
    { provider_class_code: "SI-T2", tier_multiplier: 0.75 },
  ],
};

function member(overrides: Partial<PodMember> = {}): PodMember {
  return {
    roleCode: "ROL-002",
    levelCode: "LVL-04",
    locationCode: "LOC-INDIA-TIER-1",
    fte: 1,
    ...overrides,
  };
}

function resolved(result: ResolvedPodRate | PodRateRefusal): ResolvedPodRate {
  if ("ok" in result)
    throw new Error(`refused: ${result.code} ${result.message}`);
  return result;
}

describe("evaluateRateTerms", () => {
  it("is null when there is no rate or factor term at all (a rate with no provenance)", () => {
    expect(evaluateRateTerms([])).toBeNull();
    expect(
      evaluateRateTerms([
        {
          label: "hourly rate (cents)",
          value: 1,
          source: "engine",
          cellRole: "result",
        },
      ]),
    ).toBeNull();
    expect(
      evaluateRateTerms([
        { label: "base", value: 1, source: "s", cellRole: "rate" },
        { label: "loc", value: 0.5, source: "s", cellRole: "factor" },
      ]),
    ).toBe(1);
  });
});

describe("createReferencePodRateResolver — cost bases", () => {
  const loaded = createReferencePodRateResolver({
    ...REFERENCE,
    basis: "loaded_cost",
  });

  it("loaded cost = band loaded_rate × location salary multiplier; provider shown as 1.00, not applied", () => {
    const r = resolved(loaded(member({ providerClassCode: "CONS-T1" })));
    // $80.00 × 0.35 = $28.00
    expect(r.hourlyRateCents).toBe(2_800);
    expect(r.baseSource).toBe("rate_band:ROL-002-LVL-04:loaded_rate");
    expect(r.location).toEqual({
      source: "location:LOC-INDIA-TIER-1:salary_multiplier",
      value: 0.35,
      notAppliedReason: null,
    });
    expect(r.provider.value).toBe(1);
    expect(r.provider.notAppliedReason).toContain(
      "cost basis is provider-independent",
    );
    expect(r.trace).toBe(
      "rate = band ROL-002-LVL-04 loaded_rate $80.00 × location LOC-INDIA-TIER-1 0.35 × provider 1.00 " +
        "(not applied: provider-class tier multipliers price a provider's charge; a cost basis is provider-independent) = $28.00/hr",
    );
    expect(r.rateTerms.map((t) => [t.cellRole, t.value, t.source])).toEqual([
      ["rate", 8_000, "rate_band:ROL-002-LVL-04:loaded_rate"],
      ["factor", 0.35, "location:LOC-INDIA-TIER-1:salary_multiplier"],
      ["factor", 1, "provider_class:CONS-T1:not_applied"],
      ["result", 2_800, "engine"],
    ]);
    expect(evaluateRateTerms(r.rateTerms)).toBe(r.hourlyRateCents);
    expect(r.notes).toContain(
      "band confidence medium, approval global_starter_unapproved",
    );
  });

  it("scarcity-adjusted cost reads scarcity_adj_rate ($96.00 × NYC salary 1.2 = $115.20)", () => {
    const r = resolved(
      createReferencePodRateResolver({
        ...REFERENCE,
        basis: "scarcity_adjusted_cost",
      })(member({ locationCode: "LOC-NYC" })),
    );
    expect(r.hourlyRateCents).toBe(11_520);
    expect(r.baseSource).toBe("rate_band:ROL-002-LVL-04:scarcity_adj_rate");
  });
});

describe("createReferencePodRateResolver — bill rate", () => {
  const bill = createReferencePodRateResolver({
    ...REFERENCE,
    basis: "bill_rate",
  });

  it("rebases the SI-T1 benchmark to the member's class: $150 × NYC rate 1.15 × (1.5 ÷ 1.25 = 1.2) = $207.00", () => {
    const r = resolved(
      bill(member({ locationCode: "LOC-NYC", providerClassCode: "CONS-T1" })),
    );
    expect(r.hourlyRateCents).toBe(20_700);
    expect(r.location.source).toBe("location:LOC-NYC:rate_multiplier");
    expect(r.provider).toEqual({
      source: "provider_class:CONS-T1/SI-T1",
      value: 1.2,
      notAppliedReason: null,
    });
    expect(r.baseSource).toBe("rate_band:ROL-002-LVL-04:indicative_bill_rate");
  });

  it("with no provider class, the band's own benchmark applies at 1.00", () => {
    const r = resolved(bill(member({ locationCode: "LOC-DALLAS" })));
    expect(r.hourlyRateCents).toBe(15_000);
    expect(r.provider.source).toBe("provider_class:SI-T1/SI-T1");
  });

  it("a cheaper class rebases down: $150 × (0.75 ÷ 1.25 = 0.6) × India rate 0.45 = $40.50", () => {
    const r = resolved(bill(member({ providerClassCode: "SI-T2" })));
    expect(r.provider.value).toBe(0.6);
    expect(r.hourlyRateCents).toBe(4_050);
  });

  it("uses the existing resolver's client rate-card line as-is, with location and provider marked not applied", () => {
    const withCard = createReferencePodRateResolver({
      ...REFERENCE,
      basis: "bill_rate",
      rateCard: {
        roles: [
          { role_code: "ROL-002", default_rate_band_code: "ROL-002-LVL-04" },
        ],
        clientLines: [
          {
            role_or_band_ref: "ROL-002",
            level: "LVL-04",
            rate_value: 140,
            currency: "USD",
            card_version_id: "cv-1",
          },
        ],
        globalLines: [],
      },
    });
    const r = resolved(withCard(member({ providerClassCode: "CONS-T1" })));
    expect(r.hourlyRateCents).toBe(14_000);
    expect(r.baseSource).toBe("client_rate_card:cv-1");
    expect([r.location.value, r.provider.value]).toEqual([1, 1]);
    expect(r.location.notAppliedReason).toContain(
      "does not match a line's location_ref/provider_ref",
    );
    expect(r.provider.notAppliedReason).toContain("used as-is");
    expect(evaluateRateTerms(r.rateTerms)).toBe(14_000);
    // A role with no card line still falls through to its band.
    expect(
      resolved(
        withCard(
          member({
            roleCode: "ROL-150",
            levelCode: "LVL-03",
            locationCode: "LOC-DALLAS",
          }),
        ),
      ).hourlyRateCents,
    ).toBe(12_000);
  });

  it("a global rate-card line is also used as-is", () => {
    const withGlobal = createReferencePodRateResolver({
      ...REFERENCE,
      basis: "bill_rate",
      rateCard: {
        roles: [],
        clientLines: [],
        globalLines: [
          {
            role_or_band_ref: "ROL-002",
            level: null,
            rate_value: 130,
            currency: "USD",
            card_version_id: "gv-2",
          },
        ],
      },
    });
    const r = resolved(withGlobal(member()));
    expect([r.hourlyRateCents, r.baseSource]).toEqual([
      13_000,
      "global_rate_card:gv-2",
    ]);
  });

  it("a cost basis never reads a rate card (cards carry charge rates, not cost)", () => {
    const loadedWithCard = createReferencePodRateResolver({
      ...REFERENCE,
      basis: "loaded_cost",
      rateCard: {
        roles: [],
        clientLines: [
          {
            role_or_band_ref: "ROL-002",
            level: "LVL-04",
            rate_value: 140,
            currency: "USD",
            card_version_id: "cv-1",
          },
        ],
        globalLines: [],
      },
    });
    expect(resolved(loadedWithCard(member())).baseSource).toBe(
      "rate_band:ROL-002-LVL-04:loaded_rate",
    );
  });
});

describe("createReferencePodRateResolver — typed refusals, never a default rate", () => {
  it.each<
    [
      string,
      PodRateReference["basis"],
      Partial<PodMember>,
      Partial<PodRateReference>,
    ]
  >([
    ["unknown_location", "loaded_cost", { locationCode: "LOC-NOWHERE" }, {}],
    [
      "unknown_provider_class",
      "loaded_cost",
      { providerClassCode: "NOPE" },
      {},
    ],
    ["no_rate_band", "loaded_cost", { levelCode: "LVL-09" }, {}],
    [
      "rate_band_column_empty",
      "loaded_cost",
      { roleCode: "ROL-003", levelCode: "LVL-05" },
      {},
    ],
    [
      "unsupported_band_rate_basis",
      "loaded_cost",
      { roleCode: "ROL-001", levelCode: "LVL-01" },
      {},
    ],
    ["rate_missing", "bill_rate", { levelCode: "LVL-09" }, {}],
    [
      "unknown_provider_class",
      "bill_rate",
      {},
      {
        providerClasses: [
          { provider_class_code: "CONS-T1", tier_multiplier: 1.5 },
        ],
      },
    ],
  ])(
    "refuses as %s (%s)",
    (code, basis, memberOverrides, referenceOverrides) => {
      const resolver = createReferencePodRateResolver({
        ...REFERENCE,
        ...referenceOverrides,
        basis,
      });
      const result = resolver(member(memberOverrides));
      expect("ok" in result && result.code).toBe(code);
    },
  );

  it("a refusal reaches pricePod as rate_unresolved", () => {
    const r = pricePod({
      adjustedHours: 100,
      pod: { podCode: "P", members: [member({ locationCode: "LOC-NOWHERE" })] },
      hoursPerFteWeek: 40,
      productiveShare: 0.65,
      rateResolver: createReferencePodRateResolver({
        ...REFERENCE,
        basis: "loaded_cost",
      }),
    });
    expect(r).toMatchObject({
      ok: false,
      code: "rate_unresolved",
      rateRefusal: { code: "unknown_location" },
    });
  });
});

describe("toolLicenceFromAgentCost", () => {
  const agentCosts = loadRealEffortEnginePack().agentCosts;

  it("turns a per-seat-per-month reference row into a month-based licence line with its provenance", () => {
    const row = agentCosts.find((r) => r.unit === "USD/engineer-seat/month")!;
    const licence = toolLicenceFromAgentCost(row, {
      quantity: 3,
      weeksPerMonth: 4,
    });
    expect(licence).toEqual({
      code: row.agent_cost_code,
      label: row.cost_key,
      per: "month",
      quantity: 3,
      costCentsPerUnit: dollarsToCents(row.cost_value),
      weeksPerMonth: 4,
      source: `agent_cost:${row.agent_cost_code}:${row.cost_key}`,
    });
  });

  it("accepts a flat USD/month row and refuses a non-periodic unit", () => {
    expect(
      "ok" in
        toolLicenceFromAgentCost(
          {
            agent_cost_code: "A",
            cost_key: "k",
            cost_value: 10,
            unit: "USD/month",
          },
          { quantity: 1, weeksPerMonth: 4 },
        ),
    ).toBe(false);
    const oneOff = agentCosts.find((r) => !/month$/.test(r.unit))!;
    expect(
      toolLicenceFromAgentCost(oneOff, { quantity: 1, weeksPerMonth: 4 }),
    ).toMatchObject({ ok: false, code: "unsupported_licence_unit" });
    expect(
      toolLicenceFromAgentCost(
        {
          agent_cost_code: "A",
          cost_key: "k",
          cost_value: -5,
          unit: "USD/month",
        },
        { quantity: 1, weeksPerMonth: 4 },
      ),
    ).toMatchObject({
      ok: false,
      code: "invalid_licence_cost",
    });
  });
});

describe("against the committed reference pack (relationships only, no pinned rates)", () => {
  const real = loadRealPodRateReference();

  it("resolves every committed band under every basis at a 1.0 onshore location with the benchmark class", () => {
    const dallas = real.locations.find(
      (l) => l.location_code === "LOC-DALLAS",
    )!;
    expect([dallas.salary_multiplier, dallas.rate_multiplier]).toEqual([1, 1]);
    for (const basis of [
      "loaded_cost",
      "scarcity_adjusted_cost",
      "bill_rate",
    ] as const) {
      const resolver = createReferencePodRateResolver({ ...real, basis });
      for (const b of real.rateBands) {
        const r = resolved(
          resolver({
            roleCode: b.role_code,
            levelCode: b.level_code,
            locationCode: "LOC-DALLAS",
            fte: 1,
          }),
        );
        const column =
          basis === "loaded_cost"
            ? b.loaded_rate
            : basis === "scarcity_adjusted_cost"
              ? b.scarcity_adj_rate
              : b.indicative_bill_rate;
        expect(r.hourlyRateCents).toBe(dollarsToCents(column!));
      }
    }
  });

  it("an offshore loaded cost is the band's loaded rate × that location's salary multiplier", () => {
    const b = real.rateBands.find(
      (x) => x.rate_band_code === "ROL-002-LVL-04",
    )!;
    const loc = real.locations.find(
      (l) => l.location_code === "LOC-INDIA-TIER-1",
    )!;
    const r = resolved(
      createReferencePodRateResolver({ ...real, basis: "loaded_cost" })(
        member(),
      ),
    );
    expect(r.hourlyRateCents).toBe(
      Math.round(dollarsToCents(b.loaded_rate!) * loc.salary_multiplier * 1),
    );
  });

  it("a bill rate starts from exactly what rate-card-resolver.ts returns for the same role and level", () => {
    const viaResolver = resolveRoleRate("ROL-002", "LVL-04", {
      roles: [],
      clientLines: [],
      globalLines: [],
      rateBands: real.rateBands,
    });
    const loc = real.locations.find((l) => l.location_code === "LOC-UK")!;
    const tiers = new Map(
      real.providerClasses.map((p) => [
        p.provider_class_code,
        p.tier_multiplier,
      ]),
    );
    const factor =
      Math.round((tiers.get("AI-B")! / tiers.get("SI-T1")!) * 10000) / 10000;
    const r = resolved(
      createReferencePodRateResolver({ ...real, basis: "bill_rate" })(
        member({ locationCode: "LOC-UK", providerClassCode: "AI-B" }),
      ),
    );
    expect(r.baseRateCents).toBe(viaResolver.hourlyRateCents);
    expect(r.provider.value).toBe(factor);
    expect(r.hourlyRateCents).toBe(
      Math.round(viaResolver.hourlyRateCents! * loc.rate_multiplier * factor),
    );
  });

  it("prices a pod end to end from the reference pack, every member carrying its rate trace", () => {
    const r = pricePod({
      adjustedHours: 300,
      pod: {
        podCode: "POD-REF",
        members: [
          {
            roleCode: "ROL-002",
            levelCode: "LVL-04",
            locationCode: "LOC-DALLAS",
            fte: 1,
          },
          {
            roleCode: "ROL-150",
            levelCode: "LVL-03",
            locationCode: "LOC-INDIA-TIER-1",
            fte: 2,
          },
        ],
      },
      hoursPerFteWeek: 40,
      productiveShare: 0.65,
      rateResolver: createReferencePodRateResolver({
        ...real,
        basis: "loaded_cost",
      }),
    });
    if (!r.ok) throw new Error(r.message);
    // 3 FTE × 40 × 0.65 = 78 h/week; ceil(300 / 78) = 4 weeks.
    expect(r.weeks).toBe(4);
    for (const line of r.memberLines) {
      expect(
        line.rate.trace.startsWith(
          `rate = band ${line.member.roleCode}-${line.member.levelCode} loaded_rate`,
        ),
      ).toBe(true);
      expect(line.costCents).toBe(
        Math.round(line.paidHours * line.rate.hourlyRateCents),
      );
    }
  });
});
