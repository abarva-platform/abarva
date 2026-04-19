import { createClient } from '@supabase/supabase-js'
import type {
  AdvisorResult,
  EvidenceSourceDetails,
  EvidenceSourceDraft,
  MetricSnapshotDraft,
  ValueOfficeUseCaseRecord,
  RecommendationType,
  ValueOfficeUseCaseDetail,
} from './types'
import type { AbarNexusNormalizedRecord } from './ingestion'

type SupabaseErrorLike = { message?: string } | null

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase environment variables are not configured')
  return createClient(url, key)
}

function isSchemaMissing(error: SupabaseErrorLike) {
  return !!error?.message?.includes('Could not find the table')
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'object') return fallback
  return value as T
}

function normalizeEvidenceDetails(value: unknown): EvidenceSourceDetails {
  const details = parseJson<Record<string, unknown>>(value, {})
  return {
    collection_status: (details.collection_status as EvidenceSourceDetails['collection_status']) || 'expected',
    requested_at: typeof details.requested_at === 'string' ? details.requested_at : '',
    received_at: typeof details.received_at === 'string' ? details.received_at : '',
    due_date: typeof details.due_date === 'string' ? details.due_date : '',
    freshness: (details.freshness as EvidenceSourceDetails['freshness']) || 'ad_hoc',
    last_refreshed_at: typeof details.last_refreshed_at === 'string' ? details.last_refreshed_at : '',
    blocker: typeof details.blocker === 'string' ? details.blocker : '',
    notes: typeof details.notes === 'string' ? details.notes : '',
  }
}

function contractRowsFromAdvisorResult(useCaseId: string, advisorResult: AdvisorResult) {
  return advisorResult.value_contracts.map((contract, index) => ({
    use_case_id: useCaseId,
    category: contract.category,
    where_value_lost: contract.where_value_lost,
    target_state: contract.target_state,
    baseline_metric: contract.baseline_metric,
    baseline_value: contract.baseline_value || null,
    target_metric: contract.target_metric,
    target_value: contract.target_value || null,
    unit: contract.unit || null,
    evidence_source: contract.evidence_source,
    evidence_owner: contract.evidence_owner,
    review_cadence: contract.review_cadence,
    confidence_grade: contract.confidence_grade,
    notes: contract.notes || null,
    display_order: index,
  }))
}

function evidenceRowsFromAdvisorResult(useCaseId: string, advisorResult: AdvisorResult) {
  return advisorResult.evidence_sources.map(source => ({
    use_case_id: useCaseId,
    source_name: source.source_name,
    source_type: source.source_type,
    integration_mode: source.integration_mode,
    status: source.status,
    system_name: source.system_name,
    owner_name: source.owner_name,
    details: source.details || {},
  }))
}

export async function listValueOfficeUseCases(clientId?: string) {
  const supabase = getSupabase()
  let query = supabase
    .from('value_office_use_cases')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(24)

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query

  if (isSchemaMissing(error)) {
    return { schemaReady: false, items: [] as ValueOfficeUseCaseRecord[] }
  }
  if (error) throw error

  return {
    schemaReady: true,
    items: (data || []) as ValueOfficeUseCaseRecord[],
  }
}

export async function getValueOfficeUseCase(useCaseId: string) {
  const supabase = getSupabase()
  const { data: useCase, error } = await supabase
    .from('value_office_use_cases')
    .select('*')
    .eq('id', useCaseId)
    .single()

  if (isSchemaMissing(error)) {
    return { schemaReady: false, item: null as ValueOfficeUseCaseDetail | null }
  }
  if (error) throw error

  const [{ data: contracts }, { data: evidence }, { data: recommendations }, { data: conversation }, { data: decisions }, { data: snapshots }] = await Promise.all([
    supabase.from('value_office_value_contracts').select('*').eq('use_case_id', useCaseId).order('display_order', { ascending: true }),
    supabase.from('value_office_evidence_sources').select('*').eq('use_case_id', useCaseId).order('created_at', { ascending: true }),
    supabase.from('value_office_recommendations').select('*').eq('use_case_id', useCaseId).order('created_at', { ascending: false }).limit(1),
    supabase.from('value_office_conversations').select('id, role, content, created_at').eq('use_case_id', useCaseId).order('created_at', { ascending: true }),
    supabase.from('value_office_decisions').select('*').eq('use_case_id', useCaseId).order('created_at', { ascending: false }),
    supabase.from('value_office_metric_snapshots').select('*').eq('use_case_id', useCaseId).order('captured_at', { ascending: false }),
  ])

  const latest = recommendations?.[0]
  const item: ValueOfficeUseCaseDetail = {
    ...(useCase as ValueOfficeUseCaseRecord),
    solution_pattern: parseJson(useCase.solution_pattern, {}),
    readiness: parseJson(useCase.readiness, {}),
    metadata: parseJson(useCase.metadata, {}),
    value_contracts: ((contracts || []) as unknown[]).map(row => ({
      category: String((row as Record<string, unknown>).category || ''),
      where_value_lost: String((row as Record<string, unknown>).where_value_lost || ''),
      target_state: String((row as Record<string, unknown>).target_state || ''),
      baseline_metric: String((row as Record<string, unknown>).baseline_metric || ''),
      baseline_value: String((row as Record<string, unknown>).baseline_value || ''),
      target_metric: String((row as Record<string, unknown>).target_metric || ''),
      target_value: String((row as Record<string, unknown>).target_value || ''),
      unit: String((row as Record<string, unknown>).unit || ''),
      evidence_source: String((row as Record<string, unknown>).evidence_source || ''),
      evidence_owner: String((row as Record<string, unknown>).evidence_owner || ''),
      review_cadence: String((row as Record<string, unknown>).review_cadence || ''),
      confidence_grade: String((row as Record<string, unknown>).confidence_grade || ''),
      notes: String((row as Record<string, unknown>).notes || ''),
    })),
    evidence_sources: ((evidence || []) as unknown[]).map(row => ({
      source_name: String((row as Record<string, unknown>).source_name || ''),
      source_type: String((row as Record<string, unknown>).source_type || ''),
      integration_mode: String((row as Record<string, unknown>).integration_mode || ''),
      status: ((row as Record<string, unknown>).status || 'needed') as EvidenceSourceDraft['status'],
      system_name: String((row as Record<string, unknown>).system_name || ''),
      owner_name: String((row as Record<string, unknown>).owner_name || ''),
      details: normalizeEvidenceDetails((row as Record<string, unknown>).details),
    })),
    metric_snapshots: ((snapshots || []) as Array<Record<string, unknown>>).map(row => ({
      id: String(row.id || ''),
      category: String(row.category || ''),
      snapshot_type: String(row.snapshot_type || 'current_observed') as MetricSnapshotDraft['snapshot_type'],
      metric_name: String(row.metric_name || ''),
      metric_value: String(row.metric_value || ''),
      unit: String(row.unit || ''),
      confidence_grade: String(row.confidence_grade || ''),
      notes: String(row.notes || ''),
      captured_at: String(row.captured_at || ''),
    })),
    latest_recommendation: latest ? {
      recommendation: latest.recommendation as RecommendationType,
      type: latest.recommendation as RecommendationType,
      summary: latest.summary || '',
      rationale: latest.rationale || '',
      strengths: latest.strengths || [],
      risks: latest.risks || [],
      missing_data: latest.missing_data || [],
      next_actions: latest.next_actions || [],
      confidence_score: latest.confidence_score || 0,
      created_at: latest.created_at,
    } : null,
    decision_history: ((decisions || []) as Array<Record<string, unknown>>).map(row => ({
      id: String(row.id || ''),
      decision: String(row.decision || 'recommended') as ValueOfficeUseCaseDetail['decision_history'][number]['decision'],
      rationale: String(row.rationale || ''),
      decided_by: String(row.decided_by || ''),
      created_at: String(row.created_at || ''),
    })),
    conversation: (conversation || []) as Array<{ id: string; role: string; content: string; created_at: string }>,
  }

  return { schemaReady: true, item }
}

export async function persistAdvisorResult(args: {
  clientId: string
  submittedIdea: string
  createdBy: string
  sponsorName?: string
  sponsorRole?: string
  advisorResult: AdvisorResult
}) {
  const supabase = getSupabase()
  const { clientId, submittedIdea, createdBy, sponsorName, sponsorRole, advisorResult } = args

  const { data: useCase, error } = await supabase
    .from('value_office_use_cases')
    .insert({
      client_id: clientId,
      title: advisorResult.refined_title,
      submitted_idea: submittedIdea,
      business_problem: advisorResult.business_problem,
      why_now: advisorResult.why_now,
      use_case_type: advisorResult.use_case_type,
      status: 'recommended',
      recommendation: advisorResult.recommendation.type,
      recommendation_summary: advisorResult.recommendation.summary,
      confidence_score: advisorResult.confidence_score,
      sponsor_name: sponsorName || null,
      sponsor_role: sponsorRole || null,
      target_users: advisorResult.target_users,
      workflow_summary: advisorResult.workflows_in_scope.join(' | '),
      value_hypothesis: advisorResult.value_hypothesis,
      solution_pattern: advisorResult.solution_pattern,
      readiness: advisorResult.readiness,
      metadata: {
        executive_summary: advisorResult.executive_summary,
        systems_in_scope: advisorResult.systems_in_scope,
      },
      created_by: createdBy,
      updated_by: createdBy,
    })
    .select('*')
    .single()

  if (isSchemaMissing(error)) {
    return { schemaReady: false, useCaseId: null as string | null }
  }
  if (error) throw error

  const useCaseId = useCase.id as string

  const contractRows = contractRowsFromAdvisorResult(useCaseId, advisorResult)
  const evidenceRows = evidenceRowsFromAdvisorResult(useCaseId, advisorResult)

  const recommendationRow = {
    use_case_id: useCaseId,
    recommendation: advisorResult.recommendation.type,
    summary: advisorResult.recommendation.summary,
    rationale: advisorResult.recommendation.rationale,
    strengths: advisorResult.recommendation.strengths,
    risks: advisorResult.recommendation.risks,
    missing_data: advisorResult.recommendation.missing_data,
    next_actions: advisorResult.recommendation.next_actions,
    confidence_score: advisorResult.confidence_score,
    model_used: 'claude-sonnet-4-6',
    created_by: createdBy,
  }

  const conversationRows = [
    {
      use_case_id: useCaseId,
      client_id: clientId,
      role: 'user',
      content: submittedIdea,
      created_by: createdBy,
      metadata: {},
    },
    {
      use_case_id: useCaseId,
      client_id: clientId,
      role: 'advisor',
      content: advisorResult.executive_summary,
      created_by: createdBy,
      metadata: {
        recommendation: advisorResult.recommendation.type,
        confidence_score: advisorResult.confidence_score,
      },
    },
  ]

  await Promise.all([
    contractRows.length ? supabase.from('value_office_value_contracts').insert(contractRows) : Promise.resolve(),
    evidenceRows.length ? supabase.from('value_office_evidence_sources').insert(evidenceRows) : Promise.resolve(),
    supabase.from('value_office_recommendations').insert(recommendationRow),
    supabase.from('value_office_conversations').insert(conversationRows),
    supabase.from('value_office_decisions').insert({
      use_case_id: useCaseId,
      decision: 'recommended',
      rationale: advisorResult.recommendation.summary,
      decided_by: createdBy,
    }),
  ])

  return { schemaReady: true, useCaseId }
}

export async function refineValueOfficeUseCase(args: {
  useCaseId: string
  updatedBy: string
  userMessage: string
  assistantMessage: string
  advisorResult: AdvisorResult
}) {
  const supabase = getSupabase()
  const { useCaseId, updatedBy, userMessage, assistantMessage, advisorResult } = args

  const { data: useCase, error } = await supabase
    .from('value_office_use_cases')
    .select('id, client_id, sponsor_name, sponsor_role')
    .eq('id', useCaseId)
    .single()

  if (isSchemaMissing(error)) {
    return { schemaReady: false, useCaseId: null as string | null }
  }
  if (error) throw error

  await supabase
    .from('value_office_use_cases')
    .update({
      title: advisorResult.refined_title,
      business_problem: advisorResult.business_problem,
      why_now: advisorResult.why_now,
      use_case_type: advisorResult.use_case_type,
      status: 'recommended',
      recommendation: advisorResult.recommendation.type,
      recommendation_summary: advisorResult.recommendation.summary,
      confidence_score: advisorResult.confidence_score,
      target_users: advisorResult.target_users,
      workflow_summary: advisorResult.workflows_in_scope.join(' | '),
      value_hypothesis: advisorResult.value_hypothesis,
      solution_pattern: advisorResult.solution_pattern,
      readiness: advisorResult.readiness,
      metadata: {
        executive_summary: advisorResult.executive_summary,
        systems_in_scope: advisorResult.systems_in_scope,
      },
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', useCaseId)

  await Promise.all([
    supabase.from('value_office_value_contracts').delete().eq('use_case_id', useCaseId),
    supabase.from('value_office_evidence_sources').delete().eq('use_case_id', useCaseId),
  ])

  const contractRows = contractRowsFromAdvisorResult(useCaseId, advisorResult)
  const evidenceRows = evidenceRowsFromAdvisorResult(useCaseId, advisorResult)

  await Promise.all([
    contractRows.length ? supabase.from('value_office_value_contracts').insert(contractRows) : Promise.resolve(),
    evidenceRows.length ? supabase.from('value_office_evidence_sources').insert(evidenceRows) : Promise.resolve(),
    supabase.from('value_office_recommendations').insert({
      use_case_id: useCaseId,
      recommendation: advisorResult.recommendation.type,
      summary: advisorResult.recommendation.summary,
      rationale: advisorResult.recommendation.rationale,
      strengths: advisorResult.recommendation.strengths,
      risks: advisorResult.recommendation.risks,
      missing_data: advisorResult.recommendation.missing_data,
      next_actions: advisorResult.recommendation.next_actions,
      confidence_score: advisorResult.confidence_score,
      model_used: 'claude-sonnet-4-6',
      created_by: updatedBy,
    }),
    supabase.from('value_office_conversations').insert([
      {
        use_case_id: useCaseId,
        client_id: String(useCase.client_id),
        role: 'user',
        content: userMessage,
        created_by: updatedBy,
        metadata: {},
      },
      {
        use_case_id: useCaseId,
        client_id: String(useCase.client_id),
        role: 'advisor',
        content: assistantMessage,
        created_by: updatedBy,
        metadata: {
          recommendation: advisorResult.recommendation.type,
          confidence_score: advisorResult.confidence_score,
        },
      },
    ]),
    supabase.from('value_office_decisions').insert({
      use_case_id: useCaseId,
      decision: 'recommended',
      rationale: advisorResult.recommendation.summary,
      decided_by: updatedBy,
    }),
  ])

  return { schemaReady: true, useCaseId }
}

export async function saveValueOfficeContracts(args: {
  useCaseId: string
  updatedBy: string
  valueContracts: AdvisorResult['value_contracts']
}) {
  const supabase = getSupabase()
  const { useCaseId, updatedBy, valueContracts } = args

  const { data: useCase, error } = await supabase
    .from('value_office_use_cases')
    .select('id')
    .eq('id', useCaseId)
    .single()

  if (isSchemaMissing(error)) {
    return { schemaReady: false }
  }
  if (error || !useCase) throw error || new Error('Use case not found')

  await supabase.from('value_office_value_contracts').delete().eq('use_case_id', useCaseId)

  const contractRows = valueContracts.map((contract, index) => ({
    use_case_id: useCaseId,
    category: contract.category,
    where_value_lost: contract.where_value_lost,
    target_state: contract.target_state,
    baseline_metric: contract.baseline_metric,
    baseline_value: contract.baseline_value || null,
    target_metric: contract.target_metric,
    target_value: contract.target_value || null,
    unit: contract.unit || null,
    evidence_source: contract.evidence_source,
    evidence_owner: contract.evidence_owner,
    review_cadence: contract.review_cadence,
    confidence_grade: contract.confidence_grade,
    notes: contract.notes || null,
    display_order: index,
  }))

  if (contractRows.length) {
    await supabase.from('value_office_value_contracts').insert(contractRows)
  }

  await supabase
    .from('value_office_use_cases')
    .update({
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', useCaseId)

  return { schemaReady: true }
}

export async function saveValueOfficeEvidenceSources(args: {
  useCaseId: string
  updatedBy: string
  evidenceSources: AdvisorResult['evidence_sources']
}) {
  const supabase = getSupabase()
  const { useCaseId, updatedBy, evidenceSources } = args

  const { data: useCase, error } = await supabase
    .from('value_office_use_cases')
    .select('id')
    .eq('id', useCaseId)
    .single()

  if (isSchemaMissing(error)) {
    return { schemaReady: false }
  }
  if (error || !useCase) throw error || new Error('Use case not found')

  await supabase.from('value_office_evidence_sources').delete().eq('use_case_id', useCaseId)

  const evidenceRows = evidenceSources.map(source => ({
    use_case_id: useCaseId,
    source_name: source.source_name,
    source_type: source.source_type,
    integration_mode: source.integration_mode,
    status: source.status,
    system_name: source.system_name,
    owner_name: source.owner_name,
    details: source.details || {},
  }))

  if (evidenceRows.length) {
    await supabase.from('value_office_evidence_sources').insert(evidenceRows)
  }

  await supabase
    .from('value_office_use_cases')
    .update({
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', useCaseId)

  return { schemaReady: true }
}

export async function saveValueOfficeMetricSnapshots(args: {
  useCaseId: string
  updatedBy: string
  metricSnapshots: MetricSnapshotDraft[]
}) {
  const supabase = getSupabase()
  const { useCaseId, updatedBy, metricSnapshots } = args

  const { data: useCase, error } = await supabase
    .from('value_office_use_cases')
    .select('id')
    .eq('id', useCaseId)
    .single()

  if (isSchemaMissing(error)) {
    return { schemaReady: false }
  }
  if (error || !useCase) throw error || new Error('Use case not found')

  await supabase.from('value_office_metric_snapshots').delete().eq('use_case_id', useCaseId)

  const snapshotRows = metricSnapshots.map(snapshot => ({
    use_case_id: useCaseId,
    category: snapshot.category,
    snapshot_type: snapshot.snapshot_type,
    metric_name: snapshot.metric_name,
    metric_value: snapshot.metric_value || null,
    unit: snapshot.unit || null,
    confidence_grade: snapshot.confidence_grade || null,
    notes: snapshot.notes || null,
    captured_at: snapshot.captured_at || new Date().toISOString(),
    created_by: updatedBy,
  }))

  if (snapshotRows.length) {
    await supabase.from('value_office_metric_snapshots').insert(snapshotRows)
  }

  await supabase
    .from('value_office_use_cases')
    .update({
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', useCaseId)

  return { schemaReady: true }
}

export async function recordValueOfficeDecision(args: {
  useCaseId: string
  updatedBy: string
  decision: ValueOfficeUseCaseRecord['status']
  rationale: string
}) {
  const supabase = getSupabase()
  const { useCaseId, updatedBy, decision, rationale } = args

  const { data: useCase, error } = await supabase
    .from('value_office_use_cases')
    .select('id')
    .eq('id', useCaseId)
    .single()

  if (isSchemaMissing(error)) {
    return { schemaReady: false }
  }
  if (error || !useCase) throw error || new Error('Use case not found')

  await Promise.all([
    supabase
      .from('value_office_use_cases')
      .update({
        status: decision,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', useCaseId),
    supabase.from('value_office_decisions').insert({
      use_case_id: useCaseId,
      decision,
      rationale,
      decided_by: updatedBy,
    }),
  ])

  return { schemaReady: true }
}

export async function listAbarNexusIngestionRuns(limit = 8) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('abarnexus_ingestion_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (isSchemaMissing(error)) {
    return { schemaReady: false, items: [] as Array<Record<string, unknown>> }
  }
  if (error) throw error

  return {
    schemaReady: true,
    items: (data || []) as Array<Record<string, unknown>>,
  }
}

export async function persistAbarNexusIngestionRun(args: {
  sourceId: string
  sourceName: string
  mode: 'preview'
  status: 'completed' | 'failed'
  recordCount: number
  records: AbarNexusNormalizedRecord[]
  errorMessage?: string | null
  createdBy?: string | null
}) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('abarnexus_ingestion_runs')
    .insert({
      source_id: args.sourceId,
      source_name: args.sourceName,
      mode: args.mode,
      status: args.status,
      record_count: args.recordCount,
      records: args.records,
      error_message: args.errorMessage || null,
      created_by: args.createdBy || null,
    })

  if (isSchemaMissing(error)) {
    return { schemaReady: false }
  }
  if (error) throw error

  return { schemaReady: true }
}

export async function listRecentAbarNexusRecords(limit = 12) {
  const runsResult = await listAbarNexusIngestionRuns(6)
  if (!runsResult.schemaReady) {
    return { schemaReady: false, items: [] as AbarNexusNormalizedRecord[] }
  }

  const items = runsResult.items
    .flatMap(run => {
      const records = Array.isArray(run.records) ? (run.records as AbarNexusNormalizedRecord[]) : []
      return records.map(record => ({
        ...record,
        recordDate: record.recordDate || String(run.created_at || ''),
      }))
    })
    .slice(0, limit)

  return {
    schemaReady: true,
    items,
  }
}
