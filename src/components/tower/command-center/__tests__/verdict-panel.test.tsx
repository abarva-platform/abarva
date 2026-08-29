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
      screen.getByText(/Nothing is claimable until Finance validates actuals/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Foundation rows carry no direct value/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/AI status comes from classification, not a label/),
    ).toBeInTheDocument();
  });

  it("keeps the cadence rule that stops cross-cadence summing", () => {
    render(<VerdictPanel view={viewWith()} />);
    expect(document.body.textContent).toMatch(
      /aggregate by month only — never across cadences/,
    );
  });

  it("renders an absent budget as a gap, never as zero", () => {
    render(<VerdictPanel view={viewWith({ totalItBudgetFy26: null })} />);
    const budget = screen.getByText("Total IT budget").parentElement;
    expect(budget?.textContent).toContain("Not loaded");
    expect(budget?.textContent).not.toContain("$0");
  });

  it("headlines the blocked state when nothing is claimable", () => {
    render(<VerdictPanel view={viewWith()} />);
    expect(
      screen.getByRole("heading", { level: 2 }).textContent,
    ).toMatch(/No asserted value clears the board today\./);
  });

  it("does not claim a share of asserted value when none is asserted", () => {
    render(<VerdictPanel view={viewWith({ promisedValueFy26: 0 })} />);
    expect(document.body.textContent).toMatch(
      /No asserted value is recorded, so no share of it can be claimable\./,
    );
  });
});

/**
 * Regressions found only against live Meridian data. The design fixture carries 8 programs, no tool
 * rollouts and a finance status on every case, so none of these could surface against it.
 */
describe("Verdict panel against live-shaped data", () => {
  function withRows(
    rows: ReadonlyArray<{ financeStatus: string | null; promisedUsd: number }>,
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
      })),
    } as typeof v;
  }

  it("counts business cases only, never cases plus tool rollouts", () => {
    // Tool rollouts share the collection but carry no finance status.
    render(
      <VerdictPanel
        view={withRows([
          { financeStatus: "sponsor_claimed", promisedUsd: 1 },
          { financeStatus: "finance_validated_actual", promisedUsd: 2 },
          { financeStatus: null, promisedUsd: 0 },
          { financeStatus: null, promisedUsd: 0 },
        ])}
      />,
    );
    expect(screen.getByText(/Where the 2 cases stand/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Where the 4 cases stand/);
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
      /No case carries a finance status in this read/,
    );
    // "$0.0M" appears on the board-claimable card and its gate bar; a third occurrence would mean
    // the middle bar had silently copied it.
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
