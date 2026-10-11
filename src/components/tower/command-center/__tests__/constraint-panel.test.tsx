/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { ConstraintPanel, buildConstraintRows } from "../views/ConstraintPanel";

const base = () => buildTowerCommandCenterView(designFixtureMart(), { tenantName: "Fixture Tenant" })!;

function withCases(cases: ReadonlyArray<{ gatingConstraint: string | null; financeStatus: string }>): TowerCommandCenterView {
  const view = base();
  return {
    ...view,
    allInitiatives: cases.map((c, i) => ({
      ...view.allInitiatives[0],
      n: i + 1,
      id: `BC-${i}`,
      name: `Case ${i}`,
      sourceFile: "22_ai_business_cases.csv",
      gatingConstraint: c.gatingConstraint,
      financeStatus: c.financeStatus,
    })),
  };
}

describe("recorded constraint counts", () => {
  it("groups the recorded labels without calling Finance status an independent outcome", () => {
    const rows = buildConstraintRows(withCases([
      { gatingConstraint: "data quality", financeStatus: "finance_challenged" },
      { gatingConstraint: "data quality", financeStatus: "not_submitted" },
      { gatingConstraint: "control review", financeStatus: "finance_validated_actual" },
    ]));
    expect(rows.map((r) => [r.name, r.value, r.label])).toEqual([
      ["data quality", 2, "2 cases"],
      ["control review", 1, "1 case"],
    ]);
  });

  it("names missing classifications and does not infer causal blockers", () => {
    render(<ConstraintPanel view={withCases([
      { gatingConstraint: null, financeStatus: "not_submitted" },
      { gatingConstraint: "data quality", financeStatus: "finance_challenged" },
    ])} />);
    expect(document.body.textContent).toContain("1 cases have no constraint recorded");
    expect(document.body.textContent).toContain("do not independently establish a cause");
    expect(document.body.textContent).not.toContain("it is the outcome, relabelled");
  });

  it("does not treat absent constraints as an unblocked portfolio", () => {
    render(<ConstraintPanel view={withCases([{ gatingConstraint: null, financeStatus: "not_submitted" }])} />);
    expect(document.body.textContent).toContain("gap in the projection, not a portfolio without blockers");
  });
});
