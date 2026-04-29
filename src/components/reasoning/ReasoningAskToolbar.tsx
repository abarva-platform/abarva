'use client';

import React, { useRef, useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

export function ReasoningAskToolbar() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // cap at ~5 lines (5 * 22px line-height ≈ 110px)
    el.style.height = Math.min(el.scrollHeight, 110) + 'px';
  }

  async function handleSubmit() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const res = await fetch('/api/reasoning/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: 'admin' }),
      });
      if (!res.ok) {
        setError(`Request failed (${res.status})`);
        return;
      }
      const data = await res.json() as { response?: string };
      setResponse(data.response ?? 'No response received.');
    } catch (_err) {
      setError('No response endpoint configured');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: `1px solid ${SHELL.CARD_LINE}`,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        zIndex: 50,
        padding: '12px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 'min(860px, 100%)',
          margin: '0 auto',
        }}
      >
        {/* Response bubble */}
        {(response || error) && (
          <div
            style={{
              position: 'relative',
              background: '#ffffff',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: error ? SHELL.RUST_TEXT : SHELL.INK,
              lineHeight: 1.5,
            }}
          >
            <button
              onClick={() => { setResponse(null); setError(null); }}
              aria-label="Dismiss response"
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: SHELL.INK_MUTED,
                fontSize: 14,
                lineHeight: 1,
                padding: '0 2px',
              }}
            >
              ✕
            </button>
            <span style={{ paddingRight: 24 }}>{error ?? response}</span>
          </div>
        )}

        {/* Input row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
          }}
        >
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => { setQuestion(e.target.value); autoGrow(); }}
            onInput={autoGrow}
            onKeyDown={handleKeyDown}
            disabled={loading}
            spellCheck={true}
            aria-label="Ask about reasoning health"
            placeholder="Ask anything about this program's reasoning health…"
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              color: SHELL.INK,
              lineHeight: '22px',
              overflowY: 'hidden',
              minHeight: 22,
              maxHeight: 110,
              padding: 0,
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!question.trim() || loading}
            aria-label="Send question"
            style={{
              background: (!question.trim() || loading) ? SHELL.INK_MUTED : '#000000',
              color: '#ffffff',
              borderRadius: 8,
              padding: '8px 16px',
              border: 'none',
              cursor: (!question.trim() || loading) ? 'not-allowed' : 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {loading ? '⟳' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
}
