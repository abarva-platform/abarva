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
  padding: '16px 14px',
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: 'top',
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
        <div style={{ fontSize: '24px', fontWeight: 700, color: COLORS.textPrimary }}>Event portfolio</div>
        <p style={{ ...sourceMuted, margin: 0, maxWidth: 820 }}>
          The table below is the Source operating surface: event status, stage, owner, aging, value at stake,
          and the next action that should happen next.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={sourceTableHeaderCell}>Event</th>
              <th style={sourceTableHeaderCell}>Archetype / Rigor</th>
              <th style={sourceTableHeaderCell}>Workflow</th>
              <th style={sourceTableHeaderCell}>Owner / Aging</th>
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
                    <div style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary }}>{event.name}</div>
                    <div style={{ ...TEXT.small, color: COLORS.textMuted }}>{event.code} - {event.accountName}</div>
                    {event.blocker ? (
                      <div style={{ ...TEXT.bodySecondary, color: event.isAtRisk ? '#F5B4B4' : COLORS.textSecondary }}>
                        Blocker - {event.blocker}
                      </div>
                    ) : (
                      <div style={{ ...TEXT.bodySecondary, color: COLORS.green }}>No active blocker.</div>
                    )}
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{event.archetype}</div>
                    <div style={{ ...TEXT.small, color: COLORS.textMuted }}>Rigor - {formatRigorLabel(event.rigor)}</div>
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{event.currentStageLabel}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <EventLifecycleStatusBadge status={event.status} label={event.statusLabel} />
                      {event.isAtRisk ? <span style={COMPONENTS.riskPill('high')}>At Risk</span> : null}
                    </div>
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{event.owner}</div>
                    <div style={{ ...TEXT.small, color: COLORS.textMuted }}>Aging - {event.agingDays} days</div>
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ fontFamily: FONTS.serif, fontSize: '24px', color: COLORS.textPrimary }}>
                      {formatUsd(event.valueAtStakeUsd)}
                    </div>
                    <div style={sourceMetricDetail}>Projected sourcing value</div>
                  </div>
                </td>

                <td style={TABLE_CELL}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{event.nextAction}</div>
                    <div style={sourceMuted}>{event.nextDecision}</div>
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
