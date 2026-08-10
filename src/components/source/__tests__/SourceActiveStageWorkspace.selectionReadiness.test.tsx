/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { SourceActiveStageWorkspace } from "../SourceActiveStageWorkspace";
import type { SourceAgentMissionReport } from "@/lib/source/agent-mission-report";
import type { SourcingEventDetail } from "@/lib/source/types";

jest.mock("../SourceScopeStageWorkspace", () => ({
  SourceScopeStageWorkspace: () => (
    <div data-testid="source-scope-stage-workspace">Scope workspace</div>
  ),
}));

jest.mock("../SourceDecisionCanvasClient", () => ({
  SourceDecisionCanvasClient: () => (
    <div data-testid="source-decision-canvas">Decision canvas</div>
  ),
}));

function event(): SourcingEventDetail {
  return {
    id: "event-1",
    code: "EVENT-1",
    name: "Selection Readiness Event",
    accountName: "AbarVa Test",
    leadAgent: "Sentinel",
    archetype: "sourcing",
    rigor: "enhanced",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "selection",
    currentStageLabel: "Selection",
    openAlerts: 0,
    owner: "Procurement",
    decisionOwner: "CPO",
    createdByUserId: null,
    agingDays: 3,
    blocker: null,
    nextAction: "Hold selection review.",
    isAtRisk: false,
    valueAtStakeUsd: 12_000_000,
    projectedValueUsd: 12_000_000,
    realizedValueUsd: 0,
    nextDecision: "Confirm vendor selection posture.",
    synopsis: "Selection review test event.",
    problemStatement: "Confirm readiness for vendor selection review.",
    stages: [
      {
        key: "selection",
        label: "Selection",
        status: "active",
        summary: "Confirm vendor selection posture.",
        gate: {
          id: "gate-selection",
          label: "Selection gate",
          status: "ready",
          ownerRole: "CPO",
          requiredArtifacts: [],
          blocker: null,
        },
      },
    ],
    alerts: [],
    artifacts: [],
    scorecard: {
      decisionOwner: "CPO",
      reviewCadence: "Weekly",
      approvalState: "approved",
      criteria: [],
    },
    valueLedger: {
      updatedAt: "2026-08-10T12:00:00.000Z",
      projected: [],
      realized: [],
    },
    dataReadiness: [],
  };
}

const missionReport = {
  recommendedNextAction: "Hold selection review.",
} as SourceAgentMissionReport;

describe("SourceActiveStageWorkspace selection readiness", () => {
  it("surfaces vendor selection readiness on executive selection stages", () => {
    render(
      <SourceActiveStageWorkspace
        event={event()}
        missionReport={missionReport}
        missionPreviewMissions={[]}
      />,
    );

    expect(
      screen.getByRole("region", { name: /vendor selection readiness panel/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ready for selection review?")).toBeInTheDocument();
    expect(
      screen.getByText(/this panel does not finalize vendor selection/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("source-decision-canvas")).toBeInTheDocument();
  });
});
