/**
 * @jest-environment jsdom
 */

/**
 * P1-1 + P1-2 (synthetic pilot rehearsal 2026-05-22): tenant-aware empty
 * states for Intelligence, Source, and Tower.
 *
 * Before this PR:
 *  - Intelligence/decision rendered Apex's substrate labelled with a brand-new
 *    tenant's name (Northwind landing on the `(retail, customer_care)`
 *    binding) — a cross-tenant content leak.
 *  - Source's events empty state was anonymous: "No sourcing events yet" with
 *    no tenant name, no runbook link.
 *  - Tower's portfolio empty state was generic: "No loop-completed Moves yet"
 *    with no tenant name, no onboarding signpost.
 *
 * After this PR:
 *  - `IntelligenceEmptyState` names the tenant, links the runbook, and never
 *    shows another tenant's analysis.
 *  - `SourceEmptyState({ tenantName })` names the tenant and includes the
 *    runbook link.
 *  - `MovePortfolioCardPanel({ cards, tenantName })` names the tenant in its
 *    empty state and includes the runbook link.
 */

import { render, screen } from "@testing-library/react";
import { SourceEmptyState } from "@/components/source/SourceEmptyState";
import {
  MovePortfolioCardPanel,
  TOWER_PROJECTED_VALUE_DISCLOSURE,
} from "@/components/tower/MovePortfolioCardPanel";

describe("SourceEmptyState (P1-2)", () => {
  it("names the active tenant in the headline", () => {
    render(<SourceEmptyState tenantName="Northwind Retail" />);
    expect(
      screen.getByText(/No source events for Northwind Retail yet/),
    ).toBeTruthy();
  });

  it("links the new-tenant onboarding runbook", () => {
    render(<SourceEmptyState tenantName="Northwind Retail" />);
    const runbookLink = Array.from(document.querySelectorAll("a")).find(
      (a) => a.getAttribute("href") === "/docs/pilot/ONBOARDING-NEW-TENANT.md",
    );
    expect(runbookLink).toBeTruthy();
  });

  it("renders the Start IT sourcing event CTA", () => {
    render(<SourceEmptyState tenantName="Northwind Retail" />);
    const cta = screen.getByTestId(
      "source-empty-start-event",
    ) as HTMLAnchorElement;
    expect(cta.getAttribute("href")).toBe("/source/new");
  });

  it("falls back to a generic label when tenantName is omitted", () => {
    render(<SourceEmptyState />);
    expect(
      screen.getByText(/No source events for this tenant yet/),
    ).toBeTruthy();
  });
});

describe("MovePortfolioCardPanel empty state (P1-2)", () => {
  it("names the active tenant when there are no cards", () => {
    render(<MovePortfolioCardPanel cards={[]} tenantName="Northwind Retail" />);
    expect(
      screen.getByText(/Tower portfolio for Northwind Retail is empty\./),
    ).toBeTruthy();
  });

  it("links the new-tenant onboarding runbook in the empty state", () => {
    render(<MovePortfolioCardPanel cards={[]} tenantName="Northwind Retail" />);
    const link = screen.getByTestId(
      "tower-empty-runbook-link",
    ) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(
      "/docs/pilot/ONBOARDING-NEW-TENANT.md",
    );
  });

  it("falls back to a generic label when tenantName is omitted", () => {
    render(<MovePortfolioCardPanel cards={[]} />);
    expect(
      screen.getByText(/Tower portfolio for this tenant is empty\./),
    ).toBeTruthy();
  });

  it("does NOT show the empty state when cards exist", () => {
    const cards = [
      {
        moveId: "apex-move-1",
        moveName: "Contact Center AI Routing",
        phaseLabel: "Value",
        ledgerStatus: "tracked" as const,
        projectedValueUsd: 1_200_000,
        sourceRiskLevel: "watch" as const,
        sourceCostExposureUsd: 0,
        sourceRiskReadout: null,
        earningSummary: "Cumulative deflection earned.",
        links: [
          { id: "open", label: "Open Move", href: "/programs/apex-move-1" },
        ],
      },
    ];
    render(<MovePortfolioCardPanel cards={cards} tenantName="Apex Retail" />);
    expect(
      screen.queryByText(/Tower portfolio for Apex Retail is empty/),
    ).toBeNull();
    expect(screen.queryByTestId("tower-empty-runbook-link")).toBeNull();
  });

  it("shows a projection assumption disclosure when projected value is present", () => {
    const cards = [
      {
        moveId: "apex-move-1",
        moveName: "Contact Center AI Routing",
        phaseLabel: "Value",
        ledgerStatus: "projected" as const,
        projectedValueUsd: 1_200_000,
        sourceRiskLevel: null,
        sourceCostExposureUsd: 0,
        sourceRiskReadout: null,
        earningSummary: "Projected benefit pending measurement.",
        links: [
          { id: "open", label: "Open Move", href: "/programs/apex-move-1" },
        ],
      },
    ];
    render(<MovePortfolioCardPanel cards={cards} tenantName="Apex Retail" />);
    expect(
      screen.getByTestId("tower-projected-value-disclosure").textContent,
    ).toContain(TOWER_PROJECTED_VALUE_DISCLOSURE);
    expect(
      screen.getByText(/Projection assumptions .* confidence projected/i),
    ).toBeTruthy();
  });

  it("does not show the projection disclosure when no projected value exists", () => {
    const cards = [
      {
        moveId: "apex-move-2",
        moveName: "Knowledge Base Cleanup",
        phaseLabel: "Value",
        ledgerStatus: "none" as const,
        projectedValueUsd: 0,
        sourceRiskLevel: null,
        sourceCostExposureUsd: 0,
        sourceRiskReadout: null,
        earningSummary: "No value claim yet.",
        links: [
          { id: "open", label: "Open Move", href: "/programs/apex-move-2" },
        ],
      },
    ];
    render(<MovePortfolioCardPanel cards={cards} tenantName="Apex Retail" />);
    expect(screen.queryByTestId("tower-projected-value-disclosure")).toBeNull();
  });
});
