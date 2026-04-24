'use client'

import { useEffect } from 'react'
import { SignIn } from '@clerk/nextjs'
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
          gap: '20px',
        }}
      >
        <DemoCodeSignIn redirectUrl={redirectUrl} />
        <SignIn key={redirectUrl} forceRedirectUrl={redirectUrl} />
      </div>
    </div>
  )
}
