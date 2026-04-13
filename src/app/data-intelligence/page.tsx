'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const DATA: Record<string, any> = {
  meridian: {
    client: 'Meridian Health System',
    updated: 'April 9, 2026',
    confidence: 94,
    categories: [
      {
        id: 'financial', label: 'Financial Intelligence', icon: '$', color: '#1B4FD8', confidence: 96,
        files: ['Meridian_IT_Financial_Model_FY2024.xlsx', 'Enterprise_IT_Financial_Models_All_Clients.xlsx'],
        records: '847 line items across 14 cost centers',
        findings: [
          { fact: 'IT Budget FY2024', value: '$504M', source: 'IT_Financial_Model_FY2024.xlsx · Sheet: Budget', why: 'Underspending vs 5.2% revenue benchmark — $80M gap blocking transformation' },
          { fact: 'Transformation budget', value: '$84M of $504M', source: 'IT_Financial_Model_FY2024.xlsx · Sheet: Budget Breakdown', why: 'Board mandated $200M needed — gap of $116M is fatal to 4% margin target' },
          { fact: 'Ensemble RCM contract', value: '$48M/year', source: 'IT_Financial_Model_FY2024.xlsx · Sheet: Vendor Contracts', why: 'Vendor missing SLAs — $8M in unenforced penalties identified' },
          { fact: 'Travel nurse cost', value: '$142M FY2023', source: 'Workforce_HR_Analytics.xlsx · Sheet: Labor Cost', why: '756 travel nurses at $188K avg — $74M above benchmark' },
          { fact: 'Denial write-off', value: '$94M FY2023', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: Write-offs', why: '$37M above benchmark — root cause is Ensemble SLA failure' },
          { fact: 'Azure waste identified', value: '$1.8M/year', source: 'DataCenter_Infrastructure.xlsx · Sheet: VM Utilization', why: '340 VMs below 20% utilization — Azure Cost Management can automate right-sizing' },
        ],
      },
      {
        id: 'technology', label: 'Technology Stack', icon: '#', color: '#6D28D9', confidence: 91,
        files: ['Meridian_Application_Technology_Inventory.xlsx', 'Meridian_DataCenter_Infrastructure_Inventory.xlsx'],
        records: '47 applications · 1,240 servers · 3 data centers · 847 integrations mapped',
        findings: [
          { fact: 'Epic EHR version', value: '2023 November', source: 'Application_Technology_Inventory.xlsx · Sheet: EHR', why: 'Enables Cohere Health native integration — no custom build required' },
          { fact: 'Azure Synapse status', value: '40% complete', source: 'Application_Technology_Inventory.xlsx · Sheet: Projects', why: 'Foundation for all AI workloads — must complete before deploying ML models' },
          { fact: 'Cogito dashboards', value: '12 of 47 live', source: 'Application_Technology_Inventory.xlsx · Sheet: Epic Modules', why: '35 paid dashboards unused — $18M annual value idle' },
          { fact: 'Blue Ridge Cerner', value: 'Millennium 2019', source: 'Application_Technology_Inventory.xlsx · Sheet: EHR', why: '8 months overdue migration — 424 interface mappings undocumented' },
          { fact: 'Prior auth connections', value: '23 of 100 payers', source: 'Application_Technology_Inventory.xlsx · Sheet: Integration Map', why: 'CMS requires 100% by January 2026 — 8 months to compliance crisis' },
          { fact: 'Server utilization', value: '340 VMs under 20%', source: 'DataCenter_Infrastructure.xlsx · Sheet: VM Utilization', why: '$1.8M annual waste — automated right-sizing is a 2-month quick win' },
        ],
      },
      {
        id: 'clinical', label: 'Clinical and Quality', icon: '+', color: '#047857', confidence: 88,
        files: ['Meridian_Healthcare_Quality_RCM_Data.xlsx'],
        records: '23 hospitals · 47 payers · 18M claims · 4 years history',
        findings: [
          { fact: 'RCM denial rate', value: '18.2% overall', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: Denial Summary', why: '6.2 points above Ensemble SLA — $8M in available penalties never enforced' },
          { fact: 'Worst payer', value: 'TennCare: 34%', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: Denial by Payer', why: 'TennCare changed coverage rules Jan 2023 — Epic billing team never notified' },
          { fact: 'Days in AR', value: '52 days', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: AR Aging', why: '10 days above 42-day benchmark — $47M in delayed collections' },
          { fact: 'MA Star rating', value: '3.5 stars', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: Quality Metrics', why: '$34M quality bonus at risk — 10 HEDIS measures below 4.0 threshold' },
          { fact: 'Sepsis AI pilot', value: '31% mortality reduction', source: 'Healthcare_Quality_RCM_Data.xlsx · Sheet: AI Pilots', why: 'Validated at 2 hospitals — stuck 18 months — no MLOps to scale' },
        ],
      },
      {
        id: 'workforce', label: 'Workforce Intelligence', icon: '@', color: '#B45309', confidence: 92,
        files: ['Meridian_Workforce_HR_Analytics.xlsx'],
        records: '42,000 employees · 23 hospitals · 18 months of data',
        findings: [
          { fact: 'Travel nurses', value: '756 FTE', source: 'Workforce_HR_Analytics.xlsx · Sheet: Staffing by Type', why: '$142M annual cost — $74M above benchmark' },
          { fact: 'Nurse turnover rate', value: '24%', source: 'Workforce_HR_Analytics.xlsx · Sheet: Turnover by Role', why: '6 points above 18% benchmark — primary driver of travel nurse dependency' },
          { fact: 'CDO role status', value: 'Vacant 8+ months', source: 'Workforce_HR_Analytics.xlsx · Sheet: Leadership Org Chart', why: 'Every AI initiative blocked — most important single hire' },
          { fact: 'ML and AI talent', value: '3 data scientists', source: 'Workforce_HR_Analytics.xlsx · Sheet: IT Headcount by Skill', why: 'Need 8-10 to execute roadmap — hiring plan must start immediately' },
        ],
      },
      {
        id: 'vendors', label: 'Vendor Performance', icon: '!', color: '#DC2626', confidence: 89,
        files: ['Meridian_Vendor_Performance_Scorecard.xlsx'],
        records: '32 vendors · 847 SLA data points · 3 years history',
        findings: [
          { fact: 'Ensemble SLA compliance', value: '67% vs 95% target', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SLA Tracking', why: '$8M in contractual penalties available — not enforced in 3 years' },
          { fact: 'Ensemble denial rate SLA', value: '18.2% vs 12%', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: RCM Metrics', why: '6.2 points of sustained breach — 3 years of documented evidence' },
          { fact: 'SI vendor rates paid', value: 'Avg $318/hr', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SI Contracts', why: '14% above market — renegotiate or switch to Avanade at $220/hr' },
          { fact: 'Mirth Connect support', value: '71% SLA compliance', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SLA Tracking', why: 'Underperforming — evaluate upgrade to Azure Integration Services' },
        ],
      },
    ],
    readiness: [
      { dimension: 'Data Foundation', score: 62, benchmark: 71, blocker: 'Azure Synapse 40% complete — AI models cannot deploy on incomplete foundation' },
      { dimension: 'Technology Platform', score: 44, benchmark: 68, blocker: 'No MLOps pipeline — sepsis model validated but cannot be deployed at scale' },
      { dimension: 'Data Governance', score: 38, benchmark: 65, blocker: 'No CDO — no owner for data quality, access controls, or AI model governance' },
      { dimension: 'Talent and Skills', score: 32, benchmark: 58, blocker: '3 data scientists vs 8-10 needed — cannot execute roadmap without immediate hiring' },
      { dimension: 'Leadership Alignment', score: 72, benchmark: 74, blocker: 'Near benchmark — CIO, CFO, CMIO aligned on AI priority' },
      { dimension: 'Change Readiness', score: 34, benchmark: 62, blocker: '24% nurse turnover, incomplete Blue Ridge integration, AI pilot fatigue' },
    ],
    howWeKnow: [
      { claim: 'Ensemble SLA compliance is 67% vs 95% contractual requirement', source: 'Vendor_Performance_Scorecard.xlsx · Sheet: SLA Tracking · Row 847', data: 'Monthly SLA compliance rate by vendor, 36 months of data, average 67.3%' },
      { claim: '$8M in available SLA penalties have never been enforced', source: 'IT_Financial_Model_FY2024.xlsx · Sheet: Vendor Contracts · Column: Penalty Clauses', data: 'Contract clause: Vendor shall pay $2M per quarter for sustained breach of denial rate SLA. Penalty accrued not collected: $8.1M' },
      { claim: 'Prior auth: 23% of payers connected electronically', source: 'Application_Technology_Inventory.xlsx · Sheet: Integration Map · Filter: Prior Auth', data: '23 of 100 payer portal integrations marked as Active. 77 marked as Manual or Pending' },
      { claim: 'Azure Synapse is 40% complete and stalled', source: 'Application_Technology_Inventory.xlsx · Sheet: Projects · Row: Azure Synapse', data: 'Project status: 40% complete. Last update: October 2024. Budget consumed: $1.8M of $3.2M allocated' },
      { claim: 'CDO role has been vacant for 8+ months', source: 'Workforce_HR_Analytics.xlsx · Sheet: Leadership Org Chart · Row: Chief Data Officer', data: 'Status: Vacant since August 2025. No active requisition in HR system.' },
      { claim: 'Sepsis AI model stuck at 2 hospitals for 18 months', source: 'Application_Technology_Inventory.xlsx · Sheet: AI Initiatives · Row: Sepsis Early Warning', data: 'Initiative status: Pilot. Hospitals live: 2 of 23. Start date: October 2024. Scale plan: None documented' },
    ],
  },
}

const SECTIONS = [
  { id: 'overview', label: 'Data Overview' },
  { id: 'financial', label: 'Financial Intelligence' },
  { id: 'technology', label: 'Technology Stack' },
  { id: 'clinical', label: 'Clinical and Quality' },
  { id: 'workforce', label: 'Workforce' },
  { id: 'vendors', label: 'Vendor Performance' },
  { id: 'readiness', label: 'AI Readiness Scores' },
  { id: 'howweknow', label: 'How We Know This' },
]

function DataContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [section, setSection] = useState('overview')
  const d = DATA[clientId] || DATA.meridian
  const active = d.categories.find((c: any) => c.id === section)

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; }
    .h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #111827; margin-bottom: 8px; }
    .h2 { font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 12px; }
    .body { font-size: 14px; line-height: 1.7; color: #4B5563; }
    .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .nav-btn { background: none; border: none; cursor: pointer; font-size: 13px; padding: 9px 12px; border-radius: 6px; width: 100%; text-align: left; font-family: inherit; color: #6B7280; display: block; transition: all 0.12s; }
    .nav-btn.active { background: #F3F4F6; color: #111827; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9CA3AF; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; }
    td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; color: #374151; vertical-align: top; line-height: 1.5; }
    tr:last-child td { border-bottom: none; }
    .bar { background: #F3F4F6; border-radius: 4px; height: 8px; overflow: hidden; margin: 4px 0; }
    .bar-fill { height: 8px; border-radius: 4px; }
  `

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system, sans-serif" }}>
      <style>{css}</style>
      <div style={{ background: '#0D1117', borderBottom: '1px solid #21262D', height: '56px', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <line x1="8" y1="8" x2="14" y2="14" stroke="#2DD4C8" strokeWidth="1" opacity="0.6" />
              <line x1="14" y1="14" x2="20" y2="8" stroke="#6B7280" strokeWidth="1" opacity="0.5" />
              <line x1="14" y1="14" x2="20" y2="20" stroke="#6B7280" strokeWidth="1" opacity="0.5" />
              <circle cx="8" cy="8" r="2" fill="#2DD4C8" />
              <circle cx="14" cy="14" r="2.5" fill="#E6EDF3" />
              <circle cx="20" cy="8" r="2" fill="#6B7280" />
              <circle cx="20" cy="20" r="2" fill="#6B7280" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#E6EDF3' }}>Abar<span style={{ color: '#2DD4C8' }}>VA</span></span>
          </a>
          <span style={{ color: '#30363D' }}>›</span>
          <span style={{ fontSize: '13px', color: '#8B949E' }}>{d.client}</span>
          <span style={{ color: '#30363D' }}>›</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>Data Intelligence</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={'/architecture?client=' + clientId} style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(45,212,200,0.1)', color: '#2DD4C8', textDecoration: 'none', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace', border: '1px solid rgba(45,212,200,0.3)' }}>Architecture →</a>
          <a href={'/blueprint?client=' + clientId} style={{ padding: '7px 14px', borderRadius: '8px', background: '#1B4FD8', color: '#fff', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Blueprint →</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ padding: '32px 16px 32px 0', position: 'sticky' as const, top: '56px', height: 'calc(100vh - 56px)', overflowY: 'auto' as const }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Data Confidence</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1B4FD8', letterSpacing: '-0.02em' }}>{d.confidence}%</div>
            <div className="bar"><div className="bar-fill" style={{ width: d.confidence + '%', background: '#1B4FD8' }} /></div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            {d.categories.map((cat: any) => (
              <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: '12px', color: '#374151' }}>{cat.label.split(' ')[0]}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: cat.confidence >= 90 ? '#059669' : '#D97706' }}>{cat.confidence}%</span>
              </div>
            ))}
          </div>
          <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '12px' }} />
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} className={'nav-btn' + (section === s.id ? ' active' : '')}>{s.label}</button>
          ))}
        </div>

        <div style={{ padding: '32px 0 64px 32px', borderLeft: '1px solid #E5E7EB' }}>

          {section === 'overview' && (
            <div>
              <h1 className="h1">Data Intelligence — {d.client}</h1>
              <p className="body" style={{ marginBottom: '24px' }}>Every insight AbarVa surfaces is sourced to a specific row in a specific file.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                {[
                  { label: 'Data categories', value: '5', sub: 'Financial, Tech, Clinical, Workforce, Vendors', color: '#1B4FD8' },
                  { label: 'Files ingested', value: '8 files', sub: '50,000+ records parsed', color: '#6D28D9' },
                  { label: 'Contradictions found', value: '6', sub: 'Each sourced to exact data point', color: '#DC2626' },
                  { label: 'Gaps identified', value: '6', sub: 'Blocking $292M in AI value', color: '#D97706' },
                  { label: 'Opportunities mapped', value: '15', sub: 'Front, middle, back office', color: '#047857' },
                  { label: 'Overall confidence', value: d.confidence + '%', sub: 'Weighted across all categories', color: '#1B4FD8' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '2px' }}>{m.value}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <h2 className="h2">Data Categories Loaded</h2>
                {d.categories.map((cat: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', padding: '14px', borderRadius: '10px', border: '1px solid #E5E7EB', marginBottom: '8px', cursor: 'pointer', alignItems: 'center' }}
                    onClick={() => setSection(cat.id)}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: cat.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: cat.color, fontWeight: 800, flexShrink: 0 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{cat.label}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{cat.records}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: cat.confidence >= 90 ? '#059669' : '#D97706' }}>{cat.confidence}%</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>confidence</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active && (
            <div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: active.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: active.color }}>{active.icon}</div>
                <div style={{ flex: 1 }}>
                  <h1 className="h1" style={{ fontSize: '22px', marginBottom: '2px' }}>{active.label}</h1>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{active.records}</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: active.confidence >= 90 ? '#059669' : '#D97706' }}>{active.confidence}%</div>
              </div>
              <div className="card" style={{ background: '#F9FAFB', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '8px' }}>Files Loaded</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {active.files.map((f: string, i: number) => (
                    <span key={i} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '8px', background: '#fff', color: '#374151', border: '1px solid #E5E7EB' }}>📄 {f}</span>
                  ))}
                </div>
              </div>
              <div className="card">
                <h2 className="h2">What AbarVa Knows — Sourced to Specific Data</h2>
                <table>
                  <thead><tr><th>Finding</th><th>Value</th><th>Source</th><th>Why It Matters</th></tr></thead>
                  <tbody>
                    {active.findings.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{row.fact}</td>
                        <td style={{ fontWeight: 800, color: active.color, whiteSpace: 'nowrap' as const }}>{row.value}</td>
                        <td style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', fontFamily: 'monospace' }}>{row.source}</td>
                        <td style={{ fontSize: '12px', color: '#374151' }}>{row.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'readiness' && (
            <div>
              <h1 className="h1">AI Readiness Assessment</h1>
              <p className="body" style={{ marginBottom: '24px' }}>Scored from loaded data — not interviews. Every score is tied to a specific data point.</p>
              <div className="card">
                {d.readiness.map((row: any, i: number) => {
                  const c = row.score >= 70 ? '#059669' : row.score >= 50 ? '#D97706' : '#DC2626'
                  return (
                    <div key={i} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: i < d.readiness.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{row.dimension}</span>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Benchmark: {row.benchmark}</span>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: c }}>{row.score}</span>
                        </div>
                      </div>
                      <div className="bar"><div className="bar-fill" style={{ width: row.score + '%', background: c }} /></div>
                      <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '6px', fontStyle: 'italic' }}>{row.blocker}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {section === 'howweknow' && (
            <div>
              <h1 className="h1">How We Know This</h1>
              <p className="body" style={{ marginBottom: '16px' }}>Every claim AbarVa makes is tied to a specific row in a specific file. No guessing. No assumptions.</p>
              <div className="card" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: '16px' }}>
                <p className="body" style={{ fontWeight: 600, color: '#1B4FD8' }}>The most common question in every demo: "How did you know that?" This page is the answer.</p>
              </div>
              {d.howWeKnow.map((item: any, i: number) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#9CA3AF', flexShrink: 0 }}>0{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>{item.claim}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Source File</div>
                          <div style={{ fontSize: '12px', color: '#374151', fontFamily: 'monospace' }}>{item.source}</div>
                        </div>
                        <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Data Point</div>
                          <div style={{ fontSize: '12px', color: '#374151' }}>{item.data}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function DataIntelligencePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#6B7280' }}>Loading...</div>}>
      <DataContent />
    </Suspense>
  )
}
