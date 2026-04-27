// AGENT1A/AGENT1B foundation: per-agent posture computed from agent context.
//
// Each of the four agents (Steward / Nexus / Sentinel / Atlas) gets a
// posture: BLOCKED / PARTIAL / THIN / READY. Computed deterministically
// from the AgentContextBundle. No live calls.

import type { AgentContextBundle } from './context-bundle';

export type AgentRole = 'steward' | 'nexus' | 'sentinel' | 'atlas';

export type AgentPostureState = 'BLOCKED' | 'PARTIAL' | 'THIN' | 'READY';

export interface AgentPosture {
  agent: AgentRole;
  state: AgentPostureState;
  reason: string;
  unblockBy: string | null;
}

function hasCriticalBlocker(ctx: AgentContextBundle): boolean {
  return ctx.blockers.some((b) => b.severity === 'critical');
}

function hasAnyBlocker(ctx: AgentContextBundle): boolean {
  return ctx.blockers.length > 0;
}

function evidenceTier(ctx: AgentContextBundle): AgentPostureState {
  if (ctx.evidence.strength === 'strong') return 'READY';
  if (ctx.evidence.strength === 'partial') return 'PARTIAL';
  return 'THIN';
}

export function computeStewardPosture(ctx: AgentContextBundle): AgentPosture {
  if (hasCriticalBlocker(ctx)) {
    const blocker = ctx.blockers.find((b) => b.severity === 'critical');
    return {
      agent: 'steward',
      state: 'BLOCKED',
      reason: blocker ? `Steward blocked by ${blocker.label}` : 'Steward blocked',
      unblockBy: blocker?.label ?? null,
    };
  }
  if (hasAnyBlocker(ctx)) {
    const blocker = ctx.blockers[0];
    return {
      agent: 'steward',
      state: 'PARTIAL',
      reason: `Steward partial: ${blocker.label}`,
      unblockBy: blocker.label,
    };
  }
  const tier = evidenceTier(ctx);
  return {
    agent: 'steward',
    state: tier,
    reason:
      tier === 'READY'
        ? 'Steward ready: evidence strong'
        : tier === 'PARTIAL'
          ? 'Steward partial: evidence partial'
          : 'Steward thin: evidence thin',
    unblockBy: null,
  };
}

export function computeNexusPosture(ctx: AgentContextBundle): AgentPosture {
  // Nexus needs decisions to orchestrate.
  if (hasCriticalBlocker(ctx)) {
    return {
      agent: 'nexus',
      state: 'BLOCKED',
      reason: 'Nexus cannot orchestrate while critical blockers are open',
      unblockBy: ctx.blockers.find((b) => b.severity === 'critical')?.label ?? null,
    };
  }
  if (ctx.pendingDecisions.length === 0 && ctx.blockers.length === 0) {
    return {
      agent: 'nexus',
      state: evidenceTier(ctx) === 'THIN' ? 'THIN' : 'READY',
      reason: 'Nexus has no open work',
      unblockBy: null,
    };
  }
  if (hasAnyBlocker(ctx)) {
    return {
      agent: 'nexus',
      state: 'PARTIAL',
      reason: 'Nexus partial: open blockers',
      unblockBy: ctx.blockers[0].label,
    };
  }
  return {
    agent: 'nexus',
    state: 'PARTIAL',
    reason: 'Nexus partial: pending decisions',
    unblockBy: ctx.pendingDecisions[0]?.label ?? null,
  };
}

export function computeSentinelPosture(ctx: AgentContextBundle): AgentPosture {
  // Sentinel is gated on evidence quality.
  const tier = evidenceTier(ctx);
  if (tier === 'THIN') {
    return {
      agent: 'sentinel',
      state: 'THIN',
      reason: 'Sentinel thin: evidence not yet decision-grade',
      unblockBy: 'evidence approvals',
    };
  }
  if (hasCriticalBlocker(ctx)) {
    return {
      agent: 'sentinel',
      state: 'BLOCKED',
      reason: 'Sentinel blocked: critical evidence/audit gap',
      unblockBy: ctx.blockers.find((b) => b.severity === 'critical')?.label ?? null,
    };
  }
  if (tier === 'PARTIAL') {
    return {
      agent: 'sentinel',
      state: 'PARTIAL',
      reason: 'Sentinel partial: evidence partial',
      unblockBy: 'decision-grade approvals',
    };
  }
  return {
    agent: 'sentinel',
    state: 'READY',
    reason: 'Sentinel ready',
    unblockBy: null,
  };
}

export function computeAtlasPosture(ctx: AgentContextBundle): AgentPosture {
  // Atlas summarizes posture for executives; needs context sources.
  if (ctx.contextSources.length === 0) {
    return {
      agent: 'atlas',
      state: 'THIN',
      reason: 'Atlas thin: no context sources',
      unblockBy: 'context loaded',
    };
  }
  if (hasCriticalBlocker(ctx)) {
    return {
      agent: 'atlas',
      state: 'PARTIAL',
      reason: 'Atlas partial: critical blockers in scope',
      unblockBy: ctx.blockers.find((b) => b.severity === 'critical')?.label ?? null,
    };
  }
  if (hasAnyBlocker(ctx)) {
    return {
      agent: 'atlas',
      state: 'PARTIAL',
      reason: 'Atlas partial: open blockers',
      unblockBy: ctx.blockers[0].label,
    };
  }
  return {
    agent: 'atlas',
    state: evidenceTier(ctx) === 'THIN' ? 'PARTIAL' : 'READY',
    reason: 'Atlas ready',
    unblockBy: null,
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
