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

// DM Sans body text. Default 14/1.6 which is the product default. Use sm
// (13) for supporting copy; lg (16) for opening paragraphs on content-heavy
// pages; xs (11) only for metadata — use MetaLabel for most small cases.
export function Body({ children, size = 'md', weight = 400, tone = 'primary', as = 'p', style }: Props) {
  const Tag = as;
  const fontSize = size === 'xs' ? 11 : size === 'sm' ? 13 : size === 'lg' ? 16 : 14;
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
        lineHeight: 1.6,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
