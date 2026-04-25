import Link from 'next/link';
import type { CSSProperties } from 'react';
import { COMPONENTS, FONTS } from '@/lib/design-system';
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
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minHeight: 96,
  justifyContent: 'space-between',
  border: '1px solid rgba(20, 32, 48, 0.10)',
  borderRadius: 12,
  padding: '14px 15px',
  background: 'rgba(255,255,255,0.82)',
};

const KPI_VALUE: CSSProperties = {
  ...sourceMetricValue,
  fontSize: '27px',
  color: '#111827',
};

const LIGHT = {
  page: '#F7F4EF',
  card: '#FFFFFF',
  line: 'rgba(20, 32, 48, 0.12)',
  ink: '#101827',
  navy: '#07111F',
  muted: '#5F6673',
  teal: '#0F766E',
} as const;

const LIGHT_ACTION_LINK: CSSProperties = {
  ...sourceActionLink('primary'),
  color: LIGHT.ink,
  background: 'rgba(15,118,110,0.10)',
  border: '1px solid rgba(15,118,110,0.24)',
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
    <div
      style={{
        display: 'grid',
        gap: 14,
        background: LIGHT.page,
        border: `1px solid ${LIGHT.line}`,
        borderRadius: 20,
        padding: 16,
        boxShadow: '0 20px 70px rgba(0,0,0,0.18)',
        color: LIGHT.ink,
      }}
    >
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            ...sourceCard,
            gap: 14,
            minHeight: 'auto',
            background: LIGHT.navy,
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 18px 45px rgba(7,17,31,0.26)',
          }}
        >
          <div style={{ display: 'grid', gap: 7 }}>
            <div style={{ ...sourceSectionLabel, color: '#5EEAD4' }}>Source command read</div>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: 'clamp(24px, 3vw, 31px)',
                lineHeight: 1.18,
                color: '#F8FAFC',
                maxWidth: 760,
              }}
            >
              {data.metrics.atRiskEvents} at-risk event, {waitingOrBlockedEvents.length} waiting or blocked states,{' '}
              {formatUsd(data.metrics.valueAtStakeUsd)} under management.
            </div>
            <p style={{ ...sourceMuted, margin: 0, maxWidth: 760, color: 'rgba(248,250,252,0.72)' }}>
              {data.nexusSummary}
            </p>
          </div>

          {mostExposedEvent ? (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.12)',
                paddingTop: 12,
                display: 'grid',
                gap: 9,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={COMPONENTS.riskPill(mostExposedEvent.isAtRisk ? 'high' : 'medium')}>
                  Most exposed
                </span>
                <span style={{ ...sourceMetricDetail, color: 'rgba(248,250,252,0.78)', fontWeight: 700 }}>
                  {mostExposedEvent.name}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ ...sourceMetricLabel, color: 'rgba(248,250,252,0.58)' }}>Owner</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{mostExposedEvent.owner}</div>
                </div>
                <div>
                  <div style={{ ...sourceMetricLabel, color: 'rgba(248,250,252,0.58)' }}>Aging</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{mostExposedEvent.agingDays} days</div>
                </div>
                <div>
                  <div style={{ ...sourceMetricLabel, color: 'rgba(248,250,252,0.58)' }}>Value exposed</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {formatUsd(mostExposedEvent.valueAtStakeUsd)}
                  </div>
                </div>
              </div>
              <div style={{ ...sourceMuted, margin: 0, color: 'rgba(248,250,252,0.76)' }}>
                Next action: {mostExposedEvent.nextAction}
              </div>
            </div>
          ) : null}
        </div>

        <SourceAlertPanel
          alerts={data.attentionItems}
          title="Executive pressure signals"
          eventContextById={eventContextById}
          variant="light"
        />
      </section>

      <section style={{ ...sourceGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 12 }}>
        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...sourceMetricLabel, color: LIGHT.muted }}>Active Events</div>
            <div style={KPI_VALUE}>{data.metrics.activeEvents}</div>
          </div>
          <div style={{ ...sourceMetricDetail, color: LIGHT.muted }}>Open sourcing events under active Source governance.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...sourceMetricLabel, color: LIGHT.muted }}>Waiting / Blocked</div>
            <div style={KPI_VALUE}>{waitingOrBlockedEvents.length}</div>
          </div>
          <div style={{ ...sourceMetricDetail, color: LIGHT.muted }}>Client, vendor, or blocker states that need owner action.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...sourceMetricLabel, color: LIGHT.muted }}>At Risk</div>
            <div style={KPI_VALUE}>{data.metrics.atRiskEvents}</div>
          </div>
          <div style={{ ...sourceMetricDetail, color: LIGHT.muted }}>Events outside tolerance due to aging, blockers, or readiness drift.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...sourceMetricLabel, color: LIGHT.muted }}>Value At Stake</div>
            <div style={{ ...KPI_VALUE, fontSize: '26px' }}>{formatUsd(data.metrics.valueAtStakeUsd)}</div>
          </div>
          <div style={{ ...sourceMetricDetail, color: LIGHT.muted }}>
            {formatUsd(valueInWaitingOrBlocked)} sits in waiting or blocked events.
          </div>
        </div>
      </section>

      <SourcingEventTable events={data.events} variant="light" />

      <section
        style={{
          ...sourceCard,
          gap: 10,
          background: LIGHT.card,
          border: `1px solid ${LIGHT.line}`,
        }}
      >
        <div style={{ ...sourceSectionLabel, color: LIGHT.teal }}>Portfolio operating posture</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ ...sourceMuted, margin: 0, maxWidth: 720, color: LIGHT.muted }}>
            {data.description} {data.metrics.decisionsNeeded} decisions need attention before downstream sourcing work expands.
          </div>
          <Link href="/source/value" style={LIGHT_ACTION_LINK}>
            Inspect value ledger
          </Link>
        </div>
      </section>
    </div>
  );
}
