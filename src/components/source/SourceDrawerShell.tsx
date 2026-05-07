'use client';

/**
 * SourceDrawerShell
 *
 * Shared right-rail drawer overlay used by:
 *   T12 — Data readiness drawer
 *   T13 — Evidence drawer
 *   T14 — Gate detail drawer
 *
 * Renders a dark backdrop with a white drawer card sliding in from the right.
 * Caller controls visibility via `open`; close is signalled via `onClose`.
 */

import type { ReactNode, CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface SourceDrawerShellProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}

const BACKDROP: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10,10,11,0.45)',
  zIndex: 500,
  display: 'flex',
  justifyContent: 'flex-end',
};

const DRAWER: CSSProperties = {
  width: 480,
  maxWidth: '92vw',
  height: '100%',
  background: SHELL.CARD_WHITE,
  borderLeft: '1px solid ' + SHELL.CARD_LINE,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

const DRAWER_HEAD: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: '18px 20px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  position: 'sticky',
  top: 0,
  background: SHELL.CARD_WHITE,
  zIndex: 1,
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#b8851a',
  marginBottom: 4,
};

const DRAWER_TITLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 15,
  fontWeight: 700,
  color: SHELL.INK,
  lineHeight: 1.3,
};

const CLOSE_BTN: CSSProperties = {
  flexShrink: 0,
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 7,
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: SHELL.SANS,
  fontSize: 16,
  color: SHELL.INK_SOFT,
  cursor: 'pointer',
};

const DRAWER_BODY: CSSProperties = {
  flex: 1,
  padding: '16px 20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

export function SourceDrawerShell({
  open,
  onClose,
  eyebrow,
  title,
  children,
}: SourceDrawerShellProps) {
  if (!open) return null;

  return (
    <div
      style={BACKDROP}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={DRAWER}>
        <div style={DRAWER_HEAD}>
          <div>
            {eyebrow && <div style={EYEBROW}>{eyebrow}</div>}
            <div style={DRAWER_TITLE}>{title}</div>
          </div>
          <button
            style={CLOSE_BTN}
            onClick={onClose}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>
        <div style={DRAWER_BODY}>{children}</div>
      </div>
    </div>
  );
}

/**
 * Reusable building blocks for drawer content
 */

export const DRAWER_PANEL: CSSProperties = {
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

export const DRAWER_PANEL_HEAD: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 8,
};

export const DRAWER_EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

/** Green / amber / red state banner inside a drawer */
export function DrawerBanner({
  variant = 'amber',
  children,
}: {
  variant?: 'green' | 'amber' | 'red';
  children: ReactNode;
}) {
  const colors: Record<string, { bg: string; border: string; dot: string }> = {
    green:  { bg: 'rgba(29,158,117,0.08)', border: 'rgba(29,158,117,0.25)', dot: '#1d9e75' },
    amber:  { bg: 'rgba(186,117,23,0.08)', border: 'rgba(186,117,23,0.25)', dot: '#ba7517' },
    red:    { bg: 'rgba(163,45,45,0.08)',  border: 'rgba(163,45,45,0.25)',  dot: '#a32d2d' },
  };
  const c = colors[variant];

  return (
    <div
      style={{
        background: c.bg,
        border: '1px solid ' + c.border,
        borderRadius: 8,
        padding: '10px 12px',
        fontFamily: SHELL.SANS,
        fontSize: 12.5,
        lineHeight: 1.55,
        color: SHELL.INK,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: c.dot,
          marginTop: 4,
          flexShrink: 0,
        }}
      />
      <span>{children}</span>
    </div>
  );
}
