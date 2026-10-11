import fs from "node:fs";
import path from "node:path";
import type {
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";
import {
  canvasBusiness,
  canvasEstate,
  canvasHref,
  canvasMetrics,
  canvasViews,
  declaredRevenueSplit,
  formatCanvasNumber,
  narrativeIsCurrent,
  recordCount,
  resolveCanvasLocation,
} from "../canvas-model";

function bundle(): HomeReviewBundle {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/home/preview/golden-snapshots/meridian-health.json",
      ),
      "utf8",
    ),
  );
}
const reviewed: HomeRecordRenderSource = {
  kind: "reviewed_snapshot",
  canonicalSnapshotHash: "reviewed-version",
};
const unverified: HomeRecordRenderSource = {
  kind: "ecl_serving_projection",
  canonicalSnapshotHash: "served-version",
};

describe("opt-in Home canvas record contract", () => {
  it("offers every chapter, evidence family and context view", () => {
    const record = bundle();
    const views = canvasViews(record);
    expect(views).toHaveLength(
      12 + record.technologyEstate!.recordTypes.length,
    );
    for (const chapter of record.chapters)
      expect(views).toContain(chapter.chapterId);
    for (const family of record.technologyEstate!.recordTypes)
      expect(views).toContain(`tech:${family.objectType}`);
  });
  it("routes by query rather than page anchors and retains source selection", () => {
    const href = canvasHref(
      new URLSearchParams(
        "tenant=bound-tenant&provider=ecl&view=our_business&q=stale",
      ),
      "technology_data",
      "evidence",
    );
    const url = new URL(href, "https://example.invalid");
    expect(url.pathname).toBe("/home/canvas");
    expect(url.searchParams.get("tenant")).toBe("bound-tenant");
    expect(url.searchParams.get("provider")).toBe("ecl");
    expect(url.searchParams.get("view")).toBe("technology_data");
    expect(url.searchParams.get("panel")).toBe("evidence");
    expect(url.searchParams.has("q")).toBe(false);
    expect(url.hash).toBe("");
  });
  it("preserves an explicit finding query safely", () => {
    const href = canvasHref(
      new URLSearchParams(),
      "tech:vendor_contract",
      "overview",
      "A&B / annual",
    );
    expect(new URL(href, "https://example.invalid").searchParams.get("q")).toBe(
      "A&B / annual",
    );
  });
  it("refuses arbitrary or unavailable family destinations", () => {
    expect(
      resolveCanvasLocation(
        new URLSearchParams("view=tech:not_served&panel=unknown"),
        bundle(),
      ),
    ).toEqual({ view: "executive_brief", panel: "overview" });
  });
  it("adds newly supplied canonical families without a presentation allowlist", () => {
    const record = bundle();
    record.technologyEstate!.recordTypes.push({
      objectType: "program_initiative",
      label: "Programs",
      columns: ["name"],
      rows: [{ name: "Recorded program" }],
      primaryDimension: "name",
      dimensionCounts: [{ value: "Recorded program", count: 1 }],
    });
    expect(canvasViews(record)).toContain("tech:program_initiative");
    expect(
      resolveCanvasLocation(
        new URLSearchParams("view=tech:program_initiative&panel=evidence"),
        record,
      ),
    ).toEqual({ view: "tech:program_initiative", panel: "evidence" });
    expect(recordCount(record, "program_initiative")).toBe(1);
  });
  it("takes counts and estate rows from the same actual family arrays", () => {
    const record = bundle();
    const vendors = record.technologyEstate!.recordTypes.find(
      (family) => family.objectType === "vendor_contract",
    )!;
    vendors.rows = vendors.rows.slice(0, 3);
    expect(recordCount(record, "vendor_contract")).toBe(3);
    expect(canvasEstate(record).vendors).toBe(vendors.rows);
    expect(
      canvasMetrics("strategy_value_creation", record, reviewed).find(
        (metric) => metric.objectType === "vendor_contract",
      )?.value,
    ).toBe("3");
  });
  it("keeps absent and recorded zero separate", () => {
    const record = bundle();
    expect(recordCount(record, "program_initiative")).toBeNull();
    record.technologyEstate!.recordTypes[0].rows = [];
    expect(
      recordCount(record, record.technologyEstate!.recordTypes[0].objectType),
    ).toBe(0);
    expect(formatCanvasNumber(null)).toBe("Not recorded");
    expect(formatCanvasNumber(0)).toBe("0");
  });
  it("does not promote reviewed identity, priorities or economics into unverified live facts", () => {
    const business = canvasBusiness(bundle(), unverified);
    expect(business.revenue).toBeNull();
    expect(business.employees).toBeNull();
    expect(business.businessModel).toBe("");
    expect(business.priorities).toEqual([]);
    expect(business.revenueMix).toEqual([]);
    expect(narrativeIsCurrent(unverified)).toBe(false);
  });
  it("still offers a visibly reviewed fallback rather than dropping its content", () => {
    const source = { ...reviewed, kind: "reviewed_snapshot_fallback" as const };
    expect(narrativeIsCurrent(source)).toBe(true);
    expect(canvasBusiness(bundle(), source).priorities.length).toBeGreaterThan(
      0,
    );
  });
  it("plots only a complete declared revenue split with evidence", () => {
    expect(
      declaredRevenueSplit(
        "Revenue splits 65% delivery / 35% plan; other description.",
        ["source-ref"],
      ),
    ).toEqual([
      { label: "delivery", share: 65, sourceRefs: ["source-ref"] },
      { label: "plan", share: 35, sourceRefs: ["source-ref"] },
    ]);
    expect(
      declaredRevenueSplit("Revenue splits 65% delivery / 35% plan.", []),
    ).toEqual([]);
    expect(
      declaredRevenueSplit("Revenue splits 65% delivery / 30% plan.", [
        "source-ref",
      ]),
    ).toEqual([]);
    expect(
      declaredRevenueSplit("About half our revenue may be delivery.", [
        "source-ref",
      ]),
    ).toEqual([]);
  });
  it("uses the declared business split without deriving precise segment dollars", () => {
    const business = canvasBusiness(bundle(), reviewed);
    expect(business.revenueMix.map((segment) => segment.share)).toEqual([
      60, 40,
    ]);
    expect(
      business.revenueMix.every((segment) => segment.sourceRefs.length > 0),
    ).toBe(true);
    expect(business.revenueMix[0]).not.toHaveProperty("revenueUsd");
  });
  it("scopes executive execution metrics to the aligned exhibit, not the whole portfolio", () => {
    const record = bundle();
    record.thesis.signalPacket.visualDatasets.stalled_programs = [
      { program: "First", pctComplete: 3 },
      { program: "Second", pctComplete: 15 },
    ];
    const metrics = canvasMetrics("executive_brief", record, reviewed);
    expect(
      metrics.find((metric) => metric.label === "Programs in execution exhibit")
        ?.value,
    ).toBe("2");
    expect(
      metrics.find((metric) => metric.label === "Below 10% complete")?.value,
    ).toBe("1 / 2");
    expect(
      canvasMetrics("executive_brief", record, unverified).find(
        (metric) => metric.label === "Below 10% complete",
      )?.value,
    ).toBe("Not recorded");
  });
  it("keeps financial and control labels honest", () => {
    const metrics = canvasMetrics("what_needs_attention", bundle(), reviewed);
    expect(metrics.every((metric) => metric.basis)).toBe(true);
    expect(metrics.some((metric) => metric.label === "Uncontrolled")).toBe(
      false,
    );
  });
});
