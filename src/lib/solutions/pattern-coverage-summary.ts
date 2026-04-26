import { SOLUTION_ARCHETYPE_KEYS, SolutionArchetypeKey } from '@/lib/solutions/solution-archetype-registry'

export interface PatternCoverageRow {
  archetypeId: string
  archetypeLabel: string
  workshopCoverage: number  // 0–1
  deliverableCoverage: number  // 0–1
  hasRiskFlags: boolean
  overallScore: number  // average of above two coverage values
  createdFrom: 'sol16_pattern_coverage_summary'
}

// Static seed data: workshops (out of 7 canonical templates) and deliverables (out of 5)
// per archetype. Values vary between 2–5 workshops and 2–4 deliverables.
const ARCHETYPE_SEED: Record<string, { label: string; workshops: number; deliverables: number; hasRiskFlags: boolean }> = {
  ai_led_pdlc_transformation: {
    label: 'AI-Led PDLC Transformation',
    workshops: 5,
    deliverables: 4,
    hasRiskFlags: false,
  },
  analytics_modernization: {
    label: 'Analytics Modernization',
    workshops: 4,
    deliverables: 4,
    hasRiskFlags: false,
  },
  healthcare_ambient_clinical_value_chain: {
    label: 'Healthcare Ambient Clinical Value Chain',
    workshops: 3,
    deliverables: 3,
    hasRiskFlags: true,
  },
  hcc_risk_adjustment_coding_accuracy: {
    label: 'HCC Risk Adjustment & Coding Accuracy',
    workshops: 4,
    deliverables: 3,
    hasRiskFlags: true,
  },
  prior_authorization_utilization_management: {
    label: 'Prior Authorization & Utilization Management',
    workshops: 3,
    deliverables: 2,
    hasRiskFlags: true,
  },
  kyc_customer_onboarding_ai: {
    label: 'KYC & Customer Onboarding AI',
    workshops: 5,
    deliverables: 4,
    hasRiskFlags: false,
  },
  predictive_maintenance_modernization: {
    label: 'Predictive Maintenance Modernization',
    workshops: 4,
    deliverables: 3,
    hasRiskFlags: false,
  },
  build_buy_partner_evaluation: {
    label: 'Build / Buy / Partner Evaluation',
    workshops: 2,
    deliverables: 2,
    hasRiskFlags: false,
  },
  service_operations_agentic_automation: {
    label: 'Service Operations Agentic Automation',
    workshops: 5,
    deliverables: 4,
    hasRiskFlags: false,
  },
  ai_governance_operating_model: {
    label: 'AI Governance Operating Model',
    workshops: 3,
    deliverables: 3,
    hasRiskFlags: true,
  },
  contact_center_ai_transformation: {
    label: 'Contact Center AI Transformation',
    workshops: 4,
    deliverables: 4,
    hasRiskFlags: false,
  },
  finance_fpna_ai_automation: {
    label: 'Finance FP&A AI Automation',
    workshops: 2,
    deliverables: 3,
    hasRiskFlags: false,
  },
}

export function buildPatternCoverageRow(archetypeId: string): PatternCoverageRow {
  const seed = ARCHETYPE_SEED[archetypeId]
  if (!seed) {
    throw new Error(`Unknown archetypeId: ${archetypeId}`)
  }

  const workshopCoverage = seed.workshops / 7
  const deliverableCoverage = seed.deliverables / 5
  const overallScore = (workshopCoverage + deliverableCoverage) / 2

  return {
    archetypeId,
    archetypeLabel: seed.label,
    workshopCoverage,
    deliverableCoverage,
    hasRiskFlags: seed.hasRiskFlags,
    overallScore,
    createdFrom: 'sol16_pattern_coverage_summary',
  }
}

export function buildPatternCoverageSummary(): {
  rows: PatternCoverageRow[]
  averageOverallScore: number
  topCoveredArchetype: string
  leastCoveredArchetype: string
  totalArchetypes: number
  createdFrom: 'sol16_pattern_coverage_summary'
} {
  const archetypeIds = SOLUTION_ARCHETYPE_KEYS as ReadonlyArray<SolutionArchetypeKey>

  const rows: PatternCoverageRow[] = archetypeIds
    .map((id) => buildPatternCoverageRow(id))
    .sort((a, b) => b.overallScore - a.overallScore)

  const averageOverallScore =
    rows.reduce((sum, r) => sum + r.overallScore, 0) / rows.length

  const topCoveredArchetype = rows[0].archetypeId
  const leastCoveredArchetype = rows[rows.length - 1].archetypeId

  return {
    rows,
    averageOverallScore,
    topCoveredArchetype,
    leastCoveredArchetype,
    totalArchetypes: rows.length,
    createdFrom: 'sol16_pattern_coverage_summary',
  }
}
