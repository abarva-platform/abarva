/** @jest-environment jsdom */
/**
 * The Industry context band: the analytical lenses the record carries, grouped by the kind it files
 * them under, shown only where a new executive is being oriented.
 *
 * It pins the governance line this section exists to hold:
 *   - it renders the record's REAL lens labels, grouped by the in-record kind, with a human kind tag
 *     -- never the raw machine kind, which would put a snake_case identifier on a client surface;
 *   - it invents no number, no peer benchmark, and no currency the record does not carry, and it
 *     states in words that it is not a comparison; and
 *   - it renders only on the orientation chapter, and not at all when the record carries no lens.
 */
import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import type {
  ChapterView,
  EnterpriseSignalPacket,
} from "@/lib/home/preview/types";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { ChapterPage } from "../ChapterPage";

const bundle = getHomeReviewBundle("meridian-health")!;
const signalPacket = bundle.thesis.signalPacket;

function chapter(chapterId: string): ChapterView {
  const found = bundle.chapters.find((c) => c.chapterId === chapterId);
  if (!found) throw new Error(`chapter ${chapterId} missing from fixture`);
  return found;
}

function renderChapter(
  chapterId: string,
  packet: EnterpriseSignalPacket = signalPacket,
) {
  return render(
    <ChapterPage
      chapter={chapter(chapterId)}
      chapterNumber={1}
      signalPacket={packet}
      visualDatasets={{}}
      onOpenRows={() => {}}
    />,
  );
}

function section(): HTMLElement | null {
  return document.querySelector("[data-home-industry-context]");
}

describe("the Industry context band", () => {
  it("renders the record's real lens labels on the orientation chapter", () => {
    renderChapter("executive_brief");
    const el = section();
    expect(el).not.toBeNull();
    const text = el!.textContent ?? "";
    // Exact labels from the record, one of each kind -- these are the record's, not this section's.
    expect(text).toContain(
      "Epic single-vendor consolidation with a residual legacy EHR at one acquired facility",
    );
    expect(text).toContain("Medicare Advantage STARS/HEDIS Readiness Lens");
  });

  it("groups by the record's own kind and counts each group", () => {
    renderChapter("executive_brief");
    const node = section()!;
    const text = node.textContent ?? "";
    expect(text).toContain("Industry patterns");
    expect(text).toContain("Expert lenses");
    // The row counts equal the number of lenses of each kind the record actually carries (12 + 9).
    const patternRows = node.querySelectorAll(
      '[data-home-industry-row="industry_pattern"]',
    );
    const expertRows = node.querySelectorAll(
      '[data-home-industry-row="expert_lens"]',
    );
    expect(patternRows.length).toBe(12);
    expect(expertRows.length).toBe(9);
    // Every lens on the record is rendered as a row -- none is silently dropped.
    const lenses = (
      signalPacket as { analyticalLenses?: Array<{ kind: string }> }
    ).analyticalLenses!;
    expect(node.querySelectorAll("[data-home-industry-row]").length).toBe(
      lenses.length,
    );
  });

  it("shows a human kind tag, never the raw machine kind", () => {
    renderChapter("executive_brief");
    const text = section()!.textContent ?? "";
    expect(text).toContain("Industry pattern");
    expect(text).toContain("Expert lens");
    // The raw snake_case kind must never reach the reader. Matched by shape, the same gate the
    // landing surface holds, so a kind nobody has invented yet fails this too. The band carries no
    // <style> of its own, so its textContent is exactly what a reader reads.
    expect(text.match(/\b[a-z][a-z]*(?:_[a-z]+)+\b/g) ?? []).toEqual([]);
  });

  it("invents no number, no peer benchmark, and no currency", () => {
    renderChapter("executive_brief");
    const text = section()!.textContent ?? "";
    expect(text).not.toMatch(/\$/); // no money
    expect(text).not.toMatch(/\d+\s*%/); // no percentage benchmark
    // It says, in words, that it carries no comparison -- the absence is stated, not left to layout.
    expect(text).toMatch(/not a peer benchmark/i);
    expect(text).toMatch(/no competitor or peer figure/i);
  });

  it("does not render on a chapter that is not the orientation chapter", () => {
    // Same packet, lenses present -- the gate is the chapter, not the data.
    renderChapter("our_business");
    expect(section()).toBeNull();
  });

  it("does not render when the record carries no analytical lens", () => {
    const empty = {
      ...signalPacket,
      analyticalLenses: [],
    } as EnterpriseSignalPacket;
    renderChapter("executive_brief", empty);
    expect(section()).toBeNull();
  });
});
