'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { HOME_VIEW } from '@/lib/home/shell-home-fixture';

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
}

function StatsCard({ label, value, detail, detailColor }: StatCard) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
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

interface ProgramRow {
  displayId: string;
  name: string;
  phase: number;
  phaseLabel: string;
  gateStatus: GateStatus;
  href: string;
}

function ProgramRow({ displayId, name, phase, phaseLabel, gateStatus, href }: ProgramRow) {
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

// ─── Main component ────────────────────────────────────────────────────────────

export function HomeIndexPage() {
  const v = HOME_VIEW;
  const router = useRouter();
  const programsSectionRef = useRef<HTMLDivElement>(null);

  function handleActionClick(letter: 'A' | 'B' | 'C') {
    if (letter === 'A') {
      // CDP architecture sprint — drill into the P3 Design detail
      router.push('/programs/apx-cdp-2026');
    } else if (letter === 'B') {
      // AI Cloud Spend pressure
      router.push('/tower/pressures/twr-ai-cloud-spend');
    } else if (letter === 'C') {
      // AMS BAFO award — drill into the source event (Wave S1 route)
      router.push('/source/events/apex-retail-ams-outsourcing-2026');
    }
  }

  return (
    <AppShell
      topBarProps={{
        tenantName: v.tenant,
        showLocked: v.tenantLocked,
        context: 'Home',
        timeString: v.dateString,
      }}
    >
      {/* Agent column */}
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Executive guide' }}
        quote={v.agentQuote}
        agentContext={v.agentContext}
        actions={v.actions}
        surface="home"
        onActionClick={handleActionClick}
      />

      {/* Work pane */}
      <div
        style={{
          flex: 1,
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
            {v.topPrograms.map((prog) => (
              <ProgramRow key={prog.id} {...prog} />
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
    </AppShell>
  );
}
