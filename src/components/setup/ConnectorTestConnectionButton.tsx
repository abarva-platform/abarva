'use client';

/**
 * ConnectorTestConnectionButton · Wave 2 PR-6
 *
 * Adds a "Test connection" affordance to the connector detail page
 * (verdict §4 Persona A, last paragraph). Click → PostHog
 * `connector_test_connection_clicked` breadcrumb + a transient
 * status banner.
 *
 * TODO(Wave 2 PR-1): When the connector-health broker contract
 * lands, replace the placeholder with `await
 * brokerTestConnector(tenantKey, connectorId)` and surface the
 * result (success / failure reason / latency) inline.
 *
 * Design tokens are inlined to avoid hex-literal lint warnings
 * from the shell-tokens module; black-on-cream ghost button.
 */

import { useCallback, useState } from 'react';
import posthog from 'posthog-js';
import { SHELL } from '@/lib/shell/shell-tokens';

interface Props {
  connectorId: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'placeholder' };

export function ConnectorTestConnectionButton({ connectorId }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const handleClick = useCallback(() => {
    if (typeof window === 'undefined') return;
    setStatus({ kind: 'pending' });
    try {
      posthog.capture('connector_test_connection_clicked', {
        connector_id: connectorId,
      });
    } catch {
      // PostHog not initialized — swallow.
    }
    // Simulate the request flight without an async fetch so the
    // button feels responsive in seeded mode. Real RPC swap goes
    // through the broker in Wave 2 PR-1.
    window.setTimeout(() => {
      setStatus({ kind: 'placeholder' });
    }, 250);
  }, [connectorId]);

  return (
    <div
      data-testid="connector-test-connection"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        data-testid="connector-test-connection-button"
        onClick={handleClick}
        disabled={status.kind === 'pending'}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: SHELL.INK,
          background: 'transparent',
          border: `1px solid ${SHELL.INK}`,
          borderRadius: 4,
          padding: '8px 16px',
          cursor: status.kind === 'pending' ? 'wait' : 'pointer',
          opacity: status.kind === 'pending' ? 0.6 : 1,
        }}
      >
        Test connection
      </button>
      {status.kind === 'placeholder' && (
        <span
          role="status"
          data-testid="connector-test-connection-banner"
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_SOFT,
            background: SHELL.PAPER_SOFT,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 4,
            padding: '6px 10px',
          }}
        >
          Would test connection · live probe arrives with the
          connector-health broker (Wave 2 PR-1).
        </span>
      )}
    </div>
  );
}
