'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const S = {
  page: { minHeight: '100vh', background: '#0D1117', fontFamily: "'IBM Plex Sans', Inter, sans-serif", color: '#E6EDF3' } as React.CSSProperties,
  mono: { fontFamily: "'IBM Plex Mono', monospace" } as React.CSSProperties,
  card: { background: '#161B22', border: '1px solid #21262D', borderRadius: '10px', padding: '20px' } as React.CSSProperties,
}

const CLIENT_META: Record<string, { name: string; cloud: string; accent: string; cloudBg: string; firstAgent: string; firstAgentVendor: string; firstAgentValue: string }> = {
  meridian: {
    name: 'Meridian Health System', cloud: 'Azure', accent: '#4DA3FF', cloudBg: '#1B4FD8',
    firstAgent: 'Prior authorization automation',
    firstAgentVendor: 'Cohere Health + Claude on Azure AI Foundry',
    firstAgentValue: '$28M recovered · CMS compliant Jan 2026',
  },
  firstcapital: {
    name: 'First Capital Financial', cloud: 'AWS', accent: '#FF9900', cloudBg: '#E8650A',
    firstAgent: 'FedNow payment routing',
    firstAgentVendor: 'Finzly + Claude on AWS Bedrock',
    firstAgentValue: '$340M commercial deposit risk resolved',
  },
  apexretail: {
    name: 'Apex Retail Group', cloud: 'GCP', accent: '#34A853', cloudBg: '#1D9E75',
    firstAgent: 'Salesforce Einstein activation',
    firstAgentVendor: 'Salesforce PS + Claude on Vertex AI',
    firstAgentValue: '$248M revenue opportunity · 6 weeks to first revenue',
  },
}

const TASKS_BY_CLIENT: Record<string, Array<{ task: string; recommended: string; why: string; cost: string; volume: string; checkpoint: string }>> = {
  meridian: [
    { task: 'Standard prior auth (policy match)', recommended: 'Agent', why: 'Deterministic — payer policy exists, auto-match', cost: '$0.02', volume: '~9,600/month', checkpoint: 'Sample audit weekly' },
    { task: 'Complex prior auth (clinical judgment)', recommended: 'Agent + Human', why: 'Clinical nuance — agent drafts, clinician approves', cost: '$0.08 + 5min FTE', volume: '~2,400/month', checkpoint: 'Every decision' },
    { task: 'Denial appeal drafting', recommended: 'Agent', why: 'Structured templates + payer policy library via RAG', cost: '$0.12', volume: '~800/month', checkpoint: 'Random 20% review' },
    { task: 'Epic IT ticket routing', recommended: 'Agent', why: 'Pattern matching — 80%+ are known issue types', cost: '$0.01', volume: '~18,000/month', checkpoint: 'Exception escalation only' },
    { task: 'Nurse scheduling optimization', recommended: 'Workday AI', why: 'Workday owns this workflow — no custom agent needed', cost: 'Included in Workday', volume: '42,000 employees', checkpoint: 'Manager approval' },
    { task: 'Sepsis early warning alert', recommended: 'Agent + Clinician', why: 'Life-critical — agent alerts, physician always decides', cost: '$0.04', volume: '~240 alerts/month', checkpoint: 'Every alert · physician required' },
    { task: 'Quality measure reporting', recommended: 'Agent', why: 'Structured data extraction — no judgment needed', cost: '$0.06', volume: 'Monthly by measure', checkpoint: 'CMIO quarterly review' },
  ],
  firstcapital: [
    { task: 'AML alert triage (low risk)', recommended: 'Agent', why: 'Pattern below threshold — auto-clear with audit trail', cost: '$0.03', volume: '~12,000 alerts/month', checkpoint: 'BSA officer monthly review' },
    { task: 'AML investigation (above threshold)', recommended: 'Agent + Human', why: 'BSA requirement — agent compiles evidence, analyst decides', cost: '$0.15 + 30min FTE', volume: '~400/month', checkpoint: 'Every decision · BSA log' },
    { task: 'FedNow payment routing', recommended: 'Agent', why: 'Rule-based ISO 20022 — deterministic routing logic', cost: '$0.005', volume: '~50,000 tx/month', checkpoint: 'Exception flagging only' },
    { task: 'Fraud alert investigation', recommended: 'Agent + Human', why: 'Pattern detection is agent · customer decision is human', cost: '$0.08 + 15min FTE', volume: '~800/month', checkpoint: 'Every $5K+ decision' },
    { task: 'Account opening workflow', recommended: 'Agent', why: 'KYC data collection and validation — structured process', cost: '$0.04', volume: '~2,000/month', checkpoint: 'Compliance sampling 10%' },
    { task: 'IT support tickets (L1/L2)', recommended: 'ServiceNow Now Assist', why: 'ServiceNow owns this — no custom agent needed', cost: 'Included in ServiceNow', volume: '50,400/month', checkpoint: 'Escalation tracking' },
    { task: 'Credit decision support', recommended: 'Agent + Human', why: 'Regulatory — ECOA requires explainable human decision', cost: '$0.20 + 45min FTE', volume: '~300/month', checkpoint: 'Every decision · fair lending audit' },
  ],
  apexretail: [
    { task: 'Product recommendation (logged in)', recommended: 'Einstein + Agent', why: 'Einstein already paid for — activate it · $248M opportunity', cost: '$0.01 via Einstein', volume: '~2M sessions/month', checkpoint: 'A/B test continuous' },
    { task: 'Cart abandonment recovery', recommended: 'Agent', why: 'Dynamic email + push based on cart contents + timing', cost: '$0.02', volume: '~500K/month', checkpoint: 'Conversion rate weekly' },
    { task: 'Inventory replenishment alert', recommended: 'Agent', why: 'Rule-based threshold — connect o9 to Snowflake', cost: '$0.005', volume: '~800 SKUs/day/store', checkpoint: 'Category manager daily' },
    { task: 'Loyalty offer personalization', recommended: 'Einstein + Agent', why: 'Fix Segment CDP first — 50% fragmentation makes this wrong without fix', cost: '$0.03', volume: '18M members', checkpoint: 'Redemption rate weekly' },
    { task: 'Store associate scheduling', recommended: 'Workday AI', why: 'Workday owns this — no custom agent needed', cost: 'Included in Workday', volume: '28,000 employees', checkpoint: 'Manager approval' },
    { task: 'Demand signal processing', recommended: 'Agent + o9', why: 'o9 is 40% implemented — complete it before adding agents', cost: '$0.08 via o9 + agent', volume: 'Daily by SKU/store', checkpoint: 'Merchant review weekly' },
    { task: 'Loss prevention alert (store)', recommended: 'Agent + Human', why: 'Computer vision flags, LP associate always decides — no AI-only action', cost: '$0.10 + review', volume: '~3,200 alerts/month', checkpoint: 'Every alert · LP associate' },
  ],
}

function HowToBuildContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [selectedClient, setSelectedClient] = useState(clientId)
  const meta = CLIENT_META[selectedClient] || CLIENT_META.meridian
  const tasks = TASKS_BY_CLIENT[selectedClient] || TASKS_BY_CLIENT.meridian

  return (
    <div style={S.page}>
      {/* Nav */}
      <div style={{ background: '#161B22', borderBottom: '1px solid #21262D', height: '48px', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="4" fill="#2DD4C8" />
              <circle cx="5" cy="5" r="2.5" fill="#1B4FD8" /><circle cx="27" cy="5" r="2.5" fill="#1B4FD8" />
              <circle cx="5" cy="27" r="2.5" fill="#1B4FD8" /><circle cx="27" cy="27" r="2.5" fill="#1B4FD8" />
              <line x1="16" y1="16" x2="5" y2="5" stroke="#2DD4C8" strokeWidth="0.5" />
              <line x1="16" y1="16" x2="27" y2="5" stroke="#2DD4C8" strokeWidth="0.5" />
              <line x1="16" y1="16" x2="5" y2="27" stroke="#2DD4C8" strokeWidth="0.5" />
              <line x1="16" y1="16" x2="27" y2="27" stroke="#2DD4C8" strokeWidth="0.5" />
            </svg>
            <span style={{ ...S.mono, fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>Abar<span style={{ color: '#2DD4C8' }}>VA</span></span>
          </a>
          <span style={{ color: '#30363D' }}>›</span>
          <span style={{ ...S.mono, fontSize: '11px', color: '#8B949E' }}>How to Build This</span>
          <span style={{ ...S.mono, fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: meta.cloudBg + '22', color: meta.accent, border: '1px solid ' + meta.cloudBg + '55' }}>{meta.cloud}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <a href={'/architecture?client=' + selectedClient} style={{ ...S.mono, fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(77,163,255,0.1)', color: '#4DA3FF', textDecoration: 'none', border: '1px solid rgba(77,163,255,0.3)' }}>← Architecture</a>
          <a href={'/ai-strategy?client=' + selectedClient} style={{ ...S.mono, fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(110,231,183,0.1)', color: '#6EE7B7', textDecoration: 'none', border: '1px solid rgba(110,231,183,0.3)' }}>AI Strategy →</a>
          <a href="/" style={{ ...S.mono, fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', color: '#6B7280', textDecoration: 'none', border: '1px solid #21262D' }}>← Platform</a>
        </div>
      </div>

      {/* Client selector */}
      <div style={{ background: '#161B22', borderBottom: '1px solid #21262D', padding: '0 32px', display: 'flex', gap: '4px' }}>
        {Object.entries(CLIENT_META).map(([id, m]) => (
          <button key={id} onClick={() => setSelectedClient(id)}
            style={{ padding: '10px 20px', ...S.mono, fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderBottom: selectedClient === id ? '2px solid ' + m.accent : '2px solid transparent', background: 'transparent', color: selectedClient === id ? m.accent : '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: selectedClient === id ? m.cloudBg + 'aa' : '#21262D', color: selectedClient === id ? 'white' : '#6B7280' }}>{m.cloud}</span>
            {m.name.split(' ')[0]} {m.name.split(' ')[1]}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ ...S.mono, fontSize: '11px', color: meta.accent, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Build Plan · {meta.name}</div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#E6EDF3', marginBottom: '8px' }}>How to Build This</h1>
          <p style={{ fontSize: '14px', color: '#8B949E', lineHeight: 1.6 }}>A phased, incremental approach using a lean team of Maestros and agents.<br />No large SI engagement required. First value in 90 days.</p>
        </div>

        {/* Phase cards — horizontal timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            {
              num: '0', title: 'Foundation', months: 'Month 0–3',
              invest: '$2–4M', accentColor: '#6B7280',
              subtitle: 'Do not build agents yet. Build the governed data foundation.',
              team: ['1 Databricks/Snowflake PS (vendor-funded)', '1 Data Engineer', '1 Abarva Maestro'],
              builds: ['Lakehouse setup · Unity Catalog governance', '3 priority data sources connected', 'RAG knowledge base seeded', 'Security and compliance baseline'],
              warning: 'No agents yet — agents without governed data are dangerous.',
              output: 'Governed data platform ready for agents',
            },
            {
              num: '1', title: 'First Agent', months: 'Month 3–6',
              invest: '$3–6M', accentColor: meta.accent,
              subtitle: 'One agent. One workflow. Prove the pattern.',
              team: [selectedClient === 'meridian' ? 'Bedrock/Vertex or Azure AI engineer' : 'Bedrock/Vertex AI engineer', '1 domain expert (internal)', '1 Abarva Maestro', 'Human-in-loop always'],
              builds: [meta.firstAgent + ' (the highest-ROI workflow)', meta.firstAgentVendor, 'Audit trail + human override controls', 'Outcome measurement baseline'],
              warning: meta.firstAgentValue,
              output: '1 agent in production · audited · measurable · human oversight',
            },
            {
              num: '2', title: 'Agent Network', months: 'Month 6–12',
              invest: '$8–15M', accentColor: '#7C3AED',
              subtitle: 'Add agents systematically. Claude orchestrates them all.',
              team: ['3–4 engineers · domain experts per agent', '1 Abarva Maestro for governance', 'Platform agents (Workday · ServiceNow · Salesforce)', 'No large SI'],
              builds: ['Claude becomes meta-orchestrator across all agents', 'ServiceNow as workflow control plane', '5–8 agents in production', 'Failure Genome monitoring on all agents'],
              warning: 'Claude routes: routine → platform agents · complex → direct reasoning',
              output: 'Orchestrated agent network · governed · auditable',
            },
            {
              num: '3', title: 'Scale and Compound', months: 'Month 12–24',
              invest: 'Maintenance + Abarva outcome fee', accentColor: '#2DD4C8',
              subtitle: 'The platform improves itself. You manage outcomes.',
              team: ['Existing engineering team', '1 Abarva Maestro (oversight)', 'Agents add new agents', 'Transformation Genome advisory'],
              builds: ['Agents improve from outcome data', 'New agents added in weeks not months', 'Failure Genome feeds recommendations', 'Value measurement dashboard live'],
              warning: 'Abarva fee = 15% of verified value delivered — aligned with your goals',
              output: '$50–200M annual value · Abarva fee scales with value',
            },
          ].map((phase, i) => (
            <div key={i} style={{ ...S.card, borderTop: '3px solid ' + phase.accentColor }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ ...S.mono, fontSize: '9px', color: phase.accentColor, letterSpacing: '0.1em', marginBottom: '4px' }}>PHASE {phase.num} · {phase.months}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#E6EDF3' }}>{phase.title}</div>
                </div>
                <div style={{ ...S.mono, fontSize: '9px', color: '#8B949E', textAlign: 'right' as const }}>
                  <div style={{ color: phase.accentColor, fontWeight: 600, fontSize: '11px' }}>{phase.invest}</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#6EE7B7', fontStyle: 'italic', marginBottom: '12px', lineHeight: 1.4 }}>{phase.subtitle}</div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ ...S.mono, fontSize: '9px', color: '#6B7280', letterSpacing: '0.08em', marginBottom: '5px' }}>TEAM</div>
                {phase.team.map((t, ti) => (
                  <div key={ti} style={{ fontSize: '10px', color: '#8B949E', marginBottom: '3px', paddingLeft: '8px', borderLeft: '2px solid #21262D' }}>· {t}</div>
                ))}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ ...S.mono, fontSize: '9px', color: '#6B7280', letterSpacing: '0.08em', marginBottom: '5px' }}>WHAT GETS BUILT</div>
                {phase.builds.map((b, bi) => (
                  <div key={bi} style={{ fontSize: '10px', color: '#C9D1D9', marginBottom: '3px' }}>✓ {b}</div>
                ))}
              </div>
              <div style={{ padding: '6px 10px', background: 'rgba(45,212,200,0.06)', border: '1px solid rgba(45,212,200,0.2)', borderRadius: '5px', fontSize: '9.5px', color: '#2DD4C8', lineHeight: 1.4 }}>
                {i === 0 ? '⚠ ' : i === 1 ? '→ ' : i === 3 ? '◎ ' : '⟳ '}{phase.warning}
              </div>
              <div style={{ marginTop: '10px', ...S.mono, fontSize: '9px', color: phase.accentColor }}>Output: {phase.output}</div>
            </div>
          ))}
        </div>

        {/* Cost Comparison Table */}
        <div style={{ ...S.card, marginBottom: '32px' }}>
          <div style={{ ...S.mono, fontSize: '10px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>COST COMPARISON — {meta.name.toUpperCase()} · {meta.cloud}</div>
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' }}>
              <thead>
                <tr>
                  {['', 'Traditional SI', 'Abarva + Lean Team', 'Hybrid'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: i === 0 ? 'left' as const : 'center' as const, ...S.mono, fontSize: '9px', color: i === 2 ? '#2DD4C8' : '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderBottom: '1px solid #21262D', background: i === 2 ? 'rgba(45,212,200,0.04)' : 'transparent' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Strategy + architecture', '$5–8M', '$0 (Abarva platform)', '$500K'],
                  ['Implementation Phase 0', '$8–12M', '$2–4M', '$4–6M'],
                  ['Implementation Phase 1', '$10–15M', '$3–6M', '$5–8M'],
                  ['Implementation Phase 2', '$12–18M', '$8–15M', '$10–14M'],
                  ['SI management overhead', '$4–6M', '$0', '$1–2M'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #21262D' }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: '10px 16px', color: ci === 0 ? '#8B949E' : ci === 2 ? '#2DD4C8' : ci === 1 ? '#EF4444' : '#6B7280', textAlign: ci === 0 ? 'left' as const : 'center' as const, background: ci === 2 ? 'rgba(45,212,200,0.03)' : 'transparent', fontSize: '12px' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
                {[
                  ['Total Year 1–2', '$39–59M', '$13–25M', '$20–30M', true],
                  ['Time to first value', '18 months', '90 days', '6 months', false],
                  ['Knowledge retained', 'Walks out the door', 'Permanent · embedded', 'Partial', false],
                  ['Outcome aligned', 'No — time and materials', 'Yes — 15% of value', 'Partial', false],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #21262D' }}>
                    <td style={{ padding: '10px 16px', color: '#8B949E', fontWeight: row[4] ? 700 : 400 }}>{row[0]}</td>
                    <td style={{ padding: '10px 16px', color: row[4] ? '#EF4444' : '#EF4444', textAlign: 'center' as const, fontWeight: row[4] ? 700 : 400, textDecoration: row[4] ? 'none' : 'none' }}>{row[1]}</td>
                    <td style={{ padding: '10px 16px', color: row[4] ? '#2DD4C8' : '#2DD4C8', textAlign: 'center' as const, fontWeight: row[4] ? 700 : 600, background: 'rgba(45,212,200,0.03)' }}>{row[2]}</td>
                    <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'center' as const, fontWeight: row[4] ? 700 : 400 }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent vs Human Decision Matrix */}
        <div style={{ ...S.card, marginBottom: '32px' }}>
          <div style={{ ...S.mono, fontSize: '10px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>AGENT VS HUMAN DECISION MATRIX</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>When to trust the agent · when to keep the human · and what the human checkpoint looks like</div>
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '11px' }}>
              <thead>
                <tr>
                  {['Task', 'Recommended', 'Why', 'Cost per Unit', 'Volume', 'Human Checkpoint'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left' as const, ...S.mono, fontSize: '9px', color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase' as const, borderBottom: '1px solid #21262D', whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((row, i) => {
                  const isAgent = row.recommended.toLowerCase().includes('agent') && !row.recommended.toLowerCase().includes('human')
                  const isPlatform = !row.recommended.toLowerCase().includes('agent')
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #21262D' }}>
                      <td style={{ padding: '9px 12px', color: '#C9D1D9', fontWeight: 500 }}>{row.task}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' as const }}>
                        <span style={{ ...S.mono, fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: isAgent ? 'rgba(77,163,255,0.1)' : isPlatform ? 'rgba(168,85,247,0.1)' : 'rgba(245,158,11,0.1)', color: isAgent ? '#4DA3FF' : isPlatform ? '#A855F7' : '#F59E0B' }}>
                          {row.recommended}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#8B949E', fontSize: '10px', maxWidth: '200px' }}>{row.why}</td>
                      <td style={{ padding: '9px 12px', ...S.mono, fontSize: '9px', color: '#6EE7B7' }}>{row.cost}</td>
                      <td style={{ padding: '9px 12px', ...S.mono, fontSize: '9px', color: '#8B949E' }}>{row.volume}</td>
                      <td style={{ padding: '9px 12px', fontSize: '10px', color: row.checkpoint.toLowerCase().includes('every') ? '#F59E0B' : '#6B7280' }}>{row.checkpoint}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outcome Tracking Note */}
        <div style={{ ...S.card, borderLeft: '4px solid #2DD4C8', background: '#0D1117', padding: '24px 28px' }}>
          <div style={{ ...S.mono, fontSize: '11px', color: '#2DD4C8', letterSpacing: '0.1em', marginBottom: '16px' }}>ABARVA TRACKS OUTCOMES — NOT TASKS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, marginBottom: '8px' }}>We do not track:</div>
              {['Tickets closed', 'Sprints completed', 'Story points burned', 'Deployment frequency', 'Vendor meeting hours'].map((item, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', textDecoration: 'line-through' }}>· {item}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#2DD4C8', fontWeight: 600, marginBottom: '8px' }}>We track:</div>
              {(selectedClient === 'meridian' ? [
                'Denial rate: 18.2% → 12%',
                'Revenue recovered: $0 → $28M',
                'FTE redeployed: 14 → 3 in prior auth',
                'CMS compliance: 23% → 100%',
                'Sepsis AI: 2 hospitals → 23',
              ] : selectedClient === 'firstcapital' ? [
                'AML false positives: 78% → 25%',
                'FedNow transactions: 0 → live',
                'Commercial deposit at risk: $340M → $0',
                'Analyst FTE on false positives: 6 FTE → 1',
                'Account opening abandonment: 64% → 38%',
              ] : [
                'Cart abandonment: 72% → 58%',
                'Einstein revenue: $0 → $248M',
                'Active loyalty members: 42% → 62%',
                'Forecast accuracy: 62% → 84%',
                'Shrinkage: $347M → $263M',
              ]).map((item, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#C9D1D9', marginBottom: '4px' }}>✓ {item}</div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(45,212,200,0.06)', borderRadius: '8px', border: '1px solid rgba(45,212,200,0.15)' }}>
            <div style={{ fontSize: '13px', color: '#E6EDF3', lineHeight: 1.7 }}>
              Every recommendation has a predicted outcome.<br />
              Every outcome is measured against prediction.<br />
              <span style={{ color: '#2DD4C8', fontWeight: 600 }}>Abarva fee = 15% of verified value delivered.</span><br />
              <span style={{ fontSize: '12px', color: '#8B949E' }}>This is how Abarva stays aligned with your goals — not your project plan.</span>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
          <a href={'/architecture?client=' + selectedClient} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(77,163,255,0.1)', color: '#4DA3FF', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(77,163,255,0.25)' }}>← Architecture Diagram</a>
          <a href={'/blueprint?client=' + selectedClient} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(45,212,200,0.1)', color: '#2DD4C8', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(45,212,200,0.25)' }}>Solution Blueprint →</a>
          <a href={'/justify?client=' + selectedClient} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(110,231,183,0.1)', color: '#6EE7B7', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(110,231,183,0.25)' }}>Build Business Case →</a>
        </div>
      </div>
    </div>
  )
}

export default function HowToBuildPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DD4C8', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>
        Loading build plan...
      </div>
    }>
      <HowToBuildContent />
    </Suspense>
  )
}
