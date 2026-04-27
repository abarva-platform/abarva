import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import type { ContextLiveStatus } from '@/components/admin/ContextBar';

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
  return {
    eyebrow: 'How AbarVa works end to end',
    title: 'Architecture',
    subtitle:
      'The canvas explains the app, agents, context, evidence, data plane, gateway, tools, governance, and Azure/private data-plane target.',
    context: {
      tenant: 'Apex Retail',
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: 'Atlas + Steward editorial · Architecture posture',
      body: 'The architecture is credible as a SaaS operating experience with optional private data plane. The lab is planned, not deployed; do not claim customer-tenant operation yet.',
      contextUsed: ['architecture docs', 'Azure lab blueprint', 'data trust model'],
      evidenceStrength: 'strong',
      blocker: 'lab not deployed',
      primaryAction: { label: 'Review lab', href: '/admin/architecture#lab' },
    },
    planes: ARCHITECTURE_PLANES,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Azure story',
    primaryActionHref: '/admin/architecture#azure',
    deterministicSeed: true,
  };
}
