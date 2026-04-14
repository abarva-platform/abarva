// Industry Benchmarks — Percentile distributions by industry and organisation size
// All data anonymised and aggregated. Source: AbarVa knowledge layer, updated quarterly.

export type PercentileBand = {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export type AIReadinessBenchmark = {
  industry: string
  sizeSegment: string
  dataReadiness: PercentileBand
  techReadiness: PercentileBand
  orgReadiness: PercentileBand
  blendedReadiness: PercentileBand
}

export const AI_READINESS_BENCHMARKS: AIReadinessBenchmark[] = [
  {
    industry: 'HEALTH_IDN', // Integrated Delivery Networks
    sizeSegment: 'LARGE', // > 10,000 employees
    dataReadiness: { p10: 28, p25: 42, p50: 54, p75: 68, p90: 79 },
    techReadiness: { p10: 22, p25: 34, p50: 46, p75: 61, p90: 74 },
    orgReadiness: { p10: 18, p25: 28, p50: 38, p75: 52, p90: 66 },
    blendedReadiness: { p10: 23, p25: 35, p50: 46, p75: 60, p90: 73 },
  },
  {
    industry: 'HEALTH_IDN',
    sizeSegment: 'MID', // 2,000-10,000 employees
    dataReadiness: { p10: 22, p25: 36, p50: 49, p75: 62, p90: 74 },
    techReadiness: { p10: 18, p25: 29, p50: 41, p75: 55, p90: 68 },
    orgReadiness: { p10: 14, p25: 24, p50: 34, p75: 47, p90: 61 },
    blendedReadiness: { p10: 18, p25: 30, p50: 41, p75: 55, p90: 68 },
  },
  {
    industry: 'FINANCE_BANK',
    sizeSegment: 'COMMUNITY', // < $10B assets
    dataReadiness: { p10: 24, p25: 38, p50: 51, p75: 65, p90: 76 },
    techReadiness: { p10: 14, p25: 26, p50: 38, p75: 52, p90: 64 },
    orgReadiness: { p10: 20, p25: 32, p50: 44, p75: 57, p90: 69 },
    blendedReadiness: { p10: 19, p25: 32, p50: 44, p75: 58, p90: 70 },
  },
  {
    industry: 'RETAIL_OMNI',
    sizeSegment: 'LARGE', // > 500 stores
    dataReadiness: { p10: 26, p25: 40, p50: 53, p75: 66, p90: 77 },
    techReadiness: { p10: 22, p25: 34, p50: 47, p75: 61, p90: 73 },
    orgReadiness: { p10: 16, p25: 27, p50: 38, p75: 51, p90: 63 },
    blendedReadiness: { p10: 21, p25: 34, p50: 46, p75: 59, p90: 71 },
  },
]

// Key operational benchmarks for health systems
export const HEALTH_OPERATIONAL_BENCHMARKS = {
  rcm: {
    denialRate: { p10: 7.2, p25: 9.8, p50: 11.4, p75: 14.8, p90: 18.6 }, // % of claims denied
    cleanClaimRate: { p10: 72, p25: 78, p50: 84, p75: 89, p90: 93 }, // % of claims paid first pass
    daysInAR: { p10: 28, p25: 34, p50: 41, p75: 52, p90: 64 },
    priorAuthCoverage: { p10: 24, p25: 42, p50: 62, p75: 77, p90: 88 }, // % of payers connected
    codingErrorRate: { p10: 1.8, p25: 3.2, p50: 5.4, p75: 8.1, p90: 11.6 }, // % of claims with coding errors
  },
  clinical: {
    sepsisAlertFalsePositiveRate: { p10: 12, p25: 18, p50: 28, p75: 38, p90: 52 }, // %
    readmission30Day: { p10: 9.8, p25: 11.4, p50: 13.2, p75: 15.8, p90: 18.6 }, // %
    awvCompletionRate: { p10: 38, p25: 48, p50: 58, p75: 68, p90: 77 }, // %
  },
  workforce: {
    travelNursePct: { p10: 2.8, p25: 4.4, p50: 6.8, p75: 10.2, p90: 14.8 }, // % of total FTE
    nurseAnnualTurnover: { p10: 8.4, p25: 12.8, p50: 17.4, p75: 23.2, p90: 30.6 }, // %
    travelNurseAnnualCost: { p10: 2400000, p25: 8000000, p50: 28000000, p75: 84000000, p90: 180000000 },
  },
  ai: {
    aiModelsInProduction: { p10: 0, p25: 1, p50: 3, p75: 7, p90: 14 },
    aiInvestmentAnnual: { p10: 400000, p25: 2000000, p50: 6000000, p75: 18000000, p90: 48000000 },
    aiProgramSuccessRate: { p10: 18, p25: 34, p50: 54, p75: 71, p90: 84 }, // % of started programmes that hit ROI targets
  },
}

// Key benchmarks for financial services (community banks)
export const FINANCE_OPERATIONAL_BENCHMARKS = {
  performance: {
    costToIncomeRatio: { p10: 48, p25: 54, p50: 61, p75: 69, p90: 78 }, // %
    fraudLossRate: { p10: 0.04, p25: 0.08, p50: 0.12, p75: 0.18, p90: 0.28 }, // % of transaction volume
    amlFalsePositiveRate: { p10: 42, p25: 58, p50: 74, p75: 88, p90: 96 }, // %
    digitalAdoptionRate: { p10: 28, p25: 38, p50: 49, p75: 61, p90: 74 }, // % of customers using digital
  },
  ai: {
    fraudModelsInProduction: { p10: 0, p25: 0, p50: 1, p75: 2, p90: 4 },
    amlAutomationPct: { p10: 12, p25: 28, p50: 44, p75: 62, p90: 78 }, // % of alerts auto-resolved
    npsDigital: { p10: 18, p25: 28, p50: 38, p75: 48, p90: 61 },
  },
}

// Key benchmarks for omnichannel retail
export const RETAIL_OPERATIONAL_BENCHMARKS = {
  performance: {
    digitalRevenueShare: { p10: 14, p25: 22, p50: 31, p75: 42, p90: 56 }, // %
    loyaltyActiveRate: { p10: 28, p25: 38, p50: 52, p75: 64, p90: 76 }, // % of enrolled members active
    cartAbandonmentRate: { p10: 48, p25: 54, p50: 62, p75: 70, p90: 78 }, // %
    inventoryTurnover: { p10: 2.8, p25: 3.8, p50: 5.0, p75: 6.4, p90: 8.2 }, // x per year
    shrinkageRate: { p10: 1.2, p25: 1.6, p50: 2.2, p75: 2.8, p90: 3.6 }, // % of revenue
  },
  ai: {
    personalisationAdoptionPct: { p10: 0, p25: 14, p50: 34, p75: 58, p90: 76 }, // % of customers receiving personalised experience
    demandForecastAccuracy: { p10: 62, p25: 71, p50: 80, p75: 87, p90: 93 }, // %
  },
}

// Percentile positioning helper
export function getPercentile(value: number, band: PercentileBand): number {
  if (value <= band.p10) return 5
  if (value <= band.p25) return Math.round(10 + (value - band.p10) / (band.p25 - band.p10) * 15)
  if (value <= band.p50) return Math.round(25 + (value - band.p25) / (band.p50 - band.p25) * 25)
  if (value <= band.p75) return Math.round(50 + (value - band.p50) / (band.p75 - band.p50) * 25)
  if (value <= band.p90) return Math.round(75 + (value - band.p75) / (band.p90 - band.p75) * 15)
  return Math.min(98, Math.round(90 + (value - band.p90) / band.p90 * 8))
}

export function getPercentileSuffix(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 10
  return `${n}${suffixes[v] || 'th'}`
}
