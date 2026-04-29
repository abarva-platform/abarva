'use client';

/**
 * MissionListInteractive — client wrapper around `MissionList` that wires the
 * Complete / Dismiss affordances to the `/api/reasoning/missions/state`
 * endpoint and triggers `router.refresh()` so the page re-derives the
 * mission list with the actioned entry filtered out.
 *
 * Also owns keyboard-shortcut state for power-user triage:
 *   - `j` / ArrowDown — focus next mission
 *   - `k` / ArrowUp — focus previous mission
 *   - `c` — complete the focused mission
 *   - `d` — dismiss the focused mission
 *   - `Enter` — open the inline note input on the focused row
 *   - `Esc` — close the inline note input
 *
 * The keydown listener is scoped to the wrapper ref (not `document`) to
 * avoid global pollution. Modifier keys (Cmd/Ctrl/Alt/Shift) suppress all
 * shortcuts so browser shortcuts keep working, and shortcuts are skipped
 * when the user is typing into an INPUT/TEXTAREA.
 *
 * This component is intentionally thin: business styling and layout live in
 * the underlying `MissionList`. Splitting concerns this way keeps the
 * server-friendly `MissionList` reusable by callers that don't need
 * interactivity (e.g. Tower portfolio queue today).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { MissionList } from '@/components/_shared/MissionList';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getMissionState } from '@/lib/reasoning/mission-state-store';
import type { DerivedMission } from '@/lib/reasoning/mission-derivation';

export interface MissionListInteractiveProps {
  readonly missions: readonly DerivedMission[];
  readonly title?: string;
  readonly maxRows?: number;
  readonly emptyState?: ReactNode;
  readonly showInstancePrefix?: boolean;
}

type NoteAction = 'complete' | 'dismissed' | null;

const WRAPPER: CSSProperties = {
  outline: 'none',
};

const HINT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.06em',
  color: SHELL.INK_MUTED,
  textTransform: 'uppercase',
  margin: '0 0 6px 2px',
  userSelect: 'none',
};

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
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Active missions = those still pending. Mirrors the filter inside
  // `MissionList` so keyboard navigation lines up with what's rendered.
  const activeMissions = useMemo(
    () => props.missions.filter((m) => getMissionState(m.id) === null),
    [props.missions],
  );
  const activeIds = useMemo(
    () => activeMissions.map((m) => m.id),
    [activeMissions],
  );

  const [focusedMissionId, setFocusedMissionId] = useState<string | null>(
    () => activeIds[0] ?? null,
  );
  const [noteOpenForId, setNoteOpenForId] = useState<string | null>(null);
  const [noteOpenAction, setNoteOpenAction] = useState<NoteAction>(null);

  // Keep focus valid when the mission list mutates (action removes a row).
  useEffect(() => {
    if (activeIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (focusedMissionId !== null) setFocusedMissionId(null);
      return;
    }
    if (focusedMissionId === null || !activeIds.includes(focusedMissionId)) {
      setFocusedMissionId(activeIds[0] ?? null);
    }
  }, [activeIds, focusedMissionId]);

  // If the focused row's note form was open and the row went away, drop the
  // note state alongside it.
  useEffect(() => {
    if (noteOpenForId !== null && !activeIds.includes(noteOpenForId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNoteOpenForId(null);
      setNoteOpenAction(null);
    }
  }, [activeIds, noteOpenForId]);

  const handle = useCallback(
    (status: 'complete' | 'dismissed') =>
      (id: string, note?: string) => {
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
      },
    [router],
  );

  const onComplete = useMemo(() => handle('complete'), [handle]);
  const onDismiss = useMemo(() => handle('dismissed'), [handle]);

  // Keyboard shortcut handler scoped to the wrapper.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    function listener(event: KeyboardEvent) {
      // Modifier suppression — never override browser shortcuts.
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      // Don't intercept while the user is typing into the note input or any
      // other editable surface that lives inside the wrapper.
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        // Allow Escape to bubble through so the wrapper-level handler can
        // close the note input even from within the input itself.
        if (event.key !== 'Escape') {
          return;
        }
      }

      const ids = activeIds;
      if (ids.length === 0) return;
      const currentIdx =
        focusedMissionId !== null ? ids.indexOf(focusedMissionId) : -1;

      switch (event.key) {
        case 'j':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIdx =
            currentIdx < 0 ? 0 : Math.min(currentIdx + 1, ids.length - 1);
          setFocusedMissionId(ids[nextIdx] ?? null);
          return;
        }
        case 'k':
        case 'ArrowUp': {
          event.preventDefault();
          const prevIdx = currentIdx <= 0 ? 0 : currentIdx - 1;
          setFocusedMissionId(ids[prevIdx] ?? null);
          return;
        }
        case 'c': {
          if (focusedMissionId === null) return;
          event.preventDefault();
          // Direct complete (no note). Mirrors mouse "Complete + Save with
          // empty input" path and keeps triage fast.
          onComplete(focusedMissionId);
          return;
        }
        case 'd': {
          if (focusedMissionId === null) return;
          event.preventDefault();
          onDismiss(focusedMissionId);
          return;
        }
        case 'Enter': {
          if (focusedMissionId === null) return;
          if (noteOpenForId === focusedMissionId) return;
          event.preventDefault();
          setNoteOpenForId(focusedMissionId);
          // Default Enter == complete-with-note (the more common triage path);
          // users can still press `d` then Enter to dismiss-with-note via the
          // form.
          setNoteOpenAction('complete');
          return;
        }
        case 'Escape': {
          if (noteOpenForId === null) return;
          event.preventDefault();
          setNoteOpenForId(null);
          setNoteOpenAction(null);
          return;
        }
        default:
          return;
      }
    }

    node.addEventListener('keydown', listener);
    return () => {
      node.removeEventListener('keydown', listener);
    };
  }, [activeIds, focusedMissionId, noteOpenForId, onComplete, onDismiss]);

  // Initial focus — bring the wrapper into focus on mount so the listener
  // starts receiving keystrokes without requiring the user to click first.
  useEffect(() => {
    wrapperRef.current?.focus({ preventScroll: true });
  }, []);

  function handleNoteOpenChange(id: string, action: NoteAction) {
    setNoteOpenForId(action === null ? null : id);
    setNoteOpenAction(action);
    if (action !== null) {
      setFocusedMissionId(id);
    }
  }

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      style={WRAPPER}
      data-testid="mission-list-interactive"
      aria-label="Mission queue with keyboard shortcuts"
    >
      <p style={HINT} data-testid="mission-list-shortcut-hint">
        j/k navigate · c complete · d dismiss · Enter add note · Esc close
      </p>
      <MissionList
        missions={props.missions}
        title={props.title}
        maxRows={props.maxRows}
        emptyState={props.emptyState}
        showInstancePrefix={props.showInstancePrefix}
        onComplete={onComplete}
        onDismiss={onDismiss}
        focusedMissionId={focusedMissionId}
        onFocusMission={setFocusedMissionId}
        noteOpenForId={noteOpenForId}
        noteOpenAction={noteOpenAction}
        onNoteOpenChange={handleNoteOpenChange}
      />
    </div>
  );
}

export default MissionListInteractive;
