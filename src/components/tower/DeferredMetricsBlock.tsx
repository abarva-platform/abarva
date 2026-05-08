// TOWER · T-4 — "Coming next" footer block.
//
// Per the Wireframe Addendum (locked 2026-05-07): a small block listing
// metrics deferred per the Load Path Manifest, rendered above the existing
// doctrine line. Subdued background, small typography, one-line per item.
//
// Server component (no client state). Reads from the deterministic
// deferred-metrics manifest. Renders nothing if the view has no deferred
// metrics — keeping the doctrine line as the natural anchor for views
// where the substrate is fully covered.

import { listDeferredMetrics, type DeferredMetricView } from '@/lib/tower/deferred-metrics';

const C = {
  cream: '#ffffff',
  card: '#FFFFFF',
  ink: '#0A0C12',
  inkMuted: '#525866',
  inkSoft: '#6b7280',
  border: '#E8E6E1',
  gold: '#A57C2D',
} as const;

interface DeferredMetricsBlockProps {
  view: DeferredMetricView;
}

export function DeferredMetricsBlock({ view }: DeferredMetricsBlockProps) {
  const items = listDeferredMetrics(view);
  if (items.length === 0) return null;

  return (
    <section
      data-testid="tower-deferred-metrics-block"
      data-view={view}
      style={{
        margin: '0 32px',
        padding: '14px 18px',
        background: C.cream,
        border: `1px dashed ${C.border}`,
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: C.gold,
          marginBottom: 10,
        }}
      >
        Coming next in this view
      </div>
      <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li
            key={item.key}
            data-testid={`tower-deferred-metric-${item.key}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '14px minmax(180px, 240px) 1fr',
              alignItems: 'baseline',
              columnGap: 12,
              padding: '4px 0',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              fontSize: 12,
              lineHeight: 1.5,
              color: C.inkMuted,
            }}
          >
            <span aria-hidden style={{ color: C.inkSoft, fontWeight: 700 }}>↳</span>
            <span style={{ color: C.ink, fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: C.inkMuted }}>{item.comingWhen}</span>
          </li>
        ))}
      </ul>
      <p
        style={{
          margin: '10px 0 0',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: 11,
          color: C.inkSoft,
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        Missing inputs read as invitations, not errors. Each prerequisite is the integration that
        unlocks the metric.
      </p>
    </section>
  );
}
