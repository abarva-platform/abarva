import type {
  IntelligenceSourceBasisPanelRow,
  IntelligenceSourceBasisPanelView,
} from '@/lib/intelligence/intelligence-source-basis-panel-view';

interface IntelligenceSourceBasisPanelProps {
  view: IntelligenceSourceBasisPanelView;
}

const COLORS = {
  ink: '#1a1612',
  muted: '#5a5148',
  mutedSoft: '#8a7e72',
  border: 'rgba(26,22,18,0.08)',
  card: '#FFFFFF',
  surface: '#F8F7F4',
  internal: '#0E9F8C',
  external: '#D97706',
} as const;

export function IntelligenceSourceBasisPanel({ view }: IntelligenceSourceBasisPanelProps) {
  if (view.totalBases === 0) return null;

  return (
    <section
      aria-label="Intelligence source basis"
      style={{
        padding: '14px 16px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <header>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Source basis · {view.patternKey}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 18,
            color: COLORS.ink,
          }}
        >
          Internal and external basis
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
          {view.internalCount} internal · {view.externalCount} external · {view.totalBases} total basis rows.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        <BasisColumn
          title={`Internal basis · ${view.internalCount}`}
          accent={COLORS.internal}
          rows={view.internalRows}
        />
        <BasisColumn
          title={`External basis · ${view.externalCount}`}
          accent={COLORS.external}
          rows={view.externalRows}
        />
      </div>

      <footer style={{ fontSize: 11, color: COLORS.mutedSoft, fontStyle: 'italic' }}>
        {view.honestDisclaimer}
      </footer>
    </section>
  );
}

function BasisColumn({
  title,
  accent,
  rows,
}: {
  title: string;
  accent: string;
  rows: IntelligenceSourceBasisPanelRow[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3
        style={{
          margin: 0,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: accent,
          fontWeight: 700,
        }}
      >
        {title}
      </h3>
      {rows.map((row) => (
        <article
          key={row.id}
          style={{
            padding: 10,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <strong style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.4 }}>
              {row.label}
            </strong>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: accent,
                fontWeight: 700,
              }}
            >
              {row.confidenceLabel}
            </span>
          </div>
          <span style={{ fontSize: 11, color: COLORS.mutedSoft }}>
            {row.kindLabel}
          </span>
          <p style={{ margin: 0, fontSize: 12, color: COLORS.muted, lineHeight: 1.45 }}>
            {row.rationale}
          </p>
          <code style={{ fontSize: 10, color: COLORS.mutedSoft }}>
            {row.citationLocator}
          </code>
        </article>
      ))}
    </div>
  );
}
