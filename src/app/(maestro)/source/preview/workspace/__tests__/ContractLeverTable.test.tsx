/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { ContractLeverTable } from "../ContractLeverTable";

function vmFor(
  opportunities: Array<Record<string, unknown>>,
) {
  return {
    opportunityView: {
      opportunities,
      potential: { total: "$1.02M" },
    },
  } as never;
}

function opportunity(overrides: Record<string, unknown> = {}) {
  return {
    id: "OPP-1",
    label: "Re-time the commitment",
    shortLabel: "Re-time commitment",
    valueType: "Negotiated Improvement",
    timingDependency: "Before renewal",
    stage: "Quantified",
    stageRaw: "quantified",
    amountUsd: 620000,
    amount: "$620K",
    buyerAsk: "Tie the commitment to production gates.",
    vendorConcession: "The vendor keeps the opportunity to grow usage.",
    owner: "Technology Finance",
    priority: "P0",
    deadline: "Before renewal",
    blockingGap: null,
    ...overrides,
  };
}

describe("ContractLeverTable", () => {
  it("renders one table and never exposes a signal-stage amount", () => {
    render(
      <ContractLeverTable
        vm={vmFor([
          opportunity(),
          opportunity({
            id: "OPP-2",
            label: "Discount band review",
            shortLabel: "Discount band review",
            stage: "Signal",
            stageRaw: "signal",
            amountUsd: 270000,
            amount: "$270K",
            blockingGap: "Benchmark comparable required",
          })
        ])}
      />,
    );

    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(screen.getByText("$620K")).toBeTruthy();
    expect(
      screen.getByText("Not sized — benchmark comparable required"),
    ).toBeTruthy();
    expect(screen.queryByText("$270K")).toBeNull();
  });

  it("keeps signal-stage amounts out of the candidate total", () => {
    render(
      <ContractLeverTable
        vm={vmFor([
          opportunity(),
          opportunity({
            id: "OPP-2",
            stage: "Signal",
            stageRaw: "signal",
            amountUsd: 270000,
            amount: "$270K",
          }),
        ])}
      />,
    );

    const total = document.querySelector(".sw-c3-lever-total-note")?.textContent;
    expect(total).toContain("Total candidate across the 1 sized lever");
    expect(total).toContain("1 further ask carries no amount");
  });
});
