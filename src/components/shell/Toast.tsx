'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

// ─── Individual toast ─────────────────────────────────────────────────────────

const BORDER_COLOR: Record<ToastType, string> = {
  success: SHELL.MINT_TEXT,
  error: SHELL.RUST_TEXT,
  info: SHELL.PEACH_TEXT,
};

const AUTO_DISMISS_MS = 4000;

interface SingleToastProps {
  item: ToastItem;
  onDismiss: (id: number) => void;
}

function SingleToast({ item, onDismiss }: SingleToastProps) {
  const [visible, setVisible] = useState(false);

  // Slide in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [item.id, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: SHELL.INK,
        color: SHELL.PAPER,
        borderRadius: 10,
        padding: '14px 16px',
        minWidth: 280,
        maxWidth: 380,
        fontFamily: SHELL.SANS,
        fontSize: 13,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        borderLeft: `3px solid ${BORDER_COLOR[item.type]}`,
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 32px))',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.title && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              fontWeight: 600,
              color: SHELL.PAPER,
              marginBottom: item.message ? 2 : 0,
              lineHeight: 1.35,
            }}
          >
            {item.title}
          </div>
        )}
        {item.message && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: 'rgba(250,247,241,0.75)',
              lineHeight: 1.45,
            }}
          >
            {item.message}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(250,247,241,0.5)',
          fontFamily: SHELL.SANS,
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
          marginTop: -1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Container (portal) ───────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const getClientMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

function subscribeToHydration(onStoreChange: () => void) {
  const timeoutId = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timeoutId);
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientMountedSnapshot,
    getServerMountedSnapshot,
  );

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-end',
        pointerEvents: toasts.length === 0 ? 'none' : 'auto',
      }}
    >
      {toasts.map((t) => (
        <SingleToast key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const MAX_TOASTS = 3;
let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: ToastOptions) => {
    setToasts((prev) => {
      const id = nextId++;
      const next = [...prev, { ...opts, id }];
      // Drop oldest if over the max
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
