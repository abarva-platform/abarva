import { applicationCountLineage, countLineage, quotability, traceLine, type FactLineage } from "../fact-lineage";

const rows = Array.from({ length: 306 }, (_, i) => ({ id: i, deploymentModel: i < 194 ? "on_premise" : "saas" }));

describe("a figure carries its grain, because grain is what makes two honest counts differ", () => {
  it("explains a larger count from another surface instead of picking a winner", () => {
    const lineage = applicationCountLineage(rows, 750);
    expect(lineage.value).toBe(306);
    expect(lineage.grain).toBe("one application record");
    expect(lineage.agreement).toBe("conflict");
    expect(lineage.disagreements?.[0]).toMatchObject({ value: 750, reconciled: true });
    expect(lineage.disagreements?.[0].reason).toMatch(/deployed instance/);
  });

  it("reports a single source when nothing else counts the same subject", () => {
    const lineage = applicationCountLineage(rows);
    expect(lineage.agreement).toBe("single_source");
    expect(lineage.disagreements).toBeUndefined();
  });

  it("does not manufacture a disagreement from an identical count", () => {
    expect(applicationCountLineage(rows, 306).agreement).toBe("single_source");
  });
});

describe("quotability", () => {
  it("keeps a reconciled difference quotable, but only with its grain", () => {
    const standing = quotability(applicationCountLineage(rows, 750));
    expect(standing.quotable).toBe(true);
    expect(standing.qualifier).toMatch(/one application record/);
  });

  // The gate: an unexplained disagreement between two governed surfaces is a defect, and the honest
  // rendering is to refuse the number rather than to pick one.
  it("refuses a figure whose disagreement has no stated reason", () => {
    const unexplained: FactLineage = {
      value: 306,
      label: "applications",
      grain: "one application record",
      sources: [{ file: "04_applications_systems.csv", rows: 306 }],
      agreement: "conflict",
      disagreements: [{ value: 750, source: "another surface", reason: "unknown", reconciled: false }],
    };
    const standing = quotability(unexplained);
    expect(standing.quotable).toBe(false);
    expect(standing.qualifier).toMatch(/Not quotable/);
    expect(standing.qualifier).toMatch(/750/);
  });

  it("names the single file when only one asserts the value", () => {
    expect(quotability(applicationCountLineage(rows)).qualifier).toMatch(/04_applications_systems\.csv is the only file/);
  });
});

describe("counting with a stated rule", () => {
  const lineage = countLineage(
    { rows, file: "04_applications_systems.csv", grain: "one application record" },
    "self-hosted applications",
    { filter: "deploymentModel is on_premise", matches: (r) => r.deploymentModel === "on_premise" },
  );

  it("counts what the rule selects", () => {
    expect(lineage.value).toBe(194);
  });

  it("traces to files, rule and grain in one line a reader can act on", () => {
    expect(traceLine(lineage)).toBe(
      "04_applications_systems.csv (306 rows) · filtered to deploymentModel is on_premise · one row = one application record",
    );
  });
});
