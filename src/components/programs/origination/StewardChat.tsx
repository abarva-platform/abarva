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
// PR2 (Surface 1) adds the structured-artifact channel: Steward emits
// inline artifacts via `[[artifact:<type>]]<JSON>[[/artifact]]` sentinels
// which this component parses out and dispatches via `onArtifact`. The
// chat-visible text never shows the artifact tuples; the right-pane
// workspace consumes them to populate the program brief reactively.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentMarkdown } from '@/lib/agent/markdownRenderer';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import {
  extractArtifacts,
  visibleArtifactPendingText,
  type Artifact,
} from '@/lib/agent/artifacts';
import {
  buildHandoffMarker,
  persistOriginationHandoff,
} from '@/lib/shell/origination-handoff';
import type { ChatTurn as AtlasChatTurn } from '@/lib/shell/atlas-page-state';
import type { BriefSnapshot } from './types';
// OV2-4b · paper-clip upload affordance. /programs/new doesn't have a
// committed program id yet, so the paper-clip is informational —
// rendered to teach the affordance, disabled because there's nothing
// to upload to until the brief commits. Wave 2 (evidence-ledger
// persist) will route pre-commit uploads to the draft.
import { ATTACHMENT_MIME_ALLOWLIST } from '@/lib/programs/attachments/mime';

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
  /**
   * Conversation turns. PR3 lifts state to the parent so the workspace
   * can hydrate from a saved draft and persist on each turn.
   */
  turns: ChatTurn[];
  /** Called whenever the chat appends or updates a turn. */
  onTurnsChange: (turns: ChatTurn[]) => void;
  /**
   * PR2 — artifact dispatcher. Called once per artifact parsed from the
   * streamed response. The workspace lifts brief state and applies
   * incremental updates from each artifact.
   */
  onArtifact?: (artifact: Artifact) => void;
  /**
   * PR-K — name of the program being authored, used in the handoff
   * marker copy when commit_program lands. Falls back to a generic
   * phrase when null/undefined (the conversation continuity still
   * works, only the marker text reads less specific).
   */
  programName?: string | null;
  /**
   * OV2-WIRE-CLIENT — current brief signals, threaded into the POST
   * body's `surfaceContext.briefSnapshot`. The agent route maps this
   * to BriefOverlapInput and runs detectBriefOverlap so Steward sees
   * overlap candidates in its system prompt. Optional — empty fields
   * collapse to undefined so detection only fires on real signals.
   */
  briefSnapshot?: BriefSnapshot;
}

const STEWARD_ACCENT = BrandColors.signalBlue;
const PROGRAM_CREATED_SENTINEL = /\[\[program-created:([^\]]+)\]\]/;

const STARTER_PROMPTS = [
  {
    label: 'Apex ERP modernization',
    prompt:
      'Set up a new Apex Retail program for SAP finance modernization. The problem is month-end close takes too long because finance data is split across SAP, Workday, and spreadsheets. Target outcome: reduce close cycle time by 30% and improve executive reporting confidence. Sponsor Sarah Chen; lead Mei Tanaka; start P0 in May.',
  },
  {
    label: 'Meridian prior auth',
    prompt:
      'Set up a Meridian Health prior authorization automation program. The problem is manual prior auth work is increasing clinician burden and downstream denial risk. Target outcome: improve auto-approval rate and reduce avoidable denials. Sponsor Patricia Okafor; lead David Henderson; timeline is P1 discovery this quarter.',
  },
  {
    label: 'First Capital risk controls',
    prompt:
      'Set up a First Capital program for AI model-risk controls. The problem is GenAI pilots are moving faster than governance evidence. Target outcome: standardize attestation, ownership, and audit trails before production use. Sponsor the CIO; lead enterprise risk; timeline is 90 days to P2.',
  },
];

function generateTurnId(): string {
  return `turn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Convert StewardChat's local turn shape ({ role: 'user' | 'assistant' })
 * into AtlasPageStateProvider's ChatTurn shape ({ role: 'user' | 'agent',
 * agentName, timestamp }) for cross-surface handoff persistence.
 */
function toAtlasTurns(turns: ChatTurn[]): AtlasChatTurn[] {
  return turns.map((t, idx) => ({
    id: t.id,
    role: t.role === 'user' ? 'user' : 'agent',
    agentName: t.role === 'assistant' ? (t.agentName ?? 'Steward') : 'user',
    text: t.text,
    // Origination chat doesn't track per-turn timestamps; fall back to a
    // monotonic offset anchored at now so the destination renders them
    // in order. (Date.now() - turns.length + idx ensures ascending.)
    timestamp: Date.now() - turns.length + idx,
  }));
}

export function StewardChat({
  surface,
  tenantName,
  turns,
  onTurnsChange,
  onArtifact,
  programName,
  briefSnapshot,
}: StewardChatProps) {
  // OV2-WIRE-CLIENT — mirror briefSnapshot into a ref so an in-flight
  // stream's send() closure always reads the latest snapshot the user
  // has typed, without re-creating the callback on every keystroke.
  const briefSnapshotRef = useRef<BriefSnapshot | undefined>(briefSnapshot);
  briefSnapshotRef.current = briefSnapshot;
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const showStarterPrompts = !turns.some((turn) => turn.role === 'user');
  // Mirror lifted `turns` into a ref so the streaming send() can read the
  // latest array without re-creating the callback each render. Avoids a
  // stale-closure issue where conversationHistory misses turns appended
  // by an in-flight stream.
  const turnsRef = useRef<ChatTurn[]>(turns);
  turnsRef.current = turns;
  const setTurns = useCallback(
    (updater: ChatTurn[] | ((prev: ChatTurn[]) => ChatTurn[])) => {
      const next =
        typeof updater === 'function'
          ? (updater as (prev: ChatTurn[]) => ChatTurn[])(turnsRef.current)
          : updater;
      turnsRef.current = next;
      onTurnsChange(next);
    },
    [onTurnsChange],
  );

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
      // Read from the ref so a parent state-replace mid-stream doesn't
      // produce stale conversation history.
      const conversationHistory = turnsRef.current
        .filter((t) => t.role === 'user' || (t.role === 'assistant' && t.text.trim().length > 0))
        .map((t) => ({
          role: t.role,
          content: t.text,
        }));

      // OV2-WIRE-CLIENT — thread the current brief signals into
      // surfaceContext.briefSnapshot so /api/chat/agent can run
      // detectBriefOverlap and inject overlap candidates into Steward's
      // system prompt. Empty/null fields are already collapsed to
      // undefined by buildBriefSnapshot.
      const snapshot = briefSnapshotRef.current;
      const res = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          tenantName,
          agentName: 'Steward',
          surface,
          conversationHistory,
          surfaceContext: {
            briefSnapshot: snapshot ?? {},
          },
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Steward returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // `pendingBuffer` holds text that may contain a partial artifact
      // sentinel (open-without-close yet) — it's carried across read()
      // chunks until the close sentinel arrives. `committedVisible` is
      // the artifact-stripped text we've already displayed.
      let pendingBuffer = '';
      let committedVisible = '';
      const seenArtifacts = new Set<string>();

      const dispatchNew = (artifacts: Artifact[]) => {
        if (!onArtifact) return;
        for (const a of artifacts) {
          const key = JSON.stringify(a);
          if (seenArtifacts.has(key)) continue;
          seenArtifacts.add(key);
          onArtifact(a);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pendingBuffer += decoder.decode(value, { stream: true });
        const { visibleText, artifacts, remaining } = extractArtifacts(pendingBuffer);
        committedVisible += visibleText;
        pendingBuffer = remaining;
        dispatchNew(artifacts);

        // Strip the navigation sentinel from the visible text we render.
        const display = (committedVisible + visibleArtifactPendingText(pendingBuffer))
          .replace(PROGRAM_CREATED_SENTINEL, '')
          .trimEnd();
        setTurns((prev) =>
          prev.map((t) => (t.id === assistantTurnId ? { ...t, text: display } : t)),
        );
      }

      // Flush any remaining buffer through the parser one last time so a
      // final artifact whose close arrived in the same chunk as the
      // close-of-stream still dispatches.
      if (pendingBuffer.length > 0) {
        const final = extractArtifacts(pendingBuffer);
        committedVisible += final.visibleText;
        // If `final.remaining` still has an unclosed open sentinel, it
        // means the agent emitted a malformed artifact — surface it as
        // visible text so the bug doesn't silently disappear.
        if (final.remaining.length > 0) {
          committedVisible += visibleArtifactPendingText(final.remaining);
        }
        dispatchNew(final.artifacts);
        pendingBuffer = '';
      }

      // PR2.1 — re-render after flush so the final displayed text always
      // reflects the artifact-stripped `committedVisible`. Without this,
      // the last in-loop setTurns may have left a partial buffer in the
      // displayed text that the post-flush parse cleaned up.
      const finalDisplay = committedVisible
        .replace(PROGRAM_CREATED_SENTINEL, '')
        .trimEnd();
      setTurns((prev) =>
        prev.map((t) => (t.id === assistantTurnId ? { ...t, text: finalDisplay } : t)),
      );

      const allText = committedVisible;
      const navMatch = PROGRAM_CREATED_SENTINEL.exec(allText);
      if (navMatch) {
        const programId = navMatch[1];
        // PR-K · before the route change, persist the conversation
        // turns so AtlasPageStateProvider on /programs/<id> can hydrate
        // them and the user keeps the thread instead of starting from
        // a blank Nexus greeting. The handoff window is intentionally
        // short (90s) to avoid replaying old conversations.
        const finalTurnsForHandoff: ChatTurn[] = turnsRef.current.map((t) =>
          t.id === assistantTurnId ? { ...t, text: finalDisplay } : t,
        );
        const handoffTurns = [
          ...toAtlasTurns(finalTurnsForHandoff),
          buildHandoffMarker(programName ?? 'your program'),
        ];
        persistOriginationHandoff({
          programId,
          programName: programName ?? 'your program',
          turns: handoffTurns,
          capturedAt: Date.now(),
        });
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
  }, [draft, streaming, surface, tenantName, router, onArtifact, setTurns, programName]);

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
          flex: '1 1 auto',
          // minHeight: 0 lets flex shrink the thread below its intrinsic
          // content height so internal scroll engages instead of letting
          // the whole panel grow past the viewport.
          minHeight: 0,
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

        {showStarterPrompts ? (
          <section
            aria-label="Starter prompts"
            style={{
              border: `1px solid rgba(12,26,58,0.10)`,
              borderRadius: 10,
              padding: '12px 14px',
              background: BrandColors.paper,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  fontFamily: BrandTypography.mono,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: BrandColors.stone,
                  fontWeight: 700,
                }}
              >
                Fast-start setup
              </span>
              <span
                style={{
                  fontFamily: BrandTypography.sans,
                  fontSize: 13,
                  color: BrandColors.slate,
                  lineHeight: 1.45,
                }}
              >
                Pick a realistic starter brief, then edit before sending.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STARTER_PROMPTS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => {
                    setDraft(starter.prompt);
                    if (typeof requestAnimationFrame === 'function') {
                      requestAnimationFrame(() => inputRef.current?.focus());
                    } else {
                      inputRef.current?.focus();
                    }
                  }}
                  style={{
                    border: `1px solid rgba(12,26,58,0.16)`,
                    borderRadius: 999,
                    background: '#FFFFFF',
                    color: BrandColors.inkBlack,
                    cursor: 'pointer',
                    fontFamily: BrandTypography.sans,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '7px 10px',
                  }}
                >
                  {starter.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}
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
        {/* Paper-clip · OV2-4b · informational on /programs/new because
            no program id exists yet. Disabled with a tooltip pointing
            users to commit the brief first. The icon is rendered so the
            affordance is visible from turn 1, satisfying the founder's
            "don't forget the ability to load data from the chat window"
            reminder. */}
        <button
          type="button"
          disabled
          aria-label="Attach a file (available after the program is created)"
          title="Files can be attached once the brief is committed and a program id is minted."
          style={{
            flexShrink: 0,
            width: 36,
            height: 44,
            padding: 0,
            border: `1px solid rgba(12,26,58,0.18)`,
            borderRadius: 8,
            background: '#F4F0E7',
            color: BrandColors.stone,
            cursor: 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.7,
          }}
        >
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        {/* Hidden input rendered for spec compliance — tests assert the
            allowlist accept attribute. The button above is disabled so
            this never opens, but Wave 2 will swap the disabled button
            for an active one wired to fileInputRef.click(). */}
        <input
          type="file"
          accept={ATTACHMENT_MIME_ALLOWLIST.join(',')}
          multiple
          aria-hidden
          tabIndex={-1}
          style={{ display: 'none' }}
          data-component="StewardChatAttachmentInput"
        />
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
