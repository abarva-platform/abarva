import fs from "node:fs";
import path from "node:path";

import { splitChapterIntoBands } from "../../src/components/home/v4/chapter-bands";
import { buildTileLayout } from "../../src/components/home/v4/architecture-tiles";
import type { ChapterView, EnterpriseSignalPacket, GroundedClaim, HomeReviewBundle } from "../../src/lib/home/preview/types";

/**
 * Home v4 routes every claim into one of four bands, and the band a claim lands in IS the statement
 * of its epistemic status -- there are no per-claim confidence labels to fall back on. A routing
 * bug therefore does not look like a bug: it looks like Abarva asserting an inference as a counted
 * fact, or burying a high-severity exposure among interpretations. These tests pin the routing.
 */

const SNAPSHOT_DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");

function claim(statement: string, claim_type: GroundedClaim["claim_type"], evidence_ids: string[] = []): GroundedClaim {
  return { statement, claim_type, confidence: "medium", evidence_ids };
}

function packet(signals: Array<{ id: string; domains: string[] }>): EnterpriseSignalPacket {
  return {
    signals: signals.map((s) => ({ id: s.id, kind: "risk", statement: s.id, domains: s.domains, evidenceRefs: [] })),
    contextItems: [],
  } as unknown as EnterpriseSignalPacket;
}

function chapter(over: Partial<ChapterView>): ChapterView {
  return {
    chapterId: "executive_brief",
    title: "Executive Brief",
    guidingQuestion: "?",
    headline: "h",
    executive_synthesis: "s",
    key_insights: [],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    visual_opportunities: [],
    limitations: [],
    ...over,
  } as ChapterView;
}

describe("v4 band routing", () => {
  it("separates counted facts from interpretations, because the band is the only thing saying which is which", () => {
    const bands = splitChapterIntoBands(
      chapter({
        key_insights: [
          claim("Epic holds 17.4% of third-party spend.", "FACT"),
          claim("127 of 996 responses contradict the record.", "OBSERVATION"),
          claim("Star Ratings therefore act as a revenue lever.", "CROSS_DOMAIN_INSIGHT"),
          claim("Board figures should be marked provisional.", "ADVISORY_INFERENCE"),
        ],
      }),
      packet([]),
    );
    expect(bands.record.map((c) => c.claim_type)).toEqual(["FACT", "OBSERVATION"]);
    expect(bands.follows.map((c) => c.claim_type)).toEqual(["CROSS_DOMAIN_INSIGHT", "ADVISORY_INFERENCE"]);
  });

  it("routes a tension to exposures only when its evidence comes from the risk register", () => {
    const bands = splitChapterIntoBands(
      chapter({
        tensions: [claim("PHI is exposed on an unencrypted interface.", "OBSERVATION", ["sig_risk"])],
        what_to_watch: [claim("Interface sprawl is growing.", "CROSS_DOMAIN_INSIGHT", ["sig_apps"])],
      }),
      packet([
        { id: "sig_risk", domains: ["risk_or_control", "application_system"] },
        { id: "sig_apps", domains: ["application_system"] },
      ]),
    );
    expect(bands.exposures.map((c) => c.statement)).toEqual(["PHI is exposed on an unencrypted interface."]);
    expect(bands.follows.map((c) => c.statement)).toEqual(["Interface sprawl is growing."]);
  });

  it("never places the same claim in two bands", () => {
    const risky = claim("Corepoint carries PHI unencrypted.", "OBSERVATION", ["sig_risk"]);
    const bands = splitChapterIntoBands(
      chapter({ tensions: [risky], what_to_watch: [risky] }),
      packet([{ id: "sig_risk", domains: ["risk_or_control"] }]),
    );
    const everywhere = [...bands.record, ...bands.follows, ...bands.exposures];
    // Duplicated across two source arrays, it may appear twice -- but never once in exposures and
    // once in follows, which would show the same sentence as both a severity finding and an
    // interpretation on the same page.
    expect(bands.follows.some((c) => c.statement === risky.statement)).toBe(false);
    expect(everywhere.filter((c) => c.statement === risky.statement).length).toBeGreaterThan(0);
  });

  it("reports how many bands carry content, so a thin chapter is a known shape and not a surprise", () => {
    const empty = splitChapterIntoBands(chapter({}), packet([]));
    expect(empty.filledBandCount).toBe(0);
    const oneBand = splitChapterIntoBands(chapter({ key_insights: [claim("A counted thing.", "FACT")] }), packet([]));
    expect(oneBand.filledBandCount).toBe(1);
  });
});

describe("v4 band routing against the real golden snapshots", () => {
  const bundles = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), "utf8")) as HomeReviewBundle] as const);

  it("has snapshots to check", () => {
    expect(bundles.length).toBeGreaterThan(0);
  });

  it.each(bundles)("routes every claim in %s into exactly one band", (_tenant, bundle) => {
    for (const ch of bundle.chapters) {
      const bands = splitChapterIntoBands(ch, bundle.thesis.signalPacket);
      const routed = bands.record.length + bands.follows.length + bands.exposures.length;
      const total = ch.key_insights.length + ch.tensions.length + ch.what_to_watch.length;
      // Every claim the chapter holds reaches a band. A claim that reached none would vanish from
      // the page with nothing to indicate it existed.
      expect(routed).toBe(total);
    }
  });

  it.each(bundles)("gives %s at least one chapter with a gap band and at least one without", (_tenant, bundle) => {
    // Both states are real in this corpus. If either disappeared, the band's absent state would be
    // untested against real data and would first be exercised in front of a reader.
    const withGaps = bundle.chapters.filter((c) => c.limitations.length > 0).length;
    expect(withGaps).toBeGreaterThan(0);
    expect(withGaps).toBeLessThan(bundle.chapters.length);
  });
});

describe("v4 architecture tile weighting", () => {
  function view(fns: Array<[string, number]>) {
    return {
      nodes: fns.map(([label, systems]) => ({
        id: `cap-${label}`,
        label,
        semanticRole: "business_capability",
        layer: "business_capability",
        evidenceBasis: "ABARVA_DERIVED",
        evidenceIds: [],
        metrics: { systems },
        aggregation: { groupByField: "business_function", groupByValue: label, memberNodeIds: [], memberCount: systems, basis: "CANONICAL_FIELD" },
      })),
      edges: [],
      groups: [],
      boundaries: [],
      overlays: [],
      limitations: [],
    } as never;
  }

  it("makes tile AREA track share across the whole figure, not just within a row", () => {
    // The failure this guards against shipped once: widths were row-relative and row heights came
    // from a clamped curve, so a 15.3% function rendered a LARGER tile than an 18.6% one. A
    // weighted landscape whose weights invert the ranking answers confidently and wrong.
    const layout = buildTileLayout(
      view([
        ["Clinical Informatics", 99],
        ["Acute Care", 56],
        ["Nursing", 46],
        ["Population Health", 15],
        ["Ambulatory", 13],
      ]),
    );

    const CANVAS_W = 1300;
    const MIN_ROW_HEIGHT_PX = 104;
    const measured = layout.rows.flatMap((row) =>
      row.items.map((tile) => ({
        label: tile.label,
        sharePct: tile.sharePct,
        areaPerShare: ((tile.widthPct / 100) * CANVAS_W * row.height) / tile.sharePct,
        floored: row.height === MIN_ROW_HEIGHT_PX,
      })),
    );

    // Rows tall enough to size freely are exactly proportional to one another.
    const free = measured.filter((m) => !m.floored);
    expect(free.length).toBeGreaterThan(1);
    for (const m of free) expect(m.areaPerShare / free[0].areaPerShare).toBeCloseTo(1, 1);

    // Widths are derived from target area, so even a floored row stays proportional -- a tile
    // alone on a short row must not stretch across the canvas and read as twice its weight.
    for (const m of measured) expect(m.areaPerShare / free[0].areaPerShare).toBeCloseTo(1, 1);

    // Whatever the row packing, the largest function must never render smaller than a smaller one.
    const byShare = [...measured].sort((a, b) => b.sharePct - a.sharePct);
    const areaOf = (m: (typeof measured)[number]) => m.areaPerShare * m.sharePct;
    expect(areaOf(byShare[0])).toBeGreaterThan(areaOf(byShare[1]));
    expect(areaOf(byShare[1])).toBeGreaterThan(areaOf(byShare[2]));
  });

  it("does not stretch a lone small tile across a trailing row", () => {
    // One tenant's estate is one dominant function plus a long tail. The small drawable function
    // lands alone on a trailing row; stretching it to fill that row rendered it at twice its
    // proportional area.
    const layout = buildTileLayout(view([["Airport & Ground Operations", 217], ["Data, Analytics & AI", 26]]));
    const all = layout.rows.flatMap((r) => r.items.map((t) => ({ t, h: r.height })));
    const perShare = all.map(({ t, h }) => ((t.widthPct / 100) * 1300 * h) / t.sharePct);
    expect(perShare[1] / perShare[0]).toBeCloseTo(1, 1);
    const lone = all.find((x) => x.t.label === "Data, Analytics & AI")!;
    expect(lone.t.widthPct).toBeLessThan(100);
  });

  it("never renders a tile too small to hold its label -- it moves to the tail, still named and counted", () => {
    const layout = buildTileLayout(
      view([
        ["Big", 200],
        ["Tiny A", 3],
        ["Tiny B", 2],
      ]),
    );
    const drawn = layout.rows.flatMap((r) => r.items).map((t) => t.label);
    expect(drawn).toContain("Big");
    expect(drawn).not.toContain("Tiny A");
    // Dropped from the tiles, but not dropped from the page.
    expect(layout.tail?.items.map((t) => t.label)).toEqual(["Tiny A", "Tiny B"]);
    expect(layout.tail?.systems).toBe(5);
  });
});
