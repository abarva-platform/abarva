import type { CSSProperties, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  style?: CSSProperties;
}

// Small supporting caption · metadata next to a value, timestamp under a card,
// "SINCE FEB 2026" style lines. DM Sans 11 at ~60% opacity on warm off-white.
// For eyebrow-style uppercase text use EyebrowLabel.
export function MetaLabel({ children, style }: Props) {
  return (
    <span
      style={{
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        fontSize: 11,
        fontWeight: 400,
        color: 'rgba(245,245,240,0.60)',
        lineHeight: 1.5,
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
