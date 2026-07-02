import {
  buildTowerFactualSpineAnswer,
  isTowerFactualSpineCandidate,
} from "@/lib/atlas/tower-factual-spine";
import type { AtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";

const towerState = {
  client: {
    clientId: "lakeshore",
    clientName: "Lakeshore Holdings",
    tenantKey: "lakeshore",
    industryCode: "GENERAL",
  },
  todayIso: "2026-06-26",
  activeLens: "value",
  substrateCounts: {
    initiatives: 8,
    vendors: 6,
    kpiSnapshots: 0,
    decisions: 0,
    scenarios: 0,
    stakeholderNotes: 0,
    pressures: 4,
    observations: 0,
    alignmentDots: 0,
  },
  budgetRollups: [
    {
      portfolioCompany: "Northline Logistics Group",
      fiscalYear: "FY2026",
      totalItBudgetUsd: 62_000_000,
      actualSpendYtdUsd: 31_000_000,
      forecastSpendUsd: null,
      opexAmountUsd: 42_000_000,
      capexAmountUsd: 20_000_000,
      runAmountUsd: 35_686_000,
      changeAmountUsd: 26_314_000,
      vendorAmountUsd: 41_000_000,
      laborAmountUsd: 21_000_000,
      revenueUsd: 3_100_000_000,
      employees: 7_500,
      itSpendAsPctRevenue: 0.02,
    },
    {
      portfolioCompany: "Crestpoint Marketing Services",
      fiscalYear: "FY2026",
      totalItBudgetUsd: 38_000_000,
      actualSpendYtdUsd: 19_000_000,
      forecastSpendUsd: null,
      opexAmountUsd: 25_000_000,
      capexAmountUsd: 13_000_000,
      runAmountUsd: 23_000_000,
      changeAmountUsd: 15_000_000,
      vendorAmountUsd: 16_000_000,
      laborAmountUsd: 22_000_000,
      revenueUsd: 1_400_000_000,
      employees: 2_400,
      itSpendAsPctRevenue: 0.027,
    },
    {
      portfolioCompany: "Riverton Consumer Products",
      fiscalYear: "FY2026",
      totalItBudgetUsd: 36_000_000,
      actualSpendYtdUsd: 18_000_000,
      forecastSpendUsd: null,
      opexAmountUsd: 21_000_000,
      capexAmountUsd: 15_000_000,
      runAmountUsd: 20_000_000,
      changeAmountUsd: 16_000_000,
      vendorAmountUsd: 14_000_000,
      laborAmountUsd: 22_000_000,
      revenueUsd: 1_200_000_000,
      employees: 2_100,
      itSpendAsPctRevenue: 0.03,
    },
    {
      portfolioCompany: "Lakeshore Shared Services",
      fiscalYear: "FY2026",
      totalItBudgetUsd: 12_000_000,
      actualSpendYtdUsd: 5_800_000,
      forecastSpendUsd: null,
      opexAmountUsd: 8_300_000,
      capexAmountUsd: 3_700_000,
      runAmountUsd: 8_300_000,
      changeAmountUsd: 3_700_000,
      vendorAmountUsd: 6_000_000,
      laborAmountUsd: 6_000_000,
      revenueUsd: null,
      employees: null,
      itSpendAsPctRevenue: null,
    },
    {
      portfolioCompany: "Arborfield Workplace Services",
      fiscalYear: "FY2026",
      totalItBudgetUsd: 9_500_000,
      actualSpendYtdUsd: 4_700_000,
      forecastSpendUsd: null,
      opexAmountUsd: 6_000_000,
      capexAmountUsd: 3_500_000,
      runAmountUsd: 5_500_000,
      changeAmountUsd: 4_000_000,
      vendorAmountUsd: 4_500_000,
      laborAmountUsd: 5_000_000,
      revenueUsd: 800_000_000,
      employees: 900,
      itSpendAsPctRevenue: 0.011875,
    },
  ],
  initiatives: [
    {
      initiativeId: "init-1",
      displayId: "ONE",
      name: "Northline warehouse automation analytics",
      description: "Warehouse analytics",
      primaryCategoryId: "operations",
      primaryCategoryName: "operations",
      secondaryCategoryId: null,
      secondaryCategoryName: null,
      primaryGoalId: "warehouse",
      primaryGoalName: "Warehouse modernization",
      stage: "pilot",
      stageDetail: null,
      ownerName: "COO",
      ownerTitle: "COO",
      ownerFunction: "operations",
      committedAnnualUsd: 3_200_000,
      committedTotalUsd: 3_200_000,
      measuredValueUsd: 2_500_000,
      statusFlag: "value_lag",
      statusSummary: "Value lag until proof is signed.",
      confidenceLevel: "HIGH",
      alignedCallout: false,
      alignedRationale: null,
      loadedViaTemplate: "tower_read_model",
    },
    {
      initiativeId: "init-2",
      displayId: "TWO",
      name: "Shared services IT spend transparency",
      description: "Shared services transparency",
      primaryCategoryId: "shared_services",
      primaryCategoryName: "enterprise shared services",
      secondaryCategoryId: null,
      secondaryCategoryName: null,
      primaryGoalId: "shared",
      primaryGoalName: "Shared services",
      stage: "pilot",
      stageDetail: null,
      ownerName: "CIO",
      ownerTitle: "CIO",
      ownerFunction: "technology",
      committedAnnualUsd: 2_500_000,
      committedTotalUsd: 2_500_000,
      measuredValueUsd: 2_000_000,
      statusFlag: "value_lag",
      statusSummary: "Value proof pending.",
      confidenceLevel: "HIGH",
      alignedCallout: false,
      alignedRationale: null,
      loadedViaTemplate: "tower_read_model",
    },
    {
      initiativeId: "init-3",
      displayId: "THREE",
      name: "Treasury cash visibility standardization",
      description: "Treasury visibility",
      primaryCategoryId: "treasury",
      primaryCategoryName: "treasury",
      secondaryCategoryId: null,
      secondaryCategoryName: null,
      primaryGoalId: "treasury",
      primaryGoalName: "Treasury",
      stage: "pilot",
      stageDetail: null,
      ownerName: "Treasurer",
      ownerTitle: "Treasurer",
      ownerFunction: "treasury",
      committedAnnualUsd: 1_800_000,
      committedTotalUsd: 1_800_000,
      measuredValueUsd: 780_000,
      statusFlag: "value_lag",
      statusSummary: "Value proof pending.",
      confidenceLevel: "HIGH",
      alignedCallout: false,
      alignedRationale: null,
      loadedViaTemplate: "tower_read_model",
    },
    {
      initiativeId: "init-4",
      displayId: "FOUR",
      name: "Collaboration platform standardization",
      description: "Collaboration",
      primaryCategoryId: "workplace",
      primaryCategoryName: "workplace",
      secondaryCategoryId: null,
      secondaryCategoryName: null,
      primaryGoalId: "workplace",
      primaryGoalName: "Workplace",
      stage: "scaled",
      stageDetail: null,
      ownerName: "Workplace IT",
      ownerTitle: "Workplace IT",
      ownerFunction: "workplace",
      committedAnnualUsd: 1_000_000,
      committedTotalUsd: 1_000_000,
      measuredValueUsd: null,
      statusFlag: "healthy",
      statusSummary: "Operating.",
      confidenceLevel: "MED",
      alignedCallout: false,
      alignedRationale: null,
      loadedViaTemplate: "tower_read_model",
    },
  ],
  vendors: [
    {
      vendorId: "v1",
      initiativeId: "init-1",
      initiativeDisplayId: "ONE",
      initiativeName: "Northline warehouse automation analytics",
      vendorName: "SAP",
      contractValueUsd: 8_200_000,
      renewalDate: null,
      financialHealth: "strong",
    },
    {
      vendorId: "v2",
      initiativeId: "init-1",
      initiativeDisplayId: "ONE",
      initiativeName: "Northline warehouse automation analytics",
      vendorName: "AWS",
      contractValueUsd: 7_300_000,
      renewalDate: null,
      financialHealth: "strong",
    },
    {
      vendorId: "v3",
      initiativeId: "init-2",
      initiativeDisplayId: "TWO",
      initiativeName: "Shared services IT spend transparency",
      vendorName: "Salesforce",
      contractValueUsd: 2_600_000,
      renewalDate: null,
      financialHealth: "moderate",
    },
    {
      vendorId: "v4",
      initiativeId: "init-3",
      initiativeDisplayId: "THREE",
      initiativeName: "Treasury cash visibility standardization",
      vendorName: "Salesforce",
      contractValueUsd: 2_400_000,
      renewalDate: null,
      financialHealth: "moderate",
    },
    {
      vendorId: "v5",
      initiativeId: "init-4",
      initiativeDisplayId: "FOUR",
      initiativeName: "Collaboration platform standardization",
      vendorName: "Azure",
      contractValueUsd: 4_200_000,
      renewalDate: null,
      financialHealth: "strong",
    },
  ],
  bandMetrics: {
    deterministicSeed: true,
    isEmpty: false,
    metrics: [
      {
        key: "portfolio_roi",
        label: "Portfolio ROI",
        hero: true,
        value: "gap",
        subtext: "measured value missing",
        confidence: "none",
        tooltip:
          "Committed annual spend is loaded, but verified realized value is incomplete. ROI is a gap, not 0.0x.",
      },
      {
        key: "adoption_rate",
        label: "Adoption",
        hero: false,
        value: "25%",
        subtext: "1 of 4 scaled",
        confidence: "low",
        tooltip:
          "Proxy metric from scaled stage; real adoption requires active-user telemetry.",
      },
    ],
  },
  pressuresView: { cards: [] },
  atlasObservationsView: { observations: [] },
  alignment2x2View: {
    dots: [],
    strategicBets: [],
    totalPlotted: 0,
  },
  kpiSnapshots: [],
  decisions: [],
  scenarios: [],
  stakeholderNotes: [],
} as unknown as AtlasTowerCurrentState;

describe("buildTowerFactualSpineAnswer", () => {
  it("answers total and portfolio budgets from the dashboard rollup", () => {
    const answer = buildTowerFactualSpineAnswer(
      "What is the total IT budget loaded in Tower?",
      towerState,
    );

    expect(answer?.response).toContain("$157.5M");
    expect(answer?.response).toContain("Northline Logistics Group: $62.0M");
    expect(answer?.response).toContain("Lakeshore Shared Services: $12.0M");
  });

  it("uses the dashboard initiative value for Northline warehouse analytics", () => {
    const answer = buildTowerFactualSpineAnswer(
      "What is the budget for the Northline warehouse automation analytics initiative?",
      towerState,
    );

    expect(answer?.response).toContain("$3.2M");
    expect(answer?.response).not.toContain("$9.8M");
  });

  it("answers top-N IT program list questions with the requested number of ranked programs", () => {
    const manyProgramsState = {
      ...towerState,
      client: {
        ...towerState.client,
        clientName: "SkyHarbor Air",
      },
      initiatives: Array.from({ length: 12 }, (_, index) => ({
        ...towerState.initiatives[index % towerState.initiatives.length],
        initiativeId: `init-${index + 1}`,
        displayId: `PROGRAM-${index + 1}`,
        name: `Program ${String(index + 1).padStart(2, "0")}`,
        committedAnnualUsd: (12 - index) * 1_000_000,
        measuredValueUsd: index % 3 === 0 ? null : (12 - index) * 400_000,
        statusFlag: index % 4 === 0 ? "value_lag" : "healthy",
      })),
    } satisfies AtlasTowerCurrentState;

    const answer = buildTowerFactualSpineAnswer(
      "give me the list of top 10 IT programs",
      manyProgramsState,
    );

    expect(answer?.matchedIntent).toBe("tower_top_it_programs");
    expect(answer?.response).toContain(
      "Top 10 IT programs at SkyHarbor Air",
    );
    expect(answer?.response).toContain("1. Program 01");
    expect(answer?.response).toContain("10. Program 10");
    expect(answer?.response).not.toContain("11. Program 11");
  });

  it("answers top-N AI program list questions with budget and measured value separated", () => {
    const aiProgramsState = {
      ...towerState,
      client: {
        ...towerState.client,
        clientName: "SkyHarbor Air",
      },
      initiatives: [
        ...Array.from({ length: 6 }, (_, index) => ({
          ...towerState.initiatives[index % towerState.initiatives.length],
          initiativeId: `ai-${index + 1}`,
          displayId: `AI-${index + 1}`,
          name: `AI Program ${String(index + 1).padStart(2, "0")}`,
          description: "AI modernization",
          primaryCategoryId: "ai_portfolio",
          primaryCategoryName: "AI portfolio",
          committedAnnualUsd: (6 - index) * 2_000_000,
          measuredValueUsd: index === 0 ? null : (6 - index) * 500_000,
        })),
        {
          ...towerState.initiatives[0],
          initiativeId: "non-ai-1",
          displayId: "NON-AI-1",
          name: "Network refresh",
          description: "Network refresh",
          primaryCategoryId: "infrastructure",
          primaryCategoryName: "Infrastructure",
          committedAnnualUsd: 30_000_000,
          measuredValueUsd: 10_000_000,
        },
      ],
    } satisfies AtlasTowerCurrentState;

    const answer = buildTowerFactualSpineAnswer(
      "give me the list of top 5 AI programs by spend and value",
      aiProgramsState,
    );

    expect(answer?.matchedIntent).toBe("tower_top_ai_programs");
    expect(answer?.response).toContain("Top 5 AI programs at SkyHarbor Air");
    expect(answer?.response).toContain("1. AI Program 01");
    expect(answer?.response).toContain("5. AI Program 05");
    expect(answer?.response).toContain("measured value not tracked");
    expect(answer?.response).not.toContain("Network refresh");
  });

  it("answers plain IT spend questions with the total Tower budget", () => {
    const answer = buildTowerFactualSpineAnswer(
      "what is my IT spend?",
      towerState,
    );

    expect(answer?.matchedIntent).toBe("tower_total_it_budget");
    expect(answer?.response).toContain(
      "The loaded Tower IT budget is $157.5M",
    );
    expect(answer?.response).toContain("across 5 budget rollups");
  });

  it("aggregates split vendor rows by vendor name", () => {
    const answer = buildTowerFactualSpineAnswer(
      "Who are the top 5 vendors by contract value?",
      towerState,
    );

    expect(answer?.response).toContain("Salesforce: $5.0M");
    expect(answer?.response).toContain("Azure: $4.2M");
    expect(answer?.response).not.toContain("not showing");
  });

  it("keeps repeated factual questions stable", () => {
    const first = buildTowerFactualSpineAnswer(
      "How many active pressure flags are there?",
      towerState,
    );
    const second = buildTowerFactualSpineAnswer(
      "How many active pressure flags are there?",
      towerState,
    );

    expect(first?.response).toEqual(second?.response);
    expect(first?.response).toContain("3 active pressure flags");
  });

  it("keeps ROI and adoption honest when the data is a proxy or gap", () => {
    const roi = buildTowerFactualSpineAnswer(
      "What is the portfolio ROI?",
      towerState,
    );
    const adoption = buildTowerFactualSpineAnswer(
      "What is the current adoption rate for scaled initiatives?",
      towerState,
    );

    expect(roi?.response).toContain("cannot state a board-grade portfolio ROI");
    expect(adoption?.response).toContain("low-confidence proxy");
    expect(adoption?.response).toContain("active-user adoption");
  });

  it("does not promote complete measured-value rows into board-grade portfolio ROI", () => {
    const completeMeasuredValueState = {
      ...towerState,
      initiatives: towerState.initiatives.map((initiative, index) => ({
        ...initiative,
        measuredValueUsd:
          initiative.measuredValueUsd ??
          Math.max(100_000, (index + 1) * 250_000),
      })),
      bandMetrics: {
        ...towerState.bandMetrics,
        metrics: towerState.bandMetrics.metrics.map((metric) =>
          metric.key === "portfolio_roi"
            ? {
                ...metric,
                value: "0.6x",
                subtext: "target 3.5x · 2.9x under",
                confidence: "low",
                tooltip:
                  "Sum of measured value ($7.5M) divided by sum of committed annual ($11.9M) across 8 initiatives. 8 of 8 have measured values loaded.",
              }
            : metric,
        ),
      },
    } satisfies AtlasTowerCurrentState;

    const roi = buildTowerFactualSpineAnswer(
      "What is the portfolio ROI?",
      completeMeasuredValueState,
    );

    expect(roi?.response).toContain("cannot state a board-grade portfolio ROI");
    expect(roi?.response).toContain("directional initiative-value proxy");
    expect(roi?.response).toContain("not a true portfolio ROI");
  });

  it("keeps billion-scale total budget answers precise and hides raw slice keys", () => {
    const skyharborLikeState = {
      ...towerState,
      budgetRollups: [
        {
          ...towerState.budgetRollups[0],
          portfolioCompany: "model_governance",
          totalItBudgetUsd: 1_018_750_000,
          actualSpendYtdUsd: 0,
          runAmountUsd: 0,
          changeAmountUsd: 0,
        },
        {
          ...towerState.budgetRollups[1],
          portfolioCompany: "data_quality",
          totalItBudgetUsd: 12_500_000,
          actualSpendYtdUsd: 0,
          runAmountUsd: 0,
          changeAmountUsd: 0,
        },
      ],
    } satisfies AtlasTowerCurrentState;

    const prompts = [
      "What is our loaded IT budget?",
      "How much loaded portfolio spend do we have?",
      "What budget amount is Tower using for the portfolio?",
      "What is the Tower committed annual spend total?",
    ];

    for (const prompt of prompts) {
      const answer = buildTowerFactualSpineAnswer(prompt, skyharborLikeState);
      expect(answer?.matchedIntent).toBe("tower_total_it_budget");
      expect(answer?.response).toContain("$1.031B");
      expect(answer?.response).not.toContain("$1.0B");
      expect(answer?.response).not.toContain("model_governance");
      expect(answer?.response).not.toContain("data_quality");
      expect(answer?.response).not.toContain("portfolio-company rollups");
      expect(answer?.response).toContain("Model governance");
      expect(answer?.response).toContain("Data quality");
    }
  });

  it("classifies the Tower 100Q hardening families as governed Tower candidates", () => {
    const prompts = [
      "What do we know about run versus change spend?",
      "Which programs are healthy, watched, or at risk?",
      "Show the programs grouped by business function.",
      "Which programs depend on foundational data or platform work?",
      "What is the committed value across the portfolio?",
      "What is the best AI investment story Tower can support from loaded evidence?",
      "Which contracts renew soon?",
      "What should procurement challenge in the next vendor review?",
      "Which vendor relationships are tied to at-risk programs?",
      "What source evidence supports the Tower dashboard?",
      "Which Tower claims are only directional, not proven?",
      "Which metric is least trustworthy and why?",
      "What is the cleanest executive summary for the CIO today?",
    ];

    for (const prompt of prompts) {
      expect(isTowerFactualSpineCandidate(prompt)).toBe(true);
    }
  });
});
