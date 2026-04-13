'use client'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' } as React.CSSProperties,
  subnav: { display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' as const } as React.CSSProperties,
}

const LINKS = [
  { href: '/admin', label: 'Engagement Hub' },
  { href: '/admin/data', label: 'Data Loader' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/outcomes', label: 'Outcome Tracker' },
  { href: '/admin/brief', label: 'Pre-Meeting Brief' },
  { href: '/admin/context', label: 'Business Context', active: true },
]

const STAKEHOLDERS = [
  {
    initials: 'MW', name: 'Marcus Webb', title: 'Chief Information Officer',
    interviewed: true, color: '#2563EB',
    quotes: [
      'I inherited a mess. We have 23 hospitals that operate like 23 different companies.',
      'My first priority is understanding what we actually have before I commit to any transformation roadmap.',
      'The board wants answers in 90 days but I need 6 months just to do a proper assessment.',
    ],
  },
  {
    initials: 'RC', name: 'Robert Chen', title: 'Chief Financial Officer',
    interviewed: true, color: '#059669',
    quotes: [
      'The $94M denial write-off keeps me up at night. That is real money.',
      'Ensemble promised us 12% denial rate by end of 2023. We are at 18.2%.',
      'I want out of that contract but the termination fee is $14M and the board does not have the stomach for it.',
    ],
  },
  {
    initials: 'JW', name: 'James Whitfield', title: 'Chief Operating Officer',
    interviewed: false, color: '#D97706',
    quotes: [
      'I have seen three transformation initiatives in 11 years. They all started with big promises and ended with consultants billing hours and nurses doing extra paperwork.',
      'Show me a vendor who will put their fees at risk and I will listen.',
    ],
  },
  {
    initials: 'SO', name: 'Dr. Sarah Okonkwo', title: 'Chief Medical Information Officer',
    interviewed: false, color: '#7C3AED',
    quotes: [
      'Epic is not the problem. The problem is we never finished the implementation.',
      'Nobody owns optimization. There is no project team, no funding, no priority.',
    ],
  },
  {
    initials: 'SM', name: 'Sarah Mitchell', title: 'Chief Executive Officer',
    interviewed: false, color: '#DC2626',
    quotes: [
      'We have the assets and the market position to be the dominant health system in the Southeast.',
      'What we lack is execution velocity. I need my leadership team moving faster.',
    ],
  },
]

const PRIORITIES = [
  { rank: 1, title: 'Reach 4% operating margin by Q4 2026', category: 'Board Commitment', impact: 'Critical', ic: '#DC2626', ib: '#FEF2F2', cc: '#1E3A5F', cb: '#EFF6FF' },
  { rank: 2, title: 'CMS prior auth compliance by January 2026', category: 'Regulatory', impact: 'Critical', ic: '#DC2626', ib: '#FEF2F2', cc: '#7C2D12', cb: '#FFF7ED' },
  { rank: 3, title: 'Complete Blue Ridge technology integration', category: 'Post-Merger', impact: 'High', ic: '#D97706', ib: '#FFFBEB', cc: '#1E3A5F', cb: '#EFF6FF' },
  { rank: 4, title: 'Reduce travel nurse dependency by 40%', category: 'Cost', impact: 'High', ic: '#D97706', ib: '#FFFBEB', cc: '#064E3B', cb: '#ECFDF5' },
  { rank: 5, title: 'Launch AI strategy with measurable outcomes', category: 'Innovation', impact: 'High', ic: '#D97706', ib: '#FFFBEB', cc: '#4C1D95', cb: '#F5F3FF' },
  { rank: 6, title: 'Resolve Ensemble RCM performance issues', category: 'Vendor', impact: 'Medium', ic: '#6B7280', ib: '#F9FAFB', cc: '#374151', cb: '#F3F4F6' },
]

const KPIS = [
  { name: 'Operating margin', current: '1.8%', target: '4.0%', owner: 'CFO', oc: '#059669', progress: 45, note: 'Q3 miss — 3rd consecutive quarter below board target' },
  { name: 'RCM denial rate', current: '18.2%', target: '12%', owner: 'CIO', oc: '#2563EB', progress: 52, note: 'Ensemble SLA breach — $8M penalty clause not enforced' },
  { name: 'MA Star rating', current: '3.5', target: '4.0', owner: 'CMIO', oc: '#7C3AED', progress: 67, note: '$34M CMS bonus at risk below 4.0 stars' },
  { name: 'Travel nurse cost %', current: '18%', target: '11%', owner: 'COO', oc: '#D97706', progress: 50, note: '$142M annually — $74M above peer benchmark' },
  { name: 'Epic optimization score', current: '58 / 100', target: '85 / 100', owner: 'CIO', oc: '#2563EB', progress: 40, note: 'Only 12 of 47 Cogito dashboards live after 7 years' },
  { name: 'Prior auth electronic %', current: '23%', target: '100%', owner: 'CIO', oc: '#2563EB', progress: 23, note: 'CMS mandate: 100% by Jan 2026 — 9 months remaining' },
]

const POLITICAL = [
  {
    title: 'Ensemble Relationship',
    body: 'CEO has a personal relationship with the Ensemble CEO going back 12 years. Do not recommend full replacement in the first meeting — frame any RCM conversation as performance improvement and SLA governance, not termination. The exit case must emerge from the CFO\'s own analysis, not from AbarVa.',
  },
  {
    title: 'Blue Ridge Culture',
    body: '142 Blue Ridge clinical and IT staff feel like second-class citizens post-merger. Any technology decision that consolidates, decommissions, or standardizes must explicitly acknowledge their team. Framing matters: "integrating the best of both organizations" — never "migrating Blue Ridge to Meridian standards."',
  },
  {
    title: 'Board Pressure on CFO',
    body: 'Operating margin has missed the board target for 3 consecutive quarters. Robert Chen is under personal performance pressure. He will be in the room for any strategic conversation. Lead every recommendation with financial impact first — not technology capability. The CFO needs something concrete to show the board in 6 weeks.',
  },
]

function SectionHeader({ n, label, meta }: { n: string; label: string; meta?: string }) {
  return (
    <div style={{ background: '#0F172A', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: '#4DA3FF', letterSpacing: '2.5px', textTransform: 'uppercase' as const, marginBottom: '3px' }}>Section {n}</div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#E6EDF3' }}>{label}</div>
      </div>
      {meta && <div style={{ fontSize: '12px', color: '#8B949E' }}>{meta}</div>}
    </div>
  )
}

export default function BusinessContext() {
  return (
    <div style={S.page}>
      <AbarvaNav clientId="meridian" activePage="admin" />

      {/* Subnav */}
      <div style={S.subnav}>
        {LINKS.map(link => (
          <a key={link.href} href={link.href} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: link.active ? '#1E3A5F' : '#F8FAFC', color: link.active ? '#FFFFFF' : '#475569', border: '1px solid #E2E8F0', flexShrink: 0 }}>{link.label}</a>
        ))}
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Business Context</h1>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>Meridian Health System · Engagement intelligence for Maestro use only</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '8px 14px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669', display: 'block' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>Last updated April 9, 2026</span>
          </div>
        </div>

        {/* ── SECTION 1 — STAKEHOLDER INTERVIEWS ── */}
        <div style={S.card}>
          <SectionHeader n="01" label="Stakeholder Interviews" meta="2 of 5 completed" />
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {STAKEHOLDERS.map(s => (
              <div key={s.name} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Card header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: s.color + '18', border: '2px solid ' + s.color + '50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.initials}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '1px' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.3 }}>{s.title}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: s.interviewed ? '#ECFDF5' : '#FFFBEB', color: s.interviewed ? '#059669' : '#D97706', border: '1px solid ' + (s.interviewed ? '#A7F3D0' : '#FDE68A'), whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                      {s.interviewed ? '● Interviewed' : '○ Pending'}
                    </span>
                  </div>
                </div>

                {/* Quotes */}
                <div style={{ padding: '14px 16px', flex: 1, background: s.interviewed ? '#FFFFFF' : '#FAFAFA' }}>
                  {!s.interviewed && (
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: '#94A3B8', letterSpacing: '1.5px', marginBottom: '10px' }}>PRE-INTERVIEW CONTEXT</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {s.quotes.map((q, qi) => (
                      <div key={qi} style={{ fontSize: '12px', color: s.interviewed ? '#374151' : '#94A3B8', lineHeight: 1.65, fontStyle: 'italic', paddingLeft: '10px', borderLeft: '2px solid ' + (s.interviewed ? s.color + '70' : '#E2E8F0') }}>
                        "{q}"
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                  <button style={{ width: '100%', padding: '7px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, border: '1px solid ' + (s.interviewed ? '#BFDBFE' : '#E2E8F0'), background: s.interviewed ? '#EFF6FF' : '#F1F5F9', color: s.interviewed ? '#2563EB' : '#94A3B8', cursor: s.interviewed ? 'pointer' : 'default' }}>
                    {s.interviewed ? 'View Full Interview →' : 'Schedule Interview →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 2 — BUSINESS PRIORITIES ── */}
        <div style={S.card}>
          <SectionHeader n="02" label="Business Priorities" meta="Board-validated · April 2026" />
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PRIORITIES.map(p => (
              <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FFFFFF' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}>
                {/* Drag handle */}
                <span style={{ fontSize: '18px', color: '#D1D5DB', cursor: 'grab', flexShrink: 0, lineHeight: 1 }}>⠿</span>
                {/* Rank badge */}
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#E6EDF3', flexShrink: 0 }}>{p.rank}</div>
                {/* Title */}
                <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{p.title}</div>
                {/* Category badge */}
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: p.cb, color: p.cc, flexShrink: 0 }}>{p.category}</span>
                {/* Impact badge */}
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: p.ib, color: p.ic, flexShrink: 0, minWidth: '100px', textAlign: 'center' as const }}>Impact: {p.impact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 3 — KPI COMMITMENTS ── */}
        <div style={S.card}>
          <SectionHeader n="03" label="KPI Commitments" meta="Leadership accountability map" />
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 75px 1fr', gap: '0', padding: '10px 24px', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
            {['KPI', 'Current', 'Target', 'Owner', 'Progress to Target'].map((h, i) => (
              <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{h}</div>
            ))}
          </div>
          {KPIS.map((k, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 75px 1fr', gap: '0', padding: '16px 24px', borderBottom: i < KPIS.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '3px' }}>{k.name}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>{k.note}</div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626' }}>{k.current}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{k.target}</div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 9px', borderRadius: '6px', background: k.oc + '15', color: k.oc }}>{k.owner}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
                  <div style={{ height: '6px', borderRadius: '3px', width: k.progress + '%', background: k.progress < 30 ? '#DC2626' : k.progress < 55 ? '#D97706' : '#059669', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', width: '34px', textAlign: 'right' as const }}>{k.progress}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── SECTION 4 — POLITICAL CONTEXT ── */}
        <div style={S.card}>
          <SectionHeader n="04" label="Political Context" meta="Handle with care — Maestro only" />
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {POLITICAL.map((p, i) => (
              <div key={i} style={{ border: '1px solid #FDE68A', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '11px 16px', background: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#fff' }}>⚠</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Handle With Care</span>
                </div>
                <div style={{ padding: '16px', background: '#FFFBEB' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', marginBottom: '10px' }}>{p.title}</div>
                  <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: 1.75 }}>{p.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
