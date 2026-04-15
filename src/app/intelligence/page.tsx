'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { arcturusTechnology } from '@/data/arcturus/technology'

// ── Design System ──────────────────────────────────────────────────────────────
const BG = '#060A12'
const CARD = '#0D1520'
const BORDER = '#1C2D45'
const TEAL = '#2DD4C8'
const WHITE = '#EFF6FF'
const MUTED = 'rgba(255,255,255,0.75)'
const DIM = 'rgba(255,255,255,0.6)'
const MONO = 'JetBrains Mono, monospace'
const SANS = 'DM Sans, sans-serif'
const RED = '#EF4444'
const AMBER = '#F59E0B'
const GREEN = '#34D399'
const INDIGO = '#818CF8'

// ── Arcturus system portfolio (from enriched data) ─────────────────────────────
const ARCTURUS_SYSTEMS = [
  {
    group: 'Investment Management',
    systems: [
      {
        id: 'bloomberg-aim',
        name: 'Bloomberg AIM',
        function: 'Order Management System',
        vendor: 'Bloomberg',
        health: 'critical' as const,
        age: 28,
        annualCost: 42,
        contractEnd: 'Dec 2026',
        autoRenew: true,
        deploymentModel: 'On-Premise',
        aiReady: false,
        aiReadinessScore: 0,
        issues: [
          '28 years old — 3 failed modernisations — $22.2M sunk in failed attempts',
          'API rate limit: 500 calls/hr vs 50,000 needed for ML inference',
          '180ms Bloomberg→Azure latency — AI needs <50ms for real-time inference',
          'Every AI initiative requiring real-time portfolio data is blocked by this system',
          'Current Head of Technology (Michael Santos) was Accenture partner who led the failed Phase 3 modernisation',
        ],
        contractNote: 'AUTO-RENEWS December 2026. No API modernisation terms in current contract. This is the only negotiation window. Use migration threat (Charles River + Aladdin OMS) as leverage to force API access improvements as contract condition.',
        aiBlockerNote: '18 of 28 AI initiatives blocked by Bloomberg AIM data architecture. Real-time portfolio positions are not accessible to Azure ML without an API layer.',
        action: 'Phase 4: API middleware (not core migration). $22M approved. CDO hire required before Bloomberg will re-engage on technical discussions. Negotiate API terms at December 2026 renewal.',
        spend: 42,
        category: 'OMS / Data',
      },
      {
        id: 'aladdin',
        name: 'BlackRock Aladdin',
        function: 'Risk Analytics / Stress Testing',
        vendor: 'BlackRock',
        health: 'warning' as const,
        age: 8,
        annualCost: 38,
        contractEnd: 'Mar 2027',
        autoRenew: false,
        deploymentModel: 'Vendor-Hosted (BlackRock)',
        aiReady: true,
        aiReadinessScore: 65,
        issues: [
          'Stress testing runs MONTHLY — SEC Rule 18f-4 requires DAILY. Direct compliance gap.',
          'Aladdin AI features (factor modelling, scenario analysis) licensed but NOT activated.',
          'Aladdin API does not expose attribution calculation data for external ML consumption.',
          'Aladdin disconnected from Bloomberg AIM — daily risk cadence impossible without integration.',
        ],
        contractNote: 'March 2027 renewal. SEC daily stress testing gap gives significant leverage — Aladdin must remediate or provide credit for non-compliance. Negotiate: daily cadence as baseline SLA with penalty clause, plus activation of AI features at no additional cost.',
        aiBlockerNote: 'Aladdin AI features are licensed and platform-ready but CRO AI freeze prevents activation. Stress testing automation (daily cadence) is approved by CRO — lowest-risk AI initiative.',
        action: 'Immediate: configure Aladdin for daily stress testing cadence (configuration change only, no migration). Negotiate AI feature activation at March 2027 renewal.',
        spend: 38,
        category: 'Risk Platform',
      },
    ],
  },
  {
    group: 'Client Management',
    systems: [
      {
        id: 'salesforce-fsc',
        name: 'Salesforce FSC',
        function: 'CRM / Client Portal / Advisor Workflow',
        vendor: 'Salesforce',
        health: 'warning' as const,
        age: 2,
        annualCost: 14,
        contractEnd: 'Aug 2026',
        autoRenew: false,
        deploymentModel: 'Cloud SaaS',
        aiReady: true,
        aiReadinessScore: 55,
        issues: [
          '44% advisor adoption after 18 months — flat for 3 consecutive quarters',
          'Adoption target privately reset from 85% to 70% by CIO in November 2025 — board not informed',
          '$38M invested — NPS 31 vs 58 industry median',
          'Einstein AI licensed but NOT activated — CRO AI freeze applies',
          '72-hour data lag to Bloomberg positions — advisors see stale data vs real-time Bloomberg',
          'SSO integration to Bloomberg AIM not live — primary adoption blocker',
          'Mobile app missing portfolio rebalancing — advisors still need Bloomberg for trades',
        ],
        contractNote: 'August 2026 renewal — use 44% adoption failure as negotiation leverage. $38M implementation already committed creates lock-in pressure. Negotiate: Einstein activation SLAs, adoption targets with penalties for Salesforce delivery gaps, and price reduction for underperformance.',
        aiBlockerNote: '3 AI initiatives (Client Risk Profiling, Advisor Next Best Action, Advisor Productivity Assistant) blocked by Salesforce FSC adoption ceiling at 44%. Fix: SSO to Bloomberg AIM — this single change unlocks adoption without any advisor behaviour change.',
        action: 'Prioritise Bloomberg AIM SSO integration (the single fix). August 2026 renewal: negotiate adoption remediation plan and price reduction. Activate Einstein AI after CRO governance framework is established.',
        spend: 14,
        category: 'CRM / AI',
      },
    ],
  },
  {
    group: 'Compliance & Accounting',
    systems: [
      {
        id: 'charles-river',
        name: 'Charles River IMS',
        function: 'Compliance / Trade Order Management',
        vendor: 'SS&C (Charles River)',
        health: 'stable' as const,
        age: 6,
        annualCost: 8,
        contractEnd: 'Sep 2026',
        autoRenew: false,
        deploymentModel: 'On-Premise',
        aiReady: false,
        aiReadinessScore: 22,
        issues: [
          'On-premise deployment blocks AI compliance monitoring features',
          'Not connected to Bloomberg AIM for real-time position compliance',
          'Charles River Cloud migration required to unlock AI compliance features',
        ],
        contractNote: 'September 2026 renewal. Charles River Cloud migration unlocks MAS FEAT-compliant AI monitoring. Add ~$1.2M annually but unlocks compliance AI and removes on-premise infrastructure burden.',
        aiBlockerNote: 'MAS FEAT compliance monitoring requires AI-readable audit trails. On-premise Charles River cannot expose data in format required for AI governance documentation.',
        action: 'September 2026 renewal: negotiate Charles River Cloud migration roadmap as contract condition. Cloud migration + compliance AI activation.',
        spend: 8,
        category: 'Compliance / IMS',
      },
      {
        id: 'advent-geneva',
        name: 'Advent Geneva (SS&C)',
        function: 'Fund Accounting / NAV / Investor Reporting',
        vendor: 'SS&C',
        health: 'warning' as const,
        age: 14,
        annualCost: 12,
        contractEnd: 'Jun 2026',
        autoRenew: false,
        deploymentModel: 'On-Premise',
        aiReady: false,
        aiReadinessScore: 18,
        issues: [
          '14 years old — primary cause of the firm-wide 3-day reporting lag',
          'Batch processing architecture — cannot produce real-time accounting data',
          'Not cloud-deployable in current configuration',
          'Blocks all client reporting AI that requires real-time NAV data',
        ],
        contractNote: 'June 2026 renewal approaching. SS&C Eze is a viable cloud-native alternative. Evaluate SS&C Eze migration vs Geneva renewal as condition of negotiation. Cloud migration reduces 3-day reporting lag — prerequisite for AI-Powered Client Reporting initiative ($22M annual value).',
        aiBlockerNote: 'AI-Powered Client Reporting ($11M invested, $22M annual value) is blocked by the 3-day lag that Geneva creates. Real-time reporting requires a cloud-native fund accounting platform.',
        action: 'June 2026 renewal: negotiate cloud migration roadmap. Evaluate SS&C Eze as competitive alternative to force negotiation.',
        spend: 12,
        category: 'Fund Accounting',
      },
    ],
  },
  {
    group: 'Data & Analytics',
    systems: [
      {
        id: 'tableau',
        name: 'Tableau',
        function: 'Business Intelligence / Management Reporting',
        vendor: 'Salesforce (Tableau)',
        health: 'stable' as const,
        age: 4,
        annualCost: 1.8,
        contractEnd: 'Feb 2027',
        autoRenew: false,
        deploymentModel: 'Cloud SaaS',
        aiReady: true,
        aiReadinessScore: 48,
        issues: [
          'Dashboards only as current as source data — 3-day lag from Geneva makes all dashboards stale',
          'Tableau AI explain features licensed but not used',
          'Not yet connected to Golden Record (which does not exist yet)',
        ],
        contractNote: 'February 2027 renewal. Low urgency — good platform, value limited by source data lag not by Tableau itself.',
        aiBlockerNote: 'Tableau is AI-ready but the 3-day source data lag means dashboards are always stale. Fix is upstream (Geneva → cloud migration, Golden Record), not Tableau itself.',
        action: 'Activate Tableau AI explain features. Connect to Golden Record when live.',
        spend: 1.8,
        category: 'Analytics',
      },
    ],
  },
  {
    group: 'Corporate & Infrastructure',
    systems: [
      {
        id: 'workday',
        name: 'Workday (HCM + Finance)',
        function: 'HR / Payroll / Finance / Procurement',
        vendor: 'Workday',
        health: 'good' as const,
        age: 5,
        annualCost: 4.2,
        contractEnd: 'Dec 2027',
        autoRenew: true,
        deploymentModel: 'Cloud SaaS',
        aiReady: true,
        aiReadinessScore: 78,
        issues: [
          'Workday Prism Analytics available but not activated',
          'CRO AI freeze applies — Workday AI features not in scope',
        ],
        contractNote: 'December 2027 renewal. Well-implemented. No urgency.',
        aiBlockerNote: 'Workday AI features (Prism Analytics) are available and platform-ready. Activation pending CRO governance framework.',
        action: 'Activate Workday Prism Analytics once CRO governance framework is established.',
        spend: 4.2,
        category: 'HCM / Finance',
      },
      {
        id: 'azure',
        name: 'Microsoft Azure (Primary Cloud)',
        function: 'Cloud Platform / AI Infrastructure',
        vendor: 'Microsoft',
        health: 'stable' as const,
        age: 3,
        annualCost: 22,
        contractEnd: 'Ongoing',
        autoRenew: true,
        deploymentModel: 'Cloud',
        aiReady: true,
        aiReadinessScore: 82,
        issues: [
          '31% of infrastructure AI-ready — on-premise Bloomberg AIM and Advent Geneva create the gap',
          'No ML platform deployed — Azure ML licensed but idle',
          'No Data Lake — foundational infrastructure for AI not built',
          '180ms Bloomberg→Azure latency blocks real-time AI inference',
        ],
        contractNote: 'Ongoing. Azure AI Foundry, Azure ML, Azure OpenAI all available. Primary gap is deployment — tools exist but are not used.',
        aiBlockerNote: 'Azure is AI-capable but the AI platform (Azure ML, MLOps pipeline, Data Lake) has not been built. CDO hire is the prerequisite for making these deployment decisions.',
        action: 'Once CDO hired and governance framework established: deploy Azure ML platform, build MLOps pipeline, implement Informatica MDM for golden record on Azure.',
        spend: 22,
        category: 'Cloud Platform',
      },
      {
        id: 'aws-dr',
        name: 'AWS (Disaster Recovery)',
        function: 'DR and Backup',
        vendor: 'Amazon',
        health: 'good' as const,
        age: 4,
        annualCost: 3.8,
        contractEnd: 'Ongoing',
        autoRenew: true,
        deploymentModel: 'Cloud',
        aiReady: false,
        aiReadinessScore: 20,
        issues: ['DR only — not in AI scope'],
        contractNote: 'Ongoing. No action needed.',
        aiBlockerNote: 'Not in AI scope — DR function only.',
        action: 'No near-term action. Evaluate consolidation to Azure when DR contract renews.',
        spend: 3.8,
        category: 'Cloud (DR)',
      },
    ],
  },
]

const ARCTURUS_SPEND = {
  total: 680,
  peer: 502,
  excess: 178,
  categories: [
    { name: 'Software / Licensing', amount: 204, pct: 30 },
    { name: 'IT Staff & Contractors', amount: 170, pct: 25 },
    { name: 'Infrastructure & Hosting', amount: 136, pct: 20 },
    { name: 'AI & Data Initiatives', amount: 94, pct: 14 },
    { name: 'Cybersecurity', amount: 48, pct: 7 },
    { name: 'Telecom', amount: 28, pct: 4 },
  ],
}

const CONTRACTS_URGENT = [
  { vendor: 'SS&C (Advent Geneva)', end: 'Jun 2026', leverage: 'Cloud migration as renewal condition', urgencyDays: 60, risk: 'medium' as const },
  { vendor: 'Salesforce FSC', end: 'Aug 2026', leverage: '44% adoption failure = price reduction', urgencyDays: 120, risk: 'high' as const },
  { vendor: 'Charles River IMS', end: 'Sep 2026', leverage: 'Cloud migration unlocks AI compliance', urgencyDays: 150, risk: 'medium' as const },
  { vendor: 'Bloomberg AIM + Terminal', end: 'Dec 2026', leverage: 'API terms as auto-renewal condition', urgencyDays: 240, risk: 'critical' as const },
  { vendor: 'BlackRock Aladdin', end: 'Mar 2027', leverage: 'Daily stress testing SLA + AI features', urgencyDays: 330, risk: 'high' as const },
]

// ── Utility ────────────────────────────────────────────────────────────────────
function healthColor(h: string) {
  if (h === 'critical') return RED
  if (h === 'warning' || h === 'poor') return AMBER
  if (h === 'good') return GREEN
  return MUTED
}

function healthLabel(h: string) {
  if (h === 'critical') return 'CRITICAL'
  if (h === 'warning') return 'AT RISK'
  if (h === 'good') return 'GOOD'
  return 'STABLE'
}

function riskColor(r: string) {
  if (r === 'critical') return RED
  if (r === 'high') return AMBER
  return TEAL
}

// ── PRE-BUILT QUESTIONS ────────────────────────────────────────────────────────
const PRE_BUILT = [
  'Bloomberg auto-renews December 2026 — API access has no terms in the current contract. What 3 specific API commitments should I demand as conditions of renewal?',
  '3-day reporting lag is blocking 6 AI initiatives. What is the fastest path to real-time data — Geneva cloud migration or something else?',
  'Salesforce FSC adoption is 44% after 18 months and $38M. 78% of non-adopters cite Bloomberg position lag. What is the exact SSO integration I need to build?',
  'CRO has frozen all new AI deployments. MAS FEAT is 4 months overdue. What is the minimum viable governance framework that gets the CRO to re-open the door?',
  '$94M AI portfolio with $0 ROI. Which 3 initiatives can I baseline and start tracking ROI on without the CDO or golden record?',
]

// ── Main component ─────────────────────────────────────────────────────────────
interface System {
  id: string
  name: string
  function: string
  vendor: string
  health: 'critical' | 'warning' | 'stable' | 'good' | 'poor'
  age: number
  annualCost: number
  contractEnd: string
  autoRenew: boolean
  deploymentModel: string
  aiReady: boolean
  aiReadinessScore: number
  issues: string[]
  contractNote: string
  aiBlockerNote: string
  action: string
  spend: number
  category: string
}

function IntelligenceContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'arcturus'
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'spend' | 'contracts'>('portfolio')
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamingResponse])

  async function sendChat(text?: string) {
    const msg = text || chatInput
    if (!msg.trim()) return
    const newMsg = { role: 'user', content: msg }
    const updated = [...chatMessages, newMsg]
    setChatMessages(updated)
    setChatInput('')
    setChatLoading(true)
    setStreamingResponse('')
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, role: 'CIO', clientId }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value)
          setStreamingResponse(full)
        }
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: full }])
    } finally {
      setStreamingResponse('')
      setChatLoading(false)
    }
  }

  // Counts
  const allSystems = ARCTURUS_SYSTEMS.flatMap(g => g.systems as System[])
  const criticalCount = allSystems.filter(s => s.health === 'critical').length
  const warningCount = allSystems.filter(s => s.health === 'warning' || s.health === 'poor').length
  const contractsExpiring90 = CONTRACTS_URGENT.filter(c => c.urgencyDays <= 90).length
  const aiReadyPct = Math.round(
    allSystems.reduce((sum, s) => sum + s.aiReadinessScore, 0) / allSystems.length
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE, display: 'flex', flexDirection: 'column' }}>
      <AbarvaNav activePage="intelligence" />

      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '20px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Technology Intelligence · Arcturus Financial Group · April 2026
              </div>
              <h1 style={{ fontFamily: SANS, fontSize: '22px', fontWeight: 700, color: WHITE, margin: 0 }}>
                Technology Landscape
              </h1>
              <p style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, margin: '4px 0 0', lineHeight: 1.5 }}>
                {allSystems.length} systems · $680M annual IT spend · {criticalCount} critical · {warningCount} at risk · {aiReadyPct}% AI-ready
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { label: 'IT vs Peers', value: '+$178M', color: RED, sub: '$680M vs $502M benchmark' },
                { label: 'AI Portfolio', value: '$94M', color: AMBER, sub: '$0 documented ROI' },
                { label: 'Critical Systems', value: `${criticalCount}`, color: RED, sub: 'Requiring immediate action' },
                { label: 'Contracts ≤12mo', value: `${CONTRACTS_URGENT.length}`, color: AMBER, sub: 'Bloomberg auto-renews Dec 2026' },
              ].map(m => (
                <div key={m.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 16px', textAlign: 'right', minWidth: '140px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, marginTop: '2px' }}>{m.label}</div>
                  <div style={{ fontFamily: SANS, fontSize: '10px', color: DIM, marginTop: '1px' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '24px 32px', gap: '20px' }}>

        {/* LEFT — System list */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          {/* Tab nav */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
            {([['portfolio', 'Systems'], ['spend', 'IT Spend'], ['contracts', 'Contracts']] as const).map(([id, label]) => (
              <button key={id} onClick={() => { setActiveTab(id); setSelectedSystem(null) }}
                style={{ flex: 1, fontFamily: MONO, fontSize: '9px', padding: '6px 4px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', border: `1px solid ${activeTab === id ? TEAL : BORDER}`, background: activeTab === id ? 'rgba(45,212,200,0.08)' : BG, color: activeTab === id ? TEAL : MUTED }}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'portfolio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {ARCTURUS_SYSTEMS.map(group => (
                <div key={group.group}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 10px 6px', marginTop: '6px' }}>
                    {group.group}
                  </div>
                  {group.systems.map(sys => {
                    const hc = healthColor(sys.health)
                    const active = selectedSystem?.id === sys.id
                    return (
                      <button key={sys.id} onClick={() => setSelectedSystem(sys)}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${active ? hc + '40' : 'transparent'}`, background: active ? `${hc}08` : 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hc, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: SANS, fontSize: '13px', color: active ? WHITE : MUTED, fontWeight: active ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sys.name}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, marginTop: '1px' }}>
                            ${sys.annualCost}M · {sys.contractEnd}
                          </div>
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: '8px', color: hc, background: `${hc}15`, borderRadius: '3px', padding: '1px 5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {healthLabel(sys.health)}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'spend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, marginBottom: '6px' }}>TOTAL vs PEER</div>
                <div style={{ fontFamily: MONO, fontSize: '22px', color: WHITE, fontWeight: 700 }}>$680M</div>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: RED, marginTop: '2px' }}>+$178M above peer ($502M)</div>
                <div style={{ fontFamily: SANS, fontSize: '11px', color: DIM, marginTop: '6px' }}>4.2% of revenue vs 3.1% peer benchmark</div>
              </div>
              {ARCTURUS_SPEND.categories.map(c => (
                <div key={c.name} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED }}>{c.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: '11px', color: WHITE, fontWeight: 600 }}>${c.amount}M</div>
                  </div>
                  <div style={{ height: '4px', background: BORDER, borderRadius: '2px' }}>
                    <div style={{ height: '4px', background: c.name.includes('AI') ? AMBER : TEAL, borderRadius: '2px', width: `${c.pct}%` }} />
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, marginTop: '3px' }}>{c.pct}% of total IT</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contracts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CONTRACTS_URGENT.map(c => (
                <div key={c.vendor} style={{ background: CARD, border: `1px solid ${riskColor(c.risk)}30`, borderLeft: `3px solid ${riskColor(c.risk)}`, borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '12px', color: WHITE, fontWeight: 600, lineHeight: 1.3 }}>{c.vendor}</div>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: riskColor(c.risk), background: `${riskColor(c.risk)}15`, borderRadius: '3px', padding: '1px 5px', flexShrink: 0, marginLeft: '8px' }}>{c.end}</div>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, lineHeight: 1.4 }}>{c.leverage}</div>
                </div>
              ))}
              <div style={{ marginTop: '8px', background: 'rgba(45,212,200,0.05)', border: `1px solid rgba(45,212,200,0.15)`, borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, marginBottom: '4px' }}>KEY WINDOW</div>
                <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>Bloomberg December 2026 auto-renewal is the only contract leverage point in 5+ years. API access improvements must be negotiated now. The migration threat (Charles River + Aladdin OMS) is the only credible bargaining chip.</div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER — System detail or overview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedSystem ? (
            <div>
              <button onClick={() => setSelectedSystem(null)}
                style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                ← Back to portfolio
              </button>

              {/* System header */}
              <div style={{ background: CARD, border: `1px solid ${healthColor(selectedSystem.health)}30`, borderTop: `3px solid ${healthColor(selectedSystem.health)}`, borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: healthColor(selectedSystem.health), letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {healthLabel(selectedSystem.health)} · {selectedSystem.category}
                    </div>
                    <h2 style={{ fontFamily: SANS, fontSize: '22px', fontWeight: 700, color: WHITE, margin: 0 }}>{selectedSystem.name}</h2>
                    <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, marginTop: '2px' }}>{selectedSystem.vendor} · {selectedSystem.function}</div>
                  </div>
                </div>

                {/* Key metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {[
                    { label: 'Annual Cost', value: `$${selectedSystem.annualCost}M`, color: selectedSystem.annualCost > 20 ? AMBER : WHITE },
                    { label: 'System Age', value: `${selectedSystem.age} yrs`, color: selectedSystem.age > 15 ? RED : selectedSystem.age > 8 ? AMBER : GREEN },
                    { label: 'Deployment', value: selectedSystem.deploymentModel, color: WHITE },
                    { label: 'Contract', value: selectedSystem.contractEnd, color: selectedSystem.autoRenew ? AMBER : WHITE },
                    { label: 'AI Readiness', value: `${selectedSystem.aiReadinessScore}/100`, color: selectedSystem.aiReadinessScore < 30 ? RED : selectedSystem.aiReadinessScore < 60 ? AMBER : GREEN },
                  ].map(m => (
                    <div key={m.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '10px 12px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '8px', color: DIM, marginBottom: '4px' }}>{m.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: '13px', color: m.color, fontWeight: 600 }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {selectedSystem.autoRenew && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.25)`, borderRadius: '6px', fontFamily: MONO, fontSize: '10px', color: AMBER }}>
                    ⚠ AUTO-RENEWS {selectedSystem.contractEnd} — negotiate before this date or contract locks in automatically
                  </div>
                )}
              </div>

              {/* Issues */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Known Issues</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedSystem.issues.map((issue, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ color: RED, fontFamily: MONO, fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>!</div>
                      <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.5 }}>{issue}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Blocker */}
              <div style={{ background: 'rgba(239,68,68,0.04)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: RED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>AI Impact</div>
                <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>{selectedSystem.aiBlockerNote}</div>
              </div>

              {/* Contract */}
              <div style={{ background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.15)`, borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Contract Intelligence · {selectedSystem.contractEnd}</div>
                <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>{selectedSystem.contractNote}</div>
              </div>

              {/* Recommended Action */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: GREEN, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Recommended Action</div>
                <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, lineHeight: 1.6 }}>{selectedSystem.action}</div>
                <button
                  onClick={() => sendChat(`Tell me more about ${selectedSystem.name}. ${selectedSystem.contractNote} What should my next 3 moves be?`)}
                  style={{ marginTop: '12px', fontFamily: MONO, fontSize: '10px', padding: '8px 16px', background: 'rgba(45,212,200,0.1)', border: `1px solid rgba(45,212,200,0.3)`, borderRadius: '6px', color: TEAL, cursor: 'pointer' }}>
                  Ask AbarVa about {selectedSystem.name} →
                </button>
              </div>
            </div>
          ) : (
            /* Overview when no system selected */
            <div>
              {/* Critical alerts */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Critical Findings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { severity: RED, title: 'Bloomberg AIM auto-renews December 2026', body: '3 failed modernisations ($22.2M sunk). API rate limit blocks all real-time AI. December 2026 is the ONLY leverage window in 5+ years — negotiate API access as contract condition or miss this window.' },
                    { severity: RED, title: 'MAS FEAT overdue 4 months — zero AI models documented', body: '$2.4B Singapore AUM at regulatory risk. CRO has frozen all new AI deployments. MAS governance framework is the unlock — without it, the AI portfolio stays paralysed.' },
                    { severity: AMBER, title: 'Salesforce FSC: 44% adoption after $38M — flat for 3 quarters', body: 'Einstein AI licensed and idle. 4 AI initiatives blocked by adoption ceiling. Root cause: Bloomberg SSO not built — advisors see stale data in FSC. Fix SSO, unlock adoption.' },
                    { severity: AMBER, title: '3-day reporting lag from Advent Geneva blocking client AI', body: 'June 2026 renewal is the cloud migration negotiation window. Without cloud Geneva (or SS&C Eze migration), AI-Powered Client Reporting ($22M value) cannot be built.' },
                  ].map((a, i) => (
                    <div key={i} style={{ background: CARD, border: `1px solid ${a.severity}25`, borderLeft: `3px solid ${a.severity}`, borderRadius: '8px', padding: '14px 18px' }}>
                      <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600, marginBottom: '4px' }}>{a.title}</div>
                      <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{a.body}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System health grid */}
              <div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  System Health · Click any system for detail
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {allSystems.map(sys => {
                    const hc = healthColor(sys.health)
                    return (
                      <button key={sys.id} onClick={() => { setSelectedSystem(sys); setActiveTab('portfolio') }}
                        style={{ textAlign: 'left', background: CARD, border: `1px solid ${hc}25`, borderTop: `2px solid ${hc}`, borderRadius: '8px', padding: '14px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600, lineHeight: 1.3 }}>{sys.name}</div>
                          <div style={{ fontFamily: MONO, fontSize: '8px', color: hc, background: `${hc}15`, borderRadius: '3px', padding: '1px 5px', flexShrink: 0, marginLeft: '8px' }}>
                            {healthLabel(sys.health)}
                          </div>
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: '11px', color: DIM, marginBottom: '8px' }}>{sys.vendor}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED }}>${sys.annualCost}M/yr</div>
                          <div style={{ fontFamily: MONO, fontSize: '10px', color: sys.aiReadinessScore < 30 ? RED : sys.aiReadinessScore < 60 ? AMBER : GREEN }}>
                            AI {sys.aiReadinessScore}/100
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Chat */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Technology Advisor · CIO Lens
            </div>

            {/* Pre-built questions */}
            {chatMessages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {PRE_BUILT.map((q, i) => (
                  <button key={i} onClick={() => sendChat(q)}
                    style={{ textAlign: 'left', fontFamily: SANS, fontSize: '11px', color: MUTED, background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', lineHeight: 1.4 }}>
                    {q.slice(0, 80)}…
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: m.role === 'user' ? TEAL : INDIGO, fontWeight: 700 }}>
                    {m.role === 'user' ? 'YOU' : 'ABARVA'}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                </div>
              ))}
              {streamingResponse && (
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: INDIGO, fontWeight: 700 }}>ABARVA</div>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{streamingResponse}</div>
                </div>
              )}
              {chatLoading && !streamingResponse && (
                <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM }}>···</div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                placeholder="Ask about any system…"
                style={{ flex: 1, background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '8px 10px', fontFamily: SANS, fontSize: '12px', color: WHITE, outline: 'none' }}
              />
              <button onClick={() => sendChat()}
                style={{ fontFamily: MONO, fontSize: '10px', padding: '8px 12px', background: 'rgba(45,212,200,0.12)', border: `1px solid rgba(45,212,200,0.3)`, borderRadius: '6px', color: TEAL, cursor: 'pointer' }}>
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div style={{ background: BG, minHeight: '100vh' }} />}>
      <IntelligenceContent />
    </Suspense>
  )
}
