'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  EvidenceSourceDetails,
  EvidenceSourceDraft,
  MetricSnapshotDraft,
  RecommendationType,
  ValueContractDraft,
  ValueOfficeUseCaseDetail,
} from '@/lib/value-office/types'
import { summarizeSourceHealth } from '@/lib/value-office/source-health'
import { buildConnectorRequestPack, findConnectorPlaybook, formatConnectorDeliveryPackage } from '@/lib/value-office/ingestion'
import {
  calculateEvidenceCoverage,
  calculateReadinessScore,
  calculateValueContractStrength,
  evaluateDecisionEngine,
  type DecisionEngineResult,
  type EvidenceCoverageResult,
} from '@/lib/value-office/decision-engine'
import { buildKnowledgeLayerContext, type KnowledgeLayerContext } from '@/lib/value-office/knowledge-layer'
import { buildNextActions, type NextAction } from '@/lib/value-office/next-action-engine'
import { detectContradictions, type ValueOfficeContradiction } from '@/lib/value-office/contradiction-engine'
import { buildWorkflowStageState, type WorkflowStageState } from '@/lib/value-office/workflow-engine'
import {
  buildOutcomeProgress,
  buildOutcomeSummary,
  deriveVerticalFromClientId,
  type OutcomeProgress,
  type OutcomeSummary,
} from '@/lib/value-office/workflow-intelligence'

export type SuccessScope = 'contracts' | 'evidence' | 'snapshots' | 'decision' | 'refinement'

type SuccessState = {
  scope: SuccessScope
  message: string
}

type UseCaseWorkspaceContextValue = {
  useCaseId: string
  item: ValueOfficeUseCaseDetail | null
  schemaReady: boolean
  loading: boolean
  error: string | null
  assistantMessage: string | null
  copiedArtifact: string | null
  successState: SuccessState | null
  editableContracts: ValueContractDraft[]
  editableEvidence: EvidenceSourceDraft[]
  editableSnapshots: MetricSnapshotDraft[]
  contractsDirty: boolean
  evidenceDirty: boolean
  snapshotsDirty: boolean
  savingContracts: boolean
  savingEvidence: boolean
  savingSnapshots: boolean
  refining: boolean
  refinement: string
  decision: string
  decisionRationale: string
  savingDecision: boolean
  sourceHealthSummary: ReturnType<typeof summarizeSourceHealth>
  evidenceCoverage: EvidenceCoverageResult
  valueContractStrength: number
  readinessScore: number
  decisionEngine: DecisionEngineResult
  contradictions: ValueOfficeContradiction[]
  knowledgeLayer: KnowledgeLayerContext
  workflow: WorkflowStageState
  nextActions: NextAction[]
  baselineSnapshots: MetricSnapshotDraft[]
  targetSnapshots: MetricSnapshotDraft[]
  currentSnapshots: MetricSnapshotDraft[]
  outcomeProgress: OutcomeProgress[]
  outcomeSummary: OutcomeSummary
  setRefinement: (value: string) => void
  setDecision: (value: string) => void
  setDecisionRationale: (value: string) => void
  clearError: () => void
  updateContract: (index: number, field: keyof ValueContractDraft, value: string) => void
  updateEvidence: (index: number, field: keyof EvidenceSourceDraft, value: string) => void
  updateEvidenceDetails: (index: number, field: keyof EvidenceSourceDetails, value: string) => void
  updateSnapshot: (index: number, field: keyof MetricSnapshotDraft, value: string) => void
  applyEvidenceIntervention: (
    index: number,
    intervention: 'assign_owner' | 'request_refresh' | 'mark_received' | 'clear_blocker',
  ) => void
  applyRequestTemplate: (index: number) => void
  applyDeliveryPackage: (index: number) => void
  copyArtifact: (label: string, value: string) => Promise<void>
  seedSnapshotsFromContracts: () => void
  addObservedSnapshot: () => void
  saveContracts: () => Promise<void>
  saveEvidence: () => Promise<void>
  saveSnapshots: () => Promise<void>
  sendRefinement: () => Promise<void>
  saveDecision: () => Promise<void>
}

const UseCaseWorkspaceContext = createContext<UseCaseWorkspaceContextValue | null>(null)

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysIsoDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function humanizeDetailError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('schema') || lower.includes('supabase')) {
    return 'AI Value Office detail cannot fully load right now because the Value Office schema or Supabase connection is unavailable.'
  }
  if (lower.includes('advisor')) {
    return `The advisor could not complete the refinement safely. ${message}`
  }
  return message
}

function syncDecisionState(item: ValueOfficeUseCaseDetail | null) {
  return item?.decision_history?.[0]?.decision || item?.status || 'ready_for_review'
}

export function UseCaseWorkspaceProvider({
  useCaseId,
  children,
}: {
  useCaseId: string
  children: ReactNode
}) {
  const [item, setItem] = useState<ValueOfficeUseCaseDetail | null>(null)
  const [schemaReady, setSchemaReady] = useState(true)
  const [loading, setLoading] = useState(true)
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
  const [successState, setSuccessState] = useState<SuccessState | null>(null)

  function syncItemState(nextItem: ValueOfficeUseCaseDetail | null) {
    setItem(nextItem)
    setEditableContracts(nextItem?.value_contracts || [])
    setEditableEvidence(nextItem?.evidence_sources || [])
    setEditableSnapshots(nextItem?.metric_snapshots || [])
    setDecision(syncDecisionState(nextItem))
    setContractsDirty(false)
    setEvidenceDirty(false)
    setSnapshotsDirty(false)
  }

  async function loadDetail() {
    if (!useCaseId) return null
    setLoading(true)
    const res = await fetch(`/api/value-office/use-cases/${useCaseId}`)
    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(humanizeDetailError(data.error || 'Unable to load use case'))
    }
    setSchemaReady(data.schemaReady !== false)
    syncItemState(data.item || null)
    return data.item as ValueOfficeUseCaseDetail | null
  }

  useEffect(() => {
    loadDetail()
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [useCaseId])

  useEffect(() => {
    if (!successState) return
    const timeout = window.setTimeout(() => setSuccessState(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [successState])

  function clearError() {
    setError(null)
  }

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

  function updateSnapshot(index: number, field: keyof MetricSnapshotDraft, value: string) {
    setEditableSnapshots(current => current.map((snapshot, idx) => (
      idx === index ? { ...snapshot, [field]: value } : snapshot
    )))
    setSnapshotsDirty(true)
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
        return { ...source, details }
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
      return { ...source, details }
    }))
    setEvidenceDirty(true)
  }

  function applyRequestTemplate(index: number) {
    setEditableEvidence(current => current.map((source, idx) => {
      if (idx !== index) return source
      const playbook = findConnectorPlaybook(source.system_name, source.source_name)
      if (!playbook) return source

      const details = { ...(source.details || {}) }
      details.notes = buildConnectorRequestPack(playbook, source.source_name || source.system_name || 'Evidence source')
      details.collection_status = 'requested'
      details.requested_at = details.requested_at || todayIsoDate()
      details.due_date = details.due_date || addDaysIsoDate(7)
      details.freshness = details.freshness || (playbook.recommendedTemplateId === 'extract_upload' ? 'monthly' : 'weekly')

      return { ...source, details }
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

      return { ...source, details }
    }))
    setEvidenceDirty(true)
  }

  async function copyArtifact(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedArtifact(label)
      setTimeout(() => setCopiedArtifact(current => (current === label ? null : current)), 1800)
    } catch {
      setError('Unable to copy artifact to clipboard')
    }
  }

  async function saveContracts() {
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
      setSchemaReady(data.schemaReady !== false)
      if (data.item) syncItemState(data.item)
      setSuccessState({ scope: 'contracts', message: 'Value contract saved' })
    } catch (err: any) {
      setError(humanizeDetailError(err.message))
    } finally {
      setSavingContracts(false)
    }
  }

  async function saveEvidence() {
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
      setSchemaReady(data.schemaReady !== false)
      if (data.item) syncItemState(data.item)
      setSuccessState({ scope: 'evidence', message: 'Evidence plan saved' })
    } catch (err: any) {
      setError(humanizeDetailError(err.message))
    } finally {
      setSavingEvidence(false)
    }
  }

  async function saveSnapshots() {
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
      setSchemaReady(data.schemaReady !== false)
      if (data.item) syncItemState(data.item)
      setSuccessState({ scope: 'snapshots', message: 'Snapshots saved' })
    } catch (err: any) {
      setError(humanizeDetailError(err.message))
    } finally {
      setSavingSnapshots(false)
    }
  }

  async function sendRefinement() {
    if (!refinement.trim()) return
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
      if (data.item) syncItemState(data.item)
      setRefinement('')
      setSuccessState({ scope: 'refinement', message: 'Use case refined' })
    } catch (err: any) {
      setError(humanizeDetailError(err.message))
    } finally {
      setRefining(false)
    }
  }

  async function saveDecision() {
    if (!decision.trim()) return
    setSavingDecision(true)
    setError(null)
    try {
      const res = await fetch(`/api/value-office/use-cases/${useCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, rationale: decisionRationale }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to record decision')
      setSchemaReady(data.schemaReady !== false)
      if (data.item) syncItemState(data.item)
      setDecisionRationale('')
      setSuccessState({ scope: 'decision', message: 'Decision recorded' })
    } catch (err: any) {
      setError(humanizeDetailError(err.message))
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

  const baselineSnapshots = useMemo(
    () => editableSnapshots.filter(snapshot => snapshot.snapshot_type === 'baseline'),
    [editableSnapshots],
  )
  const targetSnapshots = useMemo(
    () => editableSnapshots.filter(snapshot => snapshot.snapshot_type === 'target'),
    [editableSnapshots],
  )
  const currentSnapshots = useMemo(
    () => editableSnapshots.filter(snapshot => snapshot.snapshot_type === 'current_observed'),
    [editableSnapshots],
  )

  const sourceHealthSummary = useMemo(
    () => summarizeSourceHealth(editableEvidence),
    [editableEvidence],
  )

  const evidenceCoverage = useMemo(
    () => calculateEvidenceCoverage(editableEvidence),
    [editableEvidence],
  )

  const valueContractStrength = useMemo(
    () => calculateValueContractStrength(editableContracts, editableSnapshots),
    [editableContracts, editableSnapshots],
  )

  const readinessScore = useMemo(
    () => calculateReadinessScore((item?.readiness || {}) as Record<string, unknown>),
    [item?.readiness],
  )

  const contradictions = useMemo(
    () => detectContradictions({
      recommendationType: (item?.latest_recommendation?.recommendation || item?.recommendation || null) as RecommendationType | null,
      evidenceCoverage: evidenceCoverage.score,
      valueContracts: editableContracts,
      evidenceSources: editableEvidence,
      metricSnapshots: editableSnapshots,
    }),
    [editableContracts, editableEvidence, editableSnapshots, evidenceCoverage.score, item?.latest_recommendation?.recommendation, item?.recommendation],
  )

  const decisionEngine = useMemo(
    () => evaluateDecisionEngine({
      recommendationType: (item?.latest_recommendation?.recommendation || item?.recommendation || null) as RecommendationType | null,
      confidenceScore: item?.confidence_score || 0,
      readinessScore,
      evidenceCoverage: evidenceCoverage.score,
      valueContractStrength,
      severeContradictions: contradictions.filter(item => item.severity === 'severe').length,
      moderateContradictions: contradictions.filter(item => item.severity === 'moderate').length,
    }),
    [contradictions, evidenceCoverage.score, item?.confidence_score, item?.latest_recommendation?.recommendation, item?.recommendation, readinessScore, valueContractStrength],
  )

  const knowledgeLayer = useMemo(
    () => buildKnowledgeLayerContext({
      vertical: deriveVerticalFromClientId(item?.client_id),
      title: item?.title || '',
      useCaseType: item?.use_case_type || '',
      datasetSummary: [
        item?.business_problem || '',
        item?.workflow_summary || '',
        item?.value_hypothesis || '',
      ].filter(Boolean),
    }),
    [item?.business_problem, item?.client_id, item?.title, item?.use_case_type, item?.value_hypothesis, item?.workflow_summary],
  )

  const workflow = useMemo(
    () => buildWorkflowStageState({
      submittedIdea: item?.submitted_idea,
      businessProblem: item?.business_problem,
      workflowSummary: item?.workflow_summary,
      latestRecommendation: item?.latest_recommendation || null,
      valueContracts: editableContracts,
      evidenceSources: editableEvidence,
      metricSnapshots: editableSnapshots,
      contradictionsCount: contradictions.length,
      status: item?.status || 'draft',
    }),
    [contradictions.length, editableContracts, editableEvidence, editableSnapshots, item?.business_problem, item?.latest_recommendation, item?.status, item?.submitted_idea, item?.workflow_summary],
  )

  const nextActions = useMemo(
    () => buildNextActions({
      workflow,
      contradictions,
      knowledgeLayer,
    }),
    [contradictions, knowledgeLayer, workflow],
  )

  const outcomeProgress = useMemo(
    () => buildOutcomeProgress(baselineSnapshots, targetSnapshots, currentSnapshots),
    [baselineSnapshots, targetSnapshots, currentSnapshots],
  )

  const outcomeSummary = useMemo(() => {
    return buildOutcomeSummary(outcomeProgress, targetSnapshots.length, currentSnapshots.length)
  }, [currentSnapshots.length, outcomeProgress, targetSnapshots.length])

  const value = useMemo<UseCaseWorkspaceContextValue>(() => ({
    useCaseId,
    item,
    schemaReady,
    loading,
    error,
    assistantMessage,
    copiedArtifact,
    successState,
    editableContracts,
    editableEvidence,
    editableSnapshots,
    contractsDirty,
    evidenceDirty,
    snapshotsDirty,
    savingContracts,
    savingEvidence,
    savingSnapshots,
    refining,
    refinement,
    decision,
    decisionRationale,
    savingDecision,
    sourceHealthSummary,
    evidenceCoverage,
    valueContractStrength,
    readinessScore,
    decisionEngine,
    contradictions,
    knowledgeLayer,
    workflow,
    nextActions,
    baselineSnapshots,
    targetSnapshots,
    currentSnapshots,
    outcomeProgress,
    outcomeSummary,
    setRefinement,
    setDecision,
    setDecisionRationale,
    clearError,
    updateContract,
    updateEvidence,
    updateEvidenceDetails,
    updateSnapshot,
    applyEvidenceIntervention,
    applyRequestTemplate,
    applyDeliveryPackage,
    copyArtifact,
    seedSnapshotsFromContracts,
    addObservedSnapshot,
    saveContracts,
    saveEvidence,
    saveSnapshots,
    sendRefinement,
    saveDecision,
  }), [
    useCaseId,
    item,
    schemaReady,
    loading,
    error,
    assistantMessage,
    copiedArtifact,
    successState,
    editableContracts,
    editableEvidence,
    editableSnapshots,
    contractsDirty,
    evidenceDirty,
    snapshotsDirty,
    savingContracts,
    savingEvidence,
    savingSnapshots,
    refining,
    refinement,
    decision,
    decisionRationale,
    savingDecision,
    sourceHealthSummary,
    evidenceCoverage,
    valueContractStrength,
    readinessScore,
    decisionEngine,
    contradictions,
    knowledgeLayer,
    workflow,
    nextActions,
    baselineSnapshots,
    targetSnapshots,
    currentSnapshots,
    outcomeProgress,
    outcomeSummary,
  ])

  return (
    <UseCaseWorkspaceContext.Provider value={value}>
      {children}
    </UseCaseWorkspaceContext.Provider>
  )
}

export function useUseCaseWorkspace() {
  const context = useContext(UseCaseWorkspaceContext)
  if (!context) {
    throw new Error('useUseCaseWorkspace must be used within UseCaseWorkspaceProvider')
  }
  return context
}
