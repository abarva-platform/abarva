'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

// ── Light section tokens ─────────────────────────────────────────────────────
const LBG   = '#F8F7F4'
const LTEXT = '#0C0C0C'
const LBODY = '#3C3C3C'
const LMUTE = '#888888'
const LBDR  = '#E2E1DC'
const LCARD = '#FFFFFF'

// ── Dark section tokens ──────────────────────────────────────────────────────
const DBG   = '#060A12'
const DTEXT = '#EFF6FF'
const DBODY = 'rgba(255,255,255,0.74)'
const DMUTE = 'rgba(255,255,255,0.46)'
const DBDR  = '#1C2D45'
const DCARD = '#0D1520'

// ── Shared ───────────────────────────────────────────────────────────────────
const TEAL  = '#2DD4C8'
const RED   = '#EF4444'
const AMB   = '#F59E0B'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'

const darkInput: React.CSSProperties = {
  background: DCARD,
  border: `1px solid ${DBDR}`,
  color: DTEXT,
  borderRadius: 6,
  padding: '11px 14px',
  fontSize: 14,
  fontFamily: SANS,
  width: '100%',
  boxSizing: 'border-box' as const,
  outline: 'none',
}

export default function Homepage() {
  const [formData, setFormData] = useState({ name: '', org: '', email: '', interest: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  return (
    <div style={{ minHeight: '100vh', fontFamily: SANS }}>
      <AbarvaNav activePage="home" />

      {/* ── SECTION 1: HERO ─ light ──────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '50% 46%', gap: '4%', alignItems: 'center' }}>

          {/* Left — headline */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
              Enterprise Transformation · AI-Native · Outcome-Accountable
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 68, fontWeight: 700, lineHeight: 1.06, color: LTEXT, margin: '0 0 28px' }}>
              Act on intelligence.<br />
              Before the window<br />
              closes.
            </h1>
            <p style={{ fontSize: 20, color: LBODY, lineHeight: 1.65, margin: '0 0 40px', maxWidth: 560 }}>
              AbarVa is the intelligence layer that didn&apos;t exist. Your data. Your benchmarks. 340+ transformation patterns. A Maestro who stays through execution and shares the outcome.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center' }}>
              <a href="/diagnose?client=meridian" style={{ background: LTEXT, color: '#FFF', padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                See it with Meridian Health →
              </a>
              <a href="/demo" style={{ background: 'transparent', color: LBODY, border: `1px solid ${LBDR}`, padding: '14px 28px', borderRadius: 8, fontSize: 15, textDecoration: 'none' }}>
                Watch a demo
              </a>
            </div>
          </div>

          {/* Right — 4 stat cards, consistent */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Consulting spend wasted',    value: '$200B',       note: 'Global annual market with no outcome accountability' },
              { label: 'Enterprise AI with zero ROI', value: '73%',        note: 'Of AI investments produce no verified outcome' },
              { label: 'Outcome-accountable',         value: 'Skin in the game', note: 'Platform + engagement fee. We earn more when outcomes are verified.' },
              { label: 'Time to first intelligence',  value: '48hrs',      note: 'From kickoff to your first Situation brief' },
            ].map(s => (
              <div key={s.label} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '22px 20px' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: LMUTE, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 12 }}>{s.label}</div>
                <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 700, color: LTEXT, lineHeight: 1.1, marginBottom: 10 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: LMUTE, lineHeight: 1.55 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: THE PROBLEM ─ dark ────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
            The problem in real organisations right now
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: DTEXT, margin: '0 0 52px', lineHeight: 1.1 }}>
            Three things are true at every<br />enterprise transformation today.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 60 }}>
            {[
              {
                num: '73%',
                numColor: RED,
                title: 'AI spend with zero verified outcome',
                body: 'Of enterprise AI programmes produce no measurable result. The money was spent. The board has been briefed. Nobody can prove it worked.',
              },
              {
                num: '$200B',
                numColor: RED,
                title: 'Consulting spend with no accountability',
                body: 'Consulting firms deliver decks and leave. No baseline. No outcome tracking. No skin in the game. The same firm comes back next year.',
              },
              {
                num: '4 weeks',
                numColor: AMB,
                title: 'Before a consultant knows your business',
                body: 'Every engagement starts from scratch. Weeks 1–4 are learning the client. Your data, your patterns, your history — locked in their heads. Gone when they leave.',
              },
            ].map(card => (
              <div key={card.title} style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, padding: '32px 28px' }}>
                <div style={{ fontFamily: SERIF, fontSize: 80, fontWeight: 700, color: card.numColor, lineHeight: 1, marginBottom: 20 }}>{card.num}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: DTEXT, marginBottom: 12, lineHeight: 1.3 }}>{card.title}</div>
                <div style={{ fontSize: 16, color: DBODY, lineHeight: 1.65 }}>{card.body}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: 20, color: DTEXT, lineHeight: 1.5, fontFamily: SANS }}>
              AbarVa was built because none of this should still be true in 2026.
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: WHAT ABARVA IS ─ light ───────────────────────────────── */}
      <div style={{ background: LBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
            What we are
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: LTEXT, margin: '0 0 52px', lineHeight: 1.1, maxWidth: 760 }}>
            Not a consulting firm.<br />Not a software vendor.<br />The layer that connects your data to verified outcomes.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              {
                icon: '📊',
                title: 'Your data tells us everything before we arrive.',
                body: 'Upload your financials, technology landscape, and contracts. In 48 hours we know every gap, every pattern, every failure risk — mapped against 340+ Genome patterns from comparable organisations.',
                stat: '48 hours to first Situation Brief',
              },
              {
                icon: '🎯',
                title: 'Operators who hold delivery accountable.',
                body: 'Maestros aren\'t advisors. They govern execution from inside. Vendors are held to SLAs. Baselines are locked on Day 0. Every outcome is verified against immutable data — not narrative.',
                stat: 'One Maestro runs 3–4 engagements simultaneously',
              },
              {
                icon: '🔒',
                title: 'We earn more when you save more.',
                body: 'Platform fee. Engagement fee. Then 15–20% of verified savings above the locked Day 0 baseline. The first advisory model in enterprise transformation with real skin in the game.',
                stat: '0% of leading firms tie fee to verified outcomes today',
              },
            ].map(col => (
              <div key={col.title} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 12, padding: '32px 28px' }}>
                <div style={{ fontSize: 28, marginBottom: 20 }}>{col.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: LTEXT, marginBottom: 14, lineHeight: 1.3 }}>{col.title}</div>
                <div style={{ fontSize: 16, color: LBODY, lineHeight: 1.65, marginBottom: 24 }}>{col.body}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: TEAL, borderTop: `1px solid ${LBDR}`, paddingTop: 16 }}>{col.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: HOW IT WORKS ─ dark ──────────────────────────────────── */}
      <div style={{ background: DBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
            How it works
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: DTEXT, margin: '0 0 52px', lineHeight: 1.1 }}>
            From first signal to verified outcome.<br />Every step governed.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${DBDR}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
            {[
              {
                num: '01', name: 'DIAGNOSE', sub: 'Situation product · 48hrs · your data',
                body: 'Every gap in your organisation quantified against industry benchmarks and 340+ Genome patterns. Situation Brief delivered in 48 hours.',
              },
              {
                num: '02', name: 'PRESCRIBE', sub: 'Strategy + Vendor + Business Case',
                body: '3–5 specific interventions, sequenced by impact and feasibility. Each with a CFO-grade business case and Genome validation.',
              },
              {
                num: '03', name: 'EXECUTE', sub: 'Maestro team embeds · knowledge stays',
                body: 'Maestros govern delivery from inside. Vendors held to SLAs. Every decision recorded. Knowledge transfers to your team — not back to us.',
              },
              {
                num: '04', name: 'VERIFY', sub: 'Baseline vs actuals · outcome share earned',
                body: 'Baseline locked Day 0. Immutable. Monthly actuals tracked. Fee activates only on verified savings above the locked baseline.',
              },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ background: DCARD, padding: '32px 24px', borderRight: i < arr.length - 1 ? `1px solid ${DBDR}` : 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: DMUTE, marginBottom: 20 }}>{step.num}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 6 }}>{step.name}</div>
                <div style={{ fontSize: 12, color: DMUTE, marginBottom: 16 }}>{step.sub}</div>
                <div style={{ fontSize: 14, color: DBODY, lineHeight: 1.65 }}>{step.body}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(45,212,200,0.06)', border: `1px solid rgba(45,212,200,0.25)`, borderRadius: 10, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🔒</span>
            <span style={{ fontSize: 15, color: DTEXT, lineHeight: 1.72 }}>
              The baseline is locked on Day 0 and is immutable. Every metric. Every assumption. Verified by the CXO. We cannot move the goalposts — and neither can you.
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: THE GENOME ─ light ───────────────────────────────────── */}
      <div style={{ background: LBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
            The Transformation Genome
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: LTEXT, margin: '0 0 52px', lineHeight: 1.1 }}>
            340+ patterns from real transformations.<br />Getting smarter with every engagement.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 48, alignItems: 'start' }}>
            {/* Left */}
            <div>
              <p style={{ fontSize: 17, color: LBODY, lineHeight: 1.75, marginBottom: 32 }}>
                The Transformation Genome is AbarVa&apos;s core competitive advantage. Built from published research, KLAS, Everest Group, Gartner, and 15 years of founder engagement experience.
              </p>
              <p style={{ fontSize: 17, color: LBODY, lineHeight: 1.75, marginBottom: 32 }}>
                Every engagement adds new patterns. Every client benefits from what every other client learned. Advisory firms carry this in partners&apos; heads — it walks out when they retire. Ours compounds permanently.
              </p>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' as const }}>
                {[
                  { num: '340+', label: 'Genome patterns' },
                  { num: '89%',  label: 'Prediction accuracy' },
                  { num: '79%',  label: 'CDO vacancy failure rate' },
                ].map(s => (
                  <div key={s.num}>
                    <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: LTEXT, lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: 13, color: LMUTE, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — pattern cards */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {[
                { id: 'F002', rate: '84%', rateColor: RED, name: 'No named executive sponsor', finding: 'Margin programmes without a C-suite owner stall at implementation in 84% of cases.' },
                { id: 'F007', rate: '79%', rateColor: RED, name: 'CDO vacancy at go-live', finding: 'AI programmes with CDO role vacant at go-live fail to scale in 79% of Genome cases.' },
                { id: 'F019', rate: '68%', rateColor: AMB, name: 'Migration before rationalization', finding: 'Analytics teams that migrate before rationalizing waste 40%+ of migration spend.' },
              ].map(card => (
                <div key={card.id} style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: '20px 22px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, marginBottom: 8 }}>{card.id}</div>
                  <div style={{ fontFamily: SANS, fontSize: 32, fontWeight: 700, color: card.rateColor, marginBottom: 8, lineHeight: 1 }}>{card.rate}</div>
                  <div style={{ fontSize: 16, color: DTEXT, marginBottom: 8 }}>{card.name}</div>
                  <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.55 }}>{card.finding}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: SEE IT WORKING ─ dark ────────────────────────────────── */}
      <div id="demo" style={{ background: DBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
            See it working
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: DTEXT, margin: '0 0 16px', lineHeight: 1.1 }}>
            Two organisations. Real data.<br />Live intelligence — right now.
          </h2>
          <p style={{ fontSize: 16, color: DBODY, marginBottom: 52, lineHeight: 1.65, maxWidth: 660 }}>
            Built from real-world datasets across healthcare and financial services. Every metric is real. Every problem is one a CXO has faced.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
            {[
              {
                name: 'Meridian Health System',
                initials: 'MH',
                vertical: 'Healthcare · $11.2B revenue',
                quote: '"$94M AI spend. Zero with a documented ROI. We are adding to cost, not value."',
                signals: [
                  'Denial rate 18.2% vs 11.4% benchmark',
                  'AI portfolio: $42M — 0 delivering value',
                  'Travel nurse cost: $20M above target',
                ],
                href: '/diagnose?client=meridian',
                cta: 'Explore Meridian →',
              },
              {
                name: 'Arcturus Financial Group',
                initials: 'AF',
                vertical: 'Financial Services · $16.2B AUM',
                quote: '"C/I ratio 71% vs 58% target. $840M efficiency gap. AI spend growing — outcomes not."',
                signals: [
                  'C/I ratio 71% vs 61% peer median',
                  'CDO vacant 11 months — 14 initiatives blocked',
                  'MAS FEAT overdue — $2.4B AUM at risk',
                ],
                href: '/diagnose?client=arcturus',
                cta: 'Explore Arcturus →',
              },
            ].map(t => (
              <div key={t.name} style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, padding: '28px', display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{t.vertical}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 24, color: DTEXT, lineHeight: 1.2 }}>{t.name}</div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: TEAL, flexShrink: 0, marginLeft: 16 }}>
                    {t.initials}
                  </div>
                </div>
                <div style={{ height: 1, background: DBDR, marginBottom: 20 }} />
                <div style={{ fontFamily: SERIF, fontSize: 18, color: DBODY, fontStyle: 'italic' as const, lineHeight: 1.6, marginBottom: 20 }}>{t.quote}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 24, flex: 1 }}>
                  {t.signals.map(sig => (
                    <div key={sig} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', background: 'rgba(45,212,200,0.04)', borderLeft: `2px solid ${TEAL}`, borderRadius: '0 6px 6px 0' }}>
                      <span style={{ fontSize: 12, color: DBODY, lineHeight: 1.4 }}>{sig}</span>
                    </div>
                  ))}
                </div>
                <a href={t.href} style={{ display: 'block', background: LTEXT, color: '#FFF', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
                  {t.cta}
                </a>
              </div>
            ))}
          </div>

          <div style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, padding: '32px', textAlign: 'center' as const, maxWidth: 540, margin: '0 auto' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(45,212,200,0.1)', border: '1px solid rgba(45,212,200,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: TEAL, marginBottom: 16 }}>
              ▶
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: DTEXT, marginBottom: 10 }}>Recorded walkthrough · 8 minutes</div>
            <div style={{ fontSize: 14, color: DBODY, lineHeight: 1.65, marginBottom: 8 }}>Watch a full Maestro session from Situation through Strategy to Business Case</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: DMUTE }}>Video coming soon · Request a live demo below</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 7: WHO IS THIS FOR ─ light ──────────────────────────────── */}
      <div style={{ background: LBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
            Who comes to AbarVa
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: LTEXT, margin: '0 0 52px', lineHeight: 1.1 }}>
            Three kinds of people<br />land on this page.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              {
                persona: 'CXO / Executive',
                headline: 'You have a board meeting in 90 days.',
                body: 'You need to show the margin is moving, the AI spend is accountable, or the technology programme is delivering. AbarVa gives you the intelligence before the first consultant arrives.',
                cta: 'See it with your data →',
                href: '/diagnose?client=meridian',
              },
              {
                persona: 'Investor',
                headline: 'You\'re looking at the $800B transformation market.',
                body: 'Harvey AI is $11B doing for legal what we do for enterprise transformation. Same structure. Their category $500B. Ours $800B. Nobody has touched it.',
                cta: 'View Investor Brief →',
                href: '/investor',
              },
              {
                persona: 'Maestro Candidate',
                headline: 'You\'ve run transformations. You know what breaks them.',
                body: 'Maestros are operators embedded inside client delivery. AI does the analysis. You govern execution. One Maestro runs 3–4 engagements simultaneously.',
                cta: 'Learn about Maestros →',
                href: '/sign-in',
              },
            ].map(card => (
              <div key={card.persona} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 12, padding: '32px 28px', display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 16 }}>{card.persona}</div>
                <div style={{ fontFamily: SERIF, fontSize: 24, color: LTEXT, marginBottom: 16, lineHeight: 1.3, flex: 1 }}>{card.headline}</div>
                <div style={{ fontSize: 16, color: LBODY, lineHeight: 1.65, marginBottom: 28 }}>{card.body}</div>
                <a href={card.href} style={{ display: 'block', background: LTEXT, color: '#FFF', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
                  {card.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 8: CTA / CONTACT ─ dark ─────────────────────────────────── */}
      <div id="contact" style={{ background: DBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 700, color: DTEXT, margin: '0 0 16px', lineHeight: 1.05 }}>
            Ready to see your<br />organisation in here?
          </h2>
          <p style={{ fontSize: 18, color: DBODY, marginBottom: 56, lineHeight: 1.65 }}>No sales calls. A Maestro responds within 24 hours.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>

            {/* Left — entry points */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              <a href="/diagnose?client=meridian" style={{ background: 'rgba(45,212,200,0.05)', border: '1px solid rgba(45,212,200,0.22)', borderRadius: 10, padding: '24px 26px', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 10 }}>No login required</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: DTEXT }}>See a live demo</div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: TEAL }}>→</div>
                </div>
                <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.6 }}>Real intelligence on real data — Meridian Health or Arcturus Financial. No signup. Live now.</div>
              </a>
              <a href="/sign-in" style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: '18px 24px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: DTEXT, marginBottom: 4 }}>Maestro login</div>
                  <div style={{ fontSize: 12, color: DBODY }}>Enter your org email — AbarVa routes you automatically</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: DMUTE, marginLeft: 20, flexShrink: 0 }}>→</div>
              </a>
              <a href="/investor" style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: '18px 24px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: DTEXT, marginBottom: 4 }}>Investor view</div>
                  <div style={{ fontSize: 12, color: DBODY }}>Overview, vision, revenue model, and the ask</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: DMUTE, marginLeft: 20, flexShrink: 0 }}>→</div>
              </a>
            </div>

            {/* Right — form */}
            <div>
              {!submitted ? (
                <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <input placeholder="First name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={darkInput} />
                    <input placeholder="Last name" style={darkInput} />
                  </div>
                  <input placeholder="Organization email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ ...darkInput, marginBottom: 12 }} />
                  <input placeholder="Organization name" value={formData.org} onChange={e => setFormData({ ...formData, org: e.target.value })} style={{ ...darkInput, marginBottom: 12 }} />
                  <select value={formData.interest} onChange={e => setFormData({ ...formData, interest: e.target.value })} style={{ ...darkInput, marginBottom: 12, color: formData.interest ? DTEXT : 'rgba(255,255,255,0.4)' }}>
                    <option value="">What brings you here?</option>
                    <option value="cxo">CXO / Executive</option>
                    <option value="investor">Investor</option>
                    <option value="exploring">Exploring AbarVa</option>
                    <option value="maestro">Maestro candidate</option>
                  </select>
                  <textarea placeholder="Message (optional)" rows={3} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} style={{ ...darkInput, marginBottom: 16 }} />
                  <button type="submit" style={{ width: '100%', background: TEAL, color: DBG, padding: '14px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                    Request a conversation →
                  </button>
                  <div style={{ fontSize: 12, color: DMUTE, marginTop: 10 }}>No sales calls. A Maestro responds within 24 hours.</div>
                </form>
              ) : (
                <div style={{ fontSize: 16, color: TEAL, lineHeight: 1.7 }}>
                  Thank you — a Maestro will be in touch within 24 hours.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ─ dark ────────────────────────────────────────────────────── */}
      <div style={{ background: DBG, borderTop: `1px solid ${DBDR}`, padding: '32px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: DTEXT }}>Abar</span>
            <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 900, color: TEAL }}>Va</span>
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <a href="/diagnose?client=meridian" style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Intelligence</a>
            <a href="/solutions/pdlc"           style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Solutions</a>
            <a href="/investor"                 style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Investors</a>
            <a href="#contact"                  style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Contact</a>
            <a href="/sign-in"                  style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Login</a>
            <span style={{ fontSize: 12, color: DMUTE }}>© 2026 AbarVa</span>
          </div>
        </div>
      </div>

    </div>
  )
}
