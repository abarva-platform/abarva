import type {
  EvidenceSourceDraft,
  MetricSnapshotDraft,
  RecommendationType,
  ValueContractDraft,
} from './types'

export type DecisionEngineState =
  | 'ready_for_pilot'
  | 'tighten_before_pilot'
  | 'hold_and_design'

export interface DecisionEngineInputs {
  recommendationType?: RecommendationType | null
  confidenceScore: number
  readinessScore: number
  evidenceCoverage: number
  valueContractStrength: number
  severeContradictions: number
  moderateContradictions: number
}

export interface DecisionEngineResult {
  state: DecisionEngineState
  score: number
  rationale: string[]
}

export interface EvidenceCoverageResult {
  score: number
  ownerCoverage: number
  connectedCoverage: number
  receivedCoverage: number
  freshnessCoverage: number
}

export function calculateReadinessScore(readiness: Record<string, unknown> | undefined) {
  if (!readiness) return 0

  const overall = typeof readiness.overall === 'number' ? readiness.overall : null
  if (overall !== null) return overall

  const dimensions = [
    readiness.data,
    readiness.workflow,
    readiness.sponsorship,
    readiness.governance,
    readiness.integration,
  ].filter((value): value is number => typeof value === 'number')

  if (!dimensions.length) return 0
  return Math.round(dimensions.reduce((sum, value) => sum + value, 0) / dimensions.length)
}

export function calculateEvidenceCoverage(evidenceSources: EvidenceSourceDraft[]): EvidenceCoverageResult {
  if (!evidenceSources.length) {
    return {
      score: 0,
      ownerCoverage: 0,
      connectedCoverage: 0,
      receivedCoverage: 0,
      freshnessCoverage: 0,
    }
  }

  const total = evidenceSources.length
  const ownerCoverage = Math.round((evidenceSources.filter(source => source.owner_name?.trim()).length / total) * 100)
  const connectedCoverage = Math.round((evidenceSources.filter(source => ['available', 'connected'].includes(source.status)).length / total) * 100)
  const receivedCoverage = Math.round((evidenceSources.filter(source => source.details?.collection_status === 'received').length / total) * 100)
  const freshnessCoverage = Math.round((evidenceSources.filter(source => !['stale', 'blocked'].includes(source.details?.collection_status || 'expected')).length / total) * 100)

  const score = Math.round(
    ownerCoverage * 0.3 +
    connectedCoverage * 0.3 +
    receivedCoverage * 0.25 +
    freshnessCoverage * 0.15,
  )

  return {
    score,
    ownerCoverage,
    connectedCoverage,
    receivedCoverage,
    freshnessCoverage,
  }
}

function confidenceGradeScore(value?: string) {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'gold') return 100
  if (normalized === 'silver') return 78
  if (normalized === 'bronze') return 55
  return 40
}

function metricSnapshotCountByType(metricSnapshots: MetricSnapshotDraft[], snapshotType: MetricSnapshotDraft['snapshot_type']) {
  return metricSnapshots.filter(snapshot => snapshot.snapshot_type === snapshotType).length
}

export function calculateValueContractStrength(
  valueContracts: ValueContractDraft[],
  metricSnapshots: MetricSnapshotDraft[],
) {
  if (!valueContracts.length) return 0

  const baselineCount = metricSnapshotCountByType(metricSnapshots, 'baseline')
  const targetCount = metricSnapshotCountByType(metricSnapshots, 'target')

  const scores = valueContracts.map(contract => {
    const completenessChecks = [
      !!contract.category?.trim(),
      !!contract.where_value_lost?.trim(),
      !!contract.target_state?.trim(),
      !!contract.baseline_metric?.trim(),
      !!contract.target_metric?.trim(),
      !!contract.evidence_source?.trim(),
      !!contract.evidence_owner?.trim(),
      !!contract.review_cadence?.trim(),
      !!contract.baseline_value?.trim(),
      !!contract.target_value?.trim(),
    ]

    const completenessScore = Math.round(
      (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100,
    )

    const confidenceScore = confidenceGradeScore(contract.confidence_grade)
    return Math.round(completenessScore * 0.75 + confidenceScore * 0.25)
  })

  const contractAverage = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
  const snapshotCoverage = Math.min(
    100,
    Math.round((((baselineCount + targetCount) / Math.max(valueContracts.length * 2, 1)) * 100)),
  )

  return Math.round(contractAverage * 0.8 + snapshotCoverage * 0.2)
}

export function evaluateDecisionEngine(inputs: DecisionEngineInputs): DecisionEngineResult {
  const {
    confidenceScore,
    readinessScore,
    evidenceCoverage,
    valueContractStrength,
    severeContradictions,
    moderateContradictions,
  } = inputs

  const score = Math.round(
    confidenceScore * 0.35 +
    readinessScore * 0.25 +
    evidenceCoverage * 0.2 +
    valueContractStrength * 0.2,
  )

  const rationale = [
    `Confidence is ${confidenceScore}/100.`,
    `Readiness is ${readinessScore}/100.`,
    `Evidence coverage is ${evidenceCoverage}/100.`,
    `Value contract strength is ${valueContractStrength}/100.`,
  ]

  if (severeContradictions > 0) {
    rationale.push(`${severeContradictions} severe contradiction${severeContradictions === 1 ? '' : 's'} must be resolved first.`)
  }
  if (moderateContradictions > 0) {
    rationale.push(`${moderateContradictions} moderate gap${moderateContradictions === 1 ? '' : 's'} still need cleanup.`)
  }

  if (score < 60) {
    return {
      state: 'hold_and_design',
      score,
      rationale: [
        ...rationale,
        'The current score is below the minimum threshold for pilot. The use case still needs design, evidence, or readiness work before leadership should move it forward.',
      ],
    }
  }

  if (score < 80) {
    return {
      state: 'tighten_before_pilot',
      score,
      rationale: [
        ...rationale,
        'The score is promising, but it is not yet strong enough for pilot. Tighten the evidence, baselines, and operating design before moving forward.',
      ],
    }
  }

  return {
    state: 'ready_for_pilot',
    score,
    rationale: [
      ...rationale,
      'The use case has enough structure, confidence, and evidence design to move into a controlled pilot.',
    ],
  }
}
