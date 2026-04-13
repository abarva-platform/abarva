'use client'

import { use } from 'react'
import Link from 'next/link'
import { CLIENT_REGISTRY, type ClientEntry, type DataCategory } from '@/lib/client-registry'

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#1C2333',
  border: '#21262D',
  border2: '#30363D',
  text: '#E6EDF3',
  text2: '#8B949E',
  text3: '#6E7681',
  teal: '#2DD4C8',
  blue: '#4DA3FF',
  amber: '#F59E0B',
  red: '#F85149',
  green: '#3FB950',
  purple: '#A371F7',
}

// ─── Intelligence Products ────────────────────────────────────────────────────

type ProductStatus = 'green' | 'amber' | 'gray'

interface IntelProduct {
  name: string
  href: string
  question: string
  status: ProductStatus
}

function getProducts(client: ClientEntry): IntelProduct[] {
  const readyHrefs = new Set(client.intelligence.ready.map(r => r.href.split('?')[0]))

  const all = [
    { name: 'Situation Intelligence', href: '/diagnose', question: 'What is actually broken and what is it costing you?' },
    { name: 'AI Investment Intelligence', href: '/ai-strategy', question: 'Where should you place your AI bets?' },
    { name: 'Select Intelligence', href: '/select', question: 'Which vendor wins for this decision?' },
    { name: 'Blueprint Intelligence', href: '/blueprint', question: 'What is the right architecture for your constraints?' },
    { name: 'Business Case Intelligence', href: '/justify', question: 'How do you build the CFO-grade business case?' },
    { name: 'Architecture Intelligence', href: '/architecture', question: 'How do you future-proof the data foundation?' },
    { name: 'Data Intelligence', href: '/data-intelligence', question: 'What is your data actually ready to support?' },
    { name: 'Domain Strategy Intelligence', href: '/domain-strategy', question: 'How does this fit your long-term strategy?' },
    { name: 'Outcome Intelligence', href: '/outcomes', question: 'Are your AI investments actually working?' },
  ]

  return all.map(p => ({
    ...p,
    status: readyHrefs.has(p.href)
      ? 'green'
      : client.dataCompleteness >= 80
        ? 'amber'
        : 'gray',
  }))
}

// ─── Solutions per vertical ───────────────────────────────────────────────────

interface SolutionCard {
  code: string
  name: string
  problem: string
  value: string
  slug: string
}

function getSolutions(vertical: string): SolutionCard[] {
  if (vertical === 'Healthcare') return [
    { code: 'HP-01', name: 'RCM Denial Recovery', problem: 'Denial rate above benchmark — write-offs compounding annually.', value: '$18–$40M / yr', slug: 'rcm-denial-recovery' },
    { code: 'HP-02', name: 'Prior Auth AI Automation', problem: 'Manual prior auth creating 4+ day delays and clinical friction.', value: '$12–$22M / yr', slug: 'prior-auth-automation' },
  ]
  if (vertical === 'Financial Services') return [
    { code: 'BK-01', name: 'Core Banking AI Modernization', problem: 'Legacy architecture blocking real-time AI and digital banking parity.', value: '$30–$80M / yr', slug: 'core-banking-ai' },
    { code: 'BK-02', name: 'Fraud & AML Intelligence', problem: 'High false positives and fraud losses above peer benchmark.', value: '$8–$20M / yr', slug: 'fraud-aml-intelligence' },
  ]
  if (vertical === 'Retail') return [
    { code: 'RT-01', name: 'Demand Forecasting Recovery', problem: 'Forecast accuracy below benchmark — excess inventory on balance sheet.', value: '$40–$100M / yr', slug: 'demand-forecasting' },
    { code: 'RT-02', name: 'Personalization & Loyalty Activation', problem: 'Personalization tools licensed but not activated — revenue left idle.', value: '$80–$250M / yr', slug: 'personalization-loyalty' },
  ]
  return []
}

// ─── Data enhancements (gaps beyond loaded categories) ────────────────────────

interface DataGap {
  label: string
  description: string
  unlocksProduct: string
}

function getDataGaps(vertical: string): DataGap[] {
  if (vertical === 'Healthcare') return [
    { label: 'Physician Satisfaction Survey', description: 'Structured physician sentiment data improves change readiness scoring and clinical champion identification.', unlocksProduct: 'Stakeholder Intelligence' },
    { label: 'Payer Contract Terms', description: 'Payer-specific contract data enables contract risk analysis and targeted renegotiation playbooks.', unlocksProduct: 'Select Intelligence' },
    { label: 'Claims Denial Codes (90d)', description: 'Granular denial code data enables root cause analysis beyond aggregate denial rate.', unlocksProduct: 'Situation Intelligence' },
  ]
  if (vertical === 'Financial Services') return [
    { label: 'Competitor Rate Sheet', description: 'Competitor deposit pricing data improves deposit pricing optimization ROI model.', unlocksProduct: 'AI Investment Intelligence' },
    { label: 'OCC MRA Full Text', description: 'Full MRA documentation enables AML remediation prioritization.', unlocksProduct: 'Select Intelligence' },
    { label: 'Fraud Transaction Sample', description: 'Anonymized fraud transactions enable fraud model training readiness assessment.', unlocksProduct: 'Data Intelligence' },
  ]
  if (vertical === 'Retail') return [
    { label: 'Store Traffic Data (90d)', description: 'Granular traffic data improves labor optimization and loss prevention AI scoping.', unlocksProduct: 'AI Investment Intelligence' },
    { label: 'CDP Segment Export Sample', description: 'Segment identity resolution scope requires sample of fragmented profiles.', unlocksProduct: 'Data Intelligence' },
    { label: 'Supplier Contract Terms', description: 'Supplier contract data enables procurement AI opportunity sizing.', unlocksProduct: 'Select Intelligence' },
  ]
  return []
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'critical' | 'warning' | 'ok' }) {
  const color = status === 'critical' ? T.red : status === 'warning' ? T.amber : T.green
  return <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
      {children}
    </div>
  )
}

function DataBadge({ cat }: { cat: DataCategory }) {
  const colors: Record<string, string> = { loaded: T.green, pending: T.amber, missing: T.red, na: T.text3 }
  const bg: Record<string, string> = { loaded: T.green + '18', pending: T.amber + '18', missing: T.red + '18', na: T.text3 + '18' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: bg[cat.status], border: '1px solid ' + colors[cat.status] + '40', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: colors[cat.status] }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors[cat.status], display: 'inline-block', flexShrink: 0 }} />
      {cat.label}
    </div>
  )
}

function ProductRow({ product, clientId }: { product: IntelProduct; clientId: string }) {
  const dotColor = product.status === 'green' ? T.green : product.status === 'amber' ? T.amber : T.text3
  const label = product.status === 'green' ? 'READY' : product.status === 'amber' ? 'AVAILABLE' : 'NEEDS DATA'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid ' + T.border }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: T.text, marginBottom: '2px' }}>{product.name}</div>
        <div style={{ fontSize: '12px', color: T.text2 }}>{product.question}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: dotColor, letterSpacing: '0.08em' }}>{label}</span>
        {product.status !== 'gray' && (
          <Link
            href={product.href + '?client=' + clientId}
            style={{ padding: '5px 12px', background: product.status === 'green' ? dotColor + '20' : T.surface2, border: '1px solid ' + dotColor + '50', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: dotColor, textDecoration: 'none' }}
          >
            Run →
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDashboard({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params)
  const client = CLIENT_REGISTRY.find(c => c.id === clientId)

  if (!client) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: T.text2, fontSize: '16px' }}>Client not found: {clientId}</div>
      </div>
    )
  }

  const products = getProducts(client)
  const solutions = getSolutions(client.vertical)
  const gaps = getDataGaps(client.vertical)
  const loadedCategories = client.dataCategories.filter(c => c.status !== 'na')
  const color = client.color

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, Inter, system-ui, sans-serif', color: T.text }}>

      {/* Nav breadcrumb */}
      <div style={{ borderBottom: '1px solid ' + T.border, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/admin" style={{ fontSize: '13px', color: T.text2, textDecoration: 'none' }}>← Workspace</Link>
        <span style={{ color: T.text3 }}>/</span>
        <span style={{ fontSize: '13px', color: T.text }}>{client.shortName}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: color + '18', color: color, border: '1px solid ' + color + '40', borderRadius: '4px', padding: '3px 10px', letterSpacing: '0.06em' }}>
          {client.status.toUpperCase()}
        </span>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 32px 80px' }}>

        {/* ── Section 1: Client Header ─────────────────────────────────────── */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '28px', marginBottom: '20px', borderLeft: '3px solid ' + color }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: T.text, marginBottom: '4px', letterSpacing: '-0.02em' }}>
                {client.name}
              </div>
              <div style={{ fontSize: '14px', color: T.text2, marginBottom: '20px' }}>
                {client.vertical} · {client.revenue} · {client.employees} employees
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>MAESTRO</div>
                  <div style={{ fontSize: '13px', color: T.text }}>{client.maestro}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>START DATE</div>
                  <div style={{ fontSize: '13px', color: T.text }}>{client.startDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>DATA COMPLETE</div>
                  <div style={{ fontSize: '13px', color: client.dataCompleteness === 100 ? T.green : T.amber, fontWeight: 700 }}>{client.dataCompleteness}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>CONTRADICTIONS</div>
                  <div style={{ fontSize: '13px', color: T.amber, fontWeight: 700 }}>{client.intelligence.contradictions} identified</div>
                </div>
              </div>
            </div>
            {/* Key metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', minWidth: '280px' }}>
              {client.keyMetrics.map(m => (
                <div key={m.label} style={{ background: T.bg, border: '1px solid ' + T.border2, borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StatusDot status={m.status} />
                    <span style={{ fontSize: '16px', fontWeight: 800, color: m.status === 'critical' ? T.red : T.text }}>{m.value}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: T.text3, marginTop: '2px' }}>{m.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 2: Data Loaded ───────────────────────────────────────── */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <SectionLabel>Data Loaded</SectionLabel>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {loadedCategories.map(cat => (
              <DataBadge key={cat.key} cat={cat} />
            ))}
          </div>
          {client.dataCategories.filter(c => c.status === 'loaded').map(cat => (
            <div key={cat.key} style={{ marginTop: '8px', display: 'none' }} />
          ))}
          <div style={{ marginTop: '14px', fontSize: '12px', color: T.text3 }}>
            {client.dataCategories.filter(c => c.status === 'loaded').length} of {loadedCategories.length} categories loaded
            {client.dataCategories.filter(c => c.status === 'loaded').length < loadedCategories.length && (
              <span style={{ color: T.amber, marginLeft: '8px' }}>
                · {loadedCategories.length - client.dataCategories.filter(c => c.status === 'loaded').length} pending
              </span>
            )}
          </div>
        </div>

        {/* ── Section 3: What AbarVa Already Knows ────────────────────────── */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <SectionLabel>What AbarVa Already Knows</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {client.intelligence.critical.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', background: T.bg, border: '1px solid ' + T.border2, borderRadius: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: T.red + '20', border: '1px solid ' + T.red + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: T.red, flexShrink: 0, marginTop: '1px' }}>!</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: T.text, marginBottom: item.metric ? '4px' : 0 }}>{item.text}</div>
                  {item.metric && (
                    <div style={{ fontSize: '12px', fontWeight: 700, color: T.red }}>{item.metric}</div>
                  )}
                </div>
                <Link
                  href={client.intelligence.ready[0]?.href || '/diagnose?client=' + client.id}
                  style={{ fontSize: '12px', color: color, fontWeight: 600, textDecoration: 'none', flexShrink: 0, marginTop: '2px' }}
                >
                  Dig deeper →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 4: Intelligence Ready to Run ────────────────────────── */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <SectionLabel>Intelligence Ready to Run</SectionLabel>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: T.text3 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: T.green, display: 'inline-block' }} /> Ready</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: T.amber, display: 'inline-block' }} /> Available</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: T.text3, display: 'inline-block' }} /> Needs data</span>
            </div>
          </div>
          <div>
            {products.map(p => (
              <ProductRow key={p.name} product={p} clientId={client.id} />
            ))}
          </div>
        </div>

        {/* ── Section 5: Solutions That Apply ─────────────────────────────── */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <SectionLabel>Solutions That Apply</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {solutions.map(sol => (
              <div key={sol.code} style={{ background: T.bg, border: '1px solid ' + T.border2, borderRadius: '10px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, background: color + '18', color: color, border: '1px solid ' + color + '40', borderRadius: '4px', padding: '2px 8px', letterSpacing: '0.06em' }}>{sol.code}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.text }}>{sol.name}</span>
                </div>
                <div style={{ fontSize: '13px', color: T.text2, marginBottom: '12px' }}>{sol.problem}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: T.green }}>{sol.value}</span>
                  <Link
                    href={'/solutions/' + sol.slug + '?client=' + client.id}
                    style={{ padding: '6px 14px', background: color + '20', border: '1px solid ' + color + '40', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: color, textDecoration: 'none' }}
                  >
                    Run →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 6: Data Gaps ─────────────────────────────────────────── */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <SectionLabel>Data Gaps</SectionLabel>
            <span style={{ fontSize: '11px', color: T.text3 }}>Adding these improves intelligence precision</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {gaps.map((gap, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: T.bg, border: '1px solid ' + T.border2, borderRadius: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.text3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.text, marginBottom: '2px' }}>{gap.label}</div>
                  <div style={{ fontSize: '12px', color: T.text2 }}>{gap.description}</div>
                  <div style={{ fontSize: '11px', color: T.text3, marginTop: '3px' }}>Unlocks: <span style={{ color: color }}>{gap.unlocksProduct}</span></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    style={{ padding: '6px 12px', background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: T.text2, cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = '/templates/' + gap.label.toLowerCase().replace(/\s+/g, '-') + '-template.xlsx'
                      a.download = gap.label + ' Template.xlsx'
                      a.click()
                    }}
                  >
                    Download template
                  </button>
                  <button
                    style={{ padding: '6px 12px', background: color + '18', border: '1px solid ' + color + '40', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: color, cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => alert('Upload flow coming soon — contact your Maestro to share data securely.')}
                  >
                    Upload now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
