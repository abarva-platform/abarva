'use client';

import type { FoundationReadout as FoundationReadoutData } from '@/lib/intelligence/types';

type NavigateTarget = {
  section: 'patterns' | 'vendors' | 'contradictions' | 'ask' | 'layers';
  layer?: 'L1' | 'L2' | 'L3' | 'L4';
  facet?: string | null;
};

export function FoundationReadout({
  foundation,
  loading,
  onNavigate,
}: {
  foundation: FoundationReadoutData | null;
  loading?: boolean;
  onNavigate?: (target: NavigateTarget) => void;
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
  ] as const;

  const anchors = [
    {
      key: 'patterns',
      num: '01',
      title: 'Pattern gallery',
      description: 'Promoted patterns, candidate signals, and what the evidence base can really support.',
      target: { section: 'patterns' as const, layer: 'L1' as const, facet: 'pattern' },
    },
    {
      key: 'benchmarks',
      num: '02',
      title: 'Benchmark bench',
      description: 'Peer references, comparables, recency, and confidence without raw developer slugs.',
      target: { section: 'patterns' as const, layer: 'L1' as const, facet: 'benchmark' },
    },
    {
      key: 'vendors',
      num: '03',
      title: 'Vendor landscape',
      description: 'Named vendors, overlap, displacement pressure, and where spend is drifting.',
      target: { section: 'vendors' as const, layer: 'L1' as const, facet: 'vendor' },
    },
    {
      key: 'contradictions',
      num: '04',
      title: 'Contradictions',
      description: 'The strongest content in the product should have a dedicated, clickable home.',
      target: { section: 'contradictions' as const },
    },
    {
      key: 'layers',
      num: '05',
      title: 'Layer navigator',
      description: 'Switch L1–L4 as work modes instead of leaving the page every time you want detail.',
      target: { section: 'layers' as const },
    },
    {
      key: 'ask',
      num: '06',
      title: 'Ask AbarVa',
      description: 'Persistent composer, wrapped text, visible sources, and no leaked trace or backend markup.',
      target: { section: 'ask' as const },
    },
  ];

  return (
    <>
      <section className="intel-card intel-hero-section">
        <div className="intel-hero-grid">
          <div className="intel-stack">
            <div className="intel-eyebrow">Intelligence redesigned</div>
            <div className="intel-title intel-hero-title">
              {foundation.client.name} needs a workbench, not a dead library grid.
            </div>
            <div className="intel-subtle intel-hero-copy">
              This page should keep people in one surface: warm editorial context at the top, a persistent left rail for navigation,
              and deeper dark analysis bands only where the work needs focus and weight.
            </div>
            <div className="intel-row" style={{ marginTop: 8, gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="intel-button" onClick={() => onNavigate?.({ section: 'layers' })}>
                Open layer navigator
              </button>
              <button type="button" className="intel-button-outline" onClick={() => onNavigate?.({ section: 'ask' })}>
                Jump to Ask AbarVa
              </button>
            </div>
          </div>

          <div className="intel-card-soft intel-section intel-context-panel">
            <div className="intel-eyebrow">Client context</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{foundation.client.name}</div>
                <div className="intel-subtle" style={{ marginTop: 8, fontSize: 13 }}>
                  {foundation.client.industry ?? 'Industry pending'} · viewer {foundation.user.role ?? 'role pending'}
                </div>
              </div>
              <div className="intel-inline-list">
                <span className="intel-chip mono teal">L4 viewer</span>
                <span className="intel-chip mono">L3 programs</span>
                <span className="intel-chip mono">L2 enterprise</span>
                <span className="intel-chip mono">L1 public</span>
              </div>
            </div>

            <div className="intel-foundation-metrics" style={{ marginTop: 16 }}>
              {metrics.map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  className="intel-card-soft intel-section intel-metric-button"
                  onClick={() => {
                    if (label === 'Vendors') onNavigate?.({ section: 'vendors', layer: 'L1', facet: 'vendor' });
                    else if (label === 'Contradictions') onNavigate?.({ section: 'contradictions' });
                    else if (label === 'Patterns') onNavigate?.({ section: 'patterns', layer: 'L1', facet: 'pattern' });
                    else if (label === 'Benchmarks') onNavigate?.({ section: 'patterns', layer: 'L1', facet: 'benchmark' });
                    else if (label === 'Programs') onNavigate?.({ section: 'layers', layer: 'L3' });
                    else onNavigate?.({ section: 'layers', layer: 'L2' });
                  }}
                >
                  <div className="intel-eyebrow">{label}</div>
                  <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{value}</div>
                  <div className="intel-subtle" style={{ fontSize: 12 }}>
                    as of {new Date(foundation.asOf).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="intel-anchor-grid">
        {anchors.map((anchor) => (
          <button
            key={anchor.key}
            type="button"
            className="intel-anchor-card"
            onClick={() => onNavigate?.(anchor.target)}
          >
            <div className="intel-anchor-num">{anchor.num}</div>
            <div className="intel-anchor-title">{anchor.title}</div>
            <div className="intel-subtle" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.55 }}>
              {anchor.description}
            </div>
          </button>
        ))}
      </section>

      <section className="intel-card intel-section intel-foundation-summary-card">
        <div className="intel-foundation-header">
          <div className="intel-stack" style={{ gap: 14 }}>
            <div className="intel-eyebrow">Layer navigator</div>
            <div className="intel-title" style={{ maxWidth: 760 }}>
              One page, six sections, no dead-end clicks.
            </div>
            <div className="intel-subtle" style={{ maxWidth: 760 }}>
              The left rail should stay fixed while the center swaps content. Layer switching should feel like changing work modes, not leaving the page.
            </div>
          </div>

          <div className="intel-foundation-architecture">
            {foundation.layers.map((layer) => (
              <button
                key={layer.key}
                type="button"
                className="intel-layer-button"
                onClick={() => onNavigate?.({ section: 'layers', layer: layer.key })}
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
      </section>
    </>
  );
}
