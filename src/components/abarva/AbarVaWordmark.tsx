// DES7 · Canonical AbarVa wordmark module.
//
// This module now resolves to the uploaded logo asset at:
// `public/brand/abarva-logo.svg` through `AbarVaLogo`.
// Legacy callers continue to use `AbarvaWordmark` and `AbarVaWordmark`
// without any behavior change at import sites.

import { AbarVaLogo } from '@/components/brand';
import { COLORS } from '@/lib/design/abarva-theme';

export interface AbarvaWordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  /**
   * Legacy color override is intentionally no-op while the canonical logo
   * asset controls final glyph treatment.
   */
  inkColor?: string;
}

export function AbarvaWordmark({ size = 'md', inkColor }: AbarvaWordmarkProps) {
  return (
    <AbarVaLogo
      size={size}
      alt="AbarVa"
      aria-hidden={false}
      style={inkColor === COLORS.surface ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );
}

export { AbarvaWordmark as AbarVaWordmark };
