'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildAiProgramPortfolioView,
  CONFIDENCE_HAIRCUT,
  type AiProgram,
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

function fmtRoi(roi: number): string {
  if (roi > 0) return `+${roi.toFixed(1)}x`;
  return `${roi.toFixed(2)}x`;
}

// ---------------------------------------------------------------------------
// ROI bar — shows gross vs risk-adjusted
// ---------------------------------------------------------------------------

function RoiBar({ program }: { program: AiProgram }) {
  const haircut = CONFIDENCE_HAIRCUT[program.attributionConfidence];
  const isPositive = program.roi >= 0;
  const barColor = isPositive ? SHELL.MINT_TEXT : SHELL.RUST_TEXT;
  const barWidth = Math.min(Math.abs(program.roi) / 10, 1) * 100; // scale to 10x max

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 11, fontWeight: 700, color: barColor }}>
          {fmtRoi(program.roi)} gross
        </span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED }}>
          {fmtRoi(program.riskAdjustedRoi)} adjusted ({(haircut * 100).toFixed(0)}% haircut)
        </span>
      </div>
      <div style={{ height: 6, background: SHELL.GRAY_BG, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: barColor, borderRadius: 3 }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confidence pill
// ---------------------------------------------------------------------------

function ConfidencePill({ confidence }: { confidence: AiProgram['attributionConfidence'] }) {
  const meta = {
    high:   { label: 'High confidence', bg: SHELL.MINT_BG, color: SHELL.MINT_TEXT },
    medium: { label: 'Medium confidence', bg: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT },
    low:    { label: 'Low confidence', bg: SHELL.RUST_BG, color: SHELL.RUST_TEXT },
  }[confidence];

  return (
    <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: meta.bg, color: meta.color, padding: '2px 7px', borderRadius: 8 }}>
      {meta.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle pill
// ---------------------------------------------------------------------------

function LifecyclePill({ phase }: { phase: AiProgram['lifecyclePhase'] }) {
  const meta = {
    pilot:          { label: 'Pilot', bg: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT },
    rollout:        { label: 'Rollout', bg: SHELL.PEACH_BG, color: SHELL.PEACH_TEXT },
    'steady-state': { label: 'Steady state', bg: SHELL.MINT_BG, color: SHELL.MINT_TEXT },
    'at-risk':      { label: 'At risk', bg: SHELL.RUST_BG, color: SHELL.RUST_TEXT },
  }[phase];

  return (
    <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: meta.bg, color: meta.color, padding: '2px 7px', borderRadius: 8 }}>
      {meta.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Program outcome card
// ---------------------------------------------------------------------------

function ProgramCard({ program }: { program: AiProgram }) {
  const pressureCount = program.pressures.length;

  return (
    <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '18px 22px', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SHELL.SERIF, fontSize: 17, fontWeight: 600, color: SHELL.INK, marginBottom: 2 }}>{program.name}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED }}>{program.vendor} · {program.owner}</div>
        </div>
        <LifecyclePill phase={program.lifecyclePhase} />
        <ConfidencePill confidence={program.attributionConfidence} />
        <Link href={`/tower/programs/${program.id}`} style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_SOFT, textDecoration: 'none', alignSelf: 'flex-start', paddingTop: 2 }}>
          Detail →
        </Link>
      </div>

      {/* Value / spend row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Annual spend', value: fmt$(program.annualSpend), color: SHELL.INK },
          { label: 'Value captured', value: fmt$(program.valueCaptures), color: program.valueCaptures >= program.annualSpend ? SHELL.MINT_TEXT : SHELL.RUST_TEXT },
          {
            label: 'Risk-adj. value',
            value: fmt$(program.valueCaptures * CONFIDENCE_HAIRCUT[program.attributionConfidence]),
            color: SHELL.INK_SOFT,
          },
          { label: 'Active pressures', value: pressureCount > 0 ? String(pressureCount) : '—', color: pressureCount > 0 ? SHELL.RUST_TEXT : SHELL.INK_MUTED },
        ].map((m) => (
          <div key={m.label} style={{ background: SHELL.PAPER_SOFT, borderRadius: 7, padding: '8px 12px' }}>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 11, fontWeight: 700, color: m.color, marginBottom: 2 }}>{m.value}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* ROI bar */}
      <RoiBar program={program} />

      {/* Attribution method */}
      <div style={{ marginTop: 10, fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
        Attribution: {program.attributionMethod}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Portfolio summary
// ---------------------------------------------------------------------------

function PortfolioSummary({ programs }: { programs: readonly AiProgram[] }) {
  const totalSpend = programs.reduce((s, p) => s + p.annualSpend, 0);
  const totalValue = programs.reduce((s, p) => s + p.valueCaptures, 0);
  const riskAdjValue = programs.reduce((s, p) => s + p.valueCaptures * CONFIDENCE_HAIRCUT[p.attributionConfidence], 0);
  const atRisk = programs.filter((p) => p.lifecyclePhase === 'at-risk').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
      {[
        { label: 'Total spend', value: fmt$(totalSpend), color: SHELL.INK },
        { label: 'Gross value captured', value: fmt$(totalValue), color: totalValue >= totalSpend ? SHELL.MINT_TEXT : SHELL.RUST_TEXT },
        { label: 'Risk-adj. value', value: fmt$(riskAdjValue), color: SHELL.INK_SOFT },
        { label: 'Programs at risk', value: atRisk > 0 ? String(atRisk) : '0', color: atRisk > 0 ? SHELL.RUST_TEXT : SHELL.MINT_TEXT },
      ].map((m) => (
        <div key={m.label} style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontFamily: SHELL.SERIF, fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AiOutcomePage() {
  const { programs, kpis } = buildAiProgramPortfolioView();

  const nexusQuote = `AI portfolio value realization: $${(kpis.totalValueCaptured / 1_000_000).toFixed(1)}M gross value captured against $${(kpis.totalAnnualSpend / 1_000_000).toFixed(1)}M spend. Risk-adjusted net is lower — Now Assist and AI Fluency are the drag. Claude Code is the outlier at 9.1x gross ROI. ${kpis.activePressuresCount} active pressures across the portfolio.`;

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'AI Control Tower · Outcome Realization',
      }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote={nexusQuote}
        agentContext={`Nexus · Value Lens · ${programs.length} programs · $${(kpis.totalValueCaptured / 1_000_000).toFixed(1)}M value`}
        actions={[
          { letter: 'A', text: 'Drill into Claude Code ROI', detail: '9.1x gross · expansion pending · 280 → 350 seats' },
          { letter: 'B', text: 'Review Now Assist shortfall', detail: '$1.7M below target · KB completion path or descope' },
          { letter: 'C', text: 'Attribution upgrade roadmap', detail: 'Low-confidence programs → cohort or A/B methodology' },
        ]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>
        <Link
          href="/tower"
          style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
        >
          ← Control Tower
        </Link>

        <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 22, fontWeight: 400, color: SHELL.INK, margin: '0 0 4px', lineHeight: 1.2 }}>
          Outcome realization
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: '0 0 20px' }}>
          ROI vs attribution confidence across the AI vendor portfolio
        </p>

        <PortfolioSummary programs={programs} />

        {[...programs]
          .sort((a, b) => b.roi - a.roi)
          .map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}

        <p style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, fontStyle: 'italic', marginTop: 8 }}>
          Risk-adjusted values apply confidence haircuts: high 1.0× · medium 0.6× · low 0.3×. All data is deterministic seed.
        </p>
      </div>
    </AppShell>
  );
}
