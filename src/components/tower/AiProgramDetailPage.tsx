'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildAiProgramDetailView,
  type AiProgramDetailView,
  type DeptAdoption,
  type PromisedOutcome,
  type RealizedOutcome,
} from '@/lib/tower/ai-program-detail-fixture';
import { AI_PROGRAM_TYPE_LABELS } from '@/lib/tower/ai-program-portfolio-fixture';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtRoi(roi: number): string {
  if (roi >= 0) return `${(roi + 1).toFixed(1)}x`;
  return `${roi.toFixed(2)}x`;
}

function roiColor(roi: number): string {
  if (roi >= 1) return SHELL.MINT_TEXT;
  if (roi >= 0) return SHELL.INK_SOFT;
  return SHELL.RUST_TEXT;
}

function scoreColor(score: number): string {
  if (score >= 70) return SHELL.MINT_TEXT;
  if (score >= 45) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  eyebrow,
  children,
  noPadBottom,
}: {
  eyebrow: string;
  children: React.ReactNode;
  noPadBottom?: boolean;
}) {
  return (
    <div style={{ marginBottom: noPadBottom ? 16 : 32 }}>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </div>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Value model panel
// ---------------------------------------------------------------------------

function OutcomeRow({
  label,
  value,
  variance,
  onTrack,
  isPromised,
}: {
  label: string;
  value: string;
  variance?: string;
  onTrack?: boolean;
  isPromised?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 16px',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK, flex: 1 }}>{label}</span>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          fontWeight: 600,
          color: isPromised ? SHELL.INK_SOFT : onTrack ? SHELL.MINT_TEXT : SHELL.RUST_TEXT,
          textAlign: 'right',
          minWidth: 120,
        }}
      >
        {value}
      </span>
      {variance && (
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: onTrack ? SHELL.MINT_TEXT : SHELL.RUST_TEXT,
            textAlign: 'right',
            minWidth: 140,
          }}
        >
          {variance}
        </span>
      )}
    </div>
  );
}

function ValueModelPanel({ view }: { view: AiProgramDetailView }) {
  return (
    <Section eyebrow="Value model">
      <Card>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}` }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, marginBottom: 4, letterSpacing: '0.08em' }}>
            {view.valueModelType}
          </div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>
            {view.valueFormula}
          </div>
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              background: SHELL.PAPER_SOFT,
              borderRadius: 5,
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              lineHeight: 1.5,
            }}
          >
            {view.attributionNote}
          </div>
        </div>

        {/* Table header */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '8px 16px',
            borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.12em', flex: 1, textTransform: 'uppercase' }}>Metric</span>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.12em', minWidth: 120, textAlign: 'right', textTransform: 'uppercase' }}>Promised</span>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.12em', minWidth: 120, textAlign: 'right', textTransform: 'uppercase' }}>Realized</span>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.12em', minWidth: 140, textAlign: 'right', textTransform: 'uppercase' }}>Variance</span>
        </div>

        {view.realizedOutcomes.map((r, i) => {
          const p = view.promisedOutcomes[i];
          return (
            <div
              key={r.metric}
              style={{
                display: 'flex',
                gap: 12,
                padding: '10px 16px',
                borderBottom: i < view.realizedOutcomes.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : 'none',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, flex: 1, lineHeight: 1.3 }}>{r.metric}</span>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, textAlign: 'right', minWidth: 120 }}>
                {p?.target ?? '—'}
              </span>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 600, color: r.onTrack ? SHELL.MINT_TEXT : SHELL.RUST_TEXT, textAlign: 'right', minWidth: 120 }}>
                {r.actual}
              </span>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: r.onTrack ? SHELL.MINT_TEXT : SHELL.RUST_TEXT, textAlign: 'right', minWidth: 140 }}>
                {r.variance}
              </span>
            </div>
          );
        })}
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Adoption panel
// ---------------------------------------------------------------------------

function AdoptionPanel({ view }: { view: AiProgramDetailView }) {
  const { program, adoptionByDept, behaviorChangeNote } = view;
  const hasUsers = program.eligibleUsers > 0;

  return (
    <Section eyebrow="Adoption">
      <Card>
        {/* Summary row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 0,
            borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          }}
        >
          {[
            { label: 'Eligible users', value: hasUsers ? program.eligibleUsers.toLocaleString() : '—' },
            { label: 'Active users', value: hasUsers && program.activeUsers > 0 ? program.activeUsers.toLocaleString() : '—' },
            { label: 'Adoption rate', value: program.adoptionPct > 0 ? `${(program.adoptionPct * 100).toFixed(0)}%` : '—' },
          ].map((m) => (
            <div key={m.label} style={{ padding: '14px 16px', borderRight: `1px solid ${SHELL.CARD_LINE_SOFT}` }}>
              <div style={{ fontFamily: SHELL.SERIF, fontSize: 20, fontWeight: 700, color: SHELL.INK, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Dept adoption bars */}
        {adoptionByDept.some((d) => d.eligible > 0) && (
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}` }}>
            <div style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              Adoption by department
            </div>
            {adoptionByDept.filter((d) => d.eligible > 0).map((d) => {
              const pct = d.eligible > 0 ? d.active / d.eligible : 0;
              const fillColor = pct >= 0.6 ? SHELL.MINT_TEXT : pct >= 0.3 ? SHELL.AMBER_DOT : SHELL.RUST_TEXT;
              return (
                <div key={d.dept} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT }}>{d.dept}</span>
                    <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: fillColor }}>
                      {(pct * 100).toFixed(0)}% ({d.active}/{d.eligible})
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: SHELL.PAPER_DEEP, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct * 100}%`, background: fillColor, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Behavior change note */}
        <div style={{ padding: '12px 16px', fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.55 }}>
          {behaviorChangeNote}
        </div>
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Pressure panel
// ---------------------------------------------------------------------------

function PressurePanel({ view }: { view: AiProgramDetailView }) {
  const { pressures } = view.program;
  if (pressures.length === 0) {
    return (
      <Section eyebrow="Pressures">
        <div style={{ padding: '14px 16px', background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
          No active pressures.
        </div>
      </Section>
    );
  }

  return (
    <Section eyebrow={`Pressures · ${pressures.length}`}>
      <Card>
        {pressures.map((p, i) => {
          const sColor = p.severity === 'critical' || p.severity === 'high' ? SHELL.RUST_TEXT : p.severity === 'medium' ? SHELL.AMBER_DOT : SHELL.INK_MUTED;
          const sBg = p.severity === 'critical' || p.severity === 'high' ? SHELL.RUST_BG : p.severity === 'medium' ? SHELL.PEACH_BG : SHELL.GRAY_BG;
          return (
            <div
              key={p.id}
              style={{
                padding: '12px 16px',
                borderLeft: `3px solid ${sColor}`,
                borderBottom: i < pressures.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: sBg, color: sColor, padding: '2px 7px', borderRadius: 8, flexShrink: 0 }}>
                  {p.severity}
                </span>
                <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, letterSpacing: '0.08em' }}>
                  {p.type}
                </span>
                {p.dollarImpact > 0 && (
                  <span style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 600, color: SHELL.RUST_TEXT, marginLeft: 'auto' }}>
                    {fmt$(p.dollarImpact)}/yr
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>{p.summary}</p>
              <div style={{ marginTop: 6, fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED }}>
                {p.daysOpen} days open
              </div>
            </div>
          );
        })}
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Vendor panel
// ---------------------------------------------------------------------------

function VendorPanel({ view }: { view: AiProgramDetailView }) {
  const { program, switchingCostLabel, vendorPerformanceScore, vendorNote, renewalLabel } = view;
  const sColor = scoreColor(vendorPerformanceScore);

  return (
    <Section eyebrow="Vendor">
      <Card>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          }}
        >
          {[
            { label: 'Vendor', value: program.vendor },
            { label: 'Performance score', value: `${vendorPerformanceScore}/100`, color: sColor },
            { label: 'Renewal', value: renewalLabel },
          ].map((m) => (
            <div key={m.label} style={{ padding: '14px 16px', borderRight: `1px solid ${SHELL.CARD_LINE_SOFT}` }}>
              <div style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 700, color: m.color ?? SHELL.INK, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.55, marginBottom: 8 }}>{vendorNote}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED }}>
            <span style={{ fontWeight: 600 }}>Switching cost: </span>{switchingCostLabel}
          </div>
        </div>
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Decisions panel
// ---------------------------------------------------------------------------

function DecisionsPanel({ view }: { view: AiProgramDetailView }) {
  const { linkedDecisions } = view;
  if (linkedDecisions.length === 0) {
    return (
      <Section eyebrow="Decisions log">
        <div style={{ padding: '14px 16px', background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
          No decisions logged for this program.
        </div>
      </Section>
    );
  }

  const TYPE_COLORS: Record<string, string> = {
    scale: SHELL.MINT_TEXT,
    kill: SHELL.RUST_TEXT,
    consolidate: SHELL.AMBER_DOT,
    renegotiate: SHELL.INK_SOFT,
    pivot: SHELL.PEACH_TEXT,
    defer: SHELL.GRAY_TEXT,
    'pilot-extend': SHELL.INK_SOFT,
  };

  return (
    <Section eyebrow={`Decisions · ${linkedDecisions.length}`}>
      <Card>
        {linkedDecisions.map((d, i) => (
          <div
            key={d.id}
            style={{
              padding: '12px 16px',
              borderBottom: i < linkedDecisions.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 4 }}>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: TYPE_COLORS[d.type] ?? SHELL.INK_MUTED,
                  background: `${TYPE_COLORS[d.type] ?? SHELL.INK_MUTED}18`,
                  padding: '2px 7px',
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                {d.type}
              </span>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, flex: 1 }}>{d.title}</span>
              <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, flexShrink: 0 }}>{d.date}</span>
            </div>
            <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>{d.summary}</p>
            <div style={{ marginTop: 6, fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED }}>
              Decided by {d.decidedBy} · {d.dollarImpact !== 0 ? `${fmt$(Math.abs(d.dollarImpact))} impact` : 'No $ impact'} · {d.status}
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
  programId: string;
}

export function AiProgramDetailPage({ programId }: Props) {
  const view = buildAiProgramDetailView(programId);

  if (!view) {
    return (
      <AppShell surface="tower" topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'Control Tower · Program not found' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: SHELL.PAPER }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontFamily: SHELL.MONO, fontSize: 12, color: SHELL.INK_MUTED, marginBottom: 8 }}>PROGRAM NOT FOUND</div>
            <Link href="/tower" style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>← Back to Control Tower</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const { program } = view;
  const pill = program.lifecyclePhase === 'steady-state'
    ? { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Steady state' }
    : program.lifecyclePhase === 'at-risk'
      ? { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, label: 'At risk' }
      : program.lifecyclePhase === 'rollout'
        ? { bg: SHELL.BLUE_BG, text: SHELL.INK_SOFT, label: 'Rollout' }
        : { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Pilot' };

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `AI Control Tower · ${program.name}`,
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
        <Link href="/tower" style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
          ← Control Tower
        </Link>

        {/* Program header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 6 }}>
            {AI_PROGRAM_TYPE_LABELS[program.programType]} · {program.vendor}
          </div>
          <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 24, fontWeight: 700, color: SHELL.INK, margin: '0 0 12px 0', lineHeight: 1.2 }}>
            {program.name}
          </h1>

          {/* Key metrics row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', background: pill.bg, color: pill.text, padding: '3px 10px', borderRadius: 10 }}>
              {pill.label}
            </span>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>
              {fmt$(program.annualSpend)} / yr
            </span>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: roiColor(program.roi) }}>
              ROI {fmtRoi(program.roi)}
            </span>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED }}>
              Owner: {program.owner}
            </span>
          </div>
        </div>

        <ValueModelPanel view={view} />
        <AdoptionPanel view={view} />
        <PressurePanel view={view} />
        <VendorPanel view={view} />
        <DecisionsPanel view={view} />

        {/* Actions strip */}
        <div style={{ paddingTop: 16, borderTop: `1px solid ${SHELL.CARD_LINE}`, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/tower" style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none' }}>
            ← Portfolio overview
          </Link>
          <Link href={`/tower/pressures/${program.pressures[0]?.id ?? ''}`} style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none' }}>
            Open pressure detail →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
