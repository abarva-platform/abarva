/**
 * The Performance & Value chapter, held to the record it actually reads.
 *
 * The measures family arrives with a name, a domain, a definition, a baseline and its period, a
 * target, an owner and a data source. It carries no current value and nothing about attestation --
 * so the chapter's two questions, "are we moving toward outcomes" and "can we prove the value", are
 * one half-answerable and one not answerable at all.
 *
 * Every fixture here is built to that shape. The failure this suite exists to catch -- a table
 * grouped on a column the record does not carry, rendering as "0 blocked claims" over an empty
 * body -- only appears under it.
 */
import { metricTables, metricFindings, type EstateRow } from "../page-tables";

/** One measure in the shape the projection maps: no actual value, no claim fields. */
function measure(
  name: string,
  domain: string,
  extra: EstateRow = {},
): EstateRow {
  return {
    metricName: name,
    metricDomain: domain,
    businessFunction: "Flight Operations",
    definition: "A definition the record carries",
    baselineValue: "72",
    baselinePeriod: "FY25",
    targetValue: "85",
    owner: "VP Operations",
    dataSource: "Operations warehouse",
    ...extra,
  };
}

const realShape = (): EstateRow[] => [
  measure("On-time departure", "Operations"),
  measure("Turnaround minutes", "Operations", { owner: "VP Ground" }),
  measure("Ancillary revenue per seat", "Commercial"),
];

const table = (rows: EstateRow[], caption: string) =>
  metricTables(rows).find((t) => t.caption === caption);

describe("what is measured", () => {
  it("counts measures by domain, with targets and owners", () => {
    const measured = table(realShape(), "What is measured, and who owns it");
    expect(measured).toBeDefined();
    expect(measured!.rows[0]).toEqual(["Operations", 2, 2, 2]);
    expect(measured!.total).toEqual(["Declared", 3, 3, 2]);
  });

  it("says measures are counted rather than summed", () => {
    // Different units down the rows. A total across them would be a number with no meaning, and the
    // note is what stops a reader assuming one was withheld.
    const measured = table(realShape(), "What is measured, and who owns it");
    expect(measured!.note).toContain("counted, never summed");
  });

  it("reconciles its total against measures that declare no domain", () => {
    const rows = [...realShape(), measure("Unfiled measure", "")];
    const measured = table(rows, "What is measured, and who owns it");
    expect(measured!.total?.[1]).toBe(4);
    expect(measured!.note).toContain("1 measures declare no domain");
  });
});

describe("the claim table, which most records cannot support", () => {
  it("is not drawn at all when no measure declares a claim readiness", () => {
    // The defect this replaces: the table rendered with an empty body, a total of 0, and the note
    // "0 of the 0 blocked claims already state the action that would unblock them" -- which a
    // reader takes as nothing being blocked when it means nothing was recorded.
    expect(table(realShape(), "Can this value be claimed")).toBeUndefined();
    expect(metricTables(realShape())).toHaveLength(1);
  });

  it("is drawn the moment one measure declares one", () => {
    const rows = realShape();
    rows[0] = {
      ...rows[0],
      claimReadiness: "blocked",
      claimBlockedReason: "No attested baseline",
    };
    const claim = table(rows, "Can this value be claimed");
    expect(claim).toBeDefined();
    expect(claim!.rows[0]).toEqual(["Blocked", 1, 1]);
  });
});

describe("what the measure record cannot say", () => {
  it("states that no measure declares a current value", () => {
    const found = metricFindings(realShape()).find((f) =>
      f.claim.includes("No measure declares a current value"),
    );
    expect(found).toMatchObject({ kind: "absence" });
    // The distance chart above reads as progress unless the reader is told what it measures.
    expect(found!.because).toContain("size of the ambition");
    expect(found!.trace?.rule).toBe("actualValue is empty on every row");
  });

  it("counts the gap instead, once some measures carry a current value", () => {
    const rows = realShape();
    rows[0] = { ...rows[0], actualValue: "78" };
    const claims = metricFindings(rows).map((f) => f.claim);
    expect(claims).not.toContain(
      "No measure declares a current value, across all 3.",
    );
    expect(claims).toContain("2 of 3 measures declare no current value.");
  });

  it("stops saying so once every measure carries one", () => {
    const rows = realShape().map((m) => ({ ...m, actualValue: "78" }));
    expect(
      metricFindings(rows).some((f) => f.claim.includes("current value")),
    ).toBe(false);
  });

  it("states that attestation is unrecorded, not that it failed", () => {
    const found = metricFindings(realShape()).find((f) =>
      f.claim.includes("has been attested"),
    );
    expect(found).toMatchObject({ kind: "absence" });
    // Unrecorded and refused are different answers, and only one of them is in the record.
    expect(found!.because).toContain("different from the answer being no");
  });

  it("stops saying so once any measure declares an attested amount", () => {
    const rows = realShape();
    rows[0] = { ...rows[0], financeAttestedValueUsd: 250_000 };
    expect(
      metricFindings(rows).some((f) => f.claim.includes("has been attested")),
    ).toBe(false);
  });
});
