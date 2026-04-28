'use client'

import Link from 'next/link'
import { SHELL } from '@/lib/shell/shell-tokens'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: SHELL.PAPER,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SHELL.SANS,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px 24px' }}>
        {/* Brand mark */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            fontWeight: 700,
            color: SHELL.INK,
            marginBottom: 32,
            letterSpacing: '-0.01em',
          }}
        >
          AbarVa
        </div>

        {/* Error icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: SHELL.RUST_BG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.RUST_TEXT,
              lineHeight: 1,
            }}
          >
            !
          </span>
        </div>

        {/* Heading */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 700,
            color: SHELL.INK,
            marginBottom: 10,
            letterSpacing: '-0.01em',
          }}
        >
          Something went wrong
        </div>

        {/* Sub-copy */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_MUTED,
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred. The team has been notified.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SHELL.PAPER,
              background: SHELL.INK,
              border: `1px solid ${SHELL.INK}`,
              padding: '9px 18px',
              borderRadius: 20,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/home"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SHELL.INK,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: 'transparent',
              padding: '9px 18px',
              borderRadius: 20,
              textDecoration: 'none',
            }}
          >
            Go to home
          </Link>
        </div>
      </div>

      {/* Footer trace */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Nx · Nexus · Unhandled error
      </div>
    </div>
  )
}
