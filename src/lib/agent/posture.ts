import type { AgentContextBundle } from './context-bundle';

export type AgentRole = 'steward' | 'nexus' | 'sentinel' | 'atlas';
export type AgentPostureState = 'BLOCKED' | 'PARTIAL' | 'THIN' | 'READY';

export interface AgentPosture {
  agent: AgentRole;
  state: AgentPostureState;
  reason: string;
  unblockBy: string | null;
}

export function computeStewardPosture(ctx: AgentContextBundle): AgentPosture {
  if (ctx.tenant.tier === 'shell_only') {
    return {
      agent: 'steward',
      state: 'THIN',
      reason: 'Shell-only tenant has no setup data to govern.',
      unblockBy: 'Promote tenant tier or load setup manifest.',
    };
  }
  const productionBlocker = ctx.blockers.find(
    (b) => b.productionImpact && b.severity === 'critical',
  );
  if (productionBlocker) {
    return {
      agent: 'steward',
      state: 'BLOCKED',
      reason: `Critical production blocker: ${productionBlocker.title}`,
      unblockBy: `Resolve: ${productionBlocker.impactedComponent}`,
    };
  }
  const pilotBlocker = ctx.blockers.find((b) => b.pilotImpact);
  if (pilotBlocker) {
    return {
      agent: 'steward',
      state: 'PARTIAL',
      reason: `Pilot-impact blocker: ${pilotBlocker.title}`,
      unblockBy: `Resolve: ${pilotBlocker.impactedComponent}`,
    };
  }
  if (ctx.evidence.strength === 'thin') {
    return {
      agent: 'steward',
      state: 'THIN',
      reason: 'Evidence is thin — cannot fully gate readiness.',
      unblockBy: 'Load decision-grade evidence.',
    };
  }
  return {
    agent: 'steward',
    state: 'READY',
    reason: 'Setup posture is clean.',
    unblockBy: null,
  };
}

export function computeNexusPosture(ctx: AgentContextBundle): AgentPosture {
  if (ctx.tenant.tier === 'shell_only') {
    return {
      agent: 'nexus',
      state: 'THIN',
      reason: 'No workflow to orchestrate.',
      unblockBy: 'Onboard tenant.',
    };
  }
  if (ctx.tenant.tier === 'thin') {
    return {
      agent: 'nexus',
      state: 'THIN',
      reason: 'Thin tenant — limited workflow context.',
      unblockBy: 'Promote to rich tier.',
    };
  }
  if (ctx.surface === 'programs' || ctx.surface === 'source') {
    return {
      agent: 'nexus',
      state: 'PARTIAL',
      reason:
        'Workflow orchestration available for demo; live runtime deferred.',
      unblockBy: 'Wire model gateway (Wave 27).',
    };
  }
  return {
    agent: 'nexus',
    state: 'PARTIAL',
    reason: 'Orchestration model defined; runtime deferred.',
    unblockBy: 'Wire model gateway.',
  };
}

export function computeSentinelPosture(ctx: AgentContextBundle): AgentPosture {
  if (ctx.tenant.tier === 'shell_only') {
    return {
      agent: 'sentinel',
      state: 'THIN',
      reason: 'No evidence to scan.',
      unblockBy: 'Load evidence manifest.',
    };
  }
  if (ctx.evidence.strength === 'thin') {
    return {
      agent: 'sentinel',
      state: 'THIN',
      reason: 'Evidence is thin.',
      unblockBy: 'Load decision-grade evidence.',
    };
  }
  if (ctx.evidence.strength === 'partial') {
    return {
      agent: 'sentinel',
      state: 'PARTIAL',
      reason: 'Some evidence; missing approvals.',
      unblockBy: 'Approve datasets.',
    };
  }
  return {
    agent: 'sentinel',
    state: 'PARTIAL',
    reason: 'Evidence strong; live signal deferred.',
    unblockBy: 'Wire live signal feed.',
  };
}

export function computeAtlasPosture(ctx: AgentContextBundle): AgentPosture {
  if (ctx.tenant.tier === 'shell_only') {
    return {
      agent: 'atlas',
      state: 'THIN',
      reason: 'No portfolio to assess.',
      unblockBy: 'Onboard tenant.',
    };
  }
  if (ctx.tenant.tier === 'thin') {
    return {
      agent: 'atlas',
      state: 'THIN',
      reason: 'Thin tenant — no live KPIs.',
      unblockBy: 'Promote to rich tier with metrics feed.',
    };
  }
  return {
    agent: 'atlas',
    state: 'THIN',
    reason: 'Executive metrics deferred to live data plane.',
    unblockBy: 'Wire metrics gateway.',
  };
}

export function computeAllPostures(
  ctx: AgentContextBundle,
): ReadonlyArray<AgentPosture> {
  return [
    computeStewardPosture(ctx),
    computeNexusPosture(ctx),
    computeSentinelPosture(ctx),
    computeAtlasPosture(ctx),
  ];
}
