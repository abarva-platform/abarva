'use client'
import { useState, useRef, useCallback, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'

type Sev = 'CRITICAL' | 'HIGH'

interface CNode {
  id: string
  l1: string; l2: string
  metric: string
  sev: Sev
  impact: string
  angle: number
  title: string
  committed: string
  actual: string
  rootCause: string
  recommendation: string
}

// SVG constants
const CX = 290, CY = 275, CR = 185, NODE_R = 40

function nPos(angle: number) {
  const r = angle * Math.PI / 180
  return { x: Math.round(CX + CR * Math.sin(r)), y: Math.round(CY - CR * Math.cos(r)) }
}

// ─────────────── MERIDIAN DATA ───────────────
const MERIDIAN: CNode[] = [
  {
    id: 'ensemble', l1: 'Ensemble', l2: 'SLA', metric: '$8M unpaid penalties',
    sev: 'CRITICAL', impact: '$8M recoverable + $37.6M annual denial loss', angle: 30,
    title: 'Ensemble RCM — Contract vs Performance',
    committed: 'Ensemble RCM contract guarantees 12% denial rate and 95% SLA compliance — $48M/year contract with penalty clause of $2M per quarter in breach.',
    actual: 'Denial rate 18.2%. SLA compliance 67%. $8M in contractual penalties accumulated over 12 consecutive quarters — never enforced. Not once.',
    rootCause: 'Contract penalty clause exists but has never been triggered. Ensemble\'s fee structure rewards volume, not outcomes. No one in Meridian legal or procurement has ever invoked the penalty clause. Ensemble has no financial incentive to improve.',
    recommendation: 'Enforce $8M penalties immediately as leverage — this is leverage, not litigation. Issue parallel RFP to Cohere Health and Waystar so Ensemble knows replacement is real. This creates $8M in immediate cash and a path to the right vendor.',
  },
  {
    id: 'cogito', l1: 'Epic', l2: 'Cogito', metric: '35 dashboards idle',
    sev: 'HIGH', impact: '$18M annually in idle licensed capability', angle: 90,
    title: 'Epic Cogito — Licensed vs Activated',
    committed: '$48M Epic EHR implementation included the full Cogito analytics suite — 47 dashboards and AI modules licensed, configured, and paid for.',
    actual: '12 of 47 Cogito dashboards are live. 35 dashboards configured, paid for, and completely unused. Prior auth automation at 23% of payers despite the module being fully licensed.',
    rootCause: 'CMIO says the implementation was never finished post go-live. No one owns Cogito activation. CDO vacancy means no accountability for AI capability deployment. This was treated as a phase 2 task that never had a phase 2.',
    recommendation: 'Activate remaining 35 Cogito dashboards before purchasing any new analytics tool. Cost: $400K. Timeline: 6 months. Value: $18M annually. This is the highest ROI initiative in the current portfolio.',
  },
  {
    id: 'synapse', l1: 'Azure', l2: 'Synapse', metric: '40% done · stalled',
    sev: 'HIGH', impact: 'Blocks entire $292M AI initiative portfolio', angle: 150,
    title: 'Azure Synapse — Committed Foundation vs Stalled Reality',
    committed: '$3.2M Azure Synapse contract — full data foundation for all AI initiatives. Q2 2024 completion committed. All AI initiatives dependent on this foundation.',
    actual: '40% implemented. Stalled since October 2024. $1.8M spent with no completion plan. Every AI initiative in the roadmap is blocked until this foundation is done.',
    rootCause: 'CDO vacancy — no one owns the data strategy. IT team focused on Blue Ridge migration. Azure Synapse project has no executive sponsor and no named completion owner. Project died when it ran out of attention.',
    recommendation: 'Complete Synapse before starting any new data initiative. $800K and 90 days to finish. Do not pivot to Databricks — $4.2M and 18 months to restart. The math is clear.',
  },
  {
    id: 'sepsis', l1: 'Sepsis', l2: 'AI', metric: '21 hospitals unprotected',
    sev: 'HIGH', impact: '21 hospitals without proven AI sepsis protection', angle: 210,
    title: 'Sepsis AI — Board Approved vs Scale Never Happened',
    committed: 'AI-powered sepsis early warning — board approved Q4 2024. 31% mortality reduction proven at 2 pilot hospitals. Scale plan committed for all 23 hospitals.',
    actual: 'Live at 2 of 23 hospitals for 18 months. 31% mortality reduction proven. Never scaled. 21 hospitals still without AI sepsis detection. $960K invested, $0 enterprise value delivered.',
    rootCause: 'No MLOps pipeline — a validated model cannot be deployed to production environments. CDO vacancy means no deployment owner. Pilot success was never connected to a scale plan.',
    recommendation: 'Build MLOps pipeline on Azure ML — 60 days, $400K. Then deploy sepsis model to all 23 hospitals in 90 days. This saves lives and demonstrates AI execution capability to the board simultaneously.',
  },
  {
    id: 'cdo', l1: 'CDO', l2: 'Vacant', metric: '$5.6M/week delayed',
    sev: 'CRITICAL', impact: '$5.6M per week in blocked AI value', angle: 270,
    title: 'CDO Vacancy — Role Approved vs Search Never Started',
    committed: 'AI strategy requires data leadership — CDO role approved by board Q3 2025. Active search committed as prerequisite for AI program launch.',
    actual: 'CDO vacant 8 months. No active search running. CIO carrying both CIO and CDO responsibilities. 6 AI initiatives structurally blocked by this single vacancy.',
    rootCause: 'CHRO treating CDO hire as a standard executive search — 90-180 day process. Should be treated as a critical path item blocking $292M in AI value. Every week of vacancy costs $5.6M in delayed initiative value.',
    recommendation: 'Start CDO search this week — not next quarter. Use an AI-specialized executive search firm. Designate acting CDO from current team within 30 days while search runs. This is the single highest-leverage action available.',
  },
  {
    id: 'priorauth', l1: 'Prior', l2: 'Auth', metric: '$1M/day penalty risk',
    sev: 'CRITICAL', impact: '$1M/day CMS penalty exposure · $28M recoverable', angle: 330,
    title: 'Prior Auth — CMS Compliance vs 77% Manual',
    committed: 'CMS Interoperability and Prior Authorization Final Rule — 100% electronic prior auth by January 1, 2026. Ensemble contracted to deliver this outcome.',
    actual: '23% of payers connected electronically. 77% still manual. 8 months to the CMS deadline. $1M/day penalty exposure at full non-compliance. Ensemble has connected 23 payers in 3 years.',
    rootCause: 'Ensemble responsible for prior auth automation under the RCM contract. Has connected only 23 of 847 payers. No penalty enforced for failing to meet this contractual milestone — same root cause as the SLA issue.',
    recommendation: 'Issue RFP to Cohere Health this week — 847 payer connections pre-built, live in 6 months. Parallel track: enforce Ensemble SLA penalties to fund the transition. Most time-sensitive decision in this engagement.',
  },
]

// ─────────────── FIRST CAPITAL DATA ───────────────
const FIRST_CAPITAL: CNode[] = [
  {
    id: 'fednow', l1: 'FedNow', l2: 'Not Live', metric: '$340M deposit risk',
    sev: 'CRITICAL', impact: '$340M in commercial deposits threatened', angle: 30,
    title: 'FedNow — Public Q4 2024 Commitment vs Still Not Live',
    committed: 'CEO Annual Report 2023: FedNow real-time payments go-live committed to shareholders by Q4 2024. Publicly disclosed target.',
    actual: 'Not live as of Q1 2026 — 5 quarters past commitment. 68% of peer banks are live. Three commercial clients formally inquired about alternatives in the past 90 days.',
    rootCause: 'FIS HORIZON 22-year-old core cannot support FedNow natively — requires middleware layer never budgeted or built. Decision to delay was never communicated to commercial clients.',
    recommendation: 'Engage Finzly for FedNow enablement — 90-day deployment, cloud-native middleware, no HORIZON replacement required. $340M commercial deposit risk resolved before any client defects.',
  },
  {
    id: 'actimize', l1: 'NICE', l2: 'Actimize', metric: '78% false positive',
    sev: 'HIGH', impact: '$4.2M annual analyst cost on false positives', angle: 90,
    title: 'AML False Positive Rate — Vendor Spec vs Measured Reality',
    committed: 'NICE Actimize 8.1 product specification promises 35% false positive rate at correct configuration. OCC-approvable system.',
    actual: '78% false positive rate — 43pp above specification. OCC examiner noted this in March 2023 exam. 6 FTE analysts reviewing transactions that AI should auto-clear.',
    rootCause: 'NICE Actimize is 2 major versions behind — missing ML detection models introduced in versions 8.2 and 8.3. System is misconfigured and undertuned. No one owns model configuration or version currency.',
    recommendation: 'Upgrade NICE Actimize to current version immediately. If upgrade fails to hit 35% target, migrate AML model to Amazon SageMaker — eliminates $4.2M annual analyst cost and resolves OCC finding.',
  },
  {
    id: 'q2', l1: 'Q2', l2: 'T+1 Bug', metric: '1.8M see yesterday',
    sev: 'HIGH', impact: '3.2/5.0 app rating · 64% account abandonment', angle: 150,
    title: 'Digital Banking — Real-Time Promised vs T+1 Reality',
    committed: 'Q2 digital banking platform marketed to 1.8M customers with real-time balance and transaction visibility. Digital-first bank positioning.',
    actual: '1.8M digital customers seeing yesterday\'s balances. Account opening abandonment 64% vs 32% benchmark. Mobile app rating 3.2 — below 3.5 competitive switch threshold.',
    rootCause: 'FIS HORIZON data feed to Q2 runs on overnight batch — architectural limitation of a 22-year-old core banking system. Real-time requires either core replacement or middleware API layer.',
    recommendation: 'Deploy API middleware layer between HORIZON and Q2 to enable near-real-time balance feeds — $600K, 4 months. Parallel: UX improvements for account opening. Do not wait for core replacement.',
  },
  {
    id: 'sql', l1: 'SQL Server', l2: '2017', metric: 'Support ended Oct 2025',
    sev: 'HIGH', impact: 'Unpatched vulnerability · OCC finding risk', angle: 210,
    title: 'SQL Server 2017 — Support End Date Passed vs No Migration',
    committed: 'IT asset management plan committed to SQL Server migration before October 2025 end-of-support date. Risk-rated as high priority.',
    actual: 'SQL Server 2017 still in production. End-of-support passed October 2025. No patches, no security updates. Active security vulnerability.',
    rootCause: 'SQL Server migration deprioritized when core banking evaluation consumed IT budget and attention. No one escalated the missed deadline. Risk was acknowledged but not acted on.',
    recommendation: 'Migrate SQL Server 2017 to SQL Server 2022 or Azure SQL within 60 days. This is a compliance obligation, not an IT choice. Escalate to CIO as a board risk item immediately.',
  },
  {
    id: 'horizon', l1: 'HORIZON', l2: '87% Capacity', metric: 'Growth impossible',
    sev: 'HIGH', impact: 'Growth plan impossible · outage risk above 90%', angle: 270,
    title: 'Core Banking Capacity — Growth Plan vs 87% Peak Utilization',
    committed: 'First Capital growth plan projects 15% account volume increase over 24 months. Board approved growth strategy.',
    actual: 'FIS HORIZON at 87% peak capacity. Industry safe threshold is 70%. Growth plan is structurally impossible without capacity relief or core replacement.',
    rootCause: 'FIS HORIZON evaluated for replacement twice in 5 years — no decision either time. Each evaluation consumed 12 months and $800K with no outcome. Capacity grew while decisions stalled.',
    recommendation: 'Stop evaluating — decide. Temenos cloud-native migration is the right path. Start formal selection this quarter. 3-year migration minimum means the clock started yesterday.',
  },
  {
    id: 'occ', l1: 'OCC', l2: 'MRAs', metric: '3 unresolved findings',
    sev: 'CRITICAL', impact: 'Consent order risk at next examination', angle: 330,
    title: 'OCC MRAs — 12-Month Remediation Committed vs 3 Still Open',
    committed: 'March 2023 OCC examination: First Capital committed to remediate all Matters Requiring Attention within 12 months.',
    actual: 'Three MRAs from March 2023 exam remain unresolved. Next OCC examination scheduled. Unresolved MRAs at next exam risk consent order designation.',
    rootCause: 'AML false positive rate (78%) and core banking capacity issues are root causes of two MRAs. Third MRA related to model risk governance — requires CDO-equivalent accountability.',
    recommendation: 'Assign a named executive owner for each MRA with 30-day remediation milestone. AML: Actimize upgrade. Capacity: Temenos selection. Model governance: CDO-level hire or appointment.',
  },
]

// ─────────────── APEX RETAIL DATA ───────────────
const APEX: CNode[] = [
  {
    id: 'einstein', l1: 'Einstein', l2: 'Idle', metric: '$248M opportunity idle',
    sev: 'CRITICAL', impact: '$248M annual revenue + $1.1M in paid licenses wasted', angle: 30,
    title: 'Salesforce Einstein — Purchased 14 Months Ago vs Never Activated',
    committed: 'Salesforce Einstein Personalization licensed — board presentation committed to personalization capability by Q1 2025. Licenses purchased and fees paid.',
    actual: '14 months of paid Einstein licenses. Zero activation. $1.1M in fees paid with $0 ROI. Activation cost is $800K. Every month of delay costs approximately $20M in foregone personalization revenue.',
    rootCause: 'Implementation stalled when Salesforce PS engagement was not funded post-license purchase. No internal owner for Einstein activation. Decision-by-inaction for 14 consecutive months.',
    recommendation: 'Activate Einstein this quarter. $800K. 6 weeks to first revenue. Fix Segment CDP profile fragmentation first — 50% fragmentation means Einstein personalizes to ghost profiles without this fix.',
  },
  {
    id: 'o9', l1: 'o9', l2: 'Stalled', metric: '$68M excess inventory',
    sev: 'HIGH', impact: '$68M excess inventory carrying cost vs target', angle: 90,
    title: 'o9 Demand Planning — $4.2M Investment vs 40% Implemented',
    committed: '$4.2M o9 demand planning platform investment — full deployment committed by Q4 2024. Forecast accuracy target: 84%.',
    actual: '40% implemented. Stalled 6+ months. Forecast accuracy 62% vs 84% benchmark. $68M excess inventory carrying cost vs target performance.',
    rootCause: 'o9 implementation required clean data from SAP — SAP data quality issues halted progress. Implementation partner disengaged without completing. No escalation occurred.',
    recommendation: 'Re-engage o9 with a fixed-outcome contract. Connect o9 to Snowflake as primary data source instead of SAP to bypass SAP data quality issues. $1.2M to complete. 90 days to first accurate forecast.',
  },
  {
    id: 'segment', l1: 'Segment', l2: 'CDP', metric: '50% fragmented',
    sev: 'HIGH', impact: 'Every personalization decision is wrong without this fix', angle: 150,
    title: 'Segment CDP — 18M Members vs 50% Profile Fragmentation',
    committed: 'Segment CDP deployed to create unified customer profiles across all channels. 18M loyalty members to be unified for personalization.',
    actual: 'Same customer counted 2.8x on average. 50% fragmentation — loyalty member counts are inflated. Every personalization recommendation is based on phantom profiles.',
    rootCause: 'Identity resolution was never configured. Segment requires explicit matching rules to merge anonymous, email, and loyalty IDs. This was a post-go-live task that was never done.',
    recommendation: 'Fix Segment identity resolution before activating Einstein. $0 additional spend — 2 weeks of configuration. Without this fix, Einstein personalizes to ghost profiles and cart recovery targets people who don\'t exist.',
  },
  {
    id: 'sap', l1: 'SAP ECC', l2: '2027', metric: '21mo left · not started',
    sev: 'HIGH', impact: '$8–12M/year extended support post-2027', angle: 210,
    title: 'SAP ECC — Board Decision Missed vs Support Ending Dec 2027',
    committed: 'Board Q3 2024 agenda: SAP migration decision. Committed to vendor selection by year-end 2024. SAP ECC support ends December 2027.',
    actual: 'No migration started. No vendor selected. 21 months to support end. SAP migration requires 24-36 months minimum. Timeline is already structurally impossible without emergency action.',
    rootCause: 'Board decision deferred from Q3 2024 to Q1 2025, then indefinitely. 12,847 customizations create analysis paralysis — scope feels too large to decide on.',
    recommendation: 'Start S/4HANA migration assessment this month. Publicis Sapient for SI. Decision in 60 days, not 6 months. Every month of delay raises migration risk and cost.',
  },
  {
    id: 'sterling', l1: 'IBM', l2: 'Sterling', metric: '3 versions behind',
    sev: 'HIGH', impact: 'Overselling 3×/month · omnichannel impossible', angle: 270,
    title: 'IBM Sterling OMS — Version Currency vs 3 Versions Behind',
    committed: 'IBM Sterling OMS contracted for current version support and omnichannel order fulfillment capability.',
    actual: '3 versions behind. Overselling 3+ times per month due to inventory sync failures. 84% inventory accuracy vs 98% required for omnichannel. Buy Online Pick Up In Store failing at scale.',
    rootCause: 'Upgrade deprioritized 3 times due to cost and downtime concerns. Each deferral made the version gap larger and the oversell incidents more frequent.',
    recommendation: 'Replace with Manhattan Associates OMS — cloud-native, omnichannel-first, no upgrade debt. $4.5M vs $3.2M for Sterling upgrade — but Manhattan eliminates the oversell problem permanently.',
  },
  {
    id: 'china', l1: 'China', l2: 'Sourcing', metric: '48% · UFLPA risk',
    sev: 'HIGH', impact: '$400M inventory UFLPA seizure exposure', angle: 330,
    title: 'China Sourcing — Stated 30% Target vs 48% Actual Concentration',
    committed: 'Supply chain strategy committed to reducing China sourcing below 30% by end of 2024 in response to UFLPA enforcement risk.',
    actual: '48% China sourcing. 12 suppliers identified as high-risk under UFLPA. 3 suppliers under active CBP review. No seizures yet but risk is immediate.',
    rootCause: 'Diversification plan created but not executed. Alternative sourcing in Vietnam and Bangladesh identified but not contracted. Procurement team lacked mandate and budget to switch.',
    recommendation: 'Treat China sourcing as board-level risk with named executive accountability. Mandate 35% reduction in 12 months. Fund alternative supplier qualification immediately — before a seizure forces the decision.',
  },
]

const CLIENT_DATA: Record<string, { nodes: CNode[]; name: string; shortName: string; accent: string; critCount: number; highCount: number }> = {
  meridian: {
    nodes: MERIDIAN, name: 'Meridian Health System', shortName: 'Meridian',
    accent: '#4DA3FF', critCount: 3, highCount: 3,
  },
  firstcapital: {
    nodes: FIRST_CAPITAL, name: 'First Capital Financial', shortName: 'First Capital',
    accent: '#FF9900', critCount: 2, highCount: 4,
  },
  apexretail: {
    nodes: APEX, name: 'Apex Retail Group', shortName: 'Apex Retail',
    accent: '#34A853', critCount: 1, highCount: 5,
  },
}

const CLIENTS = [
  { id: 'meridian',   name: 'Meridian Health',   accent: '#4DA3FF' },
  { id: 'arcturus',   name: 'Arcturus Financial', accent: '#818CF8' },
  { id: 'apexretail', name: 'Apex Retail',        accent: '#F59E0B' },
]

const SEV_COLOR: Record<Sev, string> = { CRITICAL: '#EF4444', HIGH: '#F59E0B' }

function ContradictionChat({ client, contradictionTitle, contradictionImpact }: { client: string; contradictionTitle: string; contradictionImpact: string }) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setLoading(true)
    setInput('')
    const userMsg = { role: 'user', content: text }
    const next = messages.length === 0
      ? [{ role: 'user', content: `Context: I'm looking at the "${contradictionTitle}" contradiction. Impact: ${contradictionImpact}. Question: ${text}` }]
      : [...messages, userMsg]
    setMessages(prev => [...prev, userMsg])
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, clientId: client, role: 'Maestro' }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += dec.decode(value, { stream: true })
        setStreaming(acc)
      }
      setMessages(m => [...m, { role: 'assistant', content: acc }])
      setStreaming('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch { /* ignore abort */ } finally { setLoading(false) }
  }, [messages, client, contradictionTitle, contradictionImpact, loading])

  const PURPLE = '#A371F7', TEAL = '#2DD4C8', SURFACE = '#161B22', BORDER = '#21262D', TEXT = '#E6EDF3', DIM = '#6B7280', BG = '#0D1117'
  const MONO = 'IBM Plex Mono, monospace', SANS = "'IBM Plex Sans', Inter, sans-serif"

  return (
    <div style={{ borderTop: '1px solid ' + BORDER, marginTop: '16px', paddingTop: '16px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: '10px', fontFamily: MONO }}>
        ASK ABARVA ABOUT THIS CONTRADICTION
      </div>
      <div style={{ background: BG, border: '1px solid ' + BORDER, borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '12px' }}>
          {messages.length === 0 && !streaming && (
            <div style={{ fontSize: '12px', color: DIM, padding: '8px 0' }}>
              Ask about the root cause, remediation path, or financial impact…
            </div>
          )}
          {messages.filter(m => m.role !== 'user' || !m.content.startsWith('Context:')).map((m, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: m.role === 'user' ? TEAL : PURPLE, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: '4px', fontFamily: MONO }}>
                {m.role === 'user' ? 'YOU' : 'ABARVA'}
              </div>
              <div style={{ fontSize: '13px', color: TEXT, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>{m.content}</div>
            </div>
          ))}
          {streaming && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: PURPLE, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: '4px', fontFamily: MONO }}>ABARVA</div>
              <div style={{ fontSize: '13px', color: TEXT, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>{streaming}</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '8px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: '6px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="What's the fastest remediation path?"
            autoFocus
            style={{ flex: 1, padding: '8px 12px', background: SURFACE, border: '1px solid ' + BORDER, borderRadius: '6px', color: TEXT, fontSize: '12px', fontFamily: SANS, outline: 'none' }}
          />
          <button onClick={() => send(input)} disabled={loading || !input.trim()}
            style={{ padding: '8px 16px', background: loading ? SURFACE : TEAL, color: loading ? DIM : '#0D1117', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
            {loading ? '…' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContradictionsContent() {
  const { clientId, allowedClients } = useClientContext()
  const [selectedClient, setSelectedClient] = useState(clientId)

  const visibleClients = CLIENTS.filter(c => allowedClients.find(a => a.id === c.id))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const cd = CLIENT_DATA[selectedClient] || CLIENT_DATA.meridian
  const selected = cd.nodes.find(n => n.id === selectedId) ?? cd.nodes[0]

  function selectClient(id: string) {
    setSelectedClient(id)
    setSelectedId(null)
    setChatOpen(false)
  }

  const critCount = cd.nodes.filter(n => n.sev === 'CRITICAL').length
  const highCount = cd.nodes.filter(n => n.sev === 'HIGH').length

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', fontFamily: "'IBM Plex Sans', Inter, sans-serif", color: '#E6EDF3' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes critPulse {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.55); }
        }
        @keyframes highPulse {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes nodeAppear {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        .crit-ring { animation: critPulse 2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
        .high-ring { animation: highPulse 2.8s ease-out infinite; transform-box: fill-box; transform-origin: center; }
        .net-node { cursor: pointer; transition: opacity 0.15s; animation: nodeAppear 0.4s ease-out both; transform-box: fill-box; transform-origin: center; }
        .net-node:hover { opacity: 0.85; }
        .active-line { animation: drawLine 0.55s ease-out forwards; }
      ` }} />

      <AbarvaNav />

      {/* Client selector */}
      <div style={{ background: '#161B22', borderBottom: '1px solid #21262D', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {visibleClients.map(c => (
          <button key={c.id} onClick={() => selectClient(c.id)}
            style={{ padding: '10px 20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderBottom: selectedClient === c.id ? '2px solid ' + c.accent : '2px solid transparent', background: 'transparent', color: selectedClient === c.id ? c.accent : '#6B7280' }}>
            {c.name}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', color: '#6B7280' }}>
          Click any node to see the full contradiction
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', height: 'calc(100vh - 96px)' }}>

        {/* SVG Network */}
        <div style={{ background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', borderRight: '1px solid #21262D' }}>
          <svg viewBox="0 0 580 540" style={{ width: '100%', maxWidth: '580px', height: '100%', maxHeight: '540px' }}>
            {/* Grid dots for atmosphere */}
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="0.8" fill="#1C2128" />
              </pattern>
            </defs>
            <rect width="580" height="540" fill="url(#grid)" />

            {/* Connection lines */}
            {cd.nodes.map(node => {
              const p = nPos(node.angle)
              const isActive = selected?.id === node.id
              const color = SEV_COLOR[node.sev]
              return isActive ? (
                <line key={node.id + '-line-active'}
                  className="active-line"
                  x1={CX} y1={CY} x2={p.x} y2={p.y}
                  stroke={color} strokeWidth={2}
                  strokeDasharray="200 200"
                />
              ) : (
                <line key={node.id + '-line'}
                  x1={CX} y1={CY} x2={p.x} y2={p.y}
                  stroke="#21262D" strokeWidth={1} strokeDasharray="4 4"
                />
              )
            })}

            {/* Nodes */}
            {cd.nodes.map((node, ni) => {
              const { x, y } = nPos(node.angle)
              const isActive = selected?.id === node.id
              const color = SEV_COLOR[node.sev]
              const isTop = y < CY
              const metricY = isTop ? y - 54 : y + 54

              return (
                <g key={node.id} className="net-node" onClick={() => setSelectedId(node.id)}
                  style={{ animationDelay: `${ni * 80}ms` }}>
                  {/* Pulse ring */}
                  {node.sev === 'CRITICAL' && (
                    <circle cx={x} cy={y} r={NODE_R + 12} fill="none" stroke={color} strokeWidth={1.5}
                      className="crit-ring" />
                  )}
                  {node.sev === 'HIGH' && (
                    <circle cx={x} cy={y} r={NODE_R + 10} fill="none" stroke={color} strokeWidth={1}
                      className="high-ring" />
                  )}
                  {/* Selection glow */}
                  {isActive && (
                    <circle cx={x} cy={y} r={NODE_R + 6} fill="none" stroke={color} strokeWidth={2} opacity={0.5} />
                  )}
                  {/* Main circle */}
                  <circle cx={x} cy={y} r={NODE_R}
                    fill={isActive ? color : '#161B22'}
                    stroke={color}
                    strokeWidth={isActive ? 0 : 1.5}
                  />
                  {/* Label inside circle */}
                  <text x={x} y={y - 7} textAnchor="middle" dominantBaseline="middle"
                    fill={isActive ? 'white' : color}
                    fontSize={10.5} fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace">
                    {node.l1}
                  </text>
                  <text x={x} y={y + 9} textAnchor="middle" dominantBaseline="middle"
                    fill={isActive ? 'white' : color}
                    fontSize={10.5} fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace">
                    {node.l2}
                  </text>
                  {/* Metric label outside */}
                  <text x={x} y={metricY} textAnchor="middle"
                    fill={isActive ? color : '#6B7280'}
                    fontSize={8.5}
                    fontFamily="IBM Plex Mono, monospace">
                    {node.metric}
                  </text>
                </g>
              )
            })}

            {/* Center node */}
            <circle cx={CX} cy={CY} r={52} fill="#161B22" stroke="#2DD4C8" strokeWidth={1.5} />
            <circle cx={CX} cy={CY} r={48} fill="#0D1117" stroke="#2DD4C8" strokeWidth={0.5} opacity={0.4} />
            <text x={CX} y={CY - 10} textAnchor="middle" fill="#2DD4C8" fontSize={11} fontWeight="700"
              fontFamily="IBM Plex Mono, monospace">
              {cd.shortName.split(' ')[0]}
            </text>
            <text x={CX} y={CY + 7} textAnchor="middle" fill="#2DD4C8" fontSize={10} fontWeight="600"
              fontFamily="IBM Plex Mono, monospace">
              {cd.shortName.split(' ').slice(1).join(' ')}
            </text>
            <text x={CX} y={CY + 23} textAnchor="middle" fill="#8B949E" fontSize={8.5}
              fontFamily="IBM Plex Mono, monospace">
              {cd.nodes.length} contradictions
            </text>

            {/* Legend */}
            <g transform="translate(16, 490)">
              <circle cx={6} cy={6} r={6} fill="none" stroke="#EF4444" strokeWidth={1.5} />
              <text x={16} y={10} fill="#6B7280" fontSize={8.5} fontFamily="IBM Plex Mono, monospace">CRITICAL</text>
              <circle cx={70} cy={6} r={6} fill="none" stroke="#F59E0B" strokeWidth={1.5} />
              <text x={80} y={10} fill="#6B7280" fontSize={8.5} fontFamily="IBM Plex Mono, monospace">HIGH</text>
              <text x={130} y={10} fill="#30363D" fontSize={8} fontFamily="IBM Plex Mono, monospace">· Click node to explore</text>
            </g>
          </svg>
        </div>

        {/* Detail panel */}
        <div style={{ overflowY: 'auto' as const, padding: '24px', background: '#0D1117' }}>
          {selected && (() => {
            const color = SEV_COLOR[selected.sev]
            return (
              <div>
                {/* Header */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: color + '18', color, border: '1px solid ' + color + '44', letterSpacing: '0.1em' }}>
                      {selected.sev}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#E6EDF3', lineHeight: 1.3, marginBottom: '8px' }}>{selected.title}</h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ fontSize: '9px', color: '#EF4444', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>FINANCIAL IMPACT</span>
                    <span style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 600 }}>{selected.impact}</span>
                  </div>
                </div>

                {/* 4 sections */}
                {[
                  { label: 'WHAT WAS COMMITTED', text: selected.committed, accent: '#6EE7B7', bg: 'rgba(110,231,183,0.06)', border: 'rgba(110,231,183,0.2)', icon: '✓' },
                  { label: 'WHAT ACTUALLY HAPPENED', text: selected.actual, accent: '#FCA5A5', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', icon: '✗' },
                  { label: 'ROOT CAUSE', text: selected.rootCause, accent: '#FDE68A', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', icon: '⬤' },
                  { label: 'AbarVa RECOMMENDATION', text: selected.recommendation, accent: '#93C5FD', bg: 'rgba(77,163,255,0.06)', border: 'rgba(77,163,255,0.2)', icon: '→' },
                ].map((section, i) => (
                  <div key={i} style={{ marginBottom: '12px', padding: '14px 16px', borderRadius: '8px', background: section.bg, border: '1px solid ' + section.border }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: section.accent, fontWeight: 700 }}>{section.icon}</span>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', fontWeight: 700, color: section.accent, letterSpacing: '0.1em' }}>{section.label}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#C9D1D9', lineHeight: 1.65, margin: 0 }}>{section.text}</p>
                  </div>
                ))}

                {/* Navigation between nodes */}
                <div style={{ marginTop: '20px', borderTop: '1px solid #21262D', paddingTop: '16px' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', color: '#6B7280', marginBottom: '10px', letterSpacing: '0.08em' }}>OTHER CONTRADICTIONS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                    {cd.nodes.filter(n => n.id !== selected.id).map(n => {
                      const c = SEV_COLOR[n.sev]
                      return (
                        <button key={n.id} onClick={() => setSelectedId(n.id)}
                          style={{ padding: '4px 10px', borderRadius: '20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: c, border: '1px solid ' + c + '55' }}>
                          {n.l1} {n.l2}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setChatOpen(o => !o)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: chatOpen ? 'rgba(77,163,255,0.2)' : 'rgba(77,163,255,0.1)', color: '#4DA3FF', fontSize: '12px', fontWeight: 600, textAlign: 'center' as const, border: '1px solid rgba(77,163,255,0.25)', cursor: 'pointer' }}
                  >
                    {chatOpen ? '× Close chat' : 'Ask AbarVa about this →'}
                  </button>
                  <a href={'/blueprint?client=' + selectedClient} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(45,212,200,0.1)', color: '#2DD4C8', textDecoration: 'none', fontSize: '12px', fontWeight: 600, textAlign: 'center' as const, border: '1px solid rgba(45,212,200,0.25)' }}>
                    Solution Blueprint →
                  </a>
                </div>
                {chatOpen && (
                  <ContradictionChat
                    client={selectedClient}
                    contradictionTitle={selected.title}
                    contradictionImpact={selected.impact}
                  />
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default function ContradictionsPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>
        Loading contradiction network...
      </div>
    }>
      <ContradictionsContent />
    </Suspense>
  )
}
