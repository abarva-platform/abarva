// ADM4 · Dataset Explorer panel.
//
// Server component. Renders the deterministic ADM4 explorer view as
// an Apple-like surface: domain rollups (calm, drillable), with a
// collapsible "show all datasets" detail and an honest object-
// inspector placeholder.
//
// No live runtime, no Claude / OpenAI invocation. Imports restricted
// to next/link and the ADM4 view helper module.

import Link from 'next/link';
import {
  buildDatasetExplorerView,
  type DatasetExplorerDomainRollup,
  type DatasetExplorerView,
} from '@/lib/admin/dataset-explorer-view';
import type {
  DatasetEvidenceUsability,
  DatasetInventoryItem,
} from '@/lib/admin/dataset-domain-inventory';

interface DatasetExplorerPanelProps {
  view?: DatasetExplorerView;
}

const COLORS = {
  ink: '#0F0E0D',
  body: '#3D3B38',
  muted: '#5a5148',
  mutedSoft: '#9A958E',
  border: '#E8E6E3',
  borderSoft: '#F2F1F0',
  card: '#FFFFFF',
  surface: '#FAFAF9',
  surface2: '#F7F6F3',
  accent: '#0b4a91', // navy — replaced banned teal accent (ADMIN7)
  accentSoft: 'rgba(11,74,145,0.10)',
  amber: '#B45309',
  amberSoft: 'rgba(180,83,9,0.10)',
  red: '#C53030',
  redSoft: 'rgba(197,48,48,0.10)',
} as const;

const MONO = "'JetBrains Mono', 'Courier New', monospace";

export function DatasetExplorerPanel({ view }: DatasetExplorerPanelProps) {
  const resolved = view ?? buildDatasetExplorerView();
  return (
    <section
      aria-label="Dataset explorer"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderTop: `3px solid ${COLORS.accent}`,
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        color: COLORS.ink,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Dataset explorer · {resolved.summary.byDomain ? '12 domains' : 'no inventory'}
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            What is loaded · what is available · what is usable
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Stat label="loaded" value={String(resolved.totalLoadedAcrossDomains)} />
          <Stat label="available" value={String(resolved.summary.availableTotal)} />
          <Stat
            label="usable"
            value={String(resolved.totalUsableAcrossDomains)}
            tone={COLORS.accent}
          />
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {resolved.domains.map((d) => (
          <DomainRollupCard key={d.key} domain={d} />
        ))}
      </div>

      <details
        style={{
          background: COLORS.surface2,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: '10px 12px',
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: COLORS.muted,
          }}
        >
          Show all datasets · {resolved.inventory.items.length}
        </summary>
        <ul
          style={{
            margin: '10px 0 0',
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {resolved.inventory.items.map((it) => (
            <DatasetRow key={it.id} item={it} />
          ))}
        </ul>
      </details>

      <ObjectInspectorPlaceholder />

      <footer
        style={{
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
          paddingTop: 8,
          borderTop: `1px dashed ${COLORS.border}`,
        }}
      >
        {resolved.interpretationBasis}
      </footer>
    </section>
  );
}

// --- Sub-components --------------------------------------------------

function DomainRollupCard({ domain }: { domain: DatasetExplorerDomainRollup }) {
  const accent = statusAccent(domain.status);
  const accentBg = statusAccentBg(domain.status);
  return (
    <article
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            color: COLORS.mutedSoft,
            fontWeight: 700,
          }}
        >
          {String(domain.ordinal).padStart(2, '0')}
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 999,
            background: accentBg,
            color: accent,
          }}
        >
          {domain.status.replace(/_/g, ' ')}
        </span>
      </header>
      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.3,
          color: COLORS.ink,
        }}
      >
        {domain.name}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          fontFamily: MONO,
          fontSize: 11,
          color: COLORS.muted,
        }}
      >
        <Cell label="loaded" value={String(domain.loadedCount)} />
        <Cell label="avail" value={String(domain.availableCount)} />
        <Cell label="usable" value={String(domain.usableCount)} tone={COLORS.accent} />
      </div>
      {domain.blockedCount > 0 ? (
        <div style={{ fontSize: 11, color: COLORS.red }}>
          {domain.blockedCount} blocked
        </div>
      ) : null}
      {domain.orphanCount > 0 ? (
        <div style={{ fontSize: 11, color: COLORS.amber }}>
          {domain.orphanCount} orphan (no owner)
        </div>
      ) : null}
      {domain.topItem ? (
        <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic' }}>
          Top: {domain.topItem.name}
        </div>
      ) : null}
    </article>
  );
}

function DatasetRow({ item }: { item: DatasetInventoryItem }) {
  const usabilityAccent = evidenceAccent(item.evidenceUsabilityState);
  return (
    <li
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${usabilityAccent}`,
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontWeight: 600, color: COLORS.ink, fontSize: 13 }}>
          {item.name}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 999,
            background: COLORS.surface2,
            color: usabilityAccent,
          }}
        >
          {item.evidenceUsabilityState.replace(/_/g, ' ')}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 4,
          fontSize: 11,
          color: COLORS.muted,
          fontFamily: MONO,
        }}
      >
        <span>source · {item.sourceType}</span>
        <span>parse · {item.parseStatus}</span>
        <span>fresh · {item.freshnessState}</span>
        <span>scope · {item.tenantScope}</span>
        <span>owner · {item.owner ?? 'orphan'}</span>
        <span>connector · {item.connector ?? 'none'}</span>
      </div>
      {item.linkedPrograms.length > 0 ? (
        <div style={{ fontSize: 11, color: COLORS.muted }}>
          Linked programs:{' '}
          {item.linkedPrograms.map((p, i) => (
            <span key={p}>
              {i > 0 ? ', ' : ''}
              <Link
                href={`/tenant/${item.tenantScope}/programs`}
                style={{ color: COLORS.accent, textDecoration: 'none' }}
                data-dataset-program-link={p}
              >
                {p}
              </Link>
            </span>
          ))}
        </div>
      ) : null}
      {item.linkedPatterns.length > 0 ? (
        <div style={{ fontSize: 11, color: COLORS.muted }}>
          Linked patterns: {item.linkedPatterns.join(', ')}
        </div>
      ) : null}
      {item.missingMetadata.length > 0 ? (
        <div style={{ fontSize: 11, color: COLORS.amber }}>
          Missing: {item.missingMetadata.join(' · ')}
        </div>
      ) : null}
      <div style={{ fontSize: 11, color: COLORS.body, fontStyle: 'italic' }}>
        {item.stewardGuidance}
      </div>
      {item.agentsAllowedToUse.length > 0 ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {item.agentsAllowedToUse.map((a) => (
            <span
              key={a}
              style={{
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 999,
                background: COLORS.surface2,
                color: COLORS.muted,
              }}
            >
              {a}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: COLORS.mutedSoft }}>
          No agent allowed to use today.
        </div>
      )}
    </li>
  );
}

function ObjectInspectorPlaceholder() {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: COLORS.surface2,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 10,
        fontSize: 11,
        color: COLORS.mutedSoft,
        lineHeight: 1.55,
      }}
    >
      Object inspector slot · selecting a dataset will open the
      detail drawer once the inspector slice lands. Today the slot
      is honest and empty.
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 999,
        background: COLORS.surface2,
        color: tone ?? COLORS.body,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 700, color: tone ?? COLORS.ink }}>
        {value}
      </span>
      <span style={{ color: COLORS.mutedSoft }}>{label}</span>
    </span>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span
        style={{
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span style={{ fontWeight: 600, color: tone ?? COLORS.ink }}>{value}</span>
    </div>
  );
}

function statusAccent(status: string): string {
  switch (status) {
    case 'ready':
      return COLORS.accent;
    case 'partial':
      return COLORS.amber;
    case 'blocked':
      return COLORS.red;
    case 'not_started':
      return COLORS.mutedSoft;
    default:
      return COLORS.mutedSoft;
  }
}

function statusAccentBg(status: string): string {
  switch (status) {
    case 'ready':
      return COLORS.accentSoft;
    case 'partial':
      return COLORS.amberSoft;
    case 'blocked':
      return COLORS.redSoft;
    case 'not_started':
      return 'rgba(26,22,18,0.06)';
    default:
      return 'rgba(26,22,18,0.06)';
  }
}

function evidenceAccent(state: DatasetEvidenceUsability): string {
  switch (state) {
    case 'usable_as_evidence':
      return COLORS.accent;
    case 'quality_checked':
    case 'cited':
      return COLORS.accent;
    case 'blocked':
      return COLORS.red;
    case 'loaded':
    case 'parsed':
      return COLORS.amber;
    default:
      return COLORS.mutedSoft;
  }
}
