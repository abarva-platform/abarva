// Contract Benchmarks — Aggregated intelligence from live vendor contracts
// All data anonymized. Source: AbarVa knowledge layer.

export type ContractBenchmark = {
  vendorId: string
  scope: string
  sampleSize: number   // number of contracts in Genome
  implementationFeeRange: [number, number]
  annualPlatformRange: [number, number]
  outcomeSharePresent: number  // % of contracts with outcome share
  autoRenewalRisk: number      // % with auto-renewal trap
  keyTermsToInsist: string[]
  watchForClauses: string[]
  negotiationLevers: string[]
  pricePercentile: number  // where Meridian's estimate lands vs market
}

export const MERIDIAN_CONTRACT_BENCHMARKS: ContractBenchmark[] = [
  {
    vendorId: 'ensemble',
    scope: 'RCM AI Automation · $1.1B+ annual claims volume',
    sampleSize: 12,
    implementationFeeRange: [1_200_000, 1_800_000],
    annualPlatformRange: [2_800_000, 4_200_000],
    outcomeSharePresent: 67,  // 8 of 12
    autoRenewalRisk: 58,      // 7 of 12
    keyTermsToInsist: [
      'Full Meridian data ownership of all model outputs',
      'SLA: 99.5% uptime minimum with $X/hour penalty below',
      '90-day termination right with full data export',
      'Outcome-based fee structure: 20% on verified savings above baseline',
      'Epic integration warranty: vendor responsible for API changes',
    ],
    watchForClauses: [
      'Auto-renewal with 10% price increase (in 7 of 12 contracts)',
      'Arbitration clause limiting your legal remedies',
      '"Best efforts" language on outcome commitments — require specifics',
      'Broad IP assignment on custom configurations',
    ],
    negotiationLevers: [
      '3-year term commitment → 15-20% discount available',
      'Reference permission → $50-100K reduction possible',
      'Pilot-first structure → reduces risk, Ensemble will agree',
      'Multi-facility deployment commitment → volume discount 12-18%',
    ],
    pricePercentile: 40,
  },
  {
    vendorId: 'waystar',
    scope: 'RCM AI Automation · Claims + Denials',
    sampleSize: 8,
    implementationFeeRange: [900_000, 1_400_000],
    annualPlatformRange: [2_400_000, 3_800_000],
    outcomeSharePresent: 38,
    autoRenewalRisk: 63,
    keyTermsToInsist: [
      'Azure integration included in base price (requires negotiation)',
      'Denial rate SLA: minimum 2pp improvement in 12 months or fee reduction',
      'Full data portability — no lock-in on model weights',
    ],
    watchForClauses: [
      'Azure integration frequently quoted as add-on ($200-400K)',
      'Minimum term 3 years with early termination fee',
    ],
    negotiationLevers: [
      'Azure build cost → use as leverage for base price reduction',
      'Bundle denial prevention + payment posting → 10-15% discount',
    ],
    pricePercentile: 35,
  },
]

// Negotiation sequence recommended for Meridian
export const MERIDIAN_NEGOTIATION_SEQUENCE = [
  { step: 1, action: 'Start with 3-year term ask', rationale: 'Creates leverage for 15-20% discount' },
  { step: 2, action: 'Request pilot-first with defined success criteria', rationale: 'Reduces risk; vendors typically agree for large IDNs' },
  { step: 3, action: 'Add SLA penalty clause before signing', rationale: 'Protects against underperformance' },
  { step: 4, action: 'Get data ownership in writing before pilot starts', rationale: 'Prevents lock-in after investment made' },
  { step: 5, action: 'Negotiate outcome share clause (20% of verified savings)', rationale: 'Aligns vendor incentives with your outcomes' },
]
