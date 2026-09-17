import { packageOpportunityAmountFailure } from "../contract-depth-layer4-amount-gate";

describe("Layer 4 opportunity amount gate", () => {
  it("accepts an all-unsized package without inventing a positive amount", () => {
    expect(packageOpportunityAmountFailure(0)).toBeNull();
  });

  it("accepts a supported positive amount", () => {
    expect(packageOpportunityAmountFailure(125000)).toBeNull();
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid or negative amount %s",
    (amount) => {
      expect(packageOpportunityAmountFailure(amount)).toBe(
        "package_opportunity_amount_usd must be a finite, nonnegative total",
      );
    },
  );
});
