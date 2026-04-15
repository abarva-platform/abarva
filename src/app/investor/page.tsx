'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const C = {
  bg: '#060A12',
  surface: '#0D1520',
  featured: '#091828',
  border: '#1C2D45',
  teal: '#2DD4C8',
  white: '#ffffff',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#00E676',
  mono: 'JetBrains Mono, Menlo, monospace',
  sans: 'DM Sans, Inter, system-ui, sans-serif',
}

const TABS = ['Overview', 'Vision', 'Revenue Model', 'The Ask', 'Team', 'Live Platform']

// ─── primitives ─────────────────────────────────────────────────────────────

function Eyebrow({ label, color = C.teal }: { label: string; color?: string }) {
  return <div style={{ fontFamily: C.mono, fontSize: '10px', color, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: '18px' }}>{label}</div>
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 style={{ fontFamily: C.sans, fontSize: '38px', fontWeight: 800, color: C.white, margin: '0 0 20px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>{children}</h1>
}

function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontFamily: C.sans, fontSize: '13px', color: C.white, lineHeight: 1.7, margin: '0 0 32px', ...style }}>{children}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: C.sans, fontSize: '22px', fontWeight: 700, color: C.white, margin: '40px 0 20px' }}>{children}</div>
}

function Card({ children, featured = false, style }: { children: React.ReactNode; featured?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{ background: featured ? C.featured : C.surface, border: `1px solid ${featured ? C.teal : C.border}`, borderRadius: '10px', padding: '20px', ...style }}>
      {children}
    </div>
  )
}

function TealDot() {
  return <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: C.teal, marginRight: '10px', flexShrink: 0, marginTop: '6px' }} />
}

function WhiteDot() {
  return <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: C.white, marginRight: '10px', flexShrink: 0, marginTop: '6px' }} />
}

function Bullet({ dot, children }: { dot: 'teal' | 'white'; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px', fontFamily: C.sans, fontSize: '13px', color: C.white, lineHeight: 1.6 }}>
      {dot === 'teal' ? <TealDot /> : <WhiteDot />}
      <span>{children}</span>
    </div>
  )
}

function T({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: C.teal, fontWeight: 600 }}>{children}</strong>
}

function Avatar({ label, bg = C.teal, size = 40 }: { label: string; bg?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: size > 44 ? '16px' : '11px', fontWeight: 800, color: C.bg, flexShrink: 0 }}>
      {label}
    </div>
  )
}

// ─── TAB 1: Overview ────────────────────────────────────────────────────────

function TabOverview() {
  return (
    <div>
      <Eyebrow label="SEED ROUND · APRIL 2026" />
      <H1>
        The $800B enterprise transformation<br />
        market has no intelligence layer.<br />
        <em style={{ color: C.teal, fontStyle: 'italic' }}>Until now.</em>
      </H1>
      <Body>
        Palantir built an $80B company embedding AI analysts inside government and enterprise operations.
        ServiceNow built $200B automating enterprise workflow. Neither touched transformation itself —
        the $800B market where boards spend, consultants deliver decks, and accountability is zero.
        AbarVa is that category.
      </Body>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px' }}>
        {[
          { val: '$800B', c: C.teal, sub: 'Annual enterprise transformation spend. No outcome accountability today.' },
          { val: '$80B', c: C.white, sub: 'AI + human operator + enterprise data. Same structure. Different category.' },
          { val: '73%', c: C.teal, sub: 'Of enterprise AI programmes produce no verified outcome. AbarVa fixes this.' },
          { val: '0%', c: C.red, sub: 'Fee tied to outcomes at any leading advisory firm today.' },
        ].map((s, i) => (
          <Card key={i}>
            <div style={{ fontFamily: C.mono, fontSize: '32px', fontWeight: 800, color: s.c, marginBottom: '8px' }}>{s.val}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.6 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <SectionTitle>The structural opportunity</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: '8px', overflow: 'hidden', marginBottom: '40px', border: `1px solid ${C.border}` }}>
        <div style={{ background: C.surface, padding: '24px' }}>
          <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '16px' }}>HOW ADVISORY FIRMS WORK TODAY</div>
          {['CXO pays £2–8M per engagement', 'Consultants spend weeks 1–4 learning the client', 'Deliverable is a PowerPoint deck', 'Knowledge walks out with the team', 'No accountability for outcomes', 'Same firm, same process, 2 years later'].map((item, i) => <Bullet key={i} dot="white">{item}</Bullet>)}
        </div>
        <div style={{ background: C.featured, borderLeft: `3px solid ${C.teal}`, padding: '24px' }}>
          <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '16px' }}>HOW ABARVA WORKS</div>
          {[
            <span key={0}>Data ingested before first meeting. <T>Phase 0 runs in 48 hours.</T></span>,
            <span key={1}>Maestro arrives knowing <T>every gap, every failure pattern</T></span>,
            <span key={2}>Deliverable is <T>structured data</T> — feeds every next phase</span>,
            <span key={3}>Knowledge stays in the <T>platform permanently</T></span>,
            <span key={4}><T>Baseline locked Day 0</T> — accountability built in from the start</span>,
            <span key={5}><T>Genome compounds</T> — every engagement makes the next better</span>,
          ].map((item, i) => <Bullet key={i} dot="teal">{item}</Bullet>)}
        </div>
      </div>

      <div style={{ height: '1px', background: C.border, margin: '8px 0 40px' }} />

      <SectionTitle>The four compounding advantages</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { num: '01', label: 'GENOME', title: 'Cross-client intelligence no firm can share', body: 'Patterns from real transformations. Failure rates. Recovery ranges. Vendor track records. Every engagement makes it smarter. Advisory firms have this in partners\' heads — walks out when they retire. Ours compounds permanently.' },
          { num: '02', label: 'DATA FIRST', title: 'Week 4 insight in 48 hours', body: 'Client uploads data. Phase 0 runs. Every gap quantified, every pattern matched before the first Maestro meeting.' },
          { num: '03', label: 'MAESTROS EMBEDDED', title: 'Operators, not advisors', body: 'Maestros govern delivery from inside the client. They hold vendors accountable. Knowledge transfers to the client team — not back to us.' },
          { num: '04', label: 'PLATFORM NOT PEOPLE', title: 'Scales without headcount', body: 'One Maestro runs 3–4 engagements simultaneously. AI does the analysis. Same team handles 10x the engagements of a traditional consulting model.' },
        ].map((c, i) => (
          <Card key={i}>
            <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '12px' }}>{c.num} · {c.label}</div>
            <div style={{ fontFamily: C.sans, fontSize: '13px', fontWeight: 700, color: C.white, marginBottom: '8px', lineHeight: 1.4 }}>{c.title}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.7 }}>{c.body}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── TAB 2: Vision ──────────────────────────────────────────────────────────

function TabVision() {
  return (
    <div>
      <Eyebrow label="5-YEAR VISION" />
      <H1>The operating system<br />for enterprise transformation.</H1>
      <Body>
        Today: a platform that makes Maestros 10x more effective. In 5 years: the platform that every board mandates before approving any transformation programme. The Genome becomes the most valuable dataset in enterprise transformation — more verified outcome data than any entity on earth.
      </Body>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px' }}>
        {[
          { stage: 'TODAY · SEED', title: 'Platform + Maestro engagements', body: 'Phase-gated engagement engine. Maestros embedded. Platform license + engagement fees. Healthcare IT + FinServ beachhead. Genome seeded from research + founder experience.', arr: '$0 → $5M', arrLabel: 'ARR target at Series A trigger', featured: true },
          { stage: 'YEAR 2 · SERIES A', title: 'Genome becomes the product', body: '30+ real engagements feeding live pattern data. AbarVa predicts outcomes before programmes begin. "94% confidence — based on 12 similar engagements." No advisory firm can say that.', arr: '$20–30M', arrLabel: 'ARR', featured: false },
          { stage: 'YEAR 3–4 · SERIES B', title: 'Outcome accountability layer', body: 'Baseline methodology proven. Outcome fees introduced on top of base. 15–20% of verified savings above baseline. The category-defining move — earned through delivery first.', arr: '$50–80M', arrLabel: 'ARR', featured: false },
          { stage: 'YEAR 5 · MARKET LEADERSHIP', title: 'Category defined and owned', body: 'CFOs mandate AbarVa before approving transformation spend. Genome licensed to advisory firms. "Has AbarVa assessed this?" becomes the standard board question.', arr: '$150M+', arrLabel: 'ARR', featured: false },
        ].map((c, i) => (
          <div key={i} style={{ background: c.featured ? C.featured : C.surface, border: `1px solid ${c.featured ? C.teal : C.border}`, borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '10px' }}>{c.stage}</div>
            <div style={{ fontFamily: C.sans, fontSize: '13px', fontWeight: 700, color: C.white, marginBottom: '8px', lineHeight: 1.4 }}>{c.title}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.7, flex: 1 }}>{c.body}</div>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: C.mono, fontSize: '24px', fontWeight: 800, color: C.teal }}>{c.arr}</div>
              <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, marginTop: '2px' }}>{c.arrLabel}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>Why now — three converging forces</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '40px' }}>
        {[
          { num: '01', label: 'AI CAPABILITY', title: 'The technical prerequisite just became available', body: 'Claude, GPT-4, Gemini can now genuinely analyse enterprise data and produce board-quality output. This was not true 24 months ago. AbarVa\'s core capability became technically feasible in 2024. The window to define the category is open now.' },
          { num: '02', label: 'ACCOUNTABILITY CRISIS', title: 'Boards are asking what £40M actually bought them', body: 'Post-COVID transformation spend exploded. Results didn\'t follow. Boards are demanding ROI on advisory spend for the first time. The market is ready for a firm that builds accountability in from Day 0 — not as a differentiator, as a baseline expectation.' },
          { num: '03', label: 'AI DISILLUSIONMENT', title: '73% of enterprise AI produces no verified outcome', body: '$94M AI spend, zero ROI — this is not one company. It is most enterprise AI programmes. Boards are demanding accountability on AI investment specifically. AbarVa diagnoses why AI isn\'t working and creates the governance structure to fix it.' },
        ].map((c, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.teal}`, borderRadius: '0 8px 8px 0', padding: '20px' }}>
            <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '10px' }}>{c.num} · {c.label}</div>
            <div style={{ fontFamily: C.sans, fontSize: '13px', fontWeight: 700, color: C.white, marginBottom: '8px', lineHeight: 1.4 }}>{c.title}</div>
            <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.white, lineHeight: 1.7 }}>{c.body}</div>
          </div>
        ))}
      </div>

      <Card featured>
        <div style={{ fontFamily: C.sans, fontSize: '15px', fontWeight: 700, color: C.white, marginBottom: '20px' }}>
          The Genome compounds. Here is where it stands today vs where it goes.
        </div>
        {[
          { label: 'Today — Seeded', val: '40+ patterns', desc: 'Built from published research, public case studies, Everest Group / KLAS / Gartner data, and 15 years of founder engagement experience' },
          { label: 'After 10 engagements', val: '80–100 patterns', desc: 'First live data. Recovery ranges start updating from actual outcomes. Vendor track records verified.' },
          { label: 'After 30 engagements', val: '200–340 patterns', desc: 'Cross-client intelligence live. Predictive capability emerges.' },
          { label: 'After 100 engagements', val: '1,000+ patterns', desc: 'The most comprehensive verified transformation outcome dataset in existence.' },
        ].map((row, i, arr) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 140px 1fr', gap: '16px', alignItems: 'center', padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.white, fontWeight: 600 }}>{row.label}</div>
            <div style={{ fontFamily: C.mono, fontSize: '14px', fontWeight: 800, color: C.teal }}>{row.val}</div>
            <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.white, lineHeight: 1.6 }}>{row.desc}</div>
          </div>
        ))}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.border}`, fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.7 }}>
          Third-party data sources feeding the Genome: KLAS Research · Everest Group PEAK Matrix · Gartner Magic Quadrant · IDC transformation studies · Forrester TEI reports · Public ERP vendor case studies · SEC earnings disclosures
        </div>
      </Card>
    </div>
  )
}

// ─── TAB 3: Revenue Model ───────────────────────────────────────────────────

function TabRevenue() {
  return (
    <div>
      <Eyebrow label="REVENUE MODEL" />
      <H1>
        Platform + services today.<br />
        <em style={{ color: C.teal, fontStyle: 'italic' }}>Outcome fees in Phase 2.</em>
      </H1>
      <Body>
        Seed stage: predictable platform license + Maestro engagement fees. Series A: outcome accountability layer added on top of base fees. Series B: pure outcome model for anchor clients. We earn the right to outcome fees through delivery first — not as a starting position.
      </Body>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {/* Tier 1 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ height: '3px', background: '#445566' }} />
          <div style={{ padding: '20px' }}>
            <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '12px' }}>TIER 1 · INTELLIGENCE PLATFORM</div>
            <div style={{ fontFamily: C.mono, fontSize: '22px', fontWeight: 800, color: C.teal, marginBottom: '4px' }}>$80K–200K</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, marginBottom: '16px' }}>annually · platform license</div>
            {['5 Intelligence products — full access', 'Phase 0 + Phase 1 diagnostic only', 'No embedded Maestro', 'Client executes internally with AbarVa intelligence'].map((f, i) => <Bullet key={i} dot="teal">{f}</Bullet>)}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.border}`, fontFamily: C.sans, fontSize: '11px', color: C.white }}>
              Target: 50 clients · <span style={{ color: C.teal }}>$150K</span> avg = <span style={{ color: C.teal }}>$7.5M ARR</span>
            </div>
          </div>
        </div>

        {/* Tier 2 — Featured */}
        <div style={{ background: C.featured, border: `1px solid ${C.teal}`, borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: '3px', background: C.teal }} />
          <div style={{ padding: '20px' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: C.teal, color: C.bg, fontFamily: C.mono, fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '3px', letterSpacing: '.06em' }}>Most common</div>
            <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '12px' }}>TIER 2 · MAESTRO-ASSISTED</div>
            <div style={{ fontFamily: C.mono, fontSize: '22px', fontWeight: 800, color: C.teal, marginBottom: '4px' }}>$400K–1.2M</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, marginBottom: '16px' }}>per engagement · fixed fee per phase</div>
            {['Platform + part-time Maestro (2–3 days/week)', 'Full Phase 0 through Phase 4', 'Fixed fee per phase — predictable for client', 'Baseline agreement from Phase 3 (outcome layer ready when Phase 2 arrives)'].map((f, i) => <Bullet key={i} dot="teal">{f}</Bullet>)}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.border}`, fontFamily: C.sans, fontSize: '11px', color: C.white }}>
              Target: 20 clients · <span style={{ color: C.teal }}>$800K</span> avg = <span style={{ color: C.teal }}>$16M ARR</span>
            </div>
          </div>
        </div>

        {/* Tier 3 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ height: '3px', background: C.teal }} />
          <div style={{ padding: '20px' }}>
            <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '12px' }}>TIER 3 · FULL PROGRAMME</div>
            <div style={{ fontFamily: C.mono, fontSize: '22px', fontWeight: 800, color: C.teal, marginBottom: '4px' }}>$1.5M–4M</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, marginBottom: '16px' }}>per programme · 12–18 months</div>
            {['Platform + full-time senior Maestro on-site', 'Multi-solution engagement simultaneously', 'Fixed fee base + outcome bonus (Phase 2 model)', 'Anchor client relationships — Maestro brings their network'].map((f, i) => <Bullet key={i} dot="teal">{f}</Bullet>)}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.border}`, fontFamily: C.sans, fontSize: '11px', color: C.white }}>
              Target: 10 clients · <span style={{ color: C.teal }}>$2M</span> avg = <span style={{ color: C.teal }}>$20M ARR</span>
            </div>
          </div>
        </div>
      </div>

      <Card featured style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, marginBottom: '8px' }}>Total at scale — 80 clients across 3 tiers</div>
        <div style={{ fontFamily: C.mono, fontSize: '28px', fontWeight: 800, color: C.teal }}>$43.5M ARR</div>
        <div style={{ fontFamily: C.sans, fontSize: '14px', color: C.white, marginTop: '6px' }}>· $7.5M + $16M + $20M · before outcome fees kick in</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {[
          { period: 'Month 0–6', arr: '$0', desc: '3 design partners. Proving the model.', featured: false },
          { period: 'Month 6–12', arr: '$3.2M', desc: '6 clients. 3 converted DPs + 3 new.', featured: false },
          { period: 'Month 12–18', arr: '$9.6M', desc: '12 clients. Series A trigger.', featured: false },
          { period: 'Month 18–30', arr: '$28M', desc: 'Post Series A. Outcome layer introduced.', featured: false },
          { period: 'Month 30–42', arr: '$54M', desc: '40 clients. Outcome fees compound.', featured: true },
        ].map((cell, i) => (
          <div key={i} style={{ background: cell.featured ? C.featured : C.surface, border: `1px solid ${cell.featured ? C.teal : C.border}`, borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{cell.period}</div>
            <div style={{ fontFamily: C.mono, fontSize: '18px', fontWeight: 800, color: cell.featured ? C.teal : C.white, marginBottom: '6px' }}>{cell.arr}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.5 }}>{cell.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB 4: The Ask ──────────────────────────────────────────────────────────

function TabAsk() {
  return (
    <div>
      <Eyebrow label="THE ASK" color={C.amber} />

      <div style={{ background: C.featured, border: `1px solid ${C.teal}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr' }}>
          <div style={{ padding: '32px', borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: C.mono, fontSize: '52px', fontWeight: 800, color: C.white, lineHeight: 1, marginBottom: '8px' }}>$8M</div>
            <div style={{ fontFamily: C.mono, fontSize: '20px', fontWeight: 700, color: C.teal, marginBottom: '20px' }}>seed · $25M cap · SAFE MFN</div>
            <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.white, lineHeight: 1.7, marginBottom: '24px' }}>
              Category-creation round. The product is built and working. The model is validated on paper. This money buys the team and the first real engagements that validate it in practice.
              <br /><br />
              Primary target: Anthropic Anthology Fund. Strategic angels who have built and exited professional services + AI businesses. Small number of high-conviction investors preferred over a large syndicate.
              <br /><br />
              Series A trigger: $5M ARR. At that point, the Genome has live data from 10+ engagements. Outcome layer is being introduced. Pre-money: $100M.
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="mailto:invest@abarva.ai" style={{ background: C.teal, color: C.bg, borderRadius: '7px', padding: '11px 22px', fontFamily: C.mono, fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textDecoration: 'none', textTransform: 'uppercase' }}>
                Request briefing →
              </a>
              <a href="https://nexus-vert-kappa.vercel.app" target="_blank" rel="noopener noreferrer" style={{ background: 'transparent', color: C.white, border: `1px solid ${C.white}`, borderRadius: '7px', padding: '11px 22px', fontFamily: C.mono, fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textDecoration: 'none', textTransform: 'uppercase' }}>
                See the platform
              </a>
            </div>
          </div>
          <div style={{ padding: '32px' }}>
            {[
              { label: 'Round size', val: '$8M', teal: true },
              { label: 'Valuation cap', val: '$25M', teal: true },
              { label: 'Structure', val: 'SAFE — MFN', teal: false },
              { label: 'Use of funds', val: 'Team 55% · Product 25% · GTM 12% · Ops 8%', teal: false },
              { label: 'Series A trigger', val: '$5M ARR', teal: true },
              { label: 'Series A pre-money', val: '$100M', teal: true },
              { label: 'Target close', val: 'Q2 2026', teal: false },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', gap: '16px' }}>
                <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.white, flexShrink: 0 }}>{row.label}</div>
                <div style={{ fontFamily: C.mono, fontSize: '12px', fontWeight: 700, color: row.teal ? C.teal : C.white, textAlign: 'right' }}>{row.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle>Use of funds — what $8M specifically buys</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { pct: '55%', label: 'Team · $4.4M', detail: 'CTO ($280K). Head of Product ($200K). 3 engineers ($180K avg). 5 Maestros ($235K avg + delivery bonus). Founder ($200K). Recruiting + benefits.' },
          { pct: '25%', label: 'Product · $2M', detail: 'AWS Bedrock + cloud infrastructure. Third-party data licensing (KLAS, Everest Group, Gartner). Engagement engine productisation. Genome automation pipeline build.' },
          { pct: '12%', label: 'GTM · $960K', detail: 'HIMSS + ViVE (healthcare). Sibos + FIS (FinServ). Genome Insights published as research. 3 design partners converted to paying clients.' },
          { pct: '8%', label: 'Operations · $640K', detail: 'Legal, compliance, D&O insurance. Office + equipment. Advisory board equity grants. Contingency.' },
        ].map((c, i) => (
          <Card key={i}>
            <div style={{ fontFamily: C.mono, fontSize: '32px', fontWeight: 800, color: C.teal, marginBottom: '6px' }}>{c.pct}</div>
            <div style={{ fontFamily: C.sans, fontSize: '13px', fontWeight: 700, color: C.white, marginBottom: '10px' }}>{c.label}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.7 }}>{c.detail}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── TAB 5: Team ─────────────────────────────────────────────────────────────

function TabTeam() {
  return (
    <div>
      <Eyebrow label="THE TEAM" />
      <H1>
        11 people.<br />
        Every one has done<br />
        <em style={{ color: C.teal, fontStyle: 'italic' }}>this from the inside.</em>
      </H1>
      <Body>
        The Maestros are not just delivery. They sell. Every senior Maestro comes with their client relationships — their prior clients become AbarVa&apos;s first design partners. This is the GTM strategy: hire the right Maestros, their network walks in with them.
      </Body>

      <Card featured style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
        <Avatar label="AS" size={52} />
        <div>
          <div style={{ fontFamily: C.sans, fontSize: '20px', fontWeight: 800, color: C.white, marginBottom: '4px' }}>Anand Sundaram</div>
          <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '12px' }}>FOUNDER · CEO</div>
          <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.white, lineHeight: 1.7 }}>
            Former Managing Director and Data & AI NA Growth Lead at a top consulting firm. Sold and delivered the exact engagements AbarVa replaces — for Fortune 500 clients across healthcare IT and financial services.{' '}
            <T>Watched £4M decks walk out the door with the knowledge.</T> Built the platform to fix it.
            <br /><br />
            <T>Why this founder:</T> Knows exactly what advisory firms charge, how they deliver, where they fail, and what CXOs actually need. <T>The product is built from the inside</T> — not by someone guessing at the market.
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { avatar: 'CTO', avatarBg: C.teal, title: 'Chief Technology Officer', comp: '$260–300K + 2–3% equity', from: 'Engineering lead at Palantir, C3.ai, Veeva, or enterprise AI platform. Or VP Engineering from consulting firm\'s AI arm.', delivers: 'All engineering, cloud architecture, Bedrock knowledge layer, platform scalability. Most critical hire.' },
          { avatar: 'HP', avatarBg: C.green, title: 'Head of Product', comp: '$190–220K + 1–1.5% equity', from: 'Senior PM at Palantir, ServiceNow, or enterprise SaaS.', delivers: 'Product roadmap, engagement engine UX, client portal, Genome product experience.' },
          { avatar: 'ENG', avatarBg: C.white, title: '3 Engineers', comp: '$170–190K avg + equity-heavy', from: '2 senior full-stack. 1 AI/ML (Bedrock/RAG specialist).', delivers: 'S3 → Bedrock → RAG → Genome automation pipeline.' },
        ].map((m, i) => (
          <Card key={i}>
            <Avatar label={m.avatar} bg={m.avatarBg} />
            <div style={{ fontFamily: C.sans, fontSize: '13px', fontWeight: 700, color: C.white, marginTop: '10px', marginBottom: '4px' }}>{m.title}</div>
            <div style={{ fontFamily: C.mono, fontSize: '10px', color: C.teal, marginBottom: '12px' }}>{m.comp}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.6, marginBottom: '8px' }}><T>From:</T> {m.from}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.6 }}><T>Delivers:</T> {m.delivers}</div>
          </Card>
        ))}
      </div>

      <SectionTitle>Maestro team — they also sell</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { avatar: 'M1', title: 'Head of Delivery + Maestro Lead', comp: '$260K + 1.5% equity + 25–30% delivery bonus', from: 'Big 4 Partner or senior transformation exec.', delivers: 'Owns delivery methodology. Trains future Maestros. Runs Tier 3 engagements. Brings 3–5 warm CXO relationships day 1.', featured: true },
          { avatar: 'M2', title: 'Healthcare IT Maestro × 2', comp: '$230–250K + equity + delivery bonus', from: 'Big 4 health practice lead, Epic implementation director, or CMO/CIO from major health system.', delivers: 'Each brings 2–3 warm healthcare relationships. Prior clients become first design partners.', featured: false },
          { avatar: 'M3', title: 'Financial Services Maestro × 2', comp: '$230–250K + equity + delivery bonus', from: 'Top consulting MD in asset management/banking or CDO/CIO from major financial services firm.', delivers: 'Each brings 2–3 warm FinServ relationships.', featured: false },
        ].map((m, i) => (
          <div key={i} style={{ background: m.featured ? C.featured : C.surface, border: `1px solid ${m.featured ? C.teal : C.border}`, borderRadius: '10px', padding: '20px' }}>
            <Avatar label={m.avatar} />
            <div style={{ fontFamily: C.sans, fontSize: '13px', fontWeight: 700, color: C.white, marginTop: '10px', marginBottom: '4px' }}>{m.title}</div>
            <div style={{ fontFamily: C.mono, fontSize: '10px', color: C.teal, marginBottom: '12px' }}>{m.comp}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.6, marginBottom: '8px' }}><T>From:</T> {m.from}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.white, lineHeight: 1.6 }}><T>Delivers:</T> {m.delivers}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <TealDot />
        <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.white, lineHeight: 1.6 }}>
          <T>Advisory board (equity only):</T> Former Fortune 100 CIO — Healthcare · Former Fortune 100 CFO — FinServ · AI/ML architect (Bedrock/cloud)
        </div>
      </div>
    </div>
  )
}

// ─── TAB 6: Live Platform ────────────────────────────────────────────────────

function TabLivePlatform() {
  const [hovered, setHovered] = useState<number | null>(null)

  const cards = [
    { vert: 'HEALTHCARE · $11.2B IDN · 42,000 EMPLOYEES', name: 'Meridian Health System', stat: '$94M AI portfolio · $0 verified ROI · 18.2% denial rate', desc: '18.2% denial rate vs 12% benchmark. $94M in AI with zero verified return. Epic score 58/100 vs 80 benchmark. CMS mandate 14 months away. Diagnosed from uploaded datasets before first meeting.', cta: '→ See live diagnosis', href: '/diagnose?client=meridian' },
    { vert: 'ASSET MANAGEMENT · £16.2B REVENUE · £840B AUM', name: 'Arcturus Financial Group', stat: 'C/I 71% · target 58% · £840M gap · 28 AI initiatives · 0 live', desc: '28 AI initiatives. None in production. £94M committed. Bloomberg AIM 28yr — 3 failed modernisations at £32.6M total. CDO vacant 11 months. Everything visible before first meeting.', cta: '→ See live diagnosis', href: '/diagnose?client=arcturus' },
    { vert: 'MAESTRO WORKSPACE · PHASE-GATED · ADMIN VIEW', name: 'Maestro Admin Workspace', stat: 'Data uploaded · Phase 0 scored · Engagement active', desc: 'Upload datasets, review Phase 0 findings, manage engagement lifecycle, publish outputs to client portal. What a Maestro sees every day.', cta: '→ See the workspace', href: '/admin/client/arcturus' },
    { vert: 'SOLUTIONS · 3 BUILT · MARGIN · PDLC · TECH', name: 'Solution Pages', stat: 'Margin Optimization · AI-Powered PDLC · Tech Modernization', desc: 'Three solution pages with Genome patterns and real client data. When logged in, AbarVa speaks first from uploaded datasets before any conversation begins.', cta: '→ See Margin Optimization', href: '/solutions/margin' },
  ]

  return (
    <div>
      <Eyebrow label="LIVE PLATFORM" />
      <H1>
        Not a prototype.<br />
        <em style={{ color: C.teal, fontStyle: 'italic' }}>A working product.</em>
      </H1>
      <Body>
        Deployed April 2026. Two composite clients loaded with real-world datasets. Engagement engine built. Phase-gated from data upload to board-ready output. Login credentials below — see it yourself in 5 minutes.
      </Body>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={() => window.open(card.href, '_blank')}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ background: C.surface, border: `1px solid ${hovered === i ? C.teal : C.border}`, borderRadius: '10px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
          >
            <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>{card.vert}</div>
            <div style={{ fontFamily: C.sans, fontSize: '16px', fontWeight: 700, color: C.white, marginBottom: '6px' }}>{card.name}</div>
            <div style={{ fontFamily: C.mono, fontSize: '10px', color: C.teal, marginBottom: '12px', lineHeight: 1.6 }}>{card.stat}</div>
            <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.white, lineHeight: 1.7, marginBottom: '14px' }}>{card.desc}</div>
            <div style={{ fontFamily: C.sans, fontSize: '12px', fontWeight: 700, color: C.teal }}>{card.cta}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <TealDot />
          <div style={{ fontFamily: C.mono, fontSize: '11px', color: C.white, lineHeight: 1.9 }}>
            Login: <span style={{ color: C.teal }}>investor+clerk_test@abarva.com</span> / <span style={{ color: C.teal }}>Demo2026!</span>
            &nbsp;· Verification: <span style={{ color: C.teal }}>424242</span>
            &nbsp;· Admin: <span style={{ color: C.teal }}>anand+clerk_test@abarva.com</span> / <span style={{ color: C.teal }}>AbarVa2026!</span>
            <br />
            Confidential. Do not distribute. Composite clients built from real-world datasets — not live client information.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function InvestorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  const role = user?.publicMetadata?.role as string | undefined
  const isAuthorized = role === 'investor' || role === 'admin'

  useEffect(() => {
    if (!isLoaded || !user) return
    if (role === 'maestro') router.push('/admin')
    else if (role === 'client' || role === 'maestro_client') router.push('/portal/pdlc')
  }, [isLoaded, user, role, router])

  const panels = [
    <TabOverview key="ov" />,
    <TabVision key="vi" />,
    <TabRevenue key="rev" />,
    <TabAsk key="ask" />,
    <TabTeam key="team" />,
    <TabLivePlatform key="live" />,
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.sans, color: C.white }}>
      <AbarvaNav />

      {/* Confidential badge bar */}
      <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 80, background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px', height: '36px' }}>
        <div style={{ fontFamily: C.mono, fontSize: '9px', color: C.teal, letterSpacing: '.14em', border: `1px solid ${C.teal}`, borderRadius: '4px', padding: '3px 10px', textTransform: 'uppercase' }}>
          INVESTOR VIEW · CONFIDENTIAL · SEED 2026
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ position: 'fixed', top: '100px', left: 0, right: 0, zIndex: 80, background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', padding: '0 40px' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === i ? C.teal : 'transparent'}`, padding: '14px 20px', cursor: 'pointer', fontFamily: C.sans, fontSize: '13px', fontWeight: activeTab === i ? 600 : 400, color: activeTab === i ? C.teal : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ paddingTop: '152px' }}>
        {!isLoaded ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 152px)' }}>
            <div style={{ fontFamily: C.mono, fontSize: '11px', color: C.teal, letterSpacing: '.1em', textTransform: 'uppercase' }}>Loading...</div>
          </div>
        ) : !isAuthorized ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 152px)', padding: '40px 24px' }}>
            <div style={{ background: C.featured, border: `1px solid ${C.teal}`, borderRadius: '12px', padding: '48px', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
              <div style={{ fontFamily: C.mono, fontSize: '10px', color: C.teal, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: '20px' }}>INVESTOR ACCESS REQUIRED</div>
              <div style={{ fontFamily: C.sans, fontSize: '22px', fontWeight: 700, color: C.white, marginBottom: '12px' }}>AbarVa Seed 2026</div>
              <div style={{ fontFamily: C.sans, fontSize: '13px', color: C.white, lineHeight: 1.7, marginBottom: '24px' }}>
                This page contains confidential investment information. Investor access is required to view.
              </div>
              <a href="mailto:invest@abarva.ai" style={{ display: 'inline-block', background: C.teal, color: C.bg, borderRadius: '7px', padding: '12px 28px', fontFamily: C.mono, fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Request access → invest@abarva.ai
              </a>
              {!user && (
                <div style={{ marginTop: '16px' }}>
                  <a href="/sign-in" style={{ fontFamily: C.mono, fontSize: '10px', color: C.teal, textDecoration: 'underline', letterSpacing: '.06em' }}>
                    Already have access? Sign in →
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '36px 40px 80px' }}>
            {panels[activeTab]}
          </div>
        )}
      </div>
    </div>
  )
}
