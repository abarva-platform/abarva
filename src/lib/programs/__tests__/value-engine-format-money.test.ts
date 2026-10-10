import { formatValueCents } from "../value-engine/format-money";

describe("value readback money formatting", () => {
  it("turns engine cents into compact dollars without changing the amount's unit", () => {
    expect(formatValueCents(123_456_789)).toBe("$1.2M");
    expect(formatValueCents(84_000_000)).toBe("$840K");
    expect(formatValueCents(12_345)).toBe("$123.5");
    expect(formatValueCents(-123_456_789)).toBe("-$1.2M");
  });

  it("withholds unavailable engine values", () => {
    expect(formatValueCents(null)).toBe("unknown");
    expect(formatValueCents(Number.NaN)).toBe("unknown");
  });
});
