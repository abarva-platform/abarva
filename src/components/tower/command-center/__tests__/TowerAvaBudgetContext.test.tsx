/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenterAvaShell } from "../TowerCommandCenterAvaShell";

jest.mock("@/components/atlas/AtlasChatPanel", () => ({
  AtlasChatPanel: ({ surfaceContext }: { surfaceContext: unknown }) => (
    <output data-testid="tower-ava-context">
      {JSON.stringify(surfaceContext)}
    </output>
  ),
}));

jest.mock("../TowerCommandCenter", () => ({
  TowerCommandCenter: () => <div>Tower page</div>,
}));

it("omits the unverified budget projection from assistant measures", () => {
  const built = buildTowerCommandCenterView(designFixtureMart(), {
    tenantName: "Example tenant",
  })!;
  const view = {
    ...built,
    summary: { ...built.summary, budgetUsd: 123_456_789 },
  };

  render(
    <TowerCommandCenterAvaShell
      view={view}
      tenantName="Example tenant"
      clientId="example"
    />,
  );

  const context = JSON.parse(
    screen.getByTestId("tower-ava-context").textContent ?? "{}",
  );
  expect(context.towerMeasures).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ measureKey: "total_it_budget_fy26" }),
    ]),
  );
  expect(JSON.stringify(context.towerMeasures)).not.toContain("123456789");
  expect(context.towerKnownGaps[0]).toMatch(
    /no reconciled active-intake lineage status/,
  );
});

it("keeps annual tool cost out of the assistant's approved funding measure", () => {
  const built = buildTowerCommandCenterView(designFixtureMart(), {
    tenantName: "Example tenant",
  })!;
  const view = {
    ...built,
    allInitiatives: [
      { ...built.allInitiatives[0]!, sourceFile: "22_ai_business_cases.csv", aiSpendUsd: 100, aiSpendLoaded: true, aiAmountBasis: "approved_funding" as const },
      { ...built.allInitiatives[1]!, sourceFile: "23_ai_tool_rollout.csv", aiSpendUsd: 200, aiSpendLoaded: true, aiAmountBasis: "annualized_tool_cost" as const },
    ],
  };

  render(
    <TowerCommandCenterAvaShell
      view={view}
      tenantName="Example tenant"
      clientId="example"
    />,
  );

  const context = JSON.parse(screen.getByTestId("tower-ava-context").textContent ?? "{}");
  expect(context.towerMeasures).toEqual(expect.arrayContaining([
    expect.objectContaining({ measureKey: "approved_ai_business_case_funding_usd", value: 100 }),
  ]));
  expect(context.towerMeasures).not.toEqual(expect.arrayContaining([
    expect.objectContaining({ measureKey: "ai_tagged_spend_fy26_non_additive" }),
  ]));
});
