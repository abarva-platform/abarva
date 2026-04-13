import AbarvaNav from '@/components/AbarvaNav'
import { notFound } from 'next/navigation'

const T = {
  bg: '#0D1117', surface: '#161B22', surface2: '#1C2128',
  border: '#21262D', border2: '#30363D',
  text: '#E6EDF3', text2: '#C9D1D9', text3: '#8B949E',
  teal: '#2DD4C8', blue: '#4DA3FF', amber: '#F59E0B', red: '#EF4444', green: '#6EE7B7',
}

type Solution = {
  code: string
  name: string
  vertical: string
  objective: string
  color: string
  problem: string
  problemContext: string
  findings: Array<{ stat: string; detail: string; severity: 'critical' | 'warning' | 'info' }>
  products: Array<{ name: string; href: string }>
  dataRequired: string[]
  outcomeMetric: string
  timeToInsight: string
  timeToOutcome: string
  client: string
  entryHref: string
}

const SOLUTIONS: Record<string, Solution> = {
  'revenue-cycle-intelligence': {
    code: 'HP-01',
    name: 'Revenue Cycle Intelligence',
    vertical: 'Healthcare',
    objective: 'Optimise',
    color: T.teal,
    problem: 'Your denial rate is costing you more than you report to the board.',
    problemContext: 'Most health systems track denial rates by payer — but few track the true write-off. The gap between reported collection rates and actual claims data can exceed $30M annually. Leadership is presenting the wrong number to the board, and the RCM vendor is not penalized for the delta.',
    findings: [
      { stat: '6.8pp above benchmark', detail: 'Denial rate 18.2% vs 11.4% peer median — $31M annual gap at Meridian scale', severity: 'critical' },
      { stat: '38% of denials', detail: 'Prior authorization — fixable in 90 days with AI automation (Cohere Health, 94/100)', severity: 'critical' },
      { stat: '$31M gap', detail: 'Leadership reports 94.2% collection to board. Claims data shows 87.1%. Revenue miscounted.', severity: 'critical' },
      { stat: '$8M unclaimed', detail: '3 RCM vendors missing SLA thresholds — $8M in SLA credits enforceable now', severity: 'warning' },
    ],
    products: [
      { name: 'Situation Intelligence', href: '/diagnose' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy' },
      { name: 'Business Case Intelligence', href: '/justify' },
      { name: 'Vendor Intelligence', href: '/select' },
      { name: 'Outcome Intelligence', href: '/control-tower' },
    ],
    dataRequired: ['Claims data (24 months)', 'Denial codes by payer', 'Prior auth logs', 'Payer contracts with SLA clauses', 'Epic extract (AR aging)', 'RCM vendor performance reports'],
    outcomeMetric: 'Denial rate reduction × revenue recovered vs baseline',
    timeToInsight: '48 hours',
    timeToOutcome: '90–180 days',
    client: 'meridian',
    entryHref: '/diagnose?client=meridian&solution=HP-01',
  },
  'patient-access-growth': {
    code: 'HP-02',
    name: 'Patient Access & Growth',
    vertical: 'Healthcare',
    objective: 'Grow',
    color: T.teal,
    problem: 'Your referral leakage is invisible until patients leave the network.',
    problemContext: 'Referral leakage — patients referred out of network — is the silent revenue drain in every health system. The CIO sees an Epic utilization number. The CMO sees press-ganey scores. Nobody sees the downstream revenue that walked out the door last quarter.',
    findings: [
      { stat: '34% MyChart adoption', detail: 'Meridian at 34% vs 60% target — patient portal non-adoption is the leading indicator of referral leakage', severity: 'critical' },
      { stat: '3.5 stars', detail: 'Medicare Advantage at 3.5 — below 4.0 CMS threshold. Every 0.1-star improvement = $4M in bonus payments', severity: 'critical' },
      { stat: '23 hospitals', detail: 'Operating as 23 separate entities — no unified patient record across network, blocking care coordination AI', severity: 'warning' },
      { stat: '12 Cogito dashboards', detail: 'Only 12 of 47 Cogito analytics dashboards live — physician access intelligence not activated', severity: 'warning' },
    ],
    products: [
      { name: 'Situation Intelligence', href: '/diagnose' },
      { name: 'Workforce Intelligence', href: '/future-of-work' },
      { name: 'Data Estate Intelligence', href: '/analytics-modernization' },
      { name: 'Outcome Intelligence', href: '/control-tower' },
    ],
    dataRequired: ['Patient access metrics (Epic)', 'Referral leakage reports', 'MyChart adoption data', 'Medicare Advantage Stars data', 'Network coverage map', 'Competitor proximity data'],
    outcomeMetric: 'Net new patients captured × average revenue per patient',
    timeToInsight: '48 hours',
    timeToOutcome: '120–240 days',
    client: 'meridian',
    entryHref: '/diagnose?client=meridian&solution=HP-02',
  },
  'ai-portfolio-accountability': {
    code: 'BK-01',
    name: 'AI Portfolio Accountability',
    vertical: 'Financial Services',
    objective: 'Protect',
    color: T.blue,
    problem: 'You are spending on AI. Do you know if it is working?',
    problemContext: 'Most financial institutions now have 20–40 active AI initiatives. Almost none have a baseline. Without a baseline, there is no outcome. Without an outcome, every AI investment is a cost center, not a value driver. The board is asking the right question — the platform has not been tracking the answer.',
    findings: [
      { stat: '28 AI initiatives', detail: 'First Capital has 28 active AI initiatives — $0 in tracked outcomes. No baseline established for any of them', severity: 'critical' },
      { stat: '78% false positive rate', detail: 'AML system generating 78% false positives vs 42% peer benchmark — $7M annual excess cost', severity: 'critical' },
      { stat: '$168M IT budget', detail: '0.93% of assets — below peer median of 1.2%. Underinvestment while competitors deploy AI at scale', severity: 'warning' },
      { stat: 'CDO reports to CRO', detail: 'Data governance misaligned with AI ambition — structural blocker to AI velocity', severity: 'warning' },
    ],
    products: [
      { name: 'Outcome Intelligence', href: '/control-tower' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy' },
      { name: 'Business Case Intelligence', href: '/justify' },
      { name: 'Delivery Intelligence', href: '/ai-pdlc' },
    ],
    dataRequired: ['AI initiative inventory', 'Baseline metrics per initiative', 'IT spend by category', 'Vendor performance data', 'Model accuracy logs', 'Business outcome tracking'],
    outcomeMetric: 'Verified savings per AI initiative vs baseline cost',
    timeToInsight: '48 hours',
    timeToOutcome: '90–180 days',
    client: 'firstcapital',
    entryHref: '/control-tower?client=firstcapital&solution=BK-01',
  },
  'customer-revenue-intelligence': {
    code: 'BK-02',
    name: 'Customer Revenue Intelligence',
    vertical: 'Financial Services',
    objective: 'Grow',
    color: T.blue,
    problem: 'Digital adoption at 41% while peers are at 67%.',
    problemContext: 'Digital adoption is a leading indicator of customer lifetime value, cross-sell rates, and churn. First Capital has 1.8 million customers seeing yesterday\'s balances on a mobile app rated 3.2/5.0. Every percentage point of adoption gap is a pipeline of customers who will move to a digital-first competitor.',
    findings: [
      { stat: '41% digital adoption', detail: 'vs 67% peer benchmark — $180M commercial deposits at risk of migration in the next 24 months', severity: 'critical' },
      { stat: '3.2/5.0 app rating', detail: 'Mobile app rating 3.2 vs 4.1 peer benchmark — root cause: real-time data not live (FedNow blocked)', severity: 'critical' },
      { stat: 'FedNow not live', detail: '67% of peer banks now live on FedNow. First Capital: implementation blocked by FIS HORIZON data model', severity: 'critical' },
      { stat: '$99M efficiency gap', detail: 'Cost-to-income 68% vs 55% target — digital channel shift is the primary lever', severity: 'warning' },
    ],
    products: [
      { name: 'Situation Intelligence', href: '/diagnose' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy' },
      { name: 'Vendor Intelligence', href: '/select' },
      { name: 'Business Case Intelligence', href: '/justify' },
    ],
    dataRequired: ['Digital channel analytics', 'Mobile app ratings and reviews', 'Customer LTV by segment', 'FedNow readiness assessment', 'FIS HORIZON config', 'Churn indicators by cohort'],
    outcomeMetric: 'Digital adoption increase × revenue per digital customer vs non-digital',
    timeToInsight: '48 hours',
    timeToOutcome: '90–180 days',
    client: 'firstcapital',
    entryHref: '/diagnose?client=firstcapital&solution=BK-02',
  },
  'supply-chain-ai': {
    code: 'RT-01',
    name: 'Supply Chain AI Rationalization',
    vertical: 'Retail',
    objective: 'Optimise',
    color: T.amber,
    problem: 'You have 14 supply chain tools. 6 are redundant.',
    problemContext: 'Retail supply chains have been automated with overlapping tools across four acquisition cycles. The result is a $38M annual shadow IT spend that the CTO cannot account for, a demand forecasting system that contradicts the procurement system, and AI vendors charging for capabilities the organization already owns elsewhere.',
    findings: [
      { stat: '14 supply chain tools', detail: '6 are redundant with existing capabilities — $14–22M in recoverable annual license spend', severity: 'critical' },
      { stat: '62% forecast accuracy', detail: 'o9 demand forecasting at 62% vs 84% benchmark — system is 40% implemented. Activation beats replacement.', severity: 'critical' },
      { stat: '$38M shadow IT', detail: 'Untracked SaaS spend — 43% of which duplicates licensed capabilities in SAP or Salesforce', severity: 'warning' },
      { stat: '4.2x inventory turns', detail: 'vs 6.8x benchmark — $180M excess inventory annually. Root cause: demand forecasting accuracy gap', severity: 'warning' },
    ],
    products: [
      { name: 'Procurement Intelligence', href: '/marketplace' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy' },
      { name: 'Business Case Intelligence', href: '/justify' },
      { name: 'Delivery Intelligence', href: '/ai-pdlc' },
    ],
    dataRequired: ['Current vendor contracts (all supply chain tools)', 'SaaS spend inventory', 'o9 implementation status', 'Demand forecast accuracy logs', 'Inventory aging report', 'IT license utilization data'],
    outcomeMetric: 'Vendor consolidation savings + inventory reduction vs baseline',
    timeToInsight: '48 hours',
    timeToOutcome: '60–120 days',
    client: 'apexretail',
    entryHref: '/ai-pdlc?client=apexretail&solution=RT-01',
  },
  'customer-intelligence': {
    code: 'RT-02',
    name: 'Customer Intelligence',
    vertical: 'Retail',
    objective: 'Grow',
    color: T.amber,
    problem: 'Conversion at 2.3% while category peers are at 3.8%.',
    problemContext: 'Apex Retail has 18 million loyalty members, a licensed Salesforce Einstein personalization engine, and a built-and-validated churn prediction model. None of it is deployed. The AI is paid for and idle. Every month of delay is measurable revenue that did not happen.',
    findings: [
      { stat: 'Einstein idle', detail: 'Salesforce Einstein licensed, paid, and not activated. Personalization revenue opportunity: $248M annually', severity: 'critical' },
      { stat: '2.3% conversion', detail: 'vs 3.8% benchmark — 1.5pp gap at Apex scale = $180M annual revenue delta', severity: 'critical' },
      { stat: '69% cart abandonment', detail: 'vs 58% benchmark — personalization activation alone recovers 8–12pp of abandonment', severity: 'critical' },
      { stat: 'Churn model built, not deployed', detail: '340K duplicate customer profiles are the only technical blocker — fixable in 30 days', severity: 'warning' },
    ],
    products: [
      { name: 'Situation Intelligence', href: '/diagnose' },
      { name: 'AI Investment Intelligence', href: '/ai-strategy' },
      { name: 'Vendor Intelligence', href: '/select' },
      { name: 'Outcome Intelligence', href: '/control-tower' },
    ],
    dataRequired: ['Salesforce Einstein config', 'Customer loyalty data (18M members)', 'Conversion funnel analytics', 'Cart abandonment logs', 'Churn model validation data', 'Customer duplicate profile report'],
    outcomeMetric: 'Conversion rate increase + loyalty revenue vs pre-personalization baseline',
    timeToInsight: '48 hours',
    timeToOutcome: '60–120 days',
    client: 'apexretail',
    entryHref: '/diagnose?client=apexretail&solution=RT-02',
  },
}

export function generateStaticParams() {
  return Object.keys(SOLUTIONS).map(slug => ({ slug }))
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = SOLUTIONS[slug]
  if (!s) notFound()

  const severityColor = { critical: T.red, warning: T.amber, info: T.teal }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'DM Sans, Inter, -apple-system, sans-serif' }}>
      <AbarvaNav clientId={s.client} />

      {/* Section 1 — The Problem */}
      <div style={{ borderBottom: '1px solid ' + T.border, padding: '56px 0 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: s.color }}>{s.code}</span>
            <span style={{ padding: '3px 9px', background: s.color + '20', border: '1px solid ' + s.color + '50', borderRadius: '10px', fontSize: '10px', fontWeight: 700, color: s.color }}>
              {s.vertical.toUpperCase()}
            </span>
            <span style={{ padding: '3px 9px', background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '10px', fontSize: '10px', fontWeight: 600, color: T.text3 }}>
              {s.objective.toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 800, color: T.text, lineHeight: 1.15, margin: '0 0 20px', fontFamily: 'Fraunces, Georgia, serif' }}>
            {s.name}
          </h1>
          <p style={{ fontSize: '18px', color: T.text2, lineHeight: 1.65, margin: '0 0 16px', maxWidth: '640px' }}>
            &ldquo;{s.problem}&rdquo;
          </p>
          <p style={{ fontSize: '14px', color: T.text3, lineHeight: 1.7, margin: 0, maxWidth: '600px' }}>
            {s.problemContext}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>

        {/* Section 2 — What AbarVa Finds */}
        <div style={{ padding: '48px 0', borderBottom: '1px solid ' + T.border }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>
            What AbarVa typically surfaces:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '14px' }}>
            {s.findings.map((f, i) => (
              <div key={i} style={{
                padding: '16px 18px', background: T.surface,
                border: `1px solid ${severityColor[f.severity]}30`,
                borderLeft: `4px solid ${severityColor[f.severity]}`,
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: severityColor[f.severity], marginBottom: '6px' }}>{f.stat}</div>
                <div style={{ fontSize: '13px', color: T.text2, lineHeight: 1.55 }}>{f.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 — Products Activated */}
        <div style={{ padding: '48px 0', borderBottom: '1px solid ' + T.border }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>
            The Intelligence products that run on this solution:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {s.products.map(p => (
              <a key={p.name} href={`${p.href}?client=${s.client}&solution=${s.code}`} style={{
                padding: '8px 16px', background: T.surface,
                border: `1px solid ${s.color}50`, borderRadius: '8px',
                fontSize: '13px', fontWeight: 600, color: s.color, textDecoration: 'none',
                transition: 'all 150ms',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = s.color + '15' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.surface }}
              >
                {p.name} →
              </a>
            ))}
          </div>
        </div>

        {/* Section 4 — Data Required */}
        <div style={{ padding: '48px 0', borderBottom: '1px solid ' + T.border }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>
            What the Maestro loads in Phase 1:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
            {s.dataRequired.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', background: T.surface2, borderRadius: '8px', border: '1px solid ' + T.border }}>
                <span style={{ color: T.teal, flexShrink: 0, fontSize: '12px' }}>◈</span>
                <span style={{ fontSize: '13px', color: T.text2 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5 — The Outcome */}
        <div style={{ padding: '48px 0', borderBottom: '1px solid ' + T.border }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>
            The outcome
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div style={{ padding: '16px', background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Outcome metric</div>
              <div style={{ fontSize: '13px', color: T.text2, lineHeight: 1.5 }}>{s.outcomeMetric}</div>
            </div>
            <div style={{ padding: '16px', background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Time to first insight</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.timeToInsight}</div>
            </div>
            <div style={{ padding: '16px', background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Time to verified outcome</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.timeToOutcome}</div>
            </div>
          </div>
        </div>

        {/* Section 6 — Start This Solution */}
        <div style={{ padding: '48px 0 80px' }}>
          <div style={{ padding: '36px', background: T.surface, border: '1px solid ' + s.color + '40', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: T.text3, marginBottom: '8px' }}>Ready to run this solution with your data?</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: T.text, margin: '0 0 24px' }}>
              Start {s.name} →
            </h3>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={s.entryHref} style={{ padding: '14px 32px', background: s.color, color: '#0D1117', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
                Start {s.code}: {s.name} →
              </a>
              <a href="/solutions" style={{ padding: '14px 24px', background: T.surface2, color: T.text3, border: '1px solid ' + T.border2, borderRadius: '10px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                ← All Solutions
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
