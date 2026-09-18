/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";

import type { SourceContractSpendMonthlyRow } from "@/lib/source/data-model/types";
import { ContractEconomicsBriefing } from "../Contract360Economics";

const month = (
  period: string,
  invoice: number | null,
  paid: number | null,
): SourceContractSpendMonthlyRow =>
  ({
    contract_id: "C1",
    month: period,
    period_start: `${period}-01`,
    committed_amount: 100,
    actual_spend: 50,
    invoice_amount: invoice,
    paid_amount: paid,
  }) as SourceContractSpendMonthlyRow;

const amountFor = (measure: string) =>
  within(screen.getByRole("row", { name: new RegExp(`^${measure}`) })).getAllByRole("cell")[0]
    .textContent;

describe("ContractEconomicsBriefing billing coverage", () => {
  it("withholds billing amounts and reconciliation when neither lane is recorded", () => {
    const { container } = render(
      <ContractEconomicsBriefing spendMonths={[month("2026-01", null, null)]} />,
    );

    expect(amountFor("Invoiced")).toBe("Incomplete");
    expect(amountFor("Paid")).toBe("Incomplete");
    expect(screen.getByText(/Invoice coverage: 0 of 1 month/)).toBeTruthy();
    expect(screen.getByText(/Paid coverage: 0 of 1 month/)).toBeTruthy();
    expect(screen.getByText(/Billing reconciliation unavailable/)).toBeTruthy();
    expect(screen.queryByText(/no billing leakage/i)).toBeNull();
    expect(screen.queryByText("Reconciled")).toBeNull();
    expect(container.querySelectorAll(".sw-c3-chart-svg polyline")).toHaveLength(2);
  });

  it("requires both lanes in every loaded month, even when one lane has values", () => {
    render(
      <ContractEconomicsBriefing
        spendMonths={[month("2026-01", 40, 40), month("2026-02", 60, null)]}
      />,
    );

    expect(amountFor("Invoiced")).toBe("Incomplete");
    expect(amountFor("Paid")).toBe("Incomplete");
    expect(screen.getByText(/Invoice coverage: 2 of 2 months/)).toBeTruthy();
    expect(screen.getByText(/Paid coverage: 1 of 2 months/)).toBeTruthy();
    expect(screen.getByText(/Billing reconciliation unavailable/)).toBeTruthy();
    expect(screen.queryByText(/in flight|no billing leakage/i)).toBeNull();
  });

  it("marks a month incomplete if any row in that month lacks billing evidence", () => {
    render(
      <ContractEconomicsBriefing
        spendMonths={[month("2026-01", 40, 40), month("2026-01", null, 0)]}
      />,
    );

    expect(screen.getByText(/Invoice coverage: 0 of 1 month/)).toBeTruthy();
    expect(screen.getByText(/Paid coverage: 1 of 1 month/)).toBeTruthy();
    expect(amountFor("Invoiced")).toBe("Incomplete");
    expect(amountFor("Paid")).toBe("Incomplete");
  });

  it("treats recorded zero as complete and compares only the loaded period", () => {
    const { container } = render(
      <ContractEconomicsBriefing
        spendMonths={[month("2026-01", 0, 0), month("2026-02", 0, 0)]}
      />,
    );

    expect(amountFor("Invoiced")).toBe("$0");
    expect(amountFor("Paid")).toBe("$0");
    expect(screen.getByText(/Invoice coverage: 2 of 2 months/)).toBeTruthy();
    expect(screen.getByText(/Paid coverage: 2 of 2 months/)).toBeTruthy();
    expect(screen.getByText(/Invoiced and paid agree across 2 recorded months/)).toBeTruthy();
    expect(container.querySelectorAll(".sw-c3-chart-svg polyline")).toHaveLength(3);
    expect(screen.queryByText(/annual contract value/i)).toBeNull();
  });

  it("shows a period billing difference when both lanes are complete", () => {
    render(<ContractEconomicsBriefing spendMonths={[month("2026-01", 40, 25)]} />);

    expect(amountFor("Invoiced")).toBe("$40");
    expect(amountFor("Paid")).toBe("$25");
    expect(screen.getByText(/\$15 sits between invoiced and paid across 1 recorded month/)).toBeTruthy();
  });
});
