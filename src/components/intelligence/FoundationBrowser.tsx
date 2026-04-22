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

const LAYER_COPY: Record<(typeof LAYERS)[number], { title: string; description: string }> = {
  L1: {
    title: 'Public foundation',
    description: 'Patterns, benchmarks, vendors, research, and reusable context that should anchor the top-level browse experience.',
  },
  L2: {
    title: 'Enterprise lens',
    description: 'Tenant-specific topics and operating context that should feel like the main working catalog for leaders inside the account.',
  },
  L3: {
    title: 'Program layer',
    description: 'Program-linked topics and scoped material that helps an operator move from general context into a live program.',
  },
  L4: {
    title: 'Viewer layer',
    description: 'The viewer context is grounded, but it does not yet expose its own browse catalog. Use the ask bar to go deeper.',
  },
};

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
    <section className="intel-card intel-section intel-browser-workbench" id="intel-browser">
      <aside className="intel-browser-sidebar">
        <div className="intel-eyebrow">Zone 4 · Explore the foundation</div>
        <div style={{ marginTop: 10, fontFamily: 'var(--intel-serif)', fontSize: 28, lineHeight: 1.02, letterSpacing: '-0.02em' }}>
          Browse the intelligence stack from a real left rail.
        </div>
        <div className="intel-subtle" style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7 }}>
          Layers and facets belong in the rail. Results belong in the main workbench.
        </div>

        <div className="intel-browser-sidebar-group">
          <div className="intel-eyebrow" style={{ color: 'var(--intel-dim)' }}>Layers</div>
          <div className="intel-browser-rail-list">
            {LAYERS.map((layer) => (
              <button
                key={layer}
                type="button"
                className={`intel-browser-rail-item ${activeLayer === layer ? 'active' : ''}`}
                onClick={() => onLayerChange(layer)}
              >
                <span className={`intel-chip mono ${activeLayer === layer ? 'teal' : ''}`}>{layer}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{LAYER_COPY[layer].title}</div>
                  <div className="intel-subtle" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                    {LAYER_COPY[layer].description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="intel-browser-sidebar-group">
          <div className="intel-eyebrow" style={{ color: 'var(--intel-dim)' }}>Facets</div>
          <div className="intel-browser-rail-list">
            {tiles.length === 0 ? (
              <div className="intel-card-soft intel-section intel-subtle">
                This layer has no browseable facet groups yet.
              </div>
            ) : (
              tiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  className={`intel-browser-rail-item ${tile.active ? 'active' : ''}`}
                  onClick={() => onFacetChange(tile.active ? null : tile.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, width: '100%', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{tile.label}</span>
                    <span className={`intel-chip mono ${tile.active ? 'teal' : ''}`}>{tile.count}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      <div className="intel-browser-main">
        <div className="intel-browser-main-header">
          <div>
            <div className="intel-eyebrow">{LAYER_COPY[activeLayer].title}</div>
            <div style={{ marginTop: 8, fontSize: 26, fontWeight: 700 }}>
              {tiles.find((tile) => tile.active)?.label
                ? `${tiles.find((tile) => tile.active)?.label} library`
                : `${LAYER_COPY[activeLayer].title} inventory`}
            </div>
            <div className="intel-subtle" style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, maxWidth: 720 }}>
              {tiles.find((tile) => tile.active)?.label
                ? `Showing items for ${tiles.find((tile) => tile.active)?.label}. Clear the facet or switch layers from the rail to move across the knowledge stack.`
                : LAYER_COPY[activeLayer].description}
            </div>
          </div>
          <div className="intel-inline-list">
            <span className="intel-chip mono teal">{activeLayer}</span>
            <span className="intel-chip mono">{items.length} items</span>
            {tiles.find((tile) => tile.active)?.label ? (
              <button type="button" className="intel-button-outline" onClick={() => onFacetChange(null)}>
                Clear facet
              </button>
            ) : null}
          </div>
        </div>

        <div className="intel-browser-item-grid intel-browser-results">
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
                  {item.detail ? <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>{item.detail}</div> : null}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
