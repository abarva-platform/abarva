'use client'
import { useState } from 'react'

const T = {
  bg: '#0D1117', surface: '#161B22', surface2: '#1C2128',
  border: '#21262D', border2: '#30363D',
  text: '#E6EDF3', text2: '#C9D1D9', text3: '#8B949E',
  teal: '#2DD4C8', blue: '#4DA3FF', green: '#6EE7B7', amber: '#F59E0B', red: '#EF4444',
  purple: '#A78BFA',
}

const SECTIONS = [
  { id: 'orientation', label: 'Orientation' },
  { id: 'data', label: 'Data Mastery' },
  { id: 'process', label: 'Process Playbooks' },
  { id: 'governance', label: 'Governance' },
  { id: 'demo', label: 'Demo Playbook' },
]

const DEMO_PATHS = [
  {
    id: 1, label: 'CXO First Look', time: '3 min', audience: 'Any C-suite — CIO, CFO, CEO, CMIO',
    goal: 'Make them feel understood. Make them want a deeper session.',
    steps: [
      'Open homepage — Meridian card visible. No preamble — just: "Most orgs spend $4–8M on transformation strategy. It takes 6 months. It produces a PowerPoint. AbarVa does the same work in 90 minutes."',
      'Click Meridian — Situation Intelligence loads. 3 contradiction flags. Let the numbers land. 4 seconds of silence.',
      'Click CIO role — "Every role sees what matters to them."',
      'Click RCM Denial Rate card — watch response stream. After: "It referenced Robert Chen\'s quote. The Ensemble SLA penalty. The exact benchmark."',
      'Navigate to AI Investment Intelligence Step 3 — ranked bets. Pause on the list.',
      'Step 6 — Board Deck Ready. McKinsey callout. "What would you want to see with your data?"',
    ],
    color: T.blue,
  },
  {
    id: 2, label: 'Investor Demo', time: '8 min', audience: 'Seed/Series A investors — Shail Jain, Anthology Fund',
    goal: 'Make the business model undeniable. Make them ask about the round.',
    steps: [
      'Investor page hero — "$200B spent on transformation consulting. Outcomes almost never tracked."',
      'Intelligence Suite grid — all 9 products. "Every stage of the lifecycle."',
      'Navigate into Meridian Outcome Intelligence — Portfolio Overview. Green/red cards.',
      'Revenue Model section — 3 active streams, outcome fee roadmap.',
      'Transformation Genome — compounding moat visual.',
      '"We\'re raising $8M at $25M cap. 18 months to $1.5M ARR. Series A opens at $80–100M pre-money."',
    ],
    color: T.purple,
  },
  {
    id: 3, label: 'Design Partner Close', time: '20 min', audience: 'CIO/CDO who has seen the product — Prat Vemana',
    goal: 'Convert from interested to signed design partner.',
    steps: [
      'Pre-load their org\'s data (or Meridian as proxy). Role selector set to their role.',
      '"Before we talk partnership — I want to show you something specific to your situation."',
      'Show 3 contradiction flags. "Does this match what you\'re seeing internally?" — STOP. LISTEN.',
      'Follow their answer. Navigate to the product that matches their pain.',
      '"Design partner: we load your real data, NDA, your cloud. You keep the output. Three things in exchange: feedback sessions, anonymous reference, agree on baseline now."',
      '"What would need to be true for you to say yes to that today?" — STOP.',
    ],
    color: T.green,
  },
  {
    id: 4, label: 'Technical Demo', time: '45 min', audience: 'CTO, Chief Architect, Head of Data',
    goal: 'Establish technical credibility. Show the data architecture.',
    steps: [
      'Data architecture — three-layer model. Layer 1 (master), Layer 2 (engagement workspace), Layer 3 (genome).',
      'Role-based access matrix — CIO sees tech, CFO sees financials. Show RLS in Supabase.',
      'API architecture — private cloud deployment option. Data never leaves perimeter.',
      'Prompt injection protection — show the filter layer. Audit log.',
      'Model abstraction — Claude default, but GPT-4o, Gemini, open-source all viable.',
      'Integration demo — Epic FHIR, FIS API, SAP OData connectors.',
    ],
    color: T.amber,
  },
  {
    id: 5, label: 'AI-PDLC Demo', time: '30 min', audience: 'CIO + delivery team',
    goal: 'Show the AI project delivery lifecycle — from ideation to production.',
    steps: [
      'Select an AI initiative from the Meridian portfolio (Prior Auth AI).',
      'Step through: use case → build vs buy → architecture → vendor selection → delivery → governance.',
      'PlatformEvaluator — AWS+Claude vs Azure+OpenAI. Show scoring methodology.',
      'Show the failure pattern library — 7 historical failure modes. Which ones apply?',
      'Delivery timeline — 90-day wave plan with milestone tracking.',
    ],
    color: T.blue,
  },
  {
    id: 6, label: 'Future of Work Demo', time: '25 min', audience: 'CHRO, COO, CFO',
    goal: 'Show workforce intelligence — AI impact on roles, staffing, change management.',
    steps: [
      'Workforce Intelligence — Meridian. 42,000 employees. Role impact map.',
      'Travel nurse dependency — $142M. AI scheduling ROI model.',
      'Physician burnout — 72nd percentile. AI documentation ROI.',
      'Change readiness score by department. Resistance map.',
      'Upskilling pathway — which roles to redeploy vs automate.',
    ],
    color: T.green,
  },
  {
    id: 7, label: 'Analytics Modernization Demo', time: '30 min', audience: 'CDO, Chief Analytics Officer',
    goal: 'Show Data Estate Intelligence — data readiness, platform selection, migration path.',
    steps: [
      'Data Estate Intelligence — Meridian. 14 source systems. 23-hospital fragmentation.',
      'Data readiness score — 47/100. What\'s blocking AI?',
      'Platform options — Snowflake vs Databricks vs Azure Synapse. PlatformEvaluator.',
      'Migration sequence — what to move first, what to leave, what to decommission.',
      'Unified data platform blueprint — 18-month roadmap.',
    ],
    color: T.amber,
  },
  {
    id: 8, label: 'AI Control Tower Demo', time: '20 min', audience: 'CIO + governance team',
    goal: 'Show active AI portfolio management — not just strategy.',
    steps: [
      'Control Tower — Meridian. 4 active AI initiatives. Live status.',
      'Initiative health — green/amber/red. ROI tracking vs baseline.',
      'Escalation rules — when does the platform flag a risk?',
      'Vendor performance — Ensemble SLA breach. Why wasn\'t this flagged?',
      'Board report — outcomes only. No activity metrics.',
    ],
    color: T.red,
  },
]

export default function PlaybookPage() {
  const [section, setSection] = useState('orientation')
  const [openDemo, setOpenDemo] = useState<number | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '16px 24px' }}>
        <a href="/admin" style={{ fontSize: '13px', color: T.text3, textDecoration: 'none', display: 'block', marginBottom: '4px' }}>← Engagement Hub</a>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>Maestro Playbook</div>
      </div>

      {/* Section tabs */}
      <div style={{ background: T.surface2, borderBottom: '1px solid ' + T.border, display: 'flex', padding: '0 24px', overflowX: 'auto' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '0 20px', height: '44px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: section === s.id ? 700 : 500, color: section === s.id ? T.teal : T.text3, borderBottom: section === s.id ? '2px solid ' + T.teal : '2px solid transparent', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {section === 'orientation' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Maestro Orientation</h2>
            <p style={{ color: T.text3, fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>The Maestro is not a consultant. The Maestro is the human intelligence layer between the platform and the CXO. The platform does the analysis. The Maestro does the judgment.</p>
            {[
              { title: 'What a Maestro does', body: 'A Maestro carries 4–6 enterprise engagements simultaneously. In each, they are responsible for: loading and governing client data, running intelligence sessions with the CXO team, interpreting outputs and adding judgment, and establishing the baseline that enables the outcome fee.' },
              { title: 'What a Maestro does NOT do', body: 'A Maestro does not write strategy decks. The platform writes the deck. A Maestro does not spend 3 weeks in data gathering. The platform ingests data in hours. A Maestro does not deliver a PDF and disappear. A Maestro stays accountable to the outcome.' },
              { title: 'The Maestro skillset', body: 'Former Tier-1 consulting partner, healthcare/FS CIO, or equivalent. Comfort with ambiguity and CXO relationships. Ability to read a contradiction and ask the one question that unlocks the room. No software engineering required.' },
              { title: 'Compensation model', body: '$150–200K base + outcome-linked incentive (% of outcome fee AbarVa earns from your engagements). Total comp at 4 clients averaging $625K license: $150K base + $140–200K incentive = $290–350K+ total.' },
            ].map((item, i) => (
              <div key={i} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '8px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: T.text3, lineHeight: 1.7 }}>{item.body}</div>
              </div>
            ))}
          </div>
        )}

        {section === 'data' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Data Mastery</h2>
            <p style={{ color: T.text3, fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>The quality of AbarVa intelligence is 100% dependent on the quality of the data loaded. This section explains what to load, how to load it, and how to govern it.</p>
            {[
              { title: 'The three data layers', body: 'Layer 1: Master org intelligence — approved, immutable, governed. Layer 2: Engagement workspace — working data for active engagements, isolated per engagement. Layer 3: Transformation Genome — anonymised patterns derived from real outcomes, never contains identifiable data.' },
              { title: 'What to load first', body: 'Priority order: (1) Financial statements — margin, cost structure, IT spend. (2) Technology inventory — systems, vendors, contracts, ages. (3) Leadership profiles + stakeholder interview notes. (4) Vendor contracts — especially SLA performance clauses. (5) Clinical/operational performance data.' },
              { title: 'Data quality signals', body: 'Green (>80%): enough context for full intelligence. Amber (60–80%): analysis possible but flag gaps. Red (<60%): do not run intelligence session until gaps are filled. The platform shows a data completeness score on every engagement card.' },
              { title: 'The data conversation with the client', body: 'Frame it as: "AbarVa reads your data — not a consultant\'s assumptions. The more specific the data, the more defensible the intelligence." Most CIOs will give you access within 48 hours once they see what the platform produces.' },
            ].map((item, i) => (
              <div key={i} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '8px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: T.text3, lineHeight: 1.7 }}>{item.body}</div>
              </div>
            ))}
          </div>
        )}

        {section === 'process' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Process Playbooks</h2>
            <p style={{ color: T.text3, fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>Standard operating procedures for each intelligence product. Follow these for the first 3 engagements — then adapt based on what works.</p>
            {[
              { product: 'Situation Intelligence', time: '90 min', steps: ['Pre-load org data (financial + tech inventory minimum)', 'Set role to match who is in the room', 'Show contradiction flags — do NOT narrate. Let them read.', 'Ask: "Does this match what you\'re seeing internally?"', 'Follow their answer to the deepest contradiction', 'Export Situation Brief at end of session'] },
              { product: 'AI Investment Intelligence', time: '3 hrs', steps: ['Complete Situation Intelligence first', 'Step 1 Ground Truth — show readiness scores. Let the gaps land.', 'Step 2 Stakeholder Map — where do executives disagree?', 'Step 3 Every Bet Available — walk ranked list. Flag red items.', 'Step 4 Your Three Bets — filter to top 3. Get their reaction.', 'Step 5 Wave 1 Timeline — confirm owners before leaving room.', 'Step 6 Export — all three artifacts before the meeting ends.'] },
              { product: 'Outcome Intelligence', time: '45 min', steps: ['Requires baseline metrics from engagement start', 'Tab 1: Portfolio Overview — show green/red status', 'Tab 3: Outcome Verification — show delta vs baseline', 'Tab 5: Board Report — outcomes only, no activity metrics', 'Flag any initiative showing red — who owns it? What is the unblock?'] },
            ].map((pb, i) => (
              <div key={i} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: T.text }}>{pb.product}</div>
                  <span style={{ fontSize: '11px', color: T.text3, background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '4px', padding: '2px 8px' }}>{pb.time}</span>
                </div>
                {pb.steps.map((step, si) => (
                  <div key={si} style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '13px', color: T.text3, lineHeight: 1.5 }}>
                    <span style={{ color: T.teal, fontWeight: 700, flexShrink: 0 }}>{si + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {section === 'governance' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Governance</h2>
            <p style={{ color: T.text3, fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>AbarVa&apos;s governance model is what differentiates it from an AI tool. These rules are non-negotiable.</p>
            {[
              { title: 'Baseline before anything', body: 'No intelligence session begins without documented baseline metrics. The CIO countersigns the baseline at engagement launch. Without a baseline, there is no outcome — and no outcome fee. This is the most important governance rule in the entire platform.' },
              { title: 'Referral disclosure', body: 'Every vendor recommendation card shows "★ AbarVa referral partner." The Maestro discloses verbally in every session. The scoring methodology is auditable. If a client selects a different vendor, support that decision fully. Never defend a recommendation because of the referral fee.' },
              { title: 'Data steward approval', body: 'Layer 2 data (engagement workspace) requires Data Steward approval before promotion to Layer 1 (master org intelligence). The Maestro proposes. The Data Steward (typically the client CIO) approves. This separation is what makes AbarVa enterprise-grade.' },
              { title: 'Outcome attribution', body: 'Outcome fees trigger only when: (1) the baseline was documented and countersigned at engagement start, (2) the outcome is measured at the same metric 12 months later, (3) the attribution methodology was agreed in writing. No shortcuts.' },
            ].map((item, i) => (
              <div key={i} style={{ background: T.surface, border: '1px solid ' + T.border, borderLeft: '3px solid ' + T.teal, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '8px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: T.text3, lineHeight: 1.7 }}>{item.body}</div>
              </div>
            ))}
          </div>
        )}

        {section === 'demo' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Demo Playbook</h2>
            <p style={{ color: T.text3, fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>8 demo paths. Each is designed for a specific audience and goal. Know all 8. Run whichever fits the room.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DEMO_PATHS.map((path) => (
                <div key={path.id} style={{ background: T.surface, border: '1px solid ' + T.border, borderLeft: '3px solid ' + path.color, borderRadius: '10px', overflow: 'hidden' }}>
                  <button onClick={() => setOpenDemo(openDemo === path.id ? null : path.id)} style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: path.color }}>PATH {path.id}</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: T.text }}>{path.label}</span>
                        <span style={{ fontSize: '11px', color: T.text3, background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '4px', padding: '1px 6px' }}>{path.time}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: T.text3 }}>{path.audience}</div>
                    </div>
                    <span style={{ color: T.text3, fontSize: '18px', transition: 'transform 0.15s', transform: openDemo === path.id ? 'rotate(180deg)' : 'none' }}>▾</span>
                  </button>
                  {openDemo === path.id && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid ' + T.border }}>
                      <div style={{ background: T.surface2, border: '1px solid ' + path.color + '30', borderRadius: '6px', padding: '10px 14px', marginTop: '12px', marginBottom: '14px', fontSize: '13px', color: path.color, fontWeight: 600 }}>
                        Goal: {path.goal}
                      </div>
                      {path.steps.map((step, si) => (
                        <div key={si} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px', color: T.text2, lineHeight: 1.6 }}>
                          <span style={{ color: path.color, fontWeight: 700, flexShrink: 0, minWidth: '20px' }}>{si + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
