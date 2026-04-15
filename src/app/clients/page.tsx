'use client'
import { useState, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = '#94A3B8'
const AMBER = '#F59E0B', RED = '#EF4444', GREEN = '#34D399'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

interface Metric {
  label: string
  value: string
  sub: string
  flag: boolean
}

interface Client {
  id: string
  name: string
  sector: string
  hq: string
  employees: string
  accentColor: string
  painQuote: string
  metrics: Metric[]
}

const CLIENTS: Client[] = [
  {
    id: 'meridian',
    name: 'Meridian Health',
    sector: 'Healthcare · 42,000 employees',
    hq: 'Charlotte, NC',
    employees: '42,000',
    accentColor: TEAL,
    painQuote: '"Our denial rate is 52% above benchmark. Every rejected claim is revenue we earned and cannot collect."',
    metrics: [
      { label: 'Denial rate',        value: '18.2%',  sub: '12.0% benchmark',    flag: true  },
      { label: 'Operating margin',   value: '1.8%',   sub: '4.0% target',        flag: true  },
      { label: 'Prior auth lag',     value: '4.2 days', sub: '1.8 days peer',    flag: true  },
      { label: 'MyChart adoption',   value: '34%',    sub: '60% peer average',   flag: true  },
    ],
  },
  {
    id: 'arcturus',
    name: 'Arcturus Financial',
    sector: 'Asset Management · 13,000 employees',
    hq: 'Singapore / London / New York',
    employees: '13,000',
    accentColor: AMBER,
    painQuote: '"28 AI initiatives. Zero have a baseline. MAS FEAT compliance overdue 4 months. CDO role vacant 11 months."',
    metrics: [
      { label: 'AI with baselines',  value: '0 / 28', sub: 'No measurable ROI',   flag: true  },
      { label: 'MAS FEAT overdue',   value: '4 mo',   sub: '$2.4B at risk',        flag: true  },
      { label: 'CDO vacant',         value: '11 mo',  sub: '14 initiatives blocked', flag: true },
      { label: 'AI maturity score',  value: '28/100', sub: '54 peer average',      flag: true  },
    ],
  },
]

function MetricCard({ metric, visible, accentColor }: { metric: Metric; visible: boolean; accentColor: string }) {
  return (
    <div style={{
      background: BG,
      border: `1px solid ${visible && metric.flag ? 'rgba(239,68,68,0.3)' : BORDER}`,
      borderRadius: '8px',
      padding: '12px 14px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>
      <div style={{ fontSize: '10px', color: MUTED, fontFamily: MONO, letterSpacing: '.04em', marginBottom: '4px' }}>
        {metric.label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: visible && metric.flag ? RED : accentColor, fontFamily: MONO, lineHeight: 1 }}>
        {metric.value}
      </div>
      <div style={{ fontSize: '10px', color: MUTED, fontFamily: SANS, marginTop: '4px' }}>
        {metric.sub}
      </div>
      {visible && metric.flag && (
        <div style={{
          marginTop: '6px',
          fontSize: '9px',
          color: RED,
          fontFamily: MONO,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: RED, display: 'inline-block' }} />
          GAP IDENTIFIED
        </div>
      )}
    </div>
  )
}

function ScanLine({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{
      position: 'absolute' as const,
      left: 0,
      right: 0,
      height: '2px',
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      opacity: active ? 0.6 : 0,
      top: active ? '100%' : '0%',
      transition: active ? 'top 1.2s ease-in-out, opacity 0.2s ease' : 'opacity 0.4s ease',
      pointerEvents: 'none' as const,
      zIndex: 10,
    }} />
  )
}

function ClientCard({ client, scanDelay, trigger }: { client: Client; scanDelay: number; trigger: number }) {
  const [scanning, setScanning] = useState(false)
  const [metricsVisible, setMetricsVisible] = useState(false)
  const [gapCount, setGapCount] = useState(0)

  useEffect(() => {
    if (trigger === 0) return
    setScanning(false)
    setMetricsVisible(false)
    setGapCount(0)

    const t1 = setTimeout(() => setScanning(true), scanDelay)
    const t2 = setTimeout(() => { setMetricsVisible(true) }, scanDelay + 900)
    const t3 = setTimeout(() => { setGapCount(client.metrics.filter(m => m.flag).length) }, scanDelay + 1100)
    const t4 = setTimeout(() => setScanning(false), scanDelay + 1400)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [trigger, scanDelay, client.metrics])

  const flagCount = client.metrics.filter(m => m.flag).length

  return (
    <div style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: '16px',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    }}>
      <ScanLine active={scanning} color={client.accentColor} />

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: client.accentColor,
          }} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: WHITE, fontFamily: SANS }}>{client.name}</span>
        </div>
        <div style={{ fontSize: '11px', color: MUTED, fontFamily: MONO, letterSpacing: '.03em' }}>{client.sector}</div>
      </div>

      {/* Pain quote */}
      <div style={{
        fontSize: '12px',
        color: MUTED,
        fontFamily: SANS,
        lineHeight: 1.6,
        fontStyle: 'italic',
        borderLeft: `2px solid ${client.accentColor}`,
        paddingLeft: '12px',
      }}>
        {client.painQuote}
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {client.metrics.map((m, i) => (
          <MetricCard key={i} metric={m} visible={metricsVisible} accentColor={client.accentColor} />
        ))}
      </div>

      {/* Gap status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: '11px',
          fontFamily: MONO,
          color: gapCount > 0 ? RED : MUTED,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'color 0.3s ease',
        }}>
          {gapCount > 0 ? (
            <>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: RED, display: 'inline-block' }} />
              {gapCount} gaps identified
            </>
          ) : scanning ? (
            <>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: client.accentColor, display: 'inline-block', animation: 'pulse 1s infinite' }} />
              Scanning...
            </>
          ) : (
            <span style={{ color: 'transparent' }}>—</span>
          )}
        </div>

        <a
          href={`/sign-in?redirect=/admin/client/${client.id}`}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: client.accentColor,
            textDecoration: 'none',
            fontFamily: SANS,
            padding: '7px 14px',
            border: `1px solid ${client.accentColor}33`,
            borderRadius: '8px',
            background: `${client.accentColor}0d`,
            transition: 'background 0.2s',
          }}
        >
          See full intelligence →
        </a>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [trigger, setTrigger] = useState(1)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="clients" />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '72px 48px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
          <div style={{
            display: 'inline-block',
            fontFamily: MONO,
            fontSize: '10px',
            color: TEAL,
            letterSpacing: '.12em',
            textTransform: 'uppercase' as const,
            background: 'rgba(45,212,200,0.07)',
            border: '1px solid rgba(45,212,200,0.2)',
            borderRadius: '20px',
            padding: '5px 14px',
            marginBottom: '24px',
          }}>
            See it working · No signup required
          </div>

          <h1 style={{
            fontFamily: SERIF,
            fontSize: '40px',
            fontWeight: 900,
            color: WHITE,
            margin: '0 0 16px',
            lineHeight: 1.15,
          }}>
            Two composite organizations.<br />Real-world data. Live intelligence.
          </h1>

          <p style={{
            fontSize: '15px',
            color: MUTED,
            maxWidth: '560px',
            margin: '0 auto 32px',
            lineHeight: 1.7,
          }}>
            Built from real-world datasets across healthcare and financial services.
            Every metric is real. Every gap is real. Every recommendation is derived from the Genome —
            AbarVa&apos;s pattern library of what actually works.
          </p>
        </div>

        {/* Client cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          margin: '0 0 32px',
        }}>
          {CLIENTS.map((client, i) => (
            <ClientCard
              key={client.id}
              client={client}
              scanDelay={[300, 800][i]}
              trigger={trigger}
            />
          ))}
        </div>

        {/* Replay */}
        <div style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
          <button
            onClick={() => setTrigger(t => t + 1)}
            style={{
              background: 'none',
              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              padding: '8px 20px',
              fontSize: '12px',
              color: MUTED,
              fontFamily: MONO,
              cursor: 'pointer',
              letterSpacing: '.04em',
            }}
          >
            ↺ Replay scan
          </button>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${BORDER}`, marginBottom: '40px' }} />

        {/* How it works */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px',
          marginBottom: '48px',
        }}>
          {[
            { step: '01', title: 'Connect your data', desc: 'AbarVa maps every system, metric, and gap in your organisation within days.' },
            { step: '02', title: 'Genome matches your situation', desc: 'Pattern library from 200+ transformations surfaces what actually moves outcomes.' },
            { step: '03', title: 'Maestros govern delivery', desc: 'Embedded operators hold vendors accountable. Fee tied to verified outcomes only.' },
          ].map(item => (
            <div key={item.step} style={{ padding: '24px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.08em', marginBottom: '10px' }}>
                {item.step}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE, fontFamily: SANS, marginBottom: '8px' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '12px', color: MUTED, fontFamily: SANS, lineHeight: 1.6 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{
          fontSize: '11px',
          color: MUTED,
          textAlign: 'center' as const,
          lineHeight: 1.6,
          opacity: 0.6,
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          These are composite organizations built for demonstration purposes. They are not real companies.
          Data is modelled from real-world patterns in healthcare and financial services.
          No confidential client data is used.
        </p>

      </div>
    </div>
  )
}
