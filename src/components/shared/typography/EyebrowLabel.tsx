import type { CSSProperties, ReactNode } from 'react';
import { COLORS } from '@/lib/design-system';

interface Props {
  children: ReactNode;
  tone?: 'teal' | 'muted' | 'amber' | 'red';
  size?: 'xs' | 'sm' | 'md';
  style?: CSSProperties;
}

// JetBrains Mono eyebrow. Always uppercase, letterspaced. Signals "section
// starts here" or "category tag". Teal tone for identity; muted for
// descriptive tags; amber/red for signal severity on cards.
export function EyebrowLabel({ children, tone = 'teal', size = 'sm', style }: Props) {
  const color =
    tone === 'teal' ? COLORS.teal
      : tone === 'amber' ? COLORS.amber
      : tone === 'red' ? COLORS.red
      : 'rgba(245,245,240,0.55)';
  const fontSize = size === 'xs' ? 9 : size === 'md' ? 11 : 10;
  return (
    <div
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize,
        fontWeight: 600,
        color,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
