'use client';

import type { AtlasEvidenceItem } from '@/lib/atlas/types';

const INK = '#F8FAFC';
const MUTE = '#CBD5E1';
const SOFT = '#94A3B8';
const TEAL = '#14B8A6';

function dollars(value: number | null): string | null {
  if (typeof value !== 'number') return null;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

export function EvidenceChainCard({ evidence }: { evidence: AtlasEvidenceItem }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        border: '0.5px solid rgba(148,163,184,0.18)',
        background: 'rgba(15,23,42,0.42)',
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
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
            {evidence.position}. {evidence.evidenceType.replace(/_/g, ' ')}
          </div>
          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: INK }}>{evidence.title}</div>
        </div>
        {evidence.confidence && (
          <div style={{ fontSize: 11, color: SOFT, whiteSpace: 'nowrap' }}>{evidence.confidence} confidence</div>
        )}
      </div>

      <div style={{ fontSize: 13, color: MUTE, lineHeight: 1.55 }}>{evidence.summary ?? 'No summary attached.'}</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {evidence.vendorName && (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '0.5px solid rgba(148,163,184,0.18)',
              fontSize: 11,
              color: INK,
            }}
          >
            {evidence.vendorName}
          </span>
        )}
        {dollars(evidence.amountUsd) && (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '0.5px solid rgba(20,184,166,0.28)',
              background: 'rgba(20,184,166,0.08)',
              fontSize: 11,
              color: INK,
            }}
          >
            {dollars(evidence.amountUsd)}
          </span>
        )}
        {typeof evidence.metricValue === 'number' && evidence.metricUnit && (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '0.5px solid rgba(148,163,184,0.18)',
              fontSize: 11,
              color: MUTE,
            }}
          >
            {evidence.metricValue} {evidence.metricUnit}
          </span>
        )}
      </div>
    </div>
  );
}
