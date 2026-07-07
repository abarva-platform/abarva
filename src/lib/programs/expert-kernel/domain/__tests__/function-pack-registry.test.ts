// function-pack-registry — unit tests.
//
// Covers the resolver contract (spec §5): every catalogued reference pack
// resolves; an unknown industry-function returns `null`, never a faked pack;
// the coverage list reflects exactly the catalogued packs.
//
// The coverage assertions are INDUSTRY-AWARE and extensible: healthcare is a
// completed taxonomy and is asserted as an exact set of twelve functions;
// retail is a vertical still being built out, so its coverage is asserted as a
// growing subset — the functions catalogued SO FAR must all be present, and
// new retail batches add packs without this test's structure needing to
// change.

import {
  listFunctionPackCoverage,
  resolveFunctionPack,
} from "../function-pack-registry";

// The complete healthcare provider taxonomy — twelve functions (spec §3).
// Healthcare is finished, so this is asserted as an exact set.
const HEALTHCARE_FUNCTIONS: readonly string[] = [
  "care_delivery_care_management",
  "clinical_operations_documentation",
  "clinical_supply_chain",
  "clinical_workforce_staffing",
  "health_information_interoperability",
  "patient_access_engagement_experience",
  "payer_claims_operations",
  "pharmacy",
  "population_health_value_based_care",
  "quality_safety_regulatory",
  "research_clinical_trials",
  "revenue_cycle",
];

// The retail functions catalogued SO FAR — the margin-and-mix spine. The
// retail vertical is still being built out toward its full twelve-function
// taxonomy (spec §3); this list grows as later batches land, and the coverage
// test asserts it as a subset, never an exact total.
const RETAIL_FUNCTIONS_CATALOGUED_SO_FAR: readonly string[] = [
  "merchandising_assortment",
  "pricing_promotions",
  "demand_inventory_planning",
  "supply_chain_fulfillment",
  "digital_commerce",
  "marketing_retail_media",
  "store_operations",
  "customer_loyalty_personalization",
  "customer_care",
  "workforce_labor",
  "returns_reverse_logistics",
  "loss_prevention",
];

// The financial-services functions catalogued SO FAR. The financial-services
// vertical is still being built out toward its full twelve-function taxonomy
// (spec §3); this list grows as later batches land, and the coverage test
// asserts it as a subset, never an exact total.
const FINANCIAL_SERVICES_FUNCTIONS_CATALOGUED_SO_FAR: readonly string[] = [
  "capital_markets_trading",
  "commercial_corporate_banking",
  "payments_money_movement",
  "wealth_asset_management",
  "retail_banking_deposits",
  "lending_credit_underwriting",
  "regulatory_compliance",
  "finance_treasury_alm",
  "risk_management",
  "fraud_financial_crime",
  "customer_servicing_contact_center",
  "collections_recovery",
];

describe("resolveFunctionPack", () => {
  it("resolves the care-delivery & care-management pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "care_delivery_care_management",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("care_delivery_care_management");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Care delivery & care management");
  });

  it("resolves the population-health & value-based-care pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "population_health_value_based_care",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("population_health_value_based_care");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Population health & value-based care");
  });

  it("resolves the clinical-operations & documentation pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "clinical_operations_documentation",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("clinical_operations_documentation");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Clinical operations & documentation");
  });

  it("resolves the patient-access, engagement & experience pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "patient_access_engagement_experience",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("patient_access_engagement_experience");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Patient access, engagement & experience");
  });

  it("resolves the quality, safety & regulatory pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "quality_safety_regulatory",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("quality_safety_regulatory");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe(
      "Clinical quality, patient safety & regulatory compliance",
    );
  });

  it("resolves the health information & interoperability pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "health_information_interoperability",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("health_information_interoperability");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe(
      "Health information management, data & interoperability",
    );
  });

  it("resolves the research & clinical-trials pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "research_clinical_trials",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("research_clinical_trials");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Research & clinical trials");
  });

  it("resolves the revenue-cycle pack", () => {
    const pack = resolveFunctionPack("healthcare-provider", "revenue_cycle");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("revenue_cycle");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Revenue cycle");
  });

  it("resolves the clinical-supply-chain pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "clinical_supply_chain",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("clinical_supply_chain");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Clinical supply chain");
  });

  it("resolves the clinical-workforce & staffing pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "clinical_workforce_staffing",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("clinical_workforce_staffing");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Clinical workforce & staffing");
  });

  it("resolves the payer & claims-operations pack", () => {
    const pack = resolveFunctionPack(
      "healthcare-provider",
      "payer_claims_operations",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("payer_claims_operations");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Payer & claims operations");
  });

  it("resolves the pharmacy pack", () => {
    const pack = resolveFunctionPack("healthcare-provider", "pharmacy");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("pharmacy");
    expect(pack?.industryKey).toBe("healthcare-provider");
    expect(pack?.functionLabel).toBe("Pharmacy");
  });

  it("resolves the retail merchandising & assortment pack", () => {
    const pack = resolveFunctionPack("retail", "merchandising_assortment");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("merchandising_assortment");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Merchandising & assortment");
  });

  it("resolves the retail pricing & promotions pack", () => {
    const pack = resolveFunctionPack("retail", "pricing_promotions");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("pricing_promotions");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Pricing & promotions");
  });

  it("resolves the retail demand & inventory-planning pack", () => {
    const pack = resolveFunctionPack("retail", "demand_inventory_planning");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("demand_inventory_planning");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Demand & inventory planning");
  });

  it("resolves the retail supply-chain & fulfillment pack", () => {
    const pack = resolveFunctionPack("retail", "supply_chain_fulfillment");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("supply_chain_fulfillment");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Supply chain & fulfillment");
  });

  it("resolves the retail digital-commerce pack", () => {
    const pack = resolveFunctionPack("retail", "digital_commerce");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("digital_commerce");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Digital commerce");
  });

  it("resolves the retail marketing & retail-media pack", () => {
    const pack = resolveFunctionPack("retail", "marketing_retail_media");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("marketing_retail_media");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Marketing & retail media");
  });

  it("resolves the retail store-operations pack", () => {
    const pack = resolveFunctionPack("retail", "store_operations");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("store_operations");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Store operations");
  });

  it("resolves the retail customer-loyalty & personalization pack", () => {
    const pack = resolveFunctionPack(
      "retail",
      "customer_loyalty_personalization",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("customer_loyalty_personalization");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Customer loyalty & personalization");
  });

  it("resolves the retail customer-care pack", () => {
    const pack = resolveFunctionPack("retail", "customer_care");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("customer_care");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Customer care & service operations");
  });

  it("resolves the retail workforce & labor-management pack", () => {
    const pack = resolveFunctionPack("retail", "workforce_labor");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("workforce_labor");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Workforce & labor management");
  });

  it("resolves the retail returns & reverse-logistics pack", () => {
    const pack = resolveFunctionPack("retail", "returns_reverse_logistics");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("returns_reverse_logistics");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Returns & reverse logistics");
  });

  it("resolves the retail loss-prevention pack", () => {
    const pack = resolveFunctionPack("retail", "loss_prevention");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("loss_prevention");
    expect(pack?.industryKey).toBe("retail");
    expect(pack?.functionLabel).toBe("Loss prevention & shrink management");
  });

  it("resolves the financial-services customer-servicing & contact-center pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "customer_servicing_contact_center",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("customer_servicing_contact_center");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Customer servicing & contact center");
  });

  it("resolves the financial-services collections & recovery pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "collections_recovery",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("collections_recovery");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Collections & recovery");
  });

  it("resolves the financial-services enterprise-risk-management pack", () => {
    const pack = resolveFunctionPack("financial-services", "risk_management");
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("risk_management");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Enterprise risk management");
  });

  it("resolves the financial-services fraud & financial-crime pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "fraud_financial_crime",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("fraud_financial_crime");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Fraud & financial crime");
  });

  it("resolves the financial-services regulatory-compliance pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "regulatory_compliance",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("regulatory_compliance");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Regulatory compliance");
  });

  it("resolves the financial-services finance, treasury & ALM pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "finance_treasury_alm",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("finance_treasury_alm");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Finance, treasury & ALM");
  });

  it("resolves the financial-services retail banking & deposits pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "retail_banking_deposits",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("retail_banking_deposits");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Retail banking & deposits");
  });

  it("resolves the financial-services lending, credit & underwriting pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "lending_credit_underwriting",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("lending_credit_underwriting");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Lending, credit & underwriting");
  });

  it("resolves the capital-markets & trading pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "capital_markets_trading",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("capital_markets_trading");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Capital markets & trading");
  });

  it("resolves the commercial & corporate-banking pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "commercial_corporate_banking",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("commercial_corporate_banking");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Commercial & corporate banking");
  });

  it("resolves the financial-services payments & money-movement pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "payments_money_movement",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("payments_money_movement");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Payments & money movement");
  });

  it("resolves the financial-services wealth & asset-management pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "wealth_asset_management",
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe("wealth_asset_management");
    expect(pack?.industryKey).toBe("financial-services");
    expect(pack?.functionLabel).toBe("Wealth & asset management");
  });

  it("returns null for an unknown function in a known industry", () => {
    // The healthcare provider taxonomy is complete at twelve catalogued
    // functions; a healthcare function outside that set (e.g. telehealth &
    // virtual care) has no pack yet — a known gap, never a faked pack.
    expect(
      resolveFunctionPack("healthcare-provider", "telehealth_virtual_care"),
    ).toBeNull();
  });

  it("returns null for a retail function not yet catalogued", () => {
    // The retail vertical is still being built out; a retail function
    // outside the catalogued set (e.g. visual merchandising) has no pack
    // yet — a known gap, never a faked pack.
    expect(resolveFunctionPack("retail", "visual_merchandising")).toBeNull();
  });

  it("returns null when the function key is entirely unrecognised", () => {
    expect(
      resolveFunctionPack("healthcare-provider", "not_a_real_function"),
    ).toBeNull();
  });

  it("does not cross-resolve a function key to the wrong industry", () => {
    // A healthcare function must not resolve under the retail industry.
    expect(
      resolveFunctionPack("retail", "population_health_value_based_care"),
    ).toBeNull();
    // And a retail function must not resolve under healthcare.
    expect(
      resolveFunctionPack("healthcare-provider", "merchandising_assortment"),
    ).toBeNull();
  });
});

describe("listFunctionPackCoverage", () => {
  // Industry-aware coverage assertions. Healthcare is a completed taxonomy,
  // asserted as an EXACT set; retail is a growing vertical, asserted as a
  // SUBSET so later retail batches add packs without touching this test's
  // structure.

  const coverageFor = (industryKey: string): string[] =>
    listFunctionPackCoverage()
      .filter((c) => c.industryKey === industryKey)
      .map((c) => c.functionKey)
      .sort();

  it("covers exactly the twelve healthcare provider functions", () => {
    // Healthcare is finished — its coverage is an exact set.
    expect(coverageFor("healthcare-provider")).toEqual(
      [...HEALTHCARE_FUNCTIONS].sort(),
    );
  });

  it("covers at least the retail functions catalogued so far", () => {
    // Retail is still being built out toward its full taxonomy: assert the
    // catalogued functions are a subset of the live retail coverage, never
    // an exact total — a later batch adds packs without changing this test.
    const retailCoverage = new Set(coverageFor("retail"));
    for (const fn of RETAIL_FUNCTIONS_CATALOGUED_SO_FAR) {
      expect(retailCoverage.has(fn)).toBe(true);
    }
    expect(retailCoverage.size).toBeGreaterThanOrEqual(
      RETAIL_FUNCTIONS_CATALOGUED_SO_FAR.length,
    );
  });

  it("covers at least the financial-services functions catalogued so far", () => {
    // Financial services is still being built out toward its full
    // taxonomy: assert the catalogued functions are a subset of the live
    // financial-services coverage, never an exact total — a later batch
    // adds packs without changing this test.
    const fsCoverage = new Set(coverageFor("financial-services"));
    for (const fn of FINANCIAL_SERVICES_FUNCTIONS_CATALOGUED_SO_FAR) {
      expect(fsCoverage.has(fn)).toBe(true);
    }
    expect(fsCoverage.size).toBeGreaterThanOrEqual(
      FINANCIAL_SERVICES_FUNCTIONS_CATALOGUED_SO_FAR.length,
    );
  });

  it("every catalogued pack carries a non-empty function label", () => {
    for (const entry of listFunctionPackCoverage()) {
      expect(entry.functionLabel.trim().length).toBeGreaterThan(0);
    }
  });

  it("catalogues no duplicate (industry, function) pairs", () => {
    const pairs = listFunctionPackCoverage().map(
      (c) => `${c.industryKey}::${c.functionKey}`,
    );
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("only catalogues the known industry verticals", () => {
    const industries = new Set(
      listFunctionPackCoverage().map((c) => c.industryKey),
    );
    for (const industry of industries) {
      expect([
        "healthcare-provider",
        "retail",
        "financial-services",
        "airline",
      ]).toContain(industry);
    }
  });
});
