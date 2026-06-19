'use client'

import Image from 'next/image'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { clearActiveClientContext } from '@/lib/auth/client-context-storage'

interface Props {
  redirectUrl: string
}

type Step = 'email' | 'code'

function describeClerkError(error: unknown) {
  const first = (error as { errors?: Array<{ longMessage?: string; message?: string; code?: string }> } | null)?.errors?.[0]
  if (first?.longMessage || first?.message) return first.longMessage ?? first.message ?? 'Unable to complete sign-in. Please retry.'
  if (error instanceof Error) return error.message
  return 'Unable to complete sign-in. Please retry.'
}

const BRAND = {
  cardBorder: '#D9D6CD',
  card: '#FFFFFF',
  ink: '#111318',
  textMute: '#4B5563',
  textFaint: '#71717A',
  accent: '#10245A',
  surface: '#FBFAF7',
  fSans: 'Inter, system-ui, sans-serif',
  fMono: '"JetBrains Mono", ui-monospace, monospace',
  fSerif: 'Fraunces, Georgia, serif',
}

const LABEL = {
  display: 'block',
  fontFamily: BRAND.fMono,
  fontSize: 10,
  letterSpacing: '.16em',
  textTransform: 'uppercase' as const,
  color: BRAND.textFaint,
  marginBottom: 8,
}

const INPUT = {
  width: '100%',
  borderRadius: 8,
  border: `1px solid ${BRAND.cardBorder}`,
  background: BRAND.surface,
  color: BRAND.ink,
  padding: '13px 14px',
  fontSize: 14,
  fontFamily: BRAND.fSans,
  outline: 'none',
}

const BUTTON_PRIMARY = {
  width: '100%',
  border: 0,
  borderRadius: 8,
  background: BRAND.accent,
  color: '#FFFFFF',
  fontWeight: 650,
  fontSize: 14,
  fontFamily: BRAND.fSans,
  padding: '13px 16px',
  cursor: 'pointer',
}

export function EmailCodeSignIn({ redirectUrl }: Props) {
  const { signIn, fetchStatus } = useSignIn()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    clearActiveClientContext()
  }, [])

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])
  const isBusy = pending || fetchStatus === 'fetching'

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setPending(true)
    setError(null)
    setMessage(null)

    try {
      if (!normalizedEmail) throw new Error('Enter your email address.')
      const result = await signIn.emailCode.sendCode({ emailAddress: normalizedEmail })
      if (result.error) throw result.error
      setStep('code')
      setMessage(`We sent a sign-in code to ${normalizedEmail}.`)
    } catch (err) {
      setError(describeClerkError(err))
    } finally {
      setPending(false)
    }
  }

  async function verifyCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setPending(true)
    setError(null)

    try {
      const trimmedCode = code.trim()
      if (!trimmedCode) throw new Error('Enter the code from your email.')
      const result = await signIn.emailCode.verifyCode({ code: trimmedCode })
      if (result.error) throw result.error

      const finalizeResult = await signIn.finalize()
      if (finalizeResult.error) throw finalizeResult.error

      window.location.assign(redirectUrl)
    } catch (err) {
      setError(describeClerkError(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 460,
        border: `1px solid ${BRAND.cardBorder}`,
        background: BRAND.card,
        borderRadius: 12,
        padding: 32,
        boxShadow: '0 24px 70px rgba(17, 19, 24, 0.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Image
          src="/brand/abarva-logo.svg"
          alt="AbarVa"
          width={92}
          height={24}
          style={{ height: 24, width: 'auto', display: 'block' }}
          priority
        />
        <div aria-hidden="true" style={{ width: 1, height: 18, background: 'rgba(17,19,24,0.10)' }} />
        <div style={{ fontFamily: BRAND.fSans, fontSize: 13.5, color: BRAND.ink, lineHeight: 1 }}>
          <strong style={{ fontWeight: 650 }}>AI</strong> Success Platform
        </div>
      </div>

      <div
        style={{
          color: BRAND.ink,
          fontFamily: BRAND.fSerif,
          fontSize: 24,
          fontWeight: 400,
          lineHeight: 1.2,
          marginBottom: 6,
        }}
      >
        Sign in to your workspace.
      </div>
      <div style={{ color: BRAND.textMute, fontFamily: BRAND.fSans, fontSize: 13.5, lineHeight: 1.55, marginBottom: 22 }}>
        Enter your invited email address. We will send a one-time sign-in code.
      </div>

      {step === 'email' ? (
        <form onSubmit={sendCode} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label htmlFor="signin-email" style={LABEL}>
              Email
            </label>
            <input
              id="signin-email"
              name="identifier"
              placeholder="Enter your email address"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={INPUT}
              disabled={isBusy}
              required
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}
          {message && <Alert tone="info">{message}</Alert>}

          <button
            type="submit"
            style={{ ...BUTTON_PRIMARY, opacity: isBusy || !normalizedEmail ? 0.62 : 1 }}
            disabled={isBusy || !normalizedEmail}
          >
            {isBusy ? 'Sending...' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label htmlFor="signin-code" style={LABEL}>
              Code
            </label>
            <input
              id="signin-code"
              placeholder="Enter email code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              style={INPUT}
              disabled={isBusy}
              required
            />
          </div>

          {message && <Alert tone="info">{message}</Alert>}
          {error && <Alert tone="error">{error}</Alert>}

          <button
            type="submit"
            style={{ ...BUTTON_PRIMARY, opacity: isBusy || !code.trim() ? 0.62 : 1 }}
            disabled={isBusy || !code.trim()}
          >
            {isBusy ? 'Verifying...' : 'Verify code'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('email')
              setCode('')
              setError(null)
              setMessage(null)
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: BRAND.accent,
              fontFamily: BRAND.fSans,
              fontWeight: 650,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  )
}

function Alert({ children, tone }: { children: string; tone: 'error' | 'info' }) {
  const isError = tone === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      style={{
        borderRadius: 8,
        border: `1px solid ${isError ? 'rgba(248, 113, 113, 0.35)' : 'rgba(16, 36, 90, 0.18)'}`,
        background: isError ? '#FFF1F1' : '#F4F7FF',
        color: isError ? '#8A1F1F' : BRAND.accent,
        padding: '11px 14px',
        fontSize: 13,
        lineHeight: 1.5,
        fontFamily: BRAND.fSans,
      }}
    >
      {children}
    </div>
  )
}
