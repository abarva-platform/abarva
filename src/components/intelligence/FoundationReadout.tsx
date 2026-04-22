'use client';

import type { FoundationReadout as FoundationReadoutData } from '@/lib/intelligence/types';

type ReadoutJump =
  | { kind: 'browser'; layer: 'L1' | 'L2' | 'L3' | 'L4'; facet: string | null }
  | { kind: 'signals' };

export function FoundationReadout({
  foundation,
  loading,
  onJump,
}: {
  foundation: FoundationReadoutData | null;
  loading?: boolean;
  onJump: (jump: ReadoutJump) => void;
}) {
  if (loading || !foundation) {
    return (
      <section className="intel-card intel-section">
        <div className="intel-eyebrow">Foundation readout</div>
        <div className="intel-empty intel-subtle">Loading the four-layer foundation…</div>
      </section>
    );
  }

  const metrics: Array<{ label: string; value: number; jump: ReadoutJump }> = [
    { label: 'Use cases', value: foundation.metrics.useCases, jump: { kind: 'browser', layer: 'L2', facet: 'use_case' } },
    { label: 'Vendors', value: foundation.metrics.vendors, jump: { kind: 'browser', layer: 'L1', facet: 'vendor' } },
    { label: 'Contradictions', value: foundation.metrics.contradictions, jump: { kind: 'signals' } },
    { label: 'Patterns', value: foundation.metrics.patterns, jump: { kind: 'browser', layer: 'L1', facet: 'pattern' } },
    { label: 'Benchmarks', value: foundation.metrics.benchmarks, jump: { kind: 'browser', layer: 'L1', facet: 'benchmark' } },
    { label: 'Programs', value: foundation.metrics.engagements, jump: { kind: 'browser', layer: 'L3', facet: 'program' } },
  ];

  return (
    <section className="intel-card intel-section">
      <div className="intel-foundation-readout">
        <div className="intel-stack">
          <div className="intel-eyebrow">Zone 1 · Foundation readout</div>
          <div className="intel-title">
            {foundation.client.name} is already grounded as a working context.
          </div>
          <div className="intel-subtle" style={{ maxWidth: 620 }}>
            Before the first question, this workspace already has a viewer lock, live programs, enterprise facts, and public foundation material that can be opened or challenged.
          </div>
          <div className="intel-foundation-architecture">
            {foundation.layers.map((layer) => (
              <button
                key={layer.key}
                type="button"
                className="intel-layer-row intel-layer-button"
                onClick={() =>
                  onJump({
                    kind: 'browser',
                    layer: layer.key,
                    facet:
                      layer.key === 'L1'
                        ? 'pattern'
                        : layer.key === 'L2'
                          ? 'use_case'
                          : layer.key === 'L3'
                            ? 'program'
                            : 'viewer',
                  })
                }
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
            {metrics.map((metric) => (
              <button
                key={metric.label}
                type="button"
                className="intel-card-soft intel-section intel-foundation-metric-button"
                onClick={() => onJump(metric.jump)}
              >
                <div className="intel-eyebrow">{metric.label}</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{metric.value}</div>
                <div className="intel-subtle" style={{ fontSize: 12 }}>
                  browse
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
