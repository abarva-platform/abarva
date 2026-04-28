import {
  buildKnowledgeFabricHealthPanelView,
  type KnowledgeFabricHealthPanelView,
} from '@/lib/intelligence/knowledge-fabric-health-view';

const C = {
  card: '#FFFFFF',
  ink: '#0A0C12',
  muted: '#525866',
  mutedSoft: '#9AA3B2',
  border: '#E8E6E1',
  navy: '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.08)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.08)',
} as const;

interface KnowledgeFabricHealthPanelProps {
  view?: KnowledgeFabricHealthPanelView;
}

export function KnowledgeFabricHealthPanel({
  view = buildKnowledgeFabricHealthPanelView(),
}: KnowledgeFabricHealthPanelProps) {
  return (
    <section
      aria-label="Knowledge fabric health"
      data-component="KnowledgeFabricHealthPanel"
      data-created-from={view.createdFrom}
      style={{
        padding: '14px 18px',
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.navy}`,
        borderRadius: 6,
        display: 'grid',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.mutedSoft,
            }}
          >
            {view.eyebrow}
          </div>
          <h3 style={{ margin: 0, fontSize: 14, color: C.ink }}>{view.title}</h3>
        </div>
        <span
          style={{
            alignSelf: 'flex-start',
            borderRadius: 999,
            padding: '4px 8px',
            backgroundColor: C.navySoft,
            color: C.navy,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {view.statusLabel}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
        {view.summary}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 8,
        }}
      >
        {view.metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '10px 12px',
              backgroundColor: 'rgba(27,43,92,0.03)',
            }}
          >
            <div style={{ fontSize: 10, color: C.mutedSoft, marginBottom: 4 }}>
              {metric.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
              {metric.value}
            </div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
              {metric.detail}
            </div>
          </div>
        ))}
      </div>

      {view.gaps.length > 0 && (
        <div
          aria-label="Knowledge fabric coverage gaps"
          style={{
            display: 'grid',
            gap: 6,
            padding: '10px 12px',
            backgroundColor: C.amberSoft,
            border: `1px solid ${C.amber}44`,
            borderRadius: 6,
          }}
        >
          {view.gaps.slice(0, 3).map((gap) => (
            <div key={gap.id} style={{ fontSize: 11, color: C.ink, lineHeight: 1.45 }}>
              <strong>{gap.label}</strong> · {gap.rationale}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 4 }}>
        {view.caveats.map((caveat) => (
          <div key={caveat} style={{ fontSize: 10, color: C.muted }}>
            {caveat}
          </div>
        ))}
        <div style={{ fontSize: 10, color: C.muted }}>{view.disclaimer}</div>
      </div>
    </section>
  );
}
