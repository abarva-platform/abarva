'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG = '#F8F7F4', WHITE = '#0C0C0C', MUTED = '#3C3C3C', DIM = '#888888'
const TEAL = '#2DD4C8', AMBER = '#F59E0B', GREEN = '#34D399', RED = '#EF4444'
const DARK = '#060A12', DTEXT = '#EFF6FF'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'
const BORDER = '#E2E1DC', CARD = '#FFFFFF'

const CLIENTS = [
  {
    id: 'arcturus', name: 'Arcturus Financial Group', short: 'Arcturus',
    industry: 'Financial Services · Wealth Management', color: '#818CF8',
    hq: 'London', revenue: '$8.4B AUM', employees: '4,200',
    headline: '$94M committed to AI. Zero verified return.',
    gap: '$840M efficiency gap · C/I ratio 71% vs 58% peer',
    solutions: [
      { name: 'Margin Optimization', slug: 'margin', phase: 1, progress: 40, outcome: '$60–120M/yr' },
      { name: 'Technology Modernization', slug: 'tech', phase: 0, progress: 60, outcome: '34/100 readiness' },
      { name: 'AI-Powered PDLC', slug: 'pdlc', phase: 0, progress: 100, outcome: '+40% velocity' },
      { name: 'AI Strategy Engagement', slug: 'ai-strategy', phase: 1, progress: 55, outcome: '$140M 3yr IRR' },
    ],
    tags: ['FinServ', 'AI Portfolio', 'MAS FEAT', 'Bloomberg AIM'],
  },
  {
    id: 'meridian', name: 'Meridian Health System', short: 'Meridian',
    industry: 'Healthcare · Integrated Delivery Network', color: TEAL,
    hq: 'Charlotte NC', revenue: '$11.2B', employees: '42,000',
    headline: '$94M in denial write-offs. Ensemble missing SLAs.',
    gap: '$247M operating gap · 1.8% margin vs 4.0% target',
    solutions: [
      { name: 'Technology Modernization', slug: 'tech', phase: 1, progress: 65, outcome: '$94M/yr recovered' },
      { name: 'Margin Optimization', slug: 'margin', phase: 0, progress: 30, outcome: '$220M gap' },
      { name: 'AI-Powered PDLC', slug: 'pdlc', phase: 0, progress: 20, outcome: '85% prior-auth rate' },
    ],
    tags: ['Epic', 'RCM', 'Prior Auth AI', 'HIPAA'],
  },
  {
    id: 'apexretail', name: 'Apex Retail Group', short: 'Apex Retail',
    industry: 'Omnichannel Retail · 800 Stores', color: AMBER,
    hq: 'Columbus OH', revenue: '$12.4B', employees: '28,000',
    headline: '800 stores. A website that does not talk to them.',
    gap: '$272M margin shortfall · SAP ECC end-of-life 2027',
    solutions: [
      { name: 'Technology Modernization', slug: 'tech', phase: 0, progress: 15, outcome: '$248M e-com gap' },
      { name: 'Margin Optimization', slug: 'margin', phase: 0, progress: 0, outcome: '$272M shortfall' },
      { name: 'AI-Powered PDLC', slug: 'pdlc', phase: 0, progress: 0, outcome: '+40% forecast acc.' },
    ],
    tags: ['SAP S/4HANA', 'Salesforce CC', 'o9', 'GCP'],
  },
]

const AVR_PHASES = [
  {
    phase: 1, label: 'DIAGNOSE', color: '#4DA3FF',
    desc: 'What is broken, what it costs, and why it keeps happening.',
    modules: [
      { name: 'Situation Intelligence', desc: 'Every gap quantified. Genome pattern matched. Root cause identified.', path: '/diagnose', deliverable: 'Situation Brief' },
      { name: 'Contradiction Intelligence', desc: 'What leadership told the board vs what the data actually shows.', path: '/contradictions', deliverable: 'Contradiction Report' },
      { name: 'Data Intelligence', desc: 'Data readiness scored across 12 dimensions. Gaps blocking AI named.', path: '/data-intelligence', deliverable: 'Data Readiness Score' },
    ],
  },
  {
    phase: 2, label: 'PRESCRIBE', color: AMBER,
    desc: 'Which systems to fix first, which vendor wins, what to build.',
    modules: [
      { name: 'Technology Intelligence', desc: 'Every system scored: age, cost, dependency depth, migration risk.', path: '/intelligence', deliverable: 'Tech Modernization Sequence' },
      { name: 'Vendor Intelligence', desc: 'SI vendors scored against Genome outcomes for your specific context.', path: '/vendor-intelligence', deliverable: 'Vendor Scorecard' },
      { name: 'Architecture Intelligence', desc: 'Target state AI stack blueprint. Current vs target. Build sequence.', path: '/architecture', deliverable: 'Architecture Blueprint' },
      { name: 'Business Case Intelligence', desc: 'CFO-grade case. Bear/Base/Bull scenarios. Genome-validated IRR.', path: '/justify', deliverable: 'IC Package' },
    ],
  },
  {
    phase: 3, label: 'VALUE REALIZATION', color: GREEN,
    desc: 'Execute. Track every metric. Earn the fee only when outcomes are verified.',
    modules: [
      { name: 'AI Delivery Intelligence', desc: 'Portfolio rationalized. Blockers removed. Models to production.', path: '/ai-pdlc', deliverable: 'Delivery Roadmap' },
      { name: 'Outcome Intelligence', desc: 'Baseline locked Day 0. Monthly actuals. 15–20% of verified savings.', path: '/outcome-intelligence', deliverable: 'Outcome Report + Fee' },
    ],
  },
]

const ENGAGEMENT_PHASES = [
  { n: 0, label: 'Readiness Assessment', desc: 'Datasets uploaded and scored. Genome patterns matched. Go/no-go.', output: 'Readiness Scorecard', gate: 'Maestro approves' },
  { n: 1, label: 'Diagnose', desc: 'Contradiction + Data Intelligence. Full situation brief produced.', output: 'Situation Brief', gate: 'CEO approves' },
  { n: 2, label: 'Prescribe', desc: 'Technology + Vendor + Architecture + Business Case.', output: 'AI Readiness Certificate', gate: 'CTO + CIO approve' },
  { n: 3, label: 'Justify & Build', desc: 'Investment committee package. Execution roadmap locked.', output: 'IC Package + Baseline', gate: 'CFO + Board approve' },
  { n: 4, label: 'Execute & Verify', desc: 'Baseline locked Day 0. Monthly tracking. Outcome share earned.', output: 'Outcome Report + Fee', gate: 'Ongoing verification' },
]

const USE_CASES = [
  { industry: 'FinServ', color: '#818CF8', title: 'AI Portfolio Rationalization', desc: '28 initiatives → 5 funded. $94M redeployed. Every surviving initiative has a baseline and owner.', client: 'Arcturus', slug: 'arcturus/ai-strategy' },
  { industry: 'FinServ', color: '#818CF8', title: 'MAS FEAT Compliance', desc: 'Regulatory debt mapped. Remediation squad in place. FCA review prep before Q3 deadline.', client: 'Arcturus', slug: 'arcturus/pdlc' },
  { industry: 'FinServ', color: '#818CF8', title: 'Bloomberg AIM Renegotiation', desc: '$8.4M annual contract. December 2026 renewal window. Negotiation strategy from audit.', client: 'Arcturus', slug: 'arcturus/tech' },
  { industry: 'Healthcare', color: TEAL, title: 'Prior Auth AI — Epic Native', desc: '23% → 85%+ auto-approval. Claude on Azure inside HIPAA boundary. No vendor swap required.', client: 'Meridian', slug: 'meridian/tech' },
  { industry: 'Healthcare', color: TEAL, title: 'RCM Vendor Recovery', desc: 'Ensemble at $48M/yr missing SLA. $8M penalty clause activated. Denial rate 18.2% → 8.4%.', client: 'Meridian', slug: 'meridian/margin' },
  { industry: 'Healthcare', color: TEAL, title: 'Epic Optimization — 47 Modules', desc: '12 of 47 Cogito dashboards live. Unlock all 47. $340M IT budget actually delivering.', client: 'Meridian', slug: 'meridian/tech' },
  { industry: 'Retail', color: AMBER, title: 'SAP S/4HANA Migration', desc: 'ECC 6.0 support ends 2027. 8,400 → 2,100 customizations. Migration sequence from Genome.', client: 'Apex Retail', slug: 'apexretail/tech' },
  { industry: 'Retail', color: AMBER, title: 'Omnichannel Unification', desc: '800 stores + Salesforce CC disconnected. BOPIS live. Conversion 2.8% → 4.1%.', client: 'Apex Retail', slug: 'apexretail/tech' },
  { industry: 'Retail', color: AMBER, title: 'Demand Forecast AI', desc: 'o9 40% → 100% deployed. Forecast accuracy 62% → 84%. $180M excess inventory released.', client: 'Apex Retail', slug: 'apexretail/pdlc' },
]

export default function DemoExplorePage() {
  const [activeClient, setActiveClient] = useState('arcturus')
  const client = CLIENTS.find(c => c.id === activeClient)!

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="demo" />

      {/* Back bar */}
      <div style={{ background: DARK, borderBottom: '1px solid rgba(45,212,200,0.15)', padding: '8px 48px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/demo" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: TEAL, textDecoration: 'none' }}>← Guided Demo</a>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(239,246,255,0.3)' }}>·</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(239,246,255,0.4)', letterSpacing: '.1em' }}>SELF-SERVE REFERENCE</span>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{ background: DARK, padding: '48px 48px 44px', borderBottom: '1px solid #1C2D45' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
            AbarVa · Self-Serve Demo Reference · All clients pre-loaded
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: '36px', color: DTEXT, lineHeight: 1.2, marginBottom: '16px', fontWeight: 400 }}>
            Three clients. Nine intelligence modules. One complete transformation.
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(239,246,255,0.6)', maxWidth: '600px', lineHeight: 1.7, marginBottom: '28px' }}>
            Every engagement is pre-loaded with real client data. Walk the full Maestro workflow — from readiness assessment to verified outcome.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href="/admin/client/arcturus" style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, padding: '10px 20px', borderRadius: '8px', background: TEAL, color: DARK, textDecoration: 'none' }}>
              Open Maestro — Arcturus →
            </a>
            <a href="/admin/client/meridian" style={{ fontFamily: MONO, fontSize: '12px', padding: '10px 20px', borderRadius: '8px', background: 'rgba(45,212,200,0.1)', border: '1px solid rgba(45,212,200,0.3)', color: TEAL, textDecoration: 'none' }}>
              Meridian Health →
            </a>
            <a href="/admin/client/apexretail" style={{ fontFamily: MONO, fontSize: '12px', padding: '10px 20px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: AMBER, textDecoration: 'none' }}>
              Apex Retail →
            </a>
          </div>
        </div>
      </div>

      {/* ── THREE CLIENTS ────────────────────────────────────────────────── */}
      <div style={{ padding: '56px 48px', background: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Three Clients · Three Industries · Three Situations</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '26px', color: WHITE, marginBottom: '28px', fontWeight: 400 }}>Each client demonstrates the same platform in a different context.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {CLIENTS.map(c => (
              <div key={c.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `4px solid ${c.color}`, borderRadius: '10px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, letterSpacing: '.1em', textTransform: 'uppercase' }}>{c.industry}</div>
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: WHITE, marginBottom: '4px' }}>{c.name}</div>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, marginBottom: '14px' }}>{c.revenue} · {c.employees} employees · {c.hq}</div>
                <div style={{ fontFamily: SERIF, fontSize: '15px', color: WHITE, lineHeight: 1.4, marginBottom: '10px' }}>"{c.headline}"</div>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: RED, marginBottom: '18px' }}>{c.gap}</div>
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '14px', marginBottom: '16px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Active Solutions</div>
                  {c.solutions.map((s, i) => (
                    <a key={i} href={`/engage/${c.id}/${s.slug}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < c.solutions.length - 1 ? `1px solid ${BORDER}` : 'none', textDecoration: 'none' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: WHITE }}>{s.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>Ph{s.phase} · {s.progress}%</div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL }}>{s.outcome}</div>
                      </div>
                    </a>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '16px' }}>
                  {c.tags.map(t => (
                    <span key={t} style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 7px', borderRadius: '3px', background: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30` }}>{t}</span>
                  ))}
                </div>
                <a href={`/admin/client/${c.id}`} style={{ display: 'block', fontFamily: MONO, fontSize: '10px', fontWeight: 700, padding: '9px 0', borderRadius: '6px', background: `${c.color}15`, border: `1px solid ${c.color}40`, color: c.color, textDecoration: 'none', textAlign: 'center' as const }}>
                  Open in Maestro →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI VALUE REALIZATION — 9 MODULES ────────────────────────────── */}
      <div style={{ background: DARK, padding: '56px 48px', borderBottom: '1px solid #1C2D45' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>AI Value Realization · 9 Intelligence Modules</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '26px', color: DTEXT, marginBottom: '36px', fontWeight: 400 }}>Three phases. Nine modules. Every CXO question answered before the board asks it.</h2>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '28px' }}>
            {AVR_PHASES.map(phase => (
              <div key={phase.phase}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: `${phase.color}20`, border: `1px solid ${phase.color}50`, color: phase.color, letterSpacing: '.1em' }}>
                    PHASE {phase.phase} · {phase.label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(239,246,255,0.5)' }}>{phase.desc}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${phase.modules.length},1fr)`, gap: '12px' }}>
                  {phase.modules.map((m, i) => (
                    <a key={i} href={m.path} style={{ display: 'block', background: '#161B22', border: '1px solid #21262D', borderTop: `3px solid ${phase.color}`, borderRadius: '8px', padding: '18px 20px', textDecoration: 'none' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: phase.color, letterSpacing: '.1em', marginBottom: '6px' }}>MODULE {(phase.phase - 1) * (phase.phase === 1 ? 1 : phase.phase === 2 ? 3 : 7) + i + 1}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: DTEXT, marginBottom: '6px' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(239,246,255,0.5)', lineHeight: 1.5, marginBottom: '14px' }}>{m.desc}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '3px', background: `${phase.color}15`, color: phase.color }}>→ {m.deliverable}</span>
                        <span style={{ fontFamily: MONO, fontSize: '10px', color: TEAL }}>Open →</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ENGAGEMENT WORKFLOW ──────────────────────────────────────────── */}
      <div style={{ padding: '56px 48px', background: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Maestro Engagement · 5-Phase Workflow</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '26px', color: WHITE, marginBottom: '8px', fontWeight: 400 }}>How a Maestro orchestrates a client engagement end-to-end.</h2>
          <p style={{ fontSize: '14px', color: MUTED, marginBottom: '12px' }}>Select a client to see their specific engagement entry points.</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
            {CLIENTS.map(c => (
              <button key={c.id} onClick={() => setActiveClient(c.id)}
                style={{ fontFamily: MONO, fontSize: '11px', padding: '7px 18px', borderRadius: '20px', border: `1px solid ${activeClient === c.id ? c.color : BORDER}`, background: activeClient === c.id ? `${c.color}15` : 'transparent', color: activeClient === c.id ? c.color : MUTED, cursor: 'pointer' }}>
                {c.short}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '28px' }}>
            {ENGAGEMENT_PHASES.map((p, i) => (
              <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `3px solid ${i === 0 ? TEAL : i < 3 ? '#4DA3FF' : i === 3 ? AMBER : GREEN}`, borderRadius: '8px', padding: '18px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, marginBottom: '4px' }}>PHASE {p.n}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: WHITE, marginBottom: '8px' }}>{p.label}</div>
                <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.5, marginBottom: '12px' }}>{p.desc}</div>
                <div style={{ fontFamily: MONO, fontSize: '9px', padding: '3px 8px', borderRadius: '3px', background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', marginBottom: '8px', display: 'inline-block' }}>→ {p.output}</div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>{p.gate}</div>
              </div>
            ))}
          </div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: client.color }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: WHITE }}>{client.name} — Live Engagements</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${client.solutions.length},1fr)`, gap: '12px' }}>
              {client.solutions.map((s, i) => {
                const statusColor = s.progress === 100 ? GREEN : s.progress > 0 ? TEAL : AMBER
                return (
                  <a key={i} href={`/engage/${client.id}/${s.slug}`} style={{ display: 'block', padding: '16px', border: `1px solid ${BORDER}`, borderTop: `3px solid ${statusColor}`, borderRadius: '8px', textDecoration: 'none' }}>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, marginBottom: '4px', textTransform: 'uppercase' as const }}>Phase {s.phase}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: WHITE, marginBottom: '4px' }}>{s.name}</div>
                    <div style={{ height: '3px', background: BORDER, borderRadius: '2px', marginBottom: '8px' }}>
                      <div style={{ height: '3px', borderRadius: '2px', width: `${s.progress}%`, background: statusColor }} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL }}>{s.outcome}</div>
                  </a>
                )
              })}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <a href={`/admin/client/${client.id}`} style={{ fontFamily: MONO, fontSize: '11px', padding: '8px 20px', borderRadius: '6px', background: `${client.color}15`, border: `1px solid ${client.color}40`, color: client.color, textDecoration: 'none' }}>
                Open {client.short} in Maestro →
              </a>
              <a href={`/engage/${client.id}/${client.solutions[0].slug}`} style={{ fontFamily: MONO, fontSize: '11px', padding: '8px 20px', borderRadius: '6px', background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.2)', color: TEAL, textDecoration: 'none' }}>
                Jump to first engagement →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── KEY USE CASES ────────────────────────────────────────────────── */}
      <div style={{ background: DARK, padding: '56px 48px', borderBottom: '1px solid #1C2D45' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>9 Use Cases · 3 Industries</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '26px', color: DTEXT, marginBottom: '32px', fontWeight: 400 }}>Every use case links to live demo data.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            {USE_CASES.map((uc, i) => (
              <a key={i} href={`/engage/${uc.slug}`} style={{ display: 'block', background: '#161B22', border: '1px solid #21262D', borderLeft: `3px solid ${uc.color}`, borderRadius: '8px', padding: '18px 20px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '3px', background: `${uc.color}20`, color: uc.color }}>{uc.industry}</span>
                  <span style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(239,246,255,0.35)' }}>{uc.client}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: DTEXT, marginBottom: '6px' }}>{uc.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(239,246,255,0.5)', lineHeight: 1.5, marginBottom: '10px' }}>{uc.desc}</div>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL }}>Open demo →</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── DELIVERABLES REFERENCE ───────────────────────────────────────── */}
      <div style={{ padding: '56px 48px', background: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>What Gets Produced</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '26px', color: WHITE, marginBottom: '28px', fontWeight: 400 }}>Every phase produces a board-ready deliverable.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '2px', background: BORDER, borderRadius: '10px', overflow: 'hidden' }}>
            {[
              { phase: 'Phase 0', bg: '#F0F9FF', accent: TEAL, deliverable: 'Readiness Scorecard', items: ['Overall readiness score /100', 'Genome patterns matched', 'Dimension scores across 5 axes', 'Recommended action'] },
              { phase: 'Phase 1', bg: '#EFF6FF', accent: '#4DA3FF', deliverable: 'Situation Brief', items: ['Every contradiction surfaced', 'Data gaps mapped', 'Root causes named', 'CEO-ready summary'] },
              { phase: 'Phase 2', bg: '#FFFBEB', accent: AMBER, deliverable: 'AI Readiness Certificate', items: ['Tech modernization sequence', 'Vendor scorecard', 'Architecture blueprint', 'Risk-adjusted options'] },
              { phase: 'Phase 3', bg: '#F0FDF4', accent: '#15803D', deliverable: 'IC Package + Baseline', items: ['Bear/Base/Bull scenarios', 'Genome-validated IRR', 'Execution roadmap', 'Baseline locked Day 0'] },
              { phase: 'Phase 4', bg: '#FFF7ED', accent: '#C2410C', deliverable: 'Outcome Report + Fee', items: ['Actuals vs baseline monthly', 'Verified savings delta', '15–20% AbarVa share', 'Board-ready proof'] },
            ].map((d, i) => (
              <div key={i} style={{ background: d.bg, padding: '20px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: d.accent, letterSpacing: '.08em', marginBottom: '6px' }}>{d.phase}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: WHITE, marginBottom: '12px' }}>{d.deliverable}</div>
                {d.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ color: d.accent, fontSize: '10px', marginTop: '1px', flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: '11px', color: MUTED, lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV ───────────────────────────────────────────────────── */}
      <div style={{ background: DARK, padding: '36px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap' as const, gap: '10px', justifyContent: 'center' }}>
          {[
            { label: 'Arcturus Maestro', href: '/admin/client/arcturus', color: '#818CF8' },
            { label: 'Meridian Maestro', href: '/admin/client/meridian', color: TEAL },
            { label: 'Apex Retail Maestro', href: '/admin/client/apexretail', color: AMBER },
            { label: 'Situation Intelligence', href: '/diagnose', color: '#4DA3FF' },
            { label: 'Contradiction Intelligence', href: '/contradictions', color: '#4DA3FF' },
            { label: 'Data Intelligence', href: '/data-intelligence', color: '#4DA3FF' },
            { label: 'Technology Intelligence', href: '/intelligence', color: AMBER },
            { label: 'Vendor Intelligence', href: '/vendor-intelligence', color: AMBER },
            { label: 'Architecture Intelligence', href: '/architecture', color: AMBER },
            { label: 'Business Case Intelligence', href: '/justify', color: AMBER },
            { label: 'AI Delivery Intelligence', href: '/ai-pdlc', color: GREEN },
            { label: 'Outcome Intelligence', href: '/outcome-intelligence', color: GREEN },
          ].map((l, i) => (
            <a key={i} href={l.href} style={{ fontFamily: MONO, fontSize: '10px', padding: '5px 12px', borderRadius: '4px', background: `${l.color}12`, border: `1px solid ${l.color}30`, color: l.color, textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
