'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'
import { getClientIntelligence } from '@/lib/client-intelligence'
import { SITUATION_BY_CLIENT, AI_OFFICES_BY_CLIENT, DATA_READINESS, AI_TOTAL_VALUE } from '@/lib/situation-ai-data'
import type { ClientIntelligence, OrgNode } from '@/lib/client-intelligence'
import type { SituationFinding, AIOffice } from '@/lib/situation-ai-data'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, ReferenceLine,
} from 'recharts'

// ── Design tokens ─────────────────────────────────────────────────────────────
const LBG   = '#F8F7F4'
const LALT  = '#F2EFE9'
const LTEXT = '#111111'
const LBODY = '#374151'
const LMUTE = '#9CA3AF'
const LBDR  = '#E5E7EB'
const DBG   = '#060A12'
const DCARD = '#0D1420'
const DTEXT = '#EFF6FF'
const DBODY = '#D1D5DB'
const DMUTE = '#9CA3AF'
const DBDR  = '#1F2937'
const TEAL  = '#2DD4C8'
const RED   = '#EF4444'
const AMBER = '#F59E0B'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'
const W     = { padding: '88px 80px', boxSizing: 'border-box' as const }

const SECTIONS = [
  { id: 'company-profile', label: 'Company Profile' },
  { id: 'leadership',      label: 'Leadership'      },
  { id: 'situation',       label: 'Situation'       },
  { id: 'contradictions',  label: 'Contradictions'  },
  { id: 'market-position', label: 'Market Position' },
  { id: 'genome',          label: 'Genome'          },
  { id: 'ai-unlock',       label: 'AI Unlock'       },
]

// ── Meridian-specific hardcoded content ───────────────────────────────────────
const MER_LEADERSHIP = [
  {
    name: 'Dr. Sarah Chen', title: 'CEO', tenure: '3 years',
    background: 'Former McKinsey healthcare partner. Led $1.2B Ascension merger.',
    drives: 'Needs AI to be a public success story before the JPMorgan Healthcare Conference in January 2027. Reputation is on the line. Peer CEOs at UCSF and Mass General have already announced AI programmes with verified outcomes.',
    howToWin: 'Lead with the headline number and a clear AI narrative they can own publicly. Avoid operational detail — they want the story, not the spreadsheet. Frame everything as "board-ready" and "defensible to analysts".',
    quote: '"We are not going to get left behind. Every competitor is moving on AI and we need to move faster than all of them."',
    source: '— Chicago Tribune · Feb 2026',
  },
  {
    name: 'Michael Torres', title: 'CFO', tenure: '5 years',
    background: 'Former VP Finance at Advocate Aurora. 20 years in healthcare finance. Deep RCM expertise.',
    drives: 'Operating margin is 1.2% against a 3.8% peer median. Every unverified dollar of AI spend is a threat to bond covenants. The CFO is personally exposed if the board discovers the $42M AI spend has no documented ROI.',
    howToWin: 'Bring verified numbers and a clear payback period. Do not pitch AI — pitch cost reduction and margin improvement. Show the Ensemble penalty clause. That is $8M they could have reclaimed. That gets attention.',
    quote: '"I need to see the math before I approve the spend. Show me verified savings and a clear payback period — not a slide deck."',
    source: '— Becker\'s Hospital CFO Report · Jan 2026',
  },
  {
    name: 'Dr. James Park', title: 'CMO', tenure: '2 years',
    background: 'Former Northwestern Medicine physician-researcher. Published on AI in clinical decision support.',
    drives: 'Physician burnout is at 62% — highest since 2020. Documentation burden and prior auth delays are the primary drivers. Park has built his internal brand on clinical AI but cannot point to a single deployed solution that reduced physician workload.',
    howToWin: 'Show how AI reduces physician workload before anything else. Documentation time, prior auth burden. If clinicians benefit, they will champion it. If it adds friction, Park will kill it.',
    quote: '"AI has to reduce friction for clinicians. If it adds one more click, I will personally kill the project."',
    source: '— Modern Healthcare · Dec 2025',
  },
  {
    name: 'Robert Anand', title: 'COO', tenure: '4 years',
    background: 'Former HCA regional COO. Operations background. P&L owner for 3 regional divisions.',
    drives: 'Travel nurse spend is $340M — $140M above the staffed benchmark. The float pool programme he committed to the board is 18 months behind. Every quarter the gap widens. He needs a visible operational win before year-end.',
    howToWin: 'Workforce intelligence is the door opener. Show how AI reduces agency dependency with specific FTE numbers. He is measured on labour cost as % of revenue. Give him something he can report at the next board operations review.',
    quote: '"We have a structural labour problem. The float pool is the answer but I need data to build it properly."',
    source: '— Meridian Operations Review · Q4 2025',
  },
  {
    name: 'Priya Nair', title: 'CTO/CIO', tenure: '6 years',
    background: 'Former CISO at Partners Healthcare. 18 years in healthcare IT.',
    drives: 'She owns the Epic migration, the Azure data platform, and the AI infrastructure roadmap. The CDO vacancy means she is doing three jobs. The migration is behind schedule at Blue Ridge. Any additional AI initiative without a CDO creates technical debt she will own.',
    howToWin: 'Technical credibility first. Understand the Azure SQL migration before the meeting. Show how AbarVa\'s data layer integrates without creating new infrastructure debt. She will test you on architecture. Be ready.',
    quote: '"I cannot support an AI programme that does not have data governance built in from day one. We have learned that lesson the hard way."',
    source: '— Meridian IT Leadership Summit · Mar 2026',
  },
]

const MER_CONTRADICTIONS = [
  {
    topic: 'AI PROGRAMME STATUS',
    stated: '"AI programme on track — 6 initiatives active and delivering value."',
    statedSource: 'CIO Board Presentation · Q3 2025',
    actual: '$42M invested across 28 initiatives. Zero have documented baselines or outcome tracking. CFO cannot defend this at the next board meeting.',
    actualSource: 'AI Investment Register · Apr 2026',
    gap: '$42M with zero accountability',
    consequence: 'Board asks for ROI in Q3 2026. There is no answer. Bond covenant breach risk if margin continues declining.',
  },
  {
    topic: 'EPIC OPTIMISATION',
    stated: '"Epic optimization at 75% — on track for full deployment."',
    statedSource: 'CFO Board Deck · Oct 2025',
    actual: 'Epic audit score 58/100. Six modules not activated. Cogito at 25% utilisation. Blue Ridge still on Cerner.',
    actualSource: 'Epic Optimization Audit · Mar 2026',
    gap: '17pp between reported and actual',
    consequence: 'Epic go-live at Blue Ridge in 90 days on an incomplete foundation. $28M implementation cost at risk.',
  },
  {
    topic: 'TRAVEL NURSE DEPENDENCY',
    stated: '"Travel nurse dependency normalising — programme on plan."',
    statedSource: 'COO Operations Review · Q4 2025',
    actual: 'Agency spend grew 3 consecutive quarters. $340M in FY2026 — $140M above staffed benchmark. Float pool programme does not exist.',
    actualSource: 'Labor Cost Ledger · Q4 FY2025',
    gap: '$20M over target, no plan in place',
    consequence: 'Q4 contract renewals on 3 major agencies. No negotiating leverage. Rate increase likely 8–12%.',
  },
  {
    topic: 'RCM PERFORMANCE',
    stated: '"Denial improvement programme active and delivering results."',
    statedSource: 'CFO Investor Day · Nov 2025',
    actual: 'Denial rate 18.2%. Growing 6 consecutive quarters. Ensemble SLA penalty never invoked. Board unaware of $94M annual write-off.',
    actualSource: 'RCM Performance Report · Mar 2026',
    gap: '$94M annual write-off — board unaware',
    consequence: 'December 2026 contract renewal with Ensemble. Zero leverage built. $8M penalty clause expires unclaimed.',
  },
]

const MER_STRATEGIC_TABLE = [
  { priority: 'Restore margin to 3.5%',              useCase: 'RCM denial prevention AI + Prior auth automation', value: '$47–94M/yr',               readiness: 'NOW',          timeline: '0–6 months'   },
  { priority: 'Hire CDO + restart AI programme',      useCase: 'AI governance framework + portfolio baseline',    value: '$42M accountability',       readiness: 'NOW',          timeline: '45 days'      },
  { priority: 'Complete Epic migration',               useCase: 'Epic Cogito activation + AI documentation',       value: '$34M Epic value',            readiness: 'POST MIGRATION', timeline: 'Q4 2026'    },
  { priority: 'MA Star Rating 3.2 → 4.0',             useCase: 'AI care gap closure + HEDIS automation',          value: '$17–34M CMS incentives',     readiness: 'NOW',          timeline: '0–6 months'   },
  { priority: 'Renegotiate Ensemble contract',         useCase: 'AI denial pattern analysis + SLA documentation',  value: '$8M penalty + future leverage', readiness: 'NOW',       timeline: '30 days'      },
]

// Trend data: denial rate by quarter
const MER_DENIAL_TREND = [
  { q: 'Q1 23', mer: 14.2, peer: 12.0 }, { q: 'Q2 23', mer: 14.8, peer: 12.1 },
  { q: 'Q3 23', mer: 15.4, peer: 12.0 }, { q: 'Q4 23', mer: 16.0, peer: 12.2 },
  { q: 'Q1 24', mer: 16.8, peer: 12.1 }, { q: 'Q2 24', mer: 17.1, peer: 12.0 },
  { q: 'Q3 24', mer: 17.6, peer: 12.1 }, { q: 'Q1 26', mer: 18.2, peer: 12.1 },
]

// ── Active section tracking ───────────────────────────────────────────────────
function useActiveSection(): string {
  const [active, setActive] = useState(SECTIONS[0].id)
  const obs = useRef<IntersectionObserver | null>(null)
  useEffect(() => {
    obs.current = new IntersectionObserver(
      entries => { for (const e of entries) { if (e.isIntersecting) setActive(e.target.id) } },
      { rootMargin: '-8% 0px -55% 0px', threshold: 0 }
    )
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) obs.current!.observe(el) })
    return () => obs.current?.disconnect()
  }, [])
  return active
}

// ── Sticky sub-nav ────────────────────────────────────────────────────────────
function StickyNav({ active, intel }: { active: string; intel: ClientIntelligence }) {
  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <div style={{
      position: 'sticky', top: 60, zIndex: 40, height: 50,
      background: '#fff', borderBottom: `1px solid ${LBDR}`,
      display: 'flex', alignItems: 'center', padding: '0 80px', gap: 0,
    }}>
      <span style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, letterSpacing: '.08em', marginRight: 24, whiteSpace: 'nowrap' }}>
        Intelligence · {intel.name}
      </span>
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          style={{
            fontFamily: SANS, fontSize: 13, fontWeight: active === s.id ? 700 : 400,
            color: active === s.id ? LTEXT : '#374151',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 13px', height: 50,
            display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
            borderBottom: active === s.id ? `2px solid ${LTEXT}` : '2px solid transparent',
            transition: 'color .15s, border-color .15s',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ── Org Diagram (height-constrained) ─────────────────────────────────────────
function OrgDiagram({ nodes, lines }: { nodes: OrgNode[]; lines: [string, string][] }) {
  const maxX = Math.max(...nodes.map(n => n.x)) + 120
  return (
    <div style={{ height: '320px', overflow: 'hidden' }}>
      <svg width="100%" viewBox={`0 0 ${maxX} 270`} height="270" style={{ overflow: 'hidden', display: 'block' }}>
        {lines.map(([a, b]) => {
          const na = nodes.find(n => n.id === a); const nb = nodes.find(n => n.id === b)
          if (!na || !nb) return null
          return <line key={`${a}-${b}`} x1={na.x + 50} y1={na.y + 32} x2={nb.x + 50} y2={nb.y} stroke={LBDR} strokeWidth={1.5} />
        })}
        {nodes.map(n => (
          <g key={n.id}>
            <rect x={n.x} y={n.y} width={100} height={52} rx={6}
              fill={n.id === 'ceo' ? TEAL + '18' : '#fff'}
              stroke={n.id === 'ceo' ? TEAL : LBDR} strokeWidth={1.5} />
            <text x={n.x + 50} y={n.y + 18} textAnchor="middle" fontFamily={MONO} fontSize={9} fill={LMUTE} letterSpacing=".08em">{n.role}</text>
            <text x={n.x + 50} y={n.y + 36} textAnchor="middle" fontFamily={SANS} fontSize={11} fontWeight="600" fill={LTEXT}>{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — COMPANY PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function CompanySection({ intel, isMeridian }: { intel: ClientIntelligence; isMeridian: boolean }) {
  return (
    <section id="company-profile" style={{ background: LBG, scrollMarginTop: '110px' }}>
      <div style={W}>
        {/* Opening statement */}
        <div style={{ marginBottom: 64 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 80, fontWeight: 700, color: LTEXT, lineHeight: 1.05, margin: '0 0 24px' }}>
            Intelligence
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 20, color: LBODY, lineHeight: 1.7, maxWidth: 900, margin: 0 }}>
            {isMeridian
              ? 'Epic go-live in Q3 2026. Denial rate 50% above benchmark. AI mandate with no verified path to execution. Any one of these is a board issue. All three at once is an existential risk.'
              : intel.tagline}
          </p>
        </div>

        {/* Stat grid: 6 stats in 2 rows of 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: LBDR, marginBottom: 72, border: `1px solid ${LBDR}`, borderRadius: 10, overflow: 'hidden' }}>
          {(isMeridian
            ? [
                { num: '$4.2B',      label: 'ANNUAL REVENUE'  },
                { num: '28,000',     label: 'EMPLOYEES'       },
                { num: '47',         label: 'FACILITIES'      },
                { num: 'Chicago, IL',label: 'HEADQUARTERS'    },
                { num: '1987',       label: 'FOUNDED'         },
                { num: 'Q3 2026',    label: 'EPIC GO-LIVE'    },
              ]
            : intel.company.stats.slice(0, 6).map(s => ({ num: s.value, label: s.label.toUpperCase() }))
          ).map((s, i) => (
            <div key={i} style={{ background: LBG, padding: '36px 40px' }}>
              <div style={{ fontFamily: SERIF, fontSize: 64, color: LTEXT, lineHeight: 1, marginBottom: 12 }}>{s.num}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, letterSpacing: '.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Org chart + revenue mix */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 80, alignItems: 'start', marginBottom: 64 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', marginBottom: 20 }}>ORGANIZATIONAL STRUCTURE</div>
            <OrgDiagram nodes={intel.company.orgNodes} lines={intel.company.orgLines} />
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, letterSpacing: '.1em', marginBottom: 20 }}>
              {intel.company.mixLabel || 'REVENUE MIX · PAYOR BREAKDOWN'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart width={200} height={200}>
                <Pie data={intel.company.mixData} cx={100} cy={100} innerRadius={52} outerRadius={88} dataKey="value" stroke="none">
                  {intel.company.mixData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
              </PieChart>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {intel.company.mixData.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, flexShrink: 0 }} />
                    <span style={{ fontFamily: SANS, fontSize: 14, color: LBODY }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: LTEXT, fontWeight: 700 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Critical context block — Meridian only */}
        {isMeridian && (
          <div style={{ background: LTEXT, borderRadius: 12, padding: '40px 48px' }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', marginBottom: 32 }}>WHY THIS MOMENT MATTERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
              {[
                { title: '90 days to Epic go-live', body: 'Blue Ridge division is the last site. Cerner sunset creates a hard deadline. No CDO to govern the transition. $47M implementation cost, $28M in RCM continuity risk during switch.' },
                { title: '18.2% denial rate — and climbing', body: 'Industry SLA is 12%. The gap has grown for 6 consecutive quarters. Ensemble Health Partners holds the $8M penalty clause that Meridian has never invoked. The CFO knows. The board does not.' },
                { title: '$42M committed. $0 verified.', body: 'Dr. Sarah Chen made AI the public headline at the JPMorgan Healthcare Conference. 28 initiatives active. Zero have documented outcomes against a baseline. The board meeting is Q3.' },
              ].map((c, i) => (
                <div key={i} style={{ borderLeft: i > 0 ? `1px solid #333` : 'none', paddingLeft: i > 0 ? 48 : 0 }}>
                  <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 14, lineHeight: 1.2 }}>{c.title}</div>
                  <div style={{ fontFamily: SANS, fontSize: 16, color: DBODY, lineHeight: 1.65 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — LEADERSHIP
// ─────────────────────────────────────────────────────────────────────────────
function LeadershipSection({ intel, isMeridian }: { intel: ClientIntelligence; isMeridian: boolean }) {
  const executives = isMeridian ? MER_LEADERSHIP : intel.leadership.map(e => ({
    name: e.name, title: e.title, tenure: e.tenure, background: e.background,
    drives: e.priority, howToWin: 'Align your pitch to their stated priorities and demonstrate verified outcomes.', quote: e.quote, source: e.source,
  }))

  // Power map positions for Meridian
  const powerMap = [
    { name: 'Chen (CEO)', x: 78, y: 14, color: TEAL },
    { name: 'Torres (CFO)', x: 62, y: 18, color: TEAL },
    { name: 'Nair (CTO)', x: 75, y: 58, color: '#818CF8' },
    { name: 'Park (CMO)', x: 28, y: 22, color: '#F59E0B' },
    { name: 'Anand (COO)', x: 22, y: 62, color: '#6B7280' },
  ]

  return (
    <section id="leadership" style={{ background: DBG, scrollMarginTop: '110px' }}>
      <div style={W}>
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: DTEXT, margin: '0 0 20px' }}>
            The people who will decide.
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 20, color: DMUTE, lineHeight: 1.7, maxWidth: 800, margin: 0 }}>
            Every approval, every veto, every champion — mapped before the first meeting. This is not
            a directory. It is a room-reading guide.
          </p>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr 1fr', gap: 0, marginBottom: 4, padding: '0 0 8px' }}>
          {['EXECUTIVE', 'WHAT DRIVES THEM', 'HOW TO WIN THIS ROOM', 'ON THE RECORD'].map(h => (
            <div key={h} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', paddingLeft: 24 }}>{h}</div>
          ))}
        </div>

        {/* Executive rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {executives.map((e, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '220px 1fr 1fr 1fr',
              background: DCARD, border: `1px solid ${DBDR}`,
              borderRadius: i === 0 ? '10px 10px 0 0' : i === executives.length - 1 ? '0 0 10px 10px' : 0,
              overflow: 'hidden',
            }}>
              {/* Identity */}
              <div style={{ padding: '28px 24px', borderRight: `1px solid ${DBDR}` }}>
                <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: DTEXT, marginBottom: 4 }}>{e.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', marginBottom: 10 }}>{e.title}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: DMUTE, lineHeight: 1.5 }}>
                  {e.tenure} tenure<br />{e.background}
                </div>
              </div>
              {/* Drives */}
              <div style={{ padding: '28px 24px', borderRight: `1px solid ${DBDR}` }}>
                <div style={{ fontFamily: SANS, fontSize: 15, color: DBODY, lineHeight: 1.65 }}>{e.drives}</div>
              </div>
              {/* How to win */}
              <div style={{ padding: '28px 24px', borderRight: `1px solid ${DBDR}` }}>
                <div style={{ fontFamily: SANS, fontSize: 15, color: TEAL, lineHeight: 1.65 }}>{e.howToWin}</div>
              </div>
              {/* Quote */}
              <div style={{ padding: '28px 24px' }}>
                <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 15, color: DBODY, lineHeight: 1.65, marginBottom: 12 }}>{e.quote}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: DMUTE }}>{e.source}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Power map */}
        {isMeridian && (
          <div style={{ marginTop: 64 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', marginBottom: 32 }}>DECISION POWER MAP — WHO CONTROLS WHAT</div>
            <div style={{ position: 'relative', background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, height: 320, overflow: 'hidden' }}>
              {/* Grid lines */}
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: DBDR }} />
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: DBDR }} />
              {/* Axis labels */}
              <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.08em' }}>HIGH INFLUENCE</div>
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.08em' }}>LOW INFLUENCE</div>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.08em', transformOrigin: 'center' }}>LOW URGENCY</div>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.08em', transformOrigin: 'center' }}>HIGH URGENCY</div>
              {/* Dots */}
              {powerMap.map(p => (
                <div key={p.name} style={{
                  position: 'absolute',
                  left: `${p.x}%`, top: `${p.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: SANS, fontSize: 10, color: '#fff', fontWeight: 700 }}>{p.name.split(' ')[0].slice(0, 2)}</span>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: DTEXT, marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>{p.name}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 14, color: DMUTE, textAlign: 'center' }}>
              Chen + Torres = the critical path. Neither moves without the other.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — SITUATION
// ─────────────────────────────────────────────────────────────────────────────
const MER_FINDINGS = [
  {
    id: '01', sev: 'CRITICAL', color: RED,
    title: 'Revenue cycle is in structural decline — not a blip.',
    dollar: '$94M annually — accelerating',
    rootCause: 'The 18.2% denial rate has increased 2.1pp over 18 months, driven by payer algorithm changes and a coding team that lost 14 experienced staff during the pandemic. The Epic migration will compound it — historical data shows 4–8pp denial spikes in months 3–9 post-conversion.',
    whyNow: 'Epic go-live is 90 days out. Without an interim RCM stabilisation programme before go-live, this becomes a cash crisis within 12 months.',
    genome: 'Pattern F011 · 18 engagements · 74% failure rate',
    recommendation: 'Invoke the $8M Ensemble penalty clause immediately. Begin parallel vendor evaluation. Owner: Torres (CFO). Timeline: 60 days. Expected: -3pp denial rate, $28M Year 1 recovery.',
    trendData: MER_DENIAL_TREND,
    trendMetric: 'Denial Rate (%)',
  },
  {
    id: '02', sev: 'CRITICAL', color: RED,
    title: 'Epic go-live is 40% underresourced and has a 74% failure pattern match.',
    dollar: '$28M implementation cost at risk; $47M in RCM continuity exposure',
    rootCause: 'Meridian has 2.1 FTE per go-live site versus the 3.8 FTE industry benchmark. The project plan has no interim RCM stabilisation component — the most common failure mode in the Genome (F011, 74% failure rate, 18 engagements).',
    whyNow: 'CDO vacancy means no one owns AI governance for the migration. Technical debt from the Blue Ridge transition will compound if not addressed in the next 90 days.',
    genome: 'Pattern F011 · Dual platform migration + insufficient resourcing',
    recommendation: 'Commission interim RCM stabilisation programme before go-live. Owner: Nair (CTO) + Torres (CFO). Timeline: 90 days. Cost: $2.1M. Risk avoided: $47M.',
    trendData: [
      { q: 'Q1 24', mer: 2.8, peer: 3.8 }, { q: 'Q2 24', mer: 2.6, peer: 3.8 },
      { q: 'Q3 24', mer: 2.4, peer: 3.8 }, { q: 'Q4 24', mer: 2.3, peer: 3.8 },
      { q: 'Q1 25', mer: 2.2, peer: 3.9 }, { q: 'Q2 25', mer: 2.1, peer: 3.9 },
    ],
    trendMetric: 'Implementation FTE per Site',
  },
  {
    id: '03', sev: 'CRITICAL', color: RED,
    title: 'The AI mandate has no foundation — and leadership doesn\'t know it.',
    dollar: '$3–8M in sunk pilot cost at risk; $220M in unrealised AI value delayed 18–24 months',
    rootCause: 'AI Data Readiness score of 3/10. 0 of 14 data domains have a golden record. 11 of 14 integrations are manual. Azure SQL migration incomplete. No data governance framework. No MLOps infrastructure. 28 AI pilots active — none have a production pathway.',
    whyNow: 'Dr. Sarah Chen announced AI leadership at JPMorgan Conference. Board is expecting outcomes by Q3 2026. At 3/10 readiness, no AI programme can move to production without 12–18 months of foundation work first.',
    genome: 'Pattern F019 · 14 engagements · 68% failure rate',
    recommendation: 'Immediate CDO hire with data governance mandate. Pause all 28 pilots pending baseline documentation. Owner: Chen (CEO). Timeline: 45 days.',
    trendData: [
      { q: 'Q3 24', mer: 2.2, peer: 5.2 }, { q: 'Q4 24', mer: 2.5, peer: 5.4 },
      { q: 'Q1 25', mer: 2.8, peer: 5.5 }, { q: 'Q2 25', mer: 2.9, peer: 5.6 },
      { q: 'Q3 25', mer: 3.0, peer: 5.7 }, { q: 'Q1 26', mer: 3.1, peer: 5.8 },
    ],
    trendMetric: 'AI Data Readiness (0–10)',
  },
  {
    id: '04', sev: 'HIGH', color: AMBER,
    title: 'Nurse turnover is a self-perpetuating crisis, not a market condition.',
    dollar: '$340M agency spend; $140M above peer benchmark',
    rootCause: '19% nursing turnover (industry norm: 12%) creates agency dependency which increases workload on remaining staff which increases burnout which increases turnover. The float pool programme committed to the board exists on a slide deck. No data infrastructure to run predictive staffing.',
    whyNow: 'Q4 contract renewals on 3 major travel nurse agencies. Renegotiation without a credible float pool alternative means renewal at current rates.',
    genome: 'Pattern F007 · 24 engagements · self-reinforcing attrition cycle',
    recommendation: 'Workforce intelligence programme using existing HRIS data. Predictive scheduling AI. Owner: Anand (COO). Timeline: 90 days. Expected: -$18M agency spend Year 1.',
    trendData: [
      { q: 'Q1 23', mer: 280, peer: 200 }, { q: 'Q2 23', mer: 295, peer: 198 },
      { q: 'Q3 23', mer: 305, peer: 200 }, { q: 'Q4 23', mer: 312, peer: 199 },
      { q: 'Q1 24', mer: 320, peer: 200 }, { q: 'Q2 24', mer: 330, peer: 199 },
      { q: 'Q3 24', mer: 337, peer: 200 }, { q: 'Q1 26', mer: 340, peer: 200 },
    ],
    trendMetric: 'Agency Spend ($M)',
  },
  {
    id: '05', sev: 'HIGH', color: AMBER,
    title: 'MA Star Rating decline will cost $34M in CMS incentives by August.',
    dollar: '$34M in CMS quality bonus at risk',
    rootCause: '3.2★ vs 4.0★ peer median. The gap is driven by HEDIS measure gaps in diabetes management, breast cancer screening, and medication adherence — all addressable with AI-assisted care gap closure. The August measurement window is fixed.',
    whyNow: 'The August measurement window is immovable. Miss it and the opportunity is gone for 12 months. $34M compounds annually at current trajectory.',
    genome: 'Pattern F031 · 31 engagements · care gap closure AI recovers 0.5–0.8★',
    recommendation: 'AI-assisted care gap closure programme. Owner: Park (CMO). Timeline: 6 months. Expected: +0.5–0.8★, $17–34M bonus recovered.',
    trendData: [
      { q: 'Q1 23', mer: 3.6, peer: 4.0 }, { q: 'Q2 23', mer: 3.5, peer: 4.0 },
      { q: 'Q3 23', mer: 3.4, peer: 4.1 }, { q: 'Q4 23', mer: 3.4, peer: 4.0 },
      { q: 'Q1 24', mer: 3.3, peer: 4.0 }, { q: 'Q2 24', mer: 3.3, peer: 4.0 },
      { q: 'Q3 24', mer: 3.2, peer: 4.0 }, { q: 'Q1 26', mer: 3.2, peer: 4.0 },
    ],
    trendMetric: 'MA Star Rating',
  },
]

function SituationSection({ findings: libFindings, isMeridian }: { findings: SituationFinding[]; isMeridian: boolean }) {
  const [selected, setSelected] = useState(0)
  const findings = isMeridian ? MER_FINDINGS : libFindings.map((f, i) => ({
    id: String(i + 1).padStart(2, '0'), sev: f.severity.toUpperCase(), color: f.severity === 'critical' ? RED : AMBER,
    title: f.headline, dollar: f.cost, rootCause: f.context, whyNow: f.urgency,
    genome: '', recommendation: '',
    trendData: [] as { q: string; mer: number; peer: number }[], trendMetric: '',
  }))
  const f = findings[selected]

  return (
    <section id="situation" style={{ background: LBG, scrollMarginTop: '110px' }}>
      <div style={W}>
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: LTEXT, margin: '0 0 20px' }}>
            {isMeridian ? '$224M in annual underperformance.\nAcross five measurable dimensions.' : `${findings.length} findings. Every one measurable.`}
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 20, color: LBODY, lineHeight: 1.7, maxWidth: 800, margin: 0 }}>
            {isMeridian
              ? "AbarVa's external assessment — built from primary data, not executive interviews. These findings define the real situation, independent of what leadership reports."
              : "Each finding has a dollar impact, a root cause, and a specific recommended action."}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '38% 1fr', gap: 48 }}>
          {/* Left: findings list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {findings.map((fi, i) => (
              <button key={i} onClick={() => setSelected(i)} style={{
                textAlign: 'left', padding: '20px 24px',
                background: selected === i ? '#fff' : 'transparent',
                border: `1px solid ${selected === i ? LBDR : 'transparent'}`,
                borderLeft: `4px solid ${selected === i ? fi.color : 'transparent'}`,
                borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: fi.color, letterSpacing: '.1em' }}>FINDING {fi.id}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: fi.color, background: fi.color + '18', padding: '2px 8px', borderRadius: 3 }}>{fi.sev}</span>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 14, color: LTEXT, fontWeight: selected === i ? 600 : 400, lineHeight: 1.4 }}>{fi.title}</div>
              </button>
            ))}
          </div>

          {/* Right: finding detail */}
          {f && (
            <div style={{ background: '#fff', border: `1px solid ${LBDR}`, borderRadius: 12, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Title */}
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: f.color, letterSpacing: '.1em', marginBottom: 10 }}>FINDING {f.id} — {f.sev}</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: LTEXT, margin: 0, lineHeight: 1.25 }}>{f.title}</h3>
              </div>

              {/* Dollar impact */}
              <div style={{ background: RED, borderRadius: 8, padding: '24px 28px' }}>
                <div style={{ fontFamily: SANS, fontSize: 48, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 8 }}>{f.dollar.split(' ')[0]}</div>
                <div style={{ fontFamily: SANS, fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>{f.dollar.replace(f.dollar.split(' ')[0] + ' ', '')}</div>
              </div>

              {/* Root cause */}
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.1em', marginBottom: 8 }}>ROOT CAUSE</div>
                <p style={{ fontFamily: SANS, fontSize: 16, color: LBODY, lineHeight: 1.65, margin: 0 }}>{f.rootCause}</p>
              </div>

              {/* Why now */}
              <div style={{ borderLeft: `4px solid ${TEAL}`, paddingLeft: 20, background: TEAL + '0A', borderRadius: '0 8px 8px 0', padding: '16px 20px' }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', marginBottom: 6 }}>WHY THIS MATTERS NOW</div>
                <p style={{ fontFamily: SANS, fontSize: 15, color: LBODY, lineHeight: 1.6, margin: 0 }}>{f.whyNow}</p>
              </div>

              {/* Trend chart */}
              {f.trendData.length > 0 && (
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.1em', marginBottom: 12 }}>TREND — {f.trendMetric.toUpperCase()}</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={f.trendData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                      <XAxis dataKey="q" tick={{ fontFamily: MONO, fontSize: 9, fill: LMUTE }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: MONO, fontSize: 9, fill: LMUTE }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip contentStyle={{ fontFamily: SANS, fontSize: 12, border: `1px solid ${LBDR}`, borderRadius: 6 }} />
                      <Line type="monotone" dataKey="mer" stroke={RED} strokeWidth={2.5} dot={false} name="Meridian" />
                      <Line type="monotone" dataKey="peer" stroke={LMUTE} strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Peer Median" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 20, height: 2.5, background: RED }} />
                      <span style={{ fontFamily: MONO, fontSize: 9, color: LMUTE }}>Meridian</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 20, height: 1.5, background: LMUTE, borderTop: '1px dashed', borderColor: LMUTE }} />
                      <span style={{ fontFamily: MONO, fontSize: 9, color: LMUTE }}>Peer Median</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Genome */}
              {f.genome && (
                <div style={{ background: LBG, borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.1em', marginBottom: 4 }}>GENOME SIGNAL</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: LBODY }}>{f.genome}</div>
                </div>
              )}

              {/* Recommendation */}
              <div style={{ borderTop: `1px solid ${LBDR}`, paddingTop: 20 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', marginBottom: 8 }}>ABARVA RECOMMENDATION</div>
                <p style={{ fontFamily: SANS, fontSize: 15, color: LTEXT, fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{f.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — CONTRADICTIONS
// ─────────────────────────────────────────────────────────────────────────────
function ContradictionsSection({ intel, isMeridian }: { intel: ClientIntelligence; isMeridian: boolean }) {
  const items = isMeridian ? MER_CONTRADICTIONS : intel.contradictions.map(c => ({
    topic: c.topic, stated: c.reported, statedSource: c.reportedBy,
    actual: c.actual, actualSource: c.source, gap: c.gap, consequence: 'This gap must be resolved before the next board review.',
  }))

  return (
    <section id="contradictions" style={{ background: DBG, scrollMarginTop: '110px' }}>
      <div style={W}>
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: DTEXT, margin: '0 0 20px', lineHeight: 1.1 }}>
            What leadership said.<br />What the data shows.<br />The gap is the risk.
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 20, color: DMUTE, lineHeight: 1.7, maxWidth: 800, margin: 0 }}>
            {isMeridian
              ? 'Four statements from public documents and board presentations. Four data-based rebuttals. Sources cited on both sides.'
              : 'Stated positions vs. what the data actually shows. These gaps are where risk lives.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((c, i) => (
            <div key={i} style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: i === 0 ? '10px 10px 0 0' : i === items.length - 1 ? '0 0 10px 10px' : 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', minHeight: 0 }}>
                {/* Stated */}
                <div style={{ padding: '32px 36px', borderRight: `1px solid ${DBDR}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.1em', marginBottom: 14 }}>STATED</div>
                  <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: DBODY, lineHeight: 1.6, margin: '0 0 12px' }}>{c.stated}</p>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE }}>{c.statedSource}</div>
                </div>
                {/* Actual */}
                <div style={{ padding: '32px 36px', borderRight: `1px solid ${DBDR}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: RED, letterSpacing: '.1em', marginBottom: 14 }}>WHAT THE DATA SHOWS</div>
                  <p style={{ fontFamily: SANS, fontSize: 16, color: DBODY, lineHeight: 1.65, margin: '0 0 12px' }}>{c.actual}</p>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE }}>{c.actualSource}</div>
                </div>
                {/* Gap + consequence */}
                <div style={{ padding: '32px 28px', background: '#0A0F1C' }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.1em', marginBottom: 10 }}>{c.topic}</div>
                  <div style={{ fontFamily: SANS, fontSize: 15, color: RED, fontWeight: 700, marginBottom: 16, lineHeight: 1.3 }}>THE GAP<br />{c.gap}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: RED, letterSpacing: '.08em', marginBottom: 8 }}>THE CONSEQUENCE</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: DBODY, lineHeight: 1.6 }}>{c.consequence}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Credibility strip */}
        <div style={{ marginTop: 48, background: '#0A0F1C', borderRadius: 8, padding: '20px 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: SANS, fontSize: 13, color: DMUTE, margin: 0, lineHeight: 1.7 }}>
            INTELLIGENCE SOURCES: Meridian Health Annual Report 2025 · CFO Board Presentations · CIO Town Hall recordings · AI Investment Register · Labor Cost Ledger · Epic Optimisation Audit · KLAS Research · HFMA 2025 · CMS Quality Data 2025 · AbarVa AI Readiness Assessment
          </p>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — MARKET POSITION
// ─────────────────────────────────────────────────────────────────────────────
const MER_BENCHMARKS = [
  { label: 'OPERATING MARGIN',          mer: 1.2,  peer: 3.8,  topQ: 7.1,  unit: '%',   gap: '−2.6pp', lower: false, source: 'Kaufman Hall 2025',       note: 'At peer median, Meridian would generate $109M more in operating income.' },
  { label: 'CLAIM DENIAL RATE',         mer: 18.2, peer: 12.1, topQ: 8.4,  unit: '%',   gap: '+6.1pp', lower: true,  source: 'HFMA 2025',                note: 'Closing to peer median recovers $47M annually. Closing to top quartile: $94M.' },
  { label: 'AGENCY SPEND % OF LABOUR',  mer: 24,   peer: 14,   topQ: 8,    unit: '%',   gap: '+10pp',  lower: true,  source: 'NSI Nursing Solutions 2025', note: 'Closing to peer median = $140M reduction in agency spend.' },
  { label: 'AI DATA READINESS SCORE',   mer: 3.1,  peer: 5.8,  topQ: 8.2,  unit: '/10', gap: '−2.7',   lower: false, source: 'AbarVa AI Readiness 2026',  note: 'At current score, no AI programme can reach production. Minimum: 6.0/10.' },
  { label: 'MA STAR RATING',            mer: 3.2,  peer: 4.0,  topQ: 4.5,  unit: '★',   gap: '−0.8★',  lower: false, source: 'CMS Quality Data 2025',    note: 'Each 0.5★ improvement = ~$17M in CMS quality bonuses.' },
]

const LOOP_NODES = [
  'High denial rate', 'Cash shortfall', 'Unable to invest in staffing',
  'High turnover', 'Agency dependency', 'High labour cost',
  'Low operating margin', 'Unable to invest in tech', 'Low AI readiness',
  'Cannot prove AI ROI', 'Board pressure',
]

function MarketSection({ intel, isMeridian }: { intel: ClientIntelligence; isMeridian: boolean }) {
  const benchmarks = isMeridian ? MER_BENCHMARKS : intel.benchmarks.map(b => ({
    label: b.label.toUpperCase(), mer: b.clientVal, peer: b.peerVal, topQ: b.peerVal * 1.3,
    unit: b.unit, gap: b.worse ? `+${(b.clientVal - b.peerVal).toFixed(1)}` : `−${(b.peerVal - b.clientVal).toFixed(1)}`,
    lower: b.worse, source: b.source, note: b.note,
  }))

  const exposure = intel.totalExposure || '$224M'

  return (
    <section id="market-position" style={{ background: LBG, scrollMarginTop: '110px' }}>
      <div style={W}>
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: LTEXT, margin: '0 0 20px' }}>
            {isMeridian ? 'Meridian trails its peers in every metric that matters to the board.' : `${intel.name} trails peers in every metric that matters.`}
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 20, color: LBODY, lineHeight: 1.7, maxWidth: 800, margin: 0 }}>
            {exposure} is the annual cost of underperformance against the peer median. This is not one problem — it is a compounding system failure where each metric makes the others worse.
          </p>
        </div>

        {/* Total exposure callout */}
        <div style={{ background: '#fff', border: `1px solid ${LBDR}`, borderLeft: `6px solid ${RED}`, borderRadius: 10, padding: '36px 48px', marginBottom: 56, display: 'flex', alignItems: 'center', gap: 48 }}>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 80, fontWeight: 700, color: RED, lineHeight: 1 }}>{exposure}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, letterSpacing: '.1em', marginTop: 8 }}>TOTAL IDENTIFIED EXPOSURE</div>
          </div>
          <div>
            <p style={{ fontFamily: SANS, fontSize: 18, color: LBODY, lineHeight: 1.65, margin: 0, maxWidth: 600 }}>
              Annual cost of underperformance vs peer median. This is the number the CFO needs to defend.
            </p>
          </div>
        </div>

        {/* Benchmark charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 64 }}>
          {benchmarks.map((b, i) => {
            const chartData = [
              { name: 'Meridian', value: b.mer, fill: b.lower ? (b.mer > b.peer ? RED : '#34D399') : (b.mer < b.peer ? RED : '#34D399') },
              { name: 'Peer Median', value: b.peer, fill: '#4B5563' },
              { name: 'Top Quartile', value: b.topQ, fill: '#374151' },
            ]
            const merIsBad = b.lower ? b.mer > b.peer : b.mer < b.peer

            return (
              <div key={i} style={{ background: '#fff', border: `1px solid ${LBDR}`, borderRadius: i === 0 ? '10px 10px 0 0' : i === benchmarks.length - 1 ? '0 0 10px 10px' : 0, padding: '28px 36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 48, marginBottom: 12 }}>
                  <div style={{ minWidth: 240 }}>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, letterSpacing: '.1em', marginBottom: 6 }}>{b.label}</div>
                    <div style={{ fontFamily: SANS, fontSize: 48, fontWeight: 700, color: merIsBad ? RED : '#34D399', lineHeight: 1 }}>
                      {b.gap}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, marginTop: 4 }}>vs peer median</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height={70}>
                      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <XAxis type="number" tick={{ fontFamily: MONO, fontSize: 9, fill: LMUTE }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontFamily: SANS, fontSize: 11, fill: LBODY }} axisLine={false} tickLine={false} width={90} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, j) => <Cell key={j} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ minWidth: 100, textAlign: 'right' }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: LMUTE, marginBottom: 4 }}>SOURCE</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: LBODY, fontStyle: 'italic' }}>{b.source}</div>
                  </div>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 14, color: LBODY, borderTop: `1px solid ${LBDR}`, paddingTop: 10 }}>
                  {b.note}
                </div>
              </div>
            )
          })}
        </div>

        {/* Compounding loop diagram */}
        <div style={{ background: LTEXT, borderRadius: 12, padding: '48px 56px' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', marginBottom: 16 }}>WHY THESE METRICS ARE CONNECTED</div>
          <div style={{ fontFamily: SERIF, fontSize: 28, color: '#fff', marginBottom: 32 }}>One compounding loop. Not six separate problems.</div>
          {/* Loop visualised as horizontal flow with wrap */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
            {LOOP_NODES.map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: '#1A2535', border: `1px solid #2D3F55`, borderRadius: 6, padding: '8px 16px', fontFamily: SANS, fontSize: 13, color: '#D1D5DB', whiteSpace: 'nowrap' }}>
                  {node}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 14, color: TEAL }}>→</span>
              </div>
            ))}
            <div style={{ fontFamily: SANS, fontSize: 13, color: TEAL, fontStyle: 'italic' }}>(back to start)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontSize: 56, fontWeight: 700, color: RED, lineHeight: 1 }}>{exposure}/yr</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: DMUTE, letterSpacing: '.1em', marginTop: 8 }}>COMPOUNDING ANNUALLY AT CURRENT TRAJECTORY</div>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 16, color: DMUTE, textAlign: 'center', lineHeight: 1.7, maxWidth: 700, margin: '24px auto 0' }}>
            This is not six separate problems. It is one compounding loop. Breaking it requires sequenced intervention, not isolated fixes.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — GENOME
// ─────────────────────────────────────────────────────────────────────────────
const MER_GENOME = [
  {
    id: 'F011', engagements: 18, failRate: 74, color: RED,
    name: 'Epic Without Interim RCM Stabilisation',
    forClient: 'Meridian has no interim RCM programme. Epic go-live at Blue Ridge is 90 days out. Historical data shows 4–8pp denial spikes in months 3–9 post-conversion. At $94M/yr current run-rate, a 6pp spike adds $50M in additional annual write-off.',
    priorEngagements: 'Health systems without interim RCM programmes experienced average denial rate increase of 5.8pp in the 6 months post-Epic go-live. 3 of 18 experienced covenant violations from cash flow impact.',
    recovery: 'Commission interim RCM stabilisation programme before go-live. Cost: $2.1M. Risk avoided: $47M+.',
  },
  {
    id: 'F007', engagements: 24, failRate: 61, color: AMBER,
    name: 'CFO-Led AI Transformation Without CEO Air Cover',
    forClient: 'Torres controls budget approval. Chen is setting the vision but not the implementation agenda. In 61% of comparable engagements, AI programmes where the CFO is the primary driver without active CEO sponsorship get cut before outcomes are verified.',
    priorEngagements: 'Programmes got 12–18 months of investment then were paused or restructured when the CFO faced margin pressure. The AI spend became a cost reduction target.',
    recovery: 'CEO must own the AI narrative publicly — not just the CFO. Quarterly board reviews with Chen personally presenting AI progress. Non-negotiable.',
  },
  {
    id: 'F031', engagements: 31, failRate: 55, color: AMBER,
    name: 'Dual Platform Migration + AI Simultaneously',
    forClient: 'Running Epic migration and AI transformation in parallel creates compounding disruption. IT bandwidth, governance conflicts, data team split across two programmes. In 55% of cases teams split, governance conflicts emerge, and IT bandwidth collapses within 6 months.',
    priorEngagements: 'Epic migration consuming 80% of CIO bandwidth. AI programmes competing for the remaining 20%. One of the two always loses. Usually AI.',
    recovery: 'Sequence the programmes. Epic migration completes Blue Ridge first — then AI foundation. Overlap period: data governance only, no production AI deployments.',
  },
  {
    id: 'F019', engagements: 14, failRate: 68, color: RED,
    name: 'AI Investment Without Data Governance',
    forClient: '3.1/10 AI readiness. 0 of 14 data domains have a golden record. 11 of 14 integrations are manual. In 68% of comparable engagements, AI programmes without data governance frameworks produced outputs that could not be validated — and were eventually abandoned.',
    priorEngagements: 'Pilot outputs contradicted each other because source data was inconsistent. Clinicians stopped trusting the outputs. Adoption collapsed. $8–22M in sunk costs.',
    recovery: 'CDO hire with data governance mandate before any AI programme scales. Azure SQL migration completes as prerequisite. Timeline: 6 months to 5.0/10 readiness.',
  },
]

function GenomeSection({ intel, isMeridian }: { intel: ClientIntelligence; isMeridian: boolean }) {
  const patterns = isMeridian ? MER_GENOME : intel.genome.map(g => ({
    id: g.id, engagements: g.engagements, failRate: g.failRate,
    color: g.failRate >= 65 ? RED : AMBER,
    name: g.label,
    forClient: g.desc,
    priorEngagements: g.signal,
    recovery: `Address this pattern before it becomes the primary risk. Failure rate in comparable engagements: ${g.failRate}%.`,
  }))

  return (
    <section id="genome" style={{ background: DBG, scrollMarginTop: '110px' }}>
      <div style={W}>
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: DTEXT, margin: '0 0 20px' }}>
            We have seen this organisation before.<br />Four times. In different names.
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 20, color: DMUTE, lineHeight: 1.7, maxWidth: 800, margin: 0 }}>
            The Transformation Genome aggregates outcome data from every AbarVa engagement. These patterns are not predictions — they are statistical facts from organisations that were in exactly this position.
          </p>
        </div>

        {/* Genome stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: DBDR, borderRadius: 10, overflow: 'hidden', marginBottom: 48 }}>
          {[
            { num: '340+', label: 'GENOME PATTERNS' },
            { num: '18 engagements', label: 'MATCHING THIS CLIENT TYPE' },
            { num: `${patterns.length} patterns`, label: 'MATCHED TO THIS CLIENT' },
          ].map((s, i) => (
            <div key={i} style={{ background: DCARD, padding: '36px 40px' }}>
              <div style={{ fontFamily: SERIF, fontSize: 48, color: DTEXT, lineHeight: 1, marginBottom: 12 }}>{s.num}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* What is the Genome */}
        <div style={{ borderLeft: `4px solid ${TEAL}`, paddingLeft: 28, background: DCARD, borderRadius: '0 10px 10px 0', padding: '28px 36px', marginBottom: 56 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', marginBottom: 12 }}>WHAT IS THE GENOME</div>
          <p style={{ fontFamily: SANS, fontSize: 16, color: DBODY, lineHeight: 1.7, margin: 0 }}>
            Every AbarVa engagement adds to the Genome. Failure patterns, recovery paths, vendor outcomes, timeline realities — all anonymised and aggregated. When this client uploads their data, the Genome matches it against every prior engagement automatically.
            This knowledge does not exist at any consulting firm. Their knowledge retires with the partner. Ours compounds permanently.
          </p>
        </div>

        {/* 4 pattern cards 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {patterns.map((p, i) => (
            <div key={i} style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: i === 0 ? '10px 0 0 0' : i === 1 ? '0 10px 0 0' : i === 2 ? '0 0 0 10px' : '0 0 10px 0', padding: '36px 40px' }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', marginBottom: 16 }}>
                PATTERN {p.id} · {p.engagements} ENGAGEMENTS
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <div style={{ fontFamily: SANS, fontSize: 80, fontWeight: 700, color: p.color, lineHeight: 1 }}>{p.failRate}%</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: p.color, letterSpacing: '.1em', marginBottom: 16 }}>FAILURE RATE</div>
              <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: DTEXT, marginBottom: 20, lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: DBODY, lineHeight: 1.65, marginBottom: 20 }}>{p.forClient}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#6B7280', letterSpacing: '.08em', marginBottom: 8 }}>IN PRIOR ENGAGEMENTS</div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: DMUTE, lineHeight: 1.6, marginBottom: 20 }}>{p.priorEngagements}</div>
              <div style={{ borderTop: `1px solid ${DBDR}`, paddingTop: 16 }}>
                <span style={{ fontFamily: SANS, fontSize: 14, color: TEAL }}>Recovery: {p.recovery}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Advantage statement */}
        <div style={{ marginTop: 64, textAlign: 'center', maxWidth: 760, margin: '64px auto 0' }}>
          <p style={{ fontFamily: SANS, fontSize: 20, color: DTEXT, lineHeight: 1.75, margin: 0 }}>
            No consulting firm can give you this. They have project notes from their own work, but those notes retire when the partner leaves.
            <br /><br />
            AbarVa's Genome compounds with every engagement we run — across all industries, all client types, all failure modes. By the time we walk into your first meeting, we have already run this engagement 18 times before.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — AI UNLOCK
// ─────────────────────────────────────────────────────────────────────────────
const MER_FRONT_OFFICE = [
  {
    title: 'Prior Auth Automation', status: 'NOW', connection: 'Aligned to Priority 01 — margin recovery',
    problem: "Meridian's prior auth approval rate is 23% vs 62% peer median. 40% of front-office staff time consumed. $34M referral leak unmeasured.",
    solution: 'Real-time payer rule engine eliminates manual prior auth for 78% of common procedure types. Appeals AI generates supporting documentation automatically.',
    value: '$18M/yr', data: 'Payer rules feed · CPT codes · EHR scheduling data', timeline: '3 months to deploy · Data ready',
  },
  {
    title: 'AI Care Gap Closure', status: 'NOW', connection: 'Aligned to Priority 04 — MA Star Rating',
    problem: '3.2★ costs $34M in CMS incentives. HEDIS gaps in diabetes management, breast cancer screening, and medication adherence are all closeable with targeted AI intervention.',
    solution: 'Predictive care gap identification flags at-risk patients 60 days before the measurement window. Automated outreach drives appointment completion.',
    value: '$17–34M/yr', data: 'Claims data · EHR diagnosis codes · Patient demographics', timeline: '4 months to deploy',
  },
  {
    title: 'Multilingual Communication AI', status: 'FOUNDATION REQUIRED', connection: 'Supports VBC quality scores',
    problem: '30-day readmission for non-English primary language patients is 24% higher than English-speaking cohort.',
    solution: 'Real-time translation of discharge instructions into 38 languages. AI-generated teach-back confirms comprehension.',
    value: '$6M/yr', data: 'Patient language preference data (currently inconsistent)', timeline: '6–9 months (data cleanup required)',
  },
]

const MER_MIDDLE_OFFICE = [
  {
    title: 'Predictive Staffing Intelligence', status: 'NOW', connection: 'Aligned to Priority — reduce agency dependency',
    problem: '$340M agency spend. $140M above peer benchmark. Float pool programme is a slide deck. 19% nursing turnover is self-perpetuating.',
    solution: 'ML model predicts unit-level staffing gaps 14 days out. Internal float pool is deployed first. Agency called only when float pool exhausted. Shift swap AI reduces overtime 22%.',
    value: '$18M/yr (Year 1)', data: 'HRIS shift data · Census forecasting · Historical staffing patterns', timeline: '3 months · Data exists',
  },
  {
    title: 'AI Clinical Documentation', status: 'FOUNDATION REQUIRED', connection: 'Supports CMO priority — physician burnout',
    problem: 'Physician documentation burden is the primary driver of the 62% burnout rate. Average 2.1 hours/day on documentation per physician.',
    solution: 'Ambient AI listens to patient encounters and generates draft SOAP notes. Physician reviews and approves. Integration with Epic post-go-live.',
    value: '$22M/yr', data: 'Requires Epic go-live completion at Blue Ridge first', timeline: 'Post Epic go-live Q4 2026',
  },
  {
    title: 'Sepsis Early Warning AI', status: 'FOUNDATION REQUIRED', connection: 'Clinical quality programme',
    problem: "Meridian's sepsis mortality rate is 1.8pp above peer median. Each prevented sepsis death avoids $28,000 in excess cost and significant legal exposure.",
    solution: 'Continuous vital sign monitoring with ML-based early warning 6 hours before clinical deterioration. Alerts care team with recommended intervention protocol.',
    value: '$14M/yr', data: 'Real-time EHR data stream required — dependent on Epic go-live completion', timeline: 'Q1 2027',
  },
]

const MER_BACK_OFFICE = [
  {
    title: 'AI Denial Prevention', status: 'NOW', connection: 'Aligned to Priority 01 — RCM + margin',
    problem: '18.2% denial rate. $94M/yr write-off. Payer algorithm changes are accelerating the gap. Human reviewers cannot keep pace.',
    solution: 'Pre-submission AI reviews every claim against real-time payer rules. Flags likely denials before submission. Recodes automatically where authorised. Tracks denial patterns by payer to predict future rule changes.',
    value: '$28–47M/yr', data: 'Claims data · Payer rules API · CPT/ICD coding data — all available', timeline: '60–90 days to deploy',
  },
  {
    title: 'Supply Chain Demand Forecasting', status: 'NOW', connection: 'Operational cost reduction',
    problem: 'Supply expense is 22% of revenue vs 18% peer median — $168M vs $137M. Manual purchase order process. No demand forecasting for clinical supplies.',
    solution: 'ML demand forecasting reduces overstocking and emergency orders. AI contract analysis identifies renegotiation opportunities.',
    value: '$12M/yr', data: 'ERP data · Purchasing history — available', timeline: '90 days',
  },
  {
    title: 'AI Portfolio Baseline System', status: 'NOW — URGENT', connection: 'Aligned to Priority 02 — CDO + AI accountability',
    problem: '28 active AI initiatives. Zero have documented baselines. $42M committed. CFO cannot defend this at the next board meeting.',
    solution: 'Automated baseline capture locks Day 0 metrics for every AI initiative. Monthly tracking against baseline. Board-ready reporting. Fee model proof.',
    value: '$42M accountability unlocked', data: 'Existing EHR + financial data — no new data required', timeline: '30 days to deploy',
  },
]

function UseCardGrid({ cards, dark }: { cards: typeof MER_FRONT_OFFICE; dark: boolean }) {
  const bg = dark ? DCARD : '#fff'
  const border = dark ? DBDR : LBDR
  const bodyColor = dark ? DBODY : LBODY
  const titleColor = dark ? DTEXT : LTEXT

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginTop: 40 }}>
      {cards.map((c, i) => {
        const isNow = c.status.includes('NOW')
        return (
          <div key={i} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: MONO, fontSize: 9, color: isNow ? TEAL : AMBER, background: isNow ? TEAL + '18' : AMBER + '18', padding: '3px 10px', borderRadius: 4, letterSpacing: '.08em' }}>
                {isNow ? '✓ ACHIEVABLE NOW' : '⚠ FOUNDATION REQUIRED'}
              </span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: isNow ? TEAL : AMBER }}>{c.connection}</div>
            <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: titleColor, lineHeight: 1.25 }}>{c.title}</div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: dark ? '#6B7280' : LMUTE, letterSpacing: '.08em', marginBottom: 4 }}>THE PROBLEM</div>
              <p style={{ fontFamily: SANS, fontSize: 14, color: bodyColor, lineHeight: 1.6, margin: 0 }}>{c.problem}</p>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: dark ? '#6B7280' : LMUTE, letterSpacing: '.08em', marginBottom: 4 }}>THE AI SOLUTION</div>
              <p style={{ fontFamily: SANS, fontSize: 14, color: bodyColor, lineHeight: 1.6, margin: 0 }}>{c.solution}</p>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 32, fontWeight: 700, color: TEAL }}>{c.value}</div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: dark ? '#6B7280' : LMUTE, letterSpacing: '.08em', marginBottom: 2 }}>DATA REQUIRED</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: dark ? '#6B7280' : LMUTE }}>{c.data}</div>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: dark ? DMUTE : LMUTE, marginTop: 'auto' }}>{c.timeline}</div>
          </div>
        )
      })}
    </div>
  )
}

function AIUnlockSection({ offices, isMeridian, totalValue, readiness }: {
  offices: AIOffice[]
  isMeridian: boolean
  totalValue: string
  readiness: number
}) {
  return (
    <section id="ai-unlock" style={{ background: LBG, scrollMarginTop: '110px' }}>
      <div style={W}>
        {/* Opening statement */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: LTEXT, margin: '0 0 20px', lineHeight: 1.1 }}>
            {isMeridian ? '$277M in AI value.\nMapped to Meridian\'s strategy.\nSequenced by what is achievable now.' : `${totalValue} in AI value. Mapped to your strategy.`}
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 20, color: LBODY, lineHeight: 1.7, maxWidth: 800, margin: 0 }}>
            Not a technology pitch. A value map. Every use case is tied to a stated priority, a dollar impact, a data requirement, and a timeline. Ordered by what the data can support today vs. what requires foundation work first.
          </p>
        </div>

        {/* Readiness reality check */}
        <div style={{ background: '#FEF3C7', border: `1px solid #D97706`, borderRadius: 12, padding: '32px 40px', marginBottom: 56 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#D97706', letterSpacing: '.12em', marginBottom: 20 }}>DATA READINESS REALITY</div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 48 }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 64, fontWeight: 700, color: '#D97706', lineHeight: 1, marginBottom: 16 }}>
                {readiness}/10
              </div>
              <div style={{ height: 10, background: '#E5E7EB', borderRadius: 5, marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${(readiness / 10) * 100}%`, background: '#D97706', borderRadius: 5, transition: 'width 0.8s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 9, color: '#D97706' }}>
                <span>0</span><span>THRESHOLD 6.0</span><span>10</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: LBODY, marginTop: 12 }}>
                Below the 6.0/10 threshold required for production AI deployment.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: LTEXT, marginBottom: 4 }}>What this means for the timeline:</div>
              {[
                { icon: '✓', label: 'NOW (0–6 months)', desc: '8 use cases achievable at current readiness', color: TEAL },
                { icon: '⚠', label: 'FOUNDATION REQUIRED (6–18 months)', desc: '16 use cases need data work first', color: '#D97706' },
                { icon: '●', label: 'ADVANCED (18+ months)', desc: '10 use cases need full data platform + CDO', color: LMUTE },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: MONO, fontSize: 14, color: r.color, flexShrink: 0, marginTop: 2 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: r.color, letterSpacing: '.08em' }}>{r.label}</div>
                    <div style={{ fontFamily: SANS, fontSize: 14, color: LBODY }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strategic alignment table — Meridian only */}
        {isMeridian && (
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, letterSpacing: '.12em', marginBottom: 24 }}>HOW AI MAPS TO MERIDIAN'S STATED 2026 PRIORITIES</div>
            <div style={{ border: `1px solid ${LBDR}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', background: LALT, padding: '12px 20px', borderBottom: `1px solid ${LBDR}` }}>
                {['PRIORITY', 'AI USE CASE', '$ VALUE', 'READINESS', 'TIMELINE'].map(h => (
                  <div key={h} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: LMUTE, textTransform: 'uppercase' as const }}>{h}</div>
                ))}
              </div>
              {MER_STRATEGIC_TABLE.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '16px 20px', borderBottom: i < MER_STRATEGIC_TABLE.length - 1 ? `1px solid ${LBDR}` : 'none', background: i % 2 === 0 ? '#fff' : LBG, alignItems: 'center' }}>
                  <div style={{ fontFamily: SANS, fontSize: 15, color: LTEXT }}>{row.priority}</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: LBODY }}>{row.useCase}</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: TEAL, fontWeight: 600 }}>{row.value}</div>
                  <div>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: row.readiness === 'NOW' ? TEAL : AMBER, background: row.readiness === 'NOW' ? TEAL + '18' : AMBER + '18', padding: '3px 8px', borderRadius: 3, whiteSpace: 'nowrap' as const }}>
                      {row.readiness}
                    </span>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: LBODY }}>{row.timeline}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FRONT OFFICE — dark */}
      <div style={{ background: DBG }}>
        <div style={{ ...W }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em' }}>FRONT OFFICE · PATIENT EXPERIENCE, ACCESS & FINANCIAL JOURNEY</div>
            <div style={{ fontFamily: SERIF, fontSize: 32, color: TEAL }}>$105M / yr</div>
          </div>
          <h3 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: DTEXT, margin: '0 0 0', lineHeight: 1.2 }}>
            The patient journey generates $105M in AI value. Most of it is invisible.
          </h3>
          <UseCardGrid cards={isMeridian ? MER_FRONT_OFFICE : offices.find(o => o.key === 'front')?.functions.flatMap(f => f.useCases.map(uc => ({
            title: uc.title, status: uc.timeline === '0–6 months' ? 'NOW' : 'FOUNDATION REQUIRED',
            connection: f.name, problem: uc.what, solution: uc.metric,
            value: uc.value, data: uc.data, timeline: uc.timeline,
          }))) ?? MER_FRONT_OFFICE} dark={true} />
        </div>
      </div>

      {/* MIDDLE OFFICE — light */}
      <div style={{ background: LBG }}>
        <div style={{ ...W }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em' }}>MIDDLE OFFICE · CLINICAL QUALITY, CARE MANAGEMENT & HOSPITAL OPERATIONS</div>
            <div style={{ fontFamily: SERIF, fontSize: 32, color: TEAL }}>$91M / yr</div>
          </div>
          <h3 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: LTEXT, margin: '0 0 0', lineHeight: 1.2 }}>
            Clinical operations are where the $140M labour cost problem gets solved.
          </h3>
          <UseCardGrid cards={isMeridian ? MER_MIDDLE_OFFICE : offices.find(o => o.key === 'middle')?.functions.flatMap(f => f.useCases.map(uc => ({
            title: uc.title, status: uc.timeline === '0–6 months' ? 'NOW' : 'FOUNDATION REQUIRED',
            connection: f.name, problem: uc.what, solution: uc.metric,
            value: uc.value, data: uc.data, timeline: uc.timeline,
          }))) ?? MER_MIDDLE_OFFICE} dark={false} />
        </div>
      </div>

      {/* BACK OFFICE — dark */}
      <div style={{ background: DBG }}>
        <div style={{ ...W }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em' }}>BACK OFFICE · REVENUE CYCLE, SUPPLY CHAIN, FINANCE, HR & IT</div>
            <div style={{ fontFamily: SERIF, fontSize: 32, color: TEAL }}>$81M / yr</div>
          </div>
          <h3 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: DTEXT, margin: '0 0 0', lineHeight: 1.2 }}>
            The $94M denial problem can be substantially solved by AI in 90 days.
          </h3>
          <UseCardGrid cards={isMeridian ? MER_BACK_OFFICE : offices.find(o => o.key === 'back')?.functions.flatMap(f => f.useCases.map(uc => ({
            title: uc.title, status: uc.timeline === '0–6 months' ? 'NOW' : 'FOUNDATION REQUIRED',
            connection: f.name, problem: uc.what, solution: uc.metric,
            value: uc.value, data: uc.data, timeline: uc.timeline,
          }))) ?? MER_BACK_OFFICE} dark={true} />
        </div>
      </div>

      {/* Sequencing roadmap */}
      <div style={{ background: LTEXT }}>
        <div style={W}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', marginBottom: 20 }}>HOW ABARVA SEQUENCES THIS</div>
          <h3 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, color: '#fff', margin: '0 0 40px' }}>The order matters as much as the use cases.</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            {[
              { phase: '0–3 months', label: 'QUICK WINS', color: TEAL, bg: TEAL, desc: 'Start immediately. Data ready. No foundation work required.', items: ['AI denial prevention (60 days) — $28M', 'AI portfolio baseline (30 days) — $42M accountability', 'Prior auth automation (90 days) — $18M', 'Predictive staffing (90 days) — $18M'], total: '$64M + $42M accountability' },
              { phase: '3–9 months', label: 'FOUNDATION', color: AMBER, bg: AMBER, desc: 'While Phase 1 runs. CDO hire. Data governance. Epic go-live.', items: ['CDO hire + data governance framework', 'Azure SQL migration completion', 'Epic Blue Ridge go-live', 'AI readiness 3.1 → 6.0/10'], total: 'Unlocks 16 additional use cases' },
              { phase: '9–18 months', label: 'SCALE', color: '#6B7280', bg: '#6B7280', desc: 'Full production. Data platform ready.', items: ['AI clinical documentation', 'Sepsis early warning', 'Multilingual patient communication', 'MA Star gap closure programme'], total: '+$89M/yr' },
              { phase: '18+ months', label: 'COMPOUND', color: '#fff', bg: '#333', desc: 'Platform effects. Cross-programme intelligence. Genome contribution.', items: ['Full $277M portfolio active', 'Genome contributions from Meridian', 'Cross-IDN benchmarking'], total: '$277M/yr realised' },
            ].map((ph, i) => (
              <div key={i} style={{ background: DCARD, borderTop: `4px solid ${ph.bg}`, borderRadius: 8, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: ph.color, letterSpacing: '.1em', marginBottom: 4 }}>{ph.phase}</div>
                  <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: DTEXT }}>{ph.label}</div>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: DMUTE }}>{ph.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ph.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: ph.color, flexShrink: 0, marginTop: 2 }}>•</span>
                      <span style={{ fontFamily: SANS, fontSize: 13, color: DBODY, lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', fontFamily: MONO, fontSize: 10, color: ph.color, borderTop: `1px solid ${DBDR}`, paddingTop: 14 }}>
                  TOTAL: {ph.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ background: TEAL }}>
        <div style={{ ...W, textAlign: 'center' as const }}>
          <h3 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: '#fff', margin: '0 0 20px', lineHeight: 1.2 }}>
            Meridian is 90 days from a cash crisis<br />and 30 days from a governance solution.
          </h3>
          <p style={{ fontFamily: SANS, fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: '0 0 36px' }}>
            AbarVa has run these patterns 18 times. We know exactly where to start.
          </p>
          <a href="/ai-strategy?client=meridian" style={{
            display: 'inline-block', background: '#060A12', color: '#fff', fontFamily: SANS,
            fontSize: 16, fontWeight: 700, textDecoration: 'none', padding: '16px 40px',
            borderRadius: 10,
          }}>
            Start the Engagement →
          </a>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
function IntelligenceInner() {
  const { clientId } = useClientContext()
  const intel   = getClientIntelligence(clientId)
  const findings = SITUATION_BY_CLIENT[clientId as keyof typeof SITUATION_BY_CLIENT] ?? []
  const offices  = AI_OFFICES_BY_CLIENT[clientId as keyof typeof AI_OFFICES_BY_CLIENT] ?? []
  const readiness = DATA_READINESS[clientId as keyof typeof DATA_READINESS] ?? 3.1
  const totalValue = AI_TOTAL_VALUE[clientId as keyof typeof AI_TOTAL_VALUE] ?? '$277M'
  const active = useActiveSection()
  const isMeridian = clientId === 'meridian'

  return (
    <div style={{ background: LBG }}>
      <AbarvaNav activePage="intelligence" />
      <StickyNav active={active} intel={intel} />
      <CompanySection intel={intel} isMeridian={isMeridian} />
      <LeadershipSection intel={intel} isMeridian={isMeridian} />
      <SituationSection findings={findings} isMeridian={isMeridian} />
      <ContradictionsSection intel={intel} isMeridian={isMeridian} />
      <MarketSection intel={intel} isMeridian={isMeridian} />
      <GenomeSection intel={intel} isMeridian={isMeridian} />
      <AIUnlockSection offices={offices} isMeridian={isMeridian} totalValue={totalValue} readiness={readiness} />
    </div>
  )
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', background: LBG }} />}>
      <IntelligenceInner />
    </Suspense>
  )
}
