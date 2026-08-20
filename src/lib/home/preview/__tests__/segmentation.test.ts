import { computeCrossTab, eligibleCrossDimensions } from "../segmentation";
import type { TechRecordType } from "../types";

const RECORD_TYPE: TechRecordType = {
  objectType: "application_system",
  label: "Applications & Systems",
  columns: ["systemName", "businessFunction", "systemType", "annualCostUsd", "vendor"],
  rows: [
    { systemName: "A", businessFunction: "Clinical Informatics", systemType: "COTS", annualCostUsd: 100, vendor: "Epic" },
    { systemName: "B", businessFunction: "Clinical Informatics", systemType: "COTS", annualCostUsd: 200, vendor: "Epic" },
    { systemName: "C", businessFunction: "Clinical Informatics", systemType: "Custom-built", annualCostUsd: 50, vendor: "Internal" },
    { systemName: "D", businessFunction: "Nursing Operations", systemType: "COTS", annualCostUsd: 75, vendor: "Cerner" },
    { systemName: "E", businessFunction: "Nursing Operations", systemType: null, annualCostUsd: 10, vendor: "Cerner" },
  ],
  primaryDimension: "businessFunction",
  dimensionCounts: [
    { value: "Clinical Informatics", count: 3 },
    { value: "Nursing Operations", count: 2 },
  ],
};

describe("eligibleCrossDimensions", () => {
  it("includes a real low-cardinality string column", () => {
    expect(eligibleCrossDimensions(RECORD_TYPE)).toContain("systemType");
  });

  it("excludes the primary dimension itself", () => {
    expect(eligibleCrossDimensions(RECORD_TYPE)).not.toContain("businessFunction");
  });

  it("excludes a quantitative (numeric) column", () => {
    expect(eligibleCrossDimensions(RECORD_TYPE)).not.toContain("annualCostUsd");
  });

  it("excludes a column with too many distinct values (over the 12-value ceiling)", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      systemName: `S${i}`,
      businessFunction: "X",
      systemType: "COTS",
      annualCostUsd: 1,
      vendor: `Vendor ${i}`, // 20 distinct vendors -- too granular for a matrix column
    }));
    const wide: TechRecordType = { ...RECORD_TYPE, rows };
    expect(eligibleCrossDimensions(wide)).not.toContain("vendor");
  });

  it("excludes a column that is entirely null across all rows", () => {
    const rows = RECORD_TYPE.rows.map((r) => ({ ...r, systemType: null }));
    const allNull: TechRecordType = { ...RECORD_TYPE, rows };
    expect(eligibleCrossDimensions(allNull)).not.toContain("systemType");
  });
});

describe("computeCrossTab", () => {
  it("builds a real matrix of counts, bucketing null as (not specified)", () => {
    const tab = computeCrossTab(RECORD_TYPE, "systemType");
    expect(tab).not.toBeNull();
    if (!tab) return;

    expect(tab.rowValues).toEqual(["Clinical Informatics", "Nursing Operations"]);
    expect(tab.colValues).toContain("COTS");
    expect(tab.colValues).toContain("Custom-built");
    expect(tab.colValues).toContain("(not specified)");

    const ciRowIdx = tab.rowValues.indexOf("Clinical Informatics");
    const cotsColIdx = tab.colValues.indexOf("COTS");
    const customColIdx = tab.colValues.indexOf("Custom-built");
    expect(tab.matrix[ciRowIdx][cotsColIdx]).toBe(2);
    expect(tab.matrix[ciRowIdx][customColIdx]).toBe(1);

    const nursingRowIdx = tab.rowValues.indexOf("Nursing Operations");
    const notSpecifiedColIdx = tab.colValues.indexOf("(not specified)");
    expect(tab.matrix[nursingRowIdx][notSpecifiedColIdx]).toBe(1);
  });

  it("row and column totals sum to the real record count, matching dimensionCounts", () => {
    const tab = computeCrossTab(RECORD_TYPE, "systemType");
    expect(tab).not.toBeNull();
    if (!tab) return;

    expect(tab.rowTotals).toEqual([3, 2]); // matches dimensionCounts exactly
    expect(tab.rowTotals.reduce((a, b) => a + b, 0)).toBe(RECORD_TYPE.rows.length);
    expect(tab.colTotals.reduce((a, b) => a + b, 0)).toBe(RECORD_TYPE.rows.length);
  });

  it("returns null when the record type has no primary dimension", () => {
    const noDim: TechRecordType = { ...RECORD_TYPE, primaryDimension: null };
    expect(computeCrossTab(noDim, "systemType")).toBeNull();
  });
});
