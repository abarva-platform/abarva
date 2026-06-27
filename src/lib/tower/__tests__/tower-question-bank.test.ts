import {
  buildTowerQuestionBank,
  summarizeTowerQuestionBank,
} from "../tower-question-bank";

describe("Tower semantic question bank", () => {
  const bank = buildTowerQuestionBank();
  const summary = summarizeTowerQuestionBank(bank);

  it("generates a large enough bank for release-gate coverage", () => {
    expect(summary.total).toBeGreaterThanOrEqual(3500);
    expect(summary.metricQuestionCount).toBeGreaterThanOrEqual(3000);
    expect(summary.deterministicQuestionCount).toBeGreaterThanOrEqual(3000);
  });

  it("keeps IDs stable and unique", () => {
    const ids = new Set(bank.map((item) => item.id));
    expect(ids.size).toBe(bank.length);
    expect(bank[0]?.id).toBe("tower-q-00001");
  });

  it("covers the major Tower routes and intents", () => {
    expect(summary.byRoute.deterministic).toBeGreaterThan(0);
    expect(summary.byRoute.dossier).toBeGreaterThan(0);
    expect(summary.byRoute.handoff).toBeGreaterThan(0);
    expect(summary.byIntent.lookup).toBeGreaterThan(0);
    expect(summary.byIntent.compare).toBeGreaterThan(0);
    expect(summary.byIntent.table).toBeGreaterThan(0);
    expect(summary.byIntent.chart).toBeGreaterThan(0);
    expect(summary.byIntent.graph).toBeGreaterThan(0);
    expect(summary.byIntent.advisory).toBeGreaterThan(0);
  });

  it("routes factual metric questions through deterministic read models", () => {
    const metricItems = bank.filter((item) => item.category === "metric");
    expect(metricItems.length).toBeGreaterThan(3000);
    expect(metricItems.every((item) => item.route === "deterministic")).toBe(
      true,
    );
    expect(
      metricItems.every((item) =>
        item.guardrails.includes("must match dashboard metric contract"),
      ),
    ).toBe(true);
  });

  it("includes the Tower metrics that caused dashboard/chat contradictions", () => {
    const requiredMetrics = new Set([
      "loaded_it_budget",
      "loaded_program_budget",
      "portfolio_company_it_budget",
      "shared_services_allocation",
      "vendor_exposure",
      "value_gap",
      "run_change_split",
      "capex_opex_split",
      "ai_spend",
      "portfolio_roi",
    ]);
    const presentMetrics = new Set(
      bank.flatMap((item) => item.requiredMetrics),
    );
    for (const metric of requiredMetrics) {
      expect(presentMetrics.has(metric)).toBe(true);
    }
  });

  it("keeps advisory questions dossier-bound instead of metric-authoritative", () => {
    const advisoryItems = bank.filter((item) => item.category === "advisory");
    expect(advisoryItems.length).toBeGreaterThan(500);
    expect(advisoryItems.every((item) => item.route === "dossier")).toBe(true);
    expect(
      advisoryItems.every((item) =>
        item.guardrails.includes("must build dossier from Tower read models"),
      ),
    ).toBe(true);
  });
});
