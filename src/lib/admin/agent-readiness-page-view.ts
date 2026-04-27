import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { DEFAULT_AGENT_CARDS, type AgentCardModel, type AgentPosture } from './admin-shell-config';

export interface AgentPostureRow extends AgentCardModel {
  summary: string;
  topGap: string;
}

export interface AgentReadinessPageView {
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
  agents: ReadonlyArray<AgentPostureRow>;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
}

const AGENT_DETAIL: Record<AgentCardModel['id'], { summary: string; topGap: string }> = {
  steward: {
    summary: 'Holds the gate, access, and readiness posture across the tenant.',
    topGap: 'Live access mutation pipeline not wired',
  },
  nexus: {
    summary: 'Workflow orchestration over deterministic mission queue.',
    topGap: 'Live mission queue not connected',
  },
  sentinel: {
    summary: 'Pattern detection over evidence ledger.',
    topGap: 'Confidence scoring not wired to live evidence',
  },
  atlas: {
    summary: 'Executive tradeoff briefing across portfolio.',
    topGap: 'Pressure cards run on seed data only',
  },
};

function postureBlocker(posture: AgentPosture): boolean {
  return posture === 'BLOCKED';
}

export function buildAgentReadinessPageView(): AgentReadinessPageView {
  const agents: ReadonlyArray<AgentPostureRow> = DEFAULT_AGENT_CARDS.map((agent) => ({
    ...agent,
    summary: AGENT_DETAIL[agent.id].summary,
    topGap: AGENT_DETAIL[agent.id].topGap,
  }));

  const blockedCount = agents.filter((a) => postureBlocker(a.posture)).length;

  return {
    eyebrow: 'Agent posture across the four agents',
    title: 'Agent Readiness',
    subtitle:
      'Steward / Nexus / Sentinel / Atlas posture. Static manifest — not live agent execution.',
    context: {
      tenant: 'Apex Retail',
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: 'Steward editorial · Agent posture',
      body:
        'Each agent is reviewed against mission queue, context injection, evidence integration, and audit trail readiness. Posture is honest — no agent claims live operation in this environment.',
      contextUsed: ['agent readiness deep drill', 'admin shell config', 'mission queue model'],
      evidenceStrength: 'partial',
      blocker: blockedCount > 0 ? `${blockedCount} agent blocked` : undefined,
      primaryAction: { label: 'Open agent readiness drill', href: '/admin/agent-readiness#drill' },
    },
    agents,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Steward posture',
    primaryActionHref: '/admin/agent-readiness#steward',
    deterministicSeed: true,
  };
}
