'use client';

import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
import { COLORS } from '@/lib/design-system';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';

// Fix Spec v4 §9 · GenomeSuccessRateBars.
//
// Visualises intervention success rates across pattern degree levels with
// n-observation callouts. Complements PatternImpactViz (impact magnitude)
// by surfacing "what works" next to "what's at stake".

export type PatternDegree = 'first' | 'second' | 'third';

export interface InterventionSuccessRate {
  degree: PatternDegree;
  interventionName: string;
  successRate: number;      // 0-1
  observationCount: number;
  evidenceLink?: string;
}

interface Props {
  interventions: InterventionSuccessRate[];
  // Rendered in the annotation line below the chart.
  totalObservations?: number;
  familyDescription?: string;
}

const DEGREE_LABELS: Record<PatternDegree, string> = {
  first: 'First degree',
  second: 'Second degree',
  third: 'Third degree',
};

const DEGREE_COLORS: Record<PatternDegree, string> = {
  first: '#2DD4C8',
  second: '#5EEBE0',
  third: '#8FF1E8',
};

export function GenomeSuccessRateBars({ interventions, totalObservations, familyDescription }: Props) {
  // Recharts expects chart data as an array of objects · transform with
  // pct value and color per row.
  const chartData = interventions.map((i) => ({
    degree: DEGREE_LABELS[i.degree],
    successPct: Math.round(i.successRate * 100),
    n: i.observationCount,
    name: i.interventionName,
    color: DEGREE_COLORS[i.degree],
    evidenceLink: i.evidenceLink,
  }));

  return (
    <section
      aria-label="Intervention success rates by degree"
      style={{
        padding: 24,
        background: 'rgba(255,255,255,0.02)',
        border: '0.5px solid rgba(45,212,200,0.18)',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <EyebrowLabel tone="teal" size="sm">RECOMMENDED INTERVENTIONS · GENOME EVIDENCE</EyebrowLabel>
        <div style={{ marginTop: 6, fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, color: COLORS.textPrimary, letterSpacing: '-0.005em' }}>
          Success rates by pattern degree · n-observations called out.
        </div>
      </div>

      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 80, left: 80, bottom: 8 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: 'rgba(245,245,240,0.55)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(v) => `${v}%`}
              stroke="rgba(255,255,255,0.15)"
            />
            <YAxis
              dataKey="degree"
              type="category"
              tick={{ fill: 'rgba(245,245,240,0.85)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              stroke="rgba(255,255,255,0.15)"
              width={110}
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((_v: unknown, _n: unknown, ctx: any) => {
                const payload = ctx?.payload as (typeof chartData)[number] | undefined;
                if (!payload) return ['', ''];
                return [`${payload.successPct}% · n=${payload.n}`, payload.name];
              }) as unknown as never}
            />
            <Bar dataKey="successPct" radius={[0, 6, 6, 0]}>
              {/* Per-degree color is applied via Cell, but we can hoist color directly via a function */}
              {chartData.map((entry) => (
                <Bar key={entry.degree} dataKey="successPct" fill={entry.color} />
              ))}
              <LabelList
                dataKey="successPct"
                position="right"
                formatter={((v: unknown) => `${Number(v ?? 0)}%`) as unknown as never}
                fill={COLORS.textPrimary}
                fontFamily="JetBrains Mono, monospace"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Intervention detail rows · intervention name + n */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {interventions.map((i) => (
          <li
            key={i.degree}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)',
              border: '0.5px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: DEGREE_COLORS[i.degree], letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {DEGREE_LABELS[i.degree]}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: COLORS.textPrimary, marginTop: 2 }}>
                {i.interventionName}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: COLORS.teal }}>
                {Math.round(i.successRate * 100)}%
              </span>
              <MetaLabel>n={i.observationCount}</MetaLabel>
              {i.evidenceLink ? (
                <Link href={i.evidenceLink} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: COLORS.teal, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Evidence →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {(totalObservations != null || familyDescription) ? (
        <MetaLabel style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,245,240,0.55)', alignSelf: 'flex-end' }}>
          Genome basis ·
          {totalObservations != null ? ` ${totalObservations} observations` : ''}
          {familyDescription ? ` · ${familyDescription}` : ''}
        </MetaLabel>
      ) : null}
    </section>
  );
}
