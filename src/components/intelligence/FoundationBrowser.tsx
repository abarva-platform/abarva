'use client';

import Link from 'next/link';

interface BrowserTile {
  id: string;
  label: string;
  count: number;
  active: boolean;
  support: 'published' | 'generated' | 'empty';
}

interface BrowserItem {
  id: string;
  title: string;
  subtitle: string | null;
  detail: string | null;
  href: string | null;
  sourceUrl: string | null;
  actionLabel: string | null;
  support: 'published' | 'generated' | 'reference';
}

const LAYERS = ['L1', 'L2', 'L3', 'L4'] as const;

export function FoundationBrowser({
  activeLayer,
  onLayerChange,
  title,
  description,
  emptyState,
  tiles,
  items,
  onFacetChange,
}: {
  activeLayer: 'L1' | 'L2' | 'L3' | 'L4';
  onLayerChange: (layer: 'L1' | 'L2' | 'L3' | 'L4') => void;
  title: string;
  description: string;
  emptyState: string;
  tiles: BrowserTile[];
  items: BrowserItem[];
  onFacetChange: (facet: string | null) => void;
}) {
  return (
    <section className="intel-card intel-section">
      <div className="intel-eyebrow">Zone 4 · Browse what is actually grounded</div>
      <div className="intel-browser-layout" style={{ marginTop: 16 }}>
        <aside className="intel-browser-rail">
          <div className="intel-browser-rail-group">
            <div className="intel-browser-rail-label">Layers</div>
            <div className="intel-stack" style={{ gap: 8 }}>
              {LAYERS.map((layer) => (
                <button
                  key={layer}
                  type="button"
                  className={`intel-browser-rail-button ${activeLayer === layer ? 'active' : ''}`}
                  onClick={() => onLayerChange(layer)}
                >
                  <span className={`intel-chip mono ${activeLayer === layer ? 'teal' : ''}`}>{layer}</span>
                  <span>{layer === 'L1' ? 'Public' : layer === 'L2' ? 'Enterprise' : layer === 'L3' ? 'Programs' : 'Viewer'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="intel-browser-rail-group">
            <div className="intel-browser-rail-label">Sections</div>
            <div className="intel-stack" style={{ gap: 8 }}>
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  className={`intel-browser-rail-button ${tile.active ? 'active' : ''}`}
                  onClick={() => onFacetChange(tile.id)}
                  disabled={tile.count === 0}
                >
                  <span>{tile.label}</span>
                  <span className="intel-browser-rail-meta">
                    {tile.count}
                    <span className={`intel-browser-support ${tile.support}`}>{tile.support === 'generated' ? 'AI' : tile.support === 'empty' ? '—' : 'live'}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="intel-browser-main">
          <div className="intel-browser-header">
            <div>
              <div className="intel-title" style={{ fontSize: 'clamp(24px, 2.4vw, 34px)' }}>{title}</div>
              <div className="intel-subtle" style={{ marginTop: 8, maxWidth: 760, fontSize: 15, lineHeight: 1.65 }}>
                {description}
              </div>
            </div>
            <div className="intel-browser-summary-card">
              <div className="intel-eyebrow">Support</div>
              <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.65 }}>
                Detail pages open only where we have a real route. Everything else either opens the original source or lands in Ask Intelligence with the right context.
              </div>
            </div>
          </div>

          <div className="intel-browser-tile-row">
            {tiles.map((tile) => (
              <button
                key={tile.id}
                type="button"
                className={`intel-browser-stat ${tile.active ? 'active' : ''}`}
                onClick={() => onFacetChange(tile.id)}
                disabled={tile.count === 0}
              >
                <div className="intel-eyebrow">{tile.label}</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{tile.count}</div>
              </button>
            ))}
          </div>

      <div className="intel-browser-item-grid" style={{ marginTop: 16 }}>
        {items.length === 0 ? (
          <div className="intel-card-soft intel-section intel-subtle">
            {emptyState}
          </div>
        ) : (
          items.slice(0, 12).map((item) => {
            const href = item.href ?? item.sourceUrl;
            const external = !!item.sourceUrl && !item.href;
            const body = (
              <>
                <div className="intel-inline-list" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`intel-chip mono ${item.support === 'published' ? 'teal' : item.support === 'generated' ? 'amber' : 'blue'}`}>
                    {item.support === 'published' ? 'detail' : item.support === 'generated' ? 'generated' : 'reference'}
                  </span>
                  {item.actionLabel ? (
                    <span className="intel-browser-item-cta">
                      {item.actionLabel} →
                    </span>
                  ) : null}
                </div>
                <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, lineHeight: 1.35 }}>{item.title}</div>
                {item.subtitle ? <div className="intel-subtle" style={{ marginTop: 6, fontSize: 13 }}>{item.subtitle}</div> : null}
                {item.detail ? <div className="intel-browser-item-detail">{item.detail}</div> : null}
              </>
            );

            return href ? (
              <Link
                key={item.id}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className="intel-browser-item"
              >
                {body}
              </Link>
            ) : (
              <div key={item.id} className="intel-browser-item intel-browser-item-static">
                {body}
              </div>
            );
          })
        )}
      </div>
        </div>
      </div>
    </section>
  );
}
