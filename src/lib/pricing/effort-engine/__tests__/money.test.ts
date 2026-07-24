import { applyMultiplierToCents, centsToDisplayDollars, dollarsToCents, hoursToCents, roundHours, sumCents } from "../money";

describe("money — integer cents convention", () => {
  it("dollarsToCents rounds to the nearest cent", () => {
    expect(dollarsToCents(145.5)).toBe(14550);
    expect(dollarsToCents(0.005)).toBe(1); // rounds up at the half-cent boundary
    expect(dollarsToCents(107.97)).toBe(10797);
  });

  it("centsToDisplayDollars is the exact inverse for whole-cent inputs", () => {
    expect(centsToDisplayDollars(14550)).toBe(145.5);
  });

  it("hoursToCents rounds once at the hours*rate boundary", () => {
    // 34.65h × $145.00/hr (14500 cents) = 502425 cents = $5,024.25
    expect(hoursToCents(34.65, 14500)).toBe(502425);
  });

  it("sumCents is exact integer addition, no rounding drift across many lines", () => {
    const many = Array.from({ length: 1000 }, () => 333); // 1000 x $3.33
    expect(sumCents(...many)).toBe(333000);
  });

  it("applyMultiplierToCents rounds once", () => {
    expect(applyMultiplierToCents(100000, 0.75)).toBe(75000);
    expect(applyMultiplierToCents(100000, 1.35)).toBe(135000);
  });

  it("roundHours keeps 4 decimal places and is idempotent", () => {
    const value = 12.345649999;
    const rounded = roundHours(value);
    expect(rounded).toBe(12.3456);
    expect(roundHours(rounded)).toBe(rounded);
  });
});
