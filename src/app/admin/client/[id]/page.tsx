'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DataIntelligenceTab from '@/components/DataIntelligenceTab'

const T = {
  bg: '#060A12', surface: '#0D1520', border: '#1C2D45',
  text: '#EFF6FF', text2: '#94A3B8',
  teal: '#2DD4C8', amber: '#F59E0B', green: '#10B981',
  red: '#EF4444', indigo: '#6366F1', purple: '#818CF8',
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
  serif: '"Fraunces", Georgia, serif',
}

type ClientStatus = 'active' | 'setup'

interface ClientMeta {
  name: string
  subtitle: string
  vertical: string
  revenue: string
  region: string
  status: ClientStatus
}

const CLIENT_MAP: Record<string, ClientMeta> = {
  meridian:     { name: 'Meridian Health System',     subtitle: 'Healthcare · $11.2B revenue · NA',            vertical: 'Healthcare',       revenue: '$11.2B', region: 'NA',     status: 'active' },
  firstcapital: { name: 'First Capital Financial',    subtitle: 'Financial Services · $1.84B revenue · NA',    vertical: 'Financial Services', revenue: '$1.84B', region: 'NA',   status: 'active' },
  apexretail:   { name: 'Apex Retail Group',          subtitle: 'Retail · $12.4B revenue · NA',               vertical: 'Retail',           revenue: '$12.4B', region: 'NA',     status: 'active' },
  arcturus:     { name: 'Arcturus Financial Group',   subtitle: 'Asset Management · $16.2B revenue · Global',  vertical: 'Asset Management', revenue: '$16.2B', region: 'Global', status: 'setup' },
  nexora:       { name: 'Nexora Retail & Consumer',   subtitle: 'Retail & CPG · $18.4B revenue · Global',     vertical: 'Retail & CPG',     revenue: '$18.4B', region: 'Global', status: 'setup' },
}

const TABS = ['Setup', 'Overview', 'Data & Files', 'Gaps & Needs', 'Approvals', 'Audit Log', 'Data Intelligence', 'Team Access'] as const
type Tab = typeof TABS[number]

const PRODUCTS_NAV = [
  { label: 'Situation', href: '/diagnose' },
  { label: 'Strategy', href: '/ai-strategy' },
  { label: 'Vendor', href: '/select' },
  { label: 'Business Case', href: '/justify' },
  { label: 'Outcomes', href: '/outcomes' },
]

const SOLUTIONS_NAV = [
  { label: 'PDLC', href: '/solutions/pdlc' },
  { label: 'Delivery', href: '/solutions/delivery' },
  { label: 'Margin', href: '/solutions/margin' },
]

// ─── Setup tab ────────────────────────────────────────────────────────────────

function SetupTab({ clientId }: { clientId: string }) {
  const readinessPct = 22 // placeholder for setup clients

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: T.text, fontFamily: T.serif, margin: 0 }}>Engagement Setup</h2>
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: T.mono, color: T.amber, background: `${T.amber}15`, padding: '3px 10px', borderRadius: '10px' }}>Setup Phase</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '4px', background: T.border, borderRadius: '2px' }}>
              <div style={{ height: '4px', borderRadius: '2px', width: `${readinessPct}%`, background: T.amber }} />
            </div>
            <span style={{ fontSize: '11px', fontFamily: T.mono, color: T.amber, fontWeight: 700 }}>{readinessPct}% ready</span>
          </div>
        </div>

        {/* Steps */}
        {[
          {
            n: 1, done: true, color: T.green,
            title: 'Client organization confirmed',
            desc: 'Engagement registered. Client contact identified. NDA executed.',
            action: null,
          },
          {
            n: 2, done: false, color: T.teal,
            title: 'Upload foundation data',
            desc: 'Upload financial statements, tech landscape, leadership profiles, and regulatory register using AbarVa templates.',
            action: { label: 'Upload templates →', href: '#' },
          },
          {
            n: 3, done: false, color: T.indigo,
            title: 'Invite client stakeholders',
            desc: 'Add CEO, CFO, CIO, and CRO to the secure client portal so they can review findings and add context.',
            action: { label: 'Add team members →', href: '#' },
          },
          {
            n: 4, done: false, color: T.purple,
            title: 'Lock the baseline',
            desc: 'Schedule the baseline interview to lock performance metrics before engagement begins. AbarVa outcome fee is tied to this baseline.',
            action: { label: 'Schedule baseline interview →', href: '#' },
          },
        ].map((step, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${step.done ? T.green : T.border}`, borderRadius: '12px', padding: '20px', marginBottom: '12px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step.done ? T.green : `${step.color}15`, border: `1px solid ${step.done ? T.green : step.color}` }}>
              {step.done
                ? <span style={{ color: T.bg, fontSize: '13px', fontWeight: 700 }}>✓</span>
                : <span style={{ color: step.color, fontSize: '11px', fontWeight: 700, fontFamily: T.mono }}>{step.n}</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: T.text, marginBottom: '4px' }}>{step.title}</div>
              <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.6, marginBottom: step.action ? '12px' : '0' }}>{step.desc}</div>
              {step.action && (
                <a href={step.action.href} style={{ fontSize: '12px', fontWeight: 600, color: step.color, textDecoration: 'none', background: `${step.color}12`, border: `1px solid ${step.color}30`, padding: '6px 14px', borderRadius: '6px', display: 'inline-block' }}>
                  {step.action.label}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Readiness */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Engagement Readiness</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: T.amber, fontFamily: T.serif, marginBottom: '4px' }}>{readinessPct}%</div>
          <div style={{ fontSize: '12px', color: T.text2 }}>2 of 4 setup steps remain</div>
        </div>

        {/* Product status */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Products</div>
          {PRODUCTS_NAV.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < PRODUCTS_NAV.length - 1 ? '8px' : '0' }}>
              <span style={{ fontSize: '12px', color: T.text2 }}>{p.label}</span>
              <span style={{ fontSize: '9px', fontFamily: T.mono, color: T.amber, background: `${T.amber}12`, padding: '2px 7px', borderRadius: '10px' }}>Needs data</span>
            </div>
          ))}
        </div>

        {/* Maestro team */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Maestro Team</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${T.teal}20`, border: `1px solid ${T.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: T.teal }}>AM</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: T.text }}>Lead Maestro</div>
              <div style={{ fontSize: '10px', color: T.text2 }}>Assigned</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Overview tab placeholder ─────────────────────────────────────────────────

function OverviewTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: T.text2 }}>
      <div style={{ fontSize: '13px' }}>Overview dashboard for {clientName} — loaded from client data.</div>
      <div style={{ fontSize: '12px', marginTop: '8px' }}>Coming soon.</div>
    </div>
  )
}

// ─── Generic placeholder tab ──────────────────────────────────────────────────

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: T.text2 }}>
      <div style={{ fontSize: '13px' }}>{label} — coming soon.</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminClientPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''

  const client = CLIENT_MAP[id]
  const clientName = client?.name ?? id
  const isSetup = client?.status === 'setup'
  const defaultTab: Tab = isSetup ? 'Data Intelligence' : 'Overview'
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)

  if (!client) {
    return (
      <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.sans, color: T.text2 }}>
        Client &quot;{id}&quot; not found. <a href="/admin" style={{ color: T.teal, marginLeft: '6px' }}>← Back to Maestro</a>
      </div>
    )
  }

  // Initials for avatar
  const initials = clientName.split(' ').slice(0, 2).map((w: string) => w[0]).join('')

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.sans, color: T.text }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Left */}
          <a href="/admin" style={{ fontSize: '12px', color: T.text2, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, fontFamily: T.mono }}>
            ← Maestro
          </a>
          <div style={{ width: '1px', height: '20px', background: T.border }} />
          {/* Center */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: T.text }}>{clientName}</div>
            <div style={{ fontSize: '10px', color: T.text2, fontFamily: T.mono }}>{client.subtitle}</div>
          </div>
          {/* Status pill */}
          <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: T.mono, color: isSetup ? T.amber : T.green, background: isSetup ? `${T.amber}15` : `${T.green}15`, padding: '3px 10px', borderRadius: '10px', flexShrink: 0 }}>
            {isSetup ? 'Setup' : 'Active'}
          </span>
          {/* Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: T.text }}>Lead Maestro</div>
              <div style={{ fontSize: '10px', color: T.text2 }}>Maestro Portal</div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${T.teal}20`, border: `1px solid ${T.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: T.teal }}>
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex' }}>
          {TABS.map(tab => {
            const active = activeTab === tab
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '14px 18px', fontSize: '12px', fontWeight: active ? 600 : 400, color: active ? T.teal : T.text2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.sans, whiteSpace: 'nowrap', borderBottom: active ? `2px solid ${T.teal}` : '2px solid transparent', transition: 'all 0.12s' }}>
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px 120px' }}>
        {activeTab === 'Setup' && <SetupTab clientId={id} />}
        {activeTab === 'Overview' && <OverviewTab clientId={id} clientName={clientName} />}
        {activeTab === 'Data Intelligence' && <DataIntelligenceTab clientId={id} clientName={clientName} />}
        {activeTab !== 'Setup' && activeTab !== 'Overview' && activeTab !== 'Data Intelligence' && (
          <PlaceholderTab label={activeTab} />
        )}
      </div>

      {/* ── Quick nav bar ─────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '44px', display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>
          <a href="/" style={{ fontSize: '11px', fontWeight: 600, color: T.text2, textDecoration: 'none', padding: '0 12px', whiteSpace: 'nowrap', height: '44px', display: 'flex', alignItems: 'center', borderRight: `1px solid ${T.border}` }}>
            ← Home
          </a>
          <div style={{ fontSize: '9px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', whiteSpace: 'nowrap' }}>Products</div>
          {PRODUCTS_NAV.map(p => (
            <a key={p.label} href={`${p.href}?client=${id}`} style={{ fontSize: '11px', color: T.text2, textDecoration: 'none', padding: '0 10px', whiteSpace: 'nowrap', height: '44px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.teal }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.text2 }}>
              {p.label}
            </a>
          ))}
          <div style={{ width: '1px', height: '20px', background: T.border, flexShrink: 0 }} />
          <div style={{ fontSize: '9px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', whiteSpace: 'nowrap' }}>Solutions</div>
          {SOLUTIONS_NAV.map(s => (
            <a key={s.label} href={s.href} style={{ fontSize: '11px', color: T.text2, textDecoration: 'none', padding: '0 10px', whiteSpace: 'nowrap', height: '44px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.teal }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.text2 }}>
              {s.label}
            </a>
          ))}
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', fontFamily: T.mono, fontWeight: 700, color: T.teal }}>
              {clientName}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
