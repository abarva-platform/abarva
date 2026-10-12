/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import { FoundationsPanel } from "../views/FoundationsPanel";
import { AiInitiativeDrawer } from "../drawers/AiInitiativeDrawer";
import { CommandCenterView } from "../views/CommandCenterView";
import { InitiativesTablePanel } from "../views/InitiativesTablePanel";
import { QueueOwnerPanel } from "../views/QueueOwnerPanel";
import { VerdictPanel } from "../views/VerdictPanel";
import { buildAffectedWorkAreaCoverage } from "../views/BudgetDomainPanel";
import { BudgetShapePanel } from "../views/BudgetShapePanel";
import { buildToolVendorRows } from "../views/ToolsVendorPanel";
import { isBusinessCase, isToolRollout, unclassifiedPortfolioCount } from "../views/portfolio-kind";

const base = () => buildTowerCommandCenterView(designFixtureMart(), { tenantName: "Fixture Tenant" })!;

function item(overrides: Partial<TowerAiView>): TowerAiView {
  return { ...base().allInitiatives[0], ...overrides };
}

function viewWith(items: TowerAiView[]): TowerCommandCenterView {
  return { ...base(), allInitiatives: items };
}

describe("Tower story denominators", () => {
  it("uses declared canonical population, independent of source filenames", () => {
    const cases = item({ id: "CASE", name: "A case", populationKind: "ai_case", sourceFile: null });
    const tool = item({ id: "TOOL", name: "A rollout", populationKind: "tool_rollout", sourceFile: null });
    const unknown = item({ id: "UNKNOWN", name: "Unknown type", populationKind: "unknown", sourceFile: "22_ai_business_cases.csv", rolloutGoal: "Pilot", financeStatus: "sponsor_claimed" });
    expect([isBusinessCase(cases), isToolRollout(cases)]).toEqual([true, false]);
    expect([isBusinessCase(tool), isToolRollout(tool)]).toEqual([false, true]);
    expect([isBusinessCase(unknown), isToolRollout(unknown)]).toEqual([false, false]);
    expect(unclassifiedPortfolioCount([cases, tool, unknown])).toBe(1);
    render(<InitiativesTablePanel view={viewWith([cases, tool, unknown])} />);
    expect(screen.getByText("1 of 1 shown")).toBeInTheDocument();
    expect(screen.getByText("A case")).toBeInTheDocument();
    expect(screen.queryByText("A rollout")).not.toBeInTheDocument();
    expect(screen.queryByText("Unknown type")).not.toBeInTheDocument();
  });

  it("counts vendor exposure only among current tool rollout rows", () => {
    const cases = item({ populationKind: "ai_case", vendor: "Vendor A", usageHeadline: "Usage", controlBlocker: "DLP" });
    const tool = item({ populationKind: "tool_rollout", vendor: "Vendor B", usageHeadline: "Usage", controlBlocker: "DLP" });
    expect(buildToolVendorRows(viewWith([cases, tool]))).toEqual(expect.arrayContaining([
      expect.objectContaining({ vendor: "Vendor B", toolCount: 1, blockerCount: 1 }),
    ]));
    expect(buildToolVendorRows(viewWith([cases, tool]))).toHaveLength(1);
  });

  it("keeps cases in owner and Finance views when assignments and status are absent", () => {
    const caseRow = item({ populationKind: "ai_case", sponsorRole: null, financeStatus: null });
    const observation = item({ populationKind: "usage_observation", sponsorRole: null, financeStatus: null });
    const view = { ...viewWith([caseRow]), usageObservations: [observation] };
    render(<QueueOwnerPanel view={view} />);
    expect(document.body.textContent).toContain("1 of 1 cases have no sponsor loaded");
    render(<VerdictPanel view={view} />);
    expect(document.body.textContent).toContain("Where 1 AI use case stands");
    expect(document.body.textContent).toContain("1 of 1 AI use case has no Finance status loaded");
    expect(document.body.textContent).not.toContain("Where 0 AI use cases stand");
  });

  it("shows an unscored case as needing evidence in its detail", () => {
    render(<AiInitiativeDrawer item={item({
      populationKind: "ai_case",
      valueScore: 0,
      valueScoreLoaded: false,
      readinessScore: 0,
      readinessScoreLoaded: false,
      posture: "Needs evidence",
    })} onClose={() => {}} />);
    expect(document.body.textContent).toContain("Needs evidence");
    expect(document.body.textContent).toContain("Not scored");
    expect(document.body.textContent).not.toContain("0/100");
  });

  it("keeps the executive asset count separate from programs and usage observations", () => {
    const cases = Array.from({ length: 18 }, (_, index) => item({
      id: `case-${index}`,
      populationKind: "ai_case",
    }));
    const observations = Array.from({ length: 18 }, (_, index) => item({
      id: `observation-${index}`,
      populationKind: "usage_observation",
    }));
    const sample = base();
    const view = {
      ...sample,
      allInitiatives: cases,
      usageObservations: observations,
      programs: Array.from({ length: 38 }, (_, index) => ({ ...sample.programs[0], id: `program-${index}` })),
      summary: { ...sample.summary, aiInitiativeCount: 18 },
    };
    render(<CommandCenterView view={view} onOpenGap={() => {}} onGoToFunnel={() => {}} onGoToAi={() => {}} onGoToActions={() => {}} />);
    expect(document.body.textContent).toContain("18 AI use cases + 0 tool rollouts");
    expect(document.body.textContent).toContain("18 separate adoption-source rows");
    expect(document.body.textContent).not.toContain("36 assets");
    expect(document.body.textContent).not.toContain("38 AI business cases");
  });

  it("does not turn a Finance validation status into a zero dollar amount", () => {
    const validatedZero = item({
      id: "VALIDATED",
      name: "Validated zero",
      sourceFile: "22_ai_business_cases.csv",
      financeStatus: "finance_validated_actual",
      financeValidatedUsd: 0,
    });
    const unvalidated = item({
      id: "UNVALIDATED",
      name: "Unvalidated case",
      sourceFile: "22_ai_business_cases.csv",
      financeStatus: null,
      financeApprovalEvents: [],
      valueObservationMonths: [],
      financeValidatedUsd: 0,
    });
    render(<InitiativesTablePanel view={viewWith([validatedZero, unvalidated])} />);
    const financeCell = (name: string) =>
      screen.getByText(name).closest('[title="Double-click to open case details"]')?.children[5];
    expect(financeCell("Validated zero")?.textContent).toBe("Amount not verified");
    expect(financeCell("Unvalidated case")?.textContent).toBe("Not loaded");
  });

  it("does not classify a foundation from its name alone", () => {
    const namedOnly = item({ name: "Platform Foundation", category: "Workflow", sourceFile: "22_ai_business_cases.csv" });
    render(<FoundationsPanel view={viewWith([namedOnly])} />);
    expect(document.body.textContent).toContain("No foundation rows are loaded");
  });

  it("keeps affected work area coverage separate from funding categories", () => {
    const view = base();
    const coverage = buildAffectedWorkAreaCoverage(view);
    expect(coverage.totalPrograms).toBe(view.programs.length);
    expect(coverage.linkedPrograms + coverage.unlinkedPrograms.length).toBe(coverage.totalPrograms);
    expect(coverage.rows.every((row) => !("approvedProgramFundingUsd" in row) && !("runUsd" in row))).toBe(true);
  });

  it("withholds budget projection amounts when reconciliation status is absent", () => {
    const view = base();
    render(<BudgetShapePanel view={{
      ...view,
      summary: { ...view.summary, budgetUsd: 987_654_321, runUsd: 123_456_789 },
    }} />);
    expect(document.body.textContent).toContain("Needs a source check");
    expect(document.body.textContent).not.toContain("$987.7M");
    expect(document.body.textContent).not.toContain("$123.5M");
  });
});
