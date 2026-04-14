// Business Case Intelligence — pure business logic functions
// Tested in src/__tests__/behaviors/business-case.test.ts

export type Scenario = {
  label: 'conservative' | 'base' | 'optimistic'
  improvementPP: number    // percentage point improvement
  timeToValueMonths: number
  adoptionRate: number     // 0-1
}

export type BusinessCaseInputs = {
  baselineValue: number          // $ at risk per PP improvement
  year1Investment: number
  year2PlusAnnual: number
  totalYears: number
  successProbabilityBase: number // 0-1
  adjustments: Array<{ delta: number; reason: string }>
}

// Calculate annual value from a scenario
export function calcAnnualValue(improvementPP: number, valuePerPP: number, adoptionRate: number): number {
  return Math.round(improvementPP * valuePerPP * adoptionRate)
}

// Calculate N-year net value
export function calcNetValue(
  annualValue: number,
  year1Investment: number,
  annualOngoing: number,
  years: number
): number {
  const totalRevenue = annualValue * years
  const totalCost = year1Investment + annualOngoing * (years - 1)
  return Math.round(totalRevenue - totalCost)
}

// Calculate ROI multiple
export function calcROI(annualValue: number, totalInvestment: number): number {
  if (totalInvestment === 0) return 0
  return Math.round((annualValue / totalInvestment) * 10) / 10
}

// Calculate payback in months
export function calcPaybackMonths(totalInvestment: number, monthlyValue: number): number {
  if (monthlyValue <= 0) return 999
  return Math.round(totalInvestment / monthlyValue)
}

// Calculate risk-adjusted success probability
export function calcAdjustedProbability(
  baseProbability: number,
  adjustments: Array<{ delta: number }>
): number {
  const total = adjustments.reduce((sum, adj) => sum + adj.delta, baseProbability)
  return Math.max(0, Math.min(1, Math.round(total * 100) / 100))
}

// Calculate risk-adjusted NPV
export function calcRiskAdjustedNPV(npv: number, successProbability: number): number {
  return Math.round(npv * successProbability)
}

// Build three scenarios from sliders
export function buildScenarios(
  baseImprovementPP: number,
  valuePerPP: number,
  year1Investment: number,
  annualOngoing: number
): Record<'conservative' | 'base' | 'optimistic', { annualValue: number; netValue3yr: number; roi: number; paybackMonths: number }> {
  const scenarios = {
    conservative: { pp: baseImprovementPP * 0.57, adoption: 0.75 },
    base:         { pp: baseImprovementPP,         adoption: 0.85 },
    optimistic:   { pp: baseImprovementPP * 1.36,  adoption: 0.92 },
  } as const

  const result = {} as Record<'conservative' | 'base' | 'optimistic', { annualValue: number; netValue3yr: number; roi: number; paybackMonths: number }>

  for (const [key, s] of Object.entries(scenarios) as Array<[keyof typeof scenarios, { pp: number; adoption: number }]>) {
    const annualValue = calcAnnualValue(s.pp, valuePerPP, s.adoption)
    const netValue3yr = calcNetValue(annualValue, year1Investment, annualOngoing, 3)
    const totalInvestment = year1Investment + annualOngoing * 2
    const roi = calcROI(annualValue, totalInvestment)
    const paybackMonths = calcPaybackMonths(year1Investment, annualValue / 12)
    result[key] = { annualValue, netValue3yr, roi, paybackMonths }
  }

  return result
}
