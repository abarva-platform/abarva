/**
 * @jest-environment jsdom
 */

// The redesigned "Your sourcing book" portfolio home has two doctrine-critical
// honesty invariants that must never regress:
//   1. Real derivations (active count, spend under management, projected value
//      band) render from the fixture — never fabricated.
//   2. Sections with NO substrate backing for the tenant (renewals, value
//      captured when nothing is realized) render honest empty states — never a
//      fabricated live figure.
// These are the honesty contract made executable.

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// Stub the shell + sub-nav so the page renders its content in jsdom without
// pulling Clerk / data-plane wiring.
jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => <nav data-testid="subnav-mock" />,
}));

import { SourcePortfolioBookPage } from "../SourcePortfolioBookPage";
import type { SourcingEventSummary } from "@/lib/source/types";
import type { SourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";

function makeEvent(over: Partial<SourcingEventSummary>): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "AMS-2026",
    name: "AMS Consolidation 2026",
    accountName: "Lakeshore",
    leadAgent: "Sentinel",
    archetype: "Managed Services / Outsourcing",
    rigor: "strategic",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "responses",
    currentStageLabel: "Responses",
    openAlerts: 0,
    owner: "Jordan Blake",
    decisionOwner: "Jordan Blake",
    createdByUserId: null,
    agingDays: 4,
    blocker: null,
    nextAction: "Review responses",
    isAtRisk: false,
    valueAtStakeUsd: 12_000_000,
    projectedValueUsd: 12_000_000,
    realizedValueUsd: 0,
    nextDecision: "Confirm shortlist",
    classifiedCategory: null,
    ...over,
  };
}

function makeGovernedSnapshot(
  over: Partial<SourceV4WorkspaceSnapshot> = {},
): SourceV4WorkspaceSnapshot {
  return {
    datasetId: "test-source",
    datasetVersion: "v4",
    datasetLabel: "Test Source",
    analyticsProvider: "CubeSourceProvider",
    activeLoadRunId: "runtime-layer-refresh-test",
    asOfDateIso: "2026-06-30T00:00:00Z",
    availability: [],
    contextCoverage: {
      vendors: 65,
      contracts: 65,
      annualValue: 778_350_000,
      scopeRows: 107,
      invoiceLines: 0,
      saasUsageRows: 0,
      cloudRows: 0,
      performanceRows: 0,
    },
    scopeConfidence: {
      rowCount: 107,
      explicitScopeCount: 43,
      inferredScopeCount: 64,
    },
    executivePortfolio: {
      contractCount: 65,
      annualValue: 778_350_000,
      totalCommittedValue: 0,
      autoRenewCount: 0,
      notice90DayCount: 0,
    },
    spendConsumption: {
      rowCount: 65,
      invoiceLines: 0,
      actualSpend: 778_350_000,
      committedAmount: 778_350_000,
      offContractSpend: 0,
    },
    performanceCredits: {
      rowCount: 0,
      breachCount: 0,
      creditCalculated: 0,
      creditClaimed: 0,
      creditRecovered: 0,
      unclaimedCredit: 0,
    },
    aiUsageValueProof: {
      rowCount: 0,
      assignedSeats: 0,
      activeUsers: 0,
      actualCost: 0,
      claimableRows: 0,
      topProducts: [],
    },
    cloudOptimization: {
      rowCount: 0,
      actualCost: 0,
      amortizedCost: 0,
      overageAmount: 0,
      topServices: [],
    },
    workforceRateCards: {
      rowCount: 0,
      hours: 0,
      averageBillRate: null,
      unapprovedVarianceCount: 0,
    },
    sourcingEvents: {
      rowCount: 0,
      normalizedCost: 0,
      lineItemCost: 0,
      averageWeightedScore: null,
    },
    topVendors: [],
    ...over,
  };
}

describe("SourcePortfolioBookPage — honesty invariants", () => {
  it("renders the header and the four stat cards from a real fixture", () => {
    render(
      <SourcePortfolioBookPage
        events={[makeEvent({})]}
        tenantName="Lakeshore"
      />,
    );

    expect(screen.getByText("Your sourcing book")).toBeInTheDocument();
    // All four headline cards are present.
    expect(screen.getByTestId("source-book-stat-active")).toBeInTheDocument();
    expect(screen.getByTestId("source-book-stat-renewals")).toBeInTheDocument();
    expect(screen.getByTestId("source-book-stat-spend")).toBeInTheDocument();
    expect(
      screen.getByTestId("source-book-stat-value_captured"),
    ).toBeInTheDocument();

    // Active count is the REAL open-event count.
    const active = screen.getByTestId("source-book-stat-active");
    expect(active).toHaveTextContent("1");
    // Spend under management is the REAL value-at-stake aggregate ($12M).
    expect(screen.getByTestId("source-book-stat-spend")).toHaveTextContent(
      "$12.0M",
    );
    expect(screen.getByTestId("source-book-optimize")).toHaveAttribute(
      "href",
      "/source/optimize",
    );
  });

  it("renders an events-in-flight card with an 11-dot stage rail", () => {
    render(
      <SourcePortfolioBookPage
        events={[makeEvent({})]}
        tenantName="Lakeshore"
      />,
    );

    const card = screen.getByTestId("source-book-flight-card-AMS-2026");
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent("AMS Consolidation 2026");
    // Stage rail exposes the accessible "Stage X of 11" label (responses = 4th).
    expect(screen.getByLabelText("Stage 4 of 11")).toBeInTheDocument();
    // Projected value renders as a band with the v2-pending caveat, not a point.
    expect(card).toHaveTextContent(/–/);
    expect(card).toHaveTextContent(/v2 pending/i);
  });

  it("uses governed L4 contract rows for the portfolio financial headline when present", () => {
    render(
      <SourcePortfolioBookPage
        events={[makeEvent({ valueAtStakeUsd: 12_000_000 })]}
        tenantName="Airline Demo"
        governedSnapshot={makeGovernedSnapshot()}
      />,
    );

    const spend = screen.getByTestId("source-book-stat-spend");
    expect(spend).toHaveTextContent("Governed contract base");
    expect(spend).toHaveTextContent("$778.4M");
    expect(spend).toHaveTextContent("65 source.contract_360 rows");
    expect(spend).toHaveTextContent("65 vendors");
    expect(spend).not.toHaveTextContent("$12.0M");
  });

  it("renders renegotiation events on the optimization journey, not the RFP journey", () => {
    render(
      <SourcePortfolioBookPage
        events={[
          makeEvent({
            code: "SKYH-CTR090-COMMERCIAL-RENEGOTIATION-2026-20F02DAE",
            name: "CTR-090 commercial renegotiation — benchmarking rights",
            currentStageKey: "responses",
            currentStageLabel: "Responses",
          }),
        ]}
        tenantName="Airline Demo"
      />,
    );

    const card = screen.getByTestId(
      "source-book-flight-card-SKYH-CTR090-COMMERCIAL-RENEGOTIATION-2026-20F02DAE",
    );
    expect(card).toHaveTextContent("Optimization");
    expect(card).toHaveTextContent("Now at Commercial Baseline · step 3 of 7");
    expect(screen.getByLabelText("Stage 3 of 7")).toBeInTheDocument();
    expect(card).not.toHaveTextContent("Responses");
    expect(screen.queryByLabelText("Stage 4 of 11")).not.toBeInTheDocument();
  });

  it("renders honest empty states where there is NO substrate backing", () => {
    // Empty portfolio: no events, nothing realized, no renewal substrate.
    render(<SourcePortfolioBookPage events={[]} tenantName="Lakeshore" />);

    // Renewals card and value-captured card show the em-dash placeholder, never
    // a fabricated number.
    expect(screen.getByTestId("source-book-stat-renewals")).toHaveTextContent(
      "—",
    );
    expect(
      screen.getByTestId("source-book-stat-value_captured"),
    ).toHaveTextContent("—");

    // Events-in-flight and renewals-on-the-clock render their empty states.
    expect(screen.getByTestId("source-book-flight-empty")).toBeInTheDocument();
    expect(
      screen.getByTestId("source-book-renewals-empty"),
    ).toBeInTheDocument();

    // The proactive aVa nudge is omitted entirely (no renewal data to drive it).
    expect(screen.queryByTestId("source-book-nudge")).not.toBeInTheDocument();

    // No fabricated dollar figure anywhere on the empty page.
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
  });

  it("does not show value captured when nothing is realized (0 → empty, not $0)", () => {
    // realizedValueUsd is 0 for persisted rows — the card must NOT print "$0".
    render(
      <SourcePortfolioBookPage
        events={[makeEvent({ realizedValueUsd: 0 })]}
        tenantName="Lakeshore"
      />,
    );
    const captured = screen.getByTestId("source-book-stat-value_captured");
    expect(captured).toHaveTextContent("—");
    expect(captured).not.toHaveTextContent("$0");
  });
});
