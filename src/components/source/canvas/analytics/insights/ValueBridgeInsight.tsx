'use client';

// Pricing — the VALUE BRIDGE (the value-type waterfall as a Recharts chart).
//
// The killer insight of the Pricing step: the classified-value proof (the ≥20%
// story). Each band is one classified movement — a low→high floating $ RANGE bar,
// colored by value type. EVERY honesty rule of the original ValueWaterfall is
// preserved and shared through `waterfall-honesty.ts`:
//   • insufficient-evidence bands render "needs evidence", NEVER a $0 or a guess;
//   • the header total sums ONLY quantified bands;
//   • protected / risk-adjusted are shown but stated apart (never a discount);
//   • a provenance badge + doctrine footer.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ANALYTICS, valueTypeMeta } from '../analytics-tokens';
import { ValueTypeLegend } from '../ValueTypeChip';
import { InsightShell } from './InsightShell';
import {
  WATERFALL_DOCTRINE_FOOTER,
  fmtWaterfallUsdRange,
} from './waterfall-honesty';
import type { ValueBridgeInsightView } from '../view-model';

interface ValueBridgeInsightProps {
  insight: ValueBridgeInsightView;
}

export function ValueBridgeInsight({ insight }: ValueBridgeInsightProps) {
  const { waterfall } = insight;
  const quantified = waterfall.bands.filter((b) => b.state === 'quantified');
  const insufficient = waterfall.bands.filter(
    (b) => b.state === 'insufficient_evidence',
  );

  const chartRows = quantified.map((b) => ({
    id: b.id,
    label: b.label.length > 30 ? `${b.label.slice(0, 28)}…` : b.label,
    fullLabel: b.label,
    valueType: b.valueType,
    offset: b.amountLow,
    span: Math.max(b.amountHigh - b.amountLow, 0),
    low: b.amountLow,
    high: b.amountHigh,
  }));

  const height = Math.max(160, Math.max(chartRows.length, 1) * 52);

  return (
    <InsightShell
      eyebrow="Pricing · Value bridge"
      headline={insight.headline}
      provenance={insight.provenance}
      note={insight.note}
    >
      <div style={{ margin: '0 0 12px' }}>
        <ValueTypeLegend />
      </div>

      {chartRows.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartRows}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
            barCategoryGap={16}
          >
            <CartesianGrid horizontal={false} stroke={ANALYTICS.LINE} />
            <XAxis
              type="number"
              tickFormatter={(value: number) => fmtWaterfallUsdRange(value, value)}
              tick={{ fontFamily: ANALYTICS.SANS, fontSize: 11, fill: ANALYTICS.MUTED }}
              axisLine={{ stroke: ANALYTICS.LINE }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={200}
              tick={{ fontFamily: ANALYTICS.SANS, fontSize: 12, fill: ANALYTICS.INK }}
              axisLine={{ stroke: ANALYTICS.LINE }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(10,10,11,0.03)' }}
              formatter={(_value: number, _name: string, entry) => {
                const row = entry?.payload as
                  | { low: number; high: number }
                  | undefined;
                if (!row) return ['', ''];
                return [fmtWaterfallUsdRange(row.low, row.high), 'Classified value'];
              }}
              labelFormatter={(_label: string, payload) =>
                (payload?.[0]?.payload as { fullLabel?: string })?.fullLabel ??
                _label
              }
              contentStyle={{
                fontFamily: ANALYTICS.SANS,
                fontSize: 12,
                border: `1px solid ${ANALYTICS.LINE}`,
                borderRadius: 8,
              }}
            />
            <Bar dataKey="offset" stackId="range" fill="transparent" />
            <Bar dataKey="span" stackId="range" radius={[4, 4, 4, 4]}>
              {chartRows.map((row) => (
                <Cell key={row.id} fill={valueTypeMeta(row.valueType).fg} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div
          data-testid="value-bridge-empty"
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            border: `1px dashed ${ANALYTICS.LINE}`,
            borderRadius: ANALYTICS.RADIUS,
            color: ANALYTICS.MUTED,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          No band is quantified yet. Every lever below needs evidence — none is
          shown as $0.
        </div>
      )}

      {/* Insufficient bands are surfaced, NEVER as $0 — "needs evidence". */}
      {insufficient.length > 0 ? (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {insufficient.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 11px',
                border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                borderRadius: ANALYTICS.RADIUS,
                background: ANALYTICS.SOFT,
              }}
            >
              <span style={{ fontSize: 12.5, color: ANALYTICS.INK }}>{b.label}</span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: ANALYTICS.AMBER_TEXT,
                  whiteSpace: 'nowrap',
                }}
              >
                needs evidence
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <p
        style={{
          fontSize: 12,
          color: ANALYTICS.MUTED,
          lineHeight: 1.5,
          marginTop: 12,
          marginBottom: 0,
          fontStyle: 'italic',
        }}
      >
        {WATERFALL_DOCTRINE_FOOTER}
      </p>
    </InsightShell>
  );
}
