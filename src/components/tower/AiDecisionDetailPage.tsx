'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildAiDecisionDetailView,
  type DecisionDetailView,
  type DecisionEvidence,
} from '@/lib/tower/ai-decision-detail-fixture';
import type { PortfolioDecision } from '@/lib/tower/ai-program-portfolio-fixture';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n < 0) return `-${fmt$(Math.abs(n))}`;
  return `$${n}`;
}

const TYPE_META: Record<PortfolioDecision['type'], { label: string; color: string; bg: string }> = {
  scale:          { label: 'Scale',         color: SHELL.MINT_TEXT,  bg: SHELL.MINT_BG },
  kill:           { label: 'Kill',           color: SHELL.RUST_TEXT,  bg: SHELL.RUST_BG },
  consolidate:    { label: 'Consolidate',    color: SHELL.AMBER_DOT,  bg: SHELL.PEACH_BG },
  renegotiate:    { label: 'Renegotiate',    color: SHELL.INK_SOFT,   bg: SHELL.PAPER_DEEP },
  pivot:          { label: 'Pivot',          color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG },
  defer:          { label: 'Defer',          color: SHELL.GRAY_TEXT,  bg: SHELL.GRAY_BG },
  'pilot-extend': { label: 'Pilot extend',   color: SHELL.INK_SOFT,   bg: SHELL.BLUE_BG },
};

const STATUS_META: Record<PortfolioDecision['status'], { label: string; color: string }> = {
  active:     { label: 'Active',     color: SHELL.MINT_TEXT },
  superseded: { label: 'Superseded', color: SHELL.INK_MUTED },
  reversed:   { label: 'Reversed',   color: SHELL.RUST_TEXT },
};

const PROGRAM_NAMES: Record<string, string> = {
  'twr-prog-m365-copilot': 'M365 Copilot',
  'twr-prog-claude-code':  'Claude Code',
  'twr-prog-now-assist':   'Now Assist',
  'twr-prog-sap-joule':    'SAP Joule',
  'twr-prog-fow':          'AI Fluency',
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function DecisionHeader({ d }: { d: DecisionDetailView }) {
  const tm = TYPE_META[d.type] ?? { label: d.type, color: SHELL.INK_MUTED, bg: SHELL.GRAY_BG };
  const sm = STATUS_META[d.status] ?? { label: d.status, color: SHELL.INK_MUTED };
  const programName = PROGRAM_NAMES[d.programId] ?? d.programId;

  return (
    <div style={{ marginBottom: 28 }}>
      <Link
        href="/tower/activity"
        style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
      >
        ← Decisions log
      </Link>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: tm.bg, color: tm.color, padding: '2px 8px', borderRadius: 8, flexShrink: 0 }}>
          {tm.label}
        </span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: SHELL.GRAY_BG, color: sm.color, padding: '2px 8px', borderRadius: 8, flexShrink: 0 }}>
          {sm.label}
        </span>
      </div>
      <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 22, fontWeight: 400, color: SHELL.INK, margin: '0 0 6px', lineHeight: 1.2 }}>
        {d.title}
      </h1>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED }}>{d.date}</span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED }}>{d.decidedBy}</span>
        <Link href={`/tower/programs/${d.programId}`} style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT, textDecoration: 'none' }}>
          {programName} →
        </Link>
        {d.dollarImpact !== 0 && (
          <span style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 700, color: d.dollarImpact > 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT }}>
            {d.dollarImpact > 0 ? '+' : ''}{fmt$(d.dollarImpact)} projected impact
          </span>
        )}
      </div>
      <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: 0, lineHeight: 1.6 }}>{d.summary}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rationale panel
// ---------------------------------------------------------------------------

function RationalePanel({ rationale }: { rationale: string }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 400, color: SHELL.INK, margin: '0 0 10px' }}>Rationale</h2>
      <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '16px 20px' }}>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: 0, lineHeight: 1.65 }}>{rationale}</p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Evidence panel
// ---------------------------------------------------------------------------

function EvidencePanel({ evidence }: { evidence: readonly DecisionEvidence[] }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 400, color: SHELL.INK, margin: '0 0 10px' }}>Evidence</h2>
      <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, overflow: 'hidden' }}>
        {evidence.map((ev, i) => (
          <div key={ev.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 18px', borderBottom: i < evidence.length - 1 ? `1px solid ${SHELL.CARD_LINE}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED, marginBottom: 2 }}>{ev.label}</div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>{ev.source}</div>
            </div>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 13, fontWeight: 700, color: SHELL.INK, flexShrink: 0 }}>{ev.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Alternatives panel
// ---------------------------------------------------------------------------

function AlternativesPanel({ alternatives }: { alternatives: readonly { label: string; reason: string }[] }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 400, color: SHELL.INK, margin: '0 0 10px' }}>Alternatives considered</h2>
      <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, overflow: 'hidden' }}>
        {alternatives.map((alt, i) => (
          <div key={alt.label} style={{ padding: '12px 18px', borderBottom: i < alternatives.length - 1 ? `1px solid ${SHELL.CARD_LINE}` : 'none' }}>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, marginBottom: 4 }}>{alt.label}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED }}>{alt.reason}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer meta
// ---------------------------------------------------------------------------

function DecisionMeta({ d }: { d: DecisionDetailView }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 400, color: SHELL.INK, margin: '0 0 10px' }}>Review & checkpoint</h2>
      <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 4 }}>Reviewed by</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {d.reviewedBy.map((r) => (
              <span key={r} style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, background: SHELL.PAPER_DEEP, padding: '2px 10px', borderRadius: 8 }}>{r}</span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 4 }}>Next checkpoint</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK }}>{d.nextCheckpoint}</div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface Props { decisionId: string; }

export function AiDecisionDetailPage({ decisionId }: Props) {
  const d = buildAiDecisionDetailView(decisionId);
  if (!d) return null;

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `AI Control Tower · Decision detail`,
      }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote={d.nexusQuote}
        agentContext={d.nexusContext}
        actions={[...d.nexusActions]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>
        <DecisionHeader d={d} />
        <RationalePanel rationale={d.rationale} />
        <EvidencePanel evidence={d.evidence} />
        <AlternativesPanel alternatives={d.alternatives} />
        <DecisionMeta d={d} />
      </div>
    </AppShell>
  );
}
