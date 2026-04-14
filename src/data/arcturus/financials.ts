export const arcturusFinancials = {
  source: 'client' as const,
  uploadedBy: 'Thomas Kellner (CFO)',
  uploadedAt: '2026-03-28',
  confidence: 0.96,

  revenue2024: 16.2, // $B
  revenueTrend: [
    { year: 2022, revenue: 15.1, growthYoY: null },
    { year: 2023, revenue: 15.8, growthYoY: 4.6 },
    { year: 2024, revenue: 16.2, growthYoY: 2.5 },
  ],

  costToIncomeRatio: 71,      // %
  targetCIRatio: 58,           // %
  efficiencyGap: 840,          // $M — closing to 58% at current revenue base

  revenueByRegion: [
    { region: 'North America', revenue: 9.7,  pct: 60 },
    { region: 'Europe',        revenue: 4.1,  pct: 25 },
    { region: 'Asia & ME',     revenue: 2.4,  pct: 15 },
  ],

  revenueByLine: {
    managementFeeRevenue:   12.4, // $B — 76.5%
    performanceFeeRevenue:  1.8,  // $B — 11.1%
    wealthRevenue:          2.0,  // $B — 12.3%
  },

  itBudget: 680,               // $M
  itBudgetAsPctRevenue: 4.2,   // %
  itPeerBenchmarkPct: 3.1,     // %
  itBudgetExcess: 178,         // $M above peer benchmark

  aiInvestment: 94,            // $M committed
  aiTrackedROI: 0,             // $M — zero initiatives with documented baselines
  aiInitiativesCount: 28,
  aiInitiativesWithBaselines: 0,

  operatingMargin: 22.4,       // %
  operatingIncome: 3.63,       // $B (est)
  ebitdaMargin: 28.1,          // %

  aumTotal: 840,               // $B total AUM
  aumGrowthYoY: 3.1,           // %
  netFlows: 4.2,               // $B net new assets 2024
  revenuePerEmployee: 1.24,    // $M (est, ~13,000 employees)
  aumPerEmployee: 500,         // $M (vs peer 620 $M)
}
