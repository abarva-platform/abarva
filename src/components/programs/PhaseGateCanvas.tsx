'use client';

// PROG11 · Phase Journey + Approval Gate Canvas component.
//
// Read-only deterministic visual canvas. Renders:
//   A · Phase journey rail (6 phase pills, oval, status-coloured)
//   B · Current gate card (label, status chip, owner, requirements,
//       missing inputs, Steward implication, approval caveat)
//   C · Next action callout
//
// AbarVa canon: surface #FBFAF7, card #FFFFFF, border #E8E6E1, ink #0A0C12,
// body #1F2433, muted #525866, accent navy #1B2B5C. No teal/green/purple/neon.
//
// No phase transitions, no approvals, no DB writes — view-only.

import {
  buildPhaseGateCanvasView,
  type GateStatus,
  type PhaseSlot,
} from '../../lib/programs/phase-gate-canvas-view';

export interface PhaseGateCanvasProps {
  programLabel?: string;
  currentPhaseId?: string;
}

// AbarVa canon palette
const SURFACE = '#FBFAF7';
const CARD = '#FFFFFF';
const BORDER = '#E8E6E1';
const INK = '#0A0C12';
const BODY = '#1F2433';
const MUTED = '#525866';
const NAVY = '#1B2B5C';
const NAVY_TINT = '#E6ECF8';
const AMBER_TINT = '#FEF3C7';
const AMBER_INK = '#7A5B0A';
const STONE_TINT = '#F5F3EE';
const NEXT_ACTION_BG = '#DBEAFE';
const RED_TINT = '#FEE2E2';
const RED_INK = '#7A1A1A';
const GRAY_TINT = '#EAEAEA';

function pillStylesFor(status: PhaseSlot['status']): {
  background: string;
  color: string;
  prefix?: string;
} {
  switch (status) {
    case 'complete':
      return { background: NAVY_TINT, color: NAVY, prefix: '✓ ' };
    case 'in-progress':
      return { background: NAVY, color: '#FFFFFF' };
    case 'gate-pending':
      return { background: AMBER_TINT, color: AMBER_INK };
    case 'not-started':
    default:
      return { background: STONE_TINT, color: MUTED };
  }
}

function statusChipStylesFor(status: GateStatus): {
  background: string;
  color: string;
  label: string;
} {
  switch (status) {
    case 'open':
      return { background: NAVY_TINT, color: NAVY, label: 'Open' };
    case 'pending':
      return { background: AMBER_TINT, color: AMBER_INK, label: 'Pending' };
    case 'closed':
      return { background: GRAY_TINT, color: MUTED, label: 'Closed' };
    case 'blocked':
      return { background: RED_TINT, color: RED_INK, label: 'Blocked' };
  }
}

function capitalise(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function PhaseGateCanvas(props: PhaseGateCanvasProps) {
  const view = buildPhaseGateCanvasView({
    programLabel: props.programLabel,
    currentPhaseId: props.currentPhaseId,
  });

  const currentPhaseLabel =
    view.phases.find((p) => p.phaseId === view.currentPhaseId)?.phaseLabel ?? '';

  const statusChip = statusChipStylesFor(view.currentGate.status);

  return (
    <div
      style={{
        background: SURFACE,
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        color: BODY,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
      }}
    >
      {/* Section A · Phase journey rail */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: INK,
            marginBottom: 14,
          }}
        >
          Program journey
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {view.phases.map((phase, idx) => {
            const styles = pillStylesFor(phase.status);
            return (
              <div
                key={phase.phaseId}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <div
                  style={{
                    background: styles.background,
                    color: styles.color,
                    borderRadius: 999,
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                  aria-label={`Phase ${phase.order} ${phase.phaseLabel} (${phase.status})`}
                >
                  {styles.prefix ?? ''}
                  {phase.order}. {phase.phaseLabel}
                </div>
                {idx < view.phases.length - 1 ? (
                  <div
                    aria-hidden="true"
                    style={{
                      width: 18,
                      height: 1,
                      background: BORDER,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 13,
            color: BODY,
          }}
        >
          Currently in {currentPhaseLabel}
        </div>
      </div>

      {/* Section B · Current gate card */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: INK,
            }}
          >
            {view.currentGate.label}
          </div>
          <span
            style={{
              background: statusChip.background,
              color: statusChip.color,
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
            aria-label={`Gate status ${statusChip.label}`}
          >
            {statusChip.label}
          </span>
        </div>

        <div style={{ fontSize: 13, color: BODY }}>
          Owner:{' '}
          <span
            style={{
              display: 'inline-block',
              background: NAVY_TINT,
              color: NAVY,
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              marginLeft: 4,
            }}
          >
            {capitalise(view.currentGate.owner)}
          </span>
        </div>

        {/* Requirements */}
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              marginBottom: 8,
            }}
          >
            Requirements
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {view.currentGate.requirements.map((req) => (
              <li
                key={req.requirementId}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 13,
                  color: BODY,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    color: req.satisfied ? NAVY : MUTED,
                    fontWeight: 600,
                    width: 12,
                    flexShrink: 0,
                    lineHeight: '20px',
                  }}
                >
                  {req.satisfied ? '✓' : '•'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: INK, fontWeight: 500 }}>{req.label}</span>
                  <span style={{ color: MUTED, fontSize: 12 }}>{req.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing inputs */}
        <div
          style={{
            background: AMBER_TINT,
            borderRadius: 8,
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: AMBER_INK,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Missing inputs
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {view.currentGate.missingInputs.map((item, idx) => (
              <li
                key={idx}
                style={{ fontSize: 13, color: AMBER_INK }}
              >
                {'•'} {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Steward implication */}
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              marginBottom: 4,
            }}
          >
            Steward implication
          </div>
          <div
            style={{
              fontSize: 13,
              color: MUTED,
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {view.currentGate.stewardImplication}
          </div>
        </div>

        {/* Approval caveat */}
        <div
          style={{
            fontSize: 12,
            color: MUTED,
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          {view.currentGate.approvalCaveat}
        </div>
      </div>

      {/* Section C · Next action callout */}
      <div
        style={{
          background: NEXT_ACTION_BG,
          padding: '14px 18px',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: NAVY,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {'Next action '}
          <span aria-hidden="true">{'→'}</span>
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: NAVY,
          }}
        >
          {view.currentGate.nextAction}
        </div>
      </div>

      {/* Footer caveat */}
      <div
        style={{
          fontSize: 12,
          color: MUTED,
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        {view.caveat}
      </div>
    </div>
  );
}
