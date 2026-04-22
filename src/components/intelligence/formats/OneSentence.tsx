'use client';

import type { NexusTurnPayload } from '@/lib/intelligence/types';

export function OneSentence({ payload }: { payload: NexusTurnPayload }) {
  return (
    <div className="intel-format-block">
      {payload.hero ? <div className="intel-title" style={{ fontSize: 30 }}>{payload.hero}</div> : null}
      {payload.answer ? <div style={{ fontSize: 15, lineHeight: 1.6 }}>{payload.answer}</div> : null}
    </div>
  );
}
