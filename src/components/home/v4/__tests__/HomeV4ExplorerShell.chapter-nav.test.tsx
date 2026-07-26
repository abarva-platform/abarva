/**
 * HomeV4ExplorerShell · chapter-grouped table-of-contents navigation
 *
 * Before this change, book-mode candidates showed a flat, ungrouped list of
 * all 38 dimensions under one "Enterprise Context" header despite the
 * generator guaranteeing a real 13-chapter structure (DIMENSION_BOOK_CHAPTERS
 * in build-home-knowledge-v4-review-pack.mjs). This renders that real
 * structure as a numbered table of contents instead. Uses the actual
 * first-capital fixture (the same JSON /home/v4-preview renders) so this is
 * a real-content check, not a synthetic shape.
 *
 * Chapter groups default closed (same as the old flat group did), so a
 * static-markup snapshot of the collapsed shell can't prove every dimension
 * landed in the right chapter -- buildBookChapterGroups() is exported
 * specifically so that grouping can be asserted directly, independent of
 * collapse/expand DOM state.
 */

import { renderToStaticMarkup } from "react-dom/server";

import { buildBookChapterGroups, HomeV4ExplorerShell } from "../HomeV4ExplorerShell";
import type { HomeV4Candidate } from "../homeV4Visual";
import firstCapitalFixture from "@/app/(maestro)/home/v4-preview/_fixtures/first-capital.json";

const candidate = firstCapitalFixture as unknown as HomeV4Candidate;

describe("buildBookChapterGroups · grouping logic against real fixture content", () => {
  const groups = buildBookChapterGroups(candidate.dimensions);

  it("produces 13 chapter groups (one per real DIMENSION_BOOK_CHAPTERS entry, minus executive_narrative)", () => {
    // enterprise_thesis (the sole executive_narrative dimension) is folded
    // into the Executive Book group by the shell, not one of these 13.
    expect(groups).toHaveLength(13);
  });

  it("includes the expected chapter titles and roman-numeral markers, correctly ordered", () => {
    expect(groups[0]).toMatchObject({ title: "Enterprise Context", numberLabel: "I" });
    expect(groups[6]).toMatchObject({ title: "Applications & Systems", numberLabel: "VII" });
    expect(groups[12]).toMatchObject({ title: "Relationships", numberLabel: "XIII" });
  });

  it("places every real fixture dimension (except enterprise_thesis) in exactly one chapter group", () => {
    const nonNarrativeDimensions = candidate.dimensions.filter((d) => d.dimension_key !== "enterprise_thesis");
    const allGroupedKeys = groups.flatMap((g) => g.items.map((item) => item.key));
    expect(allGroupedKeys).toHaveLength(nonNarrativeDimensions.length);
    for (const dimension of nonNarrativeDimensions) {
      const occurrences = allGroupedKeys.filter((key) => key === `dimension:${dimension.dimension_key}`).length;
      expect(occurrences).toBe(1);
    }
  });

  it("puts the apps dimension specifically in the Applications & Systems chapter", () => {
    const appsGroup = groups.find((g) => g.title === "Applications & Systems");
    expect(appsGroup?.items.map((i) => i.key)).toContain("dimension:apps");
  });

  it("marks a dimension with no headline as quiet tone, and one with a headline as green", () => {
    const emptyHeadlineDim = candidate.dimensions.find((d) => !d.headline && d.dimension_key !== "enterprise_thesis");
    const populatedDim = candidate.dimensions.find((d) => d.headline);
    if (emptyHeadlineDim) {
      const item = groups.flatMap((g) => g.items).find((i) => i.key === `dimension:${emptyHeadlineDim.dimension_key}`);
      expect(item?.tone).toBe("quiet");
    }
    if (populatedDim) {
      const item = groups.flatMap((g) => g.items).find((i) => i.key === `dimension:${populatedDim.dimension_key}`);
      expect(item?.tone).toBe("green");
    }
  });
});

describe("<HomeV4ExplorerShell /> · initial render (book mode)", () => {
  function html() {
    return renderToStaticMarkup(<HomeV4ExplorerShell candidate={candidate} />);
  }

  it("renders all 13 chapter headers with roman numerals, collapsed by default", () => {
    const markup = html();
    expect(markup).toContain("Applications &amp; Systems");
    // Numeral text itself, independent of styled-jsx's generated class hash.
    expect(markup).toContain(">VII<");
    expect(markup).toContain(">XIII<");
    expect(markup).toContain("heb-v4-explorer-group-head toc");
  });

  it("does not render a flat single-group dimension list for book mode", () => {
    const markup = html();
    // The legacy flat group's title text must not appear as a top-level
    // group heading in book mode -- book mode uses the chapter groups
    // exclusively, per the isBookMode branch.
    const executiveBookOccurrences = (markup.match(/Executive Book/g) ?? []).length;
    expect(executiveBookOccurrences).toBe(1);
  });
});
