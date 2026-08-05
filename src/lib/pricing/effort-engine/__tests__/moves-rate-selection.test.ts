import {
  defaultMovesRateSelectionPolicies,
  internalReferenceRateToCandidate,
  providerReferenceRateToCandidate,
  selectMovesRate,
  validateMovesRateSelectionPolicies,
  type MovesRateCandidate,
  type MovesRateSelectionRequest,
} from "../moves-rate-selection";

const request: MovesRateSelectionRequest = {
  roleCode: "ROL-009",
  levelCode: "LVL-02",
  technologyCode: "TECH-EPIC-CLARITY",
  locationCode: "LOC-ATLANTA",
  providerClassCode: "SI-T1",
  commercialModel: "partner_market_bill_rate",
};

const globalCandidate: MovesRateCandidate = {
  sourceKind: "global_reference",
  sourceLabel: "Global reference rate",
  roleCode: "ROL-009",
  levelCode: "LVL-02",
  towerCode: "TWR-02",
  towerName: "Industry SMEs",
  capabilityCode: "CAP-006",
  capabilityName: "Healthcare Domain",
  technologyCodes: ["TECH-EPIC-CLARITY", "TECH-HEALTHCARE-ANALYTICS"],
  locationCode: "LOC-ATLANTA",
  locationName: "Atlanta",
  shoreCategory: "onshore",
  providerClassCode: "SI-T1",
  providerClassName: "SI-T1",
  commercialModel: "partner_market_bill_rate",
  lowRateUsdPerHour: 853.13,
  baseRateUsdPerHour: 853.13,
  highRateUsdPerHour: 853.13,
  currency: "USD",
  confidence: "medium",
  approvalStatus: "global_starter_unapproved",
  pricingDatasetVersion: "1.0.0",
  sourceFormula: "indicative_bill_rate * location_rate_multiplier * (target_provider_multiplier / SI_T1_multiplier)",
  selectedRateSourceId: "PRV-ROL-009-LVL-02-SI-T1-LOC-ATLANTA",
  eligibleForCommittedSolutionPrice: false,
};

function approvedCandidate(sourceKind: MovesRateCandidate["sourceKind"], baseRateUsdPerHour: number): MovesRateCandidate {
  return {
    ...globalCandidate,
    sourceKind,
    sourceLabel: sourceKind,
    baseRateUsdPerHour,
    lowRateUsdPerHour: baseRateUsdPerHour,
    highRateUsdPerHour: baseRateUsdPerHour,
    approvalStatus: "approved",
    selectedRateSourceId: `${sourceKind}-1`,
    eligibleForCommittedSolutionPrice: true,
  };
}

describe("selectMovesRate", () => {
  it("uses the required precedence order before falling back to global reference", () => {
    const selected = selectMovesRate(request, [
      globalCandidate,
      approvedCandidate("tenant_contracted_rate", 700),
      approvedCandidate("deal_override", 650),
    ]);

    expect(selected.selected).toBe(true);
    if (!selected.selected) return;
    expect(selected.sourceKind).toBe("deal_override");
    expect(selected.baseRateCentsPerHour).toBe(65000);
    expect(selected.eligibleForCommittedSolutionPrice).toBe(true);
    expect(selected.planningAssumption).toBe(false);
  });

  it("rejects unapproved tenant candidates and reports a gap if no fallback matches", () => {
    const unapprovedTenant = {
      ...approvedCandidate("tenant_contracted_rate", 700),
      approvalStatus: "draft",
    };
    const selected = selectMovesRate({ ...request, technologyCode: "TECH-NOT-MAPPED" }, [unapprovedTenant]);

    expect(selected.selected).toBe(false);
    if (selected.selected) return;
    expect(selected.gapReason).toMatch(/higher-priority candidate/);
  });

  it("marks global and industry-overlay selections as planning assumptions", () => {
    const selected = selectMovesRate(request, [globalCandidate]);

    expect(selected.selected).toBe(true);
    if (!selected.selected) return;
    expect(selected.sourceKind).toBe("global_reference");
    expect(selected.planningAssumption).toBe(true);
    expect(selected.eligibleForCommittedSolutionPrice).toBe(false);
    expect(selected.approvalStatus).toBe("global_starter_unapproved");
  });

  it("detects precedence conflicts before selecting a rate", () => {
    const policies = [
      ...defaultMovesRateSelectionPolicies(),
      {
        rateSourceKind: "global_reference" as const,
        precedenceRank: 1,
        selectedRateSourceLabel: "Broken duplicate",
        allowUnapproved: true,
        eligibleForCommittedSolutionPrice: false,
      },
    ];

    expect(validateMovesRateSelectionPolicies(policies)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/duplicate precedence rank/),
        expect.stringMatching(/duplicate rate source kind/),
      ]),
    );
    expect(selectMovesRate(request, [globalCandidate], policies)).toEqual(
      expect.objectContaining({ selected: false, gapReason: expect.stringMatching(/pricing precedence conflict/) }),
    );
  });
});

describe("global reference row adapters", () => {
  it("converts materialized provider rows without applying another SI-T1 multiplier", () => {
    const candidate = providerReferenceRateToCandidate({
      rate_line_id: "PRV-ROL-009-LVL-02-SI-T1-LOC-INDIA-TIER-1",
      source_rate_band_code: "ROL-009-LVL-02",
      role_code: "ROL-009",
      canonical_role_name: "Healthcare Principal SME",
      level_code: "LVL-02",
      tower_code: "TWR-02",
      tower_name: "Industry SMEs",
      capability_code: "CAP-006",
      capability_name: "Healthcare Domain",
      technology_codes: "TECH-EPIC-CLARITY|TECH-HEALTHCARE-ANALYTICS",
      provider_class_code: "SI-T1",
      provider_class_name: "SI-T1",
      location_code: "LOC-INDIA-TIER-1",
      location_name: "India Tier 1",
      shore_category: "offshore",
      rate_type: "partner_market_bill_rate_requires_review",
      currency: "USD",
      partner_market_bill_rate_usd_per_hour: "341.25",
      planning_rate_low_usd_per_hour: "341.25",
      planning_rate_base_usd_per_hour: "341.25",
      planning_rate_high_usd_per_hour: "341.25",
      source_formula: "indicative_bill_rate * location_rate_multiplier * (target_provider_multiplier / SI_T1_multiplier)",
      confidence: "medium",
      approval_status: "global_starter_unapproved",
      version: "1.0.0",
    });

    expect(candidate.sourceKind).toBe("industry_overlay");
    expect(candidate.baseRateUsdPerHour).toBe(341.25);
    expect(candidate.requiresManualReview).toBe(true);
    expect(candidate.sourceFormula).toMatch(/target_provider_multiplier \/ SI_T1_multiplier/);
  });

  it("converts internal rows into either loaded or scarcity-adjusted cost candidates", () => {
    const row = {
      rate_line_id: "INT-ROL-009-LVL-02-LOC-ATLANTA",
      source_rate_band_code: "ROL-009-LVL-02",
      role_code: "ROL-009",
      canonical_role_name: "Healthcare Principal SME",
      level_code: "LVL-02",
      tower_code: "TWR-02",
      tower_name: "Industry SMEs",
      capability_code: "CAP-006",
      capability_name: "Healthcare Domain",
      technology_codes: "TECH-EPIC-CLARITY",
      location_code: "LOC-ATLANTA",
      location_name: "Atlanta",
      shore_category: "onshore",
      currency: "USD",
      internal_loaded_rate_usd_per_hour: "393.50",
      internal_scarcity_adjusted_rate_usd_per_hour: "511.55",
      planning_rate_low_usd_per_hour: "393.50",
      planning_rate_base_usd_per_hour: "511.55",
      planning_rate_high_usd_per_hour: "511.55",
      source_formula: "loaded_rate * salary_multiplier; scarcity_adj_rate * salary_multiplier",
      confidence: "medium",
      approval_status: "global_starter_unapproved",
      version: "1.0.0",
    };

    expect(internalReferenceRateToCandidate(row, "internal_loaded_cost").baseRateUsdPerHour).toBe(393.5);
    expect(internalReferenceRateToCandidate(row, "internal_scarcity_adjusted_cost").baseRateUsdPerHour).toBe(511.55);
  });
});
