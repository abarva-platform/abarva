'use client';

// AskAnythingBar · viewport-fixed bottom toolbar, present on every agent
// surface. Claude-pattern: always visible, Enter to send, Shift+Enter for
// newline, paperclip attach, live streaming response card above input.
//
// Streams via useAgentStream (same hook powering AgentColumn / AgentRail).
// For the full conversation history, open the AgentRail on the right edge.
//
// Two paperclip modes:
//   DB path (showPaperClip): Programs surfaces with a resolved programId.
//     Files are uploaded to program_attachments; the agent sees persisted
//     chip refs via surfaceContext.attachments.
//   Inline path (showInlinePaperClip): every other agent surface.
//     Text is extracted client-side via FileReader; content is sent in
//     the request body as inlineFiles[]. No DB required.

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import { ATTACHMENT_MIME_ALLOWLIST } from '@/lib/programs/attachments/mime';
import { usePendingAttachments } from '@/components/programs/attachments/usePendingAttachments';
import { PendingAttachmentChip } from '@/components/programs/attachments/AttachmentChip';
import { toAttachmentChipRef } from '@/lib/programs/attachments/types';
import type { InlineFile } from '@/lib/shell/atlas-page-state';

// Mime types we can extract text from client-side with FileReader.readAsText().
const TEXT_EXTRACTABLE: ReadonlySet<string> = new Set([
  'text/plain', 'text/markdown', 'text/csv',
]);

// ── Agent profiles ─────────────────────────────────────────────────────────

const AGENT_CFG = {
  nexus:    { name: 'Nexus',    glyph: '✱', accent: '#0E9F8C' },
  sentinel: { name: 'Sentinel', glyph: '◈', accent: '#9B6DFF' },
  atlas:    { name: 'Atlas',    glyph: '▲', accent: '#F59E0B' },
  steward:  { name: 'Steward',  glyph: '◆', accent: '#3B82F6' },
} as const;

export type AskAnythingAgent = keyof typeof AGENT_CFG;

// ── Types ──────────────────────────────────────────────────────────────────

export interface AskAnythingBarProps {
  agent: AskAnythingAgent;
  /** Scope label in the eyebrow, e.g. "APX-CDP-2026 · P3 Design" */
  scopeLabel: string;
  placeholder?: string;
  /** Surface identifier forwarded to useAgentStream */
  surface?: string;
  programId?: string;
}

/**
 * Programs-surface gating · the paper-clip only renders when the
 * composer is bound to a Programs surface AND a programId has been
 * resolved. Other surfaces (Tower, Sentinel, Setup, etc.) don't yet
 * have a per-program context so the upload would have no anchor.
 */
function isProgramsSurfaceWithId(surface: string | undefined, programId: string | undefined): programId is string {
  if (!programId) return false;
  if (!surface) return false;
  return (
    surface === 'programs-detail' ||
    surface === '/programs/new' ||
    surface === '/demo/programs/new' ||
    surface.startsWith('/programs/')
  );
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [inlineFiles, setInlineFiles] = useState<InlineFile[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

  // Prefer shared AtlasPageState (Shell Layout Spec v2 §6) — falls back to
  // local useAgentStream for components not yet wrapped in AppShell.
  const pageState = useAtlasPageState();

  // OV2-4b · DB paper-clip gated to Programs surfaces with a resolved programId.
  // Inline paper-clip shown on every other surface (Wave 1 — no DB required).
  const showPaperClip = isProgramsSurfaceWithId(surface, programId);
  const showInlinePaperClip = !showPaperClip;
  const pending = usePendingAttachments({ programId: showPaperClip ? programId : null });

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
      void submit();
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function submit() {
    const text = value.trim();
    if (!text || isStreaming) return;

    // OV2-4b · upload any pending attachments BEFORE sending the chat
    // turn so Steward / Nexus references the persisted records in
    // surfaceContext.attachments. If uploads fail we surface the
    // failed chips inline and don't send the message — the user
    // either retries or removes the failed entry, then resends.
    let attachmentRefs: ReturnType<typeof toAttachmentChipRef>[] = [];
    if (showPaperClip && pending.count > 0) {
      const records = await pending.uploadAll();
      // If any pending entry stayed in error state, abort the send.
      const stillErrored = pending.items.some((it) => it.status === 'error');
      if (stillErrored) return;
      attachmentRefs = records.map(toAttachmentChipRef);
    }

    setValue('');
    setPanelOpen(true);
    clearLocal(); // clear previous response
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (pageState) {
      pageState.ask(
        text,
        attachmentRefs.length > 0 ? attachmentRefs : undefined,
        inlineFiles.length > 0 ? inlineFiles : undefined,
      );
    } else {
      ask(text);
    }
    if (showPaperClip) pending.clearUploaded();
    if (showInlinePaperClip) setInlineFiles([]);
  }

  // ── File attach ─────────────────────────────────────────────────────────

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!showPaperClip) return;
    pending.addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    if (!showPaperClip) return;
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer?.files;
    if (dropped && dropped.length > 0) pending.addFiles(dropped);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    if (!showPaperClip) return;
    // Only react when the user is dragging files from the OS — ignore
    // text / element drags.
    if (!e.dataTransfer?.types?.includes('Files')) return;
    e.preventDefault();
    setIsDragOver(true);
  }

  function onDragLeave() {
    if (!showPaperClip) return;
    setIsDragOver(false);
  }

  // Wave 1 inline attach — client-side FileReader text extraction.
  const readFileAsText = useCallback((file: File): Promise<string | null> => {
    if (!TEXT_EXTRACTABLE.has(file.type)) return Promise.resolve(null);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  }, []);

  async function onInlineFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!showInlinePaperClip || !e.target.files) return;
    const files = Array.from(e.target.files);
    const resolved: InlineFile[] = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        content: await readFileAsText(f),
        sizeBytes: f.size,
        mimeType: f.type || 'application/octet-stream',
      })),
    );
    setInlineFiles((prev) => [...prev, ...resolved]);
    if (inlineFileInputRef.current) inlineFileInputRef.current.value = '';
  }

  function dismissPanel() {
    clearLocal();
    setPanelOpen(false);
  }

  const canSend = value.trim().length > 0 && !isStreaming && !pending.isUploading;
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

          {/* DB attachment chips (Programs surfaces with programId) */}
          {showPaperClip && pending.count > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 7 }}>
              {pending.items.map((it) => (
                <PendingAttachmentChip
                  key={it.localId}
                  filename={it.file.name}
                  sizeBytes={it.file.size}
                  status={
                    it.status === 'done'
                      ? 'pending'
                      : it.status === 'idle'
                        ? 'pending'
                        : it.status
                  }
                  loadedBytes={it.loadedBytes}
                  errorMessage={it.error?.message}
                  onRemove={() => pending.removeAttachment(it.localId)}
                  onRetry={
                    it.status === 'error' ? () => void pending.retry(it.localId) : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* Inline file chips (all other surfaces — Wave 1) */}
          {showInlinePaperClip && inlineFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 7 }}>
              {inlineFiles.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px 3px 7px', borderRadius: 6,
                    background: '#f0eee8', border: '1px solid #e2ddd4',
                    fontSize: 11.5, color: '#3d4a5f', maxWidth: 220,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {f.name}
                  </span>
                  {f.content === null && (
                    <span style={{ fontSize: 9.5, color: '#b06030', whiteSpace: 'nowrap' }}>metadata only</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setInlineFiles((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove ${f.name}`}
                    style={{
                      marginLeft: 2, background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0, color: '#8b95a8',
                      display: 'flex', alignItems: 'center', flexShrink: 0,
                      fontSize: 13, lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          <div
            data-attachment-dragover={isDragOver ? 'true' : 'false'}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            style={{
              maxWidth: 860,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              padding: '9px 12px',
              background: '#FFFFFF',
              border: `1.5px solid ${isDragOver ? '#3B82F6' : '#e6dfce'}`,
              borderRadius: showPanel ? '0 0 12px 12px' : 12,
              boxShadow: isDragOver
                ? '0 0 0 4px rgba(59,130,246,0.15)'
                : '0 2px 14px rgba(12,26,58,0.07)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              position: 'relative',
            }}
          >
            {/* Drop overlay */}
            {showPaperClip && isDragOver && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  background: 'rgba(59,130,246,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#1E40AF',
                  pointerEvents: 'none',
                }}
              >
                Drop to attach
              </div>
            )}
            {/* Paperclip — DB path, Programs surfaces with programId */}
            {showPaperClip && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ATTACHMENT_MIME_ALLOWLIST.join(',')}
                  multiple
                  style={{ display: 'none' }}
                  onChange={onFileChange}
                  data-component="AskAnythingBarAttachmentInput"
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
              </>
            )}

            {/* Paperclip — inline path, all other surfaces (Wave 1) */}
            {showInlinePaperClip && (
              <>
                <input
                  ref={inlineFileInputRef}
                  type="file"
                  accept={ATTACHMENT_MIME_ALLOWLIST.join(',')}
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => void onInlineFileChange(e)}
                  data-component="AskAnythingBarInlineAttachmentInput"
                />
                <button
                  type="button"
                  onClick={() => inlineFileInputRef.current?.click()}
                  aria-label="Attach file"
                  className="aab-attach"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
              </>
            )}

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
              onClick={() => void submit()}
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
