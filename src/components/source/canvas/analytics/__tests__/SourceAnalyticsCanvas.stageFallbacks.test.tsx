/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from "@/lib/source/constants";
import type { SourceStageKey, SourcingEventSummary } from "@/lib/source/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
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

const EXPECTED_STAGE_MARKER: Partial<Record<SourceStageKey, string>> = {
  strategy: "Confirm strategy & sponsor",
  scope: "Provide the volumetrics",
  rfp: "Confirm RFP clause coverage",
  responses: "Confirm vendor response coverage",
  evaluation: "Confirm vendor bids for should-cost",
  bafo: "Confirm BAFO concessions captured",
  selection: "Confirm committed value at award",
  value: "Confirm realized value to date",
};

const PLACEHOLDER_STAGES = new Set<SourceStageKey>([
  "pricing",
  "executive_decision",
  "transition",
]);

function makeEvent(): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "MERI-AMS-2026",
    name: "Healthcare Demo AMS",
    accountName: "Healthcare Demo",
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
    nextAction: "Provide the volumetrics",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve scope gate",
  } as SourcingEventSummary;
}

describe("SourceAnalyticsCanvas stage fallback mapping", () => {
  afterEach(() => cleanup());

  it.each(SOURCE_STAGE_ORDER)(
    "renders a stage-matched fallback for %s when no live stage view is available",
    (stageKey) => {
      render(
        <SourceAnalyticsCanvas
          event={makeEvent()}
          viewStage={stageKey}
          tenantName="Healthcare Demo"
          stageView={undefined}
        />,
      );

      const stageLabel = SOURCE_STAGE_LABELS[stageKey];
      expect(screen.getByRole("heading", { name: stageLabel })).toBeInTheDocument();

      if (PLACEHOLDER_STAGES.has(stageKey)) {
        expect(
          screen.getByText(
            `No illustrative preview has been built for ${stageLabel} yet. Live Source facts will render here when available; this placeholder is intentionally empty rather than showing another stage's work.`,
          ),
        ).toBeInTheDocument();
        expect(screen.getByText("No required steps are defined for this stage yet.")).toBeInTheDocument();
        expect(screen.queryByText("Provide the volumetrics")).not.toBeInTheDocument();
        return;
      }

      const expectedMarker = EXPECTED_STAGE_MARKER[stageKey];
      expect(expectedMarker).toBeDefined();
      expect(screen.getAllByText(expectedMarker as string).length).toBeGreaterThan(0);

      if (stageKey !== "scope") {
        expect(screen.queryByText("Provide the volumetrics")).not.toBeInTheDocument();
      }
    },
  );
});
