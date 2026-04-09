'use client'

// CADE dark theme tokens — matches architecture/page.tsx color system
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
  teal: '#2DD4C8',
  green: '#6EE7B7',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#A855F7',
  mono: "'IBM Plex Mono', monospace",
  sans: "'IBM Plex Sans', sans-serif",
}

function SectionRule({ label, color = T.blue }: { label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: T.mono, fontSize: '10px', fontWeight: 700, color, letterSpacing: '2.5px', textTransform: 'uppercase' as const }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: T.border2 }} />
    </div>
  )
}

export default function PreMeetingBrief() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap');" }} />
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text }}>

        {/* ── Cover ── */}
        <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0D1117 60%)', borderBottom: `3px solid ${T.blue}`, padding: '36px 48px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: '9px', fontWeight: 700, letterSpacing: '3px', color: T.blue, textTransform: 'uppercase' as const, marginBottom: '10px' }}>Maestro // Pre-Meeting Intelligence Brief</div>
            <div style={{ fontFamily: T.mono, fontSize: '22px', fontWeight: 600, color: T.text, lineHeight: 1.2, marginBottom: '4px' }}>Meridian Health System</div>
            <div style={{ fontSize: '13px', color: T.text3, marginTop: '6px' }}>
              CIO Meeting Preparation · <span style={{ color: T.green }}>Marcus Webb</span> · April 2026
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: '9.5px', color: T.text3, lineHeight: 2.2 }}>
            <div><strong style={{ color: T.text2 }}>CLASSIFICATION</strong>&nbsp;&nbsp;Internal · Maestro Only</div>
            <div><strong style={{ color: T.text2 }}>ENGAGEMENT PHASE</strong>&nbsp;&nbsp;AI Strategy</div>
            <div><strong style={{ color: T.text2 }}>DATA CONFIDENCE</strong>&nbsp;&nbsp;<span style={{ color: T.green }}>94%</span></div>
            <div><strong style={{ color: T.text2 }}>PREPARED</strong>&nbsp;&nbsp;April 9, 2026</div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 48px 64px' }}>

          {/* ── 1. WHO YOU ARE MEETING ── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.blue}`, borderRadius: '10px', padding: '28px', marginBottom: '20px' }}>
            <SectionRule label="Who You Are Meeting" color={T.blue} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #1B4FD8, #2DD4C8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontWeight: 700, fontSize: '15px', color: '#fff', flexShrink: 0 }}>MW</div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '2px' }}>Marcus Webb</div>
                    <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.blue, letterSpacing: '1px' }}>Chief Information Officer</div>
                    <div style={{ fontSize: '11px', color: T.text3, marginTop: '3px' }}>8 months in role · came from Atrium Health</div>
                  </div>
                </div>
                <div style={{ fontSize: '12.5px', color: T.text3, lineHeight: 1.75, marginBottom: '18px' }}>
                  Former CIO at Atrium Health where he led a full Epic implementation and an Azure cloud migration. Joined Meridian to drive transformation. Is now reckoning with the gap between what he was told he was inheriting and what actually exists. New enough to have fresh eyes. Experienced enough to spot a sales deck.
                </div>
                <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '14px 16px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.text3, letterSpacing: '1.5px', marginBottom: '8px' }}>HIS OWN WORDS</div>
                  <div style={{ fontSize: '12.5px', color: T.text2, fontStyle: 'italic', lineHeight: 1.75 }}>
                    "I inherited a mess. We have 23 hospitals that operate like 23 different companies. My first priority is understanding what we actually have before I commit to any transformation roadmap. The board wants answers in 90 days but I need 6 months just to do a proper assessment."
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.amber, letterSpacing: '1.5px', marginBottom: '12px' }}>TOP 3 LIVE CONCERNS</div>
                {[
                  {
                    n: '01',
                    title: 'Inherited significant technical debt',
                    detail: '23 hospitals running fragmented systems. Blue Ridge still on a legacy Epic version. Integration already 8 months overdue with no additional budget allocated.',
                  },
                  {
                    n: '02',
                    title: 'Team is understaffed and overextended',
                    detail: 'No CDO. Marcus is carrying both CIO and CDO scope with a team built for one role. Every new initiative competes for the same depleted bandwidth.',
                  },
                  {
                    n: '03',
                    title: 'Board expects transformation — budget does not agree',
                    detail: 'Only $84M approved for transformation vs $200M required by the roadmap. He is accountable for results he cannot fully fund.',
                  },
                ].map((c) => (
                  <div key={c.n} style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '7px', padding: '12px 14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: T.mono, fontSize: '11px', color: T.amber, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{c.n}</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: T.text, marginBottom: '4px' }}>{c.title}</div>
                        <div style={{ fontSize: '11px', color: T.text3, lineHeight: 1.65 }}>{c.detail}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 2. WHAT HE WILL ASK ── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.purple}`, borderRadius: '10px', padding: '28px', marginBottom: '20px' }}>
            <SectionRule label="What He Will Ask" color={T.purple} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  q: 'My IT budget went up 12% this year but 67% is already committed to keeping the lights on. Where exactly does your work fit in the remaining $84M?',
                  signal: 'Budget 12% increase / 67% run-the-business allocation',
                  how: 'Answer with activation, not new spend. "We are not asking for new budget. We are activating assets you have already purchased and recovering the $94M you are currently writing off."',
                },
                {
                  q: 'The board wants 4% margin by FY2026 but only approved $84M for transformation when the analysis says $200M is needed. How do your recommendations work within that constraint?',
                  signal: 'Board margin mandate vs approved transformation budget gap',
                  how: 'Sequence the RCM recovery first. The $94M denial write-off, partially recovered, self-funds the roadmap. Show the math before he asks.',
                },
                {
                  q: 'I am already carrying the CDO role. Who in your model owns the data strategy day-to-day once you deliver a roadmap and leave?',
                  signal: 'CDO role vacant — CIO covering both responsibilities',
                  how: 'Do not dodge. "We build the data governance framework and architecture before the CDO is hired. The CDO inherits a running operation, not a blank slate. That is rare and it is valuable."',
                },
                {
                  q: 'You will tell me Ensemble is underperforming. I know that. But the CFO will not enforce the $8M in SLA penalties. What is your path that does not start with a $14M termination fee?',
                  signal: 'RCM outsourced at $48M/yr — $8M penalties unenforced — $14M exit cost',
                  how: 'Do not lead with termination. Lead with parallel track: Epic prior auth automation builds the CFO\'s case from inside the contract. The exit conversation happens on its own timetable.',
                },
                {
                  q: 'We already bought the Epic prior auth module and it is sitting at 23% deployed. Are you recommending I buy more AI software when I cannot finish what we already paid for?',
                  signal: 'Prior auth module purchased, 77% idle — AI evaluation ongoing in parallel',
                  how: 'This is your best moment in the meeting. "We are not recommending a new purchase. We are recommending you activate the 77% of a module you already own. Full deployment is worth $31M annually in denial prevention."',
                },
              ].map((item, i) => (
                <div key={i} style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: '8px', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ fontFamily: T.mono, fontSize: '20px', fontWeight: 700, color: T.border2, flexShrink: 0, lineHeight: 1.15, marginTop: '2px' }}>Q{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: T.text, lineHeight: 1.65, marginBottom: '8px' }}>"{item.q}"</div>
                      <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.text3, letterSpacing: '0.5px', marginBottom: '7px' }}>
                        <span style={{ color: T.purple }}>SIGNAL </span>{item.signal}
                      </div>
                      <div style={{ fontSize: '12px', color: T.teal, lineHeight: 1.6, fontStyle: 'italic' }}>→ {item.how}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 3 + 4. WHAT TO SHOW  /  WHAT NOT TO SAY ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* 3. WHAT TO SHOW */}
            <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.teal}`, borderRadius: '10px', padding: '28px' }}>
              <SectionRule label="What to Show" color={T.teal} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  {
                    n: '01',
                    page: 'Diagnose — CIO View',
                    href: '/diagnose?client=meridian',
                    note: 'Open cold. Do not narrate. Let him see Epic 58/100, 18.2% denial rate, Blue Ridge overdue. Silence is your friend here — let the data land.',
                  },
                  {
                    n: '02',
                    page: 'AI Strategy — Opportunities',
                    href: '/ai-strategy?client=meridian',
                    note: 'Epic optimization use case: 27-point score improvement, $23M operational value. This is his Epic system. Validates his instincts without assigning blame.',
                  },
                  {
                    n: '03',
                    page: 'Architecture Pattern',
                    href: '/architecture?client=meridian',
                    note: 'Show the CADE AI orchestration layer and Azure Synapse integration. Speaks directly to his Atrium Azure migration experience. He will recognize the pattern.',
                  },
                  {
                    n: '04',
                    page: 'Solution Blueprint — Prior Auth',
                    href: '/blueprint?client=meridian',
                    note: '"You already own this module. This is activating 77% of a purchased asset." Do not move past this until he acknowledges the framing.',
                  },
                  {
                    n: '05',
                    page: 'Diagnose — Open Chat',
                    href: '/diagnose?client=meridian',
                    note: 'Let him drive with free-form questions. Demonstrates depth. Ends the meeting with him feeling heard rather than sold to.',
                  },
                ].map((s) => (
                  <div key={s.n} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontFamily: T.mono, fontSize: '10px', fontWeight: 700, color: T.teal }}>{s.n}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>{s.page}</span>
                      </div>
                      <a href={s.href} style={{ fontFamily: T.mono, fontSize: '9px', padding: '3px 9px', borderRadius: '4px', background: 'rgba(45, 212, 200, 0.08)', color: T.teal, border: '1px solid rgba(45, 212, 200, 0.25)', textDecoration: 'none', flexShrink: 0 }}>Open →</a>
                    </div>
                    <div style={{ fontSize: '11px', color: T.text3, lineHeight: 1.65, paddingLeft: '26px' }}>{s.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. WHAT NOT TO SAY */}
            <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.red}`, borderRadius: '10px', padding: '28px' }}>
              <SectionRule label="What Not to Say" color={T.red} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  {
                    landmine: '"Vendor replacement" or any Ensemble criticism by name',
                    why: 'The $14M termination fee is the CFO\'s call, not Marcus\'s. If he agrees and escalates, Chen says no and Marcus loses credibility with his own finance team on his first major initiative.',
                    instead: 'Say "performance governance" and "parallel activation track." Let the CFO discover the termination math from the RCM data — not from you.',
                  },
                  {
                    landmine: '"You need a CDO before this can work"',
                    why: 'Marcus is covering the CDO role without choosing to. Framing the vacancy as a blocker makes him feel inadequate in a job he did not have bandwidth to absorb.',
                    instead: '"Your interim ownership means you get to define what the CDO inherits. Most CIOs never get that chance. We will make the architecture reflect your decisions, not a placeholder\'s."',
                  },
                  {
                    landmine: '"Transformation" as your opening frame',
                    why: 'The word immediately triggers the $200M vs $84M budget fight. He is already defending a gap he cannot close. Opening with transformation puts him on defense before any trust is built.',
                    instead: 'Lead with "optimization" and "activation." He has software sitting idle that he already paid for. That is the story. Transformation is the outcome, not the ask.',
                  },
                ].map((lm, i) => (
                  <div key={i} style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '9px' }}>
                      <span style={{ color: T.red, fontSize: '13px', lineHeight: 1.1, flexShrink: 0, marginTop: '1px' }}>✕</span>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: T.red, lineHeight: 1.4 }}>{lm.landmine}</div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: T.text3, lineHeight: 1.65, marginBottom: '10px', paddingLeft: '22px' }}>{lm.why}</div>
                    <div style={{ background: 'rgba(110, 231, 183, 0.05)', border: '1px solid rgba(110, 231, 183, 0.18)', borderRadius: '5px', padding: '9px 11px', marginLeft: '22px' }}>
                      <div style={{ fontFamily: T.mono, fontSize: '8.5px', color: T.green, letterSpacing: '1.5px', marginBottom: '5px' }}>SAY INSTEAD</div>
                      <div style={{ fontSize: '11.5px', color: T.text2, lineHeight: 1.65, fontStyle: 'italic' }}>{lm.instead}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 5. KEY NUMBERS TO KNOW ── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderLeft: `3px solid ${T.green}`, borderRadius: '10px', padding: '28px' }}>
            <SectionRule label="Key Numbers to Know" color={T.green} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                {
                  metric: '58 / 100',
                  label: 'Epic Optimization Score',
                  context: 'Target: 85/100. Industry median: 73. After 7 years live on Epic. He knows this number. It is personal.',
                  signal: 'Do not frame this as a failure. Frame it as 27 points of recoverable value.',
                  color: T.amber,
                },
                {
                  metric: '18.2%',
                  label: 'RCM Denial Rate',
                  context: 'Ensemble SLA committed to 12% by end of 2023. Industry best-in-class operates at 8%.',
                  signal: 'Robert Chen (CFO) will reference this number. Be ready to connect it to the $94M write-off without triggering the termination conversation.',
                  color: T.red,
                },
                {
                  metric: '$94M',
                  label: '2023 Denial Write-off',
                  context: '$50M is recoverable with prior auth automation and AI-assisted denial triage. Largest single opportunity in the engagement.',
                  signal: 'This number self-funds the roadmap. Return to it whenever budget comes up.',
                  color: T.red,
                },
                {
                  metric: '$84M / $340M',
                  label: 'Transformation Budget',
                  context: '25% of total IT budget approved. Board analysis requires $200M. The gap is real and he knows it.',
                  signal: 'Never propose anything that requires budget above this ceiling without showing a self-funding mechanism first.',
                  color: T.amber,
                },
                {
                  metric: '+8 months',
                  label: 'Blue Ridge Integration Overrun',
                  context: 'Legacy Cerner migration stalled. No additional budget allocated. Still unresolved.',
                  signal: 'Do not volunteer this. If he raises it, validate and move on. It is a wound — not the opening for a solution pitch.',
                  color: T.amber,
                },
                {
                  metric: '23%',
                  label: 'Prior Auth Module Deployed',
                  context: 'Epic module purchased and paid for. 77% sits idle. Full deployment is worth $31M/yr in prevented denials.',
                  signal: 'Your strongest hook. He already paid for the solution. Make sure this lands before any other recommendation.',
                  color: T.green,
                },
              ].map((m, i) => (
                <div key={i} style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: '8px', padding: '18px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: '24px', fontWeight: 700, color: m.color, marginBottom: '5px', lineHeight: 1.1 }}>{m.metric}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: T.text, marginBottom: '8px' }}>{m.label}</div>
                  <div style={{ fontSize: '11px', color: T.text3, lineHeight: 1.65, marginBottom: '10px' }}>{m.context}</div>
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '10px', fontFamily: T.mono, fontSize: '9px', color: T.text3, lineHeight: 1.55 }}>
                    <span style={{ color: T.blue }}>SIGNAL </span>{m.signal}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: '36px', paddingTop: '16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.text3, letterSpacing: '0.5px' }}>
              MAESTRO INTELLIGENCE · ABARVA · INTERNAL USE ONLY · MERIDIAN HEALTH SYSTEM · APRIL 2026
            </div>
            <a href="/admin" style={{ fontFamily: T.mono, fontSize: '10px', color: T.text3, textDecoration: 'none', padding: '6px 14px', border: `1px solid ${T.border2}`, borderRadius: '5px', letterSpacing: '0.5px' }}>← Admin Hub</a>
          </div>
        </div>
      </div>
    </>
  )
}
