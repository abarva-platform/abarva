import { renderToStaticMarkup } from "react-dom/server";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { BudgetDomainPanel } from "../BudgetDomainPanel";
import { CommandCenterView } from "../CommandCenterView";
import { AiPortfolioContractView, EvidenceActionsContractView, ValueProofContractView } from "../ContractTabs";
import { FoundationsPanel } from "../FoundationsPanel";
import { InitiativesDistributionPanel } from "../InitiativesDistributionPanel";
import { ToolsTablePanel } from "../ToolsTablePanel";
import { ToolsVendorPanel } from "../ToolsVendorPanel";
import { VerdictPanel } from "../VerdictPanel";

function sourceShapedView(): TowerCommandCenterView {
  const original = buildTowerCommandCenterView(designFixtureMart(), { tenantName: "Fixture Tenant" });
  if (!original) throw new Error("Fixture Tower view did not build");
  const caseRow: TowerAiView = {
    ...original.allInitiatives[0],
    id: "case-1",
    name: "Case one",
    populationKind: "ai_case",
    vendor: null,
    system: null,
    category: null,
    financeStatus: null,
    aiAmountBasis: "unknown",
    promisedBenefitLoaded: false,
    promisedUsd: 0,
    usageHeadline: null,
    usageBars: [],
  };
  const cases = Array.from({ length: 18 }, (_, index) => ({
    ...caseRow,
    id: `case-${index + 1}`,
    n: index + 1,
    name: `Case ${index + 1}`,
  }));
  const observations = Array.from({ length: 18 }, (_, index) => ({
    ...caseRow,
    id: `observation-${index + 1}`,
    n: index + 1,
    name: `Observation ${index + 1}`,
    populationKind: "usage_observation" as const,
  }));
  const programs = Array.from({ length: 38 }, (_, index) => ({
    ...original.programs[0],
    id: `program-${index + 1}`,
    name: `Program ${index + 1}`,
    functionLabel: null,
    affectedFunctions: [],
  }));
  return {
    ...original,
    allInitiatives: cases,
    ai: cases.slice(0, 10),
    usageObservations: observations,
    programs,
    valueTrajectory: [],
    summary: {
      ...original.summary,
      aiInitiativeCount: 18,
      valueClaimCount: 18,
      valueProofOutcomeRecordCount: 50,
      promisedBenefitLoaded: false,
      claimableAmountLoaded: false,
      claimableClaimCount: 0,
    },
  };
}

describe("Tower story copy at missing-source boundaries", () => {
  it("names program rows and missing quarterly evidence without implying a recorded result", () => {
    const html = renderToStaticMarkup(
      <ValueProofContractView view={sourceShapedView()} onOpenProgram={() => undefined} />,
    );
    expect(html).toContain("Program decision rows");
    expect(html).toContain("Top 20 of 38 loaded program rows");
    expect(html).toContain("18 benefit claims + 50 separate outcome-measure records");
    expect(html).toContain("These are program-level planning amounts");
    expect(html).toContain("Quarterly trajectory not loaded");
    expect(html).toContain("No quarterly plan or actual-result rows are loaded");
    expect(html).not.toContain("No actual financial result is recorded in the loaded quarters");
  });

  it("keeps cases, rollouts, and adoption-source rows on separate bases", () => {
    const view = sourceShapedView();
    const portfolio = renderToStaticMarkup(
      <AiPortfolioContractView view={view} onOpenAi={() => undefined} onOpenAction={() => undefined} onOpenGap={() => undefined} />,
    );
    expect(portfolio).toContain("18 AI use cases + 0 tool rollouts");
    expect(portfolio).toContain("18 separate adoption-source rows");
    expect(portfolio).toMatch(/<td>Case 1<\/td>|>Case 1<\/button>/);
    expect(portfolio).toContain("<td>Not loaded</td>");
    const vendor = renderToStaticMarkup(<ToolsVendorPanel view={view} />);
    expect(vendor).toContain("No vendor-level active-user counts are loaded");
    expect(vendor).not.toContain("counts people actually using");
    const rollouts = renderToStaticMarkup(<ToolsTablePanel view={view} />);
    expect(rollouts).toContain("No tool rollout records are loaded");
    expect(rollouts).toContain("do not prove tool adoption");
  });

  it("shows missing affected work areas separately from funding and foundation gaps", () => {
    const view = sourceShapedView();
    const domain = renderToStaticMarkup(<BudgetDomainPanel view={view} />);
    expect(domain).toContain("0 of 38 loaded programs have an affected work area linked in the source");
    expect(domain).toContain("38 programs need a work area link");
    expect(domain).toContain("These links cannot show a funding split");
    expect(domain).toContain("Approved funding by work area and the full IT budget split are not verified here");
    const emptyDomain = renderToStaticMarkup(<BudgetDomainPanel view={{ ...view, programs: [] }} />);
    expect(emptyDomain).toContain("No program rows are loaded");
    expect(emptyDomain).toContain("Approved funding by work area and the full IT budget split are not verified in this view");
    const foundations = renderToStaticMarkup(<FoundationsPanel view={view} />);
    expect(foundations).toContain("No foundation rows are loaded");
    expect(foundations).toMatch(/Approved foundation funding<\/div><div[^>]*>Not loaded/);
    expect(foundations).not.toContain("Approved foundation funding</div><div>Partial");
  });

  it("presents Finance review first and labels generated steps as suggestions", () => {
    const view = sourceShapedView();
    const verdict = renderToStaticMarkup(<VerdictPanel view={view} />);
    expect(verdict).toContain("Review Finance status for 18 of 18 AI use cases");
    expect(verdict).toContain("Approved AI case funding is not verified");
    expect(verdict).toContain("A cleared value amount is not verified");
    expect(verdict).toContain("No yearly case-benefit amounts are loaded for this comparison");
    const command = renderToStaticMarkup(
      <CommandCenterView view={view} onOpenGap={() => undefined} onGoToFunnel={() => undefined} onGoToAi={() => undefined} onGoToActions={() => undefined} />,
    );
    expect(command).toContain("Suggested sequence");
    expect(command).toContain("intake reconciliation not assessed");
    expect(command).toContain("18 AI use cases + 0 tool rollouts by cost, risk and adoption");
    expect(command).not.toContain("and tool rollouts and tool rollouts");
    expect(command).not.toContain("Not loadedAmount");
  });

  it("renders missing amounts and distribution counts with readable spacing", () => {
    const view = sourceShapedView();
    const gap = {
      ...view.gaps[0],
      id: "gap-unknown-amount",
      valueAtStakeUsd: null,
      promisedValueExposedUsd: 0,
      validatedValueHeldUsd: 0,
    };
    const queue = renderToStaticMarkup(
      <EvidenceActionsContractView view={{ ...view, gaps: [gap] }} onOpenAction={() => undefined} onOpenGap={() => undefined} />,
    );
    expect(queue).toContain("Amount not loaded");
    expect(queue).not.toContain("Not loadedAmount");
    expect(queue).toContain("Source recommendations");
    expect(queue).toContain("Task-system assignment, status, and due date are not loaded");
    expect(queue).not.toContain("Open tasks");
    const distribution = renderToStaticMarkup(<InitiativesDistributionPanel view={view} />);
    expect(distribution).toMatch(/recorded value category; 18 have no approved funding amount; 18 have no projected yearly benefit amount/);
    expect(distribution).not.toContain("0rows");
    expect(distribution).not.toContain("amount;18");
  });
});
