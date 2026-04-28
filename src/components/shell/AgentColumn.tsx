'use client';

// AgentColumn · Shell Layout Spec v2 §4 — Mode A implementation
//
// Structure (pinned top → scrollable middle → pinned bottom):
//   ├── [PINNED]     Agent identity row
//   ├── [PINNED]     Synthesis block (quote + agentContext + suggested actions)
//   ├── [SCROLLABLE] Conversation thread (ChatTurn[] from AtlasPageState)
//   └── [PINNED]     Input bar (textarea + send button)
//
// The conversation thread fills all remaining vertical space and auto-scrolls
// to the newest turn. Once any message is exchanged the synthesis block
// collapses to a compact header so the thread can breathe.
//
// Shell Layout Spec v2 §4.1 · April 2026

import type { ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { useAgentStream } from '@/hooks/useAgentStream';
import { ATLAS_SYNTHESIS_TURN_ID } from '@/lib/shell/atlas-page-state';
import { useAtlasPageState } from '@/hooks/useAtlasPageState';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentAction {
  letter: 'A' | 'B' | 'C';
  text: string;
  detail?: string;
}

export interface AgentColumnProps {
  agent: {
    initials: string;
    name: string;
    role: string;
  };
  quote: string;
  agentContext?: string;
  actions: AgentAction[];
  inputPlaceholder?: string;
  onActionClick?: (letter: 'A' | 'B' | 'C') => void;
  /** Optional panel rendered between actions and the conversation thread. */
  bottomSlot?: ReactNode;
  /** Surface identifier passed to local useAgentStream fallback. */
  surface?: string;
  /** Program identifier passed to local useAgentStream fallback. */
  programId?: string;
  /**
   * When provided, renders in place of the static `quote` string in the
   * synthesis block. Allows a streaming ReactNode (e.g. SentinelSynthesisQuote)
   * while keeping `quote` as the compact-header fallback string.
   */
  synthesisNode?: ReactNode;
}

// ── AgentColumn ───────────────────────────────────────────────────────────────

export function AgentColumn({
  agent,
  quote,
  agentContext,
  actions,
  inputPlaceholder,
  onActionClick,
  bottomSlot,
  surface,
  programId,
  synthesisNode,
}: AgentColumnProps) {
  const placeholder = inputPlaceholder ?? `Ask ${agent.name}…`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Prefer shared AtlasPageState (§6); fall back to local stream for components
  // not yet wrapped in AtlasPageStateProvider (backward compat during migration).
  const pageState = useAtlasPageState();
  const localStream = useAgentStream({
    surface: surface ?? 'home',
    programId,
    agentName: agent.name,
  });

  const ask          = pageState?.ask             ?? localStream.ask;
  const response     = pageState?.currentResponse ?? localStream.response;
  const isStreaming  = pageState?.isStreaming      ?? localStream.isStreaming;
  const error        = pageState?.error            ?? localStream.error;
  const clearLocal   = pageState?.clearResponse    ?? localStream.clear;
  const conversation = pageState
    ? pageState.conversation.filter((turn) => turn.id !== ATLAS_SYNTHESIS_TURN_ID)
    : [];

  const hasThread = conversation.length > 0 || isStreaming || !!response || !!error;

  // Auto-scroll to bottom whenever a new turn arrives or streaming updates.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, response]);

  function handleSubmit() {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming) return;
    ask(text);
    el.value = '';
    el.style.height = 'auto';
  }

  return (
    <div
      style={{
        width: 480,
        flexShrink: 0,
        background: SHELL.INK,
        padding: '28px 28px 0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Agent identity row ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          marginBottom: 18,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(250,247,241,0.15)',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* Glyph circle */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: SHELL.PAPER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 14,
              fontWeight: 600,
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            {agent.initials}
          </span>
        </div>

        {/* Name + role */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 17,
              color: 'rgba(250,247,241,1)',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {agent.name}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9.5,
              color: 'rgba(250,247,241,0.55)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              marginTop: 3,
              lineHeight: 1,
            }}
          >
            {agent.role}
          </span>
        </div>

        {/* Active badge */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            color: 'rgba(250,247,241,0.7)',
            padding: '4px 9px',
            background: 'rgba(250,247,241,0.10)',
            borderRadius: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <span style={{ color: '#9bb87a' }}>●</span>{' '}Active
        </div>
      </div>

      {/* ── Synthesis block (pinned, collapses when thread is open) ── */}
      {!hasThread && (
        <div style={{ flexShrink: 0 }}>
          {/* Quote — uses synthesisNode when provided, otherwise static string */}
          <p
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 19,
              fontStyle: 'italic',
              color: 'rgba(250,247,241,0.95)',
              lineHeight: 1.5,
              letterSpacing: '-0.008em',
              margin: '0 0 6px 0',
            }}
          >
            {synthesisNode ?? quote}
          </p>

          {/* Agent context */}
          {agentContext && (
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: 'rgba(250,247,241,0.55)',
                fontStyle: 'italic',
                margin: '0 0 22px 0',
              }}
            >
              {agentContext}
            </p>
          )}

          {/* Suggested actions */}
          <div
            style={{
              paddingTop: 18,
              borderTop: '1px solid rgba(250,247,241,0.15)',
              marginTop: agentContext ? 0 : 22,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9.5,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(250,247,241,0.55)',
                marginBottom: 4,
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              Suggested · {agent.name} has prepared
            </div>

            {actions.map((action) => (
              <ActionItem key={action.letter} action={action} onActionClick={onActionClick} />
            ))}
          </div>

          {/* Optional bottom slot */}
          {bottomSlot && (
            <div style={{ paddingTop: 12 }}>
              {bottomSlot}
            </div>
          )}
        </div>
      )}

      {/* ── Compact synthesis header (shown only when thread is open) ── */}
      {hasThread && (
        <div
          style={{
            flexShrink: 0,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(250,247,241,0.10)',
            marginBottom: 4,
          }}
        >
          <p
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 13,
              fontStyle: 'italic',
              color: 'rgba(250,247,241,0.45)',
              lineHeight: 1.4,
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
            dangerouslySetInnerHTML={{ __html: quote }}
          />
        </div>
      )}

      {/* ── Conversation thread (scrollable, fills remaining height) ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: hasThread ? 12 : 0,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(250,247,241,0.12) transparent',
        }}
      >
        {/* Thread label */}
        {hasThread && (
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(250,247,241,0.25)',
              marginBottom: 14,
              flexShrink: 0,
            }}
          >
            Conversation
          </div>
        )}

        {/* Completed turns */}
        {conversation.map((turn) => (
          <ChatBubble
            key={turn.id}
            role={turn.role}
            text={turn.text}
            label={turn.role === 'user' ? 'You' : `${agent.initials} · ${turn.agentName}`}
          />
        ))}

        {/* In-flight streaming turn */}
        {(isStreaming || response) && (
          <div style={{ marginBottom: 12, flexShrink: 0 }}>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: 'rgba(250,247,241,0.3)',
                marginBottom: 5,
                letterSpacing: '0.08em',
              }}
            >
              {agent.initials} · {agent.name}
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: 'rgba(250,247,241,0.88)',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}
            >
              {isStreaming && !response ? (
                <span style={{ color: 'rgba(250,247,241,0.35)', fontStyle: 'italic' }}>
                  thinking…
                </span>
              ) : (
                <>
                  {response}
                  {isStreaming && (
                    <span
                      style={{
                        display: 'inline-block',
                        opacity: 0.5,
                        animation: 'none',
                        marginLeft: 1,
                      }}
                    >
                      ▊
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.PEACH_TEXT,
              padding: '8px 12px',
              background: 'rgba(255,100,60,0.08)',
              borderRadius: 6,
              marginBottom: 8,
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>{error}</span>
            <button
              onClick={clearLocal}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: 'rgba(250,247,241,0.3)',
                padding: 0,
                flexShrink: 0,
              }}
            >
              dismiss ×
            </button>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={threadEndRef} />
      </div>

      {/* ── Input bar (always pinned to bottom) ── */}
      <div style={{ flexShrink: 0, padding: '16px 0 24px' }}>
        <div
          style={{
            background: 'rgba(250,247,241,0.08)',
            border: '1px solid rgba(250,247,241,0.20)',
            borderRadius: 22,
            padding: '11px 12px 11px 18px',
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            spellCheck
            placeholder={placeholder}
            disabled={isStreaming}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: 'rgba(250,247,241,0.85)',
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: 'auto',
              caretColor: SHELL.PAPER,
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {/* Send / spinner button */}
          <button
            onClick={handleSubmit}
            disabled={isStreaming}
            aria-label={isStreaming ? 'Sending…' : 'Send'}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: isStreaming ? 'rgba(250,247,241,0.12)' : SHELL.PAPER,
              border: 'none',
              cursor: isStreaming ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
              padding: 0,
            }}
          >
            {isStreaming ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle
                  cx="6" cy="6" r="4.5"
                  stroke="rgba(250,247,241,0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="14 8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 10.5V2.5M6.5 2.5L3 6M6.5 2.5L10 6"
                  stroke={SHELL.INK}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ChatBubble ─────────────────────────────────────────────────────────────────

function ChatBubble({
  role,
  text,
  label,
}: {
  role: 'user' | 'agent';
  text: string;
  label: string;
}) {
  const isUser = role === 'user';

  return (
    <div
      style={{
        marginBottom: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        flexShrink: 0,
      }}
    >
      {/* Speaker label */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: 'rgba(250,247,241,0.28)',
          marginBottom: 4,
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>

      {/* Message bubble */}
      <div
        style={{
          maxWidth: '88%',
          padding: '9px 13px',
          borderRadius: isUser
            ? '14px 14px 4px 14px'
            : '14px 14px 14px 4px',
          background: isUser
            ? 'rgba(250,247,241,0.12)'
            : 'rgba(250,247,241,0.06)',
          border: `1px solid ${
            isUser
              ? 'rgba(250,247,241,0.18)'
              : 'rgba(250,247,241,0.09)'
          }`,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: isUser
            ? 'rgba(250,247,241,0.90)'
            : 'rgba(250,247,241,0.85)',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ── ActionItem ─────────────────────────────────────────────────────────────────

function ActionItem({
  action,
  onActionClick,
}: {
  action: AgentAction;
  onActionClick?: (letter: 'A' | 'B' | 'C') => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        display: 'grid',
        gridTemplateColumns: '18px 1fr',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid rgba(250,247,241,0.10)',
        alignItems: 'baseline',
        cursor: 'pointer',
        transition: 'padding-left 0.15s',
      }}
      onClick={() => onActionClick?.(action.letter as 'A' | 'B' | 'C')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ')
          onActionClick?.(action.letter as 'A' | 'B' | 'C');
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.paddingLeft = '6px';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.paddingLeft = '0px';
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: 'rgba(250,247,241,1)',
          fontWeight: 600,
          opacity: 0.55,
          lineHeight: 1,
        }}
      >
        {action.letter}
      </span>

      <div>
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14.5,
            color: 'rgba(250,247,241,0.95)',
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: '-0.005em',
          }}
        >
          {action.text}
        </div>
        {action.detail && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11.5,
              color: 'rgba(250,247,241,0.55)',
              marginTop: 3,
            }}
          >
            {action.detail}
          </div>
        )}
      </div>
    </div>
  );
}
