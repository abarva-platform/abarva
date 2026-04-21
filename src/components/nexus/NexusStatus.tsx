'use client';

export function NexusStatus({
  mode,
  format,
  progress,
}: {
  mode: string | null;
  format: string | null;
  progress: Array<{ phase: string; status: string; latencyMs?: number }>;
}) {
  return (
    <div className="intel-status-panel intel-section" aria-live="polite">
      <div className="intel-eyebrow">Nexus in flight</div>
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {mode ? <span className="intel-chip mono green">{mode}</span> : null}
        {format ? <span className="intel-chip mono">{format.replace('_', ' ')}</span> : null}
        <span className="intel-chip mono teal">streaming</span>
      </div>
      <div className="intel-turn-stack" style={{ marginTop: 14 }}>
        {progress.length === 0 ? (
          <div className="intel-subtle" style={{ fontSize: 13 }}>
            Preparing retrieval plan and composing an answer.
          </div>
        ) : (
          progress.map((step, index) => (
            <div key={`${step.phase}-${index}`} className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, textTransform: 'capitalize' }}>{step.phase}</div>
              <div className="intel-subtle" style={{ fontFamily: 'var(--intel-mono)', fontSize: 11 }}>
                {step.status}
                {typeof step.latencyMs === 'number' ? ` · ${step.latencyMs}ms` : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
