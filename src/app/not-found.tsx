import Link from 'next/link'
import { headers } from 'next/headers'
import { SHELL } from '@/lib/shell/shell-tokens'

// Production 404 monitoring · §3.5 of page-agent-coherence-work-order.md.
// Logs every 404 via console.error so Vercel runtime captures it.
// Alert thresholds (>3 distinct 404s / 10 min) configured in Vercel's
// observability UI, not here.

export const dynamic = 'force-dynamic'

export default async function NotFound() {
  try {
    const h = await headers()
    const referrer = h.get('referer') ?? 'direct'
    const ua = (h.get('user-agent') ?? 'unknown').slice(0, 80)
    const path = h.get('x-nextjs-route') ?? h.get('x-matched-path') ?? 'unknown'
    console.error(`[404] path=${path} referrer=${referrer} ua=${ua} ts=${new Date().toISOString()}`)
  } catch {
    // silent if headers() unavailable
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: SHELL.PAPER,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SHELL.SANS,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px 24px', position: 'relative' }}>
        {/* Brand mark */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            fontWeight: 700,
            color: SHELL.INK,
            marginBottom: 32,
            letterSpacing: '-0.01em',
          }}
        >
          AbarVa
        </div>

        {/* Decorative 404 */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 72,
            fontWeight: 700,
            color: SHELL.INK,
            opacity: 0.12,
            lineHeight: 1,
            marginBottom: 24,
            userSelect: 'none',
          }}
          aria-hidden
        >
          404
        </div>

        {/* Heading */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 700,
            color: SHELL.INK,
            marginBottom: 10,
            letterSpacing: '-0.01em',
          }}
        >
          Page not found
        </div>

        {/* Sub-copy */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_MUTED,
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </div>

        {/* Action links */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SHELL.INK,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: 'transparent',
              padding: '9px 18px',
              borderRadius: 20,
              textDecoration: 'none',
            }}
          >
            Go to root
          </Link>
          <Link
            href="/home"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SHELL.PAPER,
              background: SHELL.INK,
              border: `1px solid ${SHELL.INK}`,
              padding: '9px 18px',
              borderRadius: 20,
              textDecoration: 'none',
            }}
          >
            Go to home
          </Link>
        </div>
      </div>

      {/* Footer trace */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        At · Atlas · Route not found
      </div>
    </div>
  )
}
