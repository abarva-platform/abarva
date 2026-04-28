'use client';

import { useState } from 'react';

interface SynthesisFeedbackControlProps {
  /**
   * Telemetry event id returned by the synthesis route in the
   * `X-Synthesis-Event-Id` response header. When `null` the control
   * renders nothing — there is nothing to attach feedback to.
   */
  eventId: string | null;
}

/**
 * Subtle thumbs-up / thumbs-down pair rendered next to a synthesis quote.
 * On click the button group is replaced with a muted "Thanks for the
 * feedback" line (optimistic — we do not surface POST errors to the user).
 *
 * Colors stay inside the AbarVa neutral palette: gray-400 default,
 * gray-700 on hover, no accent colors.
 */
export function SynthesisFeedbackControl({ eventId }: SynthesisFeedbackControlProps) {
  const [submitted, setSubmitted] = useState(false);

  if (!eventId) return null;

  if (submitted) {
    return (
      <span className="ml-2 text-[11px] text-gray-400 italic">
        Thanks for the feedback
      </span>
    );
  }

  const submit = (feedback: 'up' | 'down') => {
    setSubmitted(true);
    // Fire and forget — UI is already optimistic.
    fetch('/api/reasoning/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, feedback }),
    }).catch(() => {
      // Swallow errors silently; demo telemetry is non-critical.
    });
  };

  return (
    <span className="ml-2 inline-flex items-center gap-1 align-middle">
      <button
        type="button"
        aria-label="Mark synthesis as useful"
        onClick={() => submit('up')}
        className="text-gray-400 hover:text-gray-700 transition-colors text-xs leading-none"
      >
        &#x1F44D;
      </button>
      <button
        type="button"
        aria-label="Mark synthesis as not useful"
        onClick={() => submit('down')}
        className="text-gray-400 hover:text-gray-700 transition-colors text-xs leading-none"
      >
        &#x1F44E;
      </button>
    </span>
  );
}
