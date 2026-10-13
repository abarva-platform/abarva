import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { chapterDepth } from "../chapter-page-content";
import {
  aiFindings,
  applicationFindings,
  crossFamilyFindings,
  dataFindings,
  infrastructureFindings,
  interviewFindings,
  metricFindings,
  organizationFindings,
  programFindings,
  riskFindings,
  vendorFindings,
  vendorTables,
  type EstateRow,
} from "../page-tables";

const contract = (fields: EstateRow = {}): EstateRow => ({
  tenantKey: CANONICAL_TENANT_KEYS[0],
  vendorName: "Example Supplier",
  supportedSystems: "Example System",
  benchmarkClause: "yes",
  ...fields,
});

const renewalFinding = (rows: EstateRow[]) =>
  vendorFindings(rows).find((finding) =>
    /eligible for automatic renewal/.test(finding.claim),
  );

const pastTermFinding = (rows: EstateRow[], asOf?: string) =>
  vendorFindings(rows, asOf).find((finding) =>
    /already passed/.test(finding.claim),
  );

describe("renewal flags establish eligibility, not decisions", () => {
  it("retains the positive-flag count even when a review is recorded", () => {
    const rows = ["yes", true, " Y ", "no"].map((autoRenewFlag) =>
      contract({ autoRenewFlag, renewalDecision: "reviewed" }),
    );
    const finding = renewalFinding(rows);

    expect(finding?.claim).toBe(
      "3 of 4 contracts are eligible for automatic renewal.",
    );
    expect(finding?.kind).toBe("exposure");
    expect(finding?.because).toMatch(/does not establish whether/);
    expect(finding?.because).toMatch(/notice period where declared/);
    expect(finding?.trace?.rule).toContain("yes, true or y");
    expect(finding?.claim).not.toMatch(/without a decision|overdue/);
  });

  it("keeps the existing majority threshold", () => {
    const rows = ["yes", "true", "no", ""].map((autoRenewFlag) =>
      contract({ autoRenewFlag }),
    );
    expect(renewalFinding(rows)).toBeUndefined();
    expect(renewalFinding([...rows, contract({ autoRenewFlag: "y" })])?.claim)
      .toBe("3 of 5 contracts are eligible for automatic renewal.");
  });

  it.each(["true", "y"])(
    "opens the full contract register for eligible flag %s",
    (autoRenewFlag) => {
      const finding = renewalFinding([contract({ autoRenewFlag })]);
      expect(finding?.openRows).toEqual({ objectType: "vendor_contract", filter: "" });
      expect(finding?.because).toMatch(/Inspection opens the full contract register/);
      expect(finding?.trace?.rule).toContain("yes, true or y");
    },
  );

  it("does not invent eligibility when flags are absent or negative", () => {
    expect(renewalFinding([contract(), contract({ autoRenewFlag: "no" })]))
      .toBeUndefined();
    expect(vendorFindings([])).toEqual([]);
  });

  it("keeps renewal table counts while naming undeclared flags", () => {
    const rows = ["yes", true, "no", "", null].map((autoRenewFlag) =>
      contract({ autoRenewFlag }),
    );
    const table = vendorTables(rows).find((item) =>
      item.caption === "Renewal exposure",
    );
    expect(table?.rows).toEqual([
      ["Eligible for automatic renewal", 2, "40%"],
      ["Not flagged for automatic renewal", 3, "60%"],
    ]);
    expect(table?.total).toEqual(["Total", 5, "100%"]);
    expect(table?.note).toMatch(/include undeclared flags/);
    expect(vendorTables(rows).find((item) => item.caption === "When the contracts end")?.note)
      .not.toMatch(/without a decision/);
  });

  it("keeps the commercial signal in its existing chapters", () => {
    const rows = [contract({ autoRenewFlag: "yes" })];
    for (const chapter of ["strategy_value_creation", "performance_value"] as const) {
      expect(chapterDepth(chapter, { vendors: rows }).findings.filter((finding) =>
        /eligible for automatic renewal/.test(finding.claim),
      )).toHaveLength(1);
    }
  });
});

describe("benchmark coverage distinguishes declared absence from unknown", () => {
  it.each(["", null, "unknown", "unrecognized"])(
    "keeps clause state %s unknown rather than asserting missing rights",
    (benchmarkClause) => {
      const findings = vendorFindings([contract({ benchmarkClause })]);
      expect(findings.find((finding) => /unknown benchmark-clause coverage/.test(finding.claim))?.claim)
        .toBe("1 contract has unknown benchmark-clause coverage.");
      expect(findings.some((finding) => /no right|records? no benchmark clause/.test(finding.claim)))
        .toBe(false);
    },
  );

  it("treats an absent clause field as unknown", () => {
    const row = contract();
    delete row.benchmarkClause;
    const findings = vendorFindings([row]);
    expect(findings.find((finding) => /unknown benchmark-clause coverage/.test(finding.claim))?.kind)
      .toBe("absence");
    const table = vendorTables([row]).find((item) => item.caption === "Right to test the price");
    expect(table?.rows.map((cells) => cells.slice(0, 2)))
      .toEqual([["Unknown benchmark-clause coverage", 1]]);
  });

  it("reports explicit negative values as recorded clause evidence", () => {
    const findings = vendorFindings([
      contract({ benchmarkClause: "no" }),
      contract({ benchmarkClause: false }),
    ]);
    const finding = findings.find((item) => /record no benchmark clause/.test(item.claim));
    expect(finding?.claim).toBe("2 contracts record no benchmark clause.");
    expect(finding?.because).toMatch(/explicit negative/);
    expect(finding?.because).toMatch(/not a review of all contractual rights/);
    expect(findings.some((item) => /unknown benchmark-clause coverage/.test(item.claim)))
      .toBe(false);
  });

  it("uses singular wording for one recorded negative clause", () => {
    const finding = vendorFindings([contract({ benchmarkClause: "no" })])
      .find((item) => /records? no benchmark clause/.test(item.claim));
    expect(finding?.claim).toBe("1 contract records no benchmark clause.");
  });

  it("keeps all contracts counted while separating unknown and explicit absence", () => {
    const rows = ["yes_annual", "yes_once_per_term", "no", false, "unknown", null]
      .map((benchmarkClause) => contract({ benchmarkClause }));
    const findings = vendorFindings(rows);
    expect(findings.find((finding) => /record no benchmark clause/.test(finding.claim))?.claim)
      .toBe("2 contracts record no benchmark clause.");
    expect(findings.find((finding) => /unknown benchmark-clause coverage/.test(finding.claim))?.claim)
      .toBe("2 contracts have unknown benchmark-clause coverage.");
    const table = vendorTables(rows).find((item) => item.caption === "Right to test the price");
    expect(table?.rows.map((cells) => cells.slice(0, 2))).toEqual([
      ["Yes annual", 1],
      ["Yes once per term", 1],
      ["Recorded no benchmark clause", 2],
      ["Unknown benchmark-clause coverage", 2],
    ]);
    expect(table?.total?.[1]).toBe(6);
    expect(table?.note).toMatch(/Unknown includes blank, absent and unrecognized/);
    expect(table?.note).not.toMatch(/only leverage|price stands/);
  });
});

describe("mentions and completion do not establish agreement or schedule variance", () => {
  it("counts universal mentions without treating differing modelled responses as consensus", () => {
    const rows = [
      ["Operations", "Prefer a centralized process."],
      ["Finance", "Prefer local review."],
      ["Technology", "The proposed solution needs more evidence."],
      ["Operations", "A second mention adds no executive area."],
    ].map(([executiveArea, response]) => ({
      tenantKey: CANONICAL_TENANT_KEYS[0],
      executiveArea,
      priorityTheme: "Data trust",
      response,
      responseBasis: "modelled",
    }));
    const findings = interviewFindings(rows);
    const finding = findings.find((item) => /raised by every one/.test(item.claim));
    expect(finding?.claim).toBe(
      "1 themes are raised by every one of the 3 executive areas: Data trust.",
    );
    expect(finding?.because).toMatch(/breadth of recorded mentions/);
    expect(finding?.because).toMatch(/does not establish agreement/);
    expect(finding?.because).not.toMatch(/is enterprise consensus/);
    expect(findings.some((item) => /modelled, not transcribed/.test(item.claim))).toBe(true);
  });

  it("preserves early on-track fields without declaring a contradiction", () => {
    const finding = programFindings([{
      programName: "Example Program",
      status: "on_track",
      pctComplete: 5,
    }]).find((item) => /report on track at under 10%/.test(item.claim));
    expect(finding?.claim).toBe(
      "1 programmes report on track at under 10% complete, including Example Program.",
    );
    expect(finding?.kind).toBe("established");
    expect(finding?.because).toMatch(/can both be true/);
    expect(finding?.because).toMatch(/planned milestone or schedule baseline/);
    expect(finding?.because).not.toMatch(/disagree|contradiction|judgement behind/);
  });

  it("retains the completion threshold without counting unknown completion as zero", () => {
    const rows = [5, "", 10, 0].map((pctComplete, index) => ({
      programName: `Example Program ${index}`,
      status: "on_track",
      pctComplete,
    }));
    const finding = programFindings(rows).find((item) => /report on track at under 10%/.test(item.claim));
    expect(finding?.claim).toMatch(/^2 programmes report/);
    expect(finding?.kind).toBe("established");
    expect(finding?.trace?.rule).toBe("status is on_track AND pctComplete is under 10");
  });
});

describe("date findings require an explicit calendar basis", () => {
  it.each([undefined, "", "unknown", "not established", "2026-02-30", "2026-8-21"])(
    "does not infer a passed term from an unknown or invalid as-of value %s",
    (asOf) => {
      expect(pastTermFinding([contract({ termEnd: "2025-12-31" })], asOf))
        .toBeUndefined();
    },
  );

  it("compares only valid dates and states the record as-of basis", () => {
    const rows = [
      contract({ termEnd: "2026-08-20", autoRenewFlag: "yes" }),
      contract({ termEnd: "2026-08-19", autoRenewFlag: "no" }),
      contract({ termEnd: "2026-08-21" }),
      contract({ termEnd: "2026-08-22" }),
      contract({ termEnd: "2026-02-30" }),
      contract({ termEnd: "2026-invalid" }),
      contract(),
    ];
    const finding = pastTermFinding(rows, "2026-08-21");

    expect(finding?.claim).toBe(
      "2 contracts show a term end that has already passed as of 2026-08-21, 1 of them auto-renewing.",
    );
    expect(finding?.trace?.rule).toContain("record as-of 2026-08-21");
    expect(finding?.because).toMatch(/do not establish whether a decision was taken/);
    expect(finding?.because).toMatch(/do not establish an overdue action/);
    expect(finding?.because).not.toMatch(/renewed without|has not been maintained/);
  });

  it("threads the as-of basis through the existing chapter caller", () => {
    const vendors = [contract({ termEnd: "2026-08-20" })];
    const claims = (asOf?: string) =>
      chapterDepth("performance_value", { vendors, asOf }).findings
        .map((finding) => finding.claim);

    expect(claims().some((claim) => /already passed/.test(claim))).toBe(false);
    expect(claims("2026-08-21").some((claim) => /as of 2026-08-21/.test(claim)))
      .toBe(true);
  });

  it("uses the record date independently of the wall clock", () => {
    const rows = [contract({ termEnd: "2026-08-20" })];
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      const before = vendorFindings(rows, "2026-08-21");
      jest.setSystemTime(new Date("2030-01-01T00:00:00Z"));
      expect(vendorFindings(rows, "2026-08-21")).toEqual(before);
      expect(pastTermFinding(rows)).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps year-group counts without calling them outstanding decisions", () => {
    const rows = Array.from({ length: 5 }, () => contract({ termEnd: "2025-06-30" }));
    const finding = vendorFindings(rows).find((item) => /declare term ends/.test(item.claim));

    expect(finding?.claim).toBe("5 contracts declare term ends in 2025.");
    expect(finding?.because).toMatch(/no valid as-of date/);
    expect(finding?.claim).not.toMatch(/upcoming|nearest|overdue|decisions/);
  });

  it("does not classify lifecycle dates as overdue actions", () => {
    const app = applicationFindings([{ endOfSupportDate: "2025-01-01" }])
      .find((finding) => /end-of-support date/.test(finding.claim));
    const platform = infrastructureFindings([{ endOfLifeDate: "2025-01-01" }])
      .find((finding) => /end-of-life date/.test(finding.claim));

    for (const finding of [app, platform]) {
      expect(finding?.kind).toBe("absence");
      expect(finding?.claim).toMatch(/^1 .*declared/);
      expect(finding?.because).toMatch(/Without an as-of basis and recorded action status/);
    }
  });

  it("treats an absent action period as an unknown schedule", () => {
    const findings = metricFindings([{
      metricName: "Example Measure",
      claimBlockedReason: "Review required",
      unblockAction: "Review evidence",
    }]);
    const finding = findings.find((item) => /no target period/.test(item.claim));

    expect(finding?.claim).toBe("1 unblock actions carry no target period.");
    expect(finding?.because).toMatch(/schedule is unknown/);
    expect(finding?.because).toMatch(/does not establish that work is overdue/);
    expect(findings.find((item) => /already state/.test(item.claim))?.because)
      .toMatch(/Target periods must be checked where declared/);
  });
});

describe("finding ownership distinguishes routing from recorded roles", () => {
  it("labels hardcoded roles across finding families as suggested review owners", () => {
    const families = [
      applicationFindings([{ authenticationMethod: "local_accounts", dataClassification: "phi" }]),
      vendorFindings([contract({ autoRenewFlag: "yes", contractOwner: "Example Owner" })]),
      infrastructureFindings([{ endOfLifeDate: "2025-01-01" }]),
      dataFindings([{ regulatedDataFlag: "yes" }]),
      interviewFindings([{ executiveArea: "Operations", responseBasis: "modelled" }]),
      metricFindings([{ metricName: "Example Measure" }]),
      riskFindings([{ severity: "high", controlStatus: "open" }]),
      programFindings([{ programName: "Example Program", status: "on_track", pctComplete: 5 }]),
      aiFindings([{ realizedValueAllowed: "no" }]),
      organizationFindings([{ orgUnitName: "Example Unit" }]),
    ];

    for (const findings of families) {
      expect(findings.length).toBeGreaterThan(0);
      for (const finding of findings) {
        expect(finding.owner).toMatch(/^Suggested review owner: /);
      }
    }
  });

  it.each([
    ["Example Control Owner", "Example Sponsor", "Recorded control owner: Example Control Owner"],
    ["", "Example Sponsor", "Recorded program sponsor: Example Sponsor"],
    ["", "", "Suggested review owner: Chief Risk Officer"],
  ])("preserves declared role precedence for control owner %s and sponsor %s", (
    controlOwner, businessSponsor, expected,
  ) => {
    const finding = crossFamilyFindings({
      risks: [{ riskOrControlName: "Example Risk", severity: "high", controlOwner }],
      programs: [{ programName: "Example Program", pctComplete: 20, status: "in flight", businessSponsor }],
      relationships: [{
        fromObjectName: "Example Risk",
        relationshipType: "impacts",
        toObjectName: "Example Program",
      }],
    }).find((item) => /is a high-severity risk tied to/.test(item.claim));

    expect(finding?.owner).toBe(expected);
    expect(finding?.rated).toBe("high");
    expect(finding?.claim).toBe(
      "Example Risk is a high-severity risk tied to Example Program and that program is 20% complete.",
    );
  });

  it("scopes a recorded role to the first matched row in an aggregate finding", () => {
    const risks = ["A", "B"].map((id) => ({
      riskOrControlName: `Example Risk ${id}`,
      severity: "high",
      controlOwner: `Example Owner ${id}`,
    }));
    const programs = [{ programName: "Example Program", pctComplete: 20 }];
    const relationships = risks.map((risk) => ({
      fromObjectName: risk.riskOrControlName,
      relationshipType: "impacts",
      toObjectName: "Example Program",
    }));
    const finding = crossFamilyFindings({ risks, programs, relationships })
      .find((item) => /high-severity risks are tied/.test(item.claim));

    expect(finding?.claim).toMatch(/^2 high-severity risks/);
    expect(finding?.owner).toBe(
      "Recorded control owner (first matched risk): Example Owner A",
    );
  });
});
