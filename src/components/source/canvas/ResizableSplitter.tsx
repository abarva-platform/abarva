'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { CANVAS } from './canvas-tokens';

interface ResizableSplitterProps {
  left: ReactNode;
  right: ReactNode;
  /** Default split percent for the LEFT pane. 45 means 45%/55%. */
  defaultLeftPercent?: number;
  /** Min widths in px. */
  minLeftPx?: number;
  minRightPx?: number;
  /** Persistence key. Set to null to disable. */
  storageKey?: string | null;
}

/**
 * Two-pane horizontal split with a draggable handle.
 * - Drag to resize · double-click to reset to defaults
 * - User preference persisted to localStorage (when storageKey is set)
 * - Keyboard: ArrowLeft / ArrowRight on focused handle nudges 2%
 * - Respects min widths so neither pane disappears
 */
export function ResizableSplitter({
  left,
  right,
  defaultLeftPercent = 45,
  minLeftPx = 320,
  minRightPx = 420,
  storageKey = CANVAS.SPLITTER_LS_KEY,
}: ResizableSplitterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Lazy initializer reads localStorage on first render so SSR and client
  // agree without an effect-driven re-render. Falls back to default when
  // storage is unavailable or the value is out of range.
  const [leftPercent, setLeftPercent] = useState<number>(() => {
    if (!storageKey) return defaultLeftPercent;
    if (typeof window === 'undefined') return defaultLeftPercent;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return defaultLeftPercent;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 10 && n <= 90) return n;
    } catch {
      /* ignore */
    }
    return defaultLeftPercent;
  });
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Persist on change (when not actively dragging — debounce).
  useEffect(() => {
    if (!storageKey) return;
    if (dragging) return;
    try {
      window.localStorage.setItem(storageKey, String(Math.round(leftPercent)));
    } catch {
      /* ignore */
    }
  }, [leftPercent, dragging, storageKey]);

  const onMouseDown = useCallback(() => {
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const totalPx = rect.width;
      if (totalPx <= 0) return;
      const proposedLeftPx = Math.max(minLeftPx, Math.min(totalPx - minRightPx, px));
      const pct = (proposedLeftPx / totalPx) * 100;
      setLeftPercent(pct);
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, minLeftPx, minRightPx]);

  const onDoubleClick = useCallback(() => {
    setLeftPercent(defaultLeftPercent);
  }, [defaultLeftPercent]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setLeftPercent((p) => Math.max(15, p - 2));
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setLeftPercent((p) => Math.min(85, p + 2));
      e.preventDefault();
    }
  }, []);

  const handleColor = dragging ? CANVAS.SPLITTER_ACTIVE : hovering ? CANVAS.SPLITTER_HOVER : CANVAS.HAIRLINE;

  return (
    <div ref={containerRef} style={CONTAINER_STYLE} data-testid="source-canvas-splitter">
      <div style={{ ...PANE_STYLE, width: `calc(${leftPercent}% - 2px)` }}>{left}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat and workspace"
        tabIndex={0}
        onMouseDown={onMouseDown}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
        style={{
          ...HANDLE_STYLE,
          background: handleColor,
          cursor: dragging ? 'col-resize' : 'col-resize',
        }}
      />
      <div style={{ ...PANE_STYLE, width: `calc(${100 - leftPercent}% - 2px)` }}>{right}</div>
    </div>
  );
}

const CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  height: '100%',
  width: '100%',
};

const PANE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
};

const HANDLE_STYLE: CSSProperties = {
  width: CANVAS.SPLITTER_WIDTH,
  flexShrink: 0,
  cursor: 'col-resize',
  transition: 'background 120ms ease',
  outline: 'none',
};
