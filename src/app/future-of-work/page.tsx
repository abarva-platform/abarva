'use client'
import { useState, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'
import EngagementProgress from '@/components/EngagementProgress'

// ─── Design tokens ────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
}
const GREEN = '#059669'

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, name: 'Overview' },
  { id: 1, name: 'Capacity Baseline' },
  { id: 2, name: 'Use Case Portfolio' },
  { id: 3, name: 'Architecture' },
  { id: 4, name: 'Governance' },
  { id: 5, name: 'Change & Adoption' },
  { id: 6, name: 'Business Case' },
]

// ─── Client-specific config ────────────────────────────────────────────────────
const CLIENT_CONFIG: Record<string, { name: string; industry: string; completeness: number }> = {
  meridian:   { name: 'Meridian Health System',   industry: 'Healthcare',         completeness: 84 },
  arcturus:   { name: 'Arcturus Financial Group',  industry: 'Financial Services', completeness: 67 },
  apexretail: { name: 'Apex Retail Group',         industry: 'Retail',             completeness: 71 },
}

// ─── Use case data ────────────────────────────────────────────────────────────
const USE_CASES = [
  { rank: 1, name: 'Prior auth automation', value: 28, complexity: 'Medium', readiness: 78, wave: 1 },
  { rank: 2, name: 'Physician documentation (DAX)', value: 18, complexity: 'Low', readiness: 94, wave: 1 },
  { rank: 3, name: 'Clinical coding automation', value: 14, complexity: 'Medium', readiness: 71, wave: 1 },
  { rank: 4, name: 'Supply chain ordering AI', value: 8, complexity: 'Low', readiness: 82, wave: 1 },
  { rank: 5, name: 'Patient communication AI', value: 6, complexity: 'Low', readiness: 68, wave: 2 },
  { rank: 6, name: 'Scheduling optimization', value: 5, complexity: 'Medium', readiness: 62, wave: 2 },
  { rank: 7, name: 'Denial management automation', value: 5, complexity: 'High', readiness: 55, wave: 2 },
  { rank: 8, name: 'Care gap identification', value: 4, complexity: 'Medium', readiness: 71, wave: 2 },
  { rank: 9, name: 'Staff scheduling AI', value: 4, complexity: 'Medium', readiness: 58, wave: 2 },
  { rank: 10, name: 'Contract analytics', value: 3, complexity: 'Low', readiness: 74, wave: 2 },
  { rank: 11, name: 'Predictive maintenance', value: 3, complexity: 'High', readiness: 48, wave: 3 },
  { rank: 12, name: 'Readmission risk scoring', value: 3, complexity: 'Medium', readiness: 66, wave: 2 },
  { rank: 13, name: 'Benefits verification', value: 2, complexity: 'Low', readiness: 80, wave: 1 },
  { rank: 14, name: 'Patient intake automation', value: 2, complexity: 'Low', readiness: 76, wave: 2 },
  { rank: 15, name: 'Lab result summarization', value: 2, complexity: 'Low', readiness: 84, wave: 1 },
  { rank: 16, name: 'Medication reconciliation', value: 2, complexity: 'Medium', readiness: 60, wave: 3 },
  { rank: 17, name: 'Finance close acceleration', value: 2, complexity: 'Medium', readiness: 64, wave: 3 },
  { rank: 18, name: 'Vendor invoice processing', value: 1, complexity: 'Low', readiness: 72, wave: 2 },
  { rank: 19, name: 'HR policy Q&A bot', value: 1, complexity: 'Low', readiness: 88, wave: 1 },
  { rank: 20, name: 'Compliance monitoring AI', value: 1, complexity: 'High', readiness: 52, wave: 3 },
]

// ─── Platform data ────────────────────────────────────────────────────────────
type PlatformId = 'agnostic' | 'servicenow' | 'copilot' | 'moveworks' | 'claude'

const PLATFORMS: Record<PlatformId, {
  label: string
  tagline: string
  scores: { ecosystemFit: number; compliance: number; cost: number; skills: number; risk: number }
  recommended?: boolean
  referral?: boolean
}> = {
  agnostic: {
    label: 'Platform Agnostic',
    tagline: 'Logical architecture layers — best-of-breed across all tiers',
    scores: { ecosystemFit: 80, compliance: 85, cost: 78, skills: 80, risk: 82 },
  },
  servicenow: {
    label: 'ServiceNow AI',
    tagline: 'Healthcare workflow automation — strong ITSM and operational AI',
    scores: { ecosystemFit: 82, compliance: 88, cost: 58, skills: 74, risk: 76 },
  },
  copilot: {
    label: 'Microsoft Copilot for M365',
    tagline: 'Integrated into existing Microsoft stack — fastest time to value',
    scores: { ecosystemFit: 88, compliance: 86, cost: 72, skills: 84, risk: 82 },
    recommended: true,
    referral: true,
  },
  moveworks: {
    label: 'Moveworks',
    tagline: 'IT service desk focus — employee self-service and resolution AI',
    scores: { ecosystemFit: 71, compliance: 78, cost: 76, skills: 72, risk: 74 },
  },
  claude: {
    label: 'Claude (Anthropic)',
    tagline: 'Custom AI solutions — highly capable for complex clinical reasoning',
    scores: { ecosystemFit: 79, compliance: 84, cost: 82, skills: 78, risk: 88 },
    referral: true,
  },
}

const SCORE_LABELS: Record<string, string> = {
  ecosystemFit: 'Ecosystem Fit',
  compliance: 'Compliance',
  cost: 'Cost Efficiency',
  skills: 'Skills Availability',
  risk: 'Risk Profile',
}

// ─── Scenario data ────────────────────────────────────────────────────────────
const SCENARIOS = [
  { key: 'conservative', label: 'Conservative', invest: 18, value: 42, roi: 2.3, payback: 14, color: '#64748B' },
  { key: 'moderate', label: 'Moderate', invest: 28, value: 78, roi: 2.8, payback: 12, color: GREEN },
  { key: 'aggressive', label: 'Aggressive', invest: 42, value: 104, roi: 2.5, payback: 10, color: '#1D4ED8' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value, max = 100, color = GREEN }: { value: number; max?: number; color?: string }) {
  return (
    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ height: '6px', width: `${(value / max) * 100}%`, background: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
    </div>
  )
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: bg, color, letterSpacing: '0.04em' }}>
      {label}
    </span>
  )
}

function complexityColor(c: string) {
  if (c === 'Low') return { color: '#374151', bg: '#ECFDF5' }
  if (c === 'Medium') return { color: '#374151', bg: '#FFFBEB' }
  return { color: '#374151', bg: '#FEF2F2' }
}

function waveColor(w: number) {
  if (w === 1) return { color: '#374151', bg: '#ECFDF5' }
  if (w === 2) return { color: '#374151', bg: '#EFF6FF' }
  return { color: '#374151', bg: '#F5F3FF' }
}

// ─── Architecture Agnostic Layers ─────────────────────────────────────────────
function AgnosticArchitecture() {
  const layers = [
    { label: 'User Interface Layer', desc: 'Web apps, mobile, EHR embedded widgets, Teams/Slack bots', color: '#EFF6FF', border: '#BFDBFE', text: '#374151' },
    { label: 'AI Orchestration Layer', desc: 'Prompt routing, agent orchestration, workflow automation, RAG pipelines', color: '#F5F3FF', border: '#DDD6FE', text: '#374151' },
    { label: 'Model Layer', desc: 'Foundation models (clinical, general), fine-tuned specialty models, embeddings', color: '#ECFDF5', border: '#A7F3D0', text: '#374151' },
    { label: 'Data & Integration Layer', desc: 'EHR connectors (Epic/Cerner), FHIR APIs, data lake, vector store, audit log', color: '#FFFBEB', border: '#FDE68A', text: '#374151' },
    { label: 'Security & Compliance Layer', desc: 'HIPAA controls, PHI masking, access governance, encryption, audit trail', color: '#FEF2F2', border: '#FECACA', text: '#374151' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {layers.map((l, i) => (
        <div key={i} style={{ padding: '14px 18px', borderRadius: '10px', background: l.color, border: `1px solid ${l.border}` }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: l.text, marginBottom: '3px' }}>{l.label}</div>
          <div style={{ fontSize: '12px', color: '#475569' }}>{l.desc}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────
function FutureOfWorkContent() {
  const { clientId, allowedClients, isAdmin } = useClientContext()

  const [step, setStep] = useState(0)
  const [activeClient, setActiveClient] = useState(clientId)
  const [platform, setPlatform] = useState<PlatformId>('agnostic')
  const [scenario, setScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')

  const cfg = CLIENT_CONFIG[activeClient] ?? CLIENT_CONFIG.meridian
  const isMeridian = activeClient === 'meridian'

  // ── Breadcrumb ──
  const Breadcrumb = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
      <span style={{ color: '#D1D5DB' }}>›</span>
      <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Future of Work</span>
      <span style={{ color: '#D1D5DB' }}>›</span>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>{cfg.name} · {cfg.industry}</span>
    </div>
  )

  // ── Step nav bar ──
  const StepNav = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', overflowX: 'auto' as const }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            style={{ padding: '12px 18px', fontSize: '13px', fontWeight: step === s.id ? 600 : 400, color: step === s.id ? GREEN : step > s.id ? GREEN : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', borderBottom: step === s.id ? `2px solid ${GREEN}` : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === s.id ? GREEN : step > s.id ? GREEN : '#F1F5F9', color: step === s.id || step > s.id ? 'white' : '#94A3B8', flexShrink: 0 }}>
              {step > s.id ? '✓' : s.id}
            </span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )

  // ── Nav buttons ──
  const NavBtns = ({ prev, next, nextLabel = 'Next →' }: { prev?: number; next?: number; nextLabel?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
      {prev !== undefined
        ? <button onClick={() => setStep(prev)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        : <div />}
      {next !== undefined && (
        <button onClick={() => setStep(next)} style={{ padding: '12px 32px', borderRadius: '10px', background: GREEN, color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{nextLabel}</button>
      )}
    </div>
  )

  const selScenario = SCENARIOS.find(s => s.key === scenario)!

  return (
    <div style={S.page}>
      <AbarvaNav activePage="future-of-work" />
      <EngagementProgress />
      <Breadcrumb />
      {step > 0 && <StepNav />}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 48px' }}>

        {/* ═══════════════ STEP 0 — LANDING ═══════════════ */}
        {step === 0 && (
          <div>
            {/* Hero */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👥</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Workforce Intelligence</div>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', lineHeight: 1.2 }}>Future of Work</h1>
              <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.7, maxWidth: '680px', marginBottom: '0' }}>
                Identify where AI augments your workforce, where it replaces manual tasks, and how to lead the change. Built from your actual workforce and operational data.
              </p>
            </div>

            {/* Data completeness + client cards — admin only */}
            {isAdmin && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {Object.entries(CLIENT_CONFIG).filter(([id]) => allowedClients.find(a => a.id === id)).map(([id, c]) => (
                <button key={id} onClick={() => setActiveClient(id)}
                  style={{ ...S.card, cursor: 'pointer', textAlign: 'left' as const, border: `2px solid ${activeClient === id ? GREEN : '#E2E8F0'}`, background: activeClient === id ? '#F0FDF4' : '#FFFFFF', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{c.industry}</div>
                    </div>
                    {activeClient === id && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: GREEN, color: 'white' }}>SELECTED</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Data completeness</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{c.completeness}%</span>
                  </div>
                  <ProgressBar value={c.completeness} color={activeClient === id ? GREEN : '#94A3B8'} />
                </button>
              ))}
            </div>}

            {/* What you will get */}
            <div style={{ ...S.card, marginBottom: '32px' }}>
              <div style={S.label}>WHAT YOU WILL GET</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {[
                  { icon: '🗺', title: 'Workforce Impact Map', desc: 'Every role mapped to AI impact' },
                  { icon: '🎯', title: 'AI Use Case Portfolio', desc: '20 prioritized use cases with ROI' },
                  { icon: '🏛', title: 'Governance Framework', desc: 'Approval gates, data controls, audit' },
                  { icon: '📣', title: 'Change Plan', desc: 'Comms, training, champions, metrics' },
                  { icon: '💰', title: 'Business Case', desc: '3 scenarios with 18-month roadmap' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setStep(1)}
                style={{ padding: '16px 48px', borderRadius: '12px', background: GREEN, color: 'white', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.3)' }}>
                Start Future of Work Analysis →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 1 — WORKFORCE CAPACITY BASELINE ═══════════════ */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Workforce Capacity Baseline</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Where time is being lost today — and the dollar value of recapturing it</p>

            {/* Headline */}
            <div style={{ ...S.card, marginBottom: '24px', background: '#F0FDF4', border: `1px solid #A7F3D0` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A' }}>$104M</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>in workforce capacity not yet realized</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>{isMeridian ? 'Meridian Health System' : cfg.name} · Based on FTE analysis and benchmark comparison</div>
                </div>
              </div>
            </div>

            {/* 3 value category cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {/* Card 1 */}
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={S.label}>ADMINISTRATIVE BURDEN</div>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>$62M</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Current: non-clinical admin</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>38%</span>
                  </div>
                  <ProgressBar value={38} color="#DC2626" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Benchmark</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>22%</span>
                  </div>
                  <ProgressBar value={22} color={GREEN} />
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '2px' }}>16pt gap above benchmark</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>Equivalent to $62M FTE capacity across total staff</div>
                </div>
              </div>

              {/* Card 2 */}
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={S.label}>CLINICAL DOCUMENTATION</div>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>$18M</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Physicians: docs per day</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>3.1 hrs</span>
                  </div>
                  <ProgressBar value={63} color="#DC2626" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Benchmark</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>1.4 hrs</span>
                  </div>
                  <ProgressBar value={29} color={GREEN} />
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '2px' }}>820 physicians × 1.7 hrs/day recoverable</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>$18M annual opportunity via ambient documentation AI</div>
                </div>
              </div>

              {/* Card 3 */}
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={S.label}>PROCESS AUTOMATION</div>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>$24M</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Back-office manual processes</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>67%</span>
                  </div>
                  <ProgressBar value={67} color="#DC2626" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Benchmark</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>31%</span>
                  </div>
                  <ProgressBar value={31} color={GREEN} />
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '2px' }}>36pt gap vs benchmark</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>$24M potential from back-office automation and AI workflows</div>
                </div>
              </div>
            </div>

            <NavBtns prev={0} next={2} nextLabel="Next: Use Case Portfolio →" />
          </div>
        )}

        {/* ═══════════════ STEP 2 — USE CASE PRIORITIZATION ═══════════════ */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>AI Use Case Portfolio</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>20 use cases scored by value × complexity × readiness. Total portfolio: $104M.</p>

            {/* Top 5 highlight */}
            <div style={{ ...S.card, marginBottom: '20px' }}>
              <div style={S.label}>WAVE 1 PRIORITIES — HIGHEST VALUE + READINESS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {USE_CASES.slice(0, 5).map((uc, i) => {
                  const cx = complexityColor(uc.complexity)
                  const wx = waveColor(uc.wave)
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 80px 90px 80px 70px', gap: '12px', alignItems: 'center', padding: '14px 0', borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F0FDF4', border: `1px solid ${GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{uc.rank}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{uc.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>${uc.value}M</div>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>annual value</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '3px' }}>Readiness</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ flex: 1, height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                            <div style={{ height: '4px', width: `${uc.readiness}%`, background: GREEN, borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>{uc.readiness}%</span>
                        </div>
                      </div>
                      <Tag label={uc.complexity} color={cx.color} bg={cx.bg} />
                      <Tag label={`Wave ${uc.wave}`} color={wx.color} bg={wx.bg} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Remaining 15 */}
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>FULL PORTFOLIO — ALL 20 USE CASES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {USE_CASES.map((uc, i) => {
                  const cx = complexityColor(uc.complexity)
                  const wx = waveColor(uc.wave)
                  const isTop5 = i < 5
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 60px 60px 60px', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: i < 19 ? '1px solid #F8FAFC' : 'none', opacity: isTop5 ? 1 : 0.85 }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isTop5 ? GREEN : '#94A3B8' }}>{uc.rank}</span>
                      <span style={{ fontSize: '13px', color: isTop5 ? '#0F172A' : '#475569', fontWeight: isTop5 ? 600 : 400 }}>{uc.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isTop5 ? GREEN : '#6B7280', textAlign: 'right' as const }}>${uc.value}M</span>
                      <Tag label={uc.complexity} color={cx.color} bg={cx.bg} />
                      <Tag label={`W${uc.wave}`} color={wx.color} bg={wx.bg} />
                    </div>
                  )
                })}
              </div>
            </div>

            <NavBtns prev={1} next={3} nextLabel="Next: Architecture Design →" />
          </div>
        )}

        {/* ═══════════════ STEP 3 — ARCHITECTURE DESIGN ═══════════════ */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Architecture Design</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Platform selection and logical architecture for AI deployment at {cfg.name}</p>

            {/* Platform selector tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
              {(Object.entries(PLATFORMS) as [PlatformId, typeof PLATFORMS[PlatformId]][]).map(([id, p]) => (
                <button key={id} onClick={() => setPlatform(id)}
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: platform === id ? 700 : 500, background: platform === id ? GREEN : '#FFFFFF', color: platform === id ? 'white' : '#475569', border: `1px solid ${platform === id ? GREEN : '#E2E8F0'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}>
                  {p.recommended && <span style={{ fontSize: '10px' }}>★</span>}
                  {p.label}
                  {p.recommended && <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.25)', color: 'white' }}>BEST FIT</span>}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* Left: architecture / platform detail */}
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{PLATFORMS[platform].label}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{PLATFORMS[platform].tagline}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    {PLATFORMS[platform].recommended && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#F0FDF4', color: '#374151', border: `1px solid ${GREEN}` }}>★ Best fit — Meridian</span>
                    )}
                    {PLATFORMS[platform].referral && (
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>★ AbarVa referral partner — disclosed</span>
                    )}
                  </div>
                </div>

                {platform === 'agnostic' ? (
                  <AgnosticArchitecture />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(PLATFORMS[platform].scores).map(([key, val]) => {
                      const c = val >= 80 ? GREEN : val >= 65 ? '#D97706' : '#DC2626'
                      return (
                        <div key={key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: '#475569' }}>{SCORE_LABELS[key]}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{val}/100</span>
                          </div>
                          <ProgressBar value={val} color={c} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right: all platform scores comparison */}
              <div style={S.card}>
                <div style={S.label}>PLATFORM COMPARISON — ALL OPTIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(Object.entries(PLATFORMS) as [PlatformId, typeof PLATFORMS[PlatformId]][]).map(([id, p]) => {
                    const avg = Math.round(Object.values(p.scores).reduce((a, b) => a + b, 0) / Object.values(p.scores).length)
                    const isActive = id === platform
                    return (
                      <button key={id} onClick={() => setPlatform(id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: isActive ? '#F0FDF4' : 'transparent', border: `1px solid ${isActive ? GREEN : 'transparent'}`, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: isActive ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${isActive ? GREEN : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: isActive ? GREEN : '#94A3B8', flexShrink: 0 }}>
                          {avg}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {p.label}
                            {p.recommended && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: GREEN, color: 'white' }}>BEST FIT</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            {Object.entries(p.scores).map(([k, v]) => (
                              <div key={k} style={{ fontSize: '10px', color: '#94A3B8' }} title={SCORE_LABELS[k]}>{v}</div>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>avg score</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Marketplace link */}
            <div style={{ padding: '14px 18px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Need a detailed platform RFP?</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>AbarVa Marketplace includes vetted healthcare AI vendors with negotiated rates</div>
              </div>
              <a href={`/marketplace?client=${activeClient}`} style={{ padding: '8px 18px', borderRadius: '8px', background: GREEN, color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' as const }}>
                Find the right platform → Marketplace
              </a>
            </div>

            <NavBtns prev={2} next={4} nextLabel="Next: Governance →" />
          </div>
        )}

        {/* ═══════════════ STEP 4 — GOVERNANCE FRAMEWORK ═══════════════ */}
        {step === 4 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Governance Framework</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Policy structure to deploy AI responsibly across {cfg.name}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Approval gates */}
              <div style={S.card}>
                <div style={S.label}>APPROVAL GATES</div>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', lineHeight: 1.6 }}>
                  Every AI use case requires sign-off before deployment. No exceptions.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { role: 'CDO — Chief Data Officer', scope: 'Data access, model training, data retention' },
                    { role: 'CMIO — Chief Medical Informatics', scope: 'Clinical use cases, patient safety review' },
                    { role: 'Legal Counsel', scope: 'Contract AI, consent, liability exposure' },
                    { role: 'Privacy Officer', scope: 'PHI handling, HIPAA compliance, de-identification' },
                  ].map((g, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: GREEN, marginTop: '5px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{g.role}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{g.scope}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data access controls */}
              <div style={S.card}>
                <div style={S.label}>DATA ACCESS CONTROLS</div>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', lineHeight: 1.6 }}>
                  AI access to data is scoped by use case type with graduated controls.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { type: 'Clinical AI', access: 'De-identified PHI, aggregated outcomes — no real-time patient records', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                    { type: 'Administrative AI', access: 'Scheduling, billing, supply chain data — no clinical records', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                    { type: 'Financial AI', access: 'Claims, cost, contract data — no patient identifiers', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                  ].map((d, i) => (
                    <div key={i} style={{ padding: '12px 14px', borderRadius: '8px', background: d.bg, border: `1px solid ${d.border}` }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>{d.type}</div>
                      <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>{d.access}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit trail */}
              <div style={S.card}>
                <div style={S.label}>AUDIT TRAIL</div>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', lineHeight: 1.6 }}>
                  Every AI decision is logged, traceable, and exportable for regulatory review.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { item: 'Full decision log', detail: 'Input, model version, output, confidence, timestamp — all retained 7 years' },
                    { item: 'Supervisor review', detail: 'Any AI decision reviewable by direct supervisor within 30 days' },
                    { item: 'Regulatory export', detail: 'CMS, Joint Commission, and state audit requests fulfilled in <48 hours' },
                    { item: 'Anomaly alerts', detail: 'Automated flags for unusual model behavior or drift' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px' }}>✓</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{a.item}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{a.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee rights */}
              <div style={S.card}>
                <div style={S.label}>EMPLOYEE RIGHTS</div>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', lineHeight: 1.6 }}>
                  Staff have enforceable rights with respect to AI systems affecting their work.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { right: 'Right to explanation', detail: 'Any AI recommendation affecting staffing or clinical work explained on request', icon: '💬' },
                    { right: 'Right to escalate', detail: 'Human supervisor override available for any AI decision — no exceptions', icon: '🔼' },
                    { right: 'Opt-out (patient-facing)', detail: 'Staff may opt out of patient-facing AI interactions with 2 weeks notice', icon: '🛑' },
                    { right: 'No punitive use', detail: 'AI performance data may not be used in disciplinary actions without HR review', icon: '🔒' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{r.icon}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{r.right}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{r.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <NavBtns prev={3} next={5} nextLabel="Next: Change & Adoption →" />
          </div>
        )}

        {/* ═══════════════ STEP 5 — CHANGE & ADOPTION ═══════════════ */}
        {step === 5 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Change & Adoption Plan</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>How {cfg.name} moves 2,100 staff from resistance to active adoption</p>

            {/* Timeline strip */}
            <div style={{ ...S.card, marginBottom: '24px', padding: '32px 24px' }}>
              <div style={S.label}>18-MONTH ADOPTION TIMELINE</div>
              <div style={{ position: 'relative' as const }}>
                {/* Timeline bar */}
                <div style={{ position: 'absolute' as const, top: '18px', left: '0', right: '0', height: '3px', background: '#E2E8F0', zIndex: 0 }} />
                <div style={{ position: 'absolute' as const, top: '18px', left: '0', width: '60%', height: '3px', background: GREEN, zIndex: 1 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0', position: 'relative' as const, zIndex: 2 }}>
                  {[
                    { month: 'Month 1', label: 'Executive launch town hall', icon: '📣' },
                    { month: 'Month 2', label: 'Manager briefings complete', icon: '👔' },
                    { month: 'Month 3', label: '42 champions trained', icon: '⭐' },
                    { month: 'Month 6', label: '40% adoption — Wave 1 live', icon: '🚀' },
                    { month: 'Month 12', label: '80% adoption target', icon: '🎯' },
                    { month: 'Month 18', label: 'NPS +20 · Full rollout', icon: '✅' },
                  ].map((m, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' as const, padding: '0 4px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: i < 4 ? GREEN : '#E2E8F0', border: `3px solid ${i < 4 ? GREEN : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '10px' }}>
                        {m.icon}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: i < 4 ? GREEN : '#94A3B8', marginBottom: '4px' }}>{m.month}</div>
                      <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.3 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 components grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Communication */}
              <div style={S.card}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📣</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Communication Plan</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Multi-channel, consistent cadence</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { channel: 'Executive town hall', cadence: 'Month 1 kickoff + Month 6 progress' },
                    { channel: 'Manager briefings', cadence: 'Monthly 30-min sessions' },
                    { channel: 'Staff FAQ & intranet hub', cadence: 'Live at Month 1, updated weekly' },
                    { channel: 'Monthly AI update newsletter', cadence: 'Metrics, stories, what\'s coming' },
                  ].map((c, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{c.channel}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{c.cadence}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training */}
              <div style={S.card}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🎓</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Role-Specific Training</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Tailored by function, not generic</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { role: 'Physician', hours: '2 hrs', modules: 'Ambient documentation, clinical decision support', staff: '820' },
                    { role: 'Nurse / Clinical Staff', hours: '1.5 hrs', modules: 'Care gap tools, patient communication AI', staff: '3,200' },
                    { role: 'Administrative Staff', hours: '3 hrs', modules: 'Prior auth, scheduling, billing AI workflows', staff: '1,600' },
                  ].map((r, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr auto' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{r.role}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{r.modules}</div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{r.hours}</div>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>{r.staff} staff</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Champions */}
              <div style={S.card}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>⭐</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>AI Champions Network</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Peer-led adoption at the unit level</div>
                  </div>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: '12px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A' }}>42</div>
                  <div style={{ fontSize: '13px', color: '#92400E' }}>champions needed · 1 per 50 staff</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    'Selected by department heads, trained in Month 2',
                    'Each champion holds 2 unit-level demos per quarter',
                    'Champions report blockers directly to program office',
                    'Recognized in performance reviews',
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#374151', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                      <span style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Measurement */}
              <div style={S.card}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📊</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Measurement Framework</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Quantified adoption targets by milestone</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  {[
                    { label: 'Adoption Target', value: '80%', sub: 'by Month 12' },
                    { label: 'Staff NPS Target', value: '+20', sub: 'after 6 months' },
                    { label: 'Training Completion', value: '95%', sub: 'by Month 4' },
                    { label: 'Champion Coverage', value: '100%', sub: 'of departments' },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '12px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center' as const }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{m.value}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{m.label}</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <NavBtns prev={4} next={6} nextLabel="Next: Business Case →" />
          </div>
        )}

        {/* ═══════════════ STEP 6 — BUSINESS CASE + ROADMAP ═══════════════ */}
        {step === 6 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Business Case + Roadmap</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Three investment scenarios with 18-month execution roadmap for {cfg.name}</p>

            {/* Scenario toggle */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              {SCENARIOS.map(s => (
                <button key={s.key} onClick={() => setScenario(s.key as typeof scenario)}
                  style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${scenario === s.key ? s.color : '#E2E8F0'}`, background: scenario === s.key ? '#F8FAFC' : '#FFFFFF', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{s.label}</div>
                    {scenario === s.key && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: s.color, color: 'white' }}>SELECTED</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Investment</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>${s.invest}M</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Annual Value</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>${s.value}M</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>ROI</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{s.roi}×</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Payback</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{s.payback}mo</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* ROI bar chart */}
            <div style={{ ...S.card, marginBottom: '20px' }}>
              <div style={S.label}>SCENARIO COMPARISON — ANNUAL VALUE vs INVESTMENT</div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', height: '120px', padding: '10px 0' }}>
                {SCENARIOS.map(s => {
                  const maxVal = 104
                  const isActive = scenario === s.key
                  return (
                    <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>${s.value}M</div>
                      <div style={{ width: '100%', height: `${(s.value / maxVal) * 90}px`, background: isActive ? s.color : '#E2E8F0', borderRadius: '4px 4px 0 0', transition: 'all 0.3s' }} />
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{s.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 18-month roadmap */}
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>18-MONTH IMPLEMENTATION ROADMAP</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  {
                    phase: 'Phase 1', range: 'Months 0–6', color: GREEN, bg: '#ECFDF5', border: '#A7F3D0',
                    items: ['Documentation AI (DAX) — Wave 1', 'Prior Auth Automation — Wave 1', 'Benefits Verification AI', 'Lab Result Summarization', 'HR Policy Q&A Bot'],
                    value: '$52M projected value',
                  },
                  {
                    phase: 'Phase 2', range: 'Months 6–12', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE',
                    items: ['Clinical Coding Automation', 'Supply Chain Ordering AI', 'Patient Communication AI', 'Care Gap Identification', 'Denial Management Automation'],
                    value: '$36M projected value',
                  },
                  {
                    phase: 'Phase 3', range: 'Months 12–18', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
                    items: ['Patient Communication (full rollout)', 'Back-office Automation', 'Scheduling Optimization', 'Predictive Maintenance', 'Compliance Monitoring AI'],
                    value: '$16M projected value',
                  },
                ].map((ph, i) => (
                  <div key={i} style={{ padding: '18px', borderRadius: '10px', background: ph.bg, border: `1px solid ${ph.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>{ph.phase}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>{ph.range}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {ph.items.map((item, j) => (
                        <div key={j} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: ph.color, opacity: 0.2, flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '12px', color: '#374151' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{ph.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* McKinsey callout */}
            <div style={{ padding: '20px 24px', borderRadius: '12px', background: '#0F172A', border: '1px solid #1E293B', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                  What McKinsey charges $3.1M and 18 weeks to produce.
                </div>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                  AbarVa delivers the same workforce intelligence in a 45-minute analysis session — built from your actual data.
                </div>
              </div>
              <div style={{ fontSize: '32px', flexShrink: 0 }}>⚡</div>
            </div>

            {/* Export artifacts */}
            <div style={S.card}>
              <div style={S.label}>EXPORT DELIVERABLES — {selScenario.label.toUpperCase()} SCENARIO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {[
                  { icon: '📊', title: 'Workforce Impact Report', desc: 'Capacity baseline + use case portfolio' },
                  { icon: '🏛', title: 'Governance Framework', desc: 'Policy, controls, audit structure' },
                  { icon: '📣', title: 'Change Plan', desc: 'Comms, training, champions playbook' },
                  { icon: '💰', title: 'Business Case', desc: `${selScenario.label} scenario — ${selScenario.roi}× ROI` },
                  { icon: '📈', title: 'Board Deck', desc: '10-slide executive presentation' },
                ].map((artifact, i) => (
                  <button key={i}
                    style={{ padding: '16px 12px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', textAlign: 'center' as const, transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0FDF4'; (e.currentTarget as HTMLElement).style.borderColor = GREEN }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{artifact.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{artifact.title}</div>
                    <div style={{ fontSize: '10px', color: '#6B7280', lineHeight: 1.4, marginBottom: '10px' }}>{artifact.desc}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>↓ Export</div>
                  </button>
                ))}
              </div>
            </div>

            <NavBtns prev={5} />
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Page export with Suspense ────────────────────────────────────────────────
export default function FutureOfWorkPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>Loading Future of Work analysis…</div>
      </div>
    }>
      <FutureOfWorkContent />
    </Suspense>
  )
}
