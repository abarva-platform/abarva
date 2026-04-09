'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const BLUEPRINTS: Record<string, any> = {
  meridian: {
    client: 'Meridian Health System',
    industry: 'Healthcare IDN · 23 Hospitals · $11.2B Revenue',
    initiative: 'Prior Authorization AI Automation',
    domain: 'Middle Office · Revenue Cycle Management',
    preparedBy: 'Abarva Intelligence Platform',
    date: 'April 2026',
    color: '#1B4FD8',
    executiveSummary: {
      headline: 'Meridian is leaving $28M annually on the table due to manual prior authorization — and faces $1M/day in CMS penalties starting January 2026.',
      bullets: [
        'Current state: 23% of payers connected to electronic prior auth. 77% processed manually by 14 FTE.',
        'The CMS Interoperability and Prior Authorization Final Rule requires 100% electronic connection by January 1, 2026. Meridian is 8 months from a compliance crisis.',
        'The solution: AI-powered prior auth automation connected to Epic — already deployed at Advocate Aurora, Baylor Scott & White, and 18 other health systems.',
        'Investment: $4.2M over 9 months. Annual value: $28M. Payback: 1.8 months after go-live.',
        'Critical dependency: This initiative requires Ensemble cooperation OR becomes the exit strategy from Ensemble.',
      ],
      decision: 'The board needs to make one decision this week: enforce the $8M in Ensemble penalties as leverage, or begin parallel RCM vendor evaluation. Abarva recommends both simultaneously.',
    },
    problemStatement: {
      current: [
        { metric: 'Payers on electronic prior auth', current: '23%', target: '100%', gap: '77% manual', dollarImpact: '$28M annually' },
        { metric: 'Prior auth FTE', current: '14 FTE', target: '3 FTE', gap: '11 FTE excess', dollarImpact: '$2.1M annually' },
        { metric: 'Average auth turnaround', current: '4.2 days', target: '< 4 hours', gap: '3.8 days', dollarImpact: 'Patient satisfaction, discharge delays' },
        { metric: 'Denial rate from auth failures', current: '18.2%', target: '< 12%', gap: '6.2 points', dollarImpact: '$37.6M annual write-off' },
        { metric: 'CMS compliance', current: '23%', target: '100% by Jan 2026', gap: '8 months', dollarImpact: '$1M/day penalty exposure' },
      ],
      rootCause: 'Ensemble Health Partners, contracted at $48M/year to manage RCM, has connected only 23% of payers to electronic prior auth despite contractual requirements. The $8M in accumulated SLA penalties have never been enforced. Ensemble has no financial incentive to accelerate because the manual process requires more Ensemble staff — and their contract is structured on FTE count, not outcomes.',
      cmsDeadline: 'The CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F) requires all applicable payers and providers to implement electronic prior authorization by January 1, 2026. Non-compliance penalties: up to $1,000 per day per API specification not met. At 77% non-compliance, Meridians exposure is $7-28M annually depending on enforcement intensity.',
    },
    solutionDesign: {
      approach: 'Deploy an AI-powered prior auth automation layer that connects directly to Epics existing prior auth workflow, integrates with all 847 payer portals via the vendors pre-built connections, and uses NLP to auto-complete authorization requests from clinical documentation.',
      architecture: [
        { layer: 'AI Layer', component: 'NLP Engine', description: 'Reads Epic clinical notes and auto-populates prior auth fields. Classifies authorization likelihood before submission.', technology: 'Claude API (Anthropic) — selected for medical document comprehension' },
        { layer: 'Integration Layer', component: 'Epic FHIR API', description: 'Pulls clinical data, pushes auth status back to Epic workflow. Eliminates dual data entry.', technology: 'Epic FHIR R4 — native integration, no custom build' },
        { layer: 'Payer Layer', component: 'Payer Network', description: '847 payer connections pre-built by vendor. Covers 100% of Meridians payer mix.', technology: 'Vendor-managed — Cohere Health or Waystar' },
        { layer: 'Analytics Layer', component: 'Denial Prediction', description: 'ML model scores each auth request before submission. Flags high-risk requests for human review.', technology: 'Azure ML — Meridians existing platform' },
        { layer: 'Governance Layer', component: 'Audit Trail', description: 'Every AI decision logged. Explainable output for compliance. HIPAA-compliant PHI handling.', technology: 'Azure Monitor + existing BAA' },
      ],
      dataRequirements: [
        { data: 'Epic prior auth history', status: 'Available', completeness: '94%', note: '3 years of historical auths — sufficient for model training' },
        { data: 'Payer coverage policies', status: 'Available via vendor', completeness: '100%', note: 'Vendor maintains real-time payer policy database' },
        { data: 'Clinical documentation (notes)', status: 'Available', completeness: '87%', note: 'Blue Ridge Cerner data not yet migrated — affects 2 hospitals' },
        { data: 'Denial reason codes', status: 'Available', completeness: '91%', note: 'Ensemble data — will require cooperation or exit to access' },
        { data: 'Real-time payer portal access', status: 'Vendor-provided', completeness: '100%', note: 'Core value of vendor solution' },
      ],
    },
    vendorDecision: {
      headline: 'Abarva recommends Cohere Health over Waystar and Olive for Meridians specific context.',
      recommendation: 'Cohere Health',
      reasoning: [
        'Epic integration: Cohere has 23 live Epic integrations. Their implementation team has completed the exact Meridian version (2023) at Advocate Aurora. Implementation is 6 weeks not the 16 weeks Waystar requires.',
        'Payer network: Cohere covers 847 payers — Meridians complete payer mix including the 6 TennCare plans that are the highest denial risk.',
        'AI approach: Coheres NLP model was trained on 180M prior auth requests. Denial prediction accuracy is 91% vs 78% for Waystar.',
        'Pricing: Cohere list price is $2.8-3.8M. Abarva intelligence shows Baylor Scott & White paid $2.1M for same scope in Q4 2024. Target: $2.0-2.4M.',
        'Ensemble leverage: Cohere actively competes against Ensemble and will price aggressively to displace them.',
      ],
      vendorComparison: [
        { vendor: 'Cohere Health', klas: '4.4/5', cost: '$2.0-2.4M', timeline: '6-8 months', epicFit: 'Native', aiCapability: 'Best in class', recommendation: true },
        { vendor: 'Waystar AI', klas: '4.1/5', cost: '$3.0-4.2M', timeline: '9-12 months', epicFit: 'API integration', aiCapability: 'Strong', recommendation: false },
        { vendor: 'Olive AI', klas: '3.8/5', cost: '$4.2-6.0M', timeline: '12-18 months', epicFit: 'Custom build', aiCapability: 'Broad but shallow', recommendation: false },
      ],
      negotiationPlaybook: [
        'Open with: "We are also evaluating Waystar and building internally on Azure ML. We have budget for one vendor." This creates urgency.',
        'Mention the Ensemble situation: "We are managing a $48M RCM relationship that has underperformed. We need outcome-based contracts where fees are tied to denial rate improvement."',
        'Request: Cohere bears implementation risk — fixed fee, not time and materials. Penalty clause if denial rate does not reach 14% within 6 months of go-live.',
        'Pricing anchor: "Advocate Aurora paid $2.1M for comparable scope. We need to be in that range." Do not reveal this was Q4 2024 pricing.',
        'Walk away condition: If Cohere will not accept outcome-based pricing, they do not believe in their own product.',
      ],
    },
    resourceModel: {
      headline: 'This initiative requires 1 Maestro, 1 Cohere PS team, and 0.5 FTE internal. No SI required.',
      phases: [
        {
          phase: 'Phase 1', name: 'Foundation and Contracting', duration: 'Months 1-2', cost: '$800K',
          resources: [
            { role: 'Abarva Maestro', type: 'Abarva', allocation: '40%', cost: 'Included in platform fee', responsibility: 'Vendor negotiation, contract review, stakeholder alignment' },
            { role: 'Epic Integration Lead', type: 'Internal', allocation: '50%', cost: '$0 incremental', responsibility: 'Epic FHIR API configuration, workflow design' },
            { role: 'Cohere Implementation Lead', type: 'Vendor', allocation: '100%', cost: 'Included in vendor fee', responsibility: 'Payer network configuration, system setup' },
            { role: 'Legal / Contracting', type: 'Internal', allocation: '20%', cost: '$0 incremental', responsibility: 'BAA, SLA terms, penalty clauses' },
          ],
        },
        {
          phase: 'Phase 2', name: 'Build and Test', duration: 'Months 3-6', cost: '$2.4M',
          resources: [
            { role: 'Cohere PS Team (3)', type: 'Vendor', allocation: '100%', cost: 'Included in vendor fee', responsibility: 'Payer integrations, NLP configuration, Epic build' },
            { role: 'Azure ML Engineer', type: 'SI (Avanade)', allocation: '100%', cost: '$180K (3 months)', responsibility: 'Denial prediction model on Azure ML' },
            { role: 'Epic Analyst', type: 'Internal', allocation: '75%', cost: '$0 incremental', responsibility: 'Workflow configuration, UAT' },
            { role: 'Abarva Maestro', type: 'Abarva', allocation: '20%', cost: 'Included', responsibility: 'Milestone governance, issue escalation' },
          ],
        },
        {
          phase: 'Phase 3', name: 'Deploy and Scale', duration: 'Months 7-9', cost: '$1.0M',
          resources: [
            { role: 'Cohere PS Team (2)', type: 'Vendor', allocation: '100%', cost: 'Included in vendor fee', responsibility: 'Go-live support, payer issue resolution' },
            { role: 'Prior Auth Coordinator (retrain)', type: 'Internal', allocation: '100%', cost: '$0 incremental', responsibility: 'Exception handling, payer escalations' },
            { role: 'Abarva Maestro', type: 'Abarva', allocation: '10%', cost: 'Included', responsibility: 'Outcome measurement, fee calculation' },
          ],
        },
      ],
      agentVsHuman: [
        { task: 'Standard prior auth submission (routine)', recommended: 'Agent (Cohere AI)', cost: '$0.08/auth', volume: '~12,000/month', note: 'Fully automated — no human touch' },
        { task: 'Complex clinical justification (high-risk)', recommended: 'AI-assisted human', cost: '$12/auth', volume: '~800/month', note: 'AI drafts, coordinator reviews' },
        { task: 'Payer portal escalation (denied)', recommended: 'Human (retrained FTE)', cost: '$45/auth', volume: '~400/month', note: 'Human judgment required' },
        { task: 'Model monitoring and drift detection', recommended: 'Agent (Azure ML)', cost: '$400/month', volume: 'Continuous', note: 'Alert if accuracy drops below 88%' },
      ],
    },
    businessCase: {
      investment: [
        { phase: 'Phase 1 (months 1-2)', amount: 800000, type: 'Setup and contracting' },
        { phase: 'Phase 2 (months 3-6)', amount: 2400000, type: 'Build and integration' },
        { phase: 'Phase 3 (months 7-9)', amount: 1000000, type: 'Deploy and stabilize' },
      ],
      totalInvestment: 4200000,
      valueCapture: [
        { source: 'Denial rate improvement (18.2% → 12%)', year1: 14800000, steady: 28000000 },
        { source: 'Prior auth FTE reduction (14 → 3 FTE)', year1: 1600000, steady: 2100000 },
        { source: 'CMS penalty avoidance', year1: 0, steady: 7000000 },
        { source: 'Turnaround time improvement (discharge delays)', year1: 800000, steady: 2400000 },
      ],
      totalYear1Value: 17200000,
      totalSteadyValue: 39500000,
      paybackMonths: 5.4,
      roi: 9.4,
      abarvaFee: {
        platform: 500000,
        outcomeFee: 4200000,
        total: 4700000,
        note: '15% of Year 1 realized savings — paid quarterly as savings are verified',
      },
    },
    governance: {
      kpis: [
        { metric: 'Prior auth electronic connection rate', baseline: '23%', target: '100%', frequency: 'Monthly', owner: 'CIO' },
        { metric: 'Denial rate', baseline: '18.2%', target: '< 12%', frequency: 'Monthly', owner: 'CFO / RCM Director' },
        { metric: 'Auth turnaround time', baseline: '4.2 days', target: '< 4 hours', frequency: 'Weekly', owner: 'COO' },
        { metric: 'AI model accuracy', baseline: 'N/A', target: '> 88%', frequency: 'Continuous', owner: 'CDO (hire first)' },
        { metric: 'CMS compliance status', baseline: '23%', target: '100% by Jan 2026', frequency: 'Monthly', owner: 'CIO / Legal' },
      ],
      risks: [
        { risk: 'Ensemble non-cooperation on denial data', probability: 'High', impact: 'Medium', mitigation: 'Use Coheres payer network data as primary — Ensemble data is secondary. Simultaneously enforce $8M SLA penalties as leverage.' },
        { risk: 'Blue Ridge Cerner data unavailable', probability: 'Medium', impact: 'Low', mitigation: 'Phase 1 covers 21 Epic hospitals. Add 2 Blue Ridge hospitals in Phase 3 after Cerner migration completes.' },
        { risk: 'CDO vacancy delays governance', probability: 'High', impact: 'High', mitigation: 'Abarva Maestro covers CDO functions during implementation. CDO hire must start immediately — this is the critical path.' },
        { risk: 'Payer portal changes post go-live', probability: 'Low', impact: 'Medium', mitigation: 'Cohere maintains payer network — contractually responsible for keeping connections current.' },
      ],
      nextSteps: [
        { action: 'Enforce $8M Ensemble SLA penalties', owner: 'CFO + Legal', deadline: 'This week', rationale: 'Creates leverage for Ensemble cooperation AND funds Phase 1' },
        { action: 'Issue RFP to Cohere Health and Waystar', owner: 'CIO', deadline: 'This week', rationale: 'Parallel track — 6-week vendor selection process' },
        { action: 'Post CDO job description', owner: 'CHRO', deadline: 'This week', rationale: 'CDO is critical path — 90-day hire timeline means start now' },
        { action: 'Brief CFO on business case', owner: 'CIO + Abarva', deadline: 'Next week', rationale: 'Robert Chen needs to approve $4.2M — business case is ready' },
        { action: 'Notify CMS of remediation plan', owner: 'CIO + Legal', deadline: 'This month', rationale: 'Proactive notification reduces penalty risk — shows good faith' },
      ],
    },
  },
}

function fmt(n: number) {
  if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K'
  return '$' + n.toLocaleString()
}

const SECTIONS = [
  { id: 'summary', label: 'Executive Summary' },
  { id: 'problem', label: 'Problem Statement' },
  { id: 'solution', label: 'Solution Design' },
  { id: 'vendor', label: 'Vendor Decision' },
  { id: 'resources', label: 'Resource Model' },
  { id: 'business', label: 'Business Case' },
  { id: 'governance', label: 'Governance' },
]

function BlueprintContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [section, setSection] = useState('summary')
  const bp = BLUEPRINTS[clientId] || BLUEPRINTS.meridian

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
    .tag { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    .h1 { font-size: 32px; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #111827; margin-bottom: 12px; }
    .h2 { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 12px; letter-spacing: -0.01em; }
    .h3 { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 8px; }
    .body { font-size: 14px; line-height: 1.75; color: #4B5563; }
    .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .section-nav { background: none; border: none; cursor: pointer; font-size: 13px; padding: 10px 16px; border-radius: 6px; width: 100%; text-align: left; font-family: inherit; transition: all 0.12s; color: #6B7280; }
    .section-nav.active { background: #F3F4F6; color: #111827; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; background: #F9FAFB; border-bottom: 2px solid #E5E7EB; }
    td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; color: #374151; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #FAFAFA; }
    .badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 8px; border-radius: 100px; }
    .risk-high { background: #FEF2F2; color: #DC2626; }
    .risk-med { background: #FFFBEB; color: #D97706; }
    .risk-low { background: #ECFDF5; color: #059669; }
  `

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif" }}>
      <style>{css}</style>

      {/* TOP NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', height: '56px', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', background: '#111827', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 800 }}>A</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Abarva</span>
          </a>
          <span style={{ color: '#D1D5DB', fontSize: '16px' }}>›</span>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>{bp.client}</span>
          <span style={{ color: '#D1D5DB', fontSize: '16px' }}>›</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Solution Blueprint</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '7px 16px', borderRadius: '8px', background: '#F3F4F6', color: '#374151', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Export PDF</button>
          <a href={`/justify?client=${clientId}`} style={{ padding: '7px 16px', borderRadius: '8px', background: bp.color, color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Build Business Case →</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* SIDEBAR */}
        <div style={{ padding: '32px 16px 32px 0', position: 'sticky' as const, top: '56px', height: 'calc(100vh - 56px)', overflowY: 'auto' as const }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Initiative</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>{bp.initiative}</div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Domain</div>
            <div style={{ fontSize: '13px', color: '#374151' }}>{bp.domain}</div>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Investment</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{fmt(bp.businessCase.totalInvestment)}</div>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '4px' }}>Annual Value</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>{fmt(bp.businessCase.totalSteadyValue)}</div>
          </div>
          <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '20px' }} />
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={'section-nav' + (section === s.id ? ' active' : '')}>
              {section === s.id && <span style={{ color: bp.color, marginRight: '6px' }}>›</span>}
              {s.label}
            </button>
          ))}
          <div style={{ height: '1px', background: '#E5E7EB', margin: '20px 0' }} />
          <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.6 }}>
            Prepared by {bp.preparedBy}<br />{bp.date}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ padding: '32px 0 64px 32px', borderLeft: '1px solid #E5E7EB' }}>

          {/* HEADER */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
              <span className="badge" style={{ background: bp.color + '15', color: bp.color }}>{bp.domain}</span>
              <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{bp.client}</span>
              <span className="badge" style={{ background: '#ECFDF5', color: '#059669' }}>Solution Blueprint</span>
            </div>
            <h1 className="h1">{bp.initiative}</h1>
            <p className="body" style={{ maxWidth: '680px' }}>{bp.executiveSummary.headline}</p>
          </div>

          {/* EXECUTIVE SUMMARY */}
          {section === 'summary' && (
            <div>
              <div className="card" style={{ borderLeft: '4px solid ' + bp.color }}>
                <h2 className="h2">Executive Summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '20px' }}>
                  {bp.executiveSummary.bullets.map((b: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: bp.color, fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>0{i+1}</span>
                      <span className="body">{b}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '16px 20px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FEF3C7' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#D97706', display: 'block', marginBottom: '6px' }}>Decision Required This Week</span>
                  <span className="body" style={{ fontWeight: 600, color: '#374151' }}>{bp.executiveSummary.decision}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                {[
                  { label: 'Total Investment', value: fmt(bp.businessCase.totalInvestment), color: bp.color },
                  { label: 'Annual Value', value: fmt(bp.businessCase.totalSteadyValue), color: '#059669' },
                  { label: 'ROI', value: bp.businessCase.roi + 'x', color: '#6D28D9' },
                  { label: 'Payback', value: bp.businessCase.paybackMonths + ' months', color: '#D97706' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                <h3 className="h3" style={{ color: '#059669', marginBottom: '12px' }}>Abarva Economics on This Initiative</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div><div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Platform fee</div><div style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{fmt(bp.businessCase.abarvaFee.platform)}</div></div>
                  <div><div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Outcome fee (15%)</div><div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{fmt(bp.businessCase.abarvaFee.outcomeFee)}</div></div>
                  <div><div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Total Year 1</div><div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{fmt(bp.businessCase.abarvaFee.total)}</div></div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>{bp.businessCase.abarvaFee.note}</div>
              </div>
            </div>
          )}

          {/* PROBLEM STATEMENT */}
          {section === 'problem' && (
            <div>
              <h2 className="h2">Problem Statement</h2>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Current State vs Target State</h3>
                <table>
                  <thead><tr><th>Metric</th><th>Current</th><th>Target</th><th>Gap</th><th>Dollar Impact</th></tr></thead>
                  <tbody>
                    {bp.problemStatement.current.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.metric}</td>
                        <td style={{ color: '#DC2626', fontWeight: 600 }}>{row.current}</td>
                        <td style={{ color: '#059669', fontWeight: 600 }}>{row.target}</td>
                        <td style={{ color: '#D97706' }}>{row.gap}</td>
                        <td style={{ fontWeight: 600 }}>{row.dollarImpact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '16px' }}>
                <h3 className="h3" style={{ color: '#DC2626' }}>Root Cause Analysis</h3>
                <p className="body">{bp.problemStatement.rootCause}</p>
              </div>
              <div className="card" style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                <h3 className="h3" style={{ color: '#D97706' }}>Regulatory Deadline — CMS Compliance</h3>
                <p className="body">{bp.problemStatement.cmsDeadline}</p>
              </div>
            </div>
          )}

          {/* SOLUTION DESIGN */}
          {section === 'solution' && (
            <div>
              <h2 className="h2">Solution Design</h2>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Approach</h3>
                <p className="body">{bp.solutionDesign.approach}</p>
              </div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Architecture Layers</h3>
                <table>
                  <thead><tr><th>Layer</th><th>Component</th><th>Description</th><th>Technology</th></tr></thead>
                  <tbody>
                    {bp.solutionDesign.architecture.map((row: any, i: number) => (
                      <tr key={i}>
                        <td><span className="badge" style={{ background: bp.color + '15', color: bp.color }}>{row.layer}</span></td>
                        <td style={{ fontWeight: 600 }}>{row.component}</td>
                        <td>{row.description}</td>
                        <td style={{ color: '#6B7280', fontSize: '12px' }}>{row.technology}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3 className="h3">Data Requirements</h3>
                <table>
                  <thead><tr><th>Data Source</th><th>Status</th><th>Completeness</th><th>Notes</th></tr></thead>
                  <tbody>
                    {bp.solutionDesign.dataRequirements.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.data}</td>
                        <td><span className="badge" style={{ background: row.status === 'Available' ? '#ECFDF5' : '#EFF6FF', color: row.status === 'Available' ? '#059669' : '#1B4FD8' }}>{row.status}</span></td>
                        <td style={{ fontWeight: 700, color: parseInt(row.completeness) > 80 ? '#059669' : '#D97706' }}>{row.completeness}</td>
                        <td style={{ color: '#6B7280', fontSize: '12px' }}>{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENDOR DECISION */}
          {section === 'vendor' && (
            <div>
              <h2 className="h2">Vendor Decision</h2>
              <div className="card" style={{ borderLeft: '4px solid ' + bp.color, marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: bp.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '4px' }}>Abarva Recommendation</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{bp.vendorDecision.recommendation}</div>
                  </div>
                  <span className="badge" style={{ background: '#ECFDF5', color: '#059669', fontSize: '12px', padding: '6px 14px' }}>RECOMMENDED</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  {bp.vendorDecision.reasoning.map((r: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: bp.color, fontWeight: 800, flexShrink: 0 }}>→</span>
                      <span className="body">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Vendor Comparison</h3>
                <table>
                  <thead><tr><th>Vendor</th><th>KLAS</th><th>Cost</th><th>Timeline</th><th>Epic Fit</th><th>AI Capability</th><th></th></tr></thead>
                  <tbody>
                    {bp.vendorDecision.vendorComparison.map((v: any, i: number) => (
                      <tr key={i} style={{ background: v.recommendation ? bp.color + '08' : undefined }}>
                        <td style={{ fontWeight: v.recommendation ? 800 : 600 }}>{v.vendor}</td>
                        <td style={{ fontWeight: 600, color: '#059669' }}>{v.klas}</td>
                        <td style={{ fontWeight: 600 }}>{v.cost}</td>
                        <td>{v.timeline}</td>
                        <td>{v.epicFit}</td>
                        <td>{v.aiCapability}</td>
                        <td>{v.recommendation && <span className="badge" style={{ background: bp.color, color: '#fff' }}>Pick</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ background: '#1B4FD808', border: '1px solid ' + bp.color + '30' }}>
                <h3 className="h3">Negotiation Playbook — Specific to {bp.client}</h3>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                  {bp.vendorDecision.negotiationPlaybook.map((tip: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#D97706', fontWeight: 800, flexShrink: 0 }}>⚡</span>
                      <span className="body">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RESOURCE MODEL */}
          {section === 'resources' && (
            <div>
              <h2 className="h2">Resource Model</h2>
              <div className="card" style={{ marginBottom: '16px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <p className="body" style={{ fontWeight: 600, color: '#374151' }}>{bp.resourceModel.headline}</p>
              </div>
              {bp.resourceModel.phases.map((phase: any, pi: number) => (
                <div key={pi} className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <span className="badge" style={{ background: bp.color, color: '#fff', marginRight: '8px' }}>{phase.phase}</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{phase.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{fmt(phase.cost)}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{phase.duration}</div>
                    </div>
                  </div>
                  <table>
                    <thead><tr><th>Role</th><th>Type</th><th>Allocation</th><th>Cost</th><th>Responsibility</th></tr></thead>
                    <tbody>
                      {phase.resources.map((r: any, ri: number) => (
                        <tr key={ri}>
                          <td style={{ fontWeight: 600 }}>{r.role}</td>
                          <td><span className="badge" style={{ background: r.type === 'Abarva' ? '#EFF6FF' : r.type === 'Vendor' ? '#F5F3FF' : r.type === 'Internal' ? '#ECFDF5' : '#FEF2F2', color: r.type === 'Abarva' ? '#1B4FD8' : r.type === 'Vendor' ? '#6D28D9' : r.type === 'Internal' ? '#059669' : '#DC2626' }}>{r.type}</span></td>
                          <td>{r.allocation}</td>
                          <td style={{ fontWeight: 600, color: r.cost === 'Included in platform fee' || r.cost === 'Included' || r.cost === '$0 incremental' ? '#059669' : '#111827' }}>{r.cost}</td>
                          <td style={{ color: '#6B7280', fontSize: '12px' }}>{r.responsibility}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="card">
                <h3 className="h3">Agent vs Human Decision Matrix</h3>
                <table>
                  <thead><tr><th>Task</th><th>Recommended</th><th>Cost per Unit</th><th>Volume</th><th>Note</th></tr></thead>
                  <tbody>
                    {bp.resourceModel.agentVsHuman.map((row: any, i: number) => (
                      <tr key={i}>
                        <td>{row.task}</td>
                        <td style={{ fontWeight: 600, color: row.recommended.includes('Agent') ? '#1B4FD8' : '#374151' }}>{row.recommended}</td>
                        <td>{row.cost}</td>
                        <td>{row.volume}</td>
                        <td style={{ color: '#6B7280', fontSize: '12px' }}>{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BUSINESS CASE */}
          {section === 'business' && (
            <div>
              <h2 className="h2">Business Case</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                {[
                  { label: 'Total Investment', value: fmt(bp.businessCase.totalInvestment), color: bp.color },
                  { label: 'Year 1 Value', value: fmt(bp.businessCase.totalYear1Value), color: '#059669' },
                  { label: 'Steady State Value', value: fmt(bp.businessCase.totalSteadyValue), color: '#059669' },
                  { label: 'Payback Period', value: bp.businessCase.paybackMonths + ' months', color: '#D97706' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Investment Schedule</h3>
                <table>
                  <thead><tr><th>Phase</th><th>Investment</th><th>Type</th></tr></thead>
                  <tbody>
                    {bp.businessCase.investment.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.phase}</td>
                        <td style={{ fontWeight: 700, color: '#111827' }}>{fmt(row.amount)}</td>
                        <td style={{ color: '#6B7280' }}>{row.type}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#F9FAFB' }}>
                      <td style={{ fontWeight: 800 }}>Total</td>
                      <td style={{ fontWeight: 800, color: bp.color, fontSize: '16px' }}>{fmt(bp.businessCase.totalInvestment)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3 className="h3">Value Capture by Source</h3>
                <table>
                  <thead><tr><th>Value Source</th><th>Year 1</th><th>Steady State (Annual)</th></tr></thead>
                  <tbody>
                    {bp.businessCase.valueCapture.map((row: any, i: number) => (
                      <tr key={i}>
                        <td>{row.source}</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>{fmt(row.year1)}</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>{fmt(row.steady)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#F0FDF4' }}>
                      <td style={{ fontWeight: 800 }}>Total</td>
                      <td style={{ fontWeight: 800, color: '#059669', fontSize: '16px' }}>{fmt(bp.businessCase.totalYear1Value)}</td>
                      <td style={{ fontWeight: 800, color: '#059669', fontSize: '16px' }}>{fmt(bp.businessCase.totalSteadyValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GOVERNANCE */}
          {section === 'governance' && (
            <div>
              <h2 className="h2">Governance and Next Steps</h2>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Success KPIs</h3>
                <table>
                  <thead><tr><th>Metric</th><th>Baseline</th><th>Target</th><th>Frequency</th><th>Owner</th></tr></thead>
                  <tbody>
                    {bp.governance.kpis.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.metric}</td>
                        <td style={{ color: '#DC2626', fontWeight: 600 }}>{row.baseline}</td>
                        <td style={{ color: '#059669', fontWeight: 600 }}>{row.target}</td>
                        <td>{row.frequency}</td>
                        <td style={{ color: '#6B7280' }}>{row.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 className="h3">Risk Register</h3>
                <table>
                  <thead><tr><th>Risk</th><th>Probability</th><th>Impact</th><th>Mitigation</th></tr></thead>
                  <tbody>
                    {bp.governance.risks.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.risk}</td>
                        <td><span className={'badge risk-' + (row.probability === 'High' ? 'high' : row.probability === 'Medium' ? 'med' : 'low')}>{row.probability}</span></td>
                        <td><span className={'badge risk-' + (row.impact === 'High' ? 'high' : row.impact === 'Medium' ? 'med' : 'low')}>{row.impact}</span></td>
                        <td style={{ color: '#6B7280', fontSize: '12px' }}>{row.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ background: '#111827' }}>
                <h3 className="h3" style={{ color: '#fff', marginBottom: '16px' }}>Actions Required This Week</h3>
                {bp.governance.nextSteps.map((step: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: i < bp.governance.nextSteps.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', alignItems: 'flex-start' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6EE7B7', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{step.action}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{step.owner} · {step.deadline}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', fontStyle: 'italic' }}>{step.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function BlueprintPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#6B7280' }}>Loading blueprint...</div>}>
      <BlueprintContent />
    </Suspense>
  )
}
