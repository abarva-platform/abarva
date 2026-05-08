'use client';

// Intelligence v3 · Sentinel chat shell.
//
// Three layout modes — side rail (default 440px) · bottom dock expanded
// (360px tall) · bottom dock collapsed (56px strip). The user toggles
// modes via the controls in the chat header. Mode preference persists
// per-user via localStorage.
//
// Input is reachable in all three modes (per
// feedback_chat_design_principles · "no bubble truncation").
//
// Backend hookup is a follow-up wave — for now the conversation is
// hardcoded fixture content matching the wireframe. Submitting the
// input is a no-op pending model wiring.

import { useCallback, useSyncExternalStore } from 'react';
import { COLORS, FONT, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import type { ChatMessage, ChatMode } from './types';

const STORAGE_KEY = 'abarva.intelligence.chat-mode';

const CHAT_BG = '#10193A';
const CHAT_BG_HEADER = 'rgba(0,0,0,0.2)';
const CHAT_BG_INPUT = 'rgba(0,0,0,0.2)';
const CHAT_BORDER_LIGHT = 'rgba(255,255,255,0.1)';
const CHAT_BORDER_FAINT = 'rgba(255,255,255,0.2)';
const CHAT_TEXT_DIM = 'rgba(205,213,224,0.7)';
const CHAT_TEXT = '#CDD5E0';
const CHAT_TEXT_BRIGHT = '#FFFFFF';
const ACCENT = COLORS.amber; // Sentinel = amber accent per agent partition
const ACCENT_INK = COLORS.navyDark;

interface Props {
  agentName?: string;
  scopeLabel: string;
  opener: string;
  conversation: ReadonlyArray<ChatMessage>;
}

/**
 * Top-level chat shell. Picks the layout based on mode state and renders
 * the matching variant. Conversation, opener, and scope are shared
 * across all three modes.
 */
// External-store subscribers for the chat-mode preference. Using
// useSyncExternalStore avoids setState-in-effect — we read localStorage
// synchronously on each render and subscribe to the cross-tab `storage`
// event so multiple tabs stay in sync.

function isChatMode(v: string | null): v is ChatMode {
  return v === 'side-rail' || v === 'dock-expanded' || v === 'dock-collapsed';
}

function subscribeChatMode(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getChatModeSnapshot(): ChatMode {
  if (typeof window === 'undefined') return 'side-rail';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isChatMode(v) ? v : 'side-rail';
  } catch {
    return 'side-rail';
  }
}

function getChatModeServerSnapshot(): ChatMode {
  return 'side-rail';
}

export function SentinelChat({
  agentName = 'Sentinel',
  scopeLabel,
  opener,
  conversation,
}: Props) {
  const mode = useSyncExternalStore(
    subscribeChatMode,
    getChatModeSnapshot,
    getChatModeServerSnapshot,
  );

  const updateMode = useCallback((next: ChatMode) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      // Same-tab writes don't fire `storage`; dispatch one ourselves so
      // useSyncExternalStore re-reads the snapshot.
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    } catch {
      // ignore
    }
  }, []);

  if (mode === 'side-rail') {
    return (
      <SideRail
        agentName={agentName}
        scopeLabel={scopeLabel}
        opener={opener}
        conversation={conversation}
        onMode={updateMode}
      />
    );
  }
  if (mode === 'dock-expanded') {
    return (
      <DockExpanded
        agentName={agentName}
        scopeLabel={scopeLabel}
        conversation={conversation}
        onMode={updateMode}
      />
    );
  }
  return (
    <DockCollapsed
      agentName={agentName}
      conversation={conversation}
      onMode={updateMode}
    />
  );
}

// ---------------------------------------------------------------------
// Mode 1 · side rail (default)
// ---------------------------------------------------------------------

interface ModeProps {
  agentName: string;
  scopeLabel?: string;
  opener?: string;
  conversation: ReadonlyArray<ChatMessage>;
  onMode: (mode: ChatMode) => void;
}

function SideRail({ agentName, scopeLabel, opener, conversation, onMode }: ModeProps) {
  return (
    <aside
      aria-label={`${agentName} chat · side rail`}
      data-chat-mode="side-rail"
      style={{
        width: 440,
        flexShrink: 0,
        background: CHAT_BG,
        color: CHAT_TEXT,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 56, // sit below TopNav (56px)
        height: 'calc(100vh - 56px)',
        borderLeft: `1px solid ${COLORS.border}`,
      }}
    >
      <ChatHeader
        agentName={agentName}
        roleLine="Exploration · this page"
        controls={
          <>
            <Ctl onClick={() => onMode('dock-collapsed')} aria-label="Minimize chat">
              ⊟
            </Ctl>
            <Ctl
              onClick={() => onMode('dock-expanded')}
              aria-label="Expand chat to bottom dock"
              tone="primary"
            >
              ⇲ Expand
            </Ctl>
          </>
        }
      />

      <div
        style={{
          flex: 1,
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          overflowY: 'auto',
        }}
      >
        {opener && <Opener>{opener}</Opener>}
        {conversation.map((m, i) => (
          <Message key={i} message={m} />
        ))}
      </div>

      <ChatInput scopeLabel={scopeLabel ?? ''} />
    </aside>
  );
}

// ---------------------------------------------------------------------
// Mode 2 · bottom dock expanded
// ---------------------------------------------------------------------

function DockExpanded({ agentName, scopeLabel, conversation, onMode }: ModeProps) {
  return (
    <aside
      aria-label={`${agentName} chat · bottom dock expanded`}
      data-chat-mode="dock-expanded"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 360,
        background: CHAT_BG,
        color: CHAT_TEXT,
        borderTop: `3px solid ${ACCENT}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 150,
      }}
    >
      <ChatHeader
        agentName={agentName}
        roleLine={`Exploration · scoped to ${scopeLabel}`}
        controls={
          <>
            <Ctl onClick={() => onMode('dock-collapsed')} aria-label="Minimize">
              ⊟ Minimize
            </Ctl>
            <Ctl onClick={() => onMode('side-rail')} aria-label="Switch to side rail">
              ⇱ Side rail
            </Ctl>
            <Ctl
              onClick={() => onMode('dock-collapsed')}
              aria-label="Collapse"
              tone="primary"
            >
              ▾ Collapse
            </Ctl>
          </>
        }
      />

      <div
        style={{
          flex: 1,
          padding: `${SPACING.lg}px ${SPACING.xxl}px`,
          overflowY: 'auto',
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {conversation.map((m, i) => (
          <Message key={i} message={m} dockExpanded />
        ))}
      </div>

      <div
        style={{
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <ChatInput scopeLabel={scopeLabel ?? ''} dockExpanded />
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------
// Mode 3 · bottom dock collapsed (56px strip)
// ---------------------------------------------------------------------

function DockCollapsed({
  agentName,
  conversation,
  onMode,
}: Omit<ModeProps, 'scopeLabel' | 'opener'>) {
  // Last agent message preview (italicized, ellipsised).
  const lastAgent = [...conversation].reverse().find((m) => m.role === 'agent');
  const preview = lastAgent
    ? `"${truncate(lastAgent.text, 90)}"`
    : '';

  return (
    <aside
      aria-label={`${agentName} chat · collapsed`}
      data-chat-mode="dock-collapsed"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 56,
        background: CHAT_BG,
        color: CHAT_TEXT,
        borderTop: `2px solid ${ACCENT}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        padding: `0 ${SPACING.lg}px`,
        zIndex: 150,
      }}
    >
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: 13,
          color: CHAT_TEXT_BRIGHT,
          fontWeight: 600,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: SPACING.xs,
        }}
      >
        {agentName}
        <span
          aria-hidden="true"
          style={{
            background: COLORS.amber,
            color: ACCENT_INK,
            padding: '1px 6px',
            borderRadius: RADIUS.pill,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Active
        </span>
      </span>

      <span
        style={{
          flex: 1,
          fontSize: 12,
          fontStyle: 'italic',
          color: CHAT_TEXT_DIM,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {preview}
      </span>

      <ComposerBox scopeLabel="" inline />
      <Ctl onClick={() => onMode('side-rail')} aria-label="Switch to side rail">
        ⇱ Side rail
      </Ctl>
      <Ctl
        onClick={() => onMode('dock-expanded')}
        aria-label="Expand chat"
        tone="primary"
      >
        ⇲ Expand
      </Ctl>
    </aside>
  );
}

// ---------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------

function ChatHeader({
  agentName,
  roleLine,
  controls,
}: {
  agentName: string;
  roleLine: string;
  controls: React.ReactNode;
}) {
  return (
    <header
      style={{
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        borderBottom: `1px solid ${CHAT_BORDER_LIGHT}`,
        background: CHAT_BG_HEADER,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 13,
            color: CHAT_TEXT_BRIGHT,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.xs,
          }}
        >
          {agentName}
          <span
            aria-hidden="true"
            style={{
              background: COLORS.amber,
              color: ACCENT_INK,
              padding: '1px 6px',
              borderRadius: RADIUS.pill,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Active
          </span>
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: CHAT_TEXT_DIM,
            marginTop: 2,
          }}
        >
          {roleLine}
        </div>
      </div>
      <div style={{ display: 'flex', gap: SPACING.xs }}>{controls}</div>
    </header>
  );
}

function Ctl({
  children,
  onClick,
  tone = 'ghost',
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'ghost' | 'primary';
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: tone === 'primary' ? ACCENT : 'rgba(255,255,255,0.08)',
        color: tone === 'primary' ? ACCENT_INK : CHAT_TEXT_BRIGHT,
        border: tone === 'primary' ? `1px solid ${ACCENT}` : `1px solid ${CHAT_BORDER_FAINT}`,
        padding: `${SPACING.xs}px ${SPACING.sm}px`,
        fontFamily: FONT.body,
        fontSize: 11,
        fontWeight: tone === 'primary' ? 700 : 500,
        cursor: 'pointer',
        borderRadius: RADIUS.sm,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

function Opener({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.06)',
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        borderRadius: RADIUS.sm,
        marginBottom: SPACING.md,
        fontFamily: FONT.body,
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

function Message({
  message,
  dockExpanded = false,
}: {
  message: ChatMessage;
  dockExpanded?: boolean;
}) {
  const fontSize = dockExpanded ? 13 : 12;
  const maxWidth = dockExpanded ? '80%' : '92%';
  if (message.role === 'user') {
    return (
      <div style={{ marginBottom: SPACING.md, textAlign: 'right' }}>
        <span
          style={{
            display: 'inline-block',
            background: ACCENT,
            color: ACCENT_INK,
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            borderRadius: '8px 8px 2px 8px',
            maxWidth,
            textAlign: 'left',
            fontFamily: FONT.body,
            fontSize,
            lineHeight: 1.5,
          }}
        >
          {message.text}
        </span>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: SPACING.md }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.06)',
          padding: `${SPACING.sm}px ${SPACING.md}px`,
          borderRadius: '8px 8px 8px 2px',
          maxWidth,
          fontFamily: FONT.body,
          fontSize,
          lineHeight: 1.55,
        }}
      >
        {message.text}
      </div>
      {message.refs && message.refs.length > 0 && (
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            color: CHAT_TEXT_DIM,
            marginTop: 4,
            paddingLeft: SPACING.xs,
          }}
        >
          refs: {message.refs.join(' · ')}
        </div>
      )}
      {message.hasExpand && !dockExpanded && (
        <button
          type="button"
          onClick={undefined}
          style={{
            marginTop: SPACING.xs,
            paddingLeft: SPACING.xs,
            background: 'transparent',
            border: 'none',
            color: ACCENT,
            fontFamily: FONT.body,
            fontSize: 11,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          ⇲ Expand to read full response →
        </button>
      )}
    </div>
  );
}

function ChatInput({
  scopeLabel,
  dockExpanded = false,
}: {
  scopeLabel: string;
  dockExpanded?: boolean;
}) {
  // Two-row Claude-style composer · text input on top, tools row below.
  // Lifted off the bottom edge with extra bottom padding so the agent's last
  // message stays visible above it without scrolling.
  return (
    <div
      style={{
        borderTop: `1px solid rgba(255,255,255,0.06)`,
        padding: dockExpanded
          ? `${SPACING.sm}px ${SPACING.xxl}px ${SPACING.lg}px`
          : `${SPACING.sm}px ${SPACING.md}px ${SPACING.lg}px`,
        background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)',
        flexShrink: 0,
      }}
    >
      <ComposerBox scopeLabel={scopeLabel} />
    </div>
  );
}

function ComposerBox({ scopeLabel, inline = false }: { scopeLabel: string; inline?: boolean }) {
  // Submitting is a no-op until model wiring lands.
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      style={{
        background: 'rgba(0,0,0,0.28)',
        border: `1px solid ${CHAT_BORDER_FAINT}`,
        borderRadius: 12,
        padding: `${SPACING.sm}px ${SPACING.sm}px ${SPACING.xs}px`,
        width: inline ? 360 : '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <input
        type="text"
        placeholder="Ask Sentinel…"
        aria-label="Ask Sentinel"
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: CHAT_TEXT_BRIGHT,
          fontFamily: FONT.body,
          fontSize: 13,
          lineHeight: 1.5,
          padding: '4px 6px 6px',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          paddingTop: SPACING.xs,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <ComposerTool title="Attach document" ariaLabel="Attach document">📎</ComposerTool>
        <ComposerTool title="New thread" ariaLabel="Start a new thread">+</ComposerTool>
        {scopeLabel && (
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'rgba(205,213,224,0.5)',
              padding: '0 6px',
            }}
          >
            Sentinel · {scopeLabel}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button
          type="submit"
          aria-label="Send"
          style={{
            background: 'rgba(244,184,0,0.18)',
            color: ACCENT,
            width: 28,
            height: 28,
            borderRadius: 7,
            border: 'none',
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 13,
            lineHeight: 1,
            cursor: 'pointer',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ↑
        </button>
      </div>
    </form>
  );
}

function ComposerTool({
  children,
  title,
  ariaLabel,
}: {
  children: React.ReactNode;
  title: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: 'transparent',
        border: '1px solid transparent',
        color: 'rgba(205,213,224,0.65)',
        fontSize: 14,
        lineHeight: 1,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}
