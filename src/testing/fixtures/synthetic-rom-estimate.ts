/** The synthetic estimate the ROM workbook tests price (rom-workbook.test.ts), for the mobilization plan tests. */
import { computeRom, type RomReferenceLoaders, type RomResult, type RomStructure } from "@/lib/pricing/moves-workflow/rom-service";

function band(code: string, role: string, level: string, loaded: number) {
  return {
    rate_band_code: code,
    role_code: role,
    level_code: level,
    currency: "USD",
    rate_basis: "onshore_si_t1_benchmark",
    loaded_rate: loaded,
    scarcity_adj_rate: loaded,
    indicative_bill_rate: loaded,
    confidence: "test",
    approval_status: "synthetic",
  };
}

export const LOADERS: RomReferenceLoaders = {
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
    providerClasses: [{ provider_class_code: "SI-T1", tier_multiplier: 1.25 }],
  }),
  loadPodLibrary: () => ({ podTemplates: [], podTemplateRoles: [] }),
  loadRangePolicies: () => [
    {
      policy_code: "T-TIGHT",
      policy_name: "Tight",
      min_score: 0,
      max_score: 2,
      low_multiplier: 0.9,
      high_multiplier: 1.15,
    },
    {
      policy_code: "T-WIDE",
      policy_name: "Wide",
      min_score: 3,
      max_score: 10,
      low_multiplier: 0.6,
      high_multiplier: 1.6,
    },
  ],
};

const UNIT = (value: number) => ({
  value,
  source: "test: invented unit hours",
  confidence: "medium" as const,
});

export function golden(): RomStructure {
  return {
    useCases: [
      {
        code: "UC-A",
        name: "=Use case A",
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
        name: "=Release one",
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
        {
          roleCode: "ROL-T01",
          levelCode: "LVL-T1",
          fte: 1,
          proposedMapping: true,
        },
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

export function priced(structure: RomStructure): RomResult {
  const rom = computeRom(structure, LOADERS);
  if (!rom.ok) throw new Error(`${rom.code}: ${rom.message}`);
  return rom;
}


