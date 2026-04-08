'use client'
import { useUser, UserButton } from '@clerk/nextjs'
import { useState } from 'react'
import { meridianHealth } from '@/data/meridian/index'
import { meridianFinancials } from '@/data/meridian/index'
import { meridianTechnology } from '@/data/meridian/index'
import { meridianClinical } from '@/data/meridian/index'
import { meridianLeadership } from '@/data/meridian/index'

type Tab = 'overview' | 'financial' | 'technology' | 'clinical' | 'leadership' | 'diagnose' | 'transform' | 'data'
type Client = 'meridian' | 'firstcapital'

export default function Home() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [activeClient, setActiveClient] = useState<Client>('meridian')
  const [role, setRole] = useState('CIO')
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [streamingResponse, setStreamingResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Transform simulator state
  const [denialRate, setDenialRate] = useState(18.2)
  const [epicScore, setEpicScore] = useState(58)
  const [maStars, setMaStars] = useState(3.5)

  const baseMargin = 1.8
  const rcmImpact = ((18.2 - denialRate) / 18.2) * 0.8
  const epicImpact = ((epicScore - 58) / 100) * 0.4
  const maImpact = maStars >= 4.0 ? 0.3 : 0
  const projectedMargin = (baseMargin + rcmImpact + epicImpact + maImpact).toFixed(1)
  const revenueRecovered = (((18.2 - denialRate) / 18.2) * 94).toFixed(0)

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

  const statusDot = (status: 'red' | 'yellow' | 'green') => (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
      status === 'red' ? 'bg-red-500' :
      status === 'yellow' ? 'bg-yellow-500' :
      'bg-green-500'
    }`} />
  )

  function getSuggestions(r: string) {
    const suggestions: Record<string, string[]> = {
      CIO: [
        "Should we stay with Ensemble for RCM or find a new vendor?",
        "What should I prioritize in my first 90 days?",
        "We need to complete the Blue Ridge integration — where do we start?"
      ],
      CFO: [
        "How do we recover the $94M in RCM revenue leakage?",
        "Is our $340M IT budget being spent in the right places?",
        "What is the fastest path to the 4% operating margin target?"
      ],
      COO: [
        "How do we reduce travel nurse dependency without impacting care?",
        "The Blue Ridge cultural integration is failing — what do we do?",
        "Our readmission rate is too high — what drives it?"
      ],
      CMIO: [
        "How do we finally get Epic optimized after years of underinvestment?",
        "Physician burnout is getting worse — how can AI help?",
        "We have AI pilots at 2 hospitals — how do we scale them?"
      ],
      CEO: [
        "What is our realistic path to 4% operating margin by FY2026?",
        "How do we position Meridian as the AI leader in Southeast healthcare?",
        "The board is losing patience — what do I tell them?"
      ]
    }
    return suggestions[r] || suggestions['CIO']
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
    const res = await fetch('/api/org-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orgName: searchName })
})

clearInterval(stepInterval)
setGatheringSteps(steps)
setPhase('result')

const data = await res.json()
setResult(data.brief || 'No intelligence gathered.')
setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Top Navigation */}
      <nav className="border-b border-gray-800 px-6 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
            ☰
          </button>
          <h1 className="text-lg font-bold">Abarva</h1>
          <span className="text-gray-600">|</span>

          {/* Client Switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveClient('meridian')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeClient === 'meridian'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Meridian Health
            </button>
            <button
              onClick={() => setActiveClient('firstcapital')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeClient === 'firstcapital'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              First Capital Financial
            </button>
            
              <button onClick={() => window.location.href='/search'} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-900 text-green-300 hover:bg-green-800 transition border border-green-800">+ New Client</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">Maestro</span>
          <span className="text-sm text-gray-400">{user?.firstName} {user?.lastName}</span>
          <UserButton />
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-48 border-r border-gray-800 flex-shrink-0 flex flex-col bg-gray-950">
            <div className="p-4 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {activeClient === 'meridian' ? 'Meridian Health' : 'First Capital'}
              </p>
              <nav className="space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
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
                <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '72%'}} />
              </div>
              <p className="text-xs text-gray-400">72% — 4 datasets loaded</p>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && activeClient === 'meridian' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Good morning, {user?.firstName || 'Maestro'}.</h2>
                <p className="text-gray-400">Meridian Health System · 23 hospitals · $11.2B revenue</p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Operating Margin', value: `${meridianHealth.org.operatingMargin}%`, target: `Target: ${meridianHealth.financials.targetOperatingMargin}%`, status: 'red' as const },
                  { label: 'RCM Denial Rate', value: `${meridianHealth.technology.rcm.denialRate}%`, target: 'Benchmark: 11.4%', status: 'red' as const },
                  { label: 'Epic Optimization', value: `${meridianHealth.technology.ehr.optimizationScore}/100`, target: 'Target: 85/100', status: 'yellow' as const },
                  { label: 'MA Star Rating', value: `${meridianHealth.healthPlan.medicareAdvantage.starRating}`, target: 'Bonus: 4.0 stars', status: 'yellow' as const },
                ].map(metric => (
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
                    {meridianHealth.contradictions.map((c, i) => (
                      <div key={i} className="bg-gray-900 border border-red-900 rounded-xl p-4 flex gap-3">
                        <span className="text-red-400 font-bold text-sm flex-shrink-0">{i + 1}</span>
                        <p className="text-sm text-gray-300">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Priority Actions</h3>
                  <div className="space-y-2 mb-6">
                    {meridianHealth.strategicPriorities.map((p, i) => (
                      <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm text-gray-300">
                        {p}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('diagnose')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    Run Diagnosis →
                  </button>
                  <button
                    onClick={() => setActiveTab('transform')}
                    className="w-full mt-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    Simulate Transformation →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW — FIRST CAPITAL */}
          {activeTab === 'overview' && activeClient === 'firstcapital' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Good morning, {user?.firstName || 'Maestro'}.</h2>
                <p className="text-gray-400">First Capital Financial · Regional Bank · $18B assets</p>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Cost-to-Income Ratio', value: '68%', target: 'Target: 55%', status: 'red' as const },
                  { label: 'Digital Adoption', value: '41%', target: 'Peer benchmark: 67%', status: 'red' as const },
                  { label: 'Core System Age', value: '22 yrs', target: 'Modernization overdue', status: 'red' as const },
                  { label: 'AI Initiative Score', value: '2/10', target: 'Industry avg: 5/10', status: 'yellow' as const },
                ].map(metric => (
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
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">First Capital Financial — Intelligence Brief</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>Regional bank with $18B in assets serving the Mid-Atlantic market. Core banking system is 22 years old — a primary constraint on digital product velocity. Digital channel adoption at 41% significantly trails the 67% peer benchmark.</p>
                  <p>Three primary transformation pressures: (1) Core system modernization to enable digital product innovation, (2) AI-enabled credit decisioning to reduce underwriting costs, (3) Regulatory compliance burden consuming 34% of IT budget.</p>
                  <p>Leadership tension: CTO advocates for cloud-native core replacement. CFO wants incremental modernization to protect capital ratios. Board has not yet made a decision — creating 18 months of strategic paralysis.</p>
                </div>
                <button
                  onClick={() => setActiveTab('diagnose')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition text-sm"
                >
                  Run Diagnosis →
                </button>
              </div>
            </div>
          )}

          {/* TRANSFORM TAB — Simulation Engine */}
          {activeTab === 'transform' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Transformation Simulator</h2>
                <p className="text-gray-400">Model the financial impact of transformation initiatives in real time</p>
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
                      <input
                        type="range"
                        min="8"
                        max="22"
                        step="0.1"
                        value={denialRate}
                        onChange={e => setDenialRate(parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>8.2% (top quartile)</span>
                        <span>Current: 18.2%</span>
                        <span>22% (critical)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Epic Optimization Score</label>
                        <span className="text-sm font-bold text-blue-400">{epicScore}/100</span>
                      </div>
                      <input
                        type="range"
                        min="58"
                        max="100"
                        step="1"
                        value={epicScore}
                        onChange={e => setEpicScore(parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Current: 58</span>
                        <span>Target: 85</span>
                        <span>Best in class: 100</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Medicare Advantage Star Rating</label>
                        <span className="text-sm font-bold text-blue-400">{maStars.toFixed(1)} stars</span>
                      </div>
                      <input
                        type="range"
                        min="3.0"
                        max="5.0"
                        step="0.5"
                        value={maStars}
                        onChange={e => setMaStars(parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Current: 3.5</span>
                        <span>Bonus threshold: 4.0</span>
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
                      <span className="text-gray-400 text-sm mb-2">
                        {parseFloat(projectedMargin) > baseMargin
                          ? `+${(parseFloat(projectedMargin) - baseMargin).toFixed(1)}% improvement`
                          : 'No change'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${parseFloat(projectedMargin) >= 4.0 ? 'bg-green-500' : parseFloat(projectedMargin) >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{width: `${(parseFloat(projectedMargin) / 4.0) * 100}%`}}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {parseFloat(projectedMargin) >= 4.0
                        ? '✓ Board target achieved'
                        : `${(4.0 - parseFloat(projectedMargin)).toFixed(1)}% below board target of 4.0%`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">RCM revenue recovered</span>
                        <span className="text-sm font-bold text-green-400">${revenueRecovered}M</span>
                      </div>
                      <p className="text-xs text-gray-500">From reducing denial rate {denialRate < 18.2 ? `from 18.2% to ${denialRate.toFixed(1)}%` : '— move slider to model impact'}</p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">MA bonus revenue</span>
                        <span className="text-sm font-bold text-green-400">{maStars >= 4.0 ? '$34M' : '$0'}</span>
                      </div>
                      <p className="text-xs text-gray-500">{maStars >= 4.0 ? 'Bonus threshold achieved at 4.0 stars' : `Raise MA stars to 4.0 to unlock $34M bonus`}</p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Epic efficiency gains</span>
                        <span className="text-sm font-bold text-green-400">${Math.round((epicScore - 58) * 0.7)}M</span>
                      </div>
                      <p className="text-xs text-gray-500">From Epic optimization score improvement of {epicScore - 58} points</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('diagnose')}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    Ask Abarva how to get there →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSE TAB */}
          {activeTab === 'diagnose' && (
            <div className="flex flex-col" style={{height: 'calc(100vh - 120px)'}}>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-1">Diagnose</h2>
                <p className="text-gray-400 text-sm">
                  {activeClient === 'meridian'
                    ? 'Abarva has full intelligence on Meridian Health. Ask anything.'
                    : 'Abarva has loaded First Capital Financial intelligence. Ask anything.'}
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                {['CIO', 'CFO', 'COO', 'CMIO', 'CEO'].map(r => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setMessages([]); setStreamingResponse('') }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      role === r ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  onClick={() => { setMessages([]); setStreamingResponse('') }}
                  className="ml-auto px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-gray-800 transition"
                >
                  New conversation
                </button>
              </div>

              {messages.length === 0 && !streamingResponse && (
                <div className="mb-4">
                  <p className="text-gray-500 text-xs mb-3">Suggested for {role}:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {getSuggestions(role).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s)}
                        className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-left text-xs text-gray-300 hover:border-blue-500 hover:text-white transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl rounded-xl p-4 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-900 border border-gray-800 text-gray-200'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && !streamingResponse && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400">
                      Abarva is analyzing...
                    </div>
                  </div>
                )}
                {streamingResponse && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 max-w-3xl leading-relaxed whitespace-pre-wrap">
                      {streamingResponse}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  placeholder={`Ask Abarva anything as ${role}...`}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !inputMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* FINANCIAL TAB */}
          {activeTab === 'financial' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Financial Performance</h2>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Annual Revenue', value: `$${meridianFinancials.annual.revenue2023}B`, sub: `vs $${meridianFinancials.annual.revenue2022}B prior year`, status: 'green' as const },
                  { label: 'Operating Margin', value: `${meridianFinancials.annual.operatingMargin2023}%`, sub: `Target: ${meridianFinancials.annual.targetOperatingMargin}% by FY2026`, status: 'red' as const },
                  { label: 'Days Cash on Hand', value: `${meridianFinancials.annual.daysOfCashOnHand}`, sub: `Credit rating: ${meridianFinancials.annual.creditRating}`, status: 'green' as const },
                  { label: 'RCM Denial Write-off', value: `$${meridianFinancials.rcmPerformance.denialWriteOff2023}M`, sub: `vs $${meridianFinancials.rcmPerformance.denialWriteOff2022}M prior year`, status: 'red' as const },
                  { label: 'Days in AR', value: `${meridianFinancials.rcmPerformance.daysInAR}`, sub: `Target: ${meridianFinancials.rcmPerformance.daysInARTarget} | Benchmark: ${meridianFinancials.rcmPerformance.daysInARBenchmark}`, status: 'red' as const },
                  { label: 'IT Budget', value: `$${meridianFinancials.itBudget.total2024}M`, sub: `${meridianFinancials.itBudget.asPercentRevenue}% of revenue vs ${meridianFinancials.itBudget.peerBenchmark}% peer`, status: 'yellow' as const },
                ].map(m => (
                  <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">{m.label}</span>
                      {statusDot(m.status)}
                    </div>
                    <div className="text-2xl font-bold mb-1">{m.value}</div>
                    <div className="text-xs text-gray-500">{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">IT Budget Breakdown</h3>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                    {Object.entries(meridianFinancials.itBudget.breakdown).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">${val}M</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Denial Reasons</h3>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                    {meridianFinancials.rcmPerformance.topDenialReasons.map((d, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-400">{d.reason}</span>
                        <span className="font-medium text-red-400">${d.annualImpact}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TECHNOLOGY TAB */}
          {activeTab === 'technology' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Technology Landscape</h2>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Epic Optimization', value: `${meridianTechnology.ehr.optimizationScore}/100`, sub: 'Target: 85/100', status: 'yellow' as const },
                  { label: 'MyChart Adoption', value: `${meridianTechnology.ehr.modules[2].adoption}%`, sub: `Target: ${meridianTechnology.ehr.modules[2].target}%`, status: 'red' as const },
                  { label: 'Reporting Backlog', value: `${meridianTechnology.analytics.reportingBacklog}`, sub: 'Outstanding requests', status: 'red' as const },
                ].map(m => (
                  <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">{m.label}</span>
                      {statusDot(m.status)}
                    </div>
                    <div className="text-2xl font-bold mb-1">{m.value}</div>
                    <div className="text-xs text-gray-500">{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">System Inventory</h3>
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-4 text-gray-400 font-medium">System</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Function</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Vendor</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                        <th className="text-right p-4 text-gray-400 font-medium">Annual Cost</th>
                        <th className="text-right p-4 text-gray-400 font-medium">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meridianTechnology.systems.map((s, i) => (
                        <tr key={i} className="border-b border-gray-800 last:border-0">
                          <td className="p-4 font-medium">{s.name}</td>
                          <td className="p-4 text-gray-400">{s.function}</td>
                          <td className="p-4 text-gray-400">{s.vendor}</td>
                          <td className="p-4">
                            <span className={`text-xs px-2 py-1 rounded ${
                              s.status === 'Live' ? 'bg-green-900 text-green-300' :
                              s.status.includes('overdue') || s.status.includes('underperforming') || s.status.includes('Replacing') ? 'bg-red-900 text-red-300' :
                              'bg-yellow-900 text-yellow-300'
                            }`}>{s.status}</span>
                          </td>
                          <td className="p-4 text-right">${s.annualCost}M</td>
                          <td className="p-4 text-right text-gray-400">{s.contractExpiry}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CLINICAL TAB */}
          {activeTab === 'clinical' && (
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
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">{m.label}</span>
                      {statusDot(m.status)}
                    </div>
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
                        <div className="text-xs text-gray-500">{o.timeToValue} · {o.roi}x ROI · ${o.implementationCost}M investment</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEADERSHIP TAB */}
          {activeTab === 'leadership' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Leadership Intelligence</h2>
              <div className="space-y-4 mb-8">
                {meridianLeadership.executives.map((exec, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{exec.role}</span>
                      <h3 className="text-lg font-bold mt-0.5">{exec.name}</h3>
                      <p className="text-sm text-gray-400">{exec.tenure} · {exec.background}</p>
                    </div>
                    {exec.quote && (
                      <blockquote className="border-l-2 border-blue-500 pl-4 mt-3">
                        <p className="text-sm text-gray-300 italic">"{exec.quote}"</p>
                      </blockquote>
                    )}
                    {exec.concerns && exec.concerns.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {exec.concerns.map((c, j) => (
                          <span key={j} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DATA MANAGER TAB */}
          {activeTab === 'data' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">Data Manager</h2>
                <p className="text-gray-400 text-sm">Manage what Abarva knows about this organization</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 col-span-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Data Inventory</h3>
                  <div className="space-y-3">
                    {[
                      { category: 'Financial Performance', status: 'loaded', confidence: 85, source: 'Pre-loaded · Public + internal', records: '3 years of data' },
                      { category: 'Technology Landscape', status: 'loaded', confidence: 78, source: 'Pre-loaded · System inventory', records: '10 systems cataloged' },
                      { category: 'Clinical Quality', status: 'loaded', confidence: 72, source: 'Pre-loaded · CMS data', records: 'HEDIS + quality metrics' },
                      { category: 'Leadership Intelligence', status: 'loaded', confidence: 68, source: 'Pre-loaded · Public + interviews', records: '6 executives profiled' },
                      { category: 'Vendor Contracts', status: 'partial', confidence: 45, source: 'Partial · Ensemble only', records: '1 of 10 contracts loaded' },
                      { category: 'Board Materials', status: 'missing', confidence: 0, source: 'Not loaded', records: 'Requires CEO approval' },
                      { category: 'HR and Workforce', status: 'missing', confidence: 0, source: 'Not loaded', records: 'Requires CHRO approval' },
                      { category: 'Engagement History', status: 'missing', confidence: 0, source: 'No prior engagements', records: 'Will build over time' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          item.status === 'loaded' ? 'bg-green-500' :
                          item.status === 'partial' ? 'bg-yellow-500' :
                          'bg-gray-600'
                        }`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{item.category}</span>
                            <span className="text-xs text-gray-400">{item.confidence}% confidence</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.source} · {item.records}</p>
                        </div>
                        {item.status === 'missing' && (
                          <button className="text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded hover:bg-blue-800 transition flex-shrink-0">
                            Request
                          </button>
                        )}
                        {item.status === 'partial' && (
                          <button className="text-xs bg-yellow-900 text-yellow-300 px-3 py-1 rounded hover:bg-yellow-800 transition flex-shrink-0">
                            Upload more
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Overall Confidence</h3>
                    <div className="text-5xl font-bold text-blue-400 mb-2">72%</div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '72%'}} />
                    </div>
                    <p className="text-xs text-gray-400 mb-4">4 of 8 data categories loaded</p>
                    <p className="text-xs text-gray-500">Loading vendor contracts and board materials would increase confidence to 91% and unlock 14 additional insights.</p>
                  </div>

                  <div className="bg-blue-950 border border-blue-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-blue-300 mb-3">Prescribed Next Load</h3>
                    <div className="space-y-2 text-xs text-gray-300">
                      <p>1. <strong>Ensemble contract</strong> — unlocks SLA penalty analysis ($8M opportunity)</p>
                      <p>2. <strong>RCM denial data by payer</strong> — unlocks payer-specific strategy</p>
                      <p>3. <strong>Epic optimization assessment</strong> — unlocks module-level prioritization</p>
                    </div>
                    <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition">
                      Upload Data →
                    </button>
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