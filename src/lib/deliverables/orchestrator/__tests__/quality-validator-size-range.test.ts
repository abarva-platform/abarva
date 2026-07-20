// Size-RANGE + narrative-spine enforcement — the correction to "just add a
// hard word cap": a concise artifact type blocks on the ceiling, a
// substantial one only warns, and narrative-spine gaps are advisory (the
// signal is fuzzy heuristic text-matching, not a structural fact).

import { validateDeliverableQuality } from "../quality-validator";
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
    doc.generatedSections.forEach((s) => (s.bodyMarkdown = "Neutral status update with no framing."));
    const res = validateDeliverableQuality(doc, req);
    expect(res.pass).toBe(true); // advisory only — never blocks
    expect(res.warnings.join(" ")).toMatch(/central tension/i);
  });

  it("does not warn when central-tension language is present", () => {
    const req = amsRfpRequest({
      qualityBar: { ...amsRfpRequest().qualityBar, requiresCentralTension: true },
    });
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown =
      "This section frames why now: the core tension is escalating run-cost leakage against a shrinking window to act.";
    const res = validateDeliverableQuality(doc, req);
    expect(res.warnings.join(" ")).not.toMatch(/central tension/i);
  });

  it("warns when requiresOptionsConsidered is set but no options framing is present", () => {
    const req = amsRfpRequest({
      qualityBar: { ...amsRfpRequest().qualityBar, requiresOptionsConsidered: true },
    });
    const res = validateDeliverableQuality(goodDocument(), req);
    expect(res.warnings.join(" ")).toMatch(/options-considered/i);
  });

  it("warns when requiresEvidenceGapsNoted is set but nothing is marked missing/assumed/client-to-complete", () => {
    const req = amsRfpRequest({
      qualityBar: { ...amsRfpRequest().qualityBar, requiresEvidenceGapsNoted: true, minBodyWords: 0 },
    });
    const doc = goodDocument();
    doc.clientCompleteChecklist = [];
    doc.generatedSections.forEach((s) => (s.bodyMarkdown = "Fully confirmed content with no open items."));
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
    doc.generatedSections.forEach((s) => (s.bodyMarkdown = "Plain content, no spine, no gaps noted."));
    const res = validateDeliverableQuality(doc, req);
    expect(res.pass).toBe(true);
  });
});
