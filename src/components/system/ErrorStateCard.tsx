'use client';

// ErrorStateCard · File 10 §10.2 P0
//
// Replaces ad-hoc "Error: …" strings across agent chat, data loads, and
// deliverable render. One visual treatment, one semantic role, one
// next-step affordance.
//
// Design discipline per File 10 §10.2:
// - Never silent · the card always names the failure type
// - Never bare · always offers a next-step the user can take (retry,
//   report, navigate elsewhere)
// - Never alarming · neutral tone; red band only for destructive/data-loss
//   scenarios, muted otherwise

import type { ReactNode } from 'react';

export type ErrorSeverity = 'notice' | 'warning' | 'critical';

export interface ErrorStateCardProps {
  /** One-line summary of what failed (e.g. "Couldn't load patterns"). */
  title: string;
  /** Optional paragraph body · what it means for the user. */
  body?: string;
  severity?: ErrorSeverity;
  /** Primary action (retry, reload, etc.). */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary link (report, navigate away). */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /**
   * Dev-only diagnostic detail. Hidden in production; shown under "Details"
   * collapsible in non-production builds. Pass error stack or API error body.
   */
  diagnostic?: string;
  children?: ReactNode;
}

const SEVERITY_META: Record<ErrorSeverity, { accent: string; bg: string; iconBg: string; label: string }> = {
  notice: {
    accent: '#8a7e72',
    bg: 'rgba(138,126,114,0.06)',
    iconBg: 'rgba(138,126,114,0.18)',
    label: 'Notice',
  },
  warning: {
    accent: '#D97706',
    bg: 'rgba(217,119,6,0.06)',
    iconBg: 'rgba(217,119,6,0.15)',
    label: 'Warning',
  },
  critical: {
    accent: '#E04444',
    bg: 'rgba(224,68,68,0.06)',
    iconBg: 'rgba(224,68,68,0.15)',
    label: 'Error',
  },
};

export function ErrorStateCard({
  title,
  body,
  severity = 'warning',
  primaryAction,
  secondaryAction,
  diagnostic,
  children,
}: ErrorStateCardProps) {
  const meta = SEVERITY_META[severity];
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <section
      className={`error-state error-${severity}`}
      role="alert"
      aria-live="polite"
      style={{
        padding: '20px 22px',
        borderRadius: 14,
        background: meta.bg,
        border: `1px solid ${meta.accent}40`,
        display: 'flex',
        gap: 16,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: meta.iconBg,
          color: meta.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          flexShrink: 0,
          fontFamily: 'Fraunces, Georgia, serif',
        }}
      >
        !
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: meta.accent,
            fontWeight: 700,
          }}
        >
          {meta.label}
        </div>
        <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.35, fontWeight: 600, color: '#1a1612' }}>{title}</h3>
        {body ? <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#544b42' }}>{body}</p> : null}

        {children}

        {isDev && diagnostic ? (
          <details style={{ marginTop: 4 }}>
            <summary style={{ fontSize: 11, color: '#8a7e72', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
              diagnostic (dev-only)
            </summary>
            <pre
              style={{
                margin: '8px 0 0',
                padding: 10,
                background: 'rgba(10,10,11,0.04)',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                color: '#544b42',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {diagnostic}
            </pre>
          </details>
        ) : null}

        {(primaryAction || secondaryAction) ? (
          <div style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {primaryAction ? (
              <button
                type="button"
                onClick={primaryAction.onClick}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: meta.accent,
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {primaryAction.label}
              </button>
            ) : null}
            {secondaryAction ? (
              secondaryAction.href ? (
                <a
                  href={secondaryAction.href}
                  onClick={secondaryAction.onClick}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'transparent',
                    color: meta.accent,
                    border: `1px solid ${meta.accent}55`,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}
                >
                  {secondaryAction.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'transparent',
                    color: meta.accent,
                    border: `1px solid ${meta.accent}55`,
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {secondaryAction.label}
                </button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
