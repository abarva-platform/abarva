/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "@/lib/source/constants";
import type { SourceStageKey, SourcingEventSummary } from "@/lib/source/types";
import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/source/events/evt-src57",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-src57" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

const EXPECTED_STAGE_MARKER: Partial<Record<SourceStageKey, string>> = {
  strategy: "Confirm strategy & sponsor",
  scope: "Provide the volumetrics",
  rfp: "Confirm RFP clause coverage",
  responses: "Confirm vendor response coverage",
  evaluation: "Confirm vendor bids for should-cost",
  pricing: "Confirm normalized supplier pricing",
  bafo: "Confirm BAFO concessions captured",
  executive_decision: "Confirm executive recommendation packet",
  selection: "Confirm committed value at award",
  transition: "Confirm transition go-live readiness",
  value: "Confirm realized value to date",
};

function makeEvent(stageKey: SourceStageKey): SourcingEventSummary {
  const stageLabel = SOURCE_STAGE_LABELS[stageKey];

  return {
    id: "evt-src57",
    code: "SRC57-SMOKE",
    name: "New Event Smoke Harness",
    accountName: "AbarVa QA",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "strategic",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: stageKey,
    currentStageLabel: stageLabel,
    openAlerts: 0,
    owner: "Sourcing lead",
    agingDays: 3,
    blocker: null,
    nextAction: `Continue ${stageLabel}`,
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 0,
    realizedValueUsd: 0,
    nextDecision: `${stageLabel} gate`,
  } as SourcingEventSummary;
}

function renderStage(stageKey: SourceStageKey) {
  return render(
    <SourceAnalyticsCanvas
      event={makeEvent(stageKey)}
      viewStage={stageKey}
      tenantName="AbarVa QA"
      stageView={undefined}
    />,
  );
}

describe("SourceAnalyticsCanvas New Event journey smoke", () => {
  afterEach(() => cleanup());

  it.each(SOURCE_STAGE_ORDER)(
    "renders the active workflow contract for %s",
    (stageKey) => {
      renderStage(stageKey);

      const stageLabel = SOURCE_STAGE_LABELS[stageKey];
      expect(
        screen.getByRole("heading", { name: stageLabel }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("source-analytics-canvas")).toBeInTheDocument();

      const rail = screen.getByTestId("source-shell-v2-rail");
      for (const journeyStage of SOURCE_STAGE_ORDER) {
        expect(
          within(rail).getByText(SOURCE_STAGE_LABELS[journeyStage]),
        ).toBeInTheDocument();
      }

      expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
      expect(
        screen.queryByTestId("source-shell-v2-files"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("source-shell-v2-intelligence"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("source-shell-v2-approvals"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("source-shell-v2-guidebook"),
      ).not.toBeInTheDocument();

      expect(
        screen.getByTestId("source-stage-header-readiness"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("source-journey-current-stage-status"),
      ).toBeInTheDocument();

      const evidenceTables = screen.getAllByTestId(
        "source-shell-evidence-ask-table",
      );
      expect(evidenceTables.length).toBeGreaterThan(0);
      expect(
        evidenceTables.map((table) => table.textContent).join(" "),
      ).toEqual(expect.stringContaining("Evidence item"));
      expect(
        evidenceTables.map((table) => table.textContent).join(" "),
      ).toEqual(expect.stringContaining("Required"));
      expect(
        evidenceTables.map((table) => table.textContent).join(" "),
      ).toEqual(expect.stringContaining("Next"));

      expect(
        screen.getByTestId("source-shell-active-step-needs"),
      ).toHaveTextContent(/what continue needs/i);
      expect(
        screen.getByTestId("source-shell-active-step-guide"),
      ).toHaveTextContent(/guidebook/i);
      expect(
        screen.getByTestId("source-shell-continue-guidance"),
      ).toBeInTheDocument();
      expect(EXPECTED_STAGE_MARKER[stageKey]).toBeDefined();
      expect(
        screen.getAllByText(EXPECTED_STAGE_MARKER[stageKey] as string).length,
      ).toBeGreaterThan(0);
    },
  );

  it("keeps supporting workspaces reachable without competing with the active step canvas", () => {
    renderStage("scope");

    fireEvent.click(screen.getByTestId("source-shell-workspace-files"));
    expect(screen.getByTestId("source-shell-v2-files")).toBeInTheDocument();
    expect(
      screen.queryByTestId("source-shell-v2-steps"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("source-shell-workspace-intelligence"));
    expect(
      screen.getByTestId("source-shell-v2-intelligence"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("source-shell-v2-files"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("source-shell-workspace-guidebook"));
    expect(screen.getByTestId("source-shell-v2-guidebook")).toBeInTheDocument();
    expect(
      screen.queryByTestId("source-shell-v2-intelligence"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("source-shell-workspace-approvals"));
    expect(screen.getByTestId("source-shell-v2-approvals")).toBeInTheDocument();
    expect(
      screen.queryByTestId("source-shell-v2-guidebook"),
    ).not.toBeInTheDocument();
  });
});
