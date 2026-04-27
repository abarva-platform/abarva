import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';

export interface ArchitecturePlane {
  id: string;
  label: string;
  components: ReadonlyArray<string>;
}

export interface ArchitecturePageView {
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
  planes: ReadonlyArray<ArchitecturePlane>;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
}

export const ARCHITECTURE_PLANES: ReadonlyArray<ArchitecturePlane> = [
  { id: 'app', label: 'App Plane', components: ['Programs', 'Source', 'Intelligence', 'Tower', 'Admin'] },
  { id: 'agent', label: 'Agent Plane', components: ['Nexus', 'Sentinel', 'Atlas', 'Steward'] },
  { id: 'context', label: 'Context Plane', components: ['Work object', 'state', 'evidence', 'missing inputs'] },
  { id: 'evidence', label: 'Evidence Plane', components: ['Datasets', 'artifacts', 'claims', 'confidence'] },
  { id: 'data', label: 'Data Plane', components: ['Postgres', 'Blob', 'vector/search', 'graph'] },
  { id: 'gateway', label: 'Gateway + Tools', components: ['Policy', 'audit', 'cost', 'redaction'] },
  { id: 'deployment', label: 'Deployment', components: ['SaaS', 'dedicated tenant', 'private data plane'] },
];

export function buildArchitecturePageView(): ArchitecturePageView {
  const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  return {
    eyebrow: 'How AbarVa works end to end',
    title: 'Architecture',
    subtitle:
      'The canvas explains the app, agents, context, evidence, data plane, gateway, tools, governance, and Azure/private data-plane target.',
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
    planes: ARCHITECTURE_PLANES,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Azure story',
    primaryActionHref: '/admin/architecture#azure',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
