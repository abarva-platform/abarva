'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { DEMO_CODE_ALLOWED_EMAILS, DEMO_CODE_VALUE, isDemoCodeEmail } from '@/lib/auth/demo-code'

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
        create: (params: { strategy: 'ticket'; ticket: string }) => Promise<{
          status: string
          createdSessionId?: string | null
        }>
      }
    }
    setActive: (params: { session?: string | null }) => Promise<void>
  }
}

// ─── Client identity cards (one per admin) ───────────────────────────
// Surfaces a human-readable label per demo identity instead of the
// cryptic *.example.com email. Keyed off the same canonical roster
// as DEMO_CODE_ALLOWED_EMAILS — if the roster changes, this map
// degrades gracefully (unknown emails still show the raw address).
interface ClientIdentity {
  email: string
  name: string
  tenant: string
  role: string
  monogramBg: string
  initials: string
}

const CLIENT_IDENTITIES: ReadonlyArray<ClientIdentity> = [
  {
    email: 'nina.patel@meridian-health.example.com',
    name: 'Nina Patel',
    tenant: 'Meridian Health System',
    role: 'CIO · Tenant admin',
    monogramBg: '#0E8A65', // Meridian teal (tenant theme, not chrome)
    initials: 'NP',
  },
  {
    email: 'maya.desai@apex-retail.example.com',
    name: 'Maya Desai',
    tenant: 'Apex Retail Group',
    role: 'CDO · Tenant admin',
    monogramBg: '#C2410C', // Apex orange
    initials: 'MD',
  },
  {
    email: 'ethan.brooks@firstcapital.example.com',
    name: 'Ethan Brooks',
    tenant: 'First Capital',
    role: 'CTO · Tenant admin',
    monogramBg: '#1E3A8A', // FirstCap navy
    initials: 'EB',
  },
]

function describeFailure(err: unknown, alreadySignedIn: boolean): string {
  if (alreadySignedIn) {
    return 'You appear to be signed in already. Click "Sign out" in the top bar, then retry.'
  }
  const message = err instanceof Error ? err.message : String(err ?? 'demo_sign_in_failed')
  if (message === 'unsupported_demo_account') {
    return 'That email is not on the approved client list.'
  }
  if (message === 'invalid_demo_code') {
    return `That code was not accepted. Use ${DEMO_CODE_VALUE} for an approved demo account.`
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
  signalBlue: '#0066CC',
  hair: 'rgba(255,255,255,0.10)',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.12)',
  cardHover: 'rgba(255,255,255,0.07)',
  textStrong: '#F5F7FB',
  textMute: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.55)',
  fSans: 'Inter, system-ui, sans-serif',
  fMono: '"JetBrains Mono", ui-monospace, monospace',
  fSerif: 'Fraunces, Georgia, serif',
}

const PANEL = {
  width: '100%',
  maxWidth: 460,
  border: `1px solid ${BRAND.cardBorder}`,
  background: 'rgba(7, 14, 24, 0.92)',
  borderRadius: 16,
  padding: '32px',
  boxShadow: '0 24px 70px rgba(0, 0, 0, 0.45)',
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
  background: 'rgba(255, 255, 255, 0.03)',
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
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  // Filter identity cards down to those still in the canonical roster,
  // so removing an email from the roster also removes its card here.
  const identities = useMemo(
    () =>
      CLIENT_IDENTITIES.filter((id) =>
        DEMO_CODE_ALLOWED_EMAILS.includes(id.email as (typeof DEMO_CODE_ALLOWED_EMAILS)[number]),
      ),
    [],
  )

  async function continueWithCode() {
    setError(null)
    if (!isDemoCodeEmail(normalizedEmail)) {
      setError('This sign-in is restricted to the approved client accounts listed below.')
      return
    }
    setStep('code')
  }

  async function completeDemoSignIn() {
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
        body: JSON.stringify({ email: normalizedEmail, code }),
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
          src="/brand/abarva-logo-inverse.svg"
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
        Choose your client profile or enter your email, then verify with code{' '}
        <code
          style={{
            fontFamily: BRAND.fMono,
            background: BRAND.card,
            padding: '2px 7px',
            borderRadius: 4,
            color: BRAND.textStrong,
            fontSize: 12.5,
          }}
        >
          {DEMO_CODE_VALUE}
        </code>
        .
      </div>

      {/* Identity cards — one per client admin */}
      {step === 'email' && (
        <div
          aria-label="Approved client accounts"
          style={{ display: 'grid', gap: 8, marginBottom: 22 }}
        >
          {identities.map((id) => {
            const isSelected = normalizedEmail === id.email
            return (
              <button
                key={id.email}
                type="button"
                onClick={() => {
                  setEmail(id.email)
                  setError(null)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px solid ${isSelected ? BRAND.signalBlue : BRAND.cardBorder}`,
                  background: isSelected ? 'rgba(0,102,204,0.10)' : BRAND.card,
                  color: BRAND.textStrong,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 140ms ease, background 140ms ease',
                  fontFamily: BRAND.fSans,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = BRAND.cardHover
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = BRAND.card
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: id.monogramBg,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: BRAND.fSans,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.02em',
                  }}
                >
                  {id.initials}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: BRAND.textStrong,
                      lineHeight: 1.25,
                      marginBottom: 2,
                    }}
                  >
                    {id.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: BRAND.textMute,
                      lineHeight: 1.3,
                    }}
                  >
                    {id.tenant} · {id.role}
                  </div>
                </div>
                {isSelected && (
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      fontFamily: BRAND.fMono,
                      fontSize: 11,
                      color: BRAND.signalBlue,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Email + code inputs */}
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label htmlFor="demo-email" style={LABEL}>
            Email
          </label>
          <input
            id="demo-email"
            placeholder="name@company.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={INPUT}
            disabled={pending || step === 'code'}
          />
        </div>

        {step === 'code' && (
          <div>
            <label htmlFor="demo-code" style={LABEL}>
              Verification code
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
              autoFocus
            />
          </div>
        )}

        {error && (
          <div
            style={{
              borderRadius: 8,
              border: '1px solid rgba(248, 113, 113, 0.35)',
              background: 'rgba(127, 29, 29, 0.18)',
              color: '#FECACA',
              padding: '11px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              fontFamily: BRAND.fSans,
            }}
          >
            {error}
          </div>
        )}

        {step === 'code' ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <button
              type="button"
              style={BUTTON_PRIMARY}
              onClick={completeDemoSignIn}
              disabled={pending || code.trim().length === 0}
            >
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
                color: BRAND.textMute,
                cursor: 'pointer',
                padding: 0,
                justifySelf: 'start',
                fontSize: 12.5,
                fontFamily: BRAND.fSans,
                textDecoration: 'underline',
              }}
            >
              Change email
            </button>
          </div>
        ) : (
          <button
            type="button"
            style={BUTTON_PRIMARY}
            onClick={continueWithCode}
            disabled={pending || normalizedEmail.length === 0}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
