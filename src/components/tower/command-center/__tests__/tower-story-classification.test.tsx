/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import { FoundationsPanel } from "../views/FoundationsPanel";
import { InitiativesTablePanel } from "../views/InitiativesTablePanel";
import { buildBudgetDomainRows } from "../views/BudgetDomainPanel";
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
  it("uses only recognized case and rollout source-template markers", () => {
    const cases = item({ id: "CASE", name: "A case", sourceFile: "22_ai_business_cases.csv" });
    const tool = item({ id: "TOOL", name: "A rollout", sourceFile: "23_ai_tool_rollout.csv" });
    const unknown = item({ id: "UNKNOWN", name: "Unknown type", sourceFile: null, rolloutGoal: "Pilot", financeStatus: "sponsor_claimed" });
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
    const cases = item({ sourceFile: "22_ai_business_cases.csv", vendor: "Vendor A", usageHeadline: "Usage", controlBlocker: "DLP" });
    const tool = item({ sourceFile: "23_ai_tool_rollout.csv", vendor: "Vendor B", usageHeadline: "Usage", controlBlocker: "DLP" });
    expect(buildToolVendorRows(viewWith([cases, tool]))).toEqual(expect.arrayContaining([
      expect.objectContaining({ vendor: "Vendor B", toolCount: 1, blockerCount: 1 }),
    ]));
    expect(buildToolVendorRows(viewWith([cases, tool]))).toHaveLength(1);
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
    expect(financeCell("Validated zero")?.textContent).toBe("Amount not shown");
    expect(financeCell("Unvalidated case")?.textContent).toBe("Not loaded");
  });

  it("does not classify a foundation from its name alone", () => {
    const namedOnly = item({ name: "Platform Foundation", category: "Workflow", sourceFile: "22_ai_business_cases.csv" });
    render(<FoundationsPanel view={viewWith([namedOnly])} />);
    expect(document.body.textContent).toContain("No foundation rows are loaded");
  });

  it("groups only reviewed program counts, without inventing budget categories", () => {
    const view = base();
    const rows = buildBudgetDomainRows(view);
    expect(rows.every((row) => "reviewedCount" in row)).toBe(true);
    expect(rows.every((row) => !("approvedProgramFundingUsd" in row) && !("runUsd" in row))).toBe(true);
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
