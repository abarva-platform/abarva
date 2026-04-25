// DES2 · EvidenceChip.
//
// State chip for the AbarVa evidence lifecycle (PDEL / ADM3). NAVY for
// cited / quality_checked / usable_as_evidence; AMBER for partial; RED
// for blocked; MUTED for not_seeded.

import {
  COLORS,
  FONT,
  type AbarvaEvidenceState,
} from '@/lib/design/abarva-theme';

export interface EvidenceChipProps {
  state: AbarvaEvidenceState;
}

interface ChipAccent {
  fg: string;
  bg: string;
  border: string;
}

function evidenceAccent(state: AbarvaEvidenceState): ChipAccent {
  if (
    state === 'cited' ||
    state === 'quality_checked' ||
    state === 'usable_as_evidence'
  ) {
    return {
      fg: COLORS.navy,
      bg: COLORS.navySoft,
      border: `${COLORS.navy}33`,
    };
  }
  if (state === 'partial') {
    return {
      fg: COLORS.amber,
      bg: COLORS.amberSoft,
      border: `${COLORS.amber}33`,
    };
  }
  if (state === 'blocked') {
    return {
      fg: COLORS.red,
      bg: COLORS.redSoft,
      border: `${COLORS.red}33`,
    };
  }
  // not_seeded
  return {
    fg: COLORS.muted,
    bg: COLORS.surface2,
    border: COLORS.borderSoft,
  };
}

export function EvidenceChip({ state }: EvidenceChipProps) {
  const accent = evidenceAccent(state);
  return (
    <span
      data-evidence-state={state}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: accent.fg,
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        borderRadius: 999,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {state.replace(/_/g, ' ')}
    </span>
  );
}
