'use client';

// DemoResetButton — clears all in-memory reasoning state for clean demos.
// Fires POST /api/reasoning/demo-reset and surfaces status inline.

import { useState } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

type Status = 'idle' | 'pending' | 'success' | 'error';

export function DemoResetButton() {
  const [status, setStatus] = useState<Status>('idle');

  async function handleReset() {
    const confirmed = window.confirm(
      'Reset all reasoning demo state? This clears waivers, resolutions and feedback.',
    );
    if (!confirmed) return;

    setStatus('pending');
    try {
      const res = await fetch('/api/reasoning/demo-reset', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  const isPending = status === 'pending';

  const borderColor =
    status === 'success'
      ? COLORS.mintInk
      : status === 'error'
        ? COLORS.coralInk
        : COLORS.coralInk;

  const textColor =
    status === 'success'
      ? COLORS.mintInk
      : status === 'error'
        ? COLORS.coralInk
        : COLORS.coralInk;

  const label =
    status === 'pending'
      ? '↺ Resetting…'
      : status === 'success'
        ? 'Demo state cleared ✓'
        : status === 'error'
          ? 'Reset failed'
          : '↺ Reset demo state';

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleReset}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.xs,
        background: COLORS.white,
        border: `1px solid ${borderColor}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.sm} ${SPACING.md}`,
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: textColor,
        fontWeight: 600,
        opacity: isPending ? 0.7 : 1,
        transition: 'opacity 0.15s, color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
