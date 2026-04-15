'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { filterSolutions, buildSolutionUrl, objectiveColor, type SolutionFilter, type SolutionObjective, type SolutionOffice, type SolutionVertical } from '@/lib/solution-library'

// ── Design tokens ─────────────────────────────────────────────────────────────
const LBG = '#F8F7F4', LTEXT = '#0C0C0C', LBODY = '#3C3C3C', LMUTE = '#888888', LBDR = '#E2E1DC'
const DBG = '#060A12', DTEXT = '#EFF6FF', DBODY = 'rgba(255,255,255,0.74)', DMUTE = 'rgba(255,255,255,0.46)', DBDR = '#1C2D45', DCARD = '#0D1520'
const TEAL = '#2DD4C8', SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

// ── Solution data ─────────────────────────────────────────────────────────────
type Client = 'meridian' | 'firstcapital' | 'apexretail' | 'arcturus' | 'nexora'

type InsightSeverity = 'flag' | 'caution' | 'positive'
interface Insight { text: string; source: 'data' | 'industry' | 'genome'; severity: InsightSeverity }

const SEVERITY_DOT: Record<InsightSeverity, string> = {
  flag:     '#EF4444',
  caution:  '#F59E0B',
  positive: '#10B981',
}

// Client-specific data for each solution
const SOLUTION_CLIENT_DATA: Record<string, Record<Client, Insight[]>> = {
  'HC-01': {
    meridian:     [
      { text: 'Denial rate 18.2% vs 11.4% benchmark — $94M annual gap', source: 'data',     severity: 'flag'    },
      { text: 'Prior auth 23% automated vs 62% peer average',            source: 'data',     severity: 'flag'    },
      { text: 'Top denial reason: prior auth (38% of denials)',           source: 'data',     severity: 'caution' },
      { text: 'Cost to collect: $28.40/claim vs $19.20 best-in-class',   source: 'industry', severity: 'caution' },
    ],
    firstcapital: [
      { text: 'No RCM AI programme active',                              source: 'data',     severity: 'caution' },
      { text: 'Consider FS-01 Digital Banking instead',                  source: 'industry', severity: 'positive' },
    ],
    apexretail:   [{ text: 'No healthcare operations — not applicable', source: 'data', severity: 'caution' }],
    arcturus:     [{ text: 'No healthcare operations — not applicable', source: 'data', severity: 'caution' }],
    nexora:       [{ text: 'No healthcare operations — not applicable', source: 'data', severity: 'caution' }],
  },
  'AM-01': {
    meridian:     [
      { text: '312 apps in inventory — 42% flagged redundant',       source: 'data',     severity: 'flag'    },
      { text: '$38M shadow IT spend — untracked SaaS',               source: 'data',     severity: 'flag'    },
      { text: '3 BI platforms with overlapping capability',          source: 'data',     severity: 'caution' },
      { text: 'IT spend 4.5% of revenue — above 3.8% peer median',  source: 'industry', severity: 'caution' },
    ],
    firstcapital: [
      { text: '180 applications — 38% redundancy rate estimated',    source: 'data',     severity: 'flag'    },
      { text: '$22M shadow IT estimated based on size',              source: 'industry', severity: 'caution' },
    ],
    apexretail:   [
      { text: '420 applications including e-commerce stack',         source: 'data',     severity: 'flag'    },
      { text: '5 analytics tools across departments',                source: 'data',     severity: 'caution' },
    ],
    arcturus:     [
      { text: '240 applications — financial services stack',         source: 'data',     severity: 'flag'    },
      { text: '4 BI tools with significant overlap',                 source: 'data',     severity: 'caution' },
    ],
    nexora:       [
      { text: '380 applications including retail and e-commerce',   source: 'data',     severity: 'flag'    },
      { text: '6 analytics tools across merchandising and ops',      source: 'data',     severity: 'caution' },
    ],
  },
  'IT-01': {
    meridian:     [
      { text: 'IT spend 4.5% of revenue — above 3.8% peer median',       source: 'data',     severity: 'flag'    },
      { text: '$2.1M in vendor SLA credits unclaimed right now',          source: 'data',     severity: 'flag'    },
      { text: '3 vendor contracts renewing in the next 90 days',          source: 'data',     severity: 'caution' },
      { text: '6 vendors with overlapping capabilities',                  source: 'data',     severity: 'caution' },
    ],
    firstcapital: [
      { text: 'IT spend 3.8% of AUM — elevated for community bank',       source: 'data',     severity: 'flag'    },
      { text: '$800K estimated SLA credits based on contract review',      source: 'industry', severity: 'caution' },
    ],
    apexretail:   [
      { text: 'IT spend 2.8% of revenue — in range but opportunity',      source: 'data',     severity: 'caution' },
      { text: 'Multiple logistics vendors with overlap detected',          source: 'data',     severity: 'caution' },
    ],
    arcturus:     [
      { text: 'IT spend 3.2% of AUM — benchmark is 2.6%',                source: 'data',     severity: 'flag'    },
      { text: '$1.4M estimated SLA credits unclaimed',                    source: 'industry', severity: 'caution' },
    ],
    nexora:       [
      { text: 'IT spend 3.1% of revenue — retail benchmark 2.4%',        source: 'data',     severity: 'flag'    },
      { text: 'Supply chain vendor overlap identified across 3 systems',  source: 'data',     severity: 'caution' },
    ],
  },
  'FS-01': {
    firstcapital: [
      { text: 'Digital adoption 41% vs 67% peer benchmark — $48M gap',    source: 'data',     severity: 'flag'    },
      { text: 'Core system 22 years old — FIS HORIZON — critical',        source: 'data',     severity: 'flag'    },
      { text: 'FedNow: not compliant — January 2027 hard deadline',       source: 'data',     severity: 'flag'    },
      { text: 'Mobile NPS 34 vs 58 best-in-class',                       source: 'data',     severity: 'caution' },
    ],
    meridian:     [{ text: 'Not a financial services organisation — see HC-01', source: 'data', severity: 'caution' }],
    apexretail:   [{ text: 'Retail financial services — see AM-01 or AI-01',    source: 'data', severity: 'caution' }],
    arcturus:     [
      { text: 'Digital adoption 38% vs 64% peer benchmark',              source: 'data',     severity: 'flag'    },
      { text: 'Core system 18 years old — modernisation window approaching', source: 'data', severity: 'caution' },
    ],
    nexora:       [
      { text: 'Retail — financial services scope limited',               source: 'data',     severity: 'caution' },
      { text: 'Consider AM-01 Analytics Modernisation instead',          source: 'industry', severity: 'positive' },
    ],
  },
  'AI-01': {
    meridian:     [
      { text: '0 of 6 AI pilots delivering value — $42M stalled',         source: 'data',     severity: 'flag'    },
      { text: '14 AI tools in shadow IT — not in IT registry',            source: 'data',     severity: 'flag'    },
      { text: 'Responsible AI score 52/100 — compliance exposure',        source: 'data',     severity: 'caution' },
      { text: '$42M AI budget committed — $0 in tracked outcomes',        source: 'data',     severity: 'flag'    },
    ],
    firstcapital: [
      { text: 'Fraud ML pilot stalled — no outcome measurement',          source: 'data',     severity: 'flag'    },
      { text: 'AI spend estimated $4M — no ROI tracking',                 source: 'industry', severity: 'caution' },
    ],
    apexretail:   [
      { text: 'Personalisation AI deployed — outcomes unclear',           source: 'data',     severity: 'caution' },
      { text: '$8M AI investment — no baseline locked',                   source: 'data',     severity: 'flag'    },
    ],
    arcturus:     [
      { text: 'Risk AI pilot — no outcome baseline established',          source: 'data',     severity: 'flag'    },
      { text: '$6M AI budget — ROI untracked',                            source: 'industry', severity: 'caution' },
    ],
    nexora:       [
      { text: 'Recommendation AI deployed — conversion impact unmeasured', source: 'data',   severity: 'caution' },
      { text: '$11M AI investment — no outcomes framework',               source: 'data',     severity: 'flag'    },
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
    problem: "My denial rate is killing us and my board is asking questions I can't answer about where the revenue went.",
    products: ['Situation', 'AI Investment', 'Vendor', 'Business Case', 'Outcome'],
    typicalOutcome: '$28–94M annual value · 14 months to full value',
    genomeEngagements: 47,
    successRate: 71,
  },
  {
    code: 'AM-01',
    name: 'Analytics Modernisation Intelligence',
    objective: 'Optimise' as SolutionObjective,
    office: 'Back Office' as SolutionOffice,
    vertical: 'All' as SolutionVertical,
    slug: 'analytics-modernization-intelligence',
    problem: "We have hundreds of reports, a dozen BI tools, and nobody knows which ones anyone uses.",
    products: ['Situation', 'Business Case', 'Vendor', 'Data Estate'],
    typicalOutcome: '$3–8M annual savings · 18–24 months payback',
    genomeEngagements: 23,
    successRate: 74,
  },
  {
    code: 'IT-01',
    name: 'IT Spend Optimisation Intelligence',
    objective: 'Optimise' as SolutionObjective,
    office: 'Back Office' as SolutionOffice,
    vertical: 'All' as SolutionVertical,
    slug: 'it-spend-optimization-intelligence',
    problem: "I'm spending hundreds of millions on IT. I can't tell my CFO what we're getting for it or where to cut.",
    products: ['Situation', 'Business Case', 'Vendor', 'Outcome'],
    typicalOutcome: '$8–18M annual savings · 12 months payback',
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
    problem: "Our digital adoption is 26 percentage points behind competitors. Every point costs us revenue and customers.",
    products: ['Situation', 'AI Investment', 'Vendor', 'Business Case', 'Outcome'],
    typicalOutcome: '$18–48M annual revenue uplift · 18 months to value',
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
    problem: "We've spent tens of millions on AI. I can't tell the board what's working, what isn't, or whether any of it was worth it.",
    products: ['Situation', 'Outcome', 'AI Investment'],
    typicalOutcome: '$42M stalled spend unlocked and redirected · 90 days',
    genomeEngagements: 41,
    successRate: 82,
  },
]

// ── Left sidebar filter panel (Snowflake pattern) ─────────────────────────────
function FilterPanel({ filter, onChange }: { filter: SolutionFilter; onChange: (f: SolutionFilter) => void }) {
  const objectives: Array<SolutionObjective | undefined> = [undefined, 'Grow', 'Optimise', 'Protect']
  const offices: Array<SolutionOffice | undefined> = [undefined, 'Front Office', 'Middle Office', 'Back Office']
  const verticals: Array<SolutionVertical | undefined> = [undefined, 'Healthcare', 'Financial Services', 'Retail']

  function FilterGroup({ label, options, active, onSelect }: {
    label: string
    options: Array<{ value: string | undefined; label: string }>
    active: string | undefined
    onSelect: (v: string | undefined) => void
  }) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>{label}</div>
        {options.map(opt => {
          const isActive = active === opt.value
          return (
            <button
              key={opt.label}
              onClick={() => onSelect(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer', textAlign: 'left' as const,
              }}
            >
              {/* Radio circle */}
              <span style={{
                width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid ${isActive ? TEAL : DBDR}`,
                background: isActive ? TEAL : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: DBG }} />}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 13, color: isActive ? DTEXT : DMUTE, lineHeight: 1 }}>
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{
      width: 200, flexShrink: 0, paddingRight: 32,
      borderRight: `1px solid ${DBDR}`,
    }}>
      <FilterGroup
        label="Objective"
        options={objectives.map(v => ({ value: v, label: v ?? 'All objectives' }))}
        active={filter.objective}
        onSelect={v => onChange({ ...filter, objective: v as SolutionObjective | undefined })}
      />
      <FilterGroup
        label="Office"
        options={offices.map(v => ({ value: v, label: v ?? 'All offices' }))}
        active={filter.office}
        onSelect={v => onChange({ ...filter, office: v as SolutionOffice | undefined })}
      />
      <FilterGroup
        label="Vertical"
        options={verticals.map(v => ({ value: v, label: v ?? 'All verticals' }))}
        active={filter.vertical}
        onSelect={v => onChange({ ...filter, vertical: v as SolutionVertical | undefined })}
      />
      {(filter.objective || filter.office || filter.vertical) && (
        <button
          onClick={() => onChange({})}
          style={{ fontFamily: MONO, fontSize: 10, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '.04em' }}
        >
          ✕ Clear filters
        </button>
      )}
    </div>
  )
}

// ── Solution card ─────────────────────────────────────────────────────────────
function SolutionCard({ solution, client }: { solution: typeof ALL_SOLUTIONS[0]; client: Client }) {
  const insights = SOLUTION_CLIENT_DATA[solution.code]?.[client] ?? []
  const href = `/solutions/${solution.slug}?client=${client}`
  const runUrl = buildSolutionUrl(client, solution.code)
  const objColor = objectiveColor(solution.objective)

  return (
    <div style={{
      background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12,
      display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
    }}>
      <div style={{ padding: '24px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

        {/* Header — objective dot + code + name */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: objColor, flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.08em' }}>{solution.objective} · {solution.office} · {solution.code}</span>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 18, color: DTEXT, lineHeight: 1.25 }}>{solution.name}</div>
        </div>

        {/* Problem quote */}
        <div style={{ fontSize: 12, fontFamily: SANS, color: DBODY, fontStyle: 'italic', lineHeight: 1.6, borderLeft: `2px solid rgba(45,212,200,0.25)`, paddingLeft: 12 }}>
          &ldquo;{solution.problem}&rdquo;
        </div>

        {/* Insights from your data */}
        {insights.slice(0, 3).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>From your data</div>
            {insights.slice(0, 3).map((ins, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: SEVERITY_DOT[ins.severity], flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontFamily: SANS, color: DBODY, lineHeight: 1.45 }}>{ins.text}</span>
                  <span style={{ fontSize: 9, fontFamily: MONO, color: DMUTE, marginLeft: 6 }}>← {ins.source}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
          {solution.products.map(p => (
            <span key={p} style={{
              fontSize: 9, fontFamily: MONO, padding: '3px 8px',
              background: 'rgba(45,212,200,0.07)', border: `1px solid rgba(45,212,200,0.2)`,
              color: TEAL, borderRadius: 4,
            }}>{p}</span>
          ))}
        </div>

        {/* Outcome + Genome stats */}
        <div style={{ marginTop: 'auto' as const }}>
          <div style={{ fontSize: 11, fontFamily: SANS, color: DBODY, lineHeight: 1.5 }}>{solution.typicalOutcome}</div>
          <div style={{ fontSize: 10, fontFamily: MONO, color: DMUTE, marginTop: 3 }}>
            {solution.genomeEngagements} Genome engagements · {solution.successRate}% success rate
          </div>
        </div>
      </div>

      {/* Footer CTAs */}
      <div style={{ borderTop: `1px solid ${DBDR}`, padding: '14px 24px', display: 'flex', gap: 10 }}>
        <a
          href={runUrl}
          style={{
            flex: 1, padding: '9px 0', background: TEAL, color: DBG,
            borderRadius: 7, fontSize: 12, fontFamily: MONO, fontWeight: 700,
            textDecoration: 'none', textAlign: 'center' as const, display: 'block',
          }}
        >
          Start this solution →
        </a>
        <a
          href={href}
          style={{
            padding: '9px 16px', background: 'transparent',
            border: `1px solid ${DBDR}`, color: DMUTE, borderRadius: 7,
            fontSize: 12, fontFamily: MONO, textDecoration: 'none',
          }}
        >
          Details
        </a>
      </div>
    </div>
  )
}

// ── Main content ──────────────────────────────────────────────────────────────
function SolutionsContent() {
  const searchParams = useSearchParams()
  const client = (searchParams.get('client') as Client) || 'meridian'
  const [filter, setFilter] = useState<SolutionFilter>({})

  const filteredSolutions = filterSolutions(
    ALL_SOLUTIONS as Parameters<typeof filterSolutions>[0],
    filter
  )

  return (
    <div style={{ minHeight: '100vh', fontFamily: SANS }}>
      <AbarvaNav activePage="solutions" />

      {/* ── HERO ─ light ───────────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '88px 64px 72px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 18 }}>
            Solution Library
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, color: LTEXT, margin: '0 0 20px', lineHeight: 1.1 }}>
            Find your problem.<br />Run the solution.
          </h1>
          <p style={{ fontSize: 17, color: LBODY, maxWidth: 560, margin: '0 0 36px', lineHeight: 1.72 }}>
            Each solution is a pre-configured path from problem to outcome — combining your data, industry benchmarks, and the Transformation Genome.
          </p>
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { value: '5', label: 'Solutions' },
              { value: '76%', label: 'Avg success rate' },
              { value: '176', label: 'Genome engagements' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: SERIF, fontSize: 28, color: LTEXT, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.06em', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER + GRID ─ dark ────────────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '56px 64px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 0, alignItems: 'flex-start' }}>

          {/* Left sidebar — sticky filter panel */}
          <div style={{ position: 'sticky' as const, top: 72 }}>
            <FilterPanel filter={filter} onChange={setFilter} />
          </div>

          {/* Right — solution cards grid */}
          <div style={{ flex: 1, paddingLeft: 40 }}>
            {filteredSolutions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {filteredSolutions.map(solution => (
                  <SolutionCard key={solution.code} solution={solution as typeof ALL_SOLUTIONS[0]} client={client} />
                ))}
              </div>
            ) : (
              <div style={{ paddingTop: 80, textAlign: 'center' as const, color: DMUTE, fontFamily: MONO, fontSize: 13 }}>
                No solutions match these filters.{' '}
                <button onClick={() => setFilter({})} style={{ color: TEAL, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: MONO }}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── HOW SOLUTIONS WORK ─ light ──────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '88px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 16 }}>How it works</div>
          <div style={{ fontFamily: SERIF, fontSize: 36, color: LTEXT, marginBottom: 48, lineHeight: 1.2 }}>
            A solution isn&apos;t a report.<br />It&apos;s a path from problem to verified outcome.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              { step: '01', title: 'Your data mapped', desc: 'AbarVa reads every system, benchmark, and gap in your situation. No surveys. No guesses.' },
              { step: '02', title: 'Genome finds the pattern', desc: '176 Genome engagements surface what moved outcomes in comparable situations. Matched to yours.' },
              { step: '03', title: 'Maestros hold delivery', desc: 'Embedded operators hold vendors accountable. Fee tied to verified outcomes only.' },
            ].map(item => (
              <div key={item.step} style={{ background: '#FFFFFF', border: `1px solid ${LBDR}`, borderRadius: 12, padding: 28 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.08em', marginBottom: 14 }}>{item.step}</div>
                <div style={{ fontFamily: SERIF, fontSize: 20, color: LTEXT, marginBottom: 12, lineHeight: 1.3 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: LBODY, lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
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
