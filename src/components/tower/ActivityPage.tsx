'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { ACTIVITY_LOG, ACTIVITY_AGENT_VOICE, type ActivityEntry } from '@/lib/tower/shell-activity-fixture';

// ---------------------------------------------------------------------------
// Actor glyph colors by actorType
// ---------------------------------------------------------------------------

function actorGlyphStyles(actorType: ActivityEntry['actorType']): { bg: string; color: string } {
  switch (actorType) {
    case 'nexus':
      return { bg: SHELL.INK, color: SHELL.PAPER };
    case 'sentinel':
      return { bg: SHELL.BLUE_BG, color: SHELL.INK };
    case 'atlas':
      return { bg: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT };
    case 'steward':
      return { bg: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT };
    case 'human':
      return { bg: SHELL.PAPER_DEEP, color: SHELL.INK };
  }
}

// ---------------------------------------------------------------------------
// Filter pills (display-only)
// ---------------------------------------------------------------------------

const FILTER_PILLS = ['All', 'Agents', 'Human', 'Surface'];

function FilterPills() {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
      {FILTER_PILLS.map((pill, i) => (
        <span
          key={pill}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: i === 0 ? SHELL.INK : SHELL.INK_MUTED,
            background: i === 0 ? SHELL.PAPER_DEEP : SHELL.CARD_WHITE,
            border: `1px solid ${i === 0 ? SHELL.CARD_LINE : SHELL.CARD_LINE_SOFT}`,
            borderRadius: 20,
            padding: '4px 12px',
            lineHeight: 1,
            cursor: 'default',
          }}
        >
          {pill}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity row
// ---------------------------------------------------------------------------

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const glyph = actorGlyphStyles(entry.actorType);

  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      {/* Timestamp */}
      <div
        style={{
          minWidth: 110,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          lineHeight: 1.4,
          paddingTop: 3,
          flexShrink: 0,
        }}
      >
        {entry.timestamp}
      </div>

      {/* Actor glyph */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: glyph.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8,
            color: glyph.color,
            lineHeight: 1,
            fontWeight: 600,
          }}
        >
          {entry.actorInitials}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Event + surface */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK,
              lineHeight: 1.4,
            }}
          >
            {entry.event}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            {entry.surface}
          </span>
        </div>

        {/* Detail */}
        {entry.detail && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              fontStyle: 'italic',
              marginTop: 3,
              lineHeight: 1.4,
            }}
          >
            {entry.detail}
          </div>
        )}

        {/* Linked program */}
        {entry.linkedProgram && entry.linkedProgramHref && (
          <Link
            href={entry.linkedProgramHref}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: 3,
              letterSpacing: '0.06em',
            }}
          >
            {entry.linkedProgram} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActivityPage
// ---------------------------------------------------------------------------

export function ActivityPage() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · Cross-program activity',
      }}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={ACTIVITY_AGENT_VOICE.quote}
        agentContext={ACTIVITY_AGENT_VOICE.agentContext}
        actions={ACTIVITY_AGENT_VOICE.actions}
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
            href="/tower"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            ← Control Tower
          </Link>
        </div>

        {/* Header */}
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
          Cross-program activity
        </h1>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            marginBottom: 24,
            lineHeight: 1.4,
          }}
        >
          All events across programs, sources, and setup · last 5 days
        </div>

        {/* Filter pills */}
        <FilterPills />

        {/* Activity rows */}
        <div>
          {ACTIVITY_LOG.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
