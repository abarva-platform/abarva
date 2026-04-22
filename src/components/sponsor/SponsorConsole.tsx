'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { EngagementRow } from '@/lib/db/engagement';
import type { PersonRow } from '@/lib/db/person';
import type { TurnRow } from '@/lib/db/turn';
import { AutosizeTextarea } from '@/components/shared/AutosizeTextarea';

type LocalTurn = TurnRow & { streaming?: boolean; errored?: boolean };

interface Deliverable {
  type: string;
  phase: number;
  generated_at: string;
  content: Record<string, unknown>;
}

interface Props {
  engagement: EngagementRow;
  viewer: PersonRow;
  maestro: PersonRow | null;
  turns: TurnRow[];
  deliverables: Deliverable[];
}

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const CORAL = '#FF6B4A';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';
const FONT_MONO = 'JetBrains Mono, monospace';
const FONT_SERIF = 'Georgia, serif';

const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];

export function SponsorConsole({ engagement, viewer, maestro, turns, deliverables }: Props) {
  const [messages, setMessages] = useState<LocalTurn[]>(turns);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(0);
  const nextId = () => `local-${Date.now()}-${++idRef.current}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    setError(null);
    setIsStreaming(true);

    const now = new Date().toISOString();
    const userMsg: LocalTurn = {
      id: nextId(),
      engagement_id: engagement.id,
      phase: engagement.current_phase,
      sender: 'user',
      text,
      mode_label: null,
      retrieved_refs: {},
      created_at: now,
    };
    const agentId = nextId();
    const agentMsg: LocalTurn = {
      id: agentId,
      engagement_id: engagement.id,
      phase: engagement.current_phase,
      sender: 'agent',
      text: '',
      mode_label: null,
      retrieved_refs: {},
      created_at: now,
      streaming: true,
    };
    setMessages((prev) => [...prev, userMsg, agentMsg]);

    try {
      const res = await fetch(`/api/engage/${encodeURIComponent(engagement.graph_node_id)}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: text }),
      });
      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => '');
        throw new Error(`${res.status} ${body || res.statusText}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let evt: { type: string; text?: string; error?: string };
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.type === 'delta' && typeof evt.text === 'string') {
            const delta = evt.text;
            setMessages((prev) =>
              prev.map((m) => (m.id === agentId ? { ...m, text: m.text + delta } : m)),
            );
          } else if (evt.type === 'done') {
            setMessages((prev) => prev.map((m) => (m.id === agentId ? { ...m, streaming: false } : m)));
          } else if (evt.type === 'error') {
            throw new Error(evt.error ?? 'stream error');
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      setError(msg);
      setMessages((prev) => prev.map((m) => (m.id === agentId ? { ...m, streaming: false, errored: true } : m)));
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: FONT_BODY }}>
      {/* Top bar — simpler than Maestro chrome, no navigation */}
      <div style={{ padding: '16px 24px', borderBottom: BORDER_SOFT, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <div>
            <span style={{ fontFamily: FONT_SERIF, color: INK, fontSize: 17, fontWeight: 800 }}>Abar</span>
            <span style={{ fontFamily: FONT_SERIF, color: TEAL, fontSize: 23, fontWeight: 900 }}>Va</span>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase' }}>
            {engagement.name}
          </div>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE }}>
          {viewer.name}
        </div>
      </div>

      {/* Phase stepper */}
      <div style={{ padding: '16px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {PHASE_LABELS.map((label, i) => (
            <div
              key={i}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: i === engagement.current_phase ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
                border: `0.5px solid ${i === engagement.current_phase ? TEAL : 'rgba(255,255,255,0.12)'}`,
              }}
            >
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: i === engagement.current_phase ? TEAL : MUTE, letterSpacing: '0.14em', marginBottom: 4 }}>
                PHASE {i}
              </div>
              <div style={{ fontSize: 13, color: i === engagement.current_phase ? INK : MUTE }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main — conversation + deliverables (no operational sidebars) */}
      <div style={{ padding: '0 24px 32px', maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 12, padding: 24, minHeight: 420, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
            Conversation · {messages.length} turns
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              <div style={{ color: MUTE, fontSize: 14, fontStyle: 'italic' }}>Say something to Nexus.</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: m.sender === 'agent' ? 'rgba(20,184,166,0.05)' : 'rgba(255,255,255,0.06)',
                    border: `0.5px solid ${
                      m.errored ? 'rgba(255,107,74,0.5)' : m.sender === 'agent' ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.12)'
                    }`,
                    opacity: m.streaming && !m.text ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: m.sender === 'agent' ? TEAL : MUTE, letterSpacing: '0.14em', marginBottom: 4 }}>
                    {m.sender === 'agent' ? `NEXUS${m.streaming ? ' · streaming' : ''}` : 'YOU'}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {m.text}
                    {m.streaming && <span style={{ color: TEAL, opacity: 0.7 }}>▊</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,107,74,0.08)', border: '0.5px solid rgba(255,107,74,0.3)', borderRadius: 8, color: CORAL, fontSize: 12, fontFamily: FONT_MONO }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <AutosizeTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              disabled={isStreaming}
              placeholder="Your reply…"
              minRows={1}
              maxRows={5}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8, color: INK, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              style={{ padding: '10px 18px', background: TEAL, color: BG, border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: isStreaming || !input.trim() ? 'default' : 'pointer', opacity: isStreaming || !input.trim() ? 0.5 : 1 }}
            >
              {isStreaming ? 'Nexus…' : 'Send'}
            </button>
          </form>
        </div>

        {/* Right column — Maestro + Deliverables only (no Genome, no peers) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', marginBottom: 8 }}>
              Running this with
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ fontWeight: 500 }}>{maestro?.name ?? 'Maestro to be assigned'}</div>
              {maestro && <div style={{ color: MUTE, fontSize: 12 }}>{maestro.role ?? 'Maestro'}{maestro.organization ? ` · ${maestro.organization}` : ''}</div>}
            </div>
          </div>

          <div style={{ background: 'rgba(20,184,166,0.04)', border: '0.5px solid rgba(20,184,166,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', marginBottom: 8 }}>
              Deliverables · {deliverables.length}
            </div>
            {deliverables.length === 0 ? (
              <div style={{ color: MUTE, fontSize: 12 }}>No deliverables yet. First one lands when Phase 0 gate is approved.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {deliverables.map((d) => (
                  <div key={`${d.type}-${d.phase}`} style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ color: TEAL, fontFamily: FONT_MONO, fontSize: 11 }}>PHASE {d.phase}</span>
                    <span style={{ color: INK }}> · {d.type.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}</span>
                    <div style={{ color: MUTE, fontSize: 10, fontFamily: FONT_MONO }}>{new Date(d.generated_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
