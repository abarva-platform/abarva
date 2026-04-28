'use client';

// SHELL-B — Programs Index page adapted to AppShell.
// Receives ProgramsIndexViewV2 (alias for programs-types ProgramsIndexView).

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ProgramRow, ProgramsIndexView as ProgramsIndexViewV2 } from '@/lib/programs/programs-types';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgramsIndexPageProps {
  view: ProgramsIndexViewV2;
}

// ─── Mini phase dots ──────────────────────────────────────────────────────────

function MiniPhaseDots({ phases }: { phases: ProgramRow['phases'] }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {phases.map((phase) => {
        let bg: string;
        let border: string | undefined;
        switch (phase.state) {
          case 'done':
            bg = SHELL.MINT_TEXT;
            break;
          case 'current':
            bg = SHELL.INK;
            break;
          case 'pending':
            bg = 'transparent';
            border = `1px solid ${SHELL.PEACH_TEXT}`;
            break;
          default:
            bg = SHELL.GRAY_BG;
        }
        return (
          <div
            key={phase.id}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: bg,
              border: border ?? 'none',
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Gate pill ────────────────────────────────────────────────────────────────

function GatePill({ status }: { status: ProgramRow['gateStatus'] }) {
  let bg: string;
  let color: string;
  let label: string;

  switch (status) {
    case 'pending':
      bg = SHELL.PEACH_BG;
      color = SHELL.PEACH_TEXT;
      label = 'Gate pending';
      break;
    case 'open':
    case 'approved':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = status === 'approved' ? 'Approved' : 'Gate open';
      break;
    default:
      bg = SHELL.GRAY_BG;
      color = SHELL.GRAY_TEXT;
      label = status === 'idle' ? 'Idle' : '—';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Program row ──────────────────────────────────────────────────────────────

function ProgramTableRow({ row }: { row: ProgramRow }) {
  const actionHref = `/programs/${row.id}?phase=${row.currentPhase}`;

  return (
    <Link
      href={`/programs/${row.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr 80px 108px 72px 80px',
        alignItems: 'center',
        height: 44,
        padding: '0 16px',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        textDecoration: 'none',
        color: SHELL.INK,
        gap: 8,
        transition: 'background 100ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = SHELL.PAPER_SOFT;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
      }}
    >
      {/* ID */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.06em',
        }}
      >
        {row.displayId}
      </span>

      {/* Name */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 700,
            color: SHELL.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}
        >
          {row.name}
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontStyle: 'italic',
            color: SHELL.INK_MUTED,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
            marginTop: 1,
          }}
        >
          {row.nexusNote}
        </div>
      </div>

      {/* Mini phase dots */}
      <div>
        <MiniPhaseDots phases={row.phases} />
      </div>

      {/* Gate pill */}
      <div>
        <GatePill status={row.gateStatus} />
      </div>

      {/* Last active */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.04em',
        }}
      >
        {row.lastActiveLabel}
      </span>

      {/* Action button */}
      <div
        onClick={(e) => e.preventDefault()}
        style={{ display: 'flex' }}
      >
        <Link
          href={actionHref}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 999,
            border: `1px solid ${SHELL.INK}`,
            background: 'transparent',
            color: SHELL.INK,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          {row.actionLabel}
        </Link>
      </div>
    </Link>
  );
}

// ─── Programs table ───────────────────────────────────────────────────────────

function ProgramsTable({ programs }: { programs: ProgramRow[] }) {
  const colHeaderStyle = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    fontWeight: 700 as const,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: SHELL.INK_MUTED,
  };

  return (
    <div
      style={{
        borderRadius: 10,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        overflow: 'hidden',
      }}
    >
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 80px 108px 72px 80px',
          padding: '7px 16px',
          gap: 8,
          background: SHELL.PAPER_SOFT,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        }}
      >
        <span style={colHeaderStyle}>ID</span>
        <span style={colHeaderStyle}>Program</span>
        <span style={colHeaderStyle}>Journey</span>
        <span style={colHeaderStyle}>Gate</span>
        <span style={colHeaderStyle}>Last active</span>
        <span style={colHeaderStyle}>Action</span>
      </div>

      {/* Rows */}
      {programs.map((row) => (
        <ProgramTableRow key={row.id} row={row} />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProgramsIndexPage({ view }: ProgramsIndexPageProps) {
  const filterPills = [
    { key: 'all', label: 'All', active: true },
    { key: 'active', label: 'Active' },
    { key: 'idle', label: 'Idle' },
    { key: 'gated', label: 'Gated', count: view.gatesPending },
  ];

  // Cast actions — fixture always uses 'A'|'B'|'C'; cast for AgentColumn type
  const agentActions = view.portfolioWorkbench.actions.map((a) => ({
    letter: a.letter as 'A' | 'B' | 'C',
    text: a.text,
    detail: a.detail,
  }));

  return (
    <AppShell
      surface="programs"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Programs · ${view.totalActive} in flight`,
      }}
      middleStrip={<FilterPillStrip pills={filterPills} />}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Program Orchestrator' }}
        quote={view.portfolioWorkbench.prose}
        agentContext={view.portfolioWorkbench.title}
        actions={agentActions}
      />

      {/* Work pane */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Stats row */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: SHELL.INK_SOFT,
            marginBottom: 18,
          }}
        >
          {view.totalActive} active
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          {view.gatesPending} gated
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          {view.idleCount} idle
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          <span style={{ color: SHELL.INK_MUTED }}>{view.capacityLabel}</span>
        </div>

        {/* Originate button row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 14,
          }}
        >
          <Link
            href="/programs/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 14px',
              borderRadius: 999,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.CARD_WHITE,
              color: SHELL.INK_MID,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1, marginTop: -1 }}>+</span>
            Originate program
          </Link>
        </div>

        {/* Programs table */}
        <ProgramsTable programs={view.programs} />
      </div>
    </AppShell>
  );
}
