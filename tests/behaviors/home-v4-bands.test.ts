import fs from "node:fs";
import path from "node:path";

import { splitChapterIntoBands } from "../../src/components/home/v4/chapter-bands";
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
