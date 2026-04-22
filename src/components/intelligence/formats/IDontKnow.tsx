'use client';

import type { NexusTurnPayload } from '@/lib/intelligence/types';

export function IDontKnow({ payload }: { payload: NexusTurnPayload }) {
  return (
    <div className="intel-format-block">
      <div className="intel-chip mono">boundary</div>
      <div className="intel-title" style={{ fontSize: 28 }}>I don’t know this cleanly yet.</div>
      {payload.why_dont_know ? <div style={{ fontSize: 14, lineHeight: 1.6 }}>{payload.why_dont_know}</div> : null}
      {payload.who_would_know ? <div className="intel-subtle" style={{ fontSize: 13 }}>{payload.who_would_know}</div> : null}
    </div>
  );
}
