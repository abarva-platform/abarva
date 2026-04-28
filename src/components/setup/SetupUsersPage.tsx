'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { USERS_FIXTURE, USERS_AGENT_VOICE, type UserItem } from '@/lib/setup/shell-setup-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', href: '/admin/connectors' },
  { key: 'users', label: 'Users', active: true, href: '/admin/users' },
  { key: 'audit', label: 'Audit log', href: '/admin/audit' },
  { key: 'policies', label: 'Policies', href: '/admin/policies' },
  { key: 'tenant', label: 'Tenant', href: '/admin/tenant' },
  { key: 'architecture', label: 'Architecture', href: '/admin/architecture' },
];

function rolePillStyle(role: UserItem['role']): { bg: string; text: string } {
  if (role === 'admin') return { bg: SHELL.INK, text: SHELL.PAPER };
  if (role === 'collaborator') return { bg: SHELL.BLUE_BG, text: SHELL.INK };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT };
}

function statusDotColor(status: UserItem['status']): string {
  if (status === 'active') return SHELL.MINT_TEXT;
  if (status === 'pending') return SHELL.AMBER_DOT;
  return SHELL.GRAY_TEXT;
}

function userInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function UserRow({ item }: { item: UserItem }) {
  const pill = rolePillStyle(item.role);
  const dotColor = statusDotColor(item.status);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 16px',
        borderBottom: '1px solid ' + SHELL.CARD_LINE_SOFT,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
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
            fontSize: 10,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          {userInitials(item.name)}
        </span>
      </div>

      {/* Name + email */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 500,
            color: SHELL.INK,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.name}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.email}
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Surface */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {item.surface}
      </span>

      {/* Role pill */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: pill.text,
          background: pill.bg,
          borderRadius: 10,
          padding: '3px 9px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {item.role}
      </span>

      {/* Status dot */}
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
  );
}

export function SetupUsersPage() {
  const activeCount = USERS_FIXTURE.filter((user) => user.status === 'active').length;
  const pendingCount = USERS_FIXTURE.filter((user) => user.status === 'pending').length;

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Setup · Users · 5 members',
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Setup Orchestrator' }}
        quote={USERS_AGENT_VOICE.quote}
        actions={USERS_AGENT_VOICE.actions}
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
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.PEACH_TEXT,
              marginBottom: 8,
              lineHeight: 1,
            }}
          >
            Canonical route · /admin/users
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
              Users · 5 members
            </h1>
            <a
              href="/admin/invite"
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_SOFT,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              + Invite collaborator
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <SummaryChip label="Active" value={activeCount} tone="mint" />
          <SummaryChip label="Pending" value={pendingCount} tone="peach" />
          <SummaryChip label="Admin" value={USERS_FIXTURE.filter((user) => user.role === 'admin').length} tone="ink" />
        </div>

        {/* User list */}
        <div
          style={{
            background: SHELL.CARD_WHITE,
            border: '1px solid ' + SHELL.CARD_LINE,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {USERS_FIXTURE.map((user) => (
            <UserRow key={user.id} item={user} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'mint' | 'peach' | 'ink';
}) {
  const styles = tone === 'mint'
    ? { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT }
    : tone === 'peach'
      ? { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT }
      : { bg: SHELL.PAPER_DEEP, text: SHELL.INK };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: styles.text,
        background: styles.bg,
        borderRadius: 999,
        padding: '5px 11px',
        lineHeight: 1,
      }}
    >
      <span style={{ fontFamily: SHELL.SANS, fontSize: 14, fontWeight: 700 }}>{value}</span>
      {label}
    </span>
  );
}
