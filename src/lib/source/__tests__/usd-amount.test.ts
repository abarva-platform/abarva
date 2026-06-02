import { coerceUsdAmount, coerceUsdAmountOrZero } from "../usd-amount";

describe("Source USD amount coercion", () => {
  it("coerces pg numeric strings before Source math/rendering", () => {
    expect(coerceUsdAmount("4000000")).toBe(4_000_000);
    expect(coerceUsdAmount("35,000,000")).toBe(35_000_000);
    expect(coerceUsdAmount("$39,000,000")).toBe(39_000_000);
  });

  it("returns null for invalid amounts and supports zero fallback", () => {
    expect(coerceUsdAmount(null)).toBeNull();
    expect(coerceUsdAmount("not-a-number")).toBeNull();
    expect(coerceUsdAmountOrZero("not-a-number")).toBe(0);
  });
});
