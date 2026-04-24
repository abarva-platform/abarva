'use client'

import { SignIn } from '@clerk/nextjs'

interface Props {
  redirectUrl: string
}

export function SignInShell({ redirectUrl }: Props) {
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
      <SignIn forceRedirectUrl={redirectUrl} />
    </div>
  )
}
