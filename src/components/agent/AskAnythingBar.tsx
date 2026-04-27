'use client';

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

// Universal "Ask Anything" bottom toolbar for every agent surface
// (Programs detail, Intelligence, Control Tower, Source event detail).
// GPT-style pattern: viewport-fixed bar at the bottom of the agent
// surface with an auto-grow textarea, spell check, Enter to submit
// (Shift+Enter for newline), and a scoped placeholder. Without this
// bar the page does not feel like an agent interface.
//
// Deterministic / shell-only: the field is rendered but the Send
// button is disabled and the caveat below explains why. Live runtime
// ask wires in when the agent runtime lands.

const SURFACE = 'rgba(248, 247, 244, 0.92)';
const PANEL = '#FFFFFF';
const INK = '#0A0C12';
const NAVY = '#132B4F';
const MUTED = '#525866';
const MUTED_SOFT = '#7A7468';
const BORDER = '#E8E6E1';

const FONT = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export type AskAnythingAgent = 'nexus' | 'sentinel' | 'atlas' | 'steward';

const AGENT_LABEL: Record<AskAnythingAgent, string> = {
  nexus: 'Nexus',
  sentinel: 'Sentinel',
  atlas: 'Atlas',
  steward: 'Steward',
};

export interface AskAnythingBarProps {
  agent: AskAnythingAgent;
  /** Scope label rendered in the eyebrow, e.g. "MRD-01 · P3 Design". */
  scopeLabel: string;
  /** Custom placeholder text. */
  placeholder?: string;
  /** Override the deterministic-disabled caveat. */
  caveat?: string;
}

const MAX_HEIGHT_PX = 200;

export function AskAnythingBar({
  agent,
  scopeLabel,
  placeholder,
  caveat,
}: AskAnythingBarProps) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const agentName = AGENT_LABEL[agent];

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, MAX_HEIGHT_PX);
    el.style.height = `${next}px`;
  }

  function onChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value);
    autoGrow(event.target);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      // GPT pattern · Enter submits, Shift+Enter inserts a newline.
      // Submit is currently deterministic-disabled; we still preventDefault
      // so the field doesn't leak a stray newline.
      event.preventDefault();
    }
  }

  return (
    <div
      data-component="AskAnythingBar"
      data-agent={agent}
      role="region"
      aria-label={`Ask ${agentName}`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: SURFACE,
        backdropFilter: 'saturate(140%) blur(8px)',
        WebkitBackdropFilter: 'saturate(140%) blur(8px)',
        borderTop: `1px solid ${BORDER}`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '10px 28px 14px',
        }}
      >
        <div
          style={{
            color: NAVY,
            fontSize: 10.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Ask {agentName} · scoped to {scopeLabel}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            padding: '10px 12px',
            background: PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            boxShadow: '0 14px 32px rgba(19,43,79,0.08)',
          }}
        >
          <textarea
            ref={ref}
            rows={1}
            spellCheck
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder ?? `Ask ${agentName} anything about this work…`}
            aria-label={`Ask ${agentName}`}
            style={{
              flex: 1,
              minHeight: 24,
              maxHeight: MAX_HEIGHT_PX,
              border: 0,
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: INK,
              fontFamily: FONT,
              fontSize: 14,
              lineHeight: 1.5,
              padding: 0,
            }}
          />
          <button
            type="button"
            disabled
            aria-label="Send"
            data-action="ask-anything-submit"
            style={{
              flex: '0 0 auto',
              padding: '8px 14px',
              borderRadius: 999,
              background: INK,
              color: '#F8F7F4',
              border: 0,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'not-allowed',
              opacity: 0.45,
            }}
          >
            Send →
          </button>
        </div>

        <div
          style={{
            marginTop: 6,
            color: MUTED_SOFT,
            fontSize: 11,
            fontStyle: 'italic',
          }}
        >
          {caveat ??
            `Live ask deferred — context bundle is deterministic-only. Enter submits, Shift+Enter inserts a newline. Spell check on.`}
          {' '}
          <span style={{ color: MUTED, fontStyle: 'normal' }}>· {agentName} responds in this surface only.</span>
        </div>
      </div>
    </div>
  );
}

export default AskAnythingBar;
