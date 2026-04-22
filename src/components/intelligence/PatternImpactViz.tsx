'use client';

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { COLORS } from '@/lib/design-system';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { getPatternImpactData, type PatternImpactData } from '@/lib/intelligence/pattern-impact-data';

// Fix Spec v4 §2 + §3 · Pattern Impact Visualization.
//
// Single reusable chart for pattern pages · quantifies the cost of doing
// nothing. Left axis + stacked areas show composition breakdown of the
// total gap. Right axis + overlay line shows severity without intervention.
// Reference line at the decision-gate month. Caption + 3-tile micro-summary
// below the chart anchors the viz to specific evidence.

interface PatternImpactVizProps {
  patternKey: string;
  // Optional override · pass data directly for use in pages that generate
  // their own payload (rare; most consumers pass patternKey only).
  data?: PatternImpactData;
}

interface ChartPoint {
  month: number;
  severity: number;
  // Composition layer values indexed by layer label.
  [layerLabel: string]: number;
}

function buildChartSeries(data: PatternImpactData): ChartPoint[] {
  const { monthsOut, severityCurve } = data.timeline;
  // Composition stacks use the midpoint of each layer's range · the range
  // shows uncertainty in the caption, the chart shows the anchor value.
  return monthsOut.map((month, i) => {
    const point: ChartPoint = { month, severity: severityCurve[i] ?? 0 };
    for (const layer of data.composition) {
      // Grow each composition layer proportionally with the severity curve
      // relative to month 0 · at month 0 the layers sum exactly to
      // severity[0]; later months scale with the curve.
      const layerMid = (layer.rangeLow + layer.rangeHigh) / 2;
      const scale = severityCurve[0] > 0 ? (severityCurve[i] ?? 0) / severityCurve[0] : 1;
      point[layer.label] = Math.round(layerMid * scale * 10) / 10;
    }
    return point;
  });
}

export function PatternImpactViz({ patternKey, data: explicit }: PatternImpactVizProps) {
  const data = explicit ?? getPatternImpactData(patternKey);
  if (!data) return null;

  const series = buildChartSeries(data);
  const annotationX = data.timeline.annotation.monthMark;

  return (
    <section
      aria-labelledby={`impact-viz-${patternKey}`}
      style={{
        padding: 24,
        background: 'rgba(255,255,255,0.02)',
        border: '0.5px solid rgba(45,212,200,0.2)',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <EyebrowLabel tone="teal" size="sm">{data.eyebrow}</EyebrowLabel>
        <h2
          id={`impact-viz-${patternKey}`}
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 26,
            fontWeight: 400,
            lineHeight: 1.25,
            color: COLORS.textPrimary,
            margin: 0,
            maxWidth: 820,
            letterSpacing: '-0.005em',
          }}
        >
          {data.title}
        </h2>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(245,245,240,0.65)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(v) => `M${v}`}
              stroke="rgba(255,255,255,0.15)"
            >
              {/* X-axis label · kept minimal · spec says monthly ticks only */}
            </XAxis>
            <YAxis
              yAxisId="left"
              tick={{ fill: 'rgba(245,245,240,0.65)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              stroke="rgba(255,255,255,0.15)"
              label={{ value: data.composition[0].unit, angle: -90, position: 'insideLeft', fill: 'rgba(245,245,240,0.55)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'rgba(245,245,240,0.65)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              stroke="rgba(255,255,255,0.15)"
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(13,21,32,0.98)',
                border: '0.5px solid rgba(45,212,200,0.4)',
                borderRadius: 8,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
              }}
              labelStyle={{ color: COLORS.teal, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
              itemStyle={{ color: COLORS.textPrimary }}
              labelFormatter={(m) => `Month ${m}`}
            />
            <Legend
              wrapperStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            />
            {/* Stacked composition areas on the left axis */}
            {data.composition.map((layer) => (
              <Area
                key={layer.label}
                yAxisId="left"
                dataKey={layer.label}
                type="monotone"
                stackId="composition"
                stroke={layer.color}
                fill={layer.color}
                fillOpacity={0.45}
                isAnimationActive={false}
              />
            ))}
            {/* Severity overlay on the right axis · stronger stroke */}
            <Line
              yAxisId="right"
              dataKey="severity"
              type="monotone"
              stroke="#FF6B4A"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#FF6B4A' }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
              name="Severity without intervention"
            />
            {/* Reference line · decision-gate annotation */}
            <ReferenceLine
              yAxisId="right"
              x={annotationX}
              stroke="#F5C54A"
              strokeDasharray="4 4"
              label={{
                value: data.timeline.annotation.label,
                position: 'insideTopLeft',
                fill: '#F5C54A',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                offset: 10,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Body size="sm" tone="secondary" style={{ fontStyle: 'italic', maxWidth: 820, lineHeight: 1.6 }}>
          {data.caption}
        </Body>
        <Link
          href={data.evidenceLink}
          style={{
            alignSelf: 'flex-start',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: COLORS.teal,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          View evidence →
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${data.captionTiles.length}, minmax(0, 1fr))`,
          gap: 10,
          paddingTop: 14,
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {data.captionTiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            style={tileStyle}
            className="pattern-impact-tile"
          >
            <MetaLabel style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(45,212,200,0.85)' }}>
              {tile.label}
            </MetaLabel>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .pattern-impact-tile {
          transition: background-color 150ms ease-out, border-color 150ms ease-out;
        }
        .pattern-impact-tile:hover {
          background: rgba(45,212,200,0.08) !important;
          border-color: rgba(45,212,200,0.4) !important;
        }
        @media (max-width: 640px) {
          section[aria-labelledby^="impact-viz-"] > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const tileStyle: CSSProperties = {
  display: 'block',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.02)',
  border: '0.5px solid rgba(45,212,200,0.2)',
  borderRadius: 10,
  textDecoration: 'none',
  color: COLORS.textPrimary,
};
