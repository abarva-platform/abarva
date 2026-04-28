'use client';

// SHELL-B — Program Detail Page adapted to AppShell.

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { PhaseStrip } from '@/components/shell/PhaseStrip';
import type { PhaseStripSlot } from '@/components/shell/PhaseStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ProgramDetailView } from '@/lib/programs/programs-types';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import { LinkedProgramChip } from '@/components/shell/LinkedProgramChip';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgramDetailPageProps {
  view: ProgramDetailView;
}

// ─── Gate pill ────────────────────────────────────────────────────────────────

function GatePill({ status }: { status: ProgramDetailView['gateStatus'] }) {
  let bg: string;
  let color: string;
  let label: string;

  switch (status) {
    case 'pending':
      bg = SHELL.PEACH_BG;
      color = SHELL.PEACH_TEXT;
      label = 'Gate Pending';
      break;
    case 'open':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = 'Gate Open';
      break;
    case 'approved':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = 'Gate Approved';
      break;
    default:
      bg = SHELL.GRAY_BG;
      color = SHELL.GRAY_TEXT;
      label = status === 'idle' ? 'Idle' : 'Gate N/A';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Gate criteria ────────────────────────────────────────────────────────────

function GateCriteriaList({
  criteria,
}: {
  criteria: NonNullable<ProgramDetailView['phasePanel']['gateCriteria']>;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Gate criteria
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {criteria.map((g, i) => (
          <div
            key={`gc-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 12px',
              borderRadius: 7,
              background: g.met
                ? SHELL.MINT_BG
                : SHELL.PEACH_BG,
              border: `1px solid ${g.met ? SHELL.MINT_LINE : SHELL.PEACH_LINE}`,
            }}
          >
            {/* Circle icon */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                flexShrink: 0,
                background: g.met ? SHELL.MINT_TEXT : 'transparent',
                border: g.met ? 'none' : `1.5px solid ${SHELL.INK}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {g.met && (
                <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>
              )}
            </div>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: g.met ? SHELL.MINT_TEXT : SHELL.INK,
                lineHeight: 1.4,
              }}
            >
              {g.criterion}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: g.met ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
              }}
            >
              {g.met ? 'Met' : 'Open'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deliverables ─────────────────────────────────────────────────────────────

function DeliverablesList({
  deliverables,
}: {
  deliverables: NonNullable<ProgramDetailView['phasePanel']['deliverables']>;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Deliverables
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {deliverables.map((d, i) => {
          const statusDotColor =
            d.status === 'done'
              ? SHELL.MINT_TEXT
              : d.status === 'blocked'
              ? SHELL.RUST_TEXT
              : SHELL.AMBER_DOT;

          return (
            <div
              key={`del-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 12px',
                borderRadius: 7,
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusDotColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK,
                  flex: 1,
                  lineHeight: 1.4,
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: statusDotColor,
                }}
              >
                {d.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProgramDetailPage({ view }: ProgramDetailPageProps) {
  const router = useRouter();

  const phaseLabel = PHASE_LABEL_MAP[view.viewingPhase] ?? `Phase ${view.viewingPhase}`;

  // Map ProgramPhaseSlot to PhaseStripSlot
  const stripPhases: PhaseStripSlot[] = view.phases.map((s) => ({
    id: s.id as PhaseStripSlot['id'],
    label: s.label,
    state: s.state,
  }));

  const handlePhaseSelect = (id: PhaseStripSlot['id']) => {
    router.push(`/programs/${view.programId}?phase=${id}`, { scroll: false });
  };

  // Cast actions for AgentColumn
  const agentActions = view.workbench.actions.map((a) => ({
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
        context: `${view.displayId} · P${view.viewingPhase} ${phaseLabel}`,
      }}
      middleStrip={
        <PhaseStrip phases={stripPhases} onPhaseSelect={handlePhaseSelect} />
      }
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Program Orchestrator' }}
        quote={view.workbench.prose}
        agentContext={view.workbench.title}
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
        {/* Program header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                fontWeight: 700,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.06em',
              }}
            >
              {view.displayId}
            </span>
            <GatePill status={view.gateStatus} />
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 600,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            {view.name}
          </h1>
        </div>

        {/* Gate criteria */}
        {view.phasePanel.gateCriteria && view.phasePanel.gateCriteria.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <GateCriteriaList criteria={view.phasePanel.gateCriteria} />
          </div>
        )}

        {/* Deliverables */}
        {view.phasePanel.deliverables && view.phasePanel.deliverables.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <DeliverablesList deliverables={view.phasePanel.deliverables} />
          </div>
        )}

        {/* Blocker note */}
        {view.phasePanel.blockerNote && (
          <div
            style={{
              marginBottom: 20,
              padding: '10px 14px',
              background: SHELL.PEACH_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 7,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.PEACH_TEXT,
              lineHeight: 1.5,
            }}
          >
            {view.phasePanel.blockerNote}
          </div>
        )}

        {/* Linked source event */}
        {view.linkedSourceEvent && (
          <div style={{ marginBottom: 20 }}>
            <LinkedProgramChip
              direction="program-to-source"
              linkedId="SRC-AMS-2026"
              linkedName="AMS Vendor Consolidation 2026"
              linkedStage="BAFO · Stage 7"
              href="/source"
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
