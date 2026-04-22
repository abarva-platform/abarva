'use client'
import Link from 'next/link'

const T = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#1C2128',
  border: '#21262D',
  border2: '#30363D',
  text: '#E6EDF3',
  text2: '#C9D1D9',
  text3: '#8B949E',
  blue: '#4DA3FF',
  teal: '#14B8A6',
  green: '#6EE7B7',
  amber: '#F59E0B',
  red: '#EF4444',
  mono: "'IBM Plex Mono', monospace",
  sans: "'IBM Plex Sans', sans-serif",
}

function Rule({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: T.mono, fontSize: '10px', fontWeight: 700, color, letterSpacing: '2.5px', textTransform: 'uppercase' as const }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: T.border2 }} />
    </div>
  )
}

const QUESTIONS = [
  {
    q: 'Should we stay with Ensemble or replace them?',
    a: 'Neither yet. Enforce the $8M in contractual penalties first. That changes the negotiation entirely — and builds the CFO\'s case without requiring a $14M termination fee.',
  },
  {
    q: 'Where do we start with AI?',
    a: 'Prior auth automation. CMS compliance deadline is January 2026. $28M annual value. Six-week activation using the Epic module you already purchased — 77% of it is sitting idle.',
  },
  {
    q: 'We have tried AI pilots before. Why will this be different?',
    a: 'Because this time we fix the CDO vacancy first. Every failed pilot died at deployment — that is an org problem, not a technology problem. We staff the deployment before we sign anything.',
  },
  {
    q: 'What does this cost?',
    a: '$4.2M investment. $28M Year 1 return. 1.8-month payback after go-live. Robert Chen has already seen these numbers — ask him before the meeting.',
  },
  {
    q: 'How do I know AbarVa\'s numbers are right?',
    a: 'Every number in this brief is sourced to a specific row in a specific file in your data. Click any metric on the platform and see exactly where it came from.',
  },
]

const DEMO_STEPS = [
  {
    n: '01',
    action: 'Open Data Intelligence',
    href: '/data-intelligence?client=meridian',
    why: 'Show him you already know his organization. Pull up the contradictions tab before he says a word. Let the silence land.',
  },
  {
    n: '02',
    action: 'Click Contradictions — stop at Ensemble',
    href: '/diagnose?client=meridian',
    why: 'Stop at the "$8M Ensemble penalty — never enforced." Do not narrate. Look at him. Wait for the reaction.',
  },
  {
    n: '03',
    action: 'Ask AbarVa as CIO',
    href: '/diagnose?client=meridian',
    why: 'Type: "Should we stay with Ensemble?" Live in the room. He will watch the response build in real time.',
  },
  {
    n: '04',
    action: 'Open AI Strategy — Wave 1',
    href: '/ai-strategy?client=meridian',
    why: 'Show Prior Auth as the first wave. CMS deadline. $28M. Already-purchased Epic module. Frame it as activation, not a new purchase.',
  },
  {
    n: '05',
    action: 'Open Solution Blueprint',
    href: '/blueprint?client=meridian',
    why: 'Show the full implementation plan with vendor already selected. Cohere Health. Timeline. Roles. Leave the page open when you stop presenting.',
  },
]

const LANDMINES = [
  {
    warn: 'Do not recommend replacing Ensemble in the first meeting.',
    why: 'The CEO has a personal relationship with the Ensemble CEO spanning 12 years. If Marcus agrees with you and escalates, the CEO blocks it and Marcus loses credibility on his first major initiative.',
    instead: 'Frame it as SLA performance accountability. "You have $8M in contractual penalties available right now. Use them." The exit conversation happens on its own timetable after that.',
  },
  {
    warn: 'Do not reference failed large-scale SI engagements by name.',
    why: 'Marcus came from a failed large-scale SI engagement at his previous health system — a $14M program that delivered nothing and ran 18 months over schedule. It is a personal wound.',
    instead: 'Reference Huron and Avanade as implementation partners. If traditional consulting comes up, say "outcome-based" not "boutique" or "next-gen." He will hear the difference.',
  },
  {
    warn: 'Do not lead with technology.',
    why: 'Marcus is a business-first CIO who has watched vendors lead with technology and deliver nothing measurable for 11 years. Opening with AI or cloud or platform signals that you are like everyone else.',
    instead: 'Lead with the $94M denial write-off and the board margin target. Spend the first 10 minutes entirely on his business problem. Technology enters as the solution, never as the topic.',
  },
]

const METRICS = [
  {
    value: '$94M',
    label: 'Denial write-off FY2023',
    context: '$50M is directly recoverable with prior auth automation and AI denial triage.',
    signal: 'The number he cannot ignore. Return to it whenever budget comes up.',
    color: T.red,
  },
  {
    value: '$8M',
    label: 'Ensemble penalties available',
    context: 'Contractually guaranteed. Three years of SLA misses. Never once enforced.',
    signal: 'This is your opening move on the vendor question — not termination, enforcement.',
    color: T.amber,
  },
  {
    value: '$28M',
    label: 'Prior auth automation value',
    context: 'Annual denial prevention. Six-week activation. Epic module already purchased.',
    signal: 'Your strongest ROI case. He already paid for the solution. Lead with this.',
    color: T.green,
  },
  {
    value: '4.0%',
    label: 'Board margin target',
    context: 'Currently 1.8%. Miss for Q1, Q2, Q3. Board review in 6 weeks.',
    signal: 'Every recommendation must map back to this number before you leave the room.',
    color: T.teal,
  },
  {
    value: 'Jan 2026',
    label: 'CMS compliance deadline',
    context: 'Prior auth electronic mandate. 100% required. Currently at 23% deployed.',
    signal: 'A hard regulatory backstop. Makes the prior auth investment non-negotiable.',
    color: T.blue,
  },
  {
    value: '58 / 100',
    label: 'Epic optimization score',
    context: 'After 7 years live. Target 85. Industry median 73. Only 12 of 47 dashboards active.',
    signal: 'His Epic. His score. Do not frame as failure — frame as 27 points of recoverable value.',
    color: '#A855F7',
  },
]

export default function PreMeetingBrief() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');" }} />
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text }}>

        {/* ─────────────────────────────────────── COVER ─── */}
        <div style={{ background: 'linear-gradient(150deg, #0a1628 0%, #0D1117 55%)', borderBottom: `3px solid ${T.teal}`, padding: '44px 56px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ maxWidth: '620px' }}>
            <div style={{ fontFamily: T.mono, fontSize: '9px', fontWeight: 700, letterSpacing: '3px', color: T.teal, textTransform: 'uppercase' as const, marginBottom: '16px' }}>
              Maestro Pre-Meeting Brief · Confidential
            </div>
            <h1 style={{ fontFamily: T.mono, fontSize: '24px', fontWeight: 600, color: T.text, lineHeight: 1.25, letterSpacing: '-0.01em', marginBottom: '20px' }}>
              Marcus Webb · CIO<br />Meridian Health System
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                'Board presentation in 6 weeks',
                'Operating margin miss Q1–Q3',
                'CDO vacant 8 months',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: T.teal, flexShrink: 0 }} />
                  <span style={{ fontFamily: T.sans, fontSize: '13px', color: T.text3 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: '9.5px', color: T.text3, lineHeight: 2.4, flexShrink: 0 }}>
            <div><strong style={{ color: T.text2 }}>MEETING DATE</strong>&nbsp;&nbsp;April 18, 2026</div>
            <div><strong style={{ color: T.text2 }}>LOCATION</strong>&nbsp;&nbsp;Meridian HQ · Charlotte, NC</div>
            <div><strong style={{ color: T.text2 }}>PREPARED BY</strong>&nbsp;&nbsp;AbarVa Intelligence</div>
            <div><strong style={{ color: T.text2 }}>DATA CONFIDENCE</strong>&nbsp;&nbsp;<span style={{ color: T.green }}>94%</span></div>
          </div>
        </div>

        {/* ─────────────────────────────────── BODY ─── */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '44px 56px 72px' }}>

          {/* ── 1. WHO YOU ARE MEETING (teal) ── */}
          <section style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.teal}`, borderRadius: '10px', padding: '32px', marginBottom: '20px' }}>
            <Rule label="Who You Are Meeting" color={T.teal} />
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '36px' }}>

              {/* Profile column */}
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(20,184,166,0.12)', border: `2px solid rgba(20,184,166,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontWeight: 700, fontSize: '16px', color: T.teal, marginBottom: '14px' }}>MW</div>
                <div style={{ fontFamily: T.sans, fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '3px' }}>Marcus Webb</div>
                <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal, letterSpacing: '1px', marginBottom: '4px' }}>Chief Information Officer</div>
                <div style={{ fontFamily: T.sans, fontSize: '11px', color: T.text3, marginBottom: '18px' }}>8 months in role · from Atrium Health</div>
                <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '12px 14px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: '8.5px', color: T.text3, letterSpacing: '1.5px', marginBottom: '7px' }}>HIS WORDS</div>
                  <div style={{ fontFamily: T.sans, fontSize: '11.5px', color: T.text2, fontStyle: 'italic', lineHeight: 1.75 }}>
                    "I inherited a mess. We have 23 hospitals that operate like 23 different companies."
                  </div>
                </div>
              </div>

              {/* What he cares about */}
              <div>
                <div style={{ fontFamily: T.mono, fontSize: '9px', fontWeight: 700, color: T.text3, letterSpacing: '1.5px', marginBottom: '14px' }}>WHAT HE CARES ABOUT</div>
                {[
                  { h: 'Inherited fragmentation', d: '23 hospitals running like 23 separate companies. Blue Ridge still on legacy Cerner. Integration 8 months overdue with no new budget.' },
                  { h: 'Vendor accountability', d: 'Ensemble $8M in penalties — never enforced in 3 years. He finds this infuriating but is politically trapped by the CEO\'s relationship.' },
                  { h: 'Quick wins for credibility', d: '8 months in. No major win on the board yet. Review in 6 weeks. He needs something concrete he can claim.' },
                ].map((b, i) => (
                  <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                    <div style={{ fontFamily: T.sans, fontSize: '12px', fontWeight: 600, color: T.text, marginBottom: '4px' }}>{b.h}</div>
                    <div style={{ fontFamily: T.sans, fontSize: '11px', color: T.text3, lineHeight: 1.7 }}>{b.d}</div>
                  </div>
                ))}
              </div>

              {/* What motivates him */}
              <div>
                <div style={{ fontFamily: T.mono, fontSize: '9px', fontWeight: 700, color: T.text3, letterSpacing: '1.5px', marginBottom: '14px' }}>WHAT MOTIVATES HIM</div>
                {[
                  { h: 'Proving himself in year one', d: 'Hired specifically to drive transformation. Every quarter without a visible win is a personal mark against him.' },
                  { h: 'Getting the CDO hired', d: 'He is carrying both CIO and CDO scope with a team built for one. The right CDO unlocks six other things immediately.' },
                  { h: 'Showing the board AI progress', d: 'CEO has publicly committed to AI leadership in the Southeast. Marcus owns delivery. He has no room to miss.' },
                ].map((b, i) => (
                  <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                    <div style={{ fontFamily: T.sans, fontSize: '12px', fontWeight: 600, color: T.text, marginBottom: '4px' }}>{b.h}</div>
                    <div style={{ fontFamily: T.sans, fontSize: '11px', color: T.text3, lineHeight: 1.7 }}>{b.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* What keeps him up */}
            <div style={{ marginTop: '24px', background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.18)', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontFamily: T.mono, fontSize: '9px', fontWeight: 700, color: T.teal, letterSpacing: '2px', flexShrink: 0, textTransform: 'uppercase' as const }}>What Keeps Him Up</span>
              <div style={{ width: '1px', height: '24px', background: T.border2, flexShrink: 0 }} />
              <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text2, lineHeight: 1.65 }}>
                "The $94M denial write-off. He inherited it and owns fixing it. Every quarter it appears on the P&L is a quarter where he has not moved fast enough."
              </div>
            </div>
          </section>

          {/* ── 2. WHAT HE WILL ASK (amber) ── */}
          <section style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.amber}`, borderRadius: '10px', padding: '32px', marginBottom: '20px' }}>
            <Rule label="What He Will Ask" color={T.amber} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {QUESTIONS.map((item, i) => (
                <div key={i} style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: '8px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <div style={{ fontFamily: T.mono, fontSize: '22px', fontWeight: 700, color: T.border2, flexShrink: 0, lineHeight: 1.1, marginTop: '1px', minWidth: '36px' }}>Q{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: T.sans, fontSize: '14px', fontWeight: 500, color: T.text, lineHeight: 1.65, marginBottom: '12px' }}>"{item.q}"</div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: T.mono, fontSize: '8.5px', fontWeight: 700, color: T.amber, letterSpacing: '1.5px', flexShrink: 0, marginTop: '3px', textTransform: 'uppercase' as const }}>Your Answer</span>
                        <div style={{ width: '1px', background: T.border2, alignSelf: 'stretch', flexShrink: 0 }} />
                        <div style={{ fontFamily: T.sans, fontSize: '12.5px', color: T.amber, lineHeight: 1.7, fontStyle: 'italic' }}>{item.a}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline reference */}
          <div style={{ marginTop: '14px', background: T.surface2, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: '8px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: '9px', fontWeight: 700, color: T.amber, letterSpacing: '1.5px', marginBottom: '5px', textTransform: 'uppercase' as const }}>Understand the History First</div>
              <div style={{ fontFamily: T.sans, fontSize: '12px', color: T.text3, lineHeight: 1.65 }}>Every answer above connects to a decision Meridian made before Marcus arrived. Open the Decision Timeline before the Q&amp;A starts — CIOs recognize themselves in it immediately.</div>
            </div>
            <Link href="/engagements" style={{ fontFamily: T.mono, fontSize: '10px', padding: '8px 16px', borderRadius: '6px', background: 'rgba(245,158,11,0.07)', color: T.amber, border: `1px solid rgba(245,158,11,0.2)`, textDecoration: 'none', flexShrink: 0, marginLeft: '20px', whiteSpace: 'nowrap' as const }}>
              Decision Timeline →
            </Link>
          </div>

          {/* ── 3. WHAT TO SHOW (blue) ── */}
          <section style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.blue}`, borderRadius: '10px', padding: '32px', marginBottom: '20px' }}>
            <Rule label="What to Show — Demo Flow" color={T.blue} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DEMO_STEPS.map((s, i) => (
                <div key={i} style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: '8px', padding: '16px 18px', display: 'flex', gap: '18px', alignItems: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: '11px', fontWeight: 700, color: T.blue, flexShrink: 0, minWidth: '28px' }}>{s.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.sans, fontSize: '13px', fontWeight: 600, color: T.text, marginBottom: '5px' }}>{s.action}</div>
                    <div style={{ fontFamily: T.sans, fontSize: '12px', color: T.text3, lineHeight: 1.65 }}>{s.why}</div>
                  </div>
                  <a href={s.href} style={{ fontFamily: T.mono, fontSize: '9px', padding: '5px 12px', borderRadius: '5px', background: 'rgba(77,163,255,0.08)', color: T.blue, border: '1px solid rgba(77,163,255,0.25)', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' as const }}>Open →</a>
                </div>
              ))}
            </div>
          </section>

          {/* ── 4. WHAT NOT TO SAY (red) ── */}
          <section style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.red}`, borderRadius: '10px', padding: '32px', marginBottom: '20px' }}>
            <Rule label="What Not to Say" color={T.red} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {LANDMINES.map((lm, i) => (
                <div key={i} style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '16px 18px' }}>
                  {/* Warning header */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{ color: T.red, fontSize: '14px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>✕</span>
                    <div style={{ fontFamily: T.sans, fontSize: '13px', fontWeight: 700, color: T.red, lineHeight: 1.4 }}>{lm.warn}</div>
                  </div>
                  {/* Why */}
                  <div style={{ fontFamily: T.sans, fontSize: '12px', color: T.text3, lineHeight: 1.75, marginBottom: '12px', paddingLeft: '24px' }}>{lm.why}</div>
                  {/* Say instead */}
                  <div style={{ background: 'rgba(110,231,183,0.05)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: '6px', padding: '11px 14px', marginLeft: '24px' }}>
                    <div style={{ fontFamily: T.mono, fontSize: '8.5px', fontWeight: 700, color: T.green, letterSpacing: '1.5px', textTransform: 'uppercase' as const, marginBottom: '5px' }}>Say Instead</div>
                    <div style={{ fontFamily: T.sans, fontSize: '12px', color: T.text2, lineHeight: 1.75, fontStyle: 'italic' }}>{lm.instead}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 5. KEY NUMBERS TO KNOW (green) ── */}
          <section style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.green}`, borderRadius: '10px', padding: '32px' }}>
            <Rule label="Key Numbers to Know" color={T.green} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {METRICS.map((m, i) => (
                <div key={i} style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: '8px', padding: '20px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: '26px', fontWeight: 700, color: m.color, marginBottom: '5px', lineHeight: 1.1, letterSpacing: '-0.01em' }}>{m.value}</div>
                  <div style={{ fontFamily: T.sans, fontSize: '12px', fontWeight: 600, color: T.text, marginBottom: '8px' }}>{m.label}</div>
                  <div style={{ fontFamily: T.sans, fontSize: '11px', color: T.text3, lineHeight: 1.7, marginBottom: '12px' }}>{m.context}</div>
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '10px', fontFamily: T.mono, fontSize: '9px', color: T.text3, lineHeight: 1.6 }}>
                    <span style={{ color: T.blue }}>SIGNAL </span>{m.signal}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.text3, letterSpacing: '0.5px' }}>
              MAESTRO INTELLIGENCE · AbarVa · INTERNAL USE ONLY · MERIDIAN HEALTH SYSTEM · APRIL 2026
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="/platform/admin/context" style={{ fontFamily: T.mono, fontSize: '10px', color: T.text3, textDecoration: 'none', padding: '6px 14px', border: `1px solid ${T.border2}`, borderRadius: '5px' }}>Business Context →</a>
              <a href="/platform/admin" style={{ fontFamily: T.mono, fontSize: '10px', color: T.text3, textDecoration: 'none', padding: '6px 14px', border: `1px solid ${T.border2}`, borderRadius: '5px' }}>← Admin Hub</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
