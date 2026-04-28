'use client';

/**
 * MissionListClientControls — small affordance group rendered inline on a
 * mission row to let a user mark the mission complete or dismiss it.
 *
 * Lives in its own file so that `MissionList` can stay server-friendly: the
 * controls are only rendered when the parent passes `onComplete` /
 * `onDismiss`, and even then only this sub-component is forced into the
 * client bundle.
 *
 * Style: AbarVa palette only — ghost buttons in muted ink, no fills.
 */

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

const GROUP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const BUTTON: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  color: SHELL.INK_SOFT,
  background: 'transparent',
  border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  borderRadius: 6,
  padding: '2px 8px',
  cursor: 'pointer',
  lineHeight: 1.2,
};

const BUTTON_BUSY: CSSProperties = {
  ...BUTTON,
  opacity: 0.6,
  cursor: 'progress',
};

export interface MissionListClientControlsProps {
  readonly missionId: string;
  readonly onComplete?: (id: string) => void;
  readonly onDismiss?: (id: string) => void;
  readonly busy?: boolean;
}

export function MissionListClientControls({
  missionId,
  onComplete,
  onDismiss,
  busy = false,
}: MissionListClientControlsProps) {
  if (!onComplete && !onDismiss) return null;
  const style = busy ? BUTTON_BUSY : BUTTON;
  return (
    <span style={GROUP} data-testid="mission-list-controls">
      {onComplete && (
        <button
          type="button"
          style={style}
          disabled={busy}
          onClick={() => onComplete(missionId)}
          aria-label={`Mark mission ${missionId} complete`}
        >
          Complete
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          style={style}
          disabled={busy}
          onClick={() => onDismiss(missionId)}
          aria-label={`Dismiss mission ${missionId}`}
        >
          Dismiss
        </button>
      )}
    </span>
  );
}

export default MissionListClientControls;
