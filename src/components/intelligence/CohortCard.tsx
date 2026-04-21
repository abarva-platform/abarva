'use client';

import type { Source } from '@/lib/intelligence/types';

export function CohortCard({ sources }: { sources: Source[] }) {
  const emergent = sources.filter((source) => source.type === 'emergent');
  if (emergent.length === 0) return null;

  return (
    <div className="intel-cohort-card">
      <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="intel-chip mono magenta">Emergent cohort</div>
        <div className="intel-chip mono">n≥3 protected</div>
      </div>
      <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5 }}>
        Cross-client intelligence fired on this answer. Sources stayed anonymized and the UI only exposes cohort-safe citations.
      </div>
      <div className="intel-inline-list" style={{ marginTop: 12 }}>
        {emergent.slice(0, 3).map((source) => (
          <span key={source.id} className="intel-chip mono magenta">
            {source.name}
          </span>
        ))}
      </div>
    </div>
  );
}
