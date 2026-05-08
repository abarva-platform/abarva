'use client';

// DrawerProvider · Section 2 of page-agent-coherence-work-order.md.
// One drawer at a time, slides from right at 72% viewport width.
// ESC / click-outside / close button all dismiss and preserve source
// page state. "Open full page →" promotes to a real navigation.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type DrawerKind = 'pattern' | 'evidence' | 'program' | 'deliverable';

export interface DrawerContent {
  kind: DrawerKind;
  id: string;
  // Canonical URL for the drawer content. "Open full page" uses this
  // to promote the drawer to navigation.
  href: string;
  // Optional pre-rendered body. If omitted, the drawer fetches the
  // canonical route via an iframe (fallback). Prefer passing a body.
  body?: ReactNode;
  // Optional title override; otherwise derived from `id`.
  title?: string;
  // Optional eyebrow text (e.g. "Sentinel · pattern detail").
  eyebrow?: string;
}

interface DrawerState {
  open: boolean;
  content: DrawerContent | null;
  // Scroll Y of the source page at the moment the drawer opened, so
  // dismissal can restore it.
  sourceScrollY: number;
}

interface DrawerContextValue {
  state: DrawerState;
  openDrawer: (content: DrawerContent) => void;
  closeDrawer: () => void;
  promoteDrawerToNavigation: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

// Null-safe hook · callers outside a DrawerProvider (SSR tests,
// standalone previews) get a no-op that matches the contract. This keeps
// consumers like EvidenceChipList from blowing up the integrity suite
// when rendered without the (maestro) layout.
const NOOP_DRAWER: DrawerContextValue = {
  state: { open: false, content: null, sourceScrollY: 0 },
  openDrawer: () => {},
  closeDrawer: () => {},
  promoteDrawerToNavigation: () => {},
};

export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  return ctx ?? NOOP_DRAWER;
}

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrawerState>({
    open: false,
    content: null,
    sourceScrollY: 0,
  });
  const scrollRestoreRef = useRef<number>(0);

  const openDrawer = useCallback((content: DrawerContent) => {
    scrollRestoreRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
    setState({ open: true, content, sourceScrollY: scrollRestoreRef.current });
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    // Restore scroll after the slide-out animation finishes.
    setTimeout(() => {
      if (typeof window !== 'undefined') window.scrollTo({ top: scrollRestoreRef.current, left: 0 });
    }, 180);
  }, []);

  const promoteDrawerToNavigation = useCallback(() => {
    const href = state.content?.href;
    closeDrawer();
    if (href && typeof window !== 'undefined') {
      window.location.assign(href);
    }
  }, [state.content, closeDrawer]);

  // ESC key dismisses.
  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.open, closeDrawer]);

  // Browser back-button closes drawer first.
  useEffect(() => {
    if (!state.open) return;
    const handler = (e: PopStateEvent) => {
      e.preventDefault?.();
      closeDrawer();
    };
    window.history.pushState({ drawer: true }, '');
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [state.open, closeDrawer]);

  const value = useMemo<DrawerContextValue>(
    () => ({ state, openDrawer, closeDrawer, promoteDrawerToNavigation }),
    [state, openDrawer, closeDrawer, promoteDrawerToNavigation],
  );

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <DrawerOverlay />
    </DrawerContext.Provider>
  );
}

function DrawerOverlay() {
  const { state, closeDrawer, promoteDrawerToNavigation } = useDrawer();
  if (!state.open || !state.content) return null;
  const { content } = state;

  return (
    <>
      <style>{drawerCss}</style>
      <div
        className="drw-scrim"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        className="drw-panel"
        role="dialog"
        aria-modal="true"
        aria-label={content.title ?? content.id}
      >
        <div className="drw-header">
          <div className="drw-header-text">
            {content.eyebrow ? <div className="drw-eyebrow">{content.eyebrow}</div> : null}
            <div className="drw-title">{content.title ?? content.id.replace(/[-_]/g, ' ')}</div>
          </div>
          <div className="drw-header-actions">
            <button
              type="button"
              className="drw-promote"
              onClick={promoteDrawerToNavigation}
              title="Open full page"
            >
              Open full page →
            </button>
            <button
              type="button"
              className="drw-close"
              onClick={closeDrawer}
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="drw-body">
          {content.body ?? (
            <iframe
              src={content.href}
              className="drw-iframe"
              title={content.title ?? 'Drawer content'}
            />
          )}
        </div>
      </aside>
    </>
  );
}

const drawerCss = `
.drw-scrim {
  position: fixed; inset: 0;
  background: rgba(10,10,11,0.42);
  z-index: 90;
  animation: drw-fade-in 160ms ease-out;
}
.drw-panel {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 72vw; max-width: 1200px;
  background: #F5F1EB;
  border-left: 1px solid rgba(26,22,18,0.12);
  box-shadow: -20px 0 60px rgba(10,10,11,0.18);
  display: flex; flex-direction: column;
  z-index: 91;
  animation: drw-slide-in 200ms cubic-bezier(0.22, 1, 0.36, 1);
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  color: #1a1612;
}
@keyframes drw-slide-in {
  0%   { transform: translateX(100%); }
  100% { transform: translateX(0); }
}
@keyframes drw-fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

.drw-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 18px 24px 14px;
  border-bottom: 1px solid rgba(26,22,18,0.10);
  background: #FFFFFF;
  flex-shrink: 0;
}
.drw-header-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.drw-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  color: #9B6DFF; font-weight: 700;
}
.drw-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px; letter-spacing: -0.018em; line-height: 1.15;
  font-weight: 700; color: #1a1612;
}
.drw-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.drw-promote, .drw-close {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700;
  padding: 7px 12px; border-radius: 999px;
  border: 1px solid rgba(26,22,18,0.14); background: #FFFFFF; color: #1a1612;
  cursor: pointer; transition: all 0.15s;
}
.drw-promote:hover { border-color: #9B6DFF; color: #9B6DFF; }
.drw-close {
  width: 32px; height: 32px; padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.drw-close:hover { background: rgba(26,22,18,0.05); }

.drw-body {
  flex: 1; overflow-y: auto;
  padding: 24px 26px 48px;
}

.drw-iframe {
  width: 100%; height: 100%; min-height: calc(100vh - 120px);
  border: 0; background: #F5F1EB;
}

@media (max-width: 880px) {
  .drw-panel { width: 100vw; max-width: none; }
}
@media (prefers-reduced-motion: reduce) {
  .drw-panel, .drw-scrim { animation: none; }
}
`;
