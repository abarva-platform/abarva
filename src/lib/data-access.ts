// Role-based data access matrix
// This is what a CIO will ask about in the first 10 minutes of any real conversation.

export type RoleKey = 'CIO' | 'CFO' | 'COO' | 'CMIO' | 'CEO' | 'CDO' | 'CRO' | 'MAESTRO' | 'BOARD' | 'STEWARD'

export type DataCategory =
  | 'technology'
  | 'vendors'
  | 'it_financials'
  | 'infrastructure'
  | 'ai_initiatives'
  | 'contracts'
  | 'strategic_plans'
  | 'financials'
  | 'rcm'
  | 'it_spend'
  | 'vendor_contracts'
  | 'business_case'
  | 'budget'
  | 'operations'
  | 'workforce'
  | 'clinical_throughput'
  | 'vendor_performance'
  | 'clinical_quality'
  | 'ehr_data'
  | 'clinical_outcomes'
  | 'clinical_data'
  | 'quality_metrics'
  | 'strategic_summary'
  | 'outcomes'
  | 'financials_summary'
  | 'all'

export interface RoleAccess {
  canView: DataCategory[]
  canUpload: DataCategory[]
  canApprove: boolean
  canPromote?: boolean // exclusive to Maestro: propose Layer 2 → Layer 1
  label: string
  description: string
}

export const DATA_ACCESS_MATRIX: Record<RoleKey, RoleAccess> = {
  CIO: {
    label: 'Chief Information Officer',
    description: 'Technology, vendor, and IT financial data',
    canView: ['technology', 'vendors', 'it_financials', 'infrastructure', 'ai_initiatives'],
    canUpload: ['technology', 'vendors', 'contracts', 'strategic_plans'],
    canApprove: true,
  },
  CFO: {
    label: 'Chief Financial Officer',
    description: 'Financial, RCM, and vendor contract data',
    canView: ['financials', 'rcm', 'it_spend', 'vendor_contracts', 'business_case'],
    canUpload: ['financials', 'budget', 'contracts'],
    canApprove: false,
  },
  COO: {
    label: 'Chief Operating Officer',
    description: 'Operational, workforce, and vendor performance data',
    canView: ['operations', 'workforce', 'clinical_throughput', 'vendor_performance'],
    canUpload: ['operations', 'workforce'],
    canApprove: false,
  },
  CMIO: {
    label: 'Chief Medical Information Officer',
    description: 'Clinical quality, EHR, and AI initiative data',
    canView: ['clinical_quality', 'ehr_data', 'ai_initiatives', 'clinical_outcomes'],
    canUpload: ['clinical_data', 'quality_metrics'],
    canApprove: false,
  },
  CEO: {
    label: 'Chief Executive Officer',
    description: 'All data — summary view',
    canView: ['all'],
    canUpload: ['strategic_plans'],
    canApprove: true,
  },
  CDO: {
    label: 'Chief Data Officer',
    description: 'Technology, data estate, and AI initiative data',
    canView: ['technology', 'infrastructure', 'ai_initiatives', 'ehr_data', 'clinical_quality'],
    canUpload: ['technology', 'strategic_plans'],
    canApprove: true,
  },
  CRO: {
    label: 'Chief Revenue Officer',
    description: 'Revenue, RCM, and business case data',
    canView: ['rcm', 'financials', 'business_case', 'vendor_performance'],
    canUpload: ['financials'],
    canApprove: false,
  },
  MAESTRO: {
    label: 'Maestro (AbarVa)',
    description: 'All data including engagement workspace',
    canView: ['all'],
    canUpload: ['all'],
    canApprove: true,
    canPromote: true,
  },
  BOARD: {
    label: 'Board Member',
    description: 'Strategic summary, outcomes, and financial summary only',
    canView: ['strategic_summary', 'outcomes', 'financials_summary'],
    canUpload: [],
    canApprove: false,
  },
  STEWARD: {
    label: 'Data Steward',
    description: 'All org data — governance and promotion authority',
    canView: ['all'],
    canUpload: ['all'],
    canApprove: true,
    canPromote: true,
  },
}

export function canViewCategory(role: RoleKey, category: DataCategory): boolean {
  const access = DATA_ACCESS_MATRIX[role]
  if (!access) return false
  return access.canView.includes('all') || access.canView.includes(category)
}

export function canUploadCategory(role: RoleKey, category: DataCategory): boolean {
  const access = DATA_ACCESS_MATRIX[role]
  if (!access) return false
  return access.canUpload.includes('all') || access.canUpload.includes(category)
}

export function getLockedReason(role: RoleKey, category: DataCategory): string {
  const access = DATA_ACCESS_MATRIX[role]
  if (!access) return 'Access restricted'
  // Find which role can view this category
  const authorizedRoles = (Object.entries(DATA_ACCESS_MATRIX) as [RoleKey, RoleAccess][])
    .filter(([, ra]) => ra.canView.includes('all') || ra.canView.includes(category))
    .map(([r]) => r)
    .filter(r => r !== 'MAESTRO' && r !== 'BOARD' && r !== 'STEWARD')
  if (authorizedRoles.length > 0) {
    return `Requires ${authorizedRoles[0]} access`
  }
  return 'Restricted data'
}

// Data category display labels for UI
export const CATEGORY_LABELS: Record<DataCategory, string> = {
  technology: 'Technology Stack',
  vendors: 'Vendor Inventory',
  it_financials: 'IT Financials',
  infrastructure: 'Infrastructure',
  ai_initiatives: 'AI Initiatives',
  contracts: 'Contracts',
  strategic_plans: 'Strategic Plans',
  financials: 'Financials',
  rcm: 'Revenue Cycle',
  it_spend: 'IT Spend',
  vendor_contracts: 'Vendor Contracts',
  business_case: 'Business Case',
  budget: 'Budget',
  operations: 'Operations',
  workforce: 'Workforce & HR',
  clinical_throughput: 'Clinical Throughput',
  vendor_performance: 'Vendor Performance',
  clinical_quality: 'Clinical Quality',
  ehr_data: 'EHR Data',
  clinical_outcomes: 'Clinical Outcomes',
  clinical_data: 'Clinical Data',
  quality_metrics: 'Quality Metrics',
  strategic_summary: 'Strategic Summary',
  outcomes: 'Outcomes',
  financials_summary: 'Financial Summary',
  all: 'All Data',
}
