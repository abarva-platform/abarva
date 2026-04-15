export const arcturusFinancials = {
  source: 'client' as const,
  uploadedBy: 'Thomas Kellner (CFO)',
  uploadedAt: '2026-03-28',
  confidence: 0.96,

  revenue2024: 16.2, // $B
  revenueTrend: [
    { year: 2021, revenue: 14.2, growthYoY: null,  cir: 66, aumBillions: 780, netFlowsBillions: 6.8, operatingMarginPct: 26.4 },
    { year: 2022, revenue: 15.1, growthYoY: 6.3,   cir: 67, aumBillions: 798, netFlowsBillions: 4.2, operatingMarginPct: 25.1, note: 'Market downturn suppressed AUM growth despite positive net flows' },
    { year: 2023, revenue: 15.8, growthYoY: 4.6,   cir: 69, aumBillions: 814, netFlowsBillions: 3.8, operatingMarginPct: 23.8, note: 'CIR worsening despite revenue growth — cost base expanding faster than revenue. AI initiative spend accelerating ($64M → $94M committed).' },
    { year: 2024, revenue: 16.2, growthYoY: 2.5,   cir: 71, aumBillions: 840, netFlowsBillions: 4.2, operatingMarginPct: 22.4, note: 'Revenue growth decelerating. CIR at worst point in 5 years. CDO vacancy began January 2025. IT budget increased 12% YoY.' },
  ],
  // NOTE: CIR has worsened every year for 4 years (66%→67%→69%→71%). The stated target of 58% requires a structural programme — not incremental improvement.

  costToIncomeRatio: 71,      // %
  targetCIRatio: 58,           // %
  efficiencyGap: 840,          // $M — closing to 58% at current revenue base

  cirHistory: {
    trend: 'deteriorating',
    yearlyChange: [
      { year: 2021, cir: 66 },
      { year: 2022, cir: 67 },
      { year: 2023, cir: 69 },
      { year: 2024, cir: 71 },
    ],
    peerMedian2024: 61,
    topQuartile2024: 54,
    gapToPeer: 10, // percentage points
    gapToTopQuartile: 17, // percentage points
    implication: 'At current trajectory, CIR will reach 73% by 2026 without intervention. The stated target of 58% is not achievable through organic revenue growth — requires $840M in structural cost reduction, primarily from IT rationalisation and AI-driven productivity.',
    cfoConcern: 'CFO Thomas Kellner stated in March 2026 board pack: "The CIR trajectory is the most pressing strategic issue. Every percentage point improvement requires either $162M in cost reduction or $540M in revenue growth. We do not have a credible programme for either."',
  },

  aumTrajectory: {
    current: 840, // $B
    history: [
      { year: 2021, aum: 780, netFlows: 6.8, marketReturn: 14.2, retentionRate: 97.2 },
      { year: 2022, aum: 798, netFlows: 4.2, marketReturn: -8.4, retentionRate: 96.8, note: 'Negative market return masked strong net flows — AUM growth understated relative to operational performance' },
      { year: 2023, aum: 814, netFlows: 3.8, marketReturn: 18.1, retentionRate: 96.4, note: 'Net flows declining 3rd consecutive year despite positive market environment' },
      { year: 2024, aum: 840, netFlows: 4.2, marketReturn: 12.3, retentionRate: 96.1, note: 'Net flows recovering slightly but retention rate still declining — churn model underperforming' },
    ],
    peerAumGrowthMedian2024: 6.8, // % AUM growth
    arcturusAumGrowth2024: 3.1,   // % — below peer median
    gapToPeer: 3.7, // % AUM growth gap
    impliedAumUnderperformance: 30, // $B — AUM Arcturus should have vs peer trajectory
    aumPerEmployee: 500, // $M (vs peer 620 $M — 20% efficiency gap in workforce productivity)
    retentionConcern: 'Client retention declining 4 consecutive years (97.2%→96.8%→96.4%→96.1%). At 96.1% retention with $840B AUM, annual outflow from departing clients is $32.8B — requiring $32.8B+ in new flows just to stay flat. Net flows of $4.2B represent growth on a declining base.',
  },

  itBudgetHistory: [
    { year: 2022, amount: 548, pctRevenue: 3.6 },
    { year: 2023, amount: 604, pctRevenue: 3.8 },
    { year: 2024, amount: 680, pctRevenue: 4.2, note: 'AI initiative spending peaked. $94M committed across 28 AI initiatives with $0 documented ROI.' },
  ],

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
