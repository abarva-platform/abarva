import { formatConsultantPercent, formatValueCents } from "../value-engine/format-money";

describe("value readback money formatting", () => {
  it("turns engine cents into compact dollars without changing the amount's unit", () => {
    expect(formatValueCents(123_456_789)).toBe("$1.23M");
    expect(formatValueCents(84_000_000)).toBe("$0.84M");
    expect(formatValueCents(12_345)).toBe("$123.45");
    expect(formatValueCents(-123_456_789)).toBe("$(1.23)M");
    expect(formatValueCents(12_000_000)).toBe("$0.12M");
    expect(formatValueCents(-31_000_000)).toBe("$(0.31)M");
    expect(formatConsultantPercent(0.12)).toBe("12%");
  });

  it("withholds unavailable engine values", () => {
    expect(formatValueCents(null)).toBe("unknown");
    expect(formatValueCents(Number.NaN)).toBe("unknown");
  });
});
