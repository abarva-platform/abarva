'use client';

// GammaExportAction — "Generate polished version via Gamma" action for the
// Board artifacts panel.
//
// Surfaces a small action that POSTs the artifact's `gammaHref`, then renders
// the resulting Gamma-hosted URL (open in a new tab) and the signed `.pptx`
// download in-place. Minimal by design — this is an action, not a panel
// redesign. Only shown when the artifact carries a `gammaHref`, which the
// registry adds ONLY to synthetic REFERENCE artifacts.
//
// The component never sees `GAMMA_API_KEY`. It calls the server route, which
// is the only place that talks to Gamma.

import { useState } from 'react';

interface Props {
  /** The server route to POST to — the artifact's `gammaHref`. */
  endpoint: string;
  /** Short label used in the status copy. */
  artifactLabel: string;
}

interface GammaResponse {
  gammaUrl: string;
  exportUrl: string;
  generationId: string;
  gammaId: string;
  credits: number | null;
  rateLimit?: {
    burstRemaining: string | null;
    remaining: string | null;
    dailyRemaining: string | null;
  };
  deck?: string;
}

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: disabled ? '#F1F0EC' : '#FFFFFF',
    border: '1px solid #1B2B5C',
    color: disabled ? '#9AA3B2' : '#1B2B5C',
    cursor: disabled ? 'wait' : 'pointer',
    whiteSpace: 'nowrap',
  };
}

function linkStyle(variant: 'primary' | 'ghost'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
  return variant === 'primary'
    ? {
        ...base,
        backgroundColor: '#1B2B5C',
        border: '1px solid #1B2B5C',
        color: '#FFFFFF',
      }
    : {
        ...base,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e5e5',
        color: '#1A1A18',
      };
}

export function GammaExportAction({ endpoint, artifactLabel }: Props) {
  const [status, setStatus] = useState<
    'idle' | 'pending' | 'ready' | 'error'
  >('idle');
  const [result, setResult] = useState<GammaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setStatus('pending');
    setError(null);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const body = (await res.json().catch(() => ({}))) as
        | GammaResponse
        | { error?: string; detail?: string };
      if (!res.ok) {
        const detail =
          (body as { detail?: string }).detail ||
          (body as { error?: string }).error ||
          `Gamma export failed (HTTP ${res.status}).`;
        setError(detail);
        setStatus('error');
        return;
      }
      setResult(body as GammaResponse);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  if (status === 'ready' && result) {
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <a
          href={result.gammaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle('primary')}
        >
          Open in Gamma ↗
        </a>
        <a href={result.exportUrl} style={linkStyle('ghost')}>
          ↓ Gamma PPTX
        </a>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        style={{
          display: 'inline-flex',
          gap: 6,
          alignItems: 'center',
          fontSize: 10,
          color: '#8a1c1c',
        }}
        title={error ?? undefined}
      >
        <button
          type="button"
          onClick={onClick}
          style={buttonStyle(false)}
          aria-label={`Retry Gamma export for ${artifactLabel}`}
        >
          Retry Gamma
        </button>
        <span>Gamma export failed</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'pending'}
      style={buttonStyle(status === 'pending')}
      aria-label={`Generate polished version of ${artifactLabel} via Gamma`}
    >
      {status === 'pending' ? 'Generating…' : 'Polish via Gamma'}
    </button>
  );
}
