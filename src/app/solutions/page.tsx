'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { filterSolutions, buildSolutionUrl, objectiveColor, type SolutionFilter, type SolutionObjective, type SolutionOffice, type SolutionVertical } from '@/lib/solution-library'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#060A12',
  surface: '#0D1520',
  border: '#1C2D45',
  teal: '#2DD4C8',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  indigo: '#6366F1',
  text: '#EFF6FF',
  secondary: '#94A3B8',
  fraunces: 'Fraunces, Georgia, serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  sans: '"DM Sans", system-ui, sans-serif',
}

// ── Solution data ─────────────────────────────────────────────────────────────
type Client = 'meridian' | 'firstcapital' | 'apexretail' | 'arcturus' | 'nexora'

const CLIENT_LABELS: Record<Client, string> = {
  meridian: 'Meridian Health',
  firstcapital: 'First Capital Bank',
  apexretail: 'Apex Retail',
  arcturus: 'Arcturus Financial',
  nexora: 'Nexora Retail',
}

// Client-specific FROM YOUR DATA for each solution
const SOLUTION_CLIENT_DATA: Record<string, Record<Client, Array<{ icon: string; text: string; source: 'data' | 'industry' | 'genome' }>>> = {
  'HC-01': {
    meridian: [
      { icon: '🔴', text: 'Denial rate 18.2% vs 11.4% benchmark — $94M annual gap', source: 'data' },
      { icon: '🔴', text: 'Prior auth 23% automated vs 62% peer average', source: 'data' },
      { icon: '🟡', text: 'Top denial reason: prior auth (38% of denials)', source: 'data' },
      { icon: '🟡', text: 'Cost to collect: $28.40/claim vs $19.20 best-in-class', source: 'industry' },
    ],
    firstcapital: [
      { icon: '🟡', text: 'No RCM AI programme active', source: 'data' },
      { icon: '🟢', text: 'Run FS-01 Digital Banking instead', source: 'industry' },
    ],
    apexretail: [
      { icon: '🟡', text: 'No healthcare operations — not applicable', source: 'data' },
    ],
    arcturus: [
      { icon: '🟡', text: 'No healthcare operations — not applicable', source: 'data' },
    ],
    nexora: [
      { icon: '🟡', text: 'No healthcare operations — not applicable', source: 'data' },
    ],
  },
  'AM-01': {
    meridian: [
      { icon: '🔴', text: '312 apps in inventory — 42% flagged redundant', source: 'data' },
      { icon: '🔴', text: '$38M shadow IT spend — untracked SaaS', source: 'data' },
      { icon: '🟡', text: '3 BI platforms with overlapping capability', source: 'data' },
      { icon: '🟡', text: 'IT spend 4.5% of revenue — above 3.8% peer median', source: 'industry' },
    ],
    firstcapital: [
      { icon: '🔴', text: '180 applications — 38% redundancy rate estimated', source: 'data' },
      { icon: '🟡', text: '$22M shadow IT estimated based on size', source: 'industry' },
    ],
    apexretail: [
      { icon: '🔴', text: '420 applications including e-commerce stack', source: 'data' },
      { icon: '🟡', text: '5 analytics tools across departments', source: 'data' },
    ],
    arcturus: [
      { icon: '🔴', text: '240 applications — financial services stack', source: 'data' },
      { icon: '🟡', text: '4 BI tools with significant overlap', source: 'data' },
    ],
    nexora: [
      { icon: '🔴', text: '380 applications including retail and e-commerce', source: 'data' },
      { icon: '🟡', text: '6 analytics tools across merchandising and ops', source: 'data' },
    ],
  },
  'IT-01': {
    meridian: [
      { icon: '🔴', text: 'IT spend 4.5% of revenue — above 3.8% peer median', source: 'data' },
      { icon: '🔴', text: '$2.1M in vendor SLA credits unclaimed right now', source: 'data' },
      { icon: '🟡', text: '3 vendor contracts renewing in the next 90 days', source: 'data' },
      { icon: '🟡', text: '6 vendors with overlapping capabilities', source: 'data' },
    ],
    firstcapital: [
      { icon: '🔴', text: 'IT spend 3.8% of AUM — elevated for community bank', source: 'data' },
      { icon: '🟡', text: '$800K estimated SLA credits based on contract review', source: 'industry' },
    ],
    apexretail: [
      { icon: '🔴', text: 'IT spend 2.8% of revenue — in range but opportunity', source: 'data' },
      { icon: '🟡', text: 'Multiple logistics vendors with overlap detected', source: 'data' },
    ],
    arcturus: [
      { icon: '🔴', text: 'IT spend 3.2% of AUM — benchmark is 2.6%', source: 'data' },
      { icon: '🟡', text: '$1.4M estimated SLA credits unclaimed', source: 'industry' },
    ],
    nexora: [
      { icon: '🔴', text: 'IT spend 3.1% of revenue — retail benchmark 2.4%', source: 'data' },
      { icon: '🟡', text: 'Supply chain vendor overlap identified across 3 systems', source: 'data' },
    ],
  },
  'FS-01': {
    firstcapital: [
      { icon: '🔴', text: 'Digital adoption 41% vs 67% peer benchmark — $48M revenue gap', source: 'data' },
      { icon: '🔴', text: 'Core system 22 years old — FIS HORIZON — modernization critical', source: 'data' },
      { icon: '🔴', text: 'FedNow: not compliant — January 2027 hard deadline', source: 'data' },
      { icon: '🟡', text: 'Mobile NPS 34 vs 58 best-in-class', source: 'data' },
    ],
    meridian: [
      { icon: '🟡', text: 'Not a financial services organization — see HC-01 instead', source: 'data' },
    ],
    apexretail: [
      { icon: '🟡', text: 'Retail financial services — see AM-01 or AI-01', source: 'data' },
    ],
    arcturus: [
      { icon: '🔴', text: 'Digital adoption 38% vs 64% peer benchmark', source: 'data' },
      { icon: '🟡', text: 'Core system 18 years old — modernization window approaching', source: 'data' },
    ],
    nexora: [
      { icon: '🟡', text: 'Retail — financial services scope limited', source: 'data' },
      { icon: '🟢', text: 'Consider AM-01 Analytics Modernization instead', source: 'industry' },
    ],
  },
  'AI-01': {
    meridian: [
      { icon: '🔴', text: '0 of 6 AI pilots delivering value — $42M stalled', source: 'data' },
      { icon: '🔴', text: '14 AI tools found in shadow IT — not in IT registry', source: 'data' },
      { icon: '🟡', text: 'Responsible AI score 52/100 — compliance exposure', source: 'data' },
      { icon: '🟡', text: '$42M AI budget committed — $0 in tracked outcomes', source: 'data' },
    ],
    firstcapital: [
      { icon: '🔴', text: 'Fraud ML pilot stalled — no outcome measurement', source: 'data' },
      { icon: '🟡', text: 'AI spend estimated $4M — no ROI tracking', source: 'industry' },
    ],
    apexretail: [
      { icon: '🔴', text: 'Personalisation AI deployed — outcomes unclear', source: 'data' },
      { icon: '🟡', text: '$8M AI investment — no baseline locked', source: 'data' },
    ],
    arcturus: [
      { icon: '🔴', text: 'Risk AI pilot — no outcome baseline established', source: 'data' },
      { icon: '🟡', text: '$6M AI budget — ROI untracked', source: 'industry' },
    ],
    nexora: [
      { icon: '🔴', text: 'Recommendation AI deployed — conversion impact unmeasured', source: 'data' },
      { icon: '🟡', text: '$11M AI investment — no outcomes framework', source: 'data' },
    ],
  },
}

const ALL_SOLUTIONS = [
  {
    code: 'HC-01',
    name: 'Revenue Cycle Intelligence',
    objective: 'Grow' as SolutionObjective,
    office: 'Front Office' as SolutionOffice,
    vertical: 'Healthcare' as SolutionVertical,
    slug: 'revenue-cycle-intelligence',
    problem: 'My denial rate is killing us and my board is asking questions I can\'t answer about where the revenue went.',
    products: ['Situation', 'AI Investment', 'Vendor', 'Business Case', 'Outcome'],
    typicalOutcome: '$28-94M annual value · 14 months to full value',
    genomeEngagements: 47,
    successRate: 71,
  },
  {
    code: 'AM-01',
    name: 'Analytics Modernization Intelligence',
    objective: 'Optimise' as SolutionObjective,
    office: 'Back Office' as SolutionOffice,
    vertical: 'All' as SolutionVertical,
    slug: 'analytics-modernization-intelligence',
    problem: 'We have hundreds of reports, a dozen BI tools, and nobody knows which ones anyone uses.',
    products: ['Situation', 'Business Case', 'Vendor', 'Data Estate'],
    typicalOutcome: '$3-8M annual savings · 18-24 months payback',
    genomeEngagements: 23,
    successRate: 74,
  },
  {
    code: 'IT-01',
    name: 'IT Spend Optimization Intelligence',
    objective: 'Optimise' as SolutionObjective,
    office: 'Back Office' as SolutionOffice,
    vertical: 'All' as SolutionVertical,
    slug: 'it-spend-optimization-intelligence',
    problem: 'I\'m spending hundreds of millions on IT. I can\'t tell my CFO what we\'re getting for it or where to cut.',
    products: ['Situation', 'Business Case', 'Vendor', 'Outcome'],
    typicalOutcome: '$8-18M annual savings · 12 months payback',
    genomeEngagements: 31,
    successRate: 79,
  },
  {
    code: 'FS-01',
    name: 'Digital Banking Transformation',
    objective: 'Grow' as SolutionObjective,
    office: 'Front Office' as SolutionOffice,
    vertical: 'Financial Services' as SolutionVertical,
    slug: 'digital-banking-transformation',
    problem: 'Our digital adoption is 26 percentage points behind our competitors. Every point costs us revenue and customers.',
    products: ['Situation', 'AI Investment', 'Vendor', 'Business Case', 'Outcome'],
    typicalOutcome: '$18-48M annual revenue uplift · 18 months to value',
    genomeEngagements: 34,
    successRate: 68,
  },
  {
    code: 'AI-01',
    name: 'AI Portfolio Accountability',
    objective: 'Protect' as SolutionObjective,
    office: 'Middle Office' as SolutionOffice,
    vertical: 'All' as SolutionVertical,
    slug: 'ai-portfolio-accountability',
    problem: 'We\'ve spent tens of millions on AI. I can\'t tell the board what\'s working, what isn\'t, or whether any of it was worth it.',
    products: ['Situation', 'Outcome', 'AI Investment'],
    typicalOutcome: '$42M stalled spend unlocked and redirected · 90 days',
    genomeEngagements: 41,
    successRate: 82,
  },
]

// ── Solution card ─────────────────────────────────────────────────────────────
function SolutionCard({ solution, client }: { solution: typeof ALL_SOLUTIONS[0]; client: Client }) {
  const clientData = SOLUTION_CLIENT_DATA[solution.code]?.[client] || []
  const color = objectiveColor(solution.objective)
  const href = `/solutions/${solution.slug}?client=${client}`
  const runUrl = buildSolutionUrl(client, solution.code)

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Color bar */}
      <div style={{ height: 3, background: color }} />

      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Zone 1 — Badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {[solution.objective, solution.office, solution.vertical].map(badge => (
            <div
              key={badge}
              style={{
                fontSize: 9, fontFamily: T.mono,
                padding: '2px 8px',
                border: `1px solid ${T.border}`,
                color: T.secondary,
                borderRadius: 4,
              }}
            >
              {badge}
            </div>
          ))}
          <div style={{
            fontSize: 9, fontFamily: T.mono,
            padding: '2px 8px',
            border: `1px solid rgba(45,212,200,0.3)`,
            color: T.teal,
            borderRadius: 4,
          }}>
            {solution.code}
          </div>
        </div>

        {/* Zone 2 — Problem */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontFamily: T.fraunces, color: T.text, marginBottom: 8 }}>
            {solution.name}
          </div>
          <div style={{ fontSize: 12, fontFamily: T.sans, color: T.secondary, fontStyle: 'italic', lineHeight: 1.5 }}>
            &ldquo;{solution.problem}&rdquo;
          </div>
        </div>

        {/* Zone 3 — FROM YOUR DATA */}
        <div style={{ marginBottom: 16 }}>
          {clientData.slice(0, 3).map(({ icon, text, source }) => (
            <div key={text} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, fontSize: 11 }}>{icon}</span>
              <span style={{ fontSize: 11, fontFamily: T.sans, color: T.text, lineHeight: 1.4 }}>
                {text}
              </span>
              <span style={{
                fontSize: 8, fontFamily: T.mono,
                color: source === 'data' ? T.teal : source === 'industry' ? T.indigo : '#F472B6',
                flexShrink: 0, alignSelf: 'center',
              }}>
                {source === 'data' ? '← YOUR DATA' : source === 'industry' ? '← INDUSTRY' : '← GENOME'}
              </span>
            </div>
          ))}
        </div>

        {/* Zone 4 — Products + Outcome */}
        <div style={{ marginBottom: 16, flex: 1 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {solution.products.map(p => (
              <div key={p} style={{
                fontSize: 9, fontFamily: T.mono,
                padding: '2px 6px',
                background: 'rgba(45,212,200,0.08)',
                border: `1px solid rgba(45,212,200,0.2)`,
                color: T.teal, borderRadius: 4,
              }}>
                {p}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, fontFamily: T.sans, color: T.secondary }}>
            Typical outcome: {solution.typicalOutcome}
          </div>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginTop: 2 }}>
            From {solution.genomeEngagements} Genome engagements · {solution.successRate}% success rate
          </div>
        </div>

        {/* Zone 5 — CTA */}
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={runUrl}
            style={{
              flex: 1, padding: '10px 0',
              background: T.teal, color: T.bg,
              border: 'none', borderRadius: 8,
              fontSize: 12, fontFamily: T.mono, fontWeight: 700,
              cursor: 'pointer', textDecoration: 'none',
              textAlign: 'center', display: 'block',
            }}
          >
            Start this Solution →
          </a>
          <a
            href={href}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: `1px solid ${T.border}`,
              color: T.secondary, borderRadius: 8,
              fontSize: 12, fontFamily: T.mono,
              cursor: 'pointer', textDecoration: 'none',
            }}
          >
            Details
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ filter, onChange }: { filter: SolutionFilter; onChange: (f: SolutionFilter) => void }) {
  const objectives: Array<SolutionObjective | 'All'> = ['All', 'Grow', 'Optimise', 'Protect']
  const offices: Array<SolutionOffice | 'All'> = ['All', 'Front Office', 'Middle Office', 'Back Office']
  const verticals: Array<SolutionVertical | 'All'> = ['All', 'Healthcare', 'Financial Services', 'Retail']

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
      {/* Objective filter */}
      <div>
        <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>OBJECTIVE</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {objectives.map(obj => (
            <button
              key={obj}
              onClick={() => onChange({ ...filter, objective: obj === 'All' ? undefined : obj as SolutionObjective })}
              style={{
                padding: '5px 12px',
                background: (obj === 'All' && !filter.objective) || filter.objective === obj
                  ? T.teal : 'transparent',
                color: (obj === 'All' && !filter.objective) || filter.objective === obj
                  ? T.bg : T.secondary,
                border: `1px solid ${T.border}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 11, fontFamily: T.mono,
              }}
            >
              {obj}
            </button>
          ))}
        </div>
      </div>

      {/* Office filter */}
      <div>
        <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>OFFICE</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {offices.map(office => (
            <button
              key={office}
              onClick={() => onChange({ ...filter, office: office === 'All' ? undefined : office as SolutionOffice })}
              style={{
                padding: '5px 12px',
                background: (office === 'All' && !filter.office) || filter.office === office
                  ? T.teal : 'transparent',
                color: (office === 'All' && !filter.office) || filter.office === office
                  ? T.bg : T.secondary,
                border: `1px solid ${T.border}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 11, fontFamily: T.mono,
              }}
            >
              {office}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical filter */}
      <div>
        <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 6 }}>VERTICAL</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {verticals.map(v => (
            <button
              key={v}
              onClick={() => onChange({ ...filter, vertical: v === 'All' ? undefined : v as SolutionVertical })}
              style={{
                padding: '5px 12px',
                background: (v === 'All' && !filter.vertical) || filter.vertical === v
                  ? T.teal : 'transparent',
                color: (v === 'All' && !filter.vertical) || filter.vertical === v
                  ? T.bg : T.secondary,
                border: `1px solid ${T.border}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 11, fontFamily: T.mono,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Solutions content ─────────────────────────────────────────────────────────
function SolutionsContent() {
  const searchParams = useSearchParams()
  // Client comes from session/URL — not exposed as a UI control
  const client = (searchParams.get('client') as Client) || 'meridian'
  const [filter, setFilter] = useState<SolutionFilter>({})

  const filteredSolutions = filterSolutions(
    ALL_SOLUTIONS as Parameters<typeof filterSolutions>[0],
    filter
  )

  return (
    <div style={{minHeight:'100vh',background:'#060A12',fontFamily:'"DM Sans",sans-serif',color:'#EFF6FF'}}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }` }} />

      {/* Page header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '40px 0 32px' }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Solution Library
        </div>
        <div style={{ fontSize: 40, fontFamily: T.fraunces, color: T.text, marginBottom: 12, lineHeight: 1.1 }}>
          Find your problem. Run the solution.
        </div>
        <div style={{ fontSize: 15, fontFamily: T.sans, color: T.secondary, maxWidth: 580, marginBottom: 24, lineHeight: 1.6 }}>
          Each solution is a pre-configured path from problem to outcome — combining your data, industry context, and the Transformation Genome.
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['5 Solutions', '5 Verticals', 'Avg 76% success rate'].map(stat => (
            <div key={stat} style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, padding: '5px 14px', border: `1px solid rgba(45,212,200,0.3)`, borderRadius: 20, background: 'rgba(45,212,200,0.06)' }}>
              {stat}
            </div>
          ))}
        </div>
      </div>

      {/* Filter + grid */}
      <div style={{ padding: '32px 0 64px' }}>
        <FilterBar filter={filter} onChange={setFilter} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, animation: 'fadein 0.3s ease-out' }}>
          {filteredSolutions.map(solution => (
            <SolutionCard key={solution.code} solution={solution as typeof ALL_SOLUTIONS[0]} client={client} />
          ))}
        </div>
        {filteredSolutions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 64, color: T.secondary, fontFamily: T.mono, fontSize: 13 }}>
            No solutions match these filters.{' '}
            <button onClick={() => setFilter({})} style={{ color: T.teal, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: T.mono }}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SolutionsPage() {
  return (
    <Suspense>
      <SolutionsContent />
    </Suspense>
  )
}
