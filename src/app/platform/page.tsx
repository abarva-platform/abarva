'use client'
import { useState, useRef, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG    = '#FAFAF9'
const BG2   = '#F2F1F0'
const DARK  = '#0F0E0D'
const TEXT  = '#3C3C3C'
const MUTED = '#706D66'
const BORDER= '#E8E6E3'
const TEAL  = '#2DD4C8'
const MONO  = "'Courier New', monospace"
const SERIF = 'Georgia, serif'
const SANS  = "'DM Sans', sans-serif"

const ARCH_LAYERS = [
  {
    num: '05',
    icon: '👥',
    layerLabel: 'Layer 05 · User Layer',
    title: 'Maestros & Clients',
    desc: 'Human operators running AI-powered engagements from inside the client. CXO-facing client portal for approvals and Board Pack access. Outcomes tracked against immutable Day-0 baselines — fee loop closes only on verified savings.',
    tags: ['Maestro Workspace', 'Client Portal', 'Engagement Tracking', 'Phase Gate Approvals', 'Outcome Verification', 'Baseline Lock'],
    featured: false,
  },
  {
    num: '04',
    icon: '⚙️',
    layerLabel: 'Layer 04 · Orchestration',
    title: 'Workflow & AI Orchestration',
    desc: 'Engagement workflows triggered by intelligence signals. The AI Analyst routes tasks, escalates exceptions, tracks milestone completion in real time, and surfaces contradictions before they become blockers. 18-step AVR Navigator drives every engagement from Phase 0 through fee calculation.',
    tags: ['AVR Navigator (18 steps)', 'AI Step Routing', 'Milestone Tracking', 'Escalation Engine', 'Deliverable Generation', 'Contradiction Detection'],
    featured: false,
  },
  {
    num: '03',
    icon: '🔗',
    layerLabel: 'Layer 03 · Intelligence Products',
    title: 'The 5 Intelligence Products',
    desc: 'Five specialised AI products built on AbarNexus patterns — each purpose-built for a specific phase of the engagement lifecycle. Situation Intelligence (Phase 0), Contradiction (Phase 1), Vendor + Business Case (Phase 2), Outcome (Phase 3-4). All feed structured outputs to the Orchestration layer.',
    tags: ['Situation Intelligence', 'Contradiction Intelligence', 'Vendor Intelligence', 'Business Case Intelligence', 'Outcome Intelligence'],
    featured: false,
  },
  {
    num: '02',
    icon: '🧬',
    layerLabel: 'Layer 02 · Knowledge Layer · PROPRIETARY',
    title: 'AbarNexus',
    desc: 'The proprietary knowledge layer that sits between foundation AI and every engagement. 340+ transformation patterns. Peer benchmarks. Vendor track records. Domain models for healthcare, financial services, and retail. Built from real engagements — updated with every client. The 50th client benefits from the first 49.',
    tags: ['340+ Genome Patterns', 'Peer Benchmarks', 'Vendor Intelligence DB', 'Domain Models (3 verticals)', 'Outcome Baselines', 'Compounds with every engagement'],
    featured: true,
  },
  {
    num: '01',
    icon: '⚡',
    layerLabel: 'Layer 01 · Foundation AI',
    title: 'Claude · Anthropic',
    desc: 'Best-in-class foundation models deployed across all three hyperscalers. Enterprise data governance — zero training on client data. Reproducible reasoning, structured outputs, SOC 2 Type II. The only foundation model with the context window and reasoning capability required for enterprise transformation work.',
    tags: ['Claude Sonnet 4', 'AWS Bedrock', 'Azure AI Foundry', 'Google Vertex AI', 'Zero Client Data Training', 'SOC 2 Type II'],
    featured: false,
  },
]

const SOLUTIONS = [
  {
    vertical: 'Healthcare', verticalClass: 'healthcare',
    title: 'RCM AI — Denial Prevention',
    body: 'Identify and close the denial rate gap against peer benchmarks. Surface vendor SLA breaches. Deploy AI denial prediction pre-Epic. Baseline locked Day 0.',
    value: '$28–94M', valueLbl: 'annual recovery per deployment',
    modules: ['Situation Intelligence', 'Contradiction Intelligence', 'Vendor Intelligence', 'Outcome Intelligence'],
    footer: 'AbarNexus: F011 pattern · 47 comparable deployments →',
  },
  {
    vertical: 'Healthcare', verticalClass: 'healthcare',
    title: 'Epic AI Integration',
    body: 'Integrate AI natively into Epic go-live. Prior auth automation, denial prediction, and real-time clinical decision support — built before go-live, not retrofitted after.',
    value: '$14–22M', valueLbl: 'avoided retrofit cost + $40M AI capability',
    modules: ['Technology Intelligence', 'Architecture Intelligence', 'Business Case Intelligence'],
    footer: 'AbarNexus: F003 pattern · Epic go-live benchmark data →',
  },
  {
    vertical: 'Financial Services', verticalClass: 'finserv',
    title: 'Cost-to-Income Reduction',
    body: 'Baseline all AI initiatives. Terminate zero-ROI spend. Renegotiate vendor contracts using Genome benchmark data. Build the C/I tracking infrastructure for sustainable improvement.',
    value: '$40–120M', valueLbl: 'annual C/I improvement',
    modules: ['Situation Intelligence', 'Vendor Intelligence', 'Business Case Intelligence', 'Outcome Intelligence'],
    footer: 'AbarNexus: F007 pattern · 31 comparable asset managers →',
  },
  {
    vertical: 'Retail', verticalClass: 'retail',
    title: 'Azure + Databricks Modernisation',
    body: 'Plan and execute the migration from legacy on-premise to Azure + Databricks Medallion architecture. FinOps governance, ERP unification, and AI use case foundation in one programme.',
    value: '$47–280M', valueLbl: 'annual value at full deployment',
    modules: ['Technology Intelligence', 'Architecture Intelligence', 'Vendor Intelligence', 'Business Case Intelligence'],
    footer: 'AbarNexus: F003 pattern · 34 comparable retail deployments →',
  },
  {
    vertical: 'Universal', verticalClass: 'universal',
    title: 'AI Investment Accountability',
    body: 'Baseline every AI programme in the portfolio. Identify zero-ROI spend. Accelerate high-potential programmes. Build the governance model that makes the board confident in AI spend.',
    value: '$20–60M', valueLbl: 'released from zero-ROI initiatives',
    modules: ['Situation Intelligence', 'Contradiction Intelligence', 'Business Case Intelligence'],
    footer: 'AbarNexus: F007 + F027 patterns · cross-vertical →',
  },
  {
    vertical: 'Universal', verticalClass: 'universal',
    title: 'Vendor Spend Optimisation',
    body: 'Benchmark all major vendor contracts against AbarNexus peer data. Identify SLA breaches, unused penalty clauses, and renegotiation windows. Recover value from existing spend before new procurement.',
    value: '$3–40M', valueLbl: 'per engagement from existing contracts',
    modules: ['Contradiction Intelligence', 'Vendor Intelligence', 'Business Case Intelligence'],
    footer: 'AbarNexus: Vendor DB · SLA pattern library · cross-vertical →',
  },
]

const VENDORS = [
  { name: 'Leading RCM Outsourcing Vendor', context: 'Healthcare · 47 Genome deployments', finding: '74% SLA breach rate', detail: 'Penalty clauses invoked in only 12% of cases', color: '#991B1B' },
  { name: 'Enterprise Financial Data Platform', context: 'Financial Services · 31 Genome deployments', finding: '38% above peer benchmark', detail: '3-year renewal typically achieves 30% reduction', color: '#B45309' },
  { name: 'Leading EHR Platform — Epic Integration', context: 'Healthcare · 28 Genome deployments', finding: '79% retrofit risk post-go-live', detail: 'Pre-go-live integration window: Months 1–8 only', color: '#B45309' },
  { name: 'BI Analytics Platform (Top 3)', context: 'Universal · 34 Genome deployments', finding: '68% consolidation success', detail: 'Avg $6.3M/yr saved consolidating from 3+ tools', color: '#166534' },
  { name: 'Cloud Infrastructure Provider (All 3)', context: 'Universal · 40+ Genome deployments', finding: '41% waste in unmanaged estates', detail: 'FinOps governance recovers $12-39M in Year 1', color: '#B45309' },
]

const USE_CASES = [
  {
    vertical: 'Healthcare · Revenue Cycle', accent: '#991B1B',
    title: 'Denial Rate Gap — Vendor SLA Never Enforced',
    body: 'Denial rate running above contracted SLA for multiple quarters with no enforcement action. Penalty clause available but never invoked. Board unaware of full financial exposure.',
    value: '$28–94M', valueLbl: '/yr recoverable',
    modules: ['Situation Intelligence', 'Contradiction Intelligence', 'F011 Pattern'],
  },
  {
    vertical: 'Healthcare · Technology', accent: TEAL,
    title: 'Epic AI Integration — Pre-Go-Live Window',
    body: 'Epic go-live approaching with no AI integration plan. The 8-month pre-go-live window is the only cost-effective path. After go-live, retrofitting costs 40% more and takes 18 months longer.',
    value: '$14–22M', valueLbl: 'avoided retrofit + AI capability',
    modules: ['Technology Intelligence', 'Architecture Intelligence', 'F003 Pattern'],
  },
  {
    vertical: 'Financial Services · Cost', accent: '#B45309',
    title: '$94M AI Committed — Zero ROI Baseline',
    body: 'Large AI portfolio with no outcome baselines — $94M categorised as investment with zero return metrics. Board pressure on C/I ratio but no programme has a named owner or measurement framework.',
    value: '$20–60M', valueLbl: 'released from zero-ROI initiatives',
    modules: ['Situation Intelligence', 'Business Case Intelligence', 'F007 Pattern'],
  },
  {
    vertical: 'Financial Services · Vendor', accent: '#B45309',
    title: 'Vendor Contract Overspend vs Peer Benchmark',
    body: 'Major data platform vendor contract significantly above peer benchmark for comparable AUM. SLA credits unclaimed across 18+ months. 3-year renewal window approaching — optimal negotiation timing.',
    value: '$3–15M', valueLbl: '/yr from contract renegotiation',
    modules: ['Contradiction Intelligence', 'Vendor Intelligence', 'AbarNexus Vendor DB'],
  },
  {
    vertical: 'Retail · Technology', accent: TEAL,
    title: 'Legacy Data Warehouse EOL — Azure Migration',
    body: 'On-premise data warehouse reaching end-of-life with no migration plan. Reactive migration costs 40% more. Azure + Databricks Medallion architecture solves migration, FinOps, and AI foundation simultaneously.',
    value: '$47–280M', valueLbl: 'annual value at full deployment',
    modules: ['Technology Intelligence', 'Architecture Intelligence', 'F003 Pattern'],
  },
  {
    vertical: 'Universal · Cloud', accent: '#991B1B',
    title: 'Azure Spend 41% Above Peer Benchmark — No FinOps',
    body: 'Cloud spend significantly above peer benchmark with no FinOps governance. Reserved instance coverage far below peer. Shadow IT adding untracked SaaS spend. Month 1 purchasing decision recovers $12-15M with zero migration risk.',
    value: '$12–39M', valueLbl: '/yr from FinOps governance alone',
    modules: ['Situation Intelligence', 'Vendor Intelligence', 'F011 Pattern'],
  },
]

const verticalBadge: Record<string, { bg: string; color: string }> = {
  healthcare: { bg: '#CCFBF1', color: '#0F4F3E' },
  finserv:    { bg: '#EFF6FF', color: '#1E3A5F' },
  retail:     { bg: '#FEF3C7', color: '#78350F' },
  universal:  { bg: '#F2F1F0', color: '#706D66' },
}

export default function PlatformPage() {
  const [archVisible, setArchVisible] = useState(false)
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null)
  const archRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = archRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setArchVisible(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  function scrollToArch(e: React.MouseEvent) {
    e.preventDefault()
    document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })
  }

  const totalLayers = ARCH_LAYERS.length

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <style>{`
        @keyframes layerIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tagsIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes nexusPulse {
          0%   { box-shadow: 0 0 0 0 rgba(45,212,200,0); border-color: rgba(45,212,200,0.4); }
          40%  { box-shadow: 0 0 0 8px rgba(45,212,200,0.2); border-color: rgba(45,212,200,1); }
          100% { box-shadow: 0 0 0 0 rgba(45,212,200,0); border-color: rgba(45,212,200,0.4); }
        }
        @keyframes dotTravel {
          0%   { top: 100%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 0%; opacity: 0; }
        }
        .sol-card-hover:hover {
          border-color: #0F0E0D !important;
        }
      `}</style>

      <AbarvaNav activePage="platform" />

      {/* ── Section 1: Hero ─────────────────────────────────────────────────── */}
      <section style={{ background: BG, padding: '80px 80px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              THE ABARVA PLATFORM
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 400, color: DARK, lineHeight: 1.07, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
              The intelligence layer enterprise transformation never had.
            </h1>
            <p style={{ fontSize: '18px', color: TEXT, lineHeight: 1.7, marginBottom: '28px' }}>
              Five layers. A proprietary knowledge base. Pre-built solutions. Wired to your data in 48 hours and ready to run engagements across healthcare, financial services, and retail.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="#architecture" onClick={scrollToArch} style={{ fontSize: '14px', fontWeight: 500, color: BG, background: DARK, padding: '11px 22px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}>
                See the architecture ↓
              </a>
              <a href="/demo" style={{ fontSize: '14px', fontWeight: 500, color: DARK, border: `1px solid ${DARK}`, padding: '10px 22px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}>
                Request a demo
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: '⚡', label: 'Time to first intelligence brief', text: '48 hours from data upload to your first Situation Brief. No week-1 discovery. The platform did it before the meeting.' },
              { icon: '🧬', label: 'AbarNexus knowledge layer', text: '340+ transformation patterns from real engagements. Vendor benchmarks. Failure rates. Getting smarter with every client.' },
              { icon: '🏗️', label: 'Pre-built solutions', text: '6 pre-integrated solution packages — from RCM denial prevention to AI portfolio accountability — each wired to AbarNexus patterns.' },
              { icon: '✓', label: 'Zero cold start', text: 'Every engagement opens with client data already analysed, patterns already matched, baseline already proposed. No reset between clients.' },
            ].map((stat, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ fontSize: '20px', flexShrink: 0 }}>{stat.icon}</div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '14px', color: DARK, lineHeight: 1.5, fontWeight: 500 }}>{stat.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Client Setup Flow ────────────────────────────────────── */}
      <section style={{ background: BG2, padding: '80px' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>GETTING STARTED</div>
        <h2 style={{ fontFamily: SERIF, fontSize: '38px', fontWeight: 400, color: DARK, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
          From data upload to first intelligence brief in 48 hours.
        </h2>
        <p style={{ fontSize: '15px', color: TEXT, lineHeight: 1.75, marginBottom: '36px', maxWidth: '600px' }}>
          No 4-week discovery. No consultant onboarding. The platform ingests your data, matches it against the AbarNexus knowledge base, and surfaces your first Situation Brief before the first meeting.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
          {[
            {
              num: '01 · DATA INGESTION', title: 'Upload your data.',
              body: 'Financial reports, EHR exports, vendor contracts, technology inventories, org charts. Structured and unstructured. The platform reads everything.',
              tags: ['50+ file types supported', 'Financials, contracts, tech inventory', 'Secure upload — zero training on your data', 'SOC 2 Type II · enterprise encryption'],
              arrow: true,
            },
            {
              num: '02 · ABARNEXUS MATCH', title: 'Platform matches your situation.',
              body: 'AbarNexus runs your data against 340+ transformation patterns, vendor benchmarks, and peer baseline ranges. Every gap quantified. Every risk pattern matched.',
              tags: ['340+ Genome patterns cross-referenced', 'Peer benchmarks from comparable orgs', 'Vendor performance data applied', 'Confidence score per finding'],
              arrow: true,
            },
            {
              num: '03 · SITUATION BRIEF', title: 'Intelligence brief in 48 hours.',
              body: 'A Situation Brief is generated: every issue quantified, every gap benchmarked, every Genome pattern flagged. The Maestro arrives at meeting 1 already knowing everything.',
              tags: ['Issues ranked by financial exposure', 'F-code patterns with failure rates', 'Day 0 baseline proposed for CXO sign-off', 'Engagement scope recommended'],
              arrow: true,
            },
            {
              num: '04 · ENGAGEMENT LIVE', title: 'Engagement starts with context.',
              body: 'Maestro is assigned, engagement created, baseline locked. CXO approves scope. AbarVa\'s AI Analyst guides every phase — drafting outputs, flagging risks, tracking actuals against the locked baseline.',
              tags: ['Baseline locked Day 0 — immutable', 'AI Analyst active across all 18 steps', 'Phase gate approvals built in', 'Deliverables auto-generated each phase'],
              arrow: false,
            },
          ].map((step, i) => (
            <div key={i} style={{ padding: '28px 24px', background: '#fff', borderRight: i < 3 ? `1px solid ${BORDER}` : 'none', position: 'relative' }}>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, fontWeight: 700, marginBottom: '8px' }}>{step.num}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: DARK, marginBottom: '8px' }}>{step.title}</div>
              <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '12px' }}>{step.body}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {step.tags.map((tag, j) => (
                  <div key={j} style={{ fontSize: '11px', color: TEXT, display: 'flex', gap: '5px' }}>
                    <span style={{ color: TEAL, fontSize: '10px', flexShrink: 0, marginTop: '1px' }}>→</span>
                    {tag}
                  </div>
                ))}
              </div>
              {step.arrow && (
                <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '24px', height: '24px', background: TEAL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: DARK, fontWeight: 700 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: AbarNexus Knowledge Layer ────────────────────────────── */}
      <section style={{ background: DARK, padding: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>LAYER 02 · THE KNOWLEDGE LAYER</div>
            <div style={{ fontFamily: SERIF, fontSize: '44px', fontWeight: 400, color: BG, marginBottom: '20px', lineHeight: 1.1 }}>
              Abar<span style={{ color: TEAL, fontStyle: 'italic' }}>Nexus</span>
            </div>
            <p style={{ fontSize: '18px', color: BG, lineHeight: 1.7, marginBottom: '16px' }}>
              AbarNexus is the proprietary knowledge layer that sits between the foundation AI and every engagement. It is what makes AbarVa different from a large language model with a prompt. It is built from real transformations — and it gets smarter with every client.
            </p>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.70)', lineHeight: 1.7, marginBottom: '36px' }}>
              Advisory firms carry this knowledge in partners&apos; heads. It walks out when they retire. AbarNexus compounds permanently. <strong style={{ color: BG }}>The 50th client benefits from the first 49.</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
              {[
                {
                  label: '01 · THE TRANSFORMATION GENOME',
                  title: '340+ failure patterns from real engagements',
                  body: 'Every Genome pattern is a documented transformation failure mode with a failure rate, recovery range, and intervention playbook. F011 (SLA never enforced) has a 74% failure rate. F007 (CDO vacant at go-live) has a 79% failure rate. The platform flags them before they happen.',
                },
                {
                  label: '02 · PEER BENCHMARKS',
                  title: 'Baseline ranges from comparable organisations',
                  body: 'What is a good denial rate for a 14-hospital IDN? What should a $6B asset manager be spending on Bloomberg? AbarNexus holds the peer benchmark data across healthcare, financial services, and retail — so every gap is immediately quantified against what comparable organisations achieve.',
                },
                {
                  label: '03 · VENDOR INTELLIGENCE',
                  title: 'Track records, contract leverage points, SLA patterns',
                  body: 'Which EHR vendors have the best Epic integration track records? What does Ensemble\'s SLA penalty clause look like and when is it most effective? AbarNexus holds vendor performance data from real engagements — anonymous, aggregated, and continuously updated.',
                },
                {
                  label: '04 · DOMAIN MODELS',
                  title: 'Healthcare · Financial Services · Retail — vertical-specific intelligence',
                  body: 'AbarNexus contains pre-trained domain models for each target vertical — so the AI Analyst doesn\'t treat a healthcare denial problem like a retail inventory problem. The context is built in, not prompted in.',
                },
              ].map((pillar, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderLeft: `3px solid ${TEAL}`, borderRadius: '0 6px 6px 0', padding: '20px 24px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{pillar.label}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: BG, marginBottom: '8px' }}>{pillar.title}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.65 }}>{pillar.body}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', borderRadius: '6px', overflow: 'hidden' }}>
              {[
                { val: '340+', lbl: 'Genome patterns' },
                { val: '89%', lbl: 'Prediction accuracy' },
                { val: '3', lbl: 'Verticals' },
                { val: '∞', lbl: 'Compounds with every engagement' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(45,212,200,0.08)', padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: SERIF, fontSize: '30px', fontWeight: 400, color: TEAL, lineHeight: 1, marginBottom: '6px' }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Intelligence products built on AbarNexus</div>
            {[
              { title: 'Situation Intelligence', badge: 'Phase 0', body: 'What is broken — and what does it cost? Cross-references all uploaded data against Genome patterns and peer benchmarks. Produces the Situation Brief in 48 hours.', tags: ['F-code matching', 'Peer benchmarks', 'Exposure quantification'] },
              { title: 'Contradiction Intelligence', badge: 'Phase 1', body: 'What was promised vs what the data shows. Surfaces vendor SLA breaches, unused contract clauses, and accountability gaps — with financial exposure for each.', tags: ['Vendor SLA tracking', 'Contract analysis', 'Gap quantification'] },
              { title: 'Vendor Intelligence', badge: 'Phase 2', body: 'Which vendor wins in your situation — not their demo. AbarNexus scores vendors on actual performance from comparable deployments, not sales materials.', tags: ['Performance scoring', 'Genome deployments', 'Contract leverage'] },
              { title: 'Business Case Intelligence', badge: 'Phase 2', body: 'CFO-grade numbers the board will sign off on. Recovery ranges from comparable Genome engagements. Third-party verifiable from Day 0.', tags: ['Recovery ranges', 'ROI modelling', 'Audit-ready'] },
              { title: 'Outcome Intelligence', badge: 'Phase 3-4', body: 'Baseline locked Day 0 — verified delta — fee earned. Monthly actuals tracked against the immutable baseline. AbarVa earns only on what is verified.', tags: ['Immutable baseline', 'Monthly actuals', 'Third-party audit'] },
            ].map((mod, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '7px', padding: '22px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: BG }}>{mod.title}</div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, background: 'rgba(45,212,200,0.12)', padding: '3px 8px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', marginLeft: '10px', border: '1px solid rgba(45,212,200,0.30)' }}>{mod.badge}</div>
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.65, marginBottom: '12px' }}>{mod.body}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {mod.tags.map((tag, j) => (
                    <span key={j} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: '3px', fontFamily: MONO, border: '1px solid rgba(255,255,255,0.10)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: 5-Layer Architecture ─────────────────────────────────── */}
      <section id="architecture" ref={archRef} style={{ background: DARK, padding: '80px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginBottom: '60px', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>PLATFORM ARCHITECTURE</div>
            <h2 style={{ fontFamily: SERIF, fontSize: '38px', fontWeight: 400, color: BG, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Five layers.<br />One coherent platform.
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.7, margin: 0 }}>
              Every layer is purpose-built — from Anthropic&apos;s foundation models on enterprise cloud to the Maestros who close the loop on verified outcomes. Each layer feeds the next. AbarNexus is the proprietary layer that makes the intelligence possible.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '6px', padding: '20px 24px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>How the layers animate</div>
            {[
              'Layers reveal bottom-up as you scroll into this section',
              'Each layer: opacity 0 → 1, translateY(24px) → 0, 400ms ease, 100ms stagger',
              'AbarNexus (Layer 02): teal border pulses once on reveal',
              'Hover any layer: background brightens, tag badges sharpen',
            ].map((item, i) => (
              <div key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.70)', padding: '4px 0', display: 'flex', gap: '10px' }}>
                <span style={{ color: TEAL, flexShrink: 0 }}>→</span>{item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '51px', top: 0, bottom: 0, width: '2px', background: `linear-gradient(to bottom, transparent, ${TEAL} 20%, ${TEAL} 80%, transparent)`, opacity: 0.25, pointerEvents: 'none', overflow: 'hidden' }}>
            {archVisible && (
              <div style={{ position: 'absolute', left: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: TEAL, animation: 'dotTravel 3s ease-in-out 1s infinite' }} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ARCH_LAYERS.map((layer, i) => {
              const staggerDelay = (totalLayers - 1 - i) * 100
              const tagsDelay = staggerDelay + 200
              const isFeatured = layer.featured
              const isHovered = hoveredLayer === i
              return (
                <div key={i} style={{ opacity: archVisible ? undefined : 0, animation: archVisible ? `layerIn 400ms ease ${staggerDelay}ms both` : 'none' }}>
                  <div
                    onMouseEnter={() => setHoveredLayer(i)}
                    onMouseLeave={() => setHoveredLayer(null)}
                    style={{
                      background: isFeatured
                        ? isHovered ? 'rgba(45,212,200,0.12)' : 'rgba(45,212,200,0.07)'
                        : isHovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)',
                      border: isFeatured ? '1px solid rgba(45,212,200,0.40)' : '1px solid rgba(255,255,255,0.09)',
                      borderRadius: '8px',
                      padding: '28px 32px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '24px',
                      transition: 'background 0.2s',
                      cursor: 'default',
                      animation: isFeatured && archVisible ? `nexusPulse 1s ease ${staggerDelay + 400}ms 1 both` : undefined,
                    }}
                  >
                    <div style={{ fontFamily: MONO, fontSize: '12px', color: isFeatured ? TEAL : 'rgba(255,255,255,0.40)', width: '22px', flexShrink: 0, marginTop: '3px' }}>{layer.num}</div>
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, background: isFeatured ? 'rgba(45,212,200,0.15)' : 'rgba(255,255,255,0.07)' }}>{layer.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: MONO, fontSize: '10px', color: isFeatured ? TEAL : 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{layer.layerLabel}</div>
                      <div style={{ fontSize: '19px', fontWeight: 600, color: isFeatured ? TEAL : BG, marginBottom: '8px' }}>{layer.title}</div>
                      <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, marginBottom: '14px' }}>{layer.desc}</div>
                      <div
                        className="arch-tags"
                        style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', opacity: archVisible ? 1 : 0, animation: archVisible ? `tagsIn 300ms ease ${tagsDelay}ms both` : 'none' }}
                      >
                        {layer.tags.map((tag, j) => (
                          <span
                            key={j}
                            className="arch-tag"
                            style={{ fontSize: '11px', fontFamily: MONO, color: isFeatured ? TEAL : 'rgba(255,255,255,0.65)', background: isFeatured ? 'rgba(45,212,200,0.10)' : 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: '3px', border: isFeatured ? '1px solid rgba(45,212,200,0.25)' : '1px solid rgba(255,255,255,0.10)', transition: 'opacity 0.2s' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'rgba(45,212,200,0.07)', border: '1px solid rgba(45,212,200,0.22)', borderRadius: '8px', padding: '24px 28px', marginTop: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ color: TEAL, fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>🔒</div>
          <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>
            Client data never trains the models. <strong style={{ color: BG }}>Zero data leakage.</strong> Every conversation is isolated. AbarNexus is updated only from anonymised, aggregated engagement outcomes — never from raw client data. Enterprise governance is architectural, not policy.
          </div>
        </div>
      </section>

      {/* ── Section 5: Pre-built Solutions ──────────────────────────────────── */}
      <section style={{ background: BG, padding: '80px' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>PRE-BUILT SOLUTIONS</div>
        <h2 style={{ fontFamily: SERIF, fontSize: '38px', fontWeight: 400, color: DARK, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
          Six pre-integrated solutions. Wired to AbarNexus patterns. Ready to run.
        </h2>
        <p style={{ fontSize: '15px', color: TEXT, lineHeight: 1.75, marginBottom: '32px', maxWidth: '640px' }}>
          Each solution is a pre-integrated combination of AbarNexus intelligence modules, engagement workflows, and deliverable templates — purpose-built for a specific problem. A new engagement can be live in hours, not weeks.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {SOLUTIONS.map((sol, i) => {
            const badge = verticalBadge[sol.verticalClass]
            return (
              <div key={i} className="sol-card-hover" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '24px', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: '10px', fontFamily: MONO, fontWeight: 700, padding: '2px 8px', borderRadius: '3px', display: 'inline-block', marginBottom: '12px', background: badge.bg, color: badge.color }}>
                  {sol.vertical}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 600, color: DARK, marginBottom: '6px' }}>{sol.title}</div>
                <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '14px' }}>{sol.body}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 400, color: DARK }}>{sol.value}</span>
                  <span style={{ fontSize: '12px', color: MUTED }}>{sol.valueLbl}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {sol.modules.map((mod, j) => (
                    <span key={j} style={{ fontSize: '10px', fontFamily: MONO, color: MUTED, background: BG2, padding: '2px 7px', borderRadius: '3px' }}>{mod}</span>
                  ))}
                </div>
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '12px', marginTop: '12px', fontSize: '12px', color: TEAL, fontWeight: 500 }}>{sol.footer}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 6: Vendor Intelligence ──────────────────────────────────── */}
      <section style={{ background: BG2, padding: '80px' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>VENDOR INTELLIGENCE</div>
        <h2 style={{ fontFamily: SERIF, fontSize: '38px', fontWeight: 400, color: DARK, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
          What your vendors won&apos;t tell you — but AbarNexus already knows.
        </h2>
        <p style={{ fontSize: '15px', color: TEXT, lineHeight: 1.75, marginBottom: '32px', maxWidth: '640px' }}>
          AbarNexus holds anonymised vendor performance data from real engagements. Before you sign or renew, you see actual SLA performance, typical contract leverage points, and which vendors perform best in your specific situation.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>What AbarNexus knows about vendor contracts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {VENDORS.map((v, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: DARK, marginBottom: '3px' }}>{v.name}</div>
                    <div style={{ fontSize: '12px', color: MUTED }}>{v.context}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: v.color }}>{v.finding}</div>
                    <div style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{v.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: DARK, borderRadius: '8px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              {
                title: 'How AbarNexus uses this',
                body: 'Before recommending or renegotiating any vendor contract, the Vendor Intelligence module scores that vendor against all comparable Genome deployments in your vertical.',
                sub: 'The score covers: actual SLA performance (not claimed), typical penalty clause leverage, renegotiation success rate, and which client situations produce the best vendor response.',
              },
              {
                title: 'The AbarNexus advantage',
                body: 'Every new engagement adds vendor performance data back to AbarNexus. Anonymised and aggregated — but compounding.',
                sub: 'When we invoke an SLA penalty clause with a vendor and achieve a 15% fee reduction, that outcome is recorded. The next client facing the same vendor starts with that data. The 50th deployment has 49 precedents. The vendor has zero equivalent leverage.',
              },
              {
                title: 'Spend optimisation — not just advice',
                body: 'AbarNexus doesn\'t just identify waste. The Vendor Intelligence module recommends the specific contractual levers and timing to recover it.',
                sub: 'Reserved instance purchasing, SLA enforcement, contract renegotiation, tool consolidation — each with a Genome-backed success rate and a typical $ recovery range for your vertical.',
              },
            ].map((insight, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '4px' }} />}
                <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{insight.title}</div>
                <div style={{ fontSize: '15px', color: BG, fontWeight: 600, lineHeight: 1.55, marginBottom: '8px' }}>{insight.body}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>{insight.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Use Cases + Value ─────────────────────────────────────── */}
      <section style={{ background: BG, padding: '80px' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>USE CASES</div>
        <h2 style={{ fontFamily: SERIF, fontSize: '38px', fontWeight: 400, color: DARK, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
          What AbarVa solves. With numbers.
        </h2>
        <p style={{ fontSize: '15px', color: TEXT, lineHeight: 1.75, marginBottom: '32px', maxWidth: '640px' }}>
          Every use case is backed by AbarNexus Genome data from comparable deployments. The value ranges are not estimates — they are actuals from engagements of similar scope and client profile.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {USE_CASES.map((uc, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: uc.accent }} />
              <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', color: MUTED }}>{uc.vertical}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: DARK, marginBottom: '8px', lineHeight: 1.3 }}>{uc.title}</div>
              <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '14px' }}>{uc.body}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                <span style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 400, color: DARK }}>{uc.value}</span>
                <span style={{ fontSize: '12px', color: MUTED }}>{uc.valueLbl}</span>
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {uc.modules.map((mod, j) => (
                  <span key={j} style={{ fontSize: '10px', fontFamily: MONO, color: MUTED, background: BG2, padding: '2px 7px', borderRadius: '3px' }}>{mod}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '14px', marginTop: '32px' }}>
          <a href="/demo" style={{ fontSize: '14px', fontWeight: 500, color: BG, background: DARK, padding: '11px 22px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}>
            See it working on Meridian Health →
          </a>
          <a href="/demo" style={{ fontSize: '14px', fontWeight: 500, color: DARK, border: `1px solid ${DARK}`, padding: '10px 22px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}>
            Request a demo
          </a>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: DARK, padding: '24px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', fontFamily: SANS }}>AbarVa — Intelligence. Now act on it. · /platform</div>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL }}>AbarNexus · 340+ patterns · 3 verticals</div>
      </footer>
    </div>
  )
}
