import { renderToStaticMarkup } from "react-dom/server";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import type { TowerMartSourceValueRow } from "@/lib/tower/current-layer-view-model";

import { AiPortfolioContractView, ValueProofContractView } from "../ContractTabs";

const outcome: TowerMartSourceValueRow = {
  id: "metric:one", kind: "outcome_measure", title: "Time to complete review",
  sourceFiles: ["14_metrics_outcomes.csv"],
  baseline: "10 days", target: "6 days", observed: "8 days",
  baselinePeriod: "2026-Q1", observedPeriod: "2026-Q2",
  kpiName: null, kpiUnit: null, kpiPeriodStart: null, kpiPeriodEnd: null,
  sourceDataSource: "Operations system", sourceCalculationBasis: "Median elapsed days",
  moneyAssertions: [{ sourceField: "source_asserted_finance_value_usd", label: "Outcome source: Finance amount stated", amountUsd: 700_000 }],
  statusAssertions: [{ sourceField: "source_value_claim_status", label: "Source claim status", code: "claimable" }],
};

const feed: TowerMartSourceValueRow = {
  id: "ai-feed-one", kind: "ai_feed_claim", title: "Separate AI feed record",
  sourceFiles: ["SA08_AI_Benefits_Realization_Usage_Ledger.csv", "SA09_AI_Tool_Usage_Feed.csv", "SA11_AI_KPI_Operational_Outcome_Feed.csv"],
  baseline: "15 days", target: "8 days", observed: null,
  baselinePeriod: null, observedPeriod: null,
  kpiName: "Review turnaround", kpiUnit: "days", kpiPeriodStart: "2026-01-01", kpiPeriodEnd: "2026-06-30",
  sourceDataSource: null, sourceCalculationBasis: null,
  moneyAssertions: [
    { sourceField: "source_asserted_finance_value_usd", label: "Benefit feed: Finance amount stated", amountUsd: 1_000_000 },
    { sourceField: "usage_feed_source_finance_assertion_usd", label: "Usage feed: Finance amount stated", amountUsd: 900_000 },
    { sourceField: "outcome_feed_source_finance_assertion_usd", label: "KPI feed: Finance amount stated", amountUsd: 800_000 },
  ],
  statusAssertions: [{ sourceField: "source_finance_validation_status", label: "Benefit feed Finance status", code: "finance_validated" }],
};

it("shows distinct v6 source assertions in Value Proof without promoting any amount to approved or claimable", () => {
  const base = buildTowerCommandCenterView(designFixtureMart(), { tenantName: "Example" });
  if (!base) throw new Error("Tower fixture missing");
  const html = renderToStaticMarkup(<ValueProofContractView
    view={{ ...base, valueTrajectory: [], sourceValueRows: [outcome, feed], programs: base.programs.map((program, index) => ({
      ...program, sourceExpectedValueUsd: index === 0 ? 3_000_000 : null,
      promisedBenefitLoaded: index === 0 ? false : program.promisedBenefitLoaded,
    })), summary: {
      ...base.summary, approvedInvestmentUsd: null, claimableAmountLoaded: false, claimableUsd: 0,
    } }}
    onOpenProgram={() => undefined}
  />);
  expect(html).toContain("See 1 source outcome measure");
  expect(html).toContain("Expected value in source plan");
  expect(html).toContain("Not verified as a yearly benefit");
  expect(html).toContain("Expected values are source-stated plans with no verified fiscal period or approval");
  expect(html).toContain("Starting point:</b> 10 days");
  expect(html).toContain("Outcome source: Finance amount stated:</b> $700,000");
  expect(html).toContain("See 1 AI source group");
  expect(html).toContain("Benefit feed: Finance amount stated:</b> $1,000,000");
  expect(html).toContain("Usage feed: Finance amount stated:</b> $900,000");
  expect(html).toContain("KPI feed: Finance amount stated:</b> $800,000");
  expect(html).toContain("source code: finance_validated");
  expect(html).toContain("not approved funding, verified savings, or a benefit Tower can report");
  expect(html).toContain("No amount below is cleared for reporting");
  expect(html).toContain("separate source outcome observations below are operational measures, not quarterly financial results");
  const aiHtml = renderToStaticMarkup(<AiPortfolioContractView
    view={{ ...base, sourceValueRows: [feed] }}
    onOpenAi={() => undefined} onOpenAction={() => undefined} onOpenGap={() => undefined}
  />);
  expect(aiHtml).toContain("1 AI source group is shown under Results and proof");
  expect(aiHtml).toContain("does not attach their amounts or statuses to a case");
});
