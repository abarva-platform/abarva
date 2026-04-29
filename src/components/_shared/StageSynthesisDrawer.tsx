'use client';

/**
 * StageSynthesisDrawer — REASON-32 follow-up
 *
 * Right-anchored drawer that opens when a user CLICKS a stage node on the
 * `LifecycleMiniGraph` (vs. the rule-based hover tooltip). It POSTs to
 * `/api/reasoning/stage-synthesis` and streams the LLM response into view as
 * it arrives — a deeper, ~80-word per-stage explanation of gates, evidence,
 * and the instance context.
 *
 * Mirrors `ExplainQuoteDrawer`'s shell (same paper-light scrim, same close
 * affordances, same SHELL-token palette) so the two drawers feel like a
 * coherent family.
 *
 * ESC closes. Click on the scrim closes. Re-fetches each open — freshness
 * matters more than caching for this surface, and the BACKEND already caches
 * by `instanceId:stageId:stateHash`.
 */

import { useEffect, useState } from 'react';

import { SHELL } from '@/lib/shell/shell-tokens';

export interface StageSynthesisDrawerProps {
  /** When true, the drawer is mounted and visible. */
  open: boolean;
  /** Instance whose stage is being synthesized. */
  instanceId: string;
  /** Stage identifier (matches LifecyclePatternSeed.stages[i].id). */
  stageId: string;
  /** Display label for the header — usually the stage's `label`. */
  stageLabel: string;
  /** Close handler. */
  onClose: () => void;
}

export function StageSynthesisDrawer({
  open,
  instanceId,
  stageId,
  stageLabel,
  onClose,
}: StageSynthesisDrawerProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch + stream on open. We intentionally re-fetch every open: the backend
  // owns caching by `instanceId:stageId:stateHash`, so cache-hit replies are
  // effectively instant.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const controller = new AbortController();

    setText('');
    setError(null);
    setLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/reasoning/stage-synthesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId, stageId }),
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? `stage-synthesis ${res.status}`);
        }

        // Cache-hit short-circuit: body returned in one shot. Stream still
        // works the same way — the reader yields one big chunk.
        const reader = res.body?.getReader();
        if (!reader) {
          // Defensive — fall back to text() if no reader (test/SSR scenarios).
          const fallback = await res.text();
          if (!cancelled) setText(fallback);
          return;
        }

        const decoder = new TextDecoder();
        let accumulated = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          if (!cancelled) {
            setText(accumulated);
          }
        }
        // Flush any trailing bytes from the decoder.
        accumulated += decoder.decode();
        if (!cancelled) setText(accumulated);
      } catch (e: unknown) {
        if (cancelled) return;
        if ((e as { name?: string })?.name === 'AbortError') return;
        setError(
          e instanceof Error ? e.message : 'failed to load stage synthesis',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, instanceId, stageId]);

  // ESC closes the drawer.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="stage-synthesis-drawer-overlay"
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,12,18,0.18)',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <aside
        data-testid="stage-synthesis-drawer"
        role="complementary"
        aria-label={`Stage synthesis · ${stageLabel}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)',
          height: '100%',
          background: SHELL.PAPER,
          borderLeft: `1px solid ${SHELL.CARD_LINE}`,
          boxShadow: '-8px 0 32px rgba(10,12,18,0.08)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: SHELL.SANS,
          color: SHELL.INK,
          boxSizing: 'border-box',
        }}
      >
        <Header stageLabel={stageLabel} onClose={onClose} />

        <div
          style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Eyebrow instanceId={instanceId} stageId={stageId} />

          {error ? (
            <div
              data-testid="stage-synthesis-drawer-error"
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.RUST_TEXT,
                background: SHELL.RUST_BG,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 6,
                padding: '8px 10px',
              }}
            >
              {error}
            </div>
          ) : (
            <article
              data-testid="stage-synthesis-drawer-text"
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 14,
                lineHeight: 1.55,
                color: SHELL.INK,
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 6,
                padding: '12px 14px',
                whiteSpace: 'pre-wrap',
                minHeight: 80,
              }}
            >
              {text || (loading ? 'Streaming synthesis…' : '')}
              {loading && text && (
                <span
                  aria-hidden
                  data-testid="stage-synthesis-drawer-cursor"
                  style={{
                    display: 'inline-block',
                    width: 7,
                    height: 14,
                    marginLeft: 2,
                    background: SHELL.INK_MUTED,
                    verticalAlign: 'text-bottom',
                  }}
                />
              )}
            </article>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({
  stageLabel,
  onClose,
}: {
  stageLabel: string;
  onClose: () => void;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        padding: '16px 20px',
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        background: SHELL.CARD_WHITE,
      }}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SHELL.INK_MUTED,
          }}
        >
          Stage synthesis
        </span>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.3,
            color: SHELL.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {stageLabel}
        </span>
      </div>
      <button
        type="button"
        data-testid="stage-synthesis-drawer-close"
        onClick={onClose}
        aria-label="Close stage synthesis drawer"
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          letterSpacing: '0.04em',
          color: SHELL.INK_MUTED,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
        }}
      >
        Close ✕
      </button>
    </header>
  );
}

function Eyebrow({
  instanceId,
  stageId,
}: {
  instanceId: string;
  stageId: string;
}) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 10,
        color: SHELL.INK_MUTED,
        letterSpacing: '0.04em',
      }}
    >
      {instanceId} · stage {stageId}
    </div>
  );
}
