// DES2 · JourneyRail.
//
// Six-phase journey rail with G1–G4 gate caps. Used on the program
// journey page. Imports restricted to next/link and the AbarVa theme.

import Link from 'next/link';
import {
  COLORS,
  FONT,
  RADIUS,
  TYPE,
  statusAccent,
} from '@/lib/design/abarva-theme';

export type JourneyPhaseKey =
  | 'origination'
  | 'charter'
  | 'diagnose'
  | 'design'
  | 'execute'
  | 'verify';

export type JourneyPhaseState = 'past' | 'active' | 'future';

export interface JourneyPhase {
  index: 1 | 2 | 3 | 4 | 5 | 6;
  key: JourneyPhaseKey;
  label: string;
  state: JourneyPhaseState;
  href?: string;
}

export type JourneyGateLabel = 'G1' | 'G2' | 'G3' | 'G4';
export type JourneyGateStatus = 'signed' | 'missing_inputs' | 'not_wired';

export interface JourneyGate {
  afterPhase: 1 | 2 | 3 | 4 | 5;
  label: JourneyGateLabel;
  status: JourneyGateStatus;
}

export interface JourneyRailProps {
  phases: ReadonlyArray<JourneyPhase>;
  gates: ReadonlyArray<JourneyGate>;
}

export function JourneyRail({ phases, gates }: JourneyRailProps) {
  const gatesByAfterPhase = new Map<number, JourneyGate>();
  for (const g of gates) gatesByAfterPhase.set(g.afterPhase, g);

  return (
    <div
      role="list"
      aria-label="Program journey rail"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        flexWrap: 'wrap',
        fontFamily: FONT.body,
      }}
    >
      {phases.map((p, i) => (
        <span
          key={p.key}
          role="listitem"
          style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}
        >
          <PhaseNode phase={p} />
          {i < phases.length - 1 ? (
            <GateCap gate={gatesByAfterPhase.get(p.index)} />
          ) : null}
        </span>
      ))}
    </div>
  );
}

function PhaseNode({ phase }: { phase: JourneyPhase }) {
  const isActive = phase.state === 'active';
  const isPast = phase.state === 'past';
  const node = (
    <span
      data-abarva-phase-key={phase.key}
      data-abarva-phase-state={phase.state}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: isActive
            ? COLORS.navy
            : isPast
              ? COLORS.navySoft
              : COLORS.surface2,
          color: isActive ? COLORS.surface : COLORS.ink,
          border: isActive
            ? `1px solid ${COLORS.navy}`
            : isPast
              ? `1px solid ${COLORS.navySoft}`
              : `1px solid ${COLORS.border}`,
          fontFamily: FONT.mono,
          fontSize: 11,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {phase.index}
      </span>
      <span
        style={{
          ...TYPE.eyebrow,
          color: isActive ? COLORS.navy : COLORS.mutedSoft,
        }}
      >
        {phase.label}
      </span>
    </span>
  );
  if (phase.href) {
    return (
      <Link
        href={phase.href}
        data-abarva-phase-href={phase.key}
        style={{ textDecoration: 'none' }}
      >
        {node}
      </Link>
    );
  }
  return node;
}

function GateCap({ gate }: { gate: JourneyGate | undefined }) {
  if (!gate) {
    return <span aria-hidden="true" style={{ width: 12 }} />;
  }
  const accent = (() => {
    switch (gate.status) {
      case 'signed':
        return statusAccent('ready');
      case 'missing_inputs':
        return statusAccent('partial');
      case 'not_wired':
      default:
        return statusAccent('blocked');
    }
  })();
  return (
    <span
      data-abarva-gate-label={gate.label}
      data-abarva-gate-status={gate.status}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span
        style={{
          ...TYPE.eyebrow,
          color: accent.fg,
          background: accent.bg,
          padding: '1px 6px',
          borderRadius: RADIUS.chip,
        }}
      >
        {gate.label}
      </span>
      <span
        style={{
          ...TYPE.eyebrow,
          fontSize: 9,
          color: accent.fg,
        }}
      >
        {gate.status.replace(/_/g, ' ')}
      </span>
    </span>
  );
}
