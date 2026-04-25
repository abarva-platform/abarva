// DES2 · EvidenceChip.
//
// Names an evidence reference state. Imports restricted to the
// AbarVa theme.

import {
  COLORS,
  FONT,
  RADIUS,
  TYPE,
  type AbarvaEvidenceState,
} from '@/lib/design/abarva-theme';

export type EvidenceChipState = AbarvaEvidenceState;

export interface EvidenceChipProps {
  state: EvidenceChipState;
  label?: string;
  tooltip?: string;
}

const ACCENT: Record<
  EvidenceChipState,
  { fg: string; bg: string }
> = {
  not_seeded: { fg: COLORS.mutedSoft, bg: COLORS.surface2 },
  partial: { fg: COLORS.amber, bg: COLORS.amberSoft },
  cited: { fg: COLORS.navy, bg: COLORS.navySoft },
  quality_checked: { fg: COLORS.navy, bg: COLORS.navySoft },
  usable_as_evidence: { fg: COLORS.navy, bg: COLORS.navySoft },
  blocked: { fg: COLORS.red, bg: COLORS.redSoft },
};

export function EvidenceChip({ state, label, tooltip }: EvidenceChipProps) {
  const palette = ACCENT[state];
  const display = label ?? `evidence · ${state.replace(/_/g, ' ')}`;
  return (
    <span
      data-abarva-evidence-state={state}
      title={tooltip}
      style={{
        ...TYPE.eyebrow,
        background: palette.bg,
        color: palette.fg,
        padding: '2px 8px',
        borderRadius: RADIUS.pill,
        fontFamily: FONT.mono,
      }}
    >
      {display}
    </span>
  );
}
