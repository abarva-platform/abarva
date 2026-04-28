'use client'

import Link from 'next/link'
import { AppShell } from '@/components/shell/AppShell'
import { AgentColumn } from '@/components/shell/AgentColumn'
import { SHELL } from '@/lib/shell/shell-tokens'

export default function MaestroError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <AppShell surface="programs">
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Platform · Navigator' }}
        quote="An unexpected error occurred in this surface. I can help you recover."
        agentContext="Nx · Unhandled error"
        actions={[
          {
            letter: 'A',
            text: 'Try again',
            detail: 'Attempt to reload this surface',
          },
          {
            letter: 'B',
            text: 'Go to home',
            detail: 'Return to the executive dashboard',
          },
          {
            letter: 'C',
            text: 'Contact support',
            detail: 'Reach the AbarVa support team',
          },
        ]}
        surface="home"
        onActionClick={(letter) => {
          if (letter === 'A') reset()
        }}
      />

      {/* WorkPane */}
      <div
        style={{
          flex: 1,
          background: SHELL.PAPER,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          {/* Error card */}
          <div
            style={{
              background: SHELL.RUST_BG,
              border: `1px solid #dbb8a8`,
              borderRadius: 10,
              padding: '28px 32px',
              marginBottom: 28,
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(138,62,34,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.SERIF,
                  fontSize: 20,
                  fontWeight: 700,
                  color: SHELL.RUST_TEXT,
                  lineHeight: 1,
                }}
              >
                !
              </span>
            </div>

            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 18,
                fontWeight: 700,
                color: SHELL.RUST_TEXT,
                marginBottom: 8,
                letterSpacing: '-0.01em',
              }}
            >
              An error occurred in this surface
            </div>

            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.RUST_TEXT,
                opacity: 0.8,
                lineHeight: 1.6,
              }}
            >
              Something went wrong while loading this page. The team has been notified.
            </div>
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
      </div>
    </AppShell>
  )
}
