'use client'
import { useState, useRef, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG     = '#FAFAF9'
const BG2    = '#F2F1F0'
const DARK   = '#0F0E0D'
const TEXT   = '#3D3B38'
const MUTED  = '#706D66'
const BORDER = '#E8E6E3'
const TEAL   = '#2DD4C8'
const RED    = '#C53030'
const AMBER  = '#B45309'
const MONO   = "'Courier New', monospace"
const SERIF  = 'Georgia, serif'
const SANS   = "'DM Sans', sans-serif"

const ARCH_LAYERS = [
  {
    label: 'LAYER 04 · USER LAYER',
    title: 'Maestros & Clients',
    desc: 'Human operators running AI-powered engagements. Outcomes tracked against immutable Day-0 baselines. Verification closes the fee loop — no outcome, no fee.',
    chips: ['Maestro Workspace', 'Client Portal', 'Engagement Tracking', 'Outcome Verification', 'Baseline Lock'],
    accent: 'rgba(255,255,255,0.80)',
    border: 'rgba(255,255,255,0.12)',
    bg: 'rgba(255,255,255,0.03)',
    delay: '0.05s',
  },
  {
    label: 'LAYER 03 · ORCHESTRATION',
    title: 'Workflow & AI Orchestration',
    desc: 'Engagement workflows triggered by intelligence signals. AI routes tasks, escalates exceptions, tracks milestone completion in real time, and surfaces contradictions before they become blockers.',
    chips: ['Engagement Workflows', 'AI Step Routing', 'Milestone Tracking', 'Escalation Engine', 'Contradiction Detection'],
    accent: '#A5B4FC',
    border: 'rgba(165,180,252,0.2)',
    bg: 'rgba(165,180,252,0.04)',
    delay: '0.2s',
  },
  {
    label: 'LAYER 02 · KNOWLEDGE LAYER',
    title: 'AbarVa Knowledge Layer',
    desc: 'The Genome — 340+ transformation patterns from real engagements, updated with every client. Domain intelligence models for healthcare, financial services, and retail. Situation, Vendor, Business Case, and Outcome intelligence products built on top.',
    chips: ['The Genome · 340+ Patterns', 'Situation Intelligence', 'Vendor Intelligence', 'Business Case AI', 'Outcome Baselines', 'Domain Models'],
    accent: '#2DD4C8',
    border: 'rgba(45,212,200,0.25)',
    bg: 'rgba(45,212,200,0.05)',
    delay: '0.35s',
  },
  {
    label: 'LAYER 01 · FOUNDATION AI',
    title: 'Claude · Anthropic',
    desc: 'Best-in-class foundation models deployed across all three hyperscalers. Enterprise data governance — zero training on client data. Reproducible reasoning, structured outputs, SOC 2 Type II. The only foundation model with the context and reasoning required for enterprise transformation.',
    chips: ['Claude Sonnet 4', 'AWS Bedrock', 'Azure AI Foundry', 'Google Vertex AI', 'Zero Client Data Training', 'SOC 2 Type II'],
    accent: '#93C5FD',
    border: 'rgba(147,197,253,0.2)',
    bg: 'rgba(147,197,253,0.04)',
    delay: '0.5s',
  },
]

export default function PlatformPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [stackVisible, setStackVisible] = useState(false)
  const stackRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = stackRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStackVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const steps = [
    { num: '01', title: 'Diagnose', sub: '48hrs · your data', body: 'Every gap quantified against benchmarks and 340+ Genome patterns. Situation Brief in 48 hours.' },
    { num: '02', title: 'Prescribe', sub: 'Strategy + Vendor + Business Case', body: '3–5 specific interventions with CFO-grade business cases and Genome validation from comparable outcomes.' },
    { num: '03', title: 'Execute', sub: 'Maestro embeds · knowledge stays', body: 'Maestros govern delivery from inside. Vendors held to SLAs. Knowledge transfers to your team.' },
    { num: '04', title: 'Verify', sub: 'Baseline vs actuals · fee earned', body: 'Baseline locked Day 0. Immutable. Monthly actuals tracked. Fee on verified savings only.' },
  ]

  const layers = [
    {
      num: '01 · INTELLIGENCE LAYER',
      title: 'Your data tells us everything before we arrive.',
      body: "Five intelligence products that diagnose, prescribe, and surface what's actually breaking. Powered by 340+ Genome patterns.",
      items: ['Situation Intelligence', 'AI Investment Intelligence', 'Vendor Intelligence', 'Business Case Intelligence', 'Outcome Intelligence'],
    },
    {
      num: '02 · THE GENOME',
      title: '340 cross-client patterns. Getting smarter with every engagement.',
      body: "Failure rates. Recovery ranges. Vendor track records. Advisory firms carry this in partners' heads — it walks out when they retire. Ours compounds permanently.",
      items: ['340+ transformation patterns', 'Failure rates by industry and vendor', 'Baseline ranges from peer organisations', 'Updated from every active engagement'],
    },
    {
      num: '03 · MAESTRO MODEL',
      title: 'Operators, not advisors. Embedded. Accountable.',
      body: 'Maestros govern delivery from inside the client. Vendors held to milestones. Knowledge transfers to your team — not back to us.',
      items: ['4 Maestros replace 40 consultants', 'Knowledge stays — no dependency', 'Vendors held to milestone contracts', '15–20% outcome share on verified savings'],
    },
  ]

  const genomeCards = [
    { id: 'F002', pct: '84%', color: RED, title: 'No named executive sponsor', body: 'Margin programmes without a C-suite owner stall at implementation in 84% of cases.' },
    { id: 'F007', pct: '79%', color: AMBER, title: 'CDO vacancy at go-live', body: 'AI programmes with CDO role vacant at go-live fail to scale in 79% of Genome cases.' },
    { id: 'F019', pct: '68%', color: AMBER, title: 'Migration before rationalisation', body: 'Analytics teams that migrate before rationalising waste 40%+ of budget on redundant tooling.' },
  ]

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <AbarvaNav activePage="platform" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: BG, padding: '72px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 500, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
              ENTERPRISE TRANSFORMATION · AI-NATIVE · OUTCOME-ACCOUNTABLE
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: '56px', fontWeight: 400, color: DARK, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
              Intelligence. Then execution.<br />Outcome-accountable fees.
            </h1>
            <p style={{ fontSize: '18px', color: TEXT, lineHeight: 1.7, marginBottom: '32px', maxWidth: '520px' }}>
              AbarVa is not a consulting firm. It is an intelligence platform with embedded operators — Maestros — who govern delivery from inside and earn only when outcomes are verified.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="/demo" style={{ fontSize: '14px', fontWeight: 500, color: BG, background: DARK, padding: '10px 20px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}>
                See it working →
              </a>
              <a href="/demo" style={{ fontSize: '14px', fontWeight: 500, color: DARK, border: `1px solid ${DARK}`, padding: '10px 20px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}>
                Request a demo
              </a>
            </div>
          </div>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', borderTop: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}>
              {[
                { lbl: 'Consulting spend', val: '$200B', sub: 'Annual market with no outcome accountability' },
                { lbl: 'AI with zero ROI', val: '73%', sub: 'Of AI investments produce no verified outcome' },
                { lbl: 'Fee until verified', val: '0%', sub: 'No retainer. No hourly. Fee on what we deliver.' },
                { lbl: 'Time to first brief', val: '48h', sub: 'From kickoff to your first Situation Brief' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '32px 28px', borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ fontFamily: MONO, fontSize: '11px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>{s.lbl}</div>
                  <div style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 400, color: DARK, lineHeight: 1, marginBottom: '8px' }}>{s.val}</div>
                  <div style={{ fontSize: '13px', color: MUTED }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Three Layers ──────────────────────────────────────────────────── */}
      <section style={{ background: BG2, padding: '56px 80px' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>HOW ABARVA WORKS</div>
        <h2 style={{ fontFamily: SERIF, fontSize: '44px', fontWeight: 400, color: DARK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '40px', maxWidth: '500px' }}>
          Three layers. One platform. End-to-end accountability.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: BORDER, border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
          {layers.map((layer, i) => (
            <div key={i} style={{ background: BG, padding: '32px' }}>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, marginBottom: '16px' }}>{layer.num}</div>
              <div style={{ fontSize: '17px', fontWeight: 600, color: DARK, marginBottom: '10px' }}>{layer.title}</div>
              <div style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '16px' }}>{layer.body}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {layer.items.map((item, j) => (
                  <div key={j} style={{ fontSize: '13px', color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: TEAL, fontSize: '11px' }}>→</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section style={{ background: BG, padding: '48px 80px 0' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>THE ENGAGEMENT MODEL</div>
        <h2 style={{ fontFamily: SERIF, fontSize: '44px', fontWeight: 400, color: DARK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '40px' }}>
          From first signal to verified outcome.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${BORDER}` }}>
          {steps.map((step, i) => (
            <div
              key={i}
              onClick={() => setActiveStep(i)}
              style={{
                padding: '32px 24px',
                borderRight: i < 3 ? `1px solid ${BORDER}` : 'none',
                borderTop: i === activeStep ? `2px solid ${DARK}` : '2px solid transparent',
                marginTop: i === activeStep ? '-1px' : '0',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: '11px', color: MUTED, marginBottom: '10px' }}>{step.num}</div>
              <div style={{ fontSize: '17px', fontWeight: 600, color: DARK, marginBottom: '6px' }}>{step.title}</div>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: MUTED, marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{step.sub}</div>
              <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>{step.body}</div>
            </div>
          ))}
        </div>
        <div style={{ background: DARK, padding: '18px 32px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '16px' }}>🔒</span>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
            The baseline is locked on Day 0 and is <strong style={{ color: BG }}>immutable</strong>. Every metric. Every assumption. Verified by the CXO. We cannot move the goalposts — and <strong style={{ color: BG }}>neither can you</strong>.
          </p>
        </div>
      </section>

      {/* ── Genome ────────────────────────────────────────────────────────── */}
      <section style={{ background: BG2, padding: '72px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>THE TRANSFORMATION GENOME</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '44px', fontWeight: 400, color: DARK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '20px' }}>
            340+ patterns from real transformations. Getting smarter with every engagement.
          </h2>
          <p style={{ fontSize: '15px', color: TEXT, lineHeight: 1.7, marginBottom: '16px' }}>
            The Genome is AbarVa&apos;s core competitive advantage. Built from real transformations — published research, KLAS, Everest Group, Gartner, and 15 years of founder engagement experience.
          </p>
          <p style={{ fontSize: '15px', color: TEXT, lineHeight: 1.7, marginBottom: '28px' }}>
            Advisory firms carry this in partners&apos; heads. It walks out when they retire. Ours compounds permanently. <strong style={{ color: DARK }}>Being the 50th client is better than being the first.</strong>
          </p>
          <div style={{ display: 'flex', gap: '28px' }}>
            {[
              { val: '340+', lbl: 'Genome patterns' },
              { val: '89%', lbl: 'Prediction accuracy' },
              { val: '79%', lbl: 'CDO vacancy failure' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 400, color: DARK }}>{s.val}</div>
                <div style={{ fontSize: '13px', color: MUTED }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {genomeCards.map((card, i) => (
            <div key={i} style={{ border: `1px solid ${BORDER}`, borderLeft: `3px solid ${DARK}`, borderRadius: '0 6px 6px 0', padding: '20px 24px', background: BG }}>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, marginBottom: '6px' }}>{card.id}</div>
              <div style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 400, color: card.color, lineHeight: 1, marginBottom: '4px' }}>{card.pct}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>{card.title}</div>
              <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Architecture ──────────────────────────────────────────── */}
      <section ref={stackRef} style={{ background: '#060A12', padding: '80px' }}>
        <style>{`
          @keyframes layerIn {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes connPulse {
            0%, 100% { opacity: 0.15; }
            50%       { opacity: 0.5; }
          }
          @keyframes floatDot {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-4px); }
          }
        `}</style>

        {/* Header */}
        <div style={{ maxWidth: '960px', margin: '0 auto 56px' }}>
          <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>PLATFORM ARCHITECTURE</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 400, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
            Four layers.<br />One coherent platform.
          </h2>
          <p style={{ fontFamily: SANS, fontSize: '17px', color: 'rgba(255,255,255,0.42)', maxWidth: '560px', lineHeight: 1.7, margin: 0 }}>
            Every layer is purpose-built — from Anthropic&apos;s foundation models on enterprise cloud to the Maestro operators who close the loop on verified outcomes.
          </p>
        </div>

        {/* Stack */}
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {ARCH_LAYERS.map((layer, i) => (
            <div key={i}>
              {i > 0 && (
                <div style={{ paddingLeft: '32px', height: '40px', display: 'flex', alignItems: 'stretch' }}>
                  <div style={{
                    width: '1px',
                    background: `linear-gradient(to bottom, ${ARCH_LAYERS[i-1].accent}50, ${layer.accent}50)`,
                    animation: 'connPulse 3s ease-in-out infinite',
                  }} />
                </div>
              )}
              <div style={{
                opacity: stackVisible ? undefined : 0,
                animation: stackVisible ? `layerIn 0.55s cubic-bezier(0.22,1,0.36,1) ${layer.delay} both` : 'none',
                background: layer.bg,
                borderTop: `1px solid ${layer.border}`,
                borderRight: `1px solid ${layer.border}`,
                borderBottom: `1px solid ${layer.border}`,
                borderLeft: `3px solid ${layer.accent}`,
                borderRadius: '2px 8px 8px 2px',
                padding: '28px 36px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '48px',
                alignItems: 'start',
              }}>
                {/* Left */}
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: layer.accent, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: '12px', opacity: 0.65 }}>{layer.label}</div>
                  <div style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 400, color: '#fff', marginBottom: '12px', lineHeight: 1.2 }}>{layer.title}</div>
                  <div style={{ fontFamily: SANS, fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7 }}>{layer.desc}</div>
                </div>
                {/* Right: chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', alignContent: 'flex-start' as const, paddingTop: '28px' }}>
                  {layer.chips.map((chip, j) => (
                    <span key={j} style={{
                      fontFamily: MONO,
                      fontSize: '11px',
                      color: layer.accent,
                      border: `1px solid ${layer.border}`,
                      padding: '5px 12px',
                      borderRadius: '3px',
                      background: `${layer.bg}`,
                      animation: stackVisible ? `floatDot 3s ease-in-out ${(j * 0.15).toFixed(2)}s infinite` : 'none',
                    }}>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ maxWidth: '960px', margin: '56px auto 0', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' as const }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.22)', letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Deployed on</div>
          {['Amazon Web Services', 'Microsoft Azure', 'Google Cloud Platform'].map((p, i) => (
            <div key={i} style={{ fontFamily: MONO, fontSize: '12px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.02em' }}>{p}</div>
          ))}
          <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.22)', letterSpacing: '.04em' }}>
            Foundation models · Anthropic
          </div>
        </div>
      </section>

    </div>
  )
}
