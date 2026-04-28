import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

interface IntelligenceProvenanceRibbonProps {
  view: IntelligenceProvenanceRibbonView;
}

const COLORS = {
  ink: '#1a1612',
  muted: '#5a5148',
  border: 'rgba(26,22,18,0.08)',
  surface: '#F8F7F4',
  accent: '#0E9F8C',
} as const;

export function IntelligenceProvenanceRibbon({ view }: IntelligenceProvenanceRibbonProps) {
  const items = [
    { label: 'Primitive', value: view.primitive },
    { label: 'Source', value: view.sourceLabel.replace(/_/g, ' ') },
    { label: 'Store binding', value: view.storeBinding },
    { label: 'Signals', value: `${view.signalCount} seeded signal id(s)` },
    { label: 'Programs', value: `${view.programCount} affected program route(s)` },
    { label: 'Citations', value: view.citationReadinessLabel.replace(/_/g, ' ') },
    { label: 'Runtime', value: view.runtimeLabel },
  ];

  return (
    <aside
      aria-label="Intelligence provenance ribbon"
      style={{
        padding: '10px 12px',
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${COLORS.accent}`,
        borderRadius: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 8,
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.muted,
              fontWeight: 700,
            }}
          >
            {item.label}
          </span>
          <span style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.4 }}>
            {item.value}
          </span>
        </div>
      ))}
    </aside>
  );
}
