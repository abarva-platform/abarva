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
  AtlasChatPanel: ({
    messages,
    workspace,
  }: {
    messages: Array<{ id: string }>;
    workspace: ReactNode;
  }) => (
    <div data-testid="atlas-shell" data-message-count={messages.length}>
      {workspace}
    </div>
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
  {
    initiativeId: "init-wealth",
    displayId: "AI-003",
    name: "Wealth Advisor Copilot Shadow Rollout",
    description: "Advisor copilot pilot with supervision and data-path review.",
    primaryCategoryId: "copilot",
    primaryCategoryName: "Advisor Copilot",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-governance",
    primaryGoalName: "firstcapital value realization",
    stage: "pilot",
    stageDetail: "Stalled",
    ownerName: "Nora Walsh",
    ownerTitle: "SVP Wealth Technology",
    ownerFunction: "Wealth",
    committedAnnualUsd: 700_000,
    committedTotalUsd: 700_000,
    measuredValueUsd: 120_000,
    statusFlag: "stalled",
    statusSummary:
      "KILL CANDIDATE: unapproved client-note data path and FINRA supervision gaps.",
    confidenceLevel: "HIGH",
    alignedCallout: true,
    alignedRationale:
      "Advisor-facing AI needs supervisory evidence before scale.",
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

function renderTower({
  vendors = VENDORS,
  substrateCounts = {
    initiatives: 3,
    vendors: 1,
    kpis: 8,
    decisions: 3,
    stakeholderNotes: 4,
    scenarios: 0,
  },
}: {
  vendors?: AIInitiativeVendorRow[];
  substrateCounts?: {
    initiatives: number;
    vendors: number;
    kpis: number;
    decisions: number;
    stakeholderNotes: number;
    scenarios: number;
  };
} = {}) {
  return render(
    <AiControlTowerPage
      tenantName="SkyHarbor Air"
      clientId="skyharbor"
      towerToday="2026-06-16"
      initiatives={INITIATIVES}
      vendors={vendors}
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
      substrateCounts={substrateCounts}
    />,
  );
}

describe("AiControlTowerPage", () => {
  it("places lens tabs below KPI dashboard and refreshes the active canvas without chat noise", () => {
    const { container } = renderTower();

    const evidenceTile = screen.getByText("Evidence posture");
    const agentsTab = screen.getByRole("button", { name: /agents/i });
    expect(
      evidenceTile.compareDocumentPosition(agentsTab) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.queryByText("Where Atlas will look first."),
    ).not.toBeInTheDocument();

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
    expect(container.querySelector("[data-message-count='0']")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /spend/i }));
    expect(
      screen.getByText("Which spend should be scaled, challenged, or stopped?"),
    ).toBeInTheDocument();
    expect(screen.getByText("ServiceNow")).toBeInTheDocument();
    expect(container.querySelector("[data-message-count='0']")).toBeTruthy();
  });

  it("keeps demo-critical Tower summaries aligned with the visible canvas", () => {
    renderTower({
      vendors: [],
      substrateCounts: {
        initiatives: 3,
        vendors: 0,
        kpis: 0,
        decisions: 0,
        stakeholderNotes: 0,
        scenarios: 0,
      },
    });

    expect(screen.getAllByText("spend feed not committed").length).toBeGreaterThan(0);
    expect(screen.queryByText("0 committed contract rows")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /risk/i }));
    expect(screen.getByText("KILL CANDIDATE: unapproved client-note data path and FINRA supervision gaps.")).toBeInTheDocument();
    expect(screen.getByText("risk, kill, contested, gap, or watch signals")).toBeInTheDocument();
    expect(screen.getByText("Watch items")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /initiatives/i }));
    expect(
      screen.getAllByText("Adoption, avoided work, quality guardrail").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("firstcapital value realization")).not.toBeInTheDocument();
  });

  it("lets executives inspect an individual initiative from the Tower lens", () => {
    renderTower();

    fireEvent.click(screen.getByRole("button", { name: /initiatives/i }));

    expect(
      screen.getByText("Which initiative do we need to understand in detail?"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/select initiative/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Claims ServiceNow Agent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Agent automation for claims triage."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Riya Patel · VP Operations/)).toBeInTheDocument();
    expect(
      screen.getByText(/\$1.2M committed · \$360K measured/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Usage is below business case."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/select initiative/i), {
      target: { value: "init-wealth" },
    });

    expect(
      screen.getByRole("heading", { name: "Wealth Advisor Copilot Shadow Rollout" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Advisor copilot pilot with supervision and data-path review."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nora Walsh · SVP Wealth Technology/)).toBeInTheDocument();
    expect(
      screen.getAllByText("Adoption, avoided work, quality guardrail").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("firstcapital value realization")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getAllByText("AI-001 · Claims ServiceNow Agent").find(
        (node) => node.tagName.toLowerCase() === "td",
      )!,
    );

    expect(
      screen.getByRole("heading", { name: "Claims ServiceNow Agent" }),
    ).toBeInTheDocument();
  });
});
