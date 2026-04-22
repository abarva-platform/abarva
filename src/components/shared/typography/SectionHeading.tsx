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
  const fontSize = size === 'lg' ? 24 : size === 'md' ? 20 : 17;
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
