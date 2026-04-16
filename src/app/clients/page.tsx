'use client'
import { useState, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const LBG = '#F8F7F4', LTEXT = '#0C0C0C', LBODY = '#3C3C3C', LMUTE = '#888888', LBDR = '#E2E1DC', LCARD = '#FFFFFF'
const DBG = '#060A12', DTEXT = '#EFF6FF', DBODY = 'rgba(255,255,255,0.74)', DMUTE = 'rgba(255,255,255,0.46)', DBDR = '#1C2D45', DCARD = '#0D1520'
const TEAL = '#2DD4C8', SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

interface Metric { label: string; value: string; sub: string; flag: boolean }
interface Client {
  id: string; name: string; initials: string; sector: string; vertical: string; revenue: string
  painQuote: string; metrics: Metric[]
}

const CLIENTS: Client[] = [
  {
    id: 'meridian', name: 'Meridian Health System', initials: 'MH',
    sector: 'Healthcare · 42,000 employees', vertical: 'Healthcare', revenue: '$11.2B',
    painQuote: '"Our denial rate is 52% above benchmark. Every rejected claim is revenue we earned and cannot collect."',
    metrics: [
      { label: 'Denial rate',      value: '18.2%',   sub: '12.0% benchmark', flag: true  },
      { label: 'Operating margin', value: '1.8%',    sub: '4.0% target',     flag: true  },
      { label: 'Prior auth lag',   value: '4.2 days',sub: '1.8 days peer',   flag: true  },
      { label: 'MyChart adoption', value: '34%',     sub: '60% peer average',flag: true  },
    ],
  },
  {
    id: 'arcturus', name: 'Arcturus Financial Group', initials: 'AF',
    sector: 'Asset Management · 13,000 employees', vertical: 'Financial Services', revenue: '$16.2B',
    painQuote: '"28 AI initiatives. Zero have a baseline. MAS FEAT compliance overdue 4 months. CDO role vacant 11 months."',
    metrics: [
      { label: 'AI with baselines', value: '0 / 28', sub: 'No measurable ROI',      flag: true },
      { label: 'MAS FEAT overdue',  value: '4 mo',   sub: '$2.4B at risk',          flag: true },
      { label: 'CDO vacant',        value: '11 mo',  sub: '14 initiatives blocked', flag: true },
      { label: 'AI maturity score', value: '28/100', sub: '54 peer average',        flag: true },
    ],
  },
]

function ScanLine({ active }: { active: boolean }) {
  return (
    <div style={{
      position: 'absolute' as const, left: 0, right: 0, height: '2px',
      background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)`,
      opacity: active ? 0.5 : 0,
      top: active ? '100%' : '0%',
      transition: active ? 'top 1.2s ease-in-out, opacity 0.2s ease' : 'opacity 0.4s ease',
      pointerEvents: 'none' as const, zIndex: 10,
    }} />
  )
}

function ClientCard({ client, scanDelay, trigger }: { client: Client; scanDelay: number; trigger: number }) {
  const [scanning, setScanning] = useState(false)
  const [metricsVisible, setMetricsVisible] = useState(false)
  const [gapCount, setGapCount] = useState(0)

  useEffect(() => {
    if (trigger === 0) return
    setScanning(false); setMetricsVisible(false); setGapCount(0)
    const t1 = setTimeout(() => setScanning(true), scanDelay)
    const t2 = setTimeout(() => setMetricsVisible(true), scanDelay + 900)
    const t3 = setTimeout(() => setGapCount(client.metrics.filter(m => m.flag).length), scanDelay + 1100)
    const t4 = setTimeout(() => setScanning(false), scanDelay + 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [trigger, scanDelay, client.metrics])

  return (
    <div style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column' as const, gap: 20, position: 'relative' as const, overflow: 'hidden' as const }}>
      <ScanLine active={scanning} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{client.vertical} · {client.revenue}</div>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: DTEXT, lineHeight: 1.2 }}>{client.name}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: TEAL, flexShrink: 0, marginLeft: 16 }}>
          {client.initials}
        </div>
      </div>

      {/* Quote */}
      <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.65, fontStyle: 'italic', borderLeft: `2px solid rgba(45,212,200,0.3)`, paddingLeft: 14 }}>
        {client.painQuote}
      </div>

      {/* Metrics grid — values in white, small dot for gap status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {client.metrics.map((m, i) => (
          <div key={i} style={{
            background: DBG, border: `1px solid ${metricsVisible && m.flag ? 'rgba(239,68,68,0.2)' : DBDR}`,
            borderRadius: 8, padding: '12px 14px',
            opacity: metricsVisible ? 1 : 0, transition: 'opacity 0.4s ease',
          }}>
            <div style={{ fontSize: 10, color: DMUTE, fontFamily: MONO, letterSpacing: '.04em', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: DTEXT, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 10, color: DMUTE, marginTop: 4 }}>{m.sub}</div>
            {metricsVisible && m.flag && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                <span style={{ fontSize: 9, color: DMUTE, fontFamily: MONO }}>gap identified</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontFamily: MONO, color: gapCount > 0 ? DTEXT : DMUTE, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.3s ease' }}>
          {gapCount > 0 ? (
            <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />{gapCount} gaps identified</>
          ) : scanning ? (
            <><span style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, display: 'inline-block' }} />Scanning...</>
          ) : <span style={{ color: 'transparent' }}>—</span>}
        </div>
        <a href={`/sign-in?redirect=/maestro/${client.id}`} style={{ fontSize: 13, fontWeight: 500, color: TEAL, textDecoration: 'none', fontFamily: SANS }}>
          See full intelligence →
        </a>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [trigger, setTrigger] = useState(1)

  return (
    <div style={{ minHeight: '100vh', fontFamily: SANS }}>
      <AbarvaNav activePage="clients" />

      {/* ── HERO ─ light ─────────────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' as const }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 20 }}>
            See it working · No signup required
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, color: LTEXT, margin: '0 0 20px', lineHeight: 1.1 }}>
            Two composite organizations.<br />Real-world data. Live intelligence.
          </h1>
          <p style={{ fontSize: 17, color: LBODY, maxWidth: 600, margin: '0 auto', lineHeight: 1.72 }}>
            Built from real-world datasets across healthcare and financial services. Every metric is real. Every gap is real. Every recommendation is derived from the Genome — AbarVa&apos;s pattern library of what actually works.
          </p>
        </div>
      </div>

      {/* ── CLIENT CARDS ─ dark ───────────────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '72px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 28 }}>
            {CLIENTS.map((client, i) => (
              <ClientCard key={client.id} client={client} scanDelay={[300, 800][i]} trigger={trigger} />
            ))}
          </div>
          <div style={{ textAlign: 'center' as const }}>
            <button onClick={() => setTrigger(t => t + 1)} style={{ background: 'none', border: `1px solid ${DBDR}`, borderRadius: 8, padding: '8px 20px', fontSize: 12, color: DMUTE, fontFamily: MONO, cursor: 'pointer', letterSpacing: '.04em' }}>
              ↺ Replay scan
            </button>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ─ light ──────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '88px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 56 }}>
            {[
              { step: '01', title: 'Connect your data', desc: 'AbarVa maps every system, metric, and gap in your organisation within days.' },
              { step: '02', title: 'Genome matches your situation', desc: 'Pattern library from 340 transformations surfaces what actually moves outcomes.' },
              { step: '03', title: 'Maestros govern delivery', desc: 'Embedded operators hold vendors accountable. Fee tied to verified outcomes only.' },
            ].map(item => (
              <div key={item.step} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 12, padding: 28 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.08em', marginBottom: 14 }}>{item.step}</div>
                <div style={{ fontFamily: SERIF, fontSize: 20, color: LTEXT, marginBottom: 12, lineHeight: 1.3 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: LBODY, lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: LMUTE, textAlign: 'center' as const, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
            These are composite organizations built for demonstration purposes. They are not real companies. Data is modelled from real-world patterns in healthcare and financial services. No confidential client data is used.
          </p>
        </div>
      </div>

    </div>
  )
}
