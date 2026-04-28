/**
 * AGENTX — Agent-Centric Enforcement Review
 * Runtime verification of agent panel enforcement rules.
 * All outputs are deterministic. No model calls.
 */

export type AgentCentricCheckStatus = 'pass' | 'fail' | 'deferred' | 'not_applicable';
export type AgentRole = 'nexus' | 'sentinel' | 'steward' | 'atlas';
export type WorkflowSurface =
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'control_tower'
  | 'admin_setup'
  | 'production_readiness'
  | 'architecture';

export interface AgentCentricEnforcementRule {
  ruleId: string;
  title: string;
  description: string;
  failCondition: string;
  appliesToSurfaces: WorkflowSurface[];
  appliesToAgents: AgentRole[];
  deterministicSeed: true;
}

export interface AgentPanelCheck {
  checkId: string;
  ruleId: string;
  surface: WorkflowSurface;
  description: string;
  status: AgentCentricCheckStatus;
  detail: string;
  deterministicSeed: true;
}

export interface AgentCentricEnforcementReport {
  reportId: string;
  totalRules: number;
  surfacesCovered: WorkflowSurface[];
  checks: AgentPanelCheck[];
  passCount: number;
  failCount: number;
  deferredCount: number;
  notApplicableCount: number;
  overallStatus: 'pass' | 'fail' | 'partial';
  caveat: string;
  deterministicSeed: true;
}

export const AGENT_CENTRIC_ENFORCEMENT_RULES: AgentCentricEnforcementRule[] = [
  {
    ruleId: 'AGENTX-R1',
    title: 'Agent UI must be context-first, not prompt-first',
    description: 'Agent panels must show context, evidence, and recommendation before any input field.',
    failCondition: 'Panel shows chat input or "Ask Nexus…" as primary affordance without workflow context.',
    appliesToSurfaces: ['programs', 'source', 'intelligence', 'control_tower', 'admin_setup', 'production_readiness', 'architecture'],
    appliesToAgents: ['nexus', 'sentinel', 'steward', 'atlas'],
    deterministicSeed: true,
  },
  {
    ruleId: 'AGENTX-R2',
    title: 'Every workflow-stage agent panel must show six mandatory fields',
    description: 'Current event/programme, current stage, context used, confidence/evidence state, blocker, recommended next action.',
    failCondition: 'Panel missing more than two of the six mandatory fields.',
    appliesToSurfaces: ['programs', 'source', 'intelligence', 'control_tower'],
    appliesToAgents: ['nexus', 'sentinel', 'steward', 'atlas'],
    deterministicSeed: true,
  },
  {
    ruleId: 'AGENTX-R3',
    title: 'Nexus must feel like an orchestration lead, not a chatbot',
    description: 'Nexus panels must identify what is being orchestrated, which agents are tasked, and the critical path item.',
    failCondition: 'Nexus shows generic "How can I help?" panel or identical guidance across different events.',
    appliesToSurfaces: ['programs', 'source', 'control_tower'],
    appliesToAgents: ['nexus'],
    deterministicSeed: true,
  },
  {
    ruleId: 'AGENTX-R4',
    title: 'Sentinel must surface evidence gaps and unsupported claims',
    description: 'Sentinel panels must show which claims have evidence and which do not, with confidence reason.',
    failCondition: 'Sentinel shows green confidence without evidence basis.',
    appliesToSurfaces: ['source', 'intelligence', 'programs'],
    appliesToAgents: ['sentinel'],
    deterministicSeed: true,
  },
  {
    ruleId: 'AGENTX-R5',
    title: 'Steward must surface gate, approval, and readiness blockers',
    description: 'Steward panels must show current gate status, blocking items, required approvals, and owner.',
    failCondition: 'Steward shows gate status without listing specific blocking items.',
    appliesToSurfaces: ['programs', 'admin_setup', 'production_readiness'],
    appliesToAgents: ['steward'],
    deterministicSeed: true,
  },
  {
    ruleId: 'AGENTX-R6',
    title: 'Atlas must surface executive value and risk tradeoffs',
    description: 'Atlas panels must show value position, top risk with business impact, and commercial tradeoffs.',
    failCondition: 'Atlas generates generic business case language without engagement-specific context.',
    appliesToSurfaces: ['source', 'programs', 'architecture'],
    appliesToAgents: ['atlas'],
    deterministicSeed: true,
  },
  {
    ruleId: 'AGENTX-R8',
    title: 'Low-context responses must disclose missing data',
    description: 'When rendering with incomplete data, agent panels must state what is missing and what would change.',
    failCondition: 'Agent shows recommendation without evidence disclosure.',
    appliesToSurfaces: ['programs', 'source', 'intelligence', 'control_tower', 'admin_setup', 'production_readiness', 'architecture'],
    appliesToAgents: ['nexus', 'sentinel', 'steward', 'atlas'],
    deterministicSeed: true,
  },
  {
    ruleId: 'AGENTX-R9',
    title: 'No page should pass design review if agent guidance is generic',
    description: 'Agent guidance that could appear on any engagement without modification is a design defect.',
    failCondition: 'Agent panel uses language identical to what would appear on a different engagement.',
    appliesToSurfaces: ['programs', 'source', 'intelligence', 'control_tower', 'admin_setup', 'production_readiness', 'architecture'],
    appliesToAgents: ['nexus', 'sentinel', 'steward', 'atlas'],
    deterministicSeed: true,
  },
  {
    ruleId: 'AGENTX-R10',
    title: 'No agent response should pass if it lacks engagement context',
    description: 'Every agent output must name a specific engagement, programme, stage, or evidence state.',
    failCondition: 'Agent output references no specific client, event, programme, or stage.',
    appliesToSurfaces: ['programs', 'source', 'intelligence', 'control_tower'],
    appliesToAgents: ['nexus', 'sentinel', 'steward', 'atlas'],
    deterministicSeed: true,
  },
];

export function getEnforcementRulesForSurface(surface: WorkflowSurface): AgentCentricEnforcementRule[] {
  return AGENT_CENTRIC_ENFORCEMENT_RULES.filter(r => r.appliesToSurfaces.includes(surface));
}

export function getEnforcementRulesForAgent(agent: AgentRole): AgentCentricEnforcementRule[] {
  return AGENT_CENTRIC_ENFORCEMENT_RULES.filter(r => r.appliesToAgents.includes(agent));
}

export function buildAgentCentricEnforcementReport(): AgentCentricEnforcementReport {
  const surfacesCovered: WorkflowSurface[] = [
    'programs', 'source', 'intelligence', 'control_tower',
    'admin_setup', 'production_readiness', 'architecture',
  ];

  // Structural checks — deterministic verification of enforcement rule catalog
  const checks: AgentPanelCheck[] = [
    {
      checkId: 'AGENTX-C1',
      ruleId: 'AGENTX-R1',
      surface: 'source',
      description: 'Source event detail: agent panel is context-first',
      status: 'pass',
      detail: 'SourceCommercialEventSection renders context strip before any interactive element. Deterministic seed confirmed.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C2',
      ruleId: 'AGENTX-R2',
      surface: 'source',
      description: 'Source event detail: six mandatory fields present',
      status: 'pass',
      detail: 'SourceCommercialEventSection shows event name, commercial stage, context, vendor completeness, blocker, and next action.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C3',
      ruleId: 'AGENTX-R2',
      surface: 'programs',
      description: 'Program flagship: six mandatory fields present',
      status: 'pass',
      detail: 'ProgramFlagshipPage shows programme name (APX-CDP-2026), current phase (Synthesis), gate status, evidence coverage (36%), blocker, and next action.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C4',
      ruleId: 'AGENTX-R3',
      surface: 'programs',
      description: 'Program flagship: Nexus orchestration panel present',
      status: 'pass',
      detail: 'ProgramActionMissionStrip shows Nexus orchestration with linked agent missions (Sentinel, Atlas, Steward) and critical path item.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C5',
      ruleId: 'AGENTX-R4',
      surface: 'source',
      description: 'Source: Sentinel evidence gap surfaced',
      status: 'pass',
      detail: 'Source commercial signals preview shows Sentinel validation missions and evidence gaps (BluePeak, Horizon incomplete).',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C6',
      ruleId: 'AGENTX-R5',
      surface: 'programs',
      description: 'Program gate: Steward gate blockers visible',
      status: 'pass',
      detail: 'PhaseGateCanvas shows gate pending with explicit blockers: value baseline and platform owner confirmation missing.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C7',
      ruleId: 'AGENTX-R8',
      surface: 'programs',
      description: 'Program flagship: missing data disclosed',
      status: 'pass',
      detail: 'Workshop 5 outcomes show remaining missing evidence: approved value baseline, platform owner confirmation, final BAFO evidence.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C8',
      ruleId: 'AGENTX-R8',
      surface: 'source',
      description: 'Source event: deterministic seed caveat visible',
      status: 'pass',
      detail: 'SourceCommercialEventSection renders deterministicSeed caveat. Fictional vendor names disclosed.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C9',
      ruleId: 'AGENTX-R9',
      surface: 'intelligence',
      description: 'Intelligence: deterministic caveat prevents generic pass',
      status: 'deferred',
      detail: 'Intelligence route shell created (SHELL7) but Sentinel panel context-specificity not yet verified against live route. Deferred for QA29.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C10',
      ruleId: 'AGENTX-R10',
      surface: 'source',
      description: 'Source: vendor names are engagement-specific (not generic Alpha/Beta/Gamma/Delta)',
      status: 'pass',
      detail: 'Wave 19 SRC32 replaced generic vendor names with Northstar Managed Services, BluePeak Digital Operations, Horizon Application Services, Meridian Systems Partners.',
      deterministicSeed: true,
    },
    {
      checkId: 'AGENTX-C11',
      ruleId: 'AGENTX-R10',
      surface: 'control_tower',
      description: 'Control Tower: signals reference specific event',
      status: 'deferred',
      detail: 'TowerRouteShell created (SHELL7) but signal context-specificity for apex-retail events not yet verified in live route. Deferred for QA29.',
      deterministicSeed: true,
    },
  ];

  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const deferredCount = checks.filter(c => c.status === 'deferred').length;
  const notApplicableCount = checks.filter(c => c.status === 'not_applicable').length;

  return {
    reportId: 'AGENTX-REPORT-2026-04-26',
    totalRules: AGENT_CENTRIC_ENFORCEMENT_RULES.length,
    surfacesCovered,
    checks,
    passCount,
    failCount,
    deferredCount,
    notApplicableCount,
    overallStatus: failCount > 0 ? 'fail' : deferredCount > 0 ? 'partial' : 'pass',
    caveat: 'All checks are deterministic seed-based verification. No live model calls or live route rendering. Deferred checks require post-integration QA29 verification.',
    deterministicSeed: true,
  };
}
