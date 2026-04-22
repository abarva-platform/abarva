export type EnterpriseUseCaseStatus =
  | 'production'
  | 'scaling_pilot'
  | 'pilot'
  | 'stalled'
  | 'research'
  | 'shadow'

export type ShadowAiRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface EnterprisePortfolioUseCase {
  sequence: number
  name: string
  vendor_product: string
  status: EnterpriseUseCaseStatus
  scope_or_users?: string
  adoption_pct?: number
  monthly_cost_usd?: number
  verified_value_text?: string
  value_unverified?: boolean
  why_stalled?: string
  contradiction?: string
  next_milestone?: string
  is_demo_data: true
}

export interface ShadowAiFinding {
  sequence: number
  what_happening: string
  vendor_product: string
  discovered_via: string
  risk_level: ShadowAiRiskLevel
  is_demo_data: true
}

export interface ActiveAiProject {
  name: string
  vendor_ecosystem: string
  budget_usd: number
  phase_current: number
  phase_total: number
  pct_complete: number
  next_milestone: string
  is_demo_data: true
}

export interface PackJClientSeed {
  client_key: 'meridian' | 'firstcapital' | 'apex'
  client_name: string
  profile: string
  portfolio_use_cases: EnterprisePortfolioUseCase[]
  shadow_ai_inventory: ShadowAiFinding[]
  active_ai_projects: ActiveAiProject[]
}
