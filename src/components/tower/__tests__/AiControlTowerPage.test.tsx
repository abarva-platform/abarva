/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { AiControlTowerPage } from "../AiControlTowerPage";
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from "@/lib/admin/ai-initiatives/queries";

jest.mock("@/components/atlas/AtlasChatPanel", () => ({
  AtlasChatPanel: ({ workspace }: { workspace: ReactNode }) => (
    <div data-testid="atlas-shell">{workspace}</div>
  ),
}));

const INITIATIVES: AIInitiative[] = [
  {
    initiativeId: "init-agent",
    displayId: "AI-001",
    name: "Claims ServiceNow Agent",
    description: "Agent automation for claims triage.",
    primaryCategoryId: "agent",
    primaryCategoryName: "Workflow Agent",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-productivity",
    primaryGoalName: "Operations productivity",
    stage: "pilot",
    stageDetail: "Claims pilot",
    ownerName: "Riya Patel",
    ownerTitle: "VP Operations",
    ownerFunction: "Operations",
    committedAnnualUsd: 1_200_000,
    committedTotalUsd: 1_200_000,
    measuredValueUsd: 360_000,
    statusFlag: "adoption_gap",
    statusSummary: "Usage is below business case.",
    confidenceLevel: "MED",
    alignedCallout: true,
    alignedRationale: "Aligned to operations productivity.",
    loadedViaTemplate: "synthetic",
  },
  {
    initiativeId: "init-copilot",
    displayId: "AI-002",
    name: "Finance Copilot Rollout",
    description: "Finance analyst productivity uplift.",
    primaryCategoryId: "copilot",
    primaryCategoryName: "Copilot",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-value",
    primaryGoalName: "Financial planning productivity",
    stage: "scaled",
    stageDetail: "Scaled",
    ownerName: "Maya Chen",
    ownerTitle: "CFO delegate",
    ownerFunction: "Finance",
    committedAnnualUsd: 900_000,
    committedTotalUsd: 900_000,
    measuredValueUsd: 840_000,
    statusFlag: "healthy",
    statusSummary: "Measured value is on track.",
    confidenceLevel: "HIGH",
    alignedCallout: true,
    alignedRationale: "Aligned to planning cycle reduction.",
    loadedViaTemplate: "synthetic",
  },
];

const VENDORS: AIInitiativeVendorRow[] = [
  {
    vendorId: "vendor-servicenow",
    initiativeId: "init-agent",
    initiativeDisplayId: "AI-001",
    initiativeName: "Claims ServiceNow Agent",
    vendorName: "ServiceNow",
    contractValueUsd: 2_400_000,
    renewalDate: "2099-01-01",
    financialHealth: "watch",
  },
];

function renderTower() {
  return render(
    <AiControlTowerPage
      tenantName="SkyHarbor Air"
      clientId="skyharbor"
      towerToday="2026-06-16"
      initiatives={INITIATIVES}
      vendors={VENDORS}
      bandMetrics={{
        metrics: [],
        isEmpty: false,
        deterministicSeed: true,
      }}
      pressuresView={{
        cards: [],
        totalActive: 0,
        demandingDecisions: 0,
        sectionHeadline: "No pressure headline",
        isEmpty: false,
        emptyHint: null,
        deterministicSeed: true,
      }}
      substrateCounts={{
        initiatives: 2,
        vendors: 1,
        kpis: 8,
        decisions: 3,
        stakeholderNotes: 4,
        scenarios: 0,
      }}
    />,
  );
}

describe("AiControlTowerPage", () => {
  it("places lens tabs below the dashboard and refreshes the active canvas on click", () => {
    renderTower();

    const focusListTitle = screen.getByText("Where Atlas will look first.");
    const agentsTab = screen.getByRole("button", { name: /agents/i });
    expect(
      focusListTitle.compareDocumentPosition(agentsTab) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      screen.getByText("Which AI investments are converting into value?"),
    ).toBeInTheDocument();

    fireEvent.click(agentsTab);
    expect(
      screen.getByText(
        "Which agents are resolving work, not just creating usage?",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("resolution and exception rate required").length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /spend/i }));
    expect(
      screen.getByText("Which spend should be scaled, challenged, or stopped?"),
    ).toBeInTheDocument();
    expect(screen.getByText("ServiceNow")).toBeInTheDocument();
  });
});
