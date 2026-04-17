'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'
import { useSearchParams } from 'next/navigation'

// ── Design tokens — exact from Solutions page ─────────────────────────────────
const LBG   = '#F8F7F4'
const TX    = '#0C0C0C'
const BODY  = '#3C3C3C'
const MUTE  = '#9CA3AF'
const SMUTE = '#6B7280'
const BD    = '#E5E7EB'
const DBG   = '#060A12'
const DCARD = '#0D1520'
const DBDR  = '#1F2937'
const TEAL  = '#2DD4C8'
const TEAL_BG  = 'rgba(45,212,200,0.07)'
const TEAL_LBG = 'rgba(45,212,200,0.18)'
const RED   = '#EF4444'
const AMBER = '#F59E0B'
const GREEN = '#34D399'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'
const NAV_W    = 240
const FOOTER_H = 56

// ── Types ─────────────────────────────────────────────────────────────────────
type StepStatus  = 'locked' | 'pending' | 'active' | 'complete' | 'pre-confirmed'
type PhaseStatus = 'locked' | 'active' | 'approved'

interface StepDef  { id: string; label: string }
interface PhaseDef { id: number; name: string; steps: StepDef[] }

interface ChatMessage {
  role: 'ai' | 'user'
  text: string
  options?: string[]
  selectedOption?: string
  stepId: string
}

interface OutcomeItem { stepId: string; label: string; value: string }

interface EngagementContext {
  engagement_id:         string
  client_id:             string
  name:                  string
  directive:             string
  primary_problem:       string
  primary_problem_dollar: string
  success_criteria:      string
  what_good_looks_like:  string
  timeline:              string
  cxo_sponsor_name:      string
  cxo_sponsor_title:     string
  execution_path:        string
  genome_patterns:       string[]
  genome_success_rate:   number
  skip_setup:            boolean
}

interface SavedState {
  phaseStatuses:  Record<number, PhaseStatus>
  stepStatuses:   Record<string, StepStatus>
  outcomes:       OutcomeItem[]
  messagesByStep: Record<string, ChatMessage[]>
  activeStep:     string
}

// ── Phase / step definitions ──────────────────────────────────────────────────
const PHASE_DEFS: PhaseDef[] = [
  { id: 0, name: 'READINESS', steps: [
    { id: '0.1', label: 'Situation Confirmation' },
    { id: '0.2', label: 'AI Aspiration' },
    { id: '0.3', label: 'Data Readiness' },
    { id: '0.4', label: 'Genome Pre-Match' },
    { id: '0.5', label: 'Scope Confirmation' },
  ]},
  { id: 1, name: 'DIAGNOSE', steps: [
    { id: '1.1', label: 'Situation Brief' },
    { id: '1.2', label: 'Contradiction Surface' },
    { id: '1.3', label: 'Competitive Benchmarks' },
    { id: '1.4', label: 'Data Readiness Gap' },
  ]},
  { id: 2, name: 'PRESCRIBE', steps: [
    { id: '2.1', label: 'Use Case Prioritization' },
    { id: '2.2', label: 'Technology & Vendor Fit' },
    { id: '2.3', label: 'Architecture Approach' },
    { id: '2.4', label: 'Business Case Framing' },
  ]},
  { id: 3, name: 'VALUE REALIZATION', steps: [
    { id: '3.1', label: 'Value Model Build' },
    { id: '3.2', label: 'KPI Framework' },
    { id: '3.3', label: 'Milestone Plan' },
  ]},
  { id: 4, name: 'EXECUTE & VERIFY', steps: [
    { id: '4.1', label: '90-Day Sprint Plan' },
    { id: '4.2', label: 'Governance & Measurement' },
  ]},
]

// ── Approval checklists ───────────────────────────────────────────────────────
const APPROVAL_CHECKS: Record<number, string[]> = {
  0: [
    'Situation confirmed and key risks acknowledged',
    'AI aspiration aligned with executive sponsor',
    'Data readiness baseline documented',
    'Scope and investment parameters agreed',
  ],
  1: [
    'Situation brief reviewed and signed off',
    'Contradictions documented and acknowledged',
    'Competitive benchmark data validated',
    'Data readiness gap report delivered',
  ],
  2: [
    'Use case prioritization approved by sponsor',
    'Technology and vendor recommendation signed off',
    'Architecture blueprint reviewed by CTO / CIO',
    'Business case numbers approved by CFO',
  ],
  3: [
    'Value model locked with baseline metrics',
    'KPI framework agreed with executive team',
    'Milestone plan committed to by delivery team',
  ],
  4: [
    '90-day sprint plan approved by programme lead',
    'Governance model agreed and owners named',
  ],
}

// ── Outcome labels & step values ──────────────────────────────────────────────
const OUTCOME_LABELS: Record<string, string> = {
  '0.1': 'Priority Signal',   '0.2': 'AI Aspiration',     '0.3': 'Data Readiness',
  '0.4': 'Genome Match',      '0.5': 'Scope Confirmed',
  '1.1': 'Top Finding',       '1.2': 'Key Contradiction',  '1.3': 'Benchmark Gap',    '1.4': 'Data Gap',
  '2.1': 'Priority Use Case', '2.2': 'Tech Direction',     '2.3': 'Architecture',     '2.4': 'Business Case',
  '3.1': 'Value Potential',   '3.2': 'Primary KPI',        '3.3': 'First Milestone',
  '4.1': '90-Day Focus',      '4.2': 'Governance Model',
}

const P0_VALUES: Record<string, Record<string, string>> = {
  '0.1': {
    A: 'Denial rate gap ($94M) — revenue is bleeding now',
    B: 'Epic go-live risk — execution pressure is highest',
    C: 'Prior auth automation lag — compounding daily',
    D: 'Custom priority signal',
  },
  '0.2': {
    A: 'Revenue recovery — stop the denial bleed first',
    B: 'Epic integration — AI-native go-live, no retrofitting',
    C: 'Full RCM transformation — end-to-end redesign',
    D: 'Custom aspiration',
  },
  '0.3': {
    A: 'Data fragmentation across facilities',
    B: 'Epic migration freeze blocking AI deployment',
    C: 'No AI-ready platform in production',
    D: 'Custom data gap',
  },
  '0.4': {
    A: 'F011 — AI post go-live deployment (71% failure)',
    B: 'F007 — Denial rate widens in EHR transition (84%)',
    C: 'F031 — Recovery costs 2.3× after stabilization',
    D: 'Pattern match not applicable to our situation',
  },
  '0.5': {
    A: 'Phase 1 only — prove ROI in 90 days',
    B: 'Phase 1+2 — strategic 18-month program',
    C: 'Full 3-phase — multi-year platform build',
    D: 'Custom scope and mandate',
  },
}

// ── Phase 0 intelligence-grounded scripts ─────────────────────────────────────
function phase0Script(
  stepId: string,
  name: string,
  vertical: string,
  clientId: string,
  engCtx?: EngagementContext | null,
): { text: string; options: string[] } {
  const isMeridian = clientId === 'meridian'

  const scripts: Record<string, { text: string; options: string[] }> = {

    '0.1': (engCtx && stepId === '0.1') ? {
      text: `I have your engagement context from Setup.\n\nDIRECTIVE: "${engCtx.directive}"\n\nPRIMARY PROBLEM:\n${engCtx.primary_problem} — ${engCtx.primary_problem_dollar}\n\nCXO SPONSOR: ${engCtx.cxo_sponsor_name}${engCtx.cxo_sponsor_title ? ' · ' + engCtx.cxo_sponsor_title : ''}\n\nSUCCESS CRITERIA: ${engCtx.success_criteria || 'To be confirmed'}\n\nThis is already confirmed from Setup. What I need from you now to complete Phase 0:\n\n1. Data readiness — I'll verify your uploaded files match this use case\n2. Genome validation — confirm the matched failure patterns are relevant\n3. Scope document — approve the generated scope before Phase 1 begins\n\nShall we proceed directly to data readiness review?`,
      options: [
        'A: Yes — take me to data readiness now',
        'B: Let me review the problem statement first',
        'C: I want to adjust the CXO sponsor before we proceed',
        'D: Show me what Phase 1 will investigate',
      ],
    } : isMeridian ? {
      text: `I've pulled Meridian Health System's operational data. Three signals are registering as board-level risks:\n\n1. Denial rate at 18.2% vs 11.4% benchmark — a $94M annual revenue gap that compounds every quarter\n2. Prior auth automation at 23% vs 62% peer average — the manual drag is measurable and growing\n3. Epic EHR go-live in Q3 2026 with no verified AI integration path — the window to act is narrowing\n\nWhich of these represents the most urgent pressure on Meridian's leadership today?`,
      options: [
        'A: Denial rate gap — revenue is bleeding now, this is the fire',
        'B: Epic go-live risk — execution pressure is the board\'s top concern',
        'C: Prior auth lag — operational drag is compounding faster than leadership realizes',
        'D: Add context I\'m missing from this situation...',
      ],
    } : {
      text: `I've reviewed ${name}'s operational profile. I'm flagging the three most significant risk signals from your data.\n\nTo calibrate this strategy session, which best represents the most urgent pressure your leadership team is facing right now?`,
      options: [
        'A: Revenue and margin pressure — cash flow is the crisis',
        'B: Operational inefficiency — manual work is slowing the business',
        'C: Competitive displacement — the market is moving faster than we are',
        'D: Add context about your specific situation...',
      ],
    },

    '0.2': isMeridian ? {
      text: `Based on Meridian's situation, there are three distinct AI paths — each with a different risk and return profile.\n\nPath A — Revenue Recovery: Deploy AI directly against the $94M denial gap. ROI visible within 90 days. Fastest to board-level proof.\n\nPath B — Epic Integration: Build AI natively into the go-live. Avoids the technical debt that accumulates when AI is retrofitted post-implementation.\n\nPath C — Full RCM Transformation: Redesign the revenue cycle end-to-end with AI, from claims submission to collection.\n\nWhich best reflects what Meridian's leadership team is actually aligned on?`,
      options: [
        'A: Revenue recovery — stop the $94M denial bleed first',
        'B: Epic integration — AI-native go-live, no retrofitting later',
        'C: Full RCM transformation — redesign the entire cycle',
        'D: Share what leadership has actually agreed on...',
      ],
    } : {
      text: `What does AI success look like for ${name} in 3 years? I want to anchor this engagement on the outcome that leadership is actually committed to — not the one that sounds best in a board deck.\n\nWhich best describes the real mandate?`,
      options: [
        'A: Cost reduction — operate leaner, not just automate the same work',
        'B: Revenue growth — unlock new streams and close leakage',
        'C: Experience transformation — redefine customer or employee outcomes',
        'D: Define the actual mandate in your own words...',
      ],
    },

    '0.3': isMeridian ? {
      text: `Meridian's data readiness score is 42 out of 100. The threshold for reliable AI deployment at scale is 60.\n\nThe three primary gaps driving this score:\n\n• Claims data fragmented across 47 facilities — no unified operational view exists today\n• Epic migration creating a 6–9 month freeze on historical records — timing is critical\n• No AI-ready data platform in production — data exists but cannot be activated\n\nWhich of these gaps is most blocking Meridian's AI plans right now?`,
      options: [
        'A: Fragmentation — we can\'t get a unified view across facilities',
        'B: Epic freeze — our infrastructure is mid-transition, nothing is stable',
        'C: No platform — we have the data but no way to activate it for AI',
        'D: There\'s a different data gap I need to flag...',
      ],
    } : {
      text: `Where is ${name} today on data and AI foundations? I want a truthful baseline — not an aspirational one.\n\nWhich description is most accurate about your current state?`,
      options: [
        'A: Early stage — data is siloed, no ML or AI in production',
        'B: Developing — some analytics in place, 1–2 AI pilots underway',
        'C: Capable — data platform exists, actively scaling AI use cases',
        'D: Describe your actual current state in detail...',
      ],
    },

    '0.4': isMeridian ? {
      text: `AbarVa's pattern library has matched Meridian against prior health system engagements. Three failure patterns are active in your situation:\n\nF011 — 71% failure rate when AI deployment begins after EHR go-live. At 14 months from go-live, the window is narrowing.\n\nF007 — 84% of organizations in EHR transitions see denial rates worsen in year one. The gap will likely grow before it shrinks.\n\nF031 — Recovery costs 2.3× more when AI initiatives begin after the Epic stabilization phase. Time has a price here.\n\nWhich of these patterns is most relevant to Meridian's current position?`,
      options: [
        'A: F011 — we\'re already behind the AI deployment window',
        'B: F007 — the denial rate will get worse before it gets better',
        'C: F031 — we need to act now before recovery becomes 2× harder',
        'D: None of these fit — our situation is different...',
      ],
    } : {
      text: `AbarVa's pattern library has matched ${name} against prior ${vertical} engagements. Before designing a strategy, I want to confirm which failure pattern is most relevant to your situation.\n\nWhich of these best describes the risk you're most concerned about?`,
      options: [
        'A: Underestimating complexity — AI initiatives stall after early pilots',
        'B: Data debt — the foundation isn\'t ready to support the ambition',
        'C: Org resistance — the business won\'t adopt what technology builds',
        'D: Our specific risk is different — let me describe it...',
      ],
    },

    '0.5': isMeridian ? {
      text: `Based on Meridian's situation, genome match, and data readiness score of 42/100, I'm recommending a 3-phase scope:\n\nPhase 1 (0–6 months): AI-driven prior auth automation — immediate denial rate reduction, fastest path to board-level proof\n\nPhase 2 (6–18 months): Denial prevention AI integrated with Epic at go-live — eliminates the post-implementation technical debt risk\n\nPhase 3 (18–36 months): Full revenue cycle intelligence platform — end-to-end AI from submission to collection\n\nEstimated total value: $94M–$147M over 36 months.\n\nWhich scope best matches Meridian's current readiness and executive mandate?`,
      options: [
        'A: Phase 1 only — prove ROI in 90 days, then decide on the rest',
        'B: Phase 1 + 2 — commit to the strategic 18-month program',
        'C: Full 3-phase roadmap — transformative, multi-year platform',
        'D: Our scope and mandate is different — let me share it...',
      ],
    } : {
      text: `Based on what I've confirmed so far, I want to lock in the scope and investment horizon before moving into the diagnostic phase.\n\nWhich best describes ${name}'s AI investment mandate?`,
      options: [
        'A: Quick wins only — prove ROI within 6 months, then scale',
        'B: Strategic program — 12–18 month transformation with clear milestones',
        'C: Transformative — multi-year platform build, full commitment',
        'D: Share your specific budget and timeline constraints...',
      ],
    },
  }

  return scripts[stepId] ?? { text: '', options: [] }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function phaseOfStep(id: string) { return parseInt(id.split('.')[0]) }
function allStepIds() { return PHASE_DEFS.flatMap(p => p.steps.map(s => s.id)) }
function completedCount(ss: Record<string, StepStatus>) { return Object.values(ss).filter(s => s === 'complete' || s === 'pre-confirmed').length }
function lsKey(clientId: string) { return `abarva_avr_v2_${clientId}` }

function loadSaved(clientId: string): SavedState | null {
  try { const raw = localStorage.getItem(lsKey(clientId)); return raw ? JSON.parse(raw) : null }
  catch { return null }
}
function persist(clientId: string, s: SavedState) {
  try { localStorage.setItem(lsKey(clientId), JSON.stringify(s)) } catch { /* ignore */ }
}
function makeInitial(): SavedState {
  const phaseStatuses: Record<number, PhaseStatus> = {}
  const stepStatuses: Record<string, StepStatus> = {}
  PHASE_DEFS.forEach((p, pi) => {
    phaseStatuses[p.id] = pi === 0 ? 'active' : 'locked'
    p.steps.forEach((s, si) => {
      stepStatuses[s.id] = pi === 0 && si === 0 ? 'active' : (pi === 0 ? 'pending' : 'locked')
    })
  })
  return { phaseStatuses, stepStatuses, outcomes: [], messagesByStep: {}, activeStep: '0.1' }
}

// ── StepDot ───────────────────────────────────────────────────────────────────
function StepDot({ status }: { status: StepStatus }) {
  const base: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, transition: 'all 0.2s' }
  if (status === 'complete')      return <span style={{ fontSize: 11, color: GREEN, lineHeight: 1, flexShrink: 0 }}>✓</span>
  if (status === 'pre-confirmed') return <span style={{ fontSize: 11, color: TEAL, lineHeight: 1, flexShrink: 0 }}>✓</span>
  if (status === 'active')        return <div style={{ ...base, background: TEAL, boxShadow: `0 0 0 3px rgba(45,212,200,0.25)` }} />
  if (status === 'pending')       return <div style={{ ...base, border: `1.5px solid ${TEAL}`, background: 'transparent' }} />
  return <div style={{ ...base, background: '#D1D5DB' }} />
}

// ── LeftNav ───────────────────────────────────────────────────────────────────
function LeftNav({ phaseStatuses, stepStatuses, activeStep, collapsed, onToggle, onSelect }: {
  phaseStatuses: Record<number, PhaseStatus>
  stepStatuses:  Record<string, StepStatus>
  activeStep:    string
  collapsed:     Set<number>
  onToggle:      (id: number) => void
  onSelect:      (id: string) => void
}) {
  const total = allStepIds().length
  const done  = completedCount(stepStatuses)
  const pct   = Math.round((done / total) * 100)

  return (
    <div style={{ width: NAV_W, flexShrink: 0, background: '#fff', borderRight: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${BD}` }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          AI Value Realization
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: TX, marginBottom: 12 }}>
          5-Phase Navigator
        </div>
        <div style={{ height: 4, background: BD, borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: TEAL, borderRadius: 2, transition: 'width 0.4s' }} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: MUTE, marginTop: 6 }}>
          {done}/{total} steps · {pct}% complete
        </div>
      </div>

      {/* Phase tree */}
      <div style={{ flex: 1, padding: '8px 0 20px' }}>
        {PHASE_DEFS.map(phase => {
          const phSt   = phaseStatuses[phase.id]
          const locked = phSt === 'locked'
          const approved = phSt === 'approved'
          const isOpen = !collapsed.has(phase.id)

          return (
            <div key={phase.id}>
              <button
                onClick={() => !locked && onToggle(phase.id)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', background: 'none', border: 'none',
                  cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.38 : 1,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 9, color: MUTE, width: 12 }}>
                  {isOpen && !locked ? '▾' : '▸'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '.06em', marginBottom: 1 }}>
                    Phase {phase.id}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: approved ? TEAL : TX }}>
                    {phase.name}
                  </div>
                </div>
                {approved && <span style={{ fontSize: 11, color: GREEN }}>✓</span>}
              </button>

              {isOpen && !locked && (
                <div style={{ paddingBottom: 4 }}>
                  {phase.steps.map(step => {
                    const st       = stepStatuses[step.id]
                    const isActive = step.id === activeStep
                    const isLocked = st === 'locked'
                    return (
                      <button
                        key={step.id}
                        onClick={() => !isLocked && onSelect(step.id)}
                        style={{
                          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 12px 6px 24px',
                          background: isActive ? TEAL_BG : 'none',
                          border: 'none',
                          borderLeft: isActive ? `3px solid ${TEAL}` : '3px solid transparent',
                          cursor: isLocked ? 'default' : 'pointer',
                          opacity: isLocked ? 0.3 : 1,
                          transition: 'all 0.12s',
                        }}
                      >
                        <StepDot status={st} />
                        <span style={{ fontFamily: MONO, fontSize: 9, color: MUTE, width: 18, flexShrink: 0 }}>
                          {step.id}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontFamily: SANS, fontSize: 13,
                            color: isActive ? TX : (st === 'complete' || st === 'pre-confirmed' ? MUTE : (isLocked ? '#D1D5DB' : BODY)),
                            fontWeight: isActive ? 600 : 400,
                            lineHeight: 1.3,
                          }}>
                            {step.label}
                          </span>
                          {st === 'pre-confirmed' && (
                            <div style={{ fontFamily: SANS, fontSize: 10, color: MUTE, fontStyle: 'italic', marginTop: 1 }}>
                              Pre-confirmed in Setup
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ChatBubble ────────────────────────────────────────────────────────────────
function ChatBubble({ msg, isLast, onSelect, loading, customVal, setCustomVal, onSubmitCustom }: {
  msg:             ChatMessage
  isLast:          boolean
  onSelect?:       (letter: string) => void
  loading?:        boolean
  customVal?:      string
  setCustomVal?:   (v: string) => void
  onSubmitCustom?: () => void
}) {
  const [dataPanelOpen, setDataPanelOpen] = useState(false)
  const isAI        = msg.role === 'ai'
  const showOptions = isAI && isLast && !!(msg.options?.length) && !msg.selectedOption && !!onSelect

  if (!isAI) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <div style={{ maxWidth: '68%', background: TX, borderRadius: '12px 0 12px 12px', padding: '11px 16px' }}>
          <p style={{ fontFamily: SANS, fontSize: 15, color: '#fff', margin: 0, lineHeight: 1.55 }}>{msg.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {/* Avatar */}
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: DBG, fontWeight: 800 }}>AV</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, marginBottom: 6, letterSpacing: '.1em' }}>ABARVA</div>

        {/* AI bubble — light background */}
        <div style={{ background: LBG, borderRadius: '0 12px 12px 12px', padding: '14px 18px' }}>
          <p style={{ fontFamily: SANS, fontSize: 16, color: TX, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
            {msg.text}
          </p>
        </div>

        {/* Option buttons */}
        {showOptions && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: BODY, marginBottom: 8 }}>
              What would you like to do?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {msg.options!.map((opt, i) => {
                const letter    = 'ABCD'[i]
                const isD       = letter === 'D'
                const labelText = opt.replace(/^[A-D]:\s*/, '')

                return (
                  <div key={letter}>
                    <button
                      onClick={() => { if (isD) setDataPanelOpen(o => !o); else onSelect!(letter) }}
                      disabled={loading}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: '#fff', border: `1px solid ${BD}`, borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 10,
                        cursor: loading ? 'default' : 'pointer', transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => {
                        if (!loading) {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.background = LBG
                          el.style.borderColor = TEAL
                        }
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.background = '#fff'
                        el.style.borderColor = BD
                      }}
                    >
                      {/* Letter badge — teal circle */}
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: TX }}>{letter}</span>
                      </div>
                      <span style={{ fontFamily: SANS, fontSize: 15, color: TX, lineHeight: 1.4, flex: 1 }}>{labelText}</span>
                      {isD && <span style={{ fontFamily: MONO, fontSize: 9, color: TEAL }}>▸</span>}
                    </button>

                    {isD && dataPanelOpen && (
                      <div style={{ marginTop: 6, padding: 14, background: LBG, borderRadius: 8, border: `1px solid ${BD}` }}>
                        <textarea
                          value={customVal ?? ''}
                          onChange={e => setCustomVal?.(e.target.value)}
                          placeholder="Type your custom response (max 500 characters)..."
                          rows={3}
                          maxLength={500}
                          style={{
                            width: '100%', boxSizing: 'border-box', fontFamily: SANS, fontSize: 14,
                            color: TX, border: `1px solid ${BD}`, borderRadius: 6, padding: '10px 12px',
                            resize: 'vertical', background: '#fff', outline: 'none',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button
                            onClick={() => { setDataPanelOpen(false); onSubmitCustom?.() }}
                            style={{
                              padding: '8px 20px', background: TX, border: 'none', borderRadius: 6,
                              fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
                            }}
                          >
                            Submit →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── OutcomesPanel ─────────────────────────────────────────────────────────────
function OutcomesPanel({ outcomes, phaseStatuses }: { outcomes: OutcomeItem[]; phaseStatuses: Record<number, PhaseStatus> }) {
  const byPhase: Record<number, OutcomeItem[]> = {}
  outcomes.forEach(o => {
    const ph = phaseOfStep(o.stepId)
    if (!byPhase[ph]) byPhase[ph] = []
    byPhase[ph].push(o)
  })

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 18px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          Live Strategy Profile
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: TX }}>
          AI Value Brief
        </div>
      </div>

      {outcomes.length === 0 && (
        <div style={{ border: `1px dashed ${BD}`, borderRadius: 8, padding: '32px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.5)' }}>
          <div style={{ fontFamily: SANS, fontSize: 14, color: '#D1D5DB', marginBottom: 4 }}>
            Your strategy profile builds here
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#D1D5DB' }}>
            Complete steps to populate
          </div>
        </div>
      )}

      {PHASE_DEFS.map(p => {
        const items = byPhase[p.id]
        if (!items?.length) return null
        return (
          <div key={p.id} style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Phase {p.id} — {p.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(item => (
                <div
                  key={item.stepId}
                  style={{
                    background: '#fff',
                    border: `1px solid ${BD}`,
                    borderLeft: `3px solid ${TEAL}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: TX, marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: BODY, lineHeight: 1.5 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {phaseStatuses[p.id] === 'approved' && (
              <div style={{ marginTop: 8, padding: '6px 10px', background: TEAL_BG, border: `1px solid rgba(45,212,200,0.25)`, borderRadius: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: TEAL }}>✓ Phase {p.id} Approved</span>
              </div>
            )}
          </div>
        )
      })}

      {outcomes.length >= 3 && (
        <div style={{ marginTop: 8, border: `1px solid ${BD}`, borderRadius: 8, padding: 16, background: '#fff' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Deliverable Progress
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 15, color: TX, marginBottom: 10 }}>
            AI Value Realization Brief
          </div>
          <div style={{ height: 4, background: BD, borderRadius: 2, marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round((outcomes.length / 18) * 100))}%`, background: TEAL, borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, color: SMUTE }}>
            {outcomes.length} of 18 fields populated
          </div>
        </div>
      )}
    </div>
  )
}

// ── ApprovalModal ─────────────────────────────────────────────────────────────
function ApprovalModal({ phaseId, onApprove, onClose }: { phaseId: number; onApprove: (name: string) => void; onClose: () => void }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [name, setName]     = useState('')
  const items     = APPROVAL_CHECKS[phaseId] ?? []
  const allDone   = items.every((_, i) => checks[String(i)])
  const canSubmit = allDone && name.trim().length > 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,10,18,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 36, maxWidth: 480, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Phase Approval Gate
        </div>
        <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: TX, margin: '0 0 24px' }}>
          Approve Phase {phaseId}: {PHASE_DEFS[phaseId]?.name}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {items.map((item, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!checks[String(i)]}
                onChange={e => setChecks(p => ({ ...p, [String(i)]: e.target.checked }))}
                style={{ marginTop: 3, accentColor: TEAL }}
              />
              <span style={{ fontFamily: SANS, fontSize: 15, color: BODY, lineHeight: 1.5 }}>{item}</span>
            </label>
          ))}
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: SANS, fontSize: 12, color: MUTE, display: 'block', marginBottom: 6 }}>
            Approver name
          </label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name..."
            style={{ width: '100%', boxSizing: 'border-box', fontFamily: SANS, fontSize: 14, color: TX, border: `1px solid ${BD}`, borderRadius: 6, padding: '10px 12px', background: '#fff', outline: 'none' }}
          />
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, marginTop: 6 }}>
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '11px 0', background: 'transparent', border: `1px solid ${BD}`, borderRadius: 8, fontFamily: SANS, fontSize: 14, color: TX, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onApprove(name)}
            disabled={!canSubmit}
            style={{
              flex: 2, padding: '11px 0',
              background: canSubmit ? TX : '#E5E7EB',
              border: 'none', borderRadius: 8,
              fontFamily: SANS, fontSize: 14, fontWeight: 600,
              color: canSubmit ? '#fff' : MUTE,
              cursor: canSubmit ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            Approve Phase {phaseId} →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AIStrategyInner ───────────────────────────────────────────────────────────
function AIStrategyInner() {
  const { clientId, currentClient } = useClientContext()
  const clientName = currentClient.name
  const vertical   = currentClient.vertical
  const searchParams   = useSearchParams()
  const skipSetup      = searchParams.get('skip_setup') === 'true'
  const engagementId   = searchParams.get('engagement_id')

  const [engCtx, setEngCtx] = useState<EngagementContext | null>(null)
  const [st, setSt]               = useState<SavedState>(() => makeInitial())
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set([1, 2, 3, 4]))
  const [customVal, setCustomVal] = useState('')
  const [loading, setLoading]     = useState(false)
  const [approvalFor, setApprovalFor] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { phaseStatuses, stepStatuses, outcomes, messagesByStep, activeStep } = st

  // Load / init on client change
  useEffect(() => {
    const STORAGE_KEY = lsKey(clientId)

    // Reset support: ?reset=true wipes state so fresh initialisation runs
    if (searchParams.get('reset') === 'true') {
      localStorage.removeItem(STORAGE_KEY)
    }

    // Try to read engagement context from Setup handoff
    let ctx: EngagementContext | null = null
    if (skipSetup && engagementId) {
      try {
        const raw = localStorage.getItem('abarva_engagement_context')
        if (raw) {
          const parsed = JSON.parse(raw) as EngagementContext
          if (parsed.engagement_id === engagementId) { ctx = parsed; setEngCtx(parsed) }
        }
      } catch { /* ignore */ }
    }

    // Guard: validate shape before trusting existing state
    let saved: SavedState | null = null
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) {
      try {
        const parsed = JSON.parse(existing)
        if (parsed?.stepStatuses && parsed?.phaseStatuses) {
          saved = parsed as SavedState
        }
      } catch { /* ignore */ }
    }

    if (saved && !ctx) {
      setSt(saved)
      const newCollapsed = new Set<number>()
      PHASE_DEFS.forEach(p => { if (saved!.phaseStatuses[p.id] === 'locked') newCollapsed.add(p.id) })
      setCollapsed(newCollapsed)
    } else {
      const init = makeInitial()
      if (ctx) {
        // Pre-confirm steps that were answered in Setup
        if (ctx.directive)            init.stepStatuses['0.1'] = 'pre-confirmed'
        if (ctx.success_criteria)     init.stepStatuses['0.2'] = 'pre-confirmed'
        if (ctx.genome_patterns?.length) init.stepStatuses['0.4'] = 'pre-confirmed'
        // 0.3 (Data Readiness) and 0.5 (Scope) always need live review
        init.stepStatuses['0.3'] = 'active'
        init.activeStep = '0.1' // Start at 0.1 to show confirmation message
      }
      const script = phase0Script('0.1', clientName, vertical, clientId, ctx)
      init.messagesByStep['0.1'] = [{ role: 'ai', text: script.text, options: script.options, stepId: '0.1' }]
      setSt(init)
    }
    setCustomVal('')
    setLoading(false)
    setApprovalFor(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  // Persist whenever st changes — intentionally excludes clientId from deps.
  // Including clientId caused a race: on client switch the effect fired with the
  // new clientId but the previous client's st (stale closure), overwriting the
  // new client's saved state before the load effect above could restore it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { persist(clientId, st) }, [st])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesByStep, activeStep, loading])

  const msgs             = messagesByStep[activeStep] ?? []
  const phaseId          = phaseOfStep(activeStep)
  const phaseDef         = PHASE_DEFS[phaseId]
  const stepDef          = phaseDef?.steps.find(s => s.id === activeStep)
  const isDone           = stepStatuses[activeStep] === 'complete'
  const phaseAllComplete = phaseDef?.steps.every(s => stepStatuses[s.id] === 'complete') ?? false
  const phaseApproved    = phaseStatuses[phaseId] === 'approved'
  const showApproveBtn   = phaseAllComplete && !phaseApproved

  const allSteps   = allStepIds()
  const totalSteps = allSteps.length
  const doneSoFar  = completedCount(stepStatuses)
  const pct        = Math.round((doneSoFar / totalSteps) * 100)
  const stepIndex  = allSteps.indexOf(activeStep) + 1

  function handleSelect(letter: string) {
    const lastAI = [...msgs].reverse().find(m => m.role === 'ai')
    if (!lastAI) return
    const optText    = lastAI.options?.find(o => o.startsWith(letter + ':')) ?? letter
    const userMsg: ChatMessage = { role: 'user', text: optText, stepId: activeStep }
    const updatedMsgs = msgs.map((m, i) => i === msgs.length - 1 && m.role === 'ai' ? { ...m, selectedOption: letter } : m)
    setSt(prev => ({ ...prev, messagesByStep: { ...prev.messagesByStep, [activeStep]: [...updatedMsgs, userMsg] } }))
    completeStep(letter, optText)
  }

  function handleSubmitCustom() {
    if (!customVal.trim()) return
    const lastAI = [...msgs].reverse().find(m => m.role === 'ai')
    if (!lastAI) return
    const userMsg: ChatMessage = { role: 'user', text: customVal, stepId: activeStep }
    const updatedMsgs = msgs.map((m, i) => i === msgs.length - 1 && m.role === 'ai' ? { ...m, selectedOption: 'D' } : m)
    setSt(prev => ({ ...prev, messagesByStep: { ...prev.messagesByStep, [activeStep]: [...updatedMsgs, userMsg] } }))
    completeStep('D', customVal)
  }

  async function completeStep(letter: string, optText: string) {
    setLoading(true)
    const phase     = phaseOfStep(activeStep)
    const stepIdx   = allSteps.indexOf(activeStep)
    const nextStep  = allSteps[stepIdx + 1]
    const nextPhase = nextStep ? phaseOfStep(nextStep) : -1
    const samePhase = nextPhase === phase

    const label = OUTCOME_LABELS[activeStep] ?? activeStep
    const value = phase === 0
      ? (letter === 'D' ? (customVal || 'Custom') : (P0_VALUES[activeStep]?.[letter] ?? optText))
      : optText
    const outcome: OutcomeItem = { stepId: activeStep, label, value }
    const newSS: Record<string, StepStatus> = { ...stepStatuses, [activeStep]: 'complete' }

    if (phase === 0) {
      const updated: SavedState = { ...st, stepStatuses: newSS, outcomes: [...outcomes.filter(o => o.stepId !== activeStep), outcome] }
      if (nextStep && samePhase) {
        const script = phase0Script(nextStep, clientName, vertical, clientId)
        updated.messagesByStep = { ...updated.messagesByStep, [nextStep]: [{ role: 'ai', text: script.text, options: script.options, stepId: nextStep }] }
        updated.stepStatuses[nextStep] = 'active'
        updated.activeStep = nextStep
      }
      setSt(updated)
      setCustomVal('')
      setLoading(false)
    } else {
      try {
        const summary = outcomes.map(o => `${o.label}: ${o.value}`).join('\n')
        const res = await fetch('/api/chat/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepId: activeStep, clientId,
            selectedOption: letter,
            customText: letter === 'D' ? customVal : undefined,
            priorStepsSummary: summary,
            clientContext: { name: clientName, vertical },
          }),
        })

        let aiText = '', nextOptions: string[] = [], outcomeOverride: string | undefined

        if (res.ok && res.body) {
          const reader = res.body.getReader(), decoder = new TextDecoder()
          let buf = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n'); buf = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              try {
                const d = JSON.parse(line.slice(6))
                if (d.type === 'text') aiText += d.chunk
                if (d.type === 'done') { nextOptions = d.options ?? []; outcomeOverride = d.outcomeItem?.value }
              } catch { /* ignore */ }
            }
          }
        }

        const finalOutcome: OutcomeItem = { stepId: activeStep, label, value: outcomeOverride ?? value }
        const newSS2 = { ...newSS }
        const newActiveStep = nextStep && samePhase ? nextStep : activeStep
        if (nextStep && samePhase) newSS2[nextStep] = 'active'

        setSt(prev => ({
          ...prev, stepStatuses: newSS2,
          outcomes: [...prev.outcomes.filter(o => o.stepId !== activeStep), finalOutcome],
          messagesByStep: {
            ...prev.messagesByStep,
            ...(nextStep && samePhase && aiText ? { [nextStep]: [{ role: 'ai', text: aiText, options: nextOptions, stepId: nextStep }] } : {}),
          },
          activeStep: newActiveStep,
        }))
      } catch {
        setSt(prev => ({ ...prev, stepStatuses: newSS, outcomes: [...prev.outcomes.filter(o => o.stepId !== activeStep), outcome] }))
      } finally {
        setCustomVal(''); setLoading(false)
      }
    }
  }

  async function handleApprove(approverName: string) {
    const nextPhaseId = phaseId + 1
    const newPS: Record<number, PhaseStatus> = { ...phaseStatuses, [phaseId]: 'approved' }
    const newSS: Record<string, StepStatus>  = { ...stepStatuses }

    if (nextPhaseId <= 4) {
      newPS[nextPhaseId] = 'active'
      PHASE_DEFS[nextPhaseId]?.steps.forEach((s, i) => { newSS[s.id] = i === 0 ? 'active' : 'pending' })
    }

    const firstNextId = PHASE_DEFS[nextPhaseId]?.steps[0]?.id

    setSt(prev => ({ ...prev, phaseStatuses: newPS, stepStatuses: newSS, activeStep: firstNextId ?? activeStep }))
    setCollapsed(prev => {
      const n = new Set(prev); n.add(phaseId)
      if (firstNextId) n.delete(nextPhaseId)
      return n
    })
    setApprovalFor(null)

    if (firstNextId && nextPhaseId >= 1) {
      setLoading(true)
      try {
        const summary = outcomes.map(o => `${o.label}: ${o.value}`).join('\n')
        const res = await fetch('/api/chat/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepId: firstNextId, clientId, selectedOption: 'A',
            priorStepsSummary: summary,
            clientContext: { name: clientName, vertical },
            isKickoff: true,
          }),
        })
        let aiText = '', nextOptions: string[] = []
        if (res.ok && res.body) {
          const reader = res.body.getReader(), decoder = new TextDecoder()
          let buf = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n'); buf = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              try {
                const d = JSON.parse(line.slice(6))
                if (d.type === 'text') aiText += d.chunk
                if (d.type === 'done') nextOptions = d.options ?? []
              } catch { /* ignore */ }
            }
          }
        }
        if (aiText) {
          setSt(prev => ({
            ...prev,
            messagesByStep: { ...prev.messagesByStep, [firstNextId]: [{ role: 'ai', text: aiText, options: nextOptions, stepId: firstNextId }] },
          }))
        }
      } catch { /* ignore */ } finally { setLoading(false) }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: LBG, overflow: 'hidden' }}>
      <AbarvaNav activePage="ai-strategy" />

      {/* Context banner */}
      <div style={{ flexShrink: 0, background: '#060A12', borderBottom: '1px solid #1C2D45', padding: '0 24px', height: '34px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>AI VALUE REALIZATION</span>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: '#1C2D45' }}>·</span>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(239,246,255,0.4)', letterSpacing: '.06em', textTransform: 'uppercase' as const }}>{clientName}</span>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: '#1C2D45' }}>·</span>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(239,246,255,0.25)' }}>Guided by AbarVa AI across 3 phases · 11 modules</span>
        <a href="/ai-value-realization" style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: '9px', color: 'rgba(45,212,200,0.55)', textDecoration: 'none', letterSpacing: '.06em', flexShrink: 0 }}>
          ? What is this
        </a>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Left nav ── */}
        <LeftNav
          phaseStatuses={phaseStatuses}
          stepStatuses={stepStatuses}
          activeStep={activeStep}
          collapsed={collapsed}
          onToggle={id => setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })}
          onSelect={id => setSt(prev => ({ ...prev, activeStep: id }))}
        />

        {/* ── Right area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Skip-setup pre-population banner */}
          {skipSetup && (
            <div style={{ flexShrink: 0, background: 'rgba(45,212,200,0.08)', borderLeft: '3px solid #2DD4C8', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: engCtx ? 6 : 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Context loaded</span>
                <span style={{ fontFamily: SANS, fontSize: 14, color: TX }}>Engagement context loaded from Setup.</span>
              </div>
              {engCtx && (
                <div style={{ fontFamily: SANS, fontSize: 13, color: '#6B7280' }}>
                  Phase 0 has been pre-populated from your engagement definition. Steps 0.1, 0.2, and 0.4 are pre-confirmed. Review and approve to proceed to Phase 1.
                </div>
              )}
            </div>
          )}

          {/* Step header — #F8F7F4, Georgia step name, Mono phase label */}
          <div style={{ flexShrink: 0, background: LBG, borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Phase {phaseId}: {phaseDef?.name} · Step {stepIndex} of {totalSteps}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: TX }}>
                  {stepDef?.label ?? 'AI Value Realization'}
                </div>
              </div>
              <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: TEAL, marginTop: 4 }}>
                {pct}%
              </span>
            </div>
            {/* 4px progress bar */}
            <div style={{ height: 4, background: BD, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: TEAL, borderRadius: 2, transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Chat + Outcomes */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Chat — white background, 55% */}
            <div style={{ width: '55%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${BD}`, background: '#fff' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '24px 24px 8px' }}>
              <div style={{ flex: 1 }} />
                {msgs.map((msg, i) => (
                  <ChatBubble
                    key={i} msg={msg} isLast={i === msgs.length - 1}
                    onSelect={!isDone ? handleSelect : undefined}
                    loading={loading}
                    customVal={customVal} setCustomVal={setCustomVal}
                    onSubmitCustom={handleSubmitCustom}
                  />
                ))}

                {loading && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: DBG, fontWeight: 800 }}>AV</span>
                    </div>
                    <div style={{ background: LBG, borderRadius: '0 12px 12px 12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, animation: `dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              </div>
            </div>

            {/* Outcomes — #F8F7F4, 45% */}
            <div style={{ width: '45%', background: LBG, overflow: 'hidden' }}>
              <OutcomesPanel outcomes={outcomes} phaseStatuses={phaseStatuses} />
            </div>
          </div>

          {/* Footer */}
          <div style={{ height: FOOTER_H, flexShrink: 0, background: '#fff', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {stepDef ? `${activeStep} — ${stepDef.label}` : ''}
              </div>
            </div>

            {/* Step progress squares */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {allSteps.map(sid => {
                const s = stepStatuses[sid]
                const a = sid === activeStep
                return (
                  <div key={sid} style={{
                    width: a ? 10 : 6, height: a ? 10 : 6, borderRadius: 2,
                    background: s === 'complete' ? TEAL : (a ? TEAL : (s === 'locked' ? '#E5E7EB' : '#C5C5C5')),
                    opacity: s === 'locked' ? 0.4 : 1, transition: 'all 0.2s',
                  }} />
                )
              })}
            </div>

            {phaseId > 0 && !isDone && !loading && (
              <button
                onClick={() => handleSelect('A')}
                style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${BD}`, borderRadius: 6, fontFamily: SANS, fontSize: 13, color: SMUTE, cursor: 'pointer' }}
              >
                Skip →
              </button>
            )}

            {showApproveBtn ? (
              <button
                onClick={() => setApprovalFor(phaseId)}
                style={{ height: 44, padding: '0 24px', background: TX, border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                Approve Phase {phaseId} →
              </button>
            ) : (
              <button
                disabled={isDone || loading}
                style={{
                  height: 44, padding: '0 24px',
                  background: (isDone || loading) ? '#E5E7EB' : TX,
                  border: 'none', borderRadius: 6,
                  fontFamily: SANS, fontSize: 15, fontWeight: 600,
                  color: (isDone || loading) ? MUTE : '#fff',
                  cursor: (isDone || loading) ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isDone ? 'Step Complete ✓' : 'Complete Step'}
              </button>
            )}
          </div>
        </div>
      </div>

      {approvalFor !== null && (
        <ApprovalModal phaseId={approvalFor} onApprove={handleApprove} onClose={() => setApprovalFor(null)} />
      )}

      <style>{`
        @keyframes dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default function AIStrategyPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', background: LBG }} />}>
      <AIStrategyInner />
    </Suspense>
  )
}
