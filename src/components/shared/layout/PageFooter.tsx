import type { CSSProperties } from 'react';
import { EyebrowLabel } from '../typography/EyebrowLabel';

interface Props {
  // 'marketing' shows the full external-facing footer (contact, investor,
  // trust links). 'authenticated' shows a minimal footer for in-product pages.
  variant?: 'marketing' | 'authenticated';
  style?: CSSProperties;
}

// Shared page footer. Marketing and product pages consume the same primitive
// with different density. Does NOT link to deprecated surfaces — keep entries
// in sync with the canonical product map.
export function PageFooter({ variant = 'authenticated', style }: Props) {
  if (variant === 'marketing') {
    return (
      <footer
        style={{
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
          padding: '32px 24px',
          background: 'rgba(0,0,0,0.25)',
          ...style,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          <div>
            <EyebrowLabel tone="teal" size="xs">AbarVa</EyebrowLabel>
            <div style={{ marginTop: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(245,245,240,0.65)' }}>
              Intelligence layer for executive transformation.
            </div>
          </div>
          <div>
            <EyebrowLabel tone="muted" size="xs">Product</EyebrowLabel>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><a href="/intelligence" style={{ color: 'rgba(245,245,240,0.85)', fontSize: 13, textDecoration: 'none' }}>Intelligence Suite</a></li>
              <li><a href="/tower" style={{ color: 'rgba(245,245,240,0.85)', fontSize: 13, textDecoration: 'none' }}>Control Tower</a></li>
              <li><a href="/engagements" style={{ color: 'rgba(245,245,240,0.85)', fontSize: 13, textDecoration: 'none' }}>Programs</a></li>
            </ul>
          </div>
          <div>
            <EyebrowLabel tone="muted" size="xs">Company</EyebrowLabel>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><a href="/investor" style={{ color: 'rgba(245,245,240,0.85)', fontSize: 13, textDecoration: 'none' }}>Investors</a></li>
            </ul>
          </div>
          <div>
            <EyebrowLabel tone="muted" size="xs">Legal</EyebrowLabel>
            <div style={{ marginTop: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(245,245,240,0.55)' }}>
              © 2026 AbarVa.
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      style={{
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        padding: '18px 24px',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 11,
        color: 'rgba(245,245,240,0.45)',
        ...style,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>© 2026 AbarVa</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>PRIVATE</span>
      </div>
    </footer>
  );
}
