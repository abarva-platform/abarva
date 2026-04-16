'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const LINKS = [
  { href: '/admin', label: 'Engagement Hub' },
  { href: '/admin/data', label: 'Data Loader' },
  { href: '/admin/data-guide', label: 'Data Guide', active: true },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/outcomes', label: 'Outcome Tracker' },
  { href: '/admin/brief', label: 'Pre-Meeting Brief' },
  { href: '/admin/context', label: 'Business Context' },
]

const CONFIDENCE_STEPS = [
  { files: '5 files', label: 'Minimum viable', pct: 70, color: '#D97706', bg: '#FFFBEB' },
  { files: '8 files', label: 'Good', pct: 84, color: '#2563EB', bg: '#EFF6FF' },
  { files: '12 files', label: 'Gold standard', pct: 94, color: '#059669', bg: '#ECFDF5' },
  { files: '12 + interviews', label: 'Full intelligence', pct: 99, color: '#2DD4C8', bg: '#F0FDFA' },
]

const CIO_QUESTIONS = [
  'What is the single biggest technology risk you inherited?',
  'Which vendor relationship concerns you most and why?',
  'What has your board committed to on AI — and what is the real deadline?',
  'What has been tried before that failed — and why did it fail?',
  'If budget were not a constraint, what would you fix first?',
  'Who in your organization will resist AI adoption most — and why?',
  'What does a win look like for you personally in the next 12 months?',
  'What should AbarVa know that is not in any document?',
]

type FileSpec = {
  filename: string
  why: string
  extracts: string
  howToExport: string[]
  template?: string
  wow?: string
}

type Category = {
  id: string
  label: string
  count: number
  confidence: string
  accent: string
  files: FileSpec[]
}

const CATEGORIES: Category[] = [
  {
    id: 'financial',
    label: 'Financial Intelligence',
    count: 5,
    confidence: '+28% confidence',
    accent: '#059669',
    files: [
      {
        filename: 'IT_Financial_Model_FY[YEAR].xlsx',
        why: 'Identifies budget gaps, vendor overspend, and transformation underfunding. The single most revealing file in the package.',
        extracts: 'IT budget by cost center, vendor spend by category, project budget vs actual, headcount cost by function',
        howToExport: [
          'SAP: FI module → Cost Center Report → Export to Excel',
          'Oracle: GL → Budget vs Actual → Download as XLSX',
          'Workday: Financial Management → Budget vs Actuals report',
        ],
        template: '4 sheets: Budget Summary, Vendor Contracts, Project Portfolio, Headcount Cost',
      },
      {
        filename: 'Vendor_Contract_Summary.xlsx',
        why: 'Finds SLA breaches, unenforced penalties, and renewal leverage points. This file reliably reveals the first WOW moment in every engagement.',
        extracts: 'Vendor name, contract value, SLA terms, penalty clauses, renewal date, performance history',
        howToExport: [
          'Pull from procurement system (Coupa, SAP Ariba, Oracle Procurement)',
          'Legal shared drive — contract repository or CLM system',
          'Vendor management team usually maintains a master tracker',
        ],
        wow: 'This file is how we found the $8M in Ensemble penalties at Meridian — in the penalty clause column, row 847. The client had no idea the language was enforceable.',
      },
      {
        filename: 'IT_Project_Portfolio.xlsx',
        why: 'Shows what is in flight, what has failed, and where budget is locked in low-value work. Critical for identifying pilot purgatory.',
        extracts: 'Project name, status, budget, spend to date, go-live date, owner, current health',
        howToExport: [
          'PPM tool: Planview, ServiceNow PPM, or Jira Portfolio → Export',
          'If no PPM: request from IT Chief of Staff — usually in a spreadsheet',
        ],
      },
      {
        filename: 'Headcount_by_Function.xlsx',
        why: 'Identifies org gaps (vacant CDO), run-vs-transform ratio, and skill profile mismatches that block AI execution.',
        extracts: 'FTE count by department and role, cost per function, vacancy flags, contractor vs FTE split',
        howToExport: [
          'Workday: Workforce Planning → Headcount Report → Export',
          'SAP HR: Org Management → Position Report',
          'HRIS team can generate within 48 hours — standard request',
        ],
      },
      {
        filename: 'Annual_Financial_Summary.xlsx',
        why: 'Establishes the P&L baseline, margin trajectory, and board commitments that AI recommendations must connect to.',
        extracts: 'Revenue, operating margin, EBITDA, capital budget, debt ratios, board-committed targets',
        howToExport: [
          'CFO office — annual report supplement or board package',
          'Often available in the most recent 10-K or board finance presentation',
        ],
      },
    ],
  },
  {
    id: 'technology',
    label: 'Technology Stack',
    count: 4,
    confidence: '+31% confidence',
    accent: '#2563EB',
    files: [
      {
        filename: 'Application_Technology_Inventory.xlsx',
        why: 'Maps the full technology landscape — what exists, versions, utilization, integrations, and end-of-life risk. The foundation for all architecture recommendations.',
        extracts: 'App name, vendor, version, contract end date, utilization score, integration count, owner',
        howToExport: [
          'ServiceNow CMDB → Application list → Export as CSV or Excel',
          'Flexera, Snow Software, or similar ITAM tool → Application report',
          'Manual: IT architecture team usually maintains a master version',
        ],
        template: '6 columns: Application, Vendor, Version, Active Users, Contract End Date, Integration Notes',
        wow: 'This file showed Epic Cogito had 35 unused dashboards worth $18M in activated-but-idle capability at Meridian. Nobody on the team knew they owned it.',
      },
      {
        filename: 'Infrastructure_Inventory.xlsx',
        why: 'Finds waste (idle VMs, over-provisioned storage), technical debt, and cloud readiness gaps that determine AI deployment feasibility.',
        extracts: 'Server count, utilization percentage, cloud vs on-prem split, hardware age, annual cost',
        howToExport: [
          'Azure Cost Management → Resource Groups → Export inventory',
          'AWS: Cost Explorer → Resource inventory report',
          'On-prem: ServiceNow or manual data center audit',
        ],
      },
      {
        filename: 'Integration_Map.xlsx',
        why: 'Shows integration complexity, identifies single points of failure, and maps the real risk of AI deployment onto existing systems.',
        extracts: 'Source system, target system, interface type, data volume, criticality rating, owner',
        howToExport: [
          'Mirth Connect: interface list export (if Epic-integrated)',
          'Dell Boomi or MuleSoft: API inventory and connection report',
          'Integration architecture team — often stored in Confluence or SharePoint',
        ],
        wow: 'At Meridian this file revealed 424 undocumented Blue Ridge interfaces — a $12M migration risk nobody in IT leadership knew existed. The integration architect had documented it years ago but it never reached leadership.',
      },
      {
        filename: 'AI_Analytics_Initiative_Tracker.xlsx',
        why: 'Exposes pilot purgatory, failed AI investments, and what is stuck and why. Directly informs the contradiction map.',
        extracts: 'Initiative name, status, start date, investment to date, current state, primary blocker, owner',
        howToExport: [
          'PMO tracker or project portfolio tool',
          'Often maintained by Chief Data Officer or IT strategy team',
          'Ask: "What AI or analytics pilots have we started in the past 3 years and what is their status?"',
        ],
        template: '8 columns: Initiative, Status, Start Date, Budget Invested, Outcome to Date, Current Blocker, Owner, Recommended Next Step',
      },
    ],
  },
  {
    id: 'clinical',
    label: 'Clinical & Operations',
    count: 2,
    confidence: '+22% confidence',
    accent: '#7C3AED',
    files: [
      {
        filename: 'KPI_Scorecard_Current.xlsx',
        why: 'Shows performance gaps vs benchmarks. This file directly drives the contradiction map — where the data says one thing and leadership says another.',
        extracts: 'KPI name, current value, benchmark, gap, trend direction, accountable owner',
        howToExport: [
          'Epic: Cogito Analytics → KPI Dashboard → Export to Excel',
          'Business intelligence team — request the monthly scorecard they send to leadership',
          'Board finance committee package often contains the most accurate version',
        ],
        template: 'One row per KPI: Metric Name, Current Value, Peer Benchmark, Gap, Trend (up/flat/down), Owner',
      },
      {
        filename: 'Vendor_Performance_Scorecard.xlsx',
        why: 'Finds SLA breaches and identifies leverage for renegotiation. Every major vendor finding in every AbarVa engagement traces back to this file.',
        extracts: 'Vendor name, SLA metric, contractual target, actual performance, trend, penalty clauses, contract end date',
        howToExport: [
          'Vendor management team or procurement — request quarterly vendor review document',
          'CIO or COO office — SLA reporting is usually presented in a leadership review',
        ],
        wow: 'Every major finding in our vendor analysis comes from this file. The Ensemble $8M penalty. The Mirth Connect performance degradation. The Olive AI pilot failure. All documented here — and all invisible to leadership until AbarVa surfaced them.',
      },
    ],
  },
  {
    id: 'leadership',
    label: 'Leadership & Strategy',
    count: 1,
    confidence: '+13% confidence',
    accent: '#D97706',
    files: [
      {
        filename: 'Strategic_Plan_Summary.pdf or .pptx',
        why: 'Aligns AI recommendations to board commitments and executive priorities. Prevents recommendations that contradict what leadership has already promised.',
        extracts: 'Strategic goals, KPI targets, investment themes, initiative timeline commitments, board language',
        howToExport: [
          'CEO or strategy office — current strategic plan or most recent board presentation',
          'Often available as the annual "Strategy Day" deck from 6–12 months ago',
        ],
      },
    ],
  },
]

function FileCard({ file, accent }: { file: FileSpec; accent: string }) {
  const [exp, setExp] = useState(false)
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
      <button onClick={() => setExp(!exp)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#FAFAFA', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: accent, background: accent + '12', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>XLSX</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{file.filename}</span>
        </div>
        <span style={{ fontSize: '16px', color: '#3C3C3C', flexShrink: 0, marginLeft: '12px' }}>{exp ? '−' : '+'}</span>
      </button>
      {exp && (
        <div style={{ padding: '16px', background: '#FFFFFF', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: file.howToExport ? '16px' : 0 }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>Why AbarVa needs this</div>
              <p style={{ fontSize: '13px', color: '#3C3C3C', lineHeight: 1.6, margin: 0 }}>{file.why}</p>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>What we extract</div>
              <p style={{ fontSize: '13px', color: '#3C3C3C', lineHeight: 1.6, margin: 0 }}>{file.extracts}</p>
            </div>
          </div>
          {file.howToExport && (
            <div style={{ marginBottom: file.template || file.wow ? '14px' : 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>How to export</div>
              {file.howToExport.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ color: accent, fontWeight: 700, flexShrink: 0, fontSize: '12px' }}>→</span>
                  <span style={{ fontSize: '12px', color: '#3C3C3C' }}>{h}</span>
                </div>
              ))}
            </div>
          )}
          {file.template && (
            <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '10px 12px', marginBottom: file.wow ? '10px' : 0 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Template: </span>
              <span style={{ fontSize: '12px', color: '#3C3C3C' }}>{file.template}</span>
            </div>
          )}
          {file.wow && (
            <div style={{ background: '#0F172A', borderRadius: '8px', padding: '12px 14px', borderLeft: `3px solid ${accent}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>⚡ WOW moment this file enabled</div>
              <p style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>{file.wow}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DataGuidePage() {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ financial: true, technology: false, clinical: false, leadership: false })
  const toggle = (id: string) => setOpenCats(p => ({ ...p, [id]: !p[id] }))

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <AbarvaNav activePage="admin" />
      <div style={{ display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' as const }}>
        {LINKS.map(l => (
          <a key={l.href} href={l.href} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: l.active ? '#1E3A5F' : '#F8FAFC', color: l.active ? '#FFFFFF' : '#475569', border: '1px solid #E2E8F0', flexShrink: 0, whiteSpace: 'nowrap' as const }}>{l.label}</a>
        ))}
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Data Collection Guide — What Good Looks Like</h1>
          <p style={{ fontSize: '14px', color: '#3C3C3C', marginBottom: '16px' }}>The 12 files that give AbarVa 94% confidence. Each file described, sourced, and templated.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>✓ Gold Standard: 12 files → 94% confidence</span>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>⚠ Minimum Viable: 5 files → 70% confidence</span>
          </div>
        </div>

        {/* Confidence impact banner */}
        <div style={{ background: '#0C0C0C', borderRadius: '12px', padding: '28px 32px', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Confidence Impact</div>
          <div style={{ fontSize: '14px', color: '#888888', marginBottom: '24px' }}>Every additional file reduces the risk of a wrong recommendation</div>

          {/* Progress visualization */}
          <div style={{ position: 'relative' as const, marginBottom: '20px' }}>
            <div style={{ height: '8px', background: '#1F2937', borderRadius: '4px', position: 'relative' as const, overflow: 'hidden' }}>
              <div style={{ position: 'absolute' as const, left: 0, top: 0, height: '100%', width: '99%', background: 'linear-gradient(90deg, #D97706 0%, #D97706 20%, #2563EB 20%, #2563EB 50%, #059669 50%, #059669 85%, #2DD4C8 85%, #2DD4C8 100%)', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              {CONFIDENCE_STEPS.map((step, i) => (
                <div key={i} style={{ textAlign: 'center' as const, flex: 1 }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: step.color, marginBottom: '2px' }}>{step.pct}%</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#F9FAFB', marginBottom: '2px' }}>{step.files}</div>
                  <div style={{ fontSize: '11px', color: '#3C3C3C' }}>{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        {CATEGORIES.map(cat => (
          <div key={cat.id} style={{ marginBottom: '16px' }}>
            {/* Category header */}
            <button onClick={() => toggle(cat.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0C0C0C', border: 'none', borderLeft: `4px solid ${cat.accent}`, borderRadius: openCats[cat.id] ? '10px 10px 0 0' : '10px', padding: '16px 20px', cursor: 'pointer', textAlign: 'left' as const }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: cat.accent, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>{cat.confidence}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#F9FAFB' }}>{cat.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12px', color: '#3C3C3C' }}>{cat.count} file{cat.count > 1 ? 's' : ''}</span>
                <span style={{ fontSize: '20px', color: '#3C3C3C' }}>{openCats[cat.id] ? '−' : '+'}</span>
              </div>
            </button>

            {openCats[cat.id] && (
              <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px', background: '#FFFFFF' }}>
                {cat.files.map((f, i) => (
                  <FileCard key={i} file={f} accent={cat.accent} />
                ))}

                {/* Leadership category extra: interviews */}
                {cat.id === 'leadership' && (
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', background: '#FFFFF0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Leadership Interviews — Structured, 8 questions each</div>
                        <div style={{ fontSize: '12px', color: '#3C3C3C' }}>CIO · CFO · COO · CMIO · CEO · 30 minutes per leader</div>
                      </div>
                      <div style={{ textAlign: 'right' as const, flexShrink: 0, marginLeft: '16px' }}>
                        <div style={{ fontSize: '10px', color: '#3C3C3C', marginBottom: '2px' }}>Confidence added</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#D97706' }}>+5% each</div>
                      </div>
                    </div>
                    <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', fontSize: '12px', color: '#92400E' }}>
                      AbarVa sends a link → leader answers 8 questions in browser. Format: async, 15 minutes, no scheduling required. What it adds: <strong>political context, personal priorities, and what leaders will not say in a meeting.</strong>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>Standard CIO question set (example)</div>
                    {CIO_QUESTIONS.map((q, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < CIO_QUESTIONS.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', flexShrink: 0, minWidth: '20px' }}>Q{i + 1}</span>
                        <span style={{ fontSize: '13px', color: '#3C3C3C', lineHeight: 1.5 }}>{q}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Incremental data strategy */}
        <div style={{ background: '#0C0C0C', borderRadius: '12px', padding: '28px 32px', marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Staying Current</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F9FAFB', marginBottom: '6px' }}>Data loaded once gets stale. Here is how AbarVa stays current.</div>
          <div style={{ fontSize: '13px', color: '#3C3C3C', marginBottom: '24px' }}>Three-tier refresh model — most is automated.</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              {
                freq: 'Automated', sub: 'Monthly — no Maestro action required', color: '#2DD4C8',
                items: ['CMS regulatory updates and deadlines', 'KLAS scores and peer benchmarks', 'Vendor announcement monitoring', 'Public financial data enrichment'],
              },
              {
                freq: 'Periodic', sub: 'Quarterly — 15-minute client touchpoint', color: '#4DA3FF',
                items: ['New systems gone live since last quarter', 'Projects completed, failed, or cancelled', 'Leadership changes or priority shifts', 'Budget updates and new vendor contracts'],
              },
              {
                freq: 'Annual', sub: 'Full re-assessment cycle', color: '#6EE7B7',
                items: ['New file upload cycle — all 12 files refreshed', 'Leadership interviews refreshed for all 5 roles', 'New contradictions surfaced against updated data', 'Confidence score rebuilt from baseline'],
              },
            ].map((t, i) => (
              <div key={i} style={{ background: '#161B22', borderRadius: '10px', padding: '18px', border: '1px solid #21262D', borderTop: `3px solid ${t.color}` }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F9FAFB', marginBottom: '3px' }}>{t.freq}</div>
                <div style={{ fontSize: '11px', color: '#3C3C3C', marginBottom: '14px' }}>{t.sub}</div>
                {t.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.color, flexShrink: 0, marginTop: '6px' }} />
                    <span style={{ fontSize: '12px', color: '#888888', lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Download button */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => alert('Template package downloading...')} style={{ padding: '12px 24px', borderRadius: '8px', background: '#059669', color: '#FFFFFF', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            ↓ Download Complete Template Package
          </button>
          <a href="/admin/data" style={{ padding: '12px 20px', borderRadius: '8px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>← Back to Data Loader</a>
        </div>

      </div>
    </div>
  )
}
