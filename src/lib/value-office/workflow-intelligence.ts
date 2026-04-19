import type { MetricSnapshotDraft } from './types'

export interface OutcomeProgress {
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

export interface OutcomeSummary {
  averageProgress: number
  onTrack: number
  needsAttention: number
  missingObserved: number
  topOutcome: OutcomeProgress | null
}

export function deriveVerticalFromClientId(clientId?: string | null) {
  if (clientId === 'arcturus') return 'Financial Services'
  if (clientId === 'apexretail') return 'Retail'
  return 'Healthcare'
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

export function splitSnapshots(metricSnapshots: MetricSnapshotDraft[]) {
  return {
    baselineSnapshots: metricSnapshots.filter(snapshot => snapshot.snapshot_type === 'baseline'),
    targetSnapshots: metricSnapshots.filter(snapshot => snapshot.snapshot_type === 'target'),
    currentSnapshots: metricSnapshots.filter(snapshot => snapshot.snapshot_type === 'current_observed'),
  }
}

export function buildOutcomeProgress(
  baselineSnapshots: MetricSnapshotDraft[],
  targetSnapshots: MetricSnapshotDraft[],
  currentSnapshots: MetricSnapshotDraft[],
): OutcomeProgress[] {
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

export function buildOutcomeSummary(
  outcomeProgress: OutcomeProgress[],
  targetCount: number,
  currentCount: number,
): OutcomeSummary {
  const averageProgress = outcomeProgress.length
    ? Math.round(outcomeProgress.reduce((sum, item) => sum + item.progress, 0) / outcomeProgress.length)
    : 0
  const onTrack = outcomeProgress.filter(item => item.progress >= 80).length
  const needsAttention = outcomeProgress.filter(item => item.progress < 50).length
  const missingObserved = Math.max(targetCount - currentCount, 0)
  const topOutcome = outcomeProgress.length
    ? [...outcomeProgress].sort((left, right) => right.progress - left.progress)[0]
    : null

  return {
    averageProgress,
    onTrack,
    needsAttention,
    missingObserved,
    topOutcome,
  }
}
