'use client'
import { Suspense, useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'

type Sev = 'green' | 'red' | 'amber' | 'gray'
interface TEvent {
  year: number
  sev: Sev
  title: string
  body: string
  impact: string
  future?: true
  now?: true
}

const C: Record<Sev, { accent: string; bg: string; border: string; label: string }> = {
  green: { accent: '#059669', bg: '#F0FDF4', border: '#BBF7D0', label: 'INFLECTION' },
  red:   { accent: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'CRISIS DECISION' },
  amber: { accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'CAUTIONARY' },
  gray:  { accent: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', label: 'CONTEXT' },
}

const MERIDIAN: TEvent[] = [
  {
    year: 2018, sev: 'gray',
    title: 'Epic EHR Go-Live — 21 Hospitals',
    body: '$180M implementation. Epic 2018 deployed across the main hospital network. Cogito analytics suite included in the license — never configured.',
    impact: 'Foundation for all clinical AI. But Cogito sat unused from day one — seven years of analytics capability, idle.',
  },
  {
    year: 2019, sev: 'amber',
    title: 'Ensemble RCM Contract Signed — $48M/Year',
    body: 'Outsourced revenue cycle management to Ensemble Health Partners. Contract included a 12% denial rate SLA and 95% uptime guarantee. Penalty clause: $2M per quarter for sustained breach.',
    impact: 'Penalty clause was never enforced. Denial rate climbed to 18.2% over five years. $8M in contractual penalties accumulated — uncollected.',
  },
  {
    year: 2020, sev: 'gray',
    title: 'COVID-19 — All Transformation Paused',
    body: 'Capital freeze. IT projects paused. Travel nurses engaged at emergency rates. 756 travel nurses at peak — costs that never fully unwound.',
    impact: 'Travel nurse dependency became structural. $142M annual cost by 2023, locked in through multi-year staffing agreements.',
  },
  {
    year: 2021, sev: 'red',
    title: 'Blue Ridge Health Network Merger — $2.1B',
    body: 'Acquired Blue Ridge Health Network — 2 hospitals on Cerner Millennium 2019. Integration plan: 18 months. Budget: $48M. CDO hired specifically to lead the integration.',
    impact: 'Integration is still incomplete in 2026 — 8 months overdue. 424 interfaces undocumented. The CDO who led this has resigned.',
  },
  {
    year: 2022, sev: 'amber',
    title: 'Azure Synapse Contract — $3.2M',
    body: 'Signed Azure enterprise agreement. Azure Synapse selected as the data foundation for all AI initiatives. Implementation started Q3 2022.',
    impact: 'Stalled at 40% in October 2024. $1.8M spent. No completion plan. Every AI initiative blocked downstream.',
  },
  {
    year: 2022, sev: 'red',
    title: 'CDO Resignation',
    body: 'CDO who led the Blue Ridge integration resigned after 14 months. Role left vacant. The prior CIO assumed both roles — a team built for one person carrying scope for two.',
    impact: 'Started a pattern of CDO instability. The role has been vacant for 8+ of the last 24 months.',
  },
  {
    year: 2023, sev: 'red',
    title: '6 AI Pilots Launched — None Scaled',
    body: 'Board approved AI strategy. Six pilots launched: sepsis early warning (2 hospitals), clinical documentation AI, denial prediction, patient scheduling, prior auth automation, nurse scheduling.',
    impact: 'All 6 entered pilot purgatory. Sepsis model validated at 31% mortality reduction — stuck for 18 months. Root cause: no MLOps pipeline, no CDO to own deployment.',
  },
  {
    year: 2023, sev: 'amber',
    title: 'CMS Prior Auth Rule Published',
    body: 'CMS published the Interoperability and Prior Authorization Final Rule. Deadline: January 1, 2026. Requires 100% electronic prior auth connections across all payers.',
    impact: 'Ensemble notified. No action taken. Three years later: still at 23% connection rate with 8 months remaining to deadline.',
  },
  {
    year: 2024, sev: 'red',
    title: 'Marcus Webb Hired as CIO — Inherited the Mess',
    body: 'Previous CIO departed. Marcus Webb hired from Atrium Health — strong Epic background. Inherited: incomplete Blue Ridge migration, stalled Synapse, 6 failed pilots, CDO vacancy, Ensemble SLA failures.',
    impact: '"I inherited a mess. 23 hospitals operating like 23 different companies." Board giving him 12 months to show AI progress.',
  },
  {
    year: 2024, sev: 'red',
    title: 'CDO Vacant Again — 8 Months and Counting',
    body: 'CDO role re-posted after second departure. Search stalled. Marcus Webb carrying CIO and CDO scope with a team built for one. Every week of vacancy has a quantifiable cost.',
    impact: '6 AI initiatives blocked. $5.6M in value lost per week of vacancy. Every initiative requires a CDO to own data strategy and deployment.',
  },
  {
    year: 2025, sev: 'amber',
    title: 'Azure Synapse Stalls — October 2025',
    body: 'Azure Synapse implementation halted at 40% complete. Budget consumed: $1.8M of $3.2M. Reason: no CDO to own data strategy, IT team pulled to Blue Ridge migration support.',
    impact: 'All AI models require Synapse as foundation. Stall blocks $292M in identified AI value. No completion timeline currently exists.',
  },
  {
    year: 2026, sev: 'red', now: true,
    title: 'CMS Deadline — 8 Months Away',
    body: 'January 1, 2026 deadline for 100% electronic prior auth. Current state: 23% deployed. Penalty exposure: $1M per day at full non-compliance. Ensemble has not accelerated.',
    impact: 'The most time-sensitive decision in this engagement. Cohere Health can close the gap in 6 months if contracted this week.',
  },
  {
    year: 2026, sev: 'green', future: true,
    title: 'The Inflection Point — If AbarVa Recommendations Are Followed',
    body: 'CDO hired within 60 days. Ensemble penalties enforced — $8M recovered and applied to Synapse completion. Cohere Health contracted for prior auth automation. MLOps pipeline built in 90 days. Sepsis AI scaled to 23 hospitals.',
    impact: '$292M annual value realized. 4.0% margin target achieved. Board AI commitment delivered. CMS compliance by January 2026 deadline met.',
  },
]

const ARCTURUS: TEvent[] = [
  {
    year: 2010, sev: 'gray',
    title: 'Bloomberg AIM Terminal Deployed — Core Data Hub',
    body: 'Bloomberg AIM (Asset and Investment Manager) deployed as the central portfolio data system. Connected to trading, risk, and compliance workflows. Became the single source of truth for AUM data across $4.2B portfolio.',
    impact: 'Now 16 years old. The Bloomberg API is legacy — batch-only, no real-time capability. Every AI initiative that needs live portfolio data is blocked until this is modernized.',
  },
  {
    year: 2012, sev: 'gray',
    title: 'Advent Geneva Deployed — Portfolio Accounting',
    body: 'Advent Geneva implemented for portfolio accounting, NAV calculation, and investor reporting. Replaced a spreadsheet-based system. Perceived as a modernization at the time.',
    impact: 'Now 14 years old. 3-day batch processing cycle creates irreducible lag in all reporting. AI-powered real-time client reporting ($11M invested) is impossible until Geneva is replaced or modernized.',
  },
  {
    year: 2018, sev: 'amber',
    title: 'Salesforce FSC Deployed — $14M/yr Contract',
    body: 'Salesforce Financial Services Cloud deployed as the advisor CRM and client portal. Einstein AI capabilities included in the enterprise license — advisor productivity, churn signals, client 360.',
    impact: 'Einstein has never been activated. FSC adoption is at 44% — 56% of advisors use workarounds. The SSO integration bug (Q2 2023) was never fixed, blocking all remaining adoption.',
  },
  {
    year: 2019, sev: 'red',
    title: 'CDO Appointed — Resigned After 8 Months — Role Never Backfilled',
    body: 'Chief Data Officer hired to address data governance concerns from the MAS FEAT pre-assessment. Role funded at $400K base. CDO resigned citing lack of mandate and C-suite support. Board decided to defer the backfill.',
    impact: '14 data silos now operate with no governance authority. No golden record across Bloomberg, Aladdin, FSC, Geneva, Charles River, and Workday. CDO vacancy is the root cause blocking $94M in AI value.',
  },
  {
    year: 2021, sev: 'amber',
    title: '$94M AI Strategy Approved — 28 Initiatives — 3-Year Roadmap',
    body: 'Board approved comprehensive AI strategy: $94M across 28 initiatives over 3 years. Initiatives span advisor AI, credit risk, client reporting, and ESG compliance. Celebrated as a bold commitment to AI-led differentiation.',
    impact: '4 years on: $0 documented ROI. Every initiative that requires data integration or model deployment is blocked by the same 4 root causes that existed before the strategy was approved.',
  },
  {
    year: 2021, sev: 'red',
    title: 'CRO Model Freeze Imposed — Risk Committee Concern',
    body: 'After a credit risk model produced a false positive that nearly triggered a $340M hedge, the CRO imposed a freeze on all AI model updates. Risk committee ruling: no model can go live without a formal validation framework.',
    impact: 'No validation framework was ever built. Freeze is now in its 4th year. Credit Risk AI ($34M invested), Portfolio Risk AI, and 2 other initiatives cannot go live until the freeze is lifted.',
  },
  {
    year: 2022, sev: 'amber',
    title: 'Charles River IMS Deployed — Disconnected From Everything',
    body: 'Charles River Investment Management System deployed for order management and compliance. $8M implementation. Positioned as the bridge between Bloomberg AIM and trading.',
    impact: 'No API integration with Bloomberg AIM or Advent Geneva was completed. Charles River operates as a 15th data silo. $8M investment produces no data value — it is a standalone compliance system.',
  },
  {
    year: 2023, sev: 'red',
    title: 'MAS FEAT Assessment — Model Governance Gaps Identified',
    body: 'Monetary Authority of Singapore FEAT (Fairness, Ethics, Accountability, Transparency) assessment. Result: significant model governance gaps. AI initiatives must meet FEAT principles before deployment.',
    impact: 'FEAT gaps compound the CRO freeze. Even if the CRO lifted the freeze, the MAS FEAT deficiencies would prevent live deployment in Singapore-regulated entities — 60% of AUM.',
  },
  {
    year: 2024, sev: 'red',
    title: 'Board AI ROI Review — $94M Invested · $0 Documented Return',
    body: 'Quarterly board review of AI portfolio. For the first time, the board requested a direct ROI mapping. Internal analysis: $94M invested across 28 initiatives. Documented annual value: $0. 6 initiatives live but underperforming.',
    impact: 'Board mandated an independent assessment within 90 days. Arcturus engaged AbarVa. Root cause analysis identified 4 structural blockers — none of which were technology problems.',
  },
  {
    year: 2025, sev: 'red',
    title: 'Salesforce Einstein SSO Bug — 18 Months Unresolved',
    body: 'The FSC SSO integration bug blocking 56% of advisors from the system was first reported Q2 2023. Salesforce professional services scoped a 6-week fix. Fix was deprioritized three times due to internal resource constraints.',
    impact: 'Einstein AI — advisor productivity, churn signals, client 360 — cannot be activated until adoption reaches 85%+. $65M in committed AI value is blocked by an unscheduled 6-week fix.',
  },
  {
    year: 2026, sev: 'green', future: true,
    title: 'The Inflection Point — AbarVa Wave 1 + Wave 2 Complete',
    body: 'CDO appointed with full C-suite mandate. Golden record deployed across all 6 systems. CRO model validation framework established — freeze lifted. FSC SSO fixed, Einstein activated. Bloomberg API modernized to real-time.',
    impact: '$292M annual value unlocked. 4 AI initiatives live and delivering: Advisor AI ($29M), Real-time Reporting ($18M), Credit Risk AI ($34M), FSC AI ($11M). Arcturus AI ROI positive for the first time.',
  },
]

const APEX: TEvent[] = [
  {
    year: 2010, sev: 'gray',
    title: 'SAP ECC 6.0 Deployed',
    body: '14 years of SAP ECC 6.0 in production. Extensive customization layer built over time. Standard industry platform at the time of deployment.',
    impact: '14 years of custom code makes S/4HANA migration significantly more complex than standard. Support ends 2027 — board decision needed in 2024, still not made.',
  },
  {
    year: 2015, sev: 'amber',
    title: 'Salesforce Commerce Cloud Selected',
    body: 'Salesforce Commerce Cloud (SFCC) selected as e-commerce platform. Einstein AI personalization module included in the enterprise license.',
    impact: 'SFCC is in production. Einstein personalization — the highest-value component in the license — has never been activated. $248M in annual revenue opportunity sits idle.',
  },
  {
    year: 2019, sev: 'red',
    title: 'Amazon Captures 28% of Apex\'s Categories',
    body: 'Internal category analysis: Amazon captured 28% of Apex\'s addressable market over 4 years. Board authorized a loyalty program as the primary competitive response.',
    impact: '18M loyalty members enrolled. Only 42% active vs 68% benchmark. A symptom treatment. The underlying margin, inventory, and personalization problems remain.',
  },
  {
    year: 2020, sev: 'amber',
    title: 'o9 Demand Planning Selected — 40% Implemented Today',
    body: 'o9 Solutions selected as AI-powered demand planning platform. Implementation started Q1 2020. Project stalled in 2022 following supply chain leadership change.',
    impact: 'Still at 40% implementation in 2026. Inventory accuracy remains 84% vs 98% target. Omnichannel fulfillment functionally impossible without completing this.',
  },
  {
    year: 2021, sev: 'red',
    title: 'Salesforce Einstein Purchased — Never Activated',
    body: 'Einstein personalization module explicitly purchased in SFCC enterprise license renewal. Activation project scoped, kicked off, stalled within 6 months — team bandwidth cited, Segment CDP integration incomplete.',
    impact: 'Einstein has sat unactivated for 4 years. 72% cart abandonment rate vs 54% industry average. $248M in incremental annual revenue blocked by non-activation.',
  },
  {
    year: 2022, sev: 'amber',
    title: 'Segment CDP Deployed — Profile Fragmentation Unresolved',
    body: 'Twilio Segment deployed as Customer Data Platform. Goal: unified 360° customer view. Profile deduplication and identity resolution scoped as phase 2 — never funded.',
    impact: '50% of customer profiles remain fragmented in 2026. Einstein activation blocked — it requires a clean Segment profile as input.',
  },
  {
    year: 2023, sev: 'red',
    title: 'SAP ECC Support End Announced — Board Decision Missed',
    body: 'SAP confirmed ECC 6.0 maintenance ends January 2027. Internal team recommended board approval by Q3 2024 to begin migration with sufficient runway. Decision deferred by CEO.',
    impact: 'Decision still not made in 2026. Every month of delay compresses the migration timeline with the same complexity and less runway.',
  },
  {
    year: 2024, sev: 'red',
    title: 'IBM Sterling OMS — 3 Versions Behind — Overselling 3x/Month',
    body: 'IBM Sterling Order Management audit: 3 major versions behind current release. Upgrade scoped at $4.2M. Budget not approved. Overselling events occurring 3 times per month during peak periods.',
    impact: '$2.8M annual customer service cost from overselling events. Upgrade ROI payback is 8 months. Budget remains unapproved.',
  },
  {
    year: 2024, sev: 'amber',
    title: 'Databricks Deployed — Only 3 Models in Production',
    body: 'Databricks deployed as unified analytics and AI platform. Business stakeholders identified 18 high-value use cases across demand, pricing, and loyalty.',
    impact: 'Only 3 models in production 18 months later. 15 use cases blocked in development. Root cause: no model governance, no deployment accountability owner.',
  },
  {
    year: 2025, sev: 'red',
    title: 'UFLPA Enforcement — 48% China Sourcing — 12 High-Risk Suppliers',
    body: 'Uyghur Forced Labor Prevention Act enforcement escalated. CBP audit identified 12 Apex suppliers on the UFLPA Entity List. 48% of Apex sourcing from China. Goods held at port.',
    impact: '$18M inventory at risk. 6-month program required to qualify alternative suppliers. Supply chain mapping capability needed immediately.',
  },
  {
    year: 2026, sev: 'green', future: true,
    title: 'The Inflection Point — If AbarVa Recommendations Are Followed',
    body: 'Einstein personalization activated using clean Segment profiles — 6-week implementation. o9 demand planning completed — inventory accuracy to 98%. SAP S/4HANA migration plan approved. IBM Sterling upgraded. UFLPA sourcing map complete.',
    impact: '$840M cart abandonment opportunity addressed. Inventory turnover moves from 4.2x toward 6.8x benchmark. Operating margin pathway to 6% target established.',
  },
]

const DATA: Record<string, TEvent[]> = { meridian: MERIDIAN, arcturus: ARCTURUS, apexretail: APEX }
const META: Record<string, { title: string; sub: string }> = {
  meridian:   { title: 'How Meridian Got Here',   sub: 'Every major technology and organizational decision since 2018 — and what it cost' },
  arcturus:   { title: 'How Arcturus Got Here',   sub: 'Every major technology and strategic decision since 2010 — and what it cost' },
  apexretail: { title: 'How Apex Retail Got Here', sub: 'Every major technology and operational decision since 2010 — and what it cost' },
}

const CLIENTS = [
  { id: 'meridian',   label: 'Meridian' },
  { id: 'arcturus',   label: 'Arcturus' },
  { id: 'apexretail', label: 'Apex Retail' },
]

function Card({ ev }: { ev: TEvent }) {
  const c = C[ev.sev]
  return (
    <div style={{
      background: ev.future ? '#F0FDF4' : '#FFFFFF',
      border: '1px solid ' + c.border,
      borderLeft: '4px solid ' + c.accent,
      borderRadius: '10px',
      padding: '18px 20px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: c.accent, fontFamily: "'IBM Plex Mono', monospace" }}>
          {ev.future ? 'WHAT COULD HAPPEN' : ev.now ? 'NOW — ACTIVE' : c.label}
        </span>
        {ev.now && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#DC2626', color: 'white' }}>URGENT</span>}
        {ev.future && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#059669', color: 'white' }}>↗ INFLECTION</span>}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', lineHeight: 1.35, marginBottom: '10px' }}>
        {ev.title}
      </div>
      <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.7, marginBottom: '12px' }}>
        {ev.body}
      </div>
      <div style={{ background: c.bg, borderRadius: '6px', padding: '10px 12px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: c.accent, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>→ Impact</div>
        <div style={{ fontSize: '11px', color: '#374151', lineHeight: 1.6 }}>{ev.impact}</div>
      </div>
    </div>
  )
}

function TimelineContent() {
  const { clientId: ctxClientId, allowedClients, isAdmin } = useClientContext()
  const [clientId, setClientId] = useState(ctxClientId)

  const visibleClients = CLIENTS.filter(c => allowedClients.find(a => a.id === c.id))

  const events = DATA[clientId] || MERIDIAN
  const meta = META[clientId] || META.meridian
  const crisisCount = events.filter(e => e.sev === 'red').length

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'IBM Plex Sans', Inter, -apple-system, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');" }} />
      <AbarvaNav activePage="timeline" />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em' }}>
              {crisisCount} decisions creating crisis conditions in 2026
            </span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {meta.title} — <span style={{ color: '#475569', fontWeight: 400 }}>The Decision Timeline</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.6, maxWidth: '640px' }}>
            {meta.sub}
          </p>
        </div>

        {/* Client tabs — admin only */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '48px' }}>
          {isAdmin && visibleClients.map(cl => (
            <button key={cl.id} onClick={() => setClientId(cl.id)}
              style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', border: 'none',
                background: clientId === cl.id ? '#0F172A' : '#FFFFFF',
                color: clientId === cl.id ? '#FFFFFF' : '#475569',
                boxShadow: clientId === cl.id ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'all 0.15s',
              }}>
              {cl.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' as const }}>
          {([
            { sev: 'red' as Sev, label: 'Crisis decision' },
            { sev: 'amber' as Sev, label: 'Good intent, went wrong' },
            { sev: 'green' as Sev, label: 'Inflection point' },
            { sev: 'gray' as Sev, label: 'Context' },
          ]).map(l => (
            <div key={l.sev} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: C[l.sev].accent, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#64748B' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          {/* Vertical spine */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 0, bottom: 0,
            width: '3px',
            background: 'linear-gradient(to bottom, transparent 0px, #1E293B 32px, #1E293B calc(100% - 32px), transparent 100%)',
            borderRadius: '2px',
          }} />

          {/* Events */}
          {events.map((ev, i) => {
            const isLeft = i % 2 === 0
            const c = C[ev.sev]
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', marginBottom: '24px', alignItems: 'start' }}>

                {/* Left slot */}
                <div style={{ paddingRight: '28px', paddingTop: '28px' }}>
                  {isLeft && <Card ev={ev} />}
                </div>

                {/* Center: dot + year */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '28px', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: c.accent,
                    border: '4px solid #F8FAFC',
                    boxShadow: `0 0 0 2px ${c.accent}`,
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px', fontWeight: 700,
                    color: '#0F172A', marginTop: '8px',
                    letterSpacing: '0.05em', lineHeight: 1,
                    textAlign: 'center' as const,
                  }}>{ev.year}</div>
                </div>

                {/* Right slot */}
                <div style={{ paddingLeft: '28px', paddingTop: '28px' }}>
                  {!isLeft && <Card ev={ev} />}
                </div>
              </div>
            )
          })}
        </div>

        {/* The Pattern */}
        <div style={{
          background: '#111827',
          borderRadius: '16px',
          padding: '48px 52px',
          marginTop: '64px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(to right, #2DD4C8, #4DA3FF, #6EE7B7)',
          }} />
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '16px', fontFamily: "'IBM Plex Mono', monospace" }}>
            The Pattern
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#E6EDF3', lineHeight: 1.5, marginBottom: '32px', maxWidth: '640px' }}>
            Three different companies. Three different industries. The same pattern.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '36px' }}>
            {[
              { line: 'Good decisions made.', sub: 'Implementation left incomplete.' },
              { line: 'Vendors signed.', sub: 'SLAs never enforced.' },
              { line: 'Technology purchased.', sub: 'Never activated.' },
              { line: 'Pilots succeeded.', sub: 'Never scaled.' },
              { line: 'Leadership gaps.', sub: 'No accountability owner.' },
            ].map((p, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px 14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#E6EDF3', marginBottom: '6px', lineHeight: 1.4 }}>{p.line}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.5 }}>{p.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '28px' }}>
            <div style={{ fontSize: '14px', color: '#8B949E', lineHeight: 1.8, marginBottom: '16px', maxWidth: '680px' }}>
              This is not bad strategy. This is the execution gap that consulting firms profit from — and never fix.
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#2DD4C8', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.01em' }}>
              AbarVa was built to close it.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading...</div>}>
      <TimelineContent />
    </Suspense>
  )
}
