'use client';

import type { NexusTurnPayload } from '@/lib/intelligence/types';

export function RankedList({ payload }: { payload: NexusTurnPayload }) {
  return (
    <div className="intel-format-block">
      {payload.hero ? <div className="intel-title" style={{ fontSize: 30 }}>{payload.hero}</div> : null}
      <div className="intel-stack" style={{ gap: 10 }}>
        {(payload.items ?? []).map((item, index) => (
          <div key={`${item.title}-${index}`} className="intel-card-soft intel-section">
            <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>{index + 1}. {item.title}</div>
              {item.confidence ? <span className="intel-chip mono">{item.confidence}</span> : null}
            </div>
            <div className="intel-subtle" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>{item.rationale}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
