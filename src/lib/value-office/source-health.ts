import type { EvidenceSourceDraft } from '@/lib/value-office/types'

export type SourceHealthLabel = 'healthy' | 'attention' | 'blocked' | 'stale' | 'owner_missing'

export interface SourceHealthState {
  label: SourceHealthLabel
  reason: string
}

export interface SourceHealthItem {
  source: EvidenceSourceDraft
  health: SourceHealthState
}

function daysSince(dateValue?: string) {
  if (!dateValue) return null
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return null
  const diff = Date.now() - parsed.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getSourceHealth(source: EvidenceSourceDraft): SourceHealthState {
  const collectionStatus = source.details?.collection_status || 'expected'
  const age = daysSince(source.details?.last_refreshed_at)

  if (collectionStatus === 'blocked' || source.details?.blocker?.trim()) {
    return {
      label: 'blocked',
      reason: source.details?.blocker?.trim() || 'Evidence collection is blocked.',
    }
  }

  if (collectionStatus === 'stale' || (age !== null && age > 35)) {
    return {
      label: 'stale',
      reason: 'Evidence is stale or has not been refreshed recently.',
    }
  }

  if (!source.owner_name?.trim()) {
    return {
      label: 'owner_missing',
      reason: 'No named owner is assigned to this source.',
    }
  }

  if (source.status !== 'connected' || collectionStatus !== 'received') {
    return {
      label: 'attention',
      reason: 'Source still needs setup, connection, or collection follow-through.',
    }
  }

  return {
    label: 'healthy',
    reason: 'Source is connected, owned, and currently usable.',
  }
}

export function buildSourceHealthItems(sources: EvidenceSourceDraft[]): SourceHealthItem[] {
  return sources.map(source => ({
    source,
    health: getSourceHealth(source),
  }))
}

export function summarizeSourceHealth(sources: EvidenceSourceDraft[]) {
  const items = buildSourceHealthItems(sources)
  const blocked = items.filter(item => item.health.label === 'blocked')
  const stale = items.filter(item => item.health.label === 'stale')
  const ownerMissing = items.filter(item => item.health.label === 'owner_missing')
  const attention = items.filter(item => item.health.label === 'attention')
  const healthy = items.filter(item => item.health.label === 'healthy')
  const atRisk = items.filter(item => item.health.label !== 'healthy')

  const interventions = [
    blocked.length > 0
      ? `Unblock ${blocked.length} evidence ${blocked.length === 1 ? 'source' : 'sources'} before leadership treats the value case as credible.`
      : null,
    stale.length > 0
      ? `Refresh ${stale.length} stale ${stale.length === 1 ? 'source' : 'sources'} so the recommendation is grounded in current evidence.`
      : null,
    ownerMissing.length > 0
      ? `Assign named owners to ${ownerMissing.length} ${ownerMissing.length === 1 ? 'source' : 'sources'} to create accountability for value proof.`
      : null,
    attention.length > 0
      ? `Finish setup or connection follow-through for ${attention.length} ${attention.length === 1 ? 'source' : 'sources'} still in partial readiness.`
      : null,
  ].filter(Boolean) as string[]

  return {
    items,
    healthy,
    blocked,
    stale,
    ownerMissing,
    attention,
    atRisk,
    interventions,
  }
}
