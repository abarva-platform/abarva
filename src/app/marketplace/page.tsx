'use client'
import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' } as React.CSSProperties,
}

type EntryPath = 'find' | 'compare' | 'rfp' | null
type Category = 'rcm' | 'clinical' | 'finance' | 'it' | 'operations' | null

const CLIENT_NAMES: Record<string, string> = {
  meridian: 'Meridian Health System',
  firstcapital: 'First Capital Financial',
  apexretail: 'Apex Retail Group',
}

// ─── Referral disclosure ──────────────────────────────────────────────────
const REFERRAL_VENDORS = new Set(['Waystar AI', 'Nuance DAX', 'Nuance DAX Copilot', 'Esker', 'Ironclad', 'Dynatrace', 'Avantas', 'Prodigo Solutions'])

// ─── Vendor catalog ───────────────────────────────────────────────────────

interface Vendor {
  id: string
  name: string
  category: Category
  tagline: string
  scores: { fit: number; implementation: number; support: number; value: number }
  strengths: string[]
  limitations: string[]
  pricing: string
  integrations: string[]
  meridianFit: string
  recommended: boolean
}

const VENDORS: Vendor[] = [
  // RCM
  {
    id: 'v-001', name: 'Waystar AI', category: 'rcm',
    tagline: 'AI-native RCM — denial prevention to payment reconciliation',
    scores: { fit: 92, implementation: 78, support: 85, value: 88 },
    strengths: ['Native Epic integration — 6-week go-live', 'Payer-specific denial prediction trained on $220B in claims', 'ML pre-submission scrubbing reduces denial rate 4-7 points on average'],
    limitations: ['Pricing scales with claims volume — can be expensive at Meridian scale', 'Government payer ML models lag commercial by 2-3 months'],
    pricing: '$420K–$680K/year at Meridian claims volume',
    integrations: ['Epic', 'Workday', 'Ensemble Health Partners', 'Change Healthcare'],
    meridianFit: 'Strong fit for Meridian — addresses the $94M denial gap. Ensemble integration solves the coordination problem that blocks the current model.',
    recommended: true,
  },
  {
    id: 'v-002', name: 'Cohere Health', category: 'rcm',
    tagline: 'Prior authorization AI — CMS interoperability deadline ready',
    scores: { fit: 88, implementation: 82, support: 80, value: 84 },
    strengths: ['Purpose-built for prior auth — 77% automation rate in production', 'CMS Jan 2026 compliance built in', 'Real-time payer connectivity to 2,000+ plans'],
    limitations: ['Narrower scope than Waystar — prior auth only', 'Less flexible for custom payer rules'],
    pricing: '$280K–$420K/year',
    integrations: ['Epic', 'Cerner', 'All major payers'],
    meridianFit: 'Excellent for the prior auth problem specifically — 4.2-day average to <1.8 days. Complements Waystar rather than competing.',
    recommended: true,
  },
  {
    id: 'v-003', name: 'Experian Health', category: 'rcm',
    tagline: 'Patient access and eligibility AI at scale',
    scores: { fit: 74, implementation: 68, support: 82, value: 72 },
    strengths: ['Strong patient identity and eligibility verification', 'Large payer network — 900M+ eligibility checks per year', 'Good track record in hospital systems'],
    limitations: ['Denial prevention capability weaker than Waystar', 'Implementation takes 4-6 months', 'Less AI-native — more rules-based than ML'],
    pricing: '$180K–$320K/year',
    integrations: ['Epic', 'Cerner', 'Meditech'],
    meridianFit: 'Reasonable for eligibility verification but does not address Meridian\'s core denial prediction gap. Not a full RCM AI solution.',
    recommended: false,
  },
  // Clinical
  {
    id: 'v-004', name: 'Nuance DAX Copilot', category: 'clinical',
    tagline: 'Ambient AI clinical documentation — Microsoft-backed, FDA Class II',
    scores: { fit: 94, implementation: 86, support: 90, value: 85 },
    strengths: ['Proven at scale — 550,000+ clinicians, 2.4M notes/day', 'FDA Class II cleared', 'Direct Azure/Microsoft integration for Meridian\'s stack', '45-minute documentation time saving per physician per day'],
    limitations: ['Microsoft lock-in — pricing increases after initial contract', 'Ortho and subspecialty accuracy lower than primary care'],
    pricing: '$1,200–$1,800 per physician per year',
    integrations: ['Epic (native)', 'Azure OpenAI', 'Microsoft 365'],
    meridianFit: 'Best fit for Meridian given Azure infrastructure. Pilot at 1 department — scale to all physicians. $42M opportunity at full scale.',
    recommended: true,
  },
  {
    id: 'v-005', name: 'Abridge', category: 'clinical',
    tagline: 'Generative AI clinical documentation — Epic-native',
    scores: { fit: 88, implementation: 92, support: 84, value: 90 },
    strengths: ['Epic App Orchard native — fastest implementation (2-4 weeks)', 'Strong subspecialty accuracy', 'UCSF and Stanford references — clinical credibility', 'No Microsoft dependency'],
    limitations: ['Smaller scale than Nuance — 200K clinicians vs 550K', 'Less mature enterprise support'],
    pricing: '$900–$1,400 per physician per year',
    integrations: ['Epic (native via App Orchard)'],
    meridianFit: 'Strong alternative to DAX — better Epic integration, lower price. Viable if Meridian wants non-Microsoft path. Evaluate both in RFP.',
    recommended: true,
  },
  {
    id: 'v-006', name: 'Suki', category: 'clinical',
    tagline: 'AI voice assistant for clinical documentation',
    scores: { fit: 72, implementation: 88, support: 76, value: 82 },
    strengths: ['Lowest per-physician cost', 'Fast implementation — 2 weeks', 'Good mobile experience'],
    limitations: ['Ambient recording (vs structured dictation) less mature than DAX/Abridge', 'Smaller payer base — less training data than competitors', 'Limited subspecialty coverage'],
    pricing: '$600–$900 per physician per year',
    integrations: ['Epic', 'Cerner'],
    meridianFit: 'Viable for cost-sensitive departments but not recommended as enterprise solution given Meridian\'s scale and existing Azure investment.',
    recommended: false,
  },
  // Finance / Back Office
  {
    id: 'v-007', name: 'Esker', category: 'finance',
    tagline: 'AP automation — OCR to touchless invoice processing',
    scores: { fit: 88, implementation: 84, support: 86, value: 87 },
    strengths: ['Workday native integration', '84% to <20% manual invoices in under 6 months', 'Strong healthcare references', 'Transparent pricing'],
    limitations: ['AP focus only — not full procure-to-pay', 'Enterprise tier can be slow to implement at large scale'],
    pricing: '$80K–$140K/year',
    integrations: ['Workday', 'SAP', 'Oracle'],
    meridianFit: 'Already in pilot at Meridian. Proven ROI. Scale to full AP function — $4.2M/year savings at current invoice volume.',
    recommended: true,
  },
  {
    id: 'v-008', name: 'Ironclad', category: 'finance',
    tagline: 'AI contract lifecycle management — NLP on contract portfolio',
    scores: { fit: 90, implementation: 80, support: 88, value: 91 },
    strengths: ['Best NLP contract analytics in healthcare', 'SLA penalty extraction tested against Meridian contract types', 'Workflow automation for renewals and amendments', '$6M SLA penalty recovery ROI documented at peer health systems'],
    limitations: ['Implementation requires contract upload — 6-12 weeks for large portfolios', 'Requires legal team engagement'],
    pricing: '$60K–$120K/year',
    integrations: ['Workday', 'Salesforce', 'DocuSign'],
    meridianFit: 'High ROI for Meridian — $11.7M in SLA penalties available, $0 currently enforced. 3-month payback at current penalty rate.',
    recommended: true,
  },
  // IT / Operations
  {
    id: 'v-009', name: 'Dynatrace', category: 'it',
    tagline: 'Full-stack AIOps — observability to incident prediction',
    scores: { fit: 84, implementation: 72, support: 88, value: 80 },
    strengths: ['Best-in-class Azure monitoring integration', 'Davis AI engine — anomaly detection before incidents', 'Auto-discovery covers 95% of Azure infrastructure automatically'],
    limitations: ['Complex implementation — 3-6 months for full deployment', 'Premium pricing', 'Steep learning curve for IT ops teams'],
    pricing: '$180K–$320K/year at Meridian Azure scale',
    integrations: ['Azure', 'AWS', 'GCP', 'ServiceNow', 'PagerDuty'],
    meridianFit: 'Strong for Meridian\'s Azure-first infrastructure. Addresses $8M downtime cost. Pairs well with Azure Advisor AI for full cost+ops coverage.',
    recommended: true,
  },
  {
    id: 'v-010', name: 'Avantas', category: 'operations',
    tagline: 'Healthcare workforce scheduling AI — nurse staffing optimization',
    scores: { fit: 86, implementation: 76, support: 82, value: 83 },
    strengths: ['Purpose-built for hospital nurse scheduling', 'Kronos integration native', 'Travel nurse demand forecasting — 90-day advance planning', 'Healthcare-specific labor rules engine (union contracts, licensure)'],
    limitations: ['Long implementation — 6-9 months for full deployment at large health systems', 'COO and nursing leadership required for change management'],
    pricing: '$320K–$480K/year',
    integrations: ['Kronos (UKG)', 'Epic (census data)', 'Workday'],
    meridianFit: 'Strong fit for Meridian\'s $142M travel nurse problem. Must pair with union engagement plan — COO has flagged resistance in 4 states.',
    recommended: true,
  },
]

// ─── Category config ───────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'rcm' as Category, label: 'Revenue Cycle Management', icon: '💰', desc: 'Prior auth, denial prevention, coding, collections', count: VENDORS.filter(v => v.category === 'rcm').length },
  { id: 'clinical' as Category, label: 'Clinical AI', icon: '🏥', desc: 'Documentation, decision support, diagnostics', count: VENDORS.filter(v => v.category === 'clinical').length },
  { id: 'finance' as Category, label: 'Finance & Contracts', icon: '📄', desc: 'AP automation, contract analytics, procurement', count: VENDORS.filter(v => v.category === 'finance').length },
  { id: 'it' as Category, label: 'IT & Infrastructure', icon: '⚙️', desc: 'AIOps, cloud cost, incident prevention', count: VENDORS.filter(v => v.category === 'it').length },
  { id: 'operations' as Category, label: 'Operations', icon: '🔄', desc: 'Workforce scheduling, supply chain, facilities', count: VENDORS.filter(v => v.category === 'operations').length },
]

// ─── Sub-components ───────────────────────────────────────────────────────

function ReferralBadge() {
  return (
    <span title="AbarVa has a referral relationship with this vendor. This does not affect the score." style={{ fontSize: '10px', fontWeight: 700, background: '#EEF2FF', color: '#4338CA', padding: '1px 6px', borderRadius: '6px', border: '1px solid #C7D2FE', cursor: 'help' }}>
      Referral Partner
    </span>
  )
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 85 ? '#059669' : score >= 70 ? '#D97706' : '#DC2626'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '11px', color: '#6B7280' }}>{label}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
        <div style={{ height: '4px', borderRadius: '2px', width: score + '%', background: color }} />
      </div>
    </div>
  )
}

function OverallScore({ vendor }: { vendor: Vendor }) {
  const avg = Math.round(Object.values(vendor.scores).reduce((s, v) => s + v, 0) / 4)
  const color = avg >= 85 ? '#059669' : avg >= 70 ? '#D97706' : '#DC2626'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '32px', fontWeight: 800, color }}>{avg}</div>
      <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>Overall Fit</div>
    </div>
  )
}

// ─── Path 1: Find ─────────────────────────────────────────────────────────

function PathFind({ clientId }: { clientId: string }) {
  const [category, setCategory] = useState<Category>(null)
  const [requirements, setRequirements] = useState<string[]>([])

  const categoryRequirements: Record<string, string[]> = {
    rcm: ['Epic integration required', 'CMS Jan 2026 compliance needed', 'Government payer support required', 'Volume >500K claims/year', 'Existing denial prediction model to integrate'],
    clinical: ['Azure infrastructure', 'Epic integration required', 'FDA cleared required', 'Subspecialty support needed', 'Mobile-first preferred'],
    finance: ['Workday integration', 'Contract volume >2,000 agreements', 'AP volume >50K invoices/year', 'Multi-entity support required'],
    it: ['Azure-primary stack', 'ServiceNow integration', 'Multi-cloud monitoring needed', 'Incident SLA <4 hours'],
    operations: ['Kronos/UKG integration', 'Union contract support required', 'Multi-state compliance', 'Travel nurse forecasting needed'],
  }

  const catVendors = category ? VENDORS.filter(v => v.category === category) : []
  const filteredVendors = catVendors.filter(v => {
    if (requirements.length === 0) return true
    const vendorText = JSON.stringify(v).toLowerCase()
    return requirements.some(r => vendorText.includes(r.toLowerCase().split(' ').slice(0, 2).join(' ')))
  })

  const toggleReq = (req: string) => {
    setRequirements(prev => prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req])
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Find the Right AI Tool</h2>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Scored shortlist based on {CLIENT_NAMES[clientId] ?? 'your'} context. Referral relationships disclosed on every card.</p>
      </div>

      {/* Category selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setCategory(cat.id); setRequirements([]) }}
            style={{
              padding: '16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
              background: category === cat.id ? '#F0FDF4' : '#FFFFFF',
              border: category === cat.id ? '2px solid #2DD4C8' : '1px solid #E2E8F0',
              transition: 'all 150ms',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{cat.icon}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '3px' }}>{cat.label}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>{cat.count} tools</div>
          </button>
        ))}
      </div>

      {/* Requirements checklist */}
      {category && (
        <div style={{ ...S.card, marginBottom: '24px' }}>
          <div style={S.label}>Filter by requirement</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(categoryRequirements[category] ?? []).map(req => (
              <button
                key={req}
                onClick={() => toggleReq(req)}
                style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  background: requirements.includes(req) ? '#F0FDF4' : '#F8FAFC',
                  border: requirements.includes(req) ? '1px solid #2DD4C8' : '1px solid #E2E8F0',
                  color: requirements.includes(req) ? '#065F46' : '#374151',
                }}
              >
                {requirements.includes(req) ? '✓ ' : ''}{req}
              </button>
            ))}
          </div>
          {requirements.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#6B7280' }}>
              {requirements.length} filter{requirements.length > 1 ? 's' : ''} active · showing {filteredVendors.length} of {catVendors.length} tools
            </div>
          )}
        </div>
      )}

      {/* Vendor shortlist */}
      {category && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(requirements.length > 0 ? filteredVendors : catVendors)
            .sort((a, b) => {
              const avgA = Math.round(Object.values(a.scores).reduce((s, v) => s + v, 0) / 4)
              const avgB = Math.round(Object.values(b.scores).reduce((s, v) => s + v, 0) / 4)
              return avgB - avgA
            })
            .map(vendor => {
              const avg = Math.round(Object.values(vendor.scores).reduce((s, v) => s + v, 0) / 4)
              const isReferral = REFERRAL_VENDORS.has(vendor.name)
              return (
                <div key={vendor.id} style={{ ...S.card, border: vendor.recommended ? '1px solid #A7F3D0' : '1px solid #E2E8F0', background: vendor.recommended ? '#FAFFFE' : '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    {/* Score */}
                    <div style={{ minWidth: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <OverallScore vendor={vendor} />
                      {vendor.recommended && (
                        <span style={{ fontSize: '10px', fontWeight: 700, background: '#F0FDF4', color: '#059669', padding: '2px 6px', borderRadius: '6px', border: '1px solid #A7F3D0', whiteSpace: 'nowrap' }}>Best Fit</span>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{vendor.name}</span>
                        {isReferral && <ReferralBadge />}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>{vendor.tagline}</div>

                      {/* Score bars */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                        <ScoreBar score={vendor.scores.fit} label="Client Fit" />
                        <ScoreBar score={vendor.scores.implementation} label="Implementation" />
                        <ScoreBar score={vendor.scores.support} label="Support" />
                        <ScoreBar score={vendor.scores.value} label="Value" />
                      </div>

                      {/* Meridian-specific fit */}
                      <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>AbarVa Analysis for {CLIENT_NAMES[clientId] ?? 'your org'}</div>
                        <div style={{ fontSize: '13px', color: '#374151' }}>{vendor.meridianFit}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {vendor.integrations.slice(0, 4).map(i => (
                          <span key={i} style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px' }}>{i}</span>
                        ))}
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>{vendor.pricing}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {!category && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF', fontSize: '14px' }}>
          Select a category above to see your scored shortlist
        </div>
      )}

      {/* Referral disclosure footer */}
      <div style={{ marginTop: '32px', padding: '14px 20px', background: '#EEF2FF', borderRadius: '10px', border: '1px solid #C7D2FE' }}>
        <div style={{ fontSize: '12px', color: '#3730A3' }}>
          <strong>Referral Disclosure:</strong> AbarVa has referral relationships with some vendors in this marketplace. Referral partners are marked with a badge. Referral relationships do not affect scores or recommendations — scoring methodology is independent and auditable. AbarVa earns a referral fee only when a client contracts with a referral partner, disclosed on every applicable card.
        </div>
      </div>
    </div>
  )
}

// ─── Path 2: Compare ──────────────────────────────────────────────────────

function PathCompare({ clientId }: { clientId: string }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [category, setCategory] = useState<Category>('rcm')
  const [streaming, setStreaming] = useState(false)
  const [recommendation, setRecommendation] = useState('')

  const catVendors = VENDORS.filter(v => v.category === category)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const selectedVendors = selectedIds.map(id => VENDORS.find(v => v.id === id)!).filter(Boolean)

  const runComparison = () => {
    if (selectedVendors.length < 2) return
    setStreaming(true)
    setRecommendation('')

    const top = selectedVendors.sort((a, b) => {
      const avgA = Math.round(Object.values(a.scores).reduce((s, v) => s + v, 0) / 4)
      const avgB = Math.round(Object.values(b.scores).reduce((s, v) => s + v, 0) / 4)
      return avgB - avgA
    })[0]

    const text = `For ${CLIENT_NAMES[clientId] ?? 'your organization'}, AbarVa recommends ${top.name} as the primary option.\n\n${top.meridianFit}\n\nThe key differentiator versus the alternatives is ${top.strengths[0].toLowerCase()}. ${top.strengths[1]}.\n\n⚠️ Condition to revisit: ${top.limitations[0]}. If this changes — or if the procurement evaluation reveals a materially different pricing structure — revisit this recommendation within 60 days.`

    let i = 0
    const words = text.split('')
    const interval = setInterval(() => {
      if (i < words.length) {
        setRecommendation(prev => prev + words[i])
        i++
      } else {
        clearInterval(interval)
        setStreaming(false)
      }
    }, 18)
  }

  const SCORE_LABELS: Record<keyof Vendor['scores'], string> = {
    fit: 'Client Fit',
    implementation: 'Implementation',
    support: 'Support Quality',
    value: 'Value for Cost',
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Side-by-Side Comparison</h2>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Select up to 3 tools to compare. AbarVa generates a recommendation narrative specific to {CLIENT_NAMES[clientId] ?? 'your situation'}.</p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #E2E8F0', marginBottom: '20px', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setCategory(cat.id); setSelectedIds([]) }} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none', color: category === cat.id ? '#0F172A' : '#6B7280', borderBottom: category === cat.id ? '2px solid #2DD4C8' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Select vendors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        {catVendors.map(v => {
          const isSelected = selectedIds.includes(v.id)
          const avg = Math.round(Object.values(v.scores).reduce((s, x) => s + x, 0) / 4)
          return (
            <button
              key={v.id}
              onClick={() => toggleSelect(v.id)}
              style={{
                padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                background: isSelected ? '#F0FDF4' : '#FFFFFF',
                border: isSelected ? '2px solid #2DD4C8' : '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{v.name}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: avg >= 85 ? '#059669' : avg >= 70 ? '#D97706' : '#DC2626' }}>{avg}</span>
              {REFERRAL_VENDORS.has(v.name) && <ReferralBadge />}
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '20px' }}>{selectedIds.length}/3 selected</div>

      {/* Comparison matrix */}
      {selectedVendors.length >= 2 && (
        <div style={{ ...S.card, overflowX: 'auto', marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', width: '180px', color: '#6B7280', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Dimension</th>
                {selectedVendors.map(v => (
                  <th key={v.id} style={{ textAlign: 'center', padding: '10px 12px', color: '#0F172A', fontWeight: 700 }}>
                    {v.name}
                    {REFERRAL_VENDORS.has(v.name) && <div style={{ marginTop: '4px' }}><ReferralBadge /></div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(SCORE_LABELS) as Array<keyof Vendor['scores']>).map(key => (
                <tr key={key} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 12px', color: '#6B7280', fontSize: '12px', fontWeight: 600 }}>{SCORE_LABELS[key]}</td>
                  {selectedVendors.map(v => {
                    const score = v.scores[key]
                    const color = score >= 85 ? '#059669' : score >= 70 ? '#D97706' : '#DC2626'
                    const max = Math.max(...selectedVendors.map(x => x.scores[key]))
                    return (
                      <td key={v.id} style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, color, fontSize: '16px' }}>{score}</span>
                        {score === max && selectedVendors.length > 1 && <span style={{ fontSize: '10px', color: '#059669', marginLeft: '4px' }}>▲</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                <td style={{ padding: '10px 12px', color: '#0F172A', fontSize: '12px', fontWeight: 700 }}>Overall Score</td>
                {selectedVendors.map(v => {
                  const avg = Math.round(Object.values(v.scores).reduce((s, x) => s + x, 0) / 4)
                  const maxAvg = Math.max(...selectedVendors.map(x => Math.round(Object.values(x.scores).reduce((s, v) => s + v, 0) / 4)))
                  return (
                    <td key={v.id} style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '18px', color: avg === maxAvg ? '#059669' : '#374151' }}>{avg}</span>
                      {avg === maxAvg && <div style={{ fontSize: '10px', fontWeight: 700, color: '#059669' }}>Top pick</div>}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', color: '#6B7280', fontSize: '12px', fontWeight: 600 }}>Pricing</td>
                {selectedVendors.map(v => (
                  <td key={v.id} style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#374151' }}>{v.pricing}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Generate recommendation */}
      {selectedVendors.length >= 2 && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={runComparison}
            disabled={streaming}
            style={{ padding: '10px 24px', background: '#2DD4C8', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: streaming ? 'default' : 'pointer', opacity: streaming ? 0.7 : 1 }}
          >
            {streaming ? 'Generating...' : 'Generate AbarVa Recommendation'}
          </button>
        </div>
      )}

      {recommendation && (
        <div style={{ ...S.card, borderLeft: '4px solid #2DD4C8' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2DD4C8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>AbarVa Analysis · {CLIENT_NAMES[clientId] ?? 'Your Organization'}</div>
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{recommendation}{streaming && <span style={{ opacity: 0.5 }}>▌</span>}</div>
        </div>
      )}

      {selectedVendors.length < 2 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF', fontSize: '14px' }}>
          Select 2 or 3 tools above to begin comparison
        </div>
      )}
    </div>
  )
}

// ─── Path 3: RFP ──────────────────────────────────────────────────────────

function PathRFP({ clientId }: { clientId: string }) {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Build an RFP / RFI</h2>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Generate a structured RFP or RFI with requirements pre-populated from {CLIENT_NAMES[clientId] ?? 'your'} context.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {CATEGORIES.map(cat => (
          <a key={cat.id} href={`/select?client=${clientId}&category=${cat.id}&mode=rfp`} style={{ ...S.card, textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'border 150ms' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{cat.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{cat.label} RFP</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>{cat.desc}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2DD4C8' }}>Build RFP → Vendor Intelligence</div>
          </a>
        ))}
      </div>

      <div style={{ ...S.card, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF', marginBottom: '8px' }}>What the RFP builder does</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            `Pulls ${CLIENT_NAMES[clientId] ?? 'your'} current vendor contracts and SLA terms as baseline`,
            'Generates requirements checklist from your AI strategy decisions',
            'Pre-scores vendors against your requirements before sending',
            'Creates structured evaluation matrix with weighted scoring',
            'Exports as Word document or sends to vendors via email',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#1E40AF' }}>
              <span>→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Entry screen ─────────────────────────────────────────────────────────

function EntryScreen({ onSelect }: { onSelect: (path: EntryPath) => void }) {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '20px', background: '#EEF2FF', border: '1px solid #C7D2FE', marginBottom: '20px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1', display: 'block' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Procurement Intelligence</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px', lineHeight: 1.2 }}>AI Marketplace</h1>
        <p style={{ fontSize: '16px', color: '#64748B', margin: 0, maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>Every AI vendor scored against your actual data. Referral relationships disclosed on every card.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {[
          {
            path: 'find' as EntryPath,
            icon: '🔍',
            title: 'Find the Right Tool',
            desc: 'Structured intake → scored shortlist. Filtered to what matters for your situation.',
            time: '5 minutes',
            color: '#059669',
            bg: '#F0FDF4',
            border: '#A7F3D0',
          },
          {
            path: 'compare' as EntryPath,
            icon: '⚖️',
            title: 'Compare Side-by-Side',
            desc: 'Select 2-3 vendors. Get a detailed comparison matrix and a narrative recommendation.',
            time: '3 minutes',
            color: '#4DA3FF',
            bg: '#EFF6FF',
            border: '#BFDBFE',
          },
          {
            path: 'rfp' as EntryPath,
            icon: '📋',
            title: 'Build an RFP / RFI',
            desc: 'Generate a structured RFP with your requirements pre-loaded. Export or send to vendors.',
            time: '10 minutes',
            color: '#7C3AED',
            bg: '#F5F3FF',
            border: '#DDD6FE',
          },
        ].map(card => (
          <button
            key={card.path}
            onClick={() => onSelect(card.path)}
            style={{ background: card.bg, border: '1px solid ' + card.border, borderRadius: '14px', padding: '28px', cursor: 'pointer', textAlign: 'left', transition: 'transform 150ms, box-shadow 150ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
          >
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>{card.icon}</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>{card.title}</div>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, marginBottom: '16px' }}>{card.desc}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: card.color }}>→ Takes ~{card.time}</div>
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '48px' }}>
        {[
          { value: VENDORS.length + '+', label: 'Vendors scored' },
          { value: CATEGORIES.length.toString(), label: 'Categories' },
          { value: REFERRAL_VENDORS.size.toString(), label: 'Referral partners (disclosed)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────

function MarketplaceInner() {
  const params = useSearchParams()
  const clientParam = params.get('client') ?? 'meridian'
  const [activeClient, setActiveClient] = useState(clientParam)
  const [entryPath, setEntryPath] = useState<EntryPath>(null)

  return (
    <div style={S.page}>
      <AbarvaNav clientId={activeClient} onClientChange={(c) => { setActiveClient(c) }} />

      {!entryPath ? (
        <EntryScreen onSelect={setEntryPath} />
      ) : (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Back + page header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <button onClick={() => setEntryPath(null)} style={{ fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>← Marketplace</button>
            <span style={{ color: '#E2E8F0' }}>|</span>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>{CLIENT_NAMES[activeClient] ?? 'Your Organization'}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {(['find', 'compare', 'rfp'] as EntryPath[]).map(p => (
                <button key={p} onClick={() => setEntryPath(p)} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '6px', border: '1px solid #E2E8F0', background: entryPath === p ? '#F0FDF4' : '#FFFFFF', color: entryPath === p ? '#059669' : '#374151', borderColor: entryPath === p ? '#2DD4C8' : '#E2E8F0' }}>
                  {p === 'find' ? 'Find' : p === 'compare' ? 'Compare' : 'Build RFP'}
                </button>
              ))}
            </div>
          </div>

          {entryPath === 'find' && <PathFind clientId={activeClient} />}
          {entryPath === 'compare' && <PathCompare clientId={activeClient} />}
          {entryPath === 'rfp' && <PathRFP clientId={activeClient} />}
        </div>
      )}
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#6B7280' }}>Loading Marketplace...</div>}>
      <MarketplaceInner />
    </Suspense>
  )
}
