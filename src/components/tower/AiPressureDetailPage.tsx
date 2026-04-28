'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildAiPressureDetailView,
  type AiPressureDetailView,
} from '@/lib/tower/ai-pressure-detail-fixture';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function severityColor(s: string): string {
  if (s === 'critical' || s === 'high') return SHELL.RUST_TEXT;
  if (s === 'medium') return SHELL.AMBER_DOT;
  return SHELL.MINT_TEXT;
}
function severityBg(s: string): string {
  if (s === 'critical' || s === 'high') return SHELL.RUST_BG;
  if (s === 'medium') return SHELL.PEACH_BG;
  return SHELL.MINT_BG;
}
function effortColor(e: string): string {
  if (e === 'high') return SHELL.RUST_TEXT;
  if (e === 'medium') return SHELL.AMBER_DOT;
  return SHELL.MINT_TEXT;
}
function trajectoryLabel(t: AiPressureDetailView['trajectory']): string {
  if (t === 'worsening') return '↑ Worsening';
  if (t === 'resolving') return '↓ Resolving';
  return '→ Stable';
}
function trajectoryColor(t: AiPressureDetailView['trajectory']): string {
  if (t === 'worsening') return SHELL.RUST_TEXT;
  if (t === 'resolving') return SHELL.MINT_TEXT;
  return SHELL.INK_MUTED;
}

function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 10 }}>
        {eyebrow}
      </div>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Driver decomposition
// ---------------------------------------------------------------------------

function DriversPanel({ view }: { view: AiPressureDetailView }) {
  const total = view.drivers.reduce((s, d) => s + d.dollarImpact, 0);
  const showBars = total > 0;
  return (
    <Section eyebrow="Driver decomposition">
      <Card>
        {view.drivers.map((d, i) => {
          const pct = showBars && total > 0 ? (d.dollarImpact / total) * 100 : 0;
          return (
            <div key={i} style={{ padding: '12px 16px', borderBottom: i < view.drivers.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK, fontWeight: 600, flex: 1 }}>{d.label}</span>
                {d.dollarImpact > 0 && (
                  <span style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 600, color: SHELL.RUST_TEXT, flexShrink: 0 }}>{fmt$(d.dollarImpact)}/yr</span>
                )}
              </div>
              <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>{d.detail}</p>
              {showBars && d.dollarImpact > 0 && (
                <div style={{ height: 3, borderRadius: 2, background: SHELL.PAPER_DEEP, overflow: 'hidden', marginTop: 8 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: SHELL.RUST_TEXT, borderRadius: 2 }} />
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Impact projection
// ---------------------------------------------------------------------------

function ProjectionsPanel({ view }: { view: AiPressureDetailView }) {
  return (
    <Section eyebrow="Impact projection (if unresolved)">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {view.projections.map((p) => (
          <div key={p.days} style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 6 }}>
              {p.days}-day projection
            </div>
            {p.dollarImpact > 0 ? (
              <div style={{ fontFamily: SHELL.SERIF, fontSize: 20, fontWeight: 700, color: SHELL.RUST_TEXT, lineHeight: 1, marginBottom: 6 }}>
                {fmt$(p.dollarImpact)}
              </div>
            ) : (
              <div style={{ fontFamily: SHELL.SERIF, fontSize: 18, fontWeight: 700, color: SHELL.INK_MUTED, lineHeight: 1, marginBottom: 6 }}>
                Strategic
              </div>
            )}
            <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>{p.note}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Recommended actions
// ---------------------------------------------------------------------------

const EFFORT_LABELS: Record<string, string> = { low: 'Low effort', medium: 'Medium effort', high: 'High effort' };

function ActionsPanel({ view }: { view: AiPressureDetailView }) {
  return (
    <Section eyebrow="Recommended actions">
      <Card>
        {view.actions.map((a, i) => (
          <div key={a.rank} style={{ padding: '14px 16px', borderBottom: i < view.actions.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: SHELL.INK,
                color: SHELL.PAPER,
                fontFamily: SHELL.MONO,
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {a.rank}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, marginBottom: 4 }}>{a.title}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.MINT_TEXT, fontWeight: 600 }}>{a.estimatedRecovery}</span>
                <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: effortColor(a.effort) }}>{EFFORT_LABELS[a.effort]}</span>
                <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>{a.timeToImpact}</span>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface Props {
  pressureId: string;
}

export function AiPressureDetailPage({ pressureId }: Props) {
  const view = buildAiPressureDetailView(pressureId);

  if (!view) {
    return (
      <AppShell surface="tower" topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'Control Tower · Pressure not found' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: SHELL.PAPER }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontFamily: SHELL.MONO, fontSize: 12, color: SHELL.INK_MUTED, marginBottom: 8 }}>PRESSURE NOT FOUND</div>
            <Link href="/tower" style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>← Back to Control Tower</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const { pressure } = view;
  const sColor = severityColor(pressure.severity);
  const sBg = severityBg(pressure.severity);

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `AI Control Tower · ${view.pressureTypeLabel}`,
      }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote={view.nexusQuote}
        agentContext={view.nexusContext}
        actions={[...view.nexusActions]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>
        {/* Back */}
        <Link
          href={`/tower/programs/${view.programId}`}
          style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
        >
          ← {view.programName}
        </Link>

        {/* Pressure header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', background: sBg, color: sColor, padding: '3px 10px', borderRadius: 10 }}>
              {pressure.severity}
            </span>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, letterSpacing: '0.08em' }}>
              {pressure.type} · {view.pressureTypeLabel}
            </span>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: trajectoryColor(view.trajectory), marginLeft: 'auto' }}>
              {trajectoryLabel(view.trajectory)}
            </span>
          </div>

          <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 22, fontWeight: 700, color: SHELL.INK, margin: '0 0 10px', lineHeight: 1.2 }}>
            {view.pressureTypeLabel} · {view.programName}
          </h1>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {pressure.dollarImpact > 0 && (
              <span style={{ fontFamily: SHELL.SANS, fontSize: 16, fontWeight: 700, color: SHELL.RUST_TEXT }}>
                {fmt$(pressure.dollarImpact)}/yr impact
              </span>
            )}
            <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
              {pressure.daysOpen} days open
            </span>
          </div>

          <p style={{ margin: '12px 0 0', fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, lineHeight: 1.6, maxWidth: 680 }}>
            {pressure.summary}
          </p>
        </div>

        <DriversPanel view={view} />
        <ProjectionsPanel view={view} />
        <ActionsPanel view={view} />

        {/* Footer */}
        <div style={{ paddingTop: 16, borderTop: `1px solid ${SHELL.CARD_LINE}`, display: 'flex', gap: 24 }}>
          <Link href="/tower" style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none' }}>
            ← Portfolio overview
          </Link>
          <Link href={`/tower/programs/${view.programId}`} style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none' }}>
            {view.programName} detail →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
