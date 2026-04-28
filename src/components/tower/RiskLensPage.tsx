'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { RISK_ITEMS, RISK_AGENT_VOICE, type RiskItem } from '@/lib/tower/shell-lens-fixture';

// ---------------------------------------------------------------------------
// Severity color helper
// ---------------------------------------------------------------------------

function severityColor(severity: RiskItem['severity']): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.AMBER_DOT;
  return SHELL.MINT_LINE;
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: RiskItem['status'] }) {
  let bg: string;
  let color: string;
  let label: string;

  if (status === 'open') {
    bg = SHELL.PEACH_BG;
    color = SHELL.PEACH_TEXT;
    label = 'Open';
  } else if (status === 'mitigated') {
    bg = SHELL.MINT_BG;
    color = SHELL.MINT_TEXT;
    label = 'Mitigated';
  } else {
    bg = SHELL.GRAY_BG;
    color = SHELL.GRAY_TEXT;
    label = 'Watching';
  }

  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 8,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '2px 7px',
        borderRadius: 8,
        background: bg,
        color,
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Risk card
// ---------------------------------------------------------------------------

function RiskCard({ item }: { item: RiskItem }) {
  const sColor = severityColor(item.severity);

  return (
    <div
      style={{
        borderLeft: `3px solid ${sColor}`,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        padding: '14px 18px',
        marginBottom: 10,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: sColor,
          }}
        >
          {item.severity}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            padding: '2px 6px',
            borderRadius: 6,
            background: SHELL.GRAY_BG,
            color: SHELL.GRAY_TEXT,
            lineHeight: 1.4,
          }}
        >
          {item.riskType}
        </span>
        <StatusPill status={item.status} />
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 14,
          color: SHELL.INK,
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {item.title}
      </div>

      {/* Program */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          {item.displayId}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_SOFT,
          }}
        >
          · {item.program}
        </span>
      </div>

      {/* Description */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          lineHeight: 1.55,
          marginTop: 6,
        }}
      >
        {item.description}
      </div>

      {/* Mitigation */}
      <div
        style={{
          background: SHELL.PAPER_SOFT,
          borderRadius: 5,
          padding: '6px 10px',
          marginTop: 8,
          fontFamily: SHELL.SANS,
          fontSize: 11,
          color: SHELL.INK,
          lineHeight: 1.5,
        }}
      >
        → {item.mitigation}
      </div>

      {/* Owner */}
      <div
        style={{
          textAlign: 'right',
          marginTop: 6,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
        }}
      >
        Owner: {item.owner}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary row
// ---------------------------------------------------------------------------

function SummaryRow() {
  const highCount = RISK_ITEMS.filter(r => r.severity === 'high').length;
  const mediumCount = RISK_ITEMS.filter(r => r.severity === 'medium').length;
  const mitigatedCount = RISK_ITEMS.filter(r => r.status === 'mitigated').length;

  const cards = [
    { label: 'High', value: highCount, color: SHELL.RUST_TEXT, bg: SHELL.RUST_BG },
    { label: 'Medium', value: mediumCount, color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG },
    { label: 'Mitigated', value: mitigatedCount, color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        marginBottom: 20,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: SHELL.CARD_WHITE,
            borderRadius: 8,
            padding: '10px 14px',
            border: `1px solid ${SHELL.CARD_LINE}`,
            minWidth: 80,
          }}
        >
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              fontWeight: 700,
              color: card.color,
              lineHeight: 1,
            }}
          >
            {card.value}
          </div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginTop: 4,
            }}
          >
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function RiskLensPage() {
  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · Risk Lens',
      }}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={RISK_AGENT_VOICE.quote}
        agentContext={RISK_AGENT_VOICE.agentContext}
        actions={RISK_AGENT_VOICE.actions}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Back link */}
        <a
          href="/tower"
          style={{
            display: 'inline-block',
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
            marginBottom: 12,
            letterSpacing: '0.06em',
          }}
        >
          ← Control Tower
        </a>

        {/* Header */}
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 400,
            color: SHELL.INK,
            margin: '0 0 4px 0',
            lineHeight: 1.2,
          }}
        >
          Risk Lens
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            margin: '0 0 20px 0',
          }}
        >
          Open risk items across Apex Retail programs
        </p>

        {/* Summary row */}
        <SummaryRow />

        {/* Risk items */}
        {RISK_ITEMS.map((item) => (
          <RiskCard key={item.id} item={item} />
        ))}
      </div>
    </AppShell>
  );
}
