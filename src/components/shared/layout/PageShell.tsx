import type { CSSProperties, ReactNode } from 'react';
import { COLORS } from '@/lib/design-system';

interface Props {
  children: ReactNode;
  // Controls outer horizontal width. 'narrow' for content-heavy pages that
  // benefit from readable line-lengths (briefings, investor content);
  // 'standard' for product pages with dense layouts; 'wide' for dashboards
  // and 3-column surfaces.
  width?: 'narrow' | 'standard' | 'wide' | 'full';
  // Vertical padding variant. 'tight' for surfaces that must nest inside a
  // nav/subnav without doubling up on padding. 'comfortable' default.
  padding?: 'tight' | 'comfortable' | 'spacious';
  style?: CSSProperties;
}

// Consistent page wrapper · applies near-black background, sets max-width, and
// wraps content with safe-area-respecting horizontal padding. Every Wave 3
// page starts with <PageShell>. Does NOT render nav — compose with
// AuthenticatedNav / MarketingNav at the route level.
//
// Widths tuned per Fix Spec v3 §1 · standard = 1280 (13-15" laptop sweet
// spot), wide = 1480 (dashboards + engagement console with rail),
// narrow = 820 (investor briefings + long-form reading).
export function PageShell({ children, width = 'standard', padding = 'comfortable', style }: Props) {
  const maxWidth =
    width === 'narrow' ? 820
      : width === 'standard' ? 1280
      : width === 'wide' ? 1480
      : '100%';
  const paddingY =
    padding === 'tight' ? '16px'
      : padding === 'spacious' ? '48px'
      : '32px';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.pageBg,
        color: COLORS.textPrimary,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth,
          margin: '0 auto',
          padding: `${paddingY} 24px`,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
