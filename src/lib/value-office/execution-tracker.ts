export type ExecutionStatus = 'done' | 'in_progress' | 'not_started'

export interface ExecutionTrack {
  id: string
  title: string
  status: ExecutionStatus
  progress: number
  notes: string
  nextAction: string
  valueDriver: 'recommendation_credibility' | 'evidence_operability' | 'measurable_value_proof'
}

export const EXECUTION_TRACKS: ExecutionTrack[] = [
  {
    id: 'foundation',
    title: 'AI Value Office foundation',
    status: 'done',
    progress: 100,
    notes: 'Core routes, persistence helpers, nav entry, and base AI Value Office UI are in place.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
  {
    id: 'advisor',
    title: 'Multi-turn advisor',
    status: 'done',
    progress: 100,
    notes: 'Follow-up refinement flow, conversation memory, and structured recommendations are live.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
  {
    id: 'value-contracts',
    title: 'Value contracts',
    status: 'done',
    progress: 100,
    notes: 'Editable value contract workflow shipped with structured fields for proof design.',
    nextAction: 'None',
    valueDriver: 'measurable_value_proof',
  },
  {
    id: 'evidence-plan',
    title: 'Evidence plan',
    status: 'done',
    progress: 100,
    notes: 'Evidence source planning shipped with integration mode, owner, and collection fields.',
    nextAction: 'None',
    valueDriver: 'evidence_operability',
  },
  {
    id: 'executive-review',
    title: 'Executive review',
    status: 'done',
    progress: 100,
    notes: 'A calm review layer exists to surface recommendation, readiness, risk, and next actions.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
  {
    id: 'control-tower',
    title: 'Evidence Control Tower v1',
    status: 'done',
    progress: 100,
    notes: 'Control score, blockers, integration mix, and evidence operations view are shipped.',
    nextAction: 'None',
    valueDriver: 'evidence_operability',
  },
  {
    id: 'abarnexus-free-first',
    title: 'AbarNexus free-first layer',
    status: 'done',
    progress: 100,
    notes: 'Source registry, roadmap, and free-now versus premium-later framing are in product.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
  {
    id: 'provenance',
    title: 'Recommendation provenance',
    status: 'done',
    progress: 100,
    notes: 'Client truth, public benchmarks, pattern memory, and assumptions are surfaced in responses.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
  {
    id: 'evidence-ops',
    title: 'Evidence operating workflow',
    status: 'done',
    progress: 100,
    notes: 'Expected, requested, received, stale, and blocked evidence states are now modeled.',
    nextAction: 'None',
    valueDriver: 'evidence_operability',
  },
  {
    id: 'decision-gating',
    title: 'Decision gating workflow',
    status: 'done',
    progress: 100,
    notes: 'Decision actions and decision history are tracked at the use-case level.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
  {
    id: 'snapshots',
    title: 'Baseline and outcome snapshots',
    status: 'done',
    progress: 100,
    notes: 'Snapshot schema, editor UI, progress math, and outcome summary cards are all shipped.',
    nextAction: 'None',
    valueDriver: 'measurable_value_proof',
  },
  {
    id: 'ingestion-skeleton',
    title: 'AbarNexus ingestion skeleton',
    status: 'done',
    progress: 100,
    notes: 'Blueprint, run-state scaffolding, runnable previews, persisted run history, inspectable stored normalized records, and query-aware advisor-context wiring now exist for source feeds.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
  {
    id: 'source-health',
    title: 'Control Tower source health',
    status: 'done',
    progress: 100,
    notes: 'Source health now includes scorecards, per-source health labels, escalation counts, leadership-facing evidence-risk summaries, and in-workspace intervention actions for owner assignment, refresh requests, blocker clearing, and receipt updates.',
    nextAction: 'None',
    valueDriver: 'evidence_operability',
  },
  {
    id: 'cxo-review-mode',
    title: 'CXO review mode',
    status: 'done',
    progress: 100,
    notes: 'A calmer board-ready review view now exists with leadership framing, evidence-risk escalation, and intervention guidance.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
  {
    id: 'telemetry-connectors',
    title: 'Telemetry connectors',
    status: 'done',
    progress: 100,
    notes: 'Feed and export-first connector templates now define the path from manual evidence capture to repeatable ingestion, and priority-system playbooks for ServiceNow, Copilot, and ERP or finance extracts now include onboarding checklists, sample export contracts, request-template workflows, visible delivery-package details, package-preparation affordances, and copy-ready artifacts inside the product.',
    nextAction: 'None',
    valueDriver: 'evidence_operability',
  },
  {
    id: 'standalone-shell',
    title: 'Standalone product shell',
    status: 'done',
    progress: 100,
    notes: 'AI Value Office now has its own dedicated shell and route layout, and the repo supports a standalone product-surface mode that can redirect the root route into `/value-office` for a dedicated Vercel deployment.',
    nextAction: 'None',
    valueDriver: 'recommendation_credibility',
  },
]

export function getExecutionSummary() {
  const total = EXECUTION_TRACKS.length
  const completed = EXECUTION_TRACKS.filter(track => track.status === 'done').length
  const inProgress = EXECUTION_TRACKS.filter(track => track.status === 'in_progress').length
  const averageProgress = Math.round(
    EXECUTION_TRACKS.reduce((sum, track) => sum + track.progress, 0) / total,
  )

  return {
    total,
    completed,
    inProgress,
    notStarted: total - completed - inProgress,
    averageProgress,
    activeItem: EXECUTION_TRACKS.find(track => track.status === 'in_progress') ?? null,
  }
}
