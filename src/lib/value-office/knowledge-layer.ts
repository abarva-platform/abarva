import { getAbarNexusSourcesForVertical } from './abarnexus'
import { FAILURE_PATTERNS } from './patterns/failure-patterns'
import { INTERVENTION_PLAYBOOKS } from './patterns/intervention-playbooks'
import { VALUE_PATTERNS } from './patterns/value-patterns'

export interface KnowledgePattern {
  id: string
  title: string
  appliesTo: Array<'all' | 'healthcare' | 'financial services' | 'retail'>
  useCaseTags: string[]
  summary: string
}

export interface KnowledgePlaybook {
  id: string
  title: string
  appliesTo: Array<'all' | 'healthcare' | 'financial services' | 'retail'>
  useCaseTags: string[]
  intervention: string
}

export interface KnowledgeLayerContext {
  clientTruth: string[]
  publicBenchmarks: string[]
  patternMemory: KnowledgePattern[]
  failurePatterns: KnowledgePattern[]
  interventionPlaybooks: KnowledgePlaybook[]
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase()
}

function appliesToVertical(vertical: string, allowed: Array<'all' | 'healthcare' | 'financial services' | 'retail'>) {
  const normalized = normalizeTag(vertical) as 'healthcare' | 'financial services' | 'retail'
  return allowed.includes('all') || allowed.includes(normalized)
}

function matchesUseCaseTags(title: string, useCaseType: string, tags: string[]) {
  if (!tags.length || tags.includes('all')) return true
  const haystack = `${title} ${useCaseType}`.toLowerCase()
  return tags.some(tag => haystack.includes(tag))
}

export function buildKnowledgeLayerContext(args: {
  vertical: string
  title: string
  useCaseType: string
  datasetSummary?: string[]
}) : KnowledgeLayerContext {
  const { vertical, title, useCaseType, datasetSummary = [] } = args

  const relevantSources = getAbarNexusSourcesForVertical(vertical)
  const clientTruth = [
    ...datasetSummary.slice(0, 3),
    ...relevantSources.filter(source => source.tier === 'client_required').slice(0, 3).map(source => source.name),
  ]

  const publicBenchmarks = relevantSources
    .filter(source => source.tier === 'free_now')
    .slice(0, 4)
    .map(source => source.name)

  const valuePatterns = VALUE_PATTERNS.filter(pattern => (
    appliesToVertical(vertical, pattern.appliesTo) &&
    matchesUseCaseTags(title, useCaseType, pattern.useCaseTags)
  ))

  const failurePatterns = FAILURE_PATTERNS.filter(pattern => (
    appliesToVertical(vertical, pattern.appliesTo) &&
    matchesUseCaseTags(title, useCaseType, pattern.useCaseTags)
  ))

  const interventionPlaybooks = INTERVENTION_PLAYBOOKS.filter(playbook => (
    appliesToVertical(vertical, playbook.appliesTo) &&
    matchesUseCaseTags(title, useCaseType, playbook.useCaseTags)
  ))

  return {
    clientTruth,
    publicBenchmarks,
    patternMemory: valuePatterns,
    failurePatterns,
    interventionPlaybooks,
  }
}
