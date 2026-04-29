'use client';

import React, { useState, useCallback } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

export type SynthesisFeedbackSurface = 'source' | 'program' | 'tower';

interface SynthesisFeedbackWidgetProps {
  /**
   * The synthesis event id to attach feedback to. Passed as `eventId` in the
   * POST body to /api/reasoning/feedback. When null/empty the widget renders
   * nothing — there is no telemetry event to attach feedback to yet.
   */
  synthesisId: string;
  /** Which synthesis surface this widget is displayed on (for labelling). */
  surface: SynthesisFeedbackSurface;
}

type Rating = 'up' | 'down';
type State = 'idle' | 'loading' | 'submitted' | 'error';

/**
 * Thumbs-up / thumbs-down feedback widget for synthesis output cards.
 *
 * - POST to /api/reasoning/feedback with { eventId: synthesisId, feedback: rating }
 * - On success: highlights the chosen button and disables both.
 * - On error: shows a subtle inline "Feedback failed" message that clears after 3s.
 * - Loading: both buttons are disabled while the fetch is in-flight.
 * - No external state management — local useState / useCallback only.
 * - Style follows the AbarVa neutral palette via SHELL tokens.
 */
export function SynthesisFeedbackWidget({
  synthesisId,
  surface,
}: SynthesisFeedbackWidgetProps) {
  const [state, setState] = useState<State>('idle');
  const [chosen, setChosen] = useState<Rating | null>(null);

  const submit = useCallback(
    (rating: Rating) => {
      if (state !== 'idle') return;
      setState('loading');
      setChosen(rating);

      fetch('/api/reasoning/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: synthesisId, feedback: rating }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setState('submitted');
        })
        .catch(() => {
          setState('error');
          setChosen(null);
          // Auto-clear error after 3 s so users can retry.
          setTimeout(() => setState('idle'), 3000);
        });
    },
    [state, synthesisId],
  );

  if (state === 'error') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: SHELL.SANS,
          fontSize: 10,
          color: SHELL.RUST_TEXT,
          fontStyle: 'italic',
        }}
      >
        Feedback failed
      </span>
    );
  }

  if (state === 'submitted') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: SHELL.SANS,
          fontSize: 10,
        }}
      >
        <ThumbButton
          direction="up"
          surface={surface}
          active={chosen === 'up'}
          disabled
          onClick={() => {}}
        />
        <ThumbButton
          direction="down"
          surface={surface}
          active={chosen === 'down'}
          disabled
          onClick={() => {}}
        />
      </span>
    );
  }

  const isLoading = state === 'loading';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SHELL.SANS,
        fontSize: 10,
      }}
    >
      <ThumbButton
        direction="up"
        surface={surface}
        active={false}
        disabled={isLoading}
        onClick={() => submit('up')}
      />
      <ThumbButton
        direction="down"
        surface={surface}
        active={false}
        disabled={isLoading}
        onClick={() => submit('down')}
      />
    </span>
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface ThumbButtonProps {
  direction: 'up' | 'down';
  surface: SynthesisFeedbackSurface;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}

function ThumbButton({ direction, surface, active, disabled, onClick }: ThumbButtonProps) {
  const label =
    direction === 'up'
      ? `Mark ${surface} synthesis as useful`
      : `Mark ${surface} synthesis as not useful`;

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        background: 'none',
        padding: '2px 4px',
        borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 13,
        lineHeight: 1,
        opacity: disabled && !active ? 0.35 : active ? 1 : 0.55,
        transition: 'opacity 0.15s ease',
        // On active (submitted state), add a subtle background highlight.
        ...(active
          ? {
              background: SHELL.MINT_BG,
              opacity: 1,
            }
          : {}),
      }}
      // Hover handled via inline style; no Tailwind to keep this component self-contained.
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) e.currentTarget.style.opacity = '0.55';
      }}
    >
      {direction === 'up' ? '👍' : '👎'}
    </button>
  );
}
