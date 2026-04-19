export type ValueOfficeStatus =
  | 'draft'
  | 'explore'
  | 'recommended'
  | 'approved'
  | 'pilot'
  | 'scaled'
  | 'rejected'
  | 'ready_for_review'
  | 'hold'
  | 'redesign'
  | 'stopped'

export type RecommendationType =
  | 'strong_candidate'
  | 'pilot_first'
  | 'redesign_before_funding'
  | 'split_into_smaller_use_cases'
  | 'weak_value_case'

export type MetricSnapshotType =
  | 'baseline'
  | 'target'
  | 'current_observed'

export interface ValueContractDraft {
  category: string
  where_value_lost: string
  target_state: string
  baseline_metric: string
  baseline_value?: string
  target_metric: string
  target_value?: string
  unit?: string
  evidence_source: string
  evidence_owner: string
  review_cadence: string
  confidence_grade: string
  notes?: string
}

export type EvidenceCollectionStatus =
  | 'expected'
  | 'requested'
  | 'received'
  | 'stale'
  | 'blocked'

export interface EvidenceSourceDetails {
  collection_status?: EvidenceCollectionStatus
  requested_at?: string
  received_at?: string
  due_date?: string
  freshness?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'ad_hoc'
  last_refreshed_at?: string
  blocker?: string
  notes?: string
}

export interface EvidenceSourceDraft {
  source_name: string
  source_type: string
  integration_mode: string
  status: 'needed' | 'identified' | 'available' | 'connected' | 'proxy_only'
  system_name: string
  owner_name: string
  details?: EvidenceSourceDetails
}

export interface MetricSnapshotDraft {
  id?: string
  category: string
  snapshot_type: MetricSnapshotType
  metric_name: string
  metric_value: string
  unit?: string
  confidence_grade: string
  notes?: string
  captured_at: string
}

export interface SolutionPatternDraft {
  entry_point: string
  control_plane: string
  ai_layer: string
  data_layer: string
  systems_of_record: string[]
  human_in_loop: string
  notes: string
}

export interface ReadinessDraft {
  overall: number
  data: number
  workflow: number
  sponsorship: number
  governance: number
  integration: number
  notes: string
}

export interface RecommendationDraft {
  type: RecommendationType
  summary: string
  rationale: string
  strengths: string[]
  risks: string[]
  missing_data: string[]
  next_actions: string[]
  confidence_score?: number
}

export interface AbarNexusProvenance {
  client_truth: string[]
  public_benchmarks: string[]
  pattern_memory: string[]
  assumptions: string[]
}

export interface AdvisorResult {
  refined_title: string
  use_case_type: string
  executive_summary: string
  business_problem: string
  why_now: string
  target_users: string
  workflows_in_scope: string[]
  systems_in_scope: string[]
  value_hypothesis: string
  solution_pattern: SolutionPatternDraft
  readiness: ReadinessDraft
  value_contracts: ValueContractDraft[]
  evidence_sources: EvidenceSourceDraft[]
  recommendation: RecommendationDraft
  confidence_score: number
}

export interface ValueOfficeUseCaseRecord {
  id: string
  client_id: string
  title: string
  submitted_idea: string
  business_problem: string | null
  why_now: string | null
  use_case_type: string | null
  status: ValueOfficeStatus
  recommendation: string | null
  recommendation_summary: string | null
  confidence_score: number
  sponsor_name: string | null
  sponsor_role: string | null
  owner_name: string | null
  target_users: string | null
  workflow_summary: string | null
  value_hypothesis: string | null
  solution_pattern: SolutionPatternDraft | Record<string, unknown>
  readiness: ReadinessDraft | Record<string, unknown>
  metadata: Record<string, unknown>
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ValueOfficeUseCaseDetail extends ValueOfficeUseCaseRecord {
  value_contracts: ValueContractDraft[]
  evidence_sources: EvidenceSourceDraft[]
  metric_snapshots: MetricSnapshotDraft[]
  latest_recommendation: (RecommendationDraft & {
    recommendation: RecommendationType
    created_at: string
  }) | null
  decision_history: Array<{
    id: string
    decision: ValueOfficeStatus
    rationale: string
    decided_by: string
    created_at: string
  }>
  conversation: Array<{
    id: string
    role: string
    content: string
    created_at: string
  }>
}
