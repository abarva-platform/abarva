'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SETUP_INDEX_VIEW, type ConnectorItem } from '@/lib/setup/shell-setup-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', active: true, href: '/admin' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'audit', label: 'Audit log', href: '/admin/audit' },
  { key: 'policies', label: 'Policies', href: '/admin/policies' },
  { key: 'architecture', label: 'Architecture', href: '/admin/architecture' },
];

function StatusPill({ status }: { status: ConnectorItem['status'] }) {
  const styles: Record<ConnectorItem['status'], { bg: string; text: string; label: string }> = {
    healthy: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Healthy' },
    degraded: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Degraded' },
    disconnected: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Disconnected' },
  };
  const s = styles[status];
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: s.text,
        background: s.bg,
        borderRadius: 10,
        padding: '3px 9px',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
}

function ConnectorCard({ item }: { item: ConnectorItem }) {
  const isDegraded = item.status === 'degraded';
  const isDisconnected = item.status === 'disconnected';
  const needsAction = isDegraded || isDisconnected;
  const actionLabel = isDegraded ? 'Reconnect' : 'Configure';

  const cardBg = isDegraded
    ? SHELL.PEACH_BG + '44'
    : SHELL.CARD_WHITE;

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      {/* Glyph circle */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: SHELL.PAPER_DEEP,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 12,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          {item.logo}
        </span>
      </div>

      {/* Right column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: name + status pill */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Link
            href={`/admin/connectors/${item.id}`}
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 14,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1.2,
              textDecoration: 'none',
            }}
          >
            {item.name}
          </Link>
          <StatusPill status={item.status} />
        </div>

        {/* Last sync */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            lineHeight: 1.3,
          }}
        >
          Last sync: {item.lastSync}
        </div>

        {/* Status note */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_SOFT,
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {item.statusNote}
        </div>

        {/* Action button */}
        {needsAction && (
          <button
            type="button"
            style={{
              marginTop: 10,
              fontFamily: SHELL.MONO,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK,
              background: 'transparent',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 14,
              padding: '4px 12px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function HealthChip({
  count,
  label,
  bg,
  text,
}: {
  count: number;
  label: string;
  bg: string;
  text: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: text,
        background: bg,
        borderRadius: 12,
        padding: '5px 12px',
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: 14, fontFamily: SHELL.SANS, fontWeight: 700 }}>{count}</span>
      {label}
    </span>
  );
}

export function SetupConnectorsPage() {
  const view = SETUP_INDEX_VIEW;

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Setup · Connectors · 1 degraded',
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Platform Governor' }}
        quote={view.agentQuote}
        agentContext={view.agentContext}
        actions={view.actions}
      />

      {/* Work pane */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Eyebrow + header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
              lineHeight: 1,
            }}
          >
            Setup
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 24,
              fontWeight: 700,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Connectors
          </h1>
        </div>

        {/* Health summary chips */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <HealthChip
            count={view.healthyCount}
            label="Healthy"
            bg={SHELL.MINT_BG}
            text={SHELL.MINT_TEXT}
          />
          <HealthChip
            count={view.degradedCount}
            label="Degraded"
            bg={SHELL.PEACH_BG}
            text={SHELL.PEACH_TEXT}
          />
          <HealthChip
            count={view.disconnectedCount}
            label="Disconnected"
            bg={SHELL.GRAY_BG}
            text={SHELL.GRAY_TEXT}
          />
        </div>

        {/* Connector card grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {view.connectors.map((connector) => (
            <ConnectorCard key={connector.id} item={connector} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
