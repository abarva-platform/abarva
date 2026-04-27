import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';

export type OverviewSetupStatus = 'done' | 'in_progress' | 'pending';

export interface OverviewSetupItem {
  id: string;
  label: string;
  status: OverviewSetupStatus;
  description: string;
}

export interface OverviewPageView {
  eyebrow: string;
  title: string;
  subtitle: string;
  context: {
    tenant: string;
    mode: string;
    agent: string;
    data: string;
    liveStatus: string;
    liveStatusKind: ContextLiveStatus;
  };
  editorial: {
    title: string;
    body: string;
    contextUsed: ReadonlyArray<string>;
    evidenceStrength: EvidenceStrength;
    blocker?: string;
    primaryAction: { label: string; href: string };
  };
  setupItems: ReadonlyArray<OverviewSetupItem>;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
}

const SETUP_ITEMS: ReadonlyArray<OverviewSetupItem> = [
  {
    id: 'data-trust',
    label: 'Data Trust',
    status: 'in_progress',
    description: 'Loaded artifacts present; usable evidence partial.',
  },
  {
    id: 'connectors',
    label: 'Connectors',
    status: 'pending',
    description: '6 external systems, none live; stubs and deferred only.',
  },
  {
    id: 'users-access',
    label: 'Users & Access',
    status: 'pending',
    description: 'Roles seeded; live invite + SSO not wired.',
  },
  {
    id: 'agent-readiness',
    label: 'Agent Readiness',
    status: 'in_progress',
    description: 'Steward / Nexus / Sentinel / Atlas posture inventoried.',
  },
  {
    id: 'production-readiness',
    label: 'Production Readiness',
    status: 'in_progress',
    description: 'Demo ready; pilot partial; production blocked.',
  },
  {
    id: 'architecture',
    label: 'Architecture',
    status: 'in_progress',
    description: 'Planes documented; private data plane lab not deployed.',
  },
];

export function buildOverviewPageView(): OverviewPageView {
  return {
    eyebrow: 'Steward-led control plane orientation',
    title: 'Setup overview',
    subtitle:
      'What needs setup before AbarVa can run a tenant in pilot. The Steward holds this control plane.',
    context: {
      tenant: 'Apex Retail',
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: 'Steward editorial · What needs setup',
      body:
        'Demo posture is strong. Pilot requires data trust loaded, connectors configured, users granted, agent readiness reviewed, and production readiness assessed. None of these are claimed live in this environment.',
      contextUsed: ['admin shell config', 'readiness manifest', 'connector readiness'],
      evidenceStrength: 'partial',
      primaryAction: { label: 'Review Production Readiness', href: '/admin/production-readiness' },
    },
    setupItems: SETUP_ITEMS,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Production Readiness',
    primaryActionHref: '/admin/production-readiness',
    deterministicSeed: true,
  };
}
