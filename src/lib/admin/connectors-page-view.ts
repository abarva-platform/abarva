import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';
import {
  buildConnectorsReadinessView,
  type ConnectorReadiness,
} from './connectors-readiness-view';

export interface ConnectorsPageView {
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
  connectors: ReadonlyArray<ConnectorReadiness>;
  pilotBlockers: ReadonlyArray<ConnectorReadiness>;
  configuredCount: number;
  totalCount: number;
  caveat: string;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
}

export function buildConnectorsPageView(): ConnectorsPageView {
  const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const readiness = buildConnectorsReadinessView('apex-retail');

  // Connector body is data-dependent on the connector readiness loader.
  // The foundation editorial template provides title + contextUsed +
  // primaryAction; the body is composed against live counts.
  const connectorBody =
    `${readiness.configuredCount} of ${readiness.totalCount} connectors configured as stubs. ` +
    'None are live in this environment. Pilot cannot proceed until pilot-required connectors clear Steward review.';

  const blockerLabel =
    readiness.pilotBlockers.length > 0
      ? `${readiness.pilotBlockers.length} pilot blocker${readiness.pilotBlockers.length === 1 ? '' : 's'}`
      : undefined;

  return {
    eyebrow: 'External systems readiness',
    title: 'Connectors',
    subtitle:
      'Which external systems are configured, blocked, or deferred. None are live in this environment — all show stub or deferred status.',
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
      body: connectorBody,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: blockerLabel,
      primaryAction: editorial.primaryAction,
    },
    connectors: readiness.connectors,
    pilotBlockers: readiness.pilotBlockers,
    configuredCount: readiness.configuredCount,
    totalCount: readiness.totalCount,
    caveat: readiness.caveat,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Resolve connector blockers',
    primaryActionHref: '/admin/connectors#blockers',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
