// Size-RANGE + narrative-spine enforcement — the correction to "just add a
// hard word cap": a concise artifact type blocks on the ceiling, a
// substantial one only warns, and narrative-spine gaps are advisory (the
// signal is fuzzy heuristic text-matching, not a structural fact).

import { validateDeliverableQuality } from "../quality-validator";
import { resolveQualityBar } from "../quality-bar-registry";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";

function longBody(words: number): string {
  return Array.from({ length: words }, (_, i) => `word${i}`).join(" ");
}

describe("quality validator — size range (ceiling)", () => {
  it("blocks export when enforceMaxAsBlocker is true and the ceiling is crossed", () => {
    const req = amsRfpRequest({
      qualityBar: {
        ...amsRfpRequest().qualityBar,
        minBodyWords: 50,
        targetBodyWordsMax: 100,
        enforceMaxAsBlocker: true,
      },
    });
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown = longBody(500);
    const res = validateDeliverableQuality(doc, req);
    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/too long/i);
  });

  it("only warns (does not block) when enforceMaxAsBlocker is false", () => {
    const req = amsRfpRequest({
      qualityBar: {
        ...amsRfpRequest().qualityBar,
        minBodyWords: 50,
        targetBodyWordsMax: 100,
        enforceMaxAsBlocker: false,
      },
    });
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown = longBody(500);
    const res = validateDeliverableQuality(doc, req);
    expect(res.blockers.join(" ")).not.toMatch(/too long/i);
    expect(res.warnings.join(" ")).toMatch(/too long/i);
  });

  it("does not warn or block when under the ceiling", () => {
    const req = amsRfpRequest({
      qualityBar: {
        ...amsRfpRequest().qualityBar,
        minBodyWords: 10,
        targetBodyWordsMax: 10_000,
        enforceMaxAsBlocker: true,
      },
    });
    const res = validateDeliverableQuality(goodDocument(), req);
    expect(res.blockers.join(" ")).not.toMatch(/too long/i);
    expect(res.warnings.join(" ")).not.toMatch(/too long/i);
  });

  it("has no ceiling behavior at all when targetBodyWordsMax is unset (today's untouched artifact types)", () => {
    const req = amsRfpRequest(); // fixture's own qualityBar has no targetBodyWordsMax
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown = longBody(50_000);
    const res = validateDeliverableQuality(doc, req);
    expect(res.blockers.join(" ")).not.toMatch(/too long/i);
    expect(res.warnings.join(" ")).not.toMatch(/too long/i);
  });

  it.each([
    ["business_case", 12_000],
    // roadmap's advisory band now extends to 12,700 words (2026-07-25
    // reconciliation) — use a count that exceeds that, not just the old
    // 11,000 target ceiling, to still exercise the true block.
    ["roadmap", 13_000],
    ["handoff_pack", 12_000],
    ["value_measurement_contract", 5_000],
  ] as const)(
    "blocks oversized Moves %s artifacts instead of treating them as board-ready",
    (deliverableType, words) => {
      const req = amsRfpRequest({
        module: "moves",
        deliverableType,
        qualityBar: {
          ...amsRfpRequest().qualityBar,
          ...resolveQualityBar("moves", deliverableType),
          minBodyWords: 0,
          requiresSourceRegister: false,
        },
      });
      const doc = goodDocument();
      doc.sourceRegister = [];
      doc.generatedSections[0].bodyMarkdown = longBody(words);

      const res = validateDeliverableQuality(doc, req);

      expect(res.pass).toBe(false);
      expect(res.blockers.join(" ")).toMatch(/too long/i);
      expect(res.warnings.join(" ")).not.toMatch(/too long/i);
    },
  );
});

describe("quality validator — narrative spine (advisory)", () => {
  it("warns when requiresCentralTension is set but no tension language is present", () => {
    const req = amsRfpRequest({
      qualityBar: {
        ...amsRfpRequest().qualityBar,
        requiresCentralTension: true,
        requiresSourceRegister: false,
        minBodyWords: 0,
      },
    });
    const doc = goodDocument();
    doc.sourceRegister = [];
    doc.generatedSections.forEach(
      (s) => (s.bodyMarkdown = "Neutral status update with no framing."),
    );
    const res = validateDeliverableQuality(doc, req);
    expect(res.pass).toBe(true); // advisory only — never blocks
    expect(res.warnings.join(" ")).toMatch(/central tension/i);
  });

  it("does not warn when central-tension language is present", () => {
    const req = amsRfpRequest({
      qualityBar: {
        ...amsRfpRequest().qualityBar,
        requiresCentralTension: true,
      },
    });
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown =
      "This section frames why now: the core tension is escalating run-cost leakage against a shrinking window to act.";
    const res = validateDeliverableQuality(doc, req);
    expect(res.warnings.join(" ")).not.toMatch(/central tension/i);
  });

  it("warns when requiresOptionsConsidered is set but no options framing is present", () => {
    const req = amsRfpRequest({
      qualityBar: {
        ...amsRfpRequest().qualityBar,
        requiresOptionsConsidered: true,
      },
    });
    const res = validateDeliverableQuality(goodDocument(), req);
    expect(res.warnings.join(" ")).toMatch(/options-considered/i);
  });

  it("warns when requiresEvidenceGapsNoted is set but nothing is marked missing/assumed/client-to-complete", () => {
    const req = amsRfpRequest({
      qualityBar: {
        ...amsRfpRequest().qualityBar,
        requiresEvidenceGapsNoted: true,
        minBodyWords: 0,
      },
    });
    const doc = goodDocument();
    doc.clientCompleteChecklist = [];
    doc.generatedSections.forEach(
      (s) => (s.bodyMarkdown = "Fully confirmed content with no open items."),
    );
    const res = validateDeliverableQuality(doc, req);
    expect(res.warnings.join(" ")).toMatch(/evidence gaps/i);
  });

  it("never blocks export on missing narrative-spine signals, only warns", () => {
    const req = amsRfpRequest({
      qualityBar: {
        ...amsRfpRequest().qualityBar,
        requiresCentralTension: true,
        requiresOptionsConsidered: true,
        requiresEvidenceGapsNoted: true,
        requiresClientCompleteChecklistWhenGaps: false,
        requiresSourceRegister: false,
        minBodyWords: 0,
      },
    });
    const doc = goodDocument();
    doc.clientCompleteChecklist = [];
    doc.sourceRegister = [];
    doc.generatedSections.forEach(
      (s) => (s.bodyMarkdown = "Plain content, no spine, no gaps noted."),
    );
    const res = validateDeliverableQuality(doc, req);
    expect(res.pass).toBe(true);
  });

  describe("advisoryBandMax — the band between target ceiling and the true block", () => {
    function bandedReq() {
      return amsRfpRequest({
        qualityBar: {
          ...amsRfpRequest().qualityBar,
          minBodyWords: 50,
          targetBodyWordsMax: 1_300,
          advisoryBandMax: 1_500,
          enforceMaxAsBlocker: true,
        },
      });
    }

    function bodyWordCount(doc: ReturnType<typeof goodDocument>): number {
      return doc.generatedSections
        .map((s) => `${s.title}\n${s.bodyMarkdown}`)
        .join("\n\n")
        .trim()
        .split(/\s+/).length;
    }

    /** Pads the fixture's already-valid document (citations, decision
     * language, etc. intact) with period-terminated filler up to `words`
     * total, instead of replacing content — replacing loses the citations/
     * decision-section signals other blockers depend on. */
    function docWithWordCount(words: number) {
      const doc = goodDocument();
      const currentWords = bodyWordCount(doc);
      const padWords = Math.max(0, words - currentWords);
      const last = doc.generatedSections[doc.generatedSections.length - 1];
      last.bodyMarkdown = `${last.bodyMarkdown}\n\n${longBody(padWords)}.`;
      return doc;
    }

    it("passes cleanly at/under the target ceiling", () => {
      const res = validateDeliverableQuality(
        docWithWordCount(1_200),
        bandedReq(),
      );
      expect(res.pass).toBe(true);
      expect(res.warnings.join(" ")).not.toMatch(/advisory/i);
      expect(res.metrics.wordBand).toBe("pass");
    });

    it("does not block between the target ceiling and advisoryBandMax — advisory only", () => {
      const res = validateDeliverableQuality(
        docWithWordCount(1_450),
        bandedReq(),
      );
      expect(res.pass).toBe(true);
      expect(res.blockers.join(" ")).not.toMatch(/too long/i);
      expect(res.warnings.join(" ")).toMatch(/advisory/i);
      expect(res.metrics.wordBand).toBe("advisory");
      expect(res.metrics.manualEditNeeded).toBe(true);
    });

    it("blocks once bodyWordCount crosses advisoryBandMax", () => {
      const res = validateDeliverableQuality(
        docWithWordCount(1_600),
        bandedReq(),
      );
      expect(res.pass).toBe(false);
      expect(res.blockers.join(" ")).toMatch(/too long/i);
      expect(res.metrics.wordBand).toBe("excessive");
    });
  });

  describe("metrics — readingTimeMinutes and wordBand always populate", () => {
    it("computes readingTimeMinutes at ~200 words/minute, floor of 1", () => {
      const req = amsRfpRequest();
      const res = validateDeliverableQuality(goodDocument(), req);
      expect(res.metrics.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    });

    it("reports wordBand 'n/a' for artifact types with no targetBodyWordsMax", () => {
      const req = amsRfpRequest(); // fixture qualityBar has no targetBodyWordsMax
      const res = validateDeliverableQuality(goodDocument(), req);
      expect(res.metrics.wordBand).toBe("n/a");
    });

    it("reports wordBand 'under' when below minBodyWords", () => {
      const req = amsRfpRequest({
        qualityBar: { ...amsRfpRequest().qualityBar, minBodyWords: 100_000 },
      });
      const res = validateDeliverableQuality(goodDocument(), req);
      expect(res.metrics.wordBand).toBe("under");
    });
  });
});
