/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";

import type { SourceContractSpendMonthlyRow } from "@/lib/source/data-model/types";
import {
  ContractEconomicsBriefing,
  ContractConsumptionMix,
  ContractPerformanceCards,
} from "../Contract360Economics";
import type { SourceWorkspaceVM } from "../buildViewModel";

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
  within(
    screen.getByRole("row", { name: new RegExp(`^${measure}`) }),
  ).getAllByRole("cell")[0].textContent;

describe("ContractEconomicsBriefing billing coverage", () => {
  it("keeps a January reporting date in January west of UTC", () => {
    const format = Date.prototype.toLocaleDateString;
    const formatter = jest
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockImplementation(function (this: Date, locale, options) {
        return format.call(this, locale, {
          timeZone: "America/Chicago",
          ...options,
        });
      });
    try {
      render(
        <ContractEconomicsBriefing spendMonths={[month("2027-01", 50, 50)]} />,
      );
      expect(
        screen.getByText("Jan", { selector: ".sw-c3-chart-axis span" }),
      ).toBeTruthy();
      expect(
        screen.queryByText("Dec", { selector: ".sw-c3-chart-axis span" }),
      ).toBeNull();
    } finally {
      formatter.mockRestore();
    }
  });
  it("does not re-label monetary spend as measured consumption on Performance", () => {
    const vm = {
      contractEducation: {
        facetRequirements: { Performance: { state: "not_required" } },
      },
    } as SourceWorkspaceVM;
    const spend = [{ ...month("2026-01", 50, 50), business_unit: "Platform" }];
    render(
      <>
        <ContractConsumptionMix spendMonths={spend} vm={vm} />
        <ContractPerformanceCards spendMonths={spend} tagQuality={[]} vm={vm} />
      </>,
    );
    expect(
      screen.getByText("Recorded spend against monetary commitment"),
    ).toBeTruthy();
    expect(
      screen.queryByText(
        /whole commitment|of consumption|Where the consumption|Consumption against commitment|Delivery is not the problem/i,
      ),
    ).toBeNull();
  });
  it("names monetary spend without claiming measured usage or rate judgement", () => {
    render(
      <ContractEconomicsBriefing spendMonths={[month("2026-01", 40, 25)]} />,
    );
    expect(amountFor("Recorded spend")).toBe("$50");
    expect(screen.getByText("Commitment against recorded spend")).toBeTruthy();
    expect(
      screen.queryByText(/Consumed|observed usage|rate is not the problem/i),
    ).toBeNull();
  });

  it("withholds spend and the gap when a loaded row lacks actual spend", () => {
    const missing = { ...month("2026-02", 40, 25), actual_spend: null };
    const { container } = render(
      <ContractEconomicsBriefing
        spendMonths={[month("2026-01", 40, 25), missing]}
      />,
    );
    expect(amountFor("Recorded spend")).toBe("Incomplete");
    expect(amountFor("Commitment less recorded spend")).toBe("Not established");
    expect(
      container.querySelector('polyline[data-measure="actual-spend"]'),
    ).toBeNull();
  });

  it("keeps recorded zero spend distinct from missing spend", () => {
    const zero = { ...month("2026-01", 0, 0), actual_spend: 0 };
    render(<ContractEconomicsBriefing spendMonths={[zero]} />);
    expect(amountFor("Recorded spend")).toBe("$0");
    expect(amountFor("Commitment less recorded spend")).toBe("$100");
  });

  it("withholds billing amounts and reconciliation when neither lane is recorded", () => {
    const { container } = render(
      <ContractEconomicsBriefing
        spendMonths={[month("2026-01", null, null)]}
      />,
    );

    expect(amountFor("Invoiced")).toBe("Incomplete");
    expect(amountFor("Paid")).toBe("Incomplete");
    expect(screen.getByText(/Invoice coverage: 0 of 1 month/)).toBeTruthy();
    expect(screen.getByText(/Paid coverage: 0 of 1 month/)).toBeTruthy();
    expect(screen.getByText(/Billing reconciliation unavailable/)).toBeTruthy();
    expect(screen.queryByText(/no billing leakage/i)).toBeNull();
    expect(screen.queryByText("Reconciled")).toBeNull();
    expect(
      container.querySelectorAll(".sw-c3-chart-svg polyline"),
    ).toHaveLength(2);
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
    expect(
      screen.getByText(/Invoiced and paid agree across 2 recorded months/),
    ).toBeTruthy();
    expect(
      container.querySelectorAll(".sw-c3-chart-svg polyline"),
    ).toHaveLength(3);
    expect(screen.queryByText(/annual contract value/i)).toBeNull();
  });

  it("shows a period billing difference when both lanes are complete", () => {
    render(
      <ContractEconomicsBriefing spendMonths={[month("2026-01", 40, 25)]} />,
    );

    expect(amountFor("Invoiced")).toBe("$40");
    expect(amountFor("Paid")).toBe("$25");
    expect(
      screen.getByText(
        /\$15 sits between invoiced and paid across 1 recorded month/,
      ),
    ).toBeTruthy();
  });
});
