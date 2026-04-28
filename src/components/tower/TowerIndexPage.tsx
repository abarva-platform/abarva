'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildAiProgramPortfolioView,
  AI_PROGRAM_TYPE_LABELS,
  type AiProgram,
  type AiPortfolioKpis,
} from '@/lib/tower/ai-program-portfolio-fixture';

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

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function roiColor(roi: number): string {
  if (roi >= 1) return SHELL.MINT_TEXT;
  if (roi >= 0) return SHELL.INK_SOFT;
  return SHELL.RUST_TEXT;
}

function severityDot(severity: 'critical' | 'high' | 'medium' | 'low'): string {
  if (severity === 'critical' || severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function lifecyclePill(phase: AiProgram['lifecyclePhase']): { bg: string; text: string; label: string } {
  if (phase === 'steady-state') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Steady state' };
  if (phase === 'rollout') return { bg: SHELL.BLUE_BG, text: SHELL.INK_SOFT, label: 'Rollout' };
  if (phase === 'at-risk') return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, label: 'At risk' };
  return { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Pilot' };
}

// ---------------------------------------------------------------------------
// KPI band (5 cards)
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 22,
          fontWeight: 700,
          color: valueColor ?? SHELL.INK,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            lineHeight: 1.4,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function KpiBand({ kpis }: { kpis: AiPortfolioKpis }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
      <KpiCard
        label="Total AI spend"
        value={fmt$(kpis.totalAnnualSpend)}
        sub="annualized run rate"
      />
      <KpiCard
        label="Value captured"
        value={fmt$(kpis.totalValueCaptured)}
        sub="trailing 12-mo attributed"
      />
      <KpiCard
        label="Portfolio ROI"
        value={fmtRoi(kpis.portfolioRoi)}
        sub="risk-adjusted below 1.0x"
        valueColor={roiColor(kpis.portfolioRoi)}
      />
      <KpiCard
        label="Active pressures"
        value={String(kpis.activePressuresCount)}
        sub="across all programs"
        valueColor={kpis.activePressuresCount > 4 ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT}
      />
      <KpiCard
        label="Decisions pending"
        value={String(kpis.decisionsPendingCount)}
        sub="awaiting review"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pressure summary row (inline within program row)
// ---------------------------------------------------------------------------

function PressureDots({ program }: { program: AiProgram }) {
  if (program.pressures.length === 0) {
    return (
      <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.MINT_TEXT }}>
        ✓ none
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {program.pressures.map((p) => (
        <span
          key={p.id}
          title={p.summary}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.1em',
            color: severityDot(p.severity),
            background:
              p.severity === 'critical' || p.severity === 'high'
                ? SHELL.RUST_BG
                : p.severity === 'medium'
                  ? SHELL.PEACH_BG
                  : SHELL.MINT_BG,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {p.type}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Program table
// ---------------------------------------------------------------------------

const COL_STYLES: Record<string, React.CSSProperties> = {
  name:     { flex: '0 0 180px' },
  type:     { flex: '0 0 110px' },
  spend:    { flex: '0 0 90px', textAlign: 'right' as const },
  value:    { flex: '0 0 90px', textAlign: 'right' as const },
  roi:      { flex: '0 0 70px', textAlign: 'right' as const },
  adoption: { flex: '0 0 80px', textAlign: 'right' as const },
  phase:    { flex: '0 0 100px' },
  pressure: { flex: 1, minWidth: 120 },
};

function TableHeader() {
  const headerStyle: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: SHELL.INK_MUTED,
  };
  return (
    <div
      style={{
        display: 'flex',
        padding: '8px 16px',
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        gap: 12,
      }}
    >
      <span style={{ ...headerStyle, ...COL_STYLES.name }}>Program</span>
      <span style={{ ...headerStyle, ...COL_STYLES.type }}>Type</span>
      <span style={{ ...headerStyle, ...COL_STYLES.spend }}>Spend / yr</span>
      <span style={{ ...headerStyle, ...COL_STYLES.value }}>Value 12mo</span>
      <span style={{ ...headerStyle, ...COL_STYLES.roi }}>ROI</span>
      <span style={{ ...headerStyle, ...COL_STYLES.adoption }}>Adoption</span>
      <span style={{ ...headerStyle, ...COL_STYLES.phase }}>Phase</span>
      <span style={{ ...headerStyle, ...COL_STYLES.pressure }}>Pressures</span>
    </div>
  );
}

function ProgramRow({ program, index, total }: { program: AiProgram; index: number; total: number }) {
  const pill = lifecyclePill(program.lifecyclePhase);
  const isLast = index === total - 1;

  return (
    <Link
      href={`/tower/programs/${program.id}`}
      style={{
        display: 'flex',
        padding: '12px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${SHELL.CARD_LINE_SOFT}`,
        gap: 12,
        alignItems: 'center',
        textDecoration: 'none',
      }}
    >
      {/* Program name + vendor */}
      <div style={{ ...COL_STYLES.name, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1.2,
          }}
        >
          {program.name}
        </span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.1em' }}>
          {program.vendor}
        </span>
      </div>

      {/* Type */}
      <span
        style={{
          ...COL_STYLES.type,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_SOFT,
          letterSpacing: '0.08em',
        }}
      >
        {AI_PROGRAM_TYPE_LABELS[program.programType]}
      </span>

      {/* Spend */}
      <span
        style={{
          ...COL_STYLES.spend,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
        }}
      >
        {fmt$(program.annualSpend)}
      </span>

      {/* Value */}
      <span
        style={{
          ...COL_STYLES.value,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
        }}
      >
        {fmt$(program.valueCaptures)}
      </span>

      {/* ROI */}
      <span
        style={{
          ...COL_STYLES.roi,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          fontWeight: 600,
          color: roiColor(program.roi),
        }}
      >
        {fmtRoi(program.roi)}
      </span>

      {/* Adoption */}
      <span
        style={{
          ...COL_STYLES.adoption,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: program.adoptionPct > 0 ? SHELL.INK : SHELL.INK_MUTED,
        }}
      >
        {program.adoptionPct > 0 ? fmtPct(program.adoptionPct) : '—'}
      </span>

      {/* Phase pill */}
      <div style={COL_STYLES.phase}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: pill.bg,
            color: pill.text,
            padding: '3px 8px',
            borderRadius: 10,
            lineHeight: 1,
          }}
        >
          {pill.label}
        </span>
      </div>

      {/* Pressures */}
      <div style={COL_STYLES.pressure}>
        <PressureDots program={program} />
      </div>
    </Link>
  );
}

function ProgramTable({ programs }: { programs: readonly AiProgram[] }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 28,
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          AI program portfolio · {programs.length} programs
        </span>
        <Link
          href="/tower/lens/value"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
          }}
        >
          Value lens →
        </Link>
      </div>
      <TableHeader />
      {programs.map((program, i) => (
        <ProgramRow key={program.id} program={program} index={i} total={programs.length} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vendor concentration bar
// ---------------------------------------------------------------------------

function VendorConcentrationBar({ programs }: { programs: readonly AiProgram[] }) {
  const totalSpend = programs.reduce((s, p) => s + p.annualSpend, 0);
  const byVendor = programs.reduce<Record<string, number>>((acc, p) => {
    acc[p.vendor] = (acc[p.vendor] ?? 0) + p.annualSpend;
    return acc;
  }, {});

  const sorted = Object.entries(byVendor).sort((a, b) => b[1] - a[1]);
  const COLORS = [SHELL.INK, SHELL.INK_MID, SHELL.INK_SOFT, SHELL.INK_MUTED, SHELL.GRAY_TEXT];

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          Vendor concentration
        </span>
        <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED }}>
          {fmt$(totalSpend)} total
        </span>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
        {sorted.map(([vendor, spend], i) => (
          <div
            key={vendor}
            title={`${vendor}: ${fmt$(spend)} (${Math.round((spend / totalSpend) * 100)}%)`}
            style={{
              width: `${(spend / totalSpend) * 100}%`,
              background: COLORS[i % COLORS.length],
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {sorted.map(([vendor, spend], i) => (
          <div key={vendor} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: COLORS[i % COLORS.length],
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT }}>
              {vendor}
            </span>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
              {Math.round((spend / totalSpend) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function TowerIndexPage() {
  const [showNewPressure, setShowNewPressure] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeFilter = searchParams?.get('filter') ?? 'all';

  const portfolio = buildAiProgramPortfolioView();
  const { kpis, programs, agentQuote, agentContext, actions } = portfolio;

  // Filter programs by active filter (all programs for now — phase filter in T2)
  const filteredPrograms = programs.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'high') return p.pressures.some((x) => x.severity === 'high' || x.severity === 'critical');
    if (activeFilter === 'medium') return p.pressures.some((x) => x.severity === 'medium');
    if (activeFilter === 'low') return p.pressures.every((x) => x.severity === 'low') && p.pressures.length > 0;
    if (activeFilter === 'resolved') return p.pressures.length === 0;
    return true;
  });

  const filterPills = [
    { key: 'all', label: 'All programs', active: activeFilter === 'all', count: programs.length, onClick: () => router.push('/tower') },
    { key: 'high', label: 'High pressure', active: activeFilter === 'high', count: programs.filter((p) => p.pressures.some((x) => x.severity === 'high' || x.severity === 'critical')).length, onClick: () => router.push('/tower?filter=high') },
    { key: 'medium', label: 'Medium', active: activeFilter === 'medium', count: programs.filter((p) => p.pressures.some((x) => x.severity === 'medium')).length, onClick: () => router.push('/tower?filter=medium') },
    { key: 'low', label: 'Low watch', active: activeFilter === 'low', count: programs.filter((p) => p.pressures.length > 0 && p.pressures.every((x) => x.severity === 'low')).length, onClick: () => router.push('/tower?filter=low') },
    { key: 'resolved', label: 'No pressures', active: activeFilter === 'resolved', count: programs.filter((p) => p.pressures.length === 0).length, onClick: () => router.push('/tower?filter=resolved') },
  ];

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `AI Control Tower · ${fmt$(kpis.totalAnnualSpend)} portfolio`,
      }}
      middleStrip={<FilterPillStrip pills={filterPills} />}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote={agentQuote}
        agentContext={agentContext}
        actions={[...actions]}
        surface="tower"
        onActionClick={(letter) => {
          if (letter === 'A') router.push('/tower?filter=high');
          else if (letter === 'B') router.push('/tower/programs/twr-prog-now-assist');
          else if (letter === 'C') router.push('/tower/programs/twr-prog-claude-code');
        }}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* KPI band */}
        <KpiBand kpis={kpis} />

        {/* AI program portfolio table */}
        <ProgramTable programs={filteredPrograms} />

        {/* Vendor concentration */}
        <VendorConcentrationBar programs={programs} />

        {/* Footer links to lenses */}
        <div
          style={{
            paddingTop: 16,
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
            display: 'flex',
            gap: 24,
          }}
        >
          <Link
            href="/tower/lens/value"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
            }}
          >
            Value lens →
          </Link>
          <Link
            href="/tower/lens/adoption"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
            }}
          >
            Adoption lens →
          </Link>
          <Link
            href="/tower/lens/risk"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
            }}
          >
            Risk lens →
          </Link>
          <Link
            href="/tower/activity"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
            }}
          >
            Decisions log →
          </Link>
        </div>
      </div>

      {showNewPressure && (
        <div
          onClick={() => setShowNewPressure(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: SHELL.PAPER,
              borderRadius: 12,
              padding: '24px 28px',
              maxWidth: 440,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontFamily: SHELL.SERIF, fontSize: 16, fontWeight: 700, color: SHELL.INK }}>
              Set new pressure
            </span>
            <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, marginTop: 8 }}>
              Use the program detail page to add pressures to a specific AI program.
            </p>
            <button
              onClick={() => setShowNewPressure(false)}
              style={{
                marginTop: 16,
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK,
                background: 'none',
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 6,
                padding: '7px 14px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
