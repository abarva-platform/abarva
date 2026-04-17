'use client'
import { useState } from 'react'
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

  return (
    <div style={{ minHeight: '100vh', fontFamily: SANS }}>
      <AbarvaNav activePage="home" />

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: LBG, padding: '72px 48px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 480 }}>
        <div style={{ paddingRight: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Enterprise Transformation · AI-Native · Outcome-Accountable
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 700, lineHeight: 1.05, color: LTEXT, margin: '0 0 24px' }}>
            Act on intelligence.<br />Before the window closes.
          </h1>
          <p style={{ fontSize: 18, color: LBODY, lineHeight: 1.6, margin: '0 0 32px', maxWidth: 480 }}>
            AbarVa is the first platform that arrives knowing your data, embeds Maestros through execution, and only charges when outcomes are verified.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/diagnose?client=meridian" style={{ background: LTEXT, color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 6, border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
              See it with Meridian Health →
            </a>
            <a href="/demo" style={{ background: 'transparent', color: LTEXT, fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 6, border: `1.5px solid ${LTEXT}`, cursor: 'pointer', textDecoration: 'none' }}>
              Watch a demo
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16, alignContent: 'center' }}>
          {[
            { label: 'Consulting spend wasted',      value: '$200B', body: 'Global annual market with no outcome accountability' },
            { label: 'Enterprise AI with zero ROI',  value: '73%',   body: 'Of AI investments produce no verified outcome' },
            { label: '0% fee until outcomes verified', value: '0%',  body: 'No retainer. No hourly. Fee on what we actually deliver.' },
            { label: 'Time to first intelligence',   value: '48hrs', body: 'From kickoff to your first Situation Brief' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: `1px solid ${LBDR}`, borderRadius: 8, padding: '24px 20px' }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: LTEXT, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: LMUTE, lineHeight: 1.4 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: THE PROBLEM ──────────────────────────────────────────── */}
      <section style={{ background: DBG, padding: '72px 48px' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 32 }}>
          The Problem · In Real Organisations · Right Now
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 40 }}>
          {[
            { num: '73%',    numColor: RED, title: 'AI spend with zero verified outcome',       body: 'Of enterprise AI programmes produce no measurable result. The money was spent. The board has been briefed. Nobody can prove it worked.' },
            { num: '$200B',  numColor: AMB, title: 'Consulting spend with no accountability',   body: 'Consulting firms deliver decks and leave. No baseline. No outcome tracking. No skin in the game. The same firm comes back next year.' },
            { num: '4 weeks',numColor: AMB, title: 'Before a consultant knows your business',  body: 'Every engagement starts from scratch. Weeks 1–4 are learning the client. Your data, your patterns, your history — locked in their heads. Gone when they leave.' },
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

      {/* ── SECTION 3: WHAT WE ARE ──────────────────────────────────────────── */}
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
            { num: '01', title: 'Your data tells us everything before we arrive.',    body: '48 hours. Every gap quantified, every failure pattern matched before the first Maestro meeting. No surveys. No guesses.' },
            { num: '02', title: 'Maestros embed and hold delivery accountable.',       body: 'Operators govern execution from inside. Vendors held to SLAs. Knowledge transfers to your team — not back to us.' },
            { num: '03', title: 'We earn more when you save more.',                   body: 'Platform fee. Engagement fee. Then 15–20% of verified savings above the locked Day 0 baseline. No outcome — no fee. No exceptions.' },
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

      {/* ── SECTION 4: THE GENOME ───────────────────────────────────────────── */}
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
              { val: '89%',  label: 'Prediction accuracy' },
              { val: '79%',  label: 'CDO vacancy failure rate' },
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
            { id: 'F002', pct: '84%', pctColor: RED, title: 'No named executive sponsor',    body: 'Margin programmes without a C-suite owner stall at implementation in 84% of cases.' },
            { id: 'F007', pct: '79%', pctColor: AMB, title: 'CDO vacancy at go-live',        body: 'AI programmes with CDO role vacant at go-live fail to scale in 79% of Genome cases.' },
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

      {/* ── SECTION 5: HOW IT WORKS ─────────────────────────────────────────── */}
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
            { num: '01', title: 'Diagnose',  sub: 'Situation product · 48hrs · your data',       body: 'Every gap in your organisation quantified against industry benchmarks and 340+ Genome patterns. Situation Brief delivered in 48 hours.' },
            { num: '02', title: 'Prescribe', sub: 'Strategy + Vendor + Business Case',            body: '3–5 specific interventions, sequenced by impact and feasibility. Each with a CFO-grade business case and Genome validation from comparable outcomes.' },
            { num: '03', title: 'Execute',   sub: 'Maestro team embeds · knowledge stays',       body: 'Maestros govern delivery from inside. Vendors held to SLAs. Every decision recorded. Knowledge transfers to your team — not back to us.' },
            { num: '04', title: 'Verify',    sub: 'Baseline vs actuals · outcome share earned',  body: 'Baseline locked Day 0. Immutable. Monthly actuals tracked. Fee activates only on verified savings above the locked baseline.' },
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
                {i < 3 && <div style={{ position: 'absolute', right: 0, top: 32, width: 1, height: 'calc(100% - 64px)', background: LBDR }} />}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 40, padding: '20px 28px', background: '#0C0C0C', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            The baseline is locked on Day 0 and is <strong style={{ color: TEAL }}>immutable</strong>. Every metric. Every assumption. Verified by the CXO. We cannot move the goalposts — and <strong style={{ color: TEAL }}>neither can you</strong>.
          </div>
        </div>
      </section>

      {/* ── SECTION 6: LIVE CLIENTS ─────────────────────────────────────────── */}
      <section style={{ background: DBG, padding: '72px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>See It Working · No Signup Required</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>
            Two organisations. Real data.<br />Live intelligence — right now.
          </h2>
          <p style={{ fontSize: 16, color: LMUTE, margin: 0 }}>
            Composite organisations built from real-world datasets across healthcare and financial services.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            {
              vertical: 'Healthcare · IDN · $4.2B',
              dotColor: TEAL,
              name: 'Meridian Health System',
              size: '28,000 employees · 47 facilities · Epic go-live Q3 2026',
              quote: '"$94M AI spend. Zero with a documented ROI. We are adding to cost, not value."',
              signals: [
                'Denial rate 18.2% vs 11.4% benchmark — $94M annual gap',
                'Epic go-live Q3 2026 — no AI integration path confirmed',
                'Travel nurse cost $20M above target — F011 pattern active',
              ],
              href: '/intelligence?client=meridian',
              cta: 'Explore Meridian →',
            },
            {
              vertical: 'Financial Services · $8.4B AUM',
              dotColor: TEAL,
              name: 'Arcturus Financial Group',
              size: 'Wealth management · FinServ benchmarks · MAS FEAT compliance',
              quote: '"C/I ratio 71% against a 58% peer target. $840M efficiency gap. AI spend growing — outcomes not."',
              signals: [
                'C/I ratio 71% vs 58% peer median — $840M efficiency gap',
                '$94M AI committed — zero with documented baseline',
                'CDO role vacant 11 months — F007 pattern active',
              ],
              href: '/intelligence?client=arcturus',
              cta: 'Explore Arcturus →',
            },
          ].map(c => (
            <div key={c.name} style={{ background: DCARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 36 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dotColor }} />
                <span style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, textTransform: 'uppercase', letterSpacing: '.1em' }}>{c.vertical}</span>
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{c.name}</div>
              <div style={{ fontSize: 14, color: LMUTE, marginBottom: 20 }}>{c.size}</div>
              <div style={{ fontSize: 15, color: DBODY, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 20, paddingLeft: 16, borderLeft: `2px solid ${TEAL}` }}>{c.quote}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {c.signals.map(sig => (
                  <div key={sig} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: DBODY, lineHeight: 1.4 }}>{sig}</span>
                  </div>
                ))}
              </div>
              <a href={c.href} style={{ fontSize: 14, fontWeight: 600, color: TEAL, border: '1px solid rgba(45,212,200,0.4)', padding: '10px 20px', borderRadius: 6, background: 'transparent', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                {c.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 7: CTA ──────────────────────────────────────────────────── */}
      <section style={{ background: LBG, padding: '80px 48px', textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>Ready to Act</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: LTEXT, margin: '0 0 16px' }}>
          Ready to see your organisation in here?
        </h2>
        <p style={{ fontSize: 17, color: LMUTE, margin: '0 0 36px' }}>No sales calls. A Maestro responds within 24 hours.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <a href="/demo" style={{ background: LTEXT, color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 6, border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
            See a live demo →
          </a>
          <a href="/diagnose?client=meridian" style={{ background: 'transparent', color: LTEXT, fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 6, border: `1.5px solid ${LTEXT}`, cursor: 'pointer', textDecoration: 'none' }}>
            Request a conversation
          </a>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <div style={{ background: DBG, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: '#fff' }}>Abar</span>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 900, color: TEAL }}>Va</span>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/intelligence" style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Intelligence</a>
          <a href="/solutions"    style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Solutions</a>
          <a href="/investor"     style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Investors</a>
          <a href="/sign-in"      style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Login</a>
          <span style={{ fontSize: 12, color: DMUTE }}>© 2026 AbarVa</span>
        </div>
      </div>
    </div>
  )
}
