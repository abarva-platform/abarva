'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ALL_CLIENTS } from '@/lib/use-client-context'
import type { EvidenceCollectionStatus, EvidenceSourceDetails, EvidenceSourceDraft, MetricSnapshotDraft, ValueContractDraft } from '@/lib/value-office/types'
import { buildAbarNexusProvenance, getAbarNexusSourcesForVertical } from '@/lib/value-office/abarnexus'
import { buildSourceHealthItems, getSourceHealth, summarizeSourceHealth } from '@/lib/value-office/source-health'
import { buildConnectorDeliveryPackage, buildConnectorRequestPack, findConnectorPlaybook, formatConnectorDeliveryPackage, getConnectorTemplate } from '@/lib/value-office/ingestion'

const BG = '#F6F1E8'
const PANEL = '#FFFCF6'
const INK = '#171411'
const MUTED = '#6E655C'
const LINE = '#DDCFBD'
const TEAL = '#127C72'
const RED = '#A43D34'
const GOLD = '#B0721E'
const SHELL = '#F9F4EC'

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function mapEvidenceIntegrationModeToConnector(mode: string) {
  if (mode === 'direct_integration') return 'direct_api' as const
  return (mode || 'manual_input') as 'manual_input' | 'extract_upload' | 'scheduled_feed' | 'direct_api'
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysIsoDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function parseMetricNumber(value?: string | null) {
  if (!value) return null
  const cleaned = value.replace(/[$,%]/g, '').replace(/,/g, '').trim()
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function daysSince(dateValue?: string) {
  if (!dateValue) return null
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return null
  const diff = Date.now() - parsed.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

type OutcomeProgress = {
  category: string
  metricName: string
  baseline: number
  target: number
  current: number
  progress: number
  unit: string
  confidence: string
  capturedAt: string
}

function buildOutcomeProgress(
  baselineSnapshots: MetricSnapshotDraft[],
  targetSnapshots: MetricSnapshotDraft[],
  currentSnapshots: MetricSnapshotDraft[],
) {
  const baselineByCategory = new Map(
    baselineSnapshots
      .filter(snapshot => snapshot.category?.trim())
      .map(snapshot => [snapshot.category.trim().toLowerCase(), snapshot]),
  )
  const targetByCategory = new Map(
    targetSnapshots
      .filter(snapshot => snapshot.category?.trim())
      .map(snapshot => [snapshot.category.trim().toLowerCase(), snapshot]),
  )

  return currentSnapshots.flatMap(snapshot => {
    const key = snapshot.category?.trim().toLowerCase()
    if (!key) return []

    const baseline = baselineByCategory.get(key)
    const target = targetByCategory.get(key)
    if (!baseline || !target) return []

    const baselineValue = parseMetricNumber(baseline.metric_value)
    const targetValue = parseMetricNumber(target.metric_value)
    const currentValue = parseMetricNumber(snapshot.metric_value)
    if (baselineValue === null || targetValue === null || currentValue === null) return []

    const denominator = targetValue - baselineValue
    const rawProgress = denominator === 0
      ? (currentValue === targetValue ? 100 : 0)
      : ((currentValue - baselineValue) / denominator) * 100

    return [{
      category: snapshot.category,
      metricName: snapshot.metric_name || target.metric_name || baseline.metric_name,
      baseline: baselineValue,
      target: targetValue,
      current: currentValue,
      progress: Math.round(clamp(rawProgress, 0, 100)),
      unit: snapshot.unit || target.unit || baseline.unit || '',
      confidence: snapshot.confidence_grade || target.confidence_grade || baseline.confidence_grade || 'Bronze',
      capturedAt: snapshot.captured_at,
    }]
  })
}

type UseCaseDetail = {
  id: string
  client_id: string
  title: string
  business_problem: string | null
  why_now: string | null
  use_case_type: string | null
  target_users: string | null
  workflow_summary: string | null
  value_hypothesis: string | null
  recommendation_summary: string | null
  confidence_score: number
  status: string
  metadata: { executive_summary?: string; systems_in_scope?: string[] }
  solution_pattern: {
    entry_point?: string
    control_plane?: string
    ai_layer?: string
    data_layer?: string
    systems_of_record?: string[]
    human_in_loop?: string
    notes?: string
  }
  readiness: {
    overall?: number
    data?: number
    workflow?: number
    sponsorship?: number
    governance?: number
    integration?: number
    notes?: string
  }
  value_contracts: Array<{
    category: string
    where_value_lost: string
    target_state: string
    baseline_metric: string
    baseline_value?: string
    target_metric: string
    target_value?: string
    evidence_source: string
    evidence_owner: string
    review_cadence: string
    confidence_grade: string
  }>
  evidence_sources: Array<{
    source_name: string
    source_type: string
    integration_mode: string
    status: EvidenceSourceDraft['status']
    system_name: string
    owner_name: string
    details?: EvidenceSourceDetails
  }>
  metric_snapshots: MetricSnapshotDraft[]
  latest_recommendation: null | {
    summary: string
    rationale: string
    strengths: string[]
    risks: string[]
    missing_data: string[]
    next_actions: string[]
    confidence_score?: number
  }
  decision_history: Array<{
    id: string
    decision: string
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

export default function ValueOfficeUseCasePage() {
  const params = useParams<{ useCaseId: string }>()
  const useCaseId = Array.isArray(params.useCaseId) ? params.useCaseId[0] : params.useCaseId
  const [item, setItem] = useState<UseCaseDetail | null>(null)
  const [schemaReady, setSchemaReady] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editableContracts, setEditableContracts] = useState<ValueContractDraft[]>([])
  const [editableEvidence, setEditableEvidence] = useState<EvidenceSourceDraft[]>([])
  const [editableSnapshots, setEditableSnapshots] = useState<MetricSnapshotDraft[]>([])
  const [contractsDirty, setContractsDirty] = useState(false)
  const [evidenceDirty, setEvidenceDirty] = useState(false)
  const [snapshotsDirty, setSnapshotsDirty] = useState(false)
  const [savingContracts, setSavingContracts] = useState(false)
  const [savingEvidence, setSavingEvidence] = useState(false)
  const [savingSnapshots, setSavingSnapshots] = useState(false)
  const [refinement, setRefinement] = useState('')
  const [refining, setRefining] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null)
  const [decision, setDecision] = useState('ready_for_review')
  const [decisionRationale, setDecisionRationale] = useState('')
  const [savingDecision, setSavingDecision] = useState(false)
  const [copiedArtifact, setCopiedArtifact] = useState<string | null>(null)

  async function loadDetail() {
    if (!useCaseId) return
    const res = await fetch(`/api/value-office/use-cases/${useCaseId}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    setSchemaReady(data.schemaReady !== false)
    setItem(data.item)
    setEditableContracts(data.item?.value_contracts || [])
    setEditableEvidence(data.item?.evidence_sources || [])
    setEditableSnapshots(data.item?.metric_snapshots || [])
    setContractsDirty(false)
    setEvidenceDirty(false)
    setSnapshotsDirty(false)
  }

  useEffect(() => {
    loadDetail().catch(err => setError(err.message))
  }, [useCaseId])

  function updateContract(index: number, field: keyof ValueContractDraft, value: string) {
    setEditableContracts(current => current.map((contract, idx) => (
      idx === index ? { ...contract, [field]: value } : contract
    )))
    setContractsDirty(true)
  }

  function updateEvidence(index: number, field: keyof EvidenceSourceDraft, value: string) {
    setEditableEvidence(current => current.map((source, idx) => (
      idx === index ? { ...source, [field]: value } : source
    )))
    setEvidenceDirty(true)
  }

  function updateEvidenceDetails(index: number, field: keyof EvidenceSourceDetails, value: string) {
    setEditableEvidence(current => current.map((source, idx) => (
      idx === index
        ? {
            ...source,
            details: {
              ...(source.details || {}),
              [field]: value,
            },
          }
        : source
    )))
    setEvidenceDirty(true)
  }

  function applyEvidenceIntervention(index: number, intervention: 'assign_owner' | 'request_refresh' | 'mark_received' | 'clear_blocker') {
    const today = todayIsoDate()

    setEditableEvidence(current => current.map((source, idx) => {
      if (idx !== index) return source

      const details = { ...(source.details || {}) }

      if (intervention === 'assign_owner') {
        return {
          ...source,
          owner_name: source.owner_name?.trim() ? source.owner_name : 'Owner to confirm',
        }
      }

      if (intervention === 'request_refresh') {
        details.collection_status = source.status === 'connected' ? 'requested' : 'expected'
        details.requested_at = today
        details.due_date = details.due_date || today
        return {
          ...source,
          details,
        }
      }

      if (intervention === 'mark_received') {
        details.collection_status = 'received'
        details.received_at = today
        details.last_refreshed_at = today
        details.blocker = ''
        return {
          ...source,
          status: source.status === 'connected' ? source.status : 'connected',
          details,
        }
      }

      details.blocker = ''
      if (details.collection_status === 'blocked') {
        details.collection_status = source.status === 'connected' ? 'requested' : 'expected'
      }
      return {
        ...source,
        details,
      }
    }))
    setEvidenceDirty(true)
  }

  function applyRequestTemplate(index: number) {
    setEditableEvidence(current => current.map((source, idx) => {
      if (idx !== index) return source

      const playbook = findConnectorPlaybook(source.system_name, source.source_name)
      if (!playbook) return source

      const details = { ...(source.details || {}) }
      const requestPack = buildConnectorRequestPack(playbook, source.source_name || source.system_name || 'Evidence source')
      details.notes = requestPack
      details.collection_status = 'requested'
      details.requested_at = details.requested_at || todayIsoDate()
      details.due_date = details.due_date || addDaysIsoDate(7)
      details.freshness = details.freshness || (playbook.recommendedTemplateId === 'extract_upload' ? 'monthly' : 'weekly')

      return {
        ...source,
        details,
      }
    }))
    setEvidenceDirty(true)
  }

  function applyDeliveryPackage(index: number) {
    setEditableEvidence(current => current.map((source, idx) => {
      if (idx !== index) return source

      const playbook = findConnectorPlaybook(source.system_name, source.source_name)
      if (!playbook) return source

      const details = { ...(source.details || {}) }
      details.notes = formatConnectorDeliveryPackage(
        playbook,
        source.source_name || source.system_name || 'Evidence source',
      )

      return {
        ...source,
        details,
      }
    }))
    setEvidenceDirty(true)
  }

  async function copyArtifact(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedArtifact(label)
      setTimeout(() => setCopiedArtifact(current => (current === label ? null : current)), 1800)
    } catch (err) {
      setError('Unable to copy artifact to clipboard')
    }
  }

  function updateSnapshot(index: number, field: keyof MetricSnapshotDraft, value: string) {
    setEditableSnapshots(current => current.map((snapshot, idx) => (
      idx === index ? { ...snapshot, [field]: value } : snapshot
    )))
    setSnapshotsDirty(true)
  }

  async function saveContracts() {
    if (!useCaseId) return
    setSavingContracts(true)
    setError(null)

    try {
      const res = await fetch(`/api/value-office/use-cases/${useCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueContracts: editableContracts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to save value contracts')
      await loadDetail()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingContracts(false)
    }
  }

  async function saveEvidence() {
    if (!useCaseId) return
    setSavingEvidence(true)
    setError(null)

    try {
      const res = await fetch(`/api/value-office/use-cases/${useCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceSources: editableEvidence }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to save evidence sources')
      await loadDetail()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingEvidence(false)
    }
  }

  async function saveSnapshots() {
    if (!useCaseId) return
    setSavingSnapshots(true)
    setError(null)

    try {
      const res = await fetch(`/api/value-office/use-cases/${useCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricSnapshots: editableSnapshots }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to save metric snapshots')
      await loadDetail()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingSnapshots(false)
    }
  }

  async function sendRefinement() {
    if (!useCaseId || !refinement.trim()) return
    setRefining(true)
    setAssistantMessage(null)
    setError(null)

    try {
      const res = await fetch(`/api/value-office/use-cases/${useCaseId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: refinement }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to refine use case')
      setAssistantMessage(data.assistantMessage || null)
      setSchemaReady(data.schemaReady !== false)
      if (data.item) {
        setItem(data.item)
        setEditableContracts(data.item.value_contracts || [])
        setEditableEvidence(data.item.evidence_sources || [])
        setEditableSnapshots(data.item.metric_snapshots || [])
        setContractsDirty(false)
        setEvidenceDirty(false)
        setSnapshotsDirty(false)
      }
      setRefinement('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRefining(false)
    }
  }

  async function saveDecision() {
    if (!useCaseId || !decision.trim()) return
    setSavingDecision(true)
    setError(null)

    try {
      const res = await fetch(`/api/value-office/use-cases/${useCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rationale: decisionRationale,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to record decision')
      await loadDetail()
      setDecisionRationale('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingDecision(false)
    }
  }

  function seedSnapshotsFromContracts() {
    const seeded = editableContracts.flatMap(contract => ([
      {
        category: contract.category,
        snapshot_type: 'baseline' as const,
        metric_name: contract.baseline_metric || contract.category,
        metric_value: contract.baseline_value || '',
        unit: contract.unit || '',
        confidence_grade: contract.confidence_grade || '',
        notes: `Seeded from value contract baseline for ${contract.category}.`,
        captured_at: todayIsoDate(),
      },
      {
        category: contract.category,
        snapshot_type: 'target' as const,
        metric_name: contract.target_metric || contract.category,
        metric_value: contract.target_value || '',
        unit: contract.unit || '',
        confidence_grade: contract.confidence_grade || '',
        notes: `Seeded from value contract target for ${contract.category}.`,
        captured_at: todayIsoDate(),
      },
    ]))

    setEditableSnapshots(seeded)
    setSnapshotsDirty(true)
  }

  function addObservedSnapshot() {
    setEditableSnapshots(current => [
      ...current,
      {
        category: '',
        snapshot_type: 'current_observed',
        metric_name: '',
        metric_value: '',
        unit: '',
        confidence_grade: 'Bronze',
        notes: '',
        captured_at: todayIsoDate(),
      },
    ])
    setSnapshotsDirty(true)
  }

  const evidenceConnected = editableEvidence.filter(source => source.status === 'connected').length
  const evidenceAvailable = editableEvidence.filter(source => source.status === 'available').length
  const evidenceMissing = editableEvidence.filter(source => source.status === 'needed' || source.status === 'proxy_only').length
  const evidenceExpected = editableEvidence.filter(source => (source.details?.collection_status || 'expected') === 'expected').length
  const evidenceRequested = editableEvidence.filter(source => source.details?.collection_status === 'requested').length
  const evidenceReceived = editableEvidence.filter(source => source.details?.collection_status === 'received').length
  const evidenceStale = editableEvidence.filter(source => source.details?.collection_status === 'stale').length
  const evidenceBlocked = editableEvidence.filter(source => source.details?.collection_status === 'blocked').length
  const evidenceWithOwners = editableEvidence.filter(source => source.owner_name?.trim()).length
  const evidenceWithFreshness = editableEvidence.filter(source => source.details?.freshness && source.details.freshness !== 'ad_hoc').length
  const staleByRefreshDate = editableEvidence.filter(source => {
    const age = daysSince(source.details?.last_refreshed_at)
    return age !== null && age > 35
  }).length
  const healthySources = editableEvidence.filter(source => {
    const age = daysSince(source.details?.last_refreshed_at)
    const noStaleRefreshIssue = age === null || age <= 35
    return (
      source.status === 'connected' &&
      !!source.owner_name?.trim() &&
      evidenceOpsLabel(source) !== 'blocked' &&
      evidenceOpsLabel(source) !== 'stale' &&
      noStaleRefreshIssue
    )
  }).length
  const manualSources = editableEvidence.filter(source => source.integration_mode === 'manual_input').length
  const directSources = editableEvidence.filter(source => source.integration_mode === 'direct_integration').length
  const scheduledSources = editableEvidence.filter(source => source.integration_mode === 'scheduled_feed').length
  const bronzeContracts = editableContracts.filter(contract => contract.confidence_grade.toLowerCase() === 'bronze').length
  const missingOwners = editableContracts.filter(contract => !contract.evidence_owner?.trim()).length
  const missingBaselines = editableContracts.filter(contract => !contract.baseline_metric?.trim() || !contract.baseline_value?.trim()).length
  const totalContracts = editableContracts.length || 1
  const evidenceCoverage = Math.round((((evidenceConnected * 1) + (evidenceAvailable * 0.7) + ((editableEvidence.length - evidenceConnected - evidenceAvailable - evidenceMissing) * 0.45)) / Math.max(editableEvidence.length || 1, 1)) * 100)
  const valueContractStrength = Math.max(0, Math.round(100 - ((missingBaselines / totalContracts) * 45) - ((bronzeContracts / totalContracts) * 25) - ((missingOwners / totalContracts) * 20)))
  const ownerCoverage = Math.round((evidenceWithOwners / Math.max(editableEvidence.length, 1)) * 100)
  const freshnessCoverage = Math.round((evidenceWithFreshness / Math.max(editableEvidence.length, 1)) * 100)
  const sourceHealthScore = Math.max(
    0,
    Math.round(
      (healthySources / Math.max(editableEvidence.length, 1)) * 55 +
      (ownerCoverage * 0.25) +
      (freshnessCoverage * 0.2) -
      (staleByRefreshDate * 4),
    ),
  )
  const controlTowerScore = Math.round(((item?.confidence_score || 0) * 0.35) + ((item?.readiness.overall || 0) * 0.25) + (evidenceCoverage * 0.2) + (valueContractStrength * 0.2))
  const decisionGate = controlTowerScore >= 78 && evidenceMissing === 0
    ? 'ready_for_pilot'
    : controlTowerScore >= 60
      ? 'tighten_before_pilot'
      : 'hold_and_design'
  const gateRationale =
    decisionGate === 'ready_for_pilot'
      ? 'Evidence sources are mostly available or connected, the contract is measurable, and the use case can move into a constrained pilot.'
      : decisionGate === 'tighten_before_pilot'
        ? 'The value story is promising, but the evidence plan still has gaps that should be closed before funding or pilot expansion.'
        : 'The use case still needs stronger baselines, named evidence owners, or a clearer source plan before it should move forward.'
  const clientVertical = item ? (ALL_CLIENTS.find(client => client.id === item.client_id)?.vertical || 'Healthcare') : 'Healthcare'
  const abarnexusSources = getAbarNexusSourcesForVertical(clientVertical)
  const nexusClientSources = abarnexusSources.filter(source => source.tier === 'client_required')
  const nexusFreeSources = abarnexusSources.filter(source => source.tier === 'free_now')
  const nexusPremiumSources = abarnexusSources.filter(source => source.tier === 'premium_later')
  const provenance = buildAbarNexusProvenance({
    vertical: clientVertical,
    missingData: item?.latest_recommendation?.missing_data || [],
    hasRetrievedContext: nexusFreeSources.length > 0,
  })
  const evidenceOpsLabel = (source: EvidenceSourceDraft) => source.details?.collection_status || 'expected'
  const baselineSnapshots = editableSnapshots.filter(snapshot => snapshot.snapshot_type === 'baseline')
  const targetSnapshots = editableSnapshots.filter(snapshot => snapshot.snapshot_type === 'target')
  const currentSnapshots = editableSnapshots.filter(snapshot => snapshot.snapshot_type === 'current_observed')
  const outcomeProgress = buildOutcomeProgress(baselineSnapshots, targetSnapshots, currentSnapshots)
  const averageOutcomeProgress = outcomeProgress.length
    ? Math.round(outcomeProgress.reduce((sum, snapshot) => sum + snapshot.progress, 0) / outcomeProgress.length)
    : 0
  const onTrackOutcomes = outcomeProgress.filter(snapshot => snapshot.progress >= 80).length
  const needsAttentionOutcomes = outcomeProgress.filter(snapshot => snapshot.progress < 50).length
  const outcomesMissingObserved = Math.max(targetSnapshots.length - outcomeProgress.length, 0)
  const topOutcome = outcomeProgress.slice().sort((left, right) => right.progress - left.progress)[0] || null
  const sourceHealthSummary = summarizeSourceHealth(editableEvidence)
  const sourceHealthItems = sourceHealthSummary.items
  const blockedSourceItems = sourceHealthSummary.blocked
  const staleSourceItems = sourceHealthSummary.stale
  const ownerlessSourceItems = sourceHealthSummary.ownerMissing
  const attentionSourceItems = sourceHealthSummary.attention

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '22px 24px 42px', background: BG, color: INK, fontFamily: 'Georgia, serif' }}>
        <a href="/value-office" style={{ color: TEAL, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>← Back to AI Value Office</a>

        {!schemaReady && (
          <div style={{ background: '#FFF4E5', border: '1px solid #F2C488', borderRadius: 18, padding: '14px 18px', marginTop: 18, fontFamily: 'DM Sans, sans-serif', color: '#7A4B08' }}>
            AI Value Office schema is not live in Supabase yet, so persisted detail is unavailable.
          </div>
        )}

        {error && (
          <div style={{ marginTop: 18, color: RED, fontFamily: 'DM Sans, sans-serif' }}>{error}</div>
        )}

        {item && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 18, alignItems: 'start', marginTop: 18 }}>
            <aside style={{ display: 'grid', gap: 16, position: 'sticky', top: 126 }}>
              <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
                  Use Case
                </div>
                <div style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                  {item.metadata?.executive_summary || item.recommendation_summary || 'Detailed use case workspace.'}
                </div>
                <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                  {[
                    ['Status', item.status],
                    ['Type', item.use_case_type || 'Use case'],
                    ['Confidence', `${item.confidence_score}/100`],
                    ['Decision gate', titleCase(decisionGate)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 8, borderTop: `1px solid ${LINE}` }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, textAlign: 'right' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                  Workspace Signals
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    ['Contracts', `${editableContracts.length}`],
                    ['Evidence sources', `${editableEvidence.length}`],
                    ['Outcome lines', `${outcomeProgress.length}`],
                    ['Source health', `${sourceHealthScore}/100`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: PANEL }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 24 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                  Provenance
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    ['Client truth', `${provenance.client_truth.length}`],
                    ['Public benchmarks', `${provenance.public_benchmarks.length}`],
                    ['Pattern memory', `${provenance.pattern_memory.length}`],
                    ['Assumptions', `${provenance.assumptions.length}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 8, borderTop: `1px solid ${LINE}` }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <a href={`/value-office/${useCaseId}/review`} style={{ display: 'inline-block', marginTop: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: TEAL, textDecoration: 'none' }}>
                  Open CXO review mode →
                </a>
                <a href="/value-office/tracker" style={{ display: 'inline-block', marginTop: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: TEAL, textDecoration: 'none' }}>
                  Open execution tracker →
                </a>
              </section>
            </aside>

            <main style={{ minWidth: 0 }}>
            <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28, padding: 26 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                Use Case Detail
              </div>
              <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1 }}>{item.title}</h1>
              <p style={{ margin: '0 0 12px', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                {item.metadata?.executive_summary || item.recommendation_summary}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 11 }}>{item.status}</span>
                <span style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 11 }}>{item.use_case_type || 'Use case'}</span>
                <span style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 11 }}>Confidence {item.confidence_score}/100</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginTop: 18 }}>
                {[
                  { label: 'Client truth', items: provenance.client_truth, accent: TEAL },
                  { label: 'Public benchmarks', items: provenance.public_benchmarks, accent: TEAL },
                  { label: 'Pattern memory', items: provenance.pattern_memory, accent: TEAL },
                  { label: 'Still assumption', items: provenance.assumptions, accent: GOLD },
                ].map(group => (
                  <div key={group.label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: group.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      {group.label}
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {group.items.slice(0, 3).map(entry => (
                        <div key={entry} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: '#171411', color: '#F6F1E8', borderRadius: 26, padding: 24, marginTop: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
                <div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#87D5C8', marginBottom: 12 }}>
                    Executive Review
                  </div>
                  <h2 style={{ margin: '0 0 10px', fontSize: 32, lineHeight: 1.1 }}>
                    {item.latest_recommendation?.summary || item.recommendation_summary || 'Decision pending'}
                  </h2>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.82)', lineHeight: 1.65, maxWidth: 680 }}>
                    {item.latest_recommendation?.rationale || item.metadata?.executive_summary || 'This use case still needs executive framing.'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Decision', item.recommendation_summary || item.latest_recommendation?.summary || 'Pending'],
                    ['Confidence', `${item.confidence_score}/100`],
                    ['Missing Data', String(item.latest_recommendation?.missing_data.length || 0)],
                    ['Evidence Sources', String(item.evidence_sources.length || 0)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: 'rgba(246,241,232,0.58)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 22, lineHeight: 1.25 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
                <div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#87D5C8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Why It Wins
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(item.latest_recommendation?.strengths || []).slice(0, 4).map(point => (
                      <div key={point} style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.86)', lineHeight: 1.55 }}>
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#E6B66D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    What Must Be True
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(item.latest_recommendation?.missing_data || item.latest_recommendation?.risks || []).slice(0, 4).map(point => (
                      <div key={point} style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.86)', lineHeight: 1.55 }}>
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18, marginTop: 18 }}>
                <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 18, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#87D5C8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Decision Gate
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <label style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.84)' }}>
                      Decision
                      <select
                        value={decision}
                        onChange={e => setDecision(e.target.value)}
                        style={{ width: '100%', marginTop: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', padding: '10px 11px', background: 'rgba(255,255,255,0.05)', color: '#F6F1E8', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        <option value="ready_for_review">ready_for_review</option>
                        <option value="approved">approved</option>
                        <option value="pilot">pilot</option>
                        <option value="hold">hold</option>
                        <option value="redesign">redesign</option>
                        <option value="scaled">scaled</option>
                        <option value="stopped">stopped</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </label>
                    <button
                      onClick={saveDecision}
                      disabled={savingDecision}
                      style={{
                        alignSelf: 'end',
                        border: 'none',
                        borderRadius: 14,
                        padding: '12px 16px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 700,
                        background: savingDecision ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #127C72, #1F514C)',
                        color: '#F7FFFE',
                        cursor: savingDecision ? 'default' : 'pointer',
                      }}
                    >
                      {savingDecision ? 'Recording...' : 'Record decision'}
                    </button>
                  </div>
                  <label style={{ display: 'block', marginTop: 10, fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.84)' }}>
                    Rationale
                    <textarea
                      value={decisionRationale}
                      onChange={e => setDecisionRationale(e.target.value)}
                      placeholder="Why are we moving this use case into review, pilot, hold, or redesign?"
                      style={{ width: '100%', marginTop: 4, minHeight: 88, resize: 'vertical', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', padding: 12, background: 'rgba(255,255,255,0.05)', color: '#F6F1E8', fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </label>
                </div>
                <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 18, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#E6B66D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Decision History
                  </div>
                  <div style={{ display: 'grid', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                    {item.decision_history.length ? item.decision_history.map(entry => (
                      <div key={entry.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#87D5C8', textTransform: 'uppercase' }}>
                            {titleCase(entry.decision)}
                          </div>
                          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: 'rgba(246,241,232,0.55)' }}>
                            {entry.created_at.slice(0, 10)}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.82)', lineHeight: 1.55 }}>
                          {entry.rationale || 'No rationale recorded.'}
                        </div>
                      </div>
                    )) : (
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.68)' }}>
                        No explicit decisions recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 24, marginTop: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18 }}>
                <div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                    Evidence Control Tower
                  </div>
                  <h2 style={{ margin: '0 0 10px', fontSize: 30, lineHeight: 1.1 }}>
                    {titleCase(decisionGate)}
                  </h2>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, maxWidth: 700 }}>
                    {gateRationale}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 18 }}>
                    {[
                      ['Control Score', `${controlTowerScore}/100`],
                      ['Evidence Coverage', `${evidenceCoverage}/100`],
                      ['Contract Strength', `${valueContractStrength}/100`],
                      ['Connected Sources', `${evidenceConnected}/${editableEvidence.length || 0}`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 24, lineHeight: 1.2 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      What Is Blocking Value Proof
                    </div>
                    <div style={{ display: 'grid', gap: 8, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                      <div>{missingBaselines} contract lines still lack a defined baseline.</div>
                      <div>{missingOwners} contract lines still lack a named evidence owner.</div>
                      <div>{bronzeContracts} value contracts are still at `Bronze` confidence.</div>
                      <div>{evidenceMissing} evidence sources are still `needed` or `proxy_only`.</div>
                      <div>{evidenceBlocked} evidence sources are actively blocked.</div>
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Integration Mix
                    </div>
                    <div style={{ display: 'grid', gap: 8, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                      <div>{manualSources} manual-input sources</div>
                      <div>{scheduledSources} scheduled-feed sources</div>
                      <div>{directSources} direct integrations</div>
                      <div>{evidenceAvailable} available but not yet connected sources</div>
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Evidence Operations
                    </div>
                    <div style={{ display: 'grid', gap: 8, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                      <div>{evidenceExpected} expected</div>
                      <div>{evidenceRequested} requested</div>
                      <div>{evidenceReceived} received</div>
                      <div>{evidenceStale} stale</div>
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Source Health
                    </div>
                    <div style={{ display: 'grid', gap: 8, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                      <div>Source health score: {sourceHealthScore}/100</div>
                      <div>{healthySources} healthy connected sources</div>
                      <div>{ownerCoverage}% owner coverage</div>
                      <div>{freshnessCoverage}% freshness coverage</div>
                      <div>{staleByRefreshDate} sources look old by refresh date</div>
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Escalations
                    </div>
                    <div style={{ display: 'grid', gap: 8, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                      <div>{blockedSourceItems.length} blocked sources need intervention</div>
                      <div>{staleSourceItems.length} stale sources need refresh</div>
                      <div>{ownerlessSourceItems.length} sources need owners</div>
                      <div>{attentionSourceItems.length} sources need setup follow-through</div>
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Interventions Now
                    </div>
                    <div style={{ display: 'grid', gap: 8, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                      {(sourceHealthSummary.interventions.length > 0
                        ? sourceHealthSummary.interventions
                        : ['Evidence operations are stable enough to focus the team on proving realized value rather than fixing data plumbing.']
                      ).slice(0, 4).map(action => (
                        <div key={action}>{action}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 24, marginTop: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                    AbarNexus Context
                  </div>
                  <h2 style={{ margin: '0 0 10px', fontSize: 30, lineHeight: 1.1 }}>What should inform this recommendation.</h2>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, maxWidth: 720 }}>
                    AbarNexus should combine client truth, free public benchmarks, and eventually optional premium enrichment. This use case is mapped to the {clientVertical.toLowerCase()} source stack below so the product can grow smarter without assuming expensive subscriptions from day one.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    ['Client truth', `${nexusClientSources.length}`],
                    ['Free benchmarks', `${nexusFreeSources.length}`],
                    ['Premium later', `${nexusPremiumSources.length}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 24 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 18 }}>
                {[
                  { label: 'Client-required', sources: nexusClientSources, accent: TEAL },
                  { label: 'Free-now', sources: nexusFreeSources, accent: TEAL },
                  { label: 'Premium-later', sources: nexusPremiumSources, accent: GOLD },
                ].map(group => (
                  <div key={group.label} style={{ border: `1px solid ${LINE}`, borderRadius: 20, padding: 18, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: group.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      {group.label}
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {group.sources.slice(0, 4).map(source => (
                        <div key={source.id}>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, marginBottom: 3 }}>{source.name}</div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                            {source.why_it_matters}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 24, marginTop: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18 }}>
                <div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                    Baseline And Outcomes
                  </div>
                  <h2 style={{ margin: '0 0 10px', fontSize: 30, lineHeight: 1.1 }}>From value contract to measurable proof.</h2>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, maxWidth: 720 }}>
                    This is the first real value-realization layer: store the before state, the target state, and the latest observed outcome in one place. It gives the product a memory of what was promised and what is actually happening.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    ['Baseline', `${baselineSnapshots.length}`],
                    ['Target', `${targetSnapshots.length}`],
                    ['Observed', `${currentSnapshots.length}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 24 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={seedSnapshotsFromContracts}
                    style={{
                      border: `1px solid ${LINE}`,
                      borderRadius: 999,
                      padding: '10px 14px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 700,
                      background: '#FFF9F0',
                      color: TEAL,
                      cursor: 'pointer',
                    }}
                  >
                    Seed from contracts
                  </button>
                  <button
                    onClick={addObservedSnapshot}
                    style={{
                      border: `1px solid ${LINE}`,
                      borderRadius: 999,
                      padding: '10px 14px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 700,
                      background: '#FFF9F0',
                      color: TEAL,
                      cursor: 'pointer',
                    }}
                  >
                    Add observed snapshot
                  </button>
                </div>
                <button
                  onClick={saveSnapshots}
                  disabled={!snapshotsDirty || savingSnapshots}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '10px 14px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    background: !snapshotsDirty || savingSnapshots ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
                    color: '#F7FFFE',
                    cursor: !snapshotsDirty || savingSnapshots ? 'default' : 'pointer',
                  }}
                >
                  {savingSnapshots ? 'Saving...' : 'Save snapshots'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18, marginTop: 18 }}>
                <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Outcome summary
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      ['Numeric lines', `${outcomeProgress.length}`],
                      ['Average progress', `${averageOutcomeProgress}%`],
                      ['On track', `${onTrackOutcomes}`],
                      ['Needs attention', `${needsAttentionOutcomes}`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: PANEL }}>
                        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 22 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
                    {outcomeProgress.length
                      ? `${onTrackOutcomes} outcome lines are nearing target, ${needsAttentionOutcomes} need intervention, and ${outcomesMissingObserved} target lines still need a current observed reading.`
                      : 'The product can only compute outcome progress when baseline, target, and current observed values are all present and numeric for the same category.'}
                  </div>
                  <div style={{ marginTop: 10, fontFamily: 'DM Sans, sans-serif', color: INK, lineHeight: 1.6 }}>
                    {topOutcome
                      ? `Strongest current line: ${topOutcome.category} is at ${topOutcome.progress}% progress toward target based on the latest observed metric.`
                      : 'Next step: align one observed metric to each target category so this section can become a real value proof view.'}
                  </div>
                </div>
                <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Progress toward target
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {outcomeProgress.length ? outcomeProgress.slice(0, 4).map(snapshot => (
                      <div key={`${snapshot.category}-${snapshot.metricName}-${snapshot.capturedAt}`} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: PANEL }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <div>
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{snapshot.category}</div>
                            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.45 }}>{snapshot.metricName}</div>
                          </div>
                          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: snapshot.progress >= 80 ? TEAL : snapshot.progress >= 50 ? GOLD : RED }}>
                            {snapshot.progress}%
                          </div>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, background: '#E7DCCB', overflow: 'hidden', marginBottom: 8 }}>
                          <div
                            style={{
                              width: `${snapshot.progress}%`,
                              height: '100%',
                              background: snapshot.progress >= 80 ? TEAL : snapshot.progress >= 50 ? GOLD : RED,
                            }}
                          />
                        </div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                          Baseline {snapshot.baseline}{snapshot.unit ? ` ${snapshot.unit}` : ''} · Current {snapshot.current}{snapshot.unit ? ` ${snapshot.unit}` : ''} · Target {snapshot.target}{snapshot.unit ? ` ${snapshot.unit}` : ''}
                        </div>
                        <div style={{ marginTop: 6, fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED }}>
                          Captured {snapshot.capturedAt} · {snapshot.confidence} confidence
                        </div>
                      </div>
                    )) : (
                      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 16, padding: 16, background: PANEL, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                        No progress cards yet. Create at least one matched baseline, target, and current observed trio for the same category.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                {editableSnapshots.length === 0 ? (
                  <div style={{ border: `1px dashed ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                    No baseline or outcome snapshots recorded yet. Add the first set by creating rows from the value contract metrics.
                  </div>
                ) : editableSnapshots.map((snapshot, index) => (
                  <div key={`${snapshot.snapshot_type}-${snapshot.metric_name}-${index}`} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                        <strong>Category</strong>
                        <input
                          value={snapshot.category}
                          onChange={e => updateSnapshot(index, 'category', e.target.value)}
                          style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                        />
                      </label>
                      <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                        <strong>Snapshot type</strong>
                        <select
                          value={snapshot.snapshot_type}
                          onChange={e => updateSnapshot(index, 'snapshot_type', e.target.value)}
                          style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                        >
                          <option value="baseline">baseline</option>
                          <option value="target">target</option>
                          <option value="current_observed">current_observed</option>
                        </select>
                      </label>
                      <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                        <strong>Captured at</strong>
                        <input
                          value={snapshot.captured_at}
                          onChange={e => updateSnapshot(index, 'captured_at', e.target.value)}
                          placeholder="2026-04-18"
                          style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                        />
                      </label>
                      <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                        <strong>Metric name</strong>
                        <input
                          value={snapshot.metric_name}
                          onChange={e => updateSnapshot(index, 'metric_name', e.target.value)}
                          style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                        />
                      </label>
                      <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                        <strong>Metric value</strong>
                        <input
                          value={snapshot.metric_value}
                          onChange={e => updateSnapshot(index, 'metric_value', e.target.value)}
                          style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                        />
                      </label>
                      <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                        <strong>Unit</strong>
                        <input
                          value={snapshot.unit || ''}
                          onChange={e => updateSnapshot(index, 'unit', e.target.value)}
                          style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                        />
                      </label>
                      <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                        <strong>Confidence</strong>
                        <input
                          value={snapshot.confidence_grade}
                          onChange={e => updateSnapshot(index, 'confidence_grade', e.target.value)}
                          style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                        />
                      </label>
                    </div>
                    <label style={{ display: 'block', marginTop: 10, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                      <strong>Notes</strong>
                      <textarea
                        value={snapshot.notes || ''}
                        onChange={e => updateSnapshot(index, 'notes', e.target.value)}
                        placeholder="What changed, what caveat exists, or how was this measured?"
                        style={{ width: '100%', marginTop: 4, minHeight: 72, resize: 'vertical', borderRadius: 12, border: `1px solid ${LINE}`, padding: 10, background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
              <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
                  Problem and Pattern
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', display: 'grid', gap: 12, lineHeight: 1.6 }}>
                  <div><strong>Business problem:</strong> {item.business_problem}</div>
                  <div><strong>Why now:</strong> {item.why_now}</div>
                  <div><strong>Users:</strong> {item.target_users}</div>
                  <div><strong>Workflow scope:</strong> {item.workflow_summary}</div>
                  <div><strong>Value hypothesis:</strong> {item.value_hypothesis}</div>
                  <div><strong>Entry point:</strong> {item.solution_pattern.entry_point}</div>
                  <div><strong>Control plane:</strong> {item.solution_pattern.control_plane}</div>
                  <div><strong>AI layer:</strong> {item.solution_pattern.ai_layer}</div>
                  <div><strong>Data layer:</strong> {item.solution_pattern.data_layer}</div>
                  <div><strong>Human in loop:</strong> {item.solution_pattern.human_in_loop}</div>
                </div>
              </section>

              <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
                  Readiness and Recommendation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    ['Overall', item.readiness.overall],
                    ['Data', item.readiness.data],
                    ['Workflow', item.readiness.workflow],
                    ['Sponsorship', item.readiness.sponsorship],
                    ['Governance', item.readiness.governance],
                    ['Integration', item.readiness.integration],
                  ].map(([label, score]) => (
                    <div key={String(label)} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 12, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: MUTED }}>{label}</div>
                      <div style={{ fontSize: 28, marginTop: 4 }}>{score ?? '—'}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 14 }}>
                  {item.readiness.notes}
                </div>
                {item.latest_recommendation && (
                  <div style={{ fontFamily: 'DM Sans, sans-serif', display: 'grid', gap: 10 }}>
                    <div><strong>Summary:</strong> {item.latest_recommendation.summary}</div>
                    <div><strong>Rationale:</strong> {item.latest_recommendation.rationale}</div>
                    <div><strong>Strengths:</strong> {item.latest_recommendation.strengths.join(' | ')}</div>
                    <div><strong>Risks:</strong> {item.latest_recommendation.risks.join(' | ')}</div>
                  </div>
                )}
              </section>
            </div>

            {assistantMessage && (
              <section style={{ background: '#EAF6F3', border: `1px solid #B8D9D2`, borderRadius: 22, padding: 18, marginTop: 18 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 8 }}>
                  Advisor Update
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#21443E', lineHeight: 1.6 }}>
                  {assistantMessage}
                </div>
              </section>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, marginTop: 18 }}>
              <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL }}>
                    Value Contract Draft
                  </div>
                  <button
                    onClick={saveContracts}
                    disabled={!contractsDirty || savingContracts}
                    style={{
                      border: 'none',
                      borderRadius: 999,
                      padding: '10px 14px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 700,
                      background: !contractsDirty || savingContracts ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
                      color: '#F7FFFE',
                      cursor: !contractsDirty || savingContracts ? 'default' : 'pointer',
                    }}
                  >
                    {savingContracts ? 'Saving...' : 'Save value contract'}
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {editableContracts.map((contract, index) => (
                    <div key={`${contract.category}-${index}`} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                      <input
                        value={contract.category}
                        onChange={e => updateContract(index, 'category', e.target.value)}
                        style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 22, marginBottom: 8, color: INK, fontFamily: 'Georgia, serif' }}
                      />
                      <div style={{ display: 'grid', gap: 10 }}>
                        <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                          <strong>Where value is lost</strong>
                          <textarea
                            value={contract.where_value_lost}
                            onChange={e => updateContract(index, 'where_value_lost', e.target.value)}
                            style={{ width: '100%', marginTop: 4, minHeight: 64, resize: 'vertical', borderRadius: 12, border: `1px solid ${LINE}`, padding: 10, background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </label>
                        <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                          <strong>Target state</strong>
                          <textarea
                            value={contract.target_state}
                            onChange={e => updateContract(index, 'target_state', e.target.value)}
                            style={{ width: '100%', marginTop: 4, minHeight: 64, resize: 'vertical', borderRadius: 12, border: `1px solid ${LINE}`, padding: 10, background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                            <strong>Baseline metric</strong>
                            <input
                              value={contract.baseline_metric}
                              onChange={e => updateContract(index, 'baseline_metric', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                            <strong>Baseline value</strong>
                            <input
                              value={contract.baseline_value || ''}
                              onChange={e => updateContract(index, 'baseline_value', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                            <strong>Target metric</strong>
                            <input
                              value={contract.target_metric}
                              onChange={e => updateContract(index, 'target_metric', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                            <strong>Target value</strong>
                            <input
                              value={contract.target_value || ''}
                              onChange={e => updateContract(index, 'target_value', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                          <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                            <strong>Evidence source</strong>
                            <input
                              value={contract.evidence_source}
                              onChange={e => updateContract(index, 'evidence_source', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                            <strong>Evidence owner</strong>
                            <input
                              value={contract.evidence_owner}
                              onChange={e => updateContract(index, 'evidence_owner', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                            <strong>Confidence</strong>
                            <input
                              value={contract.confidence_grade}
                              onChange={e => updateContract(index, 'confidence_grade', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                        </div>
                        <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                          <strong>Review cadence</strong>
                          <input
                            value={contract.review_cadence}
                            onChange={e => updateContract(index, 'review_cadence', e.target.value)}
                            style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ display: 'grid', gap: 18 }}>
                <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
                    Advisor Refinement
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                      This is where the experience becomes different from generic chat: refine the use case, add new facts, or answer missing-data questions and let the record evolve.
                    </div>
                    <textarea
                      value={refinement}
                      onChange={e => setRefinement(e.target.value)}
                      placeholder="Example: We do have a baseline for IT ticket volume, but not for HR queries yet. ServiceNow data can be exported weekly, and the CHRO is willing to sponsor a pilot."
                      style={{ width: '100%', minHeight: 140, resize: 'vertical', borderRadius: 16, border: `1px solid ${LINE}`, padding: 14, fontFamily: 'DM Sans, sans-serif', fontSize: 15, lineHeight: 1.55, background: '#FFF9F0', color: INK }}
                    />
                    <button
                      onClick={sendRefinement}
                      disabled={!refinement.trim() || refining}
                      style={{
                        border: 'none',
                        borderRadius: 16,
                        padding: '14px 18px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 700,
                        background: !refinement.trim() || refining ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
                        color: '#F7FFFE',
                        cursor: !refinement.trim() || refining ? 'default' : 'pointer',
                      }}
                    >
                      {refining ? 'Refining use case...' : 'Refine with AI Value Office'}
                    </button>
                  </div>
                </div>

                <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL }}>
                      Conversation
                    </div>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD }}>
                      {item.conversation.length} messages
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                    {item.conversation.map(message => (
                      <div
                        key={message.id}
                        style={{
                          border: `1px solid ${message.role === 'advisor' ? '#B8D9D2' : LINE}`,
                          borderRadius: 16,
                          padding: 14,
                          background: message.role === 'advisor' ? '#F1FBF8' : '#FFF9F0',
                        }}
                      >
                        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: message.role === 'advisor' ? TEAL : MUTED, marginBottom: 8 }}>
                          {message.role === 'advisor' ? 'AI Value Office' : 'User'}
                        </div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', color: INK, lineHeight: 1.6 }}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL }}>
                      Evidence Sources
                    </div>
                    <button
                      onClick={saveEvidence}
                      disabled={!evidenceDirty || savingEvidence}
                      style={{
                        border: 'none',
                        borderRadius: 999,
                        padding: '10px 14px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 700,
                        background: !evidenceDirty || savingEvidence ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
                        color: '#F7FFFE',
                        cursor: !evidenceDirty || savingEvidence ? 'default' : 'pointer',
                      }}
                    >
                      {savingEvidence ? 'Saving...' : 'Save evidence plan'}
                    </button>
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 14 }}>
                    Integration matters, but the first real product value is agreeing how evidence will arrive: manual input, extract/upload, scheduled feed, or direct integration.
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {editableEvidence.map((source, index) => (
                      <div key={`${source.source_name}-${index}`} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55 }}>
                        {(() => {
                          const connectorTemplate = getConnectorTemplate(mapEvidenceIntegrationModeToConnector(source.integration_mode))
                          const connectorPlaybook = findConnectorPlaybook(source.system_name, source.source_name)
                          return connectorTemplate ? (
                            <div style={{ marginBottom: 10, padding: 10, borderRadius: 14, border: `1px solid ${LINE}`, background: PANEL }}>
                              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                Connector path
                              </div>
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>{connectorTemplate.title}</div>
                              <div style={{ color: MUTED, lineHeight: 1.5, marginBottom: 6 }}>
                                {connectorTemplate.summary}
                              </div>
                              <div style={{ color: MUTED, lineHeight: 1.5 }}>
                                <strong>Output:</strong> {connectorTemplate.outputContract}
                              </div>
                              {connectorPlaybook && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${LINE}` }}>
                                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                    Priority playbook
                                  </div>
                                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{connectorPlaybook.title}</div>
                                  <div style={{ color: MUTED, lineHeight: 1.5, marginBottom: 6 }}>
                                    {connectorPlaybook.summary}
                                  </div>
                                  <div style={{ color: MUTED, lineHeight: 1.5, marginBottom: 6 }}>
                                    <strong>Sample contract:</strong> {connectorPlaybook.exportContract.objectName} · {connectorPlaybook.exportContract.cadence}
                                  </div>
                                  <div style={{ display: 'grid', gap: 4 }}>
                                    {connectorPlaybook.onboardingChecklist.slice(0, 3).map(step => (
                                      <div key={step} style={{ color: MUTED, lineHeight: 1.45 }}>
                                        {step}
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => applyRequestTemplate(index)}
                                    style={{
                                      marginTop: 8,
                                      border: `1px solid ${LINE}`,
                                      borderRadius: 999,
                                      padding: '7px 10px',
                                      background: '#FFF4E5',
                                      color: GOLD,
                                      fontFamily: 'DM Sans, sans-serif',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Apply request template
                                  </button>
                                  <button
                                    onClick={() => copyArtifact(
                                      `request-${index}`,
                                      buildConnectorRequestPack(
                                        connectorPlaybook,
                                        source.source_name || source.system_name || 'Evidence source',
                                      ),
                                    )}
                                    style={{
                                      marginTop: 8,
                                      marginLeft: 8,
                                      border: `1px solid ${LINE}`,
                                      borderRadius: 999,
                                      padding: '7px 10px',
                                      background: PANEL,
                                      color: INK,
                                      fontFamily: 'DM Sans, sans-serif',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {copiedArtifact === `request-${index}` ? 'Copied request' : 'Copy request'}
                                  </button>
                                  <button
                                    onClick={() => applyDeliveryPackage(index)}
                                    style={{
                                      marginTop: 8,
                                      marginLeft: 8,
                                      border: `1px solid ${LINE}`,
                                      borderRadius: 999,
                                      padding: '7px 10px',
                                      background: '#EFFAF7',
                                      color: TEAL,
                                      fontFamily: 'DM Sans, sans-serif',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Prepare delivery package
                                  </button>
                                  <button
                                    onClick={() => copyArtifact(
                                      `delivery-${index}`,
                                      formatConnectorDeliveryPackage(
                                        connectorPlaybook,
                                        source.source_name || source.system_name || 'Evidence source',
                                      ),
                                    )}
                                    style={{
                                      marginTop: 8,
                                      marginLeft: 8,
                                      border: `1px solid ${LINE}`,
                                      borderRadius: 999,
                                      padding: '7px 10px',
                                      background: '#EFFAF7',
                                      color: TEAL,
                                      fontFamily: 'DM Sans, sans-serif',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {copiedArtifact === `delivery-${index}` ? 'Copied package' : 'Copy package'}
                                  </button>
                                  <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: '#FFF9F0', border: `1px solid ${LINE}` }}>
                                    {(() => {
                                      const deliveryPackage = buildConnectorDeliveryPackage(
                                        connectorPlaybook,
                                        source.source_name || source.system_name || 'Evidence source',
                                      )
                                      return (
                                        <>
                                          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                            Delivery package
                                          </div>
                                          <div style={{ color: MUTED, lineHeight: 1.5, marginBottom: 6 }}>
                                            <strong>{deliveryPackage.exportContract.objectName}</strong> · {deliveryPackage.exportContract.cadence}
                                          </div>
                                          <div style={{ color: MUTED, lineHeight: 1.5, marginBottom: 6 }}>
                                            <strong>Columns:</strong> {deliveryPackage.exportContract.requiredColumns.join(', ')}
                                          </div>
                                          <div style={{ color: MUTED, lineHeight: 1.5 }}>
                                            <strong>Checks:</strong> {deliveryPackage.exportContract.qualityChecks.join(' · ')}
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null
                        })()}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '5px 8px',
                                borderRadius: 999,
                                fontFamily: 'Courier New, monospace',
                                fontSize: 10,
                                border: `1px solid ${LINE}`,
                                background:
                                  getSourceHealth(source).label === 'healthy'
                                    ? '#E5F4F1'
                                    : getSourceHealth(source).label === 'blocked'
                                      ? '#FDEEEE'
                                      : getSourceHealth(source).label === 'stale'
                                        ? '#FFF4E5'
                                        : '#F7F0E8',
                                color:
                                  getSourceHealth(source).label === 'healthy'
                                    ? TEAL
                                    : getSourceHealth(source).label === 'blocked'
                                      ? RED
                                      : GOLD,
                              }}
                            >
                              {getSourceHealth(source).label}
                            </span>
                            <span style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                              {getSourceHealth(source).reason}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                          {!source.owner_name?.trim() && (
                            <button
                              onClick={() => applyEvidenceIntervention(index, 'assign_owner')}
                              style={{
                                border: `1px solid ${LINE}`,
                                borderRadius: 999,
                                padding: '7px 10px',
                                background: PANEL,
                                color: INK,
                                fontFamily: 'DM Sans, sans-serif',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Assign owner
                            </button>
                          )}
                          {(getSourceHealth(source).label === 'stale' || evidenceOpsLabel(source) === 'expected') && (
                            <button
                              onClick={() => applyEvidenceIntervention(index, 'request_refresh')}
                              style={{
                                border: `1px solid ${LINE}`,
                                borderRadius: 999,
                                padding: '7px 10px',
                                background: PANEL,
                                color: INK,
                                fontFamily: 'DM Sans, sans-serif',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Request refresh
                            </button>
                          )}
                          {getSourceHealth(source).label === 'blocked' && (
                            <button
                              onClick={() => applyEvidenceIntervention(index, 'clear_blocker')}
                              style={{
                                border: `1px solid ${LINE}`,
                                borderRadius: 999,
                                padding: '7px 10px',
                                background: PANEL,
                                color: INK,
                                fontFamily: 'DM Sans, sans-serif',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Clear blocker
                            </button>
                          )}
                          {evidenceOpsLabel(source) !== 'received' && (
                            <button
                              onClick={() => applyEvidenceIntervention(index, 'mark_received')}
                              style={{
                                border: `1px solid ${LINE}`,
                                borderRadius: 999,
                                padding: '7px 10px',
                                background: PANEL,
                                color: INK,
                                fontFamily: 'DM Sans, sans-serif',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Mark received
                            </button>
                          )}
                        </div>
                        <input
                          value={source.source_name}
                          onChange={e => updateEvidence(index, 'source_name', e.target.value)}
                          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 18, marginBottom: 10, color: INK, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <label style={{ color: MUTED }}>
                            <strong>Source type</strong>
                            <input
                              value={source.source_type}
                              onChange={e => updateEvidence(index, 'source_type', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ color: MUTED }}>
                            <strong>System</strong>
                            <input
                              value={source.system_name}
                              onChange={e => updateEvidence(index, 'system_name', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ color: MUTED }}>
                            <strong>Integration mode</strong>
                            <select
                              value={source.integration_mode}
                              onChange={e => updateEvidence(index, 'integration_mode', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            >
                              <option value="manual_input">manual_input</option>
                              <option value="extract_upload">extract_upload</option>
                              <option value="scheduled_feed">scheduled_feed</option>
                              <option value="direct_integration">direct_integration</option>
                            </select>
                          </label>
                          <label style={{ color: MUTED }}>
                            <strong>Status</strong>
                            <select
                              value={source.status}
                              onChange={e => updateEvidence(index, 'status', e.target.value as EvidenceSourceDraft['status'])}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            >
                              <option value="needed">needed</option>
                              <option value="identified">identified</option>
                              <option value="available">available</option>
                              <option value="connected">connected</option>
                              <option value="proxy_only">proxy_only</option>
                            </select>
                          </label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                          <label style={{ color: MUTED }}>
                            <strong>Collection status</strong>
                            <select
                              value={evidenceOpsLabel(source)}
                              onChange={e => updateEvidenceDetails(index, 'collection_status', e.target.value as EvidenceCollectionStatus)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            >
                              <option value="expected">expected</option>
                              <option value="requested">requested</option>
                              <option value="received">received</option>
                              <option value="stale">stale</option>
                              <option value="blocked">blocked</option>
                            </select>
                          </label>
                          <label style={{ color: MUTED }}>
                            <strong>Freshness</strong>
                            <select
                              value={source.details?.freshness || 'ad_hoc'}
                              onChange={e => updateEvidenceDetails(index, 'freshness', e.target.value)}
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            >
                              <option value="daily">daily</option>
                              <option value="weekly">weekly</option>
                              <option value="monthly">monthly</option>
                              <option value="quarterly">quarterly</option>
                              <option value="ad_hoc">ad_hoc</option>
                            </select>
                          </label>
                          <label style={{ color: MUTED }}>
                            <strong>Requested at</strong>
                            <input
                              value={source.details?.requested_at || ''}
                              onChange={e => updateEvidenceDetails(index, 'requested_at', e.target.value)}
                              placeholder="2026-04-18"
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ color: MUTED }}>
                            <strong>Due date</strong>
                            <input
                              value={source.details?.due_date || ''}
                              onChange={e => updateEvidenceDetails(index, 'due_date', e.target.value)}
                              placeholder="2026-04-30"
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ color: MUTED }}>
                            <strong>Received at</strong>
                            <input
                              value={source.details?.received_at || ''}
                              onChange={e => updateEvidenceDetails(index, 'received_at', e.target.value)}
                              placeholder="2026-04-24"
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                          <label style={{ color: MUTED }}>
                            <strong>Last refreshed</strong>
                            <input
                              value={source.details?.last_refreshed_at || ''}
                              onChange={e => updateEvidenceDetails(index, 'last_refreshed_at', e.target.value)}
                              placeholder="2026-04-24"
                              style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </label>
                        </div>
                        <label style={{ color: MUTED, display: 'block', marginTop: 10 }}>
                          <strong>Owner</strong>
                          <input
                            value={source.owner_name}
                            onChange={e => updateEvidence(index, 'owner_name', e.target.value)}
                            style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </label>
                        <label style={{ color: MUTED, display: 'block', marginTop: 10 }}>
                          <strong>Blocker</strong>
                          <input
                            value={source.details?.blocker || ''}
                            onChange={e => updateEvidenceDetails(index, 'blocker', e.target.value)}
                            placeholder="Example: Awaiting ServiceNow admin export access"
                            style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </label>
                        <label style={{ color: MUTED, display: 'block', marginTop: 10 }}>
                          <strong>Ops notes</strong>
                          <textarea
                            value={source.details?.notes || ''}
                            onChange={e => updateEvidenceDetails(index, 'notes', e.target.value)}
                            placeholder="Collection notes, contact trail, or caveats"
                            style={{ width: '100%', marginTop: 4, minHeight: 70, resize: 'vertical', borderRadius: 12, border: `1px solid ${LINE}`, padding: 10, background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {item.latest_recommendation && (
                  <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
                      Next Actions
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.7, color: MUTED }}>
                      {item.latest_recommendation.next_actions.map(action => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>
            </main>
          </div>
        )}
    </div>
  )
}
