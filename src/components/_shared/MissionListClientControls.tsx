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
 * UX: a click on Complete or Dismiss reveals a small inline text input
 * prompting the user to add an optional note describing *why* the mission
 * is being closed. Submit posts the note alongside the action; Cancel
 * reverts the inline form without submitting. The note is optional —
 * submitting an empty input fires the action with no note attached.
 *
 * Style: AbarVa palette only — ghost buttons in muted ink, no fills.
 */

import { useState, type CSSProperties, type FormEvent } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

type PendingAction = 'complete' | 'dismissed' | null;

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

const FORM: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const INPUT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  color: SHELL.INK_SOFT,
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  borderRadius: 6,
  padding: '2px 8px',
  lineHeight: 1.2,
  minWidth: 180,
  outline: 'none',
};

export interface MissionListClientControlsProps {
  readonly missionId: string;
  readonly onComplete?: (id: string, note?: string) => void;
  readonly onDismiss?: (id: string, note?: string) => void;
  readonly busy?: boolean;
}

export function MissionListClientControls({
  missionId,
  onComplete,
  onDismiss,
  busy = false,
}: MissionListClientControlsProps) {
  const [pending, setPending] = useState<PendingAction>(null);
  const [note, setNote] = useState<string>('');

  if (!onComplete && !onDismiss) return null;
  const style = busy ? BUTTON_BUSY : BUTTON;

  function reset() {
    setPending(null);
    setNote('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const trimmed = note.trim();
    const arg = trimmed.length > 0 ? trimmed : undefined;
    if (pending === 'complete' && onComplete) {
      onComplete(missionId, arg);
    } else if (pending === 'dismissed' && onDismiss) {
      onDismiss(missionId, arg);
    }
    reset();
  }

  if (pending !== null) {
    const submitLabel = pending === 'complete' ? 'Save' : 'Save';
    return (
      <form
        style={FORM}
        data-testid="mission-list-controls-form"
        data-pending-action={pending}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          style={INPUT}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note (optional)"
          aria-label={`Add a note for mission ${missionId}`}
          autoFocus
          disabled={busy}
          maxLength={280}
        />
        <button
          type="submit"
          style={style}
          disabled={busy}
          aria-label={`Submit ${pending} for mission ${missionId}`}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          style={style}
          disabled={busy}
          onClick={reset}
          aria-label={`Cancel ${pending} for mission ${missionId}`}
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <span style={GROUP} data-testid="mission-list-controls">
      {onComplete && (
        <button
          type="button"
          style={style}
          disabled={busy}
          onClick={() => setPending('complete')}
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
          onClick={() => setPending('dismissed')}
          aria-label={`Dismiss mission ${missionId}`}
        >
          Dismiss
        </button>
      )}
    </span>
  );
}

export default MissionListClientControls;
