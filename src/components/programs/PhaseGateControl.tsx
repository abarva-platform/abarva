'use client';

// Priority 2 item 2 · phase-gate advancement control.
// Sits below the phase anchors on ProgramsIridescentShell when the user is
// viewing the currently-live phase. Click advances the program one phase
// forward, records approver + timestamp, and shows the advanced state.

import { useState } from 'react';

interface PhaseGateControlProps {
  programCode: string;
  currentPhase: number;
  maxPhase?: number;
  gateCriterion?: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'advanced'; fromPhase: number; toPhase: number; name: string | null; timestamp: string }
  | { kind: 'error'; message: string };

export function PhaseGateControl({ programCode, currentPhase, maxPhase = 4, gateCriterion }: PhaseGateControlProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  if (currentPhase >= maxPhase) {
    return (
      <div className="pgc-terminal">
        <span className="pgc-check" aria-hidden="true">✓</span>
        <div>
          <strong>Phase {currentPhase} is terminal</strong>
          <span>Program is in its final phase · no further gate advance available</span>
        </div>
        <style>{phaseCss}</style>
      </div>
    );
  }

  async function handleAdvance() {
    if (status.kind === 'submitting' || status.kind === 'advanced') return;
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/programs/phase-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programCode,
          fromPhase: currentPhase,
          toPhase: currentPhase + 1,
          gateCriterion: gateCriterion ?? `Advance from Phase ${currentPhase} to Phase ${currentPhase + 1}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'error', message: data.error ?? `HTTP ${res.status}` });
        return;
      }
      setStatus({
        kind: 'advanced',
        fromPhase: currentPhase,
        toPhase: currentPhase + 1,
        name: data.entry?.advancedByName ?? 'You',
        timestamp: data.entry?.timestamp ?? new Date().toISOString(),
      });
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'network error' });
    }
  }

  return (
    <>
      <style>{phaseCss}</style>
      <div className="pgc-control">
        {status.kind === 'advanced' ? (
          <>
            <span className="pgc-check" aria-hidden="true">✓</span>
            <div className="pgc-advanced-text">
              <strong>Advanced to Phase {status.toPhase}</strong>
              <span>
                by {status.name} · {new Date(status.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <span className="pgc-pill">Gate closed</span>
          </>
        ) : (
          <>
            <div className="pgc-label">
              <strong>Phase {currentPhase} gate</strong>
              <span>Close this phase and advance to Phase {currentPhase + 1}</span>
            </div>
            <button
              type="button"
              className="pgc-btn"
              onClick={handleAdvance}
              disabled={status.kind === 'submitting'}
              aria-label={`Advance to Phase ${currentPhase + 1}`}
            >
              {status.kind === 'submitting' ? 'Advancing…' : `Close gate → Phase ${currentPhase + 1}`}
            </button>
            {status.kind === 'error' ? <span className="pgc-error">Error: {status.message}</span> : null}
          </>
        )}
      </div>
    </>
  );
}

const phaseCss = `
.pgc-control, .pgc-terminal {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px; border-radius: 14px;
  background: rgba(14,159,140,0.08);
  border: 1px solid rgba(14,159,140,0.26);
  font-family: 'DM Sans', -apple-system, sans-serif;
  flex-wrap: wrap;
}
.pgc-terminal { background: rgba(63,178,127,0.08); border-color: rgba(63,178,127,0.26); }
.pgc-label { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pgc-label strong { font-size: 13px; color: #1a1612; }
.pgc-label span { font-size: 11px; color: #6d625a; }
.pgc-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700;
  padding: 10px 16px; border-radius: 999px; border: 1px solid transparent; cursor: pointer;
  background: #0e9f8c; color: #FFFFFF;
  transition: all 0.15s;
}
.pgc-btn:hover { background: #0a7a6c; }
.pgc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.pgc-error { font-size: 12px; color: #b5452f; font-family: 'JetBrains Mono', monospace; }
.pgc-check {
  width: 26px; height: 26px; border-radius: 50%;
  background: #3FB27F; color: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.pgc-advanced-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.pgc-advanced-text strong { font-size: 13px; color: #1a1612; }
.pgc-advanced-text span { font-size: 11px; color: #6d625a; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; }
.pgc-pill {
  display: inline-block; padding: 4px 10px; border-radius: 999px;
  background: rgba(63,178,127,0.15); color: #2e8560;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
}
@media print { .pgc-control, .pgc-terminal { display: none; } }
`;
