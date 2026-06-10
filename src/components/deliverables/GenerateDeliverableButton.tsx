'use client';

// In-product action: kick off async board-grade generation and poll the run to
// completion. Board-grade authoring is a multi-pass Claude flow (~5–10 min), so we start
// a run, then poll GET /deliverables/runs/{id} until it is terminal. The result is the
// persisted artifact (succeeded), the quality-gate blockers (blocked) — Nexus never
// silently ships a weak deliverable — or an error (failed).

import { useCallback, useEffect, useRef, useState } from 'react';

export interface GenerateDeliverableButtonProps {
  module: 'source' | 'moves' | 'tower' | 'intelligence';
  useCaseArchetype: string;
  deliverableType: string;
  sourceArtifactRef: string;
  decisionContext: string;
  clientDisplayName?: string;
  initiativeDisplayName?: string;
  label?: string;
}

type Phase = 'idle' | 'running' | 'succeeded' | 'blocked' | 'failed';

interface RunStatus {
  status: 'running' | 'succeeded' | 'blocked' | 'failed';
  artifactId?: string | null;
  sectionCount?: number | null;
  retrievedEvidence?: number | null;
  blockers?: string[];
  warnings?: string[];
  error?: string | null;
}

const NAVY = '#0C1A3A';
const TEAL = '#2DD4C8';
const POLL_MS = 4000;
const MAX_MS = 15 * 60 * 1000; // stop polling after 15 min

export function GenerateDeliverableButton(props: GenerateDeliverableButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState<RunStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<{ poll?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval>; start?: number }>({});

  const clearTimers = useCallback(() => {
    if (timers.current.poll) clearTimeout(timers.current.poll);
    if (timers.current.tick) clearInterval(timers.current.tick);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const poll = useCallback(
    async (runId: string) => {
      try {
        const res = await fetch(`/api/v1/deliverables/runs/${runId}`);
        const data = (await res.json()) as RunStatus & { error?: string };
        if (!res.ok && res.status !== 200) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        if (data.status === 'running') {
          if (Date.now() - (timers.current.start ?? 0) > MAX_MS) {
            clearTimers();
            setPhase('failed');
            setError('Generation is taking longer than expected. It may still finish — refresh shortly or check the deliverables list.');
            return;
          }
          timers.current.poll = setTimeout(() => poll(runId), POLL_MS);
          return;
        }
        clearTimers();
        setRun(data);
        setPhase(data.status); // succeeded | blocked | failed
      } catch (err) {
        timers.current.poll = setTimeout(() => poll(runId), POLL_MS * 2); // transient — back off and retry
        setError(err instanceof Error ? err.message : 'poll failed');
      }
    },
    [clearTimers],
  );

  const handleGenerate = useCallback(async () => {
    clearTimers();
    setPhase('running');
    setError(null);
    setRun(null);
    setElapsed(0);
    timers.current.start = Date.now();
    timers.current.tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    try {
      const res = await fetch('/api/v1/deliverables/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          module: props.module,
          useCaseArchetype: props.useCaseArchetype,
          deliverableType: props.deliverableType,
          sourceArtifactRef: props.sourceArtifactRef,
          decisionContext: props.decisionContext,
          clientDisplayName: props.clientDisplayName,
          initiativeDisplayName: props.initiativeDisplayName,
        }),
      });
      const data = (await res.json()) as { runId?: string; detail?: string; error?: string };
      if (!res.ok || !data.runId) throw new Error(data.detail ?? data.error ?? `HTTP ${res.status}`);
      timers.current.poll = setTimeout(() => poll(data.runId!), POLL_MS);
    } catch (err) {
      clearTimers();
      setPhase('failed');
      setError(err instanceof Error ? err.message : 'failed to start generation');
    }
  }, [clearTimers, poll, props]);

  const running = phase === 'running';
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={running}
        style={{
          padding: '10px 18px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8,
          fontWeight: 600, fontSize: 14, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1, alignSelf: 'flex-start',
        }}
      >
        {running ? `Authoring board-grade deliverable… ${mins}:${String(secs).padStart(2, '0')}` : (props.label ?? 'Generate board-grade deliverable')}
      </button>

      {running && (
        <div style={{ fontSize: 12, color: '#706D66' }}>
          Multi-pass authoring (architect → draft → red-team → board-grade rewrite). This runs in the background and typically takes a few minutes; you can leave this page open.
        </div>
      )}

      {error && phase !== 'blocked' && (
        <div style={{ padding: '10px 12px', background: 'rgba(179,38,30,0.06)', border: '1px solid rgba(179,38,30,0.3)', borderRadius: 6, color: '#B3261E', fontSize: 13 }}>
          {error}
        </div>
      )}

      {phase === 'blocked' && (
        <div style={{ padding: '12px 14px', background: 'rgba(244,180,0,0.08)', border: '1px solid rgba(244,180,0,0.4)', borderRadius: 8, fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Held back by the quality gate</div>
          <div style={{ color: '#706D66', marginBottom: 8 }}>The draft did not meet the board-grade bar, so it was not shipped. Reasons:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {(run?.blockers ?? []).map((b, i) => <li key={i}>{b}</li>)}
            {run?.error && !(run?.blockers?.length) ? <li>{run.error}</li> : null}
          </ul>
        </div>
      )}

      {phase === 'succeeded' && run && (
        <div style={{ padding: 16, background: 'rgba(45,212,200,0.06)', border: `1px solid ${TEAL}55`, borderRadius: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, fontFamily: 'Georgia, serif' }}>Board-grade deliverable ready</div>
          <div style={{ fontSize: 12, color: '#706D66', marginBottom: 10 }}>
            {run.sectionCount ?? 0} sections · {run.retrievedEvidence ?? 0} governed evidence items{run.warnings?.length ? ` · ${run.warnings.length} advisory note(s)` : ''}
          </div>
          <a
            href={run.artifactId ? `/api/v1/artifacts/${run.artifactId}` : '#'}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', gap: 6, padding: '7px 14px', background: NAVY, color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
          >
            Open deliverable →
          </a>
        </div>
      )}
    </div>
  );
}
