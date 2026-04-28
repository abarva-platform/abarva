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

export function MissionList({
  missions,
  title,
  maxRows = 5,
  emptyState,
}: MissionListProps) {
  const safeMax = Math.max(0, Math.trunc(maxRows));
  const visible = missions.slice(0, safeMax);
  const hiddenCount = Math.max(0, missions.length - visible.length);

  return (
    <section style={SECTION} data-testid="mission-list">
      {title && <h3 style={TITLE}>{title}</h3>}
      {visible.length === 0 ? (
        <div style={EMPTY_STATE} data-testid="mission-list-empty">
          {emptyState ?? 'All gates satisfied · no missions pending'}
        </div>
      ) : (
        <ul style={LIST}>
          {visible.map((mission) => (
            <li
              key={mission.id}
              style={ROW}
              data-testid="mission-list-row"
              data-priority={mission.priority}
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
              <span style={STAGE_BADGE} title={`Stage · ${mission.stageId}`}>
                {mission.stageId}
              </span>
            </li>
          ))}
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
