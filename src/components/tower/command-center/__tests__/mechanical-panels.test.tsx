/**
 * @jest-environment jsdom
 */

/**
 * Mechanical panels are ports of approved design slots, not ports of the design's sample data.
 * Each panel binds to the command-center view model and withdraws findings when the loaded rows do
 * not support the design's static narrative.
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import type {
  TowerActionView,
  TowerAiView,
  TowerCommandCenterView,
  TowerEvidenceGapView,
  TowerProgramView,
} from "@/lib/tower/command-center/types";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { BudgetDomainPanel } from "../views/BudgetDomainPanel";
import { BudgetShapePanel } from "../views/BudgetShapePanel";
import {
  AiPortfolioContractView,
  EvidenceActionsContractView,
} from "../views/ContractTabs";
import { FoundationsPanel } from "../views/FoundationsPanel";
import { InitiativesDistributionPanel } from "../views/InitiativesDistributionPanel";
import { InitiativesTablePanel } from "../views/InitiativesTablePanel";
import { QueueOwnerPanel } from "../views/QueueOwnerPanel";
import { ToolsTablePanel } from "../views/ToolsTablePanel";
import { ToolsVendorPanel } from "../views/ToolsVendorPanel";

jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={900} height={320}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

const M = 1_000_000;

function base(): TowerCommandCenterView {
  return buildTowerCommandCenterView(designFixtureMart(), {
    tenantName: "Fixture Tenant",
  })!;
}

function initiative(overrides: Partial<TowerAiView> = {}): TowerAiView {
  const sample = base().allInitiatives[0];
  return {
    ...sample,
    n: 1,
    id: "UC-A",
    name: "Claims cycle automation",
    originalItemKind: "funded_program",
    kind: "funded",
    displayBucket: "funded",
    category: "Operations",
    vendor: "Vendor Alpha",
    system: "Claims platform",
    readinessScore: 62,
    readinessScoreLoaded: true,
    riskScore: 38,
    riskScoreLoaded: true,
    gatingConstraint: "Usage-to-value support",
    confidenceLevel: "Medium",
    businessValueType: "Cost reduction",
    financeStatus: "sponsor_claimed",
    costToBuildLowUsd: null,
    costToBuildHighUsd: null,
    controlBlocker: "Policy review",
    sponsorRole: "Operations sponsor",
    aiSpendUsd: 5 * M,
    promisedUsd: 18 * M,
    promisedBenefitLoaded: true,
    financeValidatedUsd: 0,
    posture: "Fix",
    usageHeadline: null,
    usageBars: [],
    note: null,
    sourceFile: null,
    ...overrides,
  };
}

function program(overrides: Partial<TowerProgramView> = {}): TowerProgramView {
  const sample = base().programs[0];
  return {
    ...sample,
    id: "P-A",
    name: "Claims modernization",
    functionLabel: "Operations",
    fundedUsd: 9 * M,
    fundedAmountUsd: 9 * M,
    promisedUsd: 30 * M,
    promisedBenefitLoaded: true,
    usageSupportedUsd: 0,
    usageStatus: "none",
    ...overrides,
  };
}

function viewWith({
  allInitiatives = [initiative()],
  programs = [program()],
  actions,
  gaps,
  pipelineGaps,
  evidenceFacts,
  summary = {},
}: {
  allInitiatives?: readonly TowerAiView[];
  programs?: readonly TowerProgramView[];
  actions?: readonly TowerActionView[];
  gaps?: readonly TowerEvidenceGapView[];
  pipelineGaps?: readonly TowerEvidenceGapView[];
  evidenceFacts?: TowerCommandCenterView["evidenceFacts"];
  summary?: Partial<TowerCommandCenterView["summary"]>;
} = {}): TowerCommandCenterView {
  const view = base();
  return {
    ...view,
    allInitiatives,
    ai: allInitiatives.slice(0, 10),
    candidates: [],
    programs,
    actions: actions ?? view.actions,
    gaps: gaps ?? view.gaps,
    pipelineGaps: pipelineGaps ?? view.pipelineGaps,
    evidenceFacts: evidenceFacts ?? view.evidenceFacts,
    summary: {
      ...view.summary,
      budgetUsd: 80 * M,
      runUsd: 30 * M,
      changeUsd: 50 * M,
      approvedInvestmentUsd: 80 * M,
      aiAttributedInitiativeSpendUsd: 15 * M,
      aiTaggedUsd: 16 * M,
      ...summary,
    },
  };
}

function renderAll(view: TowerCommandCenterView) {
  render(
    <>
      <BudgetDomainPanel view={view} />
      <BudgetShapePanel view={view} />
      <InitiativesTablePanel view={view} />
      <InitiativesDistributionPanel view={view} />
      <ToolsTablePanel view={view} />
      <ToolsVendorPanel view={view} />
      <QueueOwnerPanel view={view} />
      <FoundationsPanel view={view} />
    </>,
  );
}

describe("mechanical Tower Command Center panels", () => {
  it("renders no figure from the design's sample literals", () => {
    const rows = [
      initiative({ id: "UC-A", name: "Claims cycle automation", aiSpendUsd: 5 * M, promisedUsd: 18 * M }),
      initiative({ id: "UC-B", name: "Call center guidance", aiSpendUsd: 6 * M, promisedUsd: 24 * M, category: "Member services" }),
      initiative({ id: "UC-C", name: "Data foundation", kind: "platform", displayBucket: "platform", aiSpendUsd: 7 * M, promisedUsd: 0 }),
    ];

    renderAll(
      viewWith({
        allInitiatives: rows,
        programs: [
          program({ id: "P-A", functionLabel: "Operations", fundedUsd: 9 * M, fundedAmountUsd: 9 * M }),
          program({ id: "P-B", functionLabel: "Data", fundedUsd: 8 * M, fundedAmountUsd: 8 * M }),
        ],
      }),
    );

    const text = document.body.textContent ?? "";
    for (const literal of ["$1.05B", "$211.8M", "$677.8M", "$13.1M"]) {
      expect(text).not.toContain(literal);
    }
    expect(text).not.toMatch(/\b42\b/);
    expect(text).not.toMatch(/\b13\b/);
  });

  it("renders absence as a gap instead of substituting zero", () => {
    renderAll(
      viewWith({
        allInitiatives: [
          initiative({
            id: "UC-GAP",
            sponsorRole: null,
            businessValueType: null,
            category: null,
            vendor: null,
            promisedBenefitLoaded: false,
            promisedUsd: 0,
            financeValidatedUsd: 0,
            usageHeadline: "Usage evidence exists",
            usageBars: [],
          }),
        ],
        programs: [],
        summary: {
          budgetUsd: null,
          runUsd: null,
          changeUsd: null,
          aiAttributedInitiativeSpendUsd: 0,
        },
      }),
    );

    const text = document.body.textContent ?? "";
    expect(text).toContain("Not loaded");
    expect(text).toContain("attributed AI investment or change budget is not loaded");
    // "cases", not "initiatives": the queue counts business cases, and a tool rollout carries a
    // business owner without being one.
    expect(text).toContain("1 of 1 cases have no sponsor loaded");
    expect(text).not.toContain("0 of 0");
    expect(text).not.toContain("0% vs");
  });

  it("uses the uncapped initiative collection for portfolio tables", () => {
    const allInitiatives = Array.from({ length: 12 }, (_, i) =>
      initiative({
        n: i + 1,
        id: `UC-${i + 1}`,
        name: `Portfolio row ${i + 1}`,
        aiSpendUsd: (i + 1) * M,
      }),
    );

    render(<InitiativesTablePanel view={viewWith({ allInitiatives })} />);

    expect(screen.getByText("12 of 12 shown")).toBeInTheDocument();
    expect(screen.getByText("Portfolio row 12")).toBeInTheDocument();
  });

  it("keeps the initiatives table sortable and filterable", () => {
    render(
      <InitiativesTablePanel
        view={viewWith({
          allInitiatives: [
            initiative({ id: "UC-FUND", name: "Funded case", kind: "funded", aiSpendUsd: 2 * M }),
            initiative({ id: "UC-CAND", name: "Candidate case", kind: "candidate", aiSpendUsd: 9 * M }),
          ],
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Candidate" }));
    expect(screen.getByText("1 of 2 shown")).toBeInTheDocument();
    expect(screen.getByText("Candidate case")).toBeInTheDocument();
    expect(screen.queryByText("Funded case")).not.toBeInTheDocument();
  });

  it("surfaces case tags and opens initiative details from the simple table", () => {
    const onOpenAi = jest.fn();
    render(
      <InitiativesTablePanel
        view={viewWith({
          allInitiatives: [
            initiative({
              businessValueType: "Cost reduction",
              category: "Clinical / Epic",
              gatingConstraint: "Usage-to-value support",
            }),
          ],
        })}
        onOpenAi={onOpenAi}
      />,
    );

    expect(screen.getByText("Cost reduction")).toBeInTheDocument();
    expect(screen.getByText("Clinical / Epic")).toBeInTheDocument();
    expect(screen.getByText("Usage-to-value support")).toHaveAttribute(
      "title",
      expect.stringContaining("mapped to the value claim"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Claims cycle automation" }));
    expect(onOpenAi).toHaveBeenCalledWith(1);
  });

  it("withdraws distribution claims when classifications are missing", () => {
    render(
      <InitiativesDistributionPanel
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "UC-MISS",
              businessValueType: null,
              category: null,
            }),
          ],
        })}
      />,
    );

    expect(document.body.textContent).toMatch(/distribution is only partially loaded/);
    expect(document.body.textContent).not.toMatch(/leads value type/);
  });

  it("does not treat missing control blockers as tool clearance", () => {
    render(
      <ToolsVendorPanel
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "TOOL-A",
              vendor: "Vendor Alpha",
              controlBlocker: null,
              usageHeadline: "Usage loaded",
              usageBars: [{ label: "Adoption", valueText: "75%", pct: 75, tone: "teal" }],
            }),
          ],
        })}
      />,
    );

    expect(document.body.textContent).toContain("does not mean the tools are clear");
    expect(document.body.textContent).toContain("Not loaded");
  });

  it("keeps business cases out of the top-level rollouts table", () => {
    render(
      <ToolsTablePanel
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "BC-USES-TOOL",
              name: "Business case with usage",
              sourceFile: "22_ai_business_cases.csv",
              usageHeadline: "Usage evidence exists",
              usageBars: [
                { label: "Adoption", valueText: "75%", pct: 75, tone: "teal" },
              ],
              adoptionTargetPct: 80,
            }),
            initiative({
              id: "TOOL-REAL",
              name: "Actual tool rollout",
              sourceFile: "23_ai_tool_rollout.csv",
              usageHeadline: "Usage evidence exists",
              usageBars: [
                { label: "Adoption", valueText: "55%", pct: 55, tone: "amber" },
              ],
              adoptionTargetPct: 70,
            }),
          ],
        })}
      />,
    );

    const text = document.body.textContent ?? "";
    expect(text).toContain("1 of 1 rollouts sit below their own adoption target.");
    expect(text).toContain("Actual tool rollout");
    expect(text).not.toContain("Business case with usage");
  });

  it("opens tool rollout details and explains control blockers in place", () => {
    const onOpenAi = jest.fn();
    render(
      <ToolsTablePanel
        view={viewWith({
          allInitiatives: [
            initiative({
              n: 7,
              id: "TOOL-SOX",
              name: "Power BI Copilot",
              sourceFile: "23_ai_tool_rollout.csv",
              usageHeadline: "Usage evidence exists",
              usageBars: [
                { label: "Adoption", valueText: "30%", pct: 30, tone: "amber" },
              ],
              adoptionTargetPct: 46,
              controlBlocker: "SOX evidence",
              controlBlockerReviewed: true,
            }),
          ],
        })}
        onOpenAi={onOpenAi}
      />,
    );

    expect(screen.getByText("SOX evidence")).toHaveAttribute(
      "title",
      expect.stringContaining("financial reporting"),
    );
    fireEvent.doubleClick(screen.getByTitle("Double-click to open tool details"));
    expect(onOpenAi).toHaveBeenCalledWith(7);
  });

  it("does not call foundations no-value when sponsor-stated value is loaded", () => {
    render(
      <FoundationsPanel
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "FOUND-A",
              name: "Enterprise AI foundation",
              kind: "platform",
              displayBucket: "platform",
              category: "Platform foundation",
              promisedBenefitLoaded: true,
              promisedUsd: 20 * M,
            }),
          ],
        })}
      />,
    );

    expect(document.body.textContent).toContain("does not call the foundation portfolio no-value");
    expect(document.body.textContent).not.toContain("carries no sponsor-stated value.");
  });

  it("does not invent an owner proof queue when loaded items are already validated", () => {
    render(
      <QueueOwnerPanel
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "UC-DONE",
              financeStatus: "finance_validated_actual",
              financeValidatedUsd: 18 * M,
            }),
          ],
        })}
      />,
    );

    expect(document.body.textContent).toContain("No open proof queue is derived");
    expect(document.body.textContent).not.toContain("largest open proof queue");
  });

  it("keeps the portfolio table from rendering risk as an independent score", () => {
    render(
      <AiPortfolioContractView
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "TOOL-GAP",
              name: "Coder rollout",
              usageHeadline: "Usage evidence exists",
              usageBars: [],
              promisedBenefitLoaded: false,
              promisedUsd: 0,
              financeValidatedUsd: 9 * M,
              readinessScore: 88,
              riskScore: 12,
              controlBlocker: null,
              controlBlockerReviewed: false,
            }),
          ],
          actions: [],
          gaps: [],
          pipelineGaps: [],
        })}
        onOpenAi={jest.fn()}
        onOpenAction={jest.fn()}
        onOpenGap={jest.fn()}
      />,
    );

    expect(screen.getByText("Control / gate")).toBeInTheDocument();
    expect(screen.queryByText("Risk")).not.toBeInTheDocument();
    expect(document.body.textContent).toContain("No benefit claim loaded");
    expect(document.body.textContent).toContain("Not loaded");
    expect(document.body.textContent).not.toContain("$9M finance-validated");
  });

  it("does not use readiness as a fallback adoption score", () => {
    render(
      <AiPortfolioContractView
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "TOOL-HEADLINE",
              name: "Coder rollout",
              sourceFile: "23_ai_tool_rollout.csv",
              usageHeadline: "Usage evidence exists",
              usageBars: [],
              readinessScore: 88,
              readinessScoreLoaded: true,
            }),
          ],
          actions: [],
          gaps: [],
          pipelineGaps: [],
        })}
        onOpenAi={jest.fn()}
        onOpenAction={jest.fn()}
        onOpenGap={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Adoption lens/i }));

    expect(document.body.textContent).toContain("Unknown");
    expect(document.body.textContent).not.toContain("88%");
  });

  it("keeps business cases out of the tool-rollout adoption lens", () => {
    render(
      <AiPortfolioContractView
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "BC-USES-TOOL",
              name: "Service case automation",
              sourceFile: "22_ai_business_cases.csv",
              usageHeadline: "Usage evidence exists",
              usageBars: [
                { label: "Active users", valueText: "75%", pct: 75, tone: "teal" },
              ],
            }),
            initiative({
              id: "TOOL-REAL",
              name: "ServiceNow rollout",
              sourceFile: "23_ai_tool_rollout.csv",
              usageHeadline: "Active usage captured",
              usageBars: [
                { label: "Active users", valueText: "55%", pct: 55, tone: "amber" },
              ],
            }),
          ],
          actions: [],
          gaps: [],
          pipelineGaps: [],
        })}
        onOpenAi={jest.fn()}
        onOpenAction={jest.fn()}
        onOpenGap={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Adoption lens/i }));

    const text = document.body.textContent ?? "";
    expect(screen.getByRole("tab", { name: /Adoption lens 1 tool rollout/i })).toBeInTheDocument();
    expect(text).toContain("ServiceNow rollout");
    expect(text).not.toContain("Service case automation");
  });

  it("withdraws cost findings when no actions or gaps support them", () => {
    render(
      <AiPortfolioContractView
        view={viewWith({
          actions: [],
          gaps: [],
          pipelineGaps: [],
          summary: { aiUnallocatedSpendUsd: 0 },
        })}
        onOpenAi={jest.fn()}
        onOpenAction={jest.fn()}
        onOpenGap={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Cost lens/i }));

    const text = document.body.textContent ?? "";
    expect(text).toContain("No cost findings are loaded for this portfolio.");
    expect(text).not.toContain("Three suppliers deliver the same capability");
    expect(text).not.toContain("A cohort of contracts protects the vendor");
  });

  it("does not fabricate action campaigns or 0-of-0 claim ratios", () => {
    render(
      <EvidenceActionsContractView
        view={viewWith({
          allInitiatives: [],
          programs: [],
          actions: [],
          gaps: [],
          pipelineGaps: [],
          evidenceFacts: [],
          summary: {
            valueClaimCount: 0,
            claimableClaimCount: 0,
            usageSupportedClaimCount: 0,
            aiInitiativeCount: 0,
            economicReviewQueueCount: 0,
            blockedProgramCount: 0,
            claimableProgramCount: 0,
          },
        })}
        onOpenAction={jest.fn()}
        onOpenGap={jest.fn()}
      />,
    );

    const text = document.body.textContent ?? "";
    expect(text).toContain("Value claims not loaded");
    expect(text).toContain("Usage support not loaded");
    expect(text).toContain("No action campaigns are loaded for this review.");
    expect(text).toContain("No evidence-owner queue rows are loaded for this review.");
    expect(text).not.toContain("0 of 0");
    expect(text).not.toContain("Usage telemetry connection");
    expect(text).not.toContain("Vendor leverage review");
    expect(text).not.toContain("1Assets");
  });
});
