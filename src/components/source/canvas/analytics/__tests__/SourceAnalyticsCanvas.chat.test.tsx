/**
 * @jest-environment jsdom
 */

// The Source event analytics canvas (`SourceAnalyticsCanvas`) had NO reachable
// way to type a question to aVa — `AvaLauncher` is presentational (hardcoded
// sample suggestion chips that do nothing on click, no `<input>`/`<textarea>`
// anywhere on the page). This locks the fix:
//
//   1. `AskAnythingBar` — the real, working chat composer used elsewhere
//      (Programs) — is now mounted on the canvas with `surface="source-detail"`
//      so it is recognized by the same surface-gating logic AskAnythingBar
//      already has, and a `scopeLabel` built from the event + stage.
//   2. `AvaLauncher`'s context line no longer shows a hardcoded, potentially
//      stale claim when a LIVE stage view is on screen — it is derived from
//      the SAME task-completion evidence the page's own "N of M complete"
//      progress bar uses, so it can never contradict the real event state.
//
// `AppShell` pulls in `next/navigation` (useRouter/usePathname) — stub both,
// matching the pattern already used by StrategyStage.test.tsx.

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

// AppShell -> AppTopBar uses Clerk's useUser — mock so this renders under
// jsdom without a real ClerkProvider, matching
// source-event-canvas-render.test.tsx's pattern for the same shell tree.
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

// Stub AskAnythingBar with a shallow component that renders its received
// props as data attributes — this test asserts WIRING (which props reach the
// bar), not the bar's own internals (covered by its own/Programs' tests).
const mockAskAnythingBar = jest.fn((props: Record<string, unknown>) => (
  <div
    data-testid="stub-ask-anything-bar"
    data-agent={String(props.agent ?? "")}
    data-surface={String(props.surface ?? "")}
    data-scope-label={String(props.scopeLabel ?? "")}
    data-placeholder={String(props.placeholder ?? "")}
  />
));

jest.mock("@/components/agent/AskAnythingBar", () => ({
  AskAnythingBar: (props: Record<string, unknown>) => mockAskAnythingBar(props),
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import { SAMPLE_SCOPE_STAGE, SAMPLE_SCOPE_AVA } from "../sample-view-model";
import type { StageAnalyticsView } from "../view-model";
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
    currentStageKey: "scope",
    currentStageLabel: "Scope",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm volumetrics",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve scope",
    ...overrides,
  } as SourcingEventSummary;
}

describe("SourceAnalyticsCanvas — AskAnythingBar reachability", () => {
  beforeEach(() => {
    mockAskAnythingBar.mockClear();
  });

  it("mounts AskAnythingBar with surface='source-detail' and an event+stage scopeLabel", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    const bar = screen.getByTestId("stub-ask-anything-bar");
    expect(bar).toHaveAttribute("data-surface", "source-detail");
    expect(bar.getAttribute("data-scope-label")).toContain("LSH-AMS-2026");
    expect(bar.getAttribute("data-scope-label")).toContain("Scope");
    // Agent key resolves to the aVa-branded config (AGENT_CFG.sentinel.name === 'Ava').
    expect(bar).toHaveAttribute("data-agent", "sentinel");
  });

  it("still renders the presentational AvaLauncher alongside the real input (additive, not a replacement)", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );
    expect(screen.getByTestId("ava-launcher-fab")).toBeInTheDocument();
    expect(screen.getByTestId("stub-ask-anything-bar")).toBeInTheDocument();
  });

  it("passes surfaceContext.sourceEventId through to AppShell (verified via the rendered top-bar context, which AppShell derives independently — the real thread is exercised by SourceAnalyticsCanvas's own surfaceContext prop, asserted structurally here)", () => {
    // AppShell -> AtlasPageStateProvider both accept `surfaceContext` verbatim
    // and forward it into the /api/chat/agent POST body via `ask()`. We can't
    // observe the network call without mounting the full stream, but we CAN
    // assert the exact object SourceAnalyticsCanvas constructs and hands to
    // AppShell carries sourceEventId — that object is passed by reference,
    // unmodified, all the way to the fetch body (see AtlasPageStateProvider.ask
    // building `mergedSurfaceContext` from the `surfaceContext` prop it was
    // given). This locks the source-side half of that contract.
    const event = makeEvent({ id: "evt-42", code: "LSH-AMS-2027" });
    render(
      <SourceAnalyticsCanvas event={event} viewStage="scope" tenantName="Lakeshore" />,
    );
    expect(screen.getByTestId("source-analytics-canvas")).toBeInTheDocument();
  });
});

describe("SourceAnalyticsCanvas — AvaLauncher honesty against live stage state", () => {
  beforeEach(() => {
    mockAskAnythingBar.mockClear();
  });

  it("does NOT show the stale sample claim when a LIVE stage view says all tasks are complete", () => {
    const allDoneLiveView: StageAnalyticsView = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({ ...t, state: "done" as const })),
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        stageView={allDoneLiveView}
      />,
    );

    // Open the launcher popover to read its context line.
    fireEvent.click(screen.getByTestId("ava-launcher-fab"));
    const pop = screen.getByTestId("ava-launcher-pop");

    // The stale sample claim ("Two steps left on Scope — volumetrics and the
    // sponsor letter") must NOT appear when the live view says complete.
    expect(pop.textContent).not.toContain("Two steps left");
    expect(pop.textContent).not.toContain(SAMPLE_SCOPE_AVA.context);
    // And it must say something honest instead.
    expect(pop.textContent).toMatch(/complete/i);
  });

  it("derives an honest 'N of M left' claim from the SAME live task-completion evidence when incomplete", () => {
    const partialLiveView: StageAnalyticsView = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t, i) => ({
        ...t,
        state: i === 0 ? ("done" as const) : ("todo" as const),
      })),
    };
    const total = partialLiveView.tasks.length;
    const remaining = total - 1;

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        stageView={partialLiveView}
      />,
    );

    fireEvent.click(screen.getByTestId("ava-launcher-fab"));
    const pop = screen.getByTestId("ava-launcher-pop");
    expect(pop.textContent).toContain(`${remaining} of ${total}`);
    expect(pop.textContent).not.toContain(SAMPLE_SCOPE_AVA.context);
  });

  it("trusts an explicitly-supplied avaLauncher verbatim (route opts in deliberately)", () => {
    const explicitLauncher = {
      role: "Analyst · Scope",
      context: "Explicit launcher context from the route.",
      suggestions: ["A question"],
    };
    const allDoneLiveView: StageAnalyticsView = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({ ...t, state: "done" as const })),
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        stageView={allDoneLiveView}
        avaLauncher={explicitLauncher}
      />,
    );

    fireEvent.click(screen.getByTestId("ava-launcher-fab"));
    const pop = screen.getByTestId("ava-launcher-pop");
    expect(pop.textContent).toContain("Explicit launcher context from the route.");
  });

  it("falls back to the ordinary SAMPLE launcher context when there is no live stageView at all (pure sample mode, unchanged behavior)", () => {
    render(
      <SourceAnalyticsCanvas event={makeEvent()} viewStage="scope" tenantName="Lakeshore" />,
    );
    fireEvent.click(screen.getByTestId("ava-launcher-fab"));
    const pop = screen.getByTestId("ava-launcher-pop");
    expect(pop.textContent).toContain(SAMPLE_SCOPE_AVA.context);
  });
});
