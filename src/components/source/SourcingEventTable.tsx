import Link from 'next/link';
import type { CSSProperties } from 'react';
import { COLORS, COMPONENTS, FONTS, TEXT } from '@/lib/design-system';
import type { SourceRigorLevel, SourcingEventSummary } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import {
  sourceActionLink,
  sourceCard,
  sourceMetricDetail,
  sourceMuted,
  sourceSectionLabel,
  sourceTableHeaderCell,
} from './foundationStyles';
import { EventLifecycleStatusBadge } from './EventLifecycleStatusBadge';

const TABLE_CELL: CSSProperties = {
  padding: '14px 11px',
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: 'top',
  overflowWrap: 'anywhere',
};

const STATUS_META: CSSProperties = {
  ...TEXT.small,
  color: COLORS.textMuted,
};

const EVENT_NAME: CSSProperties = {
  fontSize: '17px',
  fontWeight: 800,
  color: COLORS.textPrimary,
  lineHeight: 1.25,
};

const LIGHT = {
  card: '#FFFFFF',
  ink: '#101827',
  muted: '#5F6673',
  border: 'rgba(20, 32, 48, 0.12)',
  row: '#FBFAF7',
  teal: '#0F766E',
  red: '#B91C1C',
  green: '#047857',
} as const;

type SourcingEventTableVariant = 'dark' | 'light';

const LIGHT_ACTION_LINK: CSSProperties = {
  ...sourceActionLink('primary'),
  color: LIGHT.ink,
  background: 'rgba(15,118,110,0.10)',
  border: '1px solid rgba(15,118,110,0.24)',
};

function formatRigorLabel(rigor: SourceRigorLevel): string {
  if (rigor === 'enhanced') return 'Enhanced';
  if (rigor === 'strategic') return 'Strategic';
  return 'Standard';
}

export function SourcingEventTable({
  events,
  variant = 'dark',
}: {
  events: SourcingEventSummary[];
  variant?: SourcingEventTableVariant;
}) {
  const lightMode = variant === 'light';
  const textPrimary = lightMode ? LIGHT.ink : COLORS.textPrimary;
  const textSecondary = lightMode ? '#384152' : COLORS.textSecondary;
  const textMuted = lightMode ? LIGHT.muted : COLORS.textMuted;
  const tableCell: CSSProperties = {
    ...TABLE_CELL,
    borderBottom: `1px solid ${lightMode ? LIGHT.border : COLORS.border}`,
    padding: lightMode ? '12px 11px' : TABLE_CELL.padding,
  };
  const headerCell: CSSProperties = {
    ...sourceTableHeaderCell,
    color: lightMode ? LIGHT.muted : sourceTableHeaderCell.color,
    borderBottom: `1px solid ${lightMode ? LIGHT.border : COLORS.border}`,
  };

  return (
    <section
      style={{
        ...sourceCard,
        background: lightMode ? LIGHT.card : sourceCard.background,
        border: `1px solid ${lightMode ? LIGHT.border : COLORS.border}`,
        gap: lightMode ? 10 : sourceCard.gap,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: lightMode ? 6 : 10,
          alignItems: 'end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'grid', gap: 5 }}>
          <div style={{ ...sourceSectionLabel, color: lightMode ? LIGHT.teal : COLORS.teal }}>Live Sourcing Events</div>
          <div style={{ fontSize: lightMode ? '22px' : '24px', fontWeight: 800, color: textPrimary }}>
            Event operating queue
          </div>
        </div>
        <p style={{ ...sourceMuted, margin: 0, maxWidth: 640, color: textMuted }}>
          Compare each event by status, stage, owner, aging, value, blocker, and next operating move.
        </p>
      </div>

      <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: lightMode ? 820 : 940 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={headerCell}>Event</th>
              <th style={headerCell}>Archetype / Rigor</th>
              <th style={headerCell}>Workflow</th>
              <th style={headerCell}>Owner / Pressure</th>
              <th style={headerCell}>Value At Stake</th>
              <th style={headerCell}>Next Action</th>
              <th style={{ ...headerCell, textAlign: 'right' }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} style={{ background: lightMode ? LIGHT.row : 'transparent' }}>
                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ ...EVENT_NAME, color: textPrimary }}>{event.name}</div>
                    <div style={{ ...STATUS_META, color: textMuted }}>{event.code} - {event.accountName}</div>
                    {event.blocker ? (
                      <div
                        style={{
                          ...TEXT.bodySecondary,
                          color: event.isAtRisk ? (lightMode ? LIGHT.red : '#F5B4B4') : textSecondary,
                          maxWidth: 280,
                        }}
                      >
                        Blocker - {event.blocker}
                      </div>
                    ) : (
                      <div style={{ ...TEXT.bodySecondary, color: lightMode ? LIGHT.green : COLORS.green }}>No active blocker</div>
                    )}
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: textPrimary, fontWeight: 600 }}>{event.archetype}</div>
                    <div style={{ ...STATUS_META, color: textMuted }}>Rigor - {formatRigorLabel(event.rigor)}</div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ color: textPrimary, fontWeight: 600 }}>{event.currentStageLabel}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <EventLifecycleStatusBadge status={event.status} label={event.statusLabel} variant={variant} />
                      {event.isAtRisk ? <span style={COMPONENTS.riskPill('high')}>At Risk</span> : null}
                      {event.openAlerts > 0 ? (
                        <span style={COMPONENTS.riskPill(event.isAtRisk ? 'high' : 'medium')}>
                          {event.openAlerts} alert{event.openAlerts === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: textPrimary, fontWeight: 600 }}>{event.owner}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ ...STATUS_META, color: textMuted }}>{event.agingDays}d aging</span>
                      <span style={{ ...STATUS_META, color: textMuted }}>{event.statusLabel}</span>
                    </div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div
                    style={{
                      display: 'grid',
                      gap: 6,
                      borderLeft: `2px solid ${event.isAtRisk ? (lightMode ? LIGHT.red : COLORS.red) : (lightMode ? LIGHT.teal : COLORS.teal)}`,
                      paddingLeft: 10,
                    }}
                  >
                    <div style={{ fontFamily: FONTS.serif, fontSize: lightMode ? '24px' : '25px', color: textPrimary }}>
                      {formatUsd(event.valueAtStakeUsd)}
                    </div>
                    <div style={{ ...sourceMetricDetail, color: textMuted }}>
                      {event.isAtRisk ? 'Exposed projected value' : 'Projected sourcing value'}
                    </div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 7, minWidth: 190 }}>
                    <div style={{ ...sourceMetricDetail, color: textMuted }}>Recommended next move</div>
                    <div style={{ color: textPrimary, fontWeight: 600 }}>{event.nextAction}</div>
                    <div style={{ ...sourceMuted, maxWidth: 260, color: textMuted }}>{event.nextDecision}</div>
                  </div>
                </td>

                <td style={{ ...tableCell, textAlign: 'right' }}>
                  <Link href={`/source/events/${event.id}`} style={lightMode ? LIGHT_ACTION_LINK : sourceActionLink('primary')}>
                    Open event
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
