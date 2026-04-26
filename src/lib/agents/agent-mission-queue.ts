// AG10 - Agent Mission Queue Read Model.
//
// Deterministic, file-pure read model for the AbarVa agent mission queue.
// This module gives Nexus, Sentinel, Atlas, and Steward a typed surface
// for reasoning about active missions across Programs, Tower,
// Intelligence, Admin, and Source surfaces. It is explicitly not a
// runtime queue: there is no scheduler, no persistence, no model call,
// no live trigger, and no UI mounting in this slice.
//
// Companion to:
//   docs/platform-architecture/runtime/13_AGENT_MISSION_MODEL.md
//   docs/platform-architecture/runtime/14_AGENT_WORK_QUEUE_AND_TRIGGERS.md
//   docs/platform-design/experience-system/16_AGENT_ACTIVITY_UI_PATTERN.md
//
// Every mission in the seed set carries an id of the form
// `mission-seed-{agent}-{n}` so it cannot be confused with a future
// runtime-generated mission. UI mounting (AG11) and trigger wiring are
// deferred.

// ---------------------------------------------------------------------
// Canonical agent / type / state tuples (order is contract).
// ---------------------------------------------------------------------

export const AGENT_MISSION_AGENTS = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
] as const;

export type AgentMissionAgent = typeof AGENT_MISSION_AGENTS[number];

export const AGENT_MISSION_TYPES = [
  'next_action',
  'evidence_gap',
  'gate_check',
  'artifact_review',
  'data_readiness',
  'value_risk',
  'executive_brief',
  'vendor_response_gap',
  'scorecard_governance',
  'approval_follow_up',
  'workflow_blocker',
  'pattern_signal',
  'validation_defer',
  'low_context_warning',
] as const;

export type AgentMissionType = typeof AGENT_MISSION_TYPES[number];

export const AGENT_MISSION_STATES = [
  'proposed',
  'active',
  'waiting',
  'blocked',
  'completed',
  'dismissed',
  'escalated',
  'deferred',
] as const;

export type AgentMissionState = typeof AGENT_MISSION_STATES[number];

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type AgentMissionPriority = 'low' | 'medium' | 'high' | 'critical';

export type AgentMissionSource = 'deterministic_seed';

export type AgentMissionUiVisibility =
  | 'compact_strip'
  | 'right_panel'
  | 'inline_recommendation'
  | 'executive_brief'
  | 'hidden_drawer';

export type AgentMissionWorkObjectKind =
  | 'program'
  | 'phase'
  | 'workshop'
  | 'artifact'
  | 'pattern'
  | 'tower_dimension'
  | 'dataset_domain'
  | 'sourcing_event'
  | 'vendor_response';

export type AgentMissionSurface =
  | 'programs'
  | 'tower'
  | 'intelligence'
  | 'admin'
  | 'source';

export interface AgentMissionWorkObject {
  kind: AgentMissionWorkObjectKind;
  id: string;
  label: string;
  surface: AgentMissionSurface;
}

export type AgentMissionHandoffTrigger =
  | 'evidence_weak'
  | 'gate_blocked'
  | 'executive_decision_needed'
  | 'workflow_allowed'
  | 'follow_up_needed'
  | 'missing_inputs';

export interface AgentMissionHandoff {
  toAgent: AgentMissionAgent;
  reason: string;
  trigger: AgentMissionHandoffTrigger;
}

export interface AgentMission {
  id: string;
  agent: AgentMissionAgent;
  type: AgentMissionType;
  state: AgentMissionState;
  priority: AgentMissionPriority;
  workObject: AgentMissionWorkObject;
  rationale: string;
  recommendedAction: string;
  uiVisibility: AgentMissionUiVisibility;
  stopCondition: string;
  handoff: AgentMissionHandoff | null;
  createdFrom: AgentMissionSource;
}

export interface AgentMissionQueueSummary {
  totalMissions: number;
  byAgent: Record<AgentMissionAgent, number>;
  byState: Record<AgentMissionState, number>;
  bySurface: Record<AgentMissionSurface, number>;
  highestPriorityCount: number;
  handoffCount: number;
}

// ---------------------------------------------------------------------
// Priority ordering used by getTopAgentMissions.
// ---------------------------------------------------------------------

const PRIORITY_RANK: Record<AgentMissionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// ---------------------------------------------------------------------
// Deterministic seed mission queue.
//
// Every mission is hand-authored and frozen. Each id matches
// /^mission-seed-[a-z0-9-]+$/. No real https:// URLs and no real
// E-### evidence citations appear in any field.
// ---------------------------------------------------------------------

const SEED_MISSIONS: readonly AgentMission[] = Object.freeze([
  // -----------------------------------------------------------------
  // Programs surface (3+).
  // -----------------------------------------------------------------
  {
    id: 'mission-seed-nexus-1',
    agent: 'nexus',
    type: 'next_action',
    state: 'active',
    priority: 'high',
    workObject: {
      kind: 'phase',
      id: 'phase-seed-apex-charter',
      label: 'Apex Retail · Charter Phase',
      surface: 'programs',
    },
    rationale:
      'Charter inputs are populated but the kickoff workshop has not been scheduled, so the phase cannot reach the gate readiness review.',
    recommendedAction: 'Schedule charter workshop with the executive sponsor and program owner.',
    uiVisibility: 'compact_strip',
    stopCondition: 'Charter workshop is scheduled or the phase is intentionally deferred.',
    handoff: null,
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'mission-seed-steward-1',
    agent: 'steward',
    type: 'gate_check',
    state: 'blocked',
    priority: 'critical',
    workObject: {
      kind: 'phase',
      id: 'phase-seed-apex-design',
      label: 'Apex Retail · Design Phase',
      surface: 'programs',
    },
    rationale:
      'Design phase cannot exit to Build until the G2 gate verdict is recorded against the active readiness checklist.',
    recommendedAction: 'Review G2 readiness for apex-retail-design and record the gate verdict.',
    uiVisibility: 'right_panel',
    stopCondition: 'Steward records gate verdict and blocker either clears or is waived with rationale.',
    handoff: {
      toAgent: 'nexus',
      reason: 'Once the gate is allowed, Nexus revises the next action for the program owner.',
      trigger: 'workflow_allowed',
    },
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'mission-seed-sentinel-1',
    agent: 'sentinel',
    type: 'evidence_gap',
    state: 'active',
    priority: 'high',
    workObject: {
      kind: 'artifact',
      id: 'artifact-seed-apex-charter-rfp',
      label: 'Apex Retail · Charter Document',
      surface: 'programs',
    },
    rationale:
      'Charter cites a baseline metric that has no matching parsed evidence ledger entry yet, so the claim is unsupported in the current artifact draft.',
    recommendedAction: 'Attach a parsed evidence ledger entry that supports the cited baseline before the gate review.',
    uiVisibility: 'inline_recommendation',
    stopCondition: 'Charter cites a usable evidence ledger entry or the unsupported claim is removed.',
    handoff: {
      toAgent: 'nexus',
      reason: 'Missing evidence changes the recommended next action for the program owner.',
      trigger: 'evidence_weak',
    },
    createdFrom: 'deterministic_seed',
  },

  // -----------------------------------------------------------------
  // Tower surface (2+).
  // -----------------------------------------------------------------
  {
    id: 'mission-seed-atlas-1',
    agent: 'atlas',
    type: 'executive_brief',
    state: 'active',
    priority: 'high',
    workObject: {
      kind: 'tower_dimension',
      id: 'tower-seed-portfolio-pressure',
      label: 'Quarterly Portfolio Pressure',
      surface: 'tower',
    },
    rationale:
      'Portfolio pressure indicators have shifted across two programs since the last executive read, so a fresh quarterly synthesis is required for the steering committee.',
    recommendedAction: 'Prepare the quarterly portfolio pressure brief and identify the executive decision needed.',
    uiVisibility: 'executive_brief',
    stopCondition: 'Quarterly brief is published and the steering committee has the decision language.',
    handoff: {
      toAgent: 'nexus',
      reason: 'Executive direction needs operational follow-through on the affected programs.',
      trigger: 'follow_up_needed',
    },
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'mission-seed-steward-2',
    agent: 'steward',
    type: 'value_risk',
    state: 'waiting',
    priority: 'medium',
    workObject: {
      kind: 'tower_dimension',
      id: 'tower-seed-scorecard-governance',
      label: 'Tower Scorecard Governance',
      surface: 'tower',
    },
    rationale:
      'Tower scorecard governance check is overdue because the scorecard owner has not confirmed the value-at-risk inputs for the current cycle.',
    recommendedAction: 'Run the tower scorecard governance check and confirm the value-at-risk inputs with the owner.',
    uiVisibility: 'right_panel',
    stopCondition: 'Scorecard owner confirms value-at-risk inputs or the cycle is deferred with rationale.',
    handoff: null,
    createdFrom: 'deterministic_seed',
  },

  // -----------------------------------------------------------------
  // Intelligence surface (2+).
  // -----------------------------------------------------------------
  {
    id: 'mission-seed-sentinel-2',
    agent: 'sentinel',
    type: 'pattern_signal',
    state: 'active',
    priority: 'medium',
    workObject: {
      kind: 'pattern',
      id: 'pattern-seed-ams-pricing-trap',
      label: 'AMS Pricing Trap Pattern',
      surface: 'intelligence',
    },
    rationale:
      'Pattern detector flagged AMS pricing trap with weak evidence support across the two most recent programs, so confidence in the signal is currently low.',
    recommendedAction: 'Surface the pattern with a low-confidence caveat and request additional evidence before recommending an archetype.',
    uiVisibility: 'right_panel',
    stopCondition: 'Pattern confidence reaches the configured threshold or the signal is dismissed with reason.',
    handoff: {
      toAgent: 'nexus',
      reason: 'Once the pattern is confirmed, Nexus can recommend the matching archetype.',
      trigger: 'evidence_weak',
    },
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'mission-seed-nexus-2',
    agent: 'nexus',
    type: 'next_action',
    state: 'proposed',
    priority: 'medium',
    workObject: {
      kind: 'pattern',
      id: 'pattern-seed-ams-pricing-trap',
      label: 'AMS Pricing Trap Pattern',
      surface: 'intelligence',
    },
    rationale:
      'When the AMS pricing trap pattern is confirmed, the matching archetype recommendation should be offered to the program owner instead of a generic next action.',
    recommendedAction: 'Recommend the AMS managed-services archetype as the next pattern-aligned move once Sentinel confirms.',
    uiVisibility: 'inline_recommendation',
    stopCondition: 'Owner accepts the archetype recommendation or selects a different next action.',
    handoff: null,
    createdFrom: 'deterministic_seed',
  },

  // -----------------------------------------------------------------
  // Admin surface (2+).
  // -----------------------------------------------------------------
  {
    id: 'mission-seed-steward-3',
    agent: 'steward',
    type: 'data_readiness',
    state: 'waiting',
    priority: 'high',
    workObject: {
      kind: 'dataset_domain',
      id: 'dataset-seed-finance-domain',
      label: 'Finance Dataset Domain',
      surface: 'admin',
    },
    rationale:
      'Finance dataset domain is partially loaded. Several required tables are present but classification and scoping have not completed, so it is not yet usable evidence.',
    recommendedAction: 'Finish classification and scoping of the finance domain so it can support agent reasoning.',
    uiVisibility: 'right_panel',
    stopCondition: 'Domain reaches usable evidence state or owner formally defers the load.',
    handoff: null,
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'mission-seed-nexus-3',
    agent: 'nexus',
    type: 'workflow_blocker',
    state: 'blocked',
    priority: 'high',
    workObject: {
      kind: 'dataset_domain',
      id: 'dataset-seed-finance-domain',
      label: 'Finance Dataset Domain',
      surface: 'admin',
    },
    rationale:
      'Agent readiness for finance-aligned programs is blocked because the finance domain is not yet usable, which prevents Nexus from recommending finance-anchored next actions.',
    recommendedAction: 'Hold finance-anchored next actions until Steward confirms the dataset domain is usable.',
    uiVisibility: 'compact_strip',
    stopCondition: 'Steward confirms domain is usable or the dependent program is deferred.',
    handoff: {
      toAgent: 'steward',
      reason: 'Steward owns the data readiness path that unblocks this workflow.',
      trigger: 'gate_blocked',
    },
    createdFrom: 'deterministic_seed',
  },

  // -----------------------------------------------------------------
  // Source surface (2+).
  // -----------------------------------------------------------------
  {
    id: 'mission-seed-nexus-4',
    agent: 'nexus',
    type: 'vendor_response_gap',
    state: 'active',
    priority: 'high',
    workObject: {
      kind: 'vendor_response',
      id: 'vendor-response-seed-vendor-v',
      label: 'Vendor V · RFP Response',
      surface: 'source',
    },
    rationale:
      'Vendor V has submitted partial answers but is missing required responses for questions Q12 through Q15, which prevents a fair scorecard comparison.',
    recommendedAction: 'Request the missing Q12 through Q15 responses from Vendor V before the evaluation lock.',
    uiVisibility: 'inline_recommendation',
    stopCondition: 'Vendor V submits the missing responses, is waived, or is excluded from scoring.',
    handoff: {
      toAgent: 'sentinel',
      reason: 'Sentinel evaluates whether the partial response materially changes the scorecard reading.',
      trigger: 'missing_inputs',
    },
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'mission-seed-steward-4',
    agent: 'steward',
    type: 'scorecard_governance',
    state: 'waiting',
    priority: 'high',
    workObject: {
      kind: 'sourcing_event',
      id: 'sourcing-event-seed-ams-rfp',
      label: 'AMS RFP Sourcing Event',
      surface: 'source',
    },
    rationale:
      'Sourcing event scorecard has draft weights and rationale but has not been approved by the governance owner, so evaluation cannot be locked.',
    recommendedAction: 'Confirm scorecard weights and capture the governance approval rationale before evaluation lock.',
    uiVisibility: 'right_panel',
    stopCondition: 'Governance owner approves the scorecard or formally rejects with rationale.',
    handoff: null,
    createdFrom: 'deterministic_seed',
  },

  // -----------------------------------------------------------------
  // Cross-cutting required types: low_context_warning, validation_defer,
  // approval_follow_up.
  // -----------------------------------------------------------------
  {
    id: 'mission-seed-sentinel-3',
    agent: 'sentinel',
    type: 'low_context_warning',
    state: 'proposed',
    priority: 'low',
    workObject: {
      kind: 'program',
      id: 'program-seed-meridian-discovery',
      label: 'Meridian · Discovery Program',
      surface: 'programs',
    },
    rationale:
      'Discovery program has only pattern-level context loaded. Recommendations would be generic until program-specific evidence is attached.',
    recommendedAction: 'Disclose that current guidance is pattern-level only and request program-specific inputs.',
    uiVisibility: 'compact_strip',
    stopCondition: 'Program-specific inputs are loaded or the user explicitly accepts pattern-level guidance.',
    handoff: null,
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'mission-seed-sentinel-4',
    agent: 'sentinel',
    type: 'validation_defer',
    state: 'deferred',
    priority: 'medium',
    workObject: {
      kind: 'artifact',
      id: 'artifact-seed-meridian-rfp-draft',
      label: 'Meridian · RFP Draft',
      surface: 'source',
    },
    rationale:
      'Validation cannot complete because the uploaded supporting file is not yet parsed, so dependent checks defer until the parse result is available.',
    recommendedAction: 'Preserve the safe defer and resume validation once the supporting file is parsed.',
    uiVisibility: 'hidden_drawer',
    stopCondition: 'Supporting file is parsed and validation either passes or fails with reason.',
    handoff: {
      toAgent: 'steward',
      reason: 'Steward holds the readiness ledger that determines when validation may resume.',
      trigger: 'missing_inputs',
    },
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'mission-seed-steward-5',
    agent: 'steward',
    type: 'approval_follow_up',
    state: 'escalated',
    priority: 'critical',
    workObject: {
      kind: 'program',
      id: 'program-seed-apex-delivery',
      label: 'Apex Retail · Delivery Program',
      surface: 'programs',
    },
    rationale:
      'Delivery program approval owner has not responded for three working days, which is past the configured aging threshold for a critical gate.',
    recommendedAction: 'Escalate the approval to the executive sponsor with the aging summary and decision consequence.',
    uiVisibility: 'executive_brief',
    stopCondition: 'Approval is granted, rejected, waived, or the escalation is acknowledged with a new owner.',
    handoff: {
      toAgent: 'atlas',
      reason: 'Executive synthesis is needed to frame the decision consequence for the sponsor.',
      trigger: 'executive_decision_needed',
    },
    createdFrom: 'deterministic_seed',
  },
]);

// ---------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------

export function buildAgentMissionQueue(): readonly AgentMission[] {
  return SEED_MISSIONS;
}

export function buildAgentMissionsForSurface(
  surface: AgentMissionSurface,
): readonly AgentMission[] {
  return SEED_MISSIONS.filter((mission) => mission.workObject.surface === surface);
}

export function buildAgentMissionsForAgent(
  agent: AgentMissionAgent,
): readonly AgentMission[] {
  return SEED_MISSIONS.filter((mission) => mission.agent === agent);
}

export function summarizeAgentMissionQueue(
  missions: readonly AgentMission[] = SEED_MISSIONS,
): AgentMissionQueueSummary {
  const byAgent: Record<AgentMissionAgent, number> = {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };
  const byState: Record<AgentMissionState, number> = {
    proposed: 0,
    active: 0,
    waiting: 0,
    blocked: 0,
    completed: 0,
    dismissed: 0,
    escalated: 0,
    deferred: 0,
  };
  const bySurface: Record<AgentMissionSurface, number> = {
    programs: 0,
    tower: 0,
    intelligence: 0,
    admin: 0,
    source: 0,
  };

  let highestPriorityCount = 0;
  let handoffCount = 0;

  for (const mission of missions) {
    byAgent[mission.agent] += 1;
    byState[mission.state] += 1;
    bySurface[mission.workObject.surface] += 1;
    if (mission.priority === 'critical') {
      highestPriorityCount += 1;
    }
    if (mission.handoff !== null) {
      handoffCount += 1;
    }
  }

  return {
    totalMissions: missions.length,
    byAgent,
    byState,
    bySurface,
    highestPriorityCount,
    handoffCount,
  };
}

export function getTopAgentMissions(
  missions: readonly AgentMission[],
  limit = 5,
): readonly AgentMission[] {
  const indexed = missions.map((mission, index) => ({ mission, index }));
  indexed.sort((a, b) => {
    const priorityDelta = PRIORITY_RANK[a.mission.priority] - PRIORITY_RANK[b.mission.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    if (a.mission.id < b.mission.id) {
      return -1;
    }
    if (a.mission.id > b.mission.id) {
      return 1;
    }
    return a.index - b.index;
  });
  const safeLimit = Math.max(0, Math.trunc(limit));
  return indexed.slice(0, safeLimit).map((entry) => entry.mission);
}

export function getAgentMissionHandoffs(
  missions: readonly AgentMission[],
): readonly AgentMission[] {
  return missions.filter((mission) => mission.handoff !== null);
}
