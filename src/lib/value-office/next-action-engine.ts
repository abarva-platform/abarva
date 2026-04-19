import type { KnowledgeLayerContext } from './knowledge-layer'
import type { ValueOfficeContradiction } from './contradiction-engine'
import type { WorkflowStageState } from './workflow-engine'

export interface NextAction {
  description: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

function contradictionPriority(severity: ValueOfficeContradiction['severity']): NextAction['priority'] {
  return severity === 'severe' ? 'high' : 'medium'
}

export function buildNextActions(args: {
  workflow: WorkflowStageState
  contradictions: ValueOfficeContradiction[]
  knowledgeLayer: KnowledgeLayerContext
}): NextAction[] {
  const actions: NextAction[] = []

  for (const contradiction of args.contradictions) {
    actions.push({
      description: contradiction.intervention,
      reason: contradiction.explanation,
      priority: contradictionPriority(contradiction.severity),
    })
  }

  for (const requirement of args.workflow.missing_requirements) {
    actions.push({
      description: requirement.label,
      reason: requirement.reason,
      priority: args.workflow.current_stage === 'REVIEW' || args.workflow.current_stage === 'EVIDENCE' ? 'high' : 'medium',
    })
  }

  for (const playbook of args.knowledgeLayer.interventionPlaybooks.slice(0, 2)) {
    actions.push({
      description: playbook.title,
      reason: playbook.intervention,
      priority: 'low',
    })
  }

  const unique = new Map<string, NextAction>()
  for (const action of actions) {
    const key = `${action.description}::${action.reason}`
    if (!unique.has(key)) unique.set(key, action)
  }

  const priorityOrder: Record<NextAction['priority'], number> = { high: 0, medium: 1, low: 2 }
  return [...unique.values()]
    .sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority])
    .slice(0, 3)
}
