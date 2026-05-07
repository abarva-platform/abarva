/**
 * DataTrustStateHeader · Block 2.1 (Setup Redesign Package PR B).
 *
 * Four metric cards in a row: Segments loaded · Records ·
 * Decision-grade · Empty/blocking. Per `DATA_BINDING_CATALOG.md`
 * §2 Block 2.1 + Setup canon refit.
 */

import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import type { DataTrustStateMetrics } from '@/lib/admin/data-trust-composer';

export function DataTrustStateHeader({ metrics }: { metrics: DataTrustStateMetrics }) {
  const items = [
    { label: 'Segments loaded', value: `${metrics.segmentsLoaded} / ${metrics.totalSegments}` },
    { label: 'Records', value: metrics.records.toLocaleString() },
    { label: 'Decision-grade', value: String(metrics.decisionGrade) },
    {
      label: 'Empty / blocking',
      value: String(metrics.emptyBlocking),
      attention: metrics.emptyBlocking > 0,
    },
  ];

  return (
    <section
      data-data-trust-block="state-header"
      data-testid="data-trust-state-header"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          data-metric={item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
          style={{
            background: SETUP.cardWhite,
            border: `1px solid ${item.attention ? `${SETUP.coral}55` : SETUP.cardLine}`,
            borderRadius: SETUP_RADIUS.md,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <p style={SETUP_TYPE.tileLabel}>{item.label}</p>
          <p
            style={{
              ...SETUP_TYPE.tileValue,
              color: item.attention ? SETUP.coral : SETUP.ink,
            }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}
