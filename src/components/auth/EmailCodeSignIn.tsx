'use client'

import Image from 'next/image'
import type { FormEvent } from 'react'
import { useMemo, useRef, useState } from 'react'

interface Props {
  redirectUrl: string
}

interface ClerkErrorLike {
  errors?: Array<{ code?: string; message?: string; longMessage?: string }>
  message?: string
}

interface EmailCodeFactor {
  strategy: 'email_code'
  emailAddressId: string
  safeIdentifier?: string
}

interface SignInResource {
  status: string | null
  createdSessionId?: string | null
  supportedFirstFactors?: Array<EmailCodeFactor | { strategy: string }> | null
  create: (params: { identifier: string }) => Promise<SignInResource>
  prepareFirstFactor: (params: {
    strategy: 'email_code'
    emailAddressId: string
  }) => Promise<SignInResource>
  attemptFirstFactor: (params: {
    strategy: 'email_code'
    code: string
  }) => Promise<SignInResource>
}

interface ClerkWindow extends Window {
  __ABARVA_AUTH_TEST_NAVIGATE__?: (url: string) => void
  Clerk?: {
    loaded?: boolean
    user?: { id?: string } | null
    session?: { id?: string } | null
    client: {
      signIn: SignInResource
    }
    setActive: (params: { session?: string | null }) => Promise<void>
  }
}

const BRAND = {
  signalBlue: '#111318',
  hair: 'rgba(17,19,24,0.10)',
  card: '#FFFFFF',
  cardBorder: '#D9D6CD',
  textStrong: '#111318',
  textMute: '#4B5563',
  textFaint: '#71717A',
  fSans: 'Inter, system-ui, sans-serif',
  fMono: '"JetBrains Mono", ui-monospace, monospace',
  fSerif: 'Fraunces, Georgia, serif',
}

const PANEL = {
  width: '100%',
  maxWidth: 460,
  border: `1px solid ${BRAND.cardBorder}`,
  background: BRAND.card,
  borderRadius: 12,
  padding: '32px',
  boxShadow: '0 24px 70px rgba(17, 19, 24, 0.10)',
} as const

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
  background: '#FBFAF7',
  color: BRAND.textStrong,
  padding: '13px 14px',
  fontSize: 14,
  fontFamily: BRAND.fSans,
  outline: 'none',
}

const BUTTON_PRIMARY = {
  width: '100%',
  border: 0,
  borderRadius: 8,
  background: BRAND.signalBlue,
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: 14,
  fontFamily: BRAND.fSans,
  padding: '13px 16px',
  cursor: 'pointer',
  letterSpacing: '-0.005em',
}

function describeFailure(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : String(err ?? fallback)

  if (message === 'already_signed_in') {
    return 'You appear to be signed in already. Sign out, then retry with the tenant-specific email.'
  }
  if (message === 'clerk_not_ready') {
    return 'Clerk did not finish loading. Refresh the page and retry.'
  }
  if (message === 'email_code_not_enabled') {
    return 'This account is not configured for email-code sign-in yet. Use the private invite fallback or ask Anand to enable email code in Clerk.'
  }
  if (message.startsWith('email_code_sign_in_')) {
    const status = message.slice('email_code_sign_in_'.length)
    return `Clerk did not finalize the session (status: ${status}). Check the code and retry.`
  }

  const clerkError = (err as ClerkErrorLike)?.errors?.[0]
  const detail = clerkError?.longMessage ?? clerkError?.message
  if (detail) {
    if (clerkError?.code === 'rate_limit_exceeded' || /rate limit/i.test(detail)) {
      return 'Clerk rate limit hit. Wait about 30 seconds and retry.'
    }
    if (/not found|identifier|does not exist|invalid/i.test(detail)) {
      return 'That email is not an approved AbarVa workspace identity.'
    }
    return detail
  }

  if (/network|fetch|failed/i.test(message)) {
    return `Network error during sign-in. Check connectivity and retry. (raw: ${message})`
  }

  return `${fallback} (raw: ${message}).`
}

function isEmailCodeFactor(factor: EmailCodeFactor | { strategy: string }): factor is EmailCodeFactor {
  return factor.strategy === 'email_code' && 'emailAddressId' in factor
}

function navigateAfterSignIn(url: string) {
  const testNavigate = (window as ClerkWindow).__ABARVA_AUTH_TEST_NAVIGATE__
  if (testNavigate) {
    testNavigate(url)
    return
  }
  window.location.assign(url)
}

export function EmailCodeSignIn({ redirectUrl }: Props) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [safeIdentifier, setSafeIdentifier] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const signInRef = useRef<SignInResource | null>(null)

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])
  const normalizedCode = code.trim()

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setPending(true)
    setError(null)

    const clerk = (window as ClerkWindow).Clerk

    try {
      if (clerk?.user?.id || clerk?.session?.id) {
        throw new Error('already_signed_in')
      }
      if (!clerk?.loaded) {
        throw new Error('clerk_not_ready')
      }

      const signIn = await clerk.client.signIn.create({ identifier: normalizedEmail })
      const factor = signIn.supportedFirstFactors?.find(isEmailCodeFactor)
      if (!factor) {
        throw new Error('email_code_not_enabled')
      }

      const prepared = await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: factor.emailAddressId,
      })
      signInRef.current = prepared
      setSafeIdentifier(factor.safeIdentifier ?? normalizedEmail)
      setStep('code')
    } catch (err) {
      console.error('[EmailCodeSignIn] send code failure', err)
      setError(describeFailure(err, 'Could not send a sign-in code'))
    } finally {
      setPending(false)
    }
  }

  async function verifyCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setPending(true)
    setError(null)

    const clerk = (window as ClerkWindow).Clerk

    try {
      if (!clerk?.loaded) {
        throw new Error('clerk_not_ready')
      }

      const signIn = signInRef.current ?? clerk.client.signIn
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: normalizedCode,
      })

      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error(`email_code_sign_in_${result.status}`)
      }

      await clerk.setActive({ session: result.createdSessionId })
      navigateAfterSignIn(redirectUrl)
    } catch (err) {
      console.error('[EmailCodeSignIn] verify code failure', err)
      setError(describeFailure(err, 'Could not verify the sign-in code'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={PANEL}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Image
          src="/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg"
          alt="AbarVa"
          width={92}
          height={24}
          style={{ display: 'block' }}
          priority
        />
        <div aria-hidden="true" style={{ width: 1, height: 18, background: BRAND.hair }} />
        <div
          style={{
            fontFamily: BRAND.fSans,
            fontSize: 13.5,
            fontWeight: 400,
            color: BRAND.textStrong,
            letterSpacing: '-0.005em',
            lineHeight: 1,
          }}
        >
          <strong style={{ fontWeight: 600 }}>AI</strong> Success Platform
        </div>
      </div>

      <div
        style={{
          color: BRAND.textStrong,
          fontFamily: BRAND.fSerif,
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
          marginBottom: 6,
        }}
      >
        Sign in with a one-time code.
      </div>
      <div
        style={{
          color: BRAND.textMute,
          fontFamily: BRAND.fSans,
          fontSize: 13.5,
          lineHeight: 1.55,
          marginBottom: 22,
        }}
      >
        Enter your approved workspace email. Clerk will email a one-time code to that address.
      </div>

      {step === 'email' ? (
        <form onSubmit={sendCode}>
          <label htmlFor="email-code-email" style={LABEL}>
            Email
          </label>
          <input
            id="email-code-email"
            autoComplete="email"
            inputMode="email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="anand.sundaram+apex@thesundaram.com"
            style={INPUT}
          />

          <button
            type="submit"
            disabled={pending || normalizedEmail.length === 0}
            style={{
              ...BUTTON_PRIMARY,
              opacity: pending || normalizedEmail.length === 0 ? 0.62 : 1,
              marginTop: 18,
            }}
          >
            {pending ? 'Sending code...' : 'Send email code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <div
            style={{
              border: `1px solid ${BRAND.cardBorder}`,
              background: '#FBFAF7',
              borderRadius: 12,
              padding: '12px 14px',
              color: BRAND.textMute,
              fontFamily: BRAND.fSans,
              fontSize: 12.5,
              lineHeight: 1.5,
              marginBottom: 18,
            }}
          >
            We sent a code to <strong style={{ color: BRAND.textStrong }}>{safeIdentifier}</strong>.
          </div>

          <label htmlFor="email-code-code" style={LABEL}>
            One-time code
          </label>
          <input
            id="email-code-code"
            autoComplete="one-time-code"
            inputMode="numeric"
            value={code}
            onChange={event => setCode(event.target.value)}
            placeholder="Enter the code from email"
            style={INPUT}
          />

          <button
            type="submit"
            disabled={pending || normalizedCode.length === 0}
            style={{
              ...BUTTON_PRIMARY,
              opacity: pending || normalizedCode.length === 0 ? 0.62 : 1,
              marginTop: 18,
            }}
          >
            {pending ? 'Verifying...' : 'Continue'}
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              signInRef.current = null
              setStep('email')
              setCode('')
              setError(null)
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: BRAND.textMute,
              fontFamily: BRAND.fSans,
              fontSize: 13,
              cursor: 'pointer',
              marginTop: 14,
              width: '100%',
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      {error ? (
        <div
          role="alert"
          style={{
            marginTop: 18,
            border: '1px solid rgba(180, 58, 46, 0.28)',
            background: '#FFF4F2',
            color: '#8A2F25',
            borderRadius: 10,
            padding: '11px 12px',
            fontFamily: BRAND.fSans,
            fontSize: 12.5,
            lineHeight: 1.45,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          color: BRAND.textFaint,
          fontFamily: BRAND.fSans,
          fontSize: 12,
          lineHeight: 1.5,
          marginTop: 18,
          textAlign: 'center',
        }}
      >
        Each email is mapped to one client workspace. No tenant switcher is used.
      </div>
    </div>
  )
}
