'use client';

import type { FoundationReadout as FoundationReadoutData } from '@/lib/intelligence/types';

export function FoundationReadout({
  foundation,
  loading,
}: {
  foundation: FoundationReadoutData | null;
  loading?: boolean;
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
    ['Use cases', foundation.metrics.useCases],
    ['Vendors', foundation.metrics.vendors],
    ['Contradictions', foundation.metrics.contradictions],
    ['Patterns', foundation.metrics.patterns],
    ['Benchmarks', foundation.metrics.benchmarks],
    ['Programs', foundation.metrics.engagements],
  ];

  return (
    <section className="intel-card intel-section">
      <div className="intel-foundation-readout">
        <div className="intel-stack">
          <div className="intel-eyebrow">Zone 1 · Foundation readout</div>
          <div className="intel-title">
            AbarVa already knows the shape of {foundation.client.name}.
          </div>
          <div className="intel-subtle" style={{ maxWidth: 620 }}>
            Four layers are already grounded before the first question: user context, programs, enterprise facts, and the public foundation.
          </div>
          <div className="intel-foundation-architecture">
            {foundation.layers.map((layer) => (
              <div key={layer.key} className="intel-layer-row">
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
              </div>
            ))}
          </div>
        </div>

        <div className="intel-stack">
          <div className="intel-card-soft intel-section">
            <div className="intel-eyebrow">Client context</div>
            <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{foundation.client.name}</div>
                <div className="intel-subtle" style={{ fontSize: 13 }}>
                  {foundation.client.industry ?? 'Industry code pending'} · viewer {foundation.user.role ?? 'role pending'}
                </div>
              </div>
              <div className="intel-inline-list">
                <span className="intel-chip mono teal">L4 viewer</span>
                <span className="intel-chip mono">L3 programs</span>
                <span className="intel-chip mono">L2 enterprise</span>
                <span className="intel-chip mono">L1 public</span>
              </div>
            </div>
          </div>

          <div className="intel-foundation-metrics">
            {metrics.map(([label, value]) => (
              <div key={label} className="intel-card-soft intel-section">
                <div className="intel-eyebrow">{label}</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{value}</div>
                <div className="intel-subtle" style={{ fontSize: 12 }}>
                  as of {new Date(foundation.asOf).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
