// The slide face carries whole claims or none.
//
// Each case here is one of the shapes a real generated deck produced: a
// finding cut at a word cap, a paragraph label promoted to a headline. The
// negatives pin what must NOT be touched, because a stripper that eats a real
// sentence is a worse defect than the one it fixes.

import {
  MAX_BULLET_WORDS,
  MAX_GOVERNING_WORDS,
  SLIDE_BULLET_WORD_BUDGET,
  bulletFontSize,
  fitWholeClaim,
  governingFontSize,
  sectionSlideText,
  splitSlideSentences,
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

  it("keeps the lead sentences of a multi-sentence point when the whole does not fit", () => {
    // The shape authored points actually take: a short lead statement, then
    // its support. Dropping the point lost the finding; keeping the lead
    // keeps it, whole.
    const lead = "Measurement is unreconciled.";
    const second = "Candidate measures carry conflicting definitions.";
    const claim = `${lead} ${second} Then ${words(60)}.`;
    expect(fitWholeClaim(claim, 12)).toBe(`${lead} ${second}`);
  });

  it("never prints a short opener alone", () => {
    // Observed on a generated deck: "Workflow timings." was the whole bullet
    // and the timings were in the notes. An opener with nothing complete after
    // it is held, not shown — whether it is a label or a short statement.
    const long = `Agents ${words(60)}.`;
    for (const opener of [
      "Workflow timings.",
      "The metric conflict that blocks value.",
      "Measurement is unreconciled.",
    ]) {
      expect(splitSlideSentences(`${opener} ${long}`)).toHaveLength(2);
      for (const cap of [1, 4, 12, 32, 48]) {
        expect(fitWholeClaim(`${opener} ${long}`, cap)).toBeNull();
      }
    }
  });

  it("prints a lead-in with the statement it leads into, and does not charge it to the cap", () => {
    const statement = `Agents ${words(11)}.`;
    const claim = `Workflow timings. ${statement} Then ${words(60)}.`;
    expect(fitWholeClaim(claim, 12)).toBe(`Workflow timings. ${statement}`);
  });

  it("extends kept sentences with a semicolon clause of the next one when it fits", () => {
    const claim = `Readiness is unknown. Adoption telemetry is absent and training is not designed; ${words(40)}.`;
    expect(fitWholeClaim(claim, 16)).toBe(
      "Readiness is unknown. Adoption telemetry is absent and training is not designed.",
    );
  });

  it("returns null when even the first sentence cannot be kept whole", () => {
    expect(fitWholeClaim(`${words(40)}. Short tail.`, 12)).toBeNull();
  });

  it("every kept form is a prefix of the original ending at a sentence or clause end", () => {
    const claim =
      "Integration is unproven. Only one endpoint has been probed in a sandbox; eight of nine interfaces remain unvalidated. Two systems are missing from the inventory.";
    for (let cap = 1; cap <= 30; cap += 1) {
      const fitted = fitWholeClaim(claim, cap);
      if (fitted === null) continue;
      expect(fitted).toMatch(/[.!?]$/);
      expect(claim.startsWith(fitted.replace(/\.$/, ""))).toBe(true);
      expect(fitted).not.toMatch(/(?:\.{3}|…)$/);
    }
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
      "Section stance. An escalation route exists.",
      "An escalation route exists.",
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
    "Section two: the findings follow.",
    "Section 4. Current-state findings.",
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
      "**Section boundary.**\n\nThe service desk is the only workflow in scope.",
      "Scope",
    );
    expect(result.governing).toBe(
      "The service desk is the only workflow in scope.",
    );
  });

  it("holds a document-meta opener in the notes of a bulleted section too", () => {
    const result = sectionSlideText(
      "This section covers the service desk only.\n\n- A short point stands here.\n- A second point stands beside it.",
      "Scope",
    );
    expect(result.governing).toBe("A short point stands here.");
    expect(result.bullets).toEqual(["A second point stands beside it."]);
    expect(result.heldOffFace).toEqual([
      "This section covers the service desk only.",
    ]);
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

  it("no bullet is a bare opener, in a bulleted section", () => {
    const md = [
      "The opening claim stands here as the headline.",
      "",
      `- Workflow timings. Agents ${words(70, "t")}.`,
      `- Demand scale. The extract totals a stated number of calls over twelve months.`,
      `- The metric conflict that blocks value. Finance ${words(70, "m")}.`,
    ].join("\n");
    const result = sectionSlideText(md, "Summary");
    expect(result.bullets).toEqual([
      "Demand scale. The extract totals a stated number of calls over twelve months.",
    ]);
    expect(result.heldOffFace).toHaveLength(2);
    expect(result.heldOffFace[0]).toContain("t69");
  });

  it("no bullet is a bare opener, in a prose section", () => {
    const md = [
      "The opening claim stands here as the headline.",
      "",
      "Workflow timings. The walkthrough totals differ by a stated number of seconds across the two paths.",
      "",
      `The metric conflict that blocks value. Finance ${words(70, "m")}.`,
    ].join("\n");
    const result = sectionSlideText(md, "Summary");
    expect(result.bullets).toEqual([
      "Workflow timings. The walkthrough totals differ by a stated number of seconds across the two paths.",
    ]);
    expect(result.heldOffFace).toHaveLength(1);
  });

  it("a sentence about the document is neither the headline nor a point", () => {
    const md = [
      "This section establishes the baseline position. The baseline is unattested and Finance has not signed it.",
      "",
      "This slide summarises the workflow evidence gathered so far in discovery.",
      "",
      "Three of twenty sampled calls show the article lookup failing outright.",
    ].join("\n");
    const result = sectionSlideText(md, "Baseline");
    expect(result.governing).toBe(
      "The baseline is unattested and Finance has not signed it.",
    );
    expect(result.bullets).toEqual([
      "Three of twenty sampled calls show the article lookup failing outright.",
    ]);
    expect(result.heldOffFace).toEqual([
      "This section establishes the baseline position.",
      "This slide summarises the workflow evidence gathered so far in discovery.",
    ]);
  });

  it("keeps the slide inside its word budget and holds what does not fit", () => {
    const point = (i: number) => `- ${words(MAX_BULLET_WORDS, `p${i}x`)}.`;
    const md = ["Opening claim.", "", ...[0, 1, 2, 3, 4, 5].map(point)].join(
      "\n",
    );
    const result = sectionSlideText(md, "Dense");
    const total = result.bullets.join(" ").split(" ").length;
    expect(total).toBeLessThanOrEqual(SLIDE_BULLET_WORD_BUDGET);
    expect(result.bullets.length).toBe(
      Math.floor(SLIDE_BULLET_WORD_BUDGET / MAX_BULLET_WORDS),
    );
    expect(result.bullets.length + result.heldOffFace.length).toBe(6);
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

describe("bulletFontSize", () => {
  it("steps down for a full slide and the fullest slide fits its box", () => {
    expect(bulletFontSize(["short point."])).toBe(14);
    const full = Array.from({ length: 4 }, () =>
      Array.from({ length: 50 }, () => "seventy").join(" "),
    );
    const size = bulletFontSize(full);
    expect(size).toBe(13);
    // 11.1in × 4in box; Arial averages ~0.5em per character.
    const charsPerLine = Math.floor((11.1 * 72) / (size * 0.5));
    const lines = full.reduce(
      (sum, bullet) => sum + Math.ceil(bullet.length / charsPerLine),
      0,
    );
    const height = (lines * size * 1.2) / 72 + (full.length * 6) / 72;
    expect(height).toBeLessThanOrEqual(4);
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
