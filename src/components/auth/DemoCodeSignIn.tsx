'use client'

import { useMemo, useState } from 'react'
import { DEMO_CODE_ALLOWED_EMAILS, DEMO_CODE_VALUE, isDemoCodeEmail } from '@/lib/auth/demo-code'

interface Props {
  redirectUrl: string
}

interface ClerkWindow extends Window {
  Clerk?: {
    loaded?: boolean
    client: {
      signIn: {
        create: (params: { strategy: 'ticket'; ticket: string }) => Promise<{
          status: string
          createdSessionId?: string | null
        }>
      }
    }
    setActive: (params: { session?: string | null }) => Promise<void>
  }
}

const PANEL = {
  width: '100%',
  maxWidth: '420px',
  border: '1px solid rgba(20, 184, 166, 0.22)',
  background: 'rgba(7, 14, 24, 0.92)',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 24px 70px rgba(0, 0, 0, 0.35)',
} as const;

const LABEL = {
  display: 'block',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '11px',
  letterSpacing: '.08em',
  textTransform: 'uppercase' as const,
  color: '#8AE6DD',
  marginBottom: '8px',
} as const;

const INPUT = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(136, 152, 170, 0.28)',
  background: 'rgba(255, 255, 255, 0.04)',
  color: '#F5F7FB',
  padding: '14px 16px',
  fontSize: '14px',
  outline: 'none',
} as const;

const BUTTON = {
  width: '100%',
  border: 0,
  borderRadius: '12px',
  background: '#14B8A6',
  color: '#06211D',
  fontWeight: 700,
  padding: '14px 16px',
  cursor: 'pointer',
} as const;

export function DemoCodeSignIn({ redirectUrl }: Props) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  async function continueWithCode() {
    setError(null)

    if (!isDemoCodeEmail(normalizedEmail)) {
      setError('This app sign-in is restricted to the three approved demo accounts listed below.')
      return
    }

    setStep('code')
  }

  async function completeDemoSignIn() {
    setPending(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/demo-code-sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string; ticket?: string } | null
      if (!response.ok || !payload?.ticket) {
        throw new Error(payload?.error || 'demo_sign_in_failed')
      }

      const clerk = (window as ClerkWindow).Clerk
      if (!clerk?.loaded) {
        throw new Error('clerk_not_ready')
      }

      const result = await clerk.client.signIn.create({
        strategy: 'ticket',
        ticket: payload.ticket,
      })

      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error(`ticket_sign_in_${result.status}`)
      }

      await clerk.setActive({ session: result.createdSessionId })
      window.location.assign(redirectUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'demo_sign_in_failed'
      if (message === 'invalid_demo_code') {
        setError('That code was not accepted. Use 424242 for an approved demo account.')
      } else {
        setError('Demo sign-in did not complete. Retry with one of the approved demo accounts below.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={PANEL}>
      <div style={{ display: 'grid', gap: '10px' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: '#14B8A6',
          }}
        >
          Demo Access
        </div>
        <div style={{ color: '#F5F7FB', fontSize: '22px', fontWeight: 700 }}>
          Sign in with a test code
        </div>
        <div style={{ color: '#9AA5B1', fontSize: '14px', lineHeight: 1.5 }}>
          Only the approved crawler/demo identities can sign in here. Continue with one of the emails below and use code{' '}
          <code>{DEMO_CODE_VALUE}</code>.
        </div>
        <div
          aria-label="Approved demo accounts"
          style={{
            display: 'grid',
            gap: '6px',
            border: '1px solid rgba(136, 152, 170, 0.18)',
            borderRadius: '14px',
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.035)',
          }}
        >
          {DEMO_CODE_ALLOWED_EMAILS.map((demoEmail) => (
            <button
              key={demoEmail}
              type="button"
              onClick={() => {
                setEmail(demoEmail)
                setStep('email')
                setCode('')
                setError(null)
              }}
              style={{
                border: 0,
                background: 'transparent',
                color: '#CBD5E1',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                textAlign: 'left',
                padding: '3px 0',
                cursor: 'pointer',
              }}
            >
              {demoEmail}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
        <div>
          <label htmlFor="demo-email" style={LABEL}>Email address</label>
          <input
            id="demo-email"
            placeholder="Enter your email address"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={INPUT}
            disabled={pending || step === 'code'}
          />
        </div>

        {step === 'code' ? (
          <div>
            <label htmlFor="demo-code" style={LABEL}>Email verification code</label>
            <input
              id="demo-code"
              placeholder="Enter the 6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              style={INPUT}
              disabled={pending}
            />
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              background: 'rgba(127, 29, 29, 0.18)',
              color: '#FECACA',
              padding: '12px 14px',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        ) : null}

        {step === 'code' ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            <button type="button" style={BUTTON} onClick={completeDemoSignIn} disabled={pending || code.trim().length === 0}>
              {pending ? 'Signing in…' : 'Continue'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
              disabled={pending}
              style={{
                background: 'transparent',
                border: 0,
                color: '#8AE6DD',
                cursor: 'pointer',
                padding: 0,
                justifySelf: 'start',
                fontSize: '13px',
              }}
            >
              Change email
            </button>
          </div>
        ) : (
          <button type="button" style={BUTTON} onClick={continueWithCode} disabled={pending || normalizedEmail.length === 0}>
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
