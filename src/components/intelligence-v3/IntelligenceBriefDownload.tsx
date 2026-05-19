'use client';

// Intelligence · CXO brief download control.
//
// Gap G9: the Intelligence surface produced nothing downloadable. This
// control sits in the top nav strip and offers DOCX (narrative brief)
// and PDF (CFO one-pager) exports of the active tenant's brief.
//
// The button is present for ALL 3 tenants. For Meridian / First Capital
// the brief is honestly partly-sparse (no seeded corpus) — that is
// correct, not a bug.
//
// Design: reuses the locked AbarVa v3 tokens (ghost button on the
// cream surface, navy ink, Inter body).

import { useState } from 'react';
import { COLORS, FONT, SPACING } from '@/lib/design/abarva-theme';

interface Props {
  /** Active tenant key — forwarded as ?client= so the export targets it. */
  clientKey?: string | null;
}

type Format = 'docx' | 'pdf';

export function IntelligenceBriefDownload({ clientKey = null }: Props) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = async (format: Format) => {
    setBusy(format);
    setError(null);
    try {
      const params = clientKey
        ? `?client=${encodeURIComponent(clientKey)}`
        : '';
      const res = await fetch(
        `/api/v1/intelligence/brief/render-${format}${params}`,
        { headers: { accept: 'application/octet-stream' } },
      );
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `intelligence-brief.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  const buttonStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.navy,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: `${SPACING.xs}px ${SPACING.sm}px`,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.xs,
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.muted,
        }}
      >
        Export brief
      </span>
      <button
        type="button"
        onClick={() => download('docx')}
        disabled={busy !== null}
        style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}
        data-testid="intelligence-brief-download-docx"
      >
        {busy === 'docx' ? 'Preparing…' : 'DOCX'}
      </button>
      <button
        type="button"
        onClick={() => download('pdf')}
        disabled={busy !== null}
        style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}
        data-testid="intelligence-brief-download-pdf"
      >
        {busy === 'pdf' ? 'Preparing…' : 'PDF'}
      </button>
      {error && (
        <span
          role="alert"
          style={{ fontFamily: FONT.body, fontSize: 11, color: COLORS.red }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
