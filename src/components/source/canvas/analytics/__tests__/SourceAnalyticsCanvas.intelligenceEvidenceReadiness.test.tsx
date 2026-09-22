/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/source/events/evt-value",
  useSearchParams: () =>
    new URLSearchParams("stage=value&workspace=intelligence"),
  useParams: () => ({ eventId: "evt-value" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

jest.mock("@/components/agent/AskAnythingBar", () => ({
  AskAnythingBar: () => null,
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import { SAMPLE_VALUE_STAGE } from "../sample-view-model";
import type { StepInsightView } from "../view-model";
import type { SourcingEventSummary } from "@/lib/source/types";

const EVENT: SourcingEventSummary = {
  id: "evt-value",
  code: "SRC-VALUE-2026",
  name: "Value realization review",
  accountName: "Demo Client",
  leadAgent: "Sentinel",
  archetype: "Managed Services",
  rigor: "strategic",
  status: "completed",
  statusLabel: "Completed",
  priority: "high",
  currentStageKey: "value",
  currentStageLabel: "Value",
  openAlerts: 0,
  owner: "Value realization lead",
  decisionOwner: "Finance owner",
  agingDays: 0,
  blocker: null,
  nextAction: "Review value evidence",
  isAtRisk: false,
  valueAtStakeUsd: 8_000_000,
  projectedValueUsd: 1_000_000,
  realizedValueUsd: 0,
  nextDecision: "Close value proof",
};

const VALUE_INSIGHT: StepInsightView = {
  kind: "value_realization",
  provenance: "live",
  headline: "Computed committed-value bands remain visible while proof is open.",
  points: [],
  bars: [],
  isModel: false,
  flipFact: "Finance-confirmed realized-value evidence",
  bestPractice: [],
  benchmark: "No benchmark claim is required for this regression.",
  downstreamImpact: "Evidence gaps must remain visible beside the calculation.",
};

describe("Source Intelligence governed evidence readiness", () => {
  it("names Value evidence gaps and the Files action without erasing the computed insight", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="value"
        tenantName="Demo Client"
        stageView={{
          ...SAMPLE_VALUE_STAGE,
          tasks: SAMPLE_VALUE_STAGE.tasks.map((task) => ({
            ...task,
            state: "done" as const,
            evidenceComplete: true,
          })),
        }}
        stepInsight={VALUE_INSIGHT}
        evidenceStates={[]}
        approvalLedger={[
          {
            stageKey: "value",
            stageLabel: "Value",
            index: 11,
            state: "approved",
            approverName: "Recorded reviewer",
            approvedAtIso: "2026-09-01T00:00:00.000Z",
            authorizationNote: "Historical approval record.",
            approverRationale: null,
          },
        ]}
        initialWorkspace="intelligence"
      />,
    );

    const brief = screen.getByTestId("source-shell-intelligence-readiness");
    expect(brief).toHaveTextContent("0 of 3 required evidence items ready");
    expect(brief).toHaveTextContent("Benefit owner attestation");
    expect(brief).toHaveTextContent("Finance-confirmed realized value");
    expect(brief).toHaveTextContent("Invoice realization tracking");
    expect(brief).toHaveTextContent("Open Files and load or review required evidence");
    expect(brief).not.toHaveTextContent("No visible gaps");
    expect(brief).not.toHaveTextContent("No further approval required");

    expect(within(brief).getByText("Stage insight produced")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Computed committed-value bands remain visible while proof is open.",
      ),
    ).toBeInTheDocument();
  });
});
