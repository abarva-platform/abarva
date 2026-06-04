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
        background: '#F8F7F4',
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
            width: '100%',
            maxWidth: 460,
            border: '1px solid rgba(38, 51, 77, 0.12)',
            background: '#F3F1EC',
            borderRadius: 12,
            padding: '12px 14px',
            color: '#4B5563',
            fontSize: 12,
            lineHeight: 1.55,
            textAlign: 'left',
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-0.005em',
          }}
        >
          <strong style={{ color: '#1F2937' }}>Responsible AI</strong>
          <div>
            AI output may contain errors. Human approval is required before any
            write, submission, vendor communication, or decision based on this
            workspace.
          </div>
        </div>
        <div
          style={{
            maxWidth: 460,
            color: '#5D6572',
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
