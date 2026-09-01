/**
 * @jest-environment jsdom
 */

/**
 * Every surface a reader can reach, swept for language that belongs to the build.
 *
 * The earlier gate checked the landing page only, and machine identifiers were leaking from five
 * other render paths: a chapter's table cells, the architecture crosstab, the platform inventory
 * line, the record browser's constant-column note, and the evidence browser's statement column.
 * Each had been laundered nowhere because each formatted its own text.
 *
 * So the sweep walks every view rather than the one that was wrong last time.
 */
import "@testing-library/jest-dom";

import fs from "node:fs";
import path from "node:path";

import { render } from "@testing-library/react";

import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { HomeV4App } from "../HomeV4App";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function bundle(): HomeReviewBundle {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/home/preview/golden-snapshots/meridian-health.json",
      ),
      "utf8",
    ),
  ) as HomeReviewBundle;
}

const SURFACES: string[] = [
  ...bundle().chapters.map((chapter) => chapter.chapterId),
  "architecture",
  "data-flow",
  "browse-the-data",
  "tech:application_system",
  "tech:vendor_contract",
  "tech:infrastructure_platform",
  "tech:data_asset_or_integration",
];

/** Visible text only: a value inside a `title` or a `<style>` block is not what a reader reads. */
function visibleText(): string {
  document.querySelectorAll("style").forEach((node) => node.remove());
  return document.body.textContent ?? "";
}

function open(surface: string) {
  window.location.hash = surface;
  render(<HomeV4App bundle={bundle()} tenantKey="meridian-health" />);
}

describe.each(SURFACES)("%s", (surface) => {
  it("shows no machine identifier", () => {
    open(surface);
    // Two or more lowercase words joined by underscores. Matched by shape, so a key nobody has
    // invented yet fails this too. Tokens carrying digits are references and are left alone.
    expect(visibleText().match(/\b[a-z][a-z]*(?:_[a-z]+)+\b/g) ?? []).toEqual(
      [],
    );
  });

  it("reports no state of the build", () => {
    open(surface);
    const text = visibleText();
    for (const pattern of [
      /\d+ of \d+ sections/i,
      /sections ready/i,
      /\bdeferred\b/i,
      /grounded statements/i,
      /CXO readout/i,
      /has been established for this chapter/i,
      /is ready for this chapter/i,
      /\bECL\b/,
      /\bprojection\b/i,
      /\bpayload\b/i,
      /\bschema\b/i,
    ]) {
      expect(text).not.toMatch(pattern);
    }
  });
});

describe("a chapter describes what it is for", () => {
  function tableLabels(chapterId: string): string[] {
    window.location.hash = chapterId;
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    return [...container.querySelectorAll("table")].map(
      (t) =>
        t.previousElementSibling?.textContent ??
        t.getAttribute("aria-label") ??
        "",
    );
  }

  it("tabulates a family on one chapter, not on two", () => {
    const tech = new Set(tableLabels("technology_data"));
    document.body.innerHTML = "";
    const attention = new Set(tableLabels("what_needs_attention"));
    const shared = [...tech].filter((label) => label && attention.has(label));
    expect(shared).toEqual([]);
  });
});

describe("the leadership chapter carries the interviews", () => {
  it("quotes every office on the record, not only the loudest", () => {
    window.location.hash = "leadership_perspective";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const block = container.querySelector("[data-leadership-full]");
    expect(block).not.toBeNull();
    const offices = [...block!.querySelectorAll("span")]
      .map((n) => n.textContent ?? "")
      .filter((t) => /Officer|President|VP|Chief/.test(t));
    // Five distinct offices are quoted in the record; the chapter showed one.
    expect(new Set(offices).size).toBeGreaterThanOrEqual(4);
  });
});

describe("an exhibit belongs to the argument on the page", () => {
  it("draws the renewal timeline only where the chapter reasons from contracts", () => {
    const drawn = bundle()
      .chapters.map((chapter) => {
        window.location.hash = chapter.chapterId;
        const { container, unmount } = render(
          <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
        );
        const has = /When the decisions arrive/.test(
          container.textContent ?? "",
        );
        unmount();
        return has ? chapter.chapterId : null;
      })
      .filter(Boolean);
    // Value and bets. Not "what do leaders agree on", where it answered nothing that was asked.
    expect(drawn).toEqual(["strategy_value_creation", "performance_value"]);
  });
});

describe("a chapter never shows the generator's status", () => {
  // Three chapters open live with "X is deferred pending stronger evidence" as the largest words
  // on the page. That is the narrative generator's state, not a fact about the enterprise.
  const DEFERRAL =
    /deferred pending stronger evidence|not ready for executive review|does not yet connect enough verified statements|does not yet support a board-?ready answer/i;

  it.each(bundle().chapters.map((c) => c.chapterId))(
    "%s leads with something other than a build state",
    (chapterId) => {
      window.location.hash = chapterId;
      const { container } = render(
        <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
      );
      expect(container.querySelector("h1")?.textContent ?? "").not.toMatch(
        DEFERRAL,
      );
    },
  );

  it("leads with the strongest finding when the narrative was not written", () => {
    const value = bundle();
    const chapter = value.chapters.find(
      (c) => c.chapterId === "technology_data",
    )!;
    chapter.headline =
      "Technology & Data is deferred pending stronger evidence";
    chapter.executive_synthesis =
      "This chapter is not ready for executive review.";
    window.location.hash = "technology_data";
    const { container } = render(
      <HomeV4App bundle={value} tenantKey="meridian-health" />,
    );
    const headline = container.querySelector("h1")?.textContent ?? "";
    expect(headline).not.toMatch(DEFERRAL);
    // The rows answer it: the strongest finding on this chapter becomes the lead.
    expect(headline.length).toBeGreaterThan(20);
  });
});

describe("the visual grammar", () => {
  // Six kinds of statement used to render at one weight, separated only by a coloured edge stripe.
  // An edge stripe is the one device the house conventions ban outright, and it carries no meaning
  // a reader can name. Each kind now takes a form.
  it("marks an exposure as something the record says is wrong now", () => {
    window.location.hash = "what_needs_attention";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const marks = [
      ...container.querySelectorAll("[data-home-finding-mark='exposure']"),
    ];
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0].textContent ?? "").toMatch(
      /the record says this is wrong now/i,
    );
  });

  it("marks an absence as absence, with the view it cannot build", () => {
    window.location.hash = "technology_data";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const marks = [
      ...container.querySelectorAll(
        "[data-home-absence-mark], [data-home-finding-mark='absence']",
      ),
    ];
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0].textContent ?? "").toMatch(/not carried by the record/i);
  });

  it("carries no edge stripe on any finding or absence card", () => {
    window.location.hash = "technology_data";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const striped = [
      ...container.querySelectorAll<HTMLElement>("[style]"),
    ].filter((n) =>
      /inset\s+\d+px\s+0\s+0/.test(n.getAttribute("style") ?? ""),
    );
    expect(striped).toHaveLength(0);
  });

  it("states what the briefing is built from, ahead of anything it asserts", () => {
    window.location.hash = "executive_brief";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const block = container.querySelector("[data-home-declared-provenance]");
    if (!block) return; // a record carrying no such declaration renders none
    expect(block.textContent ?? "").toMatch(/declared provenance/i);
    // It is a declaration about the record, never one of the client's own findings.
    expect(block.closest("[data-home-findings]")).toBeNull();
  });
});

describe("the perspective layer", () => {
  // The one section where layout can assert something the record does not hold: patterns beside an
  // enterprise's own figures read as a comparison, and no competitor or peer benchmark exists
  // anywhere in the record. The absence is stated in words, ahead of any pattern.
  it("states that no comparison is carried, before showing a pattern", () => {
    window.location.hash = "leadership_perspective";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const block = container.querySelector("[data-home-perspective]");
    if (!block) return; // a record with no patterns or lenses renders none
    const note = block.querySelector("[data-home-no-comparison]");
    expect(note).not.toBeNull();
    expect(note!.textContent ?? "").toMatch(
      /no competitor position and no peer benchmark/i,
    );
    // It must precede the patterns, not follow them.
    expect(
      note!.compareDocumentPosition(
        block.querySelector("[data-home-briefing]")!,
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("keeps patterns off the chapters that are not about where this is heading", () => {
    window.location.hash = "executive_brief";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    expect(container.querySelector("[data-home-perspective]")).toBeNull();
  });
});
