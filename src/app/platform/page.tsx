'use client'
import AbarvaNav from '@/components/AbarvaNav'

const LBG = '#F8F7F4', LTEXT = '#0C0C0C', LBODY = '#3C3C3C', LMUTE = '#888888', LBDR = '#E2E1DC', LCARD = '#FFFFFF'
const DBG = '#060A12', DTEXT = '#EFF6FF', DBODY = 'rgba(255,255,255,0.74)', DMUTE = 'rgba(255,255,255,0.46)', DBDR = '#1C2D45', DCARD = '#0D1520'
const TEAL = '#2DD4C8', SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

export default function PlatformPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: SANS }}>
      <AbarvaNav activePage="platform" />

      {/* ── HERO ─ light ─────────────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px 88px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
            How AbarVa works
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 400, lineHeight: 1.08, color: LTEXT, margin: '0 0 28px', maxWidth: 760 }}>
            Intelligence. Then execution.<br />Fee on outcomes only.
          </h1>
          <p style={{ fontSize: 18, color: LBODY, lineHeight: 1.72, margin: '0 0 40px', maxWidth: 620 }}>
            AbarVa is not a consulting firm. It is an intelligence platform with embedded operators — Maestros — who own delivery and earn only when outcomes are verified.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            <a href="/diagnose?client=meridian" style={{ background: LTEXT, color: '#FFF', padding: '13px 26px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              See it working →
            </a>
            <a href="#contact" style={{ background: 'transparent', color: LBODY, border: `1px solid ${LBDR}`, padding: '13px 26px', borderRadius: 8, fontSize: 14, textDecoration: 'none' }}>
              Talk to a Maestro
            </a>
          </div>
        </div>
      </div>

      {/* ── THREE LAYERS ─ dark ───────────────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '88px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            Three layers · One platform
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: DTEXT, margin: '0 0 52px' }}>
            Intelligence. Knowledge. Execution.
          </h2>
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
                items: ['4 Maestros replace 40 consultants', 'Knowledge stays — no dependency created', 'Vendor held to milestone-based contracts', 'Baseline locked on Day 0 — immutable', 'Fee on verified outcome delta only'] },
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

      {/* ── HOW A PROJECT WORKS ─ light ───────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            How a project works
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: LTEXT, margin: '0 0 52px' }}>
            From kickoff to verified outcome.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${LBDR}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { num: '01', name: 'DIAGNOSE',  time: '48 hrs',    desc: 'Situation product ingests your data. Contradictions surface. Real cost of inaction calculated.' },
              { num: '02', name: 'PRESCRIBE', time: '1–2 weeks', desc: 'Strategy, Vendor, and Business Case products produce the CFO-ready case — from your data, not the vendor\'s.' },
              { num: '03', name: 'EXECUTE',   time: 'Ongoing',   desc: 'Maestros embed. Vendors held to milestone contracts. Knowledge built internally, not outsourced.' },
              { num: '04', name: 'VERIFY',    time: 'Quarterly', desc: 'Baseline locked on Day 0. Outcome Intelligence measures delta. Fee calculated on verified results only.' },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ background: LCARD, padding: '28px 24px', borderRight: i < arr.length - 1 ? `1px solid ${LBDR}` : 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, marginBottom: 20 }}>{step.num} · {step.time}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>{step.name}</div>
                <div style={{ fontSize: 13, color: LBODY, lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ENGAGEMENT PHASES ─ dark ──────────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            How an engagement works
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: DTEXT, margin: '0 0 52px' }}>
            Five phases. Gated by client approval.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: `1px solid ${DBDR}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { phase: '0', name: 'Situation & Baseline', time: '48 hrs',    what: 'Data ingested. Contradictions surfaced. Genome patterns matched. Baseline locked.',                  gate: 'CEO signs off on baseline' },
              { phase: '1', name: 'Diagnosis',            time: '1–2 wks',   what: 'Full situation intelligence produced. Financial risk quantified. Root causes identified.',              gate: 'Client approves situation brief' },
              { phase: '2', name: 'Prescription',         time: '1–2 wks',   what: 'Solution design, vendor scorecard, and CFO-ready business case produced from client data.',            gate: 'CFO approves business case' },
              { phase: '3', name: 'Execution',            time: 'Ongoing',   what: 'Maestros embed. Vendors held to milestones. Knowledge built internally — not outsourced.',             gate: 'Monthly progress review' },
              { phase: '4', name: 'Verification',         time: 'Quarterly', what: 'Outcome Intelligence measures actuals vs baseline. Fee calculated on verified delta only.',             gate: 'Independent outcome audit' },
            ].map((p, i, arr) => (
              <div key={p.phase} style={{ background: DCARD, padding: '24px 20px', borderRight: i < arr.length - 1 ? `1px solid ${DBDR}` : 'none', display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, marginBottom: 10 }}>Phase {p.phase} · {p.time}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: DBODY, lineHeight: 1.65, flex: 1, marginBottom: 18 }}>{p.what}</div>
                <div style={{ background: 'rgba(45,212,200,0.06)', border: '1px solid rgba(45,212,200,0.15)', borderRadius: 6, padding: '8px 10px', fontSize: 10, color: TEAL, fontFamily: MONO }}>
                  Gate: {p.gate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── THE GENOME ─ light ────────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
              The Transformation Genome
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: LTEXT, margin: '0 0 22px', lineHeight: 1.2 }}>
              340 patterns. Each one a real transformation that succeeded — or failed.
            </h2>
            <p style={{ fontSize: 15, color: LBODY, lineHeight: 1.72, marginBottom: 20 }}>
              Every AbarVa recommendation is grounded in Genome patterns — cross-client data from real transformations with documented outcomes. Not analyst opinion. Not vendor marketing. Actual results from organisations that ran the play.
            </p>
            <p style={{ fontSize: 15, color: LBODY, lineHeight: 1.72 }}>
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
              <div key={item.label} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, width: 70 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                  <div style={{ fontFamily: SERIF, fontSize: 24, color: LTEXT }}>{item.rate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: LTEXT, marginBottom: 3, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: LMUTE }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEE MODEL ─ dark ──────────────────────────────────────────────────── */}
      <div style={{ background: DBG, padding: '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
            The fee model
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: DTEXT, margin: '0 0 18px' }}>
            We earn when you earn.
          </h2>
          <p style={{ fontSize: 16, color: DBODY, lineHeight: 1.7, maxWidth: 640, marginBottom: 56 }}>
            The baseline is locked on Day 0 — every metric, every assumption, verified by the CXO and immutable. AbarVa cannot move the goalposts. Neither can you. If outcomes don&apos;t happen, we don&apos;t get paid.
          </p>
          <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${DBDR}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
            {[
              { step: '1', label: 'Baseline locked Day 0', desc: 'Every metric signed off by CEO/CFO. Written into the engagement contract. Immutable.' },
              { step: '2', label: 'Monthly tracking',      desc: 'Outcome Intelligence measures actuals against baseline each month. Client owns the data.' },
              { step: '3', label: 'Verified saving',       desc: 'Delta confirmed by independent audit. Not AbarVa\'s calculation — third-party verified.' },
              { step: '4', label: 'Fee triggered',         desc: 'AbarVa invoices on the verified delta only. No outcome — no fee. No exceptions.' },
            ].map((item, i, arr) => (
              <div key={i} style={{ flex: 1, background: DCARD, padding: '28px 22px', borderRight: i < arr.length - 1 ? `1px solid ${DBDR}` : 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: DMUTE, marginBottom: 16 }}>{item.step}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: TEAL, marginBottom: 10 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(45,212,200,0.05)', border: '1px solid rgba(45,212,200,0.2)', borderRadius: 10, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: DTEXT, fontStyle: 'italic', lineHeight: 1.65 }}>
              &ldquo;If outcomes don&apos;t happen, we don&apos;t get paid. That&apos;s the entire business model.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ─ light ───────────────────────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '80px 64px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' as const }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, color: LTEXT, margin: '0 0 14px' }}>
            See it running on real data.
          </h2>
          <p style={{ fontSize: 15, color: LBODY, lineHeight: 1.7, marginBottom: 36 }}>
            Two composite organisations across healthcare and financial services. No signup required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' as const, flexWrap: 'wrap' as const }}>
            <a href="/diagnose?client=meridian" style={{ background: LTEXT, color: '#FFF', padding: '13px 26px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              See Meridian Health →
            </a>
            <a href="/clients" style={{ background: 'transparent', color: LBODY, border: `1px solid ${LBDR}`, padding: '13px 26px', borderRadius: 8, fontSize: 14, textDecoration: 'none' }}>
              Both clients
            </a>
          </div>
        </div>
      </div>

    </div>
  )
}
