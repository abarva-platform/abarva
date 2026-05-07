'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { leadAgentForStage, type SourceLeadAgent } from '@/lib/source/portfolio-derivations';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { CANVAS } from './canvas-tokens';

export interface ChatTurn {
  id: string;
  role: 'agent' | 'user';
  body: string;
}

interface EventChatLaneProps {
  stage: SourceStageKey;
  contextBundle: {
    /** N/M evidence sources at minimum readiness. */
    readiness: string;
    /** Artifact count + status summary. */
    artifacts: string;
    /** Vendor count when relevant. */
    vendors?: string;
    /** Evidence-item count when relevant. */
    evidence?: string;
  };
  thread: ChatTurn[];
  /** Three suggested choices for this stage. Empty array hides the choice strip. */
  choices: string[];
  /** Disabled until the chat backend is wired up. */
  isStreaming?: boolean;
  onSubmit?: (text: string) => void;
  onChoice?: (text: string) => void;
}

const AGENT_DESCRIPTION: Record<SourceLeadAgent, string> = {
  Nexus: 'Workflow lead. Keeps scope and gate cadence honest.',
  Sentinel: 'Information integrity. Pulls evidence and flags gaps.',
  Steward: 'Scorecard and weight governance.',
  Atlas: 'Executive framing, decision brief, value posture.',
};

export function EventChatLane({
  stage,
  contextBundle,
  thread,
  choices,
  isStreaming = false,
  onSubmit,
  onChoice,
}: EventChatLaneProps) {
  const agent = leadAgentForStage(stage);
  const stageLabel = SOURCE_STAGE_LABELS[stage];
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-grow the textarea up to a reasonable cap.
  const onChange = useCallback((value: string) => {
    setDraft(value);
    const ta = inputRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
    }
  }, []);

  // Scroll thread into view on new turns.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread.length]);

  const submit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed) return;
      onSubmit?.(trimmed);
      setDraft('');
      const ta = inputRef.current;
      if (ta) ta.style.height = 'auto';
    },
    [draft, onSubmit],
  );

  return (
    <section
      data-testid="source-canvas-chat-lane"
      aria-label={`${agent} chat lane`}
      style={LANE_STYLE}
    >
      {/* Agent header */}
      <div style={HEADER_STYLE}>
        <div style={AGENT_ROW_STYLE}>
          <span style={AVATAR_STYLE}>{agent[0]}</span>
          <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
            <span style={AGENT_NAME_STYLE}>{agent}</span>
            <span style={AGENT_DESC_STYLE}>{AGENT_DESCRIPTION[agent]}</span>
          </div>
        </div>
        <div style={STAGE_LABEL_STYLE}>
          Step {stageLabel.toUpperCase()}
        </div>
      </div>

      {/* Context bundle */}
      <div style={CONTEXT_STRIP_STYLE} aria-label="Context bundle">
        <span style={CONTEXT_LABEL_STYLE}>Context</span>
        <span>Readiness {contextBundle.readiness}</span>
        <span style={DOT_SEP}>·</span>
        <span>Artifacts {contextBundle.artifacts}</span>
        {contextBundle.vendors ? (
          <>
            <span style={DOT_SEP}>·</span>
            <span>Vendors {contextBundle.vendors}</span>
          </>
        ) : null}
        {contextBundle.evidence ? (
          <>
            <span style={DOT_SEP}>·</span>
            <span>Evidence {contextBundle.evidence}</span>
          </>
        ) : null}
      </div>

      {/* Thread */}
      <div style={THREAD_STYLE} data-testid="source-canvas-chat-thread">
        {thread.length === 0 ? (
          <div style={EMPTY_STATE_STYLE}>
            <p style={EMPTY_TITLE_STYLE}>Ask {agent} anything about this step.</p>
            <p style={EMPTY_BODY_STYLE}>
              {agent} reads the event substrate and your context bundle. Pick a
              suggested choice below or type your own question.
            </p>
          </div>
        ) : (
          thread.map((turn) => (
            <div
              key={turn.id}
              data-testid={`source-canvas-chat-turn-${turn.role}`}
              style={turn.role === 'user' ? USER_TURN_STYLE : AGENT_TURN_STYLE}
            >
              {turn.role === 'agent' ? (
                <div style={AGENT_BYLINE_STYLE}>{agent}</div>
              ) : null}
              <div style={BUBBLE_STYLE}>{turn.body}</div>
            </div>
          ))
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Three suggested choices */}
      {choices.length > 0 ? (
        <div style={CHOICES_STYLE} aria-label={`Three suggested next moves for ${stageLabel}`}>
          <div style={CHOICES_LABEL_STYLE}>↳ Three choices for {stageLabel}</div>
          {choices.map((choice, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChoice?.(choice)}
              disabled={isStreaming}
              data-testid={`source-canvas-choice-${i}`}
              style={CHOICE_BUTTON_STYLE}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : null}

      {/* Sticky input */}
      <form onSubmit={submit} style={INPUT_FORM_STYLE} aria-label={`Ask ${agent}`}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={`Ask ${agent}…`}
          rows={1}
          spellCheck
          disabled={isStreaming}
          data-testid="source-canvas-chat-input"
          style={INPUT_STYLE}
        />
        <button
          type="submit"
          disabled={isStreaming || draft.trim().length === 0}
          style={SUBMIT_BUTTON_STYLE}
          aria-label="Send message"
        >
          ↑
        </button>
      </form>
    </section>
  );
}

const LANE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: CANVAS.CHAT_BG,
  borderRight: `1px solid ${CANVAS.HAIRLINE}`,
  minHeight: 0,
};

const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px 18px 12px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const AGENT_ROW_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
};

const AVATAR_STYLE: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  background: CANVAS.INK,
  color: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: CANVAS.SERIF,
  fontSize: 14,
  fontWeight: 500,
  flexShrink: 0,
};

const AGENT_NAME_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  fontWeight: 600,
  color: CANVAS.INK,
};

const AGENT_DESC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.3,
};

const STAGE_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.14em',
  color: CANVAS.GRAY_DK,
  fontWeight: 600,
};

const CONTEXT_STRIP_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 6,
  padding: '10px 18px',
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: '0.06em',
  color: CANVAS.INK_SOFT,
  background: 'rgba(10,10,11,0.025)',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const CONTEXT_LABEL_STYLE: CSSProperties = {
  fontWeight: 700,
  color: CANVAS.INK,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginRight: 4,
};

const DOT_SEP: CSSProperties = {
  color: CANVAS.GRAY,
};

const THREAD_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '20px 18px',
  display: 'grid',
  gap: 14,
  alignContent: 'start',
};

const EMPTY_STATE_STYLE: CSSProperties = {
  paddingTop: 12,
  display: 'grid',
  gap: 8,
};

const EMPTY_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 18,
  fontWeight: 400,
  color: CANVAS.INK,
  margin: 0,
};

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.55,
  color: CANVAS.INK_SOFT,
  margin: 0,
  maxWidth: 460,
};

const AGENT_TURN_STYLE: CSSProperties = {
  display: 'grid',
  gap: 4,
};

const USER_TURN_STYLE: CSSProperties = {
  display: 'grid',
  gap: 4,
  justifyItems: 'end',
};

const AGENT_BYLINE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
  fontWeight: 600,
};

const BUBBLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  lineHeight: 1.6,
  color: CANVAS.INK,
  // No truncation. Page scrolls; bubble takes whatever vertical space it needs.
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxWidth: '100%',
};

const CHOICES_STYLE: CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: '12px 18px',
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
};

const CHOICES_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
  marginBottom: 2,
};

const CHOICE_BUTTON_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '10px 12px',
  background: CANVAS.CARD,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: CANVAS.INK,
  cursor: 'pointer',
  transition: 'background 120ms ease, border-color 120ms ease',
};

const INPUT_FORM_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 8,
  padding: '12px 18px 16px',
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
};

const INPUT_STYLE: CSSProperties = {
  flex: 1,
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  lineHeight: 1.5,
  padding: '10px 12px',
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: `1px solid ${CANVAS.RULE}`,
  background: CANVAS.CARD,
  color: CANVAS.INK,
  resize: 'none',
  minHeight: 40,
  maxHeight: 220,
  outline: 'none',
};

const SUBMIT_BUTTON_STYLE: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: CANVAS.INK,
  color: '#fff',
  border: 'none',
  fontSize: 16,
  fontWeight: 500,
  cursor: 'pointer',
  flexShrink: 0,
};
