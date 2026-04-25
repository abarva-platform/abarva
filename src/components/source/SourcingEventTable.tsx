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
  padding: '18px 14px',
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: 'top',
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

function formatRigorLabel(rigor: SourceRigorLevel): string {
  if (rigor === 'enhanced') return 'Enhanced';
  if (rigor === 'strategic') return 'Strategic';
  return 'Standard';
}

export function SourcingEventTable({ events }: { events: SourcingEventSummary[] }) {
  return (
    <section style={sourceCard}>
      <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
        <div style={sourceSectionLabel}>Live Sourcing Events</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.textPrimary }}>Event operating queue</div>
        <p style={{ ...sourceMuted, margin: 0, maxWidth: 820 }}>
          Compare each event by status, stage, owner, aging, value, blocker, and next operating move.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1040 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={sourceTableHeaderCell}>Event</th>
              <th style={sourceTableHeaderCell}>Archetype / Rigor</th>
              <th style={sourceTableHeaderCell}>Workflow</th>
              <th style={sourceTableHeaderCell}>Owner / Pressure</th>
              <th style={sourceTableHeaderCell}>Value At Stake</th>
              <th style={sourceTableHeaderCell}>Next Action</th>
              <th style={{ ...sourceTableHeaderCell, textAlign: 'right' }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} style={{ background: 'transparent' }}>
                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={EVENT_NAME}>{event.name}</div>
                    <div style={STATUS_META}>{event.code} - {event.accountName}</div>
                    {event.blocker ? (
                      <div
                        style={{
                          ...TEXT.bodySecondary,
                          color: event.isAtRisk ? '#F5B4B4' : COLORS.textSecondary,
                          maxWidth: 280,
                        }}
                      >
                        Blocker - {event.blocker}
                      </div>
                    ) : (
                      <div style={{ ...TEXT.bodySecondary, color: COLORS.green }}>No active blocker</div>
                    )}
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{event.archetype}</div>
                    <div style={STATUS_META}>Rigor - {formatRigorLabel(event.rigor)}</div>
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{event.currentStageLabel}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <EventLifecycleStatusBadge status={event.status} label={event.statusLabel} />
                      {event.isAtRisk ? <span style={COMPONENTS.riskPill('high')}>At Risk</span> : null}
                      {event.openAlerts > 0 ? (
                        <span style={COMPONENTS.riskPill(event.isAtRisk ? 'high' : 'medium')}>
                          {event.openAlerts} alert{event.openAlerts === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{event.owner}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={STATUS_META}>{event.agingDays}d aging</span>
                      <span style={STATUS_META}>{event.statusLabel}</span>
                    </div>
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div
                    style={{
                      display: 'grid',
                      gap: 6,
                      borderLeft: `2px solid ${event.isAtRisk ? COLORS.red : COLORS.teal}`,
                      paddingLeft: 10,
                    }}
                  >
                    <div style={{ fontFamily: FONTS.serif, fontSize: '25px', color: COLORS.textPrimary }}>
                      {formatUsd(event.valueAtStakeUsd)}
                    </div>
                    <div style={sourceMetricDetail}>
                      {event.isAtRisk ? 'Exposed projected value' : 'Projected sourcing value'}
                    </div>
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 7, minWidth: 190 }}>
                    <div style={sourceMetricDetail}>Recommended next move</div>
                    <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{event.nextAction}</div>
                    <div style={{ ...sourceMuted, maxWidth: 260 }}>{event.nextDecision}</div>
                  </div>
                </td>

                <td style={{ ...TABLE_CELL, textAlign: 'right' }}>
                  <Link href={`/source/events/${event.id}`} style={sourceActionLink('primary')}>
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
