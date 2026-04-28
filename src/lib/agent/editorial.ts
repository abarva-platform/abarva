// AGENT1A/AGENT1B foundation: deterministic editorial cards over agent context.
//
// Per-surface/page templates produce the editorial title + body + context
// + primary action consumed by Steward editorial cards across the app.
// No live model calls. Strings are deterministic for a given context.

import type {
  AgentContextBundle,
  EvidenceStrength,
} from './context-bundle';

export interface EditorialCard {
  agentLabel: string;
  title: string;
  body: string;
  contextUsed: ReadonlyArray<string>;
  evidenceStrength: EvidenceStrength;
  blocker: string | null;
  primaryAction: { label: string; href: string };
}

interface EditorialTemplate {
  agentLabel: string;
  title: string;
  body: (ctx: AgentContextBundle) => string;
  primaryAction: { label: string; href: string };
}

const ADMIN_TEMPLATES: Record<string, EditorialTemplate> = {
  architecture: {
    agentLabel: 'Atlas + Steward',
    title: 'Atlas + Steward editorial · Architecture posture',
    body: () =>
      'The architecture is credible as a SaaS operating experience with optional private data plane. The lab is planned, not deployed; do not claim customer-tenant operation yet.',
    primaryAction: { label: 'Review lab', href: '/admin/architecture#lab' },
  },
  'production-readiness': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Readiness decision',
    body: () =>
      'Demo readiness is strong for Apex Retail. Pilot is partial. Production is blocked by live audit, model gateway execution, tenant security review, and Azure private data-plane proof.',
    primaryAction: {
      label: 'Open blockers',
      href: '/admin/production-readiness#blockers',
    },
  },
  overview: {
    agentLabel: 'Steward',
    title: 'Steward editorial · What needs setup',
    body: () =>
      'Demo posture is strong. Pilot requires data trust loaded, connectors configured, users granted, agent readiness reviewed, and production readiness assessed. None of these are claimed live in this environment.',
    primaryAction: {
      label: 'Review Production Readiness',
      href: '/admin/production-readiness',
    },
  },
  'data-trust': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Trust ladder',
    body: () =>
      'Loaded artifacts are present from seed. Usable evidence is partial. Decision-grade evidence requires approved datasets and source-of-truth confirmations not yet in place.',
    primaryAction: {
      label: 'Review datasets',
      href: '/admin/data-trust#datasets',
    },
  },
  connectors: {
    agentLabel: 'Steward',
    title: 'Steward editorial · Connector readiness',
    body: () =>
      '0 of 0 connectors configured as stubs. None are live in this environment. Pilot cannot proceed until pilot-required connectors clear Steward review.',
    primaryAction: {
      label: 'Configure connectors',
      href: '/admin/connectors#config',
    },
  },
  'users-access': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Access posture',
    body: () =>
      'Roles and seat counts are seeded deterministically. SSO is not yet configured. Invite, revoke, and permission edit pipelines are not wired in this environment.',
    primaryAction: {
      label: 'Review roles',
      href: '/admin/users-access#roles',
    },
  },
  'agent-readiness': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Agent posture',
    body: () =>
      'Each agent is reviewed against mission queue, context injection, evidence integration, and audit trail readiness. Posture is honest — no agent claims live operation in this environment.',
    primaryAction: {
      label: 'Open agent readiness drill',
      href: '/admin/agent-readiness#drill',
    },
  },
  'build-progress': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Build posture',
    body: () =>
      '0 waves merged. Admin redesign in progress. The page does not poll CI or Vercel; it reflects the canonical build manifest only.',
    primaryAction: {
      label: 'Open build dashboard',
      href: '/platform/admin/build-progress',
    },
  },
};

const FALLBACK_TEMPLATE: EditorialTemplate = {
  agentLabel: 'Steward',
  title: 'Steward editorial',
  body: (ctx) =>
    ctx.contextSources.length === 0
      ? 'No context loaded for this surface yet. Steward cannot speak with confidence.'
      : `Context loaded from ${ctx.contextSources.length} source(s); evidence is ${ctx.evidence.strength}.`,
  primaryAction: { label: 'Review setup', href: '/admin' },
};

function lookupTemplate(ctx: AgentContextBundle): EditorialTemplate {
  if (ctx.surface === 'admin') {
    return ADMIN_TEMPLATES[ctx.page] ?? FALLBACK_TEMPLATE;
  }
  return FALLBACK_TEMPLATE;
}

function blockerLabel(ctx: AgentContextBundle): string | null {
  if (ctx.blockers.length === 0) return null;
  // Prefer the first critical, else the first overall.
  const critical = ctx.blockers.find((b) => b.severity === 'critical');
  return (critical ?? ctx.blockers[0]).label;
}

/**
 * Generate the canonical Steward editorial card for the given context.
 * Deterministic. Pure function over the AgentContextBundle.
 */
export function generateStewardEditorial(
  ctx: AgentContextBundle,
): EditorialCard {
  const template = lookupTemplate(ctx);
  return {
    agentLabel: template.agentLabel,
    title: template.title,
    body: template.body(ctx),
    contextUsed: ctx.contextSources.map((s) => s.label),
    evidenceStrength: ctx.evidence.strength,
    blocker: blockerLabel(ctx),
    primaryAction: template.primaryAction,
  };
}
