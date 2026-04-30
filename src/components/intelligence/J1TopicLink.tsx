'use client';

// J1TopicLink · INT-2.6
//
// Tiny client wrapper around next/link for clickable elements on
// J1 pages that need telemetry capture (pattern card, related
// failure-mode chip, Ask Sentinel button, breadcrumb back, related
// topic chip on failure-mode page). Emits a CustomEvent the
// J1TelemetryBridge listens for.
//
// Pass `eventName` + `detail` per-call. Mirrors the
// J0AffordanceLink pattern.

import { useState, useCallback, type ReactNode } from 'react';
import Link from 'next/link';

export interface J1TopicLinkProps {
  href: string;
  /** CustomEvent name to dispatch on click. */
  eventName: string;
  /** Static detail merged with `time_to_click_ms` at click time. */
  eventDetail: Record<string, string | number | boolean | null>;
  testid?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function J1TopicLink({
  href,
  eventName,
  eventDetail,
  testid,
  children,
  style,
  ariaLabel,
}: J1TopicLinkProps) {
  const [mountedAt] = useState<number>(() => Date.now());

  const onClick = useCallback(() => {
    if (typeof window === 'undefined') return;
    const detail = {
      ...eventDetail,
      time_to_click_ms: Date.now() - mountedAt,
    };
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }, [eventName, eventDetail, mountedAt]);

  return (
    <Link
      href={href}
      onClick={onClick}
      data-testid={testid}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
