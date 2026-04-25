// DES2 · FileTypeChip.
//
// Names the artifact's file type. Imports restricted to the AbarVa
// theme.

import {
  COLORS,
  FONT,
  RADIUS,
  type AbarvaFileChip,
} from '@/lib/design/abarva-theme';

export type FileTypeChipType = AbarvaFileChip;

export interface FileTypeChipProps {
  type: FileTypeChipType;
}

export function FileTypeChip({ type }: FileTypeChipProps) {
  return (
    <span
      data-abarva-file-chip={type}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        background: COLORS.surface2,
        color: COLORS.muted,
        padding: '2px 6px',
        borderRadius: RADIUS.chip,
      }}
    >
      {type}
    </span>
  );
}
