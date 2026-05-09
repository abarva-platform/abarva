'use client'

import { useEffect } from 'react'
import { clearActiveClientContext } from '@/lib/auth/client-context-storage'
import { DemoCodeSignIn } from '@/components/auth/DemoCodeSignIn'

interface Props {
  redirectUrl: string
}

export function SignInShell({ redirectUrl }: Props) {
  useEffect(() => {
    clearActiveClientContext()
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060A12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'grid',
          justifyItems: 'center',
          gap: 16,
        }}
      >
        <DemoCodeSignIn redirectUrl={redirectUrl} />
        <div
          style={{
            maxWidth: 460,
            color: 'rgba(255,255,255,0.45)',
            fontSize: 11.5,
            lineHeight: 1.55,
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-0.005em',
          }}
        >
          AbarVa · AI Success Platform · Access is restricted to invited client identities.
        </div>
      </div>
    </div>
  )
}
