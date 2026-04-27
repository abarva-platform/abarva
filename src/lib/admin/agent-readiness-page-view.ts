import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';
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
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
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
  const ctx = buildAgentContext('apex-retail', 'admin', 'agent-readiness');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const agents: ReadonlyArray<AgentPostureRow> = DEFAULT_AGENT_CARDS.map((agent) => ({
    ...agent,
    summary: AGENT_DETAIL[agent.id].summary,
    topGap: AGENT_DETAIL[agent.id].topGap,
  }));

  const blockedCount = agents.filter((a) => postureBlocker(a.posture)).length;
  const blockerLabel =
    editorial.blocker ?? (blockedCount > 0 ? `${blockedCount} agent blocked` : undefined);

  return {
    eyebrow: 'Agent posture across the four agents',
    title: 'Agent Readiness',
    subtitle:
      'Steward / Nexus / Sentinel / Atlas posture. Static manifest — not live agent execution.',
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
      blocker: blockerLabel,
      primaryAction: editorial.primaryAction,
    },
    agents,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Steward posture',
    primaryActionHref: '/admin/agent-readiness#steward',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
