import type { CSSProperties, ReactNode } from 'react';
import { COLORS } from '@/lib/design-system';

interface Props {
  children: ReactNode;
  as?: 'h1' | 'h2';
  size?: 'display' | 'page';
  style?: CSSProperties;
  id?: string;
}

// Georgia display type for page-level hero headings and the wordmark-adjacent
// line on each page. Never use for section breaks — use SectionHeading.
export function PageTitle({ children, as = 'h1', size = 'page', style, id }: Props) {
  const Tag = as;
  const fontSize = size === 'display'
    ? 'clamp(34px, 3.2vw + 16px, 56px)'
    : 'clamp(30px, 2.2vw + 15px, 42px)';
  return (
    <Tag
      id={id}
      style={{
        fontFamily: 'Georgia, serif',
        fontSize,
        fontWeight: 400,
        color: COLORS.textPrimary,
        lineHeight: 1.16,
        letterSpacing: '-0.01em',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
