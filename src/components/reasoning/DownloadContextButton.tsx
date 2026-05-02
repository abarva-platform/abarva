'use client';

/**
 * DownloadContextButton
 *
 * Small pill button that fetches the full SynthesisContext for an instance
 * via GET /api/reasoning/synthesis/export/:instanceId and triggers a
 * browser download of the resulting JSON blob.
 *
 * Designed as a client island — no external deps, no external state.
 * Style mirrors the micro-button used in EvidenceTagChips and CopySummaryButton.
 */

import { useState, useCallback } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

interface DownloadContextButtonProps {
  instanceId: string;
  surface: 'source' | 'program' | 'tower';
}

type DownloadState = 'idle' | 'loading' | 'error';

export function DownloadContextButton({ instanceId }: DownloadContextButtonProps) {
  const [state, setState] = useState<DownloadState>('idle');

  const handleDownload = useCallback(async () => {
    if (state !== 'idle') return;
    setState('loading');

    try {
      const res = await fetch(
        `/api/reasoning/synthesis/export/${encodeURIComponent(instanceId)}`,
      );
      if (!res.ok) {
        setState('error');
        window.setTimeout(() => setState('idle'), 3000);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthesis-context-${instanceId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState('idle');
    } catch {
      setState('error');
      window.setTimeout(() => setState('idle'), 3000);
    }
  }, [instanceId, state]);

  const label =
    state === 'loading' ? '...' : state === 'error' ? 'Export failed' : '↓ Export JSON';

  const borderColor =
    state === 'error'
      ? SHELL.RUST_TEXT
      : state === 'loading'
        ? SHELL.GRAY_LINE
        : SHELL.CARD_LINE;

  const textColor =
    state === 'error'
      ? SHELL.RUST_TEXT
      : state === 'loading'
        ? SHELL.INK_MUTED
        : SHELL.INK_SOFT;

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={state !== 'idle'}
      title="Download synthesis context"
      aria-label="Download synthesis context JSON"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        fontFamily: SHELL.SANS,
        fontSize: 10,
        fontWeight: 500,
        color: textColor,
        background: 'transparent',
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        cursor: state === 'idle' ? 'pointer' : 'default',
        lineHeight: 1.4,
        transition: 'color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
