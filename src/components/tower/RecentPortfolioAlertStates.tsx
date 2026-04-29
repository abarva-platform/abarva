/**
 * RecentPortfolioAlertStates — compact "recently acknowledged/dismissed"
 * subsection rendered below the PortfolioAlertsPanel.
 *
 * Reads the most-recent alert states from
 * `getRecentAlertStates(limit)` and renders the last few actioned alerts so
 * a user has a sense of progress after acting on items in the live feed.
 *
 * Pure server-friendly presentation — no IO, no Date.now(), no randomness.
 * AbarVa palette only.
 */

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getRecentAlertStates } from '@/lib/reasoning/alert-acknowledgment-state';

export interface RecentPortfolioAlertStatesProps {
  readonly limit?: number;
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

const ID_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_SOFT,
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

const STATUS_ACK: CSSProperties = {
  ...STATUS_BADGE_BASE,
  background: SHELL.MINT_BG,
  color: SHELL.MINT_TEXT,
};

const STATUS_DISMISSED: CSSProperties = {
  ...STATUS_BADGE_BASE,
  background: SHELL.GRAY_BG,
  color: SHELL.GRAY_TEXT,
};

export function RecentPortfolioAlertStates({
  limit = 3,
  title = 'Recently acknowledged / dismissed',
}: RecentPortfolioAlertStatesProps = {}) {
  const recent = getRecentAlertStates(limit);
  if (recent.length === 0) return null;
  return (
    <section style={SECTION} data-testid="recent-portfolio-alert-states">
      <h4 style={TITLE}>{title}</h4>
      <ul style={LIST}>
        {recent.map((entry) => (
          <li
            key={entry.id}
            style={ROW}
            data-testid="recent-portfolio-alert-row"
          >
            <span style={ID_LABEL}>{entry.id}</span>
            <span
              style={
                entry.status === 'acknowledged' ? STATUS_ACK : STATUS_DISMISSED
              }
            >
              {entry.status === 'acknowledged' ? "ack'd" : 'dismissed'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecentPortfolioAlertStates;
