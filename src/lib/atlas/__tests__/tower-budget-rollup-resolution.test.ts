import { resolveTowerBudgetRollups } from "@/lib/atlas/tower-grounding";
import type { TowerBudgetRollup } from "@/lib/tower/tower-budget-rollups";

function rollup(
  portfolioCompany: string,
  totalItBudgetUsd: number,
): TowerBudgetRollup {
  return {
    portfolioCompany,
    fiscalYear: "FY2026",
    totalItBudgetUsd,
    actualSpendYtdUsd: 0,
    forecastSpendUsd: null,
    opexAmountUsd: 0,
    capexAmountUsd: 0,
    runAmountUsd: 0,
    changeAmountUsd: 0,
    vendorAmountUsd: 0,
    laborAmountUsd: 0,
    revenueUsd: null,
    employees: null,
    itSpendAsPctRevenue: null,
  };
}

describe("resolveTowerBudgetRollups", () => {
  it("uses governed cio_tower rollups as the complete dashboard source when present", () => {
    const governed = [
      rollup("Cloud and Infrastructure", 174_800_000),
      rollup("Manufacturing and OT Systems", 161_800_000),
    ];
    const staleDerived = [
      rollup("Cloud And Infrastructure", 201_200_000),
      rollup("Manufacturing And OT Systems", 180_100_000),
      rollup("SAP And ERP Platforms", 161_500_000),
    ];

    const resolved = resolveTowerBudgetRollups(governed, staleDerived);

    expect(resolved).toEqual(governed);
    expect(resolved).not.toEqual(expect.arrayContaining(staleDerived));
  });

  it("falls back to derived initiative rollups only when governed rows are absent", () => {
    const derived = [
      rollup("Crew recovery and legality", 28_300_000),
      rollup("IROPS recovery decisioning", 26_500_000),
    ];

    expect(resolveTowerBudgetRollups([], derived)).toEqual(derived);
  });
});
