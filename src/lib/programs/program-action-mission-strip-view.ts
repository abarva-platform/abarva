// PROG14 · Program Action / Agent Mission / Resume Strip view-model.
//
// Pure, deterministic view-model that powers the
// ProgramActionMissionStrip component. The strip is a calm, read-only
// orientation surface anchoring three things on a program detail page:
//
//   1. A "Resume" mini-callout pointing at the last open work item.
//   2. The next three actions, each owned by a single agent.
//   3. The four canonical agent missions (Nexus, Sentinel, Atlas,
//      Steward), one row per agent.
//   4. A short list of currently blocked / deferred items, each with
//      the agent that would unblock it.
//
// This module performs NO live execution, NO writes, NO model calls,
// NO chat synthesis. It exists to give the Maestro a calm "where do
// we stand" surface on a program detail. The data is hardcoded and
// seed-aligned; live wiring is intentionally deferred.

export type StripAgentKey = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export type StripActionState =
  | 'next'
  | 'in-progress'
  | 'blocked'
  | 'deferred';

export interface ProgramTopAction {
  actionId: string;
  label: string;
  ownerAgent: StripAgentKey;
  state: StripActionState;
  rationale: string;
  stopCondition: string;
}

export interface AgentMissionRow {
  agent: StripAgentKey;
  mission: string;
  detail: string;
  state: StripActionState;
}

export interface ProgramResumeAction {
  actionId: string;
  label: string;
  routeHint: string;
  rationale: string;
}

export interface BlockedItem {
  itemId: string;
  label: string;
  blockedBy: string;
  unblockedBy: StripAgentKey;
}

export interface ProgramActionMissionStripViewModel {
  programLabel: string;
  topActions: ProgramTopAction[];
  agentMissions: AgentMissionRow[];
  resumeAction: ProgramResumeAction;
  blockedItems: BlockedItem[];
  caveat: string;
  generatedAt: string;
}

export interface ProgramActionMissionStripInput {
  programLabel?: string;
}

const DEFAULT_PROGRAM_LABEL = 'Apex Retail · CDP Activation';

const TOP_ACTIONS: ProgramTopAction[] = [
  {
    actionId: 'top-001',
    label: 'Schedule Synthesis Workshop 5',
    ownerAgent: 'nexus',
    state: 'next',
    rationale: 'Next gate input is workshop 5 outputs',
    stopCondition:
      'Workshop scheduled and confirmed by all required attendees',
  },
  {
    actionId: 'top-002',
    label: 'Confirm value hypothesis evidence trace',
    ownerAgent: 'sentinel',
    state: 'in-progress',
    rationale: 'Evidence chain incomplete for primary value claim',
    stopCondition: 'Evidence trace covers all primary claims',
  },
  {
    actionId: 'top-003',
    label: 'Brief executive sponsor on BAFO posture',
    ownerAgent: 'atlas',
    state: 'next',
    rationale: 'BAFO commercial posture needed before design phase',
    stopCondition: 'Sponsor brief delivered and acknowledged',
  },
];

const AGENT_MISSIONS: AgentMissionRow[] = [
  {
    agent: 'nexus',
    mission: 'Orchestrate Synthesis workshop and consolidate outputs',
    detail: 'Workshop 5 attendee confirmation pending two SMEs',
    state: 'in-progress',
  },
  {
    agent: 'sentinel',
    mission: 'Validate evidence trace for value hypothesis',
    detail:
      'Privacy boundary and consent rules need explicit citation',
    state: 'in-progress',
  },
  {
    agent: 'atlas',
    mission: 'Prepare BAFO commercial posture brief',
    detail: 'Sponsor alignment scheduled for next week',
    state: 'next',
  },
  {
    agent: 'steward',
    mission: 'Review Synthesis → Design gate readiness',
    detail:
      'Cannot advance until workshop 5 complete and value hypothesis evidence locked',
    state: 'blocked',
  },
];

const RESUME_ACTION: ProgramResumeAction = {
  actionId: 'resume-001',
  label: 'Resume on Synthesis Workshop preparation',
  routeHint: 'Workshop canvas → agenda',
  rationale: 'Last activity was reviewing the Synthesis workshop agenda.',
};

const BLOCKED_ITEMS: BlockedItem[] = [
  {
    itemId: 'blk-001',
    label: 'Synthesis → Design gate',
    blockedBy: 'Workshop 5 not yet held',
    unblockedBy: 'nexus',
  },
  {
    itemId: 'blk-002',
    label: 'Privacy boundary statement',
    blockedBy: 'Privacy office input pending',
    unblockedBy: 'steward',
  },
];

const CAVEAT =
  'Action and mission strip is deterministic and seed-backed. Actions cannot be executed from this surface; this is a calm read-only orientation strip. No live workflow writes.';

const GENERATED_AT = '2026-04-26';

export function buildProgramActionMissionStripView(
  input?: ProgramActionMissionStripInput,
): ProgramActionMissionStripViewModel {
  const programLabel = input?.programLabel ?? DEFAULT_PROGRAM_LABEL;
  return {
    programLabel,
    topActions: TOP_ACTIONS.map((action) => ({ ...action })),
    agentMissions: AGENT_MISSIONS.map((row) => ({ ...row })),
    resumeAction: { ...RESUME_ACTION },
    blockedItems: BLOCKED_ITEMS.map((item) => ({ ...item })),
    caveat: CAVEAT,
    generatedAt: GENERATED_AT,
  };
}
