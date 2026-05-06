'use client';

// StewardAskBar · Admin surface agent chat
//
// Design principles implemented here:
//   1. FULL MESSAGE READABILITY — chat bubbles never truncate; every
//      message renders in full so the user reads without scrolling
//      within a single bubble.
//   2. PROGRESSIVE SCAFFOLD DISCLOSURE — starter prompt chips appear
//      when the conversation is empty and the input is idle. They
//      collapse (height transition) when the user focuses the input,
//      and permanently hide once the first message is sent. This
//      returns the full panel height to the thread.
//
// Applies across all agent chat surfaces (admin, setup, source, tower).
// Source and Tower will adopt the same principles when their visual
// redesign lands.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import { useAgentStream } from '@/hooks/useAgentStream';
import { AgentMarkdown } from '@/lib/agent/markdownRenderer';
import { stripArtifactsForDisplay } from '@/lib/agent/artifacts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScaffoldPrompt {
  id: string;
  label: string;
  question: string;
}

interface StewardAskBarProps {
  /** Presented in the panel header as context ("Apex Retail · Setup"). */
  contextLabel?: string;
  /** Surface-specific scaffold starter prompts. */
  scaffoldPrompts?: ScaffoldPrompt[];
}

// ── Default scaffolds for the admin/setup surface ────────────────────────────

const DEFAULT_SETUP_SCAFFOLDS: ScaffoldPrompt[] = [
  {
    id: 'segments',
    label: 'Prioritize segments',
    question: 'Which data segments should I upload first to ground the most capabilities?',
  },
  {
    id: 'sentinel-unlock',
    label: 'What Sentinel unlocks',
    question: 'What can Sentinel reason about once I upload each data family?',
  },
  {
    id: 'connectors',
    label: 'Connector readiness',
    question: 'Which connectors are needed before pilot and what is their setup sequence?',
  },
  {
    id: 'blockers',
    label: 'Top blockers',
    question: 'What are the top blockers I need to resolve before production readiness?',
  },
];

// ── Scaffold section — animated collapse/expand ───────────────────────────────

function ScaffoldSection({
  prompts,
  visible,
  onSelect,
}: {
  prompts: ScaffoldPrompt[];
  visible: boolean;
  onSelect: (q: string) => void;
}) {
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!innerRef.current) return;
    if (visible) {
      // Measure actual height then transition to it
      const natural = innerRef.current.scrollHeight;
      setHeight(natural);
    } else {
      // Collapse: set from current height to 0
      const current = innerRef.current.scrollHeight;
      setHeight(current);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [visible]);

  return (
    <div
      style={{
        overflow: 'hidden',
        transition: 'height 260ms ease, opacity 220ms ease',
        height: height === 'auto' ? 'auto' : height,
        opacity: visible ? 1 : 0,
        flexShrink: 0,
      }}
    >
      <div ref={innerRef}>
        {/* Opening brief */}
        <div
          style={{
            padding: '0 16px 10px',
          }}
        >
          <p
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 12,
              fontStyle: 'italic',
              color: 'rgba(12,26,58,0.55)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Your setup guide — ask about data priorities, connector readiness,
            and what each segment unlocks.
          </p>
        </div>

        {/* Prompt chips */}
        <div
          style={{
            padding: '0 16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {prompts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.question)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: 'rgba(12,26,58,0.04)',
                border: '1px solid rgba(12,26,58,0.10)',
                borderRadius: 8,
                padding: '8px 11px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(12,26,58,0.07)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(12,26,58,0.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(12,26,58,0.04)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(12,26,58,0.10)';
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 8.5,
                  fontWeight: 600,
                  color: 'rgba(12,26,58,0.35)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  marginTop: 2,
                  lineHeight: 1,
                }}
              >
                Ask
              </span>
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: 'rgba(12,26,58,0.72)',
                  lineHeight: 1.45,
                }}
              >
                {p.label}
              </span>
            </button>
          ))}
        </div>

        {/* Divider below scaffolds */}
        <div
          style={{
            margin: '0 16px',
            height: 1,
            background: 'rgba(12,26,58,0.08)',
            marginBottom: 0,
          }}
        />
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
// Full message — no line-clamp, no truncation. The principle: messages must be
// fully readable without scrolling within the bubble.

function MessageBubble({
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
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8.5,
          color: 'rgba(12,26,58,0.30)',
          marginBottom: 3,
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          // Full width for agent turns so long responses don't wrap too early.
          // User turns stay right-aligned with natural width.
          maxWidth: isUser ? '85%' : '100%',
          width: isUser ? undefined : '100%',
          padding: '9px 12px',
          borderRadius: isUser ? '12px 12px 3px 12px' : '10px 10px 10px 3px',
          background: isUser ? 'rgba(12,26,58,0.07)' : 'rgba(12,26,58,0.03)',
          border: `1px solid ${isUser ? 'rgba(12,26,58,0.12)' : 'rgba(12,26,58,0.07)'}`,
          fontFamily: SHELL.SANS,
          fontSize: 12.5,
          color: isUser ? 'rgba(12,26,58,0.85)' : 'rgba(12,26,58,0.80)',
          lineHeight: 1.65,
          // NO line-clamp, NO overflow:hidden, NO maxHeight on the content —
          // the message renders in full.
          whiteSpace: isUser ? 'pre-wrap' : undefined,
          wordBreak: 'break-word',
        }}
      >
        {isUser ? text : <AgentMarkdown text={stripArtifactsForDisplay(text)} />}
      </div>
    </div>
  );
}

// ── Streaming turn ─────────────────────────────────────────────────────────────

function StreamingTurn({
  response,
  isStreaming,
}: {
  response: string;
  isStreaming: boolean;
}) {
  if (!isStreaming && !response) return null;
  return (
    <div
      style={{
        marginBottom: 14,
        flexShrink: 0,
        width: '100%',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8.5,
          color: 'rgba(12,26,58,0.30)',
          marginBottom: 3,
          letterSpacing: '0.07em',
        }}
      >
        St · Steward
      </div>
      <div
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: '10px 10px 10px 3px',
          background: 'rgba(12,26,58,0.03)',
          border: '1px solid rgba(12,26,58,0.07)',
          fontFamily: SHELL.SANS,
          fontSize: 12.5,
          color: 'rgba(12,26,58,0.80)',
          lineHeight: 1.65,
          wordBreak: 'break-word',
        }}
      >
        {isStreaming && !response ? (
          <span style={{ color: 'rgba(12,26,58,0.35)', fontStyle: 'italic' }}>
            thinking…
          </span>
        ) : (
          <>
            <AgentMarkdown text={response} />
            {isStreaming && (
              <span style={{ opacity: 0.4, marginLeft: 1 }}>▊</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── StewardAskBar ─────────────────────────────────────────────────────────────

export function StewardAskBar({
  contextLabel = 'Setup',
  scaffoldPrompts = DEFAULT_SETUP_SCAFFOLDS,
}: StewardAskBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [inputDraft, setInputDraft] = useState('');
  // Track whether the user has ever sent a message — once true, scaffold
  // prompts stay hidden permanently for this session.
  const [everSent, setEverSentFlag] = useState(false);
  const setEverSent = useCallback(() => setEverSentFlag(true), []);

  // Prefer shared AtlasPageState (same conversation as RibbonSynthesis);
  // fall back to local stream for pages that don't mount the provider.
  const pageState = useAtlasPageState();
  const localStream = useAgentStream({ surface: 'setup', agentName: 'Steward' });

  const ask = pageState?.ask ?? localStream.ask;
  const response = pageState?.currentResponse ?? localStream.response;
  const isStreaming = pageState?.isStreaming ?? localStream.isStreaming;
  const error = pageState?.error ?? localStream.error;
  const clearError = pageState?.clearResponse ?? localStream.clear;
  const conversation = pageState?.conversation ?? [];

  const hasThread = conversation.length > 0 || isStreaming || !!response;

  // Scaffold shows while: no thread, not focused, no draft typed.
  // Collapses immediately on focus/typing, and stays collapsed once thread starts.
  const showScaffold = !everSent && !hasThread && !inputFocused && !inputDraft;

  // Scroll thread to bottom when new turns land.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.length, response]);

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      setEverSent();
      ask(trimmed);
      setInputDraft('');
      if (textareaRef.current) {
        textareaRef.current.value = '';
        textareaRef.current.style.height = 'auto';
      }
    },
    [ask, isStreaming],
  );

  function handleScaffoldSelect(question: string) {
    setEverSent();
    ask(question);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: SHELL.PAPER,
        overflow: 'hidden',
      }}
      data-steward-ask-bar
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '12px 16px 10px',
          borderBottom: `1px solid rgba(12,26,58,0.09)`,
          flexShrink: 0,
        }}
      >
        {/* Steward avatar */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: SHELL.INK,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 10,
              fontWeight: 600,
              color: SHELL.PAPER,
              lineHeight: 1,
            }}
          >
            St
          </span>
        </div>

        {/* Name + context */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 13,
              fontWeight: 600,
              color: SHELL.INK,
              lineHeight: 1.2,
            }}
          >
            Steward
          </div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8,
              color: 'rgba(12,26,58,0.38)',
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              marginTop: 1,
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {contextLabel}
          </div>
        </div>

        {/* Active indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: SHELL.MONO,
            fontSize: 8,
            color: 'rgba(12,26,58,0.45)',
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#7aab5a', fontSize: 9 }}>●</span>
          Active
        </div>
      </div>

      {/* ── Scaffold prompts (progressive disclosure) ───────────────────── */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: showScaffold ? 12 : 0,
          transition: 'padding 240ms ease',
        }}
      >
        <ScaffoldSection
          prompts={scaffoldPrompts}
          visible={showScaffold}
          onSelect={handleScaffoldSelect}
        />
      </div>

      {/* ── Conversation thread ─────────────────────────────────────────── */}
      <div
        ref={threadRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: hasThread ? '14px 16px 0' : '0 16px',
          display: 'flex',
          flexDirection: 'column',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(12,26,58,0.10) transparent',
        }}
      >
        {!hasThread && !showScaffold && (
          // Transient state: user focused / typed but hasn't sent yet.
          // Show a soft empty-state nudge.
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: 24,
            }}
          >
            <span
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 12,
                fontStyle: 'italic',
                color: 'rgba(12,26,58,0.28)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              Ask Steward anything about setup
            </span>
          </div>
        )}

        {conversation.map((turn) => (
          <MessageBubble
            key={turn.id}
            role={turn.role === 'user' ? 'user' : 'agent'}
            text={turn.text}
            label={turn.role === 'user' ? 'You' : `St · Steward`}
          />
        ))}

        <StreamingTurn response={response} isStreaming={isStreaming} />

        {error && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11.5,
              color: '#c0392b',
              padding: '7px 10px',
              background: 'rgba(192,57,43,0.06)',
              border: '1px solid rgba(192,57,43,0.14)',
              borderRadius: 7,
              marginBottom: 10,
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{error}</span>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: 'rgba(12,26,58,0.35)',
                padding: 0,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Scroll anchor */}
        <div style={{ flexShrink: 0, height: 8 }} />
      </div>

      {/* ── Input bar — sticky at bottom ────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 14px 14px',
          borderTop: `1px solid rgba(12,26,58,0.09)`,
          background: SHELL.PAPER,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            alignItems: 'flex-end',
            background: inputFocused ? 'rgba(12,26,58,0.05)' : 'rgba(12,26,58,0.03)',
            border: `1px solid ${inputFocused ? 'rgba(12,26,58,0.22)' : 'rgba(12,26,58,0.12)'}`,
            borderRadius: 18,
            padding: '8px 10px 8px 14px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            spellCheck
            autoCorrect="on"
            autoCapitalize="sentences"
            placeholder={hasThread ? 'Follow up…' : 'Ask Steward…'}
            disabled={isStreaming}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12.5,
              color: SHELL.INK,
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.55,
              maxHeight: 120,
              overflowY: 'auto',
              caretColor: SHELL.INK,
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
              setInputDraft(el.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (textareaRef.current) submit(textareaRef.current.value);
              }
            }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={() => {
              if (textareaRef.current) submit(textareaRef.current.value);
            }}
            disabled={isStreaming || !inputDraft.trim()}
            aria-label={isStreaming ? 'Sending…' : 'Send'}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background:
                isStreaming || !inputDraft.trim()
                  ? 'rgba(12,26,58,0.08)'
                  : SHELL.INK,
              border: 'none',
              cursor:
                isStreaming || !inputDraft.trim() ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {isStreaming ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle
                  cx="5" cy="5" r="3.5"
                  stroke="rgba(12,26,58,0.3)"
                  strokeWidth="1.3"
                  strokeDasharray="10 5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M5.5 9V2M5.5 2L3 4.5M5.5 2L8 4.5"
                  stroke={
                    !inputDraft.trim() ? 'rgba(12,26,58,0.35)' : SHELL.PAPER
                  }
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Shift+Enter hint — only shown when input is focused */}
        {inputFocused && (
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: 'rgba(12,26,58,0.28)',
              textAlign: 'right',
              marginTop: 5,
              letterSpacing: '0.03em',
            }}
          >
            Enter to send · Shift+Enter for new line
          </div>
        )}
      </div>
    </div>
  );
}
