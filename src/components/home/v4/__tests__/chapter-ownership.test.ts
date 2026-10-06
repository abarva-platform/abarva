/**
 * Each family is described in one chapter, and argued from wherever it is relevant.
 *
 * Two pairs of chapters were rendering identical table sets: the five commercial tables appeared
 * whole under both "what bets are we making" and "can we prove the value", and the four platform
 * tables under both "how does work get done" and "what deserves attention". A reader who scrolls
 * from one to the other meets the same grid and concludes the page has not decided what either
 * chapter is for.
 *
 * The distinction the fix rests on was already written in this module: a finding is an argument, a
 * table is a description, and they do not have to come from the same family.
 */
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { chapterDepth, type EstateRecordTypes } from "../chapter-page-content";
import type { ChapterId } from "@/lib/home/preview/types";
import type { EstateRow } from "../page-tables";

const CHAPTERS: ChapterId[] = [
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "what_needs_attention",
];

const bundle = getHomeReviewBundle("meridian-health")!;
const recordTypes = (
  bundle as unknown as {
    technologyEstate: {
      recordTypes: Array<{ objectType: string; rows: EstateRow[] }>;
    };
  }
).technologyEstate.recordTypes;
const rowsOf = (objectType: string) =>
  recordTypes.find((r) => r.objectType === objectType)?.rows ?? [];

/** The stored copy: four families. The two the chapters below are missing are the point. */
const stored: EstateRecordTypes = {
  applications: rowsOf("application_system"),
  vendors: rowsOf("vendor_contract"),
  infrastructure: rowsOf("infrastructure_platform"),
  data: rowsOf("data_asset_or_integration"),
};

/** Every family present, as the served path provides. */
const served: EstateRecordTypes = {
  ...stored,
  metrics: [
    {
      metricName: "Clean claim rate",
      metricDomain: "Operations",
      targetValue: "97",
      owner: "VP",
    },
  ],
  risks: [
    {
      riskOrControlName: "A",
      riskDomain: "Cyber",
      severity: "high",
      controlStatus: "open",
    },
    {
      riskOrControlName: "B",
      riskDomain: "Ops",
      severity: "low",
      controlStatus: "closed",
    },
  ],
};

describe("no table is described in two chapters", () => {
  it.each(
    [stored, served].map((e, i) => [i === 0 ? "stored" : "served", e] as const),
  )("on the %s record", (_name, estate) => {
    const seen = new Map<string, ChapterId[]>();
    for (const chapter of CHAPTERS) {
      for (const table of chapterDepth(chapter, estate).tables) {
        seen.set(table.caption, [...(seen.get(table.caption) ?? []), chapter]);
      }
    }
    const duplicated = [...seen]
      .filter(([, chapters]) => chapters.length > 1)
      .map(([caption, chapters]) => `${caption}: ${chapters.join(" + ")}`);
    expect(duplicated).toEqual([]);
  });
});

describe("a family still argues where it is relevant", () => {
  it("keeps the commercial exposures arguing in the value chapter", () => {
    // The contract register is described under strategy. A contract that renews without a decision
    // is value leaving, which is this chapter's subject -- so the finding stays and the table goes.
    const depth = chapterDepth("performance_value", stored);
    expect(depth.tables.map((t) => t.caption)).not.toContain(
      "Renewal exposure",
    );
    expect(
      depth.findings.some((f) => /renew without a decision/.test(f.claim)),
    ).toBe(true);
  });

  it("keeps the platform exposures arguing in the attention chapter", () => {
    const depth = chapterDepth("what_needs_attention", stored);
    expect(depth.tables.map((t) => t.caption)).not.toContain(
      "Recovery posture",
    );
    expect(
      depth.findings.some((f) => /recover from backup alone/.test(f.claim)),
    ).toBe(true);
  });

  it("describes each of those families exactly once", () => {
    const describes = (chapter: ChapterId, caption: string) =>
      chapterDepth(chapter, stored).tables.some((t) => t.caption === caption);
    expect(describes("strategy_value_creation", "Renewal exposure")).toBe(true);
    expect(describes("how_we_operate", "Recovery posture")).toBe(true);
  });
});

describe("a chapter whose own family did not arrive says so", () => {
  it("reports the absent family rather than rendering nothing", () => {
    // Rendering nothing reads as a chapter with nothing to say. It is a chapter that was not given
    // its rows, and the difference is the whole subject of this page.
    const depth = chapterDepth("what_needs_attention", stored);
    expect(depth.tables).toHaveLength(0);
    expect(depth.unsupported.map((u) => u.caption)).toContain(
      "Risks & controls",
    );
    expect(depth.unsupported[0].why).toContain("not a gap in the record");
  });

  it("stops reporting it once the family is served", () => {
    const depth = chapterDepth("what_needs_attention", served);
    expect(depth.unsupported.map((u) => u.caption)).not.toContain(
      "Risks & controls",
    );
    expect(depth.tables.length).toBeGreaterThan(0);
  });

  it("names every family a chapter draws on, not just the leading one", () => {
    const depth = chapterDepth("strategy_value_creation", stored);
    expect(depth.unsupported.map((u) => u.caption)).toEqual([
      "Programs & initiatives",
      "AI & automation use cases",
    ]);
  });
});
