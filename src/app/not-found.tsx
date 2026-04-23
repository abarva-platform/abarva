import Link from 'next/link'
import { headers } from 'next/headers'

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
        {/* Neural node SVG logo */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <line x1="16" y1="16" x2="16" y2="6"    stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="24.7" y2="11"  stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="24.7" y2="21"  stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="16" y2="26"   stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="7.3" y2="21"  stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="7.3" y2="11"  stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <circle cx="16"   cy="6"  r="2.2" fill="#60A5FA" />
            <circle cx="24.7" cy="11" r="2.2" fill="#60A5FA" />
            <circle cx="24.7" cy="21" r="2.2" fill="#60A5FA" />
            <circle cx="16"   cy="26" r="2.2" fill="#60A5FA" />
            <circle cx="7.3"  cy="21" r="2.2" fill="#60A5FA" />
            <circle cx="7.3"  cy="11" r="2.2" fill="#60A5FA" />
            <circle cx="16" cy="16" r="5.5" fill="#14B8A6" />
          </svg>
        </div>

        {/* AbarVA wordmark */}
        <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontWeight: 900, fontSize: '22px', letterSpacing: '-0.02em', marginBottom: '24px' }}>
          <span style={{ color: '#F0F6FF' }}>Abar</span><span style={{ color: '#14B8A6' }}>VA</span>
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

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #2DD4C8', color: '#2DD4C8', fontSize: '14px', fontWeight: 600, textDecoration: 'none', background: 'transparent' }}>
            ← Go Home
          </Link>
          <Link href="/investor" style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #2DD4C8', color: '#0D1117', fontSize: '14px', fontWeight: 600, textDecoration: 'none', background: '#2DD4C8' }}>
            Open Investor View →
          </Link>
        </div>
      </div>
    </div>
  )
}
