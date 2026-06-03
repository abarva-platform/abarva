import {
  projectFinancialLine,
  projectVendorContract,
  projectVendorContracts,
  type RawTenantRecord,
} from "../projection";

function raw(
  payload: Record<string, unknown>,
  overrides: Partial<RawTenantRecord> = {},
): RawTenantRecord {
  return {
    recordId: "vc:test",
    recordKind: "vendor_contract",
    title: "Test Contract",
    payload,
    ...overrides,
  };
}

describe("projectVendorContract", () => {
  it("projects a well-formed contract payload", () => {
    const projected = projectVendorContract(
      raw({
        vendor_name: "Adobe",
        product: "Experience Cloud",
        category: "marketing_cloud",
        annual_spend_usd: 1_240_000,
        term_end_date: "2026-06-12",
        auto_renew: true,
        notice_period_days: 60,
        utilization_rate: 0.78,
        business_criticality: "high",
      }),
    );
    expect(projected).not.toBeNull();
    expect(projected!.vendorName).toBe("Adobe");
    expect(projected!.annualSpendUsd).toBe(1_240_000);
    expect(projected!.autoRenew).toBe(true);
    expect(projected!.criticality).toBe("high");
  });

  it("accepts utilization given as a 0..100 percentage", () => {
    const projected = projectVendorContract(
      raw({ vendor_name: "V", utilization_rate: 42 }),
    );
    expect(projected!.utilizationRate).toBeCloseTo(0.42);
  });

  it("accepts alternate field names (renewal_or_expiry, auto_renewal)", () => {
    const projected = projectVendorContract(
      raw({
        vendor: "V",
        renewal_or_expiry: "2026-09-01",
        auto_renewal: "yes",
      }),
    );
    expect(projected!.termEndDate).toBe("2026-09-01");
    expect(projected!.autoRenew).toBe(true);
  });

  it("returns null when there is no vendor and no product", () => {
    const projected = projectVendorContract({
      recordId: "vc:empty",
      recordKind: "vendor_contract",
      title: "",
      payload: {},
    });
    expect(projected).toBeNull();
  });

  it("leaves unparseable monetary fields as null rather than guessing", () => {
    const projected = projectVendorContract(
      raw({ vendor_name: "V", annual_spend_usd: "tbd" }),
    );
    expect(projected!.annualSpendUsd).toBeNull();
  });
});

describe("projectVendorContracts", () => {
  it("deduplicates rows for the same vendor and product, preferring canonical vendor records", () => {
    const projected = projectVendorContracts([
      raw(
        {
          vendor_name: "Wipro",
          product: "AMS",
          annual_spend_usd: 32_000_000,
        },
        { recordId: "contract_clause_inventory:contracts:1" },
      ),
      raw(
        {
          vendor_name: "wipro",
          product: "ams",
          annual_spend_usd: 31_500_000,
        },
        { recordId: "ven:apex:123" },
      ),
    ]);

    expect(projected).toHaveLength(1);
    expect(projected[0].contractId).toBe("ven:apex:123");
  });

  it("falls back to the higher spend row when sources have equal rank", () => {
    const projected = projectVendorContracts([
      raw(
        {
          vendor_name: "Infosys",
          product: "AMS",
          annual_spend_usd: 12_000_000,
        },
        { recordId: "extract:a" },
      ),
      raw(
        {
          vendor_name: "Infosys",
          product: "AMS",
          annual_spend_usd: 14_000_000,
        },
        { recordId: "extract:b" },
      ),
    ]);

    expect(projected).toHaveLength(1);
    expect(projected[0].contractId).toBe("extract:b");
  });
});

describe("projectFinancialLine", () => {
  it("projects a benchmark line", () => {
    const projected = projectFinancialLine(
      raw(
        { category: "crm", annual_budget_usd: 500_000, benchmark_usd: 400_000 },
        { recordId: "fin:1" },
      ),
    );
    expect(projected!.benchmarkUsd).toBe(400_000);
    expect(projected!.annualBudgetUsd).toBe(500_000);
  });

  it("returns null when neither a budget nor a benchmark is present", () => {
    const projected = projectFinancialLine(
      raw({ category: "crm" }, { recordId: "fin:empty" }),
    );
    expect(projected).toBeNull();
  });
});
