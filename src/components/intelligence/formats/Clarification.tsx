'use client';

import type { NexusTurnPayload } from '@/lib/intelligence/types';

export function Clarification({
  payload,
  onOptionTap,
}: {
  payload: NexusTurnPayload;
  onOptionTap?: (option: string) => void;
}) {
  return (
    <div className="intel-format-block">
      <div className="intel-crux">
        <div className="intel-chip mono amber">clarifying question</div>
        <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>{payload.question}</div>
      </div>
      <div className="intel-inline-list">
        {(payload.options ?? []).map((option) => (
          <button key={option.label} type="button" className="intel-chip" onClick={() => onOptionTap?.(option.label)}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
