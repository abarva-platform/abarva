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
import { SourceAlertPanel } from './SourceAlertPanel';
import { SourcingEventTable } from './SourcingEventTable';

const KPI_CARD: CSSProperties = {
  ...sourceCard,
  gap: 8,
  minHeight: 136,
  justifyContent: 'space-between',
};

export function AbarVaSourceDashboard({ data }: { data: AbarvaSourceDashboardData }) {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ display: 'grid', gap: 6 }}>
        <div style={sourceSectionLabel}>Portfolio View</div>
        <p style={{ ...sourceMuted, margin: 0, maxWidth: 860 }}>{data.description}</p>
      </section>

      <section style={{ ...sourceGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceMetricLabel}>Active Events</div>
            <div style={sourceMetricValue}>{data.metrics.activeEvents}</div>
          </div>
          <div style={sourceMetricDetail}>Events actively moving through sourcing work.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceMetricLabel}>Waiting Events</div>
            <div style={sourceMetricValue}>{data.metrics.waitingEvents}</div>
          </div>
          <div style={sourceMetricDetail}>Blocked by client or vendor dependencies, not by product confusion.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceMetricLabel}>At Risk</div>
            <div style={sourceMetricValue}>{data.metrics.atRiskEvents}</div>
          </div>
          <div style={sourceMetricDetail}>Events outside tolerance because aging, blockers, or readiness slipped.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={sourceMetricLabel}>Value At Stake</div>
            <div style={{ ...sourceMetricValue, fontSize: '30px' }}>{formatUsd(data.metrics.valueAtStakeUsd)}</div>
          </div>
          <div style={sourceMetricDetail}>Projected sourcing value currently under active management.</div>
        </div>
      </section>

      <section
        style={{
          ...sourceCard,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
          gap: 20,
        }}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={sourceSectionLabel}>Nexus Portfolio Read</div>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: '27px',
              lineHeight: 1.28,
              color: COLORS.textPrimary,
              maxWidth: 720,
            }}
          >
            {data.nexusSummary}
          </div>
          <div style={{ ...sourceMuted, marginTop: -2 }}>
            {data.metrics.decisionsNeeded} decisions need executive attention before the next set of sourcing actions should expand.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <span
              style={{
                ...COMPONENTS.riskPill('high'),
                background: 'rgba(239,68,68,0.08)',
              }}
            >
              {data.metrics.atRiskEvents} at risk
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '5px 10px',
                borderRadius: 999,
                border: `1px solid ${COLORS.tealBorder}`,
                background: COLORS.tealDim,
                color: COLORS.textPrimary,
              }}
            >
              {data.metrics.waitingEvents} waiting states
            </span>
            <Link href="/source/value" style={sourceActionLink()}>
              Inspect value ledger
            </Link>
          </div>
        </div>

        <SourceAlertPanel alerts={data.attentionItems} title="Decisions Needed" framed={false} />
      </section>

      <SourcingEventTable events={data.events} />
    </div>
  );
}
