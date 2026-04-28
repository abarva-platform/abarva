'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { POLICIES_FIXTURE, POLICIES_AGENT_VOICE, type PolicyItem } from '@/lib/setup/shell-setup-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', href: '/admin' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'audit', label: 'Audit log', href: '/admin/audit' },
  { key: 'policies', label: 'Policies', active: true, href: '/admin/policies' },
  { key: 'architecture', label: 'Architecture', href: '/admin/architecture' },
];

function statusPillStyle(status: PolicyItem['status']): { bg: string; text: string; label: string } {
  if (status === 'active') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Active' };
  if (status === 'review-due') return { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Review due' };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Draft' };
}

function cardStyle(status: PolicyItem['status']): React.CSSProperties {
  if (status === 'review-due') {
    return {
      padding: '12px 16px',
      borderRadius: 7,
      marginBottom: 8,
      border: '1px solid ' + SHELL.PEACH_LINE,
      background: SHELL.PEACH_BG,
    };
  }
  if (status === 'draft') {
    return {
      padding: '12px 16px',
      borderRadius: 7,
      marginBottom: 8,
      border: '1px solid ' + SHELL.GRAY_LINE,
      background: SHELL.GRAY_BG,
    };
  }
  return {
    padding: '12px 16px',
    borderRadius: 7,
    marginBottom: 8,
    border: '1px solid ' + SHELL.CARD_LINE,
    background: SHELL.CARD_WHITE,
  };
}

function PolicyCard({ item }: { item: PolicyItem }) {
  const pill = statusPillStyle(item.status);

  return (
    <div style={cardStyle(item.status)}>
      {/* Top row: name + status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 600,
            color: SHELL.INK,
            lineHeight: 1.3,
          }}
        >
          {item.name}
        </span>
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
          {pill.label}
        </span>
      </div>

      {/* Bottom row: category · last reviewed · next review · owner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {item.category}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          Last: {item.lastReviewed}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          Next: {item.nextReview}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_SOFT,
          }}
        >
          {item.owner}
        </span>
      </div>
    </div>
  );
}

export function SetupPoliciesPage() {
  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Setup · Policies · 5 items',
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Setup Orchestrator' }}
        quote={POLICIES_AGENT_VOICE.quote}
        actions={POLICIES_AGENT_VOICE.actions}
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
            Policies · 5 items
          </h1>
        </div>

        {/* Policy cards */}
        <div>
          {POLICIES_FIXTURE.map((policy) => (
            <PolicyCard key={policy.id} item={policy} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
