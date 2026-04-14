// Vendor Intelligence — pure business logic functions
// Tested in src/__tests__/behaviors/vendor-intelligence.test.ts

export type VendorScore = {
  id: string
  name: string
  outcomeRate: number        // 0-100%
  complexityScore: number    // 0-100 (higher = more complex)
  referenceMatchScore: number // 0-100
  color: 'teal' | 'blue' | 'amber' | 'gray'
}

export type ClientProfile = {
  epicIntegration: boolean
  azureIntegration: boolean
  dataReadiness: number
  techReadiness: number
  orgReadiness: number
  cdoPresent: boolean
  priorAuthCoverage: number
}

// Score vendor against client profile — returns 0-100
export function scoreVendorFit(vendor: {
  epicNative: boolean
  azureNative: boolean
  outcomeRate: number
  avgComplexity: number
}, client: ClientProfile): number {
  let score = vendor.outcomeRate

  // Integration fit
  if (client.epicIntegration && vendor.epicNative) score += 10
  if (client.azureIntegration && vendor.azureNative) score += 5

  // Data readiness match (higher readiness = less complexity penalty)
  const complexityPenalty = (vendor.avgComplexity / 100) * (1 - client.dataReadiness / 100) * 20
  score -= complexityPenalty

  return Math.max(0, Math.min(100, Math.round(score)))
}

// Assign vendor color bucket based on fit score
export function vendorColorBucket(fitScore: number): 'teal' | 'blue' | 'amber' | 'gray' {
  if (fitScore >= 70) return 'teal'
  if (fitScore >= 55) return 'blue'
  if (fitScore >= 40) return 'amber'
  return 'gray'
}

// Rank vendors by fit score descending
export function rankVendors(vendors: VendorScore[]): VendorScore[] {
  return [...vendors].sort((a, b) => b.outcomeRate - a.outcomeRate)
}

// Calculate SLA credit owed
export function calculateSlaCredit(
  annualSpend: number,
  contractedUptime: number,
  actualUptime: number
): number {
  if (actualUptime >= contractedUptime) return 0
  const gapPoints = contractedUptime - actualUptime
  return Math.round(annualSpend * (gapPoints / 100))
}
