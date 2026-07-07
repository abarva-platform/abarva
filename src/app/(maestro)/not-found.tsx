import Link from 'next/link'
import { AppShell } from '@/components/shell/AppShell'
import { AgentColumn } from '@/components/shell/AgentColumn'
import { SHELL } from '@/lib/shell/shell-tokens'

export default function MaestroNotFound() {
  return (
    <AppShell surface="programs">
      <AgentColumn
        agent={{ initials: 'aVa', name: 'aVa', role: 'Workspace advisor' }}
        quote="This item is not available for this account."
        agentContext="Item unavailable"
        actions={[
          {
            letter: 'A',
            text: 'Go to Moves',
            detail: 'Return to the Moves portfolio',
          },
          {
            letter: 'B',
            text: 'Go to Home',
            detail: 'Return to the workspace home page',
          },
          {
            letter: 'C',
            text: 'Contact support',
            detail: 'Reach the AbarVa support team',
          },
        ]}
        surface="home"
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
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          {/* Decorative number */}
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 64,
              fontWeight: 700,
              color: SHELL.INK,
              opacity: 0.10,
              lineHeight: 1,
              marginBottom: 20,
              userSelect: 'none',
            }}
            aria-hidden
          >
            404
          </div>

          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              fontWeight: 700,
              color: SHELL.INK,
              marginBottom: 10,
              letterSpacing: '-0.01em',
            }}
          >
            Item unavailable
          </div>

          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MUTED,
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            This item may have moved, or your current account may not have access
            to it.
          </div>

          <Link
            href="/home"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              textDecoration: 'none',
            }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
