import type { KnowledgePattern } from '../knowledge-layer'

export const VALUE_PATTERNS: KnowledgePattern[] = [
  {
    id: 'service-desk-ai',
    title: 'Service Desk AI',
    appliesTo: ['all'],
    useCaseTags: ['service desk', 'ticket', 'it', 'support'],
    summary: 'AI triage and automation in service desk workflows usually create the strongest early value when ticket routing, L1 automation, and escalation quality are measured together.',
  },
  {
    id: 'developer-productivity-ai',
    title: 'Developer Productivity AI',
    appliesTo: ['all'],
    useCaseTags: ['developer', 'engineering', 'sdlc', 'coding'],
    summary: 'Developer productivity initiatives are strongest when they measure cycle-time and review-flow changes rather than assistant usage alone.',
  },
  {
    id: 'narrow-workflow-wins',
    title: 'Narrow workflow beats broad transformation',
    appliesTo: ['all'],
    useCaseTags: ['service desk', 'developer', 'productivity', 'automation'],
    summary: 'Use cases with one narrow workflow, a named owner, and a measurable baseline are more likely to move cleanly into pilot.',
  },
  {
    id: 'regulated-evidence-first',
    title: 'Regulated environments reward evidence discipline',
    appliesTo: ['healthcare', 'financial services'],
    useCaseTags: ['risk', 'operations', 'compliance'],
    summary: 'In regulated environments, evidence ownership and baseline credibility matter almost as much as the use case itself.',
  },
  {
    id: 'engineering-metrics-need-tiering',
    title: 'Developer productivity needs repo-tiering',
    appliesTo: ['all'],
    useCaseTags: ['developer', 'engineering', 'sdlc'],
    summary: 'Engineering productivity claims are more credible when baselines are split by repo tier or team rather than blended across all work.',
  },
]
