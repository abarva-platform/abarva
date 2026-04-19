import { summarizeSourceHealth } from './source-health'
import {
  calculateEvidenceCoverage,
  calculateReadinessScore,
  calculateValueContractStrength,
  evaluateDecisionEngine,
} from './decision-engine'
import { detectContradictions } from './contradiction-engine'
import { buildNextActions } from './next-action-engine'
import { buildKnowledgeLayerContext } from './knowledge-layer'
import { buildOutcomeProgress, buildOutcomeSummary, deriveVerticalFromClientId, splitSnapshots } from './workflow-intelligence'
import { buildWorkflowStageState } from './workflow-engine'
import type { RecommendationType, ValueOfficeUseCaseDetail } from './types'

export function buildUseCaseIntelligence(item: ValueOfficeUseCaseDetail) {
  const sourceHealthSummary = summarizeSourceHealth(item.evidence_sources || [])
  const evidenceCoverage = calculateEvidenceCoverage(item.evidence_sources || [])
  const valueContractStrength = calculateValueContractStrength(item.value_contracts || [], item.metric_snapshots || [])
  const readinessScore = calculateReadinessScore((item.readiness || {}) as Record<string, unknown>)
  const recommendationType = (item.latest_recommendation?.recommendation || item.recommendation || null) as RecommendationType | null

  const contradictions = detectContradictions({
    recommendationType,
    evidenceCoverage: evidenceCoverage.score,
    valueContracts: item.value_contracts || [],
    evidenceSources: item.evidence_sources || [],
    metricSnapshots: item.metric_snapshots || [],
  })

  const decisionEngine = evaluateDecisionEngine({
    recommendationType,
    confidenceScore: item.confidence_score || 0,
    readinessScore,
    evidenceCoverage: evidenceCoverage.score,
    valueContractStrength,
    severeContradictions: contradictions.filter(entry => entry.severity === 'severe').length,
    moderateContradictions: contradictions.filter(entry => entry.severity === 'moderate').length,
  })

  const { baselineSnapshots, targetSnapshots, currentSnapshots } = splitSnapshots(item.metric_snapshots || [])
  const outcomeProgress = buildOutcomeProgress(baselineSnapshots, targetSnapshots, currentSnapshots)
  const outcomeSummary = buildOutcomeSummary(outcomeProgress, targetSnapshots.length, currentSnapshots.length)

  const knowledgeLayer = buildKnowledgeLayerContext({
    vertical: deriveVerticalFromClientId(item.client_id),
    title: item.title || '',
    useCaseType: item.use_case_type || '',
    datasetSummary: [
      item.business_problem || '',
      item.workflow_summary || '',
      item.value_hypothesis || '',
    ].filter(Boolean),
  })

  const primaryGap =
    contradictions[0]?.intervention ||
    sourceHealthSummary.interventions[0] ||
    item.latest_recommendation?.missing_data?.[0] ||
    'Refine the evidence and value design before escalating this further.'

  const workflow = buildWorkflowStageState({
    submittedIdea: item.submitted_idea,
    businessProblem: item.business_problem,
    workflowSummary: item.workflow_summary,
    latestRecommendation: item.latest_recommendation,
    valueContracts: item.value_contracts || [],
    evidenceSources: item.evidence_sources || [],
    metricSnapshots: item.metric_snapshots || [],
    contradictionsCount: contradictions.length,
    status: item.status,
  })

  const nextActions = buildNextActions({
    workflow,
    contradictions,
    knowledgeLayer,
  })

  const executionFocus = sourceHealthSummary.blocked.length > 0
    ? sourceHealthSummary.interventions[0]
    : outcomeSummary.missingObserved > 0
      ? `Capture ${outcomeSummary.missingObserved} observed metric ${outcomeSummary.missingObserved === 1 ? 'line' : 'lines'} so realized value can be proven.`
      : outcomeSummary.needsAttention > 0
        ? `${outcomeSummary.needsAttention} outcome ${outcomeSummary.needsAttention === 1 ? 'line needs' : 'lines need'} intervention before scale.`
        : 'Maintain cadence on evidence refresh and realized outcome reviews.'

  return {
    sourceHealthSummary,
    evidenceCoverage,
    valueContractStrength,
    readinessScore,
    contradictions,
    decisionEngine,
    baselineSnapshots,
    targetSnapshots,
    currentSnapshots,
    outcomeProgress,
    outcomeSummary,
    knowledgeLayer,
    workflow,
    nextActions,
    primaryGap,
    executionFocus,
  }
}
