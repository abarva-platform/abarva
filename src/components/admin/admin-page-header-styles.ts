import type { CSSProperties } from 'react';
import { COLORS, TYPOGRAPHY } from '@/lib/design/design-tokens';

export const ADMIN_PAGE_HEADER_STYLES = {
  eyebrow: {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: COLORS.navy,
    margin: 0,
  },
  title: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: 40,
    fontWeight: 600,
    lineHeight: 1.06,
    letterSpacing: 0,
    color: COLORS.ink,
    margin: '6px 0 0',
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 15,
    lineHeight: 1.5,
    color: `${COLORS.ink}b8`,
    margin: '12px 0 0',
    maxWidth: 860,
  },
} satisfies Record<string, CSSProperties>;
