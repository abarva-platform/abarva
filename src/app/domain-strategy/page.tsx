'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

const DOMAINS = [
  { id: 'rcm', label: 'Revenue Cycle', icon: '💰', value: '$94M', color: '#2563EB' },
  { id: 'clinical', label: 'Clinical Operations', icon: '🏥', value: '$88M', color: '#7C3AED' },
  { id: 'workforce', label: 'Workforce', icon: '👥', value: '$48M', color: '#059669' },
  { id: 'tech', label: 'Technology Foundation', icon: '⚙️', value: '$32M', color: '#D97706' },
  { id: 'patient', label: 'Patient Experience', icon: '❤️', value: '$28M', color: '#DC2626' },
  { id: 'supply', label: 'Supply Chain', icon: '📦', value: '$18M', color: '#0891B2' },
]

type DomainData = {
  metrics: { label: string; value: string; sub: string; status: 'red' | 'yellow' | 'green' }[]
  useCases: { name: string; value: string; readiness: string; timeline: string; approach: string }[]
  arch: string[]
  phases: { label: string; duration: string; budget: string; items: string[] }[]
  totalInvest: string
  totalValue: string
  payback: string
}

const DOMAIN_DATA: Record<string, DomainData> = {
  rcm: {
    metrics: [
      { label: 'Denial Rate', value: '18.2%', sub: 'Benchmark 11.4% — gap costs $94M annually', status: 'red' },
      { label: 'Days in AR', value: '52 days', sub: 'Benchmark 42 days — $47M in delayed collections', status: 'red' },
      { label: 'Prior Auth Electronic', value: '23%', sub: 'CMS requires 100% by Jan 2027', status: 'red' },
    ],
    useCases: [
      { name: 'Prior Auth Automation', value: '$28M', readiness: 'High', timeline: '6 months', approach: 'Buy — Cohere Health' },
      { name: 'Denial Prediction ML', value: '$34M', readiness: 'Medium', timeline: '9 months', approach: 'Build — Azure ML' },
      { name: 'Payment Integrity AI', value: '$18M', readiness: 'Medium', timeline: '12 months', approach: 'Buy — Cotiviti' },
      { name: 'Coding Accuracy AI', value: '$12M', readiness: 'High', timeline: '6 months', approach: 'Configure — Epic' },
      { name: 'AR Aging Automation', value: '$8M', readiness: 'High', timeline: '3 months', approach: 'Configure — Epic Cogito' },
    ],
    arch: [
      'Patient/Staff  →  Epic Workflow  →  Claude AI Agent  →  Azure Synapse',
      '                        ↓                   ↓                   ↓',
      '               Cohere Health      Denial Prediction    Payment Integrity',
      '               (847 payers)       (Azure ML model)     (Cotiviti API)',
    ],
    phases: [
      { label: 'Phase 1', duration: '0–3 months', budget: '$1.2M', items: ['AR Aging automation via Epic Cogito', 'Coding accuracy AI — Epic-native config', 'Data foundation: Azure Synapse setup'] },
      { label: 'Phase 2', duration: '3–9 months', budget: '$4.8M', items: ['Prior auth automation — Cohere Health go-live', 'Denial prediction ML model — build + train', 'Payer connectivity: 847 payers integrated'] },
      { label: 'Phase 3', duration: '9–18 months', budget: '$6.4M', items: ['Payment integrity AI — Cotiviti integration', 'Full payer network automation', 'ML model iteration — target 94% accuracy'] },
    ],
    totalInvest: '$12.4M',
    totalValue: '$94M',
    payback: '6.2 months',
  },
  clinical: {
    metrics: [
      { label: 'Sepsis Mortality', value: '8.4%', sub: 'Benchmark 5.1% — 62 avoidable deaths/year', status: 'red' },
      { label: 'OR Utilization', value: '61%', sub: 'Benchmark 78% — $22M in underused capacity', status: 'red' },
      { label: 'Readmission Rate', value: '19.2%', sub: 'Benchmark 14.8% — $31M penalty exposure', status: 'red' },
    ],
    useCases: [
      { name: 'Sepsis Early Warning', value: '$24M', readiness: 'High', timeline: '4 months', approach: 'Configure — Epic Sepsis Model' },
      { name: 'OR Schedule Optimization', value: '$22M', readiness: 'Medium', timeline: '9 months', approach: 'Build — Azure ML + Epic' },
      { name: 'Readmission Prediction', value: '$18M', readiness: 'High', timeline: '6 months', approach: 'Configure — Epic Predictive Risk' },
      { name: 'Clinical Documentation AI', value: '$14M', readiness: 'High', timeline: '4 months', approach: 'Buy — Nuance DAX' },
      { name: 'Length-of-Stay Optimization', value: '$10M', readiness: 'Medium', timeline: '12 months', approach: 'Build — Azure ML' },
    ],
    arch: [
      'Clinical Data  →  Epic Cogito  →  ML Models  →  Clinical Dashboard',
      '                      ↓               ↓               ↓',
      '               Sepsis Monitor   OR Optimizer    DAX Copilot',
      '               (real-time)      (Azure ML)     (820 physicians)',
    ],
    phases: [
      { label: 'Phase 1', duration: '0–4 months', budget: '$1.8M', items: ['Sepsis Early Warning — Epic model activation', 'Nuance DAX — 200-physician pilot', 'Readmission prediction baseline setup'] },
      { label: 'Phase 2', duration: '4–9 months', budget: '$3.6M', items: ['OR schedule optimization model — build', 'DAX full rollout to 820 physicians', 'Readmission prediction — full production'] },
      { label: 'Phase 3', duration: '9–18 months', budget: '$4.2M', items: ['Length-of-stay ML model go-live', 'OR optimization — full schedule automation', 'Clinical AI governance framework active'] },
    ],
    totalInvest: '$9.6M',
    totalValue: '$88M',
    payback: '5.2 months',
  },
  workforce: {
    metrics: [
      { label: 'Nurse Vacancy Rate', value: '14.8%', sub: 'Benchmark 9.2% — $28M in agency spend overage', status: 'red' },
      { label: 'Agency Staffing Cost', value: '$41M/yr', sub: 'Target under $20M — 2× peer median', status: 'red' },
      { label: 'Turnover Rate', value: '22.4%', sub: 'Benchmark 16.1% — $8.4M in hiring costs', status: 'red' },
    ],
    useCases: [
      { name: 'Predictive Staffing AI', value: '$18M', readiness: 'Medium', timeline: '9 months', approach: 'Buy — Avantas / Kronos AI' },
      { name: 'Turnover Prediction ML', value: '$12M', readiness: 'Medium', timeline: '9 months', approach: 'Build — Azure ML on HRIS data' },
      { name: 'Agency Fill Rate Optimizer', value: '$10M', readiness: 'High', timeline: '6 months', approach: 'Configure — Workforce hub' },
      { name: 'Recruitment AI', value: '$5M', readiness: 'High', timeline: '3 months', approach: 'Buy — Paradox / Eightfold' },
      { name: 'Schedule Optimization', value: '$3M', readiness: 'High', timeline: '4 months', approach: 'Configure — Kronos + AI layer' },
    ],
    arch: [
      'HRIS / Kronos  →  Azure ML  →  Staffing AI  →  Nurse Managers',
      '                      ↓              ↓               ↓',
      '               Turnover Model  Agency Optimizer  Recruitment AI',
      '               (Azure ML)      (Workforce hub)   (Paradox API)',
    ],
    phases: [
      { label: 'Phase 1', duration: '0–3 months', budget: '$600K', items: ['Recruitment AI — Paradox integration', 'Agency fill rate optimizer go-live', 'HRIS data pipeline to Azure ML'] },
      { label: 'Phase 2', duration: '3–9 months', budget: '$2.4M', items: ['Predictive staffing AI — pilot 3 units', 'Turnover prediction model — train + validate', 'Schedule optimization — Kronos AI layer'] },
      { label: 'Phase 3', duration: '9–18 months', budget: '$2.8M', items: ['Staffing AI — system-wide rollout', 'Turnover model — proactive intervention program', 'Agency cost reduction target: $21M saved'] },
    ],
    totalInvest: '$5.8M',
    totalValue: '$48M',
    payback: '4.4 months',
  },
  tech: {
    metrics: [
      { label: 'Epic Optimization', value: '58/100', sub: 'Target 85/100 — unlocks $18M in automation', status: 'red' },
      { label: 'Data Latency', value: '24 hrs', sub: 'Real-time required for clinical AI — 24× gap', status: 'red' },
      { label: 'Cloud Utilization', value: '31%', sub: 'Target 70%+ to support AI workloads', status: 'red' },
    ],
    useCases: [
      { name: 'Azure Data Lakehouse', value: '$12M', readiness: 'Medium', timeline: '9 months', approach: 'Build — Databricks on Azure' },
      { name: 'Epic AI Module Activation', value: '$10M', readiness: 'High', timeline: '6 months', approach: 'Configure — Epic PS + SI' },
      { name: 'API Integration Layer', value: '$6M', readiness: 'Medium', timeline: '12 months', approach: 'Build — MuleSoft on Azure' },
      { name: 'MLOps Platform', value: '$4M', readiness: 'Low', timeline: '12 months', approach: 'Buy — Azure ML + Databricks MLflow' },
    ],
    arch: [
      'Epic + Sources  →  Databricks  →  Azure ML  →  Prod AI Apps',
      '                       ↓               ↓              ↓',
      '               Unity Catalog    MLflow Tracking   API Gateway',
      '               (HIPAA govern.)  (model lifecycle)  (MuleSoft)',
    ],
    phases: [
      { label: 'Phase 1', duration: '0–3 months', budget: '$800K', items: ['Azure Synapse landing zone setup', 'Epic Cogito data pipeline activation', 'API gateway foundation — MuleSoft'] },
      { label: 'Phase 2', duration: '3–9 months', budget: '$3.2M', items: ['Databricks migration — full data lakehouse', 'Epic AI module activation via SI partner', 'MLflow model registry go-live'] },
      { label: 'Phase 3', duration: '9–18 months', budget: '$4.8M', items: ['MLOps platform — full production', 'Real-time streaming pipeline completion', 'AI infrastructure audit + governance layer'] },
    ],
    totalInvest: '$8.8M',
    totalValue: '$32M',
    payback: '13.2 months',
  },
  patient: {
    metrics: [
      { label: 'HCAHPS Score', value: '71/100', sub: 'Target 85+ — $14M in VBP bonus at risk', status: 'red' },
      { label: 'No-Show Rate', value: '18.4%', sub: 'Benchmark 9.8% — $8M in lost revenue', status: 'red' },
      { label: 'Patient Portal Active', value: '34%', sub: 'Target 65%+ — below all peer systems', status: 'red' },
    ],
    useCases: [
      { name: 'No-Show Prediction AI', value: '$10M', readiness: 'High', timeline: '4 months', approach: 'Configure — Epic + Azure ML' },
      { name: 'Personalized Care Messaging', value: '$8M', readiness: 'Medium', timeline: '9 months', approach: 'Buy — Salesforce Health Cloud' },
      { name: 'Portal Engagement AI', value: '$6M', readiness: 'Medium', timeline: '6 months', approach: 'Configure — Epic MyChart + AI' },
      { name: 'HCAHPS Predictor', value: '$4M', readiness: 'Low', timeline: '12 months', approach: 'Build — Azure ML on survey data' },
    ],
    arch: [
      'Patient Data  →  Epic MyChart  →  AI Layer  →  Patient Touchpoints',
      '                      ↓               ↓               ↓',
      '               No-Show Model    Messaging AI    Portal Nudges',
      '               (Azure ML)      (Salesforce HC)  (MyChart API)',
    ],
    phases: [
      { label: 'Phase 1', duration: '0–4 months', budget: '$700K', items: ['No-show prediction — Epic ML config', 'MyChart portal engagement prompts', 'Baseline HCAHPS data pipeline'] },
      { label: 'Phase 2', duration: '4–9 months', budget: '$1.8M', items: ['Salesforce Health Cloud — messaging AI', 'No-show intervention program go-live', 'Portal activation campaign with AI personalization'] },
      { label: 'Phase 3', duration: '9–18 months', budget: '$2.4M', items: ['HCAHPS predictor — full model production', 'End-to-end patient journey AI layer', 'VBP bonus recovery program active'] },
    ],
    totalInvest: '$4.9M',
    totalValue: '$28M',
    payback: '6.3 months',
  },
  supply: {
    metrics: [
      { label: 'Supply Spend', value: '$312M/yr', sub: 'Benchmark savings potential: 12% = $37M', status: 'red' },
      { label: 'Stockout Events', value: '148/mo', sub: 'Target under 30/mo — OR delays cost $2.8M/yr', status: 'red' },
      { label: 'Contract Compliance', value: '61%', sub: 'Target 88% — leakage costs $18M annually', status: 'red' },
    ],
    useCases: [
      { name: 'Demand Forecasting AI', value: '$8M', readiness: 'Medium', timeline: '9 months', approach: 'Buy — Workday AI Supply' },
      { name: 'Contract Compliance AI', value: '$6M', readiness: 'High', timeline: '6 months', approach: 'Configure — Infor + Azure ML' },
      { name: 'Stockout Prediction', value: '$3M', readiness: 'High', timeline: '4 months', approach: 'Build — Azure ML on PAR data' },
      { name: 'Vendor Risk Monitoring', value: '$1M', readiness: 'Medium', timeline: '12 months', approach: 'Buy — Resilinc API' },
    ],
    arch: [
      'ERP / PAR Data  →  Azure ML  →  Supply AI  →  Procurement',
      '                       ↓              ↓              ↓',
      '               Demand Forecast  Compliance AI   Risk Monitor',
      '               (Workday AI)     (Infor + ML)   (Resilinc API)',
    ],
    phases: [
      { label: 'Phase 1', duration: '0–4 months', budget: '$400K', items: ['Stockout prediction — Azure ML on PAR data', 'Contract compliance rules engine setup', 'ERP data pipeline to Azure'] },
      { label: 'Phase 2', duration: '4–9 months', budget: '$1.6M', items: ['Demand forecasting AI — Workday integration', 'Contract compliance AI — full deployment', 'Vendor risk monitoring — Resilinc API'] },
      { label: 'Phase 3', duration: '9–18 months', budget: '$2.2M', items: ['Full supply network AI layer', 'Dynamic pricing optimization pilot', 'Supply AI — system-wide rollout'] },
    ],
    totalInvest: '$4.2M',
    totalValue: '$18M',
    payback: '14.0 months',
  },
}

const READINESS_COLOR: Record<string, { bg: string; color: string }> = {
  High: { bg: '#ECFDF5', color: '#059669' },
  Medium: { bg: '#FFFBEB', color: '#D97706' },
  Low: { bg: '#FEF2F2', color: '#DC2626' },
}

function DomainStrategyContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [activeClient, setActiveClient] = useState(clientId)
  const [domainId, setDomainId] = useState('rcm')

  const domain = DOMAINS.find(d => d.id === domainId) || DOMAINS[0]
  const data = DOMAIN_DATA[domainId]

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');" }} />
      <AbarvaNav activePage="select" />

      {/* Domain Selector — dark header */}
      <div style={{ background: '#111827', padding: '28px 32px' }}>
        <div style={{ maxWidth: '1480px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Domain AI Strategy</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#F9FAFB', marginBottom: '4px' }}>Meridian Health System</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>Select a domain to generate a focused AI strategy with use cases, architecture, and roadmap</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
            {DOMAINS.map(d => (
              <button
                key={d.id}
                onClick={() => setDomainId(d.id)}
                style={{
                  padding: '14px 12px', borderRadius: '10px', textAlign: 'center' as const, cursor: 'pointer', border: 'none',
                  background: domainId === d.id ? d.color : '#1F2937',
                  outline: domainId === d.id ? `2px solid ${d.color}` : 'none',
                  outlineOffset: '2px', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{d.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: domainId === d.id ? '#FFFFFF' : '#9CA3AF', lineHeight: 1.3, marginBottom: '4px' }}>{d.label}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: domainId === d.id ? 'rgba(255,255,255,0.85)' : d.color }}>{d.value}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Domain Content */}
      <div style={{ maxWidth: '1480px', margin: '0 auto', padding: '32px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
          <span style={{ color: '#D1D5DB' }}>›</span>
          <a href={'/ai-strategy?client=' + activeClient} style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>AI Strategy</a>
          <span style={{ color: '#D1D5DB' }}>›</span>
          <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Domain Strategy</span>
          <span style={{ color: '#D1D5DB' }}>›</span>
          <span style={{ fontSize: '13px', color: domain.color, fontWeight: 600 }}>{domain.label}</span>
        </div>

        {/* Section 1 — Domain Snapshot */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Domain Snapshot</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {data.metrics.map((m, i) => {
              const sc: Record<string, string> = { red: '#DC2626', yellow: '#D97706', green: '#059669' }
              return (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', borderTop: '3px solid ' + sc[m.status] }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>{m.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{m.value}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>{m.sub}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 2 — AI Opportunity Map */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>AI Opportunity Map</div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Use Case', 'Annual Value', 'Data Readiness', 'Timeline', 'Approach'].map((h, i) => (
                    <th key={i} style={{ padding: '11px 16px', textAlign: i === 0 ? 'left' as const : 'center' as const, fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.useCases.map((uc, i) => {
                  const r = READINESS_COLOR[uc.readiness]
                  return (
                    <tr key={i} style={{ borderBottom: i < data.useCases.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{uc.name}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' as const, fontSize: '13px', fontWeight: 700, color: '#059669' }}>{uc.value}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' as const }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: r.bg, color: r.color }}>{uc.readiness}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' as const, fontSize: '12px', color: '#374151' }}>{uc.timeline}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' as const, fontSize: '12px', color: '#374151' }}>{uc.approach}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3 — Target State Architecture */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Target State Architecture</div>
          <div style={{ background: '#0D1117', borderRadius: '12px', padding: '24px 28px', border: '1px solid #21262D' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2DD4C8' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontFamily: "'IBM Plex Mono', monospace" }}>{domain.label} Architecture — Meridian</span>
            </div>
            {data.arch.map((line, i) => (
              <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: i === 0 ? '#E6EDF3' : '#8B949E', lineHeight: 1.8, whiteSpace: 'pre' as const }}>{line}</div>
            ))}
          </div>
        </div>

        {/* Section 4 — Domain Roadmap */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Domain Roadmap</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {data.phases.map((phase, i) => {
              const phaseColors = ['#2563EB', '#7C3AED', '#059669']
              const c = phaseColors[i]
              return (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', borderTop: `3px solid ${c}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: c, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '2px' }}>{phase.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{phase.duration}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: c }}>{phase.budget}</div>
                  </div>
                  <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '12px' }} />
                  {phase.items.map((item, ii) => (
                    <div key={ii} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c, flexShrink: 0, marginTop: '5px' }} />
                      <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 5 — Investment Summary */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Investment Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Total Investment', value: data.totalInvest, sub: 'Over 18 months', color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Annual Value at Steady State', value: data.totalValue, sub: 'After full deployment', color: '#059669', bg: '#ECFDF5' },
              { label: 'Estimated Payback', value: data.payback, sub: 'After full deployment', color: '#D97706', bg: '#FFFBEB' },
            ].map((card, i) => (
              <div key={i} style={{ background: card.bg, borderRadius: '12px', padding: '20px 24px', border: `1px solid ${card.color}30` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: card.color, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' }}>{card.label}</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '4px' }}>{card.value}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{card.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid #F1F5F9' }}>
          <a href={'/ai-strategy?client=' + activeClient} style={{ padding: '10px 20px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>← AI Strategy</a>
          <a href={'/blueprint?client=' + activeClient} style={{ padding: '10px 20px', borderRadius: '8px', background: '#0F172A', fontSize: '13px', fontWeight: 600, color: '#F8FAFC', textDecoration: 'none' }}>View Solution Blueprint →</a>
          <a href={'/select?client=' + activeClient} style={{ padding: '10px 20px', borderRadius: '8px', background: domain.color, fontSize: '13px', fontWeight: 600, color: '#FFFFFF', textDecoration: 'none', marginLeft: 'auto' }}>Decision Intelligence →</a>
        </div>

      </div>
    </div>
  )
}

export default function DomainStrategyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading...</div>}>
      <DomainStrategyContent />
    </Suspense>
  )
}
