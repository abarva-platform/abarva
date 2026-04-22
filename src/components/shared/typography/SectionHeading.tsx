import type { CSSProperties, ReactNode } from 'react';
import { COLORS } from '@/lib/design-system';

interface Props {
  children: ReactNode;
  as?: 'h2' | 'h3' | 'h4';
  size?: 'lg' | 'md' | 'sm';
  style?: CSSProperties;
  id?: string;
}

// Georgia section headings. Smaller than PageTitle, used to open distinct
// regions within a page. Sits above a SectionLabel eyebrow when both are
// present (eyebrow first, heading below).
export function SectionHeading({ children, as = 'h2', size = 'md', style, id }: Props) {
  const Tag = as;
  const fontSize =
    size === 'lg' ? 'clamp(26px, 2vw + 16px, 34px)'
      : size === 'md' ? 'clamp(22px, 1.6vw + 14px, 30px)'
      : 'clamp(18px, 1.1vw + 12px, 22px)';
  return (
    <Tag
      id={id}
      style={{
        fontFamily: 'Georgia, serif',
        fontSize,
        fontWeight: 400,
        color: COLORS.textPrimary,
        lineHeight: 1.3,
        letterSpacing: '-0.005em',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
