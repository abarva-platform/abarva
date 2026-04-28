'use client';

// AtlasDrawer · Shell Layout Spec v2 §5.1 — Mode B right-side chat drawer
//
// A 340px panel that slides in from the right edge of the viewport.  It reads
// from the shared AtlasPageState (same conversation as the RibbonSynthesis
// button) and renders the full chat thread + input bar — identical in function
// to the AgentColumn thread zone but right-side oriented.
//
// Lifecycle:
//   • Closed → transform: translateX(100%)  (off-screen right)
//   • Open   → transform: translateX(0)     (CSS transition 220ms ease-out)
//
// Shell Layout Spec v2 §5.1 · April 2026

import { useRef, useEffect } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AtlasDrawerProps {
  /** Whether the drawer is visible. */
  isOpen: boolean;
  /** Called when the backdrop or close button is clicked. */
  onClose: () => void;
  agent: {
    initials: string;
    name: string;
    role: string;
  };
  /** Synthesis quote shown as compact header inside the drawer. */
  quote: string;
  /** Surface identifier for local useAgentStream fallback. */
  surface?: string;
  /** Program identifier for local useAgentStream fallback. */
  programId?: string;
}

// ── AtlasDrawer ───────────────────────────────────────────────────────────────

export function AtlasDrawer({
  isOpen,
  onClose,
  agent,
  quote,
  surface,
  programId,
}: AtlasDrawerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Shared AtlasPageState — same conversation as the RibbonSynthesis surface.
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
  const conversation = pageState?.conversation     ?? [];

  const hasThread = conversation.length > 0 || isStreaming || !!response || !!error;

  // Auto-scroll to latest turn whenever content changes.
  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, conversation.length, response]);

  // Focus textarea when drawer opens.
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 250);
    }
  }, [isOpen]);

  function handleSubmit() {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming) return;
    ask(text);
    el.value = '';
    el.style.height = 'auto';
  }

  const plainQuote = quote.replace(/<[^>]+>/g, '');

  return (
    <>
      {/* Backdrop — darkens canvas when drawer open */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.22)',
          zIndex: 190,
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 220ms ease-out',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          background: SHELL.INK,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 220ms ease-out',
          boxShadow: isOpen ? '-8px 0 32px rgba(0,0,0,0.30)' : 'none',
        }}
      >
        {/* ── Drawer header ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: '14px 18px 12px',
            borderBottom: '1px solid rgba(250,247,241,0.12)',
            flexShrink: 0,
          }}
        >
          {/* Glyph */}
          <div
            style={{
              width: 28,
              height: 28,
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
                fontSize: 11,
                fontWeight: 600,
                color: SHELL.INK,
                lineHeight: 1,
              }}
            >
              {agent.initials}
            </span>
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(250,247,241,0.95)',
                lineHeight: 1.2,
              }}
            >
              {agent.name}
            </div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 8.5,
                color: 'rgba(250,247,241,0.45)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginTop: 2,
                lineHeight: 1,
              }}
            >
              {agent.role}
            </div>
          </div>

          {/* Active badge */}
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8.5,
              color: 'rgba(250,247,241,0.6)',
              padding: '3px 8px',
              background: 'rgba(250,247,241,0.08)',
              borderRadius: 10,
              letterSpacing: '0.04em',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#9bb87a' }}>●</span>{' '}Active
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(250,247,241,0.4)',
              fontFamily: SHELL.MONO,
              fontSize: 16,
              lineHeight: 1,
              padding: '0 0 0 6px',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* ── Compact synthesis (Behavior X: synthesis as thread header) ── */}
        <div
          style={{
            padding: '10px 18px 12px',
            borderBottom: '1px solid rgba(250,247,241,0.08)',
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 12.5,
              fontStyle: 'italic',
              color: 'rgba(250,247,241,0.50)',
              lineHeight: 1.45,
              margin: 0,
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {plainQuote}
          </p>
        </div>

        {/* ── Conversation thread ── */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '12px 18px 0',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(250,247,241,0.10) transparent',
          }}
        >
          {/* Thread label */}
          {hasThread && (
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 8.5,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(250,247,241,0.22)',
                marginBottom: 12,
                flexShrink: 0,
              }}
            >
              Conversation
            </div>
          )}

          {/* Empty state */}
          {!hasThread && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: 40,
              }}
            >
              <div
                style={{
                  fontFamily: SHELL.SERIF,
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'rgba(250,247,241,0.30)',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  maxWidth: 220,
                }}
              >
                Ask {agent.name} anything about this page
              </div>
            </div>
          )}

          {/* Completed turns */}
          {conversation.map((turn) => (
            <DrawerChatBubble
              key={turn.id}
              role={turn.role}
              text={turn.text}
              label={
                turn.role === 'user'
                  ? 'You'
                  : `${agent.initials} · ${turn.agentName}`
              }
            />
          ))}

          {/* In-flight streaming turn */}
          {(isStreaming || response) && (
            <div style={{ marginBottom: 12, flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 8.5,
                  color: 'rgba(250,247,241,0.28)',
                  marginBottom: 4,
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
                  <span
                    style={{
                      color: 'rgba(250,247,241,0.35)',
                      fontStyle: 'italic',
                    }}
                  >
                    thinking…
                  </span>
                ) : (
                  <>
                    {response}
                    {isStreaming && (
                      <span style={{ opacity: 0.5, marginLeft: 1 }}>▊</span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 11.5,
                color: SHELL.PEACH_TEXT,
                padding: '7px 11px',
                background: 'rgba(255,100,60,0.08)',
                borderRadius: 6,
                marginBottom: 8,
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
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
                ×
              </button>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={threadEndRef} />
        </div>

        {/* ── Input bar ── */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 18px 20px',
            borderTop: '1px solid rgba(250,247,241,0.10)',
          }}
        >
          <div
            style={{
              background: 'rgba(250,247,241,0.08)',
              border: '1px solid rgba(250,247,241,0.18)',
              borderRadius: 20,
              padding: '9px 10px 9px 16px',
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              spellCheck
              placeholder={`Ask ${agent.name}…`}
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
                maxHeight: 100,
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
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: isStreaming
                  ? 'rgba(250,247,241,0.10)'
                  : SHELL.PAPER,
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
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle
                    cx="5.5" cy="5.5" r="4"
                    stroke="rgba(250,247,241,0.3)"
                    strokeWidth="1.4"
                    strokeDasharray="12 6"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 10V2M6 2L3 5M6 2L9 5"
                    stroke={SHELL.INK}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── DrawerChatBubble ──────────────────────────────────────────────────────────

function DrawerChatBubble({
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
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8.5,
          color: 'rgba(250,247,241,0.25)',
          marginBottom: 3,
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          maxWidth: '90%',
          padding: '8px 12px',
          borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
          background: isUser
            ? 'rgba(250,247,241,0.11)'
            : 'rgba(250,247,241,0.05)',
          border: `1px solid ${
            isUser
              ? 'rgba(250,247,241,0.16)'
              : 'rgba(250,247,241,0.08)'
          }`,
          fontFamily: SHELL.SANS,
          fontSize: 12.5,
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
