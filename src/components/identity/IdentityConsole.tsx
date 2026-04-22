'use client';

import { useRef, useState, type FormEvent } from 'react';
import { AutosizeTextarea } from '@/components/shared/AutosizeTextarea';

type LocalMsg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  errored?: boolean;
};

type CreatedPerson = {
  id: string;
  graph_node_id: string | null;
  name: string;
  role: string | null;
  organization: string | null;
  email: string | null;
};

const OPENER_ID = 'opener-0';
const OPENER_CONTENT = 'Adding someone new. Who am I setting up?';

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const PURPLE = '#9B6DFF';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';
const FONT_MONO = 'JetBrains Mono, monospace';
const FONT_SERIF = 'Georgia, serif';

function stripUserReadyBlock(text: string): string {
  return text.replace(/<user_ready>[\s\S]*?<\/user_ready>/g, '').trim();
}

export function IdentityConsole() {
  const [messages, setMessages] = useState<LocalMsg[]>(() => [
    { id: OPENER_ID, role: 'assistant', content: OPENER_CONTENT },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPerson, setCreatedPerson] = useState<CreatedPerson | null>(null);
  const idRef = useRef(0);
  const nextId = () => `local-${Date.now()}-${++idRef.current}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming || createdPerson) return;
    setInput('');
    setError(null);
    setIsStreaming(true);

    const userMsg: LocalMsg = { id: nextId(), role: 'user', content: text };
    const agentId = nextId();
    const agentMsg: LocalMsg = { id: agentId, role: 'assistant', content: '', streaming: true };
    setMessages(prev => [...prev, userMsg, agentMsg]);

    // Build API payload: include all turns EXCEPT the hardcoded opener + streaming placeholder
    const apiMessages = [...messages, userMsg]
      .filter(m => m.id !== OPENER_ID && !m.streaming)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/identity/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
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
          let evt: { type: string; text?: string; person?: CreatedPerson; error?: string };
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.type === 'delta' && typeof evt.text === 'string') {
            const delta = evt.text;
            setMessages(prev => prev.map(m => (m.id === agentId ? { ...m, content: m.content + delta } : m)));
          } else if (evt.type === 'user_created' && evt.person) {
            setCreatedPerson(evt.person);
          } else if (evt.type === 'done') {
            setMessages(prev =>
              prev.map(m =>
                m.id === agentId ? { ...m, content: stripUserReadyBlock(m.content), streaming: false } : m,
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
      setMessages(prev => prev.map(m => (m.id === agentId ? { ...m, streaming: false, errored: true } : m)));
    } finally {
      setIsStreaming(false);
    }
  }

  function createAnother() {
    setMessages([{ id: OPENER_ID, role: 'assistant', content: OPENER_CONTENT }]);
    setCreatedPerson(null);
    setError(null);
    setInput('');
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: FONT_BODY }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: BORDER_SOFT }}>
        <div style={{ fontFamily: FONT_SERIF, marginBottom: 4 }}>
          <span style={{ color: INK, fontSize: 17, fontWeight: 800 }}>Abar</span>
          <span style={{ color: TEAL, fontSize: 23, fontWeight: 900 }}>Va</span>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: PURPLE, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Identity · New User
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 12, padding: 24, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: m.role === 'assistant' ? 'rgba(155,109,255,0.06)' : 'rgba(255,255,255,0.06)',
                  border: `0.5px solid ${m.errored ? 'rgba(255,107,74,0.5)' : m.role === 'assistant' ? 'rgba(155,109,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
                  opacity: m.streaming && !m.content ? 0.6 : 1,
                }}
              >
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: m.role === 'assistant' ? PURPLE : MUTE, letterSpacing: '0.14em', marginBottom: 4 }}>
                  {m.role === 'assistant' ? `NEXUS · IDENTITY${m.streaming ? ' · streaming' : ''}` : 'YOU'}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {m.content}
                  {m.streaming && <span style={{ color: PURPLE, opacity: 0.7 }}>▊</span>}
                </div>
              </div>
            ))}
          </div>

          {createdPerson && (
            <div style={{ marginTop: 20, padding: 16, background: 'rgba(20,184,166,0.05)', border: `0.5px solid ${TEAL}4D`, borderRadius: 10 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', marginBottom: 6 }}>
                User created
              </div>
              <div style={{ fontSize: 14 }}>
                <div style={{ fontWeight: 500 }}>{createdPerson.name}</div>
                <div style={{ color: MUTE, fontSize: 12 }}>
                  {createdPerson.role ?? '—'}{createdPerson.organization ? ` · ${createdPerson.organization}` : ''}
                </div>
                {createdPerson.graph_node_id && (
                  <div style={{ color: MUTE, fontSize: 11, fontFamily: FONT_MONO, marginTop: 4 }}>
                    {createdPerson.graph_node_id}
                  </div>
                )}
              </div>
              <button
                onClick={createAnother}
                style={{
                  marginTop: 12,
                  padding: '8px 14px',
                  background: 'transparent',
                  border: `0.5px solid ${TEAL}66`,
                  borderRadius: 8,
                  color: TEAL,
                  fontFamily: 'inherit',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Create another
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,107,74,0.08)', border: '0.5px solid rgba(255,107,74,0.3)', borderRadius: 8, color: '#FF6B4A', fontSize: 12, fontFamily: FONT_MONO }}>
              {error}
            </div>
          )}

          {!createdPerson && (
            <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <AutosizeTextarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                disabled={isStreaming}
                placeholder="Type a reply..."
                minRows={1}
                maxRows={5}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8, color: INK, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                style={{
                  padding: '10px 18px',
                  background: PURPLE,
                  color: BG,
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isStreaming || !input.trim() ? 'default' : 'pointer',
                  opacity: isStreaming || !input.trim() ? 0.5 : 1,
                }}
              >
                {isStreaming ? 'Nexus...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
