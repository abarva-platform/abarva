'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import EngagementProgress from '@/components/EngagementProgress'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
}

const STEPS = [
  { id: 1, name: 'Delivery Baseline' },
  { id: 2, name: 'AI Opportunity Map' },
  { id: 3, name: 'Toolchain' },
  { id: 4, name: 'Workforce Impact' },
  { id: 5, name: 'Roadmap' },
  { id: 6, name: 'Business Case' },
  { id: 7, name: 'Export' },
]

const DATA_COMPLETENESS: Record<string, number> = {
  meridian: 88,
  firstcapital: 82,
  apexretail: 76,
}

const CLIENT_NAMES: Record<string, string> = {
  meridian: 'Meridian Health System',
  firstcapital: 'First Capital Financial',
  apexretail: 'Apex Retail Group',
}

// ─── Shared sub-components ──────────────────────────────────────────

function StatusBadge({ status }: { status: 'RED' | 'AMBER' | 'GREEN' }) {
  const cfg = {
    RED: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Critical' },
    AMBER: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Watch' },
    GREEN: { bg: '#F0FDF4', color: '#059669', border: '#A7F3D0', label: 'On Track' },
  }[status]
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: cfg.bg, color: cfg.color, border: '1px solid ' + cfg.border }}>
      {cfg.label}
    </span>
  )
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const color = pct >= 75 ? '#059669' : pct >= 55 ? '#D97706' : '#DC2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
        <div style={{ height: '6px', borderRadius: '3px', width: pct + '%', background: color }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color, minWidth: '28px', textAlign: 'right' }}>{score}</span>
    </div>
  )
}

// ─── Step 0: Landing ────────────────────────────────────────────────

function StepLanding({ clientId, onStart }: { clientId: string; onStart: () => void }) {
  const completeness = DATA_COMPLETENESS[clientId] ?? 80
  const clientName = CLIENT_NAMES[clientId] ?? 'Your Company'
  const outputs = [
    'Velocity improvement projection',
    'Tool matrix with scores',
    'Business case (3 scenarios)',
    'Board deck ready',
  ]
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '20px', background: '#F5F3FF', border: '1px solid #DDD6FE', marginBottom: '20px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED', display: 'block' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Delivery Intelligence</span>
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#0F172A', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.02em' }}>
          AI in the Software<br />Delivery Lifecycle
        </h1>
        <p style={{ fontSize: '17px', color: '#475569', lineHeight: 1.65, maxWidth: '620px', margin: '0 auto' }}>
          Transform how your engineering teams deliver software. AI-augmented development, testing, and operations — with real data from your technology stack.
        </p>
      </div>

      {/* Data completeness */}
      <div style={{ ...S.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={S.label}>DATA COMPLETENESS — {clientName.toUpperCase()}</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>Based on your uploaded technology stack and team data</div>
          </div>
          <span style={{ fontSize: '28px', fontWeight: 800, color: completeness >= 85 ? '#059669' : '#D97706' }}>{completeness}%</span>
        </div>
        <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '12px' }}>
          <div style={{ height: '8px', borderRadius: '4px', width: completeness + '%', background: completeness >= 85 ? '#059669' : '#D97706', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { label: 'Engineering Metrics', done: true },
            { label: 'Tool Inventory', done: true },
            { label: 'Team Structure', done: completeness >= 82 },
            { label: 'Incident History', done: completeness >= 85 },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: item.done ? '#F0FDF4' : '#F8FAFC', border: '1px solid ' + (item.done ? '#A7F3D0' : '#E2E8F0') }}>
              <span style={{ fontSize: '12px', color: item.done ? '#059669' : '#94A3B8' }}>{item.done ? '✓' : '○'}</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: item.done ? '#059669' : '#94A3B8' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Output examples */}
      <div style={{ ...S.card, marginBottom: '32px' }}>
        <div style={S.label}>WHAT YOU'LL GET</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {outputs.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '16px' }}>{['📈', '🔧', '💼', '📊'][i]}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{o}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={onStart}
          style={{ padding: '16px 40px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#6D28D9')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#7C3AED')}>
          Start AI-PDLC Analysis →
        </button>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#94A3B8' }}>7 steps · ~12 minutes · Export-ready outputs</div>
      </div>
    </div>
  )
}

// ─── Step 1: Delivery Performance Baseline ─────────────────────────

function Step1({ clientId }: { clientId: string }) {
  const rows = clientId === 'firstcapital' ? [
    { metric: 'Deployment frequency', yours: '3x/month', peer: '8x/month', gap: '-5x', status: 'RED' as const },
    { metric: 'Change failure rate', yours: '14%', peer: '7%', gap: '+7pts', status: 'RED' as const },
    { metric: 'MTTR', yours: '3.1 hrs', peer: '1.1 hrs', gap: '+2.0hrs', status: 'RED' as const },
    { metric: 'Lead time for changes', yours: '9 days', peer: '3 days', gap: '-6 days', status: 'RED' as const },
    { metric: 'Test coverage', yours: '67%', peer: '80%', gap: '-13pts', status: 'AMBER' as const },
  ] : clientId === 'apexretail' ? [
    { metric: 'Deployment frequency', yours: '4x/month', peer: '8x/month', gap: '-4x', status: 'RED' as const },
    { metric: 'Change failure rate', yours: '11%', peer: '7%', gap: '+4pts', status: 'AMBER' as const },
    { metric: 'MTTR', yours: '2.8 hrs', peer: '1.1 hrs', gap: '+1.7hrs', status: 'AMBER' as const },
    { metric: 'Lead time for changes', yours: '7 days', peer: '3 days', gap: '-4 days', status: 'RED' as const },
    { metric: 'Test coverage', yours: '72%', peer: '80%', gap: '-8pts', status: 'AMBER' as const },
  ] : [
    { metric: 'Deployment frequency', yours: '2x/month', peer: '8x/month', gap: '-4x', status: 'RED' as const },
    { metric: 'Change failure rate', yours: '18%', peer: '7%', gap: '+11pts', status: 'RED' as const },
    { metric: 'MTTR', yours: '4.2 hrs', peer: '1.1 hrs', gap: '+3.1hrs', status: 'RED' as const },
    { metric: 'Lead time for changes', yours: '12 days', peer: '3 days', gap: '-9 days', status: 'RED' as const },
    { metric: 'Test coverage', yours: '61%', peer: '80%', gap: '-19pts', status: 'AMBER' as const },
  ]

  const redCount = rows.filter(r => r.status === 'RED').length
  const summary = clientId === 'apexretail'
    ? 'Your engineering org is in the bottom quartile on 2 of 5 DORA metrics, with 3 additional watch items.'
    : clientId === 'firstcapital'
    ? 'Your engineering org is in the bottom quartile on 4 of 5 DORA metrics.'
    : 'Your engineering org is in the bottom quartile on 4 of 5 DORA metrics.'

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Delivery Performance Baseline</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>DORA metrics vs. industry peer benchmarks · {CLIENT_NAMES[clientId] ?? clientId}</p>

      <div style={{ ...S.card, marginBottom: '20px' }}>
        <div style={S.label}>DORA METRIC BENCHMARK TABLE</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              {['Metric', 'Your Value', 'Peer Benchmark', 'Gap', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{row.metric}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#DC2626', fontWeight: 600 }}>{row.yours}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#059669', fontWeight: 600 }}>{row.peer}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: row.status === 'RED' ? '#DC2626' : '#D97706', fontWeight: 600 }}>{row.gap}</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '14px 18px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '16px', marginTop: '1px' }}>⚠</span>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>Assessment: </span>
          <span style={{ fontSize: '13px', color: '#374151' }}>{summary} AI-augmented tooling can close the majority of these gaps within 12 months.</span>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: AI Opportunity Map ─────────────────────────────────────

function Step2({ clientId }: { clientId: string }) {
  const phases = [
    { phase: 'Requirements', icon: '📋', opportunities: ['AI-assisted spec generation', 'Automated acceptance criteria'], value: '$2.1M', color: '#3B82F6' },
    { phase: 'Design', icon: '🎨', opportunities: ['Architecture review AI', 'Pattern detection & anti-pattern alerts'], value: '$1.4M', color: '#8B5CF6' },
    { phase: 'Development', icon: '💻', opportunities: ['GitHub Copilot / Cursor integration', 'AI-powered code review'], value: clientId === 'meridian' ? '$8.2M' : clientId === 'firstcapital' ? '$9.4M' : '$7.1M', color: '#7C3AED' },
    { phase: 'Testing', icon: '🧪', opportunities: ['AI test case generation', 'Coverage gap optimization'], value: '$3.8M', color: '#06B6D4' },
    { phase: 'Deployment', icon: '🚀', opportunities: ['AI deployment risk scoring', 'Automated rollback prediction'], value: '$2.2M', color: '#10B981' },
    { phase: 'Operations', icon: '📡', opportunities: ['AIOps anomaly detection', 'Predictive incident management'], value: clientId === 'meridian' ? '$4.1M' : clientId === 'firstcapital' ? '$5.2M' : '$3.6M', color: '#059669' },
  ]

  const totalValue = clientId === 'meridian' ? '$21.8M' : clientId === 'firstcapital' ? '$24.1M' : '$19.4M'

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>AI Opportunity Map</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>AI-augmentation potential across every phase of the software delivery lifecycle</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ ...S.card, borderTop: '3px solid ' + p.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{p.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{p.phase}</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: p.color }}>{p.value}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {p.opportunities.map((opp, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color, flexShrink: 0, display: 'block' }} />
                  <span style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>{opp}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Addressable AI Value</div>
          <div style={{ fontSize: '13px', color: '#6B7280' }}>Across all 6 SDLC phases · annual recurring basis</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.03em' }}>{totalValue}</div>
          <div style={{ fontSize: '12px', color: '#8B5CF6' }}>annual value</div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Toolchain Assessment ──────────────────────────────────

type ToolScore = { ecosystemFit: number; compliance: number; cost: number; skills: number; risk: number }

const TOOLS: { name: string; scores: ToolScore; recommended?: boolean; referral?: boolean }[] = [
  { name: 'GitHub Copilot', scores: { ecosystemFit: 88, compliance: 76, cost: 72, skills: 82, risk: 78 }, recommended: true, referral: true },
  { name: 'Cursor', scores: { ecosystemFit: 79, compliance: 68, cost: 85, skills: 78, risk: 72 } },
  { name: 'JetBrains AI', scores: { ecosystemFit: 74, compliance: 80, cost: 78, skills: 75, risk: 74 } },
  { name: 'Amazon CodeWhisperer', scores: { ecosystemFit: 71, compliance: 88, cost: 90, skills: 68, risk: 80 } },
]

const SCORE_DIMS: { key: keyof ToolScore; label: string }[] = [
  { key: 'ecosystemFit', label: 'Ecosystem Fit' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'cost', label: 'Cost Efficiency' },
  { key: 'skills', label: 'Skills Availability' },
  { key: 'risk', label: 'Risk Profile' },
]

function weightedScore(scores: ToolScore) {
  return Math.round(
    scores.ecosystemFit * 0.30 +
    scores.compliance * 0.20 +
    scores.cost * 0.15 +
    scores.skills * 0.20 +
    scores.risk * 0.15
  )
}

function Step3() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Toolchain Assessment</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Scored comparison of AI development tools against your engineering environment</p>

      <div style={{ ...S.card, marginBottom: '20px', overflowX: 'auto' }}>
        <div style={S.label}>SCORED TOOL MATRIX</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '180px' }}>Tool</th>
              {SCORE_DIMS.map(d => (
                <th key={d.key} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '120px' }}>{d.label}</th>
              ))}
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '80px' }}>Composite</th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((tool, i) => {
              const composite = weightedScore(tool.scores)
              const isRec = tool.recommended
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: isRec ? '#F5F3FF' : i % 2 === 0 ? '#FAFAFA' : '#FFFFFF' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{tool.name}</span>
                      {isRec && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: '#7C3AED', color: 'white' }}>BEST FIT</span>}
                    </div>
                    {tool.referral && (
                      <div style={{ fontSize: '10px', color: '#7C3AED', marginTop: '3px', fontWeight: 600 }}>★ AbarVa referral partner — disclosed</div>
                    )}
                  </td>
                  {SCORE_DIMS.map(d => (
                    <td key={d.key} style={{ padding: '14px 12px', minWidth: '120px' }}>
                      <ScoreBar score={tool.scores[d.key]} />
                    </td>
                  ))}
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: isRec ? '#7C3AED' : '#374151' }}>{composite}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>/100</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>Scores weighted: Ecosystem 30% · Compliance 20% · Skills 20% · Risk 15% · Cost 15%</span>
        <a href="/marketplace" style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', textDecoration: 'none' }}>
          Find the right platform → Marketplace
        </a>
      </div>
    </div>
  )
}

// ─── Step 4: Workforce Impact ────────────────────────────────────────

function Step4() {
  const roles = [
    {
      role: 'Software Engineer',
      automated: 'GitHub Copilot automates 35–45% of code generation — boilerplate, unit tests, and documentation.',
      human: 'Architecture decisions, complex debugging, customer context, cross-system design.',
      automationPct: 40,
    },
    {
      role: 'QA Engineer',
      automated: 'AI generates 60–70% of test cases from requirements, including regression suites.',
      human: 'Exploratory testing, edge cases, product judgment, user empathy.',
      automationPct: 65,
    },
    {
      role: 'DevOps Engineer',
      automated: 'AI handles ~40% of incident triage, routine runbook execution, and alert classification.',
      human: 'Novel system failures, architecture changes, capacity planning, vendor relationships.',
      automationPct: 40,
    },
    {
      role: 'Engineering Manager',
      automated: 'AI produces sprint metrics, blocker summaries, and delivery forecasts automatically.',
      human: 'Team dynamics, prioritization trade-offs, stakeholder trust, performance coaching.',
      automationPct: 25,
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Workforce Impact Analysis</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Role-by-role breakdown of AI automation vs. human-essential work</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {roles.map((r, i) => (
          <div key={i} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{r.role}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#7C3AED' }}>{r.automationPct}%</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Automatable</div>
              </div>
            </div>
            <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', marginBottom: '14px' }}>
              <div style={{ height: '6px', borderRadius: '3px', width: r.automationPct + '%', background: '#7C3AED' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#FEF9FF', border: '1px solid #EDE9FE' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>AI Handles</div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{r.automated}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Stays Human</div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{r.human}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, background: '#F0FDF4', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>FTE Redeployment Opportunity</div>
          <div style={{ fontSize: '13px', color: '#374151' }}>8 FTEs can be redeployed to higher-value work — not eliminated. Estimated savings from efficiency gains: <strong>$1.2M/year</strong>.</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#059669' }}>-8 FTEs</div>
          <div style={{ fontSize: '11px', color: '#059669' }}>redeployable</div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Implementation Roadmap ─────────────────────────────────

function Step5() {
  const phases = [
    {
      phase: 'Phase 1',
      range: 'Months 1–6',
      title: 'Developer Tooling',
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      items: [
        { label: 'GitHub Copilot Enterprise rollout', detail: 'All engineering squads · 180 developers' },
        { label: 'AI code review integration', detail: 'PR-level automated analysis in GitHub Actions' },
        { label: 'AI test generation pilot', detail: 'Coverage improvement target: 61% → 75%' },
        { label: 'Developer productivity baseline', detail: 'Establish velocity metrics for ROI tracking' },
      ],
      outcome: 'Expected velocity improvement: 25–35%. Lead time reduction: 12 days → 7 days.',
    },
    {
      phase: 'Phase 2',
      range: 'Months 7–12',
      title: 'Testing & Deployment AI',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      items: [
        { label: 'AI test suite full rollout', detail: '60% automated test generation target' },
        { label: 'Deployment risk scoring', detail: 'ML model trained on 18mo deployment history' },
        { label: 'Automated rollback triggers', detail: 'P99 latency + error-rate anomaly detection' },
        { label: 'Change failure rate reduction', detail: 'Target: 18% → 10%' },
      ],
      outcome: 'Change failure rate halved. Deployment frequency doubles to 5x/month.',
    },
    {
      phase: 'Phase 3',
      range: 'Months 13–18',
      title: 'AIOps & Predictive Operations',
      color: '#059669',
      bg: '#F0FDF4',
      border: '#A7F3D0',
      items: [
        { label: 'AIOps anomaly detection', detail: 'Unsupervised ML across all infra telemetry' },
        { label: 'Predictive incident management', detail: 'MTTR target: 4.2hrs → 1.5hrs' },
        { label: 'Automated capacity forecasting', detail: 'Cost avoidance: ~$800K/year over-provisioning' },
        { label: 'Full DORA metric parity', detail: 'Target: top-quartile benchmark across all 5 metrics' },
      ],
      outcome: 'MTTR matches peer benchmark. Org reaches top-quartile DORA performance.',
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Implementation Roadmap</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>18-month phased delivery plan — sequenced for compounding value and managed risk</p>

      {/* Timeline bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', marginBottom: '32px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ padding: '12px 16px', background: p.bg, borderRight: i < 2 ? '1px solid ' + p.border : undefined }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.phase} · {p.range}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{p.title}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ ...S.card, borderLeft: '4px solid ' + p.color }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '4px 12px', borderRadius: '20px', background: p.bg, border: '1px solid ' + p.border }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: p.color }}>{p.phase} · {p.range}</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{p.title}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {p.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '14px', color: p.color, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>→</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: p.bg, border: '1px solid ' + p.border }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phase Outcome: </span>
              <span style={{ fontSize: '12px', color: '#374151' }}>{p.outcome}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 6: Business Case ───────────────────────────────────────────

function Step6() {
  const [selected, setSelected] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')

  const scenarios = [
    {
      id: 'conservative' as const,
      label: 'Conservative',
      investment: '$8M',
      annualValue: '$14M',
      roi: '1.8x',
      payback: '8 months',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      scope: 'Developer tooling + AI testing only. Low organizational change required.',
    },
    {
      id: 'moderate' as const,
      label: 'Moderate',
      investment: '$14M',
      annualValue: '$21.8M',
      roi: '1.6x',
      payback: '11 months',
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      scope: 'Full SDLC AI coverage across dev, test, and deployment. Recommended.',
      recommended: true,
    },
    {
      id: 'aggressive' as const,
      label: 'Aggressive',
      investment: '$22M',
      annualValue: '$31M',
      roi: '1.4x',
      payback: '14 months',
      color: '#059669',
      bg: '#F0FDF4',
      border: '#A7F3D0',
      scope: 'AIOps + predictive operations + workforce retraining. Full transformation.',
    },
  ]

  const active = scenarios.find(s => s.id === selected)!

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Business Case</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Three investment scenarios with projected returns · 3-year horizon</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {scenarios.map(s => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            style={{ padding: '20px', borderRadius: '12px', border: '2px solid ' + (selected === s.id ? s.color : '#E2E8F0'), background: selected === s.id ? s.bg : '#FFFFFF', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', position: 'relative' }}>
            {s.recommended && (
              <div style={{ position: 'absolute', top: '-10px', right: '12px', padding: '2px 10px', borderRadius: '10px', background: '#7C3AED', color: 'white', fontSize: '10px', fontWeight: 700 }}>RECOMMENDED</div>
            )}
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, marginBottom: '2px' }}>{s.roi}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROI</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Investment</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151' }}>{s.investment}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Annual Value</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669' }}>{s.annualValue}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Expanded detail */}
      <div style={{ ...S.card, borderLeft: '4px solid ' + active.color, marginBottom: '20px' }}>
        <div style={S.label}>{active.label.toUpperCase()} SCENARIO — DETAIL</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {[
            { label: 'Total Investment', value: active.investment, color: '#374151' },
            { label: 'Annual Value', value: active.annualValue, color: '#059669' },
            { label: 'Net ROI', value: active.roi, color: active.color },
            { label: 'Payback Period', value: active.payback, color: '#D97706' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{item.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scope: </span>
          <span style={{ fontSize: '13px', color: '#374151' }}>{active.scope}</span>
        </div>
      </div>

      <div style={{ padding: '14px 18px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>Payback range across all scenarios: </span>
        <span style={{ fontSize: '13px', color: '#374151' }}>8–14 months. All three scenarios achieve positive ROI within the first year of deployment.</span>
      </div>
    </div>
  )
}

// ─── Step 7: Export ──────────────────────────────────────────────────

function Step7({ clientId }: { clientId: string }) {
  const exportCards = [
    { title: 'Board Presentation', desc: '10-slide deck with DORA metrics, ROI, and 18-month roadmap. Ready for your next board meeting.', icon: '📊', tag: 'PowerPoint · PDF' },
    { title: 'Engineering Business Case', desc: 'Full financial model with conservative/moderate/aggressive scenarios, payback analysis, and risk-adjusted returns.', icon: '💼', tag: 'Excel · PDF' },
    { title: 'Tool Matrix', desc: 'Scored comparison table for GitHub Copilot, Cursor, JetBrains AI, and Amazon CodeWhisperer with your weighting.', icon: '🔧', tag: 'PDF · Notion' },
    { title: 'Implementation Roadmap', desc: '18-month phased Gantt chart with milestones, dependencies, and Phase 1–3 outcomes.', icon: '🗓', tag: 'PDF · Jira-ready' },
    { title: 'Workforce Impact Report', desc: 'Role-by-role automation analysis, FTE redeployment plan, and reskilling recommendations.', icon: '👥', tag: 'PDF · Word' },
    { title: 'Vendor Evaluation Pack', desc: 'RFP-ready evaluation criteria, reference architecture, and negotiation talking points for each tool.', icon: '📋', tag: 'PDF · Word' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Export Your AI-PDLC Analysis</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Board-ready deliverables for {CLIENT_NAMES[clientId] ?? clientId}</p>

      <div style={{ padding: '10px 16px', borderRadius: '10px', background: '#F5F3FF', border: '1px solid #DDD6FE', marginBottom: '28px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>💡</span>
        <span style={{ fontSize: '13px', color: '#6D28D9', fontStyle: 'italic' }}>
          What McKinsey charges <strong>$2.8M and 14 weeks</strong> to produce. Generated in minutes.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {exportCards.map((card, i) => (
          <div key={i} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{card.title}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>{card.desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.tag}</span>
              <button
                style={{ padding: '6px 16px', borderRadius: '8px', background: '#7C3AED', color: 'white', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#6D28D9')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#7C3AED')}>
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, background: '#0D1117', border: '1px solid #21262D', textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#2DD4C8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Delivery Intelligence Complete</div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>Your AI-PDLC analysis is ready.</div>
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Continue the AbarVa engagement journey to justify the investment and select vendors.</div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a href={`/justify?client=${clientId}`} style={{ padding: '10px 24px', borderRadius: '10px', background: '#2DD4C8', color: '#0D1117', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            Build Business Case →
          </a>
          <a href={`/select?client=${clientId}`} style={{ padding: '10px 24px', borderRadius: '10px', background: 'transparent', color: '#FFFFFF', border: '1px solid #374151', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Vendor Selection →
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main content (needs useSearchParams) ───────────────────────────

function AIPDLCContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [step, setStep] = useState(0)

  const clientName = CLIENT_NAMES[clientId] ?? clientId

  const StepNav = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', overflowX: 'auto' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', minWidth: 'max-content' }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            style={{
              padding: '12px 16px', fontSize: '13px',
              fontWeight: step === s.id ? 600 : 400,
              color: step === s.id ? '#7C3AED' : step > s.id ? '#059669' : '#94A3B8',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: step === s.id ? '2px solid #7C3AED' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: '6px',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}>
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step === s.id ? '#7C3AED' : step > s.id ? '#059669' : '#F1F5F9',
              color: step === s.id || step > s.id ? 'white' : '#94A3B8',
              flexShrink: 0,
            }}>
              {step > s.id ? '✓' : s.id}
            </span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )

  const NavBtns = ({ prev, next, nextLabel = 'Next →' }: { prev?: number; next?: number; nextLabel?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
      {prev !== undefined
        ? <button onClick={() => setStep(prev)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        : <div />}
      {next !== undefined && (
        <button onClick={() => setStep(next)}
          style={{ padding: '12px 32px', borderRadius: '10px', background: '#7C3AED', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#6D28D9')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#7C3AED')}>
          {nextLabel}
        </button>
      )}
    </div>
  )

  return (
    <div style={S.page}>
      <AbarvaNav clientId={clientId} activePage="ai-pdlc" />
      <EngagementProgress />

      {/* Breadcrumb */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Delivery Intelligence</span>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{clientName}</span>
      </div>

      {/* Step nav (only when past landing) */}
      {step > 0 && <StepNav />}

      {/* Step scope bar */}
      {step > 0 && (
        <div style={{ background: '#F5F3FF', borderBottom: '1px solid #DDD6FE', padding: '6px 32px', fontSize: '12px', color: '#7C3AED', fontWeight: 600 }}>
          AI-PDLC · {clientName} · Step {step} of {STEPS.length}
        </div>
      )}

      {/* Content */}
      {step === 0 && <StepLanding clientId={clientId} onStart={() => setStep(1)} />}

      {step > 0 && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
          {step === 1 && (
            <div>
              <Step1 clientId={clientId} />
              <NavBtns next={2} nextLabel="Next: AI Opportunity Map →" />
            </div>
          )}
          {step === 2 && (
            <div>
              <Step2 clientId={clientId} />
              <NavBtns prev={1} next={3} nextLabel="Next: Toolchain Assessment →" />
            </div>
          )}
          {step === 3 && (
            <div>
              <Step3 />
              <NavBtns prev={2} next={4} nextLabel="Next: Workforce Impact →" />
            </div>
          )}
          {step === 4 && (
            <div>
              <Step4 />
              <NavBtns prev={3} next={5} nextLabel="Next: Implementation Roadmap →" />
            </div>
          )}
          {step === 5 && (
            <div>
              <Step5 />
              <NavBtns prev={4} next={6} nextLabel="Next: Business Case →" />
            </div>
          )}
          {step === 6 && (
            <div>
              <Step6 />
              <NavBtns prev={5} next={7} nextLabel="Next: Export →" />
            </div>
          )}
          {step === 7 && (
            <div>
              <Step7 clientId={clientId} />
              <NavBtns prev={6} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Default export wrapped in Suspense ─────────────────────────────

export default function AIPDLCPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: '#94A3B8' }}>Loading Delivery Intelligence...</div>
      </div>
    }>
      <AIPDLCContent />
    </Suspense>
  )
}
