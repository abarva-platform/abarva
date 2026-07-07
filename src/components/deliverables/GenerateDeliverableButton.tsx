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
  status: 'queued' | 'running' | 'succeeded' | 'blocked' | 'failed';
  artifactId?: string | null;
  sectionCount?: number | null;
  retrievedEvidence?: number | null;
  blockers?: string[];
  warnings?: string[];
  error?: string | null;
  progressPct?: number | null;
  progressLabel?: string | null;
}

// Canonical data-display tokens (docs/design/DATA_DISPLAY_TOKENS.md).
const INK = '#1B1A17'; // --ink (button / band)
const MUTED = '#6F6A61'; // --muted (labels)
const LINE = '#E6E2DA'; // --line (progress track)
const FRESH = '#3F7A5B'; // status:fresh (progress fill, succeeded)
const ATTENTION = '#B5852A'; // status:attention (blocked / quality gate)
const STALE = '#B4513C'; // status:stale (errors)
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
        if (data.status === 'running' || data.status === 'queued') {
          // 'queued' = enqueued, waiting for the durable worker to claim it; 'running' =
          // the worker is generating. Both are non-terminal — keep polling and surface
          // the live progress band (queued shows 0% with a "waiting" label).
          setRun(data); // surface live progress (pct/label) while still running
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
          padding: '10px 18px', background: INK, color: '#fff', border: 'none', borderRadius: 8,
          fontWeight: 600, fontSize: 13.5, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1, alignSelf: 'flex-start',
        }}
      >
        {running ? `Authoring board-grade deliverable… ${mins}:${String(secs).padStart(2, '0')}` : (props.label ?? 'Generate board-grade deliverable')}
      </button>

      {running && (() => {
        const pct = Math.max(0, Math.min(100, run?.progressPct ?? 0));
        const label = run?.progressLabel ?? 'Starting the authoring engine';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12.5 }}>
              <span style={{ color: MUTED }}>{label}</span>
              <span style={{ color: MUTED, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: LINE, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', width: `${pct}%`, borderRadius: 999,
                  background: FRESH,
                  transition: 'width 600ms cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
            <div style={{ fontSize: 11.5, color: MUTED }}>
              Governed generation — planning the structure, writing the document section by section, then assembling and quality-checking it. Runs in the background; you can leave this open.
            </div>
          </div>
        );
      })()}

      {error && phase !== 'blocked' && (
        <div style={{ padding: '10px 12px', background: `${STALE}10`, border: `1px solid ${STALE}33`, borderRadius: 6, color: STALE, fontSize: 13 }}>
          {error}
        </div>
      )}

      {phase === 'blocked' && (
        <div style={{ padding: '12px 14px', background: `${ATTENTION}14`, border: `1px solid ${ATTENTION}40`, borderRadius: 8, fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: ATTENTION }}>Held back by the quality gate</div>
          <div style={{ color: MUTED, marginBottom: 8 }}>The draft did not meet the board-grade bar, so it was not shipped. Reasons:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {(run?.blockers ?? []).map((b, i) => <li key={i}>{b}</li>)}
            {run?.error && !(run?.blockers?.length) ? <li>{run.error}</li> : null}
          </ul>
        </div>
      )}

      {phase === 'succeeded' && run && (
        <div style={{ padding: 16, background: `${FRESH}12`, border: `1px solid ${FRESH}40`, borderRadius: 10 }}>
          <div style={{ fontSize: 16, marginBottom: 6, fontFamily: 'Georgia, serif', fontWeight: 400, color: INK }}>Board-grade deliverable ready</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>
            {run.sectionCount ?? 0} sections · {run.retrievedEvidence ?? 0} governed evidence items{run.warnings?.length ? ` · ${run.warnings.length} advisory note(s)` : ''}
          </div>
          <a
            href={run.artifactId ? `/api/v1/artifacts/${run.artifactId}` : '#'}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', gap: 6, padding: '7px 14px', background: INK, color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
          >
            Open deliverable →
          </a>
        </div>
      )}
    </div>
  );
}
