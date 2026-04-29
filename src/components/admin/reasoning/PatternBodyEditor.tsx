'use client';

// PatternBodyEditor — inline textarea for previewing and overriding a
// pattern's body markdown at runtime.
//
// Renders below the pattern row when the admin clicks the "Edit" button.
// Saves via POST /api/reasoning/patterns/[patternId]/override (in-memory,
// no DB persistence). Reset issues a DELETE to the same endpoint.

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 2000;

// ─── Styles ───────────────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}99`,
  fontWeight: 600,
  display: 'block',
  marginBottom: 6,
};

const TEXTAREA_STYLE: React.CSSProperties = {
  width: '100%',
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
  color: COLORS.ink,
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}22`,
  borderRadius: RADIUS.sm,
  padding: '10px 12px',
  resize: 'vertical',
  lineHeight: 1.6,
  boxSizing: 'border-box',
  minHeight: 220,
};

const BUTTON_BASE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  fontWeight: 600,
  padding: '7px 14px',
  borderRadius: RADIUS.sm,
  cursor: 'pointer',
  letterSpacing: '0.02em',
};

const SAVE_BTN: React.CSSProperties = {
  ...BUTTON_BASE,
  background: COLORS.ink,
  color: COLORS.white,
  border: `1px solid ${COLORS.ink}`,
};

const GHOST_BTN: React.CSSProperties = {
  ...BUTTON_BASE,
  background: 'transparent',
  color: COLORS.ink,
  border: `1px solid ${COLORS.ink}22`,
};

const DISABLED_BTN: React.CSSProperties = {
  opacity: 0.4,
  cursor: 'default',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  patternId: string;
  /** The seed-authored body to pre-fill and to restore on reset. */
  defaultBody: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PatternBodyEditor({ patternId, defaultBody, onClose }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [text, setText] = useState(defaultBody);
  const [isOverridden, setIsOverridden] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount, fetch the current override (if any) to pre-fill correctly.
  useEffect(() => {
    async function fetchOverride() {
      try {
        const res = await fetch(`/api/reasoning/patterns/${encodeURIComponent(patternId)}/override`);
        if (!res.ok) return;
        const data = (await res.json()) as { body: string | null; isOverridden: boolean };
        if (data.isOverridden && data.body !== null) {
          setText(data.body);
          setIsOverridden(true);
        }
      } catch {
        // Silently ignore — defaults to seed body
      }
    }
    void fetchOverride();
  }, [patternId]);

  // Auto-dismiss "Saved" indicator after 2 s.
  useEffect(() => {
    if (saveStatus === 'saved') {
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
    return () => {
      if (savedTimerRef.current !== null) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, [saveStatus]);

  const overLimit = text.length > MAX_CHARS;
  const busy = saveStatus === 'saving';

  async function handleSave() {
    if (overLimit || busy) return;
    setSaveStatus('saving');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/reasoning/patterns/${encodeURIComponent(patternId)}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `HTTP ${res.status}`);
      }
      setIsOverridden(true);
      setSaveStatus('saved');
      startTransition(() => router.refresh());
    } catch (err) {
      setSaveStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function handleReset() {
    if (busy) return;
    setSaveStatus('saving');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/reasoning/patterns/${encodeURIComponent(patternId)}/override`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `HTTP ${res.status}`);
      }
      setText(defaultBody);
      setIsOverridden(false);
      setSaveStatus('idle');
      startTransition(() => router.refresh());
    } catch (err) {
      setSaveStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div
      style={{
        background: `${COLORS.ink}04`,
        border: `1px solid ${COLORS.ink}18`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: SPACING.sm,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 15,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            Edit pattern body
          </span>
          {isOverridden ? (
            <span
              style={{
                marginLeft: SPACING.sm,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                color: COLORS.navy,
                background: `${COLORS.navy}14`,
                borderRadius: RADIUS.pill,
                padding: '2px 8px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              overridden
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel editor"
          style={{
            ...GHOST_BTN,
            fontSize: 11,
          }}
        >
          Cancel
        </button>
      </div>

      {/* Textarea */}
      <div>
        <label
          style={LABEL_STYLE}
          htmlFor={`pattern-body-${patternId}`}
        >
          Body (markdown)
        </label>
        <textarea
          id={`pattern-body-${patternId}`}
          value={text}
          onChange={(e) => {
            setSaveStatus('idle');
            setText(e.target.value);
          }}
          style={{
            ...TEXTAREA_STYLE,
            borderColor: overLimit ? COLORS.coralInk : `${COLORS.ink}22`,
          }}
          disabled={busy}
          spellCheck
        />
      </div>

      {/* Character count */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: overLimit ? COLORS.coralInk : `${COLORS.ink}66`,
          textAlign: 'right',
        }}
      >
        {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
      </div>

      {/* Action row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy || overLimit}
          style={{
            ...SAVE_BTN,
            ...(busy || overLimit ? DISABLED_BTN : {}),
          }}
        >
          {busy ? 'Saving…' : 'Save override'}
        </button>

        <button
          type="button"
          onClick={() => void handleReset()}
          disabled={busy || !isOverridden}
          style={{
            ...GHOST_BTN,
            ...(!isOverridden || busy ? DISABLED_BTN : {}),
          }}
        >
          Reset to default
        </button>

        {saveStatus === 'saved' ? (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.mintInk,
              fontWeight: 600,
            }}
          >
            Saved ✓
          </span>
        ) : null}

        {saveStatus === 'error' && errorMessage ? (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.coralInk,
            }}
          >
            Error: {errorMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
