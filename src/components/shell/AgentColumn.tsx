'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';

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
  /** Slot rendered at the very bottom of the dark agent column panel, below action buttons and above the input box. */
  bottomSlot?: ReactNode;
  /** Surface identifier for streaming context */
  surface?: string;
  /** Active program identifier for streaming context */
  programId?: string;
}

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
}: AgentColumnProps) {
  const placeholder = inputPlaceholder ?? `Ask ${agent.name}...`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prefer shared AtlasPageState (Shell Layout Spec v2 §6) — falls back to
  // local useAgentStream for components not yet wrapped in AppShell.
  const pageState = useAtlasPageState();

  const localStream = useAgentStream({
    surface: surface ?? 'home',
    programId,
    agentName: agent.name,
  });

  const ask        = pageState?.ask        ?? localStream.ask;
  const response   = pageState?.currentResponse ?? localStream.response;
  const isStreaming = pageState?.isStreaming    ?? localStream.isStreaming;
  const error      = pageState?.error          ?? localStream.error;
  const clear      = pageState?.clearResponse  ?? localStream.clear;

  const handleSubmit = () => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming) return;
    ask(text);
    el.value = '';
    el.style.height = 'auto';
  };

  return (
    <div
      style={{
        width: 480,
        flexShrink: 0,
        background: SHELL.INK,
        padding: '28px 28px 0',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'inherit',
      }}
    >
      {/* Agent identity row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          marginBottom: 18,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(250,247,241,0.15)',
          alignItems: 'center',
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

        {/* Meta column */}
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

        {/* State badge */}
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

      {/* Quote */}
      <p
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 19,
          fontStyle: 'italic',
          color: 'rgba(250,247,241,0.95)',
          lineHeight: 1.5,
          letterSpacing: '-0.008em',
          marginBottom: 6,
          margin: '0 0 6px 0',
        }}
        dangerouslySetInnerHTML={{ __html: quote }}
      />

      {/* Agent context */}
      {agentContext && (
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: 'rgba(250,247,241,0.55)',
            marginBottom: 22,
            fontStyle: 'italic',
            margin: '0 0 22px 0',
          }}
        >
          {agentContext}
        </p>
      )}

      {/* Actions section */}
      <div
        style={{
          paddingTop: 18,
          borderTop: '1px solid rgba(250,247,241,0.15)',
          marginTop: agentContext ? 0 : 22,
        }}
      >
        {/* Actions label */}
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

        {/* Action items */}
        {actions.map((action) => (
          <ActionItem key={action.letter} action={action} onActionClick={onActionClick} />
        ))}
      </div>

      {/* Bottom slot — custom action panel or other caller-provided content */}
      {bottomSlot && (
        <div style={{ paddingTop: 12 }}>
          {bottomSlot}
        </div>
      )}

      {/* Input box */}
      <div style={{ marginTop: 'auto', padding: '16px 0 24px' }}>
        {/* Streaming response panel */}
        {(response || isStreaming || error) && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 6,
              marginBottom: 8,
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {isStreaming && !response && (
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  fontStyle: 'italic',
                }}
              >
                {agent.initials} · thinking...
              </span>
            )}
            {response && (
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.PAPER,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.4)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  {agent.initials} · {agent.name}
                </span>
                {response}
                {isStreaming && <span style={{ opacity: 0.5 }}>▊</span>}
              </div>
            )}
            {error && (
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.PEACH_TEXT,
                }}
              >
                {error}
              </span>
            )}
            {response && !isStreaming && (
              <button
                onClick={clear}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 8,
                  display: 'block',
                  padding: 0,
                }}
              >
                clear ×
              </button>
            )}
          </div>
        )}

        {/* Textarea + send */}
        <div
          style={{
            background: 'rgba(250,247,241,0.08)',
            border: '1px solid rgba(250,247,241,0.20)',
            borderRadius: 22,
            padding: '11px 16px 11px 18px',
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
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
          <button
            onClick={handleSubmit}
            disabled={isStreaming}
            style={{
              background: 'none',
              border: 'none',
              cursor: isStreaming ? 'default' : 'pointer',
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: isStreaming ? 'rgba(250,247,241,0.3)' : 'rgba(250,247,241,0.6)',
              fontWeight: 600,
              flexShrink: 0,
              padding: 0,
              lineHeight: 1,
              marginBottom: 2,
            }}
          >
            {isStreaming ? '...' : '↵ Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onActionClick?.(action.letter as 'A' | 'B' | 'C'); }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.paddingLeft = '6px';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.paddingLeft = '0px';
      }}
    >
      {/* Letter */}
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

      {/* Text + detail */}
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
