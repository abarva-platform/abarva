'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  calcAnnualValue,
  calcNetValue,
  calcROI,
  calcPaybackMonths,
  calcAdjustedProbability,
  calcRiskAdjustedNPV,
} from '@/lib/business-case'
import { supabase } from '@/lib/supabase'

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
type RoleMode = 'CIO' | 'CFO'
type Section = 1 | 2 | 3 | 4 | 5
type Client = 'meridian' | 'firstcapital' | 'apexretail'

const CLIENT_LABELS: Record<Client, string> = {
  meridian: 'Meridian Health',
  firstcapital: 'First Capital Bank',
  apexretail: 'Apex Retail',
}

// ── Client data ───────────────────────────────────────────────────────────────
const CLIENT_DATA: Record<Client, {
  initiative: string
  baselineMetricLabel: string
  baselineValue: number
  baselinePP: number         // $ per percentage point
  improvementPP: number
  year1Investment: number
  annualOngoing: number
  successProbabilityBase: number
  baselineMetrics: Array<{ label: string; value: string; source: string }>
  riskAdjustments: Array<{ delta: number; reason: string; sign: '+' | '-' }>
  mitigations: Array<{ delta: number; action: string }>
  boardConditions: string[]
}> = {
  meridian: {
    initiative: 'RCM AI Automation',
    baselineMetricLabel: 'Denial rate',
    baselineValue: 18.2,
    baselinePP: 13_800_000,
    improvementPP: 6.1,
    year1Investment: 6_200_000,
    annualOngoing: 3_800_000,
    successProbabilityBase: 0.66,
    baselineMetrics: [
      { label: 'Denial rate', value: '18.2%', source: 'from claims data' },
      { label: 'Revenue impacted per point', value: '$13.8M', source: 'calculated from claims volume' },
      { label: 'Cost to collect per claim', value: '$28.40', source: 'from financials' },
      { label: 'Prior auth cycle time', value: '4.2 days', source: 'from clinical data' },
      { label: 'Travel nurse spend', value: '$48M/yr', source: 'from financials' },
    ],
    riskAdjustments: [
      { delta: 0.08, reason: 'Strong data readiness (67%)', sign: '+' },
      { delta: -0.12, reason: 'CDO vacancy', sign: '-' },
      { delta: -0.06, reason: 'Prior auth data gap (23%)', sign: '-' },
    ],
    mitigations: [
      { delta: 0.12, action: 'Appoint CDO interim' },
      { delta: 0.08, action: '30-day data sprint' },
    ],
    boardConditions: [
      'CDO interim appointed before vendor contract signed',
      'Prior auth data coverage reaches 40% before pilot',
    ],
  },
  firstcapital: {
    initiative: 'Fraud Detection ML',
    baselineMetricLabel: 'Fraud loss rate',
    baselineValue: 0.18,
    baselinePP: 8_500_000,
    improvementPP: 0.08,
    year1Investment: 3_200_000,
    annualOngoing: 1_800_000,
    successProbabilityBase: 0.62,
    baselineMetrics: [
      { label: 'Fraud loss rate', value: '0.18%', source: 'from transaction data' },
      { label: 'AML false positive rate', value: '78%', source: 'from compliance data' },
      { label: 'Digital adoption', value: '41%', source: 'from customer data' },
      { label: 'FedNow compliance', value: 'Not compliant', source: 'Jan 2027 deadline' },
    ],
    riskAdjustments: [
      { delta: 0.05, reason: 'Real-time data infrastructure ready', sign: '+' },
      { delta: -0.08, reason: 'Core system age (22 years)', sign: '-' },
      { delta: -0.04, reason: 'FedNow timeline pressure', sign: '-' },
    ],
    mitigations: [
      { delta: 0.10, action: 'FedNow API layer first' },
      { delta: 0.06, action: 'Legacy data remediation sprint' },
    ],
    boardConditions: [
      'FedNow API layer complete before model go-live',
      'Real-time data pipeline validated before pilot',
    ],
  },
  apexretail: {
    initiative: 'Personalisation Engine',
    baselineMetricLabel: 'Personalisation adoption',
    baselineValue: 22,
    baselinePP: 4_200_000,
    improvementPP: 24,
    year1Investment: 4_800_000,
    annualOngoing: 2_400_000,
    successProbabilityBase: 0.60,
    baselineMetrics: [
      { label: 'Personalisation adoption', value: '22%', source: 'from digital analytics' },
      { label: 'Cart abandonment rate', value: '68%', source: 'from e-commerce data' },
      { label: 'Digital revenue share', value: '28%', source: 'from financials' },
      { label: 'Loyalty active rate', value: '44%', source: 'from CRM data' },
    ],
    riskAdjustments: [
      { delta: 0.06, reason: 'Salesforce Einstein licence already active', sign: '+' },
      { delta: -0.10, reason: 'CDP fragmentation unresolved', sign: '-' },
      { delta: -0.05, reason: 'Customer identity resolution incomplete', sign: '-' },
    ],
    mitigations: [
      { delta: 0.12, action: 'Resolve CDP fragmentation first' },
      { delta: 0.08, action: 'Identity resolution sprint' },
    ],
    boardConditions: [
      'CDP fragmentation resolved before personalisation go-live',
      'Customer identity resolution at 90%+ before pilot',
    ],
  },
}

// ── Slider component ──────────────────────────────────────────────────────────
function Slider({
  label, min, max, step, value, onChange, suffix = '',
}: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: T.mono, color: T.teal }}>
          {typeof value === 'number' ? value.toFixed(1) : value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: T.teal }}
      />
    </div>
  )
}

// ── CFO Challenge modal ───────────────────────────────────────────────────────
function CfoChallengeModal({
  assumption, onClose, clientData,
}: {
  assumption: string; onClose: () => void;
  clientData: typeof CLIENT_DATA['meridian'];
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12, padding: 32,
        maxWidth: 560, width: '90vw',
      }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.amber, marginBottom: 8 }}>
          CFO CHALLENGE
        </div>
        <div style={{ fontSize: 16, fontFamily: T.fraunces, color: T.text, marginBottom: 20 }}>
          &ldquo;{assumption}&rdquo;
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {[
            {
              source: 'FROM YOUR DATA',
              color: T.teal,
              text: `Your denial rate of ${clientData.baselineValue}% × ${clientData.improvementPP.toFixed(1)}pp improvement × $${(clientData.baselinePP / 1e6).toFixed(1)}M per point = $${(clientData.improvementPP * clientData.baselinePP / 1e6).toFixed(0)}M. The math uses your actual data.`,
            },
            {
              source: 'FROM INDUSTRY',
              color: T.indigo,
              text: `47 similar deployments. Median improvement: 5.8pp. Your estimate of ${clientData.improvementPP.toFixed(1)}pp is conservative — 54th percentile outcome.`,
            },
            {
              source: 'FROM GENOME',
              color: '#F472B6',
              text: `Health systems at your data readiness achieved an average of 5.9pp improvement in 14 months. The number is defensible.`,
            },
          ].map(({ source, color, text }) => (
            <div key={source} style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 8, padding: 16,
            }}>
              <div style={{ fontSize: 9, fontFamily: T.mono, color, marginBottom: 6 }}>{source}</div>
              <div style={{ fontSize: 12, fontFamily: T.sans, color: T.text, lineHeight: 1.6 }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{
            padding: '10px 20px', background: T.teal, color: T.bg,
            border: 'none', borderRadius: 8, fontSize: 12,
            fontFamily: T.mono, cursor: 'pointer',
          }}>
            Adjust assumption →
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', background: 'transparent',
              border: `1px solid ${T.border}`, color: T.secondary,
              borderRadius: 8, fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
            }}
          >
            Accept — number is defensible
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Business Case content ─────────────────────────────────────────────────────
function BusinessCaseContent() {
  const searchParams = useSearchParams()
  const clientParam = (searchParams.get('client') as Client) || 'meridian'
  const [client, setClient] = useState<Client>(clientParam)
  const [role, setRole] = useState<RoleMode>('CIO')
  const [activeSection, setActiveSection] = useState<Section>(1)
  const [showClientMenu, setShowClientMenu] = useState(false)
  const [challenge, setChallenge] = useState<string | null>(null)
  const [approved, setApproved] = useState<Set<Section>>(new Set())
  const [baselineLocked, setBaselineLocked] = useState(false)
  const [locking, setLocking] = useState(false)

  const cd = CLIENT_DATA[client]

  // Slider state — scenario builder
  const [improvementPP, setImprovementPP] = useState(cd.improvementPP)
  const [adoptionRate, setAdoptionRate] = useState(85)
  const [timeToValue, setTimeToValue] = useState(14)

  // Reset sliders on client change
  useEffect(() => {
    const d = CLIENT_DATA[client]
    setImprovementPP(d.improvementPP)
  }, [client])

  // Scenario calculations
  const scenarios = {
    conservative: {
      pp: improvementPP * 0.57,
      adoption: adoptionRate * 0.88 / 100,
      label: 'CONSERVATIVE',
    },
    base: {
      pp: improvementPP,
      adoption: adoptionRate / 100,
      label: 'BASE CASE',
    },
    optimistic: {
      pp: improvementPP * 1.36,
      adoption: Math.min(0.95, adoptionRate * 1.08 / 100),
      label: 'OPTIMISTIC',
    },
  }

  const calcScenario = (pp: number, adoption: number) => {
    const annual = calcAnnualValue(pp, cd.baselinePP, adoption)
    const net3yr = calcNetValue(annual, cd.year1Investment, cd.annualOngoing, 3)
    const totalInv = cd.year1Investment + cd.annualOngoing * 2
    const roi = calcROI(annual, totalInv)
    const payback = calcPaybackMonths(cd.year1Investment, annual / 12)
    return { annual, net3yr, roi, payback }
  }

  const scenarioResults = {
    conservative: calcScenario(scenarios.conservative.pp, scenarios.conservative.adoption),
    base: calcScenario(scenarios.base.pp, scenarios.base.adoption),
    optimistic: calcScenario(scenarios.optimistic.pp, scenarios.optimistic.adoption),
  }

  // Risk adjustment
  const adjustedProb = calcAdjustedProbability(cd.successProbabilityBase, cd.riskAdjustments)
  const allAdjustments = [...cd.riskAdjustments, ...cd.mitigations.map(m => ({ delta: m.delta }))]
  const mitigatedProb = calcAdjustedProbability(adjustedProb, cd.mitigations.map(m => ({ delta: m.delta })))
  const riskAdjNPV = calcRiskAdjustedNPV(scenarioResults.base.net3yr, mitigatedProb)

  const totalInvestment3yr = cd.year1Investment + cd.annualOngoing * 2

  async function handleLockBaseline() {
    setLocking(true)
    try {
      await supabase.from('ai_baselines').insert({
        client_id: client,
        locked_at: new Date().toISOString(),
        initiative: cd.initiative,
        baseline_value: cd.baselineValue,
        baseline_label: cd.baselineMetricLabel,
        revenue_per_pp: cd.baselinePP,
        year1_investment: cd.year1Investment,
        annual_ongoing: cd.annualOngoing,
        success_probability: mitigatedProb,
        locked_by: role,
      })
      setBaselineLocked(true)
    } catch {
      setBaselineLocked(true) // demo mode
    } finally {
      setLocking(false)
    }
  }

  const sectionLabels: Record<Section, string> = {
    1: 'The Investment',
    2: 'The Baseline',
    3: 'Three Scenarios',
    4: 'Risk-Adjusted Return',
    5: 'Board Brief',
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.sans }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }` }} />

      {challenge && (
        <CfoChallengeModal
          assumption={challenge}
          onClose={() => setChallenge(null)}
          clientData={cd}
        />
      )}

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${T.border}`, padding: '20px 32px',
        position: 'sticky', top: 0, zIndex: 10, background: T.bg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, letterSpacing: '0.12em', marginBottom: 4 }}>
              BUSINESS CASE INTELLIGENCE
            </div>
            <div style={{ fontSize: 20, fontFamily: T.fraunces, color: T.text, maxWidth: 560 }}>
              &ldquo;What&apos;s the ROI — and how do I defend it in the board room?&rdquo;
            </div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginTop: 8 }}>
              Initiative: {cd.initiative} &nbsp;·&nbsp; Data confidence: 94% &nbsp;·&nbsp; Genome comparables: 47 &nbsp;·&nbsp; Scenarios: 3
            </div>
          </div>
          {/* Client + role selectors */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Role switcher */}
            <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {(['CIO', 'CFO'] as RoleMode[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    padding: '8px 16px',
                    background: role === r ? T.teal : 'transparent',
                    color: role === r ? T.bg : T.secondary,
                    border: 'none', cursor: 'pointer',
                    fontSize: 12, fontFamily: T.mono,
                  }}
                >
                  {r === 'CIO' ? 'CIO building' : 'CFO validating'}
                </button>
              ))}
            </div>
            {/* Client selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowClientMenu(m => !m)}
                style={{
                  padding: '8px 16px', background: T.surface,
                  border: `1px solid ${T.border}`, color: T.text,
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: T.mono,
                }}
              >
                {CLIENT_LABELS[client]} ▾
              </button>
              {showClientMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 4,
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 8, overflow: 'hidden', zIndex: 20, minWidth: 180,
                }}>
                  {(['meridian', 'firstcapital', 'apexretail'] as Client[]).map(c => (
                    <button
                      key={c}
                      onClick={() => { setClient(c); setShowClientMenu(false) }}
                      style={{
                        width: '100%', padding: '10px 16px',
                        background: c === client ? 'rgba(45,212,200,0.1)' : 'transparent',
                        color: c === client ? T.teal : T.text,
                        border: 'none', cursor: 'pointer',
                        fontSize: 13, fontFamily: T.mono, textAlign: 'left',
                      }}
                    >
                      {CLIENT_LABELS[c]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section navigator */}
        <div style={{ display: 'flex', gap: 0, marginTop: 16, overflowX: 'auto' }}>
          {([1, 2, 3, 4, 5] as Section[]).map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              style={{
                fontSize: 11, fontFamily: T.mono, padding: '8px 16px',
                background: activeSection === s ? T.teal : 'transparent',
                color: activeSection === s ? T.bg : T.secondary,
                border: 'none', cursor: 'pointer', borderRadius: 6,
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              {approved.has(s) && role === 'CFO' && (
                <span style={{ position: 'absolute', top: 2, right: 4, color: T.green, fontSize: 9 }}>✓</span>
              )}
              {s}. {sectionLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 32px 64px', animation: 'fadein 0.3s ease-out' }}>

        {/* Section 1 — The Investment */}
        {activeSection === 1 && (
          <div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>SECTION 1 OF 5</div>
            <div style={{ fontSize: 28, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
              The Investment
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, maxWidth: 560 }}>
              <div style={{ fontSize: 13, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>
                INVESTMENT SUMMARY — {cd.initiative.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>YEAR 1:</div>
              {[
                { label: 'Implementation fee', value: 1_500_000, note: 'from Vendor Intelligence' },
                { label: 'Platform license', value: 3_500_000, note: 'from Vendor Intelligence' },
                { label: 'Internal resources', value: 800_000, note: 'estimated from org size' },
                { label: 'Change management', value: 400_000, note: 'Genome recommendation' },
              ].map(({ label, value, note }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontFamily: T.sans, color: T.text }}>{label}</span>
                    <span style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary, marginLeft: 8 }}>← {note}</span>
                  </div>
                  <span style={{ fontSize: 13, fontFamily: T.mono, color: T.text }}>
                    ${(value / 1e6).toFixed(1)}M
                  </span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontFamily: T.sans, fontWeight: 700, color: T.text }}>Year 1 total</span>
                <span style={{ fontSize: 14, fontFamily: T.mono, color: T.teal }}>${(cd.year1Investment / 1e6).toFixed(1)}M</span>
              </div>
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 8 }}>ONGOING (Year 2+):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontFamily: T.sans, color: T.text }}>Annual platform</span>
                  <span style={{ fontSize: 13, fontFamily: T.mono, color: T.text }}>${(cd.annualOngoing * 0.92 / 1e6).toFixed(1)}M</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontFamily: T.sans, color: T.text }}>Internal maintenance</span>
                  <span style={{ fontSize: 13, fontFamily: T.mono, color: T.text }}>${(cd.annualOngoing * 0.08 / 1e6).toFixed(1)}M</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontFamily: T.sans, fontWeight: 700, color: T.text }}>Annual ongoing</span>
                  <span style={{ fontSize: 14, fontFamily: T.mono, color: T.teal }}>${(cd.annualOngoing / 1e6).toFixed(1)}M</span>
                </div>
              </div>
              <div style={{
                marginTop: 16, borderTop: `2px solid ${T.teal}`, paddingTop: 12,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 15, fontFamily: T.sans, fontWeight: 700, color: T.text }}>3-YEAR TOTAL INVESTMENT</span>
                <span style={{ fontSize: 15, fontFamily: T.mono, fontWeight: 700, color: T.teal }}>
                  ${(totalInvestment3yr / 1e6).toFixed(1)}M
                </span>
              </div>
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(45,212,200,0.06)', borderRadius: 6 }}>
                <span style={{ fontSize: 9, fontFamily: T.mono, color: T.teal }}>FROM INDUSTRY</span>
                <div style={{ fontSize: 11, fontFamily: T.sans, color: T.text, marginTop: 4 }}>
                  This pricing is in the 40th percentile for {cd.initiative} at your revenue scale — below average.{' '}
                  {role === 'CFO' && (
                    <button
                      onClick={() => setChallenge('Is this pricing really below market?')}
                      style={{
                        fontSize: 11, fontFamily: T.mono, color: T.amber,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}
                    >
                      [Challenge this →]
                    </button>
                  )}
                </div>
              </div>
            </div>
            {role === 'CFO' && (
              <button
                onClick={() => setApproved(p => new Set([...p, 1]))}
                style={{
                  marginTop: 16, padding: '10px 20px',
                  background: approved.has(1) ? T.green : 'transparent',
                  border: `1px solid ${approved.has(1) ? T.green : T.border}`,
                  color: approved.has(1) ? T.bg : T.secondary,
                  borderRadius: 8, fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
                }}
              >
                {approved.has(1) ? '✓ Section approved' : 'Approve this section'}
              </button>
            )}
            <button onClick={() => setActiveSection(2)} style={{
              marginTop: 16, marginLeft: approved.has(1) ? 8 : 0,
              padding: '12px 28px', background: T.teal, color: T.bg,
              border: 'none', borderRadius: 8, fontSize: 13,
              fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
            }}>
              The baseline →
            </button>
          </div>
        )}

        {/* Section 2 — The Baseline */}
        {activeSection === 2 && (
          <div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>SECTION 2 OF 5</div>
            <div style={{ fontSize: 28, fontFamily: T.fraunces, color: T.text, marginBottom: 8 }}>
              The Baseline
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 12px', background: 'rgba(45,212,200,0.08)',
              border: `1px solid rgba(45,212,200,0.3)`, borderRadius: 20,
              marginBottom: 24, fontSize: 10, fontFamily: T.mono, color: T.teal,
            }}>
              🔒 BASELINE METRICS — LOCKED APRIL 13, 2026
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 600, marginBottom: 24 }}>
              {cd.baselineMetrics.map(({ label, value, source }) => (
                <div key={label} style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: 16,
                }}>
                  <div style={{ fontSize: 9, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 18, fontFamily: T.mono, color: T.teal, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: 10, fontFamily: T.mono, color: T.secondary }}>← {source}</div>
                </div>
              ))}
            </div>
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: `1px solid rgba(239,68,68,0.25)`,
              borderRadius: 10, padding: 20, maxWidth: 500, marginBottom: 24,
            }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.red, marginBottom: 8 }}>
                COST OF INACTION (ANNUAL)
              </div>
              <div style={{ fontSize: 22, fontFamily: T.fraunces, color: T.red, marginBottom: 8 }}>
                ${((cd.baselinePP * cd.improvementPP / 12) / 1e6).toFixed(1)}M per month
              </div>
              <div style={{ fontSize: 13, fontFamily: T.sans, color: T.text, marginBottom: 12 }}>
                in recoverable revenue at current {cd.baselineMetricLabel.toLowerCase()} level. That is the baseline cost of delay.
              </div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>
                FROM GENOME: Organizations that delayed action by 6 months captured 34% less value in Year 1 than those that moved immediately.
              </div>
            </div>
            {role === 'CFO' && (
              <button
                onClick={() => setApproved(p => new Set([...p, 2]))}
                style={{
                  padding: '10px 20px',
                  background: approved.has(2) ? T.green : 'transparent',
                  border: `1px solid ${approved.has(2) ? T.green : T.border}`,
                  color: approved.has(2) ? T.bg : T.secondary,
                  borderRadius: 8, fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
                }}
              >
                {approved.has(2) ? '✓ Section approved' : 'Approve this section'}
              </button>
            )}
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setActiveSection(3)} style={{
                padding: '12px 28px', background: T.teal, color: T.bg,
                border: 'none', borderRadius: 8, fontSize: 13,
                fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
              }}>
                Build scenarios →
              </button>
            </div>
          </div>
        )}

        {/* Section 3 — Three Scenarios */}
        {activeSection === 3 && (
          <div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>SECTION 3 OF 5</div>
            <div style={{ fontSize: 28, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
              Scenario Builder
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, alignItems: 'start', flexWrap: 'wrap' }}>
              {/* Sliders */}
              <div>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>
                  ASSUMPTION SLIDERS
                </div>
                <Slider label={`${cd.baselineMetricLabel} improvement`} min={1} max={12} step={0.1} value={improvementPP} onChange={setImprovementPP} suffix="pp" />
                <Slider label="Time to full value" min={6} max={30} step={1} value={timeToValue} onChange={setTimeToValue} suffix=" mo" />
                <Slider label="Adoption rate" min={50} max={95} step={1} value={adoptionRate} onChange={setAdoptionRate} suffix="%" />
              </div>

              {/* Scenario results table */}
              <div>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 12 }}>
                  SCENARIO RESULTS
                </div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: T.surface }}>
                    {['', 'CONSERVATIVE', 'BASE CASE', 'OPTIMISTIC'].map((h, i) => (
                      <div key={i} style={{
                        padding: '10px 12px', fontSize: 9, fontFamily: T.mono,
                        color: i === 2 ? T.teal : T.secondary,
                        borderBottom: `1px solid ${T.border}`,
                      }}>
                        {h}
                      </div>
                    ))}
                    {[
                      { label: 'Improvement', values: [
                        `${(scenarios.conservative.pp).toFixed(1)}pp`,
                        `${improvementPP.toFixed(1)}pp`,
                        `${(scenarios.optimistic.pp).toFixed(1)}pp`,
                      ]},
                      { label: 'Annual value', values: [
                        `$${(scenarioResults.conservative.annual / 1e6).toFixed(0)}M`,
                        `$${(scenarioResults.base.annual / 1e6).toFixed(0)}M`,
                        `$${(scenarioResults.optimistic.annual / 1e6).toFixed(0)}M`,
                      ]},
                      { label: '3yr net value', values: [
                        `$${(scenarioResults.conservative.net3yr / 1e6).toFixed(0)}M`,
                        `$${(scenarioResults.base.net3yr / 1e6).toFixed(0)}M`,
                        `$${(scenarioResults.optimistic.net3yr / 1e6).toFixed(0)}M`,
                      ]},
                      { label: 'ROI', values: [
                        `${scenarioResults.conservative.roi}x`,
                        `${scenarioResults.base.roi}x`,
                        `${scenarioResults.optimistic.roi}x`,
                      ]},
                      { label: 'Payback', values: [
                        `${scenarioResults.conservative.payback}mo`,
                        `${scenarioResults.base.payback}mo`,
                        `${scenarioResults.optimistic.payback}mo`,
                      ]},
                    ].map(({ label, values }) => (
                      values.map((val, i) => (
                        <div key={`${label}-${i}`} style={{
                          padding: '10px 12px',
                          borderBottom: `1px solid ${T.border}`,
                          borderLeft: i === 0 ? 'none' : `1px solid ${T.border}`,
                          fontSize: i === 0 ? 11 : 12,
                          fontFamily: i === 0 ? T.mono : T.mono,
                          color: i === 0 ? T.secondary : i === 2 ? T.teal : T.text,
                        }}>
                          {i === 0 ? label : val}
                        </div>
                      ))
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(45,212,200,0.06)', borderRadius: 6 }}>
                  <span style={{ fontSize: 9, fontFamily: T.mono, color: T.teal }}>FROM GENOME</span>
                  <div style={{ fontSize: 11, fontFamily: T.sans, color: T.text, marginTop: 4 }}>
                    Base case achieved 62% of the time. Optimistic: 24%. Conservative: only 14% underperformed this.
                    {role === 'CFO' && (
                      <button
                        onClick={() => setChallenge(`The $${(scenarioResults.base.annual / 1e6).toFixed(0)}M base case seems high.`)}
                        style={{
                          fontSize: 11, fontFamily: T.mono, color: T.amber,
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8,
                        }}
                      >
                        [Challenge this →]
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {role === 'CFO' && (
              <button
                onClick={() => setApproved(p => new Set([...p, 3]))}
                style={{
                  marginTop: 16, padding: '10px 20px',
                  background: approved.has(3) ? T.green : 'transparent',
                  border: `1px solid ${approved.has(3) ? T.green : T.border}`,
                  color: approved.has(3) ? T.bg : T.secondary,
                  borderRadius: 8, fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
                }}
              >
                {approved.has(3) ? '✓ Section approved' : 'Approve this section'}
              </button>
            )}
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setActiveSection(4)} style={{
                padding: '12px 28px', background: T.teal, color: T.bg,
                border: 'none', borderRadius: 8, fontSize: 13,
                fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
              }}>
                Risk-adjusted return →
              </button>
            </div>
          </div>
        )}

        {/* Section 4 — Risk-Adjusted Return */}
        {activeSection === 4 && (
          <div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>SECTION 4 OF 5</div>
            <div style={{ fontSize: 28, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
              Risk-Adjusted Return
            </div>
            <div style={{ maxWidth: 560 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 16 }}>
                  RISK ADJUSTMENT — FROM FAILURE GENOME
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontFamily: T.sans, color: T.text }}>Unadjusted success probability</span>
                  <span style={{ fontSize: 16, fontFamily: T.mono, color: T.text }}>{Math.round(cd.successProbabilityBase * 100)}%</span>
                </div>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 10 }}>
                  MERIDIAN-SPECIFIC ADJUSTMENTS:
                </div>
                {cd.riskAdjustments.map(adj => (
                  <div key={adj.reason} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontFamily: T.sans, color: T.text }}>{adj.reason}</span>
                    <span style={{
                      fontSize: 12, fontFamily: T.mono,
                      color: adj.sign === '+' ? T.teal : T.red,
                    }}>
                      {adj.sign}{Math.round(Math.abs(adj.delta) * 100)}% probability
                    </span>
                  </div>
                ))}
                <div style={{
                  borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 12,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 14, fontFamily: T.sans, fontWeight: 700, color: T.text }}>Adjusted success probability</span>
                  <span style={{ fontSize: 18, fontFamily: T.mono, color: T.amber }}>
                    {Math.round(adjustedProb * 100)}%
                  </span>
                </div>
              </div>

              <div style={{ background: T.surface, border: `1px solid ${T.teal}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal, marginBottom: 12 }}>
                  WITH MITIGATIONS IN PLACE:
                </div>
                {cd.mitigations.map(m => (
                  <div key={m.action} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontFamily: T.sans, color: T.text }}>+ {m.action}</span>
                    <span style={{ fontSize: 12, fontFamily: T.mono, color: T.teal }}>
                      +{Math.round(m.delta * 100)}% probability
                    </span>
                  </div>
                ))}
                <div style={{
                  borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 12,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 14, fontFamily: T.sans, fontWeight: 700, color: T.text }}>Mitigated success probability</span>
                  <span style={{ fontSize: 22, fontFamily: T.mono, fontWeight: 700, color: T.teal }}>
                    {Math.round(mitigatedProb * 100)}%
                  </span>
                </div>
              </div>

              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: 24, marginBottom: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontFamily: T.sans, color: T.text }}>Risk-adjusted NPV (base case, {Math.round(mitigatedProb * 100)}% probability)</span>
                  <span style={{ fontSize: 20, fontFamily: T.mono, color: T.teal }}>
                    ${(riskAdjNPV / 1e6).toFixed(0)}M
                  </span>
                </div>
                <div style={{ fontSize: 12, fontFamily: T.mono, color: T.amber, marginTop: 8 }}>
                  RECOMMENDATION: Proceed with mitigations. Do not proceed without addressing CDO vacancy first.
                </div>
              </div>

              {role === 'CFO' && (
                <button
                  onClick={() => setApproved(p => new Set([...p, 4]))}
                  style={{
                    padding: '10px 20px',
                    background: approved.has(4) ? T.green : 'transparent',
                    border: `1px solid ${approved.has(4) ? T.green : T.border}`,
                    color: approved.has(4) ? T.bg : T.secondary,
                    borderRadius: 8, fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
                  }}
                >
                  {approved.has(4) ? '✓ Section approved' : 'Approve this section'}
                </button>
              )}
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setActiveSection(5)} style={{
                  padding: '12px 28px', background: T.teal, color: T.bg,
                  border: 'none', borderRadius: 8, fontSize: 13,
                  fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
                }}>
                  Board brief →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 5 — Board Brief */}
        {activeSection === 5 && (
          <div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>SECTION 5 OF 5</div>
            <div style={{ fontSize: 28, fontFamily: T.fraunces, color: T.text, marginBottom: 24 }}>
              Board Recommendation
            </div>
            <div style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 12, padding: 32, maxWidth: 600,
            }}>
              <div style={{ fontSize: 12, fontFamily: T.mono, color: T.secondary, marginBottom: 4 }}>
                {CLIENT_LABELS[client]} · {cd.initiative} · April 2026
              </div>
              {[
                { label: 'THE INVESTMENT', value: `$${(totalInvestment3yr / 1e6).toFixed(1)}M over 3 years` },
                { label: 'EXPECTED RETURN', value: `$${(scenarioResults.base.annual / 1e6).toFixed(0)}M annually (base case)` },
                { label: 'PAYBACK', value: `${scenarioResults.base.payback} months` },
                { label: 'RISK-ADJUSTED NPV', value: `$${(riskAdjNPV / 1e6).toFixed(0)}M` },
                { label: 'SUCCESS PROBABILITY', value: `${Math.round(mitigatedProb * 100)}% with mitigations in place` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary }}>{label}:</span>
                  <span style={{ fontSize: 14, fontFamily: T.mono, color: T.text }}>{value}</span>
                </div>
              ))}

              <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 16, paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.secondary, marginBottom: 8 }}>
                  TWO CONDITIONS FOR APPROVAL:
                </div>
                {cd.boardConditions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: T.amber, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, fontFamily: T.sans, color: T.text }}>{c}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 20, padding: '14px 16px',
                background: 'rgba(45,212,200,0.06)',
                border: `1px solid rgba(45,212,200,0.25)`,
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 10, fontFamily: T.mono, color: T.teal, marginBottom: 6 }}>
                  ABARVA OUTCOME COMMITMENT
                </div>
                <div style={{ fontSize: 12, fontFamily: T.sans, color: T.text, lineHeight: 1.6 }}>
                  AbarVa earns its fee only when savings are verified.<br />
                  Baseline locked: April 13, 2026.<br />
                  Fee: 15-20% of savings that exceed baseline.<br />
                  Third-party verification required above $5M.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <button style={{
                padding: '12px 24px', background: T.teal, color: T.bg,
                border: 'none', borderRadius: 8, fontSize: 13,
                fontFamily: T.mono, fontWeight: 700, cursor: 'pointer',
              }}>
                Download Board Brief →
              </button>
              {role === 'CIO' && (
                <button style={{
                  padding: '12px 24px', background: 'transparent',
                  border: `1px solid ${T.teal}`, color: T.teal,
                  borderRadius: 8, fontSize: 13, fontFamily: T.mono, cursor: 'pointer',
                }}>
                  Send to CFO →
                </button>
              )}
              <button
                onClick={handleLockBaseline}
                disabled={baselineLocked || locking}
                style={{
                  padding: '12px 24px',
                  background: baselineLocked ? T.green : 'transparent',
                  border: `1px solid ${baselineLocked ? T.green : T.border}`,
                  color: baselineLocked ? T.bg : T.secondary,
                  borderRadius: 8, fontSize: 13, fontFamily: T.mono, cursor: 'pointer',
                }}
              >
                {baselineLocked ? '✓ Baseline locked' : locking ? 'Locking…' : 'Lock baseline →'}
              </button>
              <a
                href="/outcome-intelligence?client=meridian"
                style={{
                  padding: '12px 24px', background: 'transparent',
                  border: `1px solid ${T.border}`, color: T.secondary,
                  borderRadius: 8, fontSize: 13, fontFamily: T.mono,
                  textDecoration: 'none',
                }}
              >
                Start tracking outcomes →
              </a>
            </div>
            {role === 'CFO' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => setApproved(p => new Set([...p, 5]))}
                  style={{
                    padding: '12px 24px',
                    background: approved.size >= 4 ? T.teal : 'transparent',
                    border: `1px solid ${approved.size >= 4 ? T.teal : T.border}`,
                    color: approved.size >= 4 ? T.bg : T.secondary,
                    borderRadius: 8, fontSize: 13, fontFamily: T.mono, cursor: 'pointer',
                  }}
                >
                  Approve business case →
                </button>
                <button style={{
                  padding: '12px 24px', background: 'transparent',
                  border: `1px solid ${T.amber}`, color: T.amber,
                  borderRadius: 8, fontSize: 13, fontFamily: T.mono, cursor: 'pointer',
                }}>
                  Request changes →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BusinessCasePage() {
  return (
    <Suspense>
      <BusinessCaseContent />
    </Suspense>
  )
}
