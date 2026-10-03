/**
 * The cross-dimensional cockpit's arithmetic, tested directly.
 *
 * These pin the property the whole surface rests on: every figure the cockpit draws is a count or a
 * sum over the estate rows it was given, never a value typed in. A fixture of four applications and
 * three vendors in, a known set of aggregates out -- so a hardcoded number (the prototype's
 * illustrative "306", for instance) could not survive here, and the null-debt and missing-dimension
 * honesty is asserted rather than assumed.
 */
import type { EstateRow } from "../page-tables";
import {
  NOT_RECORDED,
  aggregateByDimension,
  defaultDir,
  estateScale,
  filterByDrill,
  normalizeApps,
  normalizeVendors,
  relationshipSummary,
  scatterPoints,
  sortApps,
  vendorSpendIndex,
} from "../tech-estate-pivot";

const APPS: EstateRow[] = [
  {
    systemName: "A",
    vendor: "Epic",
    businessFunction: "Clinical",
    criticality: "tier1",
    deploymentModel: "hosted_by_vendor",
    systemScope: "enterprise",
    lifecycleState: "current",
    annualCostUsd: 100,
    interfacesCount: 10,
    technicalDebtScore: 5,
  },
  {
    systemName: "B",
    vendor: "Epic",
    businessFunction: "Finance",
    criticality: "tier2",
    deploymentModel: "saas",
    systemScope: "facility",
    lifecycleState: "legacy_stable",
    annualCostUsd: 50,
    interfacesCount: 4,
    technicalDebtScore: 3,
  },
  {
    systemName: "C",
    vendor: "Microsoft",
    businessFunction: "Clinical",
    criticality: "tier1",
    deploymentModel: "cloud",
    systemScope: "enterprise",
    lifecycleState: "current",
    annualCostUsd: 200,
    interfacesCount: 8,
    technicalDebtScore: null,
  },
  {
    systemName: "D",
    vendor: "",
    businessFunction: "Clinical",
    criticality: "tier3",
    deploymentModel: "on_premise",
    systemScope: "function",
    lifecycleState: "deprecated",
    annualCostUsd: 30,
    interfacesCount: 2,
    technicalDebtScore: 7,
  },
];

const VENDORS: EstateRow[] = [
  { vendorName: "Epic", annualSpendUsd: 1000 },
  { vendorName: "Microsoft", annualSpendUsd: 600 },
  { vendorName: "Cisco", annualSpendUsd: 400 },
];

describe("normalizeApps reads the canonical columns and humanises enum dimensions", () => {
  it("maps the real field names onto the pivot shape", () => {
    const [a] = normalizeApps(APPS);
    expect(a).toMatchObject({
      name: "A",
      provider: "Epic",
      func: "Clinical",
      criticality: "Tier 1",
      deployment: "Hosted by vendor",
      scope: "Enterprise",
      cost: 100,
      interfaces: 10,
      debt: 5,
    });
  });

  it("reports a missing dimension as Not recorded, never merged into a real bucket", () => {
    const d = normalizeApps(APPS)[3];
    expect(d.provider).toBe(NOT_RECORDED);
  });

  it("keeps a missing debt score null rather than coercing it to zero", () => {
    const c = normalizeApps(APPS)[2];
    expect(c.debt).toBeNull();
  });
});

describe("aggregateByDimension groups and sorts by the active measure", () => {
  const apps = normalizeApps(APPS);

  it("sums cost per dimension value and orders by cost", () => {
    const byCost = aggregateByDimension(apps, "provider", "cost");
    expect(byCost).toEqual([
      { name: "Microsoft", count: 1, cost: 200 },
      { name: "Epic", count: 2, cost: 150 },
      { name: NOT_RECORDED, count: 1, cost: 30 },
    ]);
  });

  it("orders by count, breaking ties on name", () => {
    const byCount = aggregateByDimension(apps, "provider", "count");
    expect(byCount.map((g) => g.name)).toEqual([
      "Epic",
      "Microsoft",
      NOT_RECORDED,
    ]);
  });
});

describe("filterByDrill narrows to the drilled value", () => {
  const apps = normalizeApps(APPS);
  it("returns every application when nothing is drilled", () => {
    expect(filterByDrill(apps, "provider", null)).toHaveLength(4);
  });
  it("returns only the applications under the drilled value", () => {
    const epic = filterByDrill(apps, "provider", "Epic");
    expect(epic.map((a) => a.name)).toEqual(["A", "B"]);
  });
});

describe("relationshipSummary counts the drilled slice across dimensions", () => {
  const apps = normalizeApps(APPS);
  const index = vendorSpendIndex(normalizeVendors(VENDORS));

  it("counts applications, cost, tier-1, functions, and interfaces of the slice", () => {
    const epic = filterByDrill(apps, "provider", "Epic");
    const rel = relationshipSummary(epic, "provider", "Epic", index);
    expect(rel).toEqual({
      applications: 2,
      annualCost: 150,
      tier1: 1,
      functionsTouched: 2,
      interfaces: 14,
      vendorSpend: 1000,
    });
  });

  it("crosses into the vendor register only when the drill is by provider", () => {
    const clinical = filterByDrill(apps, "func", "Clinical");
    const rel = relationshipSummary(clinical, "func", "Clinical", index);
    expect(rel.vendorSpend).toBeNull();
    expect(rel.applications).toBe(3);
  });
});

describe("scatterPoints plots only rows with a debt score", () => {
  it("drops a null-debt row and reports how many it dropped", () => {
    const { points, dropped } = scatterPoints(normalizeApps(APPS));
    expect(dropped).toBe(1);
    expect(points.map((p) => p.name).sort()).toEqual(["A", "B", "D"]);
  });
});

describe("estateScale computes the top-line scale from the rows alone", () => {
  it("counts and sums applications, vendors, and spend without inventing a figure", () => {
    const scale = estateScale(normalizeApps(APPS), normalizeVendors(VENDORS), 42);
    expect(scale).toEqual({
      appCount: 4,
      appRunCost: 380,
      vendorCount: 3,
      vendorSpend: 2000,
      topTwoVendorSharePct: 80,
      dataAssetCount: 42,
    });
  });

  it("re-derives when a row changes -- the number is not fixed", () => {
    const dearer = APPS.map((row, i) =>
      i === 0 ? { ...row, annualCostUsd: 500 } : row,
    );
    expect(estateScale(normalizeApps(dearer), [], 0).appRunCost).toBe(780);
  });
});

describe("sortApps sorts each column and sinks null debt", () => {
  const apps = normalizeApps(APPS);
  it("sorts a numeric column and keeps missing scores last", () => {
    const asc = sortApps(apps, { key: "debt", dir: 1 });
    expect(asc.map((a) => a.name)).toEqual(["B", "A", "D", "C"]);
    const desc = sortApps(apps, { key: "debt", dir: -1 });
    // C's null stays last in both directions rather than reading as best or worst.
    expect(desc[desc.length - 1].name).toBe("C");
  });
  it("defaults text columns ascending and numeric columns descending", () => {
    expect(defaultDir("name")).toBe(1);
    expect(defaultDir("cost")).toBe(-1);
  });
});
