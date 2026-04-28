'use client';

// AskAnythingBar · viewport-fixed bottom toolbar, present on every agent
// surface. Claude-pattern: always visible, Enter to send, Shift+Enter for
// newline, paperclip attach, live streaming response card above input.
//
// Streams via useAgentStream (same hook powering AgentColumn / AgentRail).
// For the full conversation history, open the AgentRail on the right edge.

import { useRef, useState, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';

// ── Agent profiles ─────────────────────────────────────────────────────────

const AGENT_CFG = {
  nexus:    { name: 'Nexus',    glyph: '✱', accent: '#0E9F8C' },
  sentinel: { name: 'Sentinel', glyph: '◈', accent: '#9B6DFF' },
  atlas:    { name: 'Atlas',    glyph: '▲', accent: '#F59E0B' },
  steward:  { name: 'Steward',  glyph: '◆', accent: '#3B82F6' },
} as const;

export type AskAnythingAgent = keyof typeof AGENT_CFG;

// ── Types ──────────────────────────────────────────────────────────────────

interface BarFile {
  id: string;
  name: string;
  sizeBytes: number;
}

export interface AskAnythingBarProps {
  agent: AskAnythingAgent;
  /** Scope label in the eyebrow, e.g. "APX-CDP-2026 · P3 Design" */
  scopeLabel: string;
  placeholder?: string;
  /** Surface identifier forwarded to useAgentStream */
  surface?: string;
  programId?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_TA_HEIGHT = 180;
const FONT = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
const RAIL_W = 76; // AppRail width — bar sits to the right of it

// ── Component ──────────────────────────────────────────────────────────────

export function AskAnythingBar({
  agent,
  scopeLabel,
  placeholder,
  surface,
  programId,
}: AskAnythingBarProps) {
  const cfg = AGENT_CFG[agent];
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<BarFile[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefer shared AtlasPageState (Shell Layout Spec v2 §6) — falls back to
  // local useAgentStream for components not yet wrapped in AppShell.
  const pageState = useAtlasPageState();

  const localStream = useAgentStream({
    surface: surface ?? agent,
    programId,
    agentName: cfg.name,
  });

  const ask         = pageState?.ask           ?? localStream.ask;
  const response    = pageState?.currentResponse ?? localStream.response;
  const isStreaming  = pageState?.isStreaming     ?? localStream.isStreaming;
  const error       = pageState?.error            ?? localStream.error;
  const clearLocal  = pageState?.clearResponse    ?? localStream.clear;

  const hasResponse = !!(response || error);

  // ── Auto-grow textarea ──────────────────────────────────────────────────

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TA_HEIGHT)}px`;
  }

  function onChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    autoGrow(e.target);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text || isStreaming) return;
    setValue('');
    setPanelOpen(true);
    clearLocal(); // clear previous response
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    ask(text);
  }, [value, isStreaming, ask, clearLocal]);

  // ── File attach ─────────────────────────────────────────────────────────

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setFiles(prev => [
      ...prev,
      ...picked.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, sizeBytes: f.size })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  function dismissPanel() {
    clearLocal();
    setPanelOpen(false);
  }

  const canSend = value.trim().length > 0 && !isStreaming;
  const showPanel = panelOpen && (hasResponse || isStreaming);

  return (
    <>
      <style>{STYLES}</style>
      <div
        data-component="AskAnythingBar"
        data-agent={agent}
        style={{
          position: 'fixed',
          bottom: 0,
          left: RAIL_W,
          right: 0,
          zIndex: 50,
          fontFamily: FONT,
        }}
      >
        {/* ── Response panel ─────────────────────────────────────────────── */}
        {showPanel && (
          <div style={{ padding: '0 28px' }}>
            <div style={{
              maxWidth: 860,
              background: '#FFFFFF',
              border: '1px solid #e6dfce',
              borderBottom: 'none',
              borderRadius: '12px 12px 0 0',
              padding: '12px 16px 10px',
              boxShadow: '0 -6px 24px rgba(12,26,58,0.09)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Agent avatar */}
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: cfg.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontFamily: 'Georgia, serif',
                }}>
                  {cfg.glyph}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Agent label + streaming indicator */}
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: cfg.accent, marginBottom: 5,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {cfg.name}
                    {isStreaming && (
                      <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 999,
                        background: cfg.accent, color: '#fff',
                        letterSpacing: '0.1em', fontWeight: 700,
                      }}>
                        responding
                      </span>
                    )}
                  </div>
                  {/* Response text */}
                  <div style={{
                    fontSize: 13.5, lineHeight: 1.65, color: '#0c1a3a',
                    maxHeight: 220, overflowY: 'auto',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {error
                      ? <span style={{ color: '#c0392b' }}>Error: {error}</span>
                      : response || <span style={{ opacity: 0.4 }}>…</span>
                    }
                    {isStreaming && (
                      <span className="aab-cursor">▋</span>
                    )}
                  </div>
                </div>
                {/* Dismiss */}
                <button
                  type="button"
                  onClick={dismissPanel}
                  aria-label="Dismiss response"
                  className="aab-dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main bar ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(250,247,241,0.95)',
          backdropFilter: 'saturate(160%) blur(12px)',
          WebkitBackdropFilter: 'saturate(160%) blur(12px)',
          borderTop: '1px solid #e6dfce',
          padding: '10px 28px 14px',
        }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: cfg.accent, color: '#fff', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontFamily: 'Georgia, serif',
            }}>
              {cfg.glyph}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0c1a3a',
            }}>
              Ask {cfg.name}
            </span>
            <span style={{ fontSize: 10, color: '#8b95a8', letterSpacing: '0.04em' }}>
              · {scopeLabel}
            </span>
          </div>

          {/* Attachment chips */}
          {files.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 7 }}>
              {files.map(f => (
                <span key={f.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: '#fff', border: '1px solid #e6dfce', borderRadius: 6,
                  padding: '3px 8px', fontSize: 11.5, color: '#2a3a5e',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                  {f.name}
                  <button type="button" onClick={() => removeFile(f.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#8b95a8', fontSize: 13, padding: 0, lineHeight: 1,
                  }}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            maxWidth: 860,
            display: 'flex', alignItems: 'flex-end', gap: 8,
            padding: '9px 12px',
            background: '#FFFFFF',
            border: '1.5px solid #e6dfce',
            borderRadius: showPanel ? '0 0 12px 12px' : 12,
            boxShadow: '0 2px 14px rgba(12,26,58,0.07)',
            transition: 'border-color 0.15s',
          }}>
            {/* Paperclip */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
              className="aab-attach"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              spellCheck
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder={placeholder ?? `Ask ${cfg.name} anything…`}
              aria-label={`Ask ${cfg.name}`}
              style={{
                flex: 1, minHeight: 24, maxHeight: MAX_TA_HEIGHT,
                border: 0, outline: 'none', resize: 'none',
                background: 'transparent', color: '#0c1a3a',
                fontFamily: FONT, fontSize: 14, lineHeight: 1.5, padding: 0,
              }}
            />

            {/* Hint */}
            {!value && (
              <span style={{
                fontSize: 9.5, color: '#b0a898', letterSpacing: '0.04em',
                flexShrink: 0, paddingBottom: 2, whiteSpace: 'nowrap',
              }}>
                ⏎ send · ⇧⏎ newline
              </span>
            )}

            {/* Send */}
            <button
              type="button"
              disabled={!canSend}
              onClick={submit}
              aria-label="Send"
              className={`aab-send ${canSend ? 'active' : ''}`}
            >
              {isStreaming
                ? <span className="aab-spinner" />
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const STYLES = `
  .aab-cursor {
    display: inline-block; margin-left: 2px;
    animation: aab-blink 1s steps(2) infinite;
  }
  @keyframes aab-blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }

  .aab-spinner {
    display: inline-block; width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid currentColor; border-top-color: transparent;
    animation: aab-spin 0.65s linear infinite;
  }
  @keyframes aab-spin { to { transform: rotate(360deg) } }

  .aab-dismiss {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
    border: 1px solid #e0ddd8; background: transparent;
    cursor: pointer; font-size: 15px; line-height: 1;
    color: #8b95a8; display: flex; align-items: center;
    justify-content: center; transition: background 0.12s;
  }
  .aab-dismiss:hover { background: #f4f0e7; color: #0c1a3a; }

  .aab-attach {
    flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px;
    border: 1px solid #e6dfce; background: #f4f0e7;
    cursor: pointer; color: #5b6c8a;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s, color 0.12s;
  }
  .aab-attach:hover { background: #ede7d5; color: #0c1a3a; }

  .aab-send {
    flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px;
    border: 0; cursor: default;
    background: #e6dfce; color: #b0a898;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, color 0.15s;
  }
  .aab-send.active {
    background: #0c1a3a; color: #f8f7f4; cursor: pointer;
  }
  .aab-send.active:hover { background: #1a2d50; }

  @media (prefers-reduced-motion: reduce) {
    .aab-cursor { animation: none; opacity: 1; }
    .aab-spinner { animation: none; }
  }
`;

export default AskAnythingBar;
