/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "@/lib/source/constants";
import { SOURCE_JOURNEYS } from "@/lib/source/sourcing-motion-journeys";
import type { SourceStageKey, SourcingEventSummary } from "@/lib/source/types";
import { SAMPLE_SCOPE_STAGE } from "../sample-view-model";

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

const PLACEHOLDER_STAGES = new Set<SourceStageKey>();

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
      expect(
        screen.getByRole("heading", { name: stageLabel }),
      ).toBeInTheDocument();

      if (PLACEHOLDER_STAGES.has(stageKey)) {
        expect(
          screen.getByText(
            `No illustrative preview has been built for ${stageLabel} yet. Live Source facts will render here when available; this placeholder is intentionally empty rather than showing another stage's work.`,
          ),
        ).toBeInTheDocument();
        expect(
          screen.getByText("No required steps are defined for this stage yet."),
        ).toBeInTheDocument();
        expect(
          screen.queryByText("Provide the volumetrics"),
        ).not.toBeInTheDocument();
        return;
      }

      const expectedMarker = EXPECTED_STAGE_MARKER[stageKey];
      expect(expectedMarker).toBeDefined();
      expect(
        screen.getAllByText(expectedMarker as string).length,
      ).toBeGreaterThan(0);

      if (stageKey !== "scope") {
        expect(
          screen.queryByText("Provide the volumetrics"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Sponsor commitment")).not.toBeInTheDocument();
      }
    },
  );

  it("renders the contract optimization journey without RFP checkpoints", () => {
    render(
      <SourceAnalyticsCanvas
        event={{
          ...makeEvent(),
          archetype: "Contract Renewal / Renegotiation",
          currentStageKey: "pricing",
          currentStageLabel: "Commercial Baseline",
        }}
        viewStage="pricing"
        tenantName="Healthcare Demo"
        stageView={undefined}
        journey={SOURCE_JOURNEYS.contract_optimization}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Commercial Baseline" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Negotiation Plan").length).toBeGreaterThan(0);
    expect(screen.queryByText("RFP")).not.toBeInTheDocument();
    expect(screen.queryByText("Responses")).not.toBeInTheDocument();
    expect(screen.queryByText("Evaluation")).not.toBeInTheDocument();
    expect(screen.queryByText("Selection")).not.toBeInTheDocument();
    const rail = screen.getByTestId("source-shell-v2-rail");
    expect(rail).toHaveTextContent("aVa guides Strategy through Agreement");
    expect(rail).not.toHaveTextContent(/steps 1/i);
  });

  it("shows the active-step parser template link when live payload omits factTemplateCode", () => {
    const scopeWithoutTemplateCode = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) =>
        task.id === "scope.volumetrics"
          ? { ...task, factTemplateCode: undefined }
          : task,
      ),
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Healthcare Demo"
        stageView={scopeWithoutTemplateCode}
      />,
    );

    const link = screen.getByTestId("task-template-download");
    expect(link).toHaveTextContent("Download CSV/XLSX template");
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/source/evt-1/evidence/EVID-SRC-SCOPE-TICKET-HISTORY/template",
    );
  });
});
