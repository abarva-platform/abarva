/**
 * MissionList — task-oriented list of derived missions.
 *
 * Renders the verb-first label of each pending / partial gate criterion as
 * an actionable next-step item. This is the TASK view; the gate criteria
 * panel remains the STATUS view (criterion + status). Together they answer
 * "what's left?" and "where do I stand?" without duplicating each other.
 *
 * Pure presentation — no IO, no Date.now(), no randomness. Server-friendly:
 * the component does not use any client-only APIs.
 *
 * AbarVa palette only — colors come from `SHELL` shell tokens.
 */

import type { CSSProperties, ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  DerivedMission,
  DerivedMissionPriority,
} from '@/lib/reasoning/mission-derivation';
import { getMissionState } from '@/lib/reasoning/mission-state-store';
import { MissionListClientControls } from '@/components/_shared/MissionListClientControls';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MissionListProps {
  /** Missions to render. Already sorted by `deriveMissionsFromInstance`. */
  readonly missions: readonly DerivedMission[];
  /** Optional title shown above the list (Georgia serif). */
  readonly title?: string;
  /** Maximum number of mission rows to show. Defaults to 5. */
  readonly maxRows?: number;
  /** Custom empty-state node. When omitted, a default message is rendered. */
  readonly emptyState?: ReactNode;
  /**
   * When true, the stage badge is prefixed with the originating instance's
   * `displayId` (e.g. `APX-CDP P3` instead of just `P3`). Useful on
   * portfolio surfaces (Tower) where missions span multiple instances.
   * Defaults to `false`; detail-page consumers see only the stage id.
   */
  readonly showInstancePrefix?: boolean;
  /**
   * Optional handler invoked when a user clicks the "Complete" affordance on
   * a row. When provided (alongside / or instead of `onDismiss`), the row
   * renders a small ghost-button group; when omitted, no controls render
   * (preserving the read-only behaviour of existing consumers).
   */
  readonly onComplete?: (id: string, note?: string) => void;
  /**
   * Optional handler invoked when a user clicks the "Dismiss" affordance on
   * a row. See `onComplete` for rendering semantics.
   */
  readonly onDismiss?: (id: string, note?: string) => void;
  /**
   * Optional id of the mission that should display the keyboard-focused
   * affordance (subtle left ink border). Set by `MissionListInteractive`
   * when keyboard navigation is active. Server callers leave undefined.
   */
  readonly focusedMissionId?: string | null;
  /**
   * Optional handler invoked when the user clicks anywhere on a mission
   * row, used by the keyboard-shortcut wrapper to keep focus aligned with
   * mouse interaction.
   */
  readonly onFocusMission?: (id: string) => void;
  /**
   * Optional id of the mission whose note input should be open. When set,
   * the corresponding row's controls render the inline note form. Used by
   * the keyboard-shortcut wrapper to drive Enter / Esc transitions.
   */
  readonly noteOpenForId?: string | null;
  /**
   * Action paired with `noteOpenForId` — controls whether the note form
   * submits a complete or a dismissed action.
   */
  readonly noteOpenAction?: 'complete' | 'dismissed' | null;
  /**
   * Handler invoked when the inline note form opens or closes for a
   * specific row, used by the keyboard-shortcut wrapper to track state.
   */
  readonly onNoteOpenChange?: (
    id: string,
    action: 'complete' | 'dismissed' | null,
  ) => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: 14,
};

const TITLE: CSSProperties = {
  margin: 0,
  color: SHELL.INK,
  fontFamily: SHELL.SERIF,
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: '-0.01em',
};

const LIST: CSSProperties = {
  display: 'grid',
  gap: 6,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'baseline',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 8,
  background: SHELL.PAPER_SOFT,
  border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
};

const ROW_WITH_CONTROLS: CSSProperties = {
  ...ROW,
  gridTemplateColumns: 'auto 1fr auto auto',
};

const ROW_FOCUSED_OVERLAY: CSSProperties = {
  // 2px ink-tinted left border replaces the soft 1px accent so keyboard
  // users always see what's selected; row footprint is unchanged because
  // the border-left swap stays within the existing 1px line.
  borderLeft: `2px solid ${SHELL.INK}`,
  paddingLeft: 9,
};

const CONTROLS_CELL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
};

const DOT_BASE: CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: 999,
  // align baseline with the label text
  transform: 'translateY(1px)',
};

const LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK,
  lineHeight: 1.4,
};

const DESCRIPTION: CSSProperties = {
  display: 'block',
  marginTop: 2,
  fontFamily: SHELL.SANS,
  fontSize: 11,
  color: SHELL.INK_MUTED,
  lineHeight: 1.4,
};

const STAGE_BADGE: CSSProperties = {
  display: 'inline-block',
  padding: '2px 7px',
  borderRadius: 999,
  background: SHELL.GRAY_BG,
  color: SHELL.GRAY_TEXT,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const FOOTER_NOTE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.08em',
  color: SHELL.INK_MUTED,
  textTransform: 'uppercase',
};

const EMPTY_STATE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
  fontStyle: 'italic',
  padding: '6px 2px',
};

// ─── Priority dot ─────────────────────────────────────────────────────────────

function dotColor(priority: DerivedMissionPriority): string {
  // AbarVa palette: peach/rust for hard-high, amber for medium, gray for low.
  switch (priority) {
    case 'high':
      return SHELL.PEACH_TEXT;
    case 'medium':
      return SHELL.PEACH_LINE;
    case 'low':
    default:
      return SHELL.GRAY_TEXT;
  }
}

function priorityAriaLabel(priority: DerivedMissionPriority): string {
  switch (priority) {
    case 'high':
      return 'High priority';
    case 'medium':
      return 'Medium priority';
    case 'low':
    default:
      return 'Low priority';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Compress an instance displayId for use as a stage-badge prefix.
 *
 * The instance displayIds we render in the queue follow the pattern
 * `<PROGRAM-PREFIX>-<NUMBER>` (e.g. `APX-CDP-2026`, `SRC-AMS-2026`). For a
 * compact badge like `APX-CDP P3` we want only the leading two segments —
 * the date suffix is noise in the executive scan.
 */
function shortInstanceTag(displayId: string): string {
  const parts = displayId.split('-');
  if (parts.length <= 2) return displayId;
  return parts.slice(0, 2).join('-');
}

export function MissionList({
  missions,
  title,
  maxRows = 5,
  emptyState,
  showInstancePrefix = false,
  onComplete,
  onDismiss,
  focusedMissionId,
  onFocusMission,
  noteOpenForId,
  noteOpenAction,
  onNoteOpenChange,
}: MissionListProps) {
  const safeMax = Math.max(0, Math.trunc(maxRows));
  // Filter out missions that have already been actioned (complete/dismissed).
  // Reads from the in-memory mission-state store; on the server this is the
  // process-local snapshot, on the client this is hydrated to the same value
  // because the store is module-scoped.
  const active = missions.filter((m) => getMissionState(m.id) === null);
  const visible = active.slice(0, safeMax);
  const hiddenCount = Math.max(0, active.length - visible.length);
  const showControls = Boolean(onComplete || onDismiss);
  const rowStyle = showControls ? ROW_WITH_CONTROLS : ROW;

  return (
    <section style={SECTION} data-testid="mission-list">
      {title && <h3 style={TITLE}>{title}</h3>}
      {visible.length === 0 ? (
        <div style={EMPTY_STATE} data-testid="mission-list-empty">
          {emptyState ?? 'All gates satisfied · no missions pending'}
        </div>
      ) : (
        <ul style={LIST}>
          {visible.map((mission) => {
            const isFocused = mission.id === focusedMissionId;
            const liStyle = isFocused
              ? { ...rowStyle, ...ROW_FOCUSED_OVERLAY }
              : rowStyle;
            return (
              <li
                key={mission.id}
                style={liStyle}
                data-testid="mission-list-row"
                data-priority={mission.priority}
                data-focused={isFocused ? 'true' : undefined}
                data-mission-id={mission.id}
                onMouseDown={
                  onFocusMission ? () => onFocusMission(mission.id) : undefined
                }
              >
                <span
                  aria-label={priorityAriaLabel(mission.priority)}
                  style={{
                    ...DOT_BASE,
                    background: dotColor(mission.priority),
                  }}
                />
                <span style={LABEL}>
                  {mission.label}
                  {mission.description && mission.description !== mission.label && (
                    <span style={DESCRIPTION} title={mission.evaluationHint || undefined}>
                      {mission.description}
                    </span>
                  )}
                </span>
                <span
                  style={STAGE_BADGE}
                  title={
                    showInstancePrefix
                      ? `${mission.instanceDisplayId} · ${mission.stageId}`
                      : `Stage · ${mission.stageId}`
                  }
                >
                  {showInstancePrefix
                    ? `${shortInstanceTag(mission.instanceDisplayId)} ${mission.stageId}`
                    : mission.stageId}
                </span>
                {showControls && (
                  <span style={CONTROLS_CELL}>
                    <MissionListClientControls
                      missionId={mission.id}
                      onComplete={onComplete}
                      onDismiss={onDismiss}
                      controlledPending={
                        noteOpenForId === mission.id
                          ? (noteOpenAction ?? null)
                          : null
                      }
                      onPendingChange={
                        onNoteOpenChange
                          ? (action) => onNoteOpenChange(mission.id, action)
                          : undefined
                      }
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {hiddenCount > 0 && (
        <div style={FOOTER_NOTE} data-testid="mission-list-overflow">
          +{hiddenCount} more pending
        </div>
      )}
    </section>
  );
}

export default MissionList;
