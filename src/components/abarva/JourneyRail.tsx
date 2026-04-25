// DES2 · JourneyRail.
//
// Six-phase journey rail (origination → verify) with G1–G4 gate caps
// between phases. Phases carry past/active/future state; gates carry
// signed/missing_inputs/not_wired state. The active phase is rendered
// NAVY-filled. The end of the rail is honest — no fake G5 cap after
// Verify.

import { COLORS, FONT, RADIUS, SPACING } from '@/lib/design/abarva-theme';

export type JourneyPhaseState = 'past' | 'active' | 'future';
export type JourneyGateState = 'signed' | 'missing_inputs' | 'not_wired';

export interface JourneyPhase {
  key: string;
  label: string;
  state: JourneyPhaseState;
}

export interface JourneyGate {
  key: 'G1' | 'G2' | 'G3' | 'G4';
  state: JourneyGateState;
  /** Optional short caption shown beneath the gate cap. */
  caption?: string;
}

export interface JourneyRailProps {
  /** Six phases in canonical order. Length must be 6. */
  phases: ReadonlyArray<JourneyPhase>;
  /** Four gate caps (G1–G4) between phases 1–2, 2–3, 3–4, 4–5. */
  gates: ReadonlyArray<JourneyGate>;
}

function phaseSurface(state: JourneyPhaseState): {
  bg: string;
  fg: string;
  border: string;
} {
  if (state === 'active') {
    return {
      bg: COLORS.navy,
      fg: '#FFFFFF',
      border: COLORS.navy,
    };
  }
  if (state === 'past') {
    return {
      bg: COLORS.navySoft,
      fg: COLORS.navy,
      border: COLORS.navy,
    };
  }
  return {
    bg: COLORS.surface,
    fg: COLORS.muted,
    border: COLORS.border,
  };
}

function gateAccent(state: JourneyGateState): {
  fg: string;
  bg: string;
  ring: string;
  glyph: string;
} {
  if (state === 'signed') {
    return {
      fg: COLORS.navy,
      bg: COLORS.navySoft,
      ring: COLORS.navy,
      glyph: '✓',
    };
  }
  if (state === 'missing_inputs') {
    return {
      fg: COLORS.amber,
      bg: COLORS.amberSoft,
      ring: COLORS.amber,
      glyph: '!',
    };
  }
  return {
    fg: COLORS.mutedSoft,
    bg: COLORS.surface,
    ring: COLORS.border,
    glyph: '·',
  };
}

export function JourneyRail({ phases, gates }: JourneyRailProps) {
  // Render rail as alternating phase / gate / phase / ... / phase. Gate
  // caps appear *after* the first 4 phases (G1–G4 between 1↔2, 2↔3,
  // 3↔4, 4↔5). The 5th and 6th phase have no trailing gate.
  const phaseList = phases.slice(0, 6);
  const gateMap = new Map<JourneyGate['key'], JourneyGate>();
  for (const g of gates) gateMap.set(g.key, g);
  const gateOrder: JourneyGate['key'][] = ['G1', 'G2', 'G3', 'G4'];

  return (
    <div
      role="group"
      aria-label="Six-phase journey rail"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        flexWrap: 'wrap',
        fontFamily: FONT.body,
      }}
    >
      {phaseList.map((p, i) => {
        const surf = phaseSurface(p.state);
        const trailingGate =
          i < gateOrder.length ? gateMap.get(gateOrder[i]) : undefined;
        return (
          <div
            key={p.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              data-phase={p.key}
              data-state={p.state}
              style={{
                background: surf.bg,
                color: surf.fg,
                border: `1px solid ${surf.border}`,
                borderRadius: RADIUS.md,
                padding: `${SPACING.xs}px ${SPACING.md}px`,
                fontSize: 12,
                fontWeight: p.state === 'active' ? 600 : 500,
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  marginRight: 6,
                  opacity: 0.8,
                }}
              >
                P{i + 1}
              </span>
              {p.label}
            </div>
            {trailingGate ? (
              <div
                data-gate={trailingGate.key}
                data-gate-state={trailingGate.state}
                title={
                  trailingGate.caption ??
                  `${trailingGate.key} · ${trailingGate.state}`
                }
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  minWidth: 36,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: gateAccent(trailingGate.state).bg,
                    border: `1px solid ${gateAccent(trailingGate.state).ring}`,
                    color: gateAccent(trailingGate.state).fg,
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {gateAccent(trailingGate.state).glyph}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 8,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: gateAccent(trailingGate.state).fg,
                  }}
                >
                  {trailingGate.key}
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
