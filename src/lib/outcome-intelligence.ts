// Outcome Intelligence — pure business logic functions
// Tested in src/__tests__/behaviors/outcome-intelligence.test.ts

export type InitiativeStatus = 'on_track' | 'warning' | 'behind' | 'completed' | 'not_started'

// Calculate progress % toward target from baseline
export function calcProgress(baseline: number, current: number, target: number): number {
  const totalChange = Math.abs(target - baseline)
  if (totalChange === 0) return 100
  const achieved = Math.abs(current - baseline)
  return Math.min(100, Math.round((achieved / totalChange) * 100))
}

// Calculate expected progress at a given day in a programme
export function calcExpectedProgress(dayInProgramme: number, totalProgrammeDays: number): number {
  if (totalProgrammeDays === 0) return 0
  // Expected follows an S-curve, simplified as linear for calculation
  return Math.min(100, Math.round((dayInProgramme / totalProgrammeDays) * 100))
}

// Determine initiative status from actual vs expected progress
export function calcInitiativeStatus(
  actualProgress: number,
  expectedProgress: number
): InitiativeStatus {
  const gap = actualProgress - expectedProgress
  if (gap >= -10) return 'on_track'
  if (gap >= -20) return 'warning'
  return 'behind'
}

// Calculate variance in percentage points (improvement metric)
export function calcVariance(
  baselineValue: number,
  currentValue: number,
  expectedCurrentValue: number,
  directionIsDown: boolean
): { variancePP: number; ahead: boolean } {
  // For metrics where down is good (denial rate), improvement = baseline - current
  const actualImprovement = directionIsDown
    ? baselineValue - currentValue
    : currentValue - baselineValue
  const expectedImprovement = directionIsDown
    ? baselineValue - expectedCurrentValue
    : expectedCurrentValue - baselineValue

  const variancePP = Math.round((actualImprovement - expectedImprovement) * 10) / 10
  return { variancePP, ahead: variancePP > 0 }
}

// Calculate outcome fee from verified savings
export function calcOutcomeFee(verifiedSavings: number, feeRate: number): number {
  return Math.round(verifiedSavings * feeRate)
}

// Portfolio summary stats
export function calcPortfolioSummary(initiatives: Array<{
  committedValue: number
  verifiedValue: number
  status: InitiativeStatus
}>): {
  totalCommitted: number
  totalVerified: number
  onTrackCount: number
  atRiskCount: number
} {
  return {
    totalCommitted: initiatives.reduce((s, i) => s + i.committedValue, 0),
    totalVerified: initiatives.reduce((s, i) => s + i.verifiedValue, 0),
    onTrackCount: initiatives.filter(i => i.status === 'on_track').length,
    atRiskCount: initiatives.filter(i => i.status === 'warning' || i.status === 'behind').length,
  }
}
