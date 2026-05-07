'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  agingSeverity,
  portfolioStatusOf,
  STAGE_BANDS,
  tenantAbbreviationForAccount,
  type PortfolioStatus,
  type StageBandKey,
} from '@/lib/source/portfolio-filtering';
import {
  deriveBlockerLine,
  deriveValuePosture,
  formatStageEntered,
  formatValuePosture,
} from '@/lib/source/portfolio-derivations';
import type { SourcingEventSummary } from '@/lib/source/types';
import { redactSourceFinancialText } from '@/lib/source/financial-display';
import { MiniRail } from './MiniRail';
import { PORTFOLIO } from './portfolio-tokens';

interface PortfolioEventsTableProps {
  rows: PortfolioRow[];
  groupBy: 'none' | 'stage-band';
  canViewFinancialValues: boolean;
}

export type PortfolioRow =
  | { kind: 'event'; event: SourcingEventSummary }
  | { kind: 'group'; band: StageBandKey; count: number };

/**
 * Productivity-app event table.
 *
 *   - Hairline row dividers, no zebra, no chip backgrounds
 *   - Status indicator: tiny colored dot + plain text
 *   - Tenant: mono caps inline, no boxed badge
 *   - Hover: subtle row tint + name underline
 *   - No pulse / no animation other than 120ms hover ease
 */
export function PortfolioEventsTable({
  rows,
  groupBy,
  canViewFinancialValues,
}: PortfolioEventsTableProps) {
  if (rows.length === 0) {
    return (
      <section data-testid="source-portfolio-events-empty" style={EMPTY_STYLE}>
        No events match the current filters.
      </section>
    );
  }

  return (
    <section
      data-testid="source-portfolio-events-table"
      data-group-by={groupBy}
      aria-label="Sourcing events"
      style={CARD_STYLE}
    >
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={{ ...HEADER_CELL_STYLE, width: 60 }}>Tenant</th>
            <th style={HEADER_CELL_STYLE}>Event</th>
            <th style={{ ...HEADER_CELL_STYLE, width: 220 }}>Stage</th>
            <th style={{ ...HEADER_CELL_STYLE, width: 110 }}>Status</th>
            <th style={{ ...HEADER_CELL_STYLE, width: 130 }}>Owner</th>
            <th style={{ ...HEADER_CELL_STYLE, width: 130, textAlign: 'right' }}>Value</th>
            <th style={{ ...HEADER_CELL_STYLE, width: 60, textAlign: 'right' }}>Aging</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            if (row.kind === 'group') {
              return (
                <tr
                  key={`group-${row.band}-${idx}`}
                  data-testid={`source-portfolio-group-${row.band}`}
                >
                  <td colSpan={7} style={GROUP_CELL_STYLE}>
                    <span style={GROUP_RANGE_STYLE}>{STAGE_BANDS[row.band].rangeLabel}</span>
                    <span style={GROUP_TITLE_STYLE}>{STAGE_BANDS[row.band].title}</span>
                    <span style={GROUP_COUNT_STYLE}>
                      {row.count} {row.count === 1 ? 'event' : 'events'}
                    </span>
                  </td>
                </tr>
              );
            }
            return (
              <EventRow
                key={row.event.id}
                event={row.event}
                canViewFinancialValues={canViewFinancialValues}
              />
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function EventRow({
  event,
  canViewFinancialValues,
}: {
  event: SourcingEventSummary;
  canViewFinancialValues: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const statusBucket = portfolioStatusOf(event);
  const aging = Math.max(0, event.agingDays | 0);
  const ageSev = agingSeverity(aging);
  const tenantBadge = tenantAbbreviationForAccount(event.accountName);
  const ownerLabel = redactSourceFinancialText(event.owner, canViewFinancialValues);
  const blockerLine = deriveBlockerLine(event);
  const valuePosture = deriveValuePosture(event);
  const valueDisplay = formatValuePosture(valuePosture, canViewFinancialValues);

  return (
    <tr
      data-testid={`source-portfolio-row-${event.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...ROW_STYLE,
        background: hovered ? PORTFOLIO.SURFACE_HOVER : 'transparent',
      }}
    >
      <td style={CELL_STYLE}>
        <span style={TENANT_LABEL_STYLE} title={event.accountName}>
          {tenantBadge}
        </span>
      </td>
      <td style={CELL_STYLE}>
        <Link
          href={`/source/events/${event.id}`}
          data-testid={`source-portfolio-row-link-${event.id}`}
          style={EVENT_LINK_STYLE}
        >
          <span
            style={{
              ...EVENT_NAME_STYLE,
              textDecoration: hovered ? 'underline' : 'none',
              textDecorationColor: PORTFOLIO.RULE,
              textUnderlineOffset: 3,
            }}
          >
            {event.name}
          </span>
          <span style={EVENT_META_STYLE}>
            <span style={CODE_INLINE_STYLE}>{event.code}</span>
            <span style={DOT_SEP_STYLE}>·</span>
            <span>{rigorLabel(event.rigor)}</span>
          </span>
          {blockerLine ? (
            <span
              style={BLOCKER_STYLE}
              data-testid={`source-portfolio-row-blocker-${event.id}`}
            >
              <span style={AGENT_TAG_STYLE}>{blockerLine.agent.toUpperCase()}</span>
              <span> · {blockerLine.body}</span>
            </span>
          ) : null}
        </Link>
      </td>
      <td style={CELL_STYLE}>
        <div style={STAGE_STACK_STYLE}>
          <MiniRail currentStageKey={event.currentStageKey} />
          <span style={STAGE_ENTERED_STYLE}>{formatStageEntered(aging)}</span>
        </div>
      </td>
      <td style={CELL_STYLE}>
        <StatusIndicator status={statusBucket} label={event.statusLabel} />
      </td>
      <td style={CELL_STYLE}>
        <span style={OWNER_STYLE}>{ownerLabel}</span>
      </td>
      <td style={{ ...CELL_STYLE, textAlign: 'right' }}>
        <div style={VALUE_STACK_STYLE}>
          <span style={VALUE_PRIMARY_STYLE}>{valueDisplay.primary}</span>
          <span style={VALUE_SECONDARY_STYLE}>{valueDisplay.secondary}</span>
        </div>
      </td>
      <td style={{ ...CELL_STYLE, textAlign: 'right' }}>
        <span
          style={{
            ...AGING_STYLE,
            color:
              ageSev === 'bad'
                ? PORTFOLIO.AGE_BAD
                : ageSev === 'warn'
                  ? PORTFOLIO.AGE_WARN
                  : PORTFOLIO.AGE_NORMAL,
          }}
        >
          {aging}d
        </span>
      </td>
    </tr>
  );
}

/**
 * Status indicator — colored dot + plain text. No chip background. No pulse.
 * The dot is the only place hue lives in the row.
 */
function StatusIndicator({
  status,
  label,
}: {
  status: PortfolioStatus;
  label: string;
}) {
  const colors = STATUS_COLORS[status];
  return (
    <span
      style={INDICATOR_STYLE}
      data-testid={`source-portfolio-status-${status}`}
    >
      <span aria-hidden style={{ ...DOT_INDICATOR_STYLE, background: colors }} />
      <span style={INDICATOR_LABEL_STYLE}>{chipLabelFor(status, label)}</span>
    </span>
  );
}

function chipLabelFor(status: PortfolioStatus, label: string): string {
  if (status === 'active') return 'Active';
  if (status === 'completed') return 'Completed';
  if (status === 'attention') return 'At risk';
  if (label.toLowerCase().startsWith('waiting')) return 'Waiting';
  return label;
}

function rigorLabel(rigor: SourcingEventSummary['rigor']): string {
  if (rigor === 'enhanced') return 'Enhanced';
  if (rigor === 'strategic') return 'Strategic';
  return 'Standard';
}

const STATUS_COLORS: Record<PortfolioStatus, string> = {
  active: PORTFOLIO.ACTIVE,
  waiting: PORTFOLIO.WAITING,
  completed: PORTFOLIO.COMPLETED,
  attention: PORTFOLIO.BLOCKED,
};

const CARD_STYLE: CSSProperties = {
  border: `1px solid ${PORTFOLIO.RULE}`,
  borderRadius: PORTFOLIO.RADIUS,
  background: PORTFOLIO.CARD,
  overflow: 'hidden',
};

const EMPTY_STYLE: CSSProperties = {
  border: `1px solid ${PORTFOLIO.RULE}`,
  borderRadius: PORTFOLIO.RADIUS,
  background: PORTFOLIO.CARD,
  padding: '40px 16px',
  textAlign: 'center',
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  color: PORTFOLIO.INK_SOFT,
};

const TABLE_STYLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const HEADER_CELL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
  textAlign: 'left',
  padding: '14px 16px 10px',
  borderBottom: `1px solid ${PORTFOLIO.RULE}`,
  fontWeight: 500,
};

const ROW_STYLE: CSSProperties = {
  borderBottom: `1px solid ${PORTFOLIO.HAIRLINE}`,
  transition: 'background 120ms ease',
};

const CELL_STYLE: CSSProperties = {
  padding: '16px 16px',
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  lineHeight: 1.4,
  color: PORTFOLIO.INK,
  verticalAlign: 'top',
};

const TENANT_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  fontWeight: 600,
  letterSpacing: '0.10em',
  color: PORTFOLIO.GRAY_DK,
  textTransform: 'uppercase',
};

const EVENT_LINK_STYLE: CSSProperties = {
  display: 'grid',
  gap: 4,
  textDecoration: 'none',
  color: PORTFOLIO.INK,
};

const EVENT_NAME_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY,
  fontWeight: 500,
  color: PORTFOLIO.INK,
  lineHeight: 1.35,
};

const EVENT_META_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_META,
  color: PORTFOLIO.INK_SOFT,
};

const CODE_INLINE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.04em',
  color: PORTFOLIO.GRAY_DK,
};

const DOT_SEP_STYLE: CSSProperties = {
  color: PORTFOLIO.GRAY,
};

const BLOCKER_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_META,
  lineHeight: 1.45,
  color: PORTFOLIO.INK_SOFT,
  marginTop: 2,
  maxWidth: 380,
};

const AGENT_TAG_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: PORTFOLIO.INK,
};

const STAGE_STACK_STYLE: CSSProperties = {
  display: 'grid',
  gap: 6,
};

const STAGE_ENTERED_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.06em',
  color: PORTFOLIO.GRAY_DK,
};

const INDICATOR_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const DOT_INDICATOR_STYLE: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
  display: 'inline-block',
  flexShrink: 0,
};

const INDICATOR_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  fontWeight: 500,
  color: PORTFOLIO.INK,
};

const OWNER_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  color: PORTFOLIO.INK,
};

const VALUE_STACK_STYLE: CSSProperties = {
  display: 'grid',
  gap: 2,
  justifyItems: 'end',
};

const VALUE_PRIMARY_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  fontWeight: 600,
  color: PORTFOLIO.INK,
  letterSpacing: '-0.01em',
};

const VALUE_SECONDARY_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
};

const AGING_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  fontWeight: 500,
};

const GROUP_CELL_STYLE: CSSProperties = {
  padding: '20px 16px 10px',
  background: 'transparent',
  borderTop: `1px solid ${PORTFOLIO.HAIRLINE}`,
  borderBottom: `1px solid ${PORTFOLIO.HAIRLINE}`,
  fontFamily: PORTFOLIO.SANS,
};

const GROUP_RANGE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
  marginRight: 12,
};

const GROUP_TITLE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SERIF,
  fontSize: PORTFOLIO.T_HEADING,
  fontWeight: 400,
  color: PORTFOLIO.INK,
  marginRight: 12,
  letterSpacing: '-0.01em',
};

const GROUP_COUNT_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  color: PORTFOLIO.INK_SOFT,
  letterSpacing: '0.04em',
};
