/**
 * PatternDoctrineLink — a small monospace chip that links to the pattern
 * detail page at `/source/patterns/{patternId}`. Used by
 * SourceProvenanceRibbon to make citation chips clickable.
 *
 * Visual style mirrors the existing citation chip in SourceProvenanceRibbon:
 * pill, paper background, monospace ID, optional companion title in DM
 * Sans/Inter. Anchor wrapper preserves the chip surface as a link target.
 */

import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';

interface PatternDoctrineLinkProps {
  patternId: string;
  title?: string;
  /** Tooltip text. Defaults to "{patternId}" or "{patternId} · {title}". */
  hoverTitle?: string;
}

export function PatternDoctrineLink({
  patternId,
  title,
  hoverTitle,
}: PatternDoctrineLinkProps) {
  const tooltip = hoverTitle ?? (title ? `${patternId} · ${title}` : patternId);
  return (
    <Link
      href={`/source/patterns/${encodeURIComponent(patternId)}`}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 999,
        background: SHELL.CARD_WHITE,
        padding: '3px 9px',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        fontWeight: 600,
        color: SHELL.INK,
        letterSpacing: '0.04em',
        textDecoration: 'none',
      }}
    >
      <span>{patternId}</span>
      {title ? (
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontWeight: 400,
            color: SHELL.INK_MUTED,
            fontSize: 10.5,
            letterSpacing: 0,
          }}
        >
          {title}
        </span>
      ) : null}
    </Link>
  );
}
