/**
 * PortfolioRecentMissionStates — multi-instance "Recently completed"
 * subsection that aggregates recent mission completions / dismissals
 * across an arbitrary list of instance ids.
 *
 * Companion to `RecentMissionStates` (single-instance). Used on portfolio
 * surfaces such as the Steward Setup admin queue, where the active
 * mission list spans every program + source-event instance and a
 * single-instance recent panel would miss most user actions.
 *
 * Pure server-friendly presentation — no IO, no Date.now(), no
 * randomness. Reads the in-memory `mission-state-store` directly so the
 * server-rendered HTML reflects whatever the most recent mutation was.
 *
 * AbarVa palette only — colors come from `SHELL` shell tokens.
 */

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getRecentMissionStates } from '@/lib/reasoning/mission-state-store';

export interface PortfolioRecentMissionStatesProps {
  /**
   * Unique instance ids to aggregate over. Duplicates are de-duplicated
   * defensively; an empty list renders nothing.
   */
  readonly instanceIds: readonly string[];
  /** Maximum number of recent rows to surface across all instances. */
  readonly limit?: number;
  /** Optional title rendered above the list. */
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
  gridTemplateColumns: 'auto 1fr auto',
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

const INSTANCE_BADGE: CSSProperties = {
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

interface RecentRow {
  readonly missionId: string;
  readonly instanceId: string;
  readonly criterionId: string;
  readonly status: 'complete' | 'dismissed';
  readonly timestamp: string;
  readonly note?: string;
}

function splitMissionId(
  missionId: string,
  instanceId: string,
): { instanceId: string; criterionId: string } {
  const prefix = `${instanceId}:`;
  if (missionId.startsWith(prefix)) {
    return { instanceId, criterionId: missionId.slice(prefix.length) };
  }
  return { instanceId, criterionId: missionId };
}

export function PortfolioRecentMissionStates({
  instanceIds,
  limit = 3,
  title = 'Recently completed',
}: PortfolioRecentMissionStatesProps) {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) return null;
  const seen = new Set<string>();
  const aggregated: RecentRow[] = [];
  for (const id of instanceIds) {
    if (typeof id !== 'string' || id.length === 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    // Pull a generous slice per instance so the merged sort is correct.
    const recents = getRecentMissionStates(id, safeLimit);
    for (const r of recents) {
      const { instanceId, criterionId } = splitMissionId(r.id, id);
      const row: RecentRow = r.note !== undefined
        ? {
            missionId: r.id,
            instanceId,
            criterionId,
            status: r.status,
            timestamp: r.timestamp,
            note: r.note,
          }
        : {
            missionId: r.id,
            instanceId,
            criterionId,
            status: r.status,
            timestamp: r.timestamp,
          };
      aggregated.push(row);
    }
  }
  if (aggregated.length === 0) return null;
  aggregated.sort((a, b) => {
    if (a.timestamp === b.timestamp) {
      return a.missionId < b.missionId ? -1 : a.missionId > b.missionId ? 1 : 0;
    }
    return a.timestamp < b.timestamp ? 1 : -1;
  });
  const visible = aggregated.slice(0, safeLimit);
  return (
    <section style={SECTION} data-testid="portfolio-recent-mission-states">
      <h4 style={TITLE}>{title}</h4>
      <ul style={LIST}>
        {visible.map((entry) => (
          <li key={entry.missionId} style={ROW} data-testid="portfolio-recent-mission-row">
            <span style={INSTANCE_BADGE} title={entry.instanceId}>
              {entry.instanceId}
            </span>
            <span style={ID_LABEL}>{entry.criterionId}</span>
            <span
              style={
                entry.status === 'complete' ? STATUS_COMPLETE : STATUS_DISMISSED
              }
            >
              {entry.status}
            </span>
            {entry.note && (
              <p style={NOTE} data-testid="portfolio-recent-mission-note">
                {entry.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PortfolioRecentMissionStates;
