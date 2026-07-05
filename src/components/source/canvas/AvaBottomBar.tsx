'use client';

import { useState, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { AgentMarkdown } from '@/lib/agent/markdownRenderer';
import type { ChatMessage, SuggestedAction } from '@/components/agent/AgentDock';
import { CANVAS } from './canvas-tokens';

interface AvaBottomBarProps {
  agentName: string;
  thread: ChatMessage[];
  onMessage: (text: string) => Promise<void>;
  suggestedActions?: SuggestedAction[];
}

/**
 * Slim aVa composer pinned to the bottom of the canvas workspace.
 * Suggested action chips sit above the input row. The thread toggle
 * expands a slide-up panel to show conversation history.
 */
export function AvaBottomBar({
  agentName,
  thread,
  onMessage,
  suggestedActions = [],
}: AvaBottomBarProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    if (!threadOpen) setThreadOpen(true);
    try {
      await onMessage(text);
    } finally {
      setSending(false);
      // Scroll to latest message.
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const fillSuggestion = (body: string) => {
    setDraft(body);
    inputRef.current?.focus();
  };

  const replyCount = Math.floor(thread.length / 2);

  return (
    <div style={WRAPPER_STYLE}>
      {threadOpen && thread.length > 0 ? (
        <div style={THREAD_PANEL_STYLE}>
          <div style={THREAD_HEAD_STYLE}>
            <span style={THREAD_HEAD_LABEL_STYLE}>{agentName}</span>
            <button
              type="button"
              onClick={() => setThreadOpen(false)}
              style={CLOSE_BTN_STYLE}
              aria-label="Collapse conversation"
            >
              ↓
            </button>
          </div>
          <div style={MESSAGES_STYLE}>
            {thread.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} style={USER_ROW_STYLE}>
                  <span style={USER_BUBBLE_STYLE}>{msg.body}</span>
                </div>
              ) : (
                <div key={msg.id} style={AGENT_ROW_STYLE}>
                  <span style={AGENT_ICON_STYLE}>aVa</span>
                  <div style={AGENT_BUBBLE_STYLE}>
                    <AgentMarkdown text={msg.body} />
                  </div>
                </div>
              ),
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : null}

      {suggestedActions.length > 0 && !draft ? (
        <div style={CHIPS_ROW_STYLE}>
          {suggestedActions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => fillSuggestion(a.body)}
              style={CHIP_STYLE}
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}

      <div style={BAR_STYLE}>
        <div style={AVA_BADGE_STYLE} aria-hidden>
          aVa
        </div>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Ask ${agentName}…`}
          disabled={sending}
          style={INPUT_STYLE}
          aria-label={`Message ${agentName}`}
          spellCheck
        />
        {thread.length > 0 ? (
          <button
            type="button"
            onClick={() => setThreadOpen((o) => !o)}
            style={THREAD_TOGGLE_STYLE}
            aria-label={
              threadOpen
                ? 'Collapse conversation'
                : `View conversation (${replyCount} ${replyCount === 1 ? 'exchange' : 'exchanges'})`
            }
            aria-pressed={threadOpen}
          >
            {replyCount} {replyCount === 1 ? 'exchange' : 'exchanges'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!draft.trim() || sending}
          style={{
            ...SEND_BTN_STYLE,
            ...(draft.trim() && !sending ? SEND_BTN_ACTIVE_STYLE : SEND_BTN_INACTIVE_STYLE),
          }}
          aria-label="Send message"
        >
          {sending ? '…' : '↑'}
        </button>
      </div>
    </div>
  );
}

const WRAPPER_STYLE: CSSProperties = {
  position: 'relative',
  flexShrink: 0,
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  background: CANVAS.PAGE_BG,
};

const THREAD_PANEL_STYLE: CSSProperties = {
  position: 'absolute',
  bottom: '100%',
  left: 0,
  right: 0,
  maxHeight: '56vh',
  background: CANVAS.PAGE_BG,
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 -4px 20px rgba(10,10,11,0.07)',
};

const THREAD_HEAD_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '9px 16px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  flexShrink: 0,
};

const THREAD_HEAD_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: CANVAS.INK,
};

const CLOSE_BTN_STYLE: CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  color: CANVAS.INK_MUTED,
  cursor: 'pointer',
  lineHeight: 1,
  padding: '2px 4px',
};

const MESSAGES_STYLE: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px 16px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const USER_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const AGENT_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
};

const AGENT_ICON_STYLE: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 999,
  background: CANVAS.INK,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: CANVAS.MONO,
  fontSize: 7,
  fontWeight: 700,
  letterSpacing: '0.03em',
  flexShrink: 0,
  marginTop: 2,
};

const USER_BUBBLE_STYLE: CSSProperties = {
  maxWidth: '75%',
  background: 'rgba(12,26,58,0.06)',
  borderRadius: '12px 12px 2px 12px',
  padding: '8px 12px',
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
  lineHeight: 1.5,
};

const AGENT_BUBBLE_STYLE: CSSProperties = {
  flex: 1,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
  lineHeight: 1.6,
  minWidth: 0,
};

const CHIPS_ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 6,
  padding: '8px 14px 0',
  flexWrap: 'wrap',
};

const CHIP_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  background: 'rgba(12,26,58,0.04)',
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 14,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 100ms',
};

const BAR_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '10px 14px',
};

const AVA_BADGE_STYLE: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 999,
  background: CANVAS.INK,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: CANVAS.MONO,
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.04em',
  flexShrink: 0,
};

const INPUT_STYLE: CSSProperties = {
  flex: 1,
  height: 34,
  background: 'rgba(12,26,58,0.03)',
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 17,
  padding: '0 14px',
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
  outline: 'none',
  minWidth: 0,
};

const THREAD_TOGGLE_STYLE: CSSProperties = {
  flexShrink: 0,
  background: 'transparent',
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 12,
  padding: '3px 9px',
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: CANVAS.INK_SOFT,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const SEND_BTN_STYLE: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: CANVAS.SANS,
  fontSize: 15,
  fontWeight: 600,
  flexShrink: 0,
  border: '1px solid transparent',
  transition: 'background 120ms, color 120ms, border-color 120ms',
};

const SEND_BTN_ACTIVE_STYLE: CSSProperties = {
  background: CANVAS.INK,
  color: '#fff',
  borderColor: CANVAS.INK,
  cursor: 'pointer',
};

const SEND_BTN_INACTIVE_STYLE: CSSProperties = {
  background: 'transparent',
  color: CANVAS.INK_MUTED,
  borderColor: CANVAS.RULE,
  cursor: 'not-allowed',
};
