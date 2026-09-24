/**
 * Item U-400. The class definition behind the rendered-output control.
 *
 * U-400 requires the control be mutation-checked in **both** directions:
 * re-introducing a builder term must fail, and an ordinary English use of the
 * same word must not. The second half is not padding — it is the defect item
 * 39 already paid for once, where a guard rejected the ordinary word `first`
 * and the cost landed on whoever was writing the client-facing copy.
 *
 * So the two describes below are a matched pair. Neither is complete alone.
 */

import {
  describeBuilderVocabulary,
  findBuilderVocabulary,
} from "@/testing/source-builder-vocabulary";
import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";

describe("builder vocabulary · terms that must be caught", () => {
  it("catches a raw work-item key rendered into client-facing prose", () => {
    const found = findBuilderVocabulary(
      "The Tower portfolio reads tower_watch work items, so the renewal becomes visible there.",
    );

    expect(found.map((o) => o.term)).toEqual(["tower_watch"]);
    expect(found[0].rule).toBe("identifier-shape");
  });

  it("catches every snake_case stage key the rail carries a label for", () => {
    // Read from code, not typed out: a stage added later is covered without
    // editing this file.
    const snakeKeys = Object.keys(SOURCE_STAGE_LABELS).filter((k) =>
      k.includes("_"),
    );
    expect(snakeKeys.length).toBeGreaterThan(0);

    for (const key of snakeKeys) {
      const found = findBuilderVocabulary(`Stage: ${key}`);
      expect(found.map((o) => o.term)).toEqual([key]);
      // The rail publishes a client-facing label for exactly these, so the
      // control can say what the copy should have been.
      expect(found[0].canonicalLabel).toBe(
        SOURCE_STAGE_LABELS[key as keyof typeof SOURCE_STAGE_LABELS],
      );
    }
  });

  it("catches a SCREAMING_SNAKE constant name", () => {
    expect(
      findBuilderVocabulary("Sorted by SOURCE_STAGE_ORDER.").map((o) => o.term),
    ).toEqual(["SOURCE_STAGE_ORDER"]);
  });

  it("catches both phrases the master backlog names", () => {
    const found = findBuilderVocabulary(
      "Shown by internal stage key. Matched on the compatibility key.",
    );
    expect(found.map((o) => o.rule)).toEqual(["named-phrase", "named-phrase"]);
    expect(found.map((o) => o.term.toLowerCase())).toEqual([
      "internal stage key",
      "compatibility key",
    ]);
  });

  it("reports the whole token, not a fragment of it", () => {
    // `\b` treats `_` as a word character, so a naive boundary would report a
    // fragment and a reader would go looking for a string that is not there.
    expect(
      findBuilderVocabulary("key=rfp_rfi_package_v2 applied").map((o) => o.term),
    ).toEqual(["rfp_rfi_package_v2"]);
  });

  it("names the canonical wording when the rail publishes one", () => {
    const found = findBuilderVocabulary("executive_decision");
    expect(describeBuilderVocabulary(found)).toContain(
      'the rail already publishes "Executive Decision" for this key',
    );
  });

  it("says a replacement is a product decision when the rail has no label", () => {
    const found = findBuilderVocabulary("tower_watch");
    expect(describeBuilderVocabulary(found)).toContain(
      "no canonical label; replacing it is a product decision",
    );
  });
});

describe("builder vocabulary · ordinary copy that must NOT be caught", () => {
  it.each([
    [
      "the words the two named phrases are built from, used ordinarily",
      "This is an internal review. The stage is complete and the key risk is timing. Compatibility with the incumbent is unproven.",
    ],
    [
      "the product's own agent name",
      "Ask aVa. aVa can make mistakes — check important info.",
    ],
    [
      "the rail's own client-facing stage labels",
      Object.values(SOURCE_STAGE_LABELS).join(" · "),
    ],
    [
      "hyphenated English and ordinary punctuation",
      "A well-scoped, multi-year renewal — decline it before the auto-renewal window closes.",
    ],
    ["money, dates and counts", "$1,240,000 · 2026-09-24 · 18 of 23 responses"],
    [
      "a client-supplied filename",
      "Uploaded vendor_response_workbook.xlsx and pricing_sheet.csv.",
    ],
    [
      "a client-supplied address or path",
      "Sent to a_buyer@vendor_one.example and stored under /files/scope_v2/final.",
    ],
    ["a date fragment", "Batch 2026_09 completed."],
  ])("passes %s", (_label, text) => {
    expect(findBuilderVocabulary(text)).toEqual([]);
  });

  it("passes empty and absent text", () => {
    expect(findBuilderVocabulary("")).toEqual([]);
    expect(findBuilderVocabulary(null)).toEqual([]);
    expect(findBuilderVocabulary(undefined)).toEqual([]);
  });
});
