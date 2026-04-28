'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ConnectorDetail } from '@/lib/setup/shell-setup-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', active: true, href: '/admin/connectors' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'audit', label: 'Audit log', href: '/admin/audit' },
  { key: 'policies', label: 'Policies', href: '/admin/policies' },
  { key: 'architecture', label: 'Architecture', href: '/admin/architecture' },
];

interface ConnectorDetailPageProps {
  detail: ConnectorDetail;
}

export function ConnectorDetailPage({ detail }: ConnectorDetailPageProps) {
  const statusStyles: Record<ConnectorDetail['status'], { bg: string; text: string; label: string }> = {
    healthy: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Healthy' },
    degraded: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Degraded' },
    disconnected: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Disconnected' },
  };
  const modeStyles: Record<ConnectorDetail['dataMode'], { bg: string; text: string; label: string }> = {
    seeded: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Seeded fixture' },
    live: { bg: SHELL.BLUE_BG, text: SHELL.INK_SOFT, label: 'Live signal' },
  };
  const ss = statusStyles[detail.status];
  const mode = modeStyles[detail.dataMode];
  const health = deriveConnectorHealth(detail);
  const modeNote =
    detail.dataMode === 'seeded'
      ? 'Deterministic setup profile. This surface mirrors the canonical /admin/connectors model and does not perform a live API call.'
      : 'Live connector checkpoint. Steward still validates scope separately before any production-ready claim.';

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Setup · ${detail.name} · ${ss.label}`,
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Setup Orchestrator' }}
        quote={detail.agentQuote}
        agentContext="Steward · Setup · connector health and credential routing"
        actions={detail.actions}
        surface="setup"
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '28px 36px',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <Link
            href="/admin/connectors"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            ← All connectors
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Canonical route · /admin/connectors/{detail.id}
          </span>
          <span
            style={{
              display: 'inline-block',
              fontFamily: SHELL.MONO,
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: ss.text,
              background: ss.bg,
              borderRadius: 10,
              padding: '3px 9px',
              lineHeight: 1,
            }}
          >
            {ss.label}
          </span>
          <span
            style={{
              display: 'inline-block',
              fontFamily: SHELL.MONO,
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: mode.text,
              background: mode.bg,
              borderRadius: 10,
              padding: '3px 9px',
              lineHeight: 1,
            }}
          >
            {mode.label}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {detail.connectorClassLabel}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {detail.connectorType}
          </span>
        </div>

        <div
          style={{
            background: SHELL.PAPER_SOFT,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: mode.text,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {mode.label}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_SOFT,
              lineHeight: 1.5,
            }}
          >
            {modeNote}
          </div>
        </div>

        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 700,
            color: SHELL.INK,
            margin: '0 0 6px 0',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          {detail.name}
        </h1>

        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MUTED,
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          {detail.vendor} · {detail.authType} · <span style={{ fontFamily: SHELL.MONO, fontSize: 11 }}>{detail.endpoint}</span>
        </div>

        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            lineHeight: 1.5,
            margin: '0 0 20px 0',
            maxWidth: 760,
          }}
        >
          {detail.description}
        </p>

        {detail.status === 'healthy' && (
          <div
            style={{
              background: SHELL.MINT_BG,
              border: `1px solid ${SHELL.MINT_LINE}`,
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: SHELL.MINT_TEXT,
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.MINT_TEXT,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {detail.dataMode === 'seeded' ? 'Seeded status' : 'Live status'}
              </div>
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.MINT_TEXT,
                  marginTop: 2,
                }}
              >
                {detail.dataMode === 'seeded'
                  ? `Seeded checkpoint captured at ${detail.lastSuccessfulSync ?? detail.lastSync}. Live validation remains separate from this setup surface.`
                  : `Last sync ${detail.lastSuccessfulSync ?? detail.lastSync}`}
              </div>
            </div>
          </div>
        )}

        {detail.errorCode && (
          <div
            style={{
              background: SHELL.RUST_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SHELL.RUST_TEXT,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {detail.errorCode}
              </span>
            </div>

            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.RUST_TEXT,
                lineHeight: 1.5,
                margin: '0 0 10px 0',
              }}
            >
              {detail.errorMessage}
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: detail.reconnectProfile ? 12 : 0,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                }}
              >
                Error at {detail.errorTime}
              </span>
              {detail.lastSuccessfulSync && (
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    color: SHELL.MINT_TEXT,
                  }}
                >
                  Last successful: {detail.lastSuccessfulSync}
                </span>
              )}
            </div>

            {detail.reconnectProfile && (
              <Link
                href={`/admin/connectors/${detail.id}/reconnect`}
                style={{
                  display: 'inline-block',
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: SHELL.PAPER,
                  background: SHELL.INK,
                  borderRadius: 6,
                  padding: '8px 18px',
                  textDecoration: 'none',
                  lineHeight: 1,
                }}
              >
                {detail.reconnectProfile.callToAction}
              </Link>
            )}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 12,
              lineHeight: 1,
            }}
          >
            Data flows
          </div>
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {detail.dataFlows.map((flow, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 14px',
                  borderTop: idx === 0 ? 'none' : `1px solid ${SHELL.CARD_LINE_SOFT}`,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: SHELL.MONO,
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: flow.direction === 'inbound' ? SHELL.INK_SOFT : SHELL.GRAY_TEXT,
                    background: flow.direction === 'inbound' ? SHELL.BLUE_BG : SHELL.GRAY_BG,
                    borderRadius: 6,
                    padding: '3px 7px',
                    lineHeight: 1,
                    flexShrink: 0,
                    minWidth: 56,
                    textAlign: 'center',
                  }}
                >
                  {flow.direction}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    color: SHELL.INK,
                    flex: 1,
                    lineHeight: 1.4,
                  }}
                >
                  {flow.description}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    color: SHELL.INK_MUTED,
                    flexShrink: 0,
                  }}
                >
                  {flow.lastSynced}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <MetricCard label="Last authenticated" value={health.lastAuthenticatedAt} />
          <MetricCard label="Last successful pull" value={health.lastSuccessfulPullAt} />
          <MetricCard label="Pull latency" value={health.pullLatencyMs} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          <MetricCard label="PII filter" value={health.piiFilterActive} />
          <MetricCard label="Scope active" value={health.scopeActive} />
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function deriveConnectorHealth(detail: ConnectorDetail) {
  const lastAuthenticatedAt =
    detail.dataMode === 'seeded'
      ? `Seeded checkpoint · ${detail.lastSync}`
      : detail.status === 'degraded'
        ? detail.lastSuccessfulSync ?? detail.lastSync
        : detail.lastSync;

  return {
    lastAuthenticatedAt,
    lastSuccessfulPullAt: detail.lastSuccessfulSync ?? detail.lastSync,
    pullLatencyMs:
      detail.dataMode === 'seeded'
        ? 'seeded checkpoint'
        : detail.status === 'healthy'
          ? '280 ms'
          : detail.status === 'degraded'
            ? '910 ms'
            : 'not yet measured',
    piiFilterActive:
      detail.connectorClass === 'crm' || detail.connectorClass === 'model_provider'
        ? 'Active'
        : 'Scoped',
    scopeActive:
      detail.dataFlows.length > 0
        ? detail.dataFlows.map((flow) => flow.description).slice(0, 2).join(' · ')
        : 'No active scope',
  };
}
