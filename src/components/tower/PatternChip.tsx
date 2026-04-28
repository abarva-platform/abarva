import Link from 'next/link';
import type { StorylinePatternMatch } from '@/lib/intelligence/storyline-matcher';
import { SHELL } from '@/lib/shell/shell-tokens';

export function PatternChip({ pattern }: { pattern: StorylinePatternMatch }) {
  return (
    <Link
      href={pattern.href}
      data-testid={`pattern-chip-${pattern.id}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 999,
        background: '#fffaf0',
        color: SHELL.INK,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '7px 10px',
        textDecoration: 'none',
      }}
    >
      <span>{pattern.id}</span>
      <span style={{ color: SHELL.INK_MUTED }}>{pattern.matchReason}</span>
    </Link>
  );
}
