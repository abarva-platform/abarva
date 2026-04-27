import Link from 'next/link'
import { headers } from 'next/headers'
import { AbarVaLogo } from '@/components/abarva/AbarVaLogo'

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
    <div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <AbarVaLogo
            size="lg"
            width={120}
            height={40}
            style={{ filter: 'brightness(0) invert(1)' }}
            aria-hidden={false}
            label="AbarVa wordmark"
          />
        </div>

        {/* 404 */}
        <div style={{ fontSize: '96px', fontWeight: 800, color: '#14B8A6', fontFamily: "'IBM Plex Mono', 'Courier New', monospace", lineHeight: 1, marginBottom: '24px' }}>
          404
        </div>

        {/* Message */}
        <div style={{ fontSize: '20px', color: '#E6EDF3', marginBottom: '12px', fontWeight: 500 }}>
          This page does not exist.
        </div>
        <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '40px', lineHeight: 1.6 }}>
          The intelligence you are looking for may have moved.
        </div>

        {/* Buttons · P0-2 · Investor CTA removed · inappropriate for an
            operating-system product surfaced to customers. Keep the single
            Go Home path and offer the other canonical authenticated
            surfaces. */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/home" style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #2DD4C8', color: '#2DD4C8', fontSize: '14px', fontWeight: 600, textDecoration: 'none', background: 'transparent' }}>
            ← Go Home
          </Link>
          <Link href="/preview/programs" style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.16)', color: '#E6EDF3', fontSize: '14px', fontWeight: 600, textDecoration: 'none', background: 'transparent' }}>
            Programs
          </Link>
          <Link href="/preview/tower" style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.16)', color: '#E6EDF3', fontSize: '14px', fontWeight: 600, textDecoration: 'none', background: 'transparent' }}>
            Control Tower
          </Link>
        </div>
      </div>
    </div>
  )
}
