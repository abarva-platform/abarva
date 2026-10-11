/**
 * ROM service — exact arithmetic over synthetic counts and invented unit
 * hours, the shared foundation counted once, the named not-designed band,
 * and every refusal a structure can earn.
 *
 * Every number below is invented for the test. The reference rows are
 * synthetic too (two rate bands, one location, one provider class) so the
 * rate arithmetic is visible: 100.00 × 0.5 = 5000 cents, 70.00 × 0.5 = 3500.
 */
import {
  evaluateFormulaTerms,
  evaluateRateTerms,
} from "../../effort-engine/formula-terms";
import type { PodTemplateLibrary } from "../../effort-engine/pod-templates";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadRealPodRateReference } from "../../effort-engine/__fixtures__/test-fixtures";
import {
  parsePodLibrary,
  readPodLibraryDir,
} from "../../reference-pack-loader";
import {
  createCommittedRomReferenceLoaders,
  ROM_REFERENCE_PACK_RELATIVE_DIR,
} from "../rom-reference";
import {
  computeRom,
  foundationSharedCostRef,
  romMemberMappingStatus,
  ROM_NOT_DESIGNED_RANGE,
  type RomReferenceLoaders,
  type RomResult,
  type RomStructure,
} from "../rom-service";

const RANGE_POLICIES = [
  {
    policy_code: "T-TIGHT",
    policy_name: "Tight",
    min_score: 0,
    max_score: 2,
    low_multiplier: 0.9,
    high_multiplier: 1.15,
  },
  {
    policy_code: "T-STANDARD",
    policy_name: "Standard",
    min_score: 3,
    max_score: 5,
    low_multiplier: 0.8,
    high_multiplier: 1.3,
  },
  {
    policy_code: "T-WIDE",
    policy_name: "Wide",
    min_score: 6,
    max_score: 10,
    low_multiplier: 0.6,
    high_multiplier: 1.6,
  },
];

const EMPTY_LIBRARY: PodTemplateLibrary = {
  podTemplates: [],
  podTemplateRoles: [],
};

function band(code: string, role: string, level: string, loaded: number) {
  return {
    rate_band_code: code,
    role_code: role,
    level_code: level,
    currency: "USD",
    rate_basis: "onshore_si_t1_benchmark",
    loaded_rate: loaded,
    scarcity_adj_rate: loaded * 1.2,
    indicative_bill_rate: loaded * 2,
    confidence: "test",
    approval_status: "synthetic",
  };
}

function testLoaders(
  overrides: Partial<RomReferenceLoaders> = {},
): RomReferenceLoaders {
  return {
    loadRateReference: () => ({
      rateBands: [
        band("ROL-T01-LVL-T1", "ROL-T01", "LVL-T1", 100),
        band("ROL-T02-LVL-T2", "ROL-T02", "LVL-T2", 70),
      ],
      locations: [
        {
          location_code: "LOC-TEST",
          shore_category: "onshore",
          salary_multiplier: 0.5,
          rate_multiplier: 1,
        },
      ],
      providerClasses: [
        { provider_class_code: "SI-T1", tier_multiplier: 1.25 },
      ],
    }),
    loadPodLibrary: () => EMPTY_LIBRARY,
    loadRangePolicies: () => RANGE_POLICIES,
    ...overrides,
  };
}

const UNIT = (value: number) => ({
  value,
  source: "test: invented unit hours",
  confidence: "low" as const,
});

function golden(): RomStructure {
  return {
    useCases: [
      {
        code: "UC-A",
        name: "Use case A",
        counts: {
          data_source_count: 2,
          source_table_count: 10,
          standard_data_entity_count: 3,
          dashboard_view_count: 1,
          design_row_count: 40,
          validation_row_count: 20,
        },
      },
      {
        code: "UC-B",
        name: "Use case B",
        counts: {
          data_source_count: 1,
          source_table_count: 4,
          standard_data_entity_count: 2,
          dashboard_view_count: 5,
          design_row_count: 80,
          validation_row_count: 16,
        },
      },
    ],
    unitHours: {
      data_source_count: UNIT(16),
      source_table_count: UNIT(3),
      standard_data_entity_count: UNIT(12),
      dashboard_view_count: UNIT(20),
      design_row_count: UNIT(0.5),
      validation_row_count: UNIT(0.25),
    },
    releases: [
      {
        code: "R1",
        name: "Release one",
        designStatus: "not_designed",
        useCaseCodes: ["UC-A"],
      },
      {
        code: "R2",
        name: "Release two",
        designStatus: "designed",
        useCaseCodes: ["UC-B"],
        rangeInputs: {
          scopeMaturity: "low",
          evidenceQuality: "low",
          deliveryNovelty: "low",
          quantityUncertainty: "low",
          rateCardCoveragePct: 95,
        },
      },
    ],
    foundation: {
      code: "F",
      name: "Shared foundation",
      designStatus: "not_designed",
      counts: {
        data_source_count: 3,
        source_table_count: 6,
        design_row_count: 10,
      },
    },
    pod: {
      members: [
        { roleCode: "ROL-T01", levelCode: "LVL-T1", fte: 1 },
        { roleCode: "ROL-T02", levelCode: "LVL-T2", fte: 2 },
      ],
      locationCode: "LOC-TEST",
      rateBasis: "loaded_cost",
    },
    friction: { value: 1.1, source: "test: invented friction" },
    productiveShare: { value: 0.8, source: "test: invented share" },
    hoursPerFteWeek: { value: 40, source: "test: invented week" },
  };
}

/** One release whose hours are exactly three pod-weeks, up to float noise. */
const NOISY_WHOLE_WEEKS: RomStructure = {
  ...golden(),
  useCases: [{ code: "UC-N", name: "Noisy", counts: { data_source_count: 1 } }],
  unitHours: { data_source_count: UNIT(226.8) },
  releases: [
    {
      code: "R1",
      name: "One",
      designStatus: "not_designed",
      useCaseCodes: ["UC-N"],
    },
  ],
  foundation: null,
  friction: { value: 1, source: "test: no friction" },
  productiveShare: { value: 0.7, source: "test: invented share" },
  hoursPerFteWeek: { value: 36, source: "test: invented week" },
};

function priced(structure: unknown, loaders = testLoaders()): RomResult {
  const result = computeRom(structure, loaders);
  if (!result.ok)
    throw new Error(
      `expected a priced ROM, got ${result.code}: ${result.message}`,
    );
  return result;
}

function refused(structure: unknown, loaders = testLoaders()) {
  const result = computeRom(structure, loaders);
  if (result.ok) throw new Error("expected a refusal");
  return result;
}

type DeepMutable<T> = T extends readonly (infer U)[]
  ? DeepMutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T;
type Draft = DeepMutable<RomStructure>;

function mutate(fn: (s: Draft) => void): RomStructure {
  const s = JSON.parse(JSON.stringify(golden()));
  fn(s);
  return s;
}

describe("computeRom — golden case (two use cases, a shared foundation, two releases)", () => {
  const rom = priced(golden());
  const [r1, r2] = rom.releases;
  const foundation = rom.foundation!;

  it("prices every hours line as count × unit hours × friction", () => {
    expect(r1.useCases[0].lines.map((l) => l.hours)).toEqual([
      35.2, 33, 39.6, 22, 22, 5.5,
    ]);
    expect(r1.useCases[0].hours).toBe(157.3);
    expect(r2.useCases[0].lines.map((l) => l.hours)).toEqual([
      17.6, 13.2, 26.4, 110, 44, 4.4,
    ]);
    expect(r2.useCases[0].hours).toBe(215.6);
    expect(foundation.hours.lines.map((l) => [l.driver, l.hours])).toEqual([
      ["data_source_count", 52.8],
      ["source_table_count", 19.8],
      ["design_row_count", 5.5],
    ]);
    expect(foundation.hours.hours).toBe(78.1);
  });

  it("buys whole pod-weeks per release and for the foundation", () => {
    expect(rom.pod.members.map((m) => m.fte)).toEqual([1, 2]);
    expect(r1.own.pod.productiveHoursPerWeek).toBe(96);
    expect([r1.own.hours, r1.own.weeks]).toEqual([157.3, 2]);
    expect([r2.own.hours, r2.own.weeks]).toEqual([215.6, 3]);
    expect([foundation.priced.hours, foundation.priced.weeks]).toEqual([
      78.1, 1,
    ]);
    expect(
      r1.own.pod.memberLines.map((l) => [
        l.paidHours,
        l.rate.hourlyRateCents,
        l.costCents,
      ]),
    ).toEqual([
      [80, 5000, 400000],
      [160, 3500, 560000],
    ]);
    expect(r2.own.pod.memberLines.map((l) => l.costCents)).toEqual([
      600000, 840000,
    ]);
    expect(foundation.priced.pod.memberLines.map((l) => l.costCents)).toEqual([
      200000, 280000,
    ]);
  });

  it("gives each release its low / plan / high", () => {
    expect(r1.own.range).toEqual({
      basis: "named",
      policyCode: "ROM-NOT-DESIGNED",
      score: null,
      lowMultiplier: 0.75,
      highMultiplier: 1.5,
      lowCents: 720000,
      planCents: 960000,
      highCents: 1440000,
    });
    expect(r2.own.range).toEqual({
      basis: "score",
      policyCode: "T-TIGHT",
      score: 0,
      lowMultiplier: 0.9,
      highMultiplier: 1.15,
      lowCents: 1296000,
      planCents: 1440000,
      highCents: 1656000,
    });
    expect(foundation.priced.range).toMatchObject({
      policyCode: "ROM-NOT-DESIGNED",
      lowCents: 360000,
      planCents: 480000,
      highCents: 720000,
    });
  });

  it("shows each release standalone, foundation included", () => {
    expect(r1.sharesFoundation).toBe(true);
    expect(r1.standalone).toEqual({
      lowCents: 1080000,
      planCents: 1440000,
      highCents: 2160000,
    });
    expect(r2.standalone).toEqual({
      lowCents: 1656000,
      planCents: 1920000,
      highCents: 2376000,
    });
    expect(foundation.sharedByReleaseCodes).toEqual(["R1", "R2"]);
  });

  it("totals the releases with the foundation counted ONCE", () => {
    expect(rom.total.hours).toBe(451);
    // Whole pod-weeks: 2 + 3 for the releases and 1 for the foundation, once.
    expect(rom.total.weeks).toBe(6);
    expect(rom.total.planCents).toBe(2880000);
    expect(rom.total.lowCents).toBe(2376000);
    expect(rom.total.highCents).toBe(3816000);
    // Counting the foundation inside both releases would add it twice.
    expect(rom.total.naiveSumCents).toBe(3360000);
    expect(rom.total.naiveSumCents - rom.total.planCents).toBe(
      foundation.priced.range.planCents,
    );
    const shared = rom.total.rollup.lines.find(
      (l) => l.sharedCostRef === foundationSharedCostRef("F"),
    );
    expect(shared).toMatchObject({
      classification: "shared_program",
      occurrenceCount: 2,
      costCents: 480000,
    });
  });

  it("carries reconciling formula terms on every hours and member line", () => {
    for (const block of [
      ...rom.releases.flatMap((r) => r.useCases),
      foundation.hours,
    ]) {
      for (const line of block.lines) {
        expect(evaluateFormulaTerms(line.formulaTerms)).toEqual({
          hours: line.hours,
          costCents: null,
        });
        expect(line.formulaTerms.map((t) => t.cellRole)).toEqual([
          "count",
          "unit_hours",
          "factor",
          "result",
        ]);
        expect(line.formulaTerms[1].source).toBe("test: invented unit hours");
        expect(line.formulaTerms[2].source).toBe("test: invented friction");
      }
    }
    for (const block of [r1.own, r2.own, foundation.priced]) {
      for (const line of block.pod.memberLines) {
        expect(evaluateFormulaTerms(line.formulaTerms)).toEqual({
          hours: line.paidHours,
          costCents: line.costCents,
        });
        expect(evaluateRateTerms(line.rate.rateTerms)).toBe(
          line.rate.hourlyRateCents,
        );
        expect(line.rate.baseSource).toMatch(
          /^rate_band:ROL-T0[12]-LVL-T[12]:loaded_rate$/,
        );
      }
    }
  });

  it("applies no productivity credit and is deterministic", () => {
    expect(rom.productivityCreditApplied).toBe(false);
    expect(computeRom(golden(), testLoaders())).toEqual(rom);
  });
});

describe("computeRom — release roll-up and pod capacity", () => {
  it("sums every use case in a release before buying pod-weeks", () => {
    const s = mutate((x) => {
      x.releases = [
        {
          code: "R1",
          name: "Both",
          designStatus: "not_designed",
          useCaseCodes: ["UC-A", "UC-B"],
        },
      ];
    });
    const rom = priced(s);
    expect(rom.releases[0].useCases.map((u) => u.hours)).toEqual([
      157.3, 215.6,
    ]);
    expect([rom.releases[0].own.hours, rom.releases[0].own.weeks]).toEqual([
      372.9, 4,
    ]);
    expect(rom.releases[0].own.range.planCents).toBe(1920000);
    expect(rom.total.planCents).toBe(2400000);
  });

  it("uses the supplied hours per FTE-week for capacity and paid hours", () => {
    const s = mutate((x) => {
      x.hoursPerFteWeek = { value: 36, source: "test: shorter week" };
    });
    const r1 = priced(s).releases[0].own;
    expect([r1.pod.productiveHoursPerWeek, r1.weeks]).toEqual([86.4, 2]);
    expect(r1.pod.memberLines.map((l) => l.paidHours)).toEqual([72, 144]);
    expect(r1.range.planCents).toBe(864000);
  });

  it("buys exactly N weeks when the hours are N weeks up to float noise", () => {
    // 226.8 / ROUND(3 × 36 × 0.7, 4) = 3.0000000000000004 in IEEE-754.
    const rom = priced(NOISY_WHOLE_WEEKS);
    expect(226.8 / 75.6).toBeGreaterThan(3);
    expect([
      rom.releases[0].own.hours,
      rom.releases[0].own.pod.productiveHoursPerWeek,
      rom.releases[0].own.weeks,
    ]).toEqual([226.8, 75.6, 3]);
  });
});

describe("computeRom — range policy", () => {
  it("gives a not-designed release 0.75 / 1.50 whatever range inputs it carries", () => {
    const s = mutate((x) => {
      x.releases[1] = { ...x.releases[1], designStatus: "not_designed" };
    });
    const r2 = priced(s).releases[1].own.range;
    expect(ROM_NOT_DESIGNED_RANGE).toEqual({
      code: "ROM-NOT-DESIGNED",
      low: 0.75,
      high: 1.5,
    });
    expect(r2).toMatchObject({
      basis: "named",
      lowMultiplier: 0.75,
      highMultiplier: 1.5,
      lowCents: 1080000,
      highCents: 2160000,
    });
  });

  it("gives a designed release the tier its score selects", () => {
    const s = mutate((x) => {
      x.releases[1].rangeInputs!.deliveryNovelty = "high";
      x.releases[1].rangeInputs!.quantityUncertainty = "medium";
    });
    expect(priced(s).releases[1].own.range).toMatchObject({
      basis: "score",
      score: 3,
      policyCode: "T-STANDARD",
      lowCents: 1152000,
      highCents: 1872000,
    });
  });

  it("prices a designed foundation on the score tiers too", () => {
    const s = mutate((x) => {
      x.foundation!.designStatus = "designed";
      x.foundation!.rangeInputs = { ...x.releases[1].rangeInputs! };
    });
    expect(priced(s).foundation!.priced.range).toMatchObject({
      basis: "score",
      policyCode: "T-TIGHT",
      lowCents: 432000,
      highCents: 552000,
    });
  });

  it("refuses a designed release with no range inputs", () => {
    const s = mutate((x) => {
      delete x.releases[1].rangeInputs;
    });
    expect(refused(s)).toMatchObject({
      code: "range_inputs_missing",
      message: expect.stringContaining("Release 'R2' is designed"),
    });
  });

  it("refuses a score no policy covers", () => {
    const loaders = testLoaders({
      loadRangePolicies: () => RANGE_POLICIES.slice(1),
    });
    expect(refused(golden(), loaders)).toMatchObject({
      code: "no_matching_range_policy",
      message: expect.stringContaining("release 'R2'"),
    });
  });
});

describe("computeRom — the shared foundation", () => {
  it("adds nothing to a release that does not share it, and still counts once", () => {
    const s = mutate((x) => {
      x.foundation!.sharedByReleaseCodes = ["R2"];
    });
    const rom = priced(s);
    expect(rom.foundation!.sharedByReleaseCodes).toEqual(["R2"]);
    expect(rom.releases[0].sharesFoundation).toBe(false);
    expect(rom.releases[0].standalone.planCents).toBe(960000);
    expect(rom.releases[1].standalone.planCents).toBe(1920000);
    expect(rom.total.planCents).toBe(2880000);
    expect(rom.total.naiveSumCents).toBe(2880000);
  });

  it("prices a ROM with no foundation", () => {
    const s = mutate((x) => {
      x.foundation = null;
    });
    const rom = priced(s);
    expect(rom.foundation).toBeNull();
    expect(rom.total).toMatchObject({
      hours: 372.9,
      planCents: 2400000,
      lowCents: 2016000,
      highCents: 3096000,
      naiveSumCents: 2400000,
    });
  });

  it("refuses a foundation shared with an unknown release", () => {
    const s = mutate((x) => {
      x.foundation!.sharedByReleaseCodes = ["R9"];
    });
    expect(refused(s)).toMatchObject({ code: "unknown_release" });
  });
});

describe("computeRom — unit hours are supplied, never guessed", () => {
  it("refuses a counted driver with no unit hours, naming it", () => {
    const s = mutate((x) => {
      delete x.unitHours.dashboard_view_count;
    });
    const r = refused(s);
    expect(r.code).toBe("unit_hours_missing");
    expect(r.message).toContain("dashboard_view_count");
    expect(r.message).toContain("use case 'UC-A'");
    expect(r.message).toContain("There is no reference default");
  });

  it("refuses a driver only the foundation counts", () => {
    const s = mutate((x) => {
      x.useCases.forEach((uc) => delete uc.counts.data_source_count);
      delete x.unitHours.data_source_count;
    });
    expect(refused(s)).toMatchObject({
      code: "unit_hours_missing",
      message: expect.stringContaining("the foundation 'F'"),
    });
  });

  it("does not ask for unit hours of a driver nothing counts", () => {
    const s = mutate((x) => {
      x.useCases.forEach((uc) => delete uc.counts.validation_row_count);
      delete x.unitHours.validation_row_count;
    });
    expect(priced(s).releases[0].useCases[0].lines).toHaveLength(5);
  });

  it.each([
    ["no source", { value: 3, source: " ", confidence: "low" }],
    ["a bad confidence", { value: 3, source: "x", confidence: "certain" }],
    ["a negative value", { value: -1, source: "x", confidence: "low" }],
  ])("refuses unit hours with %s", (_label, uh) => {
    const s = mutate((x) => {
      (x.unitHours as Record<string, unknown>).source_table_count = uh;
    });
    expect(refused(s).code).toBe("invalid_unit_hours");
  });
});

describe("computeRom — structural refusals", () => {
  it.each<[string, (x: Draft) => void, string]>([
    [
      "a use case in two releases",
      (x) =>
        void (x.releases[1] = {
          ...x.releases[1],
          useCaseCodes: ["UC-B", "UC-A"],
        }),
      "use_case_in_two_releases",
    ],
    [
      "an empty release",
      (x) => void (x.releases[1] = { ...x.releases[1], useCaseCodes: [] }),
      "empty_release",
    ],
    [
      "a use case in no release",
      (x) =>
        void x.useCases.push({
          code: "UC-C",
          name: "C",
          counts: { data_source_count: 1 },
        }),
      "use_case_unassigned",
    ],
    [
      "an unknown use case",
      (x) =>
        void (x.releases[0] = { ...x.releases[0], useCaseCodes: ["UC-Z"] }),
      "unknown_use_case",
    ],
    [
      "a duplicate code",
      (x) => void (x.foundation!.code = "R1"),
      "duplicate_code",
    ],
    [
      "a fractional count",
      (x) => void (x.useCases[0].counts.design_row_count = 1.5),
      "invalid_count",
    ],
    [
      "a use case counting nothing",
      (x) => void (x.useCases[0].counts = { data_source_count: 0 }),
      "empty_block",
    ],
    [
      "an unknown driver",
      (x) =>
        void ((x.useCases[0].counts as Record<string, number>).widget_count =
          1),
      "invalid_structure",
    ],
    [
      "zero friction",
      (x) => void (x.friction = { value: 0, source: "x" }),
      "invalid_factor",
    ],
    [
      "a productive share above 1",
      (x) => void (x.productiveShare = { value: 1.2, source: "x" }),
      "invalid_factor",
    ],
    [
      "friction with no source",
      (x) => void (x.friction = { value: 1.1, source: "" }),
      "invalid_factor",
    ],
    [
      "zero hours per FTE-week",
      (x) => void (x.hoursPerFteWeek = { value: 0, source: "x" }),
      "invalid_factor",
    ],
    [
      "a pod with a template and members",
      (x) => void (x.pod.templateCode = "POD-002"),
      "invalid_pod",
    ],
    [
      "a pod with no rate basis",
      (x) =>
        void ((x.pod as unknown as Record<string, unknown>).rateBasis =
          "cheapest"),
      "invalid_pod",
    ],
    [
      "a release with an unknown design status",
      (x) =>
        void ((
          x.releases[0] as unknown as Record<string, unknown>
        ).designStatus = "drafted"),
      "invalid_structure",
    ],
  ])("refuses %s", (_label, fn, code) => {
    const r = refused(mutate(fn));
    expect(r.code).toBe(code);
    expect(r.message).toMatch(/\.$/);
  });

  it("refuses a body that is not an object", () => {
    expect(refused("rom")).toMatchObject({ code: "invalid_structure" });
    expect(refused({ useCases: [] })).toMatchObject({
      code: "invalid_structure",
    });
  });

  it("refuses a pod whose rate does not resolve, as a pricing refusal", () => {
    const s = mutate((x) => {
      x.pod.locationCode = "LOC-NOWHERE";
    });
    expect(refused(s)).toMatchObject({
      code: "pod_pricing_refused",
      message: expect.stringContaining("LOC-NOWHERE"),
    });
  });
});

describe("computeRom — pods from the committed cost foundation", () => {
  const committed = createCommittedRomReferenceLoaders();

  it("prices a fully matched pod template at the committed bands", () => {
    const s = mutate((x) => {
      x.pod = {
        templateCode: "POD-005",
        locationCode: "LOC-CHICAGO",
        rateBasis: "loaded_cost",
      };
      x.releases[1].rangeInputs!.rateCardCoveragePct = 95;
    });
    const rom = priced(s, committed);
    expect(rom.pod.podCode).toBe("POD-005");
    expect(rom.pod.members.map((m) => [m.roleCode, m.fte])).toEqual([
      ["ROL-029", 1],
      ["ROL-037", 2],
    ]);
    expect(rom.pod.memberMappingStatus).toEqual(["confirmed", "confirmed"]);
    for (const line of rom.releases[0].own.pod.memberLines) {
      expect(line.rate.baseSource).toContain(
        `rate_band:${line.member.roleCode}-LVL-07:loaded_rate`,
      );
      expect(line.rate.baseSource).toContain("Role Rate Card row");
      expect(line.rate.location.source).toContain(
        "location:LOC-CHICAGO:salary_multiplier",
      );
      expect(line.rate.location.source).toContain("Geography row");
    }
    expect(rom.releases[1].own.range.policyCode).toBe("RANGE-TIGHT");
  });

  it("reads the pack exactly as the canonical pack readers do", () => {
    const dir = path.join(process.cwd(), ROM_REFERENCE_PACK_RELATIVE_DIR);
    const library = parsePodLibrary(readPodLibraryDir(dir));
    expect(committed.loadPodLibrary()).toEqual({
      podTemplates: library.podTemplates,
      podTemplateRoles: library.podTemplateRoles,
    });
    expect(committed.loadRateReference()).toEqual(loadRealPodRateReference());
    // Each loader reads its files once per loader set.
    expect(committed.loadPodLibrary()).toBe(committed.loadPodLibrary());
    expect(committed.loadRateReference()).toBe(committed.loadRateReference());
    expect(committed.loadRangePolicies()).toBe(committed.loadRangePolicies());
  });

  it("reads only active range policies from the pack", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rom-pack-"));
    try {
      const source = path.join(process.cwd(), ROM_REFERENCE_PACK_RELATIVE_DIR);
      for (const file of fs.readdirSync(source))
        fs.copyFileSync(path.join(source, file), path.join(dir, file));
      const policies = path.join(dir, "pricing_range_policies.csv");
      fs.writeFileSync(
        policies,
        fs
          .readFileSync(policies, "utf8")
          .replace(/(RANGE-TIGHT,.*),active$/m, "$1,retired"),
      );
      const codes = createCommittedRomReferenceLoaders(dir)
        .loadRangePolicies()
        .map((p) => p.policy_code);
      expect(codes).toEqual([
        "RANGE-STANDARD",
        "RANGE-WIDE",
        "RANGE-VERY-WIDE",
      ]);
      expect(committed.loadRangePolicies().map((p) => p.policy_code)).toContain(
        "RANGE-TIGHT",
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a template with unmatched roles rather than pricing a partial pod", () => {
    // POD-012 still carries a role no mapping rule resolves.
    const s = mutate((x) => {
      x.pod = {
        templateCode: "POD-012",
        locationCode: "LOC-CHICAGO",
        rateBasis: "loaded_cost",
      };
    });
    expect(refused(s, committed)).toMatchObject({
      code: "pod_template_refused",
      message: expect.stringContaining("POD-012"),
    });
  });

  it("prices a template whose roles are mapped by proposal, and says the mapping is unapproved", () => {
    const s = mutate((x) => {
      x.pod = {
        templateCode: "POD-001",
        locationCode: "LOC-CHICAGO",
        rateBasis: "loaded_cost",
      };
    });
    const result = computeRom(s, committed);
    if (!result.ok) throw new Error(`expected a ROM, got ${result.code}`);
    expect(JSON.stringify(result)).toContain("unapproved");
  });
});

describe("role-mapping status", () => {
  it("prices member-level location and provider terms without changing scope or capacity", () => {
    const base = testLoaders();
    const reference = base.loadRateReference();
    const loaders = testLoaders({
      loadRateReference: () => ({
        ...reference,
        locations: [
          ...reference.locations,
          { location_code: "LOC-CHEAP", shore_category: "offshore", salary_multiplier: 0.3, rate_multiplier: 0.4 },
        ],
        providerClasses: [
          ...reference.providerClasses,
          { provider_class_code: "SI-T2", tier_multiplier: 0.85 },
        ],
      }),
    });
    const sameScope = golden();
    sameScope.pod.rateBasis = "bill_rate";
    sameScope.pod.providerClassCode = "SI-T1";
    const blended = mutate((s) => {
      s.pod.rateBasis = "bill_rate";
      s.pod.providerClassCode = "SI-T1";
      s.pod.members = s.pod.members!.map((member, index) => index === 1
        ? { ...member, locationCode: "LOC-CHEAP", providerClassCode: "SI-T2" }
        : member);
    });
    const a = computeRom(sameScope, loaders);
    const b = computeRom(blended, loaders);
    if (!a.ok || !b.ok) throw new Error("expected both ROM options to price");
    expect(b.total.hours).toBe(a.total.hours);
    expect(b.total.weeks).toBe(a.total.weeks);
    expect(b.total.planCents).toBeLessThan(a.total.planCents);
    expect(b.pod.members.map((m) => [m.locationCode, m.providerClassCode])).toEqual([
      ["LOC-TEST", "SI-T1"], ["LOC-CHEAP", "SI-T2"],
    ]);
    const lowerRate = b.releases[0].own.pod.memberLines[1].rate;
    expect(lowerRate.location.source).toContain("LOC-CHEAP");
    expect(lowerRate.provider.source).toContain("SI-T2/SI-T1");
  });

  it("flags an explicit member the caller marks as a proposed mapping", () => {
    const s = mutate((x) => {
      x.pod.members = [
        { ...x.pod.members![0], proposedMapping: true },
        x.pod.members![1],
      ];
    });
    expect(priced(s).pod.memberMappingStatus).toEqual([
      "proposed_unapproved",
      "caller_specified",
    ]);
  });

  it("reads a template member's proposed-mapping provenance when the template carries one", () => {
    const base = { roleCode: "R", levelCode: "L", locationCode: "X", fte: 1 };
    expect(romMemberMappingStatus(base)).toBe("confirmed");
    expect(
      romMemberMappingStatus({
        ...base,
        provenance: { roleMapping: "proposed_unapproved" },
      } as never),
    ).toBe("proposed_unapproved");
    expect(
      romMemberMappingStatus({
        ...base,
        provenance: { roleMapping: "confirmed" },
      } as never),
    ).toBe("confirmed");
  });
});
