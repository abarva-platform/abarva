/** @jest-environment jsdom */
/**
 * The chapter cockpit: a KPI rail counted from the props, the governed evidence kept visible, and a
 * tabbed narrative that swaps one band view in for another in place of a long vertical scroll.
 *
 * These pin the two properties the restructure must not lose:
 *   - every KPI number is a count of something already on the props (a tile with no derivable
 *     number is omitted, never filled with a figure), so the rail can carry no invented value; and
 *   - the governed evidence -- the findings a reader must act on -- stays out of the tab workspace,
 *     because a governance affordance a reader has to switch tabs to find is one they will not find.
 */
import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import type { ChapterView } from "@/lib/home/preview/types";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { ChapterPage } from "../ChapterPage";
import type { ChapterDepth } from "../chapter-page-content";

const bundle = getHomeReviewBundle("meridian-health")!;
const signalPacket = bundle.thesis.signalPacket;

/** A chapter whose bands are exactly the statements named, so the tabs under test are the ones the
 * chapter's own fields produce. */
function chapterWith(parts: Partial<ChapterView>): ChapterView {
  const base = bundle.chapters.find((c) => c.chapterId === "our_business")!;
  return {
    ...base,
    chapterId: "our_business",
    headline: "Our business, read from the record.",
    executive_synthesis:
      "This synthesis prose belongs in the insights tab, flowed across the full canvas.",
    key_insights: [],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    visual_opportunities: [],
    limitations: [],
    ...parts,
  } as ChapterView;
}

/** Deterministic depth: two tables, two findings (one a rated exposure), one view the rows could
 * not support. The tile numbers must equal these, which is what proves they are counted, not typed. */
function depthFixture(): ChapterDepth {
  return {
    tables: [
      { caption: "First table", columns: ["Name", "Count"], rows: [["Alpha", 3]] },
      { caption: "Second table", columns: ["Name", "Count"], rows: [["Beta", 5]] },
    ],
    findings: [
      {
        kind: "exposure",
        rated: "high",
        claim: "A dependency the register rates high carries an open control.",
        owner: "Risk owner",
        because:
          "The severity field reads high and the control state on the same row reads open.",
      },
      {
        kind: "established",
        claim: "The estate confirms a single platform owner for this family.",
        owner: "Platform owner",
        because: "Every row in the family names the same accountable owner.",
      },
    ],
    unsupported: [
      {
        caption: "A view the rows cannot support",
        missingColumn: "Name",
        why: "No row in this family declares the column this view would group on.",
      },
    ],
  };
}

function renderCockpit(chapter: ChapterView, depth: ChapterDepth) {
  return render(
    <ChapterPage
      chapter={chapter}
      chapterNumber={2}
      signalPacket={signalPacket}
      visualDatasets={{}}
      depth={depth}
      onOpenRows={() => {}}
    />,
  );
}

/** The big number on the tile whose label reads `label`. */
function tileNumber(label: string): HTMLElement {
  const labelEl = screen.getByText(label);
  const tile = labelEl.parentElement as HTMLElement;
  return tile.querySelector("div") as HTMLElement;
}

describe("the KPI rail counts from the props and never invents a figure", () => {
  it("renders a tile whose number equals the count on the props", () => {
    renderCockpit(
      chapterWith({
        key_insights: [
          {
            statement: "A counted fact about the estate.",
            evidence_ids: [],
            claim_type: "FACT",
          },
        ] as unknown as ChapterView["key_insights"],
      }),
      depthFixture(),
    );
    const rail = document.querySelector("[data-home-kpi-rail]");
    expect(rail).toBeInTheDocument();
    // Two tables and two findings were passed; the tiles read two and two.
    expect(tileNumber("evidence tables").textContent).toBe("2");
    expect(tileNumber("findings in the evidence").textContent).toBe("2");
    // One view could not be supported; the pending-evidence tile reads one, in the absence amber.
    // The label agrees in number with its count (singular here), matching the PageShape line.
    const pending = tileNumber("evidence view pending");
    expect(pending.textContent).toBe("1");
    expect(pending.getAttribute("style") ?? "").toMatch(
      /ba7517|rgb\(186, 117, 23\)/i,
    );
  });

  it("spends red only on the exposure count the record rates", () => {
    renderCockpit(chapterWith({}), depthFixture());
    const exposure = tileNumber("exposure the record rates as wrong now");
    expect(exposure.textContent).toBe("1");
    expect(exposure.getAttribute("style") ?? "").toMatch(
      /a32d2d|rgb\(163, 45, 45\)/i,
    );
  });

  it("carries no money figure, because no cost is derivable from these props", () => {
    renderCockpit(chapterWith({}), depthFixture());
    // The prototype's illustrative dollar tiles must not survive as hardcoded numerals.
    expect(document.querySelector("[data-home-kpi-rail]")?.textContent).not.toMatch(
      /\$/,
    );
  });
});

describe("the narrative swaps in place while the evidence stays visible", () => {
  it("shows a tab only for a band the chapter actually carries", () => {
    renderCockpit(
      chapterWith({
        key_insights: [
          {
            statement: "A counted fact.",
            evidence_ids: [],
            claim_type: "FACT",
          },
        ] as unknown as ChapterView["key_insights"],
        questions_to_ask: ["What should the room decide?"],
        limitations: ["The record does not establish this."],
      }),
      depthFixture(),
    );
    const tabs = [...document.querySelectorAll('[role="tab"]')].map(
      (tab) => tab.textContent ?? "",
    );
    expect(tabs.some((t) => /Insights/.test(t))).toBe(true);
    expect(tabs.some((t) => /Watch/.test(t))).toBe(true);
    expect(tabs.some((t) => /Questions/.test(t))).toBe(true);
    // No tension routed to the risk register, so there is no open-items view to offer.
    expect(tabs.some((t) => /Open items/.test(t))).toBe(false);
  });

  it("leads the insights tab with the synthesis and swaps panels on click", () => {
    renderCockpit(
      chapterWith({
        questions_to_ask: ["What should the room decide about this?"],
      }),
      depthFixture(),
    );
    const synthesis = document.querySelector("[data-home-cockpit-synthesis]");
    expect(synthesis?.textContent).toContain("belongs in the insights tab");

    const insights = document.querySelector(
      '[data-home-cockpit-panel="insights"]',
    );
    const questions = document.querySelector(
      '[data-home-cockpit-panel="questions"]',
    );
    expect(insights).not.toHaveAttribute("hidden");
    expect(questions).toHaveAttribute("hidden");

    fireEvent.click(screen.getByRole("tab", { name: /Questions/ }));
    expect(insights).toHaveAttribute("hidden");
    expect(questions).not.toHaveAttribute("hidden");
    expect(document.body.textContent).toContain("Take these into the room");
  });

  it("keeps the findings a reader must act on out of the tab workspace", () => {
    renderCockpit(chapterWith({}), depthFixture());
    const findings = document.querySelector("[data-home-findings]");
    expect(findings).toBeInTheDocument();
    // The governed evidence is in the always-visible region, never inside a tab panel that a reader
    // would have to switch to before the finding becomes reachable.
    expect(findings!.closest('[role="tabpanel"]')).toBeNull();
  });
});
