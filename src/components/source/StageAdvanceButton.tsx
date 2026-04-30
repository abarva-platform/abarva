'use client';

// StageAdvanceButton — demo affordance to advance a source event through its
// procurement stage sequence in one click. PATCHes the in-memory stage store
// via /api/v1/source/:eventId/stage, then calls router.refresh() so the
// server re-renders the detail page with the new stage.
//
// Style: AbarVa palette only — ghost button, ink text, DM Sans.

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { SOURCE_STAGE_ORDER, SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { SHELL } from '@/lib/shell/shell-tokens';

interface StageAdvanceButtonProps {
  eventId: string;
  currentStageKey: SourceStageKey;
  blockingGateCount?: number;
  blockingGateLabel?: string;
}

const WRAP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const BASE_BTN: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: SHELL.SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.01em',
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid ' + SHELL.INK,
  background: 'transparent',
  color: SHELL.INK,
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
  whiteSpace: 'nowrap',
};

const DISABLED_BTN: CSSProperties = {
  ...BASE_BTN,
  cursor: 'default',
  opacity: 0.45,
  borderColor: SHELL.INK_MUTED,
  color: SHELL.INK_MUTED,
};

const LOADING_BTN: CSSProperties = {
  ...BASE_BTN,
  cursor: 'default',
  opacity: 0.6,
};

const STAGE_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: SHELL.INK_MUTED,
  marginRight: 2,
};

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        border: '1.5px solid ' + SHELL.INK_MUTED,
        borderTopColor: SHELL.INK,
        borderRadius: '50%',
        animation: 'spin 0.65s linear infinite',
      }}
      aria-hidden
    />
  );
}

export function StageAdvanceButton({
  eventId,
  currentStageKey,
  blockingGateCount = 0,
  blockingGateLabel,
}: StageAdvanceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = SOURCE_STAGE_ORDER.indexOf(currentStageKey);
  const isFinal = currentIndex === SOURCE_STAGE_ORDER.length - 1 || currentIndex === -1;
  const nextStageKey = isFinal ? null : SOURCE_STAGE_ORDER[currentIndex + 1];
  const nextStageLabel = nextStageKey ? SOURCE_STAGE_LABELS[nextStageKey] : null;

  async function handleAdvance() {
    if (!nextStageKey || loading) return;
    setError(null);
    if (blockingGateCount > 0) {
      setError(
        `Cannot advance — ${blockingGateCount} hard gate${blockingGateCount === 1 ? '' : 's'} unmet for ${blockingGateLabel ?? nextStageLabel}. Review gate criteria below.`,
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/source/${encodeURIComponent(eventId)}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageKey: nextStageKey }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        setError(body.detail ?? 'Failed to advance stage');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error — could not advance stage');
    } finally {
      setLoading(false);
    }
  }

  if (isFinal) {
    return (
      <div style={WRAP}>
        <button type="button" style={DISABLED_BTN} disabled aria-disabled>
          <span>&#10003; Final stage</span>
        </button>
      </div>
    );
  }

  return (
    <div style={WRAP}>
      {/* keyframe injected once via a hidden style element */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={STAGE_LABEL}>
        {SOURCE_STAGE_LABELS[currentStageKey]}
      </span>
      <button
        type="button"
        style={loading ? LOADING_BTN : BASE_BTN}
        disabled={loading}
        onClick={() => { void handleAdvance(); }}
      >
        {loading && <Spinner />}
        <span>
          {loading ? 'Advancing…' : `Advance stage → ${nextStageLabel}`}
        </span>
      </button>
      {error && (
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 10,
            color: '#c0392b',
            marginLeft: 4,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
