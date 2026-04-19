'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { EngagementRow } from '@/lib/db/engagement';
import type { PersonRow } from '@/lib/db/person';
import type { TurnRow } from '@/lib/db/turn';
import type { ActivePattern, PeerDecisionSummary, ChainedPattern } from '@/lib/graph/types';

type LocalTurn = TurnRow & { streaming?: boolean; errored?: boolean };

interface Props {
  engagement: EngagementRow;
  sponsor: PersonRow | null;
  turns: TurnRow[];
  activePatterns: ActivePattern[];
  peerDecisions: PeerDecisionSummary[];
  chainedPatterns: ChainedPattern[];
}

export function EngagementConsole({
  engagement, sponsor, turns, activePatterns, peerDecisions, chainedPatterns,
}: Props) {
  const phaseLabels = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];

  const [messages, setMessages] = useState<LocalTurn[]>(turns);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localIdRef = useRef(0);
  const nextLocalId = () => `local-${Date.now()}-${++localIdRef.current}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    setError(null);
    setIsStreaming(true);

    const now = new Date().toISOString();
    const userTurn: LocalTurn = {
      id: nextLocalId(),
      engagement_id: engagement.id,
      phase: engagement.current_phase,
      sender: 'user',
      text,
      mode_label: null,
      retrieved_refs: {},
      created_at: now,
    };
    const agentTurnId = nextLocalId();
    const agentTurn: LocalTurn = {
      id: agentTurnId,
      engagement_id: engagement.id,
      phase: engagement.current_phase,
      sender: 'agent',
      text: '',
      mode_label: null,
      retrieved_refs: {},
      created_at: now,
      streaming: true,
    };
    setMessages(prev => [...prev, userTurn, agentTurn]);

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
          let evt: { type: string; text?: string; turnId?: string; error?: string };
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.type === 'delta' && typeof evt.text === 'string') {
            const delta = evt.text;
            setMessages(prev =>
              prev.map(m => (m.id === agentTurnId ? { ...m, text: m.text + delta } : m)),
            );
          } else if (evt.type === 'done') {
            setMessages(prev =>
              prev.map(m =>
                m.id === agentTurnId
                  ? { ...m, id: evt.turnId ?? m.id, streaming: false }
                  : m,
              ),
            );
          } else if (evt.type === 'error') {
            throw new Error(evt.error ?? 'stream error');
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      setError(msg);
      setMessages(prev =>
        prev.map(m => (m.id === agentTurnId ? { ...m, streaming: false, errored: true } : m)),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#F5F5F0', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: 'Georgia, serif', marginBottom: 4 }}>
          <span style={{ color: '#F5F5F0', fontSize: 17, fontWeight: 800 }}>Abar</span>
          <span style={{ color: '#2DD4C8', fontSize: 23, fontWeight: 900 }}>Va</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2DD4C8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {engagement.name} · {sponsor?.name ?? 'unassigned'} · {sponsor?.role ?? '—'}
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{ padding: '16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {phaseLabels.map((label, i) => (
            <div key={i} style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: i === engagement.current_phase ? 'rgba(45,212,200,0.12)' : 'rgba(255,255,255,0.03)',
              border: `0.5px solid ${i === engagement.current_phase ? '#2DD4C8' : 'rgba(255,255,255,0.12)'}`,
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: i === engagement.current_phase ? '#2DD4C8' : '#8B8680', letterSpacing: '0.14em', marginBottom: 4 }}>
                PHASE {i}
              </div>
              <div style={{ fontSize: 13, color: i === engagement.current_phase ? '#F5F5F0' : '#8B8680' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Three-column layout: conversation placeholder | context sidebar */}
      <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Conversation + composer */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#8B8680', textTransform: 'uppercase', marginBottom: 16 }}>
            Conversation · {messages.length} turns
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              <div style={{ color: '#8B8680', fontSize: 14, fontStyle: 'italic' }}>
                No turns yet. Say something to Nexus.
              </div>
            ) : (
              messages.map(t => (
                <div key={t.id} style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: t.sender === 'agent' ? 'rgba(45,212,200,0.05)' : 'rgba(255,255,255,0.06)',
                  border: `0.5px solid ${t.errored ? 'rgba(255,107,74,0.5)' : t.sender === 'agent' ? 'rgba(45,212,200,0.2)' : 'rgba(255,255,255,0.12)'}`,
                  opacity: t.streaming && !t.text ? 0.6 : 1,
                }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: t.sender === 'agent' ? '#2DD4C8' : '#8B8680', letterSpacing: '0.14em', marginBottom: 4 }}>
                    {t.sender === 'agent' ? `NEXUS${t.mode_label ? ' · ' + t.mode_label : ''}${t.streaming ? ' · streaming' : ''}` : 'YOU'}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {t.text}
                    {t.streaming && <span style={{ color: '#2DD4C8', opacity: 0.7 }}>▊</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,107,74,0.08)', border: '0.5px solid rgba(255,107,74,0.3)', borderRadius: 8, color: '#FF6B4A', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder="Type a message to Nexus..."
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#F5F5F0', fontFamily: 'inherit', fontSize: 14 }}
            />
            <button type="submit" disabled={isStreaming || !input.trim()} style={{ padding: '10px 18px', background: '#2DD4C8', color: '#0A0A0A', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: isStreaming || !input.trim() ? 'default' : 'pointer', opacity: isStreaming || !input.trim() ? 0.5 : 1 }}>
              {isStreaming ? 'Nexus...' : 'Send'}
            </button>
          </form>
        </div>

        {/* Context sidebar — what the agent knows but doesn't flex */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Sponsor */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#2DD4C8', textTransform: 'uppercase', marginBottom: 8 }}>
              Sponsor
            </div>
            {sponsor ? (
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{sponsor.name}</div>
                <div style={{ color: '#8B8680', fontSize: 12 }}>{sponsor.role} · {sponsor.organization}</div>
                <div style={{ color: '#8B8680', fontSize: 11, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  {sponsor.familiarity.replace(/_/g, ' ')}
                </div>
              </div>
            ) : (
              <div style={{ color: '#8B8680', fontSize: 12 }}>No sponsor linked</div>
            )}
          </div>

          {/* Active patterns */}
          <div style={{ background: 'rgba(155,109,255,0.04)', border: '0.5px solid rgba(155,109,255,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#9B6DFF', textTransform: 'uppercase', marginBottom: 8 }}>
              Active patterns · {activePatterns.length}
            </div>
            {activePatterns.length === 0 ? (
              <div style={{ color: '#8B8680', fontSize: 12 }}>None observed</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activePatterns.map(p => (
                  <div key={p.code} style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ color: '#9B6DFF', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{p.code}</span>
                    <span style={{ color: '#F5F5F0' }}> {p.name}</span>
                    <div style={{ color: '#8B8680', fontSize: 11 }}>
                      {(p.failure_rate * 100).toFixed(0)}% historical failure rate · {p.category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peer decisions */}
          <div style={{ background: 'rgba(255,107,74,0.04)', border: '0.5px solid rgba(255,107,74,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#FF6B4A', textTransform: 'uppercase', marginBottom: 8 }}>
              Peer decisions · phase {engagement.current_phase}
            </div>
            {peerDecisions.length === 0 ? (
              <div style={{ color: '#8B8680', fontSize: 12 }}>No comparable decisions at this phase yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {peerDecisions.map(d => (
                  <div key={d.choice} style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ color: '#F5F5F0' }}>{d.choice.replace(/_/g, ' ')}</div>
                    <div style={{ color: '#8B8680', fontSize: 11 }}>
                      {d.engagement_count} engagements · avg ${Math.round(d.avg_outcome_usd / 1000000)}M outcome
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chained patterns */}
          {chainedPatterns.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#8B8680', textTransform: 'uppercase', marginBottom: 8 }}>
                Chained risks
              </div>
              {chainedPatterns.map(c => (
                <div key={`${c.from_code}-${c.to_code}`} style={{ fontSize: 11, lineHeight: 1.5, color: '#C9C6BD' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{c.from_code} → {c.to_code}</span>
                  <span style={{ color: '#8B8680' }}> · {(c.weight * 100).toFixed(0)}% chain rate</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
