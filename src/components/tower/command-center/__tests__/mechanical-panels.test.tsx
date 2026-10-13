/**
 * @jest-environment jsdom
 */

/**
 * Mechanical panels are ports of approved design slots, not ports of the design's sample data.
 * Each panel binds to the command-center view model and withdraws findings when the loaded rows do
 * not support the design's static narrative.
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

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
import { ToolsVendorPanel, buildToolVendorRows } from "../views/ToolsVendorPanel";

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
    sourceFile: "22_ai_business_cases.csv",
    populationKind: "ai_case",
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
    expect(text).toContain("verified from the source files");
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

  it("separates the unclassified count from the following word in the case table", () => {
    render(<InitiativesTablePanel view={viewWith({ allInitiatives: [initiative()] })} />);

    const text = document.body.textContent ?? "";
    expect(text).toContain("0 rows lack that identity");
    expect(text).not.toContain("0rows");
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
    expect(screen.getByText("Approved AI funding")).toBeInTheDocument();
    expect(screen.queryByText("Clinical / Epic")).not.toBeInTheDocument();
    expect(screen.getByText("Usage-to-value support")).toHaveAttribute(
      "title",
      expect.stringContaining("mapped to the value claim"),
    );
    expect(
      screen.getByLabelText(/Constraint help: Usage exists/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Claims cycle automation" }));
    expect(onOpenAi).toHaveBeenCalledWith(1);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Open detail for Claims cycle automation",
      }),
    );
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

    expect(document.body.textContent).toMatch(/Expected benefit kinds and the financial breakdown are not loaded/);
    expect(document.body.textContent).not.toMatch(/leads value type/);
    expect(document.body.textContent).toMatch(/Approved AI funding by recorded value category/);
    expect(document.body.textContent).not.toMatch(/By AI spend category/);
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
              populationKind: "tool_rollout",
              usageHeadline: "Usage evidence exists",
              usageBars: [
                { label: "Adoption", valueText: "55%", pct: 55, tone: "amber" },
              ],
              adoptionActualPct: 55,
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
              populationKind: "tool_rollout",
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
    expect(
      screen.getByLabelText(/Control blocker help: Finance-control evidence/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Open detail for Power BI Copilot" }),
    );
    expect(onOpenAi).toHaveBeenCalledWith(7);
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

  it("keeps yearly tool cost out of approved foundation funding", () => {
    render(
      <FoundationsPanel
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "FOUND-FUNDED",
              category: "Platform foundation",
              aiAmountBasis: "approved_funding",
              aiSpendUsd: 5 * M,
            }),
            initiative({
              id: "TOOL-COST",
              sourceFile: "23_ai_tool_rollout.csv",
              populationKind: "tool_rollout",
              category: "Platform foundation",
              aiAmountBasis: "annualized_tool_cost",
              aiSpendUsd: 10 * M,
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText("$5M in approved foundation funding is linked to $18M in projected yearly benefit.")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("$15M");
    expect(screen.getByText("100%")).toBeInTheDocument();
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
    expect(document.body.textContent).toContain("No case-level benefit claim loaded");
    expect(document.body.textContent).toContain("Amount basis not verified");
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
              populationKind: "tool_rollout",
              usageHeadline: "Usage evidence exists",
              usageBars: [],
              adoptionActualPct: null,
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

    expect(document.body.textContent).toContain("Adoption rate not loaded");
    expect(document.body.textContent).not.toContain("88%");
  });

  it("keeps a usage count separate from an explicitly recorded adoption rate", () => {
    render(
      <AiPortfolioContractView
        view={viewWith({
          allInitiatives: [
            initiative({
              id: "TOOL-COUNT",
              name: "Count-only rollout",
              populationKind: "tool_rollout",
              usageHeadline: "Active users · 120",
              usageBars: [{ label: "Active users", valueText: "120", pct: 100, tone: "teal" }],
              adoptionActualPct: null,
              aiSpendUsd: 10 * M,
            }),
            initiative({
              id: "TOOL-RATE",
              name: "Rate-recorded rollout",
              populationKind: "tool_rollout",
              usageHeadline: "Active users · 50",
              usageBars: [
                { label: "Active users", valueText: "50", pct: 100, tone: "teal" },
                { label: "Adoption", valueText: "42%", pct: 42, tone: "amber" },
              ],
              adoptionActualPct: 42,
            }),
            initiative({
              id: "TOOL-LABEL",
              name: "Count named adoption",
              populationKind: "tool_rollout",
              usageHeadline: "Adoption · 70",
              usageBars: [{ label: "Adoption", valueText: "70", pct: 100, tone: "teal" }],
              adoptionActualPct: null,
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

    const countOnly = screen.getByRole("row", { name: /Count-only rollout/ });
    const recorded = screen.getByRole("row", { name: /Rate-recorded rollout/ });
    const countNamedAdoption = screen.getByRole("row", { name: /Count named adoption/ });
    expect(within(countOnly).getByText("Adoption rate not loaded")).toBeInTheDocument();
    expect(within(countOnly).queryByText("100%")).not.toBeInTheDocument();
    expect(within(countNamedAdoption).getByText("Adoption rate not loaded")).toBeInTheDocument();
    expect(within(countNamedAdoption).queryByText("100%")).not.toBeInTheDocument();
    expect(within(recorded).getByText("42%")).toBeInTheDocument();
    expect(recorded.compareDocumentPosition(countOnly) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps count-only usage out of the tools adoption bar and target comparison", () => {
    render(<ToolsTablePanel view={viewWith({
      allInitiatives: [initiative({
        id: "TOOL-NAMED-ADOPTION-COUNT",
        name: "Count-only tool",
        populationKind: "tool_rollout",
        usageHeadline: "Adoption · 70",
        usageBars: [{ label: "Adoption", valueText: "70", pct: 100, tone: "teal" }],
        adoptionActualPct: null,
        adoptionTargetPct: 80,
      })],
    })} />);

    const text = document.body.textContent ?? "";
    expect(text).toContain("Recorded usage");
    expect(text).toContain("Adoption · 70");
    expect(text).toContain("Not loaded vs 80% target");
    expect(text).toContain("adoption rates are not loaded for target comparison");
    expect(text).not.toContain("100% vs 80% target");
    expect(text).not.toContain("1 of 1 rollouts sit below their own adoption target");
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
              populationKind: "tool_rollout",
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
    expect(text).toContain("Tool rollouts with usage metrics; recorded adoption rates first");
  });

  it("names separate case usage counts without implying a tool rollout", () => {
    const view = {
      ...viewWith({ allInitiatives: [initiative()], actions: [], gaps: [], pipelineGaps: [] }),
      usageObservations: [initiative({
        id: "OBS-ONE",
        name: "Usage observation one",
        populationKind: "usage_observation",
        usageHeadline: "Active users · 42",
      })],
    };
    render(<AiPortfolioContractView view={view} onOpenAi={jest.fn()} onOpenAction={jest.fn()} onOpenGap={jest.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: /Adoption lens 0 tool rollouts · 1 adoption-source row/i }));
    expect(screen.getByText("No tool rollout usage rows; separate source usage counts are shown below")).toBeInTheDocument();
    expect(screen.getByText("Active users · 42")).toBeInTheDocument();
    expect(screen.queryByText("Tool rollouts with usage metrics; recorded adoption rates first")).not.toBeInTheDocument();
  });

  it("labels fallback funding items as proof tasks when no spend categories are loaded", () => {
    const view = {
      ...viewWith({ actions: base().actions.slice(0, 1), gaps: [], pipelineGaps: [], summary: { aiUnallocatedSpendUsd: 0 } }),
      costLens: null,
    };
    render(<AiPortfolioContractView view={view} onOpenAi={jest.fn()} onOpenAction={jest.fn()} onOpenGap={jest.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: /Funding and proof 1 proof item/i }));
    expect(screen.getByText("Evidence tasks to review")).toBeInTheDocument();
    expect(screen.queryByText("Funding and evidence gaps")).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("tab", { name: /Funding and proof 0 proof items/i }));

    const text = document.body.textContent ?? "";
    expect(text).toContain("No evidence tasks are loaded for this portfolio.");
    expect(text).not.toContain("Three suppliers deliver the same capability");
    expect(text).not.toContain("A cohort of contracts protects the vendor");
  });

  it("explains annual spend, unknown budget, and separate contract amounts in the cost tab", () => {
    const view = viewWith({ actions: [], gaps: [], pipelineGaps: [], summary: { budgetUsd: null } });
    view.costLens = {
      modeledAnnualSpendUsd: 10 * M,
      sourceNarrativeDifferenceUsd: 100_000,
      categories: [
        { id: "spend:2", label: "Infrastructure", amountUsd: 6 * M, sourceFile: "08_spend_value.csv", sourceRow: 2, sourceSha256: "hash", sourcePriorYearActualUsd: 5 * M, sourceForecastNextYearUsd: 7 * M, sourceSavingsOpportunityUsd: 300_000, sourceCalculationBasis: "Supplier estimate" },
        { id: "spend:3", label: "Applications", amountUsd: 4 * M, sourceFile: "08_spend_value.csv", sourceRow: 3, sourceSha256: "hash" },
      ],
      contractExposure: [
        { id: "contract:one", label: "Vendor one", amountUsd: 9 * M, sourceFile: "07_vendors_contracts.csv", sourceRow: 2, sourceSha256: "hash" },
      ],
    };
    render(<AiPortfolioContractView view={view} onOpenAi={jest.fn()} onOpenAction={jest.fn()} onOpenGap={jest.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: /Funding and cost 2 spend categories/i }));
    expect(screen.getByText("$10,000,000")).toBeInTheDocument();
    expect(screen.getByText(/Approved FY budget:/).closest("p")?.textContent).toContain("Unknown");
    expect(screen.getByText(/One-source planning estimate/)).toBeInTheDocument();
    expect(screen.getByText(/overlap with the IT spend categories is unknown/)).toBeInTheDocument();
    expect(screen.getByText("AI amount needs a source check")).toBeInTheDocument();
    fireEvent.click(screen.getByText("See all 2 spend categories"));
    fireEvent.click(screen.getByText("See 1 vendor contract amount"));
    expect(screen.getByText("Infrastructure")).toBeInTheDocument();
    expect(screen.getByText("$6,000,000")).toBeInTheDocument();
    expect(screen.getByText("$5,000,000")).toBeInTheDocument();
    expect(screen.getByText("$7,000,000")).toBeInTheDocument();
    expect(screen.getByText("$300,000")).toBeInTheDocument();
    expect(screen.getByText(/fiscal periods and savings have not been verified for Tower reporting/)).toBeInTheDocument();
    expect(screen.getByText("Vendor one")).toBeInTheDocument();
    expect(screen.getByText("$9,000,000")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("$19,000,000");
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
    expect(text).toContain("Benefit claims not loaded");
    expect(text).toContain("Usage support not loaded");
    expect(text).toContain("No source recommendations or evidence-gap follow-ups are loaded for this review.");
    expect(text).toContain("No evidence-owner queue rows are loaded. An empty queue does not mean every claim has proof.");
    expect(text).not.toContain("0 of 0");
    expect(text).not.toContain("Usage telemetry connection");
    expect(text).not.toContain("Vendor leverage review");
    expect(text).not.toContain("1Assets");
  });

  it("does not call generic usage events active users or imply summed tool users are unique", () => {
    const view = viewWith({
      allInitiatives: [
        initiative({
          id: "TOOL-EVENTS",
          populationKind: "tool_rollout",
          usageHeadline: "Usage events · 1,000",
          usageBars: [{ label: "Usage events", valueText: "1,000", pct: 100, tone: "teal" }],
          monthlyActiveUsers: 1_000,
        }),
        initiative({
          id: "TOOL-USERS-A",
          populationKind: "tool_rollout",
          usageHeadline: "Monthly active users · 120",
          usageBars: [{ label: "Monthly active users", valueText: "120", pct: 100, tone: "teal" }],
          monthlyActiveUsers: 120,
        }),
        initiative({
          id: "TOOL-USERS-B",
          populationKind: "tool_rollout",
          usageHeadline: "Active users · 30",
          usageBars: [{ label: "Active users", valueText: "30", pct: 100, tone: "teal" }],
          monthlyActiveUsers: 30,
        }),
      ],
    });

    expect(buildToolVendorRows(view)).toEqual(expect.arrayContaining([
      expect.objectContaining({ vendor: "Vendor Alpha", activeUsers: 150, toolCount: 3 }),
    ]));
    render(<ToolsVendorPanel view={view} />);
    expect(document.body.textContent).toContain("Active-user counts across tools by vendor");
    expect(document.body.textContent).toContain("one person using two tools can be counted twice");
    expect(document.body.textContent).toContain("Rollout counts here cover only tool rows with a usage metric");
    expect(document.body.textContent).not.toContain("1,150");
  });

  it("withholds an incomplete foundation benefit total and names its counting basis", () => {
    render(<FoundationsPanel view={viewWith({
      allInitiatives: [
        initiative({ id: "FOUNDATION-A", category: "Platform foundation", aiAmountBasis: "approved_funding", promisedBenefitLoaded: true, promisedUsd: 2 * M }),
        initiative({ id: "FOUNDATION-B", category: "Platform foundation", aiAmountBasis: "approved_funding", promisedBenefitLoaded: false, promisedUsd: 0 }),
      ],
    })} />);

    const tile = screen.getByText("Projected direct benefit").parentElement;
    expect(tile?.textContent).toContain("Partial — total withheld");
    expect(tile?.textContent).not.toContain("$2M");
    expect(document.body.textContent).toContain("recorded for 1 of 2 foundation rows");
  });

  it("describes a missing budget split as missing, not as present fields", () => {
    render(<BudgetShapePanel view={viewWith({ summary: { budgetUsd: null, runUsd: null, changeUsd: null } })} />);
    expect(document.body.textContent).toContain("No budget split is loaded");
    expect(document.body.textContent).not.toContain("Budget fields are present");
  });

  it("shows the source-selected demo budget split without calling it independently approved", () => {
    render(<BudgetShapePanel view={viewWith({ summary: {
      budgetUsd: null, runUsd: null, changeUsd: null,
      syntheticDemoBudgetUsd: 650_000_000,
      syntheticDemoRunUsd: 487_500_000,
      syntheticDemoChangeUsd: 162_500_000,
    } })} />);
    expect(document.body.textContent).toContain("existing operations and new work");
    expect(document.body.textContent).toContain("$487.5M");
    expect(document.body.textContent).toContain("$162.5M");
    expect(document.body.textContent).toContain("independent Finance sign-off is not recorded");
  });

  it("separates the source's benefit plan and funding category in both AI tables", () => {
    const caseRow = initiative({
      id: "CASE-PLAN",
      expectedValueArchetype: "cost_productivity_or_cycle_time",
      businessValueType: null,
      category: null,
      kind: "funded",
      displayBucket: "funded",
      aiAmountBasis: "unknown",
    });
    const view = viewWith({ allInitiatives: [caseRow], actions: [], gaps: [], pipelineGaps: [] });
    render(
      <>
        <InitiativesTablePanel view={view} />
        <AiPortfolioContractView view={view} onOpenAi={jest.fn()} onOpenAction={jest.fn()} onOpenGap={jest.fn()} />
      </>,
    );
    expect(screen.getByRole("button", { name: "Funding group" })).toBeInTheDocument();
    expect(document.body.textContent).toContain("display grouping from intake labels; it is not proof of approved funding");
    expect(document.body.textContent).toContain("Save time, improve productivity, or shorten a process");
    expect(document.body.textContent).toContain("Source category: Not recorded");
    expect(document.body.textContent).toContain("Tower group: funding group");
    expect(document.body.textContent).toContain("Amount basis not verified");
    expect(screen.queryByRole("columnheader", { name: "Value type" })).not.toBeInTheDocument();
  });

  it("shows Finance status separately from a missing validated amount", () => {
    render(<InitiativesTablePanel view={viewWith({
      allInitiatives: [initiative({
        id: "CASE-STATUS-ONLY",
        name: "Status-only case",
        financeStatus: "finance_validated_actual",
        financeValidatedUsd: 0,
        financeValidatedAmountLoaded: undefined,
        financeApprovalEvents: [],
      })],
    })} />);

    expect(document.body.textContent).toContain("Source Finance status: Validated actual");
    expect(document.body.textContent).toContain("Amount not verified");
    expect(document.body.textContent).not.toContain("$0M");
  });
});
