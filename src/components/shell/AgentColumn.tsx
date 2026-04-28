import type { ReactNode } from 'react';
import { useState, useRef, useCallback } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

const CANNED_RESPONSE = "I've reviewed the context. Based on current data, I recommend focusing on the highest-priority gate criteria first. Let me know if you'd like a deeper analysis of any specific area.";

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
  /** Whether to show the Ask Anything interactive toolbar. Default: true. */
  showAskAnything?: boolean;
  /** Surface hint for context */
  surface?: string;
  /** Program ID for context */
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
  showAskAnything = true,
}: AgentColumnProps) {
  const placeholder = inputPlaceholder ?? `Ask ${agent.name}...`;
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAsk = useCallback((text: string) => {
    if (!text.trim()) return;
    setInputValue('');
    setIsThinking(true);
    setResponse(null);
    setTimeout(() => {
      setIsThinking(false);
      setResponse(CANNED_RESPONSE);
      setTimeout(() => setResponse(null), 4000);
    }, 1200);
  }, []);

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

      {/* Ask Anything toolbar */}
      {showAskAnything && (
        <div style={{ marginTop: 'auto', padding: '16px 0 24px' }}>
          {/* Response / thinking bubble */}
          {(isThinking || response) && (
            <div
              style={{
                background: 'rgba(250,247,241,0.08)',
                border: '1px solid rgba(250,247,241,0.15)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 10,
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: 'rgba(250,247,241,0.80)',
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: 'rgba(250,247,241,0.45)', marginRight: 6 }}>
                {agent.initials}
              </span>
              {isThinking ? '...' : response}
            </div>
          )}
          {/* Input row */}
          <div
            style={{
              background: 'rgba(250,247,241,0.08)',
              border: '1px solid rgba(250,247,241,0.20)',
              borderRadius: 22,
              padding: '10px 16px 10px 18px',
              display: 'flex',
              flexDirection: 'row',
              gap: 12,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk(inputValue);
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }
              }}
              placeholder={placeholder}
              rows={1}
              spellCheck
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: 'rgba(250,247,241,0.9)',
                lineHeight: 1.4,
                overflow: 'hidden',
              }}
            />
            <span
              onClick={() => {
                handleAsk(inputValue);
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
              }}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: inputValue.trim() ? 'rgba(250,247,241,0.85)' : 'rgba(250,247,241,0.35)',
                fontWeight: 600,
                flexShrink: 0,
                cursor: inputValue.trim() ? 'pointer' : 'default',
                paddingBottom: 2,
              }}
            >
              ↵ Send
            </span>
          </div>
        </div>
      )}
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
