/**
 * RecentMissionStates — compact "recently completed" subsection that pairs
 * with `MissionList` on Source / Programs detail pages.
 *
 * Reads the per-instance recent states from
 * `getRecentMissionStates(instanceId, limit)` and renders the last few
 * actioned missions so a user has a sense of progress after completing or
 * dismissing items from the active queue.
 *
 * Pure server-friendly presentation — no IO, no Date.now(), no randomness.
 * AbarVa palette only.
 */

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getRecentMissionStates } from '@/lib/reasoning/mission-state-store';

export interface RecentMissionStatesProps {
  readonly instanceId: string;
  readonly limit?: number;
  /**
   * Optional title rendered above the list. Defaults to "Recently completed".
   */
  readonly title?: string;
}

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 6,
  border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  borderRadius: 12,
  background: SHELL.PAPER_SOFT,
  padding: 12,
};

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

const LIST: CSSProperties = {
  display: 'grid',
  gap: 4,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'baseline',
  gap: 8,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_SOFT,
  lineHeight: 1.4,
};

const NOTE: CSSProperties = {
  gridColumn: '1 / -1',
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 11,
  fontStyle: 'italic',
  color: SHELL.INK_MUTED,
  lineHeight: 1.4,
};

const ID_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_SOFT,
  textDecoration: 'line-through',
};

const STATUS_BADGE_BASE: CSSProperties = {
  display: 'inline-block',
  padding: '2px 7px',
  borderRadius: 999,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const STATUS_COMPLETE: CSSProperties = {
  ...STATUS_BADGE_BASE,
  background: SHELL.MINT_BG,
  color: SHELL.MINT_TEXT,
};

const STATUS_DISMISSED: CSSProperties = {
  ...STATUS_BADGE_BASE,
  background: SHELL.GRAY_BG,
  color: SHELL.GRAY_TEXT,
};

function shortIdSuffix(missionId: string, instanceId: string): string {
  const prefix = `${instanceId}:`;
  if (missionId.startsWith(prefix)) {
    return missionId.slice(prefix.length);
  }
  return missionId;
}

export function RecentMissionStates({
  instanceId,
  limit = 3,
  title = 'Recently completed',
}: RecentMissionStatesProps) {
  const recent = getRecentMissionStates(instanceId, limit);
  if (recent.length === 0) return null;
  return (
    <section style={SECTION} data-testid="recent-mission-states">
      <h4 style={TITLE}>{title}</h4>
      <ul style={LIST}>
        {recent.map((entry) => (
          <li key={entry.id} style={ROW} data-testid="recent-mission-row">
            <span style={ID_LABEL}>{shortIdSuffix(entry.id, instanceId)}</span>
            <span
              style={
                entry.status === 'complete' ? STATUS_COMPLETE : STATUS_DISMISSED
              }
            >
              {entry.status}
            </span>
            {entry.note && (
              <p style={NOTE} data-testid="recent-mission-note">
                {entry.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecentMissionStates;
