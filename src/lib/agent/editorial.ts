import type { AgentContextBundle, EvidenceStrength } from './context-bundle';
import { computeStewardPosture } from './posture';

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
  primaryAction: (ctx: AgentContextBundle) => { label: string; href: string };
}

const TEMPLATES: Record<string, EditorialTemplate> = {
  'admin/architecture': {
    agentLabel: 'Atlas + Steward',
    title: 'Atlas + Steward editorial · Architecture posture',
    body: () =>
      'The architecture is credible as a SaaS operating experience with optional private data plane. The lab is planned, not deployed; do not claim customer-tenant operation yet.',
    primaryAction: () => ({
      label: 'Review lab',
      href: '/admin/architecture#lab',
    }),
  },
  'admin/production-readiness': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Readiness decision',
    body: (ctx) => {
      const productionCount = ctx.blockers.filter(
        (b) => b.productionImpact,
      ).length;
      const pilotCount = ctx.blockers.filter((b) => b.pilotImpact).length;
      return `Demo readiness is strong for ${ctx.tenant.name}. Pilot has ${pilotCount} blocker${pilotCount === 1 ? '' : 's'}. Production is blocked by ${productionCount} critical or high-impact issue${productionCount === 1 ? '' : 's'}.`;
    },
    primaryAction: () => ({
      label: 'Open blockers',
      href: '/admin/production-readiness#blockers',
    }),
  },
  'admin/connectors': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Connector readiness',
    body: (ctx) =>
      `${ctx.tenant.name} has no live connectors in this environment — all show stub or deferred status. Configure required connectors before pilot.`,
    primaryAction: () => ({
      label: 'Configure connectors',
      href: '/admin/connectors#config',
    }),
  },
  'admin/data-trust': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Trust ladder',
    body: () =>
      'Loaded artifacts are present from seed. Usable evidence is partial. Decision-grade evidence requires approved datasets and source-of-truth confirmations not yet in place.',
    primaryAction: () => ({
      label: 'Review datasets',
      href: '/admin/data-trust#datasets',
    }),
  },
  'admin/users-access': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Roles and risk',
    body: () =>
      'Roles seeded; SSO not yet configured. Tenant admin must assign owners before pilot. No live user provisioning runtime yet.',
    primaryAction: () => ({
      label: 'Review roles',
      href: '/admin/users-access#roles',
    }),
  },
  'admin/agent-readiness': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Agent posture',
    body: () =>
      'Agent identities and roles are defined. Live runtime deferred until model gateway and tool execution land. Today agents reason from deterministic context only.',
    primaryAction: () => ({
      label: 'Review postures',
      href: '/admin/agent-readiness#postures',
    }),
  },
  'admin/build-progress': {
    agentLabel: 'Steward',
    title: 'Steward editorial · Build governance',
    body: () =>
      'Wireframes and backlog are now authoritative. Next build should close remaining wireframe deviations, not add unrelated breadth.',
    primaryAction: () => ({
      label: 'Open next wave',
      href: '/admin/build-progress#next-wave',
    }),
  },
  'admin/overview': {
    agentLabel: 'Steward',
    title: 'Steward editorial · What needs setup',
    body: (ctx) =>
      `Demo posture is strong for ${ctx.tenant.name}. Pilot requires data trust loaded, connectors configured, users granted, agent readiness reviewed, production readiness assessed.`,
    primaryAction: () => ({
      label: 'Open Production Readiness',
      href: '/admin/production-readiness',
    }),
  },
};

const DEFAULT_TEMPLATE: EditorialTemplate = {
  agentLabel: 'Steward',
  title: 'Steward editorial · Surface posture',
  body: (ctx) =>
    `${ctx.tenant.name} surface posture is being assessed. Limited context available.`,
  primaryAction: () => ({
    label: 'Open Production Readiness',
    href: '/admin/production-readiness',
  }),
};

export function generateStewardEditorial(
  ctx: AgentContextBundle,
): EditorialCard {
  const key = `${ctx.surface}/${ctx.page}`;
  const tmpl = TEMPLATES[key] ?? DEFAULT_TEMPLATE;
  const stewardPosture = computeStewardPosture(ctx);
  const blocker =
    stewardPosture.state === 'BLOCKED'
      ? stewardPosture.reason.replace(/^Critical production blocker:\s*/, '')
      : stewardPosture.state === 'PARTIAL'
        ? stewardPosture.reason.replace(/^Pilot-impact blocker:\s*/, '')
        : null;
  return {
    agentLabel: tmpl.agentLabel,
    title: tmpl.title,
    body: tmpl.body(ctx),
    contextUsed: ctx.contextSources.map((s) => s.label),
    evidenceStrength: ctx.evidence.strength,
    blocker,
    primaryAction: tmpl.primaryAction(ctx),
  };
}
