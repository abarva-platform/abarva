import type { KnowledgePattern } from '../knowledge-layer'

export const FAILURE_PATTERNS: KnowledgePattern[] = [
  {
    id: 'no-baseline-failure',
    title: 'No baseline, no proof',
    appliesTo: ['all'],
    useCaseTags: ['all'],
    summary: 'Teams often move too quickly to target-state claims before locking a baseline, which makes later value reviews fragile.',
  },
  {
    id: 'ownerless-evidence-failure',
    title: 'Ownerless evidence stalls execution',
    appliesTo: ['all'],
    useCaseTags: ['all'],
    summary: 'Evidence plans without named owners drift into partial setup and weaken executive trust.',
  },
  {
    id: 'high-usage-low-value-failure',
    title: 'High usage does not equal high value',
    appliesTo: ['all'],
    useCaseTags: ['copilot', 'developer', 'service desk'],
    summary: 'Adoption metrics can look strong while the business outcome remains unproven, especially when workflow and finance links are weak.',
  },
  {
    id: 'broad-scope-failure',
    title: 'Broad scope hides real accountability',
    appliesTo: ['all'],
    useCaseTags: ['transformation', 'future of work', 'productivity'],
    summary: 'Broadly framed initiatives frequently fail review because leadership cannot see a single accountable workflow, owner, or outcome line.',
  },
]
