'use client';

import type { FoundationReadout as FoundationReadoutData } from '@/lib/intelligence/types';

export function FoundationStrip({
  foundation,
  onExpand,
}: {
  foundation: FoundationReadoutData | null;
  onExpand: () => void;
}) {
  if (!foundation) return null;

  return (
    <section className="intel-card intel-section" style={{ paddingTop: 12, paddingBottom: 12 }}>
      <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="intel-row" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1, marginRight: 12 }}>
            <span style={{ fontFamily: 'var(--intel-serif)', fontSize: 18, fontWeight: 700 }}>Abar</span>
            <span style={{ fontFamily: 'var(--intel-serif)', fontSize: 23, fontWeight: 900, color: 'var(--intel-teal)' }}>Va</span>
          </div>
          {foundation.layers.map((layer) => (
            <span key={layer.key} className="intel-chip mono">
              {layer.key} · {layer.count}
            </span>
          ))}
        </div>
        <button type="button" className="intel-button-ghost" onClick={onExpand}>
          Expand foundation
        </button>
      </div>
    </section>
  );
}
