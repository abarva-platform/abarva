'use client';

import type { NexusTurnPayload } from '@/lib/intelligence/types';

export function CounterPair({ payload }: { payload: NexusTurnPayload }) {
  return (
    <div className="intel-format-block">
      <div className="intel-chip mono red">counter-argument</div>
      {payload.hero ? <div className="intel-title" style={{ fontSize: 30 }}>{payload.hero}</div> : null}
      {payload.answer ? <div style={{ fontSize: 14, lineHeight: 1.6 }}>{payload.answer}</div> : null}
      {payload.counter_card ? (
        <div className="intel-card-soft intel-section" style={{ borderColor: 'rgba(255,107,74,0.3)' }}>
          <div style={{ fontWeight: 700 }}>{payload.counter_card.hero ?? 'Counter'}</div>
          {payload.counter_card.answer ? <div className="intel-subtle" style={{ marginTop: 8, fontSize: 13 }}>{payload.counter_card.answer}</div> : null}
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
