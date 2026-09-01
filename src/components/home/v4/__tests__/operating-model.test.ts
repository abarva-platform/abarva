/**
 * The Operating Model chapter, held to the record it actually reads.
 *
 * The org family arrives with a parent on nearly every unit, decision rights on all of them, and no
 * headcount, budget authority, span of control or succession risk field at all. Every fixture here
 * is built to that shape rather than to a shape that makes a table easy to write, because the
 * failure this suite exists to catch -- a measure the record does not carry, summed to zero and
 * printed against every level -- only appears under the real one.
 */
import {
  organizationTables,
  organizationFindings,
  type EstateRow,
} from "../page-tables";

/** One unit in the shape the projection maps: no headcount, no budget, no span, no succession. */
function unit(
  orgUnit: string,
  parentOrgUnit: string,
  roleLevel: string,
  extra: EstateRow = {},
): EstateRow {
  return {
    orgUnit,
    parentOrgUnit,
    roleLevel,
    leaderNameOrRole: `${orgUnit} lead`,
    decisionRights: "Approves changes in its own function",
    ownedFunctions: "Operations",
    ownedDataDomains: "Operations",
    ...extra,
  };
}

/** The shape of the served record: one root, two levels of reports, no measures anywhere. */
function realShape(): EstateRow[] {
  return [
    unit("Office of the CEO", "", "CEO"),
    unit("Chief Operating Officer", "Office of the CEO", "C-suite"),
    unit("Chief Financial Officer", "Office of the CEO", "C-suite"),
    unit("VP Ground Operations", "Chief Operating Officer", "VP"),
    unit("VP Flight Operations", "Chief Operating Officer", "VP"),
    unit("VP Financial Planning", "Chief Financial Officer", "VP"),
  ];
}

const table = (rows: EstateRow[], caption: string) =>
  organizationTables(rows).find((t) => t.caption === caption);

describe("where authority sits", () => {
  it("does not print a headcount of zero for a record that carries no headcount", () => {
    // The defect this replaces: every level read "0" and the total read "0", which a reader takes
    // as an enterprise employing nobody rather than as a field the intake never collected.
    const authority = table(realShape(), "Where authority sits");
    expect(authority).toBeDefined();
    expect(authority!.columns).toEqual(["Level", "Units"]);
    expect(authority!.rows.flat()).not.toContain(0);
    expect(authority!.rows.flat()).not.toContain("0");
    expect(authority!.total).toEqual(["Declared", 6]);
  });

  it("names the measures it dropped instead of leaving them missing", () => {
    const authority = table(realShape(), "Where authority sits");
    expect(authority!.note).toContain("headcount");
    expect(authority!.note).toContain("budget authority");
    expect(authority!.note).toContain("would print as zero");
  });

  it("draws a measure the moment one unit declares it", () => {
    const rows = realShape();
    rows[1] = { ...rows[1], headcount: 240 };
    const authority = table(rows, "Where authority sits");
    expect(authority!.columns).toEqual(["Level", "Units", "Headcount"]);
    expect(authority!.total).toEqual(["Declared", 6, "240"]);
    // The one measure that is present is drawn; the one that is not is still named.
    expect(authority!.note).toContain("budget authority");
    expect(authority!.note).not.toContain("headcount");
  });

  it("reconciles its total against units that declare no level", () => {
    const rows = [...realShape(), unit("Unassigned programme office", "", "")];
    const authority = table(rows, "Where authority sits");
    expect(authority!.total?.[1]).toBe(7);
    expect(authority!.note).toContain("1 unit declares no level");
  });
});

describe("who reports to whom", () => {
  it("counts reporting lines from the parents the record names", () => {
    const reports = table(realShape(), "Who reports to whom");
    expect(reports).toBeDefined();
    expect(reports!.rows[0]).toEqual([
      "Chief Operating Officer",
      "C-suite",
      2,
      1,
    ]);
    // Two under the COO, one under the CFO, two C-suite under the CEO: five of six units parented.
    expect(reports!.total?.[2]).toBe(5);
    // The CEO's office is two levels deep; that is the depth reported for the structure.
    expect(reports!.total?.[3]).toBe(2);
  });

  it("says the count is not a declared span of control", () => {
    const reports = table(realShape(), "Who reports to whom");
    expect(reports!.note).toContain("no span-of-control field");
    expect(reports!.note).toContain("Every parent named resolves");
  });

  it("reports a parent the record does not carry rather than dropping the unit", () => {
    const rows = [
      ...realShape(),
      unit("VP Cargo", "Chief Cargo Officer", "VP"),
    ];
    const reports = table(rows, "Who reports to whom");
    expect(reports!.note).toContain(
      "1 unit names a parent that is not itself a unit in this record",
    );
    expect(
      organizationFindings(rows).find((f) =>
        f.claim.includes("to a parent this record does not carry"),
      ),
    ).toMatchObject({ kind: "exposure" });
  });

  it("terminates on a record that names a unit in its own ancestry", () => {
    // A cycle is a data defect, not an impossibility. A depth walk that trusts the links hangs the
    // render, and a hung render is indistinguishable from an outage.
    const rows = [
      unit("A", "C", "C-suite"),
      unit("B", "A", "VP"),
      unit("C", "B", "VP"),
    ];
    expect(() => organizationTables(rows)).not.toThrow();
    const reports = table(rows, "Who reports to whom");
    expect(reports!.rows).toHaveLength(3);
  });

  it("is not drawn at all when no unit names a parent", () => {
    const rows = realShape().map((u) => ({ ...u, parentOrgUnit: "" }));
    expect(table(rows, "Who reports to whom")).toBeUndefined();
    expect(table(rows, "Where authority sits")).toBeDefined();
  });
});

describe("what the org record cannot say", () => {
  it("states that no unit owns a system, which the old rule could not reach", () => {
    // The previous guard started at one, so the loudest reading of the column -- nobody owns
    // anything -- produced no finding at all.
    const found = organizationFindings(realShape()).find((f) =>
      f.claim.includes("No org unit names a system it owns"),
    );
    expect(found).toMatchObject({ kind: "absence" });
    expect(found!.trace?.rule).toBe("ownedSystems is empty on every row");
  });

  it("states that authority is named but never sized", () => {
    const found = organizationFindings(realShape()).find((f) =>
      f.claim.includes("never sized"),
    );
    expect(found!.claim).toContain("headcount or budget authority");
  });

  it("stops saying so once the record sizes it", () => {
    const rows = realShape().map((u) => ({
      ...u,
      headcount: 100,
      budgetAuthorityUsd: 5_000_000,
    }));
    expect(
      organizationFindings(rows).some((f) => f.claim.includes("never sized")),
    ).toBe(false);
  });

  it("confirms the structure resolves, with the depth it walked", () => {
    const found = organizationFindings(realShape()).find((f) =>
      f.claim.includes("reporting lines resolve"),
    );
    expect(found).toMatchObject({ kind: "established" });
    expect(found!.claim).toBe("All 5 reporting lines resolve, 2 levels deep.");
  });

  it("does not confirm a structure that has a broken line", () => {
    const rows = [
      ...realShape(),
      unit("VP Cargo", "Chief Cargo Officer", "VP"),
    ];
    expect(
      organizationFindings(rows).some((f) =>
        f.claim.includes("reporting lines resolve"),
      ),
    ).toBe(false);
  });
});
