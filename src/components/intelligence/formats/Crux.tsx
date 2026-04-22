'use client';

import type { NexusTurnPayload } from '@/lib/intelligence/types';

export function Crux({ payload }: { payload: NexusTurnPayload }) {
  return (
    <div className="intel-format-block">
      {payload.hero ? <div className="intel-title" style={{ fontSize: 30 }}>{payload.hero}</div> : null}
      {payload.crux ? <div className="intel-crux"><strong>The crux.</strong> {payload.crux}</div> : null}
      {payload.branches?.length ? (
        <div className="intel-stack" style={{ gap: 10 }}>
          {payload.branches.map((branch) => (
            <div key={`${branch.verdict}-${branch.condition}`} className="intel-card-soft intel-section">
              <div className="intel-chip mono amber">{branch.confidence}</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>{branch.verdict}</div>
              <div className="intel-subtle" style={{ marginTop: 6, fontSize: 13 }}>{branch.condition}</div>
            </div>
          ))}
        </div>
      ) : null}
      {payload.tiebreaker ? (
        <div className="intel-tiebreaker">
          <strong>Tiebreaker.</strong> {payload.tiebreaker.question} · {payload.tiebreaker.resolver}
        </div>
      ) : null}
    </div>
  );
}
