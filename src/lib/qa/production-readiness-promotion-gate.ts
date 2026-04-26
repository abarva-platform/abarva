// production-readiness-promotion-gate.ts
// Advisory-only gate that evaluates which components qualify for production_ready status.
// Never writes to the manifest. No model calls. No DB writes.

export type ComponentStatus =
  | 'planned'
  | 'in_progress'
  | 'partial'
  | 'production_ready'
  | 'deferred'

export interface PromotionCriteria {
  hasGreenTests: boolean
  hasNoBlockers: boolean
  hasHonestDisclaimers: boolean
  hasNoFakeLiveStatus: boolean
  hasSliceDoc: boolean
}

export interface ComponentPromotionEvaluation {
  componentId: string
  currentStatus: ComponentStatus
  criteria: PromotionCriteria
  qualifiesForPromotion: boolean
  blockingReasons: string[]
  recommendedAction: 'promote' | 'fix_blockers' | 'already_promoted' | 'deferred'
  createdFrom: 'qa16_readiness_promotion_gate'
}

export interface PromotionGateReport {
  evaluations: ComponentPromotionEvaluation[]
  eligibleCount: number
  blockedCount: number
  alreadyPromotedCount: number
  deferredCount: number
  overallReadinessPercent: number
  advisoryOnly: true
  note: string
  createdFrom: 'qa16_readiness_promotion_gate'
}

export function evaluateComponentForPromotion(
  componentId: string,
  currentStatus: ComponentStatus,
  criteria: PromotionCriteria
): ComponentPromotionEvaluation {
  const blockingReasons: string[] = []

  if (currentStatus === 'production_ready') {
    return {
      componentId,
      currentStatus,
      criteria,
      qualifiesForPromotion: false,
      blockingReasons: [],
      recommendedAction: 'already_promoted',
      createdFrom: 'qa16_readiness_promotion_gate',
    }
  }

  if (currentStatus === 'deferred') {
    return {
      componentId,
      currentStatus,
      criteria,
      qualifiesForPromotion: false,
      blockingReasons: [],
      recommendedAction: 'deferred',
      createdFrom: 'qa16_readiness_promotion_gate',
    }
  }

  if (!criteria.hasGreenTests) {
    blockingReasons.push('All tests must be green before promotion.')
  }
  if (!criteria.hasNoBlockers) {
    blockingReasons.push('Open blockers must be resolved before promotion.')
  }
  if (!criteria.hasHonestDisclaimers) {
    blockingReasons.push('Component must include honest disclaimers about limitations.')
  }
  if (!criteria.hasNoFakeLiveStatus) {
    blockingReasons.push('Component must not display fake live status or fabricated data.')
  }
  if (!criteria.hasSliceDoc) {
    blockingReasons.push('A slice doc must exist before promotion.')
  }

  const qualifiesForPromotion = blockingReasons.length === 0

  return {
    componentId,
    currentStatus,
    criteria,
    qualifiesForPromotion,
    blockingReasons,
    recommendedAction: qualifiesForPromotion ? 'promote' : 'fix_blockers',
    createdFrom: 'qa16_readiness_promotion_gate',
  }
}

export function buildPromotionGateReport(
  components: Array<{ id: string; status: ComponentStatus; criteria: PromotionCriteria }>
): PromotionGateReport {
  const evaluations = components.map(({ id, status, criteria }) =>
    evaluateComponentForPromotion(id, status, criteria)
  )

  let eligibleCount = 0
  let blockedCount = 0
  let alreadyPromotedCount = 0
  let deferredCount = 0

  for (const ev of evaluations) {
    if (ev.recommendedAction === 'promote') {
      eligibleCount++
    } else if (ev.recommendedAction === 'fix_blockers') {
      blockedCount++
    } else if (ev.recommendedAction === 'already_promoted') {
      alreadyPromotedCount++
    } else if (ev.recommendedAction === 'deferred') {
      deferredCount++
    }
  }

  const total = evaluations.length
  const overallReadinessPercent =
    total === 0
      ? 0
      : Math.round(((eligibleCount + alreadyPromotedCount) / total) * 100)

  return {
    evaluations,
    eligibleCount,
    blockedCount,
    alreadyPromotedCount,
    deferredCount,
    overallReadinessPercent,
    advisoryOnly: true,
    note: 'This gate is advisory only. No manifest writes are performed.',
    createdFrom: 'qa16_readiness_promotion_gate',
  }
}

export function getDefaultComponentAssessments(): Array<{
  id: string
  status: ComponentStatus
  criteria: PromotionCriteria
}> {
  return [
    {
      id: 'programs',
      status: 'in_progress',
      criteria: {
        hasGreenTests: true,
        hasNoBlockers: true,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: true,
      },
    },
    {
      id: 'tower',
      status: 'in_progress',
      criteria: {
        hasGreenTests: true,
        hasNoBlockers: false,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: true,
      },
    },
    {
      id: 'intelligence',
      status: 'partial',
      criteria: {
        hasGreenTests: true,
        hasNoBlockers: true,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: true,
      },
    },
    {
      id: 'admin',
      status: 'production_ready',
      criteria: {
        hasGreenTests: true,
        hasNoBlockers: true,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: true,
      },
    },
    {
      id: 'solutions',
      status: 'in_progress',
      criteria: {
        hasGreenTests: false,
        hasNoBlockers: false,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: false,
      },
    },
    {
      id: 'qa',
      status: 'partial',
      criteria: {
        hasGreenTests: true,
        hasNoBlockers: true,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: true,
      },
    },
    {
      id: 'ops',
      status: 'in_progress',
      criteria: {
        hasGreenTests: true,
        hasNoBlockers: false,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: false,
        hasSliceDoc: true,
      },
    },
    {
      id: 'audit_governance',
      status: 'deferred',
      criteria: {
        hasGreenTests: false,
        hasNoBlockers: false,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: false,
      },
    },
    {
      id: 'data_fabric',
      status: 'planned',
      criteria: {
        hasGreenTests: false,
        hasNoBlockers: false,
        hasHonestDisclaimers: false,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: false,
      },
    },
    {
      id: 'agent_runtime',
      status: 'in_progress',
      criteria: {
        hasGreenTests: true,
        hasNoBlockers: true,
        hasHonestDisclaimers: true,
        hasNoFakeLiveStatus: true,
        hasSliceDoc: false,
      },
    },
  ]
}
