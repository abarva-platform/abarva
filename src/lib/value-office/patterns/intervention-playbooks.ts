import type { KnowledgePlaybook } from '../knowledge-layer'

export const INTERVENTION_PLAYBOOKS: KnowledgePlaybook[] = [
  {
    id: 'baseline-playbook',
    title: 'Baseline lock playbook',
    appliesTo: ['all'],
    useCaseTags: ['all'],
    intervention: 'Freeze one pre-pilot baseline per value category, identify the system of record, and agree the review cadence before launch.',
  },
  {
    id: 'evidence-owner-playbook',
    title: 'Evidence owner playbook',
    appliesTo: ['all'],
    useCaseTags: ['all'],
    intervention: 'Assign a named owner and delivery mode to each evidence source so escalation is possible when proof is late or weak.',
  },
  {
    id: 'developer-value-playbook',
    title: 'Developer productivity playbook',
    appliesTo: ['all'],
    useCaseTags: ['developer', 'engineering', 'sdlc'],
    intervention: 'Track PR cycle time, review rounds, and release cadence together rather than relying on coding-assistant seat or prompt counts alone.',
  },
  {
    id: 'service-desk-value-playbook',
    title: 'Service desk value playbook',
    appliesTo: ['all'],
    useCaseTags: ['service desk', 'ticket', 'it'],
    intervention: 'Use ticket volume, human resolution rate, escalation rate, and labor cost assumptions as the minimum value proof set.',
  },
  {
    id: 'scope-tightening-playbook',
    title: 'Scope tightening playbook',
    appliesTo: ['all'],
    useCaseTags: ['transformation', 'future of work', 'automation'],
    intervention: 'Split broad initiatives into one accountable workflow, one owner group, and one reviewable value path before asking for a pilot decision.',
  },
]
