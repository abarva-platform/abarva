'use client';

// SentinelExplorerRail · left sidebar for Context & Corpus Explorer
//
// 386px fixed width. Contains:
//  - Sentinel header with green pulsing dot
//  - Subtitle explaining the surface
//  - Scrollable conversation thread
//  - 4 starter question chips
//  - Sticky bottom textarea (Enter=submit, Shift+Enter=newline, auto-grow)
//  - Grounded chip on each answer showing which dimension powered it

import { useState, useRef, useCallback } from 'react';

const C = {
  bg: '#F8F7F4',
  railBg: '#FCFBF8',
  panel: '#FFFFFF',
  ink: '#1B1A17',
  muted: '#6F6A61',
  line: '#E6E2DA',
  line2: '#EFECE5',
  chip: '#F1EEE7',
  fresh: '#3F7A5B',
  freshBg: '#3F7A5B14',
  attention: '#B5852A',
  attentionBg: '#B5852A18',
  stale: '#B4513C',
};

interface ConvoMessage {
  role: 'user' | 'agent';
  html: string;
  grounded?: string;
  grndCls?: 'att' | 'stale' | null;
}

const STARTER_QUESTIONS = [
  { key: 'telling', label: 'What is my context telling me right now?' },
  { key: 'derive', label: 'Derive a view of our vendor risk' },
  { key: 'unlock', label: 'What insights are blocked, and why?' },
  { key: 'copilot', label: 'Is our Copilot investment paying off?' },
] as const;

const CANNED_ANSWERS: Record<string, {
  lead: string;
  grnd?: string;
  grndCls?: 'att' | 'stale' | null;
  route: string;
  conf: string;
  miss?: string;
}> = {
  telling: {
    lead: "Six significant things. Loudest: <b>(1)</b> a $4.2M AMS contract auto-renews in 94 days with no benchmark; <b>(2)</b> Copilot adoption 31% vs 70% case; <b>(3)</b> MTTR up 22% breaching SLA. One is <i>pending review</i>, one <i>blocked</i> by a stale dimension.",
    route: 'L2 insight feed · rule-derived',
    conf: 'high',
    grnd: '6 rules · 1,284 facts · dims 3 5 6 9 10 11',
  },
  derive: {
    lead: "Composed a vendor-risk view: <b>2 vendor insights</b>, <b>6 renewals &lt;120d</b>, <b>$8.9M</b> under renewal. Pinned to Insights.",
    route: 'derive-view · composed from L1 facts',
    conf: 'high',
    grnd: 'Dim 11 · Vendor & contract · 67 records · attention',
    grndCls: 'att',
  },
  unlock: {
    lead: "<b>Two insights are blocked and two degraded.</b> <i>Renewal-without-benchmark</i> and <i>Compliance exposure</i> are blocked — they need dimensions <b>13 (Industry context)</b> and <b>12 (Compliance)</b>, both not loaded. <i>AI value-at-risk</i> and <i>spend-vs-value</i> are degraded because <b>dim 4 (IT financials)</b> is stale.",
    route: 'SQL · answerability ladder',
    conf: 'high',
    grnd: 'Coverage view · 9/14 dims loaded · 5 blocked insights',
    miss: 'Dimensions 12 & 13 not loaded; dim 4 stale.',
  },
  copilot: {
    lead: "<b>Not yet — and I can prove the gap but not the upside.</b> 31% adoption vs 70% case; $0.31M committed; PR cycle-time only −9%. Can't confirm realised value: DORA isn't connected and IT-financials is stale.",
    route: 'Hybrid · SQL + retrieval',
    conf: 'high',
    grnd: 'Dim 10 · Operating telemetry (stale Apr 30) + Dim 6 · AI initiative charter',
    grndCls: 'att',
    miss: 'DORA not connected; IT-financials stale.',
  },
};

const OPENER_MSG: ConvoMessage = {
  role: 'agent',
  html: "Your context is telling me <b>6 significant things</b>. The loudest: an AMS contract auto-renews in 94 days with <b>no benchmark</b> — because the <i>Industry context</i> dimension isn't loaded. Explore the tabs or ask me anything.",
};

export function SentinelExplorerRail() {
  const [messages, setMessages] = useState<ConvoMessage[]>([OPENER_MSG]);
  const [showStarters, setShowStarters] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const convoRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (convoRef.current) {
        convoRef.current.scrollTop = convoRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  const addMessage = useCallback((msg: ConvoMessage) => {
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
  }, [scrollToBottom]);

  const handleAsk = useCallback((questionText: string, key?: string) => {
    if (!questionText.trim()) return;
    setShowStarters(false);
    addMessage({ role: 'user', html: questionText });

    // resolve canned answer
    let answerKey = key;
    if (!answerKey) {
      const t = questionText.toLowerCase();
      if (/telling|significan|insight/.test(t)) answerKey = 'telling';
      else if (/derive|view of|dashboard/.test(t)) answerKey = 'derive';
      else if (/block|unlock|missing|can.?t|why/.test(t)) answerKey = 'unlock';
      else if (/copilot|paying|invest/.test(t)) answerKey = 'copilot';
    }

    const canned = answerKey ? CANNED_ANSWERS[answerKey] : null;

    // Simulate a brief routing delay
    setTimeout(() => {
      if (canned) {
        addMessage({
          role: 'agent',
          html: canned.lead,
          grounded: canned.grnd,
          grndCls: canned.grndCls,
        });
      } else {
        addMessage({
          role: 'agent',
          html: "In the live build I'd route this deterministically (rules over facts, SQL for counts/trends, retrieval for documents, graph for connected) and cite everything. Try the starters.",
          grounded: 'router · demo · prototype',
        });
      }
    }, 480);
  }, [addMessage]);

  const handleSubmit = useCallback(() => {
    const v = inputValue.trim();
    if (!v) return;
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    handleAsk(v);
  }, [inputValue, handleAsk]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
  }, []);

  return (
    <aside
      style={{
        width: 386,
        minWidth: 386,
        borderRight: `1px solid ${C.line}`,
        display: 'flex',
        flexDirection: 'column',
        background: C.railBg,
        height: '100%',
      }}
    >
      {/* Rail header */}
      <div
        style={{
          padding: '13px 17px 11px',
          borderBottom: `1px solid ${C.line2}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {/* Pulsing green dot */}
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: C.fresh,
              boxShadow: `0 0 0 3px ${C.freshBg}`,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 15,
              color: C.ink,
            }}
          >
            Sentinel
          </span>
        </div>
        <p
          style={{
            color: C.muted,
            fontSize: 11.5,
            marginTop: 3,
            lineHeight: 1.4,
            marginBottom: 0,
          }}
        >
          Ask what the context is telling you, or &ldquo;derive a view&rdquo;. Every answer is evidence-cited.
        </p>
      </div>

      {/* Conversation thread */}
      <div
        ref={convoRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px 17px 6px',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 14,
              textAlign: msg.role === 'user' ? 'right' : 'left',
            }}
          >
            {msg.role === 'user' ? (
              <span
                style={{
                  background: C.ink,
                  color: '#fff',
                  borderRadius: '13px 13px 4px 13px',
                  padding: '8px 12px',
                  display: 'inline-block',
                  maxWidth: '90%',
                  fontSize: 13,
                  textAlign: 'left',
                }}
              >
                {msg.html}
              </span>
            ) : (
              <div
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 6,
                  padding: '12px 13px',
                }}
              >
                <p
                  style={{ fontSize: 13.5, margin: '0 0 8px' }}
                  dangerouslySetInnerHTML={{ __html: msg.html }}
                />
                {msg.grounded && (
                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: msg.grndCls === 'att'
                          ? C.attentionBg
                          : msg.grndCls === 'stale'
                            ? `${C.stale}16`
                            : C.freshBg,
                        color: msg.grndCls === 'att'
                          ? C.attention
                          : msg.grndCls === 'stale'
                            ? C.stale
                            : C.fresh,
                        border: `1px solid ${msg.grndCls === 'att'
                          ? `${C.attention}33`
                          : msg.grndCls === 'stale'
                            ? `${C.stale}33`
                            : `${C.fresh}33`}`,
                        display: 'inline-block',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⬡ grounded · {msg.grounded}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Starter chips */}
      {showStarters && (
        <div style={{ padding: '0 17px 10px' }}>
          <div
            style={{
              fontSize: 10.5,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              color: C.muted,
              margin: '6px 0 7px',
            }}
          >
            Try asking
          </div>
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => handleAsk(q.label, q.key)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: '#fff',
                border: `1px solid ${C.line}`,
                borderRadius: 6,
                padding: '8px 10px',
                marginBottom: 6,
                fontSize: 12.5,
                color: C.ink,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ color: C.muted, marginRight: 5 }}>›</span>
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Sticky bottom input */}
      <div
        style={{
          borderTop: `1px solid ${C.line}`,
          padding: '10px 13px 12px',
          background: C.railBg,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 7,
            background: '#fff',
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: '7px 9px',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder='Ask anything · or "derive a view of…"'
            spellCheck
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              lineHeight: 1.4,
              maxHeight: 110,
              background: 'none',
              color: C.ink,
            }}
          />
          <button
            type="button"
            disabled={!inputValue.trim()}
            onClick={handleSubmit}
            style={{
              width: 29,
              height: 29,
              borderRadius: 7,
              background: C.ink,
              color: '#fff',
              border: 'none',
              fontSize: 15,
              cursor: inputValue.trim() ? 'pointer' : 'default',
              opacity: inputValue.trim() ? 1 : 0.4,
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <div
          style={{
            fontSize: 10,
            color: C.muted,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          Enter to submit · Shift+Enter for newline
        </div>
      </div>
    </aside>
  );
}
