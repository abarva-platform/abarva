'use client';

import type { FoundationReadout as FoundationReadoutData } from '@/lib/intelligence/types';

export function FoundationReadout({
  foundation,
  loading,
  onNavigate,
}: {
  foundation: FoundationReadoutData | null;
  loading?: boolean;
  onNavigate?: (target: { kind: 'browser' | 'signals'; layer?: 'L1' | 'L2' | 'L3' | 'L4'; facet?: string | null }) => void;
}) {
  if (loading || !foundation) {
    return (
      <section className="intel-card intel-section">
        <div className="intel-eyebrow">Foundation readout</div>
        <div className="intel-empty intel-subtle">Loading the four-layer foundation…</div>
      </section>
    );
  }

  const metrics = [
    { label: 'Use cases', value: foundation.metrics.useCases, target: { kind: 'browser' as const, layer: 'L2' as const, facet: 'topic' } },
    { label: 'Vendors', value: foundation.metrics.vendors, target: { kind: 'browser' as const, layer: 'L1' as const, facet: 'vendor' } },
    { label: 'Contradictions', value: foundation.metrics.contradictions, target: { kind: 'signals' as const } },
    { label: 'Patterns', value: foundation.metrics.patterns, target: { kind: 'browser' as const, layer: 'L1' as const, facet: 'pattern' } },
    { label: 'Benchmarks', value: foundation.metrics.benchmarks, target: { kind: 'browser' as const, layer: 'L1' as const, facet: 'benchmark' } },
    { label: 'Programs', value: foundation.metrics.engagements, target: { kind: 'browser' as const, layer: 'L3' as const, facet: 'topic' } },
  ];

  return (
    <section className="intel-card intel-section">
      <div className="intel-foundation-header">
        <div className="intel-stack" style={{ gap: 10 }}>
          <div className="intel-eyebrow">Zone 1 · Foundation readout</div>
          <div className="intel-title">
            {foundation.client.name} is grounded enough to browse, not just ask.
          </div>
          <div className="intel-subtle" style={{ maxWidth: 720, fontSize: 15, lineHeight: 1.7 }}>
            The left rail should now be your primary navigation surface. These summary cards are here to orient you,
            then hand you into patterns, benchmarks, vendors, programs, and live contradictions.
          </div>
          <div className="intel-inline-list">
            <span className="intel-chip mono teal">{foundation.client.industry ?? 'tenant'}</span>
            <span className="intel-chip mono">viewer {foundation.user.role ?? 'pending'}</span>
            <span className="intel-chip mono">{foundation.layers.length} grounded layers</span>
            <span className="intel-chip mono">{new Date(foundation.asOf).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="intel-foundation-summary-card">
          <div className="intel-eyebrow">Client context</div>
          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>{foundation.client.name}</div>
          <div className="intel-subtle" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>
            {foundation.client.industry ?? 'Industry code pending'} · viewer {foundation.user.name ?? 'current user'}
          </div>
          <div className="intel-inline-list" style={{ marginTop: 12 }}>
            <span className="intel-chip mono teal">L4 viewer</span>
            <span className="intel-chip mono">L3 programs</span>
            <span className="intel-chip mono">L2 enterprise</span>
            <span className="intel-chip mono">L1 public</span>
          </div>
        </div>
      </div>

      <div className="intel-foundation-architecture" style={{ marginTop: 16 }}>
        {foundation.layers.map((layer) => (
          <button
            key={layer.key}
            type="button"
            className="intel-layer-row intel-layer-button"
            onClick={() => onNavigate?.({ kind: 'browser', layer: layer.key as 'L1' | 'L2' | 'L3' | 'L4', facet: layer.key === 'L1' ? null : 'topic' })}
          >
            <span className="intel-chip mono teal">{layer.key}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{layer.label}</div>
              <div className="intel-subtle" style={{ fontSize: 12 }}>
                {layer.key === 'L4'
                  ? foundation.user.name ?? 'Current viewer'
                  : layer.key === 'L3'
                    ? `${foundation.metrics.engagements} active programs`
                    : layer.key === 'L2'
                      ? `${foundation.client.industry ?? 'Enterprise'} context`
                      : 'Patterns, vendors, benchmarks, regulations'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{layer.count}</div>
              <div className="intel-dim" style={{ fontSize: 11 }}>
                {layer.asOf ? 'fresh' : 'live'}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="intel-foundation-metrics" style={{ marginTop: 16 }}>
        {metrics.map((metric) => (
          <button
            key={metric.label}
            type="button"
            className="intel-card-soft intel-section intel-metric-button"
            onClick={() => onNavigate?.(metric.target)}
          >
            <div className="intel-eyebrow">{metric.label}</div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{metric.value}</div>
            <div className="intel-subtle" style={{ fontSize: 12 }}>
              open the matching browse lane
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
