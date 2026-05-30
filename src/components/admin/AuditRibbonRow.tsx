'use client';

/**
 * AuditRibbonRow · Wave 1 PR-6
 *
 * Thin client island that wraps a single row of the AuditRibbon.
 * Two responsibilities:
 *   1. Navigate to /admin/audit?source=<source> on click.
 *   2. Fire a PostHog telemetry breadcrumb so we can measure
 *      incident-response triage flow without scraping logs.
 *
 * Kept separate from AuditRibbon so the ribbon itself stays
 * server-renderable. The PostHog import is `posthog-js`, matching
 * the existing telemetry-bridge convention
 * (`SetupLandingTelemetryBridge`, `J0TelemetryBridge`, etc).
 */

import { useCallback } from 'react';
import posthog from 'posthog-js';
import type { TrustAuditEvent } from '@/lib/admin/broker/trust-spine-broker';

interface Props {
  source: TrustAuditEvent['source'];
  href: string;
  children: React.ReactNode;
}

export function AuditRibbonRow({ source, href, children }: Props) {
  const handleClick = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      posthog.capture('audit_ribbon_row_clicked', { source });
    } catch {
      // PostHog not initialized in this surface — swallow.
    }
  }, [source]);

  return (
    <a
      href={href}
      onClick={handleClick}
      data-testid="audit-ribbon-row"
      data-source={source}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {children}
    </a>
  );
}
