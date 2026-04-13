'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import EngagementProgress from '@/components/EngagementProgress'

// ─── Style tokens ───────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100vh',
    background: '#F8FAFC',
    fontFamily: 'Inter, -apple-system, sans-serif',
  } as React.CSSProperties,
  card: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '24px',
  } as React.CSSProperties,
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '12px',
  } as React.CSSProperties,
}

const ACCENT = '#2563EB'

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, name: 'Estate Inventory' },
  { id: 2, name: 'Lineage Map' },
  { id: 3, name: 'Rationalization' },
  { id: 4, name: 'Migration Playbook' },
  { id: 5, name: 'Target Architecture' },
  { id: 6, name: 'Business Case' },
]

// ─── Client data ──────────────────────────────────────────────────────────────

const CLIENT_META: Record<string, { name: string; industry: string; completeness: number }> = {
  meridian: { name: 'Meridian Health System', industry: 'Healthcare', completeness: 91 },
  firstcapital: { name: 'First Capital Financial', industry: 'Financial Services', completeness: 86 },
  apexretail: { name: 'Apex Retail Group', industry: 'Retail', completeness: 79 },
}

// ─── Step 1: Estate Inventory ─────────────────────────────────────────────────

function Step1EstateInventory({ onNext, onPrev }: { onNext: () => void; onPrev?: () => void }) {
  const rows = [
    { system: 'Epic Caboodle', type: 'Data Warehouse', count: '1', age: '7 yrs', owner: 'IT Analytics', status: 'Active — bottleneck', statusColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { system: 'Crystal Reports', type: 'Reports', count: '847', age: '12 yrs', owner: 'Various', status: '650 candidates for rationalization', statusColor: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    { system: 'Excel workbooks', type: 'Spreadsheets', count: '2,340', age: 'Various', owner: 'Dept heads', status: '1,800 candidates for rationalization', statusColor: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    { system: 'Tableau Server', type: 'BI/Viz', count: '312 dashboards', age: '4 yrs', owner: 'Analytics', status: '180 active, 132 stale', statusColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { system: 'SQL Server jobs', type: 'ETL/Jobs', count: '184', age: '8 yrs', owner: 'IT', status: '67 still running EOS SQL Server 2017', statusColor: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    { system: 'Python scripts', type: 'Ad-hoc', count: '89', age: 'Various', owner: 'Data science', status: '23 undocumented', statusColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Estate Inventory</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Every analytics object — catalogued, classified, and assessed.</p>

      {/* Summary bar */}
      <div style={{ ...S.card, marginBottom: '20px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: ACCENT }}>3,773</div>
            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>Total analytics objects</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#DC2626' }}>2,723</div>
            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>Rationalization candidates (72%)</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ height: '10px', background: '#BFDBFE', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '10px', width: '72%', background: '#DC2626', borderRadius: '5px' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>72% rationalization rate</div>
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#374151', fontWeight: 500, borderTop: '1px solid #BFDBFE', paddingTop: '12px' }}>
          This estate costs <strong>$4.2M/year</strong> to maintain and blocks modern AI use cases.
        </div>
      </div>

      {/* Table */}
      <div style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['System', 'Type', 'Count', 'Age', 'Owner', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left' as const, fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{r.system}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#475569' }}>{r.type}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: ACCENT }}>{r.count}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6B7280' }}>{r.age}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#475569' }}>{r.owner}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: r.statusColor, background: r.bg, border: `1px solid ${r.border}`, borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap' as const }}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onNext} style={{ padding: '12px 32px', borderRadius: '10px', background: ACCENT, color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Next: Lineage Map →</button>
      </div>
    </div>
  )
}

// ─── Step 2: Lineage & Dependency Map ────────────────────────────────────────

function Step2Lineage({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const boxStyle = (color: string, bg: string): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: '8px',
    border: `2px solid ${color}`,
    background: bg,
    fontSize: '12px',
    fontWeight: 600,
    color: '#0F172A',
    textAlign: 'center',
    whiteSpace: 'nowrap' as const,
  })

  const layerLabel: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
    textAlign: 'center',
  }

  const arrow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94A3B8',
    fontSize: '20px',
    padding: '0 4px',
    flexShrink: 0,
  }

  const blockedBadge: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '8px',
    background: '#FEF2F2',
    border: '2px solid #DC2626',
    fontSize: '12px',
    fontWeight: 700,
    color: '#DC2626',
    whiteSpace: 'nowrap' as const,
    textAlign: 'center',
  }

  const criticalPaths = [
    {
      label: 'Clinical AI Path',
      color: '#DC2626',
      steps: ['Epic', 'SQL ETL', 'Caboodle', 'Crystal Reports'],
      blocked: 'BLOCKED — no real-time capability',
      impact: 'Clinical decision support, predictive deterioration, and AI triage cannot be built on batch-only infrastructure. Every clinical AI use case is blocked until this path is modernized.',
    },
    {
      label: 'Operations Path',
      color: '#DC2626',
      steps: ['Workday', 'Excel', 'Manual'],
      blocked: 'BLOCKED — no automation',
      impact: 'Workforce forecasting, supply chain optimization, and capacity planning all rely on manually refreshed Excel workbooks. No API layer exists for automation or ML integration.',
    },
    {
      label: 'Revenue Path',
      color: '#DC2626',
      steps: ['Epic', 'Crystal Reports', 'Finance Excel'],
      blocked: 'BLOCKED — 14-day lag',
      impact: 'Revenue cycle analytics have a 14-day data lag because Crystal Reports runs on weekly batch jobs. Denial prediction, coding accuracy AI, and real-time revenue forecasting are impossible.',
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Lineage and Dependency Map</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>How data flows — and where it gets stuck.</p>

      {/* Architecture flow */}
      <div style={{ ...S.card, marginBottom: '20px', overflowX: 'auto' as const }}>
        <div style={S.label}>DATA FLOW ARCHITECTURE</div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', minWidth: '700px' }}>

          {/* Source layer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
            <div style={layerLabel}>Source Systems</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', width: '100%', alignItems: 'center' }}>
              <div style={boxStyle('#2563EB', '#EFF6FF')}>Epic (EHR)</div>
              <div style={boxStyle('#2563EB', '#EFF6FF')}>Workday (HCM)</div>
              <div style={boxStyle('#2563EB', '#EFF6FF')}>Azure (Cloud)</div>
            </div>
          </div>

          <div style={arrow}>›</div>

          {/* ETL layer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
            <div style={layerLabel}>ETL / Integration</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', width: '100%', alignItems: 'center' }}>
              <div style={boxStyle('#7C3AED', '#F5F3FF')}>SQL Server Jobs</div>
              <div style={boxStyle('#7C3AED', '#F5F3FF')}>Python Scripts</div>
            </div>
          </div>

          <div style={arrow}>›</div>

          {/* Warehouse layer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
            <div style={layerLabel}>Warehouse</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', width: '100%', alignItems: 'center' }}>
              <div style={boxStyle('#059669', '#ECFDF5')}>Epic Caboodle</div>
              <div style={boxStyle('#059669', '#ECFDF5')}>SQL Server DW</div>
            </div>
          </div>

          <div style={arrow}>›</div>

          {/* BI layer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
            <div style={layerLabel}>BI / Reporting</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', width: '100%', alignItems: 'center' }}>
              <div style={boxStyle('#D97706', '#FFFBEB')}>Tableau Server</div>
              <div style={boxStyle('#D97706', '#FFFBEB')}>Crystal Reports</div>
              <div style={boxStyle('#D97706', '#FFFBEB')}>Excel Workbooks</div>
            </div>
          </div>

          <div style={arrow}>›</div>

          {/* End users */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
            <div style={layerLabel}>End Users</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', width: '100%', alignItems: 'center' }}>
              <div style={boxStyle('#475569', '#F8FAFC')}>Clinicians</div>
              <div style={boxStyle('#475569', '#F8FAFC')}>Finance</div>
              <div style={boxStyle('#475569', '#F8FAFC')}>Operations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical paths */}
      <div style={{ ...S.card, marginBottom: '24px' }}>
        <div style={{ ...S.label, color: '#DC2626' }}>3 CRITICAL PATHS BLOCKED — AI USE CASES CANNOT BE BUILT</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          {criticalPaths.map((path, i) => (
            <div key={i} style={{ borderRadius: '10px', border: '1px solid #FECACA', background: '#FEF2F2', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '6px', padding: '2px 10px' }}>{path.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' as const }}>
                  {path.steps.map((step, j) => (
                    <span key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #DC2626', background: '#FFF', fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{step}</span>
                      {j < path.steps.length - 1 && <span style={{ color: '#DC2626', fontWeight: 700 }}>→</span>}
                    </span>
                  ))}
                  <span style={{ color: '#DC2626', fontWeight: 700 }}>→</span>
                  <span style={blockedBadge}>{path.blocked}</span>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{path.impact}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        <button onClick={onNext} style={{ padding: '12px 32px', borderRadius: '10px', background: ACCENT, color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Next: Rationalization →</button>
      </div>
    </div>
  )
}

// ─── Step 3: Rationalization ──────────────────────────────────────────────────

function Step3Rationalization({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const columns = [
    {
      title: 'MODERNIZE',
      subtitle: 'Keep and upgrade',
      color: '#059669',
      bg: '#ECFDF5',
      border: '#6EE7B7',
      headerBg: '#059669',
      items: [
        { name: 'Epic Caboodle', action: 'Databricks lakehouse migration', note: 'Foundation for AI' },
        { name: '45 core Tableau dashboards', action: 'Tableau Cloud (self-service, real-time)', note: '' },
        { name: '12 critical SQL ETL jobs', action: 'Azure Data Factory', note: '' },
      ],
    },
    {
      title: 'RETIRE',
      subtitle: 'Decommission',
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      headerBg: '#DC2626',
      items: [
        { name: '650 Crystal Reports', action: 'Replace with 45 modern Tableau dashboards', note: '' },
        { name: '1,800 Excel workbooks', action: 'Consolidate into 8 governed self-service dashboards', note: '' },
        { name: '67 SQL Server 2017 jobs', action: 'Migrate to Azure Data Factory before Oct 2027 EOS', note: 'Firm deadline' },
      ],
    },
    {
      title: 'DEFER',
      subtitle: 'Not now',
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      headerBg: '#D97706',
      items: [
        { name: '132 stale Tableau dashboards', action: 'Review in 6 months', note: '' },
        { name: '23 undocumented Python scripts', action: 'Audit first, then decide', note: '' },
      ],
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Rationalization</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Every object classified. Nothing deferred without a reason.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {columns.map((col) => (
          <div key={col.title} style={{ borderRadius: '12px', border: `1px solid ${col.border}`, background: col.bg, overflow: 'hidden' }}>
            <div style={{ background: col.headerBg, padding: '12px 16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'white', letterSpacing: '0.04em' }}>{col.title}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{col.subtitle}</div>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              {col.items.map((item, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '12px', border: `1px solid ${col.border}` }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: col.color, fontWeight: 600 }}>{item.action}</div>
                  {item.note && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', fontWeight: 600 }}>{item.note}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Net result */}
      <div style={{ ...S.card, background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: '24px' }}>
        <div style={S.label}>NET RESULT</div>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' as const }}>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#DC2626' }}>2,723</div>
            <div style={{ fontSize: '12px', color: '#374151' }}>Objects rationalized</div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669' }}>312</div>
            <div style={{ fontSize: '12px', color: '#374151' }}>Objects modernized</div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: ACCENT }}>$3.1M</div>
            <div style={{ fontSize: '12px', color: '#374151' }}>Annual cost reduction</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        <button onClick={onNext} style={{ padding: '12px 32px', borderRadius: '10px', background: ACCENT, color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Next: Migration Playbook →</button>
      </div>
    </div>
  )
}

// ─── Step 4: Migration Playbook ───────────────────────────────────────────────

function Step4MigrationPlaybook({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const migrations = [
    {
      number: 1,
      from: 'Crystal Reports',
      to: 'Tableau Cloud',
      what: '650 reports → 45 governed dashboards',
      dependencies: 'Tableau Server license transfer, Caboodle connector',
      approach: 'Analyze usage → build 45 governed dashboards → sunset Crystal',
      risk: 'Report owner resistance',
      mitigation: 'Champion network',
      timeline: '6 months',
      riskLevel: 'medium',
    },
    {
      number: 2,
      from: 'Caboodle',
      to: 'Databricks Delta Lake',
      what: 'Batch warehouse → streaming lakehouse',
      dependencies: 'Azure infrastructure, data governance framework',
      approach: 'Lift-shift Caboodle, then incrementally migrate workloads',
      risk: 'Epic integration complexity',
      mitigation: 'Epic Clarity API layer',
      timeline: '9 months',
      riskLevel: 'high',
    },
    {
      number: 3,
      from: 'SQL Server 2017 ETL',
      to: 'Azure Data Factory',
      what: '184 jobs → 67 critical, migrate before Oct 2027 EOS',
      dependencies: 'Azure subscription, IT bandwidth',
      approach: 'Automated SSIS migration tool + manual review',
      risk: 'EOS deadline is firm',
      mitigation: 'No mitigation — must complete',
      timeline: '12 months',
      riskLevel: 'critical',
    },
  ]

  const riskColors: Record<string, { color: string; bg: string; border: string }> = {
    medium: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    high: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    critical: { color: '#7C2D12', bg: '#FFF7ED', border: '#FED7AA' },
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Migration Playbook</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Step-by-step execution guide for each critical migration.</p>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px', marginBottom: '24px' }}>
        {migrations.map((m) => {
          const rc = riskColors[m.riskLevel]
          return (
            <div key={m.number} style={{ ...S.card }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ACCENT, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, flexShrink: 0 }}>{m.number}</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{m.from} → {m.to}</div>
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{m.what}</div>
                </div>
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '12px', fontWeight: 700, color: ACCENT }}>{m.timeline}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>Dependencies</div>
                  <div style={{ fontSize: '13px', color: '#374151' }}>{m.dependencies}</div>
                </div>
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>Approach</div>
                  <div style={{ fontSize: '13px', color: '#374151' }}>{m.approach}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', background: rc.bg, border: `1px solid ${rc.border}`, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: rc.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>Risk — {m.riskLevel.toUpperCase()}</div>
                  <div style={{ fontSize: '13px', color: '#374151' }}>
                    <strong>{m.risk}</strong>{m.mitigation !== 'No mitigation — must complete' ? ` — mitigate: ${m.mitigation}` : <span style={{ color: rc.color }}> — {m.mitigation}</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        <button onClick={onNext} style={{ padding: '12px 32px', borderRadius: '10px', background: ACCENT, color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Next: Target Architecture →</button>
      </div>
    </div>
  )
}

// ─── Step 5: Target Architecture ─────────────────────────────────────────────

type PlatformView = 'agnostic' | 'platform'

function Step5TargetArchitecture({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [view, setView] = useState<PlatformView>('agnostic')

  const platforms = [
    {
      id: 'databricks',
      name: 'Databricks',
      tagline: 'Healthcare AI leader',
      recommended: true,
      referral: true,
      scores: { ecosystemFit: 88, compliance: 84, cost: 72, skills: 71, risk: 76 },
    },
    {
      id: 'snowflake',
      name: 'Snowflake',
      tagline: 'SQL-first analytics',
      recommended: false,
      referral: true,
      scores: { ecosystemFit: 82, compliance: 86, cost: 78, skills: 84, risk: 80 },
    },
    {
      id: 'bigquery',
      name: 'Google BigQuery',
      tagline: 'GCP native',
      recommended: false,
      referral: false,
      scores: { ecosystemFit: 74, compliance: 80, cost: 82, skills: 76, risk: 74 },
    },
    {
      id: 'fabric',
      name: 'Microsoft Fabric',
      tagline: 'Microsoft EA bundle',
      recommended: false,
      referral: false,
      scores: { ecosystemFit: 79, compliance: 84, cost: 76, skills: 82, risk: 72 },
    },
  ]

  const scoreKeys: Array<keyof typeof platforms[0]['scores']> = ['ecosystemFit', 'compliance', 'cost', 'skills', 'risk']
  const scoreLabels: Record<string, string> = { ecosystemFit: 'Ecosystem Fit', compliance: 'Compliance', cost: 'Cost', skills: 'Skills Availability', risk: 'Risk' }

  const avgScore = (s: typeof platforms[0]['scores']) =>
    Math.round(Object.values(s).reduce((a, b) => a + b, 0) / Object.values(s).length)

  const agnosticLayers = [
    { name: 'Consumption Layer', items: ['Self-Service BI', 'Embedded Analytics', 'AI/ML APIs', 'Ad-hoc Queries'], color: '#2563EB', bg: '#EFF6FF' },
    { name: 'Semantic Layer', items: ['Governed Metrics', 'Business Glossary', 'Row-level Security', 'Certified Datasets'], color: '#7C3AED', bg: '#F5F3FF' },
    { name: 'Analytics Platform', items: ['Lakehouse / DW', 'Feature Store', 'ML Platform', 'Query Engine'], color: '#059669', bg: '#ECFDF5' },
    { name: 'Ingestion / ETL', items: ['Streaming Ingest', 'Batch ETL', 'CDC Pipelines', 'API Connectors'], color: '#D97706', bg: '#FFFBEB' },
    { name: 'Source Systems', items: ['EHR (Epic)', 'HCM (Workday)', 'Finance (Workday)', 'Cloud Services'], color: '#475569', bg: '#F8FAFC' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Target State Architecture</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Choose the platform that fits — or see the agnostic logical model.</p>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['agnostic', 'platform'] as PlatformView[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid ' + (view === v ? ACCENT : '#E2E8F0'), background: view === v ? ACCENT : 'white', color: view === v ? 'white' : '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {v === 'agnostic' ? 'Platform Agnostic' : 'Platform Comparison'}
          </button>
        ))}
      </div>

      {view === 'agnostic' && (
        <div style={{ ...S.card, marginBottom: '20px' }}>
          <div style={S.label}>LOGICAL TARGET ARCHITECTURE — PLATFORM AGNOSTIC</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            {agnosticLayers.map((layer, i) => (
              <div key={i} style={{ borderRadius: '10px', border: `1px solid ${layer.color}30`, background: layer.bg, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '140px', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: layer.color }}>{layer.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {layer.items.map((item, j) => (
                    <span key={j} style={{ padding: '3px 10px', borderRadius: '6px', background: 'white', border: `1px solid ${layer.color}40`, fontSize: '12px', color: '#374151', fontWeight: 500 }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#374151' }}>
            This logical architecture is implementable on Databricks, Snowflake, BigQuery, or Microsoft Fabric. Platform selection depends on existing enterprise agreements, team skills, and AI/ML workload mix.
          </div>
        </div>
      )}

      {view === 'platform' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {platforms.map((p) => {
              const avg = avgScore(p.scores)
              return (
                <div key={p.id} style={{ ...S.card, border: p.recommended ? `2px solid ${ACCENT}` : '1px solid #E2E8F0', position: 'relative' as const }}>
                  {p.recommended && (
                    <div style={{ position: 'absolute' as const, top: '-1px', right: '16px', background: ACCENT, color: 'white', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: '0.04em' }}>RECOMMENDED</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{p.tagline}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: avg >= 80 ? '#059669' : avg >= 70 ? ACCENT : '#D97706' }}>{avg}</div>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>avg score</div>
                    </div>
                  </div>

                  {scoreKeys.map(key => {
                    const val = p.scores[key]
                    const barColor = val >= 80 ? '#059669' : val >= 70 ? ACCENT : '#D97706'
                    return (
                      <div key={key} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', color: '#475569' }}>{scoreLabels[key]}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: barColor }}>{val}</span>
                        </div>
                        <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                          <div style={{ height: '4px', borderRadius: '2px', width: val + '%', background: barColor }} />
                        </div>
                      </div>
                    )
                  })}

                  {p.referral && (
                    <div style={{ marginTop: '12px', padding: '6px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '11px', color: '#92400E', fontWeight: 600 }}>
                      AbarVa referral partner
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '16px', ...S.card, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '13px', color: '#374151' }}>
              Need help selecting the right platform for your environment?{' '}
              <a href="/marketplace" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>Find the right platform in Marketplace →</a>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        <button onClick={onNext} style={{ padding: '12px 32px', borderRadius: '10px', background: ACCENT, color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Next: Business Case →</button>
      </div>
    </div>
  )
}

// ─── Step 6: Business Case + Roadmap ─────────────────────────────────────────

type ScenarioKey = 'conservative' | 'moderate' | 'aggressive'

function Step6BusinessCase({ onPrev }: { onPrev: () => void }) {
  const [scenario, setScenario] = useState<ScenarioKey>('moderate')

  const scenarios: Record<ScenarioKey, { investment: string; savings: string; roi: string; payback: string; color: string; bg: string; border: string }> = {
    conservative: { investment: '$4.8M', savings: '$7.2M', roi: '1.5x', payback: '12 months', color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
    moderate: { investment: '$8.2M', savings: '$14.1M', roi: '1.7x', payback: '8 months', color: ACCENT, bg: '#EFF6FF', border: '#BFDBFE' },
    aggressive: { investment: '$14M', savings: '$22M', roi: '1.6x', payback: '7 months', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  }

  const phases = [
    {
      label: 'Phase 1',
      range: 'Months 0–6',
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      tag: 'Must-do',
      items: [
        'Crystal Reports / Excel rationalization — build 45 governed Tableau dashboards',
        'SQL Server 2017 ETL migration started — EOS deadline clock running',
        'Tableau Server → Tableau Cloud license migration',
      ],
    },
    {
      label: 'Phase 2',
      range: 'Months 6–12',
      color: ACCENT,
      bg: '#EFF6FF',
      border: '#BFDBFE',
      tag: 'Core migration',
      items: [
        'Caboodle → Databricks Delta Lake lift-and-shift complete',
        'Tableau Cloud fully operational, Crystal Reports decommissioned',
        'SQL Server ETL migration complete (ahead of Oct 2027 EOS)',
      ],
    },
    {
      label: 'Phase 3',
      range: 'Months 12–18',
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      tag: 'AI enablement',
      items: [
        'AI/ML model development on Databricks lakehouse',
        'Real-time clinical AI pipelines — deterioration prediction, triage support',
        'Revenue cycle AI — denial prediction, coding accuracy, real-time forecasting',
      ],
    },
  ]

  const artifacts = [
    'Rationalization Report',
    'Migration Playbook',
    'Target Architecture',
    'Business Case',
    'Board Deck',
  ]

  const s = scenarios[scenario]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Business Case + 18-Month Roadmap</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Three investment scenarios. One clear path forward.</p>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {(Object.entries(scenarios) as [ScenarioKey, typeof scenarios[ScenarioKey]][]).map(([key, val]) => (
          <button key={key} onClick={() => setScenario(key)}
            style={{ flex: 1, minWidth: '180px', padding: '16px', borderRadius: '10px', border: `2px solid ${scenario === key ? val.color : '#E2E8F0'}`, background: scenario === key ? val.bg : 'white', cursor: 'pointer', textAlign: 'left' as const, fontFamily: 'inherit' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: scenario === key ? val.color : '#6B7280', textTransform: 'uppercase' as const, marginBottom: '6px', letterSpacing: '0.05em' }}>{key}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>{val.investment}</div>
            <div style={{ fontSize: '12px', color: '#374151' }}>{val.savings} annual savings</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: val.color }}>{val.roi} ROI</span>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>{val.payback} payback</span>
            </div>
          </button>
        ))}
      </div>

      {/* Scenario detail */}
      <div style={{ ...S.card, background: s.bg, border: `1px solid ${s.border}`, marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Total Investment', value: s.investment },
            { label: 'Annual Savings', value: s.savings },
            { label: 'ROI', value: s.roi },
            { label: 'Payback Period', value: s.payback },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: s.color }}>{m.value}</div>
              <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500, marginTop: '2px' }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', borderTop: '1px solid ' + s.border, paddingTop: '12px', fontSize: '12px', color: '#6B7280', textAlign: 'center' as const }}>
          Savings breakdown: $3.1M maintenance reduction + velocity unlock from AI enablement
        </div>
      </div>

      {/* Roadmap */}
      <div style={{ ...S.card, marginBottom: '24px' }}>
        <div style={S.label}>18-MONTH ROADMAP</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {phases.map((phase, i) => (
            <div key={i} style={{ borderRadius: '10px', border: `1px solid ${phase.border}`, background: phase.bg, padding: '16px', display: 'flex', gap: '16px' }}>
              <div style={{ flexShrink: 0, width: '120px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: phase.color }}>{phase.label}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{phase.range}</div>
                <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', background: 'white', border: `1px solid ${phase.border}`, fontSize: '10px', fontWeight: 700, color: phase.color }}>{phase.tag}</span>
              </div>
              <div style={{ flex: 1 }}>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {phase.items.map((item, j) => (
                    <li key={j} style={{ fontSize: '13px', color: '#374151', marginBottom: '6px', lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export / artifacts */}
      <div style={{ ...S.card, background: '#0F172A', border: '1px solid #1E293B', marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Export 5 Deliverables</div>
        <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>What McKinsey charges $2.4M and 12 weeks to produce.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px', marginBottom: '16px' }}>
          {artifacts.map((a, i) => (
            <button key={i}
              style={{ padding: '8px 16px', borderRadius: '8px', background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {a}
            </button>
          ))}
        </div>
        <button style={{ padding: '12px 28px', borderRadius: '10px', background: ACCENT, color: 'white', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Export All Deliverables →
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={onPrev} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  )
}

// ─── Main content component (needs useSearchParams) ───────────────────────────

function AnalyticsModernizationContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') ?? 'meridian'
  const [step, setStep] = useState(0)
  const [activeClient, setActiveClient] = useState(clientId)

  const meta = CLIENT_META[activeClient] ?? CLIENT_META['meridian']

  const Breadcrumb = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
      <span style={{ color: '#D1D5DB' }}>›</span>
      <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Analytics Modernization</span>
      <span style={{ color: '#D1D5DB' }}>›</span>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>{meta.name} · {meta.industry}</span>
    </div>
  )

  const StepNav = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', overflowX: 'auto' as const }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            style={{ padding: '12px 18px', fontSize: '13px', fontWeight: step === s.id ? 600 : 400, color: step === s.id ? ACCENT : step > s.id ? '#059669' : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', borderBottom: step === s.id ? `2px solid ${ACCENT}` : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' as const, fontFamily: 'inherit' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === s.id ? ACCENT : step > s.id ? '#059669' : '#F1F5F9', color: step === s.id || step > s.id ? 'white' : '#94A3B8', flexShrink: 0 }}>
              {step > s.id ? '✓' : s.id}
            </span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <AbarvaNav clientId={activeClient} onClientChange={id => { setActiveClient(id); setStep(0) }} activePage="analytics-modernization" />
      <EngagementProgress />
      <Breadcrumb />
      {step > 0 && <StepNav />}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>

        {/* Step 0 — Landing */}
        {step === 0 && (
          <div>
            {/* Hero */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: ACCENT, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>AbarVa Intelligence Platform</div>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', lineHeight: 1.2 }}>Analytics Modernization</h1>
              <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.7, maxWidth: '680px', marginBottom: '0' }}>
                Map your analytics estate, identify what to modernize vs retire, and build a migration path. Every recommendation tied to your actual data systems and architecture.
              </p>
            </div>

            {/* Data completeness */}
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>DATA COMPLETENESS BY CLIENT</div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
                {[
                  { id: 'meridian', name: 'Meridian Health System', pct: 91 },
                  { id: 'firstcapital', name: 'First Capital Financial', pct: 86 },
                  { id: 'apexretail', name: 'Apex Retail Group', pct: 79 },
                ].map(c => (
                  <div key={c.id} onClick={() => setActiveClient(c.id)}
                    style={{ flex: 1, minWidth: '180px', padding: '16px', borderRadius: '10px', border: `2px solid ${activeClient === c.id ? ACCENT : '#E2E8F0'}`, background: activeClient === c.id ? '#EFF6FF' : '#F8FAFC', cursor: 'pointer' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{c.name}</div>
                    <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', marginBottom: '6px' }}>
                      <div style={{ height: '6px', borderRadius: '3px', width: c.pct + '%', background: c.pct >= 85 ? '#059669' : '#D97706' }} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: c.pct >= 85 ? '#059669' : '#D97706' }}>{c.pct}% complete</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs */}
            <div style={{ ...S.card, marginBottom: '32px' }}>
              <div style={S.label}>WHAT YOU GET</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                {['Estate inventory', 'Rationalization map', 'Migration playbook', 'Target architecture', 'Business case'].map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT, display: 'block', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{o}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button onClick={() => setStep(1)}
              style={{ padding: '14px 36px', borderRadius: '12px', background: ACCENT, color: 'white', border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Start Analytics Modernization →
            </button>
          </div>
        )}

        {step === 1 && <Step1EstateInventory onNext={() => setStep(2)} />}
        {step === 2 && <Step2Lineage onNext={() => setStep(3)} onPrev={() => setStep(1)} />}
        {step === 3 && <Step3Rationalization onNext={() => setStep(4)} onPrev={() => setStep(2)} />}
        {step === 4 && <Step4MigrationPlaybook onNext={() => setStep(5)} onPrev={() => setStep(3)} />}
        {step === 5 && <Step5TargetArchitecture onNext={() => setStep(6)} onPrev={() => setStep(4)} />}
        {step === 6 && <Step6BusinessCase onPrev={() => setStep(5)} />}

      </div>
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function AnalyticsModernizationPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</div>
      </div>
    }>
      <AnalyticsModernizationContent />
    </Suspense>
  )
}
