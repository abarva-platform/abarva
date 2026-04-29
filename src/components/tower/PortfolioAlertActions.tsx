'use client';

/**
 * PortfolioAlertActions — small client-side wrapper around the per-row
 * "Acknowledge" and "Dismiss" controls. Posts to
 * `/api/reasoning/alerts/state` and triggers a router refresh so the parent
 * server component re-runs `buildPortfolioAlerts()` (which filters out
 * dismissed alerts and surfaces the new acknowledgment timestamp).
 *
 * Pure presentational beyond the click handler — AbarVa palette only.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface PortfolioAlertActionsProps {
  readonly alertId: string;
  readonly acknowledged: boolean;
}

const BUTTON_BASE: React.CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '3px 9px',
  borderRadius: 999,
  cursor: 'pointer',
  background: SHELL.CARD_WHITE,
  color: SHELL.INK_SOFT,
  border: `1px solid ${SHELL.CARD_LINE}`,
};

const BUTTON_DISABLED: React.CSSProperties = {
  ...BUTTON_BASE,
  cursor: 'not-allowed',
  opacity: 0.5,
};

export function PortfolioAlertActions({
  alertId,
  acknowledged,
}: PortfolioAlertActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const submit = useCallback(
    async (status: 'acknowledged' | 'dismissed') => {
      if (pending) return;
      setPending(true);
      try {
        await fetch('/api/reasoning/alerts/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId, status }),
        });
        router.refresh();
      } catch {
        // Best-effort: persistence is fire-and-forget. On failure the user
        // simply doesn't see the row update; reload still works.
      } finally {
        setPending(false);
      }
    },
    [alertId, pending, router],
  );

  return (
    <div
      style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
      data-testid={`portfolio-alert-actions-${alertId}`}
    >
      <button
        type="button"
        onClick={() => void submit('acknowledged')}
        disabled={pending || acknowledged}
        style={pending || acknowledged ? BUTTON_DISABLED : BUTTON_BASE}
        data-testid="portfolio-alert-acknowledge"
      >
        {acknowledged ? "Ack'd" : 'Acknowledge'}
      </button>
      <button
        type="button"
        onClick={() => void submit('dismissed')}
        disabled={pending}
        style={pending ? BUTTON_DISABLED : BUTTON_BASE}
        data-testid="portfolio-alert-dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}

export default PortfolioAlertActions;
