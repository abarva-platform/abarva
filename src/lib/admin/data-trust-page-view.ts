import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';

export interface TrustLadderRung {
  id: string;
  label: string;
  count: number;
  description: string;
}

export interface DataTrustPageView {
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
  ladder: ReadonlyArray<TrustLadderRung>;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
}

const TRUST_LADDER: ReadonlyArray<TrustLadderRung> = [
  { id: 'loaded', label: 'Loaded', count: 14, description: 'Documents/datasets present in the workspace' },
  { id: 'available', label: 'Available', count: 11, description: 'Parsed, indexed, browseable' },
  { id: 'usable', label: 'Usable evidence', count: 7, description: 'Cited in Steward editorial cards' },
  { id: 'agent_usable', label: 'Agent-usable', count: 4, description: 'Approved for agent context' },
  { id: 'decision_grade', label: 'Decision-grade', count: 2, description: 'Approved for decisions/gates' },
];

export function buildDataTrustPageView(): DataTrustPageView {
  const ctx = buildAgentContext('apex-retail', 'admin', 'data-trust');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  return {
    eyebrow: 'Data trust posture',
    title: 'Data Trust',
    subtitle:
      'How loaded data becomes usable evidence — and what is not yet usable. Counts trace to the deterministic evidence manifest.',
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
    ladder: TRUST_LADDER,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open evidence ledger',
    primaryActionHref: '/admin/data-trust#evidence',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
