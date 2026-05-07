'use client';

// B5 — minimal three-step onboarding tour for /source. Activated via
// `?tour=1` on any of the three steps. A "Take the tour" link on
// /source seeds it; completion or "Skip" persists `onboarded=true`
// to localStorage so the tour does not nag returning users.
//
// We deliberately avoid a heavyweight tour library — a fixed-bottom
// card with Skip / Next / Done is enough to unblock first-time
// adoption without dictating where the user clicks.

import { useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'abarva.source.onboarded';

export type TourStep = 1 | 2 | 3;

export interface TourStepConfig {
  step: TourStep;
  title: string;
  body: ReactNode;
  /** Where the "Next" button takes the user. Omit on the final step. */
  nextHref?: string;
  /** Override the next-button label. Defaults to "Next" / "Done". */
  nextLabel?: string;
  /** When true, the user is on a page where the action is theirs to
   * complete (e.g. fill the intake form, click Mark complete). The
   * Next button is replaced with a static "Continue when you're
   * ready" hint to avoid pre-empting the action. */
  awaitingUserAction?: boolean;
}

interface Props {
  /** When true, this page believes the user is currently in the tour
   * (typically derived from `searchParams.tour === '1'`). */
  active: boolean;
  config: TourStepConfig;
}

export function SourceOnboardingTour({ active, config }: Props) {
  const router = useRouter();
  // Read localStorage at mount time (lazy initialiser — no effect needed).
  // If the user already completed the tour on a previous visit,
  // treat this instance as pre-dismissed. The `dismissed` state flag
  // handles the skip/done action within the current session.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!active || dismissed) return null;

  const isFinal = !config.nextHref;
  const stepLabel = `${config.step} of 3`;

  const handleSkip = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* swallow */
    }
    setDismissed(true);
    // Strip the tour param so the user doesn't see the card if they
    // refresh.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('tour');
      router.replace(url.pathname + (url.search || ''));
    }
  };

  const handleDone = () => {
    handleSkip();
  };

  return (
    <aside
      role="dialog"
      aria-label="Source onboarding tour"
      data-testid={`source-onboarding-tour-step-${config.step}`}
      style={CARD_STYLE}
    >
      <div style={STEP_INDICATOR_STYLE}>Tour · step {stepLabel}</div>
      <h3 style={TITLE_STYLE}>{config.title}</h3>
      <div style={BODY_STYLE}>{config.body}</div>
      <div style={ACTIONS_STYLE}>
        <button
          type="button"
          onClick={handleSkip}
          data-testid="source-onboarding-tour-skip"
          style={GHOST_BUTTON_STYLE}
        >
          Skip tour
        </button>
        {config.awaitingUserAction ? (
          <span style={AWAIT_HINT_STYLE}>Continue when you&apos;re ready.</span>
        ) : isFinal ? (
          <button
            type="button"
            onClick={handleDone}
            data-testid="source-onboarding-tour-done"
            style={PRIMARY_BUTTON_STYLE}
          >
            {config.nextLabel ?? 'Done'}
          </button>
        ) : (
          <Link
            href={config.nextHref!}
            data-testid="source-onboarding-tour-next"
            style={{ ...PRIMARY_BUTTON_STYLE, textDecoration: 'none' }}
          >
            {config.nextLabel ?? 'Next'}
          </Link>
        )}
      </div>
    </aside>
  );
}

/**
 * Renders the "Take the tour" entry link on /source. Clears any
 * previous "onboarded" flag so the tour displays again. Returns null
 * if rendered without a window (SSR safety isn't critical here, but
 * keeping the API forgiving lets the parent render unconditionally).
 */
export function SourceTourEntryLink({ style }: { style?: CSSProperties }) {
  return (
    <Link
      href="/source?tour=1"
      data-testid="source-onboarding-tour-entry"
      onClick={() => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* swallow */
        }
      }}
      style={{ ...ENTRY_LINK_STYLE, ...style }}
    >
      Take the tour
    </Link>
  );
}

const CARD_STYLE: CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  width: 360,
  maxWidth: 'calc(100vw - 48px)',
  padding: '16px 18px',
  borderRadius: 10,
  background: '#0c1a3a',
  color: 'rgba(250,247,241,0.95)',
  boxShadow: '0 14px 40px rgba(10,10,11,0.28)',
  zIndex: 9000,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  display: 'grid',
  gap: 10,
};

const STEP_INDICATOR_STYLE: CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 9.5,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(250,247,241,0.55)',
  fontWeight: 600,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: 'Cormorant Garamond, Georgia, serif',
  fontSize: 22,
  fontWeight: 400,
  lineHeight: 1.2,
  color: '#faf7f1',
};

const BODY_STYLE: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: 'rgba(250,247,241,0.85)',
};

const ACTIONS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  marginTop: 4,
};

const GHOST_BUTTON_STYLE: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(250,247,241,0.65)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0,
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 14px',
  borderRadius: 6,
  border: 'none',
  background: '#faf7f1',
  color: '#0c1a3a',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const AWAIT_HINT_STYLE: CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11.5,
  color: 'rgba(250,247,241,0.55)',
  fontStyle: 'italic',
};

const ENTRY_LINK_STYLE: CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: '#0c1a3a',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
};
