'use client';

// AgentDock · shared chat-dock foundation for every agent surface.
//
// Five toggleable modes per surface, persisted in localStorage:
//   side-rail   — resizable column (default)
//   pin-bottom  — full-width strip at viewport bottom (~120 → 480px)
//   pin-top     — mirror of pin-bottom anchored below the AppTopBar
//   expand      — modal overlay 80% viewport, workspace dimmed behind
//   collapsed   — floating 56×56 chip bottom-right with agent initials
//
// Composer behavior is identical across modes: auto-grow textarea up to
// ~6 rows / 160px, Enter submits, Shift+Enter inserts newline, paperclip
// uploads to /api/v1/agent/attachments, drag-drop covers the whole panel.
//
// IMPORTANT: this is the FOUNDATION component. The 7 sibling migration
// chips (Source new/canvas, Moves home/detail, Intelligence brief, Tower,
// Admin) will swap their existing chat panels for AgentDock in their own
// PRs. Don't touch those surfaces here.
//
// Design:
//   - Inline style objects (matches EventChatLane / portfolio idiom)
//   - No external icon library — chevrons are inline SVG
//   - Tokens borrowed from canvas-tokens (CHAT_BG, INK, RULE, etc.)
//
// Spec source: this PR · feat(agent): shared AgentDock with 5 modes.

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { CANVAS } from '@/components/source/canvas/canvas-tokens';
import { ResizableSplitter } from '@/components/source/canvas/ResizableSplitter';

// useLayoutEffect warns if executed during SSR. The dock only computes
// real values in the browser, so fall back to the no-op effect on the
// server. This keeps the API call-site simple and SSR-safe.
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Auto-measure the dock's distance from the top of the viewport.
 *
 * The PR #1773 fix hardcoded `--agent-dock-top-offset` to 64px
 * (AppTopBar height). That works for surfaces with no other sticky
 * chrome, but breaks anywhere a secondary nav, progress rail, banner,
 * or sourcing-journey strip sits above the dock — height is
 * over-computed and the composer drops below the fold.
 *
 * Solution: the dock measures its own viewport-top on mount, on
 * resize, on scroll (when sticky), and on layout shifts via a
 * MutationObserver. The measured value is written to a CSS custom
 * property `--agent-dock-self-top` on the shell element itself, and
 * the calc() expressions use it as the primary source — falling back
 * to the legacy `--agent-dock-top-offset` (or 64px) only if
 * measurement hasn't run yet (SSR) or returns a clearly broken value.
 */
function useDockSelfTop(ref: RefObject<HTMLDivElement | null>) {
  useIsoLayoutEffect(() => {
    if (!ref.current) return;

    let scheduled = false;
    let lastValue = -1;

    const measure = () => {
      scheduled = false;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      // For sticky elements that are pinned, getBoundingClientRect().top
      // equals the resolved sticky `top` value once the page has scrolled.
      // For elements above their sticky point, top is the natural offset.
      // Either way, this is the y-coord we want as `top` AND as the
      // height subtractor. Negative values (offscreen above viewport) or
      // non-finite values fall back to the var default, so guard them.
      const value = Math.max(0, Math.round(rect.top));
      if (!Number.isFinite(value) || value === lastValue) return;
      lastValue = value;
      node.style.setProperty('--agent-dock-self-top', `${value}px`);
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      // requestAnimationFrame coalesces resize + scroll + mutation
      // bursts into a single measurement per frame.
      window.requestAnimationFrame(measure);
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(schedule, 100);
    };

    let mutationTimer: ReturnType<typeof setTimeout> | null = null;
    const onMutation = () => {
      if (mutationTimer) clearTimeout(mutationTimer);
      mutationTimer = setTimeout(schedule, 100);
    };

    measure();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', schedule, { passive: true });

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(onMutation);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden'],
      });
    }

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', schedule);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (mutationTimer) clearTimeout(mutationTimer);
      if (observer) observer.disconnect();
    };
  }, [ref]);
}

// ── Types ─────────────────────────────────────────────────────────────────

export type DockMode =
  | 'side-rail'
  | 'pin-bottom'
  | 'pin-top'
  | 'expand'
  | 'collapsed';

export const DOCK_MODES: readonly DockMode[] = [
  'side-rail',
  'pin-bottom',
  'pin-top',
  'expand',
  'collapsed',
] as const;

export interface AgentProfile {
  /** 1–2 character glyph or initials shown in the avatar. */
  initials: string;
  /** Full name shown in the header. */
  name: string;
  /** Eyebrow under the name. Action verbs the user can ask for. */
  role: string;
}

export interface ChatMessage {
  id: string;
  role: 'agent' | 'user';
  body: string;
  /** Optional createdAt for byline rendering. */
  at?: string;
}

export interface AttachmentRef {
  id: string;
  file_name: string;
  mime: string;
  bytes: number;
  storage_path: string;
  /** First ~4000 chars of extracted text. Empty string for images / parse failures. */
  extracted_text_preview?: string;
}

export interface SuggestedAction {
  id: string;
  label: string;
  /** Body that pre-fills the composer when clicked. */
  body: string;
  /** Optional override — when provided, click does NOT pre-fill. */
  onClick?: () => void;
}

export interface AgentDockProps {
  agent: AgentProfile;
  /** Used as the localStorage namespace + telemetry key. */
  surface: string;
  defaultMode?: DockMode;
  /** Free-form context passed back to the API on submit. */
  surfaceContext?: Record<string, unknown>;
  /** Optional "in reply to …" quote rendered above the composer. */
  initialQuote?: string;
  /** Three-or-fewer suggested actions surfaced above the composer. */
  suggestedActions?: SuggestedAction[];
  thread: ChatMessage[];
  /** Caller handles network. We pass plain text + attachment refs. */
  onMessage: (text: string, attachments: AttachmentRef[]) => void | Promise<void>;
  /** For side-rail mode this becomes the right pane; other modes flow normally. */
  workspace: ReactNode;
  /** Side-rail splitter overrides. */
  minLeftPx?: number;
  defaultLeftPercent?: number;
}

// ── Storage helpers ───────────────────────────────────────────────────────

export function modeStorageKey(surface: string): string {
  return `abarva.agent-dock.${surface}.mode`;
}

export function splitStorageKey(surface: string): string {
  return `abarva.agent-dock.${surface}.split`;
}

function readStoredMode(surface: string): DockMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(modeStorageKey(surface));
    if (raw && (DOCK_MODES as readonly string[]).includes(raw)) {
      return raw as DockMode;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredMode(surface: string, mode: DockMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(modeStorageKey(surface), mode);
  } catch {
    /* ignore */
  }
}

// ── Mime allowlist (matches API + spec) ───────────────────────────────────

export const AGENT_DOCK_MIME_ALLOWLIST: readonly string[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
];

// ── Local upload state ────────────────────────────────────────────────────

interface PendingUpload {
  /** Stable client-side id while the upload is in flight. */
  localId: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
  errorMessage?: string;
  /** Server-assigned record (only when status === 'done'). */
  ref?: AttachmentRef;
}

// ── Component ─────────────────────────────────────────────────────────────

export function AgentDock(props: AgentDockProps) {
  const {
    agent,
    surface,
    defaultMode = 'side-rail',
    surfaceContext,
    initialQuote,
    suggestedActions = [],
    thread,
    onMessage,
    workspace,
    minLeftPx = 320,
    defaultLeftPercent = 38,
  } = props;

  // Mode state (persisted)
  const [mode, setModeState] = useState<DockMode>(() => {
    return readStoredMode(surface) ?? defaultMode;
  });
  // Last non-collapsed mode — used when restoring from the floating chip.
  const [lastRichMode, setLastRichMode] = useState<DockMode>(
    mode === 'collapsed' ? defaultMode : mode,
  );

  const setMode = useCallback(
    (next: DockMode) => {
      setModeState(next);
      writeStoredMode(surface, next);
      if (next !== 'collapsed') setLastRichMode(next);
    },
    [surface],
  );

  // Esc closes (collapses)
  useEffect(() => {
    if (mode !== 'expand') return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setMode(lastRichMode === 'expand' ? 'side-rail' : lastRichMode);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, lastRichMode, setMode]);

  // Composer state
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // Outer-shell ref for self-measurement of the dock's top y-offset. A
  // single ref is shared across side-rail / pin-top / pin-bottom modes
  // since only one of those renders at a time. The hook updates the
  // `--agent-dock-self-top` custom property on whatever element is
  // currently mounted at this ref.
  const shellRef = useRef<HTMLDivElement | null>(null);
  useDockSelfTop(shellRef);

  // Uploads
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [draggingOver, setDraggingOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const anyUploading = uploads.some((u) => u.status === 'uploading');
  const sendDisabled =
    submitting || anyUploading || (draft.trim().length === 0 && uploads.length === 0);

  // Auto-grow textarea (cap ~6 rows / 160px)
  const onChangeDraft = useCallback((value: string) => {
    setDraft(value);
    const ta = inputRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, []);

  // Scroll to bottom on new turns (or attempted send). Guarded because
  // jsdom doesn't implement scrollIntoView.
  useEffect(() => {
    const node = threadEndRef.current;
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [thread.length]);

  // Submit
  const submit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = draft.trim();
      const refs = uploads
        .filter((u): u is PendingUpload & { ref: AttachmentRef } => u.status === 'done' && !!u.ref)
        .map((u) => u.ref);
      if (trimmed.length === 0 && refs.length === 0) return;
      try {
        setSubmitting(true);
        await onMessage(trimmed, refs);
        setDraft('');
        setUploads([]);
        const ta = inputRef.current;
        if (ta) ta.style.height = 'auto';
      } finally {
        setSubmitting(false);
      }
    },
    [draft, uploads, onMessage],
  );

  // ── Upload handling ─────────────────────────────────────────────────────

  const startUploads = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const allowed = list.filter((f) => AGENT_DOCK_MIME_ALLOWLIST.includes(f.type));
      const nextPending: PendingUpload[] = allowed.map((file) => ({
        localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        status: 'uploading',
      }));
      if (nextPending.length === 0) return;
      setUploads((prev) => [...prev, ...nextPending]);

      // Fire each upload independently so a single slow file doesn't block.
      for (const pending of nextPending) {
        const fd = new FormData();
        fd.append('file', pending.file);
        fd.append('surface', surface);
        fd.append('agent', agent.name.toLowerCase());
        if (surfaceContext) {
          fd.append('surfaceContext', JSON.stringify(surfaceContext));
        }
        void fetch('/api/v1/agent/attachments', {
          method: 'POST',
          body: fd,
        })
          .then(async (res) => {
            if (!res.ok) {
              const errBody = (await res.json().catch(() => ({}))) as { error?: string };
              throw new Error(errBody.error ?? `upload_failed_${res.status}`);
            }
            return (await res.json()) as AttachmentRef;
          })
          .then((ref) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.localId === pending.localId ? { ...u, status: 'done', ref } : u,
              ),
            );
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'upload_failed';
            setUploads((prev) =>
              prev.map((u) =>
                u.localId === pending.localId
                  ? { ...u, status: 'error', errorMessage: message }
                  : u,
              ),
            );
          });
      }
    },
    [agent.name, surface, surfaceContext],
  );

  const removeUpload = useCallback((localId: string) => {
    setUploads((prev) => prev.filter((u) => u.localId !== localId));
  }, []);

  // Drag-drop handlers (cover the entire dock panel)
  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingOver(true);
  }, []);
  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) setDraggingOver(false);
  }, []);
  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDraggingOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        startUploads(e.dataTransfer.files);
      }
    },
    [startUploads],
  );

  // ── Dock chrome (header / mode picker / chip) ──────────────────────────

  const dockId = useId();

  const onComposerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  // Render the chat panel inner — used by every mode (side-rail, pin-*,
  // expand). The collapsed mode renders the floating chip instead.
  const chatPanel = useMemo(() => {
    return (
      <div
        ref={dropZoneRef}
        data-testid="agent-dock-panel"
        data-mode={mode}
        data-dragging={draggingOver ? 'true' : 'false'}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          ...PANEL_STYLE,
          outline: draggingOver
            ? `2px dashed ${CANVAS.SPLITTER_ACTIVE}`
            : 'none',
          outlineOffset: -2,
          background: draggingOver ? 'rgba(12,26,58,0.04)' : CANVAS.CHAT_BG,
        }}
      >
        {/* Spinner keyframes are scoped to this dock instance. */}
        <style>{`
          @keyframes agent-dock-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .agent-dock-spinner {
            animation: agent-dock-spin 800ms linear infinite;
          }
        `}</style>
        {/* Header */}
        <div style={HEADER_STYLE}>
          <div style={AGENT_ROW_STYLE}>
            <span style={AVATAR_STYLE}>{agent.initials}</span>
            <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
              <span style={AGENT_NAME_STYLE}>{agent.name}</span>
              <span style={AGENT_ROLE_STYLE}>{agent.role}</span>
            </div>
          </div>
          <ModePicker
            mode={mode}
            onChange={setMode}
            dockId={dockId}
          />
        </div>

        {/* Optional quote */}
        {initialQuote ? (
          <div style={QUOTE_STYLE} aria-label="Quoted context">
            <span style={QUOTE_LABEL_STYLE}>In reply to</span>
            <span style={QUOTE_BODY_STYLE}>{initialQuote}</span>
          </div>
        ) : null}

        {/* Thread */}
        <div style={THREAD_STYLE} data-testid="agent-dock-thread">
          {thread.length === 0 ? (
            <div style={EMPTY_STATE_STYLE}>
              <p style={EMPTY_TITLE_STYLE}>Ask {agent.name} anything.</p>
              <p style={EMPTY_SUBTITLE_STYLE}>
                {agent.role}
              </p>
            </div>
          ) : (
            thread.map((turn) => (
              <div
                key={turn.id}
                data-testid={`agent-dock-turn-${turn.role}`}
                style={turn.role === 'user' ? USER_TURN_STYLE : AGENT_TURN_STYLE}
              >
                {turn.role === 'agent' ? (
                  <div style={AGENT_BYLINE_STYLE}>{agent.name}</div>
                ) : null}
                <div style={BUBBLE_STYLE}>{turn.body}</div>
              </div>
            ))
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Suggested actions */}
        {suggestedActions.length > 0 ? (
          <div style={SUGGESTIONS_STYLE} aria-label="Suggested actions">
            <div style={SUGGESTIONS_LABEL_STYLE}>Try one</div>
            {suggestedActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (action.onClick) {
                    action.onClick();
                  } else {
                    onChangeDraft(action.body);
                    inputRef.current?.focus();
                  }
                }}
                disabled={submitting}
                data-testid={`agent-dock-suggestion-${action.id}`}
                style={SUGGESTION_BUTTON_STYLE}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Pending attachment chips */}
        {uploads.length > 0 ? (
          <div style={CHIPS_ROW_STYLE} data-testid="agent-dock-chips">
            {uploads.map((u) => (
              <UploadChip key={u.localId} upload={u} onRemove={() => removeUpload(u.localId)} />
            ))}
          </div>
        ) : null}

        {/* Composer */}
        <form
          onSubmit={submit}
          style={INPUT_FORM_STYLE}
          aria-label={`Ask ${agent.name}`}
          data-testid="agent-dock-form"
        >
          <button
            type="button"
            aria-label="Attach files"
            data-testid="agent-dock-attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            style={ATTACH_BUTTON_STYLE}
          >
            {/* Inline paperclip glyph */}
            <PaperclipIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={AGENT_DOCK_MIME_ALLOWLIST.join(',')}
            multiple
            data-testid="agent-dock-file-input"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) startUploads(e.target.files);
              // Reset so re-selecting the same file fires onChange again.
              e.target.value = '';
            }}
          />
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => onChangeDraft(e.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder={`Ask ${agent.name}…`}
            rows={1}
            spellCheck
            disabled={submitting}
            data-testid="agent-dock-input"
            style={INPUT_STYLE}
          />
          <button
            type="submit"
            disabled={sendDisabled}
            aria-label="Send message"
            data-testid="agent-dock-send"
            style={{
              ...SUBMIT_BUTTON_STYLE,
              opacity: sendDisabled ? 0.45 : 1,
              cursor: sendDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            ↑
          </button>
        </form>
      </div>
    );
  }, [
    agent,
    dockId,
    draft,
    draggingOver,
    initialQuote,
    mode,
    onChangeDraft,
    onComposerKeyDown,
    onDragLeave,
    onDragOver,
    onDrop,
    removeUpload,
    sendDisabled,
    setMode,
    startUploads,
    submit,
    submitting,
    suggestedActions,
    thread,
    uploads,
  ]);

  // ── Render by mode ──────────────────────────────────────────────────────

  if (mode === 'collapsed') {
    return (
      <>
        {workspace}
        <button
          type="button"
          aria-label={`Restore ${agent.name} chat`}
          data-testid="agent-dock-collapsed-chip"
          onClick={() => setMode(lastRichMode === 'collapsed' ? 'side-rail' : lastRichMode)}
          onDoubleClick={() => setMode(lastRichMode === 'collapsed' ? 'side-rail' : lastRichMode)}
          style={COLLAPSED_CHIP_STYLE}
        >
          <span style={COLLAPSED_CHIP_INITIALS_STYLE}>{agent.initials}</span>
        </button>
      </>
    );
  }

  if (mode === 'side-rail') {
    // The dock is always viewport-bounded — height is NEVER inherited from
    // the workspace pane. This guarantees the composer is always above the
    // fold even when the workspace renders a 3000px-tall scroll body.
    //
    // The shell self-measures its viewport-top y-offset on mount/resize/
    // scroll/layout-shift via useDockSelfTop, writing the value to
    // `--agent-dock-self-top`. The calc() expressions consume it. Surfaces
    // with custom chrome don't need to set anything; the dock figures out
    // its own offset.
    return (
      <div
        ref={shellRef}
        data-testid="agent-dock-side-rail-shell"
        style={SIDE_RAIL_SHELL_STYLE}
      >
        <ResizableSplitter
          left={chatPanel}
          right={<div style={WORKSPACE_PANE_STYLE}>{workspace}</div>}
          defaultLeftPercent={defaultLeftPercent}
          minLeftPx={minLeftPx}
          minRightPx={Math.max(420, minLeftPx)}
          storageKey={splitStorageKey(surface)}
        />
      </div>
    );
  }

  if (mode === 'pin-bottom' || mode === 'pin-top') {
    const pinTop = mode === 'pin-top';
    return (
      <div ref={shellRef} style={PIN_LAYOUT_STYLE} data-testid="agent-dock-pin-shell">
        {pinTop ? (
          <div style={PIN_PANEL_STYLE_TOP} data-testid="agent-dock-pin-top">
            {chatPanel}
          </div>
        ) : null}
        <div style={WORKSPACE_PANE_STYLE}>{workspace}</div>
        {!pinTop ? (
          <div style={PIN_PANEL_STYLE_BOTTOM} data-testid="agent-dock-pin-bottom">
            {chatPanel}
          </div>
        ) : null}
      </div>
    );
  }

  // expand
  return (
    <>
      <div style={WORKSPACE_PANE_STYLE}>{workspace}</div>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${agent.name} expanded chat`}
        data-testid="agent-dock-expand-overlay"
        style={EXPAND_OVERLAY_STYLE}
      >
        <div style={EXPAND_PANEL_STYLE}>{chatPanel}</div>
      </div>
    </>
  );
}

// ── Mode picker ───────────────────────────────────────────────────────────

interface ModePickerProps {
  mode: DockMode;
  onChange: (mode: DockMode) => void;
  dockId: string;
}

function ModePicker({ mode, onChange, dockId }: ModePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Dock mode"
      data-testid="agent-dock-mode-picker"
      style={MODE_PICKER_STYLE}
    >
      <ModeButton
        mode="side-rail"
        active={mode === 'side-rail'}
        onClick={() => onChange('side-rail')}
        aria-label="Dock as side rail"
        title="Side rail"
        dockId={dockId}
      >
        <SideRailIcon />
      </ModeButton>
      <ModeButton
        mode="pin-bottom"
        active={mode === 'pin-bottom'}
        onClick={() => onChange('pin-bottom')}
        aria-label="Pin to bottom"
        title="Pin to bottom"
        dockId={dockId}
      >
        <ArrowDownIcon />
      </ModeButton>
      <ModeButton
        mode="pin-top"
        active={mode === 'pin-top'}
        onClick={() => onChange('pin-top')}
        aria-label="Pin to top"
        title="Pin to top"
        dockId={dockId}
      >
        <ArrowUpIcon />
      </ModeButton>
      <ModeButton
        mode="expand"
        active={mode === 'expand'}
        onClick={() => onChange('expand')}
        aria-label="Expand to overlay"
        title="Expand"
        dockId={dockId}
      >
        <MaximizeIcon />
      </ModeButton>
      <ModeButton
        mode="collapsed"
        active={mode === 'collapsed'}
        onClick={() => onChange('collapsed')}
        aria-label="Collapse to chip"
        title="Collapse"
        dockId={dockId}
      >
        <CloseIcon />
      </ModeButton>
    </div>
  );
}

interface ModeButtonProps {
  mode: DockMode;
  active: boolean;
  onClick: () => void;
  ['aria-label']: string;
  title: string;
  children: ReactNode;
  dockId: string;
}

function ModeButton({
  mode,
  active,
  onClick,
  'aria-label': ariaLabel,
  title,
  children,
  dockId,
}: ModeButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      data-testid={`agent-dock-mode-${mode}`}
      data-active={active ? 'true' : 'false'}
      data-dock-id={dockId}
      style={{
        ...MODE_BUTTON_STYLE,
        background: active ? 'rgba(12,26,58,0.08)' : 'transparent',
        color: active ? CANVAS.INK : CANVAS.GRAY_DK,
      }}
    >
      {children}
    </button>
  );
}

// ── Upload chip ───────────────────────────────────────────────────────────

interface UploadChipProps {
  upload: PendingUpload;
  onRemove: () => void;
}

function UploadChip({ upload, onRemove }: UploadChipProps) {
  const sizeLabel = formatBytes(upload.file.size);
  const isError = upload.status === 'error';
  const isUploading = upload.status === 'uploading';
  return (
    <span
      data-testid={`agent-dock-chip-${upload.localId}`}
      data-status={upload.status}
      style={{
        ...CHIP_STYLE,
        borderColor: isError ? '#FCA5A5' : CANVAS.RULE,
        background: isError ? '#FEE2E2' : CANVAS.CARD,
        color: isError ? '#991B1B' : CANVAS.INK,
      }}
    >
      {isUploading ? (
        <span
          aria-hidden="true"
          style={CHIP_SPINNER_STYLE}
          data-testid={`agent-dock-chip-spinner-${upload.localId}`}
          className="agent-dock-spinner"
        />
      ) : null}
      <span style={CHIP_NAME_STYLE} title={upload.file.name}>
        {upload.file.name}
      </span>
      <span style={CHIP_SIZE_STYLE}>{sizeLabel}</span>
      {isError ? (
        <span style={CHIP_ERROR_STYLE} title={upload.errorMessage ?? 'Upload failed'}>
          failed
        </span>
      ) : null}
      <button
        type="button"
        aria-label={`Remove ${upload.file.name}`}
        onClick={onRemove}
        style={CHIP_REMOVE_STYLE}
        data-testid={`agent-dock-chip-remove-${upload.localId}`}
      >
        ×
      </button>
    </span>
  );
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Inline icons ──────────────────────────────────────────────────────────

function PaperclipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.93 8.83l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function SideRailIcon() {
  // PanelLeft-equivalent
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}
function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}
function MaximizeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

// Side-rail shell — viewport-bounded so the dock never grows with its
// workspace sibling. The shell sets an explicit, viewport-relative height
// regardless of how tall the workspace flex pane renders, so the composer
// can never end up below the fold.
//
//   height:    calc(100vh - top - bottom)   // safe default, every browser
//   maxHeight: calc(100dvh - top - bottom)  // mobile-aware upper bound
//
// `100dvh` accounts for mobile address-bar collapse — when the bar hides,
// dvh shrinks the cap so the composer remains in view. Older browsers
// without dvh ignore the maxHeight and fall back to the vh height.
//
// **Top offset resolution order**
//   1. `--agent-dock-self-top` — measured at runtime by useDockSelfTop.
//      Reflects every piece of chrome above the dock (AppTopBar, secondary
//      nav, progress rail, banners, sourcing-journey strip) without any
//      per-surface configuration.
//   2. `--agent-dock-top-offset` — legacy override; honoured when the
//      measurement hasn't run yet (SSR initial paint) or as an explicit
//      escape hatch.
//   3. `64px` — final fallback, AppTopBar-only baseline.
//
// `position: sticky; top: <self-top>` keeps the dock pinned in the
// visible viewport when the page scrolls. The same self-top value is
// subtracted from 100vh to keep height in lockstep, so the composer
// never falls below the fold.
const SIDE_RAIL_SHELL_STYLE: CSSProperties = {
  position: 'sticky',
  top: 'var(--agent-dock-self-top, var(--agent-dock-top-offset, 64px))',
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  height:
    'calc(100vh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 64px)) - var(--agent-dock-bottom-padding, 0px))',
  maxHeight:
    'calc(100dvh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 64px)) - var(--agent-dock-bottom-padding, 0px))',
  minHeight: 0,
  overflow: 'hidden',
};

const PANEL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  background: CANVAS.CHAT_BG,
  borderRight: `1px solid ${CANVAS.HAIRLINE}`,
  minHeight: 0,
  position: 'relative',
};

const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px 18px 12px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  flexShrink: 0,
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

const AGENT_ROLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.3,
};

const MODE_PICKER_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  padding: 2,
  borderRadius: 6,
  border: `1px solid ${CANVAS.HAIRLINE}`,
};

const MODE_BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 24,
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 120ms ease',
};

const QUOTE_STYLE: CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: '10px 18px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  background: 'rgba(12,26,58,0.025)',
  flexShrink: 0,
};

const QUOTE_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
  fontWeight: 600,
};

const QUOTE_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.5,
};

const THREAD_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  padding: '20px 18px',
  display: 'grid',
  gap: 14,
  alignContent: 'start',
  // Same chat-panel background as the panel + composer so the three regions
  // never appear striped. User flagged this explicitly as "must be same
  // color background".
  background: CANVAS.CHAT_BG,
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

const EMPTY_SUBTITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
  margin: 0,
  maxWidth: 520,
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
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxWidth: '100%',
};

const SUGGESTIONS_STYLE: CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: '12px 18px',
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  flexShrink: 0,
};

const SUGGESTIONS_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
  marginBottom: 2,
};

const SUGGESTION_BUTTON_STYLE: CSSProperties = {
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

const CHIPS_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  padding: '8px 18px',
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  flexShrink: 0,
};

const CHIP_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 8px',
  borderRadius: 6,
  border: `1px solid ${CANVAS.RULE}`,
  fontFamily: CANVAS.SANS,
  fontSize: 11.5,
  background: CANVAS.CARD,
  color: CANVAS.INK,
  maxWidth: '100%',
};

const CHIP_NAME_STYLE: CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 200,
};

const CHIP_SIZE_STYLE: CSSProperties = {
  color: CANVAS.GRAY_DK,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
};

const CHIP_ERROR_STYLE: CSSProperties = {
  color: '#991B1B',
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const CHIP_REMOVE_STYLE: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: CANVAS.GRAY_DK,
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
  marginLeft: 2,
};

const CHIP_SPINNER_STYLE: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  border: `2px solid ${CANVAS.RULE}`,
  borderTopColor: CANVAS.INK,
  display: 'inline-block',
  animation: 'agent-dock-spin 800ms linear infinite',
};

// Composer · `flex: 0 0 auto` keeps it pinned at the bottom of the panel's
// flex column without needing `position: sticky`. The parent shell already
// caps overall height, so the composer cannot fall below the fold.
//
// Background matches CHAT_BG so the composer doesn't visually stripe
// against the thread or panel.
const INPUT_FORM_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 8,
  padding: '12px 18px 16px',
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  background: CANVAS.CHAT_BG,
  flex: '0 0 auto',
};

const ATTACH_BUTTON_STYLE: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  background: 'transparent',
  color: CANVAS.GRAY_DK,
  border: `1px solid ${CANVAS.RULE}`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
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
  maxHeight: 160,
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
  flexShrink: 0,
};

const WORKSPACE_PANE_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

// Pin layout — same viewport-bound contract as the side-rail shell so
// pin-top / pin-bottom never let the composer drift below the fold. The
// workspace pane keeps internal scroll behavior; the dock bar stays
// visible above the fold. Same self-top measurement applies.
const PIN_LAYOUT_STYLE: CSSProperties = {
  position: 'sticky',
  top: 'var(--agent-dock-self-top, var(--agent-dock-top-offset, 64px))',
  display: 'flex',
  flexDirection: 'column',
  height:
    'calc(100vh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 64px)) - var(--agent-dock-bottom-padding, 0px))',
  maxHeight:
    'calc(100dvh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 64px)) - var(--agent-dock-bottom-padding, 0px))',
  width: '100%',
  minHeight: 0,
  overflow: 'hidden',
};

const PIN_PANEL_STYLE_BOTTOM: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  height: 480,
  maxHeight: '60vh',
  flexShrink: 0,
  background: CANVAS.CHAT_BG,
};

const PIN_PANEL_STYLE_TOP: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  height: 480,
  maxHeight: '60vh',
  flexShrink: 0,
  background: CANVAS.CHAT_BG,
};

const EXPAND_OVERLAY_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10,10,11,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '5vh 5vw',
};

const EXPAND_PANEL_STYLE: CSSProperties = {
  width: '90vw',
  height: '90vh',
  maxWidth: 1400,
  maxHeight: 1000,
  background: CANVAS.CHAT_BG,
  borderRadius: 8,
  boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const COLLAPSED_CHIP_STYLE: CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 999,
  background: CANVAS.INK,
  color: '#fff',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
  zIndex: 900,
  fontFamily: CANVAS.SERIF,
  fontSize: 18,
  fontWeight: 500,
};

const COLLAPSED_CHIP_INITIALS_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 18,
  fontWeight: 500,
  letterSpacing: '0.02em',
};
