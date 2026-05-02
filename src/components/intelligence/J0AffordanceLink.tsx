'use client';

// J0AffordanceLink · INT-1.5
//
// Tiny client wrapper around next/link for J0 landing affordances.
// Captures the click as a CustomEvent so J0TelemetryBridge can forward
// it to PostHog. Keeps IntelligenceIndexPage as a server component.

import {
  useState,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Link from 'next/link';

export interface J0AffordanceLinkProps {
  href: string;
  affordance: string;
  testid?: string;
  children: ReactNode;
  /** Pass-through inline style for layout. */
  style?: CSSProperties;
}

export function J0AffordanceLink({
  href,
  affordance,
  testid,
  children,
  style,
}: J0AffordanceLinkProps) {
  // Snapshot mount time so click telemetry computes time-to-click.
  const [mountedAt] = useState<number>(() => Date.now());

  const onClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      const detail = {
        affordance,
        time_to_click_ms: Date.now() - mountedAt,
      };
      window.dispatchEvent(
        new CustomEvent('j0_affordance_clicked', { detail }),
      );
    }
  }, [affordance, mountedAt]);

  return (
    <Link href={href} data-testid={testid} onClick={onClick} style={style}>
      {children}
    </Link>
  );
}
