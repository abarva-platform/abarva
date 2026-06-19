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

interface EmailCodeFactorLike {
  strategy: string
  emailAddressId?: string
  safeIdentifier?: string
}

interface SignInResourceLike {
  status?: string | null
  createdSessionId?: string | null
  supportedFirstFactors?: EmailCodeFactorLike[] | null
  create: (params: { identifier: string }) => Promise<SignInResourceLike>
  prepareFirstFactor: (params: { strategy: 'email_code'; emailAddressId?: string }) => Promise<SignInResourceLike>
  attemptFirstFactor: (params: { strategy: 'email_code'; code: string }) => Promise<SignInResourceLike>
}

interface ClerkWindow extends Window {
  Clerk?: {
    loaded?: boolean
    user?: { id?: string } | null
    session?: { id?: string } | null
    signOut?: () => Promise<void>
    client: {
      signIn: SignInResourceLike
    }
    setActive: (params: { session?: string | null }) => Promise<void>
  }
}

function describeFailure(err: unknown, alreadySignedIn: boolean): string {
  if (alreadySignedIn) {
    return 'You appear to be signed in already. Click "Sign out" in the top bar, then retry.'
  }
  const message = err instanceof Error ? err.message : String(err ?? 'demo_sign_in_failed')
  if (message === 'invalid_credentials') {
    return 'We could not start sign-in for that email. Check the private invite and try again.'
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
  if (message === 'email_code_not_available') {
    return 'This invited identity is not configured for email-code sign-in. Ask Anand to re-check the Clerk user.'
  }
  if (message.startsWith('ticket_sign_in_')) {
    const status = message.slice('ticket_sign_in_'.length)
    return `Clerk did not finalize the session (status: ${status}). Refresh and retry.`
  }
  if (message.startsWith('email_code_sign_in_')) {
    const status = message.slice('email_code_sign_in_'.length)
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

export function DemoCodeSignIn({ redirectUrl }: Props) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState<'email' | 'code'>('email')
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])
  const canSubmit = phase === 'email' ? normalizedEmail.length > 0 : code.trim().length > 0

  async function completeDemoSignIn(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
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

      if (phase === 'email') {
        const signIn = await clerk.client.signIn.create({ identifier: normalizedEmail })
        const emailFactor = signIn.supportedFirstFactors?.find((factor) => factor.strategy === 'email_code')
        if (!emailFactor) {
          throw new Error('email_code_not_available')
        }

        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        })
        setSentTo(emailFactor.safeIdentifier || normalizedEmail)
        setPhase('code')
        return
      }

      const result = await clerk.client.signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      })

      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error(`email_code_sign_in_${result.status}`)
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
          width={92}
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
        Enter your approved email. We will send a one-time code to continue.
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
        Invite-only workspace. Approved client identities receive a fresh sign-in code by email.
      </div>

      <form onSubmit={completeDemoSignIn} style={{ display: 'grid', gap: 14 }}>
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
            disabled={pending || phase === 'code'}
            required
          />
        </div>

        {phase === 'code' && (
          <div>
            <label htmlFor="demo-code" style={LABEL}>
              Email code
            </label>
            <input
              id="demo-code"
              placeholder="Enter code from email"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              style={INPUT}
              disabled={pending}
              required
            />
            <div
              style={{
                marginTop: 8,
                color: BRAND.textMute,
                fontFamily: BRAND.fSans,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              Code sent to {sentTo || normalizedEmail}.{' '}
              <button
                type="button"
                onClick={() => {
                  setPhase('email')
                  setCode('')
                  setSentTo('')
                  setError(null)
                }}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: BRAND.signalBlue,
                  padding: 0,
                  fontFamily: BRAND.fSans,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Use a different email
              </button>
            </div>
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
            opacity: pending || !canSubmit ? 0.62 : 1,
            cursor: pending || !canSubmit ? 'not-allowed' : 'pointer',
          }}
          disabled={pending || !canSubmit}
        >
          {pending ? (phase === 'email' ? 'Sending code...' : 'Verifying...') : (phase === 'email' ? 'Send code' : 'Sign in')}
        </button>
      </form>
    </div>
  )
}
