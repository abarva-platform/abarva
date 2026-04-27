import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
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
}

export function buildConnectorsPageView(): ConnectorsPageView {
  const readiness = buildConnectorsReadinessView('apex-retail');

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
      tenant: 'Apex Retail',
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: 'Steward editorial · Connector readiness',
      body:
        `${readiness.configuredCount} of ${readiness.totalCount} connectors configured as stubs. ` +
        'None are live in this environment. Pilot cannot proceed until pilot-required connectors clear Steward review.',
      contextUsed: ['connector readiness model', 'admin shell config', 'data sharing enforcement'],
      evidenceStrength: 'thin',
      blocker: blockerLabel,
      primaryAction: { label: 'Configure connectors', href: '/admin/connectors#config' },
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
  };
}
