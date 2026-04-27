'use client';

// ProgramJourneyRail · PROG-B
// Status indicator + navigator — thin 36px chips on full, 4px segments on mini.
// Pop via contrast only: active phase uses border+shadow+fill, NOT size change.

import type { CSSProperties } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProgramPhaseSlot {
  id: number;       // 0-6
  label: string;    // 'Originate' | 'Discovery' | etc.
  state: 'done' | 'current' | 'pending' | 'locked';
  gateStatus?: 'open' | 'pending' | 'approved';
}

export interface ProgramJourneyRailProps {
  phases: ProgramPhaseSlot[];
  viewingPhase: number;         // currently selected phase
  onPhaseSelect: (phase: number) => void;
  variant?: 'full' | 'mini';   // 'full' = 36px chips, 'mini' = 4px segments
}

// ─── Design tokens (inline — programs shell uses inline styles throughout) ──

// Ink = near-black text anchor
const INK = '#0c1a3a';

// State-keyed backgrounds + borders
const TOKEN = {
  // done — mint tones
  mintBg:    'rgba(15, 118, 110, 0.10)',
  mintLine:  'rgba(15, 118, 110, 0.28)',

  // current / active — blue tones
  blueBg:    'rgba(59, 130, 246, 0.12)',
  blueLine:  INK,

  // pending — peach/amber tones
  peachBg:   'rgba(183, 121, 31, 0.10)',
  peachLine: 'rgba(183, 121, 31, 0.32)',

  // locked — gray
  grayBg:    'rgba(27, 38, 50, 0.06)',
  grayLine:  'rgba(27, 38, 50, 0.18)',
} as const;

const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';

// ─── State label text ────────────────────────────────────────────────────────

function stateLabel(state: ProgramPhaseSlot['state']): string {
  switch (state) {
    case 'done':    return 'Complete';
    case 'current': return 'Active';
    case 'pending': return 'Pending';
    case 'locked':  return 'Locked';
  }
}

// ─── State-keyed text color for the P{n} mono id ────────────────────────────

function idColor(state: ProgramPhaseSlot['state']): string {
  switch (state) {
    case 'done':    return TOKEN.mintLine;
    case 'current': return INK;
    case 'pending': return TOKEN.peachLine;
    case 'locked':  return 'rgba(27, 38, 50, 0.35)';
  }
}

// ─── Chip style for full variant ─────────────────────────────────────────────

function chipStyle(
  slot: ProgramPhaseSlot,
  isViewing: boolean,
): CSSProperties {
  const base: CSSProperties = {
    height: 36,
    flex: 1,
    minWidth: 0,
    borderRadius: 6,
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    cursor: slot.state === 'locked' ? 'not-allowed' : 'pointer',
    transition: 'box-shadow 120ms ease, border-color 120ms ease',
    userSelect: 'none',
    position: 'relative',
  };

  // Viewing chip always gets elevated shadow + 2px border
  if (isViewing) {
    if (slot.state === 'current') {
      return {
        ...base,
        background: TOKEN.blueBg,
        border: `2px solid ${INK}`,
        boxShadow: '0 2px 8px rgba(12,26,58,0.18)',
      };
    }
    // Viewing a done/pending phase — highlight with 2px border + shadow
    const bg = slot.state === 'done' ? TOKEN.mintBg
             : slot.state === 'pending' ? TOKEN.peachBg
             : TOKEN.grayBg;
    const line = slot.state === 'done' ? TOKEN.mintLine
               : slot.state === 'pending' ? TOKEN.peachLine
               : TOKEN.grayLine;
    return {
      ...base,
      background: bg,
      border: `2px solid ${line}`,
      boxShadow: '0 2px 8px rgba(12,26,58,0.18)',
    };
  }

  // Non-viewing states
  switch (slot.state) {
    case 'done':
      return { ...base, background: TOKEN.mintBg, border: `1px solid ${TOKEN.mintLine}` };
    case 'current':
      // current but not viewing — same mint tone with subtle indicator
      return { ...base, background: TOKEN.mintBg, border: `1px solid ${TOKEN.mintLine}` };
    case 'pending':
      return { ...base, background: TOKEN.peachBg, border: `1px solid ${TOKEN.peachLine}` };
    case 'locked':
      return { ...base, background: TOKEN.grayBg, border: `1px solid ${TOKEN.grayLine}`, opacity: 0.5 };
  }
}

// ─── Mini segment style ───────────────────────────────────────────────────────

function segmentStyle(state: ProgramPhaseSlot['state']): CSSProperties {
  const base: CSSProperties = {
    width: 16,
    height: 4,
    borderRadius: 2,
    flexShrink: 0,
  };
  switch (state) {
    case 'done':
      return { ...base, background: TOKEN.mintBg, border: `1px solid ${TOKEN.mintLine}` };
    case 'current':
      return { ...base, background: INK };
    case 'pending':
      return { ...base, background: TOKEN.peachBg, border: `1px solid ${TOKEN.peachLine}` };
    case 'locked':
      return { ...base, background: TOKEN.grayBg, border: `1px solid ${TOKEN.grayLine}`, opacity: 0.4 };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProgramJourneyRail({
  phases,
  viewingPhase,
  onPhaseSelect,
  variant = 'full',
}: ProgramJourneyRailProps) {

  // ── Mini variant ──────────────────────────────────────────────────────────
  if (variant === 'mini') {
    return (
      <div
        role="list"
        aria-label="Program phases"
        style={{ display: 'flex', gap: 2, alignItems: 'center' }}
      >
        {phases.map((slot) => (
          <div
            key={slot.id}
            role="listitem"
            aria-label={`${slot.label}: ${stateLabel(slot.state)}`}
            style={segmentStyle(slot.state)}
          />
        ))}
      </div>
    );
  }

  // ── Full variant ──────────────────────────────────────────────────────────
  return (
    <div
      role="list"
      aria-label="Program journey phases"
      style={{ display: 'flex', gap: 2, alignItems: 'stretch' }}
    >
      {phases.map((slot) => {
        const isViewing = slot.id === viewingPhase;

        const handleClick = () => {
          if (slot.state === 'locked') return;
          onPhaseSelect(slot.id);
        };

        return (
          <div key={slot.id} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <button
              type="button"
              role="listitem"
              aria-label={`Phase ${slot.id}: ${slot.label}, ${stateLabel(slot.state)}${isViewing ? ', currently viewing' : ''}`}
              aria-pressed={isViewing}
              aria-disabled={slot.state === 'locked'}
              onClick={handleClick}
              style={{
                ...chipStyle(slot, isViewing),
                // Reset button defaults
                appearance: 'none',
                WebkitAppearance: 'none',
                background: (chipStyle(slot, isViewing) as CSSProperties).background,
                font: 'inherit',
                width: '100%',
              }}
            >
              {/* Left: P{n} mono ID */}
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.10em',
                  color: idColor(slot.state),
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                P{slot.id}
              </span>

              {/* Right: phase name + state */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 500,
                    color: slot.state === 'locked' ? 'rgba(27,38,50,0.4)' : INK,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    lineHeight: 1.2,
                  }}
                >
                  {slot.label}
                </span>
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 10,
                    fontWeight: 400,
                    color: slot.state === 'locked' ? 'rgba(27,38,50,0.3)'
                         : slot.state === 'done'    ? TOKEN.mintLine
                         : slot.state === 'current' ? INK
                         : slot.state === 'pending' ? TOKEN.peachLine
                         : 'rgba(27,38,50,0.4)',
                    lineHeight: 1.2,
                  }}
                >
                  {stateLabel(slot.state)}
                </span>
              </div>
            </button>

            {/* Downward caret below the viewing chip */}
            {isViewing && (
              <div
                aria-hidden="true"
                style={{
                  textAlign: 'center',
                  fontSize: 8,
                  color: INK,
                  lineHeight: 1,
                  marginTop: 2,
                  height: 10,
                }}
              >
                ▾
              </div>
            )}
            {!isViewing && (
              // Spacer so all chips stay the same height in their column
              <div style={{ height: 12 }} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
