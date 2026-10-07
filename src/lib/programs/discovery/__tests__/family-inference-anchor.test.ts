import {
  familyMatchAnchor,
  inferenceReachReport,
  isAnchoredFamilyMatch,
} from "../family-inference-anchor";

describe("familyMatchAnchor", () => {
  it("anchors on the family's own id-or-label phrase", () => {
    expect(
      familyMatchAnchor({ matchedAuthoredKeywords: [], phraseMatched: true }),
    ).toBe("phrase");
  });

  it("anchors on a multi-word authored keyword", () => {
    expect(
      familyMatchAnchor({
        matchedAuthoredKeywords: ["model risk"],
        phraseMatched: false,
      }),
    ).toBe("multi_word_keyword");
  });

  it("anchors on two distinct authored keywords", () => {
    expect(
      familyMatchAnchor({
        matchedAuthoredKeywords: ["finance", "baseline"],
        phraseMatched: false,
      }),
    ).toBe("corroborated_keywords");
  });

  it("refuses a single generic single-word keyword", () => {
    expect(
      familyMatchAnchor({
        matchedAuthoredKeywords: ["owner"],
        phraseMatched: false,
      }),
    ).toBeNull();
    expect(
      isAnchoredFamilyMatch({
        matchedAuthoredKeywords: ["owner"],
        phraseMatched: false,
      }),
    ).toBe(false);
  });

  it("refuses a match with no keyword and no phrase, as an evidence-type affinity alone is", () => {
    expect(
      familyMatchAnchor({ matchedAuthoredKeywords: [], phraseMatched: false }),
    ).toBeNull();
  });

  it("counts the same keyword listed twice as one, not as corroboration", () => {
    expect(
      familyMatchAnchor({
        matchedAuthoredKeywords: ["owner", " Owner ", "owner"],
        phraseMatched: false,
      }),
    ).toBeNull();
  });

  it("ignores an empty authored keyword", () => {
    expect(
      familyMatchAnchor({
        matchedAuthoredKeywords: ["owner", "  "],
        phraseMatched: false,
      }),
    ).toBeNull();
  });
});

describe("inferenceReachReport", () => {
  const families = [
    { id: "keyworded_one", required: true },
    { id: "phrase_only_one", required: true },
    { id: "phrase_only_two", required: true },
    { id: "optional_phrase_only", required: false },
  ];

  it("splits the required families by whether a keyword list was authored", () => {
    const report = inferenceReachReport(
      families,
      new Set(["keyworded_one", "optional_phrase_only"]),
    );
    expect(report.keywordedRequiredFamilyIds).toEqual(["keyworded_one"]);
    expect(report.phraseOnlyRequiredFamilyIds).toEqual([
      "phrase_only_one",
      "phrase_only_two",
    ]);
  });

  it("reports a mix as the biased shape", () => {
    expect(
      inferenceReachReport(families, new Set(["keyworded_one"])).mixed,
    ).toBe(true);
  });

  it("does not call an all-phrase-only blueprint mixed: every family competes alike", () => {
    const report = inferenceReachReport(families, new Set());
    expect(report.keywordedRequiredFamilyIds).toEqual([]);
    expect(report.mixed).toBe(false);
  });

  it("does not call an all-keyworded blueprint mixed", () => {
    const report = inferenceReachReport(
      families,
      new Set(["keyworded_one", "phrase_only_one", "phrase_only_two"]),
    );
    expect(report.phraseOnlyRequiredFamilyIds).toEqual([]);
    expect(report.mixed).toBe(false);
  });
});
