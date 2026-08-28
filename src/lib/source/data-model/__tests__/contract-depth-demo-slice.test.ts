import {
  buildContractDepthScenario,
  contractDepthOpportunityId,
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

  it("scopes optimization opportunity identity by dataset version", () => {
    expect(
      contractDepthOpportunityId({
        contractId: "CTR-0002",
        datasetVersion: "meridian-contract-depth-ctr0002-sla-credit-v1-20260828",
      }),
    ).toBe(
      "CTR-0002:sla-credit-recovery:meridian-contract-depth-ctr0002-sla-credit-v1-20260828",
    );
    expect(
      contractDepthOpportunityId({
        contractId: "CTR-0002",
        datasetVersion: "prior-load/v1",
      }),
    ).toBe("CTR-0002:sla-credit-recovery:prior-load-v1");
  });
});
