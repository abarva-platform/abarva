/**
 * ROM increment 1 — pod pricer. Members use real role / level / location
 * codes from the reference pack; every rate below is INVENTED and injected
 * through a resolver that carries its own provenance terms.
 */
import { evaluateFormulaTerms } from "../formula-terms";
import {
  pricePod,
  wholePeriods,
  type PodMember,
  type PodPricingInput,
  type PodPricingResult,
  type PodRateResolver,
  type ResolvedPodRate,
} from "../pod-pricer";

/** Builds an injected resolver whose rates are invented base cents × an invented location factor. */
function fixtureResolver(
  rates: Record<string, { baseCents: number; locationFactor: number }>,
): PodRateResolver {
  return (member: PodMember) => {
    const key = `${member.roleCode}-${member.levelCode}@${member.locationCode}`;
    const entry = rates[key];
    if (!entry)
      return {
        ok: false,
        code: "fixture_missing",
        message: `no fixture rate for ${key}`,
      };
    const hourlyRateCents = Math.round(entry.baseCents * entry.locationFactor);
    const rate: ResolvedPodRate = {
      basis: "loaded_cost",
      currency: "USD",
      baseSource: `rate_band:${member.roleCode}-${member.levelCode}:loaded_rate`,
      baseRateCents: entry.baseCents,
      location: {
        source: `location:${member.locationCode}:salary_multiplier`,
        value: entry.locationFactor,
        notAppliedReason: null,
      },
      provider: {
        source: "provider_class:none:not_applied",
        value: 1,
        notAppliedReason: "cost basis",
      },
      hourlyRateCents,
      rateTerms: [
        {
          label: "band",
          value: entry.baseCents,
          source: "rate_band",
          cellRole: "rate",
        },
        {
          label: "location",
          value: entry.locationFactor,
          source: "location",
          cellRole: "factor",
        },
        {
          label: "provider",
          value: 1,
          source: "provider_class",
          cellRole: "factor",
        },
        {
          label: "hourly rate (cents)",
          value: hourlyRateCents,
          source: "engine",
          cellRole: "result",
        },
      ],
      trace: `fixture ${key}`,
      notes: [],
    };
    return rate;
  };
}

const RESOLVER = fixtureResolver({
  "ROL-002-LVL-04@LOC-DALLAS": { baseCents: 9_000, locationFactor: 1 }, // $90.00/hr
  "ROL-150-LVL-03@LOC-INDIA-TIER-1": { baseCents: 15_000, locationFactor: 0.4 }, // $150 × 0.4 = $60.00/hr
});

const MEMBERS: PodMember[] = [
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
];

function input(overrides: Partial<PodPricingInput> = {}): PodPricingInput {
  return {
    adjustedHours: 131,
    pod: { podCode: "POD-T", members: MEMBERS },
    hoursPerFteWeek: 40,
    productiveShare: 0.65,
    rateResolver: RESOLVER,
    ...overrides,
  };
}

function ok(result: ReturnType<typeof pricePod>): PodPricingResult {
  if (!result.ok) throw new Error(`refused: ${result.code} ${result.message}`);
  return result;
}

describe("pricePod — weeks, cost and rounding slack", () => {
  it("buys whole weeks: ceil(131 / (2.5 × 40 × 0.65 = 65)) = 3, and prices every paid hour at the resolved rate", () => {
    const r = ok(pricePod(input()));
    expect(r.totalFte).toBe(2.5);
    expect(r.productiveHoursPerWeek).toBe(65);
    expect(r.weeks).toBe(3);
    expect(r.productiveCapacityHours).toBe(195);
    // 1.5 × 3 × 40 = 180h × $90 = 1,620,000; 1 × 3 × 40 = 120h × $60 = 720,000.
    expect(
      r.memberLines.map((l) => [
        l.paidHours,
        l.rate.hourlyRateCents,
        l.costCents,
      ]),
    ).toEqual([
      [180, 9_000, 1_620_000],
      [120, 6_000, 720_000],
    ]);
    expect(r.laborCostCents).toBe(2_340_000);
    expect(r.totalCostCents).toBe(2_340_000);
    expect(r.memberLines[1].rate.baseSource).toBe(
      "rate_band:ROL-150-LVL-03:loaded_rate",
    );
  });

  it("reports the capacity bought beyond the hours as its own slack line, inside labor (195 − 131 = 64h; 2,340,000 × 64/195 = 768,000)", () => {
    const r = ok(pricePod(input()));
    expect(r.roundingSlack).toEqual({
      productiveHours: 64,
      costCents: 768_000,
    });
    expect(r.formulaTrace).toContain("= 3 weeks");
    expect(r.formulaTrace).toContain(
      "rounding slack 64 productive h ($7680.00, included)",
    );
  });

  it("member formula terms reconcile to paid hours and cost", () => {
    const r = ok(pricePod(input()));
    for (const line of r.memberLines) {
      expect(evaluateFormulaTerms(line.formulaTerms)).toEqual({
        hours: line.paidHours,
        costCents: line.costCents,
      });
      expect(line.formulaTerms.find((t) => t.cellRole === "rate")?.source).toBe(
        `resolved:${line.rate.baseSource}`,
      );
    }
  });

  it("an exact multiple buys no slack (130h = 2 weeks)", () => {
    const r = ok(pricePod(input({ adjustedHours: 130 })));
    expect(r.weeks).toBe(2);
    expect(r.roundingSlack).toEqual({ productiveHours: 0, costCents: 0 });
    expect(r.laborCostCents).toBe(1_560_000);
  });

  it("applies the productive share to capacity ONLY — never to the hours (share 1: 131h at 100h/week = 2 weeks)", () => {
    const r = ok(pricePod(input({ productiveShare: 1 })));
    expect(r.productiveHoursPerWeek).toBe(100);
    expect(r.weeks).toBe(2);
    expect(r.roundingSlack.productiveHours).toBe(69);
    expect(r.adjustedHours).toBe(131);
  });

  it("zero hours buys zero weeks at zero cost", () => {
    const r = ok(pricePod(input({ adjustedHours: 0 })));
    expect(r.weeks).toBe(0);
    expect(r.totalCostCents).toBe(0);
    expect(r.roundingSlack).toEqual({ productiveHours: 0, costCents: 0 });
  });

  it("does not buy an extra week for floating-point noise in the division (386.1h at 29.7h/week is exactly 13 weeks)", () => {
    const r = ok(
      pricePod(
        input({
          adjustedHours: 386.1,
          pod: { podCode: "P", members: [{ ...MEMBERS[0], fte: 1.5 }] },
          hoursPerFteWeek: 36,
          productiveShare: 0.55,
        }),
      ),
    );
    expect(r.productiveHoursPerWeek).toBe(29.7);
    expect(r.weeks).toBe(13);
    expect(r.roundingSlack.productiveHours).toBe(0);
  });

  it("rounds the weekly capacity so a noisy product (4.5 × 40 × 0.7) reads 126, and 252h is 2 weeks with no slack", () => {
    const r = ok(
      pricePod(
        input({
          adjustedHours: 252,
          pod: { podCode: "P", members: [{ ...MEMBERS[0], fte: 4.5 }] },
          productiveShare: 0.7,
        }),
      ),
    );
    expect(r.productiveHoursPerWeek).toBe(126);
    expect(r.weeks).toBe(2);
    expect(r.roundingSlack.productiveHours).toBe(0);
  });

  it("a zero-FTE member is allowed while the pod total is positive, and costs nothing", () => {
    const r = ok(
      pricePod(
        input({
          pod: {
            podCode: "P",
            members: [...MEMBERS, { ...MEMBERS[0], fte: 0 }],
          },
        }),
      ),
    );
    expect(r.memberLines[2].costCents).toBe(0);
    expect(r.laborCostCents).toBe(2_340_000);
  });

  it("is deterministic", () => {
    expect(pricePod(input())).toEqual(pricePod(input()));
  });
});

describe("pricePod — tool licences are extra cost lines with no productivity credit", () => {
  const licences: PodPricingInput["toolLicences"] = [
    {
      code: "LIC-W",
      label: "weekly tool",
      per: "pod_week",
      quantity: 1,
      costCentsPerUnit: 5_000,
      source: "fixture:weekly",
    },
    {
      code: "LIC-M",
      label: "seat",
      per: "month",
      quantity: 2,
      costCentsPerUnit: 4_500,
      weeksPerMonth: 2,
      source: "fixture:seat",
    },
  ];

  it("charges per pod-week (3 × 1 × $50 = $150) and per whole month (ceil(3/2) = 2 × 2 seats × $45 = $180)", () => {
    const r = ok(pricePod(input({ toolLicences: licences })));
    expect(
      r.toolLicenceLines.map((l) => [l.licence.code, l.periods, l.costCents]),
    ).toEqual([
      ["LIC-W", 3, 15_000],
      ["LIC-M", 2, 18_000],
    ]);
    expect(r.toolLicenceCostCents).toBe(33_000);
    expect(r.totalCostCents).toBe(2_340_000 + 33_000);
    for (const line of r.toolLicenceLines)
      expect(evaluateFormulaTerms(line.formulaTerms)?.costCents).toBe(
        line.costCents,
      );
    expect(r.formulaTrace).toContain(
      "tool licences LIC-W 3 × 1 × $50.00 = $150.00",
    );
  });

  it("leaves hours, weeks, labor and slack exactly as they are without licences", () => {
    const without = ok(pricePod(input()));
    const withLicences = ok(pricePod(input({ toolLicences: licences })));
    expect([
      withLicences.weeks,
      withLicences.laborCostCents,
      withLicences.roundingSlack,
    ]).toEqual([without.weeks, without.laborCostCents, without.roundingSlack]);
  });

  it("an exact number of months is not rounded up (4 weeks at 2 weeks/month = 2 months)", () => {
    expect(wholePeriods(4, 2)).toBe(2);
    expect(wholePeriods(5, 2)).toBe(3);
    expect(wholePeriods(386.1, 29.7)).toBe(13);
  });
});

describe("pricePod — typed refusals, never NaN", () => {
  it.each<[string, Partial<PodPricingInput>]>([
    ["invalid_adjusted_hours", { adjustedHours: -1 }],
    ["invalid_adjusted_hours", { adjustedHours: Number.NaN }],
    ["invalid_hours_per_fte_week", { hoursPerFteWeek: 0 }],
    [
      "invalid_hours_per_fte_week",
      { hoursPerFteWeek: Number.POSITIVE_INFINITY },
    ],
    ["invalid_productive_share", { productiveShare: 0 }],
    ["invalid_productive_share", { productiveShare: 1.01 }],
    ["invalid_productive_share", { productiveShare: Number.NaN }],
    ["empty_pod", { pod: { podCode: "P", members: [] } }],
    [
      "invalid_member",
      {
        pod: { podCode: "P", members: [{ ...MEMBERS[0], locationCode: " " }] },
      },
    ],
    [
      "invalid_member",
      { pod: { podCode: "P", members: [{ ...MEMBERS[0], levelCode: "" }] } },
    ],
    [
      "invalid_fte",
      {
        pod: {
          podCode: "P",
          members: [{ ...MEMBERS[0], fte: -0.5 }, MEMBERS[1]],
        },
      },
    ],
    [
      "invalid_fte",
      { pod: { podCode: "P", members: [{ ...MEMBERS[0], fte: Number.NaN }] } },
    ],
    [
      "non_positive_total_fte",
      { pod: { podCode: "P", members: [{ ...MEMBERS[0], fte: 0 }] } },
    ],
    [
      "rate_unresolved",
      {
        pod: {
          podCode: "P",
          members: [{ ...MEMBERS[0], locationCode: "LOC-NYC" }],
        },
      },
    ],
    [
      "invalid_tool_licence",
      {
        toolLicences: [
          {
            code: "L",
            label: "l",
            per: "month",
            quantity: 1,
            costCentsPerUnit: 1,
            source: "s",
          },
        ],
      },
    ],
    [
      "invalid_tool_licence",
      {
        toolLicences: [
          {
            code: "L",
            label: "l",
            per: "pod_week",
            quantity: -1,
            costCentsPerUnit: 1,
            source: "s",
          },
        ],
      },
    ],
    [
      "invalid_tool_licence",
      {
        toolLicences: [
          {
            code: "L",
            label: "l",
            per: "pod_week",
            quantity: 1,
            costCentsPerUnit: -1,
            source: "s",
          },
        ],
      },
    ],
    [
      "invalid_tool_licence",
      {
        toolLicences: [
          {
            code: "L",
            label: "l",
            per: "year" as "month",
            quantity: 1,
            costCentsPerUnit: 1,
            source: "s",
          },
        ],
      },
    ],
  ])("refuses as %s", (code, overrides) => {
    const r = pricePod(input(overrides));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe(code);
    expect(r.message.length).toBeGreaterThan(0);
  });

  it("carries the resolver's own refusal when a rate cannot be resolved", () => {
    const r = pricePod(
      input({
        pod: {
          podCode: "P",
          members: [{ ...MEMBERS[0], locationCode: "LOC-NYC" }],
        },
      }),
    );
    expect(r.ok === false && r.rateRefusal?.code).toBe("fixture_missing");
  });

  it("refuses a resolved rate that is negative or whose provenance terms do not reconcile", () => {
    const good = RESOLVER(MEMBERS[0]) as ResolvedPodRate;
    const negative: PodRateResolver = () => ({ ...good, hourlyRateCents: -1 });
    const mismatched: PodRateResolver = () => ({
      ...good,
      hourlyRateCents: good.hourlyRateCents + 1,
    });
    const bare: PodRateResolver = () => ({ ...good, rateTerms: [] });
    expect(pricePod(input({ rateResolver: negative }))).toMatchObject({
      ok: false,
      code: "invalid_rate",
    });
    expect(pricePod(input({ rateResolver: mismatched }))).toMatchObject({
      ok: false,
      code: "rate_provenance_mismatch",
    });
    expect(pricePod(input({ rateResolver: bare }))).toMatchObject({
      ok: false,
      code: "rate_provenance_mismatch",
    });
  });

  it("a productive share of exactly 1 and a zero rate are valid", () => {
    expect(pricePod(input({ productiveShare: 1 })).ok).toBe(true);
    const zero = fixtureResolver({
      "ROL-002-LVL-04@LOC-DALLAS": { baseCents: 0, locationFactor: 1 },
    });
    const r = ok(
      pricePod(
        input({
          pod: { podCode: "P", members: [MEMBERS[0]] },
          rateResolver: zero,
        }),
      ),
    );
    expect(r.totalCostCents).toBe(0);
  });
});
