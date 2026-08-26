/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import {
  ValueBridgeChart,
  ValueProvenBarChart,
  BudgetRunChangeChart,
  BenchmarkComparisonChart,
  BenchmarkTenantCards,
  BenchmarkRadarChart,
} from "../TowerCxoCharts";
import type {
  CioTowerPortfolioValueRow,
  CioTowerCxoBenchmarkRow,
} from "@/lib/tower/cxo-view-model-contract";
import type { TowerBudgetRollup } from "@/lib/tower/tower-budget-rollups";

const portfolioRow: CioTowerPortfolioValueRow = {
  program: "OneData Platform",
  owner: "R. Okafor",
  blocker: "none",
  budgetNumeric: 18_400_000,
  budget: "$18.4M",
  actualSpendNumeric: 4_000_000,
  actualSpend: "$4.0M",
  promisedValueNumeric: 31_000_000,
  promisedValue: "$31.0M",
  measuredValueNumeric: 12_600_000,
  measuredValue: "$12.6M",
  valueGapNumeric: 18_400_000,
  valueGap: "$18.4M",
  spendBurnRate: "22%",
  valueRealizationRate: "41%",
  measuredValuePerDollarSpent: "3.15x",
  evidenceStatus: "loaded",
  inspectionReason: "widest gap",
  confidence: "high",
  source: "value_facts.csv",
  sourceFactKeys: ["fact-1"],
};

const budgetRollup: TowerBudgetRollup = {
  portfolioCompany: "Lakeshore Shared Services",
  fiscalYear: "FY2026",
  totalItBudgetUsd: 48_000_000,
  actualSpendYtdUsd: 10_000_000,
  forecastSpendUsd: null,
  opexAmountUsd: 0,
  capexAmountUsd: 0,
  runAmountUsd: 40_000_000,
  changeAmountUsd: 8_000_000,
  vendorAmountUsd: 0,
  laborAmountUsd: 0,
  revenueUsd: null,
  employees: null,
  itSpendAsPctRevenue: null,
};

const benchmarkRow: CioTowerCxoBenchmarkRow = {
  tenantKey: "lakeshore-holdings",
  label: "This tenant",
  isCurrent: true,
  totalBudget: 193_600_000,
  runBudget: 143_000_000,
  changeBudget: 50_000_000,
  initiativeBudget: 50_000_000,
  actualSpendYtd: 40_000_000,
  promisedValue: 60_000_000,
  measuredValue: 30_000_000,
};

describe("TowerCxoCharts smoke", () => {
  it("renders ValueBridgeChart without crashing", () => {
    const { container } = render(<ValueBridgeChart program={portfolioRow} />);
    expect(container.textContent).toContain("validated");
    expect(container.textContent).toContain("OneData Platform");
  });

  it("renders ValueProvenBarChart without crashing", () => {
    const { container } = render(<ValueProvenBarChart rows={[portfolioRow]} />);
    expect(container.textContent).toContain("Finance validation vs. promised");
  });

  it("renders BudgetRunChangeChart without crashing", () => {
    const { container } = render(
      <BudgetRunChangeChart rows={[budgetRollup]} />,
    );
    expect(container.textContent).toContain("Run keeps the lights on");
  });

  it("renders BenchmarkComparisonChart without crashing", () => {
    const { container } = render(
      <BenchmarkComparisonChart rows={[benchmarkRow]} />,
    );
    expect(container.textContent).toContain("Every measure, one shape");
  });

  it("renders BenchmarkTenantCards without crashing", () => {
    const { container } = render(
      <BenchmarkTenantCards
        rows={[benchmarkRow]}
        currentTenantName="Lakeshore Industries"
      />,
    );
    expect(container.textContent).toContain("Lakeshore Industries");
  });

  it("renders BenchmarkRadarChart without crashing", () => {
    const { container } = render(<BenchmarkRadarChart rows={[benchmarkRow]} />);
    expect(container.textContent).toContain("Every measure, one shape");
  });

  it("returns null for empty rows instead of an empty chart shell", () => {
    const { container: c1 } = render(<ValueProvenBarChart rows={[]} />);
    const { container: c2 } = render(<BudgetRunChangeChart rows={[]} />);
    const { container: c3 } = render(<BenchmarkComparisonChart rows={[]} />);
    const { container: c4 } = render(
      <BenchmarkTenantCards rows={[]} currentTenantName="Lakeshore" />,
    );
    const { container: c5 } = render(<BenchmarkRadarChart rows={[]} />);
    expect(c1.firstChild).toBeNull();
    expect(c2.firstChild).toBeNull();
    expect(c3.firstChild).toBeNull();
    expect(c4.firstChild).toBeNull();
    expect(c5.firstChild).toBeNull();
  });
});
