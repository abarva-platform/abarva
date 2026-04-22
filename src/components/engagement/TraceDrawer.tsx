'use client';

import { useEffect, useState } from 'react';

const TEAL = '#14B8A6';
const INK = '#F5F5F0';
const BG_DARK = '#0A0A0A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MUTE = 'rgba(245, 245, 240, 0.72)';

interface TraceStep {
  label: string;
  kind: 'retrieval' | 'graph' | 'prompt' | 'stream' | 'background';
  latencyMs: number;
  summary?: string;
  count?: number;
  error?: string;
}

interface Trace {
  turn_id: string;
  engagement_id: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  steps: TraceStep[];
  created_at: string;
}

interface TraceDrawerProps {
  turnId: string;
  open: boolean;
  onClose: () => void;
}

const KIND_LABEL: Record<TraceStep['kind'], string> = {
  retrieval: 'Retrieval',
  graph: 'Graph reasoning',
  prompt: 'Prompt assembly',
  stream: 'Model',
  background: 'Background',
};

const KIND_COLOR: Record<TraceStep['kind'], string> = {
  retrieval: '#4DA3FF',
  graph: '#F59E0B',
  prompt: '#14B8A6',
  stream: '#3FB27F',
  background: '#8B8680',
};

export function TraceDrawer({ turnId, open, onClose }: TraceDrawerProps) {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !turnId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/turn/${turnId}/trace`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<{ trace: Trace | null }>;
      })
      .then((json) => {
        if (cancelled) return;
        setTrace(json.trace);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, turnId]);

  if (!open) return null;

  const byKind = new Map<TraceStep['kind'], TraceStep[]>();
  for (const s of trace?.steps ?? []) {
    const list = byKind.get(s.kind) ?? [];
    list.push(s);
    byKind.set(s.kind, list);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 500,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 92vw)',
          height: '100vh',
          background: BG_DARK,
          borderLeft: BORDER,
          color: INK,
          overflow: 'auto',
          padding: '28px 28px 48px',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: TEAL, letterSpacing: '0.14em' }}>
              WHY DID NEXUS SAY THIS
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>Reasoning trace</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: MUTE, cursor: 'pointer', fontSize: 18 }}
          >
            ×
          </button>
        </div>

        {loading && <div style={{ color: MUTE }}>Loading trace…</div>}
        {error && <div style={{ color: '#FF6B4A', fontSize: 13 }}>Error: {error}</div>}

        {!loading && !error && !trace && (
          <div style={{ color: MUTE, fontSize: 13, lineHeight: 1.6 }}>
            No trace recorded for this turn. Traces are captured for turns generated after Pack D Principle 6 shipped.
          </div>
        )}

        {trace && (
          <>
            {trace.model && (
              <section style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: TEAL, letterSpacing: '0.14em', marginBottom: 8 }}>
                  MODEL
                </div>
                <div style={{ fontSize: 13, color: INK, fontFamily: 'JetBrains Mono, monospace' }}>
                  {trace.model}
                </div>
                <div style={{ fontSize: 12, color: MUTE, marginTop: 6 }}>
                  {trace.input_tokens ?? 0} input · {trace.output_tokens ?? 0} output · {((trace.latency_ms ?? 0) / 1000).toFixed(2)}s total
                </div>
              </section>
            )}

            {Array.from(byKind.entries()).map(([kind, steps]) => (
              <section key={kind} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: KIND_COLOR[kind] }} />
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: KIND_COLOR[kind], textTransform: 'uppercase' }}>
                    {KIND_LABEL[kind]}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {steps.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 12,
                        background: 'rgba(255,255,255,0.02)',
                        border: BORDER,
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: s.summary || s.error ? 4 : 0 }}>
                        <div style={{ color: INK, fontWeight: 500 }}>
                          {s.error ? '✗ ' : '✓ '}
                          {s.label}
                          {typeof s.count === 'number' && (
                            <span style={{ color: MUTE, fontWeight: 400 }}> · {s.count} {s.count === 1 ? 'result' : 'results'}</span>
                          )}
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: MUTE, marginLeft: 12, flexShrink: 0 }}>
                          {s.latencyMs}ms
                        </div>
                      </div>
                      {s.summary && !s.error && (
                        <div style={{ color: MUTE, fontSize: 12, marginTop: 4 }}>{s.summary}</div>
                      )}
                      {s.error && (
                        <div style={{ color: '#FF6B4A', fontSize: 12, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                          {s.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {trace.steps.length === 0 && (
              <div style={{ color: MUTE, fontSize: 13 }}>No steps captured for this turn.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
