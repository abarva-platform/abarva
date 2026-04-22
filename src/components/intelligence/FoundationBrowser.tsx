'use client';

import Link from 'next/link';

interface BrowserTile {
  id: string;
  label: string;
  count: number;
  active: boolean;
}

interface BrowserItem {
  id: string;
  title: string;
  subtitle: string | null;
  detail: string | null;
  href: string | null;
  sourceUrl: string | null;
}

const LAYERS = ['L1', 'L2', 'L3', 'L4'] as const;

export function FoundationBrowser({
  activeLayer,
  onLayerChange,
  tiles,
  items,
  onFacetChange,
}: {
  activeLayer: 'L1' | 'L2' | 'L3' | 'L4';
  onLayerChange: (layer: 'L1' | 'L2' | 'L3' | 'L4') => void;
  tiles: BrowserTile[];
  items: BrowserItem[];
  onFacetChange: (facet: string | null) => void;
}) {
  return (
    <section className="intel-card intel-section">
      <div className="intel-eyebrow">Zone 4 · Explore the foundation</div>
      <div className="intel-browser-tabs" style={{ marginTop: 14 }}>
        {LAYERS.map((layer) => (
          <button
            key={layer}
            type="button"
            className={`intel-chip mono ${activeLayer === layer ? 'teal' : ''}`}
            onClick={() => onLayerChange(layer)}
          >
            {layer}
          </button>
        ))}
      </div>
      <div className="intel-browser-tiles" style={{ marginTop: 14 }}>
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className={`intel-card-soft intel-section ${tile.active ? 'intel-chip teal' : ''}`}
            style={{ textAlign: 'left' }}
            onClick={() => onFacetChange(tile.active ? null : tile.id)}
          >
            <div className="intel-eyebrow">{tile.label}</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{tile.count}</div>
          </button>
        ))}
      </div>
      <div className="intel-browser-item-grid" style={{ marginTop: 14 }}>
        {items.length === 0 ? (
          <div className="intel-card-soft intel-section intel-subtle">
            This layer is intentionally sparse right now. Pick another tab or clear the facet.
          </div>
        ) : (
          items.slice(0, 12).map((item) => {
            const href = item.href ?? item.sourceUrl ?? '#';
            const external = !!item.sourceUrl && !item.href;
            return (
              <Link
                key={item.id}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className="intel-browser-item"
              >
                <div style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</div>
                {item.subtitle ? <div className="intel-subtle" style={{ marginTop: 6, fontSize: 12 }}>{item.subtitle}</div> : null}
                {item.detail ? <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5 }}>{item.detail}</div> : null}
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
