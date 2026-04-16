'use client'

import { Suspense, useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext, ALL_CLIENTS } from '@/lib/use-client-context'
import { calcProgress, calcVariance, calcInitiativeStatus, calcOutcomeFee, calcPortfolioSummary } from '@/lib/outcome-intelligence'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#060A12',
  surface: '#0D1520',
  border: '#1C2D45',
  teal: '#2DD4C8',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  indigo: '#6366F1',
  text: '#EFF6FF',
  secondary: '#94A3B8',
  fraunces: 'Fraunces, Georgia, serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  sans: '"DM Sans", system-ui, sans-serif',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'portfolio' | 'deepdive' | 'verification' | 'warning' | 'board'
type Client = 'meridian' | 'arcturus' | 'apexretail'

// ── Meridian initiatives data ─────────────────────────────────────────────────
const MERIDIAN_INITIATIVES = [
  {
    id: 'rcm-ai',
    name: 'RCM AI Automation',
    vendor: 'Ensemble Health Partners',
    wave: 1,
    baselineLocked: 'April 13, 2026',
    dayInProgramme: 127,
    totalProgrammeDays: 420,
    committedValue: 28_000_000,
    baselineValue: 18.2,
    currentValue: 16.8,
    targetValue: 11.4,
    metric: 'Denial rate',
    metricUnit: '%',
    directionIsDown: true,
    verifiedValue: 8_200_000,
    expectedCurrentValue: 17.1,
    status: 'on_track' as const,
    nextMilestone: 'Pilot review — August 15, 2026',
    milestones: [
      { label: 'Baseline locked', date: 'April 13, 2026', done: true },
      { label: 'Vendor selected', date: 'April 28, 2026', done: true },
      { label: 'Contract signed', date: 'May 12, 2026', done: true },
      { label: 'Data pipeline complete', date: 'June 3, 2026', done: true },
      { label: 'Pilot live', date: 'July 1, 2026', done: true, note: '847 claims' },
      { label: 'Pilot review', date: 'August 15, 2026', done: false, current: true },
      { label: 'Full deployment', date: 'October 1, 2026', done: false },
      { label: '12-month verification', date: 'April 13, 2027', done: false },
    ],
    whyAhead: [
      'Prior auth data sprint completed early',
      'CDO interim (appointed May 3) drove faster adoption',
      'Payer contract renegotiation unlocked higher approval rates',
    ],
  },
  {
    id: 'prior-auth',
    name: 'Prior Auth AI',
    vendor: 'Waystar',
    wave: 1,
    baselineLocked: 'April 13, 2026',
    dayInProgramme: 87,
    totalProgrammeDays: 360,
    committedValue: 22_000_000,
    baselineValue: 23,
    currentValue: 28,
    targetValue: 65,
    metric: 'Prior auth automation',
    metricUnit: '%',
    directionIsDown: false,
    verifiedValue: 0,
    expectedCurrentValue: 26,
    status: 'on_track' as const,
    nextMilestone: 'Vendor go-live — October 1, 2026',
    milestones: [
      { label: 'Baseline locked', date: 'April 13, 2026', done: true },
      { label: 'Vendor selected', date: 'May 2, 2026', done: true },
      { label: 'Contract signed', date: 'May 28, 2026', done: true },
      { label: 'Vendor go-live', date: 'October 1, 2026', done: false, current: true },
      { label: '6-month review', date: 'April 1, 2027', done: false },
    ],
    whyAhead: ['Contract signed ahead of schedule'],
  },
  {
    id: 'travel-nurse',
    name: 'Travel Nurse Demand Prediction',
    vendor: 'Azure ML (internal)',
    wave: 1,
    baselineLocked: 'April 13, 2026',
    dayInProgramme: 112,
    totalProgrammeDays: 270,
    committedValue: 12_000_000,
    baselineValue: 48_000_000,
    currentValue: 44_200_000,
    targetValue: 36_000_000,
    metric: 'Travel nurse spend',
    metricUnit: '$',
    directionIsDown: true,
    verifiedValue: 0,
    expectedCurrentValue: 45_000_000,
    status: 'on_track' as const,
    nextMilestone: '90-day results review — July 22, 2026',
    milestones: [
      { label: 'Baseline locked', date: 'April 13, 2026', done: true },
      { label: 'Model build started', date: 'April 20, 2026', done: true },
      { label: '90-day pilot results', date: 'July 22, 2026', done: false, current: true },
    ],
    whyAhead: ['Kronos data quality higher than expected'],
  },
  {
    id: 'epic-sprint',
    name: 'Epic Optimization Sprint',
    vendor: 'Internal + Epic PS',
    wave: 2,
    baselineLocked: 'April 13, 2026',
    dayInProgramme: 42,
    totalProgrammeDays: 180,
    committedValue: 8_000_000,
    baselineValue: 9_200_000,
    currentValue: 9_100_000,
    targetValue: 6_000_000,
    metric: 'Epic PS spend',
    metricUnit: '$',
    directionIsDown: true,
    verifiedValue: 0,
    expectedCurrentValue: 9_000_000,
    status: 'warning' as const,
    nextMilestone: 'Epic module audit — August 1, 2026',
    milestones: [
      { label: 'Baseline locked', date: 'April 13, 2026', done: true },
      { label: 'Module audit started', date: 'June 1, 2026', done: true },
      { label: 'Epic module audit', date: 'August 1, 2026', done: false, current: true },
    ],
    whyAhead: [],
  },
  {
    id: 'coding-ai',
    name: 'Coding AI',
    vendor: 'Nuance + internal',
    wave: 2,
    baselineLocked: 'April 13, 2026',
    dayInProgramme: 28,
    totalProgrammeDays: 300,
    committedValue: 7_000_000,
    baselineValue: 5.4,
    currentValue: 5.4,
    targetValue: 2.8,
    metric: 'Coding error rate',
    metricUnit: '%',
    directionIsDown: true,
    verifiedValue: 0,
    expectedCurrentValue: 5.4,
    status: 'on_track' as const,
    nextMilestone: 'Pilot launch — September 1, 2026',
    milestones: [
      { label: 'Baseline locked', date: 'April 13, 2026', done: true },
      { label: 'Vendor assessment', date: 'June 20, 2026', done: true },
      { label: 'Pilot launch', date: 'September 1, 2026', done: false, current: true },
    ],
    whyAhead: [],
  },
]

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, expected, color }: { value: number; expected: number; color: string }) {
  return (
    <div style={{ position: 'relative', height: 6, background: T.border, borderRadius: 3 }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        height: '100%', width: `${value}%`,
        background: color, borderRadius: 3,
        transition: 'width 0.8s ease-out',
      }} />
      {/* Expected marker */}
      <div style={{
        position: 'absolute', top: -3, left: `${expected}%`,
        width: 2, height: 12, background: T.secondary,
        borderRadius: 1,
      }} />
    </div>
  )
}

// ── Portfolio tab ─────────────────────────────────────────────────────────────
function PortfolioTab() {
  const portfolioData = MERIDIAN_INITIATIVES.map(ini => ({
    committedValue: ini.committedValue,
    verifiedValue: ini.verifiedValue,
    status: ini.status,
  }))
  const summary = calcPortfolioSummary(portfolioData)
  const feeEarned = calcOutcomeFee(summary.totalVerified, 0.15)
  const feePotential = calcOutcomeFee(summary.totalCommitted, 0.175)

  return (
    <div>
      {/* Portfolio summary bar */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: 24, marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, fontFamily: T.mono, color: T.secondary, marginBottom: 8 }}>
          PORTFOLIO HEALTH — MERIDIAN
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'committed', value: `$${(summary.totalCommitted / 1e6).toFixed(0)}M` },
            { label: 'verified', value: `$${(summary.totalVerified / 1e6).toFixed(1)}M (${Math.round(summary.totalVerified / summary.totalCommitted * 100)}%)` },
            { label: 'on track', value: `$${(summary.totalCommitted * 0.88 / 1e6).toFixed(0)}M` },
            { label: 'at risk', value: `$${(summary.totalCommitted * 0.12 / 1e6).toFixed(0)}M` },
          ].map(({ label, value }) => (
            <div key={label}>
              <span style={{ fontSize: 18, fontFamily: T.mono, color: T.teal }}>{value}</span>
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginLeft: 6 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {MERIDIAN_INITIATIVES.map(ini => (
            <div
              key={ini.id}
              style={{
                width: 20, height: 20, borderRadius: '50%',
                background: ini.status === 'on_track' ? T.teal : ini.status === 'warning' ? T.amber : T.red,
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.bg,
              }}
              title={ini.name}
            >
              {ini.status === 'on_track' ? '●' : ini.status === 'warning' ? '⚠' : '✗'}
            </div>
          ))}
          <span style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginLeft: 8 }}>
            {summary.onTrackCount} of {MERIDIAN_INITIATIVES.length} initiatives on track
          </span>
        </div>
      </div>

      {/* Outcome fees */}
      <div style={{
        background: 'rgba(45,212,200,0.06)',
        border: `1px solid rgba(45,212,200,0.25)`,
        borderRadius: 8, padding: '12px 20px', marginBottom: 24,
        display: 'flex', gap: 32, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary }}>OUTCOME FEES TRIGGERED</div>
          <div style={{ fontSize: 20, fontFamily: T.mono, color: T.teal }}>${(feeEarned / 1e6).toFixed(1)}M</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary }}>FEES PROJECTED (full delivery)</div>
          <div style={{ fontSize: 20, fontFamily: T.mono, color: T.text }}>${(feePotential / 1e6).toFixed(1)}M</div>
        </div>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, alignSelf: 'center' }}>
          AbarVa earns nothing on value not yet verified. Our fee tracks your success.
        </div>
      </div>

      {/* Initiative cards */}
      {MERIDIAN_INITIATIVES.map(ini => {
        const progress = calcProgress(ini.baselineValue, ini.currentValue, ini.targetValue)
        const expectedProgress = Math.round((ini.dayInProgramme / ini.totalProgrammeDays) * 100)
        const statusColor = ini.status === 'on_track' ? T.teal : ini.status === 'warning' ? T.amber : T.red

        return (
          <div
            key={ini.id}
            style={{
              background: T.surface,
              border: `1px solid ${ini.status !== 'on_track' ? statusColor : T.border}`,
              borderRadius: 10, padding: 20, marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontFamily: T.sans, fontWeight: 700, color: T.text }}>
                  {ini.name} · Wave {ini.wave} · {ini.vendor}
                </div>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginTop: 2 }}>
                  Baseline locked: {ini.baselineLocked} · Day {ini.dayInProgramme} of {ini.totalProgrammeDays}
                </div>
              </div>
              <div style={{
                fontSize: 10, fontFamily: T.mono, padding: '3px 10px',
                background: `${statusColor}22`,
                border: `1px solid ${statusColor}`,
                color: statusColor, borderRadius: 4,
              }}>
                {ini.status === 'on_track' ? '✓ On track' : ini.status === 'warning' ? '⚠ Warning' : '✗ Behind'}
              </div>
            </div>

            {/* Metric row */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px 80px 80px 80px 1fr', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>METRIC</div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>BASELINE</div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>CURRENT</div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>TARGET</div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>PROGRESS</div>

              <div style={{ fontSize: 11, fontFamily: T.sans, color: T.text }}>{ini.metric}</div>
              <div style={{ fontSize: 12, fontFamily: T.mono, color: T.text }}>
                {ini.metricUnit === '$' ? `$${(ini.baselineValue / 1e6).toFixed(0)}M` : `${ini.baselineValue}${ini.metricUnit}`}
              </div>
              <div style={{ fontSize: 12, fontFamily: T.mono, color: statusColor }}>
                {ini.metricUnit === '$' ? `$${(ini.currentValue / 1e6).toFixed(1)}M` : `${ini.currentValue}${ini.metricUnit}`}
              </div>
              <div style={{ fontSize: 12, fontFamily: T.mono, color: T.secondary }}>
                {ini.metricUnit === '$' ? `$${(ini.targetValue / 1e6).toFixed(0)}M` : `${ini.targetValue}${ini.metricUnit}`}
              </div>
              <div>
                <ProgressBar value={progress} expected={expectedProgress} color={statusColor} />
                <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginTop: 4 }}>
                  {progress}% of target
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
                Next milestone: {ini.nextMilestone}
              </div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
                Outcome fee triggered: {ini.verifiedValue > 0 ? `$${(calcOutcomeFee(ini.verifiedValue, 0.15) / 1e6).toFixed(1)}M` : '$0 (threshold: $5M verified)'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Deep Dive tab ─────────────────────────────────────────────────────────────
function DeepDiveTab() {
  const [selectedId, setSelectedId] = useState('rcm-ai')
  const ini = MERIDIAN_INITIATIVES.find(i => i.id === selectedId)!
  const progress = calcProgress(ini.baselineValue, ini.currentValue, ini.targetValue)
  const expectedProgress = Math.round((ini.dayInProgramme / ini.totalProgrammeDays) * 100)
  const variance = calcVariance(ini.baselineValue, ini.currentValue, ini.expectedCurrentValue, ini.directionIsDown)
  const statusColor = ini.status === 'on_track' ? T.teal : ini.status === 'warning' ? T.amber : T.red

  return (
    <div>
      {/* Initiative selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {MERIDIAN_INITIATIVES.map(i => (
          <button
            key={i.id}
            onClick={() => setSelectedId(i.id)}
            style={{
              padding: '8px 16px',
              background: selectedId === i.id ? T.teal : T.surface,
              color: selectedId === i.id ? T.bg : T.secondary,
              border: `1px solid ${selectedId === i.id ? T.teal : T.border}`,
              borderRadius: 8, cursor: 'pointer',
              fontSize: 12, fontFamily: T.mono,
            }}
          >
            {i.name}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 20, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
        {ini.name} — Full Tracking
      </div>

      {/* Metric trend chart (simplified text-based) */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: 20, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>
          METRIC TREND — {ini.metric.toUpperCase()}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.secondary, lineHeight: 2 }}>
          {ini.metricUnit === '$'
            ? `$${(ini.baselineValue / 1e6).toFixed(0)}M ─────────────────● (current: $${(ini.currentValue / 1e6).toFixed(1)}M)`
            : `${ini.baselineValue}${ini.metricUnit} ─────────────────● (current: ${ini.currentValue}${ini.metricUnit})`
          }
        </div>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, marginTop: 8 }}>
          ↓ trajectory toward {ini.metricUnit === '$' ? `$${(ini.targetValue / 1e6).toFixed(0)}M` : `${ini.targetValue}${ini.metricUnit}`} target by {ini.milestones.find(m => !m.done)?.date}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {['Baseline', '3mo', '6mo', '9mo', '12mo', '18mo', '24mo'].map(label => (
            <button key={label} style={{
              padding: '4px 10px', background: label === 'Baseline' ? T.teal : 'transparent',
              color: label === 'Baseline' ? T.bg : T.secondary,
              border: `1px solid ${T.border}`, borderRadius: 6,
              fontSize: 10, fontFamily: T.mono, cursor: 'pointer',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Milestone tracker */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: 20, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>MILESTONE TRACKER</div>
        {ini.milestones.map(m => (
          <div key={m.label} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: `2px solid ${m.done ? T.teal : m.current ? T.amber : T.border}`,
              background: m.done ? T.teal : 'transparent',
              flexShrink: 0, marginTop: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {m.done && <span style={{ color: T.bg, fontSize: 8 }}>✓</span>}
              {m.current && !m.done && <span style={{ color: T.amber, fontSize: 8 }}>●</span>}
            </div>
            <div>
              <span style={{ fontSize: 12, fontFamily: T.sans, color: m.done ? T.text : T.secondary }}>
                {m.label}
              </span>
              {'note' in m && m.note && (
                <span style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginLeft: 8 }}>
                  ({m.note})
                </span>
              )}
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginLeft: 8 }}>
                {m.date}
              </span>
              {m.current && !m.done && (
                <span style={{ fontSize: 10, fontFamily: T.mono, color: T.teal, marginLeft: 8 }}>← NEXT</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Variance analysis */}
      <div style={{
        background: T.surface, border: `1px solid ${variance.ahead ? T.teal : T.amber}`,
        borderRadius: 10, padding: 20, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>VARIANCE ANALYSIS</div>
        <div style={{ fontSize: 12, fontFamily: T.mono, color: T.secondary, lineHeight: 1.8 }}>
          Expected at Day {ini.dayInProgramme}: {ini.metricUnit === '$'
            ? `$${(ini.expectedCurrentValue / 1e6).toFixed(1)}M`
            : `${ini.baselineValue}${ini.metricUnit} → ${ini.expectedCurrentValue}${ini.metricUnit}`
          }<br />
          Actual at Day {ini.dayInProgramme}: {ini.metricUnit === '$'
            ? `$${(ini.currentValue / 1e6).toFixed(1)}M`
            : `${ini.baselineValue}${ini.metricUnit} → ${ini.currentValue}${ini.metricUnit}`
          }<br />
          Variance: <span style={{ color: T.text }}>
            {Math.abs(variance.variancePP).toFixed(1)}{ini.metricUnit === '%' ? 'pp' : ''} {variance.ahead ? 'AHEAD' : 'BEHIND'} of expected trajectory {variance.ahead ? '✓' : '⚠'}
          </span>
        </div>
        {ini.whyAhead.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontFamily: T.mono, color: T.teal, marginBottom: 6 }}>
              {variance.ahead ? 'WHY AHEAD:' : 'WHY BEHIND:'}
            </div>
            {ini.whyAhead.map(why => (
              <div key={why} style={{ fontSize: 12, fontFamily: T.sans, color: T.text, marginBottom: 4 }}>
                · {why}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next milestone detail */}
      <div style={{
        background: 'rgba(45,212,200,0.06)',
        border: `1px solid rgba(45,212,200,0.25)`,
        borderRadius: 10, padding: 20,
      }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, marginBottom: 8 }}>NEXT MILESTONE</div>
        <div style={{ fontSize: 14, fontFamily: T.sans, fontWeight: 700, color: T.text, marginBottom: 12 }}>
          {ini.nextMilestone}
        </div>
        <div style={{ fontSize: 12, fontFamily: T.mono, color: T.secondary }}>
          Current: {ini.metricUnit === '$'
            ? `$${(ini.currentValue / 1e6).toFixed(1)}M`
            : `${ini.currentValue}${ini.metricUnit}`
          } ← PASSING
        </div>
      </div>
    </div>
  )
}

// ── Verification tab ──────────────────────────────────────────────────────────
function VerificationTab() {
  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
        Outcome Verification
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pending */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>PENDING VERIFICATION</div>
          <div style={{ fontSize: 13, fontFamily: T.sans, color: T.text, marginBottom: 8 }}>
            No verifications pending.
          </div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, lineHeight: 1.8 }}>
            Next eligible: April 13, 2027 (12-month mark)<br />
            Threshold for third-party audit: $5M verified savings
          </div>
        </div>

        {/* Projected */}
        <div style={{ background: T.surface, border: `1px solid ${T.teal}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, marginBottom: 12 }}>PROJECTED VERIFICATION</div>
          <div style={{ fontSize: 22, fontFamily: T.mono, color: T.teal, marginBottom: 8 }}>$8-12M</div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, lineHeight: 1.8 }}>
            Expected first verification: October 2026<br />
            Expected amount: $8-12M annual savings<br />
            Expected fee: $1.2-2.4M (15-20%)
          </div>
        </div>
      </div>

      {/* Process */}
      <div style={{ marginTop: 24, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, maxWidth: 600 }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>
          HOW VERIFICATION WORKS
        </div>
        {[
          'AbarVa proposes outcome measurement with methodology',
          'Client reviews and confirms the numbers',
          'Third-party auditor confirms for savings >$5M',
          'Fee calculated: 15-20% of verified savings above baseline',
          'Record locked — immutable, cannot be changed',
          'Invoice issued',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: T.surface, border: `1px solid ${T.border}`,
              fontSize: 10, fontFamily: T.mono, color: T.teal,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 12, fontFamily: T.sans, color: T.text, lineHeight: 1.6 }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Baseline document */}
      <div style={{
        marginTop: 24, background: 'rgba(45,212,200,0.06)',
        border: `1px solid rgba(45,212,200,0.25)`,
        borderRadius: 10, padding: 20, maxWidth: 600,
      }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, marginBottom: 12 }}>
          🔒 BASELINE DOCUMENT (locked April 13, 2026)
        </div>
        <div style={{ fontSize: 12, fontFamily: T.mono, color: T.secondary, lineHeight: 1.8 }}>
          Denial rate: 18.2% — Meridian Health System claims data<br />
          Methodology: AbarVa Outcome Attribution Framework v2.1<br />
          Signed by: Marcus Webb (CIO) + AbarVa Maestro
        </div>
        <button style={{
          marginTop: 16, padding: '8px 18px',
          background: T.teal, color: T.bg,
          border: 'none', borderRadius: 8,
          fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
        }}>
          Download baseline document →
        </button>
      </div>
    </div>
  )
}

// ── Early Warning tab ─────────────────────────────────────────────────────────
function EarlyWarningTab() {
  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
        Early Warning System
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '4px 12px', background: 'rgba(245,158,11,0.06)',
        border: `1px solid ${T.border}`, borderRadius: 20,
        marginBottom: 24, fontSize: 11, fontFamily: T.mono, color: T.secondary,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber, flexShrink: 0 }} />
        ACTIVE FLAGS: 1 warning
      </div>

      {/* Active warning */}
      <div style={{
        background: 'rgba(245,158,11,0.08)',
        border: `1px solid ${T.amber}`,
        borderRadius: 10, padding: 20, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: T.amber, fontSize: 16 }}>🟡</span>
          <div style={{ fontSize: 14, fontFamily: T.sans, fontWeight: 700, color: T.text }}>
            ADOPTION RATE SLOWING — RCM AI Automation
          </div>
        </div>
        <div style={{ fontSize: 12, fontFamily: T.sans, color: T.text, lineHeight: 1.6, marginBottom: 12 }}>
          Pattern detected: User adoption plateaued at 67% in month 3.
        </div>
        <div style={{ padding: '10px 14px', background: T.bg, borderRadius: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>FROM GENOME</div>
          <div style={{ fontSize: 12, fontFamily: T.sans, color: T.text, lineHeight: 1.6 }}>
            9 of 16 failures showed this same adoption plateau pattern.<br />
            The 7 that recovered: all had executive champion re-engagement.
          </div>
        </div>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12, lineHeight: 1.8 }}>
          RECOMMENDED ACTION:<br />
          Schedule CIO review with clinical staff leads.<br />
          Target: adoption back to 75%+ by end of month.
        </div>
        <button style={{
          padding: '8px 18px', background: T.teal, color: T.bg,
          border: 'none', borderRadius: 8, fontSize: 12,
          fontFamily: T.mono, cursor: 'pointer',
        }}>
          Generate adoption brief for CIO →
        </button>
      </div>

      {/* Cleared flags */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: 20, marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>
          CLEARED FLAGS: 2 (this month)
        </div>
        {[
          'Data quality flag cleared — prior auth data now 68% complete',
          'Timeline flag cleared — pilot milestone hit on schedule',
        ].map(flag => (
          <div key={flag} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ color: T.green, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 12, fontFamily: T.sans, color: T.secondary }}>{flag}</span>
          </div>
        ))}
      </div>

      {/* Genome prediction */}
      <div style={{
        background: 'rgba(45,212,200,0.06)',
        border: `1px solid rgba(45,212,200,0.25)`,
        borderRadius: 10, padding: 20, maxWidth: 500,
      }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, marginBottom: 8 }}>
          GENOME PREDICTION
        </div>
        <div style={{ fontSize: 22, fontFamily: T.mono, color: T.teal, marginBottom: 4 }}>76%</div>
        <div style={{ fontSize: 12, fontFamily: T.sans, color: T.text, marginBottom: 8 }}>
          probability of achieving base case
        </div>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
          Up from 56% at start, after mitigations were applied
        </div>
      </div>
    </div>
  )
}

// ── Board Report tab ──────────────────────────────────────────────────────────
function BoardReportTab() {
  const portfolioData = MERIDIAN_INITIATIVES.map(i => ({
    committedValue: i.committedValue, verifiedValue: i.verifiedValue, status: i.status,
  }))
  const summary = calcPortfolioSummary(portfolioData)

  return (
    <div>
      <div style={{ fontSize: 28, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
        Quarterly Board Report
      </div>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 12, padding: 32, maxWidth: 700,
      }}>
        <div style={{ fontSize: 12, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>
          QUARTERLY BOARD REPORT — Q2 2026
        </div>
        <div style={{ fontSize: 16, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
          Meridian Health System · AI Investment Portfolio
        </div>

        {/* Executive summary */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>
            EXECUTIVE SUMMARY:
          </div>
          {[
            `${MERIDIAN_INITIATIVES.length} AI initiatives active · $${(summary.totalCommitted / 1e6).toFixed(0)}M value committed`,
            `$${(summary.totalVerified / 1e6).toFixed(1)}M annual value verified to date (${Math.round(summary.totalVerified / summary.totalCommitted * 100)}% of committed)`,
            `${summary.onTrackCount} of ${MERIDIAN_INITIATIVES.length} initiatives on track · 1 showing early warning signal`,
          ].map(line => (
            <div key={line} style={{ fontSize: 12, fontFamily: T.sans, color: T.text, marginBottom: 6 }}>· {line}</div>
          ))}
        </div>

        {/* Initiative status table */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>INITIATIVE STATUS:</div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {MERIDIAN_INITIATIVES.map((ini, i) => {
              const progress = calcProgress(ini.baselineValue, ini.currentValue, ini.targetValue)
              const statusColor = ini.status === 'on_track' ? T.teal : T.amber
              return (
                <div key={ini.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '10px 16px',
                  borderBottom: i < MERIDIAN_INITIATIVES.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <span style={{ fontSize: 12, fontFamily: T.sans, color: T.text }}>{ini.name}</span>
                  <span style={{ fontSize: 11, fontFamily: T.mono, color: statusColor }}>
                    {ini.status === 'on_track' ? '✓ On track' : '⚠ Warning'}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
                    {progress}% complete
                  </span>
                  <span style={{ fontSize: 11, fontFamily: T.mono, color: T.teal }}>
                    ${(ini.committedValue / 1e6).toFixed(0)}M target
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* AbarVa accountability */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(45,212,200,0.06)',
          border: `1px solid rgba(45,212,200,0.25)`,
          borderRadius: 8, marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, marginBottom: 10 }}>
            ABARVA ACCOUNTABILITY:
          </div>
          {[
            `Outcome fees triggered to date: $${(calcOutcomeFee(summary.totalVerified, 0.15) / 1e6).toFixed(1)}M`,
            `Fees projected at full delivery: $${(calcOutcomeFee(summary.totalCommitted, 0.175) / 1e6).toFixed(1)}M`,
            `AbarVa has earned nothing on the $${((summary.totalCommitted - summary.totalVerified) / 1e6).toFixed(1)}M not yet verified.`,
            'Our fee tracks your success.',
          ].map(line => (
            <div key={line} style={{ fontSize: 12, fontFamily: T.sans, color: T.text, marginBottom: 4 }}>
              {line}
            </div>
          ))}
        </div>

        {/* Next quarter milestones */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>
            NEXT QUARTER MILESTONES:
          </div>
          {[
            'RCM AI: 6-month review — confirm trajectory',
            'Prior Auth: vendor go-live — October 2026',
            'Epic Sprint: 90-day results review',
          ].map(m => (
            <div key={m} style={{ fontSize: 12, fontFamily: T.sans, color: T.text, marginBottom: 6 }}>
              · {m}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{
            padding: '10px 20px', background: T.teal, color: T.bg,
            border: 'none', borderRadius: 8, fontSize: 12,
            fontFamily: T.mono, cursor: 'pointer',
          }}>
            Download Board Report →
          </button>
          <button style={{
            padding: '10px 20px', background: 'transparent',
            border: `1px solid ${T.border}`, color: T.secondary,
            borderRadius: 8, fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
          }}>
            Send to Board →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page content ─────────────────────────────────────────────────────────
function OutcomeIntelligenceContent() {
  const { clientId, allowedClients, isAdmin } = useClientContext()
  const [client, setClient] = useState<Client>(clientId as Client)
  const [activeTab, setActiveTab] = useState<Tab>('portfolio')
  const [showClientMenu, setShowClientMenu] = useState(false)

  const portfolioData = MERIDIAN_INITIATIVES.map(i => ({
    committedValue: i.committedValue, verifiedValue: i.verifiedValue, status: i.status,
  }))
  const summary = calcPortfolioSummary(portfolioData)

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'portfolio', label: 'Portfolio Overview' },
    { id: 'deepdive', label: 'Initiative Deep Dive' },
    { id: 'verification', label: 'Outcome Verification' },
    { id: 'warning', label: 'Early Warning' },
    { id: 'board', label: 'Board Report' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.sans }}>
      <AbarvaNav />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }` }} />

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${T.border}`, padding: '20px 32px',
        position: 'sticky', top: 0, zIndex: 10, background: T.bg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, letterSpacing: '0.12em', marginBottom: 4 }}>
              OUTCOME INTELLIGENCE
            </div>
            <div style={{ fontSize: 20, fontFamily: T.fraunces, color: T.text, maxWidth: 560 }}>
              &ldquo;Are our AI investments delivering — and can we prove it to the board?&rdquo;
            </div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginTop: 8 }}>
              Portfolio: {MERIDIAN_INITIATIVES.length} initiatives &nbsp;·&nbsp; Value committed: ${(summary.totalCommitted / 1e6).toFixed(0)}M &nbsp;·&nbsp; Verified: ${(summary.totalVerified / 1e6).toFixed(1)}M
            </div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginTop: 2 }}>
              Outcome fees triggered: ${(calcOutcomeFee(summary.totalVerified, 0.15) / 1e6).toFixed(1)}M &nbsp;·&nbsp; Fees projected: ${(calcOutcomeFee(summary.totalCommitted, 0.175) / 1e6).toFixed(1)}M
            </div>
          </div>
          {/* Client selector — admin only */}
          {isAdmin && <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowClientMenu(m => !m)}
              style={{
                padding: '8px 16px', background: T.surface,
                border: `1px solid ${T.border}`, color: T.text,
                borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: T.mono,
              }}
            >
              {ALL_CLIENTS.find(c => c.id === client)?.shortName || client} ▾
            </button>
            {showClientMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 8, overflow: 'hidden', zIndex: 20, minWidth: 180,
              }}>
                {allowedClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setClient(c.id as Client); setShowClientMenu(false) }}
                    style={{
                      width: '100%', padding: '10px 16px',
                      background: c.id === client ? 'rgba(45,212,200,0.1)' : 'transparent',
                      color: c.id === client ? T.teal : T.text,
                      border: 'none', cursor: 'pointer',
                      fontSize: 13, fontFamily: T.mono, textAlign: 'left',
                    }}
                  >
                    {c.shortName}
                  </button>
                ))}
              </div>
            )}
          </div>}
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: 0, marginTop: 16, overflowX: 'auto', borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: activeTab === tab.id ? T.teal : T.secondary,
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${T.teal}` : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 12, fontFamily: T.mono,
                whiteSpace: 'nowrap',
                marginBottom: -1,
              }}
            >
              {tab.label}
              {tab.id === 'warning' && (
                <span style={{
                  marginLeft: 6, fontSize: 9, padding: '1px 5px',
                  background: T.amber, color: T.bg, borderRadius: 8,
                }}>1</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 48px 64px', animation: 'fadein 0.3s ease-out' }}>
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'deepdive' && <DeepDiveTab />}
        {activeTab === 'verification' && <VerificationTab />}
        {activeTab === 'warning' && <EarlyWarningTab />}
        {activeTab === 'board' && <BoardReportTab />}
      </div>
    </div>
  )
}

export default function OutcomeIntelligencePage() {
  return (
    <Suspense>
      <OutcomeIntelligenceContent />
    </Suspense>
  )
}
