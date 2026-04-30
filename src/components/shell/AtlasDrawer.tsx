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

import { useRef, useEffect, type ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import { AgentMarkdown } from '@/lib/agent/markdownRenderer';
import type { Artifact } from '@/lib/agent/artifacts';

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
  /**
   * Surface 2 PR2 — when provided, Nexus's structured artifacts
   * (gate-evaluation, evidence-highlight, phase-recommendation, etc.)
   * are parsed from the streamed response and dispatched here so the
   * surrounding page can render them reactively. Sentinels are
   * stripped from the chat-visible text.
   */
  onArtifact?: (artifact: Artifact) => void;
  /**
   * Surface 2 PR-F — agent-centric layout.
   *
   * When true, the drawer renders inline as a normal block element
   * filling its container — no fixed positioning, no backdrop, no
   * translate animation. Used by /programs/[id] where the chat is
   * the dominant primary surface (not a sidekick overlay).
   *
   * `isOpen` is ignored in embedded mode (the chat is always visible);
   * `onClose` is also unused. Pass them as `true` and `() => {}` to
   * satisfy the type.
   */
  embedded?: boolean;
  /**
   * Optional empty-state content for embedded agent canvases. Keeps
   * surface-specific operator prompts above the input without forking the
   * drawer behavior or the shared conversation state.
   */
  emptyState?: ReactNode;
  composerPlacement?: 'bottom' | 'afterHeader';
}

// ── AtlasDrawer ───────────────────────────────────────────────────────────────

export function AtlasDrawer({
  isOpen,
  onClose,
  agent,
  quote,
  surface,
  programId,
  onArtifact,
  embedded = false,
  emptyState,
  composerPlacement = 'bottom',
}: AtlasDrawerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Shared AtlasPageState — same conversation as the RibbonSynthesis surface.
  const pageState = useAtlasPageState();
  const localStream = useAgentStream({
    surface: surface ?? 'home',
    programId,
    agentName: agent.name,
    onArtifact,
  });

  const ask          = pageState?.ask             ?? localStream.ask;
  const response     = pageState?.currentResponse ?? localStream.response;
  const isStreaming  = pageState?.isStreaming      ?? localStream.isStreaming;
  const error        = pageState?.error            ?? localStream.error;
  const clearLocal   = pageState?.clearResponse    ?? localStream.clear;
  const conversation = pageState?.conversation     ?? [];

  const hasThread = conversation.length > 0 || isStreaming || !!response || !!error;

  // Auto-scroll to latest turn whenever content changes. In embedded
  // mode the panel is always visible, so the gate is just "should we
  // scroll" = always.
  useEffect(() => {
    if (embedded || isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [embedded, isOpen, conversation.length, response]);

  // Focus textarea when drawer opens. In embedded mode, focus on mount.
  useEffect(() => {
    if (embedded || isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 250);
    }
  }, [embedded, isOpen]);

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

  // Layout shape — embedded mode renders inline as part of the page
  // flow (no fixed positioning, no backdrop, no slide animation), so
  // the chat can occupy a permanent column on agent-centric surfaces
  // like /programs/[id]. Drawer mode is the original Shell Layout
  // Spec v2 §5.1 right-side overlay.
  const panelStyle: React.CSSProperties = embedded
      ? {
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 0,
          background: SHELL.INK,
          display: 'flex',
          flexDirection: 'column',
        borderRadius: 12,
        overflow: 'hidden',
      }
    : {
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
      };

  const inputBar = (
    <div
      style={{
        flexShrink: 0,
        padding: composerPlacement === 'afterHeader' ? '10px 18px 12px' : '10px 18px 14px',
        borderTop:
          composerPlacement === 'afterHeader' ? 'none' : '1px solid rgba(250,247,241,0.10)',
        borderBottom:
          composerPlacement === 'afterHeader' ? '1px solid rgba(250,247,241,0.10)' : 'none',
        background: SHELL.INK,
        position: embedded && composerPlacement === 'bottom' ? 'sticky' : undefined,
        bottom: embedded && composerPlacement === 'bottom' ? 0 : undefined,
        zIndex: embedded ? 1 : undefined,
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
  );

  return (
    <>
      {/* Backdrop — darkens canvas when drawer open. Suppressed in
          embedded mode (the chat is a permanent column, not an overlay). */}
      {!embedded ? (
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
      ) : null}

      {/* Drawer / embedded panel */}
      <div style={panelStyle}>
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

          {/* Close button — hidden in embedded mode (the chat is a
              permanent column, not a closable overlay). */}
          {!embedded ? (
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
          ) : null}
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
              // PR-H readability fix · was 0.50 (too dim on dark INK
              // background, founder reported "barely visible" during
              // production walk).
              color: 'rgba(250,247,241,0.78)',
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

        {composerPlacement === 'afterHeader' ? inputBar : null}

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
                justifyContent: emptyState ? 'flex-start' : 'center',
                paddingBottom: emptyState ? 12 : 40,
                paddingTop: emptyState ? 6 : 0,
              }}
            >
              {emptyState ?? (
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
              )}
            </div>
          )}

          {/* Completed turns. PR-K · turns with agentName === '__handoff__'
              are rendered as a divider-style banner instead of a chat
              bubble — they mark the moment commit_program landed and
              the conversation transitioned from Steward (origination)
              to the active program canvas. */}
          {conversation.map((turn) =>
            turn.agentName === '__handoff__' ? (
              <DrawerHandoffMarker key={turn.id} text={turn.text} />
            ) : (
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
            ),
          )}

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
                    {/* Surface 2 PR1 — render through AgentMarkdown so
                        Nexus's markdown (bold, tables, IDs, citation
                        chips) renders properly instead of as raw text. */}
                    <AgentMarkdown text={response} />
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
        {composerPlacement === 'bottom' ? inputBar : null}
      </div>
    </>
  );
}

// ── DrawerHandoffMarker ───────────────────────────────────────────────────────
//
// PR-K · rendered for turns with agentName === '__handoff__'. Visually a
// hairline divider with a centered status pill so the user sees the
// origination → active program transition as a deliberate beat rather
// than a mid-stream chat bubble.

function DrawerHandoffMarker({ text }: { text: string }) {
  return (
    <div
      style={{
        margin: '14px 0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, height: 1, background: 'rgba(250,247,241,0.18)' }} />
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'rgba(250,247,241,0.62)',
          fontWeight: 700,
          padding: '4px 10px',
          border: '1px solid rgba(250,247,241,0.18)',
          borderRadius: 999,
          background: 'rgba(250,247,241,0.04)',
          textAlign: 'center',
          maxWidth: '70%',
        }}
      >
        {text}
      </div>
      <div style={{ flex: 1, height: 1, background: 'rgba(250,247,241,0.18)' }} />
    </div>
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
          // User turns are plain text we typed; assistant turns may
          // contain markdown / IDs / citation tags and go through
          // AgentMarkdown below.
          whiteSpace: isUser ? 'pre-wrap' : undefined,
          wordBreak: 'break-word',
        }}
      >
        {isUser ? text : <AgentMarkdown text={text} />}
      </div>
    </div>
  );
}
