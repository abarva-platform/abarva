'use client';

import type { NexusTurnData } from '@/lib/intelligence/types';

function summarizeTurn(turn: NexusTurnData) {
  if (turn.role === 'user') return turn.payload.answer ?? 'User turn';
  return turn.payload.hero ?? turn.payload.answer ?? turn.payload.question ?? turn.format ?? 'Nexus turn';
}

export function ThreadRail({
  turns,
  activeTurnId,
  onTurnClick,
  onThreadAction,
}: {
  turns: NexusTurnData[];
  activeTurnId: string | null;
  onTurnClick: (turnId: string) => void;
  onThreadAction: (action: 'save' | 'attach_to_program' | 'clear') => void;
}) {
  return (
    <aside className="intel-thread-rail">
      <div className="intel-card intel-section">
        <div className="intel-eyebrow">Thread rail</div>
        <div className="intel-rail-list" style={{ marginTop: 14 }}>
          {turns.map((turn) => (
            <button
              key={turn.id}
              type="button"
              className={`intel-rail-item ${activeTurnId === turn.id ? 'active' : ''}`}
              onClick={() => onTurnClick(turn.id)}
            >
              <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="intel-chip mono">{turn.role === 'user' ? `T${turn.index + 1}` : `${turn.mode ?? 'nexus'}`}</span>
                {turn.format ? <span className="intel-dim" style={{ fontFamily: 'var(--intel-mono)', fontSize: 10 }}>{turn.format}</span> : null}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.45, textAlign: 'left' }}>
                {summarizeTurn(turn).slice(0, 110)}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="intel-card intel-section">
        <div className="intel-eyebrow">Thread actions</div>
        <div className="intel-stack" style={{ marginTop: 12, gap: 10 }}>
          <button type="button" className="intel-button" onClick={() => onThreadAction('save')}>Save thread</button>
          <button type="button" className="intel-button-outline" onClick={() => onThreadAction('attach_to_program')}>Attach to program</button>
          <button type="button" className="intel-button-ghost" onClick={() => onThreadAction('clear')}>Clear</button>
        </div>
      </div>
    </aside>
  );
}
