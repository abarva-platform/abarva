// BRAND1 · canonical AbarVa wordmark + lockup component (ADMIN1 extends with variant prop).
import type * as React from 'react';

import { clsx } from 'clsx'

// Pull canonical brand color tokens from '@/lib/design/design-tokens'
// rather than hand-coding hex literals in this file.
import { COLORS as BRAND_COLORS } from '@/lib/design/design-tokens';

// Re-exported so consumers (e.g. admin shell tests) can verify that the
// component file pulls from the canonical token table.
export const ABARVA_LOGO_INK = BRAND_COLORS.ink;
export const ABARVA_LOGO_NAVY = BRAND_COLORS.navy;

export type AbarVaLogoVariant = 'wordmark' | 'lockup'
export type AbarVaLogoSize = 'sm' | 'md' | 'lg'

interface AbarVaLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Visual variant — 'wordmark' (default, canonical /brand/abarva-logo.svg)
   *  or 'lockup' (orbital symbol + wordmark, lockup-v2 asset) */
  variant?: AbarVaLogoVariant
  /** Optional semantic size */
  size?: AbarVaLogoSize
  /** Optional explicit width override (pixel or CSS units) */
  width?: number | string
  /** Optional explicit height override (pixel or CSS units) */
  height?: number | string
  /** Visible label for assistive technology */
  label?: string
}

const SIZE_TO_HEIGHT: Record<AbarVaLogoSize, number> = {
  sm: 18,
  md: 24,
  lg: 32,
}

const LOCKUP_SIZE_TO_HEIGHT: Record<AbarVaLogoSize, number> = {
  sm: 32,
  md: 48,
  lg: 80,
}

// Asset paths (string-only — no inline markup, NAV1B invariants forbid
// raw markup tokens in this source file).
const WORDMARK_ASSET = '/brand/abarva-logo.svg'
const LOCKUP_ASSET = '/brand/abarva-logo-lockup-v2.svg'

// Both assets use the same 1600x520 viewBox aspect ratio.
const ASSET_ASPECT_RATIO = 1600 / 520

export function AbarVaLogo({
  variant = 'wordmark',
  size = 'md',
  width,
  height,
  label = 'AbarVa',
  className,
  ...imgProps
}: AbarVaLogoProps) {
  const heightTable = variant === 'lockup' ? LOCKUP_SIZE_TO_HEIGHT : SIZE_TO_HEIGHT
  const computedHeight = height ?? heightTable[size]
  const computedWidth =
    width ?? `calc(${typeof computedHeight === 'number' ? `${computedHeight}px` : computedHeight} * ${ASSET_ASPECT_RATIO})`

  const src = variant === 'lockup' ? LOCKUP_ASSET : WORDMARK_ASSET

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...imgProps}
      src={src}
      alt={label}
      width={typeof computedWidth === 'number' ? computedWidth : undefined}
      height={typeof computedHeight === 'number' ? computedHeight : undefined}
      className={clsx(className, 'abarva-logo', `abarva-logo--${variant}`)}
      aria-label={label}
      style={{
        display: 'block',
        objectFit: 'contain',
        ...imgProps.style,
        ...(typeof computedWidth === 'string' ? { width: computedWidth } : {}),
        ...(typeof computedHeight === 'string' ? { height: computedHeight } : {}),
      }}
    />
  )
}
