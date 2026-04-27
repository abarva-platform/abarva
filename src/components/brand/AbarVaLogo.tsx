import type * as React from 'react';

import { clsx } from 'clsx'

type AbarVaLogoSize = 'sm' | 'md' | 'lg'

interface AbarVaLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
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

export function AbarVaLogo({
  size = 'md',
  width,
  height,
  label = 'AbarVa',
  className,
  ...imgProps
}: AbarVaLogoProps) {
  const computedHeight = height ?? SIZE_TO_HEIGHT[size]
  const computedWidth =
    width ?? `calc(${typeof computedHeight === 'number' ? `${computedHeight}px` : computedHeight} * 2.6)`

  return (
    <img
      {...imgProps}
      src="/brand/abarva-logo.svg"
      alt={label}
      width={typeof computedWidth === 'number' ? computedWidth : undefined}
      height={typeof computedHeight === 'number' ? computedHeight : undefined}
      className={clsx(className, 'abarva-logo')}
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
