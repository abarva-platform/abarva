/**
 * @jest-environment jsdom
 */

/**
 * The Verdict panel binds to the view model rather than the design's sample literals, and reports
 * absence as absence.
 *
 * The approved design carries $1.05B / $211.8M / $677.8M / $13.1M as illustrative values. Shipping
 * those would produce a page that reads correctly and means nothing — the exact failure this
 * surface exists to prevent — so this pins that none of them are hardcoded.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { VerdictPanel } from "../views/VerdictPanel";

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

function viewWith(summary: Record<string, unknown> = {}) {
  const mart = designFixtureMart();
  return buildTowerCommandCenterView(
    { ...mart, command: { ...mart.command, ...summary } },
    { tenantName: "Fixture Tenant" },
  )!;
}

describe("Verdict panel", () => {
  it("renders no figure from the design's sample data", () => {
    render(<VerdictPanel view={viewWith()} />);
    const text = document.body.textContent ?? "";
    for (const literal of ["$1.05B", "$211.8M", "$677.8M", "$13.1M"]) {
      expect(text).not.toContain(literal);
    }
  });

  it("states the three rules the design makes the page answer for", () => {
    render(<VerdictPanel view={viewWith()} />);
    expect(
      screen.getByText(/Report a benefit only after Finance checks the result/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Foundations need a linked value case/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/AI status comes from classification, not a label/),
    ).toBeInTheDocument();
  });

  it("keeps the cadence rule that stops cross-cadence summing", () => {
    render(<VerdictPanel view={viewWith()} />);
    expect(document.body.textContent).toMatch(
      /Do not add these different amounts or divide one by another to claim a success rate/,
    );
  });

  it("renders an absent budget as a gap, never as zero", () => {
    render(<VerdictPanel view={viewWith({ totalItBudgetFy26: null })} />);
    const budget = screen.getByText("Approved FY26 IT budget").parentElement;
    expect(budget?.textContent).toContain("Not verified");
    expect(budget?.textContent).not.toContain("$0");
  });

  it("shows a selected demo budget but prioritizes a later independently approved budget", () => {
    const demo = viewWith({ totalItBudgetFy26: null, syntheticDemoBudgetFy26: 650_000_000 });
    const { rerender } = render(<VerdictPanel view={demo} />);
    expect(screen.getByText("FY26 synthetic demo budget").parentElement?.textContent).toContain("$650.0M");
    expect(screen.getByText("FY26 synthetic demo budget").parentElement?.textContent).toContain("independent Finance sign-off is not recorded");
    rerender(<VerdictPanel view={viewWith({ totalItBudgetFy26: 700_000_000,
      syntheticDemoBudgetFy26: 650_000_000 })} />);
    expect(screen.getByText("Approved FY26 IT budget").parentElement?.textContent).toContain("$700.0M");
  });

  it("labels an annual assertion without inventing a YTD claim population", () => {
    render(<VerdictPanel view={viewWith()} />);
    expect(
      screen.getByRole("heading", { level: 2 }).textContent,
    ).toMatch(/The loaded benefit claims project \$35\.5M a year; their relationship to the AI cases is not reconciled here\. A cleared value amount is not verified for the loaded months\./);
  });

  it("treats an absent annual assertion as unknown", () => {
    render(<VerdictPanel view={viewWith({ promisedValueFy26: null })} />);
    expect(document.body.textContent).toMatch(
      /No yearly benefit estimate is loaded, so there is no estimate to compare with Finance review\./,
    );
  });
});

/**
 * Regressions found against a larger Tower projection. The design fixture carries 8 programs, no tool
 * rollouts and a finance status on every case, so none of these could surface against it.
 */
describe("Verdict panel against live-shaped data", () => {
  function withRows(
    rows: ReadonlyArray<{ financeStatus: string | null; promisedUsd: number; populationKind?: "ai_case" | "tool_rollout" }>,
  ) {
    const v = viewWith();
    return {
      ...v,
      allInitiatives: rows.map((r, i) => ({
        ...(v.allInitiatives[0] ?? {}),
        n: i + 1,
        id: `BC-${i}`,
        name: `Case ${i}`,
        financeStatus: r.financeStatus,
        promisedUsd: r.promisedUsd,
        populationKind: r.populationKind ?? "ai_case",
      })),
    } as typeof v;
  }

  it("counts business cases only, never cases plus tool rollouts", () => {
    // Tool rollouts share the collection but have a different declared population.
    render(
      <VerdictPanel
        view={withRows([
          { financeStatus: "sponsor_claimed", promisedUsd: 1 },
          { financeStatus: "finance_validated_actual", promisedUsd: 2 },
          { financeStatus: null, promisedUsd: 0, populationKind: "tool_rollout" },
          { financeStatus: null, promisedUsd: 0, populationKind: "tool_rollout" },
        ])}
      />,
    );
    expect(screen.getByText(/Where 2 AI use cases stand/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Where 4 AI use cases stand/);
  });

  it("does not repeat the claimable figure when no case carries a status", () => {
    render(
      <VerdictPanel
        view={withRows([
          { financeStatus: null, promisedUsd: 0 },
          { financeStatus: null, promisedUsd: 0 },
        ])}
      />,
    );
    // Recharts omits labels on zero-width bars, so the absence is carried by the note rather than
    // a chart label. What matters is that the middle bar does not silently repeat the board figure.
    expect(document.body.textContent).toMatch(
      /2 of 2 AI use cases have no Finance status loaded/,
    );
    // A repeated zero-width middle bar must not copy another figure into a missing case status.
    const repeats = (document.body.textContent ?? "").split("$0.0M").length - 1;
    expect(repeats).toBeLessThan(3);
  });

  it("sums asserted value on validated cases, not the validated amount", () => {
    render(
      <VerdictPanel
        view={withRows([
          { financeStatus: "finance_validated_actual", promisedUsd: 40_000_000 },
          { financeStatus: "sponsor_claimed", promisedUsd: 90_000_000 },
        ])}
      />,
    );
    expect(document.body.textContent).toMatch(/\$40\.0M/);
  });
});
