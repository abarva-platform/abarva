/**
 * @jest-environment jsdom
 */

/**
 * A story section the planner never wrote must still answer its question.
 *
 * The upstream planner publishes a claim per section. When it fails to plan one, the section used
 * to print an empty state -- while the rows that answer it sat in the same bundle, one prop away.
 * These tests hold the page to the rule that a planner's silence is not the record's silence.
 */
import "@testing-library/jest-dom";

import fs from "node:fs";
import path from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";

import { ExecutiveStoryPage } from "../ExecutiveStoryPage";
import { estateFromBundle, sectionDepth } from "../chapter-page-content";
import type { HomeReviewBundle } from "@/lib/home/preview/types";

const REPO_ROOT = path.resolve(__dirname, "../../../../..");

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

/** No story plan at all -- every section is deferred. The worst case, and the live one. */
function withoutStoryPlan(): HomeReviewBundle {
  const value = bundle();
  delete (value as { executiveStoryPlan?: unknown }).executiveStoryPlan;
  return value;
}

/** What the rail says about each section, which is what a reader scans first. */
function railStates(): string {
  return (
    document.querySelector("[data-home-tier1-rail]")?.textContent ?? ""
  ).replace(/\s+/g, " ");
}

/** Only the active section renders, so reach the one under test the way a reader does. */
function openSection(title: RegExp) {
  render(
    <ExecutiveStoryPage
      bundle={withoutStoryPlan()}
      tenantKey="meridian-health"
      onOpenView={() => {}}
      compiledLine={[]}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: new RegExp(title.source, "i") }),
  );
}

describe("a section with no planned narrative", () => {
  it("reports its rows rather than an empty state", () => {
    openSection(/What it is betting on/);
    expect(
      screen.queryByText(/intentionally held from the executive story/i),
    ).toBeNull();
    expect(
      document.querySelector("[data-home-story-from-record]"),
    ).not.toBeNull();
  });

  it("says the answer was read, not written", () => {
    openSection(/What it is betting on/);
    expect(
      screen.getByText(/answered from the rows themselves/i),
    ).toBeInTheDocument();
  });

  it("draws the tables, not just the note", () => {
    openSection(/What needs attention/);
    expect(
      document.querySelectorAll("[data-home-story-from-record] table").length,
    ).toBeGreaterThan(0);
  });

  it("stops reporting a section it can answer as deferred", () => {
    render(
      <ExecutiveStoryPage
        bundle={withoutStoryPlan()}
        tenantKey="meridian-health"
        onOpenView={() => {}}
        compiledLine={[]}
      />,
    );
    // Five of the six sections have estate families behind them and now report from the record.
    // The sixth -- what the enterprise is -- has none, and is still honestly deferred.
    expect(railStates()).toMatch(/Executive story\s*5 of 6/);
    expect(railStates().match(/from record/g) ?? []).toHaveLength(5);
  });

  it("keeps deferring a section the record cannot answer", () => {
    render(
      <ExecutiveStoryPage
        bundle={withoutStoryPlan()}
        tenantKey="meridian-health"
        onOpenView={() => {}}
        compiledLine={[]}
      />,
    );
    expect(railStates().match(/deferred/g) ?? []).toHaveLength(1);
    expect(railStates()).toMatch(/What this enterprise is\s*deferred/);
  });
});

describe("the depth behind the two sections that were live-deferred", () => {
  // These are the exact chapter sets behind "What it is betting on" and "What needs attention",
  // the two the live page reported as deferred.
  it.each([
    ["bets", ["strategy_value_creation"] as const],
    ["attention", ["what_needs_attention", "leadership_perspective"] as const],
  ])("%s has findings computed from the record", (_id, chapterIds) => {
    const depth = sectionDepth(chapterIds, estateFromBundle(bundle()));
    expect(depth.findings.length).toBeGreaterThan(0);
    expect(depth.tables.length).toBeGreaterThan(0);
  });

  // The families behind these sections that the projection has not loaded yet contribute nothing,
  // and must not break the sections that can be answered from what is loaded.
  it("answers from the families present, without the ones that are not", () => {
    const partial = { applications: estateFromBundle(bundle()).applications };
    expect(
      sectionDepth(["what_needs_attention"], partial).findings.length,
    ).toBeGreaterThan(0);
    expect(sectionDepth(["performance_value"], {}).findings).toHaveLength(0);
  });
});

describe("estateFromBundle", () => {
  it("reaches every family the projection carries", () => {
    const estate = estateFromBundle(bundle());
    for (const family of [
      "applications",
      "vendors",
      "infrastructure",
      "data",
    ] as const) {
      expect(estate[family]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("carries the record's own as-of date rather than falling back to today", () => {
    expect(
      estateFromBundle({ provenance: { generated_at: "2026-08-21T00:00:00Z" } })
        .asOf,
    ).toBe("2026-08-21");
    // A record with no stamp yields no date, so a time-relative finding stays silent rather than
    // measuring against the clock.

    expect(estateFromBundle(bundle()).asOf).toBe("2026-08-21");
    expect(estateFromBundle({}).asOf).toBeUndefined();
  });

  it("returns an empty estate rather than throwing on a bundle with no estate", () => {
    expect(estateFromBundle({}).applications).toBeUndefined();
  });
});
