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

type Tab = 'overview' | 'financial' | 'technology' | 'clinical' | 'leadership' | 'diagnose' | 'transform' | 'data'

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
  const [extraClients, setExtraClients] = useState<Array<{id: string, name: string}>>([])
  const [denialRate, setDenialRate] = useState(18.2)
  const [epicScore, setEpicScore] = useState(58)
  const [maStars, setMaStars] = useState(3.5)

  const baseMargin = 1.8
  const rcmImpact = ((18.2 - denialRate) / 18.2) * 0.8
  const epicImpact = ((epicScore - 58) / 100) * 0.4
  const maImpact = maStars >= 4.0 ? 0.3 : 0
  const projectedMargin = (baseMargin + rcmImpact + epicImpact + maImpact).toFixed(1)
  const revenueRecovered = (((18.2 - denialRate) / 18.2) * 94).toFixed(0)

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from('clients').select('id, name')
      if (data) {
        const extra = data.filter(c =>
          c.name !== 'Meridian Health System' &&
          c.name !== 'First Capital Financial'
        ).map(c => ({ id: c.id, name: c.name }))
        setExtraClients(extra)
      }
    }
    loadClients()
  }, [])

  const builtInClients = [
    { id: 'meridian', name: 'Meridian Health', industry: 'Healthcare', confidence: 94 },
    { id: 'firstcapital', name: 'First Capital Financial', industry: 'Financial Services', confidence: 88 },
    { id: 'apexretail', name: 'Apex Retail Group', industry: 'Retail', confidence: 86 },
  ]

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '◎' },
    { id: 'diagnose', label: 'Diagnose', icon: '⚡' },
    { id: 'transform', label: 'Transform', icon: '→' },
    { id: 'financial', label: 'Financial', icon: '$' },
    { id: 'technology', label: 'Technology', icon: '⬡' },
    { id: 'clinical', label: 'Clinical', icon: '♥' },
    { id: 'leadership', label: 'Leadership', icon: '◈' },
    { id: 'data', label: 'Data Manager', icon: '⊞' },
  ]

  const currentClient = builtInClients.find(c => c.id === activeClient) || { name: extraClients.find(c => c.id === activeClient)?.name || 'Client', confidence: 23, industry: 'Unknown' }

  const statusDot = (status: 'red' | 'yellow' | 'green') => (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${status === 'red' ? 'bg-red-500' : status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`} />
  )

  function getSuggestions(r: string) {
    if (activeClient === 'firstcapital') {
      const s: Record<string, string[]> = {
        CIO: ["Should we replace FIS HORIZON or add an API layer on top?", "How do we get FedNow live before we lose more commercial clients?", "Our SQL Server 2017 support ends in October — what do we do?"],
        CFO: ["What is the ROI case for core banking modernization?", "How do we get cost-to-income from 68% to 55%?", "Our fraud losses are $3.8M above benchmark — what is the fastest fix?"],
        COO: ["Every technology project has gone over budget and over time — how do we break that pattern?", "How do we automate AML without adding headcount?", "Our call center handle time is 7.2 minutes vs 4.8 benchmark — what drives that?"],
        CEO: ["What is the strategic risk of keeping FIS HORIZON for 3 more years?", "How do we position First Capital as a digital bank without a $180M core banking investment?", "FedNow — how long before commercial clients start leaving?"],
        CMIO: ["Not applicable for financial services", "Try switching to CEO or CFO role", "What is our biggest regulatory risk in 2025?"],
      }
      return s[r] || s['CIO']
    }
    if (activeClient === 'apexretail') {
      const s: Record<string, string[]> = {
        CIO: ["S4 HANA or something else — what is the right SAP migration path?", "Our o9 demand planning is 40% implemented and stalled — how do we fix it?", "IBM Sterling OMS is 3 versions behind — do we upgrade or replace?"],
        CFO: ["What is the ROI case for SAP S4 HANA vs alternatives?", "Our inventory turnover is 4.2x vs 6.8x benchmark — what does that cost us?", "How do we get operating margin from 3.8% to 6% in 24 months?"],
        COO: ["Our inventory accuracy is 84% vs 98% benchmark — we cannot do omnichannel at 84%", "How do we reduce our 68% annual staff turnover?", "China sourcing at 48% — how do we diversify in 18 months?"],
        CMO: ["We have 18 million loyalty members and 42% are active vs 68% benchmark — what is wrong?", "Personalization engine — Dynamic Yield vs Bloomreach vs activating Salesforce Einstein we already own?", "Our email unsubscribe rate is 2.8% vs 0.8% benchmark — what do we do?"],
        CEO: ["SAP ECC support ends 2027 — board wants a decision by Q3 — what do I tell them?", "Amazon is taking $1.24B of our revenue — what is the digital strategy?", "How do we close the $840M cart abandonment opportunity?"],
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

  function getOverviewMetrics() {
    if (activeClient === 'firstcapital') return [
      { label: 'Cost-to-Income Ratio', value: `${firstCapital.financials.costToIncomeRatio}%`, target: `Target: ${firstCapital.financials.targetCostToIncomeRatio}%`, status: 'red' as const },
      { label: 'Digital Adoption', value: `${firstCapital.technology.digital.digitalAdoptionRate}%`, target: 'Benchmark: 67%', status: 'red' as const },
      { label: 'Core Banking Age', value: `${firstCapital.technology.coreBanking.age} yrs`, target: 'Critical threshold: 20 yrs', status: 'red' as const },
      { label: 'FedNow Live', value: 'No', target: '68% of peers live', status: 'red' as const },
    ]
    if (activeClient === 'apexretail') return [
      { label: 'Operating Margin', value: `${apexRetail.org.operatingMargin}%`, target: `Target: ${apexRetail.org.targetOperatingMargin}%`, status: 'red' as const },
      { label: 'Digital Revenue', value: `${apexRetail.financials.ecommercePercent}%`, target: 'Target: 45%', status: 'yellow' as const },
      { label: 'Inventory Turnover', value: `${apexRetail.financials.inventoryTurnover}x`, target: 'Benchmark: 6.8x', status: 'red' as const },
      { label: 'Loyalty Active Rate', value: `${apexRetail.financials.loyaltyMemberPercent}%`, target: 'Benchmark: 68%', status: 'yellow' as const },
    ]
    return [
      { label: 'Operating Margin', value: `${meridianHealth.org.operatingMargin}%`, target: `Target: ${meridianHealth.financials.targetOperatingMargin}%`, status: 'red' as const },
      { label: 'RCM Denial Rate', value: `${meridianHealth.technology.rcm.denialRate}%`, target: 'Benchmark: 11.4%', status: 'red' as const },
      { label: 'Epic Optimization', value: `${meridianHealth.technology.ehr.optimizationScore}/100`, target: 'Target: 85/100', status: 'yellow' as const },
      { label: 'MA Star Rating', value: `${meridianHealth.healthPlan.medicareAdvantage.starRating}`, target: 'Bonus: 4.0 stars', status: 'yellow' as const },
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
      { category: 'Leadership Intelligence', confidence: 68, status: 'loaded', source: 'Pre-loaded · Public + interviews' },
      { category: 'Vendor Contracts', confidence: 45, status: 'partial', source: 'Partial · Ensemble only' },
      { category: 'Board Materials', confidence: 0, status: 'missing', source: 'Not loaded · Requires CEO approval' },
      { category: 'HR and Workforce', confidence: 0, status: 'missing', source: 'Not loaded · Requires CHRO approval' },
      { category: 'Engagement History', confidence: 0, status: 'missing', source: 'No prior engagements' },
    ]
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="border-b border-gray-800 px-6 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">☰</button>
          <h1 className="text-lg font-bold">Abarva</h1>
          <span className="text-gray-600">|</span>
          <div className="flex gap-2 flex-wrap">
            {builtInClients.map(c => (
              <button
                key={c.id}
                onClick={() => { setActiveClient(c.id); setMessages([]); setActiveTab('overview') }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeClient === c.id ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                {c.name}
              </button>
            ))}
            {extraClients.map(c => (
              <button
                key={c.id}
                onClick={() => { setActiveClient(c.id); setMessages([]); setActiveTab('overview') }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeClient === c.id ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                {c.name}
              </button>
            ))}
            <button onClick={() => window.location.href = '/search'} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-900 text-green-300 hover:bg-green-800 transition border border-green-800">
              + New Client
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">Maestro</span>
          <span className="text-sm text-gray-400">{user?.firstName} {user?.lastName}</span>
          <UserButton />
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-48 border-r border-gray-800 flex-shrink-0 flex flex-col bg-gray-950">
            <div className="p-4 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{currentClient.name}</p>
              <p className="text-xs text-gray-600 mb-4">{currentClient.industry}</p>
              <nav className="space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Data confidence</p>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-1">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width: `${currentClient.confidence || 23}%`}} />
              </div>
              <p className="text-xs text-gray-400">{currentClient.confidence || 23}% confidence</p>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto p-8">

          {activeTab === 'overview' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Good morning, {user?.firstName || 'Maestro'}.</h2>
                <p className="text-gray-400">{currentClient.name} — Engagement Overview</p>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {getOverviewMetrics().map(metric => (
                  <div key={metric.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm text-gray-400">{metric.label}</span>
                      {statusDot(metric.status)}
                    </div>
                    <div className="text-3xl font-bold mb-1">{metric.value}</div>
                    <div className="text-xs text-gray-500">{metric.target}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contradictions Detected</h3>
                  <div className="space-y-3">
                    {getContradictions().map((c, i) => (
                      <div key={i} className="bg-gray-900 border border-red-900 rounded-xl p-4 flex gap-3">
                        <span className="text-red-400 font-bold text-sm flex-shrink-0">{i + 1}</span>
                        <p className="text-sm text-gray-300">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Strategic Priorities</h3>
                  <div className="space-y-2 mb-6">
                    {getStrategicPriorities().map((p, i) => (
                      <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm text-gray-300">{p}</div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('diagnose')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm mb-2">Run Diagnosis →</button>
                  {activeClient === 'meridian' && (
                    <button onClick={() => setActiveTab('transform')} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition text-sm">Simulate Transformation →</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diagnose' && (
            <div className="flex flex-col" style={{height: 'calc(100vh - 120px)'}}>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-1">Diagnose — {currentClient.name}</h2>
                <p className="text-gray-400 text-sm">Abarva has {currentClient.confidence || 23}% confidence intelligence on this client. Ask anything.</p>
              </div>
              <div className="flex gap-2 mb-4">
                {['CIO', 'CFO', 'COO', activeClient === 'meridian' ? 'CMIO' : 'CMO', 'CEO'].map(r => (
                  <button key={r} onClick={() => { setRole(r); setMessages([]); setStreamingResponse('') }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${role === r ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}>
                    {r}
                  </button>
                ))}
                <button onClick={() => { setMessages([]); setStreamingResponse('') }} className="ml-auto px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-gray-800 transition">
                  New conversation
                </button>
              </div>
              {messages.length === 0 && !streamingResponse && (
                <div className="mb-4">
                  <p className="text-gray-500 text-xs mb-3">Suggested for {role} at {currentClient.name}:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {getSuggestions(role).map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-left text-xs text-gray-300 hover:border-blue-500 hover:text-white transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl rounded-xl p-4 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-200'}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && !streamingResponse && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400">Abarva is analyzing {currentClient.name}...</div>
                  </div>
                )}
                {streamingResponse && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 max-w-3xl leading-relaxed whitespace-pre-wrap">{streamingResponse}</div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <input
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  placeholder={`Ask Abarva anything as ${role} at ${currentClient.name}...`}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button onClick={() => sendMessage()} disabled={loading || !inputMessage.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition text-sm">Send</button>
              </div>
            </div>
          )}

          {activeTab === 'transform' && activeClient === 'meridian' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Transformation Simulator</h2>
                <p className="text-gray-400">Model the financial impact of Meridian's transformation initiatives in real time</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Adjust Initiatives</h3>
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">RCM Denial Rate</label>
                        <span className="text-sm font-bold text-blue-400">{denialRate.toFixed(1)}%</span>
                      </div>
                      <input type="range" min="8" max="22" step="0.1" value={denialRate} onChange={e => setDenialRate(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>8.2% top quartile</span>
                        <span>Current: 18.2%</span>
                        <span>22% critical</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Epic Optimization Score</label>
                        <span className="text-sm font-bold text-blue-400">{epicScore}/100</span>
                      </div>
                      <input type="range" min="58" max="100" step="1" value={epicScore} onChange={e => setEpicScore(parseInt(e.target.value))} className="w-full accent-blue-500" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Current: 58</span>
                        <span>Target: 85</span>
                        <span>Best: 100</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Medicare Advantage Star Rating</label>
                        <span className="text-sm font-bold text-blue-400">{maStars.toFixed(1)} stars</span>
                      </div>
                      <input type="range" min="3.0" max="5.0" step="0.5" value={maStars} onChange={e => setMaStars(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Current: 3.5</span>
                        <span>Bonus: 4.0</span>
                        <span>Max: 5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Projected Impact</h3>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Projected Operating Margin</p>
                    <div className="flex items-end gap-3 mb-4">
                      <span className="text-5xl font-bold text-blue-400">{projectedMargin}%</span>
                      <span className="text-gray-400 text-sm mb-2">{parseFloat(projectedMargin) > baseMargin ? `+${(parseFloat(projectedMargin) - baseMargin).toFixed(1)}% improvement` : 'No change'}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                      <div className={`h-2 rounded-full transition-all ${parseFloat(projectedMargin) >= 4.0 ? 'bg-green-500' : parseFloat(projectedMargin) >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${Math.min((parseFloat(projectedMargin) / 4.0) * 100, 100)}%`}} />
                    </div>
                    <p className="text-xs text-gray-500">{parseFloat(projectedMargin) >= 4.0 ? 'Board target achieved' : `${(4.0 - parseFloat(projectedMargin)).toFixed(1)}% below board target`}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">RCM revenue recovered</span>
                        <span className="text-sm font-bold text-green-400">${revenueRecovered}M</span>
                      </div>
                      <p className="text-xs text-gray-500">{denialRate < 18.2 ? `Denial rate reduced to ${denialRate.toFixed(1)}%` : 'Move slider to model impact'}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">MA bonus revenue</span>
                        <span className="text-sm font-bold text-green-400">{maStars >= 4.0 ? '$34M' : '$0'}</span>
                      </div>
                      <p className="text-xs text-gray-500">{maStars >= 4.0 ? 'Bonus threshold achieved' : 'Raise MA stars to 4.0 to unlock $34M'}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Epic efficiency gains</span>
                        <span className="text-sm font-bold text-green-400">${Math.round((epicScore - 58) * 0.7)}M</span>
                      </div>
                      <p className="text-xs text-gray-500">{epicScore - 58} point optimization improvement</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('diagnose')} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm">Ask Abarva how to get there →</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transform' && activeClient !== 'meridian' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Transformation Simulator</h2>
                <p className="text-gray-400">AI opportunity analysis for {currentClient.name}</p>
              </div>
              <div className="space-y-4">
                {(activeClient === 'firstcapital' ? firstCapital.aiOpportunities : apexRetail.aiOpportunities).map((o, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{o.useCase}</h3>
                      <span className="text-green-400 font-bold">${((o.annualSaving || o.annualRevenue || 0) / 1000000).toFixed(0)}M</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Time to Value</p>
                        <p className="font-medium">{o.timeToValue}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">ROI</p>
                        <p className="font-medium text-blue-400">{o.roi}x</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Investment</p>
                        <p className="font-medium">${((o.implementationCost || 0) / 1000000).toFixed(1)}M</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('diagnose')} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm">Ask Abarva how to prioritize these →</button>
            </div>
          )}

          {activeTab === 'financial' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Financial Performance — {currentClient.name}</h2>
              {activeClient === 'meridian' && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Annual Revenue', value: `$${meridianFinancials.annual.revenue2023}B`, sub: `vs $${meridianFinancials.annual.revenue2022}B prior year`, status: 'green' as const },
                    { label: 'Operating Margin', value: `${meridianFinancials.annual.operatingMargin2023}%`, sub: `Target: ${meridianFinancials.annual.targetOperatingMargin}%`, status: 'red' as const },
                    { label: 'Days Cash on Hand', value: `${meridianFinancials.annual.daysOfCashOnHand}`, sub: `Credit rating: ${meridianFinancials.annual.creditRating}`, status: 'green' as const },
                    { label: 'RCM Denial Write-off', value: `$${meridianFinancials.rcmPerformance.denialWriteOff2023}M`, sub: `vs $${meridianFinancials.rcmPerformance.denialWriteOff2022}M prior year`, status: 'red' as const },
                    { label: 'Days in AR', value: `${meridianFinancials.rcmPerformance.daysInAR}`, sub: `Target: ${meridianFinancials.rcmPerformance.daysInARTarget}`, status: 'red' as const },
                    { label: 'IT Budget', value: `$${meridianFinancials.itBudget.total2024}M`, sub: `${meridianFinancials.itBudget.asPercentRevenue}% of revenue`, status: 'yellow' as const },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <div className="flex justify-between mb-2"><span className="text-sm text-gray-400">{m.label}</span>{statusDot(m.status)}</div>
                      <div className="text-2xl font-bold mb-1">{m.value}</div>
                      <div className="text-xs text-gray-500">{m.sub}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeClient === 'firstcapital' && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Total Assets', value: `$${firstCapital.org.assets}B`, sub: 'Regional bank — Mid-Atlantic', status: 'green' as const },
                    { label: 'Cost-to-Income', value: `${firstCapital.financials.costToIncomeRatio}%`, sub: 'Target: 55% | Benchmark: 61%', status: 'red' as const },
                    { label: 'Return on Assets', value: `${firstCapital.financials.returnOnAssets}%`, sub: 'Benchmark: 1.1%', status: 'yellow' as const },
                    { label: 'Fraud Losses', value: `$${firstCapital.financials.fraudLosses2023}M`, sub: `Benchmark: $${firstCapital.financials.benchmarkFraudLosses}M`, status: 'red' as const },
                    { label: 'IT Budget', value: `$${firstCapital.financials.itBudget}M`, sub: `${firstCapital.financials.itBudgetAsPercentRevenue}% of revenue`, status: 'yellow' as const },
                    { label: 'Compliance Cost', value: `${firstCapital.financials.complianceCostAsPercentIT}%`, sub: 'Of IT budget — highest in peer group', status: 'red' as const },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <div className="flex justify-between mb-2"><span className="text-sm text-gray-400">{m.label}</span>{statusDot(m.status)}</div>
                      <div className="text-2xl font-bold mb-1">{m.value}</div>
                      <div className="text-xs text-gray-500">{m.sub}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeClient === 'apexretail' && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Annual Revenue', value: `$${apexRetail.financials.revenue2023}B`, sub: `vs $${apexRetail.financials.revenue2022}B prior year`, status: 'green' as const },
                    { label: 'Operating Margin', value: `${apexRetail.financials.operatingMargin2023}%`, sub: `Target: ${apexRetail.financials.targetOperatingMargin}%`, status: 'red' as const },
                    { label: 'Gross Margin', value: `${apexRetail.financials.grossMargin2023}%`, sub: 'Benchmark: 38.4%', status: 'yellow' as const },
                    { label: 'Inventory Turnover', value: `${apexRetail.financials.inventoryTurnover}x`, sub: 'Benchmark: 6.8x', status: 'red' as const },
                    { label: 'Shrinkage Cost', value: `$${(apexRetail.financials.shrinkageCost / 1000).toFixed(0)}M`, sub: `Rate: ${apexRetail.financials.shrinkageRate}% vs 1.4% benchmark`, status: 'red' as const },
                    { label: 'Excess Supply Chain', value: `$${(apexRetail.financials.excessSupplyChainCost / 1000).toFixed(0)}M`, sub: '20% of revenue vs 16% benchmark', status: 'red' as const },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <div className="flex justify-between mb-2"><span className="text-sm text-gray-400">{m.label}</span>{statusDot(m.status)}</div>
                      <div className="text-2xl font-bold mb-1">{m.value}</div>
                      <div className="text-xs text-gray-500">{m.sub}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'technology' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Technology Landscape — {currentClient.name}</h2>
              {activeClient === 'meridian' && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                      { label: 'Epic Optimization', value: `${meridianTechnology.ehr.optimizationScore}/100`, sub: 'Target: 85/100', status: 'yellow' as const },
                      { label: 'MyChart Adoption', value: `${meridianTechnology.ehr.modules[2].adoption}%`, sub: `Target: ${meridianTechnology.ehr.modules[2].target}%`, status: 'red' as const },
                      { label: 'Reporting Backlog', value: `${meridianTechnology.analytics.reportingBacklog}`, sub: 'Outstanding requests', status: 'red' as const },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex justify-between mb-2"><span className="text-sm text-gray-400">{m.label}</span>{statusDot(m.status)}</div>
                        <div className="text-2xl font-bold mb-1">{m.value}</div>
                        <div className="text-xs text-gray-500">{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-800">
                        <th className="text-left p-4 text-gray-400 font-medium">System</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Function</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                        <th className="text-right p-4 text-gray-400 font-medium">Annual Cost</th>
                      </tr></thead>
                      <tbody>
                        {meridianTechnology.systems.map((s, i) => (
                          <tr key={i} className="border-b border-gray-800 last:border-0">
                            <td className="p-4 font-medium">{s.name}</td>
                            <td className="p-4 text-gray-400">{s.function}</td>
                            <td className="p-4"><span className={`text-xs px-2 py-1 rounded ${s.status === 'Live' ? 'bg-green-900 text-green-300' : s.status.includes('overdue') || s.status.includes('underperforming') || s.status.includes('Replacing') ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{s.status}</span></td>
                            <td className="p-4 text-right">${s.annualCost}M</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {activeClient === 'firstcapital' && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Core Banking Age', value: `${firstCapital.technology.coreBanking.age} years`, sub: 'FIS HORIZON 3.4 — critical threshold exceeded', status: 'red' as const },
                    { label: 'Peak Capacity', value: `${firstCapital.technology.coreBanking.peakCapacityUtilization}%`, sub: 'No headroom for growth', status: 'red' as const },
                    { label: 'Digital Adoption', value: `${firstCapital.technology.digital.digitalAdoptionRate}%`, sub: 'Benchmark: 67%', status: 'red' as const },
                    { label: 'Mobile App Rating', value: `${firstCapital.technology.digital.mobileAppRating}/5`, sub: 'Competitive threshold: 3.8', status: 'red' as const },
                    { label: 'FedNow Live', value: 'No', sub: `${firstCapital.technology.payments.peerBanksOnFedNow}% of peers live`, status: 'red' as const },
                    { label: 'AML Automation', value: `${firstCapital.technology.aml.automationRate}%`, sub: `Benchmark: ${firstCapital.technology.aml.benchmarkAutomationRate}%`, status: 'red' as const },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <div className="flex justify-between mb-2"><span className="text-sm text-gray-400">{m.label}</span>{statusDot(m.status)}</div>
                      <div className="text-2xl font-bold mb-1">{m.value}</div>
                      <div className="text-xs text-gray-500">{m.sub}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeClient === 'apexretail' && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'SAP ECC Age', value: `${apexRetail.technology.erp.age} years`, sub: 'Support ending 2027 — decision needed', status: 'red' as const },
                    { label: 'SAP Customizations', value: `${apexRetail.technology.erp.customizations.toLocaleString()}`, sub: 'Makes migration extremely complex', status: 'red' as const },
                    { label: 'Inventory Accuracy', value: `${apexRetail.operations.supplyChain.inventoryAccuracy}%`, sub: 'Benchmark: 98% — omnichannel impossible', status: 'red' as const },
                    { label: 'Forecast Accuracy', value: `${apexRetail.technology.supplyChain.demandPlanning.forecastAccuracy.current}%`, sub: `Benchmark: ${apexRetail.technology.supplyChain.demandPlanning.forecastAccuracy.benchmarkAccuracy}%`, status: 'red' as const },
                    { label: 'Cart Abandonment', value: `${apexRetail.technology.commercePlatform.ecommerce.cartAbandonmentRate}%`, sub: `Benchmark: ${apexRetail.technology.commercePlatform.ecommerce.benchmarkCartAbandonmentRate}%`, status: 'red' as const },
                    { label: 'Loyalty CDP Connected', value: 'No', sub: 'Loyalty not in ecommerce checkout', status: 'red' as const },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <div className="flex justify-between mb-2"><span className="text-sm text-gray-400">{m.label}</span>{statusDot(m.status)}</div>
                      <div className="text-2xl font-bold mb-1">{m.value}</div>
                      <div className="text-xs text-gray-500">{m.sub}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'clinical' && activeClient === 'meridian' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Clinical Performance</h2>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Quality Percentile', value: `${meridianClinical.quality.nationalPercentile}th`, sub: 'National ranking', status: 'yellow' as const },
                  { label: 'Readmission Rate', value: `${meridianClinical.quality.readmissionRate}%`, sub: `Target: ${meridianClinical.quality.readmissionTarget}%`, status: 'red' as const },
                  { label: 'MA Star Rating', value: `${meridianClinical.medicareAdvantage.starRating}`, sub: `$${meridianClinical.medicareAdvantage.bonusRevenueAtRisk}M at risk`, status: 'yellow' as const },
                  { label: 'Nurse Turnover', value: `${meridianClinical.workforce.nurseTurnoverRate}%`, sub: 'Target: below 15%', status: 'red' as const },
                ].map(m => (
                  <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-400">{m.label}</span>{statusDot(m.status)}</div>
                    <div className="text-2xl font-bold mb-1">{m.value}</div>
                    <div className="text-xs text-gray-500">{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">HEDIS Scores</h3>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                    {Object.entries(meridianClinical.valueBasedCare.hedisScores).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className={val < 65 ? 'text-red-400' : val < 75 ? 'text-yellow-400' : 'text-green-400'}>{val}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${val < 65 ? 'bg-red-500' : val < 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${val}%`}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">AI Opportunities</h3>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                    {meridianClinical.aiOpportunities.map((o, i) => (
                      <div key={i} className="border-b border-gray-800 last:border-0 pb-3 last:pb-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{o.useCase}</span>
                          <span className="text-green-400">${o.annualSavings}M</span>
                        </div>
                        <div className="text-xs text-gray-500">{o.timeToValue} · {o.roi}x ROI</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clinical' && activeClient !== 'meridian' && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                {activeClient === 'firstcapital' ? 'Risk and Compliance' : 'Operations and Supply Chain'}
              </h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <p className="text-gray-400 text-sm mb-4">
                  {activeClient === 'firstcapital'
                    ? 'This tab shows Risk and Compliance intelligence for First Capital Financial.'
                    : 'This tab shows Supply Chain and Operations intelligence for Apex Retail Group.'}
                </p>
                <button onClick={() => setActiveTab('diagnose')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition text-sm">
                  Ask Abarva about {activeClient === 'firstcapital' ? 'compliance strategy' : 'supply chain transformation'} →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'leadership' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Leadership Intelligence — {currentClient.name}</h2>
              <div className="space-y-4">
                {activeClient === 'meridian' && meridianLeadership.executives.map((exec, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{exec.role}</span>
                    <h3 className="text-lg font-bold mt-0.5">{exec.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{exec.tenure} · {exec.background}</p>
                    {exec.quote && <blockquote className="border-l-2 border-blue-500 pl-4"><p className="text-sm text-gray-300 italic">"{exec.quote}"</p></blockquote>}
                    {exec.concerns && exec.concerns.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {exec.concerns.map((c, j) => <span key={j} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">{c}</span>)}
                      </div>
                    )}
                  </div>
                ))}
                {activeClient === 'firstcapital' && Object.entries(firstCapital.leadership).map(([role, exec]: [string, any], i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{role.toUpperCase()}</span>
                    <h3 className="text-lg font-bold mt-0.5">{exec.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{exec.tenure}</p>
                    {exec.quote && <blockquote className="border-l-2 border-blue-500 pl-4"><p className="text-sm text-gray-300 italic">"{exec.quote}"</p></blockquote>}
                  </div>
                ))}
                {activeClient === 'apexretail' && apexRetail.leadership.executives.map((exec, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{exec.role}</span>
                    <h3 className="text-lg font-bold mt-0.5">{exec.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{exec.tenure} · {exec.background}</p>
                    {exec.quote && <blockquote className="border-l-2 border-blue-500 pl-4"><p className="text-sm text-gray-300 italic">"{exec.quote}"</p></blockquote>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">Data Manager — {currentClient.name}</h2>
                <p className="text-gray-400 text-sm">Manage what Abarva knows about this organization</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Data Inventory</h3>
                  <div className="space-y-3">
                    {getDataInventory().map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg border border-gray-800">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'loaded' ? 'bg-green-500' : item.status === 'partial' ? 'bg-yellow-500' : 'bg-gray-600'}`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{item.category}</span>
                            <span className="text-xs text-gray-400">{item.confidence}% confidence</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.source}</p>
                        </div>
                        {item.status === 'missing' && <button className="text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded hover:bg-blue-800 transition flex-shrink-0">Request</button>}
                        {item.status === 'partial' && <button className="text-xs bg-yellow-900 text-yellow-300 px-3 py-1 rounded hover:bg-yellow-800 transition flex-shrink-0">Upload more</button>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Overall Confidence</h3>
                    <div className="text-5xl font-bold text-blue-400 mb-2">{currentClient.confidence || 23}%</div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: `${currentClient.confidence || 23}%`}} />
                    </div>
                    <p className="text-xs text-gray-500">Loading additional data increases diagnosis precision and unlocks deeper product capabilities.</p>
                  </div>
                  <div className="bg-blue-950 border border-blue-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-blue-300 mb-3">Prescribed Next Load</h3>
                    <div className="space-y-2 text-xs text-gray-300">
                      {activeClient === 'meridian' && <>
                        <p>1. <strong>Ensemble contract</strong> — unlocks SLA penalty analysis ($8M)</p>
                        <p>2. <strong>RCM denial data by payer</strong> — unlocks payer strategy</p>
                        <p>3. <strong>Epic optimization assessment</strong> — unlocks module prioritization</p>
                      </>}
                      {activeClient === 'firstcapital' && <>
                        <p>1. <strong>FIS HORIZON architecture docs</strong> — unlocks migration path analysis</p>
                        <p>2. <strong>Full vendor contracts</strong> — unlocks negotiation intelligence</p>
                        <p>3. <strong>Customer analytics data</strong> — unlocks churn and growth strategy</p>
                      </>}
                      {activeClient === 'apexretail' && <>
                        <p>1. <strong>SAP ECC custom code inventory</strong> — unlocks migration complexity score</p>
                        <p>2. <strong>Store-level P&L data</strong> — unlocks portfolio optimization</p>
                        <p>3. <strong>Loyalty program analytics</strong> — unlocks $1.24B activation strategy</p>
                      </>}
                    </div>
                    <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition">Upload Data →</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
