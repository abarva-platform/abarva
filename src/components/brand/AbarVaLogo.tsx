import Image from 'next/image';
import type * as React from 'react';

import { COLORS as BRAND_COLORS } from '@/lib/design/design-tokens';

export const ABARVA_LOGO_INK = BRAND_COLORS.ink;
export const ABARVA_LOGO_NAVY = BRAND_COLORS.navy;

export type AbarVaLogoVariant = 'wordmark' | 'lockup';
export type AbarVaLogoSize = 'sm' | 'md' | 'lg';

interface AbarVaLogoProps extends Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'> {
  variant?: AbarVaLogoVariant;
  size?: AbarVaLogoSize;
  width?: number;
  height?: number;
  label?: string;
}

const SIZE_TO_HEIGHT: Record<AbarVaLogoSize, number> = {
  sm: 18,
  md: 24,
  lg: 32,
};

const LOCKUP_SIZE_TO_HEIGHT: Record<AbarVaLogoSize, number> = {
  sm: 24,
  md: 28,
  lg: 32,
};

const WORDMARK_ASSET = '/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg';
const LOCKUP_ASSET = '/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-standard.svg';
const COMPACT_ASSET_ASPECT_RATIO = 142.198 / 32;
const STANDARD_ASSET_ASPECT_RATIO = 153.277 / 32;

export function AbarVaLogo({
  variant = 'wordmark',
  size = 'md',
  width,
  height,
  label = 'AbarVa',
  style,
  ...imageProps
}: AbarVaLogoProps) {
  const heightTable = variant === 'lockup' ? LOCKUP_SIZE_TO_HEIGHT : SIZE_TO_HEIGHT;
  const computedHeight = height ?? heightTable[size];
  const aspectRatio = variant === 'lockup' ? STANDARD_ASSET_ASPECT_RATIO : COMPACT_ASSET_ASPECT_RATIO;
  const computedWidth = width ?? Math.round(computedHeight * aspectRatio);

  return (
    <Image
      {...imageProps}
      src={variant === 'lockup' ? LOCKUP_ASSET : WORDMARK_ASSET}
      alt={label}
      aria-label={label}
      width={computedWidth}
      height={computedHeight}
      priority
      style={{
        height: computedHeight,
        width: 'auto',
        display: 'block',
        ...style,
      }}
    />
  );
}
