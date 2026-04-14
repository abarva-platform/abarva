'use client'
import { useState, useEffect, useRef } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG    = '#060A12'
const CARD  = '#0D1520'
const EDGE  = '#1C2D45'
const TEAL  = '#2DD4C8'
const WHITE = '#EFF6FF'
const MUTED = '#94A3B8'
const DIM   = '#475569'
const MONO  = '"JetBrains Mono", monospace'
const SERIF = 'Georgia, serif'
const SANS  = '"DM Sans", sans-serif'
const RED   = '#EF4444'
const AMBER = '#F59E0B'
const GREEN = '#34D399'

const SECTIONS = [
  { id: 'problem',    label: 'The Problem'         },
  { id: 'platform',  label: 'The Platform'         },
  { id: 'solutions', label: 'Solutions'            },
  { id: 'clients',   label: 'Client Economics'     },
  { id: 'model',     label: 'Revenue Model'        },
  { id: 'moat',      label: 'The Moat'             },
  { id: 'round',     label: 'Seed Round'           },
]

const CLIENTS = [
  {
    id: 'meridian', name: 'Meridian Health System',
    vertical: 'Healthcare · 23 Hospitals', revenue: '$11.2B',
    color: TEAL,
    finding: 'The RCM vendor contract guarantees a 12% denial rate. Actual rate: 18.2%. That is $8M in contractual penalties — never once enforced in three years.',
    wow: '"How did it know about the penalty clause before the first meeting?"',
    platformFee: 850000, outcomeFee: 4200000, consulting: 31000000, savings: 28000000,
    metrics: [
      { label: 'Operating Margin', value: '1.8%',   target: 'Target: 4.0%',              red: true  },
      { label: 'RCM Denial Rate',  value: '18.2%',  target: 'Contract SLA: 12% — $8M gap', red: true  },
      { label: 'AI Pilots Scaled', value: '0 of 6', target: '$42M committed, stalled',   red: true  },
      { label: 'Prior Auth',       value: '23%',    target: 'CMS requires 100% by 2026', red: true  },
      { label: 'Epic Score',       value: '58/100', target: 'Target: 85/100',            red: false },
      { label: 'Travel Nurses',    value: '$48M',   target: 'Benchmark: $28M',           red: true  },
    ],
  },
  {
    id: 'firstcapital', name: 'First Capital Financial',
    vertical: 'Financial Services · Regional Bank', revenue: '$1.84B',
    color: '#6366F1',
    finding: 'Real-time payments infrastructure is not live. 68% of peer institutions are live. Three commercial clients have formally inquired about alternatives in the past 90 days.',
    wow: '"It found the three clients at risk before our relationship managers did."',
    platformFee: 850000, outcomeFee: 2100000, consulting: 18000000, savings: 14000000,
    metrics: [
      { label: 'Digital Adoption',   value: '41%',    target: 'Benchmark: 67%',     red: true  },
      { label: 'FedNow Live',        value: 'No',     target: '68% of peers live',  red: true  },
      { label: 'Core Banking Age',   value: '22 yrs', target: 'Critical: 20yr',     red: true  },
      { label: 'C/I Ratio',         value: '68%',    target: 'Benchmark: 61%',     red: true  },
      { label: 'AML False Positives', value: '78%',  target: 'Benchmark: 25%',     red: true  },
      { label: 'Mobile Rating',      value: '3.2★',  target: 'Switch risk: <3.5',  red: true  },
    ],
  },
  {
    id: 'apexretail', name: 'Apex Retail Group',
    vertical: 'Retail · 1,200 Stores', revenue: '$12.4B',
    color: AMBER,
    finding: 'The personalization engine has been in the existing software license for 14 months. Never activated. $248M annual revenue opportunity. Activation cost: $800K. Time to value: 6 weeks.',
    wow: '"It quantified the cost of inaction. Nobody had ever done that before."',
    platformFee: 850000, outcomeFee: 3100000, consulting: 22000000, savings: 21000000,
    metrics: [
      { label: 'Einstein Activated', value: 'No',    target: '$248M opportunity idle', red: true  },
      { label: 'Operating Margin',   value: '3.8%',  target: 'Target: 6.0%',          red: true  },
      { label: 'Inventory Turns',    value: '4.2x',  target: 'Benchmark: 6.8x',       red: true  },
      { label: 'Cart Abandonment',   value: '72%',   target: 'Benchmark: 58%',        red: true  },
      { label: 'Forecast Accuracy',  value: '62%',   target: 'Benchmark: 84%',        red: false },
      { label: 'Loyalty Active',     value: '42%',   target: 'Benchmark: 68%',        red: true  },
    ],
  },
]

function fmt(n: number) {
  if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K'
  return '$' + n
}

function Eyebrow({ children, color = TEAL }: { children: string; color?: string }) {
  return <div style={{ fontFamily: MONO, fontSize: '10px', color, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>{children}</div>
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: SERIF, fontSize: '38px', fontWeight: 500, color: WHITE, lineHeight: 1.2, marginBottom: '14px' }}>{children}</h2>
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '16px', color: MUTED, lineHeight: 1.75, maxWidth: '580px', marginBottom: '36px' }}>{children}</p>
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: CARD, border: `1px solid ${EDGE}`, borderRadius: '12px', padding: '24px', ...style }}>{children}</div>
}

export default function InvestorPage() {
  const [section, setSection] = useState('problem')
  const [clientIdx, setClientIdx] = useState(0)
  const [counts, setCounts] = useState([0, 0, 0, 0])
  const animated = useRef(false)
  const client = CLIENTS[clientIdx]

  useEffect(() => { document.title = 'AbarVa — Investor Overview · Confidential' }, [])

  useEffect(() => {
    if (animated.current) return
    animated.current = true
    const targets = [800, 500, 8, 20]
    let step = 0
    const timer = setInterval(() => {
      step++
      const p = 1 - Math.pow(1 - step / 60, 3)
      setCounts(targets.map(v => Math.round(v * p)))
      if (step >= 60) clearInterval(timer)
    }, 25)
    return () => clearInterval(timer)
  }, [])

  const sectionContent: Record<string, React.ReactNode> = {

    problem: (
      <div>
        <Eyebrow>The problem</Eyebrow>
        <H>Enterprise transformation is broken.<br />AI makes it worse.</H>
        <Sub>Large consulting firms charge $40M to diagnose problems that take 18 months to surface and produce recommendations that gather dust. Then AI arrived — and organizations spent billions on pilots that never scaled.</Sub>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px' }}>
          {[
            { v: `$${counts[0]}B`,  l: 'Spent on enterprise transformation annually', color: RED   },
            { v: `${counts[1]}%`,   l: 'Of AI pilots that never reach production',    color: RED   },
            { v: `${counts[2]}×`,   l: 'Longer than projected for average program',   color: AMBER },
            { v: `${counts[3]}%`,   l: 'Of CXOs who say consulting ROI is unclear',   color: AMBER },
          ].map((s, i) => (
            <Card key={i}>
              <div style={{ fontFamily: SERIF, fontSize: '42px', fontWeight: 500, color: s.color, lineHeight: 1, marginBottom: '8px' }}>{s.v}</div>
              <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5 }}>{s.l}</div>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Card style={{ borderLeft: `4px solid ${RED}`, borderRadius: '0 12px 12px 0' }}>
            <Eyebrow color={RED}>The consulting problem</Eyebrow>
            <div style={{ fontSize: '15px', color: WHITE, fontWeight: 500, marginBottom: '8px' }}>Large teams. Long timelines. Knowledge walks out the door.</div>
            <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>A typical enterprise transformation engagement: 40-80 consultants, 18-36 months, $20-40M in fees. When they leave, the knowledge leaves with them. The next engagement starts from zero.</div>
          </Card>
          <Card style={{ borderLeft: `4px solid ${AMBER}`, borderRadius: '0 12px 12px 0' }}>
            <Eyebrow color={AMBER}>The AI problem</Eyebrow>
            <div style={{ fontSize: '15px', color: WHITE, fontWeight: 500, marginBottom: '8px' }}>Pilots everywhere. Value nowhere.</div>
            <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>Only 14% of CFOs report clear measurable ROI from AI investments. The median enterprise has 42 AI initiatives running simultaneously. Zero have a verified outcome baseline. Zero are tracking delivery against commitment.</div>
          </Card>
        </div>

        <div style={{ marginTop: '24px', background: 'rgba(45,212,200,0.05)', border: `1px solid rgba(45,212,200,0.2)`, borderRadius: '12px', padding: '24px 28px' }}>
          <Eyebrow>Harvey AI is the proof of concept</Eyebrow>
          <div style={{ fontSize: '15px', color: WHITE, lineHeight: 1.6 }}>Harvey AI is $11B doing for legal what AbarVa does for enterprise transformation. Same structure. Legal professional services market: $500B. Enterprise transformation market: <span style={{ color: TEAL, fontWeight: 500 }}>$800B</span>. Nobody has touched it with a platform built for it. Until now.</div>
        </div>
      </div>
    ),

    platform: (
      <div>
        <Eyebrow>The platform</Eyebrow>
        <H>Five products.<br />One intelligence engine.</H>
        <Sub>Each product answers the question a CXO is actually asking. Together they replace the full engagement lifecycle — strategy, diagnostics, vendor selection, business case, and outcome tracking.</Sub>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '32px' }}>
          {[
            { name: 'Situation',      q: '"What\'s actually broken?"',       color: RED,    icon: '01' },
            { name: 'Strategy',       q: '"Where should we bet?"',           color: '#6366F1', icon: '02' },
            { name: 'Vendor',         q: '"Which vendor wins here?"',        color: AMBER,  icon: '03' },
            { name: 'Business Case',  q: '"How do we justify this?"',        color: GREEN,  icon: '04' },
            { name: 'Outcomes',       q: '"Did it work — can we prove it?"', color: TEAL,   icon: '05' },
          ].map(p => (
            <div key={p.name} style={{ background: CARD, border: `1px solid ${EDGE}`, borderTop: `3px solid ${p.color}`, borderRadius: '0 0 10px 10px', padding: '16px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, marginBottom: '8px' }}>{p.icon}</div>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: p.color, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>{p.name}</div>
              <div style={{ fontSize: '11px', color: MUTED, fontStyle: 'italic', lineHeight: 1.4 }}>{p.q}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <Card>
            <Eyebrow>Transformation Genome</Eyebrow>
            <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>500+ outcome patterns from real engagements. Every finding grounded in what worked and what failed in organizations like yours. The Genome compounds with every client — becoming more accurate over time.</div>
          </Card>
          <Card>
            <Eyebrow>Three-source attribution</Eyebrow>
            <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>Every recommendation shows three sources: your data, industry benchmarks, and Genome outcomes. No black boxes. Every number traceable. Every recommendation defensible in a board meeting.</div>
          </Card>
          <Card>
            <Eyebrow>Knowledge layer</Eyebrow>
            <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>Every engagement ingests the client environment into a permanent, client-owned knowledge base. New team members onboard in days. Knowledge never walks out the door. The client owns it permanently.</div>
          </Card>
        </div>
      </div>
    ),

    solutions: (
      <div>
        <Eyebrow>Solutions</Eyebrow>
        <H>Three solutions.<br />Full lifecycle coverage.</H>
        <Sub>Each solution prescribes the architecture, tools, and Maestro team. Each earns its fee only on verified outcomes.</Sub>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {[
            {
              name: 'AI-Powered PDLC', owner: 'CIO · All verticals', color: '#6366F1',
              problem: '"We\'re spending $300M in capital. Average time to production is 16 months. My engineers spend 60% of their time not building."',
              outcome: '16mo → 8mo delivery · $18M consulting reduction per engagement',
              team: '6 embedded Maestros replace 40 consultants',
            },
            {
              name: 'AI-Powered Delivery', owner: 'CIO · CTO · All verticals', color: TEAL,
              problem: '"80 consultants on site. 70% of their time getting up to speed. Knowledge walks out every Friday."',
              outcome: '40% consulting cost reduction · Knowledge stays permanently',
              team: '4 embedded Maestros replace 60-80 consultants',
            },
            {
              name: 'Margin Optimization', owner: 'CEO · CFO · COO', color: AMBER,
              problem: '"Operating margin 1.8% against a 4% target. We don\'t know exactly where the leak is."',
              outcome: '$60-120M annual margin recovery (Meridian baseline)',
              team: '3-5 Maestros per unlock activated',
            },
          ].map(s => (
            <div key={s.name} style={{ background: CARD, border: `1px solid ${EDGE}`, borderLeft: `4px solid ${s.color}`, borderRadius: '0 12px 12px 0', padding: '20px 24px', display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: WHITE, marginBottom: '4px' }}>{s.name}</div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.05em', textTransform: 'uppercase' }}>{s.owner}</div>
              </div>
              <div style={{ fontSize: '12px', color: MUTED, fontStyle: 'italic', lineHeight: 1.5 }}>{s.problem}</div>
              <div>
                <div style={{ fontSize: '12px', color: s.color, lineHeight: 1.5, marginBottom: '4px' }}>{s.outcome}</div>
                <div style={{ fontSize: '11px', color: DIM }}>{s.team}</div>
              </div>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { label: 'Agents handle', items: ['Requirements synthesis', 'Code generation', 'Test writing', 'Documentation', 'Benchmarking', 'Deployment'], color: DIM },
              { label: 'Maestros handle', items: ['Architecture judgment', 'Stakeholder alignment', 'Quality decisions', 'Outcome accountability'], color: TEAL },
              { label: 'Client gets', items: ['Outcome commitment locked', 'Knowledge owned permanently', 'No outcome = no fee', 'Compounding intelligence'], color: GREEN },
              { label: 'AbarVa earns', items: ['Platform license fee', '15-20% of verified savings', 'Referral fees (disclosed)', 'Outcome fee at Series A'], color: AMBER },
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: col.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>{col.label}</div>
                {col.items.map(item => (
                  <div key={item} style={{ fontSize: '12px', color: MUTED, marginBottom: '6px', paddingLeft: '8px', borderLeft: `2px solid ${EDGE}` }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    ),

    clients: (
      <div>
        <Eyebrow>Client economics</Eyebrow>
        <H>Three clients. Live data. Real numbers.</H>
        <Sub>Each client is fully loaded in the platform right now. These are not projections. These are the situations AbarVa diagnosed before the first meeting.</Sub>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {CLIENTS.map((c, i) => (
            <button key={c.id} onClick={() => setClientIdx(i)} style={{ padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${clientIdx === i ? c.color : EDGE}`, background: clientIdx === i ? 'rgba(45,212,200,0.06)' : CARD, color: clientIdx === i ? c.color : MUTED, fontFamily: MONO, fontSize: '11px', letterSpacing: '.05em', textTransform: 'uppercase' }}>
              {c.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {client.metrics.map(m => (
            <div key={m.label} style={{ background: CARD, border: `1px solid ${EDGE}`, borderTop: `2px solid ${m.red ? RED : AMBER}`, borderRadius: '0 0 10px 10px', padding: '12px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: '20px', color: m.red ? RED : AMBER, lineHeight: 1, marginBottom: '4px' }}>{m.value}</div>
              <div style={{ fontSize: '10px', color: DIM, lineHeight: 1.3 }}>{m.target}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <Card style={{ borderLeft: `4px solid ${client.color}`, borderRadius: '0 12px 12px 0' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>What AbarVa found first</div>
            <div style={{ fontSize: '14px', color: WHITE, lineHeight: 1.6, marginBottom: '12px' }}>{client.finding}</div>
            <div style={{ fontSize: '13px', color: MUTED, fontStyle: 'italic' }}>{client.wow}</div>
          </Card>
          <Card>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Economics — Year 1</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Platform license', value: fmt(client.platformFee), color: TEAL  },
                { label: 'Outcome fee (15%)', value: fmt(client.outcomeFee), color: GREEN },
                { label: 'Consulting avoided', value: fmt(client.consulting), color: MUTED },
                { label: 'Client verified savings', value: fmt(client.savings), color: WHITE },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: `1px solid ${EDGE}` }}>
                  <span style={{ fontSize: '12px', color: MUTED }}>{r.label}</span>
                  <span style={{ fontFamily: SERIF, fontSize: '16px', color: r.color, fontWeight: 500 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    ),

    model: (
      <div>
        <Eyebrow>Revenue model</Eyebrow>
        <H>Three streams.<br />Two at seed. One unlocks at Series A.</H>
        <Sub>The outcome fee is deferred. Platform license and referral fees fund the seed stage. The outcome fee becomes real when we have the client history to make it contractually enforceable.</Sub>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          {[
            {
              name: 'Platform License', stage: 'Seed — Active', color: TEAL,
              desc: 'Annual enterprise license. Flat fee. No per-seat pricing.',
              tiers: [
                { tier: 'Intelligence Essentials', price: '$350K/yr', what: '3 products · 1 solution · 48 Maestro hrs/yr' },
                { tier: 'Intelligence Suite', price: '$850K/yr', what: 'All 5 products · 3 solutions · 120 Maestro hrs/yr' },
                { tier: 'Intelligence Enterprise', price: '$1.4M/yr', what: 'Full platform · Custom solutions · Unlimited Maestro' },
              ],
            },
            {
              name: 'Referral & Marketplace', stage: 'Seed — Active', color: AMBER,
              desc: 'Referral fees from vendors recommended through AbarVa. Disclosed on every recommendation.',
              tiers: [
                { tier: 'Vendor referral fee', price: '10-20% Y1',   what: 'Paid by vendor when deal closes' },
                { tier: 'Contract intelligence', price: '$25-50K',   what: 'Negotiation brief + benchmark data' },
                { tier: 'Marketplace attach',   price: 'Per service', what: 'Implementation services attach' },
              ],
            },
            {
              name: 'Outcome Fee', stage: 'Series A — Deferred', color: DIM,
              desc: 'The most powerful stream. 15-20% of verified savings above baseline. Unlocks at Series A when we have 30+ clients with verified outcomes.',
              tiers: [
                { tier: 'Verified savings share',  price: '15-20%',     what: 'Of audited client savings only' },
                { tier: 'Per engagement (Meridian)', price: '$4.2M',    what: 'At $28M verified savings' },
                { tier: 'Revenue multiple',        price: '20-30×',     what: 'Outcome fee commands premium' },
              ],
            },
          ].map(stream => (
            <Card key={stream.name} style={{ borderTop: `3px solid ${stream.color}`, borderRadius: '0 0 12px 12px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: stream.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{stream.stage}</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: WHITE, marginBottom: '10px' }}>{stream.name}</div>
              <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5, marginBottom: '16px' }}>{stream.desc}</div>
              {stream.tiers.map(t => (
                <div key={t.tier} style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: `1px solid ${EDGE}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', color: WHITE }}>{t.tier}</span>
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: stream.color }}>{t.price}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: DIM }}>{t.what}</div>
                </div>
              ))}
            </Card>
          ))}
        </div>

        <Card>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Seed stage model — 10 clients by Month 18</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { label: 'Platform ARR', value: '$5.1M',  color: TEAL,  note: '6 Suite + 4 Essentials' },
              { label: 'Referral fees', value: '$1.8M', color: AMBER, note: 'Avg $180K per client'    },
              { label: 'Total Year 2',  value: '$6.9M', color: WHITE, note: 'Combined streams'        },
              { label: 'Series A trigger', value: '$5M', color: GREEN, note: 'ARR at $100M pre-money' },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{m.label}</div>
                <div style={{ fontFamily: SERIF, fontSize: '28px', color: m.color, lineHeight: 1, marginBottom: '4px' }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: DIM }}>{m.note}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    ),

    moat: (
      <div>
        <Eyebrow>The moat</Eyebrow>
        <H>Four compounding assets.<br />Each one harder to replicate.</H>
        <Sub>The Transformation Genome is not a feature. It is the product. Every engagement makes it more accurate. Every outcome makes the next recommendation more defensible.</Sub>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          {[
            {
              name: 'Transformation Genome', color: TEAL,
              headline: 'Every engagement adds patterns others can\'t replicate',
              body: '500+ outcome patterns at seed. 5,000+ at Series A. Cross-client learning that is anonymized, aggregated, and impossible to access without running real engagements. A competitor entering today starts with zero patterns.',
            },
            {
              name: 'Adaptive Strategy Intelligence', color: '#6366F1',
              headline: 'Situation-specific, not generic',
              body: 'Every recommendation scored against the specific client\'s data, their stack, their team capability, their failure signals. Not a best practice list. A prescription that changes when the client changes. Impossible to replicate without the underlying data.',
            },
            {
              name: 'Outcome Interpretability Layer', color: AMBER,
              headline: 'Every number is auditable',
              body: 'Three-source attribution on every finding: client data, industry benchmark, Genome outcome. Not a black box. A CXO can trace any recommendation to its source. This is what makes the outcome fee contractually enforceable.',
            },
            {
              name: 'Research Publication Program', color: GREEN,
              headline: 'Academic credibility as a moat',
              body: 'AbarVa publishes Genome findings as research — anonymized, peer-reviewed. This builds academic credibility, attracts talent, and makes the Genome a trusted data source rather than a vendor claim. McKinsey spends $100M/year on thought leadership. AbarVa does it with data.',
            },
          ].map(m => (
            <Card key={m.name} style={{ borderLeft: `4px solid ${m.color}`, borderRadius: '0 12px 12px 0' }}>
              <Eyebrow color={m.color}>{m.name}</Eyebrow>
              <div style={{ fontSize: '14px', fontWeight: 500, color: WHITE, marginBottom: '8px' }}>{m.headline}</div>
              <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>{m.body}</div>
            </Card>
          ))}
        </div>

        <Card style={{ border: `1px solid rgba(45,212,200,0.25)`, background: 'rgba(45,212,200,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
            {[
              { stage: 'Today · Seed', items: ['Working workflow engine', 'Meridian demo with real intelligence', '7 Genome patterns manually seeded', 'Outcome accountability contractually real'] },
              { stage: 'Seed funds · 12 months', items: ['3 Maestros hired', '3 design partners engaged', 'Automated benchmark feeds', '50+ Genome patterns', 'Referral relationships established'] },
              { stage: 'Series A · 30 clients', items: ['Cross-client intelligence live', 'Outcome fee contractually enforced', 'Predictive failure flags', '$5M ARR trigger at $100M pre-money'] },
            ].map(stage => (
              <div key={stage.stage}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '12px' }}>{stage.stage}</div>
                {stage.items.map(item => (
                  <div key={item} style={{ fontSize: '12px', color: MUTED, marginBottom: '8px', paddingLeft: '10px', borderLeft: `2px solid ${EDGE}` }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <div style={{ marginTop: '32px', textAlign: 'center', padding: '40px 0', borderTop: '1px solid #1C2D45' }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', color: '#475569', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Abar (Bengali: again, renewed) · Vā (Sanskrit: indeed, with certainty)
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '38px', color: '#EFF6FF', lineHeight: 1.4 }}>
            Know it. Build it. <span style={{ color: '#2DD4C8' }}>Own it.</span>
          </div>
          <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '12px' }}>
            The knowledge layer consulting could never build. Now built. Client-owned. Permanent.
          </div>
        </div>
      </div>
    ),

    round: (
      <div>
        <Eyebrow>Seed round</Eyebrow>
        <H>$8M at $25M cap.<br />12 months to Series A trigger.</H>
        <Sub>First institutional capital. Targeting Anthropic Anthology Fund as lead. Building the proof that enterprise transformation can be done by a small team with AI — and that clients will pay for verified outcomes.</Sub>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <Card>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Use of capital</div>
            {[
              { label: 'Maestro hiring (3)',         pct: 45, value: '$3.6M', color: TEAL  },
              { label: 'Platform development',       pct: 25, value: '$2.0M', color: '#6366F1' },
              { label: 'Design partner acquisition', pct: 15, value: '$1.2M', color: AMBER },
              { label: 'Operations & infrastructure',pct: 15, value: '$1.2M', color: DIM  },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: MUTED }}>{item.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: '11px', color: item.color }}>{item.value} · {item.pct}%</span>
                </div>
                <div style={{ height: '4px', background: EDGE, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '16px' }}>12-month milestones</div>
            {[
              { m: 'Month 3',  text: '3 design partners signed. Meridian, First Capital, Apex formalized.', color: TEAL  },
              { m: 'Month 6',  text: 'First verified outcome delivered. Outcome fee model tested.', color: GREEN },
              { m: 'Month 9',  text: '3 Maestros hired. Genome automated. 50+ patterns seeded.', color: AMBER },
              { m: 'Month 12', text: '$5M ARR. Series A at $100M pre-money. 10 clients.', color: WHITE },
            ].map(m => (
              <div key={m.m} style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: m.color, whiteSpace: 'nowrap', marginTop: '2px', minWidth: '64px' }}>{m.m}</div>
                <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{m.text}</div>
              </div>
            ))}
          </Card>
        </div>

        <Card style={{ border: `1px solid rgba(45,212,200,0.25)`, background: 'rgba(45,212,200,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>The ask</div>
              <div style={{ fontFamily: SERIF, fontSize: '36px', color: WHITE, lineHeight: 1.1, marginBottom: '8px' }}>$8M</div>
              <div style={{ fontSize: '13px', color: MUTED }}>SAFE · $25M cap · No discount</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Primary target</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: WHITE, marginBottom: '6px' }}>Anthropic Anthology Fund</div>
              <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>AbarVa is built on Claude. Every Maestro runs on Claude. The Genome is powered by Claude. This is the right structural home.</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>The founder</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: WHITE, marginBottom: '6px' }}>Former Managing Director & Data/AI Growth Lead</div>
              <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>Top consulting firm. Designed and delivered the knowledge layer architecture now powering AbarVa. Built this for a major health system — now building it as a platform.</div>
            </div>
          </div>
        </Card>
      </div>
    ),
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="investor" />

      {/* INVESTOR HEADER */}
      <div style={{ background: CARD, borderBottom: `1px solid ${EDGE}`, padding: '20px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '4px' }}>Investor overview · Confidential</div>
            <div style={{ fontFamily: SERIF, fontSize: '20px', color: WHITE }}>AbarVa — Seed Round · $8M at $25M cap</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, letterSpacing: '.06em' }}>
            SAFE · No discount · Anthropic Anthology Fund target
          </div>
        </div>
      </div>

      {/* SECTION NAV */}
      <div style={{ background: CARD, borderBottom: `1px solid ${EDGE}`, padding: '0 40px', position: 'sticky', top: '64px', zIndex: 80 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '0', overflowX: 'auto' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '0 20px', height: '48px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: '11px', letterSpacing: '.06em', textTransform: 'uppercase', color: section === s.id ? TEAL : MUTED, borderBottom: section === s.id ? `2px solid ${TEAL}` : '2px solid transparent', whiteSpace: 'nowrap' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 40px 80px' }}>
        {sectionContent[section]}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ background: CARD, borderTop: `1px solid ${EDGE}`, padding: '10px 40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="/" style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, letterSpacing: '.06em', textTransform: 'uppercase', textDecoration: 'none' }}>← Home</a>
        <div style={{ flex: 1 }} />
        <a href="/diagnose?client=meridian" style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.06em', textTransform: 'uppercase', textDecoration: 'none' }}>Open Meridian demo →</a>
        <a href="/admin" style={{ background: TEAL, color: BG, padding: '7px 16px', borderRadius: '6px', fontFamily: MONO, fontSize: '10px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', textDecoration: 'none' }}>Maestro</a>
      </div>
    </div>
  )
}
