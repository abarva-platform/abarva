import {
  buildContractDepthScenario,
  contractDepthQualityGate,
} from "@/lib/source/data-model/contract-depth-demo-slice";

describe("contract depth demo slice", () => {
  it("builds a 12-month SLA credit scenario with explicit unclaimed credits", () => {
    const scenario = buildContractDepthScenario({ asOfMonth: "2026-08-01" });

    expect(scenario.months).toHaveLength(12);
    expect(scenario.annualSpendUsd).toBe(8_588_000);
    expect(scenario.missedMonthCount).toBe(3);
    expect(
      scenario.months
        .filter((month) => month.breached)
        .map((month) => ({
          monthStart: month.monthStart,
          actual: month.slaActualPct,
          creditOwed: month.creditOwedUsd,
          creditClaimed: month.creditClaimedUsd,
        })),
    ).toEqual([
      {
        monthStart: "2026-02-01",
        actual: 89,
        creditOwed: 14333.34,
        creditClaimed: 0,
      },
      {
        monthStart: "2026-04-01",
        actual: 91,
        creditOwed: 14333.34,
        creditClaimed: 0,
      },
      {
        monthStart: "2026-07-01",
        actual: 90,
        creditOwed: 14333.34,
        creditClaimed: 0,
      },
    ]);
    expect(scenario.unclaimedCreditUsd).toBe(43_000.02);
    expect(contractDepthQualityGate(scenario)).toEqual([]);
  });
});
