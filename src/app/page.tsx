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
  background: DCARD, border: `1px solid ${DBDR}`, color: DTEXT,
  borderRadius: 6, padding: '11px 14px', fontSize: 14, fontFamily: SANS,
  width: '100%', boxSizing: 'border-box' as const, outline: 'none',
}

export default function Homepage() {
  const [formData, setFormData] = useState({ name: '', org: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  return (
    <div style={{ minHeight: '100vh', fontFamily: SANS }}>
      <AbarvaNav activePage="home" />

      {/* ── 1. HERO ─ light ──────────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '50% 46%', gap: '4%', alignItems: 'center' }}>
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
              Consulting firms deliver decks. Vendors demo features. Nobody owns the outcome. AbarVa is the first platform that does — with your data, 340+ patterns, and a Maestro who shares the outcome.
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Consulting spend wasted',       value: '$200B',  note: 'Global annual market with no outcome accountability' },
              { label: 'Enterprise AI with zero ROI',   value: '73%',    note: 'Of AI investments produce no verified outcome' },
              { label: '0% fee until outcomes verified', value: '0%',    note: 'No retainer. No hourly. Fee on what we actually deliver.' },
              { label: 'Time to first intelligence',    value: '48hrs',  note: 'From kickoff to your first Situation brief' },
            ].map(s => (
              <div key={s.label} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '22px 20px' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 12 }}>{s.label}</div>
                <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 700, color: LTEXT, lineHeight: 1.1, marginBottom: 10 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: LMUTE, lineHeight: 1.55 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. THE PROBLEM ─ dark ────────────────────────────────────────────── */}
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
              { num: '73%',    numColor: RED, title: 'AI spend with zero verified outcome',        body: 'Of enterprise AI programmes produce no measurable result. The money was spent. The board has been briefed. Nobody can prove it worked.' },
              { num: '$200B',  numColor: RED, title: 'Consulting spend with no accountability',    body: 'Consulting firms deliver decks and leave. No baseline. No outcome tracking. No skin in the game. The same firm comes back next year.' },
              { num: '4 weeks', numColor: AMB, title: 'Before a consultant knows your business',  body: 'Every engagement starts from scratch. Weeks 1–4 are learning the client. Your data, your patterns, your history — locked in their heads. Gone when they leave.' },
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

      {/* ── 3. WHAT ABARVA IS ─ light ────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
            How AbarVa works
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, lineHeight: 1.1, color: LTEXT, margin: '0 0 16px', maxWidth: 760 }}>
            Intelligence. Then execution.<br />Outcome-accountable fees.
          </h2>
          <p style={{ fontSize: 18, color: LBODY, lineHeight: 1.72, margin: '0 0 52px', maxWidth: 620 }}>
            AbarVa is not a consulting firm. It is an intelligence platform with embedded operators — Maestros — who own delivery and earn only when outcomes are verified.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, background: DBDR, border: `1px solid ${DBDR}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { num: '01', name: 'Intelligence Layer',
                desc: 'Five products that diagnose your situation, prescribe the right moves, and surface what\'s actually breaking.',
                items: ['Situation Intelligence — what\'s broken and what it costs', 'AI Investment Intelligence — where to place your bets', 'Vendor Intelligence — who wins in your situation', 'Business Case Intelligence — what the CFO will approve', 'Outcome Intelligence — did it work and can you prove it'] },
              { num: '02', name: 'The Genome',
                desc: '340 cross-client transformation patterns — each with documented failure rates, timelines, and recovery paths.',
                items: ['340 cross-client transformation patterns', 'Failure rates by industry, system, and vendor', 'Baseline ranges from peer organisations', 'Contradiction detection against your own data', 'Updated continuously from active engagements'] },
              { num: '03', name: 'Maestro Model',
                desc: 'Small teams of embedded operators who govern delivery, hold vendors accountable, and earn on verified outcomes.',
                items: ['4 Maestros replace 40 consultants', 'Knowledge stays — no dependency created', 'Vendor held to milestone-based contracts', 'Baseline locked on Day 0 — immutable', '15–20% outcome share on verified savings above baseline'] },
            ].map(layer => (
              <div key={layer.num} style={{ background: DCARD, padding: '32px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: DMUTE }}>{layer.num}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.06em', textTransform: 'uppercase' as const }}>{layer.name}</span>
                </div>
                <p style={{ fontSize: 13, color: DBODY, lineHeight: 1.65, marginBottom: 22 }}>{layer.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 9 }}>
                  {layer.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: TEAL, flexShrink: 0, marginTop: 7 }} />
                      <span style={{ fontSize: 12, color: DBODY, lineHeight: 1.55 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. HOW A PROJECT WORKS ─ dark ────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '96px 64px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            How a project works
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: DTEXT, margin: '0 0 52px' }}>
            From kickoff to verified outcome.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${DBDR}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
            {[
              { num: '01', name: 'DIAGNOSE',  time: '48 hrs',    desc: 'Situation product ingests your data. Contradictions surface. Real cost of inaction calculated.' },
              { num: '02', name: 'PRESCRIBE', time: '1–2 weeks', desc: 'Strategy, Vendor, and Business Case products produce the CFO-ready case — from your data, not the vendor\'s.' },
              { num: '03', name: 'EXECUTE',   time: 'Ongoing',   desc: 'Maestros embed. Vendors held to milestone contracts. Knowledge built internally, not outsourced.' },
              { num: '04', name: 'VERIFY',    time: 'Quarterly', desc: 'Baseline locked on Day 0. Outcome Intelligence measures delta. Fee calculated on verified results only.' },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ background: DCARD, padding: '32px 24px', borderRight: i < arr.length - 1 ? `1px solid ${DBDR}` : 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, marginBottom: 20 }}>{step.num} · {step.time}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 12 }}>{step.name}</div>
                <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.65 }}>{step.desc}</div>
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

      {/* ── 5. HOW AN ENGAGEMENT WORKS ─ light ───────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            How an engagement works
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: LTEXT, margin: '0 0 52px' }}>
            Five phases. Gated by client approval.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: `1px solid ${LBDR}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { phase: '0', name: 'Situation & Baseline', time: '48 hrs',    what: 'Data ingested. Contradictions surfaced. Genome patterns matched. Baseline locked.',                  gate: 'CEO signs off on baseline' },
              { phase: '1', name: 'Diagnosis',            time: '1–2 wks',   what: 'Full situation intelligence produced. Financial risk quantified. Root causes identified.',              gate: 'Client approves situation brief' },
              { phase: '2', name: 'Prescription',         time: '1–2 wks',   what: 'Solution design, vendor scorecard, and CFO-ready business case produced from client data.',            gate: 'CFO approves business case' },
              { phase: '3', name: 'Execution',            time: 'Ongoing',   what: 'Maestros embed. Vendors held to milestones. Knowledge built internally — not outsourced.',             gate: 'Monthly progress review' },
              { phase: '4', name: 'Verification',         time: 'Quarterly', what: 'Outcome Intelligence measures actuals vs baseline. Fee calculated on verified delta only.',             gate: 'Independent outcome audit' },
            ].map((p, i, arr) => (
              <div key={p.phase} style={{ background: LCARD, padding: '24px 20px', borderRight: i < arr.length - 1 ? `1px solid ${LBDR}` : 'none', display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, marginBottom: 10 }}>Phase {p.phase} · {p.time}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: LBODY, lineHeight: 1.65, flex: 1, marginBottom: 18 }}>{p.what}</div>
                <div style={{ background: 'rgba(45,212,200,0.06)', border: '1px solid rgba(45,212,200,0.2)', borderRadius: 6, padding: '8px 10px', fontSize: 10, color: TEAL, fontFamily: MONO }}>
                  Gate: {p.gate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. THE GENOME ─ dark ─────────────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '96px 64px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
              The Transformation Genome
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: DTEXT, margin: '0 0 22px', lineHeight: 1.2 }}>
              340 patterns. Each one a real transformation that succeeded — or failed.
            </h2>
            <p style={{ fontSize: 15, color: DBODY, lineHeight: 1.72, marginBottom: 20 }}>
              Every AbarVa recommendation is grounded in Genome patterns — cross-client data from real transformations with documented outcomes. Not analyst opinion. Not vendor marketing. Actual results from organisations that ran the play.
            </p>
            <p style={{ fontSize: 15, color: DBODY, lineHeight: 1.72 }}>
              When the Genome surfaces a failure pattern in your data, it cites the rate — and the organisations that recovered, and how.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {[
              { rate: '84%', label: 'No named executive sponsor',               sub: 'Programme drifts — vendor fills vacuum',             dot: '#EF4444' },
              { rate: '72%', label: 'Vendor dependency without internal capability', sub: 'Cannot verify delivery or recover if vendor fails', dot: '#F59E0B' },
              { rate: '68%', label: 'Data readiness below threshold',            sub: 'Migration starts before data is clean — doubles cost', dot: '#F59E0B' },
              { rate: '61%', label: 'Business case built by the vendor',         sub: 'Incentive misalignment — fails CFO scrutiny',         dot: '#F59E0B' },
              { rate: '23%', label: 'Client-built business case success rate',   sub: 'vs 71% when built from client\'s own data',          dot: '#34D399' },
            ].map(item => (
              <div key={item.label} style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, width: 70 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                  <div style={{ fontFamily: SERIF, fontSize: 24, color: DTEXT }}>{item.rate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: DTEXT, marginBottom: 3, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: DMUTE }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 7. THE FEE MODEL ─ light ─────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            The fee model
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: LTEXT, margin: '0 0 18px' }}>
            We earn when you earn.
          </h2>
          <p style={{ fontSize: 16, color: LBODY, lineHeight: 1.7, maxWidth: 640, marginBottom: 56 }}>
            The baseline is locked on Day 0 — every metric, every assumption, verified by the CXO and immutable. AbarVa cannot move the goalposts. Neither can you. If outcomes don&apos;t happen, we don&apos;t get paid.
          </p>
          <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${LBDR}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
            {[
              { step: '1', label: 'Baseline locked Day 0', desc: 'Every metric signed off by CEO/CFO. Written into the engagement contract. Immutable.' },
              { step: '2', label: 'Monthly tracking',      desc: 'Outcome Intelligence measures actuals against baseline each month. Client owns the data.' },
              { step: '3', label: 'Verified saving',       desc: 'Delta confirmed by independent audit. Not AbarVa\'s calculation — third-party verified.' },
              { step: '4', label: 'Fee triggered',         desc: 'AbarVa invoices on the verified delta only. No outcome — no fee. No exceptions.' },
            ].map((item, i, arr) => (
              <div key={i} style={{ flex: 1, background: LCARD, padding: '28px 22px', borderRight: i < arr.length - 1 ? `1px solid ${LBDR}` : 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: LMUTE, marginBottom: 16 }}>{item.step}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEAL, marginBottom: 10 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: LBODY, lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(45,212,200,0.06)', border: '1px solid rgba(45,212,200,0.2)', borderRadius: 10, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: LTEXT, fontStyle: 'italic', lineHeight: 1.65 }}>
              &ldquo;If outcomes don&apos;t happen, we don&apos;t get paid. That&apos;s the entire business model.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. LIVE DEMO CLIENTS ─ dark ──────────────────────────────────────── */}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              {
                name: 'Meridian Health System',
                initials: 'MH',
                vertical: 'Healthcare · $11.2B revenue',
                quote: '"$94M AI spend. Zero with a documented ROI. We are adding to cost, not value."',
                signals: ['Denial rate 18.2% vs 11.4% benchmark', 'AI portfolio: $42M — 0 delivering value', 'Travel nurse cost: $20M above target'],
                href: '/diagnose?client=meridian',
                cta: 'Explore Meridian →',
              },
              {
                name: 'Arcturus Financial Group',
                initials: 'AF',
                vertical: 'Financial Services · $16.2B AUM',
                quote: '"C/I ratio 71% vs 58% target. $840M efficiency gap. AI spend growing — outcomes not."',
                signals: ['C/I ratio 71% vs 61% peer median', 'CDO vacant 11 months — 14 initiatives blocked', 'MAS FEAT overdue — $2.4B AUM at risk'],
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
        </div>
      </div>

      {/* ── 9. CTA / CONTACT ─ light ─────────────────────────────────────────── */}
      <div id="contact" style={{ background: LBG, padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 700, color: LTEXT, margin: '0 0 16px', lineHeight: 1.05 }}>
            Ready to see your<br />organisation in here?
          </h2>
          <p style={{ fontSize: 18, color: LBODY, marginBottom: 56, lineHeight: 1.65 }}>No sales calls. A Maestro responds within 24 hours.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              <a href="/diagnose?client=meridian" style={{ background: 'rgba(45,212,200,0.05)', border: `1px solid rgba(45,212,200,0.22)`, borderRadius: 10, padding: '24px 26px', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 10 }}>No login required</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: LTEXT }}>See a live demo</div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: TEAL }}>→</div>
                </div>
                <div style={{ fontSize: 13, color: LBODY, lineHeight: 1.6 }}>Real intelligence on real data — Meridian Health or Arcturus Financial. No signup. Live now.</div>
              </a>
              <a href="/sign-in" style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '18px 24px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: LTEXT, marginBottom: 4 }}>Maestro login</div>
                  <div style={{ fontSize: 12, color: LBODY }}>Enter your org email — AbarVa routes you automatically</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: LMUTE, marginLeft: 20, flexShrink: 0 }}>→</div>
              </a>
              <a href="/investor" style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '18px 24px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: LTEXT, marginBottom: 4 }}>Investor view</div>
                  <div style={{ fontSize: 12, color: LBODY }}>Overview, vision, revenue model, and the ask</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: LMUTE, marginLeft: 20, flexShrink: 0 }}>→</div>
              </a>
            </div>

            <div>
              {!submitted ? (
                <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <input placeholder="First name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={darkInput} />
                    <input placeholder="Last name" style={darkInput} />
                  </div>
                  <input placeholder="Organization email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ ...darkInput, marginBottom: 12 }} />
                  <input placeholder="Organization name" value={formData.org} onChange={e => setFormData({ ...formData, org: e.target.value })} style={{ ...darkInput, marginBottom: 12 }} />
                  <textarea placeholder="Message (optional)" rows={3} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} style={{ ...darkInput, marginBottom: 16 }} />
                  <button type="submit" style={{ width: '100%', background: LTEXT, color: '#FFF', padding: '14px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                    Request a conversation →
                  </button>
                  <div style={{ fontSize: 12, color: LMUTE, marginTop: 10 }}>No sales calls. A Maestro responds within 24 hours.</div>
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
            <a href="/solutions"                style={{ fontSize: 13, color: DBODY, textDecoration: 'none' }}>Solutions</a>
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
