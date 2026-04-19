import type {
  AdvisorResult,
  EvidenceCollectionStatus,
  EvidenceSourceDetails,
  EvidenceSourceDraft,
  MetricSnapshotDraft,
  MetricSnapshotType,
  RecommendationDraft,
  RecommendationType,
  ValueContractDraft,
} from './types'

const RECOMMENDATION_TYPES = new Set<RecommendationType>([
  'strong_candidate',
  'pilot_first',
  'redesign_before_funding',
  'split_into_smaller_use_cases',
  'weak_value_case',
])

const EVIDENCE_STATUSES = new Set<EvidenceSourceDraft['status']>([
  'needed',
  'identified',
  'available',
  'connected',
  'proxy_only',
])

const EVIDENCE_COLLECTION_STATUSES = new Set<EvidenceCollectionStatus>([
  'expected',
  'requested',
  'received',
  'stale',
  'blocked',
])

const EVIDENCE_FRESHNESS_VALUES = new Set<NonNullable<EvidenceSourceDetails['freshness']>>([
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'ad_hoc',
])

const SNAPSHOT_TYPES = new Set<MetricSnapshotType>([
  'baseline',
  'target',
  'current_observed',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`)
  }
  return value
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path} must be a non-empty string`)
  }
  return value.trim()
}

function optionalString(value: unknown, path: string): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  throw new Error(`${path} must be a string-compatible value`)
}

function requireNumber(value: unknown, path: string): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error(`${path} must be a finite number`)
  }
  return numeric
}

function stringArray(value: unknown, path: string): string[] {
  if (value === null || value === undefined) return []
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`)
  }

  return value.map((item, index) => requireString(item, `${path}[${index}]`))
}

function enumValue<T extends string>(
  value: unknown,
  allowed: Set<T>,
  path: string,
  fallback?: T,
): T {
  if (value === null || value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`${path} is required`)
  }

  const normalized = requireString(value, path) as T
  if (!allowed.has(normalized)) {
    throw new Error(`${path} must be one of: ${Array.from(allowed).join(', ')}`)
  }
  return normalized
}

function timestampValue(value: unknown, path: string, fallbackNow = false): string {
  if (value === null || value === undefined || value === '') {
    return fallbackNow ? new Date().toISOString() : ''
  }

  if (typeof value !== 'string') {
    throw new Error(`${path} must be a valid timestamp string`)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${path} must be a valid timestamp`)
  }

  return date.toISOString()
}

export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function validateRecommendation(input: unknown): RecommendationDraft {
  const record = requireRecord(input, 'recommendation')

  return {
    type: enumValue(record.type, RECOMMENDATION_TYPES, 'recommendation.type'),
    summary: requireString(record.summary, 'recommendation.summary'),
    rationale: requireString(record.rationale, 'recommendation.rationale'),
    strengths: stringArray(record.strengths, 'recommendation.strengths'),
    risks: stringArray(record.risks, 'recommendation.risks'),
    missing_data: stringArray(record.missing_data, 'recommendation.missing_data'),
    next_actions: stringArray(record.next_actions, 'recommendation.next_actions'),
    confidence_score:
      record.confidence_score === undefined || record.confidence_score === null
        ? undefined
        : clampConfidence(requireNumber(record.confidence_score, 'recommendation.confidence_score')),
  }
}

function validateEvidenceDetails(input: unknown, path: string): EvidenceSourceDetails {
  if (input === null || input === undefined) {
    return {
      collection_status: 'expected',
      requested_at: '',
      received_at: '',
      due_date: '',
      freshness: 'ad_hoc',
      last_refreshed_at: '',
      blocker: '',
      notes: '',
    }
  }

  const record = requireRecord(input, path)

  return {
    collection_status: enumValue(
      record.collection_status,
      EVIDENCE_COLLECTION_STATUSES,
      `${path}.collection_status`,
      'expected',
    ),
    requested_at: timestampValue(record.requested_at, `${path}.requested_at`),
    received_at: timestampValue(record.received_at, `${path}.received_at`),
    due_date: timestampValue(record.due_date, `${path}.due_date`),
    freshness: enumValue(record.freshness, EVIDENCE_FRESHNESS_VALUES, `${path}.freshness`, 'ad_hoc'),
    last_refreshed_at: timestampValue(record.last_refreshed_at, `${path}.last_refreshed_at`),
    blocker: optionalString(record.blocker, `${path}.blocker`) || '',
    notes: optionalString(record.notes, `${path}.notes`) || '',
  }
}

export function validateValueContracts(input: any[]): ValueContractDraft[] {
  if (!Array.isArray(input)) {
    throw new Error('valueContracts must be an array')
  }

  return input.map((item, index) => {
    const record = requireRecord(item, `valueContracts[${index}]`)

    return {
      category: requireString(record.category, `valueContracts[${index}].category`),
      where_value_lost: requireString(record.where_value_lost, `valueContracts[${index}].where_value_lost`),
      target_state: requireString(record.target_state, `valueContracts[${index}].target_state`),
      baseline_metric: requireString(record.baseline_metric, `valueContracts[${index}].baseline_metric`),
      baseline_value: optionalString(record.baseline_value, `valueContracts[${index}].baseline_value`),
      target_metric: requireString(record.target_metric, `valueContracts[${index}].target_metric`),
      target_value: optionalString(record.target_value, `valueContracts[${index}].target_value`),
      unit: optionalString(record.unit, `valueContracts[${index}].unit`),
      evidence_source: requireString(record.evidence_source, `valueContracts[${index}].evidence_source`),
      evidence_owner: requireString(record.evidence_owner, `valueContracts[${index}].evidence_owner`),
      review_cadence: requireString(record.review_cadence, `valueContracts[${index}].review_cadence`),
      confidence_grade: requireString(record.confidence_grade, `valueContracts[${index}].confidence_grade`),
      notes: optionalString(record.notes, `valueContracts[${index}].notes`),
    }
  })
}

export function validateEvidenceSources(input: any[]): EvidenceSourceDraft[] {
  if (!Array.isArray(input)) {
    throw new Error('evidenceSources must be an array')
  }

  return input.map((item, index) => {
    const record = requireRecord(item, `evidenceSources[${index}]`)

    return {
      source_name: requireString(record.source_name, `evidenceSources[${index}].source_name`),
      source_type: requireString(record.source_type, `evidenceSources[${index}].source_type`),
      integration_mode: requireString(record.integration_mode, `evidenceSources[${index}].integration_mode`),
      status: enumValue(record.status, EVIDENCE_STATUSES, `evidenceSources[${index}].status`),
      system_name: requireString(record.system_name, `evidenceSources[${index}].system_name`),
      owner_name: requireString(record.owner_name, `evidenceSources[${index}].owner_name`),
      details: validateEvidenceDetails(record.details, `evidenceSources[${index}].details`),
    }
  })
}

export function validateMetricSnapshots(input: any[]): MetricSnapshotDraft[] {
  if (!Array.isArray(input)) {
    throw new Error('metricSnapshots must be an array')
  }

  return input.map((item, index) => {
    const record = requireRecord(item, `metricSnapshots[${index}]`)

    return {
      id: optionalString(record.id, `metricSnapshots[${index}].id`),
      category: requireString(record.category, `metricSnapshots[${index}].category`),
      snapshot_type: enumValue(record.snapshot_type, SNAPSHOT_TYPES, `metricSnapshots[${index}].snapshot_type`),
      metric_name: requireString(record.metric_name, `metricSnapshots[${index}].metric_name`),
      metric_value:
        record.metric_value === null || record.metric_value === undefined
          ? ''
          : typeof record.metric_value === 'string'
            ? record.metric_value
            : String(record.metric_value),
      unit: optionalString(record.unit, `metricSnapshots[${index}].unit`),
      confidence_grade: requireString(record.confidence_grade, `metricSnapshots[${index}].confidence_grade`),
      notes: optionalString(record.notes, `metricSnapshots[${index}].notes`),
      captured_at: timestampValue(record.captured_at, `metricSnapshots[${index}].captured_at`, true),
    }
  })
}

export function validateAdvisorResult(result: any): AdvisorResult {
  const record = requireRecord(result, 'advisorResult')
  const solutionPattern = requireRecord(record.solution_pattern, 'advisorResult.solution_pattern')
  const readiness = requireRecord(record.readiness, 'advisorResult.readiness')

  return {
    refined_title: requireString(record.refined_title, 'advisorResult.refined_title'),
    use_case_type: requireString(record.use_case_type, 'advisorResult.use_case_type'),
    executive_summary: requireString(record.executive_summary, 'advisorResult.executive_summary'),
    business_problem: requireString(record.business_problem, 'advisorResult.business_problem'),
    why_now: requireString(record.why_now, 'advisorResult.why_now'),
    target_users: requireString(record.target_users, 'advisorResult.target_users'),
    workflows_in_scope: stringArray(record.workflows_in_scope, 'advisorResult.workflows_in_scope'),
    systems_in_scope: stringArray(record.systems_in_scope, 'advisorResult.systems_in_scope'),
    value_hypothesis: requireString(record.value_hypothesis, 'advisorResult.value_hypothesis'),
    solution_pattern: {
      entry_point: requireString(solutionPattern.entry_point, 'advisorResult.solution_pattern.entry_point'),
      control_plane: requireString(solutionPattern.control_plane, 'advisorResult.solution_pattern.control_plane'),
      ai_layer: requireString(solutionPattern.ai_layer, 'advisorResult.solution_pattern.ai_layer'),
      data_layer: requireString(solutionPattern.data_layer, 'advisorResult.solution_pattern.data_layer'),
      systems_of_record: stringArray(solutionPattern.systems_of_record, 'advisorResult.solution_pattern.systems_of_record'),
      human_in_loop: requireString(solutionPattern.human_in_loop, 'advisorResult.solution_pattern.human_in_loop'),
      notes: optionalString(solutionPattern.notes, 'advisorResult.solution_pattern.notes') || '',
    },
    readiness: {
      overall: requireNumber(readiness.overall, 'advisorResult.readiness.overall'),
      data: requireNumber(readiness.data, 'advisorResult.readiness.data'),
      workflow: requireNumber(readiness.workflow, 'advisorResult.readiness.workflow'),
      sponsorship: requireNumber(readiness.sponsorship, 'advisorResult.readiness.sponsorship'),
      governance: requireNumber(readiness.governance, 'advisorResult.readiness.governance'),
      integration: requireNumber(readiness.integration, 'advisorResult.readiness.integration'),
      notes: optionalString(readiness.notes, 'advisorResult.readiness.notes') || '',
    },
    value_contracts: validateValueContracts(Array.isArray(record.value_contracts) ? record.value_contracts : []),
    evidence_sources: validateEvidenceSources(Array.isArray(record.evidence_sources) ? record.evidence_sources : []),
    recommendation: validateRecommendation(record.recommendation),
    confidence_score: clampConfidence(requireNumber(record.confidence_score, 'advisorResult.confidence_score')),
  }
}
