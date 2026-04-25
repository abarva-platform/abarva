import Link from 'next/link';
import type { CSSProperties } from 'react';
import { COLORS, COMPONENTS, FONTS } from '@/lib/design-system';
import type { AbarvaSourceDashboardData } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import {
  sourceActionLink,
  sourceCard,
  sourceGrid,
  sourceMetricDetail,
  sourceMetricLabel,
  sourceMetricValue,
  sourceMuted,
  sourceSectionLabel,
} from './foundationStyles';
import { SourceAlertPanel, type SourceAlertEventContext } from './SourceAlertPanel';
import { SourcingEventTable } from './SourcingEventTable';

const KPI_CARD: CSSProperties = {
  ...sourceCard,
  gap: 10,
  minHeight: 128,
  justifyContent: 'space-between',
  borderColor: 'rgba(255,255,255,0.1)',
};

const KPI_VALUE: CSSProperties = {
  ...sourceMetricValue,
  fontSize: '30px',
};

export function AbarVaSourceDashboard({ data }: { data: AbarvaSourceDashboardData }) {
  const waitingOrBlockedEvents = data.events.filter(
    (event) => event.blocker || event.status.startsWith('waiting_on'),
  );
  const valueInWaitingOrBlocked = waitingOrBlockedEvents.reduce(
    (total, event) => total + event.valueAtStakeUsd,
    0,
  );
  const mostExposedEvent =
    data.events.find((event) => event.isAtRisk) ?? waitingOrBlockedEvents[0] ?? data.events[0];
  const eventContextById = data.events.reduce<Record<string, SourceAlertEventContext>>((context, event) => {
    context[event.id] = {
      name: event.name,
      valueAtStakeUsd: event.valueAtStakeUsd,
      agingDays: event.agingDays,
      statusLabel: event.statusLabel,
      blocker: event.blocker,
    };
    return context;
  }, {});

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <div style={{ ...sourceCard, gap: 16, minHeight: 280 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceSectionLabel}>Source command read</div>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: '32px',
                lineHeight: 1.18,
                color: COLORS.textPrimary,
                maxWidth: 760,
            }}
          >
              {data.metrics.atRiskEvents} at-risk event, {waitingOrBlockedEvents.length} waiting or blocked states,{' '}
              {formatUsd(data.metrics.valueAtStakeUsd)} under management.
            </div>
            <p style={{ ...sourceMuted, margin: 0, maxWidth: 760 }}>{data.nexusSummary}</p>
          </div>

          {mostExposedEvent ? (
            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                paddingTop: 14,
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={COMPONENTS.riskPill(mostExposedEvent.isAtRisk ? 'high' : 'medium')}>
                  Most exposed
                </span>
                <span style={{ ...sourceMetricDetail, color: COLORS.textSecondary }}>
                  {mostExposedEvent.name}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 10,
                }}
              >
                <div>
                  <div style={sourceMetricLabel}>Owner</div>
                  <div style={{ color: COLORS.textPrimary, fontWeight: 700 }}>{mostExposedEvent.owner}</div>
                </div>
                <div>
                  <div style={sourceMetricLabel}>Aging</div>
                  <div style={{ color: COLORS.textPrimary, fontWeight: 700 }}>{mostExposedEvent.agingDays} days</div>
                </div>
                <div>
                  <div style={sourceMetricLabel}>Value exposed</div>
                  <div style={{ color: COLORS.textPrimary, fontWeight: 700 }}>
                    {formatUsd(mostExposedEvent.valueAtStakeUsd)}
                  </div>
                </div>
              </div>
              <div style={{ ...sourceMuted, margin: 0 }}>Next action: {mostExposedEvent.nextAction}</div>
            </div>
          ) : null}
        </div>

        <SourceAlertPanel
          alerts={data.attentionItems}
          title="Executive pressure signals"
          eventContextById={eventContextById}
        />
      </section>

      <section style={{ ...sourceGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))' }}>
        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceMetricLabel}>Active Events</div>
            <div style={KPI_VALUE}>{data.metrics.activeEvents}</div>
          </div>
          <div style={sourceMetricDetail}>Open sourcing events under active Source governance.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceMetricLabel}>Waiting / Blocked</div>
            <div style={KPI_VALUE}>{waitingOrBlockedEvents.length}</div>
          </div>
          <div style={sourceMetricDetail}>Client, vendor, or blocker states that need owner action.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceMetricLabel}>At Risk</div>
            <div style={KPI_VALUE}>{data.metrics.atRiskEvents}</div>
          </div>
          <div style={sourceMetricDetail}>Events outside tolerance due to aging, blockers, or readiness drift.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceMetricLabel}>Value At Stake</div>
            <div style={{ ...KPI_VALUE, fontSize: '28px' }}>{formatUsd(data.metrics.valueAtStakeUsd)}</div>
          </div>
          <div style={sourceMetricDetail}>
            {formatUsd(valueInWaitingOrBlocked)} sits in waiting or blocked events.
          </div>
        </div>
      </section>

      <section
        style={{
          ...sourceCard,
          gap: 12,
        }}
      >
        <div style={sourceSectionLabel}>Portfolio operating posture</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ ...sourceMuted, margin: 0, maxWidth: 720 }}>
            {data.description} {data.metrics.decisionsNeeded} decisions need attention before downstream sourcing work expands.
          </div>
          <Link href="/source/value" style={sourceActionLink()}>
            Inspect value ledger
          </Link>
        </div>
      </section>

      <SourcingEventTable events={data.events} />
    </div>
  );
}
