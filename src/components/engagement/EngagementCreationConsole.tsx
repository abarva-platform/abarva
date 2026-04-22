'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSITIONS, MOTION, FOCUS_RING } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';

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
  function_code: string;
  objective_code: string;
  topic_code: string | null;
  current_phase: number;
  sponsor_person_id: string | null;
};

type SponsorSummary = {
  graph_node_id: string | null;
  name: string;
  role: string | null;
  organization: string | null;
  title: string | null;
  cxo_function: string | null;
  primary_focus: string | null;
};

type Labels = {
  industry: string;
  function: string;
  objective: string;
};

const OPENER_ID = 'opener-0';
const OPENER_CONTENT = "Let's start a new Program. Who are we working with?";

const BG = '#0A0A0A';
const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const CORAL = '#FF6B4A';
const FONT_BODY = 'DM Sans, -apple-system, sans-serif';
const FONT_MONO = 'JetBrains Mono, monospace';
const FONT_SERIF = 'Georgia, serif';

// Strip the full <engagement_ready>...</engagement_ready> block. Applied to
// the final content after stream completes.
function stripBlock(text: string): string {
  return text.replace(/<engagement_ready>[\s\S]*?<\/engagement_ready>/g, '').trim();
}

// Live-strip for the streaming delta feed. A partial stream may contain just
// `<engagement_ready>` with the closing tag still pending — we cut the view at
// the opener so the user never sees the JSON scaffolding as it arrives. Also
// trims any trailing whitespace the cut produces.
function liveStrip(text: string): string {
  const openIdx = text.indexOf('<engagement_ready>');
  if (openIdx === -1) return text;
  const closeIdx = text.indexOf('</engagement_ready>');
  if (closeIdx !== -1) {
    return (text.slice(0, openIdx) + text.slice(closeIdx + '</engagement_ready>'.length)).trimEnd();
  }
  // Opening tag streamed but closing hasn't arrived yet — hide from opener on
  return text.slice(0, openIdx).trimEnd();
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
  const [sponsor, setSponsor] = useState<SponsorSummary | null>(null);
  const [labels, setLabels] = useState<Labels | null>(null);
  const [activeClientName, setActiveClientName] = useState<string | null>(null);
  const idRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [composerFocused, setComposerFocused] = useState(false);
  const [sendPressed, setSendPressed] = useState(false);
  const [sendHovered, setSendHovered] = useState(false);
  const [startHovered, setStartHovered] = useState(false);
  const [startPressed, setStartPressed] = useState(false);
  // Countdown to auto-advance into the engagement console. Starts at 3 once
  // the engagement is created; ticks down once per second; user can click
  // "Start Phase 0 →" to skip, or "Review first" to cancel.
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);
  const [autoAdvanceCancelled, setAutoAdvanceCancelled] = useState(false);
  const redirectRef = useRef(false);
  const nextId = () => `local-${Date.now()}-${++idRef.current}`;
  const reducedMotion = useReducedMotion();

  // Auto-resize textarea between 1 and 6 rows as the user types.
  const MIN_ROWS = 1;
  const MAX_ROWS = 6;
  const LINE_HEIGHT_PX = 22; // 14px font · 1.6 line-height ≈ 22
  const VERTICAL_PADDING_PX = 20;
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const contentRows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.ceil((el.scrollHeight - VERTICAL_PADDING_PX) / LINE_HEIGHT_PX)));
    el.style.height = `${contentRows * LINE_HEIGHT_PX + VERTICAL_PADDING_PX}px`;
    el.style.overflowY = contentRows === MAX_ROWS ? 'auto' : 'hidden';
  }, [input]);

  // Auto-advance with countdown · user sees the readout for ~3 seconds,
  // then the console loads automatically unless they click "Review first".
  // Kicks off once `created` fires and stays honoured until cancelled. Fix
  // for the PR #20 regression that left automated testers + humans who
  // didn't know about the button stuck on this page indefinitely.
  useEffect(() => {
    if (!created || autoAdvanceCancelled) return;
    if (redirectRef.current) return;
    setAutoAdvanceSeconds(3);
    const interval = setInterval(() => {
      setAutoAdvanceSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          if (!redirectRef.current) {
            redirectRef.current = true;
            router.push(`/engagements/${encodeURIComponent(created.graph_node_id)}`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [created, autoAdvanceCancelled, router]);

  // Auto-scroll to the latest bubble or to the readout as it appears.
  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' });
  }, [messages, created, reducedMotion]);

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
            const rich = evt as unknown as {
              sponsor?: SponsorSummary;
              labels?: Labels;
              active_client?: string | null;
            };
            if (rich.sponsor) setSponsor(rich.sponsor);
            if (rich.labels) setLabels(rich.labels);
            if (typeof rich.active_client === 'string') setActiveClientName(rich.active_client);
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
      <style jsx>{`
        @keyframes creationStreamPulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.9; }
        }
        @keyframes creationReadoutEnter {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ padding: 24, maxWidth: 820, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT_SERIF, marginBottom: 4 }}>
            <span style={{ color: INK, fontSize: 17, fontWeight: 800 }}>Abar</span>
            <span style={{ color: TEAL, fontSize: 23, fontWeight: 900 }}>Va</span>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Program · New
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
                  background: m.role === 'assistant' ? 'rgba(20,184,166,0.05)' : 'rgba(255,255,255,0.06)',
                  border: `0.5px solid ${
                    m.errored
                      ? 'rgba(255,107,74,0.5)'
                      : m.role === 'assistant'
                      ? 'rgba(20,184,166,0.2)'
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
                  {m.role === 'assistant' ? `NEXUS${m.streaming ? ' · streaming' : ''}` : 'YOU'}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {m.role === 'assistant' ? liveStrip(m.content) : m.content}
                  {m.streaming && (
                    <span
                      aria-hidden="true"
                      style={{
                        color: TEAL,
                        opacity: 0.7,
                        animation: reducedMotion ? undefined : `creationStreamPulse 1.2s ${MOTION.easing.easeInOut} infinite`,
                      }}
                    >
                      ▊
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {created && (
            <div
              style={{
                marginTop: 20,
                padding: 20,
                background: 'rgba(20,184,166,0.06)',
                border: `0.5px solid ${TEAL}4D`,
                borderRadius: 10,
                animation: reducedMotion
                  ? undefined
                  : `creationReadoutEnter ${MOTION.duration.default} ${MOTION.easing.easeOut} both`,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: TEAL,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                ✓ Program created · review before starting Phase 0
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: FONT_SERIF, marginBottom: 14 }}>
                {created.name}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  columnGap: 20,
                  rowGap: 10,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase', marginBottom: 2 }}>
                    Client
                  </div>
                  <div>{activeClientName ?? sponsor?.organization ?? '—'}</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase', marginBottom: 2 }}>
                    Phase
                  </div>
                  <div>Phase 0 · Intake</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase', marginBottom: 2 }}>
                    Sponsor
                  </div>
                  <div>
                    {sponsor?.name ?? '—'}
                    {sponsor?.title || sponsor?.role ? (
                      <span style={{ color: MUTE }}>
                        {' · '}
                        {sponsor.title ?? sponsor.role}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase', marginBottom: 2 }}>
                    Industry
                  </div>
                  <div>{labels?.industry ?? created.industry_code}</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase', marginBottom: 2 }}>
                    Function
                  </div>
                  <div>{labels?.function ?? created.function_code}</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase', marginBottom: 2 }}>
                    Objective
                  </div>
                  <div>{labels?.objective ?? created.objective_code}</div>
                </div>
                {created.topic_code ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase', marginBottom: 2 }}>
                      Topic
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12 }}>{created.topic_code}</div>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    redirectRef.current = true;
                    router.push(`/engagements/${encodeURIComponent(created.graph_node_id)}`);
                  }}
                  onMouseEnter={() => setStartHovered(true)}
                  onMouseLeave={() => { setStartHovered(false); setStartPressed(false); }}
                  onMouseDown={() => setStartPressed(true)}
                  onMouseUp={() => setStartPressed(false)}
                  style={{
                    padding: '10px 20px',
                    background: startPressed ? '#0F766E' : startHovered ? '#0D9488' : TEAL,
                    color: BG,
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transform: startPressed ? 'translateY(1px)' : 'translateY(0)',
                    transition: reducedMotion
                      ? undefined
                      : `background-color ${TRANSITIONS.hover}, transform ${TRANSITIONS.press}`,
                  }}
                >
                  Start Phase 0 →
                  {autoAdvanceSeconds !== null && autoAdvanceSeconds > 0 && !autoAdvanceCancelled ? (
                    <span style={{ marginLeft: 8, fontFamily: FONT_MONO, fontSize: 11, opacity: 0.7 }}>
                      ({autoAdvanceSeconds})
                    </span>
                  ) : null}
                </button>
                {autoAdvanceSeconds !== null && autoAdvanceSeconds > 0 && !autoAdvanceCancelled ? (
                  <button
                    type="button"
                    onClick={() => setAutoAdvanceCancelled(true)}
                    style={{
                      padding: '10px 16px',
                      background: 'transparent',
                      color: MUTE,
                      border: '0.5px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      fontFamily: 'inherit',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: reducedMotion ? undefined : `color ${TRANSITIONS.hover}, border-color ${TRANSITIONS.hover}`,
                    }}
                  >
                    Review first
                  </button>
                ) : null}
                <span style={{ fontSize: 12, color: MUTE, fontFamily: FONT_MONO }}>
                  {autoAdvanceCancelled ? (
                    <>
                      Auto-advance cancelled. Click Start Phase 0 when ready.{' '}
                      <a href="/programs/new" style={{ color: TEAL, textDecoration: 'underline' }}>
                        Start over
                      </a>
                    </>
                  ) : (
                    <>
                      Something wrong?{' '}
                      <a href="/programs/new" style={{ color: TEAL, textDecoration: 'underline' }}>
                        Start over
                      </a>
                    </>
                  )}
                </span>
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
            <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                  // Enter submits · Shift+Enter inserts a newline
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isStreaming && input.trim()) {
                      // Submit via the form's onSubmit handler
                      e.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                disabled={isStreaming}
                onFocus={() => setComposerFocused(true)}
                onBlur={() => setComposerFocused(false)}
                placeholder="Describe the program…"
                rows={1}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: `0.5px solid ${composerFocused ? TEAL : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 8,
                  color: INK,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  lineHeight: 1.6,
                  resize: 'none',
                  outline: 'none',
                  overflow: 'hidden',
                  transition: reducedMotion
                    ? undefined
                    : `border-color ${TRANSITIONS.focus}, box-shadow ${TRANSITIONS.focus}`,
                  boxShadow: composerFocused ? FOCUS_RING.brand : 'none',
                }}
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                onMouseEnter={() => setSendHovered(true)}
                onMouseLeave={() => { setSendHovered(false); setSendPressed(false); }}
                onMouseDown={() => setSendPressed(true)}
                onMouseUp={() => setSendPressed(false)}
                style={{
                  padding: '10px 18px',
                  background: sendPressed ? '#0F766E' : sendHovered ? '#0D9488' : TEAL,
                  color: BG,
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
                  opacity: isStreaming || !input.trim() ? 0.5 : 1,
                  transform: sendPressed ? 'translateY(1px)' : 'translateY(0)',
                  transition: reducedMotion
                    ? undefined
                    : `background-color ${TRANSITIONS.hover}, transform ${TRANSITIONS.press}`,
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
