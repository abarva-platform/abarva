'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const PURPLE = '#9B6DFF';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const DIM = 'rgba(245, 245, 240, 0.48)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

const RECENT_KEY = 'abarva_ask_recent';
const RECENT_LIMIT = 6;

interface Suggestion {
  q: string;
  tag: string;
}

const SUGGESTION_GROUPS: Array<{ title: string; color: string; tag: string; items: Suggestion[] }> = [
  {
    title: 'Operations',
    color: TEAL,
    tag: 'OPS',
    items: [
      { q: 'How do payers typically deploy Abridge in ambient documentation?', tag: 'vendor' },
      { q: 'What patterns precede AI contact center deflection stalls?', tag: 'pattern' },
      { q: 'What does a realistic $ / claim denial benchmark look like at scale?', tag: 'benchmark' },
    ],
  },
  {
    title: 'Regulatory',
    color: PURPLE,
    tag: 'REG',
    items: [
      { q: 'Summarize HIPAA § 164.308 administrative safeguards', tag: 'regulation' },
      { q: 'When does EU AI Act require human-in-the-loop for high-risk systems?', tag: 'regulation' },
      { q: 'What are SEC marketing rule implications for AI-personalized pitches?', tag: 'regulation' },
    ],
  },
  {
    title: 'Vendors + patterns',
    color: AMBER,
    tag: 'VENDOR',
    items: [
      { q: 'Compare Glean vs Moveworks for IT copilot use cases', tag: 'vendor' },
      { q: 'What triggers F008 enterprise AI procurement pattern?', tag: 'pattern' },
      { q: 'How do companies reconcile Snowflake Cortex vs Databricks Mosaic?', tag: 'vendor' },
    ],
  },
  {
    title: 'Benchmarks',
    color: GREEN,
    tag: 'BENCH',
    items: [
      { q: 'Typical AI pilot-to-production conversion rates in banking', tag: 'benchmark' },
      { q: 'Benchmark: time-to-value for RAG systems at insurers', tag: 'benchmark' },
      { q: 'Typical shadow-AI spend as % of IT budget', tag: 'benchmark' },
    ],
  },
];

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
  const [recent, setRecent] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) setRecent(parsed.slice(0, RECENT_LIMIT));
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  function rememberQuery(q: string) {
    setRecent((prev) => {
      const next = [q, ...prev.filter((p) => p !== q)].slice(0, RECENT_LIMIT);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }

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
    rememberQuery(q);
    router.replace(`/intelligence/ask?q=${encodeURIComponent(q)}`);
    await runQuery(q);
  }

  function pickQuery(q: string) {
    setQuery(q);
    rememberQuery(q);
    router.replace(`/intelligence/ask?q=${encodeURIComponent(q)}`);
    void runQuery(q);
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
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, letterSpacing: '0.14em', marginBottom: 10 }}>
            DIG DEEPER
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {followups.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickQuery(f)}
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
        <>
          {recent.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.14em', marginBottom: 10 }}>
                RECENT · {recent.length}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recent.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickQuery(r)}
                    style={{
                      padding: '6px 12px',
                      background: PANEL_BG,
                      border: BORDER,
                      borderRadius: 999,
                      color: INK,
                      fontSize: 12,
                      fontFamily: 'DM Sans, sans-serif',
                      cursor: 'pointer',
                      maxWidth: 420,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ color: DIM, marginRight: 6, fontFamily: MONO, fontSize: 10 }}>↻</span>
                    {r}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.14em', marginBottom: 14 }}>
              SUGGESTED · try one
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {SUGGESTION_GROUPS.map((g) => (
                <div key={g.title} style={{ background: PANEL_BG, border: BORDER, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: g.color, letterSpacing: '0.14em', marginBottom: 10 }}>
                    ■ {g.title.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {g.items.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pickQuery(s.q)}
                        style={{
                          display: 'block',
                          textAlign: 'left',
                          padding: '8px 10px',
                          background: 'transparent',
                          border: BORDER,
                          borderRadius: 6,
                          color: INK,
                          fontSize: 13,
                          fontFamily: 'DM Sans, sans-serif',
                          cursor: 'pointer',
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ fontFamily: MONO, fontSize: 9, color: DIM, letterSpacing: '0.1em', marginRight: 6 }}>
                          {s.tag}
                        </span>
                        {s.q}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ padding: 16, background: PANEL_BG, border: BORDER, borderRadius: 10, color: MUTE, fontSize: 12, lineHeight: 1.6 }}>
            Ask Intelligence is <strong style={{ color: INK }}>stateless</strong>. It only reads from the Library
            — no personalization, no engagement context. For engagement-specific reasoning, use the engagement console.
          </div>
        </>
      )}
    </div>
  );
}
