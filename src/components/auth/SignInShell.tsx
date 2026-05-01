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
          gap: '14px',
        }}
      >
        <DemoCodeSignIn redirectUrl={redirectUrl} />
        <div
          style={{
            maxWidth: 420,
            color: '#64748B',
            fontSize: 12,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          App access is locked to the approved demo identities for this crawl window. Sign out clears the active
          client binding before returning here.
        </div>
      </div>
    </div>
  )
}
