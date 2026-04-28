import Link from 'next/link'
import { AppShell } from '@/components/shell/AppShell'
import { AgentColumn } from '@/components/shell/AgentColumn'
import { SHELL } from '@/lib/shell/shell-tokens'

export default function MaestroNotFound() {
  return (
    <AppShell surface="programs">
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Platform · Navigator' }}
        quote="This page doesn't exist or you don't have access to it."
        agentContext="Nx · Route not found"
        actions={[
          {
            letter: 'A',
            text: 'Go to programs',
            detail: 'Return to the programs portfolio',
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
            404 · Page not found
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
            The page you requested doesn&apos;t exist or has been moved.
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
