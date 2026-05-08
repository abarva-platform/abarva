'use client'
import Link from 'next/link'
import AbarvaNav from '@/components/AbarvaNav'

const BG     = '#F8F7F4'
const CARD   = '#FFFFFF'
const BORDER = '#E2E1DC'
const TEXT   = '#0C0C0C'
const MUTED  = '#3C3C3C'
const DIM    = '#888888'
const TEAL   = '#14B8A6'
const SERIF  = 'Fraunces, Georgia, serif'
const SANS   = 'DM Sans, sans-serif'
const MONO   = 'JetBrains Mono, monospace'

export default function DemoExploreDisabledPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS }}>
      <AbarvaNav activePage="demo" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '48px 44px' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 18 }}>
            Demo · Temporarily Offline
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 700, color: TEXT, lineHeight: 1.15, margin: '0 0 18px' }}>
            Explore mode is paused while we rebuild the demo.
          </h1>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6, margin: '0 0 32px' }}>
            The platform is live — head to <Link href="/platform" style={{ color: TEXT, textDecoration: 'underline' }}>/platform</Link> to look around, or sign in to your client workspace.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/platform" style={{ background: TEXT, color: '#fff', fontSize: 14, fontWeight: 600, padding: '11px 22px', borderRadius: 6, textDecoration: 'none' }}>
              Explore the platform →
            </Link>
            <Link href="/" style={{ background: 'transparent', color: TEXT, fontSize: 14, fontWeight: 600, padding: '10px 22px', borderRadius: 6, border: `1px solid ${TEXT}`, textDecoration: 'none' }}>
              ← Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
