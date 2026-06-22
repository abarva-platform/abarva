'use client'

import Image from 'next/image'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'

interface Props {
  redirectUrl: string
}

interface ClerkErrorLike {
  errors?: Array<{ code?: string; message?: string; longMessage?: string }>
  message?: string
  status?: number
}

interface ClerkWindow extends Window {
  Clerk?: {
    loaded?: boolean
    user?: { id?: string } | null
    session?: { id?: string } | null
    signOut?: () => Promise<void>
    client: {
      signIn: {
        create: (
          params: { strategy: 'ticket'; ticket: string } | { identifier: string },
        ) => Promise<SignInResourceLike>
        prepareFirstFactor?: (params: { strategy: 'email_code'; emailAddressId: string }) => Promise<SignInResourceLike>
        attemptFirstFactor?: (params: { strategy: 'email_code'; code: string }) => Promise<SignInResourceLike>
      } & SignInResourceLike
    }
    setActive: (params: { session?: string | null }) => Promise<void>
  }
}

interface SignInResourceLike {
  status?: string | null
  createdSessionId?: string | null
  supportedFirstFactors?: Array<{
    strategy?: string
    emailAddressId?: string
    safeIdentifier?: string
    primary?: boolean
  }> | null
  prepareFirstFactor?: (params: { strategy: 'email_code'; emailAddressId: string }) => Promise<SignInResourceLike>
  attemptFirstFactor?: (params: { strategy: 'email_code'; code: string }) => Promise<{
    status: string
    createdSessionId?: string | null
  }>
}

function describeFailure(err: unknown, alreadySignedIn: boolean): string {
  if (alreadySignedIn) {
    return 'You appear to be signed in already. Click "Sign out" in the top bar, then retry.'
  }
  const message = err instanceof Error ? err.message : String(err ?? 'demo_sign_in_failed')
  if (message === 'invalid_credentials') {
    return 'We could not verify that email, password, and access code. Check the private invite and try again.'
  }
  if (message === 'access_not_provisioned') {
    return 'This email is not provisioned for launch access yet. Use Request access from the public page or ask your AbarVa admin.'
  }
  if (message === 'demo_user_not_found') {
    return 'The demo user record is missing in Clerk. Ask Anand to re-run /api/admin/seed-clerk-metadata.'
  }
  if (message === 'clerk_not_configured') {
    return 'Server is missing CLERK_SECRET_KEY. Ask Anand to check Vercel env vars.'
  }
  if (message === 'clerk_not_ready') {
    return 'Clerk JS did not finish loading. Refresh the page and retry.'
  }
  if (message === 'email_code_unavailable') {
    return 'This identity is not configured for email-code sign-in. Try the private demo credentials, or ask your AbarVa admin to verify the Clerk account.'
  }
  if (message === 'email_code_session_missing') {
    return 'The email-code session expired. Send a fresh code and try again.'
  }
  if (message.startsWith('ticket_sign_in_')) {
    const status = message.slice('ticket_sign_in_'.length)
    return `Clerk did not finalize the session (status: ${status}). Refresh and retry.`
  }
  const clerkError = (err as ClerkErrorLike)?.errors?.[0]
  if (clerkError?.message || clerkError?.longMessage) {
    const detail = clerkError.longMessage ?? clerkError.message
    if (clerkError.code === 'rate_limit_exceeded' || /rate limit/i.test(detail ?? '')) {
      return 'Clerk dev-instance rate limit hit. Wait ~30 seconds and retry.'
    }
    return `Clerk error: ${detail ?? clerkError.code ?? 'unknown'}.`
  }
  if (/network|fetch|failed/i.test(message)) {
    return `Network error during sign-in. Check connectivity and retry. (raw: ${message})`
  }
  return `Sign-in failed (raw: ${message}). Open DevTools console for details.`
}

// ─── Brand-locked tokens ─────────────────────────────────────────────
const BRAND = {
  ink: '#000000',
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

type SignInMode = 'email' | 'demo'

export function DemoCodeSignIn({ redirectUrl }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<SignInMode>('email')
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])
  const canSubmitDemo = normalizedEmail.length > 0 && password.length > 0 && code.trim().length > 0
  const canSendEmailCode = normalizedEmail.length > 0
  const canVerifyEmailCode = normalizedEmail.length > 0 && code.trim().length > 0

  async function sendEmailCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!canSendEmailCode || pending) return

    setPending(true)
    setError(null)

    const clerk = (window as ClerkWindow).Clerk
    const alreadySignedIn = Boolean(clerk?.user?.id || clerk?.session?.id)

    try {
      if (alreadySignedIn) {
        throw new Error('already_signed_in')
      }
      if (!clerk?.loaded) {
        throw new Error('clerk_not_ready')
      }

      const eligibility = await fetch('/api/auth/access-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })
      if (!eligibility.ok) {
        const payload = (await eligibility.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || 'access_not_provisioned')
      }

      const signIn = await clerk.client.signIn.create({ identifier: normalizedEmail })
      const emailFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code' && factor.emailAddressId,
      )

      if (!emailFactor?.emailAddressId) {
        throw new Error('email_code_unavailable')
      }

      const prepare = signIn.prepareFirstFactor ?? clerk.client.signIn.prepareFirstFactor
      if (!prepare) {
        throw new Error('email_code_unavailable')
      }

      await prepare({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      })

      setEmailCodeSent(true)
      setSentTo(emailFactor.safeIdentifier ?? normalizedEmail)
      setCode('')
    } catch (err) {
      console.error('[DemoCodeSignIn] email-code send failure', err)
      const isAlreadySignedIn = err instanceof Error && err.message === 'already_signed_in'
      setError(describeFailure(err, isAlreadySignedIn))
    } finally {
      setPending(false)
    }
  }

  async function completeEmailCodeSignIn(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!canVerifyEmailCode || pending) return

    setPending(true)
    setError(null)

    const clerk = (window as ClerkWindow).Clerk
    const alreadySignedIn = Boolean(clerk?.user?.id || clerk?.session?.id)

    try {
      if (alreadySignedIn) {
        throw new Error('already_signed_in')
      }
      if (!clerk?.loaded) {
        throw new Error('clerk_not_ready')
      }

      const attempt = clerk.client.signIn.attemptFirstFactor
      if (!attempt) {
        throw new Error('email_code_session_missing')
      }

      const result = await attempt({
        strategy: 'email_code',
        code: code.trim(),
      })

      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error(`ticket_sign_in_${result.status ?? 'unknown'}`)
      }

      await clerk.setActive({ session: result.createdSessionId })
      window.location.assign(redirectUrl)
    } catch (err) {
      console.error('[DemoCodeSignIn] email-code verification failure', err)
      const isAlreadySignedIn = err instanceof Error && err.message === 'already_signed_in'
      setError(describeFailure(err, isAlreadySignedIn))
    } finally {
      setPending(false)
    }
  }

  async function completeDemoSignIn(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!canSubmitDemo || pending) return

    setPending(true)
    setError(null)

    const clerk = (window as ClerkWindow).Clerk
    const alreadySignedIn = Boolean(clerk?.user?.id || clerk?.session?.id)

    try {
      if (alreadySignedIn) {
        throw new Error('already_signed_in')
      }

      const response = await fetch('/api/auth/demo-code-sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, code }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string; ticket?: string } | null
      if (!response.ok || !payload?.ticket) {
        throw new Error(payload?.error || 'demo_sign_in_failed')
      }

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
      console.error('[DemoCodeSignIn] failure', err)
      const isAlreadySignedIn = err instanceof Error && err.message === 'already_signed_in'
      setError(describeFailure(err, isAlreadySignedIn))
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={PANEL}>
      {/* Brand block · canonical inverse logo + AI Success Platform */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Image
          src="/brand/abarva-logo.svg"
          alt="AbarVa"
          width={29}
          height={24}
          style={{ height: 24, width: 'auto', display: 'block' }}
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

      {/* Headline */}
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
        Sign in to your workspace.
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
        Enter your workspace email and we will send a one-time access code.
      </div>

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
          marginBottom: 20,
        }}
      >
        Invite-only workspace. Your email must already be provisioned for a client workspace.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 18,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setMode('email')
            setError(null)
            setPassword('')
            setCode('')
          }}
          style={{
            border: `1px solid ${mode === 'email' ? BRAND.signalBlue : BRAND.cardBorder}`,
            background: mode === 'email' ? BRAND.signalBlue : '#FBFAF7',
            color: mode === 'email' ? '#FFFFFF' : BRAND.textStrong,
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: BRAND.fSans,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Email code
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('demo')
            setError(null)
            setEmailCodeSent(false)
            setSentTo(null)
            setCode('')
          }}
          style={{
            border: `1px solid ${mode === 'demo' ? BRAND.signalBlue : BRAND.cardBorder}`,
            background: mode === 'demo' ? BRAND.signalBlue : '#FBFAF7',
            color: mode === 'demo' ? '#FFFFFF' : BRAND.textStrong,
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: BRAND.fSans,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Demo invite
        </button>
      </div>

      <form
        onSubmit={mode === 'email' ? (emailCodeSent ? completeEmailCodeSignIn : sendEmailCode) : completeDemoSignIn}
        style={{ display: 'grid', gap: 14 }}
      >
        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: BRAND.hair,
            marginBottom: 2,
          }}
        />

        <div>
          <label htmlFor="demo-email" style={LABEL}>
            Email
          </label>
          <input
            id="demo-email"
            placeholder="name@company.com"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={INPUT}
            disabled={pending}
            required
          />
        </div>

        {mode === 'demo' && (
          <div>
            <label htmlFor="demo-password" style={LABEL}>
              Password
            </label>
            <input
              id="demo-password"
              placeholder="Password from invite"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={INPUT}
              disabled={pending}
              required
            />
          </div>
        )}

        {(mode === 'demo' || emailCodeSent) && (
          <div>
            <label htmlFor="demo-code" style={LABEL}>
              Access code
            </label>
            <input
              id="demo-code"
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              style={INPUT}
              disabled={pending}
              required
            />
          </div>
        )}

        {mode === 'email' && emailCodeSent && (
          <div
            style={{
              borderRadius: 8,
              border: '1px solid rgba(14, 138, 101, 0.22)',
              background: '#F0FDF8',
              color: '#115E59',
              padding: '10px 12px',
              fontSize: 12.5,
              lineHeight: 1.45,
              fontFamily: BRAND.fSans,
            }}
          >
            Code sent to {sentTo}. Enter it below to continue.
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              borderRadius: 8,
              border: '1px solid rgba(248, 113, 113, 0.35)',
              background: '#FFF1F1',
              color: '#8A1F1F',
              padding: '11px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              fontFamily: BRAND.fSans,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            ...BUTTON_PRIMARY,
            opacity:
              pending ||
              (mode === 'email' && !emailCodeSent && !canSendEmailCode) ||
              (mode === 'email' && emailCodeSent && !canVerifyEmailCode) ||
              (mode === 'demo' && !canSubmitDemo)
                ? 0.62
                : 1,
            cursor:
              pending ||
              (mode === 'email' && !emailCodeSent && !canSendEmailCode) ||
              (mode === 'email' && emailCodeSent && !canVerifyEmailCode) ||
              (mode === 'demo' && !canSubmitDemo)
                ? 'not-allowed'
                : 'pointer',
          }}
          disabled={
            pending ||
            (mode === 'email' && !emailCodeSent && !canSendEmailCode) ||
            (mode === 'email' && emailCodeSent && !canVerifyEmailCode) ||
            (mode === 'demo' && !canSubmitDemo)
          }
        >
          {pending
            ? emailCodeSent
              ? 'Verifying...'
              : 'Sending code...'
            : mode === 'email'
              ? emailCodeSent
                ? 'Sign in'
                : 'Send code'
              : 'Sign in'}
        </button>

        {mode === 'email' && emailCodeSent && (
          <button
            type="button"
            onClick={() => {
              setEmailCodeSent(false)
              setSentTo(null)
              setCode('')
              setError(null)
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: BRAND.textMute,
              fontFamily: BRAND.fSans,
              fontSize: 12.5,
              cursor: 'pointer',
              padding: 2,
            }}
          >
            Use a different email
          </button>
        )}
      </form>
    </div>
  )
}
