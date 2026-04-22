import type { CSSProperties, ReactNode } from 'react';
import { COLORS } from '@/lib/design-system';

interface Props {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  weight?: 400 | 500 | 600 | 700;
  tone?: 'primary' | 'secondary' | 'muted';
  as?: 'p' | 'div' | 'span' | 'li';
  style?: CSSProperties;
}

// DM Sans body text. Fix Spec v5 raises the floor on 13–16" laptop
// readability with responsive clamp() sizing: xs 11→13, sm 13→15,
// md 15→17, lg 17→19.
export function Body({ children, size = 'md', weight = 400, tone = 'primary', as = 'p', style }: Props) {
  const Tag = as;
  const fontSize =
    size === 'xs' ? 'clamp(11px, 0.6vw + 8px, 13px)'
      : size === 'sm' ? 'clamp(13px, 0.9vw + 10px, 15px)'
      : size === 'lg' ? 'clamp(17px, 1.2vw + 12px, 19px)'
      : 'clamp(15px, 1vw + 11px, 17px)';
  const color =
    tone === 'secondary' ? COLORS.textSecondary
      : tone === 'muted' ? COLORS.textMuted
      : COLORS.textPrimary;
  return (
    <Tag
      style={{
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        fontSize,
        fontWeight: weight,
        color,
        lineHeight: size === 'lg' ? 1.65 : 1.6,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
