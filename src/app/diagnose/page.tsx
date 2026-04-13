'use client'
import { useState, useRef, Suspense, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import EngagementProgress from '@/components/EngagementProgress'
import ResponseOptions from '@/components/ResponseOptions'
import type { ResponseOption } from '@/components/ResponseOptions'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'
import { getUseCases, severityEmoji, severityColor } from '@/data/use-cases'
import type { ClientId, RoleId } from '@/data/use-cases'
import type { Contradiction } from '@/lib/intelligence/types'
import { isDemoMode, streamDemoResponse } from '@/lib/demo-mode'
import type { DemoClient } from '@/data/demo'
import DataUnlock from '@/components/DataUnlock'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' } as React.CSSProperties,
}

const SUGGESTIONS: Record<string, Record<string, string[]>> = {
  meridian: {
    CIO: ['Should we stay with Ensemble or switch RCM vendors?', 'What should I prioritize in my first 90 days?', 'How do we fix the Blue Ridge Cerner migration?'],
    CFO: ['How do we recover the $94M in RCM revenue leakage?', 'Is our $504M IT budget allocated correctly?', 'What is the fastest path to 4% operating margin?'],
    COO: ['How do we reduce travel nurse dependency — $142M annual cost?', 'Our readmission rate is too high — what drives it?', 'The Blue Ridge integration is failing — what do we do?'],
    CMIO: ['How do we get Epic optimized — 58/100 after 7 years?', 'Physician burnout is getting worse — how can AI help?', 'We have AI pilots stuck — how do we scale sepsis AI?'],
    CEO: ['What is our path to 4% operating margin by FY2026?', 'How do we position Meridian as the AI leader in Southeast?', 'The board is losing patience — what do I tell them?'],
  },
  firstcapital: {
    CIO: ['Replace FIS HORIZON or add an API layer?', 'How do we get FedNow live before we lose commercial clients?', 'SQL Server 2017 EOS October — what do we do?'],
    CFO: ['ROI case for core banking modernization?', 'How do we get cost-to-income from 68% to 55%?', 'Fraud losses $3.8M above benchmark — fastest fix?'],
    COO: ['Every tech project goes over budget — how do we fix that?', 'How do we automate AML without adding headcount?', 'What is driving our 64% account opening abandonment?'],
    CMO: ['1.8M digital customers seeing yesterday balances — fix?', 'Mobile app rating 3.2 — what is killing our score?', 'Digital adoption 41% vs 67% benchmark — root cause?'],
    CEO: ['Strategic risk of keeping FIS HORIZON 3 more years?', 'How do we position as digital bank without $180M investment?', 'How long before commercial clients leave without FedNow?'],
  },
  apexretail: {
    CIO: ['S4 HANA or Microsoft Dynamics — right SAP path?', 'o9 demand planning 40% implemented and stalled — fix?', 'IBM Sterling OMS 3 versions behind — upgrade or replace?'],
    CFO: ['ROI case for SAP migration options?', 'Inventory turnover 4.2x vs 6.8x — what does that cost us?', 'How do we get operating margin from 3.8% to 6% in 24 months?'],
    COO: ['Inventory accuracy 84% vs 98% — omnichannel is impossible', 'How do we reduce 68% annual staff turnover?', 'China sourcing 48% — how do we diversify?'],
    CMO: ['18M loyalty members — 42% active vs 68% benchmark — why?', 'Einstein personalization — why is it not activated?', 'Cart abandonment 72% — what do we fix first?'],
    CEO: ['SAP ECC support ends 2027 — what do I tell the board?', 'Amazon is taking share — what is the digital strategy?', 'How do we close the $840M cart abandonment opportunity?'],
  },
}

function DiagnoseContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [role, setRole] = useState('CIO')
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [activeClient, setActiveClient] = useState(clientId)
  const [lastError, setLastError] = useState<'timeout' | 'error' | null>(null)
  const pendingMessages = useRef<Array<{role: string, content: string}>>([])
  const abortRef = useRef<AbortController | null>(null)
  const cancelDemoRef = useRef<(() => void) | null>(null)
  const demoMode = isDemoMode()
  const [sidebarTab, setSidebarTab] = useState<'snapshot' | 'findings' | 'actions' | 'data'>('snapshot')
  const [lastQuery, setLastQuery] = useState('')
  const [contradictions, setContradictions] = useState<Contradiction[] | null>(null)
  const [loadingContradictions, setLoadingContradictions] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sidebarTab !== 'findings') return
    setContradictions(null)
    setLoadingContradictions(true)
    fetch('/api/intelligence/contradictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: activeClient }),
    })
      .then(r => r.json())
      .then((data: Contradiction[]) => { setContradictions(data); setLoadingContradictions(false) })
      .catch(() => setLoadingContradictions(false))
  }, [sidebarTab, activeClient])

  const clientName = activeClient === 'firstcapital' ? 'First Capital Financial' : activeClient === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'

  useEffect(() => { document.title = 'Diagnose — ' + clientName + ' | AbarVa' }, [clientName])

  const clientIndustry = activeClient === 'firstcapital' ? 'Financial Services' : activeClient === 'apexretail' ? 'Retail' : 'Healthcare'
  const confidence = activeClient === 'firstcapital' ? 88 : activeClient === 'apexretail' ? 86 : 94
  const roles = activeClient === 'meridian' ? ['CIO', 'CFO', 'COO', 'CMIO', 'CEO'] : ['CIO', 'CFO', 'COO', 'CMO', 'CEO']
  const statusColors = { red: '#DC2626', yellow: '#D97706', green: '#059669' }
  const clientColor = activeClient === 'firstcapital' ? '#7C3AED' : activeClient === 'apexretail' ? '#059669' : '#2563EB'
  const suggestions = SUGGESTIONS[activeClient]?.[role] || SUGGESTIONS.meridian.CIO

  function getMetrics() {
    if (activeClient === 'firstcapital') return [
      { label: 'Cost-to-Income', value: firstCapital.financials.costToIncomeRatio + '%', status: 'red' as const },
      { label: 'Digital Adoption', value: firstCapital.technology.digital.digitalAdoptionRate + '%', status: 'red' as const },
      { label: 'Core Banking Age', value: firstCapital.technology.coreBanking.age + ' yrs', status: 'red' as const },
      { label: 'FedNow Live', value: 'No', status: 'red' as const },
    ]
    if (activeClient === 'apexretail') return [
      { label: 'Operating Margin', value: apexRetail.org.operatingMargin + '%', status: 'red' as const },
      { label: 'Inventory Turnover', value: apexRetail.financials.inventoryTurnover + 'x', status: 'red' as const },
      { label: 'Cart Abandonment', value: apexRetail.technology.commercePlatform.ecommerce.cartAbandonmentRate + '%', status: 'red' as const },
      { label: 'Loyalty Active', value: apexRetail.financials.loyaltyMemberPercent + '%', status: 'yellow' as const },
    ]
    return [
      { label: 'Operating Margin', value: meridianHealth.org.operatingMargin + '%', status: 'red' as const },
      { label: 'RCM Denial Rate', value: meridianHealth.technology.rcm.denialRate + '%', status: 'red' as const },
      { label: 'Epic Optimization', value: meridianHealth.technology.ehr.optimizationScore + '/100', status: 'yellow' as const },
      { label: 'MA Star Rating', value: String(meridianHealth.healthPlan.medicareAdvantage.starRating), status: 'yellow' as const },
    ]
  }

  function getDataFiles() {
    if (activeClient === 'firstcapital') return [
      { file: 'index.ts', label: 'Organization & Financials', confidence: 88 },
      { file: 'technology_inventory.ts', label: 'Tech Stack Inventory', confidence: 87 },
      { file: 'architecture.ts', label: 'System Architecture', confidence: 85 },
      { file: 'ai.ts', label: 'AI Capabilities', confidence: 83 },
    ]
    if (activeClient === 'apexretail') return [
      { file: 'index.ts', label: 'Organization & Financials', confidence: 86 },
      { file: 'technology_inventory.ts', label: 'Tech Stack Inventory', confidence: 84 },
      { file: 'ai.ts', label: 'AI Capabilities', confidence: 82 },
    ]
    return [
      { file: 'financials.ts', label: 'Financial Performance', confidence: 95 },
      { file: 'technology.ts', label: 'EHR & RCM Systems', confidence: 92 },
      { file: 'technology_inventory.ts', label: 'Tech Stack Inventory', confidence: 94 },
      { file: 'clinical.ts', label: 'Clinical Operations', confidence: 88 },
      { file: 'leadership.ts', label: 'Leadership Insights', confidence: 90 },
      { file: 'architecture.ts', label: 'System Architecture', confidence: 85 },
      { file: 'ai.ts', label: 'AI Initiatives', confidence: 87 },
    ]
  }

  function getKeyFindings() {
    if (activeClient === 'firstcapital') return [
      { finding: '68% cost-to-income ratio', source: 'index.ts — financials' },
      { finding: 'FIS HORIZON 22 years old', source: 'index.ts — technology' },
      { finding: '41% digital adoption', source: 'index.ts — technology.digital' },
      { finding: '$3.8M excess fraud losses', source: 'index.ts — financials' },
    ]
    if (activeClient === 'apexretail') return [
      { finding: '3.8% operating margin vs 6% target', source: 'index.ts — financials' },
      { finding: '4.2x inventory turnover (6.8x benchmark)', source: 'index.ts — financials' },
      { finding: '72% cart abandonment rate', source: 'index.ts — technology' },
      { finding: '42% loyalty active rate', source: 'index.ts — financials' },
    ]
    return [
      { finding: '$94M RCM denial write-off', source: 'financials.ts + technology.ts' },
      { finding: 'Epic optimization 58/100', source: 'technology.ts — ehr' },
      { finding: '1.8% operating margin', source: 'financials.ts' },
      { finding: 'Blue Ridge integration 8mo overdue', source: 'technology.ts + leadership.ts' },
      { finding: '3.5 MA Star Rating', source: 'index.ts — healthPlan' },
    ]
  }

  function getCostSummary() {
    if (activeClient === 'firstcapital') return {
      total: '$127M',
      label: 'Total annual cost exposure',
      items: [
        { label: 'Digital revenue at risk', value: '$68M', color: '#DC2626' },
        { label: 'Excess fraud losses vs benchmark', value: '$3.8M', color: '#DC2626' },
        { label: 'Cost-to-income gap (55% target)', value: '$41M', color: '#D97706' },
        { label: 'FedNow commercial client risk', value: '$14M', color: '#D97706' },
      ],
    }
    if (activeClient === 'apexretail') return {
      total: '$183M',
      label: 'Total annual cost exposure',
      items: [
        { label: 'Inventory carrying cost (4.2x vs 6.8x)', value: '$94M', color: '#DC2626' },
        { label: 'Cart abandonment revenue loss', value: '$52M', color: '#DC2626' },
        { label: 'Loyalty program underperformance', value: '$28M', color: '#D97706' },
        { label: 'Einstein activation gap', value: '$9M', color: '#D97706' },
      ],
    }
    return {
      total: '$218M',
      label: 'Total annual cost exposure',
      items: [
        { label: 'RCM denial write-offs (18.2% rate)', value: '$94M', color: '#DC2626' },
        { label: 'Operating margin board gap', value: '$94M', color: '#DC2626' },
        { label: 'Prior auth delay cost (4.2d vs 1.8d)', value: '$18M', color: '#D97706' },
        { label: 'Epic underutilization loss', value: '$12M', color: '#D97706' },
      ],
    }
  }

  function getContradictions() {
    if (activeClient === 'firstcapital') return firstCapital.contradictions
    if (activeClient === 'apexretail') return apexRetail.contradictions
    return meridianHealth.contradictions
  }

  // Map a user message to the closest demo response key
  function resolveDemoKey(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes('denial') || m.includes('rcm')) return 'rcm-denial-rate'
    if (m.includes('margin') || m.includes('94m') || m.includes('94 m')) return 'operating-margin'
    if (m.includes('fednow') || m.includes('fed now') || m.includes('real-time payment')) return 'fednow-urgency'
    if (m.includes('einstein') || m.includes('personaliz')) return 'einstein-activation'
    if (m.includes('travel nurse') || m.includes('staffing')) return 'rcm-denial-rate'
    if (m.includes('prior auth')) return 'rcm-denial-rate'
    if (m.includes('epic')) return 'operating-margin'
    return 'rcm-denial-rate' // fallback to richest response
  }

  const executeRequest = useCallback(async (msgs: Array<{role: string, content: string}>, currentClient: string, currentRole: string) => {
    pendingMessages.current = msgs
    setLoading(true)
    setStreaming('')
    setLastError(null)

    // Demo mode: stream pre-cached response
    if (isDemoMode()) {
      const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user')?.content ?? ''
      const key = resolveDemoKey(lastUserMsg)
      let accumulated = ''
      const cancel = streamDemoResponse(
        currentClient as DemoClient,
        key,
        (chunk) => {
          accumulated += chunk
          setStreaming(accumulated)
        },
        () => {
          setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
          setStreaming('')
          setLoading(false)
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        },
        35,
      )
      cancelDemoRef.current = cancel
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, role: currentRole, client: currentClient }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(errText || 'HTTP ' + res.status)
      }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value)
          setStreaming(full)
        }
      }
      setMessages(prev => [...prev, { role: 'assistant', content: full }])
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      setLastError(isTimeout ? 'timeout' : 'error')
    }
    setStreaming('')
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(text?: string) {
    const msg = text || input
    if (!msg.trim()) return
    const updated = [...messages, { role: 'user', content: msg }]
    setMessages(updated)
    setLastQuery(msg)
    setInput('')
    await executeRequest(updated, activeClient, role)
  }

  async function retryRequest() {
    await executeRequest(pendingMessages.current, activeClient, role)
  }

  function getFollowUpOptions(): ResponseOption[] {
    return [
      {
        icon: '💰',
        title: 'Show dollar impact',
        description: 'Quantify the full financial cost of this issue',
        promptText: `What is the full financial impact of this issue on ${clientName}? Give me a dollar figure I can put in front of the board.`,
      },
      {
        icon: '🎯',
        title: 'Fastest path to fix',
        description: '90-day resolution plan with clear owners',
        promptText: `What is the fastest path to resolve this — give me a 90-day plan with clear owners and first actions for ${clientName}.`,
      },
      {
        icon: '👤',
        title: 'Who owns this',
        description: 'Identify the accountable executive and their stance',
        promptText: `Which executive at ${clientName} is accountable for this problem, and what is their stated position versus what the data shows?`,
      },
    ]
  }

  return (
    <div style={{ ...S.page, position: 'relative' }}>
      {demoMode && (
        <div style={{ position: 'fixed', top: '14px', right: '16px', zIndex: 9999, background: '#F97316', color: '#FFFFFF', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', pointerEvents: 'none' }}>
          DEMO
        </div>
      )}
      <AbarvaNav clientId={activeClient} onClientChange={id => { setActiveClient(id); setMessages([]); setStreaming(''); setLastError(null); setSidebarTab('snapshot') }} activePage="diagnose" />
      <EngagementProgress />
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Diagnose</span>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{clientName} · {clientIndustry}</span>
      </div>
      {/* Journey */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '0', height: '36px', overflowX: 'auto' as const }}>
        {[
          { label: 'Diagnose', href: '/diagnose?client=' + activeClient, active: true },
          { label: 'AI Strategy', href: '/ai-strategy?client=' + activeClient, active: false },
          { label: 'Justify', href: '/justify?client=' + activeClient, active: false },
          { label: 'Select', href: '/select?client=' + activeClient, active: false },
          { label: 'Blueprint', href: '/blueprint?client=' + activeClient, active: false },
        ].map((step, i) => (
          <a key={i} href={step.href} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', height: '36px', fontSize: '11px', fontWeight: step.active ? 700 : 500, color: step.active ? '#1B4FD8' : '#9CA3AF', textDecoration: 'none', borderBottom: step.active ? '2px solid #1B4FD8' : '2px solid transparent', whiteSpace: 'nowrap' as const, boxSizing: 'border-box' as const }}>
            {step.active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1B4FD8', display: 'block' }} />}
            {step.label}
          </a>
        ))}
      </div>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', height: 'calc(100vh - 136px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {roles.map(r => (
              <button key={r} onClick={() => { setRole(r); setMessages([]); setStreaming(''); setLastError(null) }}
                style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: role === r ? 'none' : '1px solid #E2E8F0', background: role === r ? '#2563EB' : '#FFFFFF', color: role === r ? '#FFFFFF' : '#475569' }}>
                {r}
              </button>
            ))}
            <button onClick={() => { setMessages([]); setStreaming(''); setLastError(null) }} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#6B7280' }}>Clear</button>
          </div>
          {messages.length === 0 && !streaming && (
            <div style={{ marginBottom: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '10px' }}>Priority issues for {role} — {clientName}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getUseCases(activeClient as ClientId, role as RoleId).map((uc, i) => (
                  <button key={i} onClick={() => sendMessage(uc.title + ' — ' + uc.metric)}
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid ' + severityColor(uc.severity), borderRadius: '8px', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2DD4C8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{severityEmoji(uc.severity)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '3px' }}>{uc.title}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4, marginBottom: '3px' }}>{uc.metric}</div>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>{uc.impact}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const, background: msg.role === 'user' ? '#2563EB' : '#FFFFFF', color: msg.role === 'user' ? '#FFFFFF' : '#374151', border: msg.role === 'user' ? 'none' : '1px solid #E2E8F0' }}>
                      {msg.content}
                    </div>
                  </div>
                  {isLastAssistant && !loading && (
                    <div style={{ maxWidth: '80%' }}>
                      <DataUnlock
                        orgId={activeClient}
                        queryText={lastQuery}
                        onRefresh={() => { setMessages(prev => prev.slice(0, -1)); executeRequest(messages.slice(0, -1), activeClient, role) }}
                      />
                      <ResponseOptions
                        options={getFollowUpOptions()}
                        onSelect={(text) => sendMessage(text)}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {loading && !streaming && <div style={{ ...S.card, padding: '12px 16px', fontSize: '13px', color: '#94A3B8', width: 'fit-content' }}>Analyzing {clientName}...</div>}
            {streaming && <div style={{ maxWidth: '80%', ...S.card, padding: '12px 16px', fontSize: '14px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>{streaming}</div>}
            {lastError && !loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ maxWidth: '80%', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', background: '#FFF7ED', color: '#92400E', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
                  <span>{lastError === 'timeout' ? 'Taking longer than usual.' : 'Error connecting to AbarVa.'}</span>
                  <button onClick={retryRequest} style={{ padding: '5px 12px', borderRadius: '6px', background: '#2563EB', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                    Try again →
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {messages.length >= 2 && !loading && (
            <div style={{ marginBottom: '12px', padding: '12px 16px', background: '#F5F3FF', borderRadius: '10px', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', marginBottom: '2px' }}>Diagnosis complete</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Turn this diagnosis into a full AI strategy →</div>
              </div>
              <a href={'/ai-strategy?client=' + activeClient} style={{ padding: '8px 18px', borderRadius: '8px', background: '#7C3AED', color: 'white', fontSize: '13px', fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                AI Strategy →
              </a>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={'Ask AbarVa anything as ' + role + ' at ' + clientName + '...'}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', fontSize: '14px', border: '1px solid #E2E8F0', outline: 'none', background: '#FFFFFF', color: '#0F172A', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#2563EB'}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#E2E8F0'} />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
              Send
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          {/* Tab bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {([
              { id: 'snapshot', label: 'Snapshot' },
              { id: 'findings', label: 'Findings' },
              { id: 'actions', label: 'Actions' },
              { id: 'data', label: 'Data Foundation' },
            ] as { id: typeof sidebarTab, label: string }[]).map(t => (
              <button key={t.id} onClick={() => setSidebarTab(t.id)}
                style={{ padding: '5px 4px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', lineHeight: 1.2, textAlign: 'center' as const, border: sidebarTab === t.id ? 'none' : '1px solid #E2E8F0', background: sidebarTab === t.id ? '#2563EB' : '#FFFFFF', color: sidebarTab === t.id ? '#FFFFFF' : '#475569' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Snapshot tab */}
          {sidebarTab === 'snapshot' && (
            <>
            <div style={S.card}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>CLIENT SNAPSHOT</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{clientName}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>{confidence}% data confidence</div>
              {getMetrics().map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>{m.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{m.value}</span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColors[m.status], display: 'block' }} />
                  </div>
                </div>
              ))}
            </div>
            {/* What this is costing you */}
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>WHAT THIS IS COSTING YOU</div>
              {(() => { const c = getCostSummary(); return (
                <>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#DC2626', letterSpacing: '-0.03em', marginBottom: '4px' }}>{c.total}</div>
                  <div style={{ fontSize: '11px', color: '#B91C1C', marginBottom: '12px' }}>{c.label}</div>
                  {c.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#374151', flex: 1, paddingRight: '8px', lineHeight: 1.3 }}>{item.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: item.color, flexShrink: 0 }}>{item.value}</span>
                    </div>
                  ))}
                </>
              )})()}
            </div>
            </>
          )}

          {/* Findings tab */}
          {sidebarTab === 'findings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingContradictions && (
                <div style={{ ...S.card, padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Analyzing contradictions in client data...</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Comparing commitments against actuals</div>
                </div>
              )}
              {!loadingContradictions && contradictions && contradictions.map((c) => {
                const severityColor = c.severity === 'critical' ? '#DC2626' : c.severity === 'high' ? '#D97706' : '#2563EB'
                const severityBg = c.severity === 'critical' ? '#FEF2F2' : c.severity === 'high' ? '#FFFBEB' : '#EFF6FF'
                return (
                  <div key={c.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3, flex: 1, paddingRight: '8px' }}>{c.title}</div>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', background: severityBg, color: severityColor, flexShrink: 0, textTransform: 'uppercase' as const }}>
                        {c.severity}
                      </span>
                    </div>
                    <div style={{ padding: '8px 12px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' as const, marginBottom: '2px' }}>A: {c.dataPointA.label}</div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>{c.dataPointA.value}</div>
                          <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '1px', lineHeight: 1.3 }}>{c.dataPointA.source.split(',')[0]}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: severityColor, textTransform: 'uppercase' as const, marginBottom: '2px' }}>B: {c.dataPointB.label}</div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>{c.dataPointB.value}</div>
                          <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '1px', lineHeight: 1.3 }}>{c.dataPointB.source.split(',')[0]}</div>
                        </div>
                      </div>
                    </div>
                    {c.finding && (
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '10px', color: '#374151', lineHeight: 1.4 }}>{c.finding}</div>
                      </div>
                    )}
                    <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      {c.recommendation && (
                        <div style={{ fontSize: '10px', color: '#2563EB', lineHeight: 1.4, flex: 1 }}>→ {c.recommendation}</div>
                      )}
                      <span style={{ fontSize: '9px', color: '#94A3B8', flexShrink: 0 }}>{c.confidence}% conf.</span>
                    </div>
                  </div>
                )
              })}
              {!loadingContradictions && contradictions && (
                <a href={'/contradictions?client=' + activeClient} style={{ display: 'block', padding: '10px 14px', borderRadius: '10px', background: '#0D1117', color: '#2DD4C8', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', border: '1px solid #2DD4C8', letterSpacing: '0.02em' }}>
                  View Contradiction Map →
                </a>
              )}
              {!loadingContradictions && contradictions && (
                <a href={'/timeline?client=' + activeClient} style={{ display: 'block', padding: '10px 14px', borderRadius: '10px', background: '#FFFFFF', color: '#0F172A', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  View Decision Timeline →
                </a>
              )}
            </div>
          )}

          {/* Actions tab */}
          {sidebarTab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Situation Brief export */}
              <div style={{ background: '#0D1117', border: '1px solid #2DD4C8', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#2DD4C8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>SITUATION BRIEF</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px', lineHeight: 1.5 }}>One-page HTML export with the 3 key findings, dollar quantification, and contradiction map. Send before the first meeting.</div>
                <button
                  onClick={() => {
                    const cost = activeClient === 'firstcapital' ? '$127M' : activeClient === 'apexretail' ? '$183M' : '$218M'
                    const name = activeClient === 'firstcapital' ? 'First Capital Financial' : activeClient === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Situation Brief — ${name}</title><style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#0F172A}h1{font-size:28px;font-weight:900;margin-bottom:4px}h2{font-size:16px;font-weight:700;margin:24px 0 8px;color:#DC2626}.metric{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}.m{padding:16px;border:1px solid #E2E8F0;border-radius:8px}.label{font-size:11px;color:#6B7280;text-transform:uppercase;font-weight:700}.value{font-size:22px;font-weight:800;color:#DC2626}.total{font-size:32px;font-weight:900;color:#DC2626;border:2px solid #DC2626;padding:16px;border-radius:8px;margin-bottom:24px}</style></head><body><div style="font-size:11px;text-transform:uppercase;font-weight:700;color:#2DD4C8;letter-spacing:0.1em;margin-bottom:8px">Situation Brief · AbarVa Intelligence Platform</div><h1>${name}</h1><div style="font-size:14px;color:#6B7280;margin-bottom:24px">Prepared by AbarVa · ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div><h2>What This Is Costing You</h2><div class="total">${cost} total annual cost exposure</div><h2>Three Key Contradictions</h2><div class="metric">${['Operating margin below board target', 'RCM denial rate 6 pts above benchmark', 'Prior auth 133% slower than peers'].map(f => `<div class="m"><div class="label">Finding</div><div style="font-size:13px;font-weight:600;margin-top:4px">${f}</div></div>`).join('')}</div><div style="margin-top:32px;padding:16px;background:#F8FAFC;border-radius:8px;font-size:12px;color:#6B7280">This brief was prepared by AbarVa using publicly available data. Schedule a full Situation Intelligence session to load proprietary data and identify the full gap. abarva.com</div></body></html>`
                    const blob = new Blob([html], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = `situation-brief-${activeClient}.html`; a.click()
                    URL.revokeObjectURL(url)
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#2DD4C8', color: '#0D1117', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', textAlign: 'center' as const }}>
                  Export Situation Brief (HTML)
                </button>
              </div>
              <div style={S.card}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>NEXT STEPS</div>
                {[
                  { label: 'AI Strategy', href: '/ai-strategy?client=' + activeClient },
                  { label: 'Build Business Case', href: '/justify?client=' + activeClient },
                  { label: 'Select Vendor', href: '/select?client=' + activeClient },
                  { label: 'Maestro Admin', href: '/admin' },
                ].map((a, i) => (
                  <a key={i} href={a.href} style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, textDecoration: 'none', background: '#F8FAFC', color: '#2563EB', border: '1px solid #E2E8F0', marginBottom: '8px' }}>{a.label} →</a>
                ))}
              </div>
            </div>
          )}

          {/* Data Foundation tab */}
          {sidebarTab === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>DATA FILES LOADED</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'block' }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669' }}>Generated from your data</span>
                  </div>
                </div>
                {getDataFiles().map((f, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{f.file}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: f.confidence >= 90 ? '#059669' : f.confidence >= 85 ? '#D97706' : '#DC2626' }}>{f.confidence}%</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                      <div style={{ height: '4px', borderRadius: '2px', width: f.confidence + '%', background: f.confidence >= 90 ? '#059669' : f.confidence >= 85 ? '#D97706' : '#DC2626' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>FINDING — SOURCE MAP</div>
                {getKeyFindings().map((kf, i) => (
                  <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < getKeyFindings().length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '2px', lineHeight: 1.4 }}>{kf.finding}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>{kf.source}</div>
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>EXPLORE DATA LAYER</div>
                <a href={'/data-intelligence?client=' + activeClient} style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, textDecoration: 'none', background: '#F8FAFC', color: '#2563EB', border: '1px solid #E2E8F0', marginBottom: '8px' }}>Data Intelligence →</a>
                <a href={'/architecture?client=' + activeClient} style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, textDecoration: 'none', background: '#F8FAFC', color: '#2563EB', border: '1px solid #E2E8F0' }}>Architecture →</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DiagnosePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading...</div>}>
      <DiagnoseContent />
    </Suspense>
  )
}
