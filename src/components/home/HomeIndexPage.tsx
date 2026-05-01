'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useCallback, useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
// AgentColumn used to render here as the left-rail chat. PR-J replaced
// it with the embedded chat inside <AgentCanvas>; the legacy import
// is dropped along with the static A/B/C action buttons.
import { AgentCanvas } from '@/components/programs/AgentCanvas';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import { HOME_VIEW } from '@/lib/home/shell-home-fixture';
import type { ReasoningDashboardSummary } from '@/lib/reasoning/dashboard-summary';

// ─── Detail color helpers ───────────────────────────────────────────────────

type DetailColor = 'peach' | 'amber' | 'mint';

function detailColorValue(dc: DetailColor): string {
  if (dc === 'peach') return SHELL.PEACH_TEXT;
  if (dc === 'amber') return SHELL.AMBER_DOT;
  return SHELL.MINT_TEXT;
}

// ─── Gate status badge color ─────────────────────────────────────────────────

type GateStatus = 'pending' | 'open' | 'cleared';

function gateBackground(gs: GateStatus): string {
  if (gs === 'pending') return SHELL.PEACH_BG;
  return SHELL.MINT_BG;
}

function gateBorder(gs: GateStatus): string {
  if (gs === 'pending') return SHELL.PEACH_LINE;
  return SHELL.MINT_LINE;
}

function gateText(gs: GateStatus): string {
  if (gs === 'pending') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

// ─── Stats card ──────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: string;
  detail: string;
  detailColor: DetailColor;
  urgent?: boolean;
}

function StatsCard({ label, value, detail, detailColor, urgent = false }: StatCard) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderLeft: urgent ? `4px solid ${SHELL.PEACH_TEXT}` : `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 22,
          color: SHELL.INK,
          fontWeight: 700,
          lineHeight: 1.15,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 6,
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          color: detailColorValue(detailColor),
          lineHeight: 1.3,
        }}
      >
        {detail}
      </div>
    </div>
  );
}

// ─── Program row ─────────────────────────────────────────────────────────────

export interface HomeProgramRow {
  id?: string;
  displayId: string;
  name: string;
  phase: number;
  phaseLabel: string;
  gateStatus: GateStatus;
  href: string;
}

function ProgramRow({ displayId, name, phase, phaseLabel, gateStatus, href }: HomeProgramRow) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 7,
        border: `1px solid ${SHELL.CARD_LINE}`,
        background: SHELL.CARD_WHITE,
        marginBottom: 8,
      }}
    >
      {/* Top row: displayId + gate badge + arrow link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
          }}
        >
          {displayId}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: gateText(gateStatus),
            background: gateBackground(gateStatus),
            border: `1px solid ${gateBorder(gateStatus)}`,
            borderRadius: 4,
            padding: '2px 6px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            lineHeight: 1,
          }}
        >
          {gateStatus === 'pending' ? 'gate pending' : gateStatus === 'cleared' ? 'gate cleared' : 'open'}
        </span>
        <Link
          href={href}
          style={{
            marginLeft: 'auto',
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
          }}
        >
          →
        </Link>
      </div>

      {/* Program name */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 14,
          color: SHELL.INK,
          lineHeight: 1.3,
          marginBottom: 3,
        }}
      >
        {name}
      </div>

      {/* Phase label */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          color: SHELL.INK_SOFT,
          lineHeight: 1,
        }}
      >
        P{phase} {phaseLabel}
      </div>
    </div>
  );
}

// ─── Top pressure card ───────────────────────────────────────────────────────

function TopPressureCard() {
  const p = HOME_VIEW.topPressure;
  return (
    <div
      style={{
        background: SHELL.RUST_BG,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        borderRadius: 8,
        padding: '16px 20px',
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.RUST_TEXT,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            lineHeight: 1,
          }}
        >
          HIGH SEVERITY
        </span>
        <span style={{ color: SHELL.RUST_TEXT, fontSize: 10 }}>●</span>
      </div>

      {/* Hero stat */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 20,
          color: SHELL.INK,
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: 3,
        }}
      >
        {p.heroStat}
      </div>

      {/* Hero label */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          color: SHELL.INK_SOFT,
          marginBottom: 10,
          lineHeight: 1.3,
        }}
      >
        {p.heroLabel}
      </div>

      {/* Atlas sentence */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.RUST_TEXT,
          fontStyle: 'italic',
          lineHeight: 1.45,
          marginBottom: 12,
        }}
      >
        {p.atlasSentence}
      </div>

      {/* Link */}
      <Link
        href={p.href}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_SOFT,
          textDecoration: 'none',
        }}
      >
        View Tower →
      </Link>
    </div>
  );
}

// ─── Source event mini ────────────────────────────────────────────────────────

function SourceEventMini() {
  const s = HOME_VIEW.sourceEvent;
  return (
    <div
      style={{
        marginTop: 16,
        padding: '12px 16px',
        background: SHELL.BLUE_BG,
        border: `1px solid ${SHELL.BLUE_LINE}`,
        borderRadius: 8,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            lineHeight: 1,
          }}
        >
          SOURCE · ACTIVE
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_SOFT,
            background: SHELL.BLUE_LINE,
            borderRadius: 4,
            padding: '2px 6px',
            lineHeight: 1,
          }}
        >
          {s.stageNumber}
        </span>
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 13,
          color: SHELL.INK,
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {s.name}
      </div>

      {/* Stage line */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          color: SHELL.INK_SOFT,
          lineHeight: 1.3,
          marginBottom: 8,
        }}
      >
        Stage {s.stageNumber}: {s.stage} · Linked: {s.linkedProgram}
      </div>

      <Link
        href={s.href}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_SOFT,
          textDecoration: 'none',
        }}
      >
        View Source →
      </Link>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 10,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          lineHeight: 1,
        }}
      >
        {title}
      </span>
      <Link
        href={viewAllHref}
        style={{
          marginLeft: 'auto',
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          textDecoration: 'none',
          letterSpacing: '0.08em',
        }}
      >
        View all →
      </Link>
    </div>
  );
}

// ─── Reasoning intelligence row ──────────────────────────────────────────────

interface ReasoningCardProps {
  label: string;
  value: string;
  detail: string;
  detailColor: string;
  href: string;
}

function ReasoningCard({ label, value, detail, detailColor, href }: ReasoningCardProps) {
  return (
    <Link
      href={href}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          padding: '12px 14px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
      >
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            color: SHELL.INK,
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 3,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 5,
            lineHeight: 1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: detailColor,
            lineHeight: 1.3,
          }}
        >
          {detail}
        </div>
      </div>
    </Link>
  );
}

function ReasoningIntelligenceRow({ data }: { data: ReasoningDashboardSummary }) {
  const { health, gatePassRatePct, criticalAlertCount, coverage } = data;

  // Health card — colored dot indicators
  const healthValue = (
    <span style={{ fontFamily: SHELL.SERIF, fontSize: 20, fontWeight: 700, color: SHELL.INK }}>
      <span style={{ color: SHELL.MINT_TEXT }}>{health.healthy}</span>
      {' / '}
      <span style={{ color: SHELL.AMBER_DOT }}>{health.degraded}</span>
      {' / '}
      <span style={{ color: SHELL.RUST_TEXT }}>{health.critical}</span>
    </span>
  );

  const alertDetail =
    criticalAlertCount === 0
      ? 'All clear'
      : `${criticalAlertCount} critical alert${criticalAlertCount !== 1 ? 's' : ''}`;
  const alertDetailColor = criticalAlertCount === 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT;

  const coveragePct =
    coverage.total === 0
      ? '100%'
      : `${Math.round((coverage.covered / coverage.total) * 100)}%`;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section label */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          lineHeight: 1,
          marginBottom: 10,
        }}
      >
        Reasoning Intelligence
      </div>

      {/* Four cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {/* 1 — Portfolio health */}
        <Link href="/admin/reasoning/health" style={{ textDecoration: 'none', display: 'block' }}>
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <div style={{ marginBottom: 3 }}>{healthValue}</div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: SHELL.INK_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 5,
                lineHeight: 1,
              }}
            >
              Portfolio health
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 11,
                color: SHELL.INK_SOFT,
                lineHeight: 1.3,
              }}
            >
              <span style={{ color: SHELL.MINT_TEXT }}>● healthy</span>
              {' · '}
              <span style={{ color: SHELL.AMBER_DOT }}>● degraded</span>
              {' · '}
              <span style={{ color: SHELL.RUST_TEXT }}>● critical</span>
            </div>
          </div>
        </Link>

        {/* 2 — Gate pass rate */}
        <ReasoningCard
          label="Gate pass rate"
          value={`${gatePassRatePct}%`}
          detail="avg across all instances"
          detailColor={
            gatePassRatePct >= 75 ? SHELL.MINT_TEXT : gatePassRatePct >= 50 ? SHELL.AMBER_DOT : SHELL.RUST_TEXT
          }
          href="/admin/reasoning/health"
        />

        {/* 3 — Active alerts */}
        <ReasoningCard
          label="Active alerts"
          value={criticalAlertCount === 0 ? '—' : String(criticalAlertCount)}
          detail={alertDetail}
          detailColor={alertDetailColor}
          href="/admin/reasoning/health"
        />

        {/* 4 — Template coverage */}
        <ReasoningCard
          label="Template coverage"
          value={coveragePct}
          detail={`${coverage.covered}/${coverage.total} templates`}
          detailColor={SHELL.MINT_TEXT}
          href="/admin/reasoning/coverage"
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function HomeIndexPage({
  activeTenantName,
  hasTenantKey = false,
  reasoning,
  livePrograms = [],
}: {
  activeTenantName: string;
  hasTenantKey?: boolean;
  reasoning?: ReasoningDashboardSummary;
  livePrograms?: HomeProgramRow[];
}) {
  const v = HOME_VIEW;
  const seenProgramIds = new Set<string>();
  const topPrograms = [...livePrograms, ...v.topPrograms]
    .filter((program) => {
      const key = program.id ?? program.href;
      if (seenProgramIds.has(key)) return false;
      seenProgramIds.add(key);
      return true;
    })
    .slice(0, 5);
  const programsSectionRef = useRef<HTMLDivElement>(null);

  // PR-J · live artifacts dispatched by the embedded Atlas chat. Same
  // pattern as ProgramDetailPage / ProgramsIndexPage. Atlas reasons at
  // portfolio scope; the reactive panel materializes pressure cards,
  // gate evaluations, cross-program dependencies as Atlas surfaces them.
  const [atlasArtifacts, setAtlasArtifacts] = useState<Artifact[]>([]);
  const handleAtlasArtifact = useCallback((artifact: Artifact) => {
    setAtlasArtifacts((prev) => {
      const key = JSON.stringify(artifact);
      if (prev.some((a) => JSON.stringify(a) === key)) return prev;
      return [...prev, artifact];
    });
  }, []);

  // Note: the legacy A/B/C quick-action handler used to feed AgentColumn.
  // PR-J dropped AgentColumn for this surface — Atlas chat is now the
  // navigation. (If we want suggested-prompt chips back, add them to
  // AgentCanvas via a follow-up.)

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName: activeTenantName,
        showLocked: v.tenantLocked,
        context: 'Home',
        timeString: v.dateString,
      }}
      hasTenantKey={hasTenantKey}
      middleStrip={
        <div
          data-testid="home-middle-strip"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: SHELL.INK_SOFT,
          }}
        >
          <span>Morning pulse</span>
          <span style={{ color: SHELL.PEACH_TEXT }}>CDP build gate 2 of 5</span>
          <span>AI spend high severity</span>
          <span>AMS at BAFO</span>
        </div>
      }
      onArtifact={handleAtlasArtifact}
    >
      {/* PR-J · agent-centric primary canvas. Atlas + reactive panel
          dominate the viewport; the legacy greeting + dashboard
          collapses into a details accordion below. AgentColumn (the
          legacy left-rail chat widget) is deprecated for this
          surface — chat lives inside AgentCanvas now.

          Voice: Atlas. AppShell.DEFAULT_AGENT['home']='Atlas' so the
          server-side voiceLine is already Atlas; the prior code
          showed a "Nx · Nexus" badge in AgentColumn which mismatched
          the actual responder. Fixing here. */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 28px 0' }}>
          <AgentCanvas
            surface="/home"
            agent={{ initials: 'At', name: 'Atlas', role: 'Portfolio CIO of staff' }}
            quote={v.agentQuote}
            artifacts={atlasArtifacts}
            onArtifact={handleAtlasArtifact}
          />
        </div>

        <details
          data-testid="home-legacy-dashboard"
          style={{
            margin: '0 28px 28px',
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            background: SHELL.PAPER_SOFT,
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              padding: '12px 16px',
              fontFamily: SHELL.MONO,
              fontSize: 11,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: SHELL.GRAY_TEXT,
              fontWeight: 700,
              userSelect: 'none',
            }}
          >
            Morning pulse · greeting · pressures · programs queue
          </summary>

      {/* Work pane */}
      <div
        style={{
          padding: '28px 32px',
          overflowY: 'auto',
          background: SHELL.PAPER_SOFT,
        }}
      >
        {/* Greeting header */}
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 26,
            color: SHELL.INK,
            fontWeight: 400,
            margin: '0 0 4px 0',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {v.greeting}
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_SOFT,
            margin: '0 0 24px 0',
            lineHeight: 1.4,
          }}
        >
          {v.subgreeting}
        </p>

        {/* Reasoning intelligence row */}
        {reasoning !== undefined && (
          <ReasoningIntelligenceRow data={reasoning} />
        )}

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {v.stats.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Two-column section */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          {/* Left col: Active programs */}
          <div ref={programsSectionRef} style={{ flex: 1.4, minWidth: 0 }}>
            <SectionHeader title="Active programs" viewAllHref="/programs" />
            {topPrograms.map((prog) => (
              <ProgramRow key={prog.id ?? prog.href} {...prog} />
            ))}
          </div>

          {/* Right col: Tower + Source */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionHeader title="Tower pressure" viewAllHref="/tower" />
            <TopPressureCard />
            <SourceEventMini />
          </div>
        </div>
      </div>
        </details>
      </div>
    </AppShell>
  );
}
