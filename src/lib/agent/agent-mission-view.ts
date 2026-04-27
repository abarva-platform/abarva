// AG11 - Agent Mission Panel view helper.
//
// Pure, deterministic, file-only view-model for the AG11 mission UI
// strip / panel. Mirrors a compatible shape with AG10 (the live mission
// queue) without importing it: the AG10 module may not exist on this
// worktree's base, so AG11 defines the minimum prop type locally and
// notes the live integration as a follow-up.
//
// Pure module - no model calls, no network, no time-of-day or random
// dependencies. No imports from src/lib/source, src/lib/nexus,
// src/lib/sentinel, src/lib/atlas, src/lib/auth, supabase. Used by the
// AgentMissionPanel server component and the AG11 integration test.

// ---------------------------------------------------------------------
// Type partition (compatible with AG10 mission queue contract)
// ---------------------------------------------------------------------

export type AgentMissionPanelAgent =
  | 'nexus'
  | 'sentinel'
  | 'atlas'
  | 'steward';

export type AgentMissionPanelType =
  | 'next_action'
  | 'evidence_gap'
  | 'gate_check'
  | 'artifact_review'
  | 'data_readiness'
  | 'value_risk'
  | 'executive_brief'
  | 'vendor_response_gap'
  | 'scorecard_governance'
  | 'approval_follow_up'
  | 'workflow_blocker'
  | 'pattern_signal'
  | 'validation_defer'
  | 'low_context_warning';

export type AgentMissionPanelState =
  | 'proposed'
  | 'active'
  | 'waiting'
  | 'blocked'
  | 'completed'
  | 'dismissed'
  | 'escalated'
  | 'deferred';

export type AgentMissionPanelPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type AgentMissionPanelVariant =
  | 'compact_strip'
  | 'right_panel'
  | 'inline_recommendation'
  | 'executive_brief'
  | 'hidden_drawer';

export interface AgentMissionPanelMission {
  readonly id: string;
  readonly agent: AgentMissionPanelAgent;
  readonly type: AgentMissionPanelType;
  readonly state: AgentMissionPanelState;
  readonly priority: AgentMissionPanelPriority;
  readonly workObjectLabel: string;
  readonly rationale: string;
  readonly recommendedAction: string;
  readonly handoffTo?: AgentMissionPanelAgent | null;
  readonly stopCondition: string;
}

export interface AgentMissionPanelView {
  readonly variant: AgentMissionPanelVariant;
  readonly missions: readonly AgentMissionPanelMission[];
  readonly surfaceLabel: string;
  readonly honestDisclaimer: string;
}

export const AGENT_MISSION_PANEL_AGENTS: readonly AgentMissionPanelAgent[] = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
] as const;

export const AGENT_MISSION_PANEL_VARIANTS: readonly AgentMissionPanelVariant[] = [
  'compact_strip',
  'right_panel',
  'inline_recommendation',
  'executive_brief',
  'hidden_drawer',
] as const;

const HONEST_DISCLAIMER =
  'Mission queue is deterministic seed; runtime triggers deferred.';

// ---------------------------------------------------------------------
// Display label helpers
// ---------------------------------------------------------------------

const AGENT_DISPLAY: Record<AgentMissionPanelAgent, string> = {
  nexus: 'Nexus',
  sentinel: 'Sentinel',
  atlas: 'Atlas',
  steward: 'Steward',
};

const PRIORITY_LABEL: Record<AgentMissionPanelPriority, string> = {
  critical: 'P1 · Critical',
  high: 'P2 · High',
  medium: 'P3 · Medium',
  low: 'P4 · Low',
};

const STATE_LABEL: Record<AgentMissionPanelState, string> = {
  proposed: 'Proposed',
  active: 'Active',
  waiting: 'Waiting',
  blocked: 'Blocked',
  completed: 'Completed',
  dismissed: 'Dismissed',
  escalated: 'Escalated',
  deferred: 'Deferred',
};

export function agentDisplayLabel(agent: AgentMissionPanelAgent): string {
  return AGENT_DISPLAY[agent];
}

export function priorityChipLabel(p: AgentMissionPanelPriority): string {
  return PRIORITY_LABEL[p];
}

export function stateChipLabel(s: AgentMissionPanelState): string {
  return STATE_LABEL[s];
}

// ---------------------------------------------------------------------
// Canonical seed missions (frozen, deterministic)
// ---------------------------------------------------------------------

const SEED_MISSIONS: readonly AgentMissionPanelMission[] = [
  {
    id: 'ag11-seed-nexus-next-action',
    agent: 'nexus',
    type: 'next_action',
    state: 'proposed',
    priority: 'high',
    workObjectLabel: 'Program · Apex Retail · Phase 2 Discovery',
    rationale:
      'Scope readiness is partial; next-step artifact is unblocked once the workshop charter is confirmed.',
    recommendedAction: 'Confirm workshop charter and advance to readiness sign-off.',
    handoffTo: 'steward',
    stopCondition: 'Workshop charter is confirmed by program owner.',
  },
  {
    id: 'ag11-seed-nexus-artifact-review',
    agent: 'nexus',
    type: 'artifact_review',
    state: 'active',
    priority: 'medium',
    workObjectLabel: 'Artifact · Discovery brief draft',
    rationale:
      'Draft brief covers four of five scope sections; one section still needs an owner.',
    recommendedAction: 'Assign an owner to the missing scope section.',
    handoffTo: null,
    stopCondition: 'Owner assignment recorded on the brief.',
  },
  {
    id: 'ag11-seed-sentinel-evidence-gap',
    agent: 'sentinel',
    type: 'evidence_gap',
    state: 'waiting',
    priority: 'high',
    workObjectLabel: 'Pattern · Vendor scorecard claim · row 4',
    rationale:
      'Scorecard claim is asserted without a citation; pattern fit is uncertain until evidence lands.',
    recommendedAction: 'Attach a quality-checked citation or mark the row as low confidence.',
    handoffTo: 'steward',
    stopCondition: 'Citation lands and quality-check passes, or row is downgraded.',
  },
  {
    id: 'ag11-seed-sentinel-pattern-signal',
    agent: 'sentinel',
    type: 'pattern_signal',
    state: 'proposed',
    priority: 'medium',
    workObjectLabel: 'Intelligence · Contact Center AI pattern',
    rationale:
      'Two adjacent programs match the same anti-pattern signal; review before next gate.',
    recommendedAction: 'Open the pattern detail and confirm or downgrade the signal.',
    handoffTo: 'nexus',
    stopCondition: 'Pattern signal is confirmed, downgraded, or dismissed.',
  },
  {
    id: 'ag11-seed-atlas-executive-brief',
    agent: 'atlas',
    type: 'executive_brief',
    state: 'proposed',
    priority: 'critical',
    workObjectLabel: 'Tower · Portfolio brief · Apex Retail',
    rationale:
      'Value-at-risk shifted on two programs; an executive brief is ready for review before the steering meeting.',
    recommendedAction: 'Review the brief and route the recommendation to the steering owner.',
    handoffTo: 'steward',
    stopCondition: 'Steering owner accepts, defers, or rejects the recommendation.',
  },
  {
    id: 'ag11-seed-atlas-value-risk',
    agent: 'atlas',
    type: 'value_risk',
    state: 'active',
    priority: 'high',
    workObjectLabel: 'Tower · Decision tradeoff · CDP rollout',
    rationale:
      'Decision tradeoff is between accelerated rollout and a slower, audit-clean path.',
    recommendedAction: 'Capture the executive choice and lock the decision rationale.',
    handoffTo: null,
    stopCondition: 'Decision rationale is captured and the program moves forward.',
  },
  {
    id: 'ag11-seed-steward-gate-check',
    agent: 'steward',
    type: 'gate_check',
    state: 'blocked',
    priority: 'critical',
    workObjectLabel: 'Gate · Phase 3 readiness · Demand Forecasting',
    rationale:
      'Gate is blocked on a missing data-readiness sign-off from the dataset domain owner.',
    recommendedAction: 'Request the dataset domain owner to confirm or waive readiness.',
    handoffTo: 'nexus',
    stopCondition: 'Sign-off recorded or formal waiver attached to the gate.',
  },
  {
    id: 'ag11-seed-steward-data-readiness',
    agent: 'steward',
    type: 'data_readiness',
    state: 'waiting',
    priority: 'medium',
    workObjectLabel: 'Dataset · Store Associate KPI · readiness scope',
    rationale:
      'Readiness scope is partial; one source domain needs confirmation before downstream work.',
    recommendedAction: 'Confirm the missing source domain or downgrade readiness scope.',
    handoffTo: 'sentinel',
    stopCondition: 'Source domain is confirmed or readiness scope is reduced.',
  },
  {
    id: 'ag11-seed-steward-approval-follow-up',
    agent: 'steward',
    type: 'approval_follow_up',
    state: 'escalated',
    priority: 'high',
    workObjectLabel: 'Approval · Workshop sign-off · Apex Retail',
    rationale:
      'Sign-off is overdue past the agreed window; escalate to the program sponsor.',
    recommendedAction: 'Escalate to the sponsor or capture a deferral reason.',
    handoffTo: null,
    stopCondition: 'Sponsor accepts the escalation or a deferral is recorded.',
  },
] as const;

// ---------------------------------------------------------------------
// Surface labels by variant
// ---------------------------------------------------------------------

const SURFACE_LABEL: Record<AgentMissionPanelVariant, string> = {
  compact_strip: 'Active agent missions',
  right_panel: 'Mission panel',
  inline_recommendation: 'Inline recommendation',
  executive_brief: 'Executive brief',
  hidden_drawer: 'Mission drawer',
};

// ---------------------------------------------------------------------
// Variant filters - ensure >= 1 mission per agent in each variant view
// ---------------------------------------------------------------------

function pickMissionsForVariant(
  variant: AgentMissionPanelVariant,
): readonly AgentMissionPanelMission[] {
  // Each variant gets exactly four missions (one per agent) for compact
  // surfaces, or the full seed for the right panel and drawer.
  if (variant === 'right_panel' || variant === 'hidden_drawer') {
    return SEED_MISSIONS;
  }
  if (variant === 'executive_brief') {
    // Executive brief surfaces the four highest-impact missions, one per agent.
    return [
      SEED_MISSIONS[0]!, // nexus next_action
      SEED_MISSIONS[2]!, // sentinel evidence_gap
      SEED_MISSIONS[4]!, // atlas executive_brief
      SEED_MISSIONS[6]!, // steward gate_check
    ];
  }
  if (variant === 'compact_strip') {
    return [
      SEED_MISSIONS[0]!,
      SEED_MISSIONS[2]!,
      SEED_MISSIONS[4]!,
      SEED_MISSIONS[6]!,
    ];
  }
  // inline_recommendation - single, highest-priority mission per agent.
  return [
    SEED_MISSIONS[0]!,
    SEED_MISSIONS[2]!,
    SEED_MISSIONS[4]!,
    SEED_MISSIONS[6]!,
  ];
}

// ---------------------------------------------------------------------
// Public builders / summarizers
// ---------------------------------------------------------------------

export function buildAgentMissionPanelSeedView(
  variant: AgentMissionPanelVariant,
  surfaceLabel?: string,
): AgentMissionPanelView {
  const missions = pickMissionsForVariant(variant);
  return {
    variant,
    missions,
    surfaceLabel: surfaceLabel ?? SURFACE_LABEL[variant],
    honestDisclaimer: HONEST_DISCLAIMER,
  };
}

export function summarizeAgentMissionPanelView(
  view: AgentMissionPanelView,
): {
  totalMissions: number;
  byAgent: Record<AgentMissionPanelAgent, number>;
  byPriority: Record<AgentMissionPanelPriority, number>;
} {
  const byAgent: Record<AgentMissionPanelAgent, number> = {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };
  const byPriority: Record<AgentMissionPanelPriority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const mission of view.missions) {
    byAgent[mission.agent] += 1;
    byPriority[mission.priority] += 1;
  }
  return {
    totalMissions: view.missions.length,
    byAgent,
    byPriority,
  };
}
