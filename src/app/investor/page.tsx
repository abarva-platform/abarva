'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

const BG    = '#0F0E0D'
const BG2   = '#1F1D1A'
const TEAL  = '#2DD4C8'
const LIGHT = '#FAFAF9'
const BODY  = 'rgba(255,255,255,0.55)'
const MUTED = 'rgba(255,255,255,0.35)'
const BORDR = 'rgba(255,255,255,0.08)'
const TBORD = 'rgba(45,212,200,0.3)'
const SERIF = 'Georgia, serif'
const MONO  = "'Courier New', monospace"
const SANS  = '-apple-system, sans-serif'
const AMBER = '#B45309'
const RED   = '#C53030'
const GREEN = '#166534'

const TABS = ['Overview', 'Vision', 'Revenue Model', 'The Ask', 'Team', 'Live Platform']

// ── Shared primitives ──────────────────────────────────────────────────────

function Lbl({ children, teal }: { children: string; teal?: boolean }) {
  return <div style={{ fontFamily: MONO, fontSize: '11px', color: teal ? TEAL : MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '20px' }}>{children}</div>
}

function H({ children, size = 52 }: { children: React.ReactNode; size?: number }) {
  return <h2 style={{ fontFamily: SERIF, fontSize: `${size}px`, fontWeight: 400, color: LIGHT, lineHeight: 1.07, letterSpacing: '-0.02em', margin: '0 0 20px' }}>{children}</h2>
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: '17px', color: BODY, lineHeight: 1.7, margin: '0 0 32px', ...style }}>{children}</p>
}

function T({ children }: { children: React.ReactNode }) {
  return <span style={{ color: TEAL, fontStyle: 'italic' as const }}>{children}</span>
}

function Card({ children, teal, style }: { children: React.ReactNode; teal?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{ background: BG2, border: `1px solid ${teal ? TBORD : BORDR}`, borderRadius: '8px', padding: '28px', ...(teal ? { background: 'rgba(45,212,200,0.05)' } : {}), ...style }}>
      {children}
    </div>
  )
}

function Stat({ val, label }: { val: string; label: string }) {
  return (
    <div style={{ background: BG2, padding: '24px 20px' }}>
      <div style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 400, color: TEAL, lineHeight: 1, marginBottom: '6px' }}>{val}</div>
      <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.4 }}>{label}</div>
    </div>
  )
}

function Bullet({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '13px', color: BODY, padding: '5px 0', display: 'flex', alignItems: 'flex-start', gap: '8px', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <span style={{ color: icon === '✗' ? 'rgba(255,255,255,0.2)' : TEAL, fontSize: '11px', marginTop: '2px' }}>{icon || '·'}</span>
      <span style={{ color: icon === '✓' ? 'rgba(255,255,255,0.85)' : undefined }}>{children}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: BORDR, margin: '40px 0' }} />
}

// ── Tab 1: Overview ───────────────────────────────────────────────────────

function TabOverview() {
  return (
    <div>
      <Lbl teal>SEED ROUND · APRIL 2026</Lbl>
      <H>
        The $800B enterprise transformation<br />
        market has no intelligence layer.<br />
        <T>Until now.</T>
      </H>
      <P style={{ maxWidth: '620px' }}>
        Palantir built $80B embedding AI analysts inside government. ServiceNow built $200B automating enterprise workflow.
        Neither touched transformation itself — the $800B market where boards spend, consultants deliver decks, and accountability is zero. AbarVa is that category.
      </P>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '48px' }}>
        <Stat val="$800B" label="Annual enterprise transformation spend. No outcome accountability today." />
        <Stat val="$80B" label="AI + human operator + enterprise data. Same structure. Different category." />
        <Stat val="73%" label="Of enterprise AI programmes produce no verified outcome. AbarVa fixes this." />
        <Stat val="0%" label="Fee tied to outcomes at any leading advisory firm today." />
      </div>

      {/* Comparison */}
      <div style={{ fontFamily: MONO, fontSize: '11px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>THE STRUCTURAL OPPORTUNITY</div>
      <H size={44}>The same problem. A different structure.</H>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ background: BG2, padding: '28px' }}>
          <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '16px' }}>How advisory firms work today</div>
          {['CXO pays $2–8M per engagement', 'Consultants spend weeks 1–4 learning the client', 'Deliverable is a PowerPoint deck', 'Knowledge walks out with the team', 'No accountability for outcomes', 'Same firm, same process, 2 years later'].map((item, i) => (
            <Bullet key={i} icon="✗">{item}</Bullet>
          ))}
        </div>
        <div style={{ padding: '28px', borderLeft: `2px solid ${TEAL}`, background: 'rgba(45,212,200,0.06)' }}>
          <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '16px' }}>How AbarVa works</div>
          {['Data ingested before first meeting. Phase 0 in 48 hours.', 'Maestro arrives knowing every gap, every failure pattern', 'Deliverable is structured data — feeds every next phase', 'Knowledge stays in the platform permanently', 'Baseline locked Day 0 — accountability built in from start', 'Genome compounds — every engagement makes the next better'].map((item, i) => (
            <Bullet key={i} icon="✓">{item}</Bullet>
          ))}
        </div>
      </div>

      <Divider />

      {/* 4 advantages */}
      <H size={36}>The four compounding advantages.</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '40px' }}>
        {[
          { num: '01', lbl: 'GENOME', title: 'Cross-client intelligence no firm can share', body: 'Patterns from real transformations. Failure rates. Recovery ranges. Vendor track records. Every engagement makes it smarter.' },
          { num: '02', lbl: 'DATA FIRST', title: 'Week 4 insight in 48 hours', body: 'Client uploads data. Phase 0 runs. Every gap quantified, every pattern matched before the first Maestro meeting.' },
          { num: '03', lbl: 'MAESTROS EMBEDDED', title: 'Operators, not advisors', body: 'Maestros govern delivery from inside the client. They hold vendors accountable. Knowledge transfers — not back to us.' },
          { num: '04', lbl: 'PLATFORM NOT PEOPLE', title: 'Scales without headcount', body: 'One Maestro runs 3–4 engagements simultaneously. AI does the analysis. 10x the engagements of a traditional model.' },
        ].map((c, i) => (
          <div key={i} style={{ background: BG2, padding: '24px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>{c.num} · {c.lbl}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: LIGHT, marginBottom: '8px', lineHeight: 1.4 }}>{c.title}</div>
            <div style={{ fontSize: '13px', color: BODY, lineHeight: 1.65 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 2: Vision ──────────────────────────────────────────────────────────

function TabVision() {
  return (
    <div>
      <Lbl teal>PRODUCT ROADMAP</Lbl>
      <H>From beachhead to<br />category definition.</H>

      <div style={{ display: 'flex', gap: '0', marginBottom: '48px', border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden' }}>
        {[
          { lbl: 'Phase 1 · NOW', date: 'Q2 2026 · Live', active: true, items: ['Platform live at app.abarva.ai', 'Meridian + Arcturus demo clients', '5 Intelligence products deployed', '340+ Genome patterns seeded', '3 design partners signing', '$3M ARR target'], done: [0,1,2,3] },
          { lbl: 'Phase 2 · SEED', date: 'Q3–Q4 2026', active: false, items: ['3 paying design partners live', '50+ Genome patterns from real data', 'Automated benchmark feeds', '3 Maestros hired and deployed', 'Retail vertical added', '$5M ARR target'], done: [] },
          { lbl: 'Phase 3 · SERIES A', date: '2027 · $5M ARR trigger', active: false, items: ['Cross-client Genome intelligence', '30 clients across 3 verticals', 'Maestro marketplace', 'API for client data integration', '$20M ARR · ~$100M pre-money'], done: [] },
          { lbl: 'Phase 4 · CATEGORY', date: '2028+', active: false, items: ['International expansion', 'Genome as standalone product', 'Third-party Maestro platform', 'Default OS for enterprise transformation', '$100M ARR'], done: [] },
        ].map((phase, pi) => (
          <div key={pi} style={{ flex: 1, padding: '24px', borderRight: pi < 3 ? `1px solid ${BORDR}` : 'none', ...(phase.active ? { background: 'rgba(45,212,200,0.06)', borderTop: `2px solid ${TEAL}` } : { background: BG2 }) }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '8px' }}>{phase.lbl}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>{phase.date}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {phase.items.map((item, ii) => (
                <div key={ii} style={{ fontSize: '12px', color: phase.done.includes(ii) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: '6px', textDecoration: phase.done.includes(ii) ? 'line-through' : 'none' }}>
                  <span style={{ color: phase.done.includes(ii) ? 'rgba(45,212,200,0.3)' : TEAL, flexShrink: 0 }}>·</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Divider />
      <Lbl teal>5-YEAR VISION</Lbl>
      <H size={44}>The operating system<br />for enterprise transformation.</H>
      <P>
        Today: a platform that makes Maestros 10x more effective. In 5 years: the platform that every board mandates before approving any transformation programme. The Genome becomes the most valuable dataset in enterprise transformation — more verified outcome data than any entity on earth.
      </P>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '40px' }}>
        {[
          { stage: 'TODAY · SEED', arr: '$0 → $5M', title: 'Platform + Maestro engagements', body: 'Phase-gated engine. Maestros embedded. Platform license + engagement fees. Healthcare IT + FinServ beachhead.' },
          { stage: 'YEAR 2 · SERIES A', arr: '$20–30M', title: 'Genome becomes the product', body: '30+ real engagements feeding live data. AbarVa predicts outcomes before programmes begin.' },
          { stage: 'YEAR 3–4 · SERIES B', arr: '$50–80M', title: 'Outcome accountability layer', body: 'Baseline methodology proven. 15–20% of verified savings above baseline.' },
          { stage: 'YEAR 5 · LEADERSHIP', arr: '$150M+', title: 'Category defined and owned', body: '"Has AbarVa assessed this?" becomes the standard board question before approving transformation spend.' },
        ].map((c, i) => (
          <div key={i} style={{ background: i === 0 ? 'rgba(45,212,200,0.06)' : BG2, padding: '24px', borderLeft: i === 0 ? `2px solid ${TEAL}` : 'none' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '8px' }}>{c.stage}</div>
            <div style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 400, color: TEAL, marginBottom: '6px' }}>{c.arr}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: LIGHT, marginBottom: '8px', lineHeight: 1.4 }}>{c.title}</div>
            <div style={{ fontSize: '12px', color: BODY, lineHeight: 1.65 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 3: Revenue Model ───────────────────────────────────────────────────

function TabRevenue() {
  return (
    <div>
      <Lbl teal>REVENUE MODEL</Lbl>
      <H>We earn the right to outcome fees.<br /><T>Here&apos;s how.</T></H>
      <P>Seed stage: predictable platform license + Maestro engagement fees. Series A: outcome accountability layer on top of base fees. We earn the right to outcome fees through delivery first — not as a starting position.</P>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '32px' }}>
        {[
          { num: '01', name: 'PLATFORM FEE', amount: '$80K–200K/yr', desc: 'Recurring. Covers Intelligence access, Genome matching, Admin + Maestro platform. Predictable base.', featured: false },
          { num: '02', name: 'ENGAGEMENT FEE', amount: '$400K–1.2M', desc: 'Covers Maestro time per engagement phase. Fixed per phase — not variable. Predictable and defensible.', featured: false },
          { num: '03', name: 'OUTCOME SHARE', amount: '15–20% of verified savings', desc: 'Only activates on verified outcomes above the Day 0 locked baseline. No other advisory firm on earth does this.', featured: true },
        ].map((s, i) => (
          <div key={i} style={{ padding: '28px', background: s.featured ? 'rgba(45,212,200,0.06)' : BG2, ...(s.featured ? { borderLeft: `2px solid ${TEAL}` } : {}) }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>{s.num} · {s.name}</div>
            <div style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 400, color: TEAL, marginBottom: '12px', lineHeight: 1.1 }}>{s.amount}</div>
            <div style={{ fontSize: '13px', color: BODY, lineHeight: 1.65 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <Card style={{ marginBottom: '32px', textAlign: 'center' as const }}>
        <div style={{ fontSize: '13px', color: MUTED, marginBottom: '8px' }}>Total at scale — 80 clients across 3 tiers</div>
        <div style={{ fontFamily: SERIF, fontSize: '48px', fontWeight: 400, color: TEAL }}>{'>'}$43M ARR</div>
        <div style={{ fontSize: '14px', color: BODY, marginTop: '6px' }}>before outcome fees kick in</div>
      </Card>

      {/* ARR progression */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden' }}>
        {[
          { period: 'Month 0–6',   arr: '$0',   desc: '3 design partners. Proving the model.' },
          { period: 'Month 6–12',  arr: '$3.2M', desc: '6 clients. First converting DPs.' },
          { period: 'Month 12–18', arr: '$9.6M', desc: '12 clients. Series A trigger.' },
          { period: 'Month 18–30', arr: '$28M',  desc: 'Post Series A. Outcome fees active.' },
          { period: 'Month 30–42', arr: '$54M',  desc: '40 clients. Genome compounds.', active: true },
        ].map((cell, i) => (
          <div key={i} style={{ padding: '20px', background: (cell as { active?: boolean }).active ? 'rgba(45,212,200,0.06)' : BG2, textAlign: 'center' as const }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{cell.period}</div>
            <div style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 400, color: (cell as { active?: boolean }).active ? TEAL : LIGHT, marginBottom: '6px' }}>{cell.arr}</div>
            <div style={{ fontSize: '12px', color: BODY, lineHeight: 1.5 }}>{cell.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 4: The Ask ──────────────────────────────────────────────────────────

function TabAsk() {
  return (
    <div>
      <Lbl teal>THE ASK</Lbl>
      <H>$8M. $25M cap. Category-creation round.</H>
      <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>
        AbarVa is raising $8M on a SAFE with a $25M cap and MFN protection.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        {/* SAFE terms */}
        <div style={{ border: `1px solid ${TBORD}`, borderRadius: '8px', padding: '28px', background: 'rgba(45,212,200,0.05)' } as React.CSSProperties}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>Seed Round Terms</div>
          <div style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 400, color: LIGHT, lineHeight: 1, marginBottom: '6px' }}>$8M</div>
          <div style={{ fontSize: '14px', color: BODY, lineHeight: 1.6, marginBottom: '16px' }}>SAFE with $25M valuation cap and MFN protection. Clean, founder-friendly structure.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['SAFE — no priced round complexity', '$25M cap — fair entry for seed risk', 'MFN protection — investor-friendly', 'Series A trigger: $5M ARR · 3 clients', 'Series A pre-money: ~$100M'].map((item, i) => (
              <div key={i} style={{ fontSize: '13px', color: BODY, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: TEAL, marginTop: '5px', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Use of funds */}
        <Card>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>Use of Funds</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: '3 Maestros', amount: '$1.8M', pct: 40, sub: 'Year 1 embedded operators — core delivery capacity' },
              { label: 'Genome data & benchmarks', amount: '$1.2M', pct: 27, sub: 'Automated KLAS, Gartner, Everest feeds + 50+ new patterns' },
              { label: 'Engineering', amount: '$2.4M', pct: 53, sub: '2 senior + 1 infra — platform depth and reliability' },
              { label: 'GTM & design partners', amount: '$2.6M', pct: 58, sub: '3 design partners onboarded and paying' },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: LIGHT }}>{item.label}</span>
                  <span style={{ fontSize: '13px', color: TEAL, fontWeight: 600 }}>{item.amount}</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', background: TEAL, borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '11px', color: MUTED, marginTop: '3px' }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Divider />
      <H size={36}>Why now — the window is open.</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '32px' }}>
        {[
          { lbl: 'Platform is live', detail: 'app.abarva.ai deployed and demo-ready with two composite clients. Not a prototype — a working product.' },
          { lbl: 'Design partners identified', detail: 'Three healthcare IT and financial services CXOs briefed. First design partner conversion Q2 2026.' },
          { lbl: 'Boards demanding accountability', detail: '73% of enterprise AI spend has no verified outcome. Boards are demanding answers — now.' },
        ].map((item, i) => (
          <div key={i} style={{ background: BG2, padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: LIGHT, marginBottom: '8px' }}>{item.lbl}</div>
            <div style={{ fontSize: '13px', color: BODY, lineHeight: 1.65 }}>{item.detail}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 5: Team ────────────────────────────────────────────────────────────

function TabTeam() {
  return (
    <div>
      <Lbl teal>THE TEAM</Lbl>
      <H>The founding team.<br />Every hire has done this from the inside.</H>
      <P style={{ maxWidth: '560px' }}>Not advisors who have observed transformation. Operators who have owned it — from inside large enterprises, under pressure, with accountability.</P>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '40px' }}>
        {[
          {
            name: 'Anand Sundaram',
            role: 'Founder & CEO',
            bio: '15 years leading enterprise transformation programmes across healthcare IT, financial services, and retail. Former programme director at [Enterprise]. Built and governed $200M+ transformation portfolios.',
            creds: ['Ran 40-person transformation programmes from inside IDNs and banks', 'Advised on 3 major EHR migrations — 2 succeeded, 1 failed: knows why', 'The Genome draws from 15 years of personal engagement pattern data'],
          },
          {
            name: 'CTO — Open',
            role: 'Chief Technology Officer · Hiring Q2 2026',
            bio: 'Target: ex-Palantir, Cohere, or Harvey engineering leadership. Deep background in enterprise AI, data ingestion, and agentic workflow orchestration.',
            creds: ['Palantir / Cohere / Harvey pedigree preferred', 'Enterprise data pipeline and AI agent experience required', 'Equity-heavy package — join as technical co-founder equivalent'],
          },
        ].map((person, i) => (
          <div key={i} style={{ background: BG2, padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(45,212,200,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: '14px', fontWeight: 700, color: TEAL, marginBottom: '16px' }}>
              {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: LIGHT, marginBottom: '4px' }}>{person.name}</div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>{person.role}</div>
            <div style={{ fontSize: '14px', color: BODY, lineHeight: 1.7, marginBottom: '16px' }}>{person.bio}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {person.creds.map((c, j) => (
                <div key={j} style={{ fontSize: '12px', color: BODY, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: TEAL, flexShrink: 0 }}>·</span>{c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card teal>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '16px' }}>Advisory Board — Targeting</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { role: 'CXO Advisor', desc: 'Former Fortune 500 CDO or CIO — validates the buyer perspective. Credibility with heads of enterprise transformation.' },
            { role: 'Technical Advisor', desc: 'Ex-Palantir or equivalent — validates AI + enterprise data architecture. Helps close engineering hires.' },
            { role: 'Investor Advisor', desc: 'Professional services + AI fund partner — validates the category thesis. Warm introductions to Series A investors.' },
          ].map((a, i) => (
            <div key={i}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: LIGHT, marginBottom: '6px' }}>{a.role}</div>
              <div style={{ fontSize: '12px', color: BODY, lineHeight: 1.6 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Tab 6: Live Platform ───────────────────────────────────────────────────

function TabLive() {
  return (
    <div>
      <Lbl teal>LIVE PLATFORM</Lbl>
      <H>See it working.<br /><T>Not a mockup.</T></H>
      <P style={{ maxWidth: '560px' }}>
        The platform is live at app.abarva.ai. Two composite clients are pre-loaded — Meridian Health System (healthcare IT) and Arcturus Financial (financial services). Both populated with realistic data across all 5 Intelligence products.
      </P>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '32px' }}>
        {[
          { name: 'Meridian Health System', type: 'IDN · 14 hospitals · Healthcare IT', color: TEAL, items: ['Full Situation Intelligence loaded', 'AI programme contradiction analysis', 'RCM AI engagement in execution', 'Maestro workspace with live engagements'] },
          { name: 'Arcturus Financial', type: 'Asset Manager · Global · Financial Services', color: '#818CF8', items: ['FEAT compliance programme active', 'Analytics modernisation engagement', 'Data readiness assessment complete', 'Outcome baseline locked'] },
        ].map((c, i) => (
          <div key={i} style={{ background: BG2, padding: '28px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color, marginBottom: '12px' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: LIGHT, marginBottom: '4px' }}>{c.name}</div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>{c.type}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {c.items.map((item, j) => (
                <div key={j} style={{ fontSize: '13px', color: BODY, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: TEAL, flexShrink: 0 }}>→</span>{item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: BORDR, border: `1px solid ${BORDR}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '32px' }}>
        {[
          { name: 'AI Value Realization Navigator', desc: '11-module, phase-gated delivery framework from diagnosis to outcome verification.' },
          { name: 'Maestro Workspace', desc: 'Fully operational Maestro workspace with signal cards, engagement table, data readiness.' },
          { name: 'Admin Portal', desc: 'Governance layer for user management, sensitive data approvals, compliance.' },
        ].map((f, i) => (
          <div key={i} style={{ background: BG2, padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: LIGHT, marginBottom: '8px' }}>{f.name}</div>
            <div style={{ fontSize: '13px', color: BODY, lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <a href="/demo" style={{ fontSize: '14px', fontWeight: 600, color: BG, background: TEAL, padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}>
          Enter demo →
        </a>
        <a href="/intelligence?client=meridian" style={{ fontSize: '14px', fontWeight: 500, color: LIGHT, border: `1px solid rgba(255,255,255,0.3)`, padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', background: 'transparent' }}>
          Meridian Intelligence
        </a>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function InvestorPage() {
  const { isLoaded, user } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  const role = user?.publicMetadata?.role as string | undefined

  useEffect(() => {
    if (!isLoaded || !user) return
    if (role === 'client') router.push('/portal/delivery')
  }, [isLoaded, user, role, router])

  function renderTab() {
    switch (activeTab) {
      case 0: return <TabOverview />
      case 1: return <TabVision />
      case 2: return <TabRevenue />
      case 3: return <TabAsk />
      case 4: return <TabTeam />
      case 5: return <TabLive />
      default: return <TabOverview />
    }
  }

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <AbarvaNav activePage="investor" />

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div style={{ background: BG, borderBottom: `1px solid ${BORDR}`, padding: '0 80px', display: 'flex', gap: 0 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              fontFamily: SANS, fontSize: '13px', fontWeight: 500,
              color: i === activeTab ? LIGHT : 'rgba(255,255,255,0.4)',
              padding: '14px 20px', cursor: 'pointer',
              borderBottom: i === activeTab ? `2px solid ${TEAL}` : '2px solid transparent',
              background: 'none', border: 'none',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {tab}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: '10px', fontWeight: 600, color: MUTED, padding: '14px 0', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
          INVESTOR VIEW · CONFIDENTIAL · SEED 2026
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ background: BG, padding: '64px 80px', minHeight: 'calc(100vh - 120px)' }}>
        {renderTab()}
      </div>
    </div>
  )
}
