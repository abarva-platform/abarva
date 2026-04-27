// AG13 - Cross-Agent Handoff Read Model.
//
// Deterministic, file-pure read model for cross-agent handoffs across
// the four AbarVa agents (Nexus, Sentinel, Atlas, Steward). This slice
// gives the platform a typed surface for reasoning about who hands off
// what to whom, why, and on which work object, without invoking any
// runtime, scheduler, or model provider.
//
// Companion to:
//   docs/platform-architecture/runtime/13_AGENT_MISSION_MODEL.md
//   docs/platform-architecture/runtime/14_AGENT_WORK_QUEUE_AND_TRIGGERS.md
//   src/lib/agents/agent-mission-queue.ts (AG10 - mission queue)
//
// Every handoff in the seed set carries an id of the form
// `handoff-seed-{n}` so it cannot be confused with a future runtime
// generated handoff. Some handoffs reference an AG10 triggering
// mission id via `audit.triggeringMissionId`.
//
// AG13 is a read-only seed: there is no scheduler, no persistence, no
// model call, no live trigger, and no UI mounting. UI mounting and
// runtime trigger wiring are deferred behind the Model Gateway and
// audit ledger.

// ---------------------------------------------------------------------
// Canonical agent / state / reason tuples (order is contract).
// ---------------------------------------------------------------------

export const CROSS_AGENT_HANDOFF_AGENTS = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
] as const;

export type CrossAgentHandoffAgent = typeof CROSS_AGENT_HANDOFF_AGENTS[number];

export const CROSS_AGENT_HANDOFF_STATES = [
  'proposed',
  'accepted',
  'declined',
  'deferred',
  'completed',
  'escalated',
  'blocked',
] as const;

export type CrossAgentHandoffState = typeof CROSS_AGENT_HANDOFF_STATES[number];

export const CROSS_AGENT_HANDOFF_REASONS = [
  'evidence_validation_needed',
  'governance_review_needed',
  'executive_escalation_needed',
  'program_action_needed',
  'data_readiness_needed',
  'value_risk_detected',
  'low_context_warning',
  'artifact_review_needed',
  'pattern_signal_detected',
] as const;

export type CrossAgentHandoffReason = typeof CROSS_AGENT_HANDOFF_REASONS[number];

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type CrossAgentHandoffWorkObjectKind =
  | 'program'
  | 'phase'
  | 'workshop'
  | 'pattern'
  | 'artifact'
  | 'tower_dimension'
  | 'dataset_domain'
  | 'sourcing_event';

export type CrossAgentHandoffSurface =
  | 'programs'
  | 'tower'
  | 'intelligence'
  | 'admin'
  | 'source';

export interface CrossAgentHandoffWorkObject {
  kind: CrossAgentHandoffWorkObjectKind;
  id: string;
  label: string;
  surface: CrossAgentHandoffSurface;
}

export interface CrossAgentHandoffAuditBasis {
  triggeringMissionId?: string;
  evidenceIds: readonly string[];
  rationale: string;
  expectedResolution: string;
}

export type CrossAgentHandoffEscalationTarget =
  | 'platform_admin'
  | 'founder'
  | 'value_office'
  | 'governance_committee';

export type CrossAgentHandoffSource = 'deterministic_cross_agent_handoff_seed';

export interface CrossAgentHandoff {
  id: string;
  sourceAgent: CrossAgentHandoffAgent;
  targetAgent: CrossAgentHandoffAgent;
  state: CrossAgentHandoffState;
  reason: CrossAgentHandoffReason;
  workObject: CrossAgentHandoffWorkObject;
  audit: CrossAgentHandoffAuditBasis;
  declinedReason?: string;
  blockedReason?: string;
  deferredReason?: string;
  escalatedTo?: CrossAgentHandoffEscalationTarget;
  createdFrom: CrossAgentHandoffSource;
}

export interface CrossAgentHandoffSummary {
  totalHandoffs: number;
  byState: Record<CrossAgentHandoffState, number>;
  bySourceAgent: Record<CrossAgentHandoffAgent, number>;
  byTargetAgent: Record<CrossAgentHandoffAgent, number>;
  byReason: Record<CrossAgentHandoffReason, number>;
  openCount: number;
  blockedCount: number;
  uniqueWorkObjects: number;
}

export interface CrossAgentHandoffValidationResult {
  isValid: boolean;
  reasons: readonly string[];
}

// ---------------------------------------------------------------------
// Deterministic seed cross-agent handoffs.
//
// Hand-authored and frozen. Every id matches /^handoff-seed-\d+$/.
// All four source agents and all four target agents are represented.
// All seven states and all nine reasons are covered. Every entry has
// sourceAgent !== targetAgent. Some entries reference AG10 mission
// ids via audit.triggeringMissionId.
// ---------------------------------------------------------------------

const SEED_HANDOFFS: readonly CrossAgentHandoff[] = Object.freeze([
  // 1 - Sentinel asks Nexus to act on a confirmed pattern.
  {
    id: 'handoff-seed-1',
    sourceAgent: 'sentinel',
    targetAgent: 'nexus',
    state: 'proposed',
    reason: 'pattern_signal_detected',
    workObject: {
      kind: 'pattern',
      id: 'pattern-seed-ams-pricing-trap',
      label: 'AMS Pricing Trap Pattern',
      surface: 'intelligence',
    },
    audit: {
      triggeringMissionId: 'mission-seed-sentinel-2',
      evidenceIds: ['evidence-seed-pattern-ams-1', 'evidence-seed-pattern-ams-2'],
      rationale:
        'Sentinel detected the AMS pricing trap pattern with sufficient confidence on two recent programs and asks Nexus to recommend the matching managed-services archetype.',
      expectedResolution:
        'Nexus accepts and presents the pattern-aligned archetype recommendation to the program owner.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 2 - Sentinel hands evidence-gap finding to Nexus, accepted.
  {
    id: 'handoff-seed-2',
    sourceAgent: 'sentinel',
    targetAgent: 'nexus',
    state: 'accepted',
    reason: 'evidence_validation_needed',
    workObject: {
      kind: 'artifact',
      id: 'artifact-seed-apex-charter-rfp',
      label: 'Apex Retail · Charter Document',
      surface: 'programs',
    },
    audit: {
      triggeringMissionId: 'mission-seed-sentinel-1',
      evidenceIds: ['evidence-seed-charter-baseline-1'],
      rationale:
        'Charter cites a baseline metric without a parsed evidence ledger entry; Sentinel hands the gap to Nexus to request the missing citation from the program owner.',
      expectedResolution:
        'Nexus revises the recommended next action so the program owner attaches the supporting evidence before gate review.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 3 - Steward escalates a stalled approval to Atlas for executive synthesis.
  {
    id: 'handoff-seed-3',
    sourceAgent: 'steward',
    targetAgent: 'atlas',
    state: 'escalated',
    reason: 'executive_escalation_needed',
    workObject: {
      kind: 'program',
      id: 'program-seed-apex-delivery',
      label: 'Apex Retail · Delivery Program',
      surface: 'programs',
    },
    audit: {
      triggeringMissionId: 'mission-seed-steward-5',
      evidenceIds: ['evidence-seed-approval-aging-1'],
      rationale:
        'Approval owner has not responded for three working days, past the configured aging threshold for a critical gate; Steward escalates to Atlas for executive framing.',
      expectedResolution:
        'Atlas prepares an executive brief that names the decision and consequence so the sponsor can act this cycle.',
    },
    escalatedTo: 'founder',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 4 - Atlas asks Nexus to wire executive direction into program next actions.
  {
    id: 'handoff-seed-4',
    sourceAgent: 'atlas',
    targetAgent: 'nexus',
    state: 'completed',
    reason: 'program_action_needed',
    workObject: {
      kind: 'tower_dimension',
      id: 'tower-seed-portfolio-pressure',
      label: 'Quarterly Portfolio Pressure',
      surface: 'tower',
    },
    audit: {
      triggeringMissionId: 'mission-seed-atlas-1',
      evidenceIds: ['evidence-seed-portfolio-pressure-1'],
      rationale:
        'Atlas published the quarterly portfolio pressure brief; the steering committee directed program-level follow-through on the two affected programs.',
      expectedResolution:
        'Nexus translates the executive direction into program-specific next actions and confirms operational follow-through.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 5 - Nexus hands a workflow blocker to Steward for data readiness.
  {
    id: 'handoff-seed-5',
    sourceAgent: 'nexus',
    targetAgent: 'steward',
    state: 'blocked',
    reason: 'data_readiness_needed',
    workObject: {
      kind: 'dataset_domain',
      id: 'dataset-seed-finance-domain',
      label: 'Finance Dataset Domain',
      surface: 'admin',
    },
    audit: {
      triggeringMissionId: 'mission-seed-nexus-3',
      evidenceIds: ['evidence-seed-finance-domain-load-1'],
      rationale:
        'Finance-anchored next actions are held until the finance dataset domain is usable; Nexus surfaces the blocker so Steward can finish classification and scoping.',
      expectedResolution:
        'Steward confirms the finance dataset domain is usable evidence or the dependent program is formally deferred.',
    },
    blockedReason:
      'Finance dataset domain is not yet usable evidence; classification and scoping are incomplete.',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 6 - Steward asks Sentinel to validate value-at-risk inputs (declined).
  {
    id: 'handoff-seed-6',
    sourceAgent: 'steward',
    targetAgent: 'sentinel',
    state: 'declined',
    reason: 'value_risk_detected',
    workObject: {
      kind: 'tower_dimension',
      id: 'tower-seed-scorecard-governance',
      label: 'Tower Scorecard Governance',
      surface: 'tower',
    },
    audit: {
      triggeringMissionId: 'mission-seed-steward-2',
      evidenceIds: ['evidence-seed-scorecard-governance-1'],
      rationale:
        'Steward asked Sentinel to validate the value-at-risk inputs; Sentinel declined because the scorecard owner has not confirmed inputs and validation would be premature.',
      expectedResolution:
        'Steward revisits once the scorecard owner confirms inputs or the cycle is deferred with rationale.',
    },
    declinedReason:
      'Scorecard owner has not confirmed value-at-risk inputs; validation would be premature.',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 7 - Sentinel defers a validation handoff to Steward (deferred state).
  {
    id: 'handoff-seed-7',
    sourceAgent: 'sentinel',
    targetAgent: 'steward',
    state: 'deferred',
    reason: 'evidence_validation_needed',
    workObject: {
      kind: 'artifact',
      id: 'artifact-seed-meridian-rfp-draft',
      label: 'Meridian · RFP Draft',
      surface: 'source',
    },
    audit: {
      triggeringMissionId: 'mission-seed-sentinel-4',
      evidenceIds: ['evidence-seed-rfp-parse-pending-1'],
      rationale:
        'Validation cannot complete because the uploaded supporting file is not yet parsed; Sentinel defers the handoff to Steward who owns the readiness ledger.',
      expectedResolution:
        'Supporting file is parsed and validation either resumes or fails with reason; the deferred handoff is then re-proposed.',
    },
    deferredReason:
      'Uploaded supporting file has not been parsed; readiness ledger has no entry yet.',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 8 - Sentinel surfaces low-context warning to Nexus.
  {
    id: 'handoff-seed-8',
    sourceAgent: 'sentinel',
    targetAgent: 'nexus',
    state: 'accepted',
    reason: 'low_context_warning',
    workObject: {
      kind: 'program',
      id: 'program-seed-meridian-discovery',
      label: 'Meridian · Discovery Program',
      surface: 'programs',
    },
    audit: {
      triggeringMissionId: 'mission-seed-sentinel-3',
      evidenceIds: ['evidence-seed-meridian-context-pattern-only-1'],
      rationale:
        'Discovery program has only pattern-level context loaded; Sentinel warns Nexus so the next action is presented with a low-context caveat.',
      expectedResolution:
        'Nexus disclaims pattern-level guidance and asks the program owner for program-specific inputs.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 9 - Steward sends scorecard governance review request to Atlas.
  {
    id: 'handoff-seed-9',
    sourceAgent: 'steward',
    targetAgent: 'atlas',
    state: 'proposed',
    reason: 'governance_review_needed',
    workObject: {
      kind: 'sourcing_event',
      id: 'sourcing-event-seed-ams-rfp',
      label: 'AMS RFP Sourcing Event',
      surface: 'source',
    },
    audit: {
      triggeringMissionId: 'mission-seed-steward-4',
      evidenceIds: ['evidence-seed-ams-rfp-scorecard-1'],
      rationale:
        'AMS RFP scorecard has draft weights but governance approval is pending; Steward asks Atlas for an executive read on the trade-offs before lock.',
      expectedResolution:
        'Atlas frames the governance trade-offs for the sponsor and the scorecard is approved or rejected with rationale.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 10 - Nexus asks Sentinel to evaluate a partial vendor response.
  {
    id: 'handoff-seed-10',
    sourceAgent: 'nexus',
    targetAgent: 'sentinel',
    state: 'accepted',
    reason: 'artifact_review_needed',
    workObject: {
      kind: 'artifact',
      id: 'vendor-response-seed-vendor-v',
      label: 'Vendor V · RFP Response',
      surface: 'source',
    },
    audit: {
      triggeringMissionId: 'mission-seed-nexus-4',
      evidenceIds: ['evidence-seed-vendor-v-partial-1'],
      rationale:
        'Vendor V submitted partial answers; Nexus asks Sentinel to evaluate whether the partial response materially changes the scorecard reading.',
      expectedResolution:
        'Sentinel returns a materiality verdict that the program owner can use to decide on waiver or exclusion.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 11 - Atlas escalates a value-risk to the value office.
  {
    id: 'handoff-seed-11',
    sourceAgent: 'atlas',
    targetAgent: 'steward',
    state: 'escalated',
    reason: 'value_risk_detected',
    workObject: {
      kind: 'tower_dimension',
      id: 'tower-seed-portfolio-pressure',
      label: 'Quarterly Portfolio Pressure',
      surface: 'tower',
    },
    audit: {
      evidenceIds: ['evidence-seed-portfolio-pressure-2'],
      rationale:
        'Atlas observed a value-at-risk shift across two programs and escalates to Steward for governance follow-up with the value office.',
      expectedResolution:
        'Value office reviews the risk and either accepts the trade-off or directs Steward to tighten the gate.',
    },
    escalatedTo: 'value_office',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 12 - Nexus hands a phase next action to Steward for gate prep.
  {
    id: 'handoff-seed-12',
    sourceAgent: 'nexus',
    targetAgent: 'steward',
    state: 'completed',
    reason: 'governance_review_needed',
    workObject: {
      kind: 'phase',
      id: 'phase-seed-apex-design',
      label: 'Apex Retail · Design Phase',
      surface: 'programs',
    },
    audit: {
      triggeringMissionId: 'mission-seed-steward-1',
      evidenceIds: ['evidence-seed-apex-design-readiness-1'],
      rationale:
        'Design phase next action requires a fresh G2 readiness review; Nexus hands the phase to Steward for the gate verdict.',
      expectedResolution:
        'Steward records the gate verdict and either clears the phase to Build or waives with rationale.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 13 - Steward asks Nexus to act on data readiness completion.
  {
    id: 'handoff-seed-13',
    sourceAgent: 'steward',
    targetAgent: 'nexus',
    state: 'proposed',
    reason: 'data_readiness_needed',
    workObject: {
      kind: 'dataset_domain',
      id: 'dataset-seed-finance-domain',
      label: 'Finance Dataset Domain',
      surface: 'admin',
    },
    audit: {
      triggeringMissionId: 'mission-seed-steward-3',
      evidenceIds: ['evidence-seed-finance-domain-classified-1'],
      rationale:
        'Once the finance domain is usable, Steward proposes that Nexus revise finance-anchored next actions across affected programs.',
      expectedResolution:
        'Nexus refreshes finance-anchored recommendations and confirms with each program owner.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 14 - Atlas requests a pattern read from Sentinel for the executive brief.
  {
    id: 'handoff-seed-14',
    sourceAgent: 'atlas',
    targetAgent: 'sentinel',
    state: 'accepted',
    reason: 'pattern_signal_detected',
    workObject: {
      kind: 'tower_dimension',
      id: 'tower-seed-portfolio-pressure',
      label: 'Quarterly Portfolio Pressure',
      surface: 'tower',
    },
    audit: {
      evidenceIds: ['evidence-seed-pattern-portfolio-1'],
      rationale:
        'Atlas needs a Sentinel pattern read to support the executive narrative about portfolio pressure shifts.',
      expectedResolution:
        'Sentinel returns a confidence-tagged pattern read that Atlas can cite in the executive brief.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 15 - Nexus hands an artifact review to Sentinel (blocked on parse).
  {
    id: 'handoff-seed-15',
    sourceAgent: 'nexus',
    targetAgent: 'sentinel',
    state: 'blocked',
    reason: 'artifact_review_needed',
    workObject: {
      kind: 'artifact',
      id: 'artifact-seed-meridian-rfp-draft',
      label: 'Meridian · RFP Draft',
      surface: 'source',
    },
    audit: {
      evidenceIds: ['evidence-seed-meridian-rfp-draft-1'],
      rationale:
        'Nexus asked Sentinel to review the Meridian RFP draft; the review is blocked because the supporting file has not been parsed.',
      expectedResolution:
        'Steward parses the supporting file and the review is re-proposed with the parsed content available.',
    },
    blockedReason:
      'Supporting file for Meridian RFP draft is not yet parsed; review cannot start.',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 16 - Steward asks Atlas to escalate to the governance committee.
  {
    id: 'handoff-seed-16',
    sourceAgent: 'steward',
    targetAgent: 'atlas',
    state: 'escalated',
    reason: 'governance_review_needed',
    workObject: {
      kind: 'sourcing_event',
      id: 'sourcing-event-seed-ams-rfp',
      label: 'AMS RFP Sourcing Event',
      surface: 'source',
    },
    audit: {
      evidenceIds: ['evidence-seed-ams-rfp-governance-1'],
      rationale:
        'AMS RFP scorecard governance is contested between Steward and the program owner; Steward escalates so Atlas can frame the trade-off for the governance committee.',
      expectedResolution:
        'Governance committee resolves the contested weights and Steward locks the scorecard.',
    },
    escalatedTo: 'governance_committee',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 17 - Sentinel hands a low-context warning to Atlas (declined; not yet executive level).
  {
    id: 'handoff-seed-17',
    sourceAgent: 'sentinel',
    targetAgent: 'atlas',
    state: 'declined',
    reason: 'low_context_warning',
    workObject: {
      kind: 'program',
      id: 'program-seed-meridian-discovery',
      label: 'Meridian · Discovery Program',
      surface: 'programs',
    },
    audit: {
      evidenceIds: ['evidence-seed-meridian-context-only-1'],
      rationale:
        'Sentinel proposed surfacing the low-context warning to Atlas for executive framing; Atlas declined because the issue is not yet executive-level and Nexus already holds the program-level handoff.',
      expectedResolution:
        'Sentinel keeps the warning at the program level via Nexus; if the issue persists into the next cycle, Atlas reconsiders.',
    },
    declinedReason:
      'Issue is not yet executive-level; program-level handoff via Nexus is sufficient for this cycle.',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 18 - Steward defers a workshop governance review to Sentinel.
  {
    id: 'handoff-seed-18',
    sourceAgent: 'steward',
    targetAgent: 'sentinel',
    state: 'deferred',
    reason: 'artifact_review_needed',
    workObject: {
      kind: 'workshop',
      id: 'workshop-seed-apex-charter-kickoff',
      label: 'Apex Retail · Charter Kickoff Workshop',
      surface: 'programs',
    },
    audit: {
      evidenceIds: ['evidence-seed-charter-kickoff-agenda-1'],
      rationale:
        'Steward asked Sentinel to review the kickoff workshop agenda for evidence anchors; review is deferred until the agenda is finalized.',
      expectedResolution:
        'Workshop owner finalizes the agenda and the review is re-proposed.',
    },
    deferredReason:
      'Workshop agenda is still in draft; review would be premature.',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 19 - Nexus completes a program action handoff to Atlas (executive readout).
  {
    id: 'handoff-seed-19',
    sourceAgent: 'nexus',
    targetAgent: 'atlas',
    state: 'completed',
    reason: 'program_action_needed',
    workObject: {
      kind: 'program',
      id: 'program-seed-apex-delivery',
      label: 'Apex Retail · Delivery Program',
      surface: 'programs',
    },
    audit: {
      evidenceIds: ['evidence-seed-apex-delivery-readout-1'],
      rationale:
        'Nexus closed the program-level next action and hands the readout to Atlas for inclusion in the next executive brief.',
      expectedResolution:
        'Atlas folds the readout into the next executive brief without further follow-up needed.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 20 - Atlas escalates a low-context warning to platform admin.
  {
    id: 'handoff-seed-20',
    sourceAgent: 'atlas',
    targetAgent: 'steward',
    state: 'escalated',
    reason: 'low_context_warning',
    workObject: {
      kind: 'tower_dimension',
      id: 'tower-seed-scorecard-governance',
      label: 'Tower Scorecard Governance',
      surface: 'tower',
    },
    audit: {
      evidenceIds: ['evidence-seed-tower-context-thin-1'],
      rationale:
        'Atlas observed that tower scorecard context is unusually thin and escalates to Steward for platform-admin review of dataset coverage.',
      expectedResolution:
        'Platform admin reviews dataset coverage and either approves a backfill or accepts the thin context with rationale.',
    },
    escalatedTo: 'platform_admin',
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 21 - Sentinel hands an executive escalation to Atlas (proposed).
  {
    id: 'handoff-seed-21',
    sourceAgent: 'sentinel',
    targetAgent: 'atlas',
    state: 'proposed',
    reason: 'executive_escalation_needed',
    workObject: {
      kind: 'pattern',
      id: 'pattern-seed-ams-pricing-trap',
      label: 'AMS Pricing Trap Pattern',
      surface: 'intelligence',
    },
    audit: {
      evidenceIds: ['evidence-seed-pattern-ams-3'],
      rationale:
        'Pattern recurrence across three programs warrants an executive escalation; Sentinel proposes that Atlas frame the portfolio-level consequence.',
      expectedResolution:
        'Atlas decides whether to elevate the pattern in the executive brief or hold for one more cycle.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },

  // 22 - Atlas hands an artifact review request to Steward (proposed).
  {
    id: 'handoff-seed-22',
    sourceAgent: 'atlas',
    targetAgent: 'steward',
    state: 'proposed',
    reason: 'artifact_review_needed',
    workObject: {
      kind: 'artifact',
      id: 'artifact-seed-apex-charter-rfp',
      label: 'Apex Retail · Charter Document',
      surface: 'programs',
    },
    audit: {
      evidenceIds: ['evidence-seed-charter-executive-summary-1'],
      rationale:
        'Atlas proposes that Steward run a governance review of the charter document before it is cited in the next executive brief.',
      expectedResolution:
        'Steward returns a governance verdict so Atlas can cite the charter with confidence.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  },
]);

// ---------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------

export function buildCrossAgentHandoffSeed(): readonly CrossAgentHandoff[] {
  return SEED_HANDOFFS;
}

export function summarizeCrossAgentHandoffs(
  handoffs: readonly CrossAgentHandoff[] = SEED_HANDOFFS,
): CrossAgentHandoffSummary {
  const byState: Record<CrossAgentHandoffState, number> = {
    proposed: 0,
    accepted: 0,
    declined: 0,
    deferred: 0,
    completed: 0,
    escalated: 0,
    blocked: 0,
  };
  const bySourceAgent: Record<CrossAgentHandoffAgent, number> = {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };
  const byTargetAgent: Record<CrossAgentHandoffAgent, number> = {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };
  const byReason: Record<CrossAgentHandoffReason, number> = {
    evidence_validation_needed: 0,
    governance_review_needed: 0,
    executive_escalation_needed: 0,
    program_action_needed: 0,
    data_readiness_needed: 0,
    value_risk_detected: 0,
    low_context_warning: 0,
    artifact_review_needed: 0,
    pattern_signal_detected: 0,
  };

  let openCount = 0;
  let blockedCount = 0;
  const workObjectKeys = new Set<string>();

  for (const handoff of handoffs) {
    byState[handoff.state] += 1;
    bySourceAgent[handoff.sourceAgent] += 1;
    byTargetAgent[handoff.targetAgent] += 1;
    byReason[handoff.reason] += 1;

    if (
      handoff.state === 'proposed' ||
      handoff.state === 'accepted' ||
      handoff.state === 'deferred'
    ) {
      openCount += 1;
    }
    if (handoff.state === 'blocked') {
      blockedCount += 1;
    }
    workObjectKeys.add(`${handoff.workObject.kind}:${handoff.workObject.id}`);
  }

  return {
    totalHandoffs: handoffs.length,
    byState,
    bySourceAgent,
    byTargetAgent,
    byReason,
    openCount,
    blockedCount,
    uniqueWorkObjects: workObjectKeys.size,
  };
}

export function getHandoffsForAgent(
  agent: CrossAgentHandoffAgent,
  handoffs: readonly CrossAgentHandoff[] = SEED_HANDOFFS,
): readonly CrossAgentHandoff[] {
  return handoffs.filter(
    (handoff) => handoff.sourceAgent === agent || handoff.targetAgent === agent,
  );
}

export function getOpenHandoffs(
  handoffs: readonly CrossAgentHandoff[] = SEED_HANDOFFS,
): readonly CrossAgentHandoff[] {
  return handoffs.filter(
    (handoff) =>
      handoff.state === 'proposed' ||
      handoff.state === 'accepted' ||
      handoff.state === 'deferred',
  );
}

export function validateCrossAgentHandoff(
  handoff: CrossAgentHandoff,
): CrossAgentHandoffValidationResult {
  const reasons: string[] = [];

  if (handoff.sourceAgent === handoff.targetAgent) {
    reasons.push('sourceAgent must differ from targetAgent');
  }
  if (!handoff.audit || handoff.audit.rationale.trim().length === 0) {
    reasons.push('audit.rationale must be non-empty');
  }
  if (!handoff.audit || handoff.audit.expectedResolution.trim().length === 0) {
    reasons.push('audit.expectedResolution must be non-empty');
  }
  if (!handoff.workObject || handoff.workObject.id.trim().length === 0) {
    reasons.push('workObject.id must be non-empty');
  }
  if (!handoff.workObject || handoff.workObject.label.trim().length === 0) {
    reasons.push('workObject.label must be non-empty');
  }
  if (
    handoff.state === 'declined' &&
    (!handoff.declinedReason || handoff.declinedReason.trim().length === 0)
  ) {
    reasons.push('declined state requires declinedReason');
  }
  if (
    handoff.state === 'blocked' &&
    (!handoff.blockedReason || handoff.blockedReason.trim().length === 0)
  ) {
    reasons.push('blocked state requires blockedReason');
  }
  if (
    handoff.state === 'deferred' &&
    (!handoff.deferredReason || handoff.deferredReason.trim().length === 0)
  ) {
    reasons.push('deferred state requires deferredReason');
  }

  return {
    isValid: reasons.length === 0,
    reasons: Object.freeze(reasons),
  };
}
