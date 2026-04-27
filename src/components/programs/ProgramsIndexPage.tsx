'use client';

// PROG-C — Programs Index presentation component.
// Application density: 44px rows, 12–14px text, compact but readable.
// Decision surface — no form-filling, only decision actions.
// Uses inline styles matching the existing programs/* pattern.

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type {
  ProgramAgentRailItem,
  ProgramRow,
  ProgramsIndexView,
} from '@/lib/programs/programs-types';
import { ProgramJourneyRail } from './ProgramJourneyRail';
import type { ProgramPhaseSlot } from './ProgramJourneyRail';

// ─── Design tokens ────────────────────────────────────────────────────────────

const PAPER     = '#faf7f1';
const CARD_WHITE = '#fdfbf6';
const CARD_LINE  = '#e6dfce';
const CARD_LINE_SOFT = '#ece6d5';
const INK       = '#0c1a3a';
const INK_MID   = '#2a3a5e';
const INK_SOFT  = '#5b6c8a';
const INK_MUTED = '#8b95a8';

const MINT_BG   = '#dde9d9';
const MINT_LINE = '#c2d6bf';
const MINT_TEXT = '#2a5a3a';

const PEACH_BG  = '#f5e2c9';
const PEACH_LINE = '#e6cca5';
const PEACH_TEXT = '#a06d28';

const BLUE_BG   = '#dee8f5';
const GRAY_BG   = '#efece4';
const GRAY_LINE = '#ddd9cf';
const GRAY_TEXT = '#8b8779';

const NAVY_DARK = '#0c1a3a';
const NAVY_DEEPER = '#091228';

const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS  = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';

// ─── Gate pill ────────────────────────────────────────────────────────────────

function GatePill({ status }: { status: ProgramRow['gateStatus'] }) {
  const styles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    pending: { bg: PEACH_BG, border: PEACH_LINE, text: PEACH_TEXT, label: 'Gate pending' },
    open:    { bg: BLUE_BG,  border: '#b8cceb',  text: INK_MID,    label: 'Gate open'    },
    approved:{ bg: MINT_BG,  border: MINT_LINE,  text: MINT_TEXT,  label: 'Approved'     },
    idle:    { bg: GRAY_BG,  border: GRAY_LINE,  text: GRAY_TEXT,  label: 'Idle'         },
    na:      { bg: GRAY_BG,  border: GRAY_LINE,  text: GRAY_TEXT,  label: '—'            },
  };
  const s = styles[status] ?? styles.na;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 7px',
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Agent rail item ──────────────────────────────────────────────────────────

function AgentRailItem({ agent }: { agent: ProgramAgentRailItem }) {
  const isActive = agent.state === 'active';
  const stateLabel = agent.state === 'active' ? 'Active'
    : agent.state === 'on_call' ? 'On call'
    : agent.state === 'advisory' ? 'Advisory'
    : 'Idle';

  const stateBg = isActive ? BLUE_BG : GRAY_BG;
  const stateBorder = isActive ? '#b8cceb' : GRAY_LINE;
  const stateText = isActive ? INK_MID : INK_MUTED;

  return (
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 4px',
        borderRadius: 6,
        background: isActive ? BLUE_BG : 'transparent',
        border: isActive ? `1px solid #b8cceb` : '1px solid transparent',
      }}
    >
      {/* Glyph circle */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: isActive ? INK : GRAY_BG,
          border: `1px solid ${isActive ? INK : GRAY_LINE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            color: isActive ? '#fff' : INK_SOFT,
            letterSpacing: '0.02em',
          }}
        >
          {agent.initials}
        </span>
      </div>

      {/* Name + job */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 600,
            color: INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}
        >
          {agent.name}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            color: INK_SOFT,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
            marginTop: 1,
          }}
        >
          {agent.job}
        </div>
      </div>

      {/* State label */}
      <span
        style={{
          flexShrink: 0,
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: stateText,
          background: stateBg,
          border: `1px solid ${stateBorder}`,
          borderRadius: 999,
          padding: '2px 6px',
        }}
      >
        {stateLabel}
      </span>
    </div>
  );
}

// ─── Program row ──────────────────────────────────────────────────────────────

function ProgramTableRow({ row }: { row: ProgramRow }) {
  // Map programs-types ProgramPhaseSlot (id 0-6) to ProgramJourneyRail's
  // ProgramPhaseSlot (id 1-6). Phase 0 (Originate) is always done; skip it
  // and remap ids 1-6 from the fixture phases.
  const miniPhases: ProgramPhaseSlot[] = row.phases
    .filter((p) => p.id >= 1 && p.id <= 6)
    .map((p) => ({
      id: p.id as 1 | 2 | 3 | 4 | 5 | 6,
      label: p.label,
      state: p.state,
      gateStatus: p.gateStatus,
    }));

  const viewingPhase: 1 | 2 | 3 | 4 | 5 | 6 =
    row.currentPhase >= 1 && row.currentPhase <= 6
      ? (row.currentPhase as 1 | 2 | 3 | 4 | 5 | 6)
      : 1;

  const actionHref = `/programs/${row.id}?phase=${row.currentPhase}`;

  const actionStyle: CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    border: `1px solid ${CARD_LINE}`,
    background: CARD_WHITE,
    color: INK_MID,
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  };

  return (
    <Link
      href={`/programs/${row.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '56px 1fr 120px 100px 72px 84px',
        alignItems: 'center',
        height: 44,
        padding: '0 16px',
        borderBottom: `1px solid ${CARD_LINE_SOFT}`,
        textDecoration: 'none',
        color: INK,
        gap: 8,
        cursor: 'pointer',
        transition: 'background 100ms ease',
      }}
      // CSS hover handled via className below
      className="prog-row"
    >
      {/* ID */}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: INK_MUTED,
          letterSpacing: '0.06em',
        }}
      >
        {row.displayId}
      </span>

      {/* Name + nexus note */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 15,
            fontWeight: 700,
            color: INK,
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
            fontFamily: SANS,
            fontSize: 11,
            fontStyle: 'italic',
            color: INK_MUTED,
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

      {/* Mini journey strip */}
      <div>
        <ProgramJourneyRail
          phases={miniPhases}
          viewingPhase={viewingPhase}
          onPhaseSelect={() => {}}
          variant="mini"
        />
      </div>

      {/* Gate pill */}
      <div>
        <GatePill status={row.gateStatus} />
      </div>

      {/* Last active */}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: INK_MUTED,
          letterSpacing: '0.04em',
        }}
      >
        {row.lastActiveLabel}
      </span>

      {/* Action button */}
      <div onClick={(e) => e.stopPropagation()}>
        <Link href={actionHref} style={actionStyle}>
          {row.actionLabel}
        </Link>
      </div>
    </Link>
  );
}

// ─── Portfolio workbench (dark card) ──────────────────────────────────────────

interface WorkbenchProps {
  title: string;
  prose: string;
  actionsLabel: string;
  actions: Array<{ letter: string; text: string; detail: string }>;
}

function NexusPortfolioWorkbench({ title, prose, actionsLabel, actions }: WorkbenchProps) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: `linear-gradient(175deg, ${NAVY_DARK} 0%, ${NAVY_DEEPER} 100%)`,
        border: '1px solid rgba(11,74,145,0.20)',
        padding: '22px 24px 20px',
        color: '#fff',
      }}
    >
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 600,
          color: '#fff',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 13.5,
          color: 'rgba(255,255,255,0.80)',
          lineHeight: 1.6,
          margin: '10px 0 18px',
        }}
      >
        {prose}
      </p>

      {/* Actions */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.50)',
          marginBottom: 8,
        }}
      >
        {actionsLabel}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {actions.map((action) => (
          <div
            key={action.letter}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                flexShrink: 0,
                width: 14,
              }}
            >
              {action.letter}
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 15,
                color: '#fff',
                lineHeight: 1.3,
              }}
            >
              {action.text}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.3,
              }}
            >
              {action.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agent rail (white card) ──────────────────────────────────────────────────

function AgentRailCard({ agents }: { agents: ProgramAgentRailItem[] }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: CARD_WHITE,
        border: `1px solid ${CARD_LINE}`,
        padding: '18px 18px 14px',
      }}
    >
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 18,
          fontWeight: 600,
          color: INK,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        Agent handoff rail
      </h2>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: INK_SOFT,
          margin: '4px 0 14px',
          lineHeight: 1.4,
        }}
      >
        Agents appear when they have a job.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {agents.map((agent) => (
          <AgentRailItem key={agent.initials} agent={agent} />
        ))}
      </div>
    </div>
  );
}

// ─── Programs table ───────────────────────────────────────────────────────────

function ProgramsTable({ programs }: { programs: ProgramRow[] }) {
  const colHeaderStyle: CSSProperties = {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: INK_MUTED,
  };

  return (
    <div
      style={{
        borderRadius: 12,
        background: CARD_WHITE,
        border: `1px solid ${CARD_LINE}`,
        overflow: 'hidden',
      }}
    >
      {/* Table header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: `1px solid ${CARD_LINE}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: 18,
              fontWeight: 600,
              color: INK,
              margin: 0,
            }}
          >
            Programs
          </h2>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: INK_SOFT,
            }}
          >
            Click any row to open.
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '56px 1fr 120px 100px 72px 84px',
          padding: '6px 16px',
          gap: 8,
          background: PAPER,
          borderBottom: `1px solid ${CARD_LINE_SOFT}`,
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

export interface ProgramsIndexPageProps {
  view: ProgramsIndexView;
}

export function ProgramsIndexPage({ view }: ProgramsIndexPageProps) {
  const statusStrip = `${view.totalActive} active · ${view.gatesPending} gates pending · ${view.idleCount} idle · ${view.capacityLabel}`;

  return (
    <div
      style={{
        background: PAPER,
        minHeight: '100vh',
        fontFamily: SANS,
        color: INK,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 24px 64px',
        }}
      >
        {/* Breadcrumb + top row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: INK_MUTED,
              letterSpacing: '0.06em',
            }}
          >
            <span>{view.tenant}</span>
            <span style={{ margin: '0 6px', opacity: 0.5 }}>›</span>
            <span>Programs</span>
          </div>

          {/* Originate button */}
          <Link
            href="/programs/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 14px',
              borderRadius: 999,
              border: `1px solid ${CARD_LINE}`,
              background: CARD_WHITE,
              color: INK_MID,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1, marginTop: -1 }}>+</span>
            Originate program
          </Link>
        </div>

        {/* Status strip */}
        <div
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: INK_SOFT,
            letterSpacing: '0.04em',
            marginBottom: 18,
          }}
        >
          {statusStrip}
        </div>

        {/* Two-column: workbench + agent rail */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <NexusPortfolioWorkbench
            title={view.portfolioWorkbench.title}
            prose={view.portfolioWorkbench.prose}
            actionsLabel={view.portfolioWorkbench.actionsLabel}
            actions={view.portfolioWorkbench.actions}
          />
          <AgentRailCard agents={view.agentRail} />
        </div>

        {/* Programs table */}
        <ProgramsTable programs={view.programs} />
      </div>

      {/* Hover row style */}
      <style>{`
        .prog-row:hover {
          background: ${CARD_WHITE};
          padding-left: 24px !important;
        }
      `}</style>
    </div>
  );
}
