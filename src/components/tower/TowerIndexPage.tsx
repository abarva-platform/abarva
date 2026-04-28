'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { TOWER_INDEX_VIEW, type PressureItem } from '@/lib/tower/shell-tower-fixture';

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

function severityBorderColor(severity: PressureItem['severity']): string {
  if (severity === 'high') return SHELL.RUST_BG;
  if (severity === 'medium') return SHELL.AMBER_DOT;
  return SHELL.MINT_LINE;
}

function severityLabelColor(severity: PressureItem['severity']): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function deltaColor(item: PressureItem): string {
  if (item.deltaDir === 'down') return SHELL.MINT_TEXT;
  if (item.severity === 'high') return SHELL.RUST_TEXT;
  return SHELL.PEACH_TEXT;
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: PressureItem['status'] }) {
  const bg =
    status === 'active'
      ? SHELL.RUST_BG
      : status === 'watching'
        ? SHELL.PEACH_BG
        : SHELL.MINT_BG;
  const color =
    status === 'active'
      ? SHELL.RUST_TEXT
      : status === 'watching'
        ? SHELL.PEACH_TEXT
        : SHELL.MINT_TEXT;
  const label =
    status === 'active' ? 'Active' : status === 'watching' ? 'Watching' : 'Resolved';

  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 10,
        background: bg,
        color,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pressure card
// ---------------------------------------------------------------------------

function PressureCard({ item }: { item: PressureItem }) {
  const borderColor = severityBorderColor(item.severity);
  const labelColor = severityLabelColor(item.severity);
  const dColor = deltaColor(item);

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        padding: 20,
        borderLeft: `3px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Top row: severity label + title + status pill */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: labelColor,
            flexShrink: 0,
          }}
        >
          {item.severity}
        </span>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 16,
            fontWeight: 700,
            color: SHELL.INK,
            flex: 1,
            lineHeight: 1.2,
          }}
        >
          {item.title}
        </span>
        <StatusPill status={item.status} />
      </div>

      {/* Hero number row */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 32,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          {item.heroStat}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_SOFT,
            lineHeight: 1.3,
          }}
        >
          {item.heroLabel}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 12,
            color: dColor,
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          {item.delta}
        </span>
      </div>

      {/* Top driver */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        {item.topDriver}
      </div>

      {/* Atlas sentence */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          fontStyle: 'italic',
          color: SHELL.INK_MUTED,
          marginTop: 4,
          lineHeight: 1.55,
        }}
      >
        {item.atlasSentence}
      </div>

      {/* Action link */}
      <div style={{ marginTop: 14 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.INK_SOFT,
            cursor: 'pointer',
          }}
        >
          View detail →
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cross-program activity row
// ---------------------------------------------------------------------------

interface ActivityRow {
  ref: string;
  phase: string;
  note: string;
  when: string;
}

const ACTIVITY_ROWS: ActivityRow[] = [
  { ref: 'APX-CDP-2026', phase: 'Synthesis phase', note: 'Workshop 5 outstanding', when: '2h ago' },
  { ref: 'APX-CC-2026', phase: 'Build phase', note: 'Activate gate approaching', when: '4h ago' },
  { ref: 'APX-DFV2-2025', phase: 'Operate', note: 'steady state · Atlas monitoring', when: 'Mar 28' },
];

function ActivityStrip() {
  return (
    <div
      style={{
        marginTop: 32,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          Cross-program activity
        </span>
      </div>

      {/* Rows */}
      {ACTIVITY_ROWS.map((row, i) => (
        <div
          key={row.ref}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 16,
            padding: '11px 20px',
            borderBottom:
              i < ACTIVITY_ROWS.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : undefined,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              color: SHELL.INK_SOFT,
              flexShrink: 0,
              minWidth: 120,
            }}
          >
            [{row.ref}]
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              flex: 1,
            }}
          >
            {row.phase}
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_SOFT,
                marginLeft: 8,
              }}
            >
              · {row.note}
            </span>
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              flexShrink: 0,
            }}
          >
            {row.when}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const FILTER_PILLS = [
  { key: 'all', label: 'All', active: true, count: 3 },
  { key: 'high', label: 'High', count: 1 },
  { key: 'medium', label: 'Medium', count: 1 },
  { key: 'low', label: 'Low watch', count: 1 },
  { key: 'resolved', label: 'Resolved', count: 0 },
];

export function TowerIndexPage() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · 3 active pressures',
      }}
      middleStrip={<FilterPillStrip pills={FILTER_PILLS} />}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={TOWER_INDEX_VIEW.agentQuote}
        agentContext={TOWER_INDEX_VIEW.agentContext}
        actions={TOWER_INDEX_VIEW.actions}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
            }}
          >
            Active pressures
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              fontWeight: 600,
              color: SHELL.PAPER,
              background: SHELL.RUST_TEXT,
              padding: '2px 9px',
              borderRadius: 10,
              lineHeight: 1.4,
            }}
          >
            {TOWER_INDEX_VIEW.highCount} high
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              fontWeight: 600,
              color: SHELL.INK,
              background: SHELL.PEACH_BG,
              padding: '2px 9px',
              borderRadius: 10,
              lineHeight: 1.4,
            }}
          >
            {TOWER_INDEX_VIEW.activeCount} total
          </span>
        </div>

        {/* Pressure cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {TOWER_INDEX_VIEW.pressures.map((item) => (
            <PressureCard key={item.id} item={item} />
          ))}
        </div>

        {/* Cross-program activity strip */}
        <ActivityStrip />

        {/* Value lens link */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
          <a href="/tower/outcomes" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT,
            textDecoration: 'none',
          }}>
            <span>→</span>
            <span>Value lens · outcome realization</span>
          </a>
        </div>
      </div>
    </AppShell>
  );
}
