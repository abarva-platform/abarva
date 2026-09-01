/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import fs from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";

import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { HomeV4App } from "../HomeV4App";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const REPO_ROOT = process.cwd();

function bundle(): HomeReviewBundle {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        REPO_ROOT,
        "src/lib/home/preview/golden-snapshots/meridian-health.json",
      ),
      "utf8",
    ),
  ) as HomeReviewBundle;
}

/** A chapter is reached the way the product reaches one: by hash. */
function renderChapter(chapterId: string) {
  window.location.hash = `#${chapterId}`;
  return render(<HomeV4App bundle={bundle()} tenantKey="meridian-health" />);
}

describe("a chapter carries the depth its own rows support", () => {
  it("renders a table set on the technology chapter, not a single table", () => {
    renderChapter("technology_data");
    expect(document.querySelector("[data-home-table-set]")).toBeInTheDocument();
    // Tables are grouped into named sections, and each section opens one at a time. The chapter's
    // depth is what it offers -- open plus collapsed -- not what happens to be expanded on arrival.
    const open = document.querySelectorAll(
      "[data-home-table-set] table",
    ).length;
    const collapsed = document.querySelectorAll(
      "[data-home-table-collapsed]",
    ).length;
    expect(open + collapsed).toBeGreaterThanOrEqual(4);
  });

  it("groups those tables into named sections a reader can navigate", () => {
    renderChapter("technology_data");
    const sections = [
      ...document.querySelectorAll("[data-home-table-section]"),
    ].map((n) => n.getAttribute("data-home-table-section"));
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(new Set(sections).size).toBe(sections.length);
    // A spine over one destination is furniture; over several it answers "where am I".
    const spine = document.querySelector("[data-home-chapter-spine]");
    expect(spine).toBeInTheDocument();
    expect(spine!.querySelectorAll("a").length).toBe(sections.length);
  });

  it("keeps a collapsed table's own shape visible rather than hiding it", () => {
    renderChapter("technology_data");
    const collapsed = document.querySelector("[data-home-table-collapsed]");
    if (!collapsed) return; // a chapter whose sections hold one table each has none
    expect(collapsed.textContent ?? "").toMatch(/\d+ rows? · open/);
  });

  it("shows the crossed population no single column holds", () => {
    renderChapter("technology_data");
    const findings = document.querySelector(
      "[data-home-findings]",
    ) as HTMLElement;
    expect(findings).toBeInTheDocument();
    expect(
      within(findings).getByText(
        /applications holding PHI authenticate on local accounts/i,
      ),
    ).toBeInTheDocument();
  });

  it("gives every rendered finding an owner and a stripe that means something", () => {
    renderChapter("technology_data");
    const cards = document.querySelectorAll("[data-home-finding]");
    expect(cards.length).toBeGreaterThan(0);
    for (const card of Array.from(cards)) {
      expect(["exposure", "absence", "established"]).toContain(
        card.getAttribute("data-home-finding"),
      );
      expect((card.textContent ?? "").length).toBeGreaterThan(80);
    }
  });

  // The block's header states its own count, which is what lets a short block read as complete.
  it("states the finding count in the header, matching the cards rendered", () => {
    renderChapter("technology_data");
    const header = document.querySelector(
      "[data-home-findings-count]",
    ) as HTMLElement;
    const stated = Number(header.getAttribute("data-home-findings-count"));
    expect(document.querySelectorAll("[data-home-finding]").length).toBe(
      stated,
    );
    expect(header.textContent).toMatch(
      /What does not reconcile — (one|two|three|four|five|six|seven)/,
    );
  });

  // The failure this design exists to remove: a heading over an apology.
  // strategy_value_creation maps to vendors + applications; our_business maps to nothing at all.
  it("renders no findings block at all on a chapter whose rows produce none", () => {
    renderChapter("our_business");
    expect(
      document.querySelector("[data-home-findings]"),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector("[data-home-table-set]"),
    ).not.toBeInTheDocument();
  });

  it("states a table's own bound rather than letting a partial view read as the whole estate", () => {
    renderChapter("technology_data");
    expect(screen.getByText(/of 22 functions shown/i)).toBeInTheDocument();
  });
});
