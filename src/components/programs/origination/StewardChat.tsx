'use client';

// StewardChat · Surface 1 of Programs Strict Completion v1.2
//
// Multi-turn chat against /api/chat/agent with surface = '/programs/new'
// (or '/demo/programs/new'). The route registers the `commit_program`
// tool for these surfaces (F0.4); when Steward emits a tool_use block
// for `commit_program`, the route's tool-use loop runs the handler
// server-side, the program lands in the DB, and Steward generates the
// natural-language confirmation. The chat then navigates to the new
// program detail page.
//
// In this PR the navigation trigger is a sentinel `[[program-created:<id>]]`
// emitted by the tool result and surfaced via the streamed text. PR2
// will replace this with a proper structured-artifact channel.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentMarkdown } from '@/lib/agent/markdownRenderer';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  agentName?: 'Steward';
  text: string;
}

export interface StewardChatProps {
  /** Surface path passed to the agent route — e.g. '/programs/new'. */
  surface: '/programs/new' | '/demo/programs/new';
  /** Tenant name passed to the agent route prompt context. */
  tenantName: string;
  /** Initial server-rendered turns (typically the cold-open Steward greeting). */
  initialTurns: ChatTurn[];
}

const STEWARD_ACCENT = BrandColors.signalBlue;
const PROGRAM_CREATED_SENTINEL = /\[\[program-created:([^\]]+)\]\]/;

function generateTurnId(): string {
  return `turn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function StewardChat({ surface, tenantName, initialTurns }: StewardChatProps) {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll the thread to the latest turn whenever turns change.
  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [turns]);

  const send = useCallback(async () => {
    const message = draft.trim();
    if (!message || streaming) return;

    const userTurn: ChatTurn = { id: generateTurnId(), role: 'user', text: message };
    const assistantTurnId = generateTurnId();
    setTurns((prev) => [
      ...prev,
      userTurn,
      { id: assistantTurnId, role: 'assistant', agentName: 'Steward', text: '' },
    ]);
    setDraft('');
    setStreaming(true);

    try {
      const conversationHistory = turns
        .filter((t) => t.role === 'user' || (t.role === 'assistant' && t.text.trim().length > 0))
        .map((t) => ({
          role: t.role,
          content: t.text,
        }));

      const res = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          tenantName,
          agentName: 'Steward',
          surface,
          conversationHistory,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Steward returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        // Strip the navigation sentinel from the visible text. We still
        // honor it after the stream completes; users shouldn't see it.
        const visible = accumulated.replace(PROGRAM_CREATED_SENTINEL, '').trimEnd();
        setTurns((prev) =>
          prev.map((t) => (t.id === assistantTurnId ? { ...t, text: visible } : t)),
        );
      }

      const navMatch = PROGRAM_CREATED_SENTINEL.exec(accumulated);
      if (navMatch) {
        const programId = navMatch[1];
        // Give the user a beat to see the success message before navigating.
        setTimeout(() => {
          router.push(`/programs/${programId}`);
        }, 900);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Steward failed to respond.';
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantTurnId
            ? { ...t, text: `_${message}_ Want me to retry?` }
            : t,
        ),
      );
    } finally {
      setStreaming(false);
      // Refocus the input so the user can keep typing without clicking.
      inputRef.current?.focus();
    }
  }, [draft, streaming, surface, tenantName, turns, router]);

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: `1px solid rgba(12,26,58,0.12)`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      aria-label="Steward conversation"
    >
      <header
        style={{
          padding: '14px 18px',
          borderBottom: `1px solid rgba(12,26,58,0.08)`,
          background: BrandColors.paper,
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 999,
            background: `${STEWARD_ACCENT}15`,
            color: STEWARD_ACCENT,
            fontFamily: BrandTypography.mono,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          St
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: BrandTypography.serif, fontSize: 16, fontWeight: 500 }}>
            Steward
          </span>
          <span style={{ fontFamily: BrandTypography.mono, fontSize: 11, color: BrandColors.stone }}>
            Program origination · governance & setup
          </span>
        </div>
      </header>

      <div
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          background: '#FFFFFF',
        }}
      >
        {turns.map((turn) => (
          <div
            key={turn.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: turn.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: BrandTypography.mono,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: BrandColors.stone,
                fontWeight: 600,
              }}
            >
              {turn.role === 'user' ? 'You' : turn.agentName ?? 'Steward'}
            </span>
            <div
              style={{
                maxWidth: '92%',
                padding: '10px 14px',
                borderRadius: 10,
                background:
                  turn.role === 'user' ? `${STEWARD_ACCENT}0E` : BrandColors.paper,
                border: `1px solid ${
                  turn.role === 'user'
                    ? `${STEWARD_ACCENT}33`
                    : 'rgba(12,26,58,0.08)'
                }`,
                fontFamily: BrandTypography.sans,
                fontSize: 14,
                lineHeight: 1.55,
                color: BrandColors.inkBlack,
              }}
            >
              {turn.role === 'user' ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{turn.text}</span>
              ) : turn.text.length > 0 ? (
                <AgentMarkdown text={turn.text} />
              ) : (
                <span style={{ color: BrandColors.stone, fontStyle: 'italic' }}>
                  Steward is thinking…
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer
        style={{
          padding: '12px 14px 14px',
          borderTop: `1px solid rgba(12,26,58,0.08)`,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          spellCheck
          placeholder="Tell Steward what you're solving — Enter to send, Shift+Enter for newline"
          aria-label="Message Steward"
          style={{
            flex: 1,
            resize: 'none',
            padding: '10px 12px',
            border: `1px solid rgba(12,26,58,0.18)`,
            borderRadius: 8,
            fontFamily: BrandTypography.sans,
            fontSize: 14,
            lineHeight: 1.5,
            color: BrandColors.inkBlack,
            background: '#FFFFFF',
            outline: 'none',
            minHeight: 48,
            maxHeight: 200,
          }}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!draft.trim() || streaming}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: streaming ? BrandColors.stone : STEWARD_ACCENT,
            color: '#FFFFFF',
            fontFamily: BrandTypography.sans,
            fontSize: 13,
            fontWeight: 600,
            cursor: !draft.trim() || streaming ? 'not-allowed' : 'pointer',
            opacity: !draft.trim() || streaming ? 0.5 : 1,
            minWidth: 88,
            height: 44,
          }}
        >
          {streaming ? '…' : 'Send'}
        </button>
      </footer>
    </section>
  );
}
