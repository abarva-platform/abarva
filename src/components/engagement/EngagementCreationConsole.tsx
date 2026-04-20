'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type LocalMsg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  errored?: boolean;
};

type CreatedEngagement = {
  id: string;
  graph_node_id: string;
  name: string;
  industry_code: string;
  sponsor_person_id: string | null;
};

const OPENER_ID = 'opener-0';
const OPENER_CONTENT = "Let's start a new engagement. Who are we working with?";

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const CORAL = '#FF6B4A';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';
const FONT_MONO = 'JetBrains Mono, monospace';
const FONT_SERIF = 'Georgia, serif';

function stripBlock(text: string): string {
  return text.replace(/<engagement_ready>[\s\S]*?<\/engagement_ready>/g, '').trim();
}

export function EngagementCreationConsole() {
  const router = useRouter();
  const [messages, setMessages] = useState<LocalMsg[]>(() => [
    { id: OPENER_ID, role: 'assistant', content: OPENER_CONTENT },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedEngagement | null>(null);
  const idRef = useRef(0);
  const redirectRef = useRef(false);
  const nextId = () => `local-${Date.now()}-${++idRef.current}`;

  useEffect(() => {
    if (!created || redirectRef.current) return;
    redirectRef.current = true;
    const t = setTimeout(() => router.push(`/engagements/${encodeURIComponent(created.graph_node_id)}`), 1500);
    return () => clearTimeout(t);
  }, [created, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming || created) return;
    setInput('');
    setError(null);
    setIsStreaming(true);

    const userMsg: LocalMsg = { id: nextId(), role: 'user', content: text };
    const agentId = nextId();
    const agentMsg: LocalMsg = { id: agentId, role: 'assistant', content: '', streaming: true };
    setMessages((prev) => [...prev, userMsg, agentMsg]);

    const apiMessages = [...messages, userMsg]
      .filter((m) => m.id !== OPENER_ID && !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/engagements/create/turn', {
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
          let evt: { type: string; text?: string; engagement?: CreatedEngagement; error?: string };
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.type === 'delta' && typeof evt.text === 'string') {
            const delta = evt.text;
            setMessages((prev) =>
              prev.map((m) => (m.id === agentId ? { ...m, content: m.content + delta } : m)),
            );
          } else if (evt.type === 'engagement_created' && evt.engagement) {
            setCreated(evt.engagement);
          } else if (evt.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentId ? { ...m, content: stripBlock(m.content), streaming: false } : m,
              ),
            );
          } else if (evt.type === 'error') {
            throw new Error(evt.error ?? 'stream error');
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setError(msg);
      setMessages((prev) =>
        prev.map((m) => (m.id === agentId ? { ...m, streaming: false, errored: true } : m)),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 100px)', background: BG, color: INK, fontFamily: FONT_BODY }}>
      <div style={{ padding: 24, maxWidth: 820, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT_SERIF, marginBottom: 4 }}>
            <span style={{ color: INK, fontSize: 17, fontWeight: 800 }}>Abar</span>
            <span style={{ color: TEAL, fontSize: 23, fontWeight: 900 }}>Va</span>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Engagement · New
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 24,
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: m.role === 'assistant' ? 'rgba(45,212,200,0.05)' : 'rgba(255,255,255,0.06)',
                  border: `0.5px solid ${
                    m.errored
                      ? 'rgba(255,107,74,0.5)'
                      : m.role === 'assistant'
                      ? 'rgba(45,212,200,0.2)'
                      : 'rgba(255,255,255,0.12)'
                  }`,
                  opacity: m.streaming && !m.content ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    color: m.role === 'assistant' ? TEAL : MUTE,
                    letterSpacing: '0.14em',
                    marginBottom: 4,
                  }}
                >
                  {m.role === 'assistant' ? `NEXUS · ENGAGEMENT${m.streaming ? ' · streaming' : ''}` : 'YOU'}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {m.content}
                  {m.streaming && <span style={{ color: TEAL, opacity: 0.7 }}>▊</span>}
                </div>
              </div>
            ))}
          </div>

          {created && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: 'rgba(45,212,200,0.06)',
                border: `0.5px solid ${TEAL}4D`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: TEAL,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                ✓ Engagement created
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{created.name}</div>
              <div style={{ fontSize: 12, color: MUTE, marginTop: 4, fontFamily: FONT_MONO }}>
                Taking you to the console…
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: 'rgba(255,107,74,0.08)',
                border: '0.5px solid rgba(255,107,74,0.3)',
                borderRadius: 8,
                color: CORAL,
                fontSize: 12,
                fontFamily: FONT_MONO,
              }}
            >
              {error}
            </div>
          )}

          {!created && (
            <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
                placeholder="Describe the engagement…"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: INK,
                  fontFamily: 'inherit',
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                style={{
                  padding: '10px 18px',
                  background: TEAL,
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
