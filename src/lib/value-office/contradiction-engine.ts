import type {
  EvidenceSourceDraft,
  MetricSnapshotDraft,
  RecommendationType,
  ValueContractDraft,
} from './types'

export type ContradictionSeverity = 'severe' | 'moderate'

export interface ValueOfficeContradiction {
  id: string
  title: string
  severity: ContradictionSeverity
  explanation: string
  intervention: string
}

function hasSnapshotForCategory(
  metricSnapshots: MetricSnapshotDraft[],
  category: string,
  snapshotType: MetricSnapshotDraft['snapshot_type'],
) {
  const normalized = category.trim().toLowerCase()
  return metricSnapshots.some(snapshot => (
    snapshot.snapshot_type === snapshotType &&
    snapshot.category.trim().toLowerCase() === normalized
  ))
}

export function detectContradictions(args: {
  recommendationType?: RecommendationType | null
  evidenceCoverage: number
  valueContracts: ValueContractDraft[]
  evidenceSources: EvidenceSourceDraft[]
  metricSnapshots: MetricSnapshotDraft[]
}) {
  const {
    recommendationType,
    evidenceCoverage,
    valueContracts,
    evidenceSources,
    metricSnapshots,
  } = args

  const contradictions: ValueOfficeContradiction[] = []

  if (valueContracts.some(contract => !contract.baseline_value?.trim()) && !metricSnapshots.some(snapshot => snapshot.snapshot_type === 'baseline')) {
    contradictions.push({
      id: 'missing-baseline',
      title: 'No baseline defined',
      severity: 'severe',
      explanation: 'The use case has target ambition but no trustworthy before-state baseline to measure against.',
      intervention: 'Capture at least one baseline metric for each major value category before leadership treats the value case as credible.',
    })
  }

  if (evidenceSources.some(source => !source.owner_name?.trim())) {
    contradictions.push({
      id: 'missing-evidence-owner',
      title: 'No evidence owner',
      severity: 'severe',
      explanation: 'One or more evidence sources have no accountable owner, which weakens the path to value proof.',
      intervention: 'Assign named owners to every critical evidence source.',
    })
  }

  if (evidenceSources.some(source => (source.details?.collection_status || 'expected') === 'blocked')) {
    contradictions.push({
      id: 'blocked-evidence',
      title: 'Blocked evidence source',
      severity: 'severe',
      explanation: 'At least one evidence source is blocked, which means value cannot be verified reliably.',
      intervention: 'Resolve blockers or redesign the evidence plan before moving forward.',
    })
  }

  if (evidenceSources.some(source => (source.details?.collection_status || 'expected') === 'stale')) {
    contradictions.push({
      id: 'stale-evidence',
      title: 'Stale evidence',
      severity: 'moderate',
      explanation: 'Some evidence is outdated, so the recommendation may be grounded in old operating conditions.',
      intervention: 'Refresh stale evidence before final review.',
    })
  }

  if (
    valueContracts.some(contract => !!contract.target_value?.trim()) &&
    !metricSnapshots.some(snapshot => snapshot.snapshot_type === 'current_observed')
  ) {
    contradictions.push({
      id: 'no-observed-metric',
      title: 'Target exists but no observed metric',
      severity: 'moderate',
      explanation: 'The use case defines targets but has no observed metrics to compare against them yet.',
      intervention: 'Capture current observed readings for the main value categories.',
    })
  }

  if (
    recommendationType === 'strong_candidate' &&
    evidenceCoverage < 55
  ) {
    contradictions.push({
      id: 'strong-recommendation-weak-evidence',
      title: 'Strong recommendation with weak evidence',
      severity: 'moderate',
      explanation: 'The recommendation is stronger than the current evidence design supports.',
      intervention: 'Tighten evidence ownership, freshness, and collection plans before positioning this as a strong candidate.',
    })
  }

  const incompleteOutcomeLines = valueContracts.filter(contract => {
    const category = contract.category || contract.target_metric || contract.baseline_metric
    if (!category) return false
    return !hasSnapshotForCategory(metricSnapshots, category, 'baseline') ||
      !hasSnapshotForCategory(metricSnapshots, category, 'target') ||
      !hasSnapshotForCategory(metricSnapshots, category, 'current_observed')
  })

  if (incompleteOutcomeLines.length > 0) {
    contradictions.push({
      id: 'incomplete-outcome-lines',
      title: 'Incomplete outcome lines',
      severity: 'moderate',
      explanation: 'Some value categories do not yet have a complete baseline, target, and observed metric path.',
      intervention: 'Complete the outcome lines for the main value categories before claiming realized value.',
    })
  }

  return contradictions
}
