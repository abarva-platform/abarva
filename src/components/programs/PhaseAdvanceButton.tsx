'use client';

// PhaseAdvanceButton — demo affordance to advance a program through its
// phase sequence in one click. PATCHes the in-memory phase store via
// /api/v1/programs/:programId/phase, then calls router.refresh() so the
// server re-renders the detail page with the new phase.
//
// Style: AbarVa palette only — ghost button, ink text, DM Sans.

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import type { ProgramPhaseId } from '@/lib/programs/programs-types';
import { SHELL } from '@/lib/shell/shell-tokens';

interface PhaseAdvanceButtonProps {
  programId: string;
  currentPhase: ProgramPhaseId;
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

const PHASE_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: SHELL.INK_MUTED,
  marginRight: 2,
};

const MAX_PHASE = 6 as const;

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

export function PhaseAdvanceButton({ programId, currentPhase }: PhaseAdvanceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFinal = currentPhase >= MAX_PHASE;
  const nextPhase = isFinal ? null : ((currentPhase + 1) as ProgramPhaseId);
  const currentLabel = PHASE_LABEL_MAP[currentPhase] ?? `Phase ${currentPhase}`;
  const nextLabel = nextPhase !== null ? (PHASE_LABEL_MAP[nextPhase] ?? `Phase ${nextPhase}`) : null;

  async function handleAdvance() {
    if (nextPhase === null || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/programs/${encodeURIComponent(programId)}/phase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: nextPhase }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        setError(body.detail ?? 'Failed to advance phase');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error — could not advance phase');
    } finally {
      setLoading(false);
    }
  }

  if (isFinal) {
    return (
      <div style={WRAP}>
        <button type="button" style={DISABLED_BTN} disabled aria-disabled>
          <span>&#10003; Final phase</span>
        </button>
      </div>
    );
  }

  return (
    <div style={WRAP}>
      {/* keyframe injected once via a hidden style element */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={PHASE_LABEL}>
        P{currentPhase}: {currentLabel}
      </span>
      <button
        type="button"
        style={loading ? LOADING_BTN : BASE_BTN}
        disabled={loading}
        onClick={() => { void handleAdvance(); }}
      >
        {loading && <Spinner />}
        <span>
          {loading
            ? 'Advancing…'
            : `Advance to P${nextPhase}: ${nextLabel} →`}
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
