'use client';

// PROG-D — Program Detail Page (client component)
//
// Phase-scoped program detail with:
//   - Breadcrumb + status row
//   - ProgramJourneyRail (6 phase chips, URL-driven selection)
//   - Two-column layout: dark workbench (left) + agent rail (right)
//   - Phase panel: deliverables (done) | gate criteria (current/pending) | locked notice
//
// Navigation: clicking a chip calls router.push with ?phase=N (scroll: false).
// The server component resolves `viewingPhase` from searchParams and passes
// down `view` which is already scoped to the correct phase.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ProgramJourneyRail,
  type ProgramPhaseSlot as RailPhaseSlot,
} from './ProgramJourneyRail';
import type { ProgramDetailView } from '@/lib/programs/programs-types';

// ─── Design tokens ────────────────────────────────────────────────────────────

const SURFACE = '#F8F7F4';
const CARD    = '#FFFFFF';
const DARK    = '#0F1E3F';   // dark workbench background
const BORDER  = 'rgba(20, 33, 47, 0.14)';
const INK     = '#0c1a3a';
const MUTED   = 'rgba(27, 38, 50, 0.62)';
const SUBTLE  = 'rgba(27, 38, 50, 0.42)';
const MINT    = '#0f766e';
const MINT_BG = 'rgba(15, 118, 110, 0.10)';
const AMBER   = '#b7791f';
const AMBER_BG = 'rgba(183, 121, 31, 0.10)';
const PEACH   = 'rgba(183, 121, 31, 0.32)';

const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

// ─── Gate status pill ─────────────────────────────────────────────────────────

function GatePill({ status }: { status: ProgramDetailView['gateStatus'] }) {
  const map: Record<typeof status, { bg: string; color: string; label: string }> = {
    open:     { bg: MINT_BG, color: MINT, label: 'Gate Open' },
    pending:  { bg: AMBER_BG, color: AMBER, label: 'Gate Pending' },
    approved: { bg: 'rgba(15, 118, 110, 0.18)', color: MINT, label: 'Gate Approved' },
    idle:     { bg: 'rgba(27,38,50,0.07)', color: MUTED, label: 'Idle' },
    na:       { bg: 'rgba(27,38,50,0.07)', color: SUBTLE, label: 'Gate N/A' },
  };
  const tone = map[status];
  return (
    <span
      style={{
        padding: '3px 9px',
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: MONO,
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}
    >
      {tone.label}
    </span>
  );
}

// ─── Agent rail item ──────────────────────────────────────────────────────────

function AgentItem({ agent }: { agent: ProgramDetailView['agentRail'][number] }) {
  const stateColor: Record<typeof agent.state, string> = {
    active:   MINT,
    on_call:  AMBER,
    advisory: 'rgba(27,38,50,0.55)',
    idle:     'rgba(27,38,50,0.35)',
  };
  const stateLabel: Record<typeof agent.state, string> = {
    active:   'Active',
    on_call:  'On call',
    advisory: 'Advisory',
    idle:     'Idle',
  };
  const color = stateColor[agent.state];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderBottom: `1px solid ${BORDER}`,
        minHeight: 40,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: agent.state === 'active' ? MINT_BG : 'rgba(27,38,50,0.06)',
          border: `1px solid ${agent.state === 'active' ? MINT : BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 700,
          color: agent.state === 'active' ? MINT : MUTED,
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        {agent.initials}
      </div>

      {/* Name + job */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {agent.name}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            color: MUTED,
            lineHeight: 1.35,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {agent.job}
        </div>
      </div>

      {/* State badge */}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          flexShrink: 0,
        }}
      >
        {stateLabel[agent.state]}
      </span>
    </div>
  );
}

// ─── Phase panel ──────────────────────────────────────────────────────────────

function PhasePanel({
  panel,
  viewingPhase,
  viewingPhaseName,
  phaseState,
}: {
  panel: ProgramDetailView['phasePanel'];
  viewingPhase: number;
  viewingPhaseName: string;
  phaseState: 'done' | 'current' | 'pending' | 'locked';
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: phaseState === 'done' ? MINT : phaseState === 'current' ? INK : phaseState === 'pending' ? AMBER : SUBTLE,
          }}
        >
          P{viewingPhase} · {viewingPhaseName}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.08em',
            color: SUBTLE,
          }}
        >
          {phaseState === 'done' ? '· Complete'
          : phaseState === 'current' ? '· Active — gate criteria'
          : phaseState === 'pending' ? '· Pending gate'
          : '· Locked'}
        </span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Summary (done phases) */}
        {panel.summary && (
          <p
            style={{
              margin: '0 0 10px',
              fontFamily: SANS,
              fontSize: 12.5,
              color: INK,
              lineHeight: 1.55,
            }}
          >
            {panel.summary}
          </p>
        )}

        {/* Blocker note (pending/locked) */}
        {panel.blockerNote && (
          <div
            style={{
              padding: '8px 12px',
              background: AMBER_BG,
              border: `1px solid ${PEACH}`,
              borderRadius: 6,
              marginBottom: panel.gateCriteria ? 10 : 0,
              fontFamily: SANS,
              fontSize: 12,
              color: AMBER,
              lineHeight: 1.5,
            }}
          >
            {panel.blockerNote}
          </div>
        )}

        {/* Deliverables (done phases) */}
        {panel.deliverables && panel.deliverables.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {panel.deliverables.map((d, i) => (
              <li
                key={`deliverable-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  background: d.status === 'done' ? MINT_BG : d.status === 'blocked' ? 'rgba(180,35,24,0.06)' : 'rgba(27,38,50,0.04)',
                  border: `1px solid ${d.status === 'done' ? 'rgba(15,118,110,0.22)' : BORDER}`,
                  borderRadius: 6,
                  fontFamily: SANS,
                  fontSize: 12,
                  color: INK,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: d.status === 'done' ? MINT : d.status === 'blocked' ? '#b42318' : BORDER,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {d.status === 'done' && (
                    <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
                  )}
                </span>
                {d.label}
              </li>
            ))}
          </ul>
        )}

        {/* Gate criteria (current/pending) */}
        {panel.gateCriteria && panel.gateCriteria.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {panel.gateCriteria.map((g, i) => (
              <li
                key={`gate-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '7px 10px',
                  background: g.met ? MINT_BG : 'rgba(183,121,31,0.07)',
                  border: `1px solid ${g.met ? 'rgba(15,118,110,0.22)' : 'rgba(183,121,31,0.24)'}`,
                  borderRadius: 6,
                  fontFamily: SANS,
                  fontSize: 12,
                  color: INK,
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `1.5px solid ${g.met ? MINT : AMBER}`,
                    background: g.met ? MINT : 'transparent',
                    flexShrink: 0,
                    marginTop: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {g.met && (
                    <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
                  )}
                </span>
                <span style={{ color: g.met ? INK : MUTED }}>{g.criterion}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export interface ProgramDetailPageProps {
  view: ProgramDetailView;
}

export function ProgramDetailPage({ view }: ProgramDetailPageProps) {
  const router = useRouter();

  const handlePhaseSelect = (phase: 1 | 2 | 3 | 4 | 5 | 6) => {
    router.push(`/programs/${view.programId}?phase=${phase}`, { scroll: false });
  };

  // Map programs-types ProgramPhaseSlot to ProgramJourneyRail's local type.
  // The rail slot type has id: 1|2|3|4|5|6; fixture slots with id >=1 qualify.
  const railPhases: RailPhaseSlot[] = view.phases
    .filter((s): s is typeof s & { id: 1 | 2 | 3 | 4 | 5 | 6 } => s.id >= 1 && s.id <= 6)
    .map((s) => ({
      id: s.id as 1 | 2 | 3 | 4 | 5 | 6,
      label: s.label,
      state: s.state,
      gateStatus: s.gateStatus,
    }));

  const viewingPhaseSlot = view.phases.find((s) => s.id === view.viewingPhase);
  const viewingPhaseState = viewingPhaseSlot?.state ?? 'locked';
  const viewingPhaseName = viewingPhaseSlot?.label ?? `Phase ${view.viewingPhase}`;

  const viewingPhaseRail = view.viewingPhase >= 1 && view.viewingPhase <= 6
    ? (view.viewingPhase as 1 | 2 | 3 | 4 | 5 | 6)
    : (1 as 1 | 2 | 3 | 4 | 5 | 6);

  return (
    <div
      style={{
        background: SURFACE,
        minHeight: '100vh',
        fontFamily: SANS,
        color: INK,
        padding: '20px 24px 48px',
        maxWidth: 1240,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: SUBTLE,
          marginBottom: 10,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <span>Apex Retail Group</span>
        <span style={{ opacity: 0.5 }}>›</span>
        <span>Programs</span>
        <span style={{ opacity: 0.5 }}>›</span>
        <span style={{ color: MUTED, fontWeight: 600 }}>{view.displayId}</span>
      </nav>

      {/* ── Status row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <GatePill status={view.gateStatus} />

        <span
          style={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 700,
            color: INK,
          }}
        >
          {view.displayId}
        </span>

        <span style={{ color: BORDER, fontWeight: 300 }}>·</span>

        <span
          style={{
            fontFamily: SANS,
            fontSize: 18,
            fontWeight: 400,
            color: INK,
            letterSpacing: '-0.01em',
          }}
        >
          {view.name}
        </span>

        <span style={{ color: BORDER, fontWeight: 300 }}>·</span>

        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: MUTED,
          }}
        >
          P{view.currentPhase} {viewingPhaseState === 'current'
            ? `${vPhaseName(view)} · Active`
            : `${vPhaseName(view)}`}
        </span>

        {view.linkedSourceEvent && (
          <>
            <span style={{ marginLeft: 'auto' }} aria-hidden="true" />
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                border: `1px solid rgba(27,38,50,0.18)`,
                fontFamily: MONO,
                fontSize: 10,
                color: MUTED,
                cursor: 'default',
                flexShrink: 0,
              }}
              title={view.linkedSourceEvent}
            >
              Nexus note →
            </span>
          </>
        )}
      </div>

      {/* ── Journey Rail ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <ProgramJourneyRail
          phases={railPhases}
          viewingPhase={viewingPhaseRail}
          onPhaseSelect={handlePhaseSelect}
          variant="full"
        />
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 14,
          marginBottom: 14,
        }}
      >
        {/* Left: Dark workbench */}
        <div
          style={{
            background: DARK,
            borderRadius: 12,
            padding: '22px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Phase-scoped title */}
          <h2
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: 22,
              fontWeight: 400,
              color: '#F0EDE8',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            {view.workbench.title}
          </h2>

          {/* Phase-scoped prose */}
          <p
            style={{
              margin: 0,
              fontFamily: SANS,
              fontSize: 13.5,
              color: 'rgba(240, 237, 232, 0.80)',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {view.workbench.prose}
          </p>

          {/* Actions */}
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(240,237,232,0.45)',
                marginBottom: 8,
              }}
            >
              {view.workbench.actionsLabel}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {view.workbench.actions.map((action) => (
                <button
                  key={action.letter}
                  type="button"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    background: 'rgba(240, 237, 232, 0.06)',
                    border: '1px solid rgba(240, 237, 232, 0.12)',
                    borderRadius: 7,
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,237,232,0.10)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,237,232,0.06)';
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(240,237,232,0.55)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {action.letter}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: '#F0EDE8',
                        lineHeight: 1.3,
                      }}
                    >
                      {action.text}
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        color: 'rgba(240,237,232,0.5)',
                        lineHeight: 1.35,
                        marginTop: 1,
                      }}
                    >
                      {action.detail}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Agent Rail */}
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: SUBTLE,
              }}
            >
              Agent rail · P{view.viewingPhase}
            </span>
          </div>
          {view.agentRail.map((agent) => (
            <AgentItem key={agent.initials} agent={agent} />
          ))}
        </div>
      </div>

      {/* ── Phase panel ────────────────────────────────────────────────── */}
      <PhasePanel
        panel={view.phasePanel}
        viewingPhase={view.viewingPhase}
        viewingPhaseName={viewingPhaseName}
        phaseState={viewingPhaseState}
      />
    </div>
  );
}

// Small helper to avoid inline ternary clutter in JSX
function vPhaseName(view: ProgramDetailView): string {
  const slot = view.phases.find((s) => s.id === view.viewingPhase);
  return slot?.label ?? '';
}
