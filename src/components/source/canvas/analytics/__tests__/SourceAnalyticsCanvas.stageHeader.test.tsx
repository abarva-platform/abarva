/**
 * @jest-environment jsdom
 */

// Regression test for a real bug: the stage header hardcoded "· aVa" for
// every stage, contradicting the canvas's own rail note ("aVa guides steps
// 1-9 · Atlas takes over for Transition & Value") for the Transition and
// Value stages. The header must track the same aVa/Atlas split the rail
// note already states.

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import type { SourcingEventSummary } from "@/lib/source/types";

function makeEvent(
  overrides: Partial<SourcingEventSummary> = {},
): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "LSH-AMS-2026",
    name: "Lakeshore AMS Renewal",
    accountName: "Lakeshore",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "strategy",
    currentStageLabel: "Strategy",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm mandate",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve strategy gate",
    ...overrides,
  } as SourcingEventSummary;
}

describe("SourceAnalyticsCanvas — stage header lead-agent label", () => {
  it("shows aVa for an early stage (Strategy)", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
      />,
    );
    expect(screen.getByText(/Stage 01 · aVa/)).toBeInTheDocument();
  });

  it("keeps the stage title compact for approval and workflow screens", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Strategy" })).toHaveStyle({
      fontSize: "24px",
      lineHeight: "1.12",
      letterSpacing: "0",
    });
  });

  it("shows Atlas for Value — not the hardcoded aVa the rail note contradicts", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent({
          currentStageKey: "value",
          currentStageLabel: "Value",
        })}
        viewStage="value"
        tenantName="Lakeshore"
      />,
    );
    expect(screen.getByText(/Stage 11 · Atlas/)).toBeInTheDocument();
  });
});
