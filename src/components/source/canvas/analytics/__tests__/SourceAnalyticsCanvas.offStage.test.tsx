/**
 * @jest-environment jsdom
 */

// A user can open any stage of a Source event by URL (`?stage=`), including a
// stage the event has not reached and one it has already left. The canvas used
// to say so: `UniversalCanvasShell` rendered a banner gated on
// `viewStage !== event.currentStageKey`. The three-column rebuild dropped it
// and put nothing in its place, so drafting in a future stage now looks
// identical to drafting in the live one.
//
// These cases drive the real `SourceAnalyticsCanvas` — the component the
// `/source/events/[eventId]` route mounts — rather than asserting on source
// text, so a control that stops rendering fails them.

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

const NOTICE = "source-canvas-off-stage-notice";

function makeEvent(
  overrides: Partial<SourcingEventSummary> = {},
): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "EVT-AMS-2026",
    name: "Managed services renewal",
    accountName: "Example Holdings",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "scope",
    currentStageLabel: "Scope",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm mandate",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve scope gate",
    ...overrides,
  } as SourcingEventSummary;
}

describe("SourceAnalyticsCanvas — off-stage work is labelled", () => {
  it("states that a stage the event has not reached is off-stage", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="evaluation"
        tenantName="Example Holdings"
      />,
    );

    const notice = screen.getByTestId(NOTICE);
    expect(notice).toBeInTheDocument();
    // It has to name where the reader is and where the event is; a bare
    // "off-stage" tells them nothing actionable.
    expect(notice).toHaveTextContent(/Evaluation/);
    expect(notice).toHaveTextContent(/Scope/);
    expect(notice).toHaveTextContent(/not reached|has not reached|ahead/i);
  });

  it("states that a stage the event has already left is off-stage", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Example Holdings"
      />,
    );

    const notice = screen.getByTestId(NOTICE);
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/Strategy/);
    expect(notice).toHaveTextContent(/Scope/);
    expect(notice).toHaveTextContent(/moved on|already|behind|past/i);
  });

  it("distinguishes the two directions rather than showing one generic notice", () => {
    const { unmount } = render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="evaluation"
        tenantName="Example Holdings"
      />,
    );
    const ahead = screen.getByTestId(NOTICE).textContent ?? "";
    unmount();

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Example Holdings"
      />,
    );
    const behind = screen.getByTestId(NOTICE).textContent ?? "";

    expect(ahead).not.toEqual(behind);
  });

  // Guardrail. The cheapest wrong fix is a notice that always renders, which
  // would label the live stage as off-stage on every ordinary visit.
  it("says nothing when the viewed stage is the event's current stage", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Example Holdings"
      />,
    );

    expect(screen.queryByTestId(NOTICE)).not.toBeInTheDocument();
  });

  // Guardrail. The stage header renders only in the "steps" workspace, so a
  // notice placed inside it would be absent on exactly the panes where a user
  // uploads evidence and works approvals off-stage.
  it("labels off-stage work on a non-steps workspace too", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="evaluation"
        tenantName="Example Holdings"
        initialWorkspace="approvals"
      />,
    );

    expect(screen.getByTestId(NOTICE)).toBeInTheDocument();
  });
});
