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

      {/* ── HERO ─ light ─────────────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px 88px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '50% 46%', gap: '4%', alignItems: 'center' }}>

          {/* Left — headline */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
              Enterprise transformation · AI-native · Outcome-accountable
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 400, lineHeight: 1.08, color: LTEXT, margin: '0 0 28px' }}>
              Act on intelligence.<br />
              Before the<br />
              window closes.
            </h1>
            <p style={{ fontSize: 18, color: LBODY, lineHeight: 1.72, margin: '0 0 14px' }}>
              AbarVa diagnoses what&apos;s broken, prescribes the right architecture and vendors, and embeds a small Maestro team to execute — fee tied to your outcomes, not our hours.
            </p>
            <p style={{ fontSize: 14, color: LMUTE, lineHeight: 1.6, margin: '0 0 40px' }}>
              Start with a Solution. Scale to full{' '}
              <a href="/ai-strategy" style={{ color: TEAL, textDecoration: 'none' }}>AI Value Realization</a>.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center' }}>
              <a href="/diagnose?client=meridian" style={{ background: LTEXT, color: '#FFF', padding: '13px 26px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                See it with Meridian Health →
              </a>
              <a href="#demo" style={{ background: 'transparent', color: LBODY, border: `1px solid ${LBDR}`, padding: '13px 26px', borderRadius: 8, fontSize: 14, textDecoration: 'none' }}>
                Watch a demo
              </a>
              <a href="#contact" style={{ color: LMUTE, fontSize: 14, textDecoration: 'none', padding: '13px 8px' }}>
                Contact us
              </a>
            </div>
          </div>

          {/* Right — stat cards, no colored numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Consulting spend wasted', value: '$200B', note: 'Global annual market with no outcome accountability' },
              { label: 'Enterprise AI with zero ROI', value: '73%', note: 'Of AI investments produce no verified outcome' },
              { label: 'AbarVa model', value: 'Skin in\nthe game', note: 'Fee tied to your outcomes. Not our hours.' },
              { label: 'Time to first intelligence', value: '48hrs', note: 'From kickoff to your first Situation brief' },
            ].map(s => (
              <div key={s.label} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '22px 20px' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: LMUTE, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 12 }}>{s.label}</div>
                <div style={{ fontFamily: SERIF, fontSize: s.value.length > 6 ? 28 : 42, color: LTEXT, lineHeight: 1.12, marginBottom: 10, whiteSpace: 'pre-line' as const }}>{s.value}</div>
                <div style={{ fontSize: 12, color: LMUTE, lineHeight: 1.55 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROBLEM BAND ─ dark ───────────────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '72px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.14em', textTransform: 'uppercase' as const, textAlign: 'center' as const, marginBottom: 48 }}>
            The problem · in real organizations · right now
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { value: '$94M', note: "Meridian Health's AI portfolio — zero with documented ROI" },
              { value: '71%', note: "Arcturus Financial's cost-to-income ratio vs 58% target — $840M gap" },
              { value: '18 months', note: 'Since Apex deployed Salesforce Einstein — adoption: 23%' },
            ].map((s, i, arr) => (
              <div key={s.value} style={{
                padding: '0 48px',
                borderRight: i < arr.length - 1 ? `1px solid ${DBDR}` : 'none',
                textAlign: 'center' as const,
              }}>
                <div style={{ fontFamily: SERIF, fontSize: 56, color: DTEXT, marginBottom: 16, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 14, color: DBODY, lineHeight: 1.6 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INTELLIGENCE PRODUCTS ─ light ─────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, textTransform: 'uppercase' as const, letterSpacing: '.14em', marginBottom: 16 }}>
            Five products · One intelligence layer
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 400, color: LTEXT, margin: '0 0 18px' }}>
            Intelligence that tells you what to do next.
          </h2>
          <p style={{ fontSize: 16, color: LBODY, marginBottom: 56, lineHeight: 1.72, maxWidth: 660 }}>
            Each product runs on your data, your industry benchmarks, and 340 cross-client patterns from the Transformation Genome. The answer is specific. The source is transparent.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {[
              { id: 'diagnose',    intel: 'Situation Intelligence',     q: "What's actually broken — and what is it costing?", impact: 'Uncover the real cost of what\'s broken' },
              { id: 'ai-strategy', intel: 'AI Strategy Intelligence',   q: 'Where should we place our AI bets?',               impact: 'Prioritize what actually delivers' },
              { id: 'select',      intel: 'Vendor Intelligence',        q: 'Which vendor actually wins in our situation?',      impact: 'Score against your data, not demos' },
              { id: 'justify',     intel: 'Business Case Intelligence', q: 'How do we justify this to the board?',             impact: 'CFO-defensible models, risk-adjusted' },
              { id: 'outcomes',    intel: 'Outcome Intelligence',       q: "Did it work — and can we prove it?",               impact: 'Baseline locked. Outcomes verified.' },
            ].map(p => (
              <div key={p.id} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '22px 18px', display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 12 }}>{p.intel}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: LTEXT, marginBottom: 10, lineHeight: 1.45, flex: 1 }}>{p.q}</div>
                <div style={{ fontSize: 12, color: LMUTE, marginBottom: 20, lineHeight: 1.5 }}>{p.impact}</div>
                <a href={`/${p.id}?client=meridian`} style={{ color: TEAL, fontFamily: MONO, fontSize: 11, textDecoration: 'none' }}>Explore →</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SOLUTIONS ─ dark ──────────────────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: DTEXT, margin: '0 0 14px' }}>
            Diagnosis is just the start. We execute.
          </h2>
          <p style={{ fontSize: 16, color: DBODY, marginBottom: 52, lineHeight: 1.65 }}>
            AbarVa doesn&apos;t hand you a report and leave. Maestros embed. They execute. They track outcomes.
          </p>
          <div style={{ border: `1px solid ${DBDR}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { name: 'AI-Powered PDLC',     href: '/solutions/pdlc',      desc: 'Build products at twice the velocity',          quote: '"We\'re spending $300M in capital. Time to production is 16 months. Engineers aren\'t building — they\'re in meetings."', metric: '$18M reduction', sub: 'consulting spend' },
              { name: 'AI-Powered Delivery', href: '/solutions/delivery',  desc: 'Replace consulting teams with Maestros',        quote: '"80 consultants on site. 70% of their time is getting up to speed. Knowledge walks out the door every Friday."',          metric: '4 Maestros',     sub: 'replace 40' },
              { name: 'Margin Optimization', href: '/solutions/margin',    desc: 'Recover margin across revenue, cost, AI',       quote: '"Operating margin 1.8% against a 4% target. Don\'t know where it\'s leaking or which lever to pull first."',            metric: '$60–120M',       sub: 'annual recovery' },
            ].map((row, i, arr) => (
              <div key={row.name} style={{ display: 'flex', alignItems: 'stretch', borderBottom: i < arr.length - 1 ? `1px solid ${DBDR}` : 'none' }}>
                <div style={{ width: 240, flexShrink: 0, padding: '28px 26px', borderRight: `1px solid ${DBDR}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 10 }}>{row.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: DTEXT, marginBottom: 14, lineHeight: 1.45 }}>{row.desc}</div>
                  <a href={row.href} style={{ color: TEAL, fontSize: 12, textDecoration: 'none', fontFamily: MONO }}>Learn more →</a>
                </div>
                <div style={{ flex: 1, padding: '28px 36px', borderRight: `1px solid ${DBDR}` }}>
                  <p style={{ fontSize: 14, color: DBODY, fontStyle: 'italic', lineHeight: 1.72, margin: 0 }}>{row.quote}</p>
                </div>
                <div style={{ width: 160, flexShrink: 0, padding: '28px 24px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                  <div style={{ fontFamily: SERIF, fontSize: 22, color: DTEXT, lineHeight: 1.2 }}>{row.metric}</div>
                  <div style={{ fontSize: 12, color: DMUTE, marginTop: 6 }}>{row.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW WE EARN ─ light ───────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: LTEXT, margin: '0 0 14px' }}>
            Skin in the game. Fee on outcomes only.
          </h2>
          <p style={{ fontSize: 16, color: LBODY, marginBottom: 56, lineHeight: 1.65 }}>
            Four steps. Baseline locked on day 0. Fee tied to your outcomes — not our hours.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${LBDR}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
            {[
              { num: '01', name: 'DIAGNOSE',  desc: 'Situation product · 48hrs · your data' },
              { num: '02', name: 'PRESCRIBE', desc: 'Strategy + Vendor + Business Case' },
              { num: '03', name: 'EXECUTE',   desc: 'Maestro team embeds · knowledge stays' },
              { num: '04', name: 'VERIFY',    desc: 'Baseline vs actuals · fee on outcomes only' },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ background: LCARD, padding: '28px 24px', borderRight: i < arr.length - 1 ? `1px solid ${LBDR}` : 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, marginBottom: 20 }}>{step.num}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 10 }}>{step.name}</div>
                <div style={{ fontSize: 13, color: LBODY, lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🔒</span>
            <span style={{ fontSize: 14, color: LBODY, lineHeight: 1.72 }}>
              The baseline is locked on Day 0 and is immutable. Every metric. Every assumption. Verified by the CXO. We cannot move the goalposts — and neither can you.
            </span>
          </div>
        </div>
      </div>

      {/* ── SEE IT WORKING ─ dark ────────────────────────────────────────────── */}
      <div id="demo" style={{ background: DBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: 16 }}>
            See it working · No signup required
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: DTEXT, margin: '0 0 14px' }}>
            Two composite organizations. Real-world data. Live intelligence.
          </h2>
          <p style={{ fontSize: 16, color: DBODY, marginBottom: 52, lineHeight: 1.65 }}>
            Built from real-world datasets across healthcare and financial services. Every metric is real. Every problem is one a CXO has faced.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 }}>
            {[
              { name: 'Meridian Health System',   vertical: 'Healthcare',         revenue: '$11.2B', finding: '"$94M AI spend · zero documented ROI"',  dataNote: 'Built from real-world healthcare data', href: '/diagnose?client=meridian' },
              { name: 'Arcturus Financial Group', vertical: 'Financial Services', revenue: '$16.2B', finding: '"AI spend up. Pilots: zero ROI tracked."', dataNote: 'Built from real-world finserv data',    href: '/diagnose?client=arcturus' },
            ].map(t => (
              <a key={t.name} href={t.href} style={{ display: 'block', background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, padding: 28, textDecoration: 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: DTEXT, marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE }}>{t.vertical} · {t.revenue}</div>
                <div style={{ fontSize: 14, color: DBODY, fontStyle: 'italic', marginTop: 20, lineHeight: 1.6 }}>{t.finding}</div>
                <div style={{ fontSize: 12, color: DMUTE, marginTop: 10 }}>{t.dataNote}</div>
                <div style={{ marginTop: 24, fontFamily: MONO, fontSize: 11, color: TEAL }}>Explore →</div>
              </a>
            ))}
          </div>
          <div style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, padding: '32px', textAlign: 'center' as const, maxWidth: 540, margin: '0 auto' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(45,212,200,0.1)', border: '1px solid rgba(45,212,200,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: TEAL, marginBottom: 16 }}>
              ▶
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: DTEXT, marginBottom: 10 }}>Recorded product walkthrough — 8 minutes</div>
            <div style={{ fontSize: 14, color: DBODY, lineHeight: 1.65, marginBottom: 12 }}>Watch a full Maestro session from Situation through Strategy to Business Case</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: DMUTE }}>Video coming soon · Request a live demo below</div>
          </div>
        </div>
      </div>

      {/* ── PROOF NUMBERS ─ light ────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { num: '340',  label: 'Transformation patterns in the Genome — each with documented failure rates and recovery paths' },
            { num: '89%',  label: 'Of organizations with regulatory issues and no remediation plan face enforcement action within 90 days' },
            { num: '79%',  label: 'Of CDO vacancies at AI governance crunch points result in programme failure' },
          ].map(c => (
            <div key={c.num} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '36px 32px' }}>
              <div style={{ fontFamily: SERIF, fontSize: 60, color: LTEXT, lineHeight: 1, marginBottom: 20 }}>{c.num}</div>
              <div style={{ fontSize: 14, color: LBODY, lineHeight: 1.65 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTACT ─ dark ───────────────────────────────────────────────────── */}
      <div id="contact" style={{ background: DBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: DTEXT, margin: '0 0 14px' }}>
            Ready to see your organization in here?
          </h2>
          <p style={{ fontSize: 16, color: DBODY, marginBottom: 56, lineHeight: 1.65 }}>No sales calls. A Maestro responds within 24 hours.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>

            {/* Left — entry points */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              <a href="/diagnose?client=meridian" style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: '20px 24px', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: TEAL, marginBottom: 6 }}>See a live demo</div>
                <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.55 }}>No login required. See real intelligence running on real data.</div>
              </a>
              <a href="/sign-in" style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: '20px 24px', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: DTEXT, marginBottom: 6 }}>Maestro login</div>
                <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.55 }}>Enter your org email — AbarVa routes you automatically</div>
              </a>
              <a href="/sign-in" style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: '20px 24px', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: DTEXT, marginBottom: 6 }}>Investor view</div>
                <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.55 }}>Secured separately — request access</div>
              </a>
            </div>

            {/* Right — form */}
            <div>
              {!submitted ? (
                <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <input placeholder="First name"  value={formData.name}  onChange={e => setFormData({ ...formData, name: e.target.value })}  style={darkInput} />
                    <input placeholder="Last name"   style={darkInput} />
                  </div>
                  <input placeholder="Organization email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ ...darkInput, marginBottom: 12 }} />
                  <input placeholder="Organization name"  value={formData.org}   onChange={e => setFormData({ ...formData, org: e.target.value })}   style={{ ...darkInput, marginBottom: 12 }} />
                  <select value={formData.interest} onChange={e => setFormData({ ...formData, interest: e.target.value })} style={{ ...darkInput, marginBottom: 12, color: formData.interest ? DTEXT : 'rgba(255,255,255,0.4)' }}>
                    <option value="">What brings you here?</option>
                    <option value="cxo">CXO / Executive</option>
                    <option value="investor">Investor</option>
                    <option value="exploring">Exploring AbarVa</option>
                    <option value="maestro">Maestro candidate</option>
                  </select>
                  <textarea placeholder="Message (optional)" rows={3} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} style={{ ...darkInput, marginBottom: 16 }} />
                  <button type="submit" style={{ width: '100%', background: TEAL, color: DBG, padding: '13px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
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
      <div style={{ background: DBG, borderTop: `1px solid ${DBDR}`, padding: '32px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: DTEXT }}>Abar</span>
            <span style={{ fontFamily: MONO, fontSize: 14, color: TEAL }}>Va</span>
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <a href="/diagnose?client=meridian" style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Intelligence</a>
            <a href="/solutions/pdlc"           style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Solutions</a>
            <a href="/sign-in"                  style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Investors</a>
            <a href="#contact"                  style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Contact</a>
            <a href="/sign-in"                  style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Login</a>
            <span style={{ fontSize: 12, color: DMUTE }}>© 2026 AbarVa</span>
          </div>
        </div>
      </div>

    </div>
  )
}
