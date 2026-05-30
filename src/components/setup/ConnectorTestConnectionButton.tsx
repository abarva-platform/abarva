'use client';

/**
 * ConnectorTestConnectionButton · PRE-W4-PR-3
 *
 * Live "Test connection" affordance on the connector detail page.
 *
 * Wave 2 PR-6 shipped a 250 ms placeholder banner with the note
 * "live probe arrives with the connector-health broker". The
 * broker landed in Wave 2 PR-1; PRE-W4-PR-3 now wires the button
 * to the real `POST /api/admin/connectors/{id}/test` endpoint.
 *
 * Render contract:
 *   • idle      → bare button.
 *   • probing   → spinner + "Probing connection…"
 *   • healthy   → green dot + "Connection healthy · {ms}ms · probed {relative time}"
 *   • failed    → red dot + "Connection failed · {reason}" (+ "Reconnect" hint
 *                  on auth-error reasons)
 *   • throttled → "Rate-limited · try again in {n}s" (preserves the
 *                  prior verdict above, if any, on retry)
 *
 * Design system: tokens inlined — black ghost button, cream wrapper.
 * No new colours, no new fonts (memory · design_system.md LOCKED).
 *
 * Telemetry: the PostHog `connector_test_connection_clicked`
 * breadcrumb is preserved. After the probe returns we additionally
 * capture `connector_test_connection_result` with `{ok, latencyMs,
 * reason}` so we can chart manual-test success rates.
 */

import { useCallback, useState, type CSSProperties } from 'react';
import posthog from 'posthog-js';
import { SHELL } from '@/lib/shell/shell-tokens';

interface Props {
  connectorId: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'probing' }
  | {
      kind: 'healthy';
      latencyMs: number;
      probedAtIso: string;
    }
  | {
      kind: 'failed';
      reason: string;
      isAuthError: boolean;
    }
  | { kind: 'rate_limited'; retryAfterSec: number }
  | { kind: 'error'; message: string };

interface ProbeResponseBody {
  ok?: boolean;
  latencyMs?: number;
  reason?: string;
  probedAtIso?: string;
}

const GREEN = '#0f7a3e';
const RED = '#8a1f1f';
const AMBER = '#7a5a0f';

function relativeFromIso(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'moments ago';
  const deltaMs = now - t;
  if (deltaMs < 0) return 'moments ago';
  if (deltaMs < 5_000) return 'just now';
  if (deltaMs < 60_000) return `${Math.floor(deltaMs / 1000)}s ago`;
  if (deltaMs < 3_600_000) return `${Math.floor(deltaMs / 60_000)}m ago`;
  return `${Math.floor(deltaMs / 3_600_000)}h ago`;
}

function isAuthErrorReason(reason: string | undefined): boolean {
  if (!reason) return false;
  const s = reason.toLowerCase();
  return s.includes('auth-error') || s.includes('401') || s.includes('403');
}

export function ConnectorTestConnectionButton({ connectorId }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const handleClick = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setStatus({ kind: 'probing' });
    try {
      posthog.capture('connector_test_connection_clicked', {
        connector_id: connectorId,
      });
    } catch {
      // PostHog not initialized — swallow.
    }

    try {
      const res = await fetch(
        `/api/admin/connectors/${encodeURIComponent(connectorId)}/test`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
        },
      );

      if (res.status === 429) {
        const retryAfterRaw = res.headers.get('Retry-After') ?? '60';
        const retryAfterSec = Math.max(
          1,
          Number.parseInt(retryAfterRaw, 10) || 60,
        );
        setStatus({ kind: 'rate_limited', retryAfterSec });
        return;
      }

      if (!res.ok) {
        setStatus({
          kind: 'error',
          message: `Probe request failed · HTTP ${res.status}`,
        });
        return;
      }

      const body = (await res.json()) as ProbeResponseBody;
      const ok = Boolean(body.ok);
      const latencyMs = Number.isFinite(body.latencyMs)
        ? (body.latencyMs as number)
        : 0;

      try {
        posthog.capture('connector_test_connection_result', {
          connector_id: connectorId,
          ok,
          latency_ms: latencyMs,
          reason: body.reason,
        });
      } catch {
        // PostHog not initialized — swallow.
      }

      if (ok) {
        setStatus({
          kind: 'healthy',
          latencyMs,
          probedAtIso: body.probedAtIso ?? new Date().toISOString(),
        });
      } else {
        setStatus({
          kind: 'failed',
          reason: body.reason ?? 'probe failed',
          isAuthError: isAuthErrorReason(body.reason),
        });
      }
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'probe failed',
      });
    }
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
        disabled={status.kind === 'probing'}
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
          cursor: status.kind === 'probing' ? 'wait' : 'pointer',
          opacity: status.kind === 'probing' ? 0.6 : 1,
        }}
      >
        Test connection
      </button>

      {status.kind === 'probing' && (
        <span
          role="status"
          data-testid="connector-test-connection-banner"
          data-state="probing"
          style={bannerStyle()}
        >
          <Spinner />
          <span>Probing connection…</span>
        </span>
      )}

      {status.kind === 'healthy' && (
        <span
          role="status"
          data-testid="connector-test-connection-banner"
          data-state="healthy"
          style={bannerStyle()}
        >
          <Dot color={GREEN} />
          <span>
            Connection healthy · {status.latencyMs}ms · probed{' '}
            {relativeFromIso(status.probedAtIso)}
          </span>
        </span>
      )}

      {status.kind === 'failed' && (
        <span
          role="status"
          data-testid="connector-test-connection-banner"
          data-state="failed"
          style={bannerStyle()}
        >
          <Dot color={RED} />
          <span>
            Connection failed · {status.reason}
            {status.isAuthError && (
              <>
                {' · '}
                <span style={{ textDecoration: 'underline' }}>
                  Reconnect connector
                </span>
              </>
            )}
          </span>
        </span>
      )}

      {status.kind === 'rate_limited' && (
        <span
          role="status"
          data-testid="connector-test-connection-banner"
          data-state="rate-limited"
          style={bannerStyle()}
        >
          <Dot color={AMBER} />
          <span>
            Rate-limited · try again in {status.retryAfterSec}s
          </span>
        </span>
      )}

      {status.kind === 'error' && (
        <span
          role="status"
          data-testid="connector-test-connection-banner"
          data-state="error"
          style={bannerStyle()}
        >
          <Dot color={RED} />
          <span>{status.message}</span>
        </span>
      )}
    </div>
  );
}

function bannerStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: SHELL.SANS,
    fontSize: 12,
    color: SHELL.INK_SOFT,
    background: SHELL.PAPER_SOFT,
    border: `1px solid ${SHELL.CARD_LINE}`,
    borderRadius: 4,
    padding: '6px 10px',
  };
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
      }}
    />
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      data-testid="connector-test-connection-spinner"
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: 999,
        border: `1.5px solid ${SHELL.INK_SOFT}`,
        borderTopColor: 'transparent',
        animation: 'connector-probe-spin 0.8s linear infinite',
      }}
    />
  );
}
