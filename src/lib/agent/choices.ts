// AGENT1A/AGENT1B foundation: deterministic guided choices over agent context.
//
// Builds the "3 choices + custom" set from blockers, pending decisions, and
// evidence gaps. No live model calls. Ranking is deterministic.

import type { AgentContextBundle } from './context-bundle';

export interface AgentChoice {
  id: string;
  category: 'resolve_blocker' | 'pending_decision' | 'evidence_gap' | 'explore' | 'custom';
  label: string;
  href: string;
  why: string;
}

function blockerHrefFor(ctx: AgentContextBundle, blockerId: string): string {
  if (ctx.surface === 'admin') {
    return `/admin/${ctx.page}#${blockerId}`;
  }
  return `#${blockerId}`;
}

function decisionHrefFor(ctx: AgentContextBundle, decisionId: string): string {
  if (ctx.surface === 'admin') {
    return `/admin/${ctx.page}#decision-${decisionId}`;
  }
  return `#decision-${decisionId}`;
}

/**
 * Build the deterministic set of guided choices for the current context.
 *
 * Ranking:
 *   1. Critical blockers
 *   2. Other blockers
 *   3. Pending decisions
 *   4. Evidence gap nudges (when evidence is thin/partial)
 *   5. Generic "explore" fallback
 *
 * Always appends a "custom" affordance at the end so the user is not boxed in.
 */
export function buildAgentChoices(
  ctx: AgentContextBundle,
  max: number = 3,
): ReadonlyArray<AgentChoice> {
  const choices: AgentChoice[] = [];

  const sortedBlockers = [...ctx.blockers].sort((a, b) => {
    const order: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });

  for (const blocker of sortedBlockers) {
    if (choices.length >= max) break;
    choices.push({
      id: `blocker-${blocker.id}`,
      category: 'resolve_blocker',
      label: `Resolve ${blocker.label}`,
      href: blockerHrefFor(ctx, blocker.id),
      why: `Severity: ${blocker.severity}`,
    });
  }

  for (const decision of ctx.pendingDecisions) {
    if (choices.length >= max) break;
    choices.push({
      id: `decision-${decision.id}`,
      category: 'pending_decision',
      label: `Decide ${decision.label}`,
      href: decisionHrefFor(ctx, decision.id),
      why: 'Pending decision',
    });
  }

  if (
    choices.length < max
    && (ctx.evidence.strength === 'thin' || ctx.evidence.strength === 'partial')
  ) {
    choices.push({
      id: 'evidence-strengthen',
      category: 'evidence_gap',
      label: 'Strengthen evidence',
      href: ctx.surface === 'admin' ? '/admin/data-trust' : '#evidence',
      why: `Evidence is ${ctx.evidence.strength}`,
    });
  }

  if (choices.length === 0) {
    choices.push({
      id: 'explore',
      category: 'explore',
      label: 'Explore this surface',
      href: ctx.surface === 'admin' ? `/admin/${ctx.page}` : '#',
      why: 'No open blockers or decisions',
    });
  }

  // Always append a custom affordance.
  choices.push({
    id: 'custom',
    category: 'custom',
    label: 'Ask Steward something else',
    href: '#ask',
    why: 'Open-ended prompt',
  });

  return choices;
}
