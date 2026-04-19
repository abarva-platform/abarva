import type { EvidenceSourceDraft, MetricSnapshotDraft, RecommendationDraft, ValueContractDraft, ValueOfficeStatus } from './types'

export type WorkflowStage =
  | 'IDEA'
  | 'QUALIFY'
  | 'DESIGN'
  | 'EVIDENCE'
  | 'REVIEW'
  | 'EXECUTE'
  | 'REALIZE'

export interface StageRequirement {
  id: string
  label: string
  satisfied: boolean
  reason: string
}

export interface WorkflowStageState {
  current_stage: WorkflowStage
  stage_progress: number
  stage_requirements: StageRequirement[]
  missing_requirements: StageRequirement[]
}

const STAGE_ORDER: WorkflowStage[] = ['IDEA', 'QUALIFY', 'DESIGN', 'EVIDENCE', 'REVIEW', 'EXECUTE', 'REALIZE']

function hasAdvisorQualification(args: {
  businessProblem?: string | null
  workflowSummary?: string | null
  recommendation?: RecommendationDraft | null
}) {
  return Boolean(
    args.businessProblem?.trim() &&
    args.workflowSummary?.trim() &&
    args.recommendation?.summary?.trim(),
  )
}

function hasValueDesign(valueContracts: ValueContractDraft[]) {
  return valueContracts.some(contract => (
    contract.category?.trim() &&
    contract.baseline_metric?.trim() &&
    contract.target_metric?.trim()
  ))
}

function hasEvidenceSetup(evidenceSources: EvidenceSourceDraft[]) {
  return evidenceSources.length > 0 && evidenceSources.every(source => (
    source.source_name?.trim() &&
    source.owner_name?.trim()
  ))
}

function hasReviewReadiness(args: {
  recommendation?: RecommendationDraft | null
  contradictions: number
  evidenceSources: EvidenceSourceDraft[]
}) {
  const hasReceivedOrConnectedEvidence = args.evidenceSources.some(source => (
    source.status === 'connected' ||
    source.details?.collection_status === 'received'
  ))

  return Boolean(
    args.recommendation?.summary?.trim() &&
    args.contradictions === 0 &&
    hasReceivedOrConnectedEvidence
  )
}

function hasExecution(status: ValueOfficeStatus) {
  return ['approved', 'pilot', 'scaled'].includes(status)
}

function hasValueRealization(metricSnapshots: MetricSnapshotDraft[]) {
  const currentObserved = metricSnapshots.filter(snapshot => snapshot.snapshot_type === 'current_observed')
  const baselines = metricSnapshots.filter(snapshot => snapshot.snapshot_type === 'baseline')
  const targets = metricSnapshots.filter(snapshot => snapshot.snapshot_type === 'target')
  return currentObserved.length > 0 && baselines.length > 0 && targets.length > 0
}

export function buildWorkflowStageState(args: {
  submittedIdea?: string | null
  businessProblem?: string | null
  workflowSummary?: string | null
  latestRecommendation?: RecommendationDraft | null
  valueContracts: ValueContractDraft[]
  evidenceSources: EvidenceSourceDraft[]
  metricSnapshots: MetricSnapshotDraft[]
  contradictionsCount: number
  status: ValueOfficeStatus
}) : WorkflowStageState {
  const stageRequirements: Record<WorkflowStage, StageRequirement[]> = {
    IDEA: [
      {
        id: 'idea-captured',
        label: 'Idea captured',
        satisfied: Boolean(args.submittedIdea?.trim()),
        reason: 'Capture the initial business idea so qualification can start.',
      },
    ],
    QUALIFY: [
      {
        id: 'advisor-ran',
        label: 'Advisor ran',
        satisfied: Boolean(args.latestRecommendation?.summary?.trim()),
        reason: 'Run the advisor to shape the first recommendation.',
      },
      {
        id: 'problem-defined',
        label: 'Business problem defined',
        satisfied: Boolean(args.businessProblem?.trim()),
        reason: 'Define the business problem in plain language.',
      },
      {
        id: 'workflow-defined',
        label: 'Workflow defined',
        satisfied: Boolean(args.workflowSummary?.trim()),
        reason: 'Define the workflow scope before moving into value design.',
      },
    ],
    DESIGN: [
      {
        id: 'value-lines',
        label: 'Value contract lines defined',
        satisfied: hasValueDesign(args.valueContracts),
        reason: 'At least one credible value line needs a baseline and target metric.',
      },
      {
        id: 'recommendation-rationale',
        label: 'Recommendation rationale captured',
        satisfied: Boolean(args.latestRecommendation?.rationale?.trim()),
        reason: 'The recommendation should explain why the use case is worth pursuing.',
      },
    ],
    EVIDENCE: [
      {
        id: 'evidence-sources',
        label: 'Evidence sources defined',
        satisfied: args.evidenceSources.length > 0,
        reason: 'Identify the systems and datasets needed to prove value.',
      },
      {
        id: 'evidence-owners',
        label: 'Evidence owners assigned',
        satisfied: hasEvidenceSetup(args.evidenceSources),
        reason: 'Every evidence source needs an accountable owner.',
      },
    ],
    REVIEW: [
      {
        id: 'review-ready',
        label: 'Ready for review',
        satisfied: hasReviewReadiness({
          recommendation: args.latestRecommendation,
          contradictions: args.contradictionsCount,
          evidenceSources: args.evidenceSources,
        }),
        reason: 'Executive review should only happen when evidence and contradictions are in a manageable state.',
      },
      {
        id: 'contradictions-cleared',
        label: 'Critical contradictions cleared',
        satisfied: args.contradictionsCount === 0,
        reason: 'Resolve major contradictions before asking leadership for a decision.',
      },
    ],
    EXECUTE: [
      {
        id: 'decision-recorded',
        label: 'Pilot or approval recorded',
        satisfied: hasExecution(args.status),
        reason: 'Execution starts after leadership records approval or pilot.',
      },
    ],
    REALIZE: [
      {
        id: 'observed-value',
        label: 'Observed metrics captured',
        satisfied: hasValueRealization(args.metricSnapshots),
        reason: 'Value realization depends on observed metrics against baseline and target.',
      },
    ],
  }

  const completedStages = {
    IDEA: stageRequirements.IDEA.every(req => req.satisfied),
    QUALIFY: hasAdvisorQualification({
      businessProblem: args.businessProblem,
      workflowSummary: args.workflowSummary,
      recommendation: args.latestRecommendation,
    }),
    DESIGN: stageRequirements.DESIGN.every(req => req.satisfied),
    EVIDENCE: stageRequirements.EVIDENCE.every(req => req.satisfied),
    REVIEW: stageRequirements.REVIEW.every(req => req.satisfied),
    EXECUTE: stageRequirements.EXECUTE.every(req => req.satisfied),
    REALIZE: stageRequirements.REALIZE.every(req => req.satisfied),
  }

  let currentStage: WorkflowStage = 'IDEA'
  for (const stage of STAGE_ORDER) {
    if (!completedStages[stage]) {
      currentStage = stage
      break
    }
    currentStage = stage
  }

  const requirements = stageRequirements[currentStage]
  const satisfiedCount = requirements.filter(req => req.satisfied).length
  const stageProgress = requirements.length
    ? Math.round((satisfiedCount / requirements.length) * 100)
    : 100

  return {
    current_stage: currentStage,
    stage_progress: stageProgress,
    stage_requirements: requirements,
    missing_requirements: requirements.filter(req => !req.satisfied),
  }
}
