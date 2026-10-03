import {
  getHomeReviewBundle,
  HOME_PREVIEW_TENANT_KEYS,
} from "@/lib/home/preview/golden-snapshot";
import { sanitizeHomeReviewBundleNarrative } from "@/lib/home/preview/stale-claim-guard";
import {
  countBrokenDecimals,
  splitNarrativeSentences,
} from "@/lib/home/preview/narrative-sentences";
import type {
  ChapterView,
  HomeReviewBundle,
  TechnologyEstateBundle,
} from "@/lib/home/preview/types";

/**
 * The Home v4 cockpit is the first surface a new executive lands on, and the narrative it prints
 * passes through `sanitizeHomeReviewBundleNarrative` on the way out. That guard splits each
 * narrative field into sentences, drops the ones that conflict with the current record, and
 * re-joins the survivors with a space. Until this suite existed the split treated a decimal point
 * as a sentence terminator, so the re-join printed `17. 4%`, `$496. 4M` and `4. 5+` to the
 * executive while the guard reported success.
 *
 * Two things are asserted together, because either alone can be satisfied by a wrong fix:
 *
 *   1. No broken decimal survives the guard, counted over the REAL published corpus rather than
 *      over one crafted string. A per-example test is what let the sibling identifier defect ship.
 *   2. The guard still decides at sentence granularity. A "fix" that simply stopped splitting
 *      would pass (1) and silently disable the stale-claim filter this guard exists to run.
 */

const BROKEN_DECIMAL_DESCRIPTION = "a digit, a period, whitespace, then a digit";

/** Every string anywhere inside a value, so the count covers the corpus and not a chosen field. */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, out);
  } else if (value && typeof value === "object") {
    for (const entry of Object.values(value)) collectStrings(entry, out);
  }
  return out;
}

function brokenDecimalsIn(value: unknown): string[] {
  return collectStrings(value).flatMap(
    (text) => text.match(/\d\.\s+\d/g) ?? [],
  );
}

/**
 * A vendor-contract record type carrying contract-level evidence, which is what makes
 * `isStaleHomeClaim` treat a sentence denying such evidence as stale. Without it the stale branch
 * never fires and the granularity assertions below would pass vacuously.
 */
function technologyEstateWithContractEvidence(): TechnologyEstateBundle {
  return {
    recordTypes: [
      {
        objectType: "vendor_contract",
        label: "Vendor Contracts",
        columns: ["vendorName", "annualSpendUsd", "contractTermsDetail"],
        rows: [
          {
            vendorName: "Supplier One",
            annualSpendUsd: "1000000",
            contractTermsDetail: "Three-year term with an annual uplift cap.",
          },
        ],
        primaryDimension: null,
        dimensionCounts: [],
      },
    ],
  };
}

function chapterWith(overrides: Partial<ChapterView>): ChapterView {
  return {
    chapterId: "executive_brief",
    title: "Executive Brief",
    guidingQuestion: "What should I understand in my first ten minutes?",
    headline: "The estate is concentrated.",
    executive_synthesis: "",
    key_insights: [],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    visual_opportunities: [],
    limitations: [],
    ...overrides,
  };
}

function bundleWith(chapter: ChapterView): HomeReviewBundle {
  return {
    chapters: [chapter],
    technologyEstate: technologyEstateWithContractEvidence(),
  } as unknown as HomeReviewBundle;
}

describe("the published Home corpus carries no broken decimal after the narrative guard", () => {
  it.each(HOME_PREVIEW_TENANT_KEYS)(
    "%s: the guard introduces no broken decimal it did not receive",
    (tenantKey) => {
      const bundle = getHomeReviewBundle(tenantKey);
      expect(bundle).not.toBeNull();

      // Independent truth: the corpus on disk is the baseline, read before the guard runs, so a
      // surviving break can only have been introduced here and cannot be blamed on the generator.
      const beforeGuard = brokenDecimalsIn(bundle!.chapters);
      expect(beforeGuard).toEqual([]);

      const afterGuard = brokenDecimalsIn(
        sanitizeHomeReviewBundleNarrative(bundle!).chapters,
      );
      expect(afterGuard).toEqual([]);
    },
  );

  it("the corpus actually exercises the decimals this suite protects", () => {
    // Guards the suite itself: if the published chapters held no decimal at all, every assertion
    // above would pass on a pipeline that still breaks every decimal it is given.
    const decimalCounts = HOME_PREVIEW_TENANT_KEYS.map((tenantKey) => {
      const chapters = getHomeReviewBundle(tenantKey)?.chapters ?? [];
      return collectStrings(chapters).join(" ").match(/\d\.\d/g)?.length ?? 0;
    });
    for (const count of decimalCounts) {
      expect(count).toBeGreaterThan(0);
    }
  });
});

describe("the guard preserves a figure's decimal on every narrative field it rewrites", () => {
  // The three shapes the defect was observed in: a percentage, a currency magnitude, a bare
  // decimal. All three in one sentence, so a fix that handles only one of them fails here.
  const FIGURES = "17.4% of the $496.4M book, against a 4.5+ coverage ratio";

  it("keeps the figures intact in a chapter's executive synthesis", () => {
    const sanitized = sanitizeHomeReviewBundleNarrative(
      bundleWith(
        chapterWith({
          executive_synthesis: `The top supplier holds ${FIGURES}.`,
        }),
      ),
    );

    expect(sanitized.chapters[0].executive_synthesis).toBe(
      `The top supplier holds ${FIGURES}.`,
    );
  });

  it("keeps the figures intact in an exhibit's title and key message", () => {
    const sanitized = sanitizeHomeReviewBundleNarrative(
      bundleWith(
        chapterWith({
          visual_opportunities: [
            {
              visual_type: "bar",
              title: `Concentration reaches ${FIGURES}.`,
              purpose: "Show supplier concentration.",
              dataset_ref: "some_other_dataset",
              key_message: `The top supplier holds ${FIGURES}.`,
              evidence_ids: [],
              priority: "high",
            },
          ],
        }),
      ),
    );

    const visual = sanitized.chapters[0].visual_opportunities[0];
    expect(visual.key_message).toBe(`The top supplier holds ${FIGURES}.`);
    expect(visual.title).toBe(`Concentration reaches ${FIGURES}.`);
  });

  it("keeps the figures intact in a headline, a question and a limitation", () => {
    const sanitized = sanitizeHomeReviewBundleNarrative(
      bundleWith(
        chapterWith({
          headline: `Concentration is ${FIGURES}.`,
          questions_to_ask: [`Why is concentration ${FIGURES}?`],
          limitations: [`Coverage is measured at ${FIGURES}.`],
        }),
      ),
    );

    const chapter = sanitized.chapters[0];
    expect(countBrokenDecimals(chapter.headline)).toBe(0);
    expect(countBrokenDecimals(chapter.questions_to_ask[0])).toBe(0);
    expect(countBrokenDecimals(chapter.limitations[0])).toBe(0);
  });
});

describe("the guard still decides at sentence granularity", () => {
  // This is the half a lazy fix breaks. If the splitter stopped finding sentence boundaries, the
  // decimal assertions above would all pass and the stale-claim filter would quietly stop running.
  it("drops only the stale sentence and keeps its neighbours, decimals intact", () => {
    const sanitized = sanitizeHomeReviewBundleNarrative(
      bundleWith(
        chapterWith({
          executive_synthesis:
            "The top supplier holds 17.4% of spend. No vendor contracts are available for review. Coverage sits at 4.5+ today.",
        }),
      ),
    );

    const synthesis = sanitized.chapters[0].executive_synthesis;
    expect(synthesis).toBe(
      "The top supplier holds 17.4% of spend. Coverage sits at 4.5+ today.",
    );
    expect(synthesis).not.toContain("No vendor contracts");
  });

  it("drops a stale sentence that follows a terminator with no space before its leading digit", () => {
    // The discriminating case for the preceding-digit lookbehind in the tokenizer. Narrowing the
    // rule to "a period followed by a digit" -- without also requiring a digit BEFORE it -- passes
    // every other assertion in this file, and then any sentence boundary that happens to be
    // followed by a digit stops being a boundary. The stale claim is swallowed into its neighbour
    // and escapes the filter entirely, which is the same failure as the half-sentence leak this
    // suite was written for.
    const sanitized = sanitizeHomeReviewBundleNarrative(
      bundleWith(
        chapterWith({
          executive_synthesis:
            "Spend is concentrated at 17.4%.4 of 12 contracts are unavailable for review.",
        }),
      ),
    );

    const synthesis = sanitized.chapters[0].executive_synthesis;
    expect(synthesis).toBe("Spend is concentrated at 17.4%.");
    expect(synthesis).not.toContain("unavailable for review");
  });

  it("drops a stale sentence that itself carries a decimal", () => {
    const sanitized = sanitizeHomeReviewBundleNarrative(
      bundleWith(
        chapterWith({
          executive_synthesis:
            "Coverage sits at 4.5+ today. No vendor contracts with 17.4% uplift terms are available.",
        }),
      ),
    );

    expect(sanitized.chapters[0].executive_synthesis).toBe(
      "Coverage sits at 4.5+ today.",
    );
  });
});

describe("splitNarrativeSentences", () => {
  it("does not treat a decimal point as a sentence terminator", () => {
    expect(
      splitNarrativeSentences("Spend is 17.4% of $496.4M at 4.5+ coverage."),
    ).toEqual(["Spend is 17.4% of $496.4M at 4.5+ coverage."]);
  });

  it("still splits on a real sentence boundary", () => {
    expect(splitNarrativeSentences("First at 1.5. Second at 2.5!")).toEqual([
      "First at 1.5.",
      "Second at 2.5!",
    ]);
  });

  it("treats a period before a digit as a terminator when no digit precedes it", () => {
    expect(splitNarrativeSentences("Done. 4 remain.")).toEqual([
      "Done.",
      "4 remain.",
    ]);
  });

  it("terminates a sentence whose period is not preceded by a digit, even before a digit", () => {
    expect(
      splitNarrativeSentences(
        "Spend is concentrated.4 of 12 contracts carry no pricing evidence.",
      ),
    ).toEqual([
      "Spend is concentrated.",
      "4 of 12 contracts carry no pricing evidence.",
    ]);
  });

  it("returns the input unchanged when it holds no sentence", () => {
    expect(splitNarrativeSentences("...")).toEqual(["..."]);
  });

  it(`defines a broken decimal as ${BROKEN_DECIMAL_DESCRIPTION}`, () => {
    expect(countBrokenDecimals("17. 4%")).toBe(1);
    expect(countBrokenDecimals("17.4%")).toBe(0);
    expect(countBrokenDecimals("Done. 4 remain.")).toBe(0);
  });
});
