import { attributeByFunction, attributeByDeclaredSegment, buildSegmentSpine, type DeclaredSegment, type FunctionSegmentMap } from "../segment-spine";

const SEGMENTS: DeclaredSegment[] = [
  { segmentKey: "health_plan", segmentName: "Health Plan Operations", revenueSharePct: 40, revenueUsd: 10e9, pnlOwnerRole: "President, Health Plan" },
  { segmentKey: "hospital_delivery", segmentName: "Hospital & Acute Delivery", revenueSharePct: 60, revenueUsd: 15e9, pnlOwnerRole: "COO" },
];

const MAP: FunctionSegmentMap = {
  "Health Plan & Payer Operations": { segment_key: "health_plan", clinical: false, office: "middle" },
  "Nursing Operations": { segment_key: "hospital_delivery", clinical: true, office: "front" },
};

describe("attribution", () => {
  it("attributes records through the function they name", () => {
    const c = attributeByFunction("apps", [
      { fn: "Nursing Operations", cost: 10 },
      { fn: "Nursing Operations", cost: 20 },
      { fn: "Health Plan & Payer Operations", cost: 5 },
    ], MAP, (r) => r.fn, (r) => r.cost);

    expect(c.bySegment).toEqual({ hospital_delivery: 2, health_plan: 1 });
    expect(c.moneyBySegment).toEqual({ hospital_delivery: 30, health_plan: 5 });
    expect(c.unresolved).toEqual([]);
  });

  // Planted failure. An estate that is 30% unattributed must read as 30% unattributed -- a value the
  // map does not cover is named, never folded into a segment or dropped from the denominator.
  it("names a function the map does not cover instead of absorbing it", () => {
    const c = attributeByFunction("apps", [
      { fn: "Nursing Operations" },
      { fn: "Actuarial & Underwriting" },
    ], MAP, (r) => r.fn);

    expect(c.bySegment).toEqual({ hospital_delivery: 1, Unattributed: 1 });
    expect(c.unresolved).toEqual(["Actuarial & Underwriting"]);
  });

  it("attributes a record that already declares its segment by name", () => {
    const c = attributeByDeclaredSegment("ai", [
      { seg: "Health Plan Operations" },
      { seg: "Hospital & Acute Delivery" },
      { seg: "Loyalty Programme" },
    ], SEGMENTS, (r) => r.seg);

    expect(c.bySegment).toEqual({ health_plan: 1, hospital_delivery: 1, Unattributed: 1 });
    expect(c.unresolved).toEqual(["Loyalty Programme"]);
  });
});

describe("segment spine", () => {
  const contributions = [
    attributeByFunction("apps", [
      { fn: "Nursing Operations" }, { fn: "Nursing Operations" }, { fn: "Nursing Operations" },
      { fn: "Health Plan & Payer Operations" },
    ], MAP, (r) => r.fn),
  ];

  it("puts one row per declared segment, carrying its revenue and owner", () => {
    const report = buildSegmentSpine(SEGMENTS, contributions);
    expect(report.segments.map((s) => s.segmentKey)).toEqual(["health_plan", "hospital_delivery"]);
    expect(report.segments[0]).toMatchObject({ revenueSharePct: 40, pnlOwnerRole: "President, Health Plan" });
  });

  // The point of the whole table: a segment's share of a resource beside its share of revenue.
  it("reports each segment's domain share against its declared revenue share", () => {
    const report = buildSegmentSpine(SEGMENTS, contributions);
    const plan = report.shareVsRevenue.find((s) => s.segmentKey === "health_plan")!;
    expect(plan.shares.apps).toEqual({ sharePct: 25, gapVsRevenue: -15 });
    const hospital = report.shareVsRevenue.find((s) => s.segmentKey === "hospital_delivery")!;
    expect(hospital.shares.apps).toEqual({ sharePct: 75, gapVsRevenue: 15 });
  });

  it("excludes unattributed records from the share denominator and reports them separately", () => {
    const withGap = [attributeByFunction("apps", [
      { fn: "Nursing Operations" }, { fn: "Unknown Function" },
    ], MAP, (r) => r.fn)];
    const report = buildSegmentSpine(SEGMENTS, withGap);

    expect(report.unattributed.apps).toBe(1);
    expect(report.shareVsRevenue.find((s) => s.segmentKey === "hospital_delivery")!.shares.apps.sharePct).toBe(100);
    expect(report.unresolvedByDomain.apps).toEqual(["Unknown Function"]);
  });
});
