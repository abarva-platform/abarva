import { ALL_CLIENTS } from '@/lib/use-client-context'
import { getClientIntelligence } from '@/lib/client-intelligence'
import { getClientDataset } from '@/lib/knowledge/client-datasets'
import { listRecentAbarNexusRecords } from './server'
import type { AbarNexusNormalizedRecord } from './ingestion'

export interface AdvisorClientContext {
  id: string
  name: string
  vertical: string
  tagline: string
  top_pressures: string[]
  contradictions: string[]
  current_priorities: string[]
  dataset_summary: string[]
  abarnexus_summary: string[]
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(token => token.length >= 4)
}

function scoreAbarNexusRecord(record: AbarNexusNormalizedRecord, terms: string[]) {
  if (!terms.length) return 0
  const haystack = `${record.title} ${record.summary} ${JSON.stringify(record.payload)}`.toLowerCase()
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0)
}

function selectAbarNexusRecords(records: AbarNexusNormalizedRecord[], query?: string, limit = 5) {
  const terms = tokenize(query || '')
  if (!terms.length) return records.slice(0, limit)

  return records
    .map(record => ({ record, score: scoreAbarNexusRecord(record, terms) }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(item => item.record)
}

export async function getAdvisorClientContext(clientId: string, query?: string): Promise<AdvisorClientContext> {
  const clientMeta = ALL_CLIENTS.find(c => c.id === clientId) ?? ALL_CLIENTS[0]
  const intel = getClientIntelligence(clientId)
  const dataset = getClientDataset(clientId, 'all')
  const abarnexus = await listRecentAbarNexusRecords().catch(() => ({ schemaReady: false, items: [] }))
  const selectedRecords = selectAbarNexusRecords(abarnexus.items, query)

  return {
    id: clientMeta.id,
    name: clientMeta.name,
    vertical: clientMeta.vertical,
    tagline: intel.tagline,
    top_pressures: intel.company.pressures.slice(0, 4).map(p => `${p.label}: ${p.detail}`),
    contradictions: intel.contradictions.slice(0, 3).map(c => `${c.topic}: ${c.gap}`),
    current_priorities: intel.priorities.slice(0, 4).map(p => `${p.title}: ${p.signal}`),
    dataset_summary: dataset
      ? [
          ...dataset.key_risks.slice(0, 4),
          ...(dataset.genome_patterns.slice(0, 3).map(pattern => `${pattern.code}: ${pattern.description}`)),
        ]
      : [],
    abarnexus_summary: selectedRecords.map(record => `${record.objectType}: ${record.title} — ${record.summary}`),
  }
}
