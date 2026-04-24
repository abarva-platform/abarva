'use client';

// AgentRail · the shared primitive for the 4-agent canon (Nexus · Sentinel ·
// Atlas · Steward). Persistent-visible, collapsed-narrow-default (48px)
// right-edge rail. Expand on click → 380px sliding panel with:
//   · Conversation history (You / Agent bubbles, cream palette)
//   · Guided-choice input (3-5 chips + "something else" escape hatch)
//   · Free-text composer as fallback
//
// Every authenticated surface binds to its agent. Voice contracts are
// domain-specific, but the rail geometry is identical.

import { useState, useEffect, useRef, useMemo } from 'react';
import type { RenderedResponse } from '@/lib/agent/renderedResponse';
import { AgentResponse } from '@/components/agent/AgentResponse';

export type AgentKey = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export interface AgentProfile {
  key: AgentKey;
  name: string;             // "Nexus"
  domain: string;           // "Programs" / "Intelligence" / etc.
  voice: string;            // "maestro-collegial" · short desc
  glyph: string;            // serif glyph for avatar · e.g. "✱"
  accent: string;           // hex · teal for nexus, etc.
  accentSoft: string;       // rgba soft tint
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export const AGENTS: Record<AgentKey, AgentProfile> = {
  nexus: {
    key: 'nexus', name: 'Nexus', domain: 'Programs',
    voice: 'Maestro-collegial · intake, phase gates, deliverable regeneration',
    glyph: '✱', accent: '#0E9F8C', accentSoft: 'rgba(14,159,140,0.1)',
  },
  sentinel: {
    key: 'sentinel', name: 'Sentinel', domain: 'Intelligence',
    voice: 'Research-rigorous · pattern search, observation capture',
    glyph: '◈', accent: '#9B6DFF', accentSoft: 'rgba(155,109,255,0.1)',
  },
  atlas: {
    key: 'atlas', name: 'Atlas', domain: 'Control Tower',
    voice: 'Executive-concise · pressure triage, vendor rationalization',
    glyph: '▲', accent: '#F59E0B', accentSoft: 'rgba(245,158,11,0.1)',
  },
  steward: {
    key: 'steward', name: 'Steward', domain: 'Admin',
    voice: 'Operationally-terse · provisioning, audit, connectors',
    glyph: '◆', accent: '#3B82F6', accentSoft: 'rgba(59,130,246,0.1)',
  },
};

export interface AgentTurn {
  id: string;
  speaker: 'you' | 'agent';
  text: string;
  timestamp?: string;
  /**
   * When present and speaker is 'agent', the renderer uses the File 08
   * Section 4.6 rendered_response shape instead of plain text. `text` is
   * still kept as a fallback and as the source feeding the feedback
   * store.
   */
  rendered?: RenderedResponse;
}

export interface GuidedChoiceOption {
  id: string;
  label: string;               // "Consolidate to single vendor"
  sub?: string;                 // optional tiny description
}

export interface AgentAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
}

export interface AgentRailProps {
  agent: AgentProfile;
  conversation: AgentTurn[];
  // Guided-choice prompts rotate as the conversation advances. The
  // caller owns the state (e.g. per-phase in Programs, per-pattern in
  // Intelligence). When the user taps a chip, onChoice fires with the
  // option id; when they use the escape hatch, onEscape fires with the
  // free text.
  guidedChoice?: {
    prompt: string;              // "What are we doing in this phase?"
    options: GuidedChoiceOption[];
  } | null;
  onChoice?: (optionId: string) => void;
  onEscape?: (text: string) => void;
  // Left-edge badge · e.g. "Phase 0 · Start" or "Pattern · Ambient Clinical"
  contextBadge?: string;
  // Sponsor/viewer avatar initials for "You" bubble
  userInitials?: string;
  // Controlled open state (optional · defaults to internal state)
  defaultOpen?: boolean;
  // Upload support (Priority 1). When onAttach is wired, the escape
  // input shows a paperclip affordance. Actual ingestion into agent
  // context is Category 3 (deferred pending crawler findings) — for
  // now the file is surfaced as a visible chip so the user has proof
  // the attachment exists and the simulation can drop artifacts.
  onAttach?: (files: AgentAttachment[]) => void;
  attachments?: AgentAttachment[];
}

export function AgentRail({
  agent,
  conversation,
  guidedChoice,
  onChoice,
  onEscape,
  contextBadge,
  userInitials = 'YO',
  defaultOpen = false,
  onAttach,
  attachments = [],
}: AgentRailProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [escapeText, setEscapeText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }
  }, [open, conversation.length]);

  const css = useMemo(() => railCss(agent.accent, agent.accentSoft), [agent.accent, agent.accentSoft]);

  return (
    <>
      <style>{css}</style>

      {/* Collapsed rail · persistent right-edge tab */}
      {!open ? (
        <button
          type="button"
          className="ar-collapsed"
          onClick={() => setOpen(true)}
          aria-label={`Open ${agent.name} · ${agent.domain}`}
          title={`${agent.name} · ${agent.voice}`}
        >
          <span className="ar-collapsed-avatar">{agent.glyph}</span>
          <span className="ar-collapsed-name">{agent.name}</span>
          <span className="ar-collapsed-status" aria-hidden="true" />
        </button>
      ) : null}

      {/* Expanded rail · slide-in from right */}
      {open ? (
        <aside className="ar-expanded" role="dialog" aria-label={`${agent.name} conversation`}>
          <div className="ar-header">
            <div className="ar-header-left">
              <div className="ar-avatar">{agent.glyph}</div>
              <div>
                <div className="ar-name">{agent.name}</div>
                <div className="ar-domain">{agent.domain}</div>
              </div>
            </div>
            <button
              type="button"
              className="ar-close"
              onClick={() => setOpen(false)}
              aria-label="Collapse agent rail"
            >
              ⟩
            </button>
          </div>

          {contextBadge ? (
            <div className="ar-context-badge">
              <span className="ar-context-dot" /> {contextBadge}
            </div>
          ) : null}

          <div className="ar-voice">{agent.voice}</div>

          <div className="ar-messages">
            {conversation.map((turn) => (
              <div key={turn.id} className={`ar-bubble ${turn.speaker}`}>
                <div className="ar-bubble-avatar">
                  {turn.speaker === 'you' ? userInitials : agent.glyph}
                </div>
                <div className="ar-bubble-content">
                  <div className="ar-bubble-speaker">
                    {turn.speaker === 'you' ? 'You' : agent.name}
                  </div>
                  <div className="ar-bubble-body">
                    {turn.speaker === 'agent' && turn.rendered ? (
                      <AgentResponse response={turn.rendered} accent={agent.accent} />
                    ) : (
                      turn.text
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Guided choice · 3-5 chips + "something else" escape hatch */}
          {guidedChoice ? (
            <div className="ar-guided">
              <div className="ar-guided-prompt">{guidedChoice.prompt}</div>
              <div className="ar-guided-options">
                {guidedChoice.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="ar-chip"
                    onClick={() => onChoice?.(opt.id)}
                  >
                    <span className="ar-chip-label">{opt.label}</span>
                    {opt.sub ? <span className="ar-chip-sub">{opt.sub}</span> : null}
                  </button>
                ))}
              </div>
              {attachments.length > 0 ? (
                <div className="ar-attachments" aria-label="Attached files">
                  {attachments.map((a) => (
                    <span key={a.id} className="ar-attachment-chip" title={`${a.mimeType} · ${formatBytes(a.sizeBytes)}`}>
                      <span className="ar-attachment-icon" aria-hidden="true">📎</span>
                      <span className="ar-attachment-name">{a.name}</span>
                      <span className="ar-attachment-size">{formatBytes(a.sizeBytes)}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              <form
                className="ar-escape"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (escapeText.trim()) {
                    onEscape?.(escapeText.trim());
                    setEscapeText('');
                  }
                }}
              >
                {onAttach ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length === 0) return;
                        const newAttachments: AgentAttachment[] = files.map((f, i) => ({
                          id: `${Date.now()}-${i}-${f.name}`,
                          name: f.name,
                          sizeBytes: f.size,
                          mimeType: f.type || 'application/octet-stream',
                        }));
                        onAttach(newAttachments);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    />
                    <button
                      type="button"
                      className="ar-attach-btn"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Attach file"
                      title="Attach file"
                    >
                      📎
                    </button>
                  </>
                ) : null}
                <input
                  type="text"
                  value={escapeText}
                  onChange={(e) => setEscapeText(e.target.value)}
                  placeholder="Something else…"
                  className="ar-escape-input"
                />
                <button type="submit" className="ar-escape-send" aria-label="Send">↵</button>
              </form>
            </div>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}

function railCss(accent: string, accentSoft: string): string {
  return `
    :root {
      --ar-accent: ${accent};
      --ar-accent-soft: ${accentSoft};
    }
    .ar-collapsed, .ar-expanded { font-family: 'DM Sans', -apple-system, sans-serif; }

    .ar-collapsed {
      position: fixed;
      right: 0;
      top: 120px;
      width: 48px;
      min-height: 180px;
      background: #FFFFFF;
      border: 1px solid rgba(10,10,11,0.1);
      border-right: none;
      border-radius: 12px 0 0 12px;
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      box-shadow: -4px 8px 24px rgba(10,10,11,0.08);
      z-index: 40;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .ar-collapsed:hover {
      transform: translateX(-2px);
      box-shadow: -6px 10px 28px rgba(10,10,11,0.12);
    }
    .ar-collapsed-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--ar-accent); color: #FFFFFF;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Georgia', serif; font-size: 18px;
    }
    .ar-collapsed-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #1a1612;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-weight: 700;
    }
    .ar-collapsed-status {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--ar-accent);
      box-shadow: 0 0 0 2px var(--ar-accent-soft);
      animation: ar-halo 2.4s ease-in-out infinite;
    }
    @keyframes ar-halo {
      0%, 100% { box-shadow: 0 0 0 2px var(--ar-accent-soft); opacity: 1; }
      50%      { box-shadow: 0 0 0 6px transparent; opacity: 0.7; }
    }

    .ar-expanded {
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      width: 380px;
      background: #FFFFFF;
      border-left: 1px solid rgba(10,10,11,0.12);
      box-shadow: -12px 0 40px rgba(10,10,11,0.14);
      display: flex;
      flex-direction: column;
      z-index: 41;
      animation: ar-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes ar-slide-in {
      0%   { transform: translateX(100%); }
      100% { transform: translateX(0); }
    }

    .ar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 20px 14px;
      border-bottom: 1px solid rgba(10,10,11,0.06);
    }
    .ar-header-left { display: flex; align-items: center; gap: 12px; }
    .ar-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--ar-accent); color: #FFFFFF;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Georgia', serif; font-size: 20px;
    }
    .ar-name {
      font-family: 'Georgia', serif;
      font-size: 18px;
      font-weight: 600;
      color: #1a1612;
      letter-spacing: -0.01em;
    }
    .ar-domain {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ar-accent);
      font-weight: 700;
    }
    .ar-close {
      width: 28px; height: 28px; border-radius: 999px;
      background: rgba(10,10,11,0.04);
      border: 1px solid rgba(10,10,11,0.08);
      color: #1a1612;
      cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .ar-close:hover { background: rgba(10,10,11,0.08); }

    .ar-context-badge {
      margin: 14px 20px 0;
      padding: 8px 12px;
      background: var(--ar-accent-soft);
      border: 1px solid var(--ar-accent-soft);
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ar-accent);
      font-weight: 700;
      display: flex; align-items: center; gap: 8px;
    }
    .ar-context-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--ar-accent);
    }

    .ar-voice {
      padding: 10px 20px 14px;
      font-size: 12px;
      color: #6d625a;
      font-style: italic;
      line-height: 1.5;
      border-bottom: 1px solid rgba(10,10,11,0.06);
    }

    .ar-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .ar-bubble {
      display: flex;
      gap: 10px;
    }
    .ar-bubble-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
    }
    .ar-bubble.you .ar-bubble-avatar {
      background: rgba(10,10,11,0.08); color: #1a1612;
    }
    .ar-bubble.agent .ar-bubble-avatar {
      background: var(--ar-accent); color: #FFFFFF;
      font-family: 'Georgia', serif; font-size: 15px;
    }
    .ar-bubble-content { flex: 1; min-width: 0; }
    .ar-bubble-speaker {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #8a7e72;
      margin-bottom: 4px;
    }
    .ar-bubble.agent .ar-bubble-speaker {
      color: var(--ar-accent);
      font-weight: 700;
    }
    .ar-bubble-body {
      font-size: 13.5px;
      line-height: 1.6;
      color: #1a1612;
    }

    /* Guided choice */
    .ar-guided {
      border-top: 1px solid rgba(10,10,11,0.08);
      padding: 14px 20px 18px;
      background: #FAF7F1;
    }
    .ar-guided-prompt {
      font-size: 12px;
      color: #544b42;
      margin-bottom: 10px;
      font-weight: 500;
    }
    .ar-guided-options {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }
    .ar-chip {
      text-align: left;
      padding: 9px 12px;
      background: #FFFFFF;
      border: 1px solid rgba(10,10,11,0.12);
      border-radius: 8px;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: #1a1612;
      transition: all 0.15s;
    }
    .ar-chip:hover {
      background: var(--ar-accent-soft);
      border-color: var(--ar-accent);
      transform: translateX(-1px);
    }
    .ar-chip-label { display: block; font-weight: 500; }
    .ar-chip-sub {
      display: block;
      margin-top: 2px;
      font-size: 11px;
      color: #8a7e72;
    }
    .ar-escape {
      display: flex;
      gap: 6px;
      padding: 8px;
      background: #FFFFFF;
      border: 1px solid rgba(10,10,11,0.12);
      border-radius: 10px;
    }
    .ar-escape:focus-within {
      border-color: var(--ar-accent);
      box-shadow: 0 0 0 3px var(--ar-accent-soft);
    }
    .ar-escape-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-family: inherit;
      font-size: 13px;
      color: #1a1612;
      padding: 4px 6px;
    }
    .ar-escape-input::placeholder { color: #8a7e72; }
    .ar-escape-send {
      width: 28px; height: 28px; border-radius: 999px;
      background: var(--ar-accent); color: #FFFFFF;
      border: none; cursor: pointer;
      font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .ar-escape-send:hover { opacity: 0.9; }

    .ar-attach-btn {
      width: 28px; height: 28px; border-radius: 999px;
      background: rgba(10,10,11,0.06); color: #1a1612;
      border: 1px solid rgba(10,10,11,0.1); cursor: pointer;
      font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      margin-right: 2px;
    }
    .ar-attach-btn:hover { background: var(--ar-accent-soft); border-color: var(--ar-accent); }
    .ar-attachments {
      display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;
    }
    .ar-attachment-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 8px; border-radius: 6px;
      background: var(--ar-accent-soft); border: 1px solid var(--ar-accent-soft);
      font-size: 11px; color: #1a1612;
    }
    .ar-attachment-icon { flex-shrink: 0; font-size: 12px; }
    .ar-attachment-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
    .ar-attachment-size {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      color: #6d625a; flex-shrink: 0;
    }

    @media (max-width: 640px) {
      .ar-expanded { width: 100%; }
      .ar-collapsed { top: 100px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ar-collapsed-status, .ar-expanded, .ar-chip { animation: none !important; transition: none !important; }
    }
  `;
}

// ─── ConversationTurn ─────────────────────────────────────────────────
// Standalone bubble primitive. One turn · user or agent. Used inside
// AgentRail's message list and also standalone in the interaction
// exemplar or any surface that wants to render a conversation log
// without the full rail chrome.

export interface ConversationTurnProps {
  turn: AgentTurn;
  agent: AgentProfile;
  userInitials?: string;
  // When the turn is mid-stream, pass this to show a typing cursor and
  // suppress the speaker label's "done" affordance.
  streaming?: boolean;
}

export function ConversationTurn({ turn, agent, userInitials = 'YO', streaming = false }: ConversationTurnProps) {
  const css = useMemo(() => turnCss(agent.accent), [agent.accent]);
  return (
    <>
      <style>{css}</style>
      <div className={`ct-bubble ${turn.speaker}`}>
        <div className="ct-avatar">
          {turn.speaker === 'you' ? userInitials : agent.glyph}
        </div>
        <div className="ct-content">
          <div className="ct-speaker">
            {turn.speaker === 'you' ? 'You' : agent.name}
            {streaming ? <span className="ct-streaming-tag">STREAMING</span> : null}
          </div>
          <div className="ct-body">
            {turn.text}
            {streaming ? <span className="ct-cursor" aria-hidden="true">▋</span> : null}
          </div>
        </div>
      </div>
    </>
  );
}

function turnCss(accent: string): string {
  return `
    .ct-bubble { display: flex; gap: 10px; font-family: 'DM Sans', -apple-system, sans-serif; }
    .ct-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    .ct-bubble.you .ct-avatar { background: rgba(10,10,11,0.08); color: #1a1612; }
    .ct-bubble.agent .ct-avatar {
      background: ${accent}; color: #FFFFFF;
      font-family: 'Georgia', serif; font-size: 15px;
    }
    .ct-content { flex: 1; min-width: 0; }
    .ct-speaker {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
      color: #8a7e72; margin-bottom: 4px;
      display: flex; align-items: center; gap: 8px;
    }
    .ct-bubble.agent .ct-speaker { color: ${accent}; font-weight: 700; }
    .ct-streaming-tag {
      font-size: 8px; padding: 2px 5px; border-radius: 3px;
      background: ${accent}; color: #FFFFFF; letter-spacing: 0.14em;
    }
    .ct-body {
      font-size: 13.5px; line-height: 1.6; color: #1a1612;
    }
    .ct-cursor {
      display: inline-block; margin-left: 2px;
      color: ${accent}; font-weight: 400;
      animation: ct-blink 1s steps(2) infinite;
    }
    @keyframes ct-blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ct-cursor { animation: none; opacity: 1; }
    }
  `;
}

// ─── StreamingResponsePane ────────────────────────────────────────────
// Token-by-token appearance for an agent response. Pass the full text
// and it animates in word-by-word; consumer decides when `done` is true
// (e.g. when the upstream stream has closed).

export interface StreamingResponsePaneProps {
  text: string;
  done?: boolean;
  // Words per second · default 12 (~80ms per token, natural reading pace)
  wordsPerSecond?: number;
  agent: AgentProfile;
  // Optional callback fired when the internal animation reaches the end
  // of `text`. Useful for chaining into the next turn.
  onAnimationComplete?: () => void;
}

export function StreamingResponsePane({
  text,
  done = false,
  wordsPerSecond = 12,
  agent,
  onAnimationComplete,
}: StreamingResponsePaneProps) {
  const [animatedChars, setAnimatedChars] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (done) return;
    const avgWordLen = 5.5;
    const charsPerTick = Math.max(1, Math.ceil(((wordsPerSecond * avgWordLen) / 1000) * 60));
    const interval = window.setInterval(() => {
      setAnimatedChars((prev) => Math.min(prev + charsPerTick, text.length));
    }, 60);
    return () => window.clearInterval(interval);
  }, [text, done, wordsPerSecond]);

  const visibleChars = done ? text.length : Math.min(animatedChars, text.length);
  const isStreaming = !done && visibleChars < text.length;

  useEffect(() => {
    if (!isStreaming && !completedRef.current) {
      completedRef.current = true;
      onAnimationComplete?.();
    }
  }, [isStreaming, onAnimationComplete]);

  return (
    <ConversationTurn
      turn={{ id: 'streaming', speaker: 'agent', text: text.slice(0, visibleChars) }}
      agent={agent}
      streaming={isStreaming}
    />
  );
}

// ─── AgentStateIndicator ──────────────────────────────────────────────
// Small visual badge showing the agent's current cognitive state. Fits
// on the collapsed rail (6-8px dot) or inline in a header (chip with
// label). Four states reflect the observable lifecycle; `idle` is the
// default.

export type AgentState = 'idle' | 'listening' | 'thinking' | 'streaming' | 'done' | 'waiting';

export interface AgentStateIndicatorProps {
  state: AgentState;
  agent: AgentProfile;
  // `compact` → 8px dot only (for collapsed rail). Otherwise chip with
  // label and pulsing halo when active.
  compact?: boolean;
}

export function AgentStateIndicator({ state, agent, compact = false }: AgentStateIndicatorProps) {
  const css = useMemo(() => indicatorCss(agent.accent, agent.accentSoft), [agent.accent, agent.accentSoft]);
  const label = stateLabel(state);
  const active = state === 'listening' || state === 'thinking' || state === 'streaming';

  if (compact) {
    return (
      <>
        <style>{css}</style>
        <span
          className={`asi-dot ${active ? 'active' : ''} ${state}`}
          role="status"
          aria-label={`${agent.name} ${label}`}
          title={`${agent.name} · ${label}`}
        />
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <span className={`asi-chip ${active ? 'active' : ''} ${state}`} role="status" aria-live="polite">
        <span className={`asi-dot ${active ? 'active' : ''}`} aria-hidden="true" />
        <span className="asi-label">{label}</span>
      </span>
    </>
  );
}

function stateLabel(state: AgentState): string {
  switch (state) {
    case 'listening': return 'Listening';
    case 'thinking':  return 'Thinking';
    case 'streaming': return 'Responding';
    case 'done':      return 'Done';
    case 'waiting':   return 'Waiting on you';
    default:          return 'Ready';
  }
}

function indicatorCss(accent: string, accentSoft: string): string {
  return `
    .asi-dot {
      display: inline-block;
      width: 8px; height: 8px; border-radius: 50%;
      background: ${accent};
      box-shadow: 0 0 0 2px ${accentSoft};
      vertical-align: middle;
    }
    .asi-dot.active {
      animation: asi-halo 1.4s ease-in-out infinite;
    }
    .asi-dot.done { background: #2EA472; box-shadow: 0 0 0 2px rgba(46,164,114,0.18); }
    .asi-dot.waiting { background: #C07514; box-shadow: 0 0 0 2px rgba(192,117,20,0.18); }
    @keyframes asi-halo {
      0%, 100% { box-shadow: 0 0 0 2px ${accentSoft}; opacity: 1; }
      50%      { box-shadow: 0 0 0 8px transparent; opacity: 0.7; }
    }
    .asi-chip {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 4px 9px; border-radius: 999px;
      background: ${accentSoft};
      color: ${accent};
      font-weight: 700;
    }
    .asi-chip.done { background: rgba(46,164,114,0.14); color: #2EA472; }
    .asi-chip.waiting { background: rgba(192,117,20,0.14); color: #C07514; }
    .asi-label { line-height: 1; }
    @media (prefers-reduced-motion: reduce) {
      .asi-dot.active { animation: none; }
    }
  `;
}
