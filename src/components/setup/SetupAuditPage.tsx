'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AUDIT_LOG_FIXTURE, AUDIT_AGENT_VOICE, type AuditEntry } from '@/lib/setup/shell-setup-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', href: '/admin' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'audit', label: 'Audit log', active: true, href: '/admin/audit' },
  { key: 'policies', label: 'Policies', href: '/admin/policies' },
  { key: 'tenant', label: 'Tenant', href: '/admin/tenant' },
  { key: 'architecture', label: 'Architecture', href: '/admin/architecture' },
];

function severityDotColor(severity: AuditEntry['severity']): string {
  if (severity === 'critical') return SHELL.RUST_TEXT;
  if (severity === 'warn') return SHELL.AMBER_DOT;
  return SHELL.MINT_TEXT;
}

function AuditRow({ item }: { item: AuditEntry }) {
  const dotColor = severityDotColor(item.severity);

  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: '1px solid ' + SHELL.CARD_LINE_SOFT,
      }}
    >
      {/* Top row: timestamp + surface pill + severity dot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            lineHeight: 1,
          }}
        >
          {item.timestamp}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: SHELL.GRAY_TEXT,
            background: SHELL.GRAY_BG,
            borderRadius: 8,
            padding: '2px 7px',
            lineHeight: 1,
          }}
        >
          {item.surface}
        </span>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
          }}
        />
      </div>

      {/* Actor glyph + action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: SHELL.PAPER_DEEP,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            {item.actorInitials}
          </span>
        </div>

        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              fontWeight: 600,
              color: SHELL.INK,
              lineHeight: 1.4,
            }}
          >
            {item.action}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {item.detail}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SetupAuditPage() {
  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Setup · Audit log · 7 events',
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Setup Orchestrator' }}
        quote={AUDIT_AGENT_VOICE.quote}
        actions={AUDIT_AGENT_VOICE.actions}
        surface="setup"
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
            Audit log · 7 events
          </h1>
        </div>

        {/* Audit rows */}
        <div
          style={{
            background: SHELL.CARD_WHITE,
            border: '1px solid ' + SHELL.CARD_LINE,
            borderRadius: 10,
            padding: '0 16px',
          }}
        >
          {AUDIT_LOG_FIXTURE.map((entry) => (
            <AuditRow key={entry.id} item={entry} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
