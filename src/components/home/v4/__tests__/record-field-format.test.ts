import { formatRecordField } from "../record-field-format";

describe("record field formatting", () => {
  it.each([
    ["annualCostBasis", "synthetic_modelled", "synthetic modelled"],
    ["annualCostGenerator", "cost_model_v2", "cost_model_v2"],
    ["annualCostModelDate", "2026-10-01", "2026-10-01"],
    ["annualCostModelDate", "2026-10-01T09:30:00Z", "2026-10-01T09:30:00Z"],
    ["annualSpendBasis", "planning estimate", "planning estimate"],
    ["exitCostBasis", "Not verified", "Not verified"],
  ])("retains %s as text", (field, value, expected) => {
    expect(formatRecordField(field, value)).toBe(expected);
  });

  it.each(["annualCostUsd", "annualSpendUsd", "exitCostUsd"])(
    "formats the exact currency field %s",
    (field) => {
      expect(formatRecordField(field, 1_250_000)).toBe("$1.3M");
      expect(formatRecordField(field, "1250000")).toBe("$1.3M");
    },
  );

  it.each([
    [0, "$0"],
    ["0", "$0"],
    [125.5, "$125.5"],
    [1_000, "$1K"],
    [1_000_000, "$1.0M"],
    [1_250_000_000, "$1.25B"],
    [-1_000_000, "$-1.0M"],
    [" 1250 ", "$1K"],
    ["1.25e6", "$1.3M"],
  ])("formats the recorded amount %p as %s", (value, expected) => {
    expect(formatRecordField("annualCostUsd", value)).toBe(expected);
  });

  it.each([
    "annualCostBasis",
    "annualCostGenerator",
    "annualCostModelDate",
    "annualSpendBasis",
    "exitCostBasis",
    "annualCostUsdSource",
    "annualCost",
    "AnnualCostUsd",
    "revenueUsd",
    "budgetUsd",
  ])("does not infer currency from %s", (field) => {
    expect(formatRecordField(field, 1_250)).toBe("1,250");
    expect(formatRecordField(field, "1250")).toBe("1250");
  });

  it.each([
    "annualCostUsd",
    "annualSpendUsd",
    "exitCostUsd",
    "annualCostBasis",
    "annualCostGenerator",
    "annualCostModelDate",
    "utilizationPct",
  ])("keeps missing and unknown %s distinct from zero", (field) => {
    for (const missing of [null, undefined, "", " ", "\t\n"])
      expect(formatRecordField(field, missing)).toBe("\u2014");
    for (const unknown of ["Unknown", "unknown", "Not loaded", "Not verified", "N/A", "\u2014"])
      expect(formatRecordField(field, unknown)).toBe(unknown);
  });

  it.each(["annualCostUsd", "capacityHeadroomPct"])(
    "retains nonnumeric text in %s without inventing a number",
    (field) => {
      for (const text of ["pending review", "2026-10-01", "1,250", "$1K", "0x10", "12x", "NaN", "Infinity"])
        expect(formatRecordField(field, text)).toBe(text);
    },
  );

  it.each([NaN, Infinity, -Infinity])(
    "shows nonfinite numeric value %p as unknown",
    (value) => {
      for (const field of ["annualCostUsd", "utilizationPct", "userCount"])
        expect(formatRecordField(field, value)).toBe("Unknown");
    },
  );

  it.each(["revenueSharePct", "pctComplete", "utilizationPct", "capacityHeadroomPct"])(
    "retains percentage formatting for %s",
    (field) => {
      expect(formatRecordField(field, 25.5)).toBe("25.5%");
      expect(formatRecordField(field, "25.5")).toBe("25.5%");
      expect(formatRecordField(field, 0)).toBe("0%");
    },
  );

  it("retains ordinary record display conventions", () => {
    expect(formatRecordField("userCount", 1_250)).toBe("1,250");
    expect(formatRecordField("userCount", "1250")).toBe("1250");
    expect(formatRecordField("regulatedDataFlag", true)).toBe("Yes");
    expect(formatRecordField("regulatedDataFlag", false)).toBe("No");
    expect(formatRecordField("lifecycleState", "legacy_stable")).toBe("legacy stable");
    expect(formatRecordField("originalRowId", "record_ref_001")).toBe("record_ref_001");
    expect(formatRecordField("renewalDate", "2026-11-01")).toBe("2026-11-01");
    expect(formatRecordField("vendorName", "Supplier, Inc.")).toBe("Supplier, Inc.");
  });
});
