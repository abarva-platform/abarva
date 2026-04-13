'use client'
import { useState } from 'react'

const S = {
  page: { minHeight: '100vh', background: '#0D1117', fontFamily: 'Inter, -apple-system, sans-serif', color: '#E6EDF3' } as React.CSSProperties,
  section: { maxWidth: '900px', margin: '0 auto', padding: '0 24px' } as React.CSSProperties,
}

function ResultCard({ client, metric, detail, color }: { client: string; metric: string; detail: string; color: string }) {
  return (
    <div style={{
      background: '#161B22',
      border: '1px solid #21262D',
      borderTop: '3px solid ' + color,
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{client}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '4px' }}>{metric}</div>
      <div style={{ fontSize: '13px', color: '#8B949E', lineHeight: 1.5 }}>{detail}</div>
    </div>
  )
}

export default function DemoPage() {
  const [formData, setFormData] = useState({ name: '', title: '', org: '', email: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // In production this would POST to /api/demo-request
    setSubmitted(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: '#161B22',
    border: '1px solid #30363D',
    borderRadius: '8px',
    fontSize: '16px', // 16px prevents iOS zoom
    color: '#E6EDF3',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div style={S.page}>
      {/* Nav */}
      <div style={{ background: '#0D1117', borderBottom: '1px solid #21262D', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>Abar</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 900, color: '#2DD4C8' }}>Va</span>
        </div>
        <a href="/" style={{ fontSize: '13px', color: '#8B949E', textDecoration: 'none' }}>← Back</a>
      </div>

      {/* Hero */}
      <div style={{ padding: '64px 24px 48px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#2DD4C8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Enterprise Intelligence Platform
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 20px 0' }}>
          Enterprise transformation.<br />Accountable for the first time.
        </h1>
        <p style={{ fontSize: '17px', color: '#8B949E', lineHeight: 1.6, margin: 0 }}>
          AbarVa delivers AI-powered intelligence across the entire transformation lifecycle —
          from situation diagnosis to outcome verification. Built for CXOs. Accountable to results.
        </p>
      </div>

      {/* Video placeholder */}
      <div style={{ ...S.section }}>
        <div style={{
          background: '#161B22',
          border: '1px solid #21262D',
          borderRadius: '16px',
          aspectRatio: '16/9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '48px',
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(45,212,200,0.1)', border: '2px solid #2DD4C8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '24px', marginLeft: '4px' }}>▶</span>
          </div>
          <span style={{ fontSize: '14px', color: '#8B949E' }}>3-minute product walkthrough — coming soon</span>
        </div>
      </div>

      {/* Result cards */}
      <div style={{ ...S.section, marginBottom: '64px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: '24px' }}>
          Client intelligence — live data
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <ResultCard
            client="Meridian Health System"
            metric="$94M"
            detail="RCM denial write-offs — recoverable with AI in 90 days. Denial rate 18.2% vs 12.1% benchmark."
            color="#EF4444"
          />
          <ResultCard
            client="First Capital Financial"
            metric="$340M"
            detail="Commercial deposits at risk — FedNow live required in 90 days. FIS HORIZON blocking implementation."
            color="#F59E0B"
          />
          <ResultCard
            client="Apex Retail Group"
            metric="$248M"
            detail="Einstein AI idle — personalization contracted, never activated. 340K duplicate profiles is the only blocker."
            color="#2DD4C8"
          />
        </div>
      </div>

      {/* Request form */}
      <div style={{ ...S.section, marginBottom: '64px' }}>
        <div style={{
          background: '#161B22',
          border: '1px solid #21262D',
          borderRadius: '16px',
          padding: '32px 28px',
          maxWidth: '480px',
          margin: '0 auto',
        }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#2DD4C8', marginBottom: '8px' }}>Request received</div>
              <div style={{ fontSize: '14px', color: '#8B949E' }}>We&apos;ll be in touch within 24 hours to schedule your demo with your organization&apos;s data.</div>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>Request a demo</h2>
              <p style={{ fontSize: '13px', color: '#8B949E', margin: '0 0 24px 0' }}>We&apos;ll load your organization&apos;s data before the session. No slide decks.</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input
                  required
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#2DD4C8'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#30363D'}
                />
                <input
                  required
                  type="text"
                  placeholder="Title (e.g. CIO, CFO)"
                  value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#2DD4C8'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#30363D'}
                />
                <input
                  required
                  type="text"
                  placeholder="Organization"
                  value={formData.org}
                  onChange={e => setFormData(f => ({ ...f, org: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#2DD4C8'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#30363D'}
                />
                <input
                  required
                  type="email"
                  placeholder="Work email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#2DD4C8'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#30363D'}
                />
                <button
                  type="submit"
                  style={{
                    padding: '14px',
                    background: '#2DD4C8',
                    color: '#0D1117',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  Request demo →
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Download one-pager */}
      <div style={{ textAlign: 'center', padding: '0 24px 64px' }}>
        <a
          href="/abarva-overview.pdf"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#8B949E',
            textDecoration: 'none',
            border: '1px solid #30363D',
            borderRadius: '8px',
            padding: '10px 20px',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#E6EDF3'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#4B5563' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#8B949E'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#30363D' }}
        >
          ↓ Download one-pager
        </a>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #21262D', padding: '24px', textAlign: 'center', fontSize: '13px', color: '#8B949E' }}>
        <a href="mailto:anand@abarva.ai" style={{ color: '#8B949E', textDecoration: 'none' }}>anand@abarva.ai</a>
        {' · '}
        <a href="/" style={{ color: '#8B949E', textDecoration: 'none' }}>AbarVa Intelligence Platform</a>
      </div>
    </div>
  )
}
