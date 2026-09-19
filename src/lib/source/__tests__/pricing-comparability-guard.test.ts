import {
  evaluatePricingComparability,
  type PricingComparabilityRecord,
} from "../pricing-comparability-guard";

function completeRecord(
  overrides: Partial<PricingComparabilityRecord> = {},
): PricingComparabilityRecord {
  return {
    recordId: "vendor-a:L-CMP-01",
    vendorId: "vendor-a",
    vendorName: "Vendor A",
    lineItemId: "L-CMP-01",
    raw: {
      amount: 120000,
      currency: "USD",
      unit: "workload-month",
      period: "annual",
      quantity: 120,
      scenario: "vendor-submitted",
    },
    normalized: {
      amount: 118000,
      currency: "USD",
      unit: "workload-month",
      period: "annual",
      quantity: 120,
      scenario: "locked-rfp-basis",
      method: "buyer-normalized-unit-price",
    },
    ...overrides,
  };
}

describe("evaluatePricingComparability", () => {
  it("keeps raw and normalized values distinct when comparison is allowed", () => {
    const result = evaluatePricingComparability({
      claimId: "d19c-tco",
      records: [
        completeRecord(),
        completeRecord({
          recordId: "vendor-b:L-CMP-01",
          vendorId: "vendor-b",
          vendorName: "Vendor B",
          raw: {
            amount: 125000,
            currency: "USD",
            unit: "workload-month",
            period: "annual",
            quantity: 120,
            scenario: "vendor-submitted",
          },
          normalized: {
            amount: 121000,
            currency: "USD",
            unit: "workload-month",
            period: "annual",
            quantity: 120,
            scenario: "locked-rfp-basis",
            method: "buyer-normalized-unit-price",
          },
        }),
      ],
    });

    expect(result.status).toBe("comparable");
    expect(result.comparisonAllowed).toBe(true);
    expect(result.tcoClaimsAllowed).toBe(true);
    expect(result.records[0]?.raw.amount).toBe(120000);
    expect(result.records[0]?.normalized?.amount).toBe(118000);
    expect(result.records[0]?.raw.amount).not.toBe(
      result.records[0]?.normalized?.amount,
    );
  });

  it.each([
    ["currency", { currency: undefined }],
    ["unit", { unit: undefined }],
    ["period", { period: undefined }],
    ["quantity", { quantity: undefined }],
    ["scenario", { scenario: undefined }],
  ] as const)(
    "blocks comparison and TCO claims when normalized %s is missing",
    (dimension, normalizedPatch) => {
      const result = evaluatePricingComparability({
        claimId: "d19c-tco",
        records: [
          completeRecord({
            normalized: {
              amount: 118000,
              currency: "USD",
              unit: "workload-month",
              period: "annual",
              quantity: 120,
              scenario: "locked-rfp-basis",
              ...normalizedPatch,
            },
          }),
        ],
      });

      expect(result.status).toBe("blocked");
      expect(result.comparisonAllowed).toBe(false);
      expect(result.tcoClaimsAllowed).toBe(false);
      expect(result.blockers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            dimension,
            valueKind: "normalized",
          }),
        ]),
      );
    },
  );

  it("blocks when only raw pricing is present", () => {
    const result = evaluatePricingComparability({
      claimId: "d19c-tco",
      records: [
        completeRecord({
          normalized: null,
        }),
      ],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContainEqual(
      expect.objectContaining({
        recordId: "vendor-a:L-CMP-01",
        valueKind: "normalized",
        dimension: "amount",
      }),
    );
    expect(result.records[0]?.raw.amount).toBe(120000);
    expect(result.records[0]?.normalized).toBeNull();
  });

  it("blocks cross-vendor comparison when normalized bases differ", () => {
    const result = evaluatePricingComparability({
      claimId: "d19c-tco",
      records: [
        completeRecord(),
        completeRecord({
          recordId: "vendor-b:L-CMP-01",
          vendorId: "vendor-b",
          vendorName: "Vendor B",
          normalized: {
            amount: 121000,
            currency: "EUR",
            unit: "workload-month",
            period: "annual",
            quantity: 120,
            scenario: "locked-rfp-basis",
          },
        }),
      ],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContainEqual(
      expect.objectContaining({
        dimension: "currency",
        reason: "normalized_basis_mismatch",
      }),
    );
  });
});
