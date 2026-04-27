import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext, buildAgentContextAsync } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';

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
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
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

export async function buildOverviewPageView(): Promise<OverviewPageView> {
  const ctx = await buildAgentContextAsync('apex-retail', 'admin', 'overview');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  return {
    eyebrow: 'Steward-led control plane orientation',
    title: 'Setup overview',
    subtitle:
      'What needs setup before AbarVa can run a tenant in pilot. The Steward holds this control plane.',
    context: {
      tenant: ctx.tenant.name,
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: editorial.title,
      body: editorial.body,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: editorial.blocker ?? undefined,
      primaryAction: editorial.primaryAction,
    },
    setupItems: SETUP_ITEMS,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Production Readiness',
    primaryActionHref: '/admin/production-readiness',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
