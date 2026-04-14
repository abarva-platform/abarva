export const nexoraFinancials = {
  source: 'client' as const,
  uploadedBy: 'Kirsten Mueller (CFO)',
  uploadedAt: '2026-04-01',
  confidence: 0.95,

  revenue2024: 18.4,       // $B
  revenueGrowthYoY: 1.8,   // %

  operatingMargin: 3.2,         // %
  targetOperatingMargin: 6.5,   // %
  marginGap: 610,               // $M to reach target at current revenue

  operatingIncome: 589,         // $M (3.2% × 18.4B)
  targetOperatingIncome: 1196,  // $M (6.5% × 18.4B)

  revenueByChannel: [
    { channel: 'In-Store',   pct: 70, revenue: 12.88, margin: 5.8,  trend: 'declining' },
    { channel: 'E-Commerce', pct: 22, revenue: 4.05,  margin: -2.1, trend: 'growing' },
    { channel: 'Wholesale',  pct: 8,  revenue: 1.47,  margin: 4.2,  trend: 'stable' },
  ],

  revenueByRegion: [
    { region: 'North America',  revenue: 11.0, pct: 60 },
    { region: 'Europe',         revenue: 4.6,  pct: 25 },
    { region: 'Asia & ME',      revenue: 2.8,  pct: 15 },
  ],

  inventoryExcess: 900,    // $M excess / slow-moving inventory
  shrinkage: 2.8,          // % of revenue
  shrinkageDollars: 515,   // $M ($18.4B × 2.8%)
  shrinkageBenchmark: 1.4, // % industry median
  shrinkageExcess: 259,    // $M above benchmark

  aiCommitted: 148,        // $M total AI investment committed
  actualROI: 12,           // $M documented ROI (8% return)
  aiRoiPct: 8,             // %
  aiPeerRoiPct: 38,        // % — industry median

  einsteinLicenseCost: 14,   // $M per year
  einsteinLicensedMonths: 18,
  einsteinLicensedSpend: 21, // $M total spend to date ($14M × 18/12)
  einsteinActivated: false,
  einsteinPotentialRevenue: 248, // $M annual uplift from personalization

  grossMargin: 42.1,       // %
  cogsAsPctRevenue: 57.9,  // %

  revenueTrend: [
    { year: 2022, revenue: 17.2, growthYoY: null },
    { year: 2023, revenue: 18.1, growthYoY: 5.2 },
    { year: 2024, revenue: 18.4, growthYoY: 1.8 },
  ],

  marginTrend: [
    { year: 2022, operatingMargin: 4.8 },
    { year: 2023, operatingMargin: 3.9 },
    { year: 2024, operatingMargin: 3.2 },
  ],

  ecommerceMarginNote: 'E-commerce channel running at -2.1% margin. Growing channel destroying blended margin. No clear roadmap to positive contribution margin.',
}
