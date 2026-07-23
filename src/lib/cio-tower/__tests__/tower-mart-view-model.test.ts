import { azureRead } from "@/lib/data-plane/azureRead";
import { loadTowerMartCommandView } from "../tower-mart-view-model";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const queryMock = azureRead.query as jest.MockedFunction<typeof azureRead.query>;

describe("loadTowerMartCommandView", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("does not let candidate opportunities crowd out the active AI portfolio slice", async () => {
    queryMock
      .mockResolvedValueOnce([
        {
          command_center_key: "command-meridian",
          tenant_key: "meridian-health",
          tenant_name: "Healthcare Demo",
          mart_version: "tower_mart_v1",
          source_standard: "v3",
          formula_version: "tower_formula_v1",
          total_it_budget_fy26: "650000000",
          run_budget_fy26: "487500000",
          change_budget_fy26: "162500000",
          approved_program_budget_fy26: "291900000",
          ai_tagged_spend_fy26_non_additive: "53700000",
          promised_value_fy26: "35500000",
          partial_finance_validated_value_ytd: "3800000",
          realized_value_ytd_allowed: "0",
          candidate_ai_opportunities: 243,
          watch_pressure_signals: 0,
          run_ratio: "0.75",
          change_ratio: "0.25",
          finance_validation_ratio: "0.1",
          decision_question: "Which AI bets deserve more capital?",
          executive_summary: "Evidence-gated Tower mart.",
          source_files: [],
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          total: 255,
          candidate: 243,
          active: 12,
          funded: 4,
          embedded_or_usage: 8,
          attributed_spend_usd: "0",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(
      loadTowerMartCommandView({ tenantKeyCandidates: ["meridian"] }),
    ).resolves.toMatchObject({
      aiPortfolioCounts: {
        total: 255,
        candidate: 243,
        active: 12,
      },
    });

    const aiPortfolioQuery = queryMock.mock.calls
      .map(([sql]) => String(sql))
      .find((sql) => sql.includes("cio_tower.mart_ai_portfolio") && sql.includes("select *"));

    expect(aiPortfolioQuery).toContain("when 'funded_program' then 0");
    expect(aiPortfolioQuery).toContain("when 'embedded_platform' then 1");
    expect(aiPortfolioQuery).toContain("when 'usage_benefit' then 2");
    expect(aiPortfolioQuery).toContain("when 'candidate_opportunity' then 3");
    expect(aiPortfolioQuery?.toLowerCase()).not.toContain("limit 80");
  });
});
