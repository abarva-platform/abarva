/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import { CoveragePage } from "../WorkspaceExecutiveShell";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";

/**
 * The declared-archetype panel, and the two things it used to get wrong.
 *
 * Its title read "Archetype determines which levers are allowed". It renders
 * an archetype's name, recorded annual value, contract count and vendor count
 * - and no lever. Nothing resolves a contract's declared archetype to a lever
 * set either: the archetype playbook is resolved for a sourcing event from its
 * classified category and feeds deliverable prompts, and the contract
 * register's archetype vocabulary does not overlap that registry's
 * identifiers. A reader who acted on the title would ask for this archetype's
 * levers and find the surface has none to give.
 *
 * Second, the list is capped at six. The register carries seven declared
 * archetypes, so one was dropped with nothing on screen to say so - a
 * coverage panel understating the taxonomy it exists to report.
 *
 * The count arithmetic is pinned in the co-located shell suite. This file
 * pins the render: that the panel puts the omitted count on screen at all,
 * which a correct count reaching dead JSX would not.
 */

const archetypeRow = (archetype: string, value: number) => ({
  contract_id: `C-${archetype}`,
  vendor_ref: `V-${archetype}`,
  vendor_name: `Vendor ${archetype}`,
  contract_archetype: archetype,
  annual_value: value,
});

const portfolioWithArchetypes = (
  archetypes: readonly string[],
): SourceWorkspacePortfolioData =>
  ({
    contracts: [],
    vendors: [],
    asOfDateIso: "2026-10-07T00:00:00Z",
    archetypeCoverageRows: archetypes.map((name, index) =>
      archetypeRow(name, 1_000_000 * (archetypes.length - index)),
    ),
    impact: {
      actionCandidates: [],
      evidenceCoverage: [],
      vendorPositions: [],
      claimCards: [],
      avaGroundingBundles: [],
    },
    v4Snapshot: {
      spendConsumption: { rowCount: 0 },
      performanceCredits: {
        rowCount: 0,
        unclaimedCredit: 0,
        creditRecovered: 0,
      },
    },
    workspaceDiagnostics: { activeLoadRunId: null },
    cockpit: { claimQualityControls: [] },
  }) as unknown as SourceWorkspacePortfolioData;

// The seven the contract register actually declares.
const SEVEN = [
  "productivity_platform",
  "infra_service_desk_managed_services",
  "cloud_consumption",
  "crm_saas",
  "legacy_analytics_managed_services",
  "application_managed_services",
  "consumption_commit",
];

describe("the declared-archetype coverage panel", () => {
  it("says on screen that it is not listing every declared archetype", () => {
    render(
      <CoveragePage
        portfolio={portfolioWithArchetypes(SEVEN)}
        onOpenVendor={() => {}}
      />,
    );

    expect(
      screen.getByText(
        "1 further declared archetype carries recorded value and is not listed here.",
      ),
    ).toBeTruthy();
  });

  it("counts every omitted archetype, not just that some were omitted", () => {
    render(
      <CoveragePage
        portfolio={portfolioWithArchetypes([...SEVEN, "mssp_cyber", "bpo"])}
        onOpenVendor={() => {}}
      />,
    );

    expect(
      screen.getByText(
        "3 further declared archetypes carry recorded value and are not listed here.",
      ),
    ).toBeTruthy();
  });

  it("stays silent when every declared archetype is listed", () => {
    render(
      <CoveragePage
        portfolio={portfolioWithArchetypes(SEVEN.slice(0, 6))}
        onOpenVendor={() => {}}
      />,
    );

    expect(screen.queryByText(/not listed here/i)).toBeNull();
    expect(screen.queryByText(/further declared/i)).toBeNull();
  });

  it("claims only what it shows, and shows no lever", () => {
    const { container } = render(
      <CoveragePage
        portfolio={portfolioWithArchetypes(SEVEN)}
        onOpenVendor={() => {}}
      />,
    );

    expect(screen.getByText("Declared archetypes")).toBeTruthy();
    expect(
      screen.getByText("Recorded value by declared archetype"),
    ).toBeTruthy();

    /*
     * Rendered text is asserted per text NODE rather than over the container's
     * concatenated textContent: adjacent nodes join with no separator, so a
     * phrase spanning two of them matches a string no reader ever sees.
     */
    const rendered = [...container.querySelectorAll("*")]
      .flatMap((element) => [...element.childNodes])
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? "");

    for (const text of rendered) {
      expect(text).not.toMatch(/determines which levers/i);
      expect(text).not.toMatch(/\bdeclared plays\b/i);
      expect(text).not.toMatch(/\blevers? (?:are |is )?allowed\b/i);
    }
  });
});
