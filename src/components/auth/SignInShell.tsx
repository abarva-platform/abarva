'use client'

import { useEffect } from 'react'
import { SignIn } from '@clerk/nextjs'
import { clearActiveClientContext } from '@/lib/auth/client-context-storage'

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
      }}
    >
      <SignIn key={redirectUrl} forceRedirectUrl={redirectUrl} />
    </div>
  )
}
