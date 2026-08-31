import fs from "node:fs";
import path from "node:path";
import {
  applicationTables,
  applicationFindings,
  vendorTables,
  vendorFindings,
  infrastructureTables,
  infrastructureFindings,
  dataTables,
  dataFindings,
  unsupportedAiViews,
  aiFindings,
  aiTables,
  programFindings,
  programTables,
  riskFindings,
  riskTables,
  metricFindings,
  metricTables,
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

describe("commercial and platform depth", () => {
  const contracts: EstateRow[] = recordType("vendor_contract").rows;
  const platforms: EstateRow[] = recordType("infrastructure_platform").rows;
  const assets: EstateRow[] = recordType("data_asset_or_integration").rows;

  it("puts renewal on a calendar, because a calendar is the only form that shows the wall", () => {
    const table = vendorTables(contracts).find(
      (t) => t.caption === "When the contracts end",
    );
    expect(table).toBeDefined();
    expect(table!.columns).toContain("Auto-renewing");
    expect(Number(table!.total?.[1])).toBe(contracts.length);
  });

  it("names the contracts with no right to test their price", () => {
    const finding = vendorFindings(contracts).find((f) =>
      /test their price/.test(f.claim),
    );
    const expected = contracts.filter(
      (c) => !/^yes/i.test(String(c.benchmarkClause ?? "")),
    ).length;
    expect(finding?.claim).toMatch(new RegExp(`^${expected} contracts`));
    expect(finding?.kind).toBe("absence");
  });

  // Measured against the record's own as-of date, never the clock — so the finding is reproducible
  // and cannot change meaning because a test ran on a different day.
  it("reports contracts already past their term, and says it cannot tell you why", () => {
    const finding = vendorFindings(contracts, "2026-08-21").find((f) =>
      /already passed/.test(f.claim),
    );
    expect(finding?.claim).toMatch(/auto-renewing/);
    expect(finding?.because).toMatch(/which of the two happened is not/);
  });

  it("does not report expiry at all without an as-of date to measure against", () => {
    expect(
      vendorFindings(contracts).some((f) => /already passed/.test(f.claim)),
    ).toBe(false);
  });

  it("crosses criticality with recovery tier, and stays silent when nothing crosses badly", () => {
    const table = infrastructureTables(platforms).find(
      (t) => t.caption === "Criticality × recovery tier",
    );
    expect(table?.wide).toBe(true);
    // In the current record no tier-1 platform recovers from backup alone, so the finding must not
    // fire. A gate that reports zero is indistinguishable from one that never checked.
    const worst = platforms.filter(
      (p) =>
        /tier1/.test(String(p.criticality ?? "")) &&
        /tier3/.test(String(p.drTier ?? "")),
    ).length;
    const fired = infrastructureFindings(platforms).some((f) =>
      /tier-1 platforms recover from backup alone/.test(f.claim),
    );
    expect(fired).toBe(worst > 0);
  });

  it("fires the criticality crossing when a tier-1 platform is on backup only", () => {
    const planted = [
      ...platforms,
      {
        criticality: "tier1",
        drTier: "tier3_backup_only",
        platformName: "planted",
      },
    ];
    const finding = infrastructureFindings(planted).find((f) =>
      /tier-1 platforms recover from backup alone/.test(f.claim),
    );
    expect(finding?.kind).toBe("exposure");
  });

  it("names where the data actually sits, with how much of it is regulated", () => {
    const table = dataTables(assets).find(
      (t) => t.caption === "Where the data actually sits",
    );
    expect(table?.columns).toEqual(["Platform", "Assets", "Regulated"]);
    const finding = dataFindings(assets).find((f) =>
      /data assets sit on/.test(f.claim),
    );
    expect(finding?.claim).toMatch(/of them regulated/);
  });
});

describe("the intake families the projection now carries", () => {
  const metrics: EstateRow[] = [
    { metricName: "A", claimReadiness: "claimable" },
    {
      metricName: "B",
      claimReadiness: "pending_attestation",
      claimBlockedReason: "cohort disputed",
      unblockAction: "agree the cohort",
      unblockTargetPeriod: "FY2027 Q2",
    },
    {
      metricName: "C",
      claimReadiness: "not_ready",
      claimBlockedReason: "not separable",
      unblockAction: "agree attribution",
    },
  ];
  const riskRows: EstateRow[] = [
    {
      riskOrControlName: "R1",
      severity: "high",
      controlStatus: "open",
      riskDomain: "data_privacy",
      remediationCostUsd: "500000",
      regulatoryDriver: "yes",
    },
    {
      riskOrControlName: "R2",
      severity: "high",
      controlStatus: "operating",
      riskDomain: "operational",
      remediationCostUsd: "250000",
    },
    {
      riskOrControlName: "R3",
      severity: "low",
      controlStatus: "operating",
      riskDomain: "operational",
    },
  ];

  // The unblock list is the agenda. A count of blocked claims is not actionable; a named action
  // against a named period is, and every blocked claim in the record carries both.
  it("renders the unblock action beside the reason, not just a count", () => {
    const table = metricTables(metrics).find(
      (t) => t.caption === "What would unblock each claim",
    );
    expect(table?.wide).toBe(true);
    expect(table?.columns).toEqual([
      "Metric",
      "Blocked because",
      "Unblock action",
      "By",
    ]);
    expect(table?.rows[0]).toContain("agree the cohort");
  });

  it("says when an unblock action carries no period, because an action with no date is an intention", () => {
    const finding = metricFindings(metrics).find((f) =>
      /carry no target period/.test(f.claim),
    );
    expect(finding?.claim).toMatch(/^1 unblock action/);
  });

  it("reads the register's own severity against its own control state", () => {
    const finding = riskFindings(riskRows).find((f) =>
      /no operating control/.test(f.claim),
    );
    expect(finding?.claim).toBe(
      "One high-severity risk has no operating control: R1.",
    );
    expect(finding?.kind).toBe("exposure");
  });

  it("sums remediation from the rows rather than asserting a total", () => {
    expect(
      riskFindings(riskRows).find((f) =>
        /remediate the whole register/.test(f.claim),
      )?.claim,
    ).toMatch(/\$750k/);
  });

  it("builds nothing at all from a family the projection has not loaded", () => {
    expect(metricTables([])).toEqual([]);
    expect(metricFindings([])).toEqual([]);
    expect(riskTables([])).toEqual([]);
    expect(riskFindings([])).toEqual([]);
  });
});

describe("programmes and AI", () => {
  const programs: EstateRow[] = [
    {
      programName: "P1",
      status: "on_track",
      pctComplete: "3",
      budgetUsd: "38000000",
      expectedValueUsd: "40000000",
    },
    {
      programName: "P2",
      status: "at_risk",
      pctComplete: "1",
      budgetUsd: "18000000",
      expectedValueUsd: "20000000",
      blockedReason: "funding year one only",
    },
    {
      programName: "P3",
      status: "active",
      pctComplete: "65",
      budgetUsd: "5000000",
      expectedValueUsd: "9000000",
    },
  ];

  // Status and completion are declared separately and can disagree. That disagreement is a
  // governance fact rather than a delivery one, and it is invisible in either column alone.
  it("names programmes reporting on track at single-digit completion", () => {
    const finding = programFindings(programs).find((f) =>
      /report on track at under 10%/.test(f.claim),
    );
    expect(finding?.claim).toMatch(/^1 programmes? report/);
    expect(finding?.claim).toContain("P1");
    expect(finding?.because).toMatch(/judgement behind it is not written down/);
  });

  it("reports the expected-value ratio as a forecast, not a return", () => {
    const finding = programFindings(programs).find((f) =>
      /ratio of/.test(f.claim),
    );
    expect(finding?.claim).toMatch(/ratio of 1\.\d\d/);
    expect(finding?.because).toMatch(/not a return/);
  });

  // A column the source does not carry and a column that is empty are the same rows and opposite
  // claims. Firing "none may book value" off an absent field states something false.
  it("does not claim a booking gate is closed when the column is absent", () => {
    const noGate: EstateRow[] = [{ useCaseName: "U1", currentStatus: "pilot" }];
    expect(
      aiFindings(noGate).some((f) =>
        /may not book realized value/.test(f.claim),
      ),
    ).toBe(false);
    expect(unsupportedAiViews(noGate).map((v) => v.missingColumn)).toContain(
      "realizedValueAllowed",
    );
  });

  it("does claim it when the gate is declared and closed", () => {
    const withGate: EstateRow[] = [
      { useCaseName: "U1", realizedValueAllowed: "false" },
      { useCaseName: "U2", realizedValueAllowed: "true" },
    ];
    expect(
      aiFindings(withGate).find((f) =>
        /may not book realized value/.test(f.claim),
      )?.claim,
    ).toMatch(/^1 of 2/);
    expect(
      unsupportedAiViews(withGate).map((v) => v.missingColumn),
    ).not.toContain("realizedValueAllowed");
  });

  it("builds nothing from families the projection has not loaded", () => {
    expect(programTables([])).toEqual([]);
    expect(aiTables([])).toEqual([]);
    expect(unsupportedAiViews([])).toEqual([]);
  });
});
