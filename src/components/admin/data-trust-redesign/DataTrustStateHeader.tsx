/**
 * DataTrustStateHeader · Block 2.1 (Setup Redesign Package PR B).
 *
 * Four metric cards in a row: Segments loaded · Records ·
 * Decision-grade · Empty/blocking. Per `DATA_BINDING_CATALOG.md`
 * §2 Block 2.1.
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { DataTrustStateMetrics } from '@/lib/admin/data-trust-composer';

export function DataTrustStateHeader({ metrics }: { metrics: DataTrustStateMetrics }) {
  const items = [
    {
      label: 'Segments loaded',
      value: `${metrics.segmentsLoaded} / ${metrics.totalSegments}`,
    },
    {
      label: 'Records',
      value: metrics.records.toLocaleString(),
    },
    {
      label: 'Decision-grade',
      value: String(metrics.decisionGrade),
    },
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
        gap: SPACING.md,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          data-metric={item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
          style={{
            background: SHELL.CARD_WHITE,
            border: `1px solid ${item.attention ? `${COLORS.coralInk}55` : SHELL.CARD_LINE_SOFT}`,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm} ${SPACING.md}`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              fontWeight: 700,
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 24,
              color: item.attention ? COLORS.coralInk : SHELL.INK,
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </section>
  );
}
