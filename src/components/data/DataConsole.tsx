'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';

type LocalMsg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  errored?: boolean;
};

type FileChip = {
  id: string;
  filename: string;
  chunks?: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
};

interface Props {
  clientId: string;
  clientName: string;
  industry: string;
  industryLabel: string;
}

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const CORAL = '#FF6B4A';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';
const FONT_MONO = 'JetBrains Mono, monospace';
const FONT_SERIF = 'Georgia, serif';

const ACCEPTED = '.pdf,.docx,.md,.txt';

export function DataConsole({ clientId, clientName, industry, industryLabel }: Props) {
  const [messages, setMessages] = useState<LocalMsg[]>([]);
  const [files, setFiles] = useState<FileChip[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const idRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openedRef = useRef(false);
  const nextId = () => `local-${Date.now()}-${++idRef.current}`;

  // Auto-fire the opening turn on mount. Ref is set synchronously before any
  // async work, so strict-mode double-invocation is a no-op on the second pass.
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    void sendTurn('[BEGIN]', { suppressUserMessage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendTurn(text: string, opts?: { suppressUserMessage?: boolean }) {
    if (isStreaming) return;
    setError(null);
    setIsStreaming(true);

    const userMsg: LocalMsg | null = opts?.suppressUserMessage
      ? null
      : { id: nextId(), role: 'user', content: text };
    const agentId = nextId();
    const agentMsg: LocalMsg = { id: agentId, role: 'assistant', content: '', streaming: true };

    setMessages((prev) => [...prev, ...(userMsg ? [userMsg] : []), agentMsg]);

    // Build API payload
    const baseHistory = [...messages, ...(userMsg ? [userMsg] : [])]
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }));
    const apiMessages = opts?.suppressUserMessage
      ? [{ role: 'user' as const, content: text }]
      : baseHistory;

    try {
      const res = await fetch('/api/data/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          clientName,
          industry,
          messages: apiMessages,
          filesProcessedThisSession: files
            .filter((f) => f.status === 'done' && typeof f.chunks === 'number')
            .map((f) => ({ filename: f.filename, chunks: f.chunks as number })),
        }),
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
              prev.map((m) => (m.id === agentId ? { ...m, content: m.content + delta } : m)),
            );
          } else if (evt.type === 'done') {
            setMessages((prev) => prev.map((m) => (m.id === agentId ? { ...m, streaming: false } : m)));
          } else if (evt.type === 'error') {
            throw new Error(evt.error ?? 'stream error');
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setError(msg);
      setMessages((prev) => prev.map((m) => (m.id === agentId ? { ...m, streaming: false, errored: true } : m)));
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleUpload(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    for (const file of arr) {
      const chipId = nextId();
      setFiles((prev) => [...prev, { id: chipId, filename: file.name, status: 'uploading' }]);
      try {
        const form = new FormData();
        form.append('clientId', clientId);
        form.append('file', file);
        const res = await fetch('/api/data/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        setFiles((prev) =>
          prev.map((f) => (f.id === chipId ? { ...f, status: 'done', chunks: data.chunks } : f)),
        );
        // Inject system note + auto-fire agent acknowledgment
        const sysText = `[SYSTEM] File processed: ${data.filename}, ${data.chunks} chunks indexed.`;
        void sendTurn(sysText);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'upload failed';
        setFiles((prev) => prev.map((f) => (f.id === chipId ? { ...f, status: 'error', error: msg } : f)));
      }
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) void handleUpload(e.dataTransfer.files);
  }
  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }
  function onDragLeave() {
    setDragActive(false);
  }
  function onFilePick(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) void handleUpload(e.target.files);
    e.target.value = '';
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    void sendTurn(text);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: FONT_BODY }}>
      <div style={{ padding: '16px 24px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily: FONT_SERIF, marginBottom: 4 }}>
          <span style={{ color: INK, fontSize: 17, fontWeight: 800 }}>Abar</span>
          <span style={{ color: TEAL, fontSize: 23, fontWeight: 900 }}>Va</span>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Data · {clientName} · {industryLabel}
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 820, margin: '0 auto' }}>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: 20,
            marginBottom: 16,
            background: dragActive ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px dashed ${dragActive ? TEAL : 'rgba(255,255,255,0.2)'}`,
            borderRadius: 12,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background 120ms ease, border-color 120ms ease',
          }}
        >
          <div style={{ fontSize: 13, color: dragActive ? TEAL : MUTE }}>
            Drop files or click to upload · pdf, docx, md, txt · max 10MB
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            onChange={onFilePick}
            style={{ display: 'none' }}
          />
        </div>

        {files.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '6px 12px',
                  background: f.status === 'error' ? 'rgba(255,107,74,0.08)' : 'rgba(20,184,166,0.06)',
                  border: `0.5px solid ${f.status === 'error' ? 'rgba(255,107,74,0.35)' : 'rgba(20,184,166,0.25)'}`,
                  borderRadius: 20,
                  fontSize: 11,
                  fontFamily: FONT_MONO,
                  color: f.status === 'error' ? CORAL : TEAL,
                }}
              >
                📎 {f.filename}
                {f.status === 'uploading' && ' · processing…'}
                {f.status === 'done' && typeof f.chunks === 'number' && ` · ${f.chunks} chunks indexed`}
                {f.status === 'error' && ` · ${f.error ?? 'failed'}`}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, minHeight: 360, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              <div style={{ color: MUTE, fontSize: 13, fontStyle: 'italic' }}>Nexus is warming up…</div>
            ) : (
              messages
                .filter((m) => !(m.role === 'user' && m.content.startsWith('[BEGIN]')))
                .map((m) => {
                  const isSystem = m.role === 'user' && m.content.startsWith('[SYSTEM]');
                  if (isSystem) {
                    return (
                      <div
                        key={m.id}
                        style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, fontStyle: 'italic', letterSpacing: '0.04em' }}
                      >
                        {m.content.replace(/^\[SYSTEM\]\s*/, '')}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: m.role === 'assistant' ? 'rgba(20,184,166,0.05)' : 'rgba(255,255,255,0.06)',
                        border: `0.5px solid ${m.errored ? 'rgba(255,107,74,0.5)' : m.role === 'assistant' ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.12)'}`,
                        opacity: m.streaming && !m.content ? 0.6 : 1,
                      }}
                    >
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: m.role === 'assistant' ? TEAL : MUTE, letterSpacing: '0.14em', marginBottom: 4 }}>
                        {m.role === 'assistant' ? `NEXUS · DATA${m.streaming ? ' · streaming' : ''}` : 'YOU'}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.content}
                        {m.streaming && <span style={{ color: TEAL, opacity: 0.7 }}>▊</span>}
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,107,74,0.08)', border: '0.5px solid rgba(255,107,74,0.3)', borderRadius: 8, color: CORAL, fontSize: 12, fontFamily: FONT_MONO }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder="Type a reply..."
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8, color: INK, fontFamily: 'inherit', fontSize: 14 }}
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
        </div>
      </div>
    </div>
  );
}
