'use client';

/**
 * PanelCardCta · Wave 2 PR-6 — Connector onboarding entry point.
 *
 * Renders a ghost button inside a `PanelCard` foot row. Because
 * `PanelCard` itself is wrapped in an `<a>` (the panel deep-link),
 * nested anchors are invalid HTML. This island stops the click
 * bubbling, fires the optional PostHog breadcrumb, and navigates
 * to the CTA href programmatically.
 *
 * Locked design surface: DM Sans label, mono eyebrow not used here
 * (the button itself is the affordance), ink-on-cream ghost. No
 * new colors.
 */

import { useCallback } from 'react';
import posthog from 'posthog-js';

interface Props {
  label: string;
  href: string;
  telemetryEvent?: string;
}

export function PanelCardCta({ label, href, telemetryEvent }: Props) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof window === 'undefined') return;
      if (telemetryEvent) {
        try {
          posthog.capture(telemetryEvent);
        } catch {
          // PostHog not initialized in this surface — swallow.
        }
      }
      window.location.href = href;
    },
    [href, telemetryEvent],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      data-panel-cta-href={href}
      data-testid="panel-card-cta"
      style={{
        fontFamily:
          'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: '#0A0C12',
        background: 'transparent',
        border: '1px solid rgba(10,12,18,0.35)',
        borderRadius: 3,
        padding: '4px 10px',
        cursor: 'pointer',
        lineHeight: 1.2,
      }}
    >
      {label}
    </button>
  );
}
