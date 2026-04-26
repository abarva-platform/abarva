export type ActionState =
  | 'proposed'
  | 'waiting'
  | 'blocked'
  | 'completed'
  | 'deferred';

export type ActionCategory =
  | 'vendor-follow-up'
  | 'pricing-clarification'
  | 'bafo-prep'
  | 'risk-review'
  | 'scorecard-governance'
  | 'executive-decision'
  | 'evidence-request'
  | 'readiness-blocker';

export interface CommercialAction {
  actionId: string;
  category: ActionCategory;
  label: string;
  agentOwner: string; // "Nexus" | "Sentinel" | "Atlas" | "Steward" | "Buyer Team"
  state: ActionState;
  sourceBasis: string; // why this action was generated
  stopCondition: string; // what resolves/closes this action
  priority: 'high' | 'medium' | 'low';
  deterministicSeed: true;
}

export interface SourceCommercialActionQueueViewModel {
  rfpId: string;
  actions: CommercialAction[]; // all actions
  visibleActions: CommercialAction[]; // first 5
  hasMore: boolean;
  totalCount: number;
  proposedCount: number;
  blockedCount: number;
  highPriorityCount: number;
  generatedAt: string;
  caveat: string;
}

const STATIC_ACTIONS: CommercialAction[] = [
  {
    actionId: 'action-001',
    category: 'vendor-follow-up',
    label: 'Request complete rate card from Vendor Delta',
    agentOwner: 'Nexus',
    state: 'proposed',
    priority: 'high',
    sourceBasis: 'Vendor Delta rate card missing from submission',
    stopCondition: 'Complete rate card received and validated',
    deterministicSeed: true,
  },
  {
    actionId: 'action-002',
    category: 'pricing-clarification',
    label: 'Clarify L3 support rate for Vendor Beta',
    agentOwner: 'Sentinel',
    state: 'proposed',
    priority: 'high',
    sourceBasis: 'L3 support rates not included in Vendor Beta submission',
    stopCondition: 'L3 rate card received and normalisation applied',
    deterministicSeed: true,
  },
  {
    actionId: 'action-003',
    category: 'bafo-prep',
    label: 'Prepare BAFO negotiation brief for Vendor Alpha and Beta',
    agentOwner: 'Atlas',
    state: 'waiting',
    priority: 'medium',
    sourceBasis: 'Vendor Alpha and Beta submissions are most complete',
    stopCondition: 'Executive approval of BAFO scope and targets',
    deterministicSeed: true,
  },
  {
    actionId: 'action-004',
    category: 'risk-review',
    label: 'Review SLA rebate gap across all vendors',
    agentOwner: 'Steward',
    state: 'proposed',
    priority: 'medium',
    sourceBasis: 'Two vendors missing SLA rebate structures',
    stopCondition: 'SLA rebate frameworks received or risk formally accepted',
    deterministicSeed: true,
  },
  {
    actionId: 'action-005',
    category: 'scorecard-governance',
    label: 'Update commercial scorecard with normalised pricing',
    agentOwner: 'Steward',
    state: 'blocked',
    priority: 'medium',
    sourceBasis: 'Pricing normalisation blocked pending Vendor Delta submission',
    stopCondition: 'Full rate card set available for normalisation',
    deterministicSeed: true,
  },
  {
    actionId: 'action-006',
    category: 'executive-decision',
    label: 'Prepare executive decision brief pending Vendor Delta',
    agentOwner: 'Nexus',
    state: 'deferred',
    priority: 'low',
    sourceBasis: 'Executive decision cannot proceed without complete pricing set',
    stopCondition: 'Complete pricing set available and normalised',
    deterministicSeed: true,
  },
  {
    actionId: 'action-007',
    category: 'evidence-request',
    label: 'Request knowledge transfer cost estimate from Vendor Beta',
    agentOwner: 'Nexus',
    state: 'proposed',
    priority: 'low',
    sourceBasis: 'Knowledge transfer costs not submitted by Vendor Beta',
    stopCondition: 'Knowledge transfer cost estimate received',
    deterministicSeed: true,
  },
  {
    actionId: 'action-008',
    category: 'readiness-blocker',
    label: 'Resolve offline ratio assumption divergence',
    agentOwner: 'Atlas',
    state: 'proposed',
    priority: 'medium',
    sourceBasis: 'Offshore ratio assumptions differ materially across vendors',
    stopCondition: 'Normalised offshore ratio agreed with procurement lead',
    deterministicSeed: true,
  },
];

const VISIBLE_COUNT = 5;

export function buildCommercialActionQueue(
  rfpId: string,
  vendorList: string[]
): SourceCommercialActionQueueViewModel {
  void vendorList; // vendorList reserved for future dynamic filtering; queue is deterministic
  const actions = STATIC_ACTIONS;
  const visibleActions = actions.slice(0, VISIBLE_COUNT);

  const proposedCount = actions.filter((a) => a.state === 'proposed').length;
  const blockedCount = actions.filter((a) => a.state === 'blocked').length;
  const highPriorityCount = actions.filter((a) => a.priority === 'high').length;

  return {
    rfpId,
    actions,
    visibleActions,
    hasMore: actions.length > VISIBLE_COUNT,
    totalCount: actions.length,
    proposedCount,
    blockedCount,
    highPriorityCount,
    generatedAt: '2026-04-26',
    caveat:
      'Action queue is generated from deterministic seed data. Actions are representative and do not constitute live workflow assignments. No workflow writes have been made.',
  };
}
