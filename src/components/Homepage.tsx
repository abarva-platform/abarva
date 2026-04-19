'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AbarvaNav from '@/components/AbarvaNav'

const LBG   = '#F8F7F4'
const LTEXT = '#0C0C0C'
const LBODY = '#3C3C3C'
const LMUTE = '#6B7280'
const LBDR  = '#E5E7EB'

const DBG   = '#060A12'
const DCARD = '#0D1520'
const DBODY = '#9CA3AF'
const DMUTE = 'rgba(255,255,255,0.46)'

const TEAL  = '#2DD4C8'
const RED   = '#EF4444'
const AMB   = '#F59E0B'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'

export default function Homepage() {
  const [activeStep, setActiveStep] = useState(0)
  const { user, isLoaded } = useUser()

  const role       = user?.publicMetadata?.role       as string | undefined
  const metaClient = user?.publicMetadata?.clientId   as string | undefined

  const isElevated = isLoaded && !!user && (role === 'admin' || role === 'investor')
  const isRestricted = isLoaded && !!user && !isElevated

  const seeItLiveHref = isRestricted && metaClient
    ? `/maestro/${metaClient}`
    : '/maestro/meridian'

  const canAccessMeridian = !isRestricted || metaClient === 'meridian'
  const canAccessArcturus = !isRestricted || metaClient === 'arcturus'

  return (
    <div style={{ minHeight: '100vh', fontFamily: SANS }}>
      <AbarvaNav activePage="home" />

      <section style={{ background: LBG, padding: '72px 48px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 480 }}>
        <div style={{ paddingRight: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Enterprise Transformation · AI-Native · Outcome-Accountable
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 700, lineHeight: 1.05, color: LTEXT, margin: '0 0 24px' }}>
            Act on intelligence.<br />Before the window closes.
          </h1>
          <p style={{ fontSize: 18, color: LBODY, lineHeight: 1.6, margin: '0 0 32px', maxWidth: 480 }}>
            AbarVa is the first platform that arrives knowing your data, embeds Maestros through execution, and charges a platform fee, an engagement fee, and 15–20% of verified savings above the locked baseline.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={seeItLiveHref} style={{ background: LTEXT, color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 6, border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
              See it live →
            </a>
            <span title="Demo temporarily unavailable — new version coming soon" style={{ background: 'transparent', color: 'rgba(0,0,0,0.35)', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 6, border: `1.5px solid rgba(0,0,0,0.18)`, cursor: 'default' }}>
              Watch a demo · soon
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16, alignContent: 'center' }}>
          {[
            { label: 'Consulting spend wasted', value: '$200B', body: 'Global annual market with no outcome accountability' },
            { label: 'Enterprise AI with zero ROI', value: '73%', body: 'Of AI investments produce no verified outcome' },
            { label: 'OUTCOME-ACCOUNTABLE FEES', value: '15–20%', body: 'Platform fee + engagement fee. Then 15–20% of verified savings — only if outcomes achieved.' },
            { label: 'Time to first intelligence', value: '48hrs', body: 'From kickoff to your first Situation Brief' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: `1px solid ${LBDR}`, borderRadius: 8, padding: '24px 20px' }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: LTEXT, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: LMUTE, lineHeight: 1.4 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: DBG, padding: '72px 48px' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 32 }}>
          The Problem · In Real Organisations · Right Now
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 40 }}>
          {[
            { num: '73%', numColor: RED, title: 'AI spend with zero verified outcome', body: 'Of enterprise AI programmes produce no measurable result. The money was spent. The board has been briefed. Nobody can prove it worked.' },
            { num: '$200B', numColor: AMB, title: 'Consulting spend with no accountability', body: 'Consulting firms deliver decks and leave. No baseline. No outcome tracking. No skin in the game. The same firm comes back next year.' },
            { num: '4 weeks', numColor: AMB, title: 'Before a consultant knows your business', body: 'Every engagement starts from scratch. Weeks 1–4 are learning the client. Your data, your patterns, your history — locked in their heads. Gone when they leave.' },
          ].map(c => (
            <div key={c.title} style={{ background: DCARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '36px 28px' }}>
              <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 700, color: c.numColor, lineHeight: 1, marginBottom: 16 }}>{c.num}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{c.title}</div>
              <div style={{ fontSize: 14, color: DBODY, lineHeight: 1.6 }}>{c.body}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 17, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
          AbarVa was built because none of this should still be true in 2026.
        </div>
      </section>

      <section style={{ background: LBG, padding: '72px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>What We Are</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: LTEXT, lineHeight: 1.1, margin: '0 0 20px' }}>
            Not a consulting firm.<br />Not a software vendor.<br />The layer that connects your data to verified outcomes.
          </h2>
          <p style={{ fontSize: 17, color: LBODY, lineHeight: 1.7, margin: 0 }}>
            AbarVa is an intelligence platform with embedded operators — Maestros — who govern delivery from inside and earn only when outcomes are verified.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {[
            { num: '01', title: 'Your data tells us everything before we arrive.', body: '48 hours. Every gap quantified, every failure pattern matched before the first Maestro meeting. No surveys. No guesses.' },
            { num: '02', title: 'Maestros embed and hold delivery accountable.', body: 'Operators govern execution from inside. Vendors held to SLAs. Knowledge transfers to your team — not back to us.' },
            { num: '03', title: 'We earn more when you save more.', body: 'Platform fee. Engagement fee. Then 15–20% of verified savings above the locked Day 0 baseline. No outcome — no fee. No exceptions.' },
          ].map(p => (
            <div key={p.num} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: TEAL, minWidth: 28, marginTop: 3 }}>{p.num}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: LTEXT, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: LMUTE, lineHeight: 1.55 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: DBG, padding: '72px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>The Transformation Genome</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.1, margin: '0 0 24px' }}>
            340+ patterns from real transformations.<br />Getting smarter with every engagement.
          </h2>
          <p style={{ fontSize: 16, color: DBODY, lineHeight: 1.7, margin: '0 0 32px' }}>
            The Genome is AbarVa&apos;s core competitive advantage. Built from real transformations — published research, KLAS, Everest Group, Gartner, and 15 years of founder engagement experience.<br /><br />
            Advisory firms carry this in partners&apos; heads. It walks out when they retire. Ours compounds permanently. Every engagement adds patterns. Every client benefits from what every other client learned.
          </p>
          <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
            {[
              { val: '340+', label: 'Genome patterns' },
              { val: '89%', label: 'Prediction accuracy' },
              { val: '79%', label: 'CDO vacancy failure rate' },
            ].map(s => (
              <div key={s.val}>
                <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: TEAL }}>{s.val}</div>
                <div style={{ fontSize: 12, color: LMUTE, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '20px 24px', border: '1px solid rgba(45,212,200,0.3)', borderRadius: 8, background: 'rgba(45,212,200,0.05)' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Why AbarVa wins over time</div>
            <div style={{ fontSize: 14, color: DBODY, lineHeight: 1.6 }}>
              <span style={{ color: TEAL, fontWeight: 600 }}>Being the 50th client is better than being the first.</span> The Genome compounds with every engagement. Traditional consulting firms reset to zero each time. AbarVa never does.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { id: 'F002', pct: '84%', pctColor: RED, title: 'No named executive sponsor', body: 'Margin programmes without a C-suite owner stall at implementation in 84% of cases.' },
            { id: 'F007', pct: '79%', pctColor: AMB, title: 'CDO vacancy at go-live', body: 'AI programmes with CDO role vacant at go-live fail to scale in 79% of Genome cases.' },
            { id: 'F019', pct: '68%', pctColor: AMB, title: 'Migration before rationalisation', body: 'Analytics teams that migrate before rationalising waste 40%+ of migration budget on redundant tooling.' },
          ].map(c => (
            <div key={c.id} style={{ background: DCARD, border: '1px solid rgba(45,212,200,0.2)', borderLeft: `3px solid ${TEAL}`, borderRadius: '0 8px 8px 0', padding: '20px 24px' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, marginBottom: 6 }}>{c.id}</div>
              <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: c.pctColor, lineHeight: 1, marginBottom: 6 }}>{c.pct}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: LMUTE }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: LBG, padding: '72px 48px' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>How It Works</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: LTEXT, lineHeight: 1.1, margin: '0 0 16px' }}>
            From first signal to verified outcome. Every step governed.
          </h2>
          <p style={{ fontSize: 17, color: LMUTE, margin: 0 }}>
            Click each step to explore.{' '}
            <a href="/platform" style={{ color: TEAL, textDecoration: 'none', fontWeight: 600 }}>See the full engagement model →</a>
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          {[
            { num: '01', title: 'Diagnose', sub: 'Situation product · 48hrs · your data', body: 'Every gap in your organisation quantified against industry benchmarks and 340+ Genome patterns. Situation Brief delivered in 48 hours.' },
            { num: '02', title: 'Prescribe', sub: 'Strategy + Vendor + Business Case', body: '3–5 specific interventions, sequenced by impact and feasibility. Each with a CFO-grade business case and Genome validation from comparable outcomes.' },
            { num: '03', title: 'Execute', sub: 'Maestro team embeds · knowledge stays', body: 'Maestros govern delivery from inside. Vendors held to SLAs. Every decision recorded. Knowledge transfers to your team — not back to us.' },
            { num: '04', title: 'Verify', sub: 'Baseline vs actuals · outcome share earned', body: 'Baseline locked Day 0. Immutable. Monthly actuals tracked. Fee activates only on verified savings above the locked baseline.' },
          ].map((step, i) => {
            const isActive = activeStep === i
            return (
              <div
                key={step.num}
                onClick={() => setActiveStep(i)}
                style={{
                  padding: '32px 28px',
                  borderTop: `3px solid ${isActive ? TEAL : 'transparent'}`,
                  background: isActive ? 'rgba(45,212,200,0.04)' : 'transparent',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 12, color: TEAL, marginBottom: 12 }}>{step.num}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: LTEXT, marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: DBODY, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>{step.sub}</div>
                <div style={{ fontSize: 14, color: LMUTE, lineHeight: 1.6 }}>{step.body}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ background: DBG, padding: '72px 48px 88px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Explore the product
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 44, color: '#fff', lineHeight: 1.08, margin: '0 0 18px' }}>
            The work is now in the platform.
          </h2>
          <p style={{ fontSize: 17, color: DBODY, lineHeight: 1.7, margin: '0 0 28px' }}>
            Explore the current product surfaces, then shift into the new AI Value Office workspace when you want a tighter, value-led operating model.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a href="/value-office" style={{ textDecoration: 'none', padding: '14px 20px', borderRadius: 999, background: TEAL, color: '#041312', fontFamily: SANS, fontWeight: 700 }}>
              Open AI Value Office
            </a>
            <a href="/platform" style={{ textDecoration: 'none', padding: '14px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontFamily: SANS, fontWeight: 700 }}>
              Platform model
            </a>
            <a href="/investor" style={{ textDecoration: 'none', padding: '14px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontFamily: SANS, fontWeight: 700 }}>
              Investor story
            </a>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
            {[
              ['Meridian', canAccessMeridian ? '/maestro/meridian' : null],
              ['Arcturus', canAccessArcturus ? '/maestro/arcturus' : null],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href || undefined}
                style={{
                  textDecoration: 'none',
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: href ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: href ? '#fff' : 'rgba(255,255,255,0.28)',
                  pointerEvents: href ? 'auto' : 'none',
                  fontFamily: SANS,
                  fontWeight: 700,
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
