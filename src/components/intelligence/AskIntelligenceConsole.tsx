'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

interface AskSource {
  type: string;
  name: string;
  id: string | null;
  detail: string;
  url?: string;
}

interface Classification {
  intent: string;
  entities: string[];
  confidence: number;
}

export function AskIntelligenceConsole({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isStreaming, setIsStreaming] = useState(false);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [sources, setSources] = useState<AskSource[]>([]);
  const [answer, setAnswer] = useState('');
  const [followups, setFollowups] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-run when page loads with ?q=...
  useEffect(() => {
    if (initialQuery) runQuery(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runQuery(q: string) {
    if (!q.trim()) return;
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setIsStreaming(true);
    setClassification(null);
    setSources([]);
    setAnswer('');
    setFollowups([]);
    setError(null);

    try {
      const res = await fetch(`/api/intelligence/ask?q=${encodeURIComponent(q)}`, { signal: abort.signal });
      if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line) as Record<string, unknown>;
            if (evt.type === 'classified' && evt.classification) {
              setClassification(evt.classification as Classification);
            } else if (evt.type === 'sources' && Array.isArray(evt.sources)) {
              setSources(evt.sources as AskSource[]);
            } else if (evt.type === 'delta' && typeof evt.text === 'string') {
              setAnswer((prev) => prev + evt.text);
            } else if (evt.type === 'followups' && Array.isArray(evt.followups)) {
              setFollowups(evt.followups as string[]);
            } else if (evt.type === 'error' && typeof evt.error === 'string') {
              setError(evt.error);
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.replace(`/intelligence/ask?q=${encodeURIComponent(q)}`);
    await runQuery(q);
  }

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1000, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 10 }}>
        INTELLIGENCE · ASK
      </div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: INK, margin: '0 0 8px' }}>
        Ask the knowledge layer
      </h1>
      <p style={{ fontSize: 14, color: MUTE, marginBottom: 24, maxWidth: 720 }}>
        Stateless librarian. No personalization, no engagement context — only what we've indexed across topics,
        vendors, patterns, regulations, frameworks, benchmarks, and research.
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., How is Abridge typically deployed? · What triggers F008? · HIPAA § 164.308 summary"
          style={{
            width: '100%',
            padding: '14px 18px',
            background: PANEL_BG,
            border: `1px solid ${TEAL}`,
            borderRadius: 8,
            color: INK,
            fontSize: 16,
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
          }}
          disabled={isStreaming}
          autoFocus
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="submit"
            disabled={isStreaming || !query.trim()}
            style={{
              padding: '8px 18px',
              background: TEAL,
              border: 'none',
              borderRadius: 6,
              color: '#0A0A0A',
              fontSize: 14,
              fontWeight: 700,
              cursor: isStreaming ? 'default' : 'pointer',
              opacity: isStreaming || !query.trim() ? 0.5 : 1,
            }}
          >
            {isStreaming ? 'Asking…' : 'Ask'}
          </button>
          {classification && (
            <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em' }}>
              intent: <span style={{ color: TEAL }}>{classification.intent}</span>
              {classification.confidence ? ` · ${classification.confidence}% conf` : ''}
              {classification.entities.length > 0 ? ` · [${classification.entities.join(', ')}]` : ''}
            </div>
          )}
        </div>
      </form>

      {error && (
        <div style={{ padding: 14, background: 'rgba(255,107,74,0.08)', border: `0.5px solid #FF6B4A`, borderRadius: 8, color: '#FF6B4A', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {answer && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, letterSpacing: '0.14em', marginBottom: 10 }}>
            ANSWER
          </div>
          <div
            style={{
              padding: '18px 22px',
              background: PANEL_BG,
              border: BORDER,
              borderRadius: 10,
              fontSize: 15,
              lineHeight: 1.65,
              color: INK,
              whiteSpace: 'pre-wrap',
            }}
          >
            {answer}
            {isStreaming && <span style={{ color: TEAL, opacity: 0.7 }}>▊</span>}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, letterSpacing: '0.14em', marginBottom: 10 }}>
            SOURCES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sources.map((s, i) => {
              const body = (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: TEAL, letterSpacing: '0.12em' }}>{s.type}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: MUTE }}>{s.detail}</div>
                </>
              );
              return s.url ? (
                <a
                  key={i}
                  href={s.url}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    background: PANEL_BG,
                    border: BORDER,
                    borderRadius: 8,
                    color: INK,
                    textDecoration: 'none',
                  }}
                >
                  {body}
                </a>
              ) : (
                <div
                  key={i}
                  style={{
                    padding: '12px 16px',
                    background: PANEL_BG,
                    border: BORDER,
                    borderRadius: 8,
                  }}
                >
                  {body}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {followups.length > 0 && (
        <section>
          <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, letterSpacing: '0.14em', marginBottom: 10 }}>
            DIG DEEPER
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {followups.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(f);
                  router.replace(`/intelligence/ask?q=${encodeURIComponent(f)}`);
                  void runQuery(f);
                }}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: `0.5px solid ${TEAL}`,
                  borderRadius: 999,
                  color: TEAL,
                  fontSize: 12,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </section>
      )}

      {!answer && !isStreaming && !error && (
        <div style={{ padding: 24, background: PANEL_BG, border: BORDER, borderRadius: 10, color: MUTE, fontSize: 13, lineHeight: 1.6 }}>
          Try a question above. Ask Intelligence is <strong style={{ color: INK }}>stateless</strong> — it only reads
          from the Library. For engagement-specific reasoning, use the engagement console.
        </div>
      )}
    </div>
  );
}
