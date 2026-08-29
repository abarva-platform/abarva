/**
 * @jest-environment jsdom
 */

/**
 * The constraint panel derives its finding instead of asserting it.
 *
 * The design states flatly that "every bar is a single colour, and that is the finding" — gating
 * constraint and finance status being the same field twice. That is true of the data the design
 * was drawn against. It is not a property the product can assume: the moment one constraint spans
 * two outcomes, the sentence becomes false while still reading as authoritative.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";

import {
  ConstraintPanel,
  buildConstraintRows,
} from "../views/ConstraintPanel";

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

const base = () =>
  buildTowerCommandCenterView(designFixtureMart(), {
    tenantName: "Fixture Tenant",
  })!;

/** Replace the portfolio with hand-built cases so the finding can be forced either way. */
function withCases(
  cases: ReadonlyArray<{ gatingConstraint: string | null; financeStatus: string }>,
): TowerCommandCenterView {
  const view = base();
  return {
    ...view,
    allInitiatives: cases.map((c, i) => ({
      ...(view.allInitiatives[0] ?? {}),
      n: i + 1,
      id: `BC-${i}`,
      name: `Case ${i}`,
      gatingConstraint: c.gatingConstraint,
      financeStatus: c.financeStatus,
    })),
  } as TowerCommandCenterView;
}

describe("constraint rows", () => {
  it("groups by constraint and records the distinct outcomes", () => {
    const rows = buildConstraintRows(
      withCases([
        { gatingConstraint: "data quality", financeStatus: "finance_challenged" },
        { gatingConstraint: "data quality", financeStatus: "finance_challenged" },
        { gatingConstraint: "Finance value treatment", financeStatus: "finance_validated_actual" },
      ]),
    );
    expect(rows.map((r) => [r.name, r.value, r.label])).toEqual([
      ["data quality", 2, "2 → Challenged"],
      ["Finance value treatment", 1, "1 → Validated"],
    ]);
  });

  it("marks a constraint that spans outcomes rather than picking one", () => {
    const rows = buildConstraintRows(
      withCases([
        { gatingConstraint: "data quality", financeStatus: "finance_challenged" },
        { gatingConstraint: "data quality", financeStatus: "not_submitted" },
      ]),
    );
    expect(rows[0].label).toBe("2 → 2 outcomes");
    expect(rows[0].statuses).toHaveLength(2);
  });

  it("ignores cases with no constraint rather than bucketing them", () => {
    const rows = buildConstraintRows(
      withCases([
        { gatingConstraint: null, financeStatus: "not_submitted" },
        { gatingConstraint: "control review", financeStatus: "not_submitted" },
      ]),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("control review");
  });
});

describe("constraint panel narrative", () => {
  it("makes the strong claim only when every constraint is one outcome", () => {
    render(
      <ConstraintPanel
        view={withCases([
          { gatingConstraint: "data quality", financeStatus: "finance_challenged" },
          { gatingConstraint: "Finance value treatment", financeStatus: "finance_validated_actual" },
        ])}
      />,
    );
    expect(document.body.textContent).toMatch(
      /it is the outcome, relabelled/,
    );
  });

  it("withdraws the claim when a constraint spans outcomes", () => {
    render(
      <ConstraintPanel
        view={withCases([
          { gatingConstraint: "data quality", financeStatus: "finance_challenged" },
          { gatingConstraint: "data quality", financeStatus: "not_submitted" },
        ])}
      />,
    );
    expect(document.body.textContent).not.toMatch(
      /it is the outcome, relabelled/,
    );
    expect(document.body.textContent).toMatch(
      /carries information the status does not/,
    );
  });

  it("says so plainly when no case carries a constraint", () => {
    render(
      <ConstraintPanel
        view={withCases([{ gatingConstraint: null, financeStatus: "not_submitted" }])}
      />,
    );
    expect(document.body.textContent).toMatch(
      /This is a gap in the projection, not a portfolio without blockers/,
    );
  });

  it("names the constraint the validated cases share", () => {
    render(
      <ConstraintPanel
        view={withCases([
          { gatingConstraint: "Finance value treatment", financeStatus: "finance_validated_actual" },
          { gatingConstraint: "data quality", financeStatus: "finance_challenged" },
        ])}
      />,
    );
    // The name also appears as a chart axis label, so assert on the narrative's own <strong>.
    const named = screen
      .getAllByText("Finance value treatment")
      .filter((el) => el.tagName.toLowerCase() === "strong");
    expect(named).toHaveLength(1);
    expect(document.body.textContent).toMatch(
      /Theirs was the one the reviewer controlled/,
    );
  });
});
