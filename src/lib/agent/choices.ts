import type { AgentContextBundle } from './context-bundle';

export type ChoiceCategory =
  | 'resolve_blocker'
  | 'open_evidence'
  | 'review_decision'
  | 'configure';

export interface AgentChoice {
  id: string;
  category: ChoiceCategory;
  label: string;
  href: string;
  why: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function buildAgentChoices(
  ctx: AgentContextBundle,
  max: number = 3,
): ReadonlyArray<AgentChoice> {
  const choices: AgentChoice[] = [];

  // Choice 1+: top blockers
  const sortedBlockers = [...ctx.blockers].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99),
  );
  for (const b of sortedBlockers) {
    choices.push({
      id: `resolve-${b.id}`,
      category: 'resolve_blocker',
      label: `Resolve blocker: ${b.title}`,
      href: `/admin/production-readiness#${b.id}`,
      why: `${b.severity} severity — impacts ${b.impactedComponent}`,
    });
  }

  // Choice: pending decisions
  for (const d of ctx.pendingDecisions) {
    choices.push({
      id: `decide-${d.id}`,
      category: 'review_decision',
      label: d.label,
      href: `/admin/production-readiness#decision-${d.id}`,
      why: `Owner: ${d.owner}`,
    });
  }

  // Choice: evidence if thin
  if (ctx.evidence.strength === 'thin' && ctx.tenant.tier !== 'shell_only') {
    choices.push({
      id: 'load-evidence',
      category: 'open_evidence',
      label: 'Load decision-grade evidence',
      href: '/admin/data-trust',
      why: 'Evidence is thin — Sentinel cannot reason without sources.',
    });
  }

  return choices.slice(0, max);
}
