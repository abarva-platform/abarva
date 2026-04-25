// DES2 · FileTypeChip.
//
// Text-only mono chip for AbarVa file-type labels. NAVY-tinted
// background, mono uppercase glyph, no icon.

import {
  COLORS,
  FONT,
  type AbarvaFileChip,
} from '@/lib/design/abarva-theme';

export interface FileTypeChipProps {
  type: AbarvaFileChip;
  /** Optional filename caption rendered after the chip. */
  caption?: string;
}

export function FileTypeChip({ type, caption }: FileTypeChipProps) {
  return (
    <span
      data-file-type={type}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: FONT.body,
        fontSize: 12,
        color: COLORS.body,
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          background: COLORS.navySoft,
          border: `1px solid ${COLORS.navy}33`,
          borderRadius: 4,
          padding: '1px 5px',
          lineHeight: 1.4,
        }}
      >
        {type}
      </span>
      {caption ? <span>{caption}</span> : null}
    </span>
  );
}
