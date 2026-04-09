'use client'
import { useUser, UserButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { meridianHealth } from '@/data/meridian/index'
import { meridianFinancials } from '@/data/meridian/index'
import { meridianTechnology } from '@/data/meridian/index'
import { meridianClinical } from '@/data/meridian/index'
import { meridianLeadership } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'
import { regulatoryAlerts } from '@/data/knowledge/regulatory'

type Tab = 'overview' | 'financial' | 'technology' | 'clinical' | 'leadership' | 'diagnose' | 'transform' | 'data' | 'intelligence'

export default function Home() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [activeClient, setActiveClient] = useState('meridian')
  const [role, setRole] = useState('CIO')
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [streamingResponse, setStreamingResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [greenFieldClients, setGreenFieldClients] = useState<Array<{id: string, name: string}>>([])
  const [denialRate, setDenialRate] = useState(18.2)
  const [epicScore, setEpicScore] = useState(58)
  const [maStars, setMaStars] = useState(3.5)
  const [selectedSystem, setSelectedSystem] = useState<any>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const baseMargin = 1.8
  const rcmImpact = ((18.2 - denialRate) / 18.2) * 0.8
  const epicImpact = ((epicScore - 58) / 100) * 0.4
  const maImpact = maStars >= 4.0 ? 0.3 : 0
  const projectedMargin = (baseMargin + rcmImpact + epicImpact + maImpact).toFixed(1)
  const revenueRecovered = (((18.2 - denialRate) / 18.2) * 94).toFixed(0)

  useEffect(() => {
    async function loadGreenFieldClients() {
      const { data } = await supabase.from('clients').select('id, name')
      if (data) {
        const extra = data.filter(c =>
          c.name !== 'Meridian Health System' &&
          c.name !== 'First Capital Financial'
        ).map(c => ({ id: c.id, name: c.name.length > 18 ? c.name.substring(0, 18) + '...' : c.name }))
        setGreenFieldClients(extra)
      }
    }
    loadGreenFieldClients()
  }, [])

  const builtInClients = [
    { id: 'meridian', name: 'Meridian Health', industry: 'Healthcare', confidence: 94 },
    { id: 'firstcapital', name: 'First Capital', industry: 'Financial Services', confidence: 88 },
    { id: 'apexretail', name: 'Apex Retail', industry: 'Retail', confidence: 86 },
  ]

  function switchClient(clientId: string) {
    setActiveClient(clientId)
    setActiveTab('overview')
    setMessages([])
    setStreamingResponse('')
    setRole('CIO')
  }

  const currentBuiltIn = builtInClients.find(c => c.id === activeClient)
  const currentClient = currentBuiltIn || { id: activeClient, name: greenFieldClients.find(c => c.id === activeClient)?.name || 'Client', industry: 'Unknown', confidence: 23 }
  const isGreenField = !builtInClients.find(c => c.id === activeClient)

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '○' },
    { id: 'diagnose', label: 'Diagnose', icon: '⚡' },
    { id: 'transform', label: 'Transform', icon: '→' },
    { id: 'financial', label: 'Financial', icon: '$' },
    { id: 'technology', label: 'Technology', icon: '◫' },
    { id: 'clinical', label: 'Clinical', icon: '♥' },
    { id: 'leadership', label: 'Leadership', icon: '◈' },
    { id: 'data', label: 'Data Manager', icon: '⊞' },
    { id: 'intelligence', label: 'Intelligence', icon: '◉' },
  ]

  function statusDot(status: 'red' | 'yellow' | 'green') {
    const colors = { red: 'bg-red-500', yellow: 'bg-amber-400', green: 'bg-emerald-500' }
    return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />
  }

  function badge(text: string, color: 'red' | 'yellow' | 'green' | 'blue' | 'gray') {
    const styles = {
      red: 'bg-red-50 text-red-700 border border-red-200',
      yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
      green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      blue: 'bg-blue-50 text-blue-700 border border-blue-200',
      gray: 'bg-slate-100 text-slate-600 border border-slate-200',
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[color]}`}>{text}</span>
  }

  function getRegulatoryAlerts() {
    if (activeClient === 'firstcapital') return regulatoryAlerts.firstcapital
    if (activeClient === 'apexretail') return regulatoryAlerts.apexretail
    return regulatoryAlerts.meridian
  }

  function getPrescribedLoads() {
    if (activeClient === 'firstcapital') return [
      'FIS HORIZON architecture docs — unlocks migration path analysis',
      'Full vendor contracts — unlocks negotiation intelligence',
      'Customer analytics — unlocks churn and growth strategy',
    ]
    if (activeClient === 'apexretail') return [
      'SAP ECC custom code inventory — unlocks migration complexity score',
      'Store-level P&L data — unlocks portfolio optimization',
      'Loyalty program analytics — unlocks $1.24B activation strategy',
    ]
    return [
      'Ensemble contract — unlocks SLA penalty analysis ($8M)',
      'RCM denial data by payer — unlocks payer-specific strategy',
      'Epic optimization assessment — unlocks module prioritization',
    ]
  }

  function getRoleTabs() {
    if (activeClient === 'apexretail' || activeClient === 'firstcapital') return ['CIO', 'CFO', 'COO', 'CMO', 'CEO']
    return ['CIO', 'CFO', 'COO', 'CMIO', 'CEO']
  }

  function getSuggestions(r: string) {
    if (activeClient === 'firstcapital') {
      const s: Record<string, string[]> = {
        CIO: ["Should we replace FIS HORIZON or add an API layer?", "How do we get FedNow live before we lose more commercial clients?", "Our SQL Server 2017 support ends October 2025 — what do we do?"],
        CFO: ["What is the ROI case for core banking modernization?", "How do we get cost-to-income from 68% to 55%?", "Our fraud losses are $3.8M above benchmark — fastest fix?"],
        COO: ["Every technology project goes over budget — how do we break that pattern?", "How do we automate AML without adding headcount?", "Call center handle time 7.2 min vs 4.8 benchmark — what drives that?"],
        CMO: ["We have 1.8M digital customers seeing yesterday's balances — how do we fix this?", "Mobile app rating 3.2 — what is killing our score?", "How do we grow digital adoption from 41% to 60%?"],
        CEO: ["Strategic risk of keeping FIS HORIZON 3 more years?", "How do we position as digital bank without $180M core banking investment?", "FedNow — how long before commercial clients start leaving?"],
      }
      return s[r] || s['CIO']
    }
    if (activeClient === 'apexretail') {
      const s: Record<string, string[]> = {
        CIO: ["S4 HANA or something else — right SAP migration path?", "Our o9 demand planning is 40% implemented and stalled — how do we fix it?", "IBM Sterling OMS is 3 versions behind — upgrade or replace?"],
        CFO: ["ROI case for SAP S4 HANA vs alternatives?", "Inventory turnover 4.2x vs 6.8x benchmark — what does that cost us?", "How do we get operating margin from 3.8% to 6% in 24 months?"],
        COO: ["Inventory accuracy 84% vs 98% benchmark — omnichannel is impossible at 84%", "How do we reduce 68% annual staff turnover?", "China sourcing at 48% — how do we diversify in 18 months?"],
        CMO: ["18 million loyalty members — 42% active vs 68% benchmark — what is wrong?", "Personalization engine — Dynamic Yield vs Bloomreach vs Salesforce Einstein?", "Email unsubscribe rate 2.8% vs 0.8% benchmark — what do we do?"],
        CEO: ["SAP ECC support ends 2027 — board wants decision by Q3 — what do I tell them?", "Amazon is taking $1.24B of our revenue — what is the digital strategy?", "How do we close the $840M cart abandonment opportunity?"],
      }
      return s[r] || s['CIO']
    }
    const s: Record<string, string[]> = {
      CIO: ["Should we stay with Ensemble for RCM or find a new vendor?", "What should I prioritize in my first 90 days?", "We need to complete the Blue Ridge integration — where do we start?"],
      CFO: ["How do we recover the $94M in RCM revenue leakage?", "Is our $340M IT budget being spent in the right places?", "What is the fastest path to the 4% operating margin target?"],
      COO: ["How do we reduce travel nurse dependency without impacting care?", "The Blue Ridge cultural integration is failing — what do we do?", "Our readmission rate is too high — what drives it?"],
      CMIO: ["How do we finally get Epic optimized after years of underinvestment?", "Physician burnout is getting worse — how can AI help?", "We have AI pilots at 2 hospitals — how do we scale them?"],
      CEO: ["What is our realistic path to 4% operating margin by FY2026?", "How do we position Meridian as the AI leader in Southeast healthcare?", "The board is losing patience — what do I tell them?"],
    }
    return s[r] || s['CIO']
  }

  function getOverviewMetrics() {
    if (activeClient === 'firstcapital') return [
      { label: 'Cost-to-Income', value: `${firstCapital.financials.costToIncomeRatio}%`, target: `Target: ${firstCapital.financials.targetCostToIncomeRatio}%`, status: 'red' as const, tab: 'financial' as Tab },
      { label: 'Digital Adoption', value: `${firstCapital.technology.digital.digitalAdoptionRate}%`, target: 'Benchmark: 67%', status: 'red' as const, tab: 'technology' as Tab },
      { label: 'Core Banking Age', value: `${firstCapital.technology.coreBanking.age} yrs`, target: 'Critical: 20 yrs', status: 'red' as const, tab: 'technology' as Tab },
      { label: 'FedNow Live', value: 'No', target: '68% of peers live', status: 'red' as const, tab: 'technology' as Tab },
    ]
    if (activeClient === 'apexretail') return [
      { label: 'Operating Margin', value: `${apexRetail.org.operatingMargin}%`, target: `Target: ${apexRetail.org.targetOperatingMargin}%`, status: 'red' as const, tab: 'financial' as Tab },
      { label: 'Digital Revenue', value: `${apexRetail.org.ecommercePercent}%`, target: 'Target: 45%', status: 'yellow' as const, tab: 'technology' as Tab },
      { label: 'Inventory Turnover', value: `${apexRetail.financials.inventoryTurnover}x`, target: 'Benchmark: 6.8x', status: 'red' as const, tab: 'technology' as Tab },
      { label: 'Loyalty Active Rate', value: `${apexRetail.financials.loyaltyMemberPercent}%`, target: 'Benchmark: 68%', status: 'yellow' as const, tab: 'diagnose' as Tab },
    ]
    return [
      { label: 'Operating Margin', value: `${meridianHealth.org.operatingMargin}%`, target: `Target: ${meridianHealth.financials.targetOperatingMargin}%`, status: 'red' as const, tab: 'financial' as Tab },
      { label: 'RCM Denial Rate', value: `${meridianHealth.technology.rcm.denialRate}%`, target: 'Benchmark: 11.4%', status: 'red' as const, tab: 'financial' as Tab },
      { label: 'Epic Optimization', value: `${meridianHealth.technology.ehr.optimizationScore}/100`, target: 'Target: 85/100', status: 'yellow' as const, tab: 'technology' as Tab },
      { label: 'MA Star Rating', value: `${meridianHealth.healthPlan.medicareAdvantage.starRating}`, target: 'Bonus: 4.0 stars', status: 'yellow' as const, tab: 'clinical' as Tab },
    ]
  }

  function getContradictions() {
    if (activeClient === 'firstcapital') return firstCapital.contradictions
    if (activeClient === 'apexretail') return apexRetail.contradictions
    return meridianHealth.contradictions
  }

  function getStrategicPriorities() {
    if (activeClient === 'firstcapital') return firstCapital.strategicPriorities
    if (activeClient === 'apexretail') return apexRetail.strategicPriorities
    return meridianHealth.strategicPriorities
  }

  function getDataInventory() {
    if (activeClient === 'firstcapital') return firstCapital.dataInventory
    if (activeClient === 'apexretail') return apexRetail.dataInventory
    return [
      { category: 'Financial Performance', confidence: 85, status: 'loaded', source: 'Pre-loaded · Public + internal' },
      { category: 'Technology Landscape', confidence: 78, status: 'loaded', source: 'Pre-loaded · System inventory' },
      { category: 'Clinical Quality', confidence: 72, status: 'loaded', source: 'Pre-loaded · CMS data' },
      { category: 'Leadership Intelligence', confidence: 68, status: 'loaded', source: 'Pre-loaded · Interviews' },
      { category: 'Vendor Contracts', confidence: 45, status: 'partial', source: 'Partial · Ensemble only' },
      { category: 'Board Materials', confidence: 0, status: 'missing', source: 'Not loaded · Requires CEO approval' },
      { category: 'HR and Workforce', confidence: 0, status: 'missing', source: 'Not loaded · Requires CHRO approval' },
      { category: 'Engagement History', confidence: 0, status: 'missing', source: 'No prior engagements' },
    ]
  }

  async function sendMessage(text?: string) {
    const messageText = text || inputMessage
    if (!messageText.trim()) return
    const newMessage = { role: 'user', content: messageText }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setInputMessage('')
    setLoading(true)
    setStreamingResponse('')
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages, role, client: activeClient })
    })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    if (!reader) return
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullResponse += decoder.decode(value)
      setStreamingResponse(fullResponse)
    }
    setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])
    setStreamingResponse('')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{background: '#FAFAFA', color: '#0F172A'}}>

      {/* Nav */}
      <nav style={{background: '#FFFFFF', borderBottom: '1px solid #E2E8F0'}} className="px-6 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{color: '#94A3B8'}} className="hover:text-slate-600 transition text-lg">☰</button>
          <div className="flex items-center gap-2">
            <div style={{background: '#2563EB'}} className="w-7 h-7 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-base font-semibold" style={{color: '#0F172A'}}>Abarva</span>
          </div>
          <span style={{color: '#E2E8F0'}}>|</span>
          <div className="flex gap-2 flex-wrap items-center">
            {builtInClients.map(c => (
              <button key={c.id} onClick={() => switchClient(c.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                style={activeClient === c.id
                  ? {background: '#2563EB', color: '#FFFFFF'}
                  : {background: '#F4F6F8', color: '#475569', border: '1px solid #E2E8F0'}}>
                {c.name}
              </button>
            ))}
            {greenFieldClients.map(c => (
              <button key={c.id} onClick={() => switchClient(c.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                style={activeClient === c.id
                  ? {background: '#7C3AED', color: '#FFFFFF'}
                  : {background: '#F4F6F8', color: '#475569', border: '1px solid #E2E8F0'}}>
                {c.name} <span style={{color: '#F59E0B'}}>●</span>
              </button>
            ))}
            <button onClick={() => window.location.href = '/search'}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{background: '#F0FDF4', color: '#059669', border: '1px solid #D1FAE5'}}>
              + New Client
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{background: '#EFF6FF', color: '#2563EB'}}>Maestro</span>
          <span className="text-sm" style={{color: '#475569'}}>{user?.firstName} {user?.lastName}</span>
          <UserButton />
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-52 flex-shrink-0 flex flex-col" style={{background: '#FFFFFF', borderRight: '1px solid #E2E8F0'}}>
            <div className="p-4 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{color: '#94A3B8'}}>{currentClient.name}</p>
              <p className="text-xs mb-4" style={{color: '#CBD5E1'}}>{currentClient.industry}</p>
              <nav className="space-y-0.5">
                {navItems.map(item => (
                  <button key={item.id}
                    onClick={() => {
                      if (item.id === 'intelligence') {
                        window.location.href = `/intelligence?client=${activeClient}`
                      } else {
                        setActiveTab(item.id as Tab)
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition text-left"
                    style={activeTab === item.id
                      ? {background: '#EFF6FF', color: '#2563EB', fontWeight: 600}
                      : {color: '#475569'}}>
                    <span className="text-xs w-4">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4" style={{borderTop: '1px solid #E2E8F0'}}>
              <div className="flex justify-between mb-1">
                <p className="text-xs" style={{color: '#94A3B8'}}>Data confidence</p>
                <p className="text-xs font-semibold" style={{color: '#0F172A'}}>{currentClient.confidence}%</p>
              </div>
              <div className="w-full rounded-full h-1.5" style={{background: '#E2E8F0'}}>
                <div className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${currentClient.confidence}%`,
                    background: currentClient.confidence >= 80 ? '#059669' : currentClient.confidence >= 60 ? '#2563EB' : '#F59E0B'
                  }} />
              </div>
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-8" style={{background: '#FAFAFA'}}>

          {/* OVERVIEW */}
          {!isGreenField && activeTab === 'overview' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-1" style={{color: '#0F172A'}}>Good morning, {user?.firstName || 'Maestro'}.</h2>
                <p style={{color: '#475569'}} className="text-sm">{currentClient.name} · {currentClient.industry} · {currentClient.confidence}% data confidence</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {getOverviewMetrics().map(metric => (
                  <button key={metric.label}
                    onClick={() => setActiveTab(metric.tab)}
                    className="p-5 rounded-xl text-left transition hover:shadow-md"
                    style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-medium" style={{color: '#475569'}}>{metric.label}</span>
                      {statusDot(metric.status)}
                    </div>
                    <div className="text-3xl font-bold mb-1" style={{color: '#0F172A'}}>{metric.value}</div>
                    <div className="text-xs" style={{color: '#94A3B8'}}>{metric.target}</div>
                    <p className="text-xs mt-2" style={{color: '#2563EB'}}>Explore →</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Contradictions */}
                <div className="col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color: '#94A3B8'}}>Contradictions Detected</h3>
                  <div className="space-y-2">
                    {getContradictions().map((c, i) => (
                      <div key={i} className="p-4 rounded-xl flex gap-3"
                        style={{background: '#FFF7F7', border: '1px solid #FEE2E2'}}>
                        <span className="font-bold text-sm flex-shrink-0" style={{color: '#DC2626'}}>{i + 1}</span>
                        <p className="text-sm" style={{color: '#374151'}}>{c}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priorities + Actions */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color: '#94A3B8'}}>Strategic Priorities</h3>
                  <div className="space-y-2 mb-6">
                    {getStrategicPriorities().map((p, i) => (
                      <div key={i} className="p-3 rounded-lg text-sm"
                        style={{background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#374151'}}>
                        {p}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('diagnose')}
                    className="w-full font-semibold py-3 rounded-xl transition text-sm mb-2"
                    style={{background: '#2563EB', color: '#FFFFFF'}}>
                    Run Diagnosis →
                  </button>
                  <button onClick={() => setActiveTab('transform')}
                    className="w-full font-semibold py-3 rounded-xl transition text-sm"
                    style={{background: '#F4F6F8', color: '#374151', border: '1px solid #E2E8F0'}}>
                    Simulate Transformation →
                  </button>
                </div>
              </div>

              {/* Regulatory Alerts */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color: '#94A3B8'}}>Regulatory Alerts</h3>
                <div className="space-y-3">
                  {getRegulatoryAlerts().map((alert, i) => (
                    <div key={i} className="p-4 rounded-xl flex gap-4"
                      style={{
                        background: alert.severity === 'red' ? '#FFF7F7' : '#FFFBEB',
                        border: `1px solid ${alert.severity === 'red' ? '#FEE2E2' : '#FEF3C7'}`
                      }}>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm" style={{color: '#0F172A'}}>{alert.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-4"
                            style={{
                              background: alert.severity === 'red' ? '#FEE2E2' : '#FEF3C7',
                              color: alert.severity === 'red' ? '#DC2626' : '#D97706'
                            }}>
                            {alert.monthsRemaining === 0 ? 'Active now' : `${alert.monthsRemaining} months`}
                          </span>
                        </div>
                        <p className="text-xs mb-1" style={{color: '#374151'}}>{alert.meridianGap}</p>
                        <p className="text-xs mb-2" style={{color: '#94A3B8'}}>
                          Cost to comply: {alert.costToComply} · Non-compliance: {alert.costOfNonCompliance}
                        </p>
                        <button
                          onClick={() => { setActiveTab('diagnose'); setTimeout(() => sendMessage(alert.diagnosePrompt), 300) }}
                          className="text-xs font-medium transition"
                          style={{color: '#2563EB'}}>
                          Ask Abarva for compliance plan →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSE */}
          {activeTab === 'diagnose' && (
            <div className="flex flex-col" style={{height: 'calc(100vh - 120px)'}}>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-1" style={{color: '#0F172A'}}>Diagnose — {currentClient.name}</h2>
                <p className="text-sm" style={{color: '#475569'}}>{currentClient.confidence}% confidence · {currentClient.industry}</p>
              </div>
              <div className="flex gap-2 mb-4">
                {getRoleTabs().map(r => (
                  <button key={r} onClick={() => { setRole(r); setMessages([]); setStreamingResponse('') }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    style={role === r
                      ? {background: '#2563EB', color: '#FFFFFF'}
                      : {background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0'}}>
                    {r}
                  </button>
                ))}
                <button onClick={() => { setMessages([]); setStreamingResponse('') }}
                  className="ml-auto px-3 py-1.5 rounded-lg text-xs transition"
                  style={{background: '#F4F6F8', color: '#475569', border: '1px solid #E2E8F0'}}>
                  New conversation
                </button>
              </div>

              {messages.length === 0 && !streamingResponse && (
                <div className="mb-4">
                  <p className="text-xs mb-3" style={{color: '#94A3B8'}}>Suggested for {role} at {currentClient.name}:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {getSuggestions(role).map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)}
                        className="p-3 rounded-lg text-left text-xs transition hover:shadow-sm"
                        style={{background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#374151'}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-3xl rounded-xl p-4 text-sm leading-relaxed"
                      style={msg.role === 'user'
                        ? {background: '#2563EB', color: '#FFFFFF'}
                        : {background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#374151'}}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && !streamingResponse && (
                  <div className="flex justify-start">
                    <div className="rounded-xl p-4 text-sm" style={{background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#94A3B8'}}>
                      Analyzing {currentClient.name}...
                    </div>
                  </div>
                )}
                {streamingResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
                      style={{background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#374151'}}>
                      {streamingResponse}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                  style={{background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A'}}
                  placeholder={`Ask Abarva anything as ${role} at ${currentClient.name}...`}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button onClick={() => sendMessage()} disabled={loading || !inputMessage.trim()}
                  className="font-semibold px-6 py-3 rounded-xl transition text-sm disabled:opacity-50"
                  style={{background: '#2563EB', color: '#FFFFFF'}}>
                  Send
                </button>
              </div>
            </div>
          )}

          {/* TRANSFORM */}
          {!isGreenField && activeTab === 'transform' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1" style={{color: '#0F172A'}}>Transformation Simulator</h2>
                <p className="text-sm" style={{color: '#475569'}}>Model the financial impact of transformation initiatives</p>
              </div>
              {activeClient === 'meridian' ? (
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{color: '#94A3B8'}}>Adjust Initiatives</h3>
                    <div className="space-y-8">
                      {[
                        { label: 'RCM Denial Rate', value: `${denialRate.toFixed(1)}%`, min: 8, max: 22, step: 0.1, val: denialRate, set: setDenialRate, left: '8.2% top quartile', right: '22% critical' },
                        { label: 'Epic Optimization Score', value: `${epicScore}/100`, min: 58, max: 100, step: 1, val: epicScore, set: setEpicScore, left: 'Current: 58', right: 'Best: 100' },
                        { label: 'Medicare Advantage Stars', value: `${maStars.toFixed(1)}`, min: 3.0, max: 5.0, step: 0.5, val: maStars, set: setMaStars, left: 'Current: 3.5', right: 'Max: 5.0' },
                      ].map((slider, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium" style={{color: '#0F172A'}}>{slider.label}</label>
                            <span className="text-sm font-bold" style={{color: '#2563EB'}}>{slider.value}</span>
                          </div>
                          <input type="range" min={slider.min} max={slider.max} step={slider.step}
                            value={slider.val} onChange={e => slider.set(parseFloat(e.target.value))}
                            className="w-full accent-blue-600" />
                          <div className="flex justify-between text-xs mt-1" style={{color: '#94A3B8'}}>
                            <span>{slider.left}</span><span>{slider.right}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{color: '#94A3B8'}}>Projected Impact</h3>
                    <div className="p-6 rounded-xl mb-4" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                      <p className="text-xs mb-2" style={{color: '#94A3B8'}}>Projected Operating Margin</p>
                      <div className="flex items-end gap-3 mb-4">
                        <span className="text-5xl font-bold" style={{color: '#2563EB'}}>{projectedMargin}%</span>
                        <span className="text-sm mb-2" style={{color: '#475569'}}>
                          {parseFloat(projectedMargin) > baseMargin ? `+${(parseFloat(projectedMargin) - baseMargin).toFixed(1)}% improvement` : 'No change'}
                        </span>
                      </div>
                      <div className="w-full rounded-full h-2 mb-2" style={{background: '#E2E8F0'}}>
                        <div className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((parseFloat(projectedMargin) / 4.0) * 100, 100)}%`,
                            background: parseFloat(projectedMargin) >= 4.0 ? '#059669' : parseFloat(projectedMargin) >= 3.0 ? '#F59E0B' : '#DC2626'
                          }} />
                      </div>
                      <p className="text-xs" style={{color: '#94A3B8'}}>
                        {parseFloat(projectedMargin) >= 4.0 ? 'Board target achieved' : `${(4.0 - parseFloat(projectedMargin)).toFixed(1)}% below board target`}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'RCM revenue recovered', value: `$${revenueRecovered}M`, sub: denialRate < 18.2 ? `Denial rate reduced to ${denialRate.toFixed(1)}%` : 'Move slider to model impact' },
                        { label: 'MA bonus revenue', value: maStars >= 4.0 ? '$34M' : '$0', sub: maStars >= 4.0 ? 'Bonus threshold achieved' : 'Raise stars to 4.0 to unlock $34M' },
                        { label: 'Epic efficiency gains', value: `$${Math.round((epicScore - 58) * 0.7)}M`, sub: `${epicScore - 58} point optimization` },
                      ].map((m, i) => (
                        <div key={i} className="p-4 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm" style={{color: '#475569'}}>{m.label}</span>
                            <span className="text-sm font-bold" style={{color: '#059669'}}>{m.value}</span>
                          </div>
                          <p className="text-xs" style={{color: '#94A3B8'}}>{m.sub}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setActiveTab('diagnose')}
                      className="w-full mt-4 font-semibold py-3 rounded-xl transition text-sm"
                      style={{background: '#2563EB', color: '#FFFFFF'}}>
                      Ask Abarva how to get there →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(activeClient === 'firstcapital' ? firstCapital.aiOpportunities : apexRetail.aiOpportunities).map((o, i) => (
                    <div key={i} className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold" style={{color: '#0F172A'}}>{o.useCase}</h3>
                        <span className="font-bold" style={{color: '#059669'}}>${((o.annualSaving || o.annualRevenue || 0) / 1000000).toFixed(0)}M</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><p className="text-xs mb-1" style={{color: '#94A3B8'}}>Time to Value</p><p className="font-medium">{o.timeToValue}</p></div>
                        <div><p className="text-xs mb-1" style={{color: '#94A3B8'}}>ROI</p><p className="font-medium" style={{color: '#2563EB'}}>{o.roi}x</p></div>
                        <div><p className="text-xs mb-1" style={{color: '#94A3B8'}}>Investment</p><p className="font-medium">${((o.implementationCost || 0) / 1000000).toFixed(1)}M</p></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('diagnose')}
                    className="w-full font-semibold py-3 rounded-xl transition text-sm"
                    style={{background: '#2563EB', color: '#FFFFFF'}}>
                    Ask Abarva how to prioritize →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FINANCIAL */}
          {!isGreenField && activeTab === 'financial' && (
            <div>
              <h2 className="text-xl font-bold mb-6" style={{color: '#0F172A'}}>Financial Performance — {currentClient.name}</h2>
              <div className="grid grid-cols-3 gap-4">
                {activeClient === 'meridian' && [
                  { label: 'Annual Revenue', value: `$${meridianFinancials.annual.revenue2023}B`, sub: `vs $${meridianFinancials.annual.revenue2022}B prior year`, status: 'green' as const },
                  { label: 'Operating Margin', value: `${meridianFinancials.annual.operatingMargin2023}%`, sub: `Target: ${meridianFinancials.annual.targetOperatingMargin}%`, status: 'red' as const },
                  { label: 'Days Cash on Hand', value: `${meridianFinancials.annual.daysOfCashOnHand}`, sub: `Credit: ${meridianFinancials.annual.creditRating}`, status: 'green' as const },
                  { label: 'RCM Denial Write-off', value: `$${meridianFinancials.rcmPerformance.denialWriteOff2023}M`, sub: `vs $${meridianFinancials.rcmPerformance.denialWriteOff2022}M prior year`, status: 'red' as const },
                  { label: 'Days in AR', value: `${meridianFinancials.rcmPerformance.daysInAR}`, sub: `Target: ${meridianFinancials.rcmPerformance.daysInARTarget}`, status: 'red' as const },
                  { label: 'IT Budget', value: `$${meridianFinancials.itBudget.total2024}M`, sub: `${meridianFinancials.itBudget.asPercentRevenue}% of revenue`, status: 'yellow' as const },
                ].map((m, i) => (
                  <div key={i} className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                    <div className="flex justify-between mb-2">{badge(m.label, 'gray')}{statusDot(m.status)}</div>
                    <div className="text-2xl font-bold mb-1" style={{color: '#0F172A'}}>{m.value}</div>
                    <div className="text-xs" style={{color: '#94A3B8'}}>{m.sub}</div>
                  </div>
                ))}
                {activeClient === 'firstcapital' && [
                  { label: 'Total Assets', value: `$${firstCapital.org.assets}B`, sub: 'Regional bank — Mid-Atlantic', status: 'green' as const },
                  { label: 'Cost-to-Income', value: `${firstCapital.financials.costToIncomeRatio}%`, sub: 'Target: 55% | Benchmark: 61%', status: 'red' as const },
                  { label: 'Return on Assets', value: `${firstCapital.financials.returnOnAssets}%`, sub: 'Benchmark: 1.1%', status: 'yellow' as const },
                  { label: 'Fraud Losses', value: `$${firstCapital.financials.fraudLosses2023}M`, sub: `Benchmark: $${firstCapital.financials.benchmarkFraudLosses}M`, status: 'red' as const },
                  { label: 'IT Budget', value: `$${firstCapital.financials.itBudget}M`, sub: `${firstCapital.financials.itBudgetAsPercentRevenue}% of revenue`, status: 'yellow' as const },
                  { label: 'Compliance Cost', value: `${firstCapital.financials.complianceCostAsPercentIT}%`, sub: 'Of IT budget', status: 'red' as const },
                ].map((m, i) => (
                  <div key={i} className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                    <div className="flex justify-between mb-2">{badge(m.label, 'gray')}{statusDot(m.status)}</div>
                    <div className="text-2xl font-bold mb-1" style={{color: '#0F172A'}}>{m.value}</div>
                    <div className="text-xs" style={{color: '#94A3B8'}}>{m.sub}</div>
                  </div>
                ))}
                {activeClient === 'apexretail' && [
                  { label: 'Annual Revenue', value: `$${apexRetail.financials.revenue2023}B`, sub: `vs $${apexRetail.financials.revenue2022}B prior year`, status: 'green' as const },
                  { label: 'Operating Margin', value: `${apexRetail.financials.operatingMargin2023}%`, sub: `Target: ${apexRetail.financials.targetOperatingMargin}%`, status: 'red' as const },
                  { label: 'Gross Margin', value: `${apexRetail.financials.grossMargin2023}%`, sub: 'Benchmark: 38.4%', status: 'yellow' as const },
                  { label: 'Inventory Turnover', value: `${apexRetail.financials.inventoryTurnover}x`, sub: 'Benchmark: 6.8x', status: 'red' as const },
                  { label: 'Shrinkage Cost', value: `$${(apexRetail.financials.shrinkageCost / 1000).toFixed(0)}M`, sub: `${apexRetail.financials.shrinkageRate}% vs 1.4% benchmark`, status: 'red' as const },
                  { label: 'Digital Revenue', value: `${apexRetail.org.ecommercePercent}%`, sub: 'Target: 45%', status: 'yellow' as const },
                ].map((m, i) => (
                  <div key={i} className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                    <div className="flex justify-between mb-2">{badge(m.label, 'gray')}{statusDot(m.status)}</div>
                    <div className="text-2xl font-bold mb-1" style={{color: '#0F172A'}}>{m.value}</div>
                    <div className="text-xs" style={{color: '#94A3B8'}}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TECHNOLOGY */}
          {!isGreenField && activeTab === 'technology' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{color: '#0F172A'}}>Technology Landscape — {currentClient.name}</h2>
                {selectedSystem && (
                  <button onClick={() => setSelectedSystem(null)} className="text-sm transition" style={{color: '#2563EB'}}>
                    ← Back to all systems
                  </button>
                )}
              </div>

              {selectedSystem ? (
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-4">
                    <div className="p-6 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1" style={{color: '#0F172A'}}>{selectedSystem.name}</h3>
                          <p className="text-sm" style={{color: '#475569'}}>{selectedSystem.function} · {selectedSystem.vendor || ''}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${selectedSystem.status === 'Live' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {selectedSystem.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Annual Cost', value: `$${selectedSystem.annualCost}M` },
                          { label: 'Contract Expiry', value: selectedSystem.contractExpiry || 'N/A' },
                          { label: 'Status', value: selectedSystem.status },
                        ].map((m, i) => (
                          <div key={i} className="p-3 rounded-lg" style={{background: '#F4F6F8'}}>
                            <p className="text-xs mb-1" style={{color: '#94A3B8'}}>{m.label}</p>
                            <p className="font-semibold text-sm" style={{color: '#0F172A'}}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedSystem.issues && selectedSystem.issues.length > 0 && (
                      <div className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                        <h4 className="font-semibold text-sm mb-3" style={{color: '#0F172A'}}>Known Issues</h4>
                        <div className="space-y-2">
                          {selectedSystem.issues.map((issue: string, i: number) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span style={{color: '#DC2626'}} className="flex-shrink-0">⚠</span>
                              <span style={{color: '#374151'}}>{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl" style={{background: '#EFF6FF', border: '1px solid #BFDBFE'}}>
                      <h4 className="font-semibold mb-3" style={{color: '#1D4ED8'}}>Abarva Assessment</h4>
                      <p className="text-sm mb-4" style={{color: '#374151'}}>
                        This system requires immediate attention. Click below to get Abarva's full analysis.
                      </p>
                      <button
                        onClick={() => { setActiveTab('diagnose'); setTimeout(() => sendMessage(`Tell me about our ${selectedSystem.name} — performance, risks, and what we should do`), 300) }}
                        className="w-full font-semibold text-xs py-2 rounded-lg transition"
                        style={{background: '#2563EB', color: '#FFFFFF'}}>
                        Ask Abarva about this system →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {activeClient === 'meridian' && (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                          { label: 'Epic Optimization', value: `${meridianTechnology.ehr.optimizationScore}/100`, sub: 'Target: 85/100', status: 'yellow' as const },
                          { label: 'MyChart Adoption', value: `${meridianTechnology.ehr.modules[2].adoption}%`, sub: `Target: ${meridianTechnology.ehr.modules[2].target}%`, status: 'red' as const },
                          { label: 'Reporting Backlog', value: `${meridianTechnology.analytics.reportingBacklog}`, sub: 'Outstanding requests', status: 'red' as const },
                        ].map((m, i) => (
                          <div key={i} className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                            <div className="flex justify-between mb-2">{badge(m.label, 'gray')}{statusDot(m.status)}</div>
                            <div className="text-2xl font-bold mb-1" style={{color: '#0F172A'}}>{m.value}</div>
                            <div className="text-xs" style={{color: '#94A3B8'}}>{m.sub}</div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs mb-3" style={{color: '#94A3B8'}}>Click any system for details and recommendations</p>
                      <div className="rounded-xl overflow-hidden" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom: '1px solid #E2E8F0', background: '#F8FAFC'}}>
                              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{color: '#475569'}}>System</th>
                              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{color: '#475569'}}>Function</th>
                              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{color: '#475569'}}>Status</th>
                              <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{color: '#475569'}}>Annual Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meridianTechnology.systems.map((s, i) => (
                              <tr key={i} onClick={() => setSelectedSystem(s)}
                                className="cursor-pointer transition"
                                style={{borderBottom: '1px solid #F1F5F9'}}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <td className="p-4 font-medium" style={{color: '#0F172A'}}>{s.name}</td>
                                <td className="p-4 text-xs" style={{color: '#475569'}}>{s.function}</td>
                                <td className="p-4">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === 'Live' ? 'bg-emerald-50 text-emerald-700' : s.status.includes('overdue') || s.status.includes('underperforming') ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {s.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-medium" style={{color: '#0F172A'}}>${s.annualCost}M</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  {(activeClient === 'firstcapital' || activeClient === 'apexretail') && (
                    <>
                      <p className="text-xs mb-3" style={{color: '#94A3B8'}}>Click any metric to ask Abarva</p>
                      <div className="grid grid-cols-3 gap-4">
                        {(activeClient === 'firstcapital' ? [
                          { label: 'Core Banking Age', value: `${firstCapital.technology.coreBanking.age} years`, sub: 'FIS HORIZON — critical', status: 'red' as const, prompt: 'Tell me about our FIS HORIZON situation and modernization options' },
                          { label: 'Peak Capacity', value: `${firstCapital.technology.coreBanking.peakCapacityUtilization}%`, sub: 'No headroom for growth', status: 'red' as const, prompt: 'Our core banking is at 87% peak capacity — what does that mean?' },
                          { label: 'Digital Adoption', value: `${firstCapital.technology.digital.digitalAdoptionRate}%`, sub: 'Benchmark: 67%', status: 'red' as const, prompt: 'Digital adoption at 41% vs 67% benchmark — what is driving this?' },
                          { label: 'Mobile App Rating', value: `${firstCapital.technology.digital.mobileAppRating}/5`, sub: 'Threshold: 3.8', status: 'red' as const, prompt: 'Our mobile app rating is 3.2 — what is killing our score?' },
                          { label: 'FedNow Live', value: 'No', sub: `${firstCapital.technology.payments.peerBanksOnFedNow}% of peers live`, status: 'red' as const, prompt: 'How do we get FedNow live given FIS HORIZON constraints?' },
                          { label: 'AML Automation', value: `${firstCapital.technology.aml.automationRate}%`, sub: `Benchmark: ${firstCapital.technology.aml.benchmarkAutomationRate}%`, status: 'red' as const, prompt: 'AML automation at 34% vs 72% benchmark — what needs to change?' },
                        ] : [
                          { label: 'SAP ECC Age', value: `${apexRetail.technology.erp.age} years`, sub: 'Support ending 2027', status: 'red' as const, prompt: 'SAP ECC support ends 2027 — what are our migration options?' },
                          { label: 'SAP Customizations', value: apexRetail.technology.erp.customizations.toLocaleString(), sub: 'Makes migration complex', status: 'red' as const, prompt: '8,400 SAP customizations — how does this affect our migration?' },
                          { label: 'Inventory Accuracy', value: `${apexRetail.operations.supplyChain.inventoryAccuracy}%`, sub: 'Benchmark: 98%', status: 'red' as const, prompt: 'Inventory accuracy at 84% vs 98% — what is causing this?' },
                          { label: 'Forecast Accuracy', value: `${apexRetail.technology.supplyChain.demandPlanning.forecastAccuracy.current}%`, sub: `Benchmark: ${apexRetail.technology.supplyChain.demandPlanning.forecastAccuracy.benchmarkAccuracy}%`, status: 'red' as const, prompt: 'Forecast accuracy at 62% vs 84% — o9 is stalled — what do we do?' },
                          { label: 'Cart Abandonment', value: `${apexRetail.technology.commercePlatform.ecommerce.cartAbandonmentRate}%`, sub: `Benchmark: ${apexRetail.technology.commercePlatform.ecommerce.benchmarkCartAbandonmentRate}%`, status: 'red' as const, prompt: 'Cart abandonment at 72% — what is causing this?' },
                          { label: 'Page Load Time', value: `${apexRetail.technology.commercePlatform.ecommerce.pageLoadTime}s`, sub: '$48M per second impact', status: 'red' as const, prompt: 'Page load at 4.2 seconds — what do we fix first?' },
                        ]).map((m, i) => (
                          <button key={i}
                            onClick={() => { setActiveTab('diagnose'); setTimeout(() => sendMessage(m.prompt), 300) }}
                            className="p-5 rounded-xl text-left transition hover:shadow-sm"
                            style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                            <div className="flex justify-between mb-2">{badge(m.label, 'gray')}{statusDot(m.status)}</div>
                            <div className="text-2xl font-bold mb-1" style={{color: '#0F172A'}}>{m.value}</div>
                            <div className="text-xs mb-2" style={{color: '#94A3B8'}}>{m.sub}</div>
                            <p className="text-xs font-medium" style={{color: '#2563EB'}}>Ask Abarva →</p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* CLINICAL */}
          {!isGreenField && activeTab === 'clinical' && (
            <div>
              <h2 className="text-xl font-bold mb-6" style={{color: '#0F172A'}}>
                {activeClient === 'meridian' ? 'Clinical Performance' : activeClient === 'firstcapital' ? 'Risk and Compliance' : 'Operations and Supply Chain'} — {currentClient.name}
              </h2>
              {activeClient === 'meridian' ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color: '#94A3B8'}}>HEDIS Scores</h3>
                    <div className="p-5 rounded-xl space-y-4" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                      {Object.entries(meridianClinical.valueBasedCare.hedisScores).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span style={{color: '#475569'}} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-semibold" style={{color: val < 65 ? '#DC2626' : val < 75 ? '#D97706' : '#059669'}}>{val}%</span>
                          </div>
                          <div className="w-full rounded-full h-1.5" style={{background: '#E2E8F0'}}>
                            <div className="h-1.5 rounded-full" style={{width: `${val}%`, background: val < 65 ? '#DC2626' : val < 75 ? '#F59E0B' : '#059669'}} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color: '#94A3B8'}}>AI Opportunities</h3>
                    <div className="p-5 rounded-xl space-y-3" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                      {meridianClinical.aiOpportunities.map((o, i) => (
                        <div key={i} className="pb-3 last:pb-0" style={{borderBottom: '1px solid #F1F5F9'}}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium" style={{color: '#0F172A'}}>{o.useCase}</span>
                            <span className="font-bold" style={{color: '#059669'}}>${o.annualSavings}M</span>
                          </div>
                          <div className="text-xs" style={{color: '#94A3B8'}}>{o.timeToValue} · {o.roi}x ROI</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                  <p className="text-sm mb-4" style={{color: '#475569'}}>
                    {activeClient === 'firstcapital' ? 'Detailed compliance and risk analysis available via Abarva Diagnose.' : 'Detailed supply chain and operations data available via Abarva Diagnose.'}
                  </p>
                  <button onClick={() => setActiveTab('diagnose')}
                    className="font-semibold py-3 px-6 rounded-xl transition text-sm"
                    style={{background: '#2563EB', color: '#FFFFFF'}}>
                    Ask Abarva →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LEADERSHIP */}
          {!isGreenField && activeTab === 'leadership' && (
            <div>
              <h2 className="text-xl font-bold mb-6" style={{color: '#0F172A'}}>Leadership Intelligence — {currentClient.name}</h2>
              <div className="space-y-4">
                {activeClient === 'meridian' && meridianLeadership.executives.map((exec, i) => (
                  <div key={i} className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{color: '#2563EB'}}>{exec.role}</span>
                    <h3 className="text-lg font-bold mt-0.5 mb-1" style={{color: '#0F172A'}}>{exec.name}</h3>
                    <p className="text-sm mb-3" style={{color: '#475569'}}>{exec.tenure} · {exec.background}</p>
                    {exec.quote && (
                      <blockquote className="pl-4" style={{borderLeft: '2px solid #2563EB'}}>
                        <p className="text-sm italic" style={{color: '#374151'}}>"{exec.quote}"</p>
                      </blockquote>
                    )}
                  </div>
                ))}
                {activeClient === 'firstcapital' && Object.entries(firstCapital.leadership).map(([key, exec]: [string, any], i) => (
                  <div key={i} className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{color: '#2563EB'}}>{key.toUpperCase()}</span>
                    <h3 className="text-lg font-bold mt-0.5 mb-1" style={{color: '#0F172A'}}>{exec.name}</h3>
                    <p className="text-sm mb-3" style={{color: '#475569'}}>{exec.tenure}</p>
                    {exec.quote && (
                      <blockquote className="pl-4" style={{borderLeft: '2px solid #2563EB'}}>
                        <p className="text-sm italic" style={{color: '#374151'}}>"{exec.quote}"</p>
                      </blockquote>
                    )}
                  </div>
                ))}
                {activeClient === 'apexretail' && apexRetail.leadership.executives.map((exec, i) => (
                  <div key={i} className="p-5 rounded-xl" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{color: '#2563EB'}}>{exec.role}</span>
                    <h3 className="text-lg font-bold mt-0.5 mb-1" style={{color: '#0F172A'}}>{exec.name}</h3>
                    <p className="text-sm mb-3" style={{color: '#475569'}}>{exec.tenure} · {exec.background}</p>
                    {exec.quote && (
                      <blockquote className="pl-4" style={{borderLeft: '2px solid #2563EB'}}>
                        <p className="text-sm italic" style={{color: '#374151'}}>"{exec.quote}"</p>
                      </blockquote>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DATA MANAGER */}
          {activeTab === 'data' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1" style={{color: '#0F172A'}}>Data Manager — {currentClient.name}</h2>
                <p className="text-sm" style={{color: '#475569'}}>Manage what Abarva knows about this organization</p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color: '#94A3B8'}}>Data Inventory</h3>
                  <div className="space-y-2">
                    {getDataInventory().map((item, i) => (
                      <div key={i} className="rounded-xl overflow-hidden" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                        <button
                          className="w-full flex items-center gap-4 p-4 text-left transition"
                          style={{cursor: 'pointer'}}
                          onClick={() => setExpandedCategory(expandedCategory === item.category ? null : item.category)}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'loaded' ? 'bg-emerald-500' : item.status === 'partial' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium" style={{color: '#0F172A'}}>{item.category}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs" style={{color: '#94A3B8'}}>{item.confidence}% confidence</span>
                                <span style={{color: '#CBD5E1'}} className="text-xs">{expandedCategory === item.category ? '▲' : '▼'}</span>
                              </div>
                            </div>
                            <p className="text-xs mt-0.5" style={{color: '#94A3B8'}}>{item.source}</p>
                          </div>
                          {item.status === 'missing' && (
                            <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE'}}>Request</span>
                          )}
                          {item.status === 'partial' && (
                            <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{background: '#FFFBEB', color: '#D97706', border: '1px solid #FEF3C7'}}>Upload more</span>
                          )}
                          {item.status === 'loaded' && (
                            <span className="text-xs font-medium flex-shrink-0" style={{color: '#059669'}}>✓ Loaded</span>
                          )}
                        </button>
                        {expandedCategory === item.category && (
                          <div className="px-4 pb-4" style={{borderTop: '1px solid #F1F5F9'}}>
                            <div className="pt-3">
                              {item.status === 'loaded' && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color: '#94A3B8'}}>What Abarva knows</p>
                                  {item.category === 'Financial Performance' && activeClient === 'meridian' && (
                                    <div className="space-y-1">
                                      {['Revenue: $11.2B (FY2023) | $10.4B (FY2022)', 'Operating margin: 1.8% vs 4.0% target', 'RCM denial rate: 18.2% — $94M written off FY2023', 'Days in AR: 52 vs 42 target', 'IT budget: $340M — $84M for transformation'].map((item, i) => (
                                        <p key={i} className="text-xs" style={{color: '#374151'}}>✓ {item}</p>
                                      ))}
                                    </div>
                                  )}
                                  {item.category === 'Technology Landscape' && activeClient === 'meridian' && (
                                    <div className="space-y-1">
                                      {['Epic EHR: optimization 58/100 — 12 of 47 Cogito dashboards live', 'Ensemble RCM: SLA 67% vs 95% — $8M penalties available', 'Azure Synapse: 40% implemented — stalled', 'Cerner (Blue Ridge): 8 months overdue migration', '10 systems cataloged with contracts and expiry dates'].map((item, i) => (
                                        <p key={i} className="text-xs" style={{color: '#374151'}}>✓ {item}</p>
                                      ))}
                                    </div>
                                  )}
                                  {item.category === 'Financial Performance' && activeClient === 'firstcapital' && (
                                    <div className="space-y-1">
                                      {['Total assets: $18B', 'Cost-to-income: 68% vs 55% target', 'Return on assets: 0.82% vs 1.1% benchmark', 'Fraud losses: $7M vs $3.2M benchmark', 'IT budget: $168M — 34% consumed by compliance'].map((item, i) => (
                                        <p key={i} className="text-xs" style={{color: '#374151'}}>✓ {item}</p>
                                      ))}
                                    </div>
                                  )}
                                  {item.category === 'Financial Performance' && activeClient === 'apexretail' && (
                                    <div className="space-y-1">
                                      {['Revenue: $12.4B (FY2023)', 'Operating margin: 3.8% vs 6.0% target', 'Gross margin: 34.2% vs 38.4% benchmark', 'Inventory turnover: 4.2x vs 6.8x benchmark', 'Shrinkage: 2.8% — $347M annual loss'].map((item, i) => (
                                        <p key={i} className="text-xs" style={{color: '#374151'}}>✓ {item}</p>
                                      ))}
                                    </div>
                                  )}
                                  {!['Financial Performance', 'Technology Landscape'].includes(item.category) && (
                                    <p className="text-xs" style={{color: '#94A3B8'}}>Click Ask Abarva to explore this data in detail</p>
                                  )}
                                  <button
                                    onClick={() => { setActiveTab('diagnose'); setTimeout(() => sendMessage(`Tell me what Abarva knows about our ${item.category} and what the key insights are`), 300) }}
                                    className="mt-2 text-xs font-medium transition"
                                    style={{color: '#2563EB'}}>
                                    Ask Abarva about this data →
                                  </button>
                                </div>
                              )}
                              {item.status === 'partial' && (
                                <div>
                                  <p className="text-xs mb-1" style={{color: '#374151'}}>{item.source}</p>
                                  <p className="text-xs" style={{color: '#D97706'}}>Loading complete data would increase confidence from {item.confidence}% to ~85%</p>
                                </div>
                              )}
                              {item.status === 'missing' && (
                                <div>
                                  <p className="text-xs mb-1" style={{color: '#94A3B8'}}>Not loaded. Loading this would unlock:</p>
                                  <p className="text-xs" style={{color: '#2563EB'}}>
                                    {item.category === 'Board Materials' && 'Strategic priorities confirmed, investment appetite clarified'}
                                    {item.category === 'HR and Workforce' && 'Change readiness score, talent gap analysis'}
                                    {item.category === 'Vendor Contracts' && 'SLA penalty analysis, negotiation leverage'}
                                    {item.category === 'Engagement History' && 'Prior initiative outcomes, failure pattern detection'}
                                    {!['Board Materials','HR and Workforce','Vendor Contracts','Engagement History'].includes(item.category) && 'Deeper intelligence and more precise recommendations'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="p-5 rounded-xl mb-4" style={{background: '#FFFFFF', border: '1px solid #E2E8F0'}}>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{color: '#94A3B8'}}>Overall Confidence</h3>
                    <div className="text-5xl font-bold mb-2" style={{color: '#2563EB'}}>{currentClient.confidence}%</div>
                    <div className="w-full rounded-full h-2 mb-3" style={{background: '#E2E8F0'}}>
                      <div className="h-2 rounded-full"
                        style={{width: `${currentClient.confidence}%`, background: currentClient.confidence >= 80 ? '#059669' : '#2563EB'}} />
                    </div>
                    <p className="text-xs" style={{color: '#94A3B8'}}>Loading additional data increases diagnosis precision.</p>
                  </div>
                  <div className="p-5 rounded-xl mb-4" style={{background: '#EFF6FF', border: '1px solid #BFDBFE'}}>
                    <h3 className="text-sm font-semibold mb-3" style={{color: '#1D4ED8'}}>Prescribed Next Load</h3>
                    <div className="space-y-2">
                      {getPrescribedLoads().map((p, i) => (
                        <p key={i} className="text-xs" style={{color: '#374151'}}>{i + 1}. {p}</p>
                      ))}
                    </div>
                    <button className="w-full mt-4 font-semibold text-xs py-2 rounded-lg transition"
                      style={{background: '#2563EB', color: '#FFFFFF'}}>
                      Upload Data →
                    </button>
                  </div>
                  <div className="p-5 rounded-xl" style={{background: '#F0FDF4', border: '1px solid #D1FAE5'}}>
                    <h3 className="text-sm font-semibold mb-1" style={{color: '#059669'}}>Download Templates</h3>
                    <p className="text-xs mb-3" style={{color: '#6B7280'}}>Pre-built templates for structured data collection</p>
                    <div className="space-y-2">
                      {[
                        { name: 'IT Financial Model FY2024', file: 'Meridian_IT_Financial_Model_FY2024.xlsx', desc: 'Budget, headcount, capex, cloud spend' },
                        { name: 'Data Center Infrastructure', file: 'Meridian_DataCenter_Infrastructure_Inventory.xlsx', desc: '1,240 servers, network, storage' },
                        { name: 'Application and Technology Inventory', file: 'Meridian_Application_Technology_Inventory.xlsx', desc: '47 systems, integrations, vendor contracts' },
                        { name: 'Healthcare Quality and RCM Data', file: 'Meridian_Healthcare_Quality_RCM_Data.xlsx', desc: 'RCM by payer, HEDIS scores, 23 hospitals' },
                        { name: 'IT Financial Models — All 3 Clients', file: 'Enterprise_IT_Financial_Models_All_Clients.xlsx', desc: 'Meridian $504M, First Capital $168M, Apex $285M' },
                      ].map((t, i) => (
                        <a key={i} href={`/templates/${t.file}`} download
                          className="flex items-center justify-between p-3 rounded-lg transition"
                          style={{background: '#FFFFFF', border: '1px solid #D1FAE5'}}>
                          <div>
                            <p className="text-xs font-medium" style={{color: '#0F172A'}}>{t.name}</p>
                            <p className="text-xs" style={{color: '#94A3B8'}}>{t.desc}</p>
                          </div>
                          <span className="text-xs font-medium" style={{color: '#059669'}}>↓ Excel</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GREENFIELD */}
          {isGreenField && activeTab !== 'diagnose' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1" style={{color: '#0F172A'}}>Good morning, {user?.firstName || 'Maestro'}.</h2>
                <p className="text-sm" style={{color: '#475569'}}>{currentClient.name} — Greenfield Client Workspace</p>
              </div>
              <div className="p-6 rounded-xl mb-6" style={{background: '#FFFBEB', border: '1px solid #FEF3C7'}}>
                <h3 className="font-semibold mb-2" style={{color: '#D97706'}}>Public Intelligence Only — 23% Confidence</h3>
                <p className="text-sm mb-4" style={{color: '#374151'}}>Abarva has gathered public intelligence on this organization. Load internal data to unlock full capabilities.</p>
                <button onClick={() => setActiveTab('data')}
                  className="font-semibold py-2 px-6 rounded-lg transition text-sm"
                  style={{background: '#D97706', color: '#FFFFFF'}}>
                  Start data load →
                </button>
              </div>
              <button onClick={() => setActiveTab('diagnose')}
                className="font-semibold py-3 px-8 rounded-xl transition text-sm"
                style={{background: '#2563EB', color: '#FFFFFF'}}>
                Ask Abarva what it knows →
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
