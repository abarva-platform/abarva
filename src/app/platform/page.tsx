'use client'
import AbarvaNav from '@/components/AbarvaNav'

const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = '#94A3B8'
const AMBER = '#F59E0B', GREEN = '#34D399', RED = '#EF4444'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

export default function PlatformPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="platform" />

      {/* Hero */}
      <div style={{ padding: '96px 32px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
          How AbarVa works
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px', maxWidth: '720px' }}>
          Intelligence. Then execution.<br />
          <em style={{ color: TEAL }}>Fee on outcomes only.</em>
        </h1>
        <p style={{ fontSize: '17px', color: MUTED, maxWidth: '560px', lineHeight: 1.7, margin: '0 0 48px' }}>
          AbarVa is not a consulting firm. It is an intelligence platform with embedded operators —
          Maestros — who own delivery and earn only when outcomes are verified.
        </p>
      </div>

      {/* Three layers */}
      <div style={{ background: '#08101C', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '64px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '32px' }}>
            Three layers · One platform
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: BORDER, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
            {[
              {
                num: '01',
                name: 'Intelligence Layer',
                color: TEAL,
                desc: 'Five products that diagnose your situation, prescribe the right moves, and surface what\'s actually breaking.',
                items: ['Situation Intelligence — what\'s broken and what it costs', 'AI Investment Intelligence — where to place your bets', 'Vendor Intelligence — who wins in your situation', 'Business Case Intelligence — what the CFO will approve', 'Outcome Intelligence — did it work and can you prove it'],
              },
              {
                num: '02',
                name: 'Genome',
                color: AMBER,
                desc: 'A pattern library built from 340+ real transformations — each with documented failure rates, timelines, and recovery paths.',
                items: ['340 cross-client transformation patterns', 'Failure rates by industry, system, and vendor', 'Baseline ranges from peer organisations', 'Contradiction detection against your own data', 'Updated continuously from active engagements'],
              },
              {
                num: '03',
                name: 'Maestro Model',
                color: GREEN,
                desc: 'Small teams of embedded operators who govern delivery, hold vendors accountable, and earn on verified outcomes.',
                items: ['4 Maestros replace 40 consultants', 'Knowledge stays — no dependency created', 'Vendor held to milestone-based contracts', 'Baseline locked on Day 0 — immutable', 'Fee on verified outcome delta only'],
              },
            ].map(layer => (
              <div key={layer.num} style={{ background: CARD, padding: '32px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '10px', color: MUTED }}>{layer.num}</span>
                  <span style={{ fontFamily: MONO, fontSize: '11px', color: layer.color, letterSpacing: '.06em', textTransform: 'uppercase' as const }}>{layer.name}</span>
                </div>
                <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '20px' }}>{layer.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  {layer.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: layer.color, flexShrink: 0, marginTop: '6px' }} />
                      <span style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How a project works */}
      <div style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
            How a project works
          </div>
          <div style={{ fontFamily: SERIF, fontSize: '36px', color: WHITE, marginBottom: '48px' }}>
            From kickoff to verified outcome.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
            {[
              { num: '01', name: 'DIAGNOSE', time: '48 hrs', color: TEAL, desc: 'Situation product ingests your data. Contradictions surface. Real cost of inaction calculated.' },
              { num: '02', name: 'PRESCRIBE', time: '1–2 weeks', color: AMBER, desc: 'Strategy, Vendor, and Business Case products produce the CFO-ready case — from your data, not the vendor\'s.' },
              { num: '03', name: 'EXECUTE', time: 'Ongoing', color: GREEN, desc: 'Maestros embed. Vendors held to milestone contracts. Knowledge built internally, not outsourced.' },
              { num: '04', name: 'VERIFY', time: 'Quarterly', color: TEAL, desc: 'Baseline locked on Day 0. Outcome Intelligence measures delta. Fee calculated on verified results only.' },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ padding: '28px 24px', borderRight: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none', background: CARD }}>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, marginBottom: '8px' }}>{step.num} · {step.time}</div>
                <div style={{ fontFamily: MONO, fontSize: '11px', color: step.color, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>{step.name}</div>
                <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Genome */}
      <div style={{ background: '#08101C', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '80px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: AMBER, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
              The Transformation Genome
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: '36px', color: WHITE, margin: '0 0 16px', lineHeight: 1.2 }}>
              340 patterns. Each one a real transformation that succeeded — or failed.
            </h2>
            <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7, marginBottom: '24px' }}>
              Every AbarVa recommendation is grounded in Genome patterns — cross-client data from
              real transformations with documented outcomes. Not analyst opinion. Not vendor marketing.
              Actual results from organisations that ran the play.
            </p>
            <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7 }}>
              When the Genome surfaces a failure pattern in your data, it cites the rate — and the
              organisations that recovered, and how.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
            {[
              { rate: '84%', label: 'No named executive sponsor', sub: 'Programme drifts — vendor fills vacuum', color: RED },
              { rate: '72%', label: 'Vendor dependency without internal capability', sub: 'Cannot verify delivery or recover if vendor fails', color: AMBER },
              { rate: '68%', label: 'Data readiness below threshold', sub: 'Migration starts before data is clean — doubles cost', color: AMBER },
              { rate: '61%', label: 'Business case built by the vendor', sub: 'Incentive misalignment — fails CFO scrutiny', color: AMBER },
              { rate: '23%', label: 'Client-built business case success rate', sub: 'vs 71% when built from client\'s own data', color: GREEN },
            ].map(item => (
              <div key={item.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontFamily: MONO, fontSize: '20px', fontWeight: 700, color: item.color, flexShrink: 0, width: '52px' }}>{item.rate}</div>
                <div>
                  <div style={{ fontSize: '13px', color: WHITE, marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: MUTED }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fee model */}
      <div style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
            The fee model
          </div>
          <div style={{ fontFamily: SERIF, fontSize: '36px', color: WHITE, marginBottom: '16px' }}>
            We earn when you earn.
          </div>
          <p style={{ fontSize: '15px', color: MUTED, lineHeight: 1.7, maxWidth: '600px', marginBottom: '40px' }}>
            The baseline is locked on Day 0 — every metric, every assumption, verified by the CXO
            and immutable. AbarVa cannot move the goalposts. Neither can you.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Baseline locked', desc: 'Day 0. Immutable. Every metric signed off by the CXO before engagement begins.', color: TEAL },
              { label: 'Fee on delta only', desc: 'AbarVa earns on the verified difference between baseline and actuals — not on hours or deliverables.', color: GREEN },
              { label: 'Outcome Intelligence', desc: 'The fifth product tracks actuals against baseline quarterly. The data is yours — not held by the vendor.', color: AMBER },
            ].map(item => (
              <div key={item.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `2px solid ${item.color}`, borderRadius: '10px', padding: '24px 20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE, marginBottom: '10px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#08101C', borderTop: `1px solid ${BORDER}`, padding: '64px 32px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' as const }}>
          <div style={{ fontFamily: SERIF, fontSize: '32px', color: WHITE, marginBottom: '12px' }}>
            See it running on real data.
          </div>
          <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7, marginBottom: '28px' }}>
            Three composite organisations across healthcare, financial services, and asset management.
            No signup required.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' as const, flexWrap: 'wrap' as const }}>
            <a href="/diagnose?client=meridian" style={{ background: TEAL, color: BG, padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              See Meridian Health →
            </a>
            <a href="/clients" style={{ background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, padding: '12px 24px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none' }}>
              All three clients
            </a>
          </div>
        </div>
      </div>

    </div>
  )
}
