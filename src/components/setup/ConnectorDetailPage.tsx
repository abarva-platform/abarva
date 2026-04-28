'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ConnectorDetail } from '@/lib/setup/shell-setup-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', active: true, href: '/admin' },
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
  const ss = statusStyles[detail.status];

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
        agentContext="Steward · Setup · connector health and OAuth flows"
        actions={detail.actions}
      />

      {/* Work pane */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '28px 36px',
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: 18 }}>
          <Link
            href="/admin"
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

        {/* Header row: status pill + type tag */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
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

        {/* H1 */}
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

        {/* Vendor + endpoint */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MUTED,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {detail.vendor} &nbsp;·&nbsp;{' '}
          <span style={{ fontFamily: SHELL.MONO, fontSize: 11 }}>{detail.endpoint}</span>
        </div>

        {/* Healthy status section */}
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
                HEALTHY
              </div>
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.MINT_TEXT,
                  marginTop: 2,
                }}
              >
                Last sync {detail.lastSuccessfulSync} · OAuth valid for 87 days
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
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
            {/* Top row: dot + error code */}
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

            {/* Error message */}
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

            {/* Bottom row: error time + last successful */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
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

            {/* Reconnect button */}
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
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                textDecoration: 'none',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              Reconnect ServiceNow
            </Link>
          </div>
        )}

        {/* Data flows section */}
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
                {/* Direction chip */}
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

                {/* Description */}
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

                {/* Last synced */}
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

        {/* Sync info: 2-col mini stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
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
              Sync frequency
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK,
                fontWeight: 600,
              }}
            >
              {detail.syncFrequency}
            </div>
          </div>

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
              Auth type
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK,
                fontWeight: 600,
              }}
            >
              {detail.authType}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
