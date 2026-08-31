import fs from "node:fs";
import path from "node:path";
import { segmentApplications, crosstab, estateVersusRevenue, type SegmentationMap, type ApplicationRow } from "../application-segmentation";

const ROOT = path.resolve(__dirname, "../../..");
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, "config/segmentation/health-system-v1.json"), "utf8")) as SegmentationMap;

function app(over: Partial<ApplicationRow> = {}): ApplicationRow {
  return {
    system_name: "Epic Hyperspace",
    system_category: "Epic clinical & revenue-cycle front end",
    business_function: "Clinical Informatics",
    deployment_model: "hosted_by_vendor",
    annual_cost_usd: "1000000",
    ...over,
  };
}

describe("declared map", () => {
  it("names every archetype it assigns", () => {
    const assigned = new Set(Object.values(MAP.system_category_to_archetype));
    for (const value of assigned) expect(MAP.archetypes).toContain(value);
  });

  // The map is the contract. A source value it does not cover must surface by name, not vanish
  // into an "other" bucket that hides how much of the estate went unsegmented.
  it("covers every system_category and business_function present in the live source", () => {
    const csv = fs.readFileSync(
      path.join(ROOT, "datasets/tenant-inputs/active/meridian-health/current/04_applications_systems.csv"),
      "utf8",
    );
    const header = csv.slice(0, csv.indexOf("\n")).split(",");
    const catIndex = header.indexOf("system_category");
    const fnIndex = header.indexOf("business_function");
    expect(catIndex).toBeGreaterThan(-1);
    expect(fnIndex).toBeGreaterThan(-1);

    // Column values in this file are unquoted single tokens; a full parse lives in the reporter.
    const missing: string[] = [];
    for (const line of csv.split("\n").slice(1)) {
      if (!line.trim()) continue;
      const cells = splitCsvLine(line);
      const category = (cells[catIndex] ?? "").trim();
      const fn = (cells[fnIndex] ?? "").trim();
      if (category && !MAP.system_category_to_archetype[category]) missing.push(`system_category:${category}`);
      if (fn && !MAP.business_function_map[fn]) missing.push(`business_function:${fn}`);
    }
    expect([...new Set(missing)]).toEqual([]);
  });

  it("records why each contested assignment is contested", () => {
    expect(MAP.business_function_map["Population Health & Care Management"].contested).toMatch(/plan/i);
    // The largest single assignment must say so: it moves roughly a third of the estate.
    expect(MAP.business_function_map["Clinical Informatics"].contested).toMatch(/99 of 306/);
  });

  it("assigns every function to a segment the declared spine actually contains", () => {
    const spine = new Set(
      fs.readFileSync(path.join(ROOT, "datasets/tenant-inputs/active/meridian-health/current/01b_business_segments.csv"), "utf8")
        .split("\n").slice(1).filter((l) => l.trim()).map((l) => l.split(",")[1]),
    );
    for (const [fn, entry] of Object.entries(MAP.business_function_map)) {
      expect({ fn, inSpine: spine.has(entry.segment_key) }).toEqual({ fn, inSpine: true });
    }
  });
});

describe("segmentation", () => {
  it("assigns all four axes from the declared map", () => {
    const [segmented] = segmentApplications([app()], MAP);
    expect(segmented).toMatchObject({
      archetype: "Clinical Core",
      hosting: "Vendor-hosted",
      segmentKey: "hospital_delivery",
      clinical: "clinical",
      office: "middle",
      annualCostUsd: 1_000_000,
      unmapped: [],
    });
  });

  // Planted failure: an unmapped value must be named, not silently bucketed.
  it("names an unmapped source value rather than absorbing it", () => {
    const [segmented] = segmentApplications([app({ system_category: "Quantum Ledger Fabric" })], MAP);
    expect(segmented.archetype).toBe("Unmapped");
    expect(segmented.unmapped).toEqual(["system_category:Quantum Ledger Fabric"]);
  });

  it("treats an unparseable cost as zero rather than NaN", () => {
    expect(segmentApplications([app({ annual_cost_usd: "n/a" })], MAP)[0].annualCostUsd).toBe(0);
  });
});

describe("crosstab", () => {
  const rows = segmentApplications(
    [
      app(),
      app({ system_category: "Epic payer core administration", business_function: "Health Plan & Payer Operations", deployment_model: "saas", annual_cost_usd: "500000" }),
      app({ system_category: "SQL Server database/mart", business_function: "Data Analytics & AI", deployment_model: "on_premise", annual_cost_usd: "250000" }),
    ],
    MAP,
  );

  it("totals reconcile across rows, columns and the grand total", () => {
    const table = crosstab(rows, "segmentKey", "hosting");
    expect(table.total.apps).toBe(3);
    expect(Object.values(table.rowTotals).reduce((n, r) => n + r.apps, 0)).toBe(3);
    expect(Object.values(table.colTotals).reduce((n, c) => n + c.apps, 0)).toBe(3);
    expect(table.total.annualCostUsd).toBe(1_750_000);
  });

  it("puts each application in exactly one cell", () => {
    const table = crosstab(rows, "archetype", "hosting");
    const summed = table.rows.reduce(
      (n, r) => n + table.cols.reduce((m, c) => m + (table.cells[r]?.[c]?.apps ?? 0), 0), 0,
    );
    expect(summed).toBe(rows.length);
  });
});

describe("estate versus revenue", () => {
  it("reports the gap between a line's cost share and its revenue share", () => {
    const rows = segmentApplications(
      [
        app({ annual_cost_usd: "900000" }),
        app({ system_category: "Epic payer core administration", business_function: "Health Plan & Payer Operations", annual_cost_usd: "100000" }),
      ],
      MAP,
    );
    const report = estateVersusRevenue(rows, { hospital_delivery: 42, health_plan: 40 });
    expect(report.find((r) => r.segmentKey === "health_plan")).toMatchObject({ costShare: 10, revenueShare: 40, gapVsRevenue: -30 });
  });

  it("leaves the gap null for a line with no declared revenue share", () => {
    const rows = segmentApplications([app({ business_function: "Finance & Accounting" })], MAP);
    const entry = estateVersusRevenue(rows, { health_plan: 40 }).find((x) => x.segmentKey === "shared_enterprise")!;
    expect(entry.gapVsRevenue).toBeNull();
  });
});

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "", quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(field); field = ""; }
    else field += ch;
  }
  out.push(field);
  return out;
}
