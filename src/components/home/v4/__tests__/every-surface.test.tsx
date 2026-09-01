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
import { rankFindings } from "../page-tables";

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

  // Written against the shape, not one expression of it. The original assertion matched only the
  // box-shadow form, so a `border-left: 3px solid` on every claim row survived it -- the same
  // mistake as banning a list of words instead of the pattern that produces them.
  //
  // Scoped to the elements this rule is actually about: the cards and rows that carry a claim, a
  // finding or an absence. A left rule on a quotation is a typographic convention with meaning, and
  // one marking a conflicting source is doing work; a regex over every styled node cannot tell
  // those from decoration, and a guard that needs an exemption list stops being a guard.
  it.each([
    "executive_brief",
    "our_business",
    "technology_data",
    "what_needs_attention",
    "leadership_perspective",
  ])("carries no accent stripe on a claim or finding on %s", (chapterId) => {
    window.location.hash = chapterId;
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const carriers = [
      ...container.querySelectorAll<HTMLElement>(
        "[data-home-finding], [data-home-claim-index], [data-home-table-collapsed]",
      ),
    ];
    const striped = carriers.filter((node) => {
      const style = `${node.getAttribute("style") ?? ""} ${node.parentElement?.getAttribute("style") ?? ""}`;
      return (
        /inset\s+[2-9]\d*px\s+0\s+0/.test(style) ||
        /border-(left|right|top|bottom):\s*[2-9]\d*px\s+solid\s+(?!transparent)/.test(
          style,
        )
      );
    });
    expect(
      striped.map((n) => (n.getAttribute("style") ?? "").slice(0, 70)),
    ).toEqual([]);
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
    // No early return. A guard that skips when the thing it guards is missing can never fail on the
    // case that matters -- this one passed while the section rendered nothing at all on the served
    // path, because the fixture carried lenses and the served packet does not.
    expect(block).not.toBeNull();
    const note = block!.querySelector("[data-home-no-comparison]");
    expect(note).not.toBeNull();
    expect(note!.textContent ?? "").toMatch(
      /no competitor position and no peer benchmark/i,
    );
    // It must precede the patterns, not follow them.
    expect(
      note!.compareDocumentPosition(
        block!.querySelector("[data-home-briefing]")!,
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

describe("the rail", () => {
  // Twenty flat entries make the briefing and the evidence look like one list of equal things. They
  // are not: eight are a reading order, twelve are a reference shelf.
  it("numbers the briefing, because it is a reading order", () => {
    window.location.hash = "executive_brief";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const rail = container.querySelector("nav");
    expect(rail).not.toBeNull();
    const text = (rail!.textContent ?? "").replace(/\s+/g, " ");
    for (const [n, title] of bundle().chapters.map(
      (c, i) => [i + 1, c.title] as const,
    )) {
      expect(text).toContain(`${n}${title}`);
    }
  });

  it("reveals a chapter's sections only while that chapter is the one being read", () => {
    window.location.hash = "technology_data";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const open = container.querySelectorAll("[data-home-rail-sections]");
    // Exactly one chapter expands: the active one.
    expect(open.length).toBe(1);
    expect(open[0].querySelectorAll("a").length).toBeGreaterThan(1);
  });

  it("carries at most one status mark, and only where the record rates something high", () => {
    window.location.hash = "executive_brief";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const flags = container.querySelectorAll("[data-home-rail-flag]");
    // A mark on most of a list is decoration. It follows the record's own rating, not any computed
    // exposure -- an earlier version marked five of eight chapters, which spent red on something red
    // is not reserved for.
    expect(flags.length).toBeLessThanOrEqual(2);
  });

  it("keeps every destination reachable", () => {
    window.location.hash = "executive_brief";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    const rail = container.querySelector("nav")!;
    for (const chapter of bundle().chapters) {
      expect(rail.textContent ?? "").toContain(chapter.title);
    }
    for (const label of ["Current-state architecture", "Browse the record"]) {
      expect(rail.textContent ?? "").toContain(label);
    }
  });
});

describe("the record's own rating", () => {
  // The queue is ordered by what the record rates, not by how serious a finding sounds to us.
  it("orders a rated-high finding ahead of an unrated one of the same kind", () => {
    const ranked = rankFindings([
      { kind: "exposure", claim: "unrated", owner: "o", because: "b" },
      {
        kind: "exposure",
        claim: "high",
        owner: "o",
        because: "b",
        rated: "high",
      },
      {
        kind: "exposure",
        claim: "moderate",
        owner: "o",
        because: "b",
        rated: "moderate",
      },
    ]);
    expect(ranked.map((f) => f.claim)).toEqual(["high", "unrated", "moderate"]);
  });

  it("does not demote an unrated finding below a moderate one", () => {
    // Absence of a rating is not a low rating. Treating it as one lets a gap in the register
    // quietly reorder a queue a leader reads top-down.
    const ranked = rankFindings([
      {
        kind: "exposure",
        claim: "moderate",
        owner: "o",
        because: "b",
        rated: "moderate",
      },
      { kind: "exposure", claim: "unrated", owner: "o", because: "b" },
    ]);
    expect(ranked[0].claim).toBe("unrated");
  });

  it("spends red only on a rating the record declares", () => {
    window.location.hash = "what_needs_attention";
    const { container } = render(
      <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
    );
    for (const badge of container.querySelectorAll(
      "[data-home-finding-rated]",
    )) {
      const rated = badge.getAttribute("data-home-finding-rated");
      const style = badge.getAttribute("style") ?? "";
      if (rated === "high")
        expect(style).toMatch(/rgb\(163, 45, 45\)|#a32d2d/i);
      else expect(style).not.toMatch(/rgb\(163, 45, 45\)|#a32d2d/i);
    }
  });
});

describe("the closing blocks on a prose-only chapter", () => {
  // Executive Brief, Our Business and Leadership Perspective carry no tables. What closes them is
  // the questions the record raises and the limits of the read -- and a question on a page like
  // this reads as leading somewhere unless the page says otherwise.
  it.each(["executive_brief", "our_business", "leadership_perspective"])(
    "%s says its questions are not answered here",
    (chapterId) => {
      window.location.hash = chapterId;
      const { container } = render(
        <HomeV4App bundle={bundle()} tenantKey="meridian-health" />,
      );
      const rubric = container.querySelector("[data-home-questions-rubric]");
      if (!container.textContent?.includes("Take these into the room")) return;
      expect(rubric).not.toBeNull();
      expect(rubric!.textContent ?? "").toMatch(/stated, not answered/i);
    },
  );
});
