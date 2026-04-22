import type { CSSProperties, ReactNode } from 'react';
import { COLORS } from '@/lib/design-system';

interface Props {
  children: ReactNode;
  tone?: 'teal' | 'muted' | 'amber' | 'red';
  size?: 'xs' | 'sm' | 'md';
  style?: CSSProperties;
  id?: string;
}

// JetBrains Mono eyebrow. Always uppercase, letterspaced. Signals "section
// starts here" or "category tag". Teal tone for identity; muted for
// descriptive tags; amber/red for signal severity on cards.
export function EyebrowLabel({ children, tone = 'teal', size = 'sm', style, id }: Props) {
  const color =
    tone === 'teal' ? COLORS.teal
      : tone === 'amber' ? COLORS.amber
      : tone === 'red' ? COLORS.red
      : 'rgba(245,245,240,0.55)';
  // Fix Spec v3 §1 · eyebrow sizes bumped one step so labels stay legible
  // on 13" laptops: xs 9→10, sm 10→11, md 11→12.
  const fontSize = size === 'xs' ? 10 : size === 'md' ? 12 : 11;
  return (
    <div
      id={id}
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
