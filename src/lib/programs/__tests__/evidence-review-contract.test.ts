import {
  initialReviewedEvidenceExtraction,
  normalizeReviewedEvidenceExtraction,
  reviewedExtractionFromStoredSourceRef,
  toStoredReviewedStructured,
} from "../evidence-review-contract";

describe("human-reviewed evidence snapshot", () => {
  it("prepares parsed fields for review and keeps the original summary bounded", () => {
    const extraction = initialReviewedEvidenceExtraction({
      summary: "Parser summary",
      extractedText: "Source text",
      extractedStructured: {
        parse_method: "office-parser",
        decisions: ["Decision A"],
        baseline_candidates: ["Baseline A"],
        flexible: {
          observations: ["Observation A"],
          citations: [{ quote: "Baseline A", locator: "page 3" }],
        },
      },
    });

    expect(extraction.summary).toBe("Parser summary");
    expect(extraction.structured.decisions).toEqual(["Decision A"]);
    expect(extraction.structured.baselineCandidates).toEqual(["Baseline A"]);
    expect(extraction.structured.citations).toEqual([
      { quote: "Baseline A", locator: "page 3" },
    ]);
  });

  it("rejects malformed reviewer input rather than promoting it", () => {
    expect(
      normalizeReviewedEvidenceExtraction({
        version: 1,
        summary: "Reviewed",
        structured: { decisions: "not a list" },
      }),
    ).toBeNull();
  });

  it("stores the corrected values alongside parser metadata and reads them from review provenance", () => {
    const reviewed = normalizeReviewedEvidenceExtraction({
      version: 1,
      summary: "Corrected summary",
      structured: {
        decisions: ["Confirmed decision"],
        risks: [],
        baselineCandidates: ["Corrected baseline"],
        actionItems: [],
        observations: [],
        assumptions: [],
        openQuestions: [],
        citations: [{ quote: "Corrected baseline", locator: "page 8" }],
      },
    });
    expect(reviewed).not.toBeNull();
    const stored = toStoredReviewedStructured(reviewed!, {
      parse_method: "office-parser",
      warnings: ["low text density"],
    });
    expect(stored).toMatchObject({
      parse_method: "office-parser",
      warnings: ["low text density"],
      baseline_candidates: ["Corrected baseline"],
      flexible: {
        citations: [{ quote: "Corrected baseline", locator: "page 8" }],
      },
    });
    expect(
      reviewedExtractionFromStoredSourceRef({ reviewed_extraction: reviewed }),
    ).toEqual(reviewed);
  });
});
