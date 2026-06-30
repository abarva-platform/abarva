'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';

interface AvaWordmarkProps {
  className?: string;
  style?: CSSProperties;
  title?: string;
  tone?: 'dark' | 'light';
}

export function AvaWordmark({
  className,
  style,
  title = 'aVa',
  tone = 'dark',
}: AvaWordmarkProps) {
  return (
    <Image
      src={tone === 'light' ? '/brand/ava/ava-wordmark-light.png' : '/brand/ava/ava-wordmark-dark.png'}
      alt={title}
      width={846}
      height={389}
      className={className}
      style={{
        display: 'block',
        width: 52,
        height: 'auto',
        objectFit: 'contain',
        ...style,
      }}
      draggable={false}
    />
  );
}
