/**
 * @jest-environment jsdom
 */
/**
 * HomeV4ExplorerShell · quiet-dimension chapter fallback
 *
 * Real bug, confirmed live on a real approved candidate (skyharbor-air,
 * regenerated and approved this session): a "quiet" dimension (no headline
 * -- see pickDimensionHeadline in the generator; most of the 38 real
 * dimensions have no conclusion/gap/advantage tagged to them specifically,
 * by design) rendered nothing but its own <h1> title. Every other
 * conditional block (summary_tab, headline, primary_visual, full_rows,
 * graph_binding) requires content that only a handful of dimensions per
 * tenant actually have, so most dimension pages were genuinely blank.
 * Uses the real skyharbor-air fixture specifically: first-capital's fixture
 * happens to have a headline on every one of its 38 dimensions (confirmed
 * directly), so it can't exercise this real bug at all.
 *
 * Fix: a dimension with no dedicated content now falls back to its book
 * chapter's real, Claude-authored section narrative (candidate.
 * enterprise_book.sections[dimension.chapter]), honestly labeled as shared
 * chapter context rather than dimension-specific commentary.
 */

import "@testing-library/jest-dom";

import { fireEvent, render, screen, within } from "@testing-library/react";

import { buildBookChapterGroups, HomeV4ExplorerShell } from "../HomeV4ExplorerShell";
import type { HomeV4Candidate } from "../homeV4Visual";
import skyharborFixture from "@/app/(maestro)/home/v4-preview/_fixtures/skyharbor-air.json";

const candidate = skyharborFixture as unknown as HomeV4Candidate;

function findQuietDimension() {
  return candidate.dimensions.find(
    (d) => !d.headline && !d.summary_tab?.executive_read && d.dimension_key !== "enterprise_thesis" && d.chapter,
  );
}

// Which chapter group actually contains a given dimension key, per the
// same (already-tested) grouping logic the real shell renders from --
// avoids maintaining a second, potentially-drifting chapter-title lookup
// in the test itself.
function chapterTitleFor(dimensionKey: string): string {
  const group = buildBookChapterGroups(candidate.dimensions).find((g) =>
    g.items.some((item) => item.key === `dimension:${dimensionKey}`),
  );
  if (!group) throw new Error(`No chapter group contains dimension:${dimensionKey}`);
  return group.title;
}

// Chapter groups default collapsed -- selecting a dimension's own nav
// button requires first expanding its parent chapter group. The chapter
// header's accessible name includes its roman-numeral marker alongside the
// title (e.g. "VIIApplications & Systems"), so match by substring rather
// than an exact string. Dimension items are selected by a stable test id
// (dimension_key), not visible label text, since real fixture content can
// have duplicate/overlapping title text across dimensions. Uses fireEvent
// (not a raw element.click()) so React's state update is flushed inside
// act() before the next synchronous query runs.
function openChapterAndSelectDimension(dimensionKey: string) {
  const chapterTitle = chapterTitleFor(dimensionKey);
  fireEvent.click(screen.getByRole("button", { name: new RegExp(chapterTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }));
  fireEvent.click(screen.getByTestId(`heb-v4-explorer-item-dimension:${dimensionKey}`));
}

describe("<HomeV4ExplorerShell /> · quiet-dimension chapter fallback (real fixture content)", () => {
  it("has at least one real quiet dimension to test against (sanity check on the fixture itself)", () => {
    expect(findQuietDimension()).toBeTruthy();
  });

  it("never renders a dimension page with only a title -- a quiet dimension shows its chapter's real narrative", () => {
    const quiet = findQuietDimension();
    if (!quiet) throw new Error("no quiet dimension found in skyharbor-air fixture -- fixture may have changed");
    const chapterSection = candidate.enterprise_book?.sections?.[quiet.chapter ?? ""];
    expect(chapterSection).toBeTruthy();

    render(<HomeV4ExplorerShell candidate={candidate} />);
    openChapterAndSelectDimension(quiet.dimension_key);

    // Scoped to the main content pane: the same title text also appears as
    // the (now-fixed) sidebar nav label, so an unscoped query would be
    // ambiguous between the two, not a sign either is wrong.
    const main = within(screen.getByRole("main"));
    expect(main.getByRole("heading", { name: (quiet.title ?? quiet.executive_title)! })).toBeInTheDocument();
    expect(
      main.getByText(/No material-specific finding for this dimension yet/i),
    ).toBeInTheDocument();
    expect(main.getByText(new RegExp(chapterSection!.headline.slice(0, 20), "i"))).toBeInTheDocument();
  });

  it("a dimension WITH its own headline does not show the chapter-fallback label", () => {
    const populated = candidate.dimensions.find((d) => d.headline && d.dimension_key !== "enterprise_thesis" && d.chapter);
    if (!populated) throw new Error("no populated dimension found in skyharbor-air fixture -- fixture may have changed");
    render(<HomeV4ExplorerShell candidate={candidate} />);
    openChapterAndSelectDimension(populated.dimension_key);

    expect(screen.getByText(populated.headline!)).toBeInTheDocument();
    expect(
      screen.queryByText(/No material-specific finding for this dimension yet/i),
    ).not.toBeInTheDocument();
  });
});
