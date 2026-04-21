'use client';

import type { AtlasBenchmark } from '@/lib/atlas/types';

const INK = '#F8FAFC';
const MUTE = '#CBD5E1';
const SOFT = '#94A3B8';
const TEAL = '#14B8A6';
const ATLAS = '#F59E0B';

function formatValue(metricName: string, value: number | null): string {
  if (value == null) return 'n/a';
  if (metricName.includes('usd')) {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${Math.round(value)}`;
  }
  if (metricName.includes('pct')) return `${Math.round(value)}%`;
  return `${Math.round(value)}`;
}

export function CohortPeerVisualization({ benchmark }: { benchmark: AtlasBenchmark | null }) {
  if (!benchmark) {
    return (
      <div style={{ fontSize: 13, color: SOFT, lineHeight: 1.5 }}>
        Limited cohort data. Atlas can still explain the signal, but peer context is thin here.
      </div>
    );
  }

  const values = [
    ...benchmark.peers.map((peer) => peer.value),
    benchmark.apexValue ?? 0,
    benchmark.p50 ?? 0,
    benchmark.p75 ?? 0,
  ];
  const max = Math.max(...values, 1);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEAL,
            }}
          >
            Cohort context
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: MUTE }}>{benchmark.label ?? 'Peer group active'}</div>
        </div>
        <div style={{ fontSize: 12, color: SOFT }}>
          n={benchmark.sampleSize ?? benchmark.peers.length}
        </div>
      </div>

      {benchmark.apexValue != null && (
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            border: '0.5px solid rgba(245,158,11,0.28)',
            background: 'rgba(245,158,11,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: INK, fontWeight: 700 }}>Apex position</div>
            {benchmark.note && <div style={{ marginTop: 4, fontSize: 12, color: MUTE }}>{benchmark.note}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>{formatValue(benchmark.metricName, benchmark.apexValue)}</div>
            {benchmark.apexPercentile != null && (
              <div style={{ fontSize: 11, color: SOFT }}>{benchmark.apexPercentile}th percentile</div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {benchmark.peers.map((peer) => (
          <div key={peer.label} style={{ display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
              <span style={{ color: MUTE }}>{peer.label}</span>
              <span style={{ color: SOFT }}>{formatValue(benchmark.metricName, peer.value)}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(8, (peer.value / max) * 100)}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, rgba(20,184,166,0.48), rgba(37,99,235,0.6))',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {benchmark.p50 != null && (
          <span style={{ fontSize: 11, color: MUTE }}>median {formatValue(benchmark.metricName, benchmark.p50)}</span>
        )}
        {benchmark.p75 != null && (
          <span style={{ fontSize: 11, color: MUTE }}>p75 {formatValue(benchmark.metricName, benchmark.p75)}</span>
        )}
        {benchmark.apexValue != null && (
          <span style={{ fontSize: 11, color: ATLAS }}>Apex {formatValue(benchmark.metricName, benchmark.apexValue)}</span>
        )}
      </div>
    </div>
  );
}
