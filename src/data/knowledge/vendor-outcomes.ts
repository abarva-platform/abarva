// Vendor Outcomes — Anonymised vendor assessment data from AI transformation engagements
// Demo data labeled as illustrative. Live client data is client-specific.

export type VendorAssessment = {
  id: string
  name: string
  category: string // 'RCM AI' | 'Prior Auth' | 'Clinical Documentation' | 'Fraud Detection' | etc.
  outcomeRate: number        // % achieving target within 18 months
  complexityScore: number    // 0-100 (implementation complexity)
  referenceMatchScore: number // reference similarity score for Meridian profile
  year1CostRange: [number, number]
  implementationMonthsAvg: number
  epicNative: boolean
  azureNative: boolean
  hipaaBaa: boolean
  color: 'teal' | 'blue' | 'amber' | 'gray'
  rationale: string
  genomeRisk?: string
  referenceCount: number    // similar organizations in Genome
}

// Meridian RCM AI vendor landscape (demo — illustrative only)
export const MERIDIAN_RCM_VENDORS: VendorAssessment[] = [
  {
    id: 'ensemble',
    name: 'Ensemble Health Partners',
    category: 'RCM AI Automation',
    outcomeRate: 71,
    complexityScore: 42,
    referenceMatchScore: 88,
    year1CostRange: [4_000_000, 6_000_000],
    implementationMonthsAvg: 14,
    epicNative: true,
    azureNative: true,
    hipaaBaa: true,
    color: 'teal',
    rationale: 'RCM specialist with 8 similar wins at Epic-based health systems',
    genomeRisk: '3 of their failures had CDO vacancy — risk at Meridian',
    referenceCount: 8,
  },
  {
    id: 'waystar',
    name: 'Waystar',
    category: 'RCM AI Automation',
    outcomeRate: 64,
    complexityScore: 38,
    referenceMatchScore: 72,
    year1CostRange: [3_500_000, 5_500_000],
    implementationMonthsAvg: 12,
    epicNative: true,
    azureNative: false,
    hipaaBaa: true,
    color: 'blue',
    rationale: 'Broad RCM automation platform; strong denial management; Azure integration requires custom work',
    referenceCount: 5,
  },
  {
    id: 'r1rcm',
    name: 'R1 RCM',
    category: 'RCM AI Automation',
    outcomeRate: 61,
    complexityScore: 55,
    referenceMatchScore: 68,
    year1CostRange: [5_000_000, 8_000_000],
    implementationMonthsAvg: 16,
    epicNative: true,
    azureNative: false,
    hipaaBaa: true,
    color: 'blue',
    rationale: 'Full RCM outsourcing with AI; higher complexity due to workflow change; good outcomes at large IDNs',
    referenceCount: 4,
  },
  {
    id: 'optum',
    name: 'Optum',
    category: 'RCM AI Automation',
    outcomeRate: 55,
    complexityScore: 78,
    referenceMatchScore: 41,
    year1CostRange: [7_000_000, 12_000_000],
    implementationMonthsAvg: 22,
    epicNative: false,
    azureNative: false,
    hipaaBaa: true,
    color: 'amber',
    rationale: 'High complexity; Epic integration requires significant custom work; outcomes variable at mid-size IDNs',
    genomeRisk: 'High complexity mismatched with Meridian\'s current tech readiness (52%)',
    referenceCount: 3,
  },
  {
    id: 'changehc',
    name: 'Change Healthcare',
    category: 'RCM AI Automation',
    outcomeRate: 38,
    complexityScore: 82,
    referenceMatchScore: 22,
    year1CostRange: [4_000_000, 7_000_000],
    implementationMonthsAvg: 20,
    epicNative: false,
    azureNative: false,
    hipaaBaa: true,
    color: 'gray',
    rationale: 'Integration risk with Epic; recent security incidents; limited Genome success data at your profile',
    referenceCount: 2,
  },
]

// Reference outcomes for Ensemble at Meridian-similar organizations (anonymized)
export const ENSEMBLE_REFERENCE_OUTCOMES = [
  {
    id: 'ref-1',
    description: '$10.2B health system · Epic primary · Midwest',
    baselineDenial: 17.1,
    finalDenial: 11.8,
    timeToValueMonths: 11,
    annualSavings: 21_000_000,
    succeeded: true,
    keyFactor: 'Strong CDO leadership from day 1',
  },
  {
    id: 'ref-2',
    description: '$8.8B health system · Epic primary · Southeast',
    baselineDenial: 19.4,
    finalDenial: 13.2,
    timeToValueMonths: 16,
    annualSavings: 17_000_000,
    succeeded: true,
    keyFactor: 'Prior auth data incomplete at pilot — delayed timeline by 4 months',
  },
  {
    id: 'ref-3',
    description: '$11.1B health system · Epic primary · Midwest',
    baselineDenial: 16.8,
    finalDenial: null,
    timeToValueMonths: 0,
    annualSavings: 0,
    succeeded: false,
    keyFactor: 'CDO vacancy unresolved at go-live · $3.2M sunk + 18-month delay',
  },
  {
    id: 'ref-4',
    description: '$9.4B health system · Epic primary · Northeast',
    baselineDenial: 15.6,
    finalDenial: 10.9,
    timeToValueMonths: 13,
    annualSavings: 23_000_000,
    succeeded: true,
    keyFactor: 'CFO as primary sponsor; outcome-based contract structure',
  },
  {
    id: 'ref-5',
    description: '$12.7B health system · Epic primary · Southeast',
    baselineDenial: 20.1,
    finalDenial: 13.8,
    timeToValueMonths: 15,
    annualSavings: 29_000_000,
    succeeded: true,
    keyFactor: 'Prior auth at 71% before go-live; Azure ML integration built 90 days prior',
  },
]
