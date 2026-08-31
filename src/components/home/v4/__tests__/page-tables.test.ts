import fs from "node:fs";
import path from "node:path";
import {
  applicationTables,
  applicationFindings,
  vendorFindings,
  infrastructureFindings,
  dataFindings,
  unsupportedApplicationViews,
  constantColumns,
  costBasis,
  usd,
  type EstateRow,
} from "../page-tables";
import { chapterDepth } from "../chapter-page-content";

const ROOT = path.resolve(__dirname, "../../../..");
const snapshot = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "lib/home/preview/golden-snapshots/meridian-health.json"),
    "utf8",
  ),
);
const recordType = (t: string) =>
  snapshot.technologyEstate.recordTypes.find(
    (r: { objectType: string }) => r.objectType === t,
  );
const apps: EstateRow[] = recordType("application_system").rows;

describe("tables are computed from the rows that ship in the bundle", () => {
  it("reconciles every total to the row count it was built from", () => {
    for (const table of applicationTables(apps)) {
      if (!table.total) continue;
      const appsColumn = table.columns.indexOf("Apps");
      if (appsColumn === -1) continue;
      const stated = Number(table.total[appsColumn]);
      expect(stated).toBeLessThanOrEqual(apps.length);
      expect(stated).toBeGreaterThan(0);
    }
  });

  // Truncation must be stated. A table showing 8 of 22 functions without saying so reads as the
  // whole estate, which is the failure mode the note exists to prevent.
  it("states its own bound when it shows fewer rows than the source has", () => {
    const crosstab = applicationTables(apps)[0];
    expect(crosstab.note).toMatch(/of 22 functions shown/);
    expect(crosstab.note).toMatch(/total row counts all of them/);
  });

  it("reports undeclared values as unassessed rather than as a value", () => {
    const readiness = applicationTables(apps).find(
      (t) => t.caption === "Cloud readiness",
    );
    expect(readiness?.note).toMatch(/counted as unassessed, not as a value/);
  });

  it("renders nothing from no rows", () => {
    expect(applicationTables([])).toEqual([]);
    expect(applicationFindings([])).toEqual([]);
  });
});

describe("findings are rules, so their numbers cannot go stale", () => {
  it("crosses authentication with data classification — a population neither column holds", () => {
    const finding = applicationFindings(apps).find((f) => /PHI/.test(f.claim));
    const expected = apps.filter(
      (a) =>
        a.authenticationMethod === "local_accounts" &&
        String(a.dataClassification).toLowerCase() === "phi",
    ).length;
    expect(finding?.claim).toBe(
      `${expected} applications holding PHI authenticate on local accounts.`,
    );
    expect(finding?.kind).toBe("exposure");
    expect(expected).toBeGreaterThan(0);
  });

  // The planted failure: remove the condition and the finding must stop firing, not fire with zero.
  it("stops firing when the condition it reports is absent", () => {
    const clean = apps.map((a) => ({ ...a, authenticationMethod: "sso_saml" }));
    expect(applicationFindings(clean).some((f) => /PHI/.test(f.claim))).toBe(
      false,
    );
  });

  it("gives every finding an owner and a because-clause", () => {
    const all = [
      ...applicationFindings(apps),
      ...vendorFindings(recordType("vendor_contract").rows),
      ...infrastructureFindings(recordType("infrastructure_platform").rows),
      ...dataFindings(recordType("data_asset_or_integration").rows),
    ];
    expect(all.length).toBeGreaterThan(4);
    for (const finding of all) {
      expect(finding.owner.length).toBeGreaterThan(2);
      expect(finding.because.length).toBeGreaterThan(40);
      expect(["exposure", "absence", "established"]).toContain(finding.kind);
    }
  });
});

describe("constant columns are defaults, not results", () => {
  it("names a column whose value never varies", () => {
    const rows: EstateRow[] = [
      { risk: "low", name: "a" },
      { risk: "low", name: "b" },
      { risk: "low", name: "c" },
    ];
    expect(constantColumns(rows, ["risk", "name"])).toEqual([
      { column: "risk", value: "low" },
    ]);
  });

  it("does not flag a column that varies", () => {
    expect(
      constantColumns([{ risk: "low" }, { risk: "high" }], ["risk"]),
    ).toEqual([]);
  });
});

describe("chapter depth", () => {
  it("gives a mapped chapter real tables and findings", () => {
    const depth = chapterDepth("technology_data", {
      applications: apps,
      data: recordType("data_asset_or_integration").rows,
    });
    expect(depth.tables.length).toBeGreaterThanOrEqual(4);
    expect(depth.findings.length).toBeGreaterThanOrEqual(3);
  });

  it("gives an unmapped chapter nothing rather than a placeholder", () => {
    expect(chapterDepth("our_business", { applications: apps })).toEqual({
      tables: [],
      findings: [],
      unsupported: [],
    });
  });

  it("does not repeat a finding that two source families both produce", () => {
    const depth = chapterDepth("what_needs_attention", {
      applications: apps,
      infrastructure: recordType("infrastructure_platform").rows,
    });
    expect(new Set(depth.findings.map((f) => f.claim)).size).toBe(
      depth.findings.length,
    );
  });
});

describe("money formatting", () => {
  it.each([
    [1.5e9, "$1.5B"],
    [2.5e8, "$250.0M"],
    [4000, "$4k"],
    [0, "—"],
  ])("formats %p as %p", (v, out) => {
    expect(usd(v as number)).toBe(out);
  });
});

describe("money figures carry how they were arrived at", () => {
  const basis = costBasis;

  it("says a cost is modelled when the record declares one modelled basis", () => {
    const rows: EstateRow[] = [
      { annualCostBasis: "synthetic_modeled" },
      { annualCostBasis: "synthetic_modeled" },
    ];
    expect(basis(rows)).toMatch(/modelled, not booked/);
    expect(basis(rows)).toMatch(/all 2 rows/);
  });

  it("says so when a column sums figures arrived at differently", () => {
    const rows: EstateRow[] = [
      { annualCostBasis: "invoiced_actual" },
      { annualCostBasis: "synthetic_modeled" },
    ];
    expect(basis(rows)).toMatch(/mix 2 declared bases/);
  });

  it("stays silent when the record declares no basis at all", () => {
    expect(basis([{ annualCostUsd: "10" }])).toBeNull();
  });

  // Against the live record this fires, which is the point: every cost Home renders is modelled.
  it("attaches the basis to the cost tables and raises it as a finding", () => {
    const readiness = applicationTables(apps).find(
      (t) => t.caption === "Cloud readiness",
    );
    expect(readiness?.note).toMatch(/modelled, not booked/);
    const finding = applicationFindings(apps).find((f) =>
      /modelled, not booked/.test(f.claim),
    );
    expect(finding?.owner).toBe("Chief Financial Officer");
    expect(finding?.because).toMatch(
      /relative scale and not for a spend statement/,
    );
  });
});

describe("a wide table does not hide its totals behind a sideways scroll", () => {
  it("marks the crosstab wide and leaves the narrow tables alone", () => {
    const tables = applicationTables(apps);
    const crosstab = tables.find(
      (t) => t.caption === "Business function × hosting",
    );
    expect(crosstab?.wide).toBe(true);
    // Measured in a browser at 1440: the crosstab is 1290px against a 423px half-width cell, so a
    // reader had to scroll sideways to reach the column the table reconciles in.
    expect(crosstab?.columns.length).toBeGreaterThan(4);
    for (const table of tables.filter((t) => t !== crosstab))
      expect(table.wide).toBeUndefined();
  });
});

describe("a view the rows cannot support is named, not dropped", () => {
  const unsupported = unsupportedApplicationViews;

  it("says nothing when every column the views need is present", () => {
    expect(unsupported(apps)).toEqual([]);
  });

  // The defect this exists for: one read path's mapper dropped four columns, so these tables
  // rendered from the golden snapshot and silently vanished on the live path. Silence read as
  // "this enterprise has nothing here", which was never true.
  it("names each missing column and calls it a plumbing gap, not a record gap", () => {
    const stripped = apps.map((a) => {
      const {
        cloudReadiness,
        authenticationMethod,
        annualCostBasis,
        endOfSupportDate,
        ...rest
      } = a;
      return rest;
    });
    const views = unsupported(stripped);
    expect(views).toHaveLength(4);
    expect(
      views.map((v: { missingColumn: string }) => v.missingColumn).sort(),
    ).toEqual([
      "annualCostBasis",
      "authenticationMethod",
      "cloudReadiness",
      "endOfSupportDate",
    ]);
    for (const view of views) {
      expect(view.why).toMatch(
        /gap in what reached the page rather than a gap in the record/,
      );
    }
  });

  it("reports nothing for an empty estate — there is no view to miss", () => {
    expect(unsupported([])).toEqual([]);
  });

  it("carries the unsupported list through chapter depth", () => {
    const stripped = apps.map((a) => ({ ...a, authenticationMethod: "" }));
    const depth = chapterDepth("technology_data", { applications: stripped });
    expect(
      depth.unsupported.some((v) => v.missingColumn === "authenticationMethod"),
    ).toBe(true);
    expect(depth.tables.length).toBeGreaterThan(0);
  });
});
