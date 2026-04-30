// Data confidence score calculation
// Shown below every AI response — derived from data completeness relative to query category

export interface ConfidenceScore {
  score: number           // 0–100
  tier: 'full' | 'good' | 'limited'
  label: string
  color: string
  loaded: ConfidenceItem[]
  missing: ConfidenceItem[]
  topUpgrade?: ConfidenceUpgrade  // single best action to increase confidence
}

export interface ConfidenceItem {
  label: string
  category: string
  contribution: number  // % points this adds
}

export interface ConfidenceUpgrade {
  action: string        // "Upload executive interview transcripts"
  reason: string        // "unlocks stakeholder fault line analysis"
  delta: number         // +17 confidence points
  uploadCategory: string
}

// Per-query-category data requirements
// Each entry: what data files/categories are required, and how much they contribute
const QUERY_REQUIREMENTS: Record<string, ConfidenceItem[]> = {
  rcm: [
    { label: 'RCM & quality data', category: 'clinical_quality', contribution: 28 },
    { label: 'Vendor performance scorecard', category: 'vendor_performance', contribution: 18 },
    { label: 'IT financial model', category: 'it_financials', contribution: 14 },
    { label: 'Interview transcripts', category: 'interviews', contribution: 17 },
    { label: 'Vendor contracts', category: 'vendor_contracts', contribution: 12 },
    { label: 'Technology inventory', category: 'technology', contribution: 11 },
  ],
  ai_investment: [
    { label: 'IT financial model', category: 'it_financials', contribution: 22 },
    { label: 'Technology inventory', category: 'technology', contribution: 20 },
    { label: 'AI initiative tracker', category: 'ai_initiatives', contribution: 18 },
    { label: 'Vendor contracts', category: 'vendor_contracts', contribution: 15 },
    { label: 'Interview transcripts', category: 'interviews', contribution: 14 },
    { label: 'Strategic plans', category: 'strategic_plans', contribution: 11 },
  ],
  vendor: [
    { label: 'Vendor performance scorecard', category: 'vendor_performance', contribution: 30 },
    { label: 'Vendor contracts', category: 'vendor_contracts', contribution: 25 },
    { label: 'IT financial model', category: 'it_financials', contribution: 20 },
    { label: 'RFP / evaluation data', category: 'rfp_data', contribution: 15 },
    { label: 'Technology inventory', category: 'technology', contribution: 10 },
  ],
  workforce: [
    { label: 'Workforce & HR analytics', category: 'workforce', contribution: 35 },
    { label: 'Interview transcripts', category: 'interviews', contribution: 25 },
    { label: 'IT financial model', category: 'it_financials', contribution: 20 },
    { label: 'Strategic plans', category: 'strategic_plans', contribution: 20 },
  ],
  clinical: [
    { label: 'RCM & quality data', category: 'clinical_quality', contribution: 32 },
    { label: 'EHR / clinical data', category: 'ehr_data', contribution: 28 },
    { label: 'Interview transcripts', category: 'interviews', contribution: 20 },
    { label: 'Vendor performance', category: 'vendor_performance', contribution: 12 },
    { label: 'Workforce analytics', category: 'workforce', contribution: 8 },
  ],
  general: [
    { label: 'IT financial model', category: 'it_financials', contribution: 20 },
    { label: 'Technology inventory', category: 'technology', contribution: 18 },
    { label: 'Vendor data', category: 'vendors', contribution: 16 },
    { label: 'Interview transcripts', category: 'interviews', contribution: 15 },
    { label: 'Financial summary', category: 'financials', contribution: 14 },
    { label: 'Strategic plans', category: 'strategic_plans', contribution: 10 },
    { label: 'Workforce analytics', category: 'workforce', contribution: 7 },
  ],
}

// Loaded data categories per org — in a real system these come from Supabase
// Here we use static config for demo purposes
const ORG_LOADED_CATEGORIES: Record<string, string[]> = {
  meridian: [
    'clinical_quality', 'vendor_performance', 'it_financials', 'vendor_contracts',
    'technology', 'ai_initiatives', 'workforce', 'financials', 'vendors',
  ],
  apexretail: [
    'it_financials', 'technology', 'vendors', 'financials', 'workforce',
  ],
  // Minimal org for demo comparison
  demo_minimal: ['technology'],
}

export function calculateConfidence(orgId: string, queryCategory: string): ConfidenceScore {
  const requirements = QUERY_REQUIREMENTS[queryCategory] ?? QUERY_REQUIREMENTS.general
  const loaded = ORG_LOADED_CATEGORIES[orgId.toLowerCase()] ?? []

  const loadedItems: ConfidenceItem[] = []
  const missingItems: ConfidenceItem[] = []

  for (const req of requirements) {
    if (loaded.includes(req.category)) {
      loadedItems.push(req)
    } else {
      missingItems.push(req)
    }
  }

  const totalPossible = requirements.reduce((sum, r) => sum + r.contribution, 0)
  const earned = loadedItems.reduce((sum, r) => sum + r.contribution, 0)
  const score = Math.min(100, Math.round((earned / totalPossible) * 100))

  const tier: ConfidenceScore['tier'] =
    score >= 80 ? 'full' :
    score >= 60 ? 'good' :
    'limited'

  const label =
    tier === 'full' ? 'High confidence' :
    tier === 'good' ? 'Good confidence' :
    'Limited confidence'

  const color =
    tier === 'full' ? '#059669' :
    tier === 'good' ? '#D97706' :
    '#DC2626'

  // Top upgrade: missing item with highest contribution
  const topMissing = [...missingItems].sort((a, b) => b.contribution - a.contribution)[0]
  const topUpgrade: ConfidenceUpgrade | undefined = topMissing ? {
    action: `Upload ${topMissing.label.toLowerCase()}`,
    reason: `unlocks ${topMissing.label.toLowerCase()} analysis`,
    delta: topMissing.contribution,
    uploadCategory: topMissing.category,
  } : undefined

  return { score, tier, label, color, loaded: loadedItems, missing: missingItems, topUpgrade }
}

export function getQueryCategory(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('rcm') || lower.includes('denial') || lower.includes('revenue cycle')) return 'rcm'
  if (lower.includes('ai') || lower.includes('investment') || lower.includes('bet') || lower.includes('strategy')) return 'ai_investment'
  if (lower.includes('vendor') || lower.includes('contract') || lower.includes('rfp')) return 'vendor'
  if (lower.includes('workforce') || lower.includes('staff') || lower.includes('hr') || lower.includes('vacancy')) return 'workforce'
  if (lower.includes('clinical') || lower.includes('ehr') || lower.includes('prior auth') || lower.includes('patient')) return 'clinical'
  return 'general'
}
