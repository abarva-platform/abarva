'use client';

/**
 * MissionListInteractive — client wrapper around `MissionList` that wires the
 * Complete / Dismiss affordances to the `/api/reasoning/missions/state`
 * endpoint and triggers `router.refresh()` so the page re-derives the
 * mission list with the actioned entry filtered out.
 *
 * This component is intentionally thin: business styling and layout live in
 * the underlying `MissionList`. Splitting concerns this way keeps the
 * server-friendly `MissionList` reusable by callers that don't need
 * interactivity (e.g. Tower portfolio queue today).
 */

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MissionList } from '@/components/_shared/MissionList';
import type { DerivedMission } from '@/lib/reasoning/mission-derivation';

export interface MissionListInteractiveProps {
  readonly missions: readonly DerivedMission[];
  readonly title?: string;
  readonly maxRows?: number;
  readonly emptyState?: ReactNode;
  readonly showInstancePrefix?: boolean;
}

async function postMissionState(
  missionId: string,
  status: 'complete' | 'dismissed',
  note?: string,
): Promise<void> {
  const payload: { missionId: string; status: string; note?: string } = {
    missionId,
    status,
  };
  if (typeof note === 'string' && note.length > 0) {
    payload.note = note;
  }
  const res = await fetch('/api/reasoning/missions/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `mission state failed (${res.status})`);
  }
}

export function MissionListInteractive(props: MissionListInteractiveProps) {
  const router = useRouter();
  const [, setBusyId] = useState<string | null>(null);

  function handle(status: 'complete' | 'dismissed') {
    return (id: string, note?: string) => {
      setBusyId(id);
      void postMissionState(id, status, note)
        .then(() => {
          router.refresh();
        })
        .catch(() => {
          // Soft-fail: leave the row in place. A future enhancement could
          // surface a toast; for the demo we keep the surface noise-free.
        })
        .finally(() => {
          setBusyId(null);
        });
    };
  }

  return (
    <MissionList
      missions={props.missions}
      title={props.title}
      maxRows={props.maxRows}
      emptyState={props.emptyState}
      showInstancePrefix={props.showInstancePrefix}
      onComplete={handle('complete')}
      onDismiss={handle('dismissed')}
    />
  );
}

export default MissionListInteractive;
