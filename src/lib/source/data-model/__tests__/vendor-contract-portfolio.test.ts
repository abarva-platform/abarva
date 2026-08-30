import {
  computeContractLeverageSignals,
  computeRenewalExposure,
  computeVendorConcentration,
  excludeSupplementalContracts,
  summarizePortfolio,
  tierApplicationScopeByConfidence,
} from "@/lib/source/data-model/vendor-contract-portfolio";
import type {
  SourceContractApplicationScopeRow,
  SourceContractVendor360Row,
} from "@/lib/source/data-model/types";

// Small, hand-computable fixture — NOT the full 119-contract SkyHarbor
// register (that stays out of version control). This exercises the same
// logic that was verified by hand against the real export: 119 contracts /
// 28 vendors / $1.4805B annual value / top-5 concentration ~37% / 45
// auto-renew. The fixture below is deliberately shaped so every assertion
// can be checked by inspection, not just by re-running the code under test.
function row(
  overrides: Partial<SourceContractVendor360Row>,
): SourceContractVendor360Row {
  return {
    tenant_key: "skyharbor_global",
    contract_id: "c-default",
    vendor_ref: "v-default",
    vendor_name: "Default Vendor",
    vendor_category: null,
    contract_name: "Default Contract",
    scope_summary: null,
    annual_value: 0,
    total_committed_value: 0,
    committed_annual_spend: 0,
    actual_annual_spend: 0,
    end_date: null,
    notice_period_days: null,
    auto_renew: false,
    renewal_decision_state: null,
    renewal_owner_ref: null,
    benchmarking_clause: null,
    exit_rights_summary: null,
    alternatives_available: null,
    concentration_note: null,
    source_confidence: null,
    resolved_annual_value: null,
    annual_value_conflict_flag: false,
    resolved_total_committed_value: null,
    total_committed_value_conflict_flag: false,
    ...overrides,
  };
}

describe("summarizePortfolio", () => {
  it("sums annual/committed/actual values and counts distinct vendors", () => {
    const rows = [
      row({
        contract_id: "c1",
        vendor_ref: "v1",
        annual_value: 100,
        auto_renew: true,
      }),
      row({
        contract_id: "c2",
        vendor_ref: "v1",
        annual_value: 50,
        auto_renew: false,
      }),
      row({
        contract_id: "c3",
        vendor_ref: "v2",
        annual_value: 30,
        auto_renew: true,
      }),
    ];
    const summary = summarizePortfolio(rows);
    expect(summary.contractCount).toBe(3);
    expect(summary.vendorCount).toBe(2);
    expect(summary.totalAnnualValue).toBe(180);
    expect(summary.autoRenewCount).toBe(2);
  });
});

describe("computeVendorConcentration", () => {
  it("ranks vendors by summed annual_value with correct cumulative share", () => {
    // Salesforce-shaped: one vendor dominant, matches the real "top vendor ~9%
    // of $1.4805B" order of magnitude directionally, not literally.
    const rows = [
      row({
        contract_id: "c1",
        vendor_ref: "salesforce",
        vendor_name: "Salesforce",
        annual_value: 60,
      }),
      row({
        contract_id: "c2",
        vendor_ref: "cloudpeak",
        vendor_name: "CloudPeak",
        annual_value: 25,
      }),
      row({
        contract_id: "c3",
        vendor_ref: "globallink",
        vendor_name: "GlobalLink",
        annual_value: 15,
      }),
    ];
    const result = computeVendorConcentration(rows);
    expect(result.totalAnnualValue).toBe(100);
    expect(result.byVendor[0].vendorRef).toBe("salesforce");
    expect(result.byVendor[0].shareOfTotal).toBeCloseTo(0.6);
    expect(result.byVendor[0].cumulativeShare).toBeCloseTo(0.6);
    expect(result.byVendor[1].cumulativeShare).toBeCloseTo(0.85);
    expect(result.topNShare(2)).toBeCloseTo(0.85);
    expect(result.topNShare(3)).toBeCloseTo(1.0);
  });

  it("sums multiple contracts under the same vendor before ranking", () => {
    const rows = [
      row({ contract_id: "c1", vendor_ref: "v1", annual_value: 40 }),
      row({ contract_id: "c2", vendor_ref: "v1", annual_value: 40 }),
      row({ contract_id: "c3", vendor_ref: "v2", annual_value: 50 }),
    ];
    const result = computeVendorConcentration(rows);
    expect(result.byVendor[0].vendorRef).toBe("v1");
    expect(result.byVendor[0].annualValue).toBe(80);
  });

  it("coerces pg numeric strings before aggregating vendor value", () => {
    const rows = [
      row({
        contract_id: "c1",
        vendor_ref: "v1",
        annual_value: "40000000" as unknown as number,
      }),
      row({
        contract_id: "c2",
        vendor_ref: "v1",
        annual_value: "30000000" as unknown as number,
      }),
      row({
        contract_id: "c3",
        vendor_ref: "v2",
        annual_value: "10000000" as unknown as number,
      }),
    ];
    const result = computeVendorConcentration(rows);
    expect(result.totalAnnualValue).toBe(80_000_000);
    expect(result.byVendor[0].annualValue).toBe(70_000_000);
    expect(result.byVendor[0].shareOfTotal).toBeCloseTo(0.875);
    expect(Number.isFinite(result.byVendor[0].annualValue)).toBe(true);
  });
});

describe("computeRenewalExposure", () => {
  // Mirrors the synthetic-dataset scenario: as-of 2027-06-30, NOT real-world
  // today. The function must never call Date.now() internally.
  const asOf = "2027-06-30";

  it("flags contracts expiring within the window, using the caller-supplied as-of date", () => {
    const rows = [
      row({
        contract_id: "expiring-soon",
        end_date: "2027-09-01",
        notice_period_days: 30,
      }), // ~63 days out
      row({
        contract_id: "far-out",
        end_date: "2028-06-30",
        notice_period_days: 30,
      }),
    ];
    const result = computeRenewalExposure(rows, asOf, 180);
    expect(result.expiringWithinWindow.map((r) => r.contract_id)).toEqual([
      "expiring-soon",
    ]);
  });

  it("flags still-active contracts whose notice deadline has already passed", () => {
    // end_date is 400 days out, but notice_period_days is 500 — the notice
    // deadline (end_date - 500d) is already behind the as-of date.
    const rows = [
      row({
        contract_id: "notice-missed",
        end_date: "2028-08-04", // ~400 days after 2027-06-30
        notice_period_days: 500,
        auto_renew: true,
        annual_value: 52.2,
      }),
      row({
        contract_id: "notice-still-open",
        end_date: "2028-08-04",
        notice_period_days: 30,
        auto_renew: false,
      }),
    ];
    const result = computeRenewalExposure(rows, asOf, 180);
    expect(result.noticeDeadlinePassed.map((r) => r.contract_id)).toEqual([
      "notice-missed",
    ]);
    expect(
      result.noticeDeadlinePassedAutoRenew.map((r) => r.contract_id),
    ).toEqual(["notice-missed"]);
    expect(result.noticeDeadlinePassedAutoRenewAnnualValue).toBeCloseTo(52.2);
  });

  it("preserves explicit renewal notice dates as a separate data-quality signal", () => {
    const rows = [
      row({
        contract_id: "past-notice",
        annual_value: 11_000_000,
        renewal_notice_date: "2027-01-15",
        end_date: "2027-12-31",
        notice_period_days: 350,
        auto_renew: true,
      }),
      row({
        contract_id: "future-notice",
        annual_value: 22_000_000,
        renewal_notice_date: "2028-01-15",
        end_date: "2028-06-30",
        notice_period_days: 167,
        auto_renew: true,
      }),
    ];

    const result = computeRenewalExposure(rows, asOf, 180);

    expect(result.pastRenewalNoticeDate.map((r) => r.contract_id)).toEqual([
      "past-notice",
    ]);
    expect(result.pastRenewalNoticeDateAnnualValue).toBe(11_000_000);
  });

  it('does not treat an already-expired contract as "notice deadline passed"', () => {
    const rows = [
      row({
        contract_id: "expired",
        end_date: "2027-01-01",
        notice_period_days: 30,
      }),
    ];
    const result = computeRenewalExposure(rows, asOf, 180);
    expect(result.noticeDeadlinePassed).toHaveLength(0);
  });

  it("separates expired rows as stale-date exclusions instead of deadline exposure", () => {
    const rows = [
      row({
        contract_id: "expired-auto-renew",
        annual_value: 194_100_000,
        end_date: "2027-01-01",
        notice_period_days: 90,
        auto_renew: true,
      }),
      row({
        contract_id: "live-auto-renew-lapsed",
        annual_value: 140_300_000,
        end_date: "2027-12-31",
        notice_period_days: 365,
        auto_renew: true,
      }),
      row({
        contract_id: "still-cancellable",
        annual_value: 214_600_000,
        end_date: "2028-06-30",
        notice_period_days: 90,
        auto_renew: true,
      }),
    ];

    const result = computeRenewalExposure(rows, asOf, 180);

    expect(result.expiredAsOfDate.map((r) => r.contract_id)).toEqual([
      "expired-auto-renew",
    ]);
    expect(result.expiredAsOfDateAnnualValue).toBe(194_100_000);
    expect(
      result.noticeDeadlinePassedAutoRenew.map((r) => r.contract_id),
    ).toEqual(["live-auto-renew-lapsed"]);
    expect(result.noticeDeadlinePassedAutoRenewAnnualValue).toBe(140_300_000);
    expect(result.noticeDeadlinePassedAutoRenew).not.toContainEqual(
      expect.objectContaining({ contract_id: "expired-auto-renew" }),
    );
  });

  it("throws on an invalid as-of date rather than silently falling back to the real clock", () => {
    expect(() => computeRenewalExposure([], "not-a-date")).toThrow(
      /compute_renewal_exposure_invalid_as_of_date/,
    );
  });
});

describe("computeContractLeverageSignals", () => {
  it("flags a high-spend contract with multiple weak-leverage signals as high priority", () => {
    const rows = [
      row({
        contract_id: "weak-leverage-high-spend",
        annual_value: 100,
        benchmarking_clause: "none",
        alternatives_available: "no_alternatives",
        concentration_note: "specialized skill dependency, regional dependency",
      }),
      row({
        contract_id: "small-and-strong",
        annual_value: 5,
        benchmarking_clause: "explicit_right",
      }),
    ];
    const signals = computeContractLeverageSignals(rows);
    const flagged = signals.find(
      (s) => s.contractId === "weak-leverage-high-spend",
    );
    expect(flagged?.weakSignalCount).toBe(4);
    expect(flagged?.isHighPriority).toBe(true);

    const strong = signals.find((s) => s.contractId === "small-and-strong");
    expect(strong?.isHighPriority).toBe(false);
  });

  it("does not flag a strong-leverage contract even at high spend", () => {
    const rows = [
      row({
        contract_id: "high-spend-strong-leverage",
        annual_value: 100,
        benchmarking_clause: "explicit_right",
        alternatives_available: "multiple",
      }),
    ];
    const signals = computeContractLeverageSignals(rows);
    expect(signals[0].isHighPriority).toBe(false);
  });
});

describe("numeric-string coercion (Postgres NUMERIC columns return as strings)", () => {
  // node-postgres returns NUMERIC/DECIMAL columns as strings, not numbers.
  // These fixtures inject real strings (via a cast, since the row type
  // declares `number | null`) to reproduce that — the exact bug found live:
  // `0 + "50000000.00"` is string concatenation in JS, not addition, and it
  // only shows up once a vendor has more than one contract to sum.
  function stringRow(overrides: {
    contract_id: string;
    vendor_ref: string;
    vendor_name?: string;
    annual_value: string;
  }): SourceContractVendor360Row {
    return row({
      contract_id: overrides.contract_id,
      vendor_ref: overrides.vendor_ref,
      vendor_name: overrides.vendor_name ?? "Default Vendor",
      annual_value: overrides.annual_value as unknown as number,
    });
  }

  it("summarizePortfolio sums string-typed annual_value as numbers, not concatenated text", () => {
    const rows = [
      stringRow({
        contract_id: "c1",
        vendor_ref: "v1",
        annual_value: "50000000.00",
      }),
      stringRow({
        contract_id: "c2",
        vendor_ref: "v1",
        annual_value: "43500000.00",
      }),
      stringRow({
        contract_id: "c3",
        vendor_ref: "v2",
        annual_value: "37500000.00",
      }),
    ];
    const summary = summarizePortfolio(rows);
    expect(summary.totalAnnualValue).toBe(131000000);
    expect(typeof summary.totalAnnualValue).toBe("number");
  });

  it("computeVendorConcentration sums a multi-contract vendor's string values correctly, not e+22-scale garbage", () => {
    const rows = [
      stringRow({
        contract_id: "c1",
        vendor_ref: "v1",
        vendor_name: "Vendor One",
        annual_value: "50000000.00",
      }),
      stringRow({
        contract_id: "c2",
        vendor_ref: "v1",
        vendor_name: "Vendor One",
        annual_value: "43500000.00",
      }),
      stringRow({
        contract_id: "c3",
        vendor_ref: "v2",
        vendor_name: "Vendor Two",
        annual_value: "37500000.00",
      }),
    ];
    const result = computeVendorConcentration(rows);
    const vendorOne = result.byVendor.find((v) => v.vendorRef === "v1");
    expect(vendorOne?.annualValue).toBe(93500000);
    expect(result.totalAnnualValue).toBe(131000000);
    // The exact regression: string concatenation would have produced a huge
    // number far outside any plausible contract-value range.
    expect(vendorOne?.annualValue).toBeLessThan(1_000_000_000);
  });

  it("computeContractLeverageSignals compares string-typed values numerically, not lexicographically", () => {
    const rows = [
      stringRow({
        contract_id: "c1",
        vendor_ref: "v1",
        annual_value: "9000000.00",
      }),
      stringRow({
        contract_id: "c2",
        vendor_ref: "v2",
        annual_value: "100000000.00",
      }),
    ];
    const signals = computeContractLeverageSignals(rows);
    const small = signals.find((s) => s.contractId === "c1");
    const big = signals.find((s) => s.contractId === "c2");
    // Lexicographic string comparison would rank "100000000.00" below
    // "9000000.00" (since "1" < "9" as the first character) — numeric
    // comparison must rank it above.
    expect(big?.annualValue).toBeGreaterThan(small?.annualValue ?? 0);
  });
});

describe("excludeSupplementalContracts", () => {
  it("is a no-op today (no supplemental vendors loaded yet)", () => {
    const rows = [row({ contract_id: "c1", vendor_ref: "v1" })];
    expect(excludeSupplementalContracts(rows)).toEqual(rows);
  });
});

function scopeRow(
  overrides: Partial<SourceContractApplicationScopeRow>,
): SourceContractApplicationScopeRow {
  return {
    tenant_key: "skyharbor_global",
    contract_id: "c-default",
    vendor_ref: "v-default",
    vendor_name: "Default Vendor",
    application_ref: "app-default",
    application_name: "Default App",
    business_function: null,
    function_ref: null,
    criticality: null,
    lifecycle_state: null,
    hosting_model: null,
    annual_run_cost: null,
    modernization_plan: null,
    sla_tier: null,
    known_pain_risk: null,
    it_portfolio_ref: null,
    ...overrides,
  };
}

describe("tierApplicationScopeByConfidence", () => {
  it("marks everything unresolved when no explicit-reference set is loaded", () => {
    const rows = [scopeRow({ contract_id: "c1", application_ref: "a1" })];
    const tiers = tierApplicationScopeByConfidence(rows);
    expect(tiers.unresolved).toHaveLength(1);
    expect(tiers.explicit).toHaveLength(0);
    expect(tiers.vendorInferred).toHaveLength(0);
    expect(tiers.totalCount).toBe(1);
  });

  it("separates explicit-scope rows from vendor-inferred rows once a reference set is supplied", () => {
    const rows = [
      scopeRow({ contract_id: "c1", application_ref: "a1" }),
      scopeRow({ contract_id: "c1", application_ref: "a2" }),
    ];
    const explicitPairs = new Set(["c1::a1"]);
    const tiers = tierApplicationScopeByConfidence(rows, explicitPairs);
    expect(tiers.explicit.map((r) => r.application_ref)).toEqual(["a1"]);
    expect(tiers.vendorInferred.map((r) => r.application_ref)).toEqual(["a2"]);
    expect(tiers.unresolved).toHaveLength(0);
  });
});
