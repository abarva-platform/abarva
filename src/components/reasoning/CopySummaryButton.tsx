'use client';

/**
 * CopySummaryButton — REASON-30
 *
 * Ghost-style clipboard button for provenance ribbons. Copies a summary string
 * to the clipboard and shows "Copied!" confirmation for 2 s.
 *
 * Designed to be dropped into any server-rendered ribbon as a client island.
 * No external state, no new packages — useState + useCallback only.
 */

import { useState, useCallback } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

interface CopySummaryButtonProps {
  /** The text to write to the clipboard. */
  text: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

export function CopySummaryButton({ text }: CopySummaryButtonProps) {
  const [state, setState] = useState<CopyState>('idle');

  const handleCopy = useCallback(() => {
    if (state !== 'idle') return;

    if (!navigator.clipboard) {
      setState('failed');
      const t = window.setTimeout(() => setState('idle'), 2000);
      return () => window.clearTimeout(t);
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setState('copied');
        window.setTimeout(() => setState('idle'), 2000);
      })
      .catch(() => {
        setState('failed');
        window.setTimeout(() => setState('idle'), 2000);
      });
  }, [state, text]);

  const label =
    state === 'copied' ? 'Copied!' : state === 'failed' ? '⚠ Copy failed' : '📋 Copy';

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy synthesis summary to clipboard"
      aria-label="Copy synthesis summary to clipboard"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 500,
        color: state === 'copied' ? SHELL.MINT_TEXT : state === 'failed' ? SHELL.RUST_TEXT : SHELL.INK_SOFT,
        background: 'transparent',
        border: `1px solid ${state === 'idle' ? SHELL.CARD_LINE : 'transparent'}`,
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
