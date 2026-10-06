/** @jest-environment jsdom */
/**
 * The cockpit's chart surfaces: the responsive exhibit grid, and the Technology & Data pivot.
 *
 * These pin the behaviours the approved prototype asks for and the governance the surface requires:
 *   - the exhibits render as a grid of governed cards, each naming its own source;
 *   - the pivot's numbers are counts and sums over the estate rows, never a typed-in figure (a
 *     four-application fixture must not render the prototype's illustrative "306");
 *   - a drill filters the slice correctly, across dimensions; and
 *   - on the Technology chapter the pivot replaces the grid while the deterministic evidence region
 *     and the KPI rail stay present, because a governance affordance behind a tab is one a reader
 *     will not find.
 */
import "@testing-library/jest-dom";

import { fireEvent, render, within } from "@testing-library/react";

import type { ChapterView } from "@/lib/home/preview/types";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { EstateRow } from "../page-tables";
import { ChapterPage } from "../ChapterPage";
import type { ChapterDepth } from "../chapter-page-content";
import { CockpitChartGrid } from "../CockpitChartGrid";
import { TechCockpit } from "../TechCockpit";

const bundle = getHomeReviewBundle("meridian-health")!;
const signalPacket = bundle.thesis.signalPacket;

/** A four-application, three-vendor estate with known totals, so an invented number cannot hide. */
const APPS: EstateRow[] = [
  { systemName: "Alpha", vendor: "Epic", businessFunction: "Clinical", criticality: "tier1", deploymentModel: "saas", systemScope: "enterprise", annualCostUsd: 100, interfacesCount: 10, technicalDebtScore: 5 },
  { systemName: "Beta", vendor: "Epic", businessFunction: "Finance", criticality: "tier2", deploymentModel: "saas", systemScope: "facility", annualCostUsd: 50, interfacesCount: 4, technicalDebtScore: 3 },
  { systemName: "Gamma", vendor: "Microsoft", businessFunction: "Clinical", criticality: "tier1", deploymentModel: "cloud", systemScope: "enterprise", annualCostUsd: 200, interfacesCount: 8, technicalDebtScore: null },
  { systemName: "Delta", vendor: "", businessFunction: "Clinical", criticality: "tier3", deploymentModel: "on_premise", systemScope: "function", annualCostUsd: 30, interfacesCount: 2, technicalDebtScore: 7 },
];
const VENDORS: EstateRow[] = [
  { vendorName: "Epic", annualSpendUsd: 1000 },
  { vendorName: "Microsoft", annualSpendUsd: 600 },
];

function techChapter(): ChapterView {
  return bundle.chapters.find((c) => c.chapterId === "technology_data")!;
}

function depthFixture(): ChapterDepth {
  return {
    tables: [
      { caption: "Estate table", columns: ["Name", "Count"], rows: [["Alpha", 3]] },
    ],
    findings: [
      {
        kind: "established",
        claim: "Every application in this family names an accountable owner.",
        owner: "Platform owner",
        because: "The owner field is populated on every row in the family.",
      },
    ],
    unsupported: [],
  };
}

describe("the exhibit grid renders governed cards", () => {
  it("lays the chapter's exhibits out as a grid, each card naming its source", () => {
    const visuals = bundle.chapters.find(
      (c) => c.chapterId === "executive_brief",
    )!.visual_opportunities;
    render(
      <CockpitChartGrid
        visuals={visuals}
        signalPacket={signalPacket}
        visualDatasets={signalPacket.visualDatasets ?? {}}
      />,
    );
    const grid = document.querySelector("[data-home-chart-grid]");
    expect(grid).toBeInTheDocument();
    const cards = document.querySelectorAll("[data-home-chart-card]");
    expect(cards.length).toBe(visuals.length);
    expect(cards.length).toBeGreaterThan(0);
    // The per-exhibit provenance the surface promises renders on the card, not only in a side panel.
    expect(document.body.textContent).toContain("Source");
    expect(document.body.textContent).toMatch(/register|interviews|portfolio/i);
  });

  it("renders nothing when the chapter proposes no exhibit, rather than an empty frame", () => {
    render(
      <CockpitChartGrid
        visuals={[]}
        signalPacket={signalPacket}
        visualDatasets={{}}
      />,
    );
    expect(document.querySelector("[data-home-chart-grid]")).not.toBeInTheDocument();
  });
});

describe("the technology pivot counts from the estate and never invents a figure", () => {
  it("renders the scale, controls, and a row per application from the fixture", () => {
    render(
      <TechCockpit applications={APPS} vendors={VENDORS} dataAssetCount={42} />,
    );
    expect(document.querySelector("[data-home-tech-cockpit]")).toBeInTheDocument();
    // Five pivot dimensions and a drill-able table.
    expect(document.querySelectorAll("[data-home-pivot-dim]").length).toBe(5);
    const table = document.querySelector("[data-home-tech-table]") as HTMLElement;
    // Four applications in, four data rows out.
    expect(within(table).getAllByRole("row").length).toBe(APPS.length + 1); // + header row
    // The counts are the fixture's, not the prototype's illustrative estate.
    const scale = document.querySelector("[data-home-tech-scale]") as HTMLElement;
    expect(scale.textContent).toContain("42");
    expect(scale.textContent).toContain("data assets & integrations");
    expect(scale.textContent).toContain("4"); // four applications
    expect(document.body.textContent).not.toContain("306");
  });

  it("drills into a dimension value and filters the slice, with its relationships", () => {
    render(
      <TechCockpit applications={APPS} vendors={VENDORS} dataAssetCount={42} />,
    );
    // Drill by clicking a criticality badge -- Tier 1 covers Alpha and Gamma.
    const tier1 = document.querySelector(
      '[data-home-tech-drill-criticality="Tier 1"]',
    ) as HTMLElement;
    fireEvent.click(tier1);

    const drillbar = document.querySelector("[data-home-tech-drillbar]");
    expect(drillbar?.textContent).toContain("Tier 1");

    // The relationship cards appear and count the slice: two applications are Tier 1.
    const rel = document.querySelector("[data-home-tech-relationship]");
    expect(rel).toBeInTheDocument();
    const appsCard = document.querySelector('[data-home-rel-card="Applications"]');
    expect(appsCard?.textContent).toContain("2");

    // The table narrows to the two Tier-1 rows (Alpha, Gamma).
    const table = document.querySelector("[data-home-tech-table]") as HTMLElement;
    expect(within(table).getAllByRole("row").length).toBe(2 + 1); // + header
    expect(within(table).getByText("Alpha")).toBeInTheDocument();
    expect(within(table).getByText("Gamma")).toBeInTheDocument();
    expect(within(table).queryByText("Beta")).not.toBeInTheDocument();

    // Clearing the drill restores the full estate.
    fireEvent.click(
      document.querySelector("[data-home-tech-drill-clear]") as HTMLElement,
    );
    expect(within(table).getAllByRole("row").length).toBe(APPS.length + 1);
  });

  it("states what it cannot draw rather than drawing a missing score as zero", () => {
    render(
      <TechCockpit applications={APPS} vendors={VENDORS} dataAssetCount={42} />,
    );
    // Gamma declares no debt score; the scatter says so instead of plotting a zero.
    expect(document.body.textContent).toMatch(/declare[s]? no debt score/);
    // The missing provider on Delta shows as a stated absence, not a blank or a real vendor.
    expect(document.body.textContent).toContain("Not recorded");
  });
});

describe("the Technology chapter keeps its governance affordances with the pivot", () => {
  it("renders the pivot in place of the grid, with the KPI rail and evidence still present", () => {
    render(
      <ChapterPage
        chapter={techChapter()}
        chapterNumber={5}
        signalPacket={signalPacket}
        visualDatasets={signalPacket.visualDatasets ?? {}}
        depth={depthFixture()}
        estate={{ applications: APPS, vendors: VENDORS, dataAssetCount: 42 }}
        onOpenRows={() => {}}
      />,
    );
    // The pivot replaces the standard exhibit grid on this chapter.
    expect(document.querySelector("[data-home-tech-cockpit]")).toBeInTheDocument();
    expect(document.querySelector("[data-home-chart-grid]")).not.toBeInTheDocument();
    // The KPI rail and the deterministic evidence region both stay on the page.
    expect(document.querySelector("[data-home-kpi-rail]")).toBeInTheDocument();
    expect(document.querySelector("[data-home-page-shape]")).toBeInTheDocument();
  });

  it("uses the exhibit grid, not the pivot, on a non-technology chapter", () => {
    const execBrief = bundle.chapters.find(
      (c) => c.chapterId === "executive_brief",
    )!;
    render(
      <ChapterPage
        chapter={execBrief}
        chapterNumber={1}
        signalPacket={signalPacket}
        visualDatasets={signalPacket.visualDatasets ?? {}}
        onOpenRows={() => {}}
      />,
    );
    expect(document.querySelector("[data-home-chart-grid]")).toBeInTheDocument();
    expect(document.querySelector("[data-home-tech-cockpit]")).not.toBeInTheDocument();
  });
});
