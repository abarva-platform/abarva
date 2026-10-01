// The slide face carries whole claims or none.
//
// Each case here is one of the shapes a real generated deck produced: a
// finding cut at a word cap, a paragraph label promoted to a headline. The
// negatives pin what must NOT be touched, because a stripper that eats a real
// sentence is a worse defect than the one it fixes.

import {
  MAX_BULLET_WORDS,
  MAX_GOVERNING_WORDS,
  fitWholeClaim,
  governingFontSize,
  sectionSlideText,
  stripScaffoldingLabel,
  stripStructuralScaffolding,
} from "../slide-text";

function words(n: number, stem = "word"): string {
  return Array.from({ length: n }, (_, i) => `${stem}${i}`).join(" ");
}

describe("fitWholeClaim", () => {
  it("returns a claim within the cap unchanged", () => {
    const claim =
      "The baseline is definition-incomplete and cannot be certified.";
    expect(fitWholeClaim(claim, 12)).toBe(claim);
  });

  it("never appends an ellipsis, at any cap", () => {
    const claim = `${words(60)}.`;
    for (const cap of [1, 5, 12, 18, 34, 59, 60, 100]) {
      const fitted = fitWholeClaim(claim, cap);
      if (fitted !== null) {
        expect(fitted).not.toMatch(/(?:\.{3}|…)$/);
        expect(fitted).toBe(claim);
      }
    }
  });

  it("returns null rather than a fragment when a long claim has no clause boundary", () => {
    expect(fitWholeClaim(`${words(40)}.`, 12)).toBeNull();
  });

  it("shortens at a semicolon, where what remains is a complete statement", () => {
    const first =
      "Handle time and first-contact resolution must not be blended";
    const claim = `${first}; ${words(40)}.`;
    expect(fitWholeClaim(claim, 12)).toBe(`${first}.`);
  });

  it("keeps as many whole clauses as fit", () => {
    const claim = `Alpha beta gamma delta epsilon; zeta eta theta iota kappa; ${words(40)}.`;
    expect(fitWholeClaim(claim, 12)).toBe(
      "Alpha beta gamma delta epsilon; zeta eta theta iota kappa.",
    );
  });

  it("does not cut at a comma, colon, dash, or parenthesis", () => {
    for (const joiner of [", ", ": ", " — ", " ("]) {
      const claim = `The current baseline for the service${joiner}${words(40)}.`;
      expect(fitWholeClaim(claim, 12)).toBeNull();
    }
  });

  it("refuses a semicolon cut that would leave a fragment", () => {
    expect(fitWholeClaim(`Note this; ${words(40)}.`, 12)).toBeNull();
  });
});

describe("stripScaffoldingLabel", () => {
  it.each([
    [
      "Section verdict. The baseline cannot be certified.",
      "The baseline cannot be certified.",
    ],
    [
      "Section boundary: this covers the service desk only.",
      "This covers the service desk only.",
    ],
    [
      "Governing message — hold the investment decision.",
      "Hold the investment decision.",
    ],
    [
      "Bottom line: hold the investment decision today.",
      "Hold the investment decision today.",
    ],
  ])("strips the label from %j", (input, expected) => {
    expect(stripScaffoldingLabel(input)).toBe(expected);
  });

  it("returns empty when the text is only a label", () => {
    expect(stripScaffoldingLabel("Section verdict.")).toBe("");
    expect(stripScaffoldingLabel("Section boundary.")).toBe("");
  });

  it.each([
    "Section summary tables follow the narrative in the appendix.",
    "The verdict of the review board was to proceed.",
    "Slide decks were not part of the evidence base.",
    "Bottom line: proceed.",
    "In short, the plan holds.",
  ])("leaves the real sentence %j alone", (sentence) => {
    expect(stripScaffoldingLabel(sentence)).toBe(sentence);
  });
});

describe("stripStructuralScaffolding", () => {
  it("removes a bold structural lead-in and keeps the claim", () => {
    expect(
      stripStructuralScaffolding(
        "**Section verdict.** The baseline cannot be certified.",
      ),
    ).toBe("The baseline cannot be certified.");
  });

  it("removes a bare lead-in inside a list item and keeps the marker", () => {
    expect(
      stripStructuralScaffolding("- Section boundary: service desk only."),
    ).toBe("- Service desk only.");
  });

  it("drops a line that is only a label", () => {
    expect(stripStructuralScaffolding("Section verdict.\n\nReal text.")).toBe(
      "\n\nReal text.",
    );
  });

  it("does not touch headings, tables, idiom lead-ins, or ordinary sentences", () => {
    const markdown = [
      "## Section summary",
      "| Section verdict | Owner |",
      "Bottom line: hold the investment decision.",
      "Section summary tables follow the narrative.",
      "The section verdict. That phrase mid-line is not a lead-in.",
    ].join("\n");
    expect(stripStructuralScaffolding(markdown)).toBe(markdown);
  });
});

describe("sectionSlideText", () => {
  it("does not promote a scaffolding label to the governing message", () => {
    const result = sectionSlideText(
      "Section verdict. The baseline is synthetic and cannot support an investment decision. A second point follows here.",
      "Baseline",
    );
    expect(result.governing).toBe(
      "The baseline is synthetic and cannot support an investment decision.",
    );
    expect(result.governingIsTitle).toBe(false);
    expect(result.bullets).toEqual(["A second point follows here."]);
  });

  it("skips a label-only first line and takes the claim after it", () => {
    const result = sectionSlideText(
      "**Section boundary.**\n\nThis section covers the service desk only.",
      "Scope",
    );
    expect(result.governing).toBe("This section covers the service desk only.");
  });

  it("falls back to the title, and holds the claim in full, when the opening claim cannot fit whole", () => {
    const opening = `${words(MAX_GOVERNING_WORDS + 10)}.`;
    const result = sectionSlideText(
      `${opening}\n\n- A short point.`,
      "Dense Section",
    );
    expect(result.governing).toBe("Dense Section");
    expect(result.governingIsTitle).toBe(true);
    expect(result.heldOffFace).toEqual([opening]);
    expect(result.bullets).toEqual(["A short point."]);
  });

  it("holds an over-long bullet off the face in full instead of cutting it", () => {
    const long = `${words(MAX_BULLET_WORDS + 8, "tail")}.`;
    const result = sectionSlideText(
      `Opening claim stands here.\n\n- ${long}\n- A short point.`,
      "Section",
    );
    expect(result.bullets).toEqual(["A short point."]);
    expect(result.heldOffFace).toEqual([long]);
  });

  it("prints every bullet whole: no output ends in an ellipsis", () => {
    // The real defect: all of these exceeded the old 12-word bullet cap and
    // were printed as "<first twelve words>...".
    const points = [
      "The value hypothesis is excluded from scoring because the planning-stage annual value figure has no certified baseline behind it.",
      "Handle time and first-contact resolution are reported on different definitions across the two source extracts and must not be blended.",
      "The evidence base is synthetic, which is recorded as the first risk and limits every quantitative statement in this readout.",
    ];
    const result = sectionSlideText(
      `The readout recommends a bounded design phase.\n\n${points.map((p) => `- ${p}`).join("\n")}`,
      "Findings",
    );
    expect(result.bullets).toEqual(points);
    for (const text of [result.governing, ...result.bullets]) {
      expect(text).not.toMatch(/(?:\.{3}|…)$/);
    }
    expect(result.heldOffFace).toEqual([]);
  });

  it("does not repeat the governing claim as a bullet", () => {
    const result = sectionSlideText(
      "The design keeps approval as the control point.\n\n- The design keeps approval as the control point.\n- Another point.",
      "Design",
    );
    expect(result.bullets).toEqual(["Another point."]);
  });

  it("caps the bullet count", () => {
    const md = `Opening.\n\n${Array.from({ length: 9 }, (_, i) => `- Point number ${i} stands.`).join("\n")}`;
    expect(sectionSlideText(md, "S", 6).bullets).toHaveLength(6);
  });

  it("uses the title when the section has no prose at all", () => {
    const result = sectionSlideText("## Heading only\n| a | b |", "Empty");
    expect(result.governing).toBe("Empty");
    expect(result.bullets).toEqual([]);
    expect(result.heldOffFace).toEqual([]);
  });
});

describe("governingFontSize", () => {
  it("steps down as the headline grows, so it fits without viewer shrink", () => {
    expect(governingFontSize("x".repeat(100))).toBe(22);
    expect(governingFontSize("x".repeat(180))).toBe(20);
    expect(governingFontSize("x".repeat(240))).toBe(18);
  });

  it("the longest admissible headline fits three lines of its box", () => {
    // 11.8in box; Georgia averages ~0.52em per character.
    const longest = `${Array.from({ length: MAX_GOVERNING_WORDS }, () => "seventy").join(" ")}.`;
    const size = governingFontSize(longest);
    const charsPerLine = Math.floor((11.8 * 72) / (size * 0.52));
    const lines = Math.ceil(longest.length / charsPerLine);
    expect((lines * size * 1.2) / 72).toBeLessThanOrEqual(1.1 + 0.4);
  });
});
