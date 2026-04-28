'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildAiProgramPortfolioDecisions,
  type PortfolioDecision,
} from '@/lib/tower/ai-program-portfolio-fixture';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n < 0) return `-${fmt$(Math.abs(n))}`;
  return `$${n}`;
}

const TYPE_META: Record<
  PortfolioDecision['type'],
  { label: string; color: string; bg: string }
> = {
  scale:          { label: 'Scale',         color: SHELL.MINT_TEXT,  bg: SHELL.MINT_BG },
  kill:           { label: 'Kill',           color: SHELL.RUST_TEXT,  bg: SHELL.RUST_BG },
  consolidate:    { label: 'Consolidate',    color: SHELL.AMBER_DOT,  bg: SHELL.PEACH_BG },
  renegotiate:    { label: 'Renegotiate',    color: SHELL.INK_SOFT,   bg: SHELL.PAPER_DEEP },
  pivot:          { label: 'Pivot',          color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG },
  defer:          { label: 'Defer',          color: SHELL.GRAY_TEXT,  bg: SHELL.GRAY_BG },
  'pilot-extend': { label: 'Pilot extend',   color: SHELL.INK_SOFT,   bg: SHELL.BLUE_BG },
};

const STATUS_META: Record<
  PortfolioDecision['status'],
  { label: string; color: string }
> = {
  active:     { label: 'Active',     color: SHELL.MINT_TEXT },
  superseded: { label: 'Superseded', color: SHELL.INK_MUTED },
  reversed:   { label: 'Reversed',   color: SHELL.RUST_TEXT },
};

// Program name lookup (deterministic — matches fixture IDs)
const PROGRAM_NAMES: Record<string, string> = {
  'twr-prog-m365-copilot': 'M365 Copilot',
  'twr-prog-claude-code':  'Claude Code',
  'twr-prog-now-assist':   'Now Assist',
  'twr-prog-sap-joule':    'SAP Joule',
  'twr-prog-fow':          'AI Fluency',
};

// ---------------------------------------------------------------------------
// Decision card
// ---------------------------------------------------------------------------

function DecisionCard({ decision, isRecent }: { decision: PortfolioDecision; isRecent: boolean }) {
  const typeMeta = TYPE_META[decision.type] ?? { label: decision.type, color: SHELL.INK_MUTED, bg: SHELL.GRAY_BG };
  const statusMeta = STATUS_META[decision.status] ?? { label: decision.status, color: SHELL.INK_MUTED };
  const programName = PROGRAM_NAMES[decision.programId] ?? decision.programId;

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${isRecent ? SHELL.PEACH_LINE : SHELL.CARD_LINE}`,
        borderLeft: `4px solid ${isRecent ? SHELL.PEACH_TEXT : typeMeta.color}`,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap' }}>
        {isRecent && (
          <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT, padding: '2px 7px', borderRadius: 8, flexShrink: 0 }}>
            Recent
          </span>
        )}
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: typeMeta.bg, color: typeMeta.color, padding: '2px 7px', borderRadius: 8, flexShrink: 0 }}>
          {typeMeta.label}
        </span>
        <span style={{ fontFamily: SHELL.SANS, fontSize: 14, fontWeight: 700, color: SHELL.INK, flex: 1, lineHeight: 1.2 }}>
          {decision.title}
        </span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, flexShrink: 0 }}>
          {decision.date}
        </span>
      </div>

      {/* Summary */}
      <p style={{ margin: '0 0 10px', fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.55 }}>
        {decision.summary}
      </p>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link
          href={`/tower/programs/${decision.programId}`}
          style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_SOFT, textDecoration: 'none', letterSpacing: '0.08em' }}
        >
          {programName} →
        </Link>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
          {decision.decidedBy}
        </span>
        {decision.dollarImpact !== 0 && (
          <span style={{ fontFamily: SHELL.SANS, fontSize: 11, fontWeight: 600, color: decision.dollarImpact > 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT }}>
            {decision.dollarImpact > 0 ? '+' : ''}{fmt$(decision.dollarImpact)} impact
          </span>
        )}
        <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: statusMeta.color, marginLeft: 'auto' }}>
          {statusMeta.label}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary metrics
// ---------------------------------------------------------------------------

function DecisionsSummary({ decisions }: { decisions: readonly PortfolioDecision[] }) {
  const active = decisions.filter((d) => d.status === 'active').length;
  const totalImpact = decisions.reduce((s, d) => s + d.dollarImpact, 0);
  const typeBreakdown = decisions.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {[
        { label: 'Total decisions', value: String(decisions.length) },
        { label: 'Active', value: String(active), color: SHELL.MINT_TEXT },
        { label: 'Total $ impact', value: fmt$(totalImpact), color: totalImpact >= 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT },
        { label: 'Decision types', value: Object.keys(typeBreakdown).join(' · ') },
      ].map((m) => (
        <div key={m.label} style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontFamily: SHELL.SERIF, fontSize: 18, fontWeight: 700, color: m.color ?? SHELL.INK, lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

// Decisions within the last 14 days from the demo baseline (2026-04-27)
const RECENT_CUTOFF = '2026-04-13';

export function DecisionsIndexPage() {
  const decisions = buildAiProgramPortfolioDecisions();

  const nexusQuote = `${decisions.length} portfolio decisions logged · ${decisions.filter((d) => d.status === 'active').length} active. Recent: Finance adoption sprint (M365 Copilot, Apr 1) and KB completion defer (Now Assist, Feb 28). Claude Code expansion decision is the next pending item.`;

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'AI Control Tower · Decisions log',
      }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote={nexusQuote}
        agentContext={`Nexus · Decisions log · ${decisions.length} entries`}
        actions={[
          { letter: 'A', text: 'Review Finance sprint decision', detail: 'M365 Copilot · Apr 1 · $1.1M projected' },
          { letter: 'B', text: 'Revisit Now Assist defer', detail: 'KB completion · Q3 renewal trigger · 112 days' },
          { letter: 'C', text: 'Log Claude Code expansion', detail: 'Pending: 280 → 350 seats · $57K spend' },
        ]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>
        {/* Back */}
        <Link
          href="/tower"
          style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
        >
          ← Control Tower
        </Link>

        {/* Header */}
        <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 22, fontWeight: 400, color: SHELL.INK, margin: '0 0 4px', lineHeight: 1.2 }}>
          Decisions log
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: '0 0 20px' }}>
          Audit trail of all AI portfolio decisions · chronological · linked to programs and pressures
        </p>

        {/* Summary KPIs */}
        <DecisionsSummary decisions={decisions} />

        {/* Type legend */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {Object.entries(TYPE_META).map(([key, m]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }} />
              <span style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Decision cards (chronological descending) */}
        {[...decisions].reverse().map((d) => (
          <DecisionCard
            key={d.id}
            decision={d}
            isRecent={d.date >= RECENT_CUTOFF}
          />
        ))}

        {/* Footer note */}
        <p style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, fontStyle: 'italic', marginTop: 8 }}>
          Decisions highlighted in peach were made in the last 14 days. All data is deterministic seed.
        </p>
      </div>
    </AppShell>
  );
}
