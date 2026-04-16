'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

// ── Design tokens ──────────────────────────────────────────────────────────────
const PAGE  = '#F8F7F4'
const CARD  = '#FFFFFF'
const BDR   = '#E5E7EB'
const SB    = '#0C0C0C'
const TEXT  = '#0C0C0C'
const TEXT2 = '#3C3C3C'
const MUTED = '#6B7280'
const TEAL  = '#2DD4C8'
const RED   = '#EF4444'
const ORG   = '#F59E0B'
const GRN   = '#34D399'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'

type Section = 'programme' | 'setup' | 'data' | 'engagements' | 'users' | 'security' | 'backlog' | 'assign' | 'capacity'

// ── Mock data ──────────────────────────────────────────────────────────────────
const ENGAGEMENTS = [
  { id: 'E001', client: 'Meridian Health', name: 'RCM AI — Denial Prevention', type: 'AI Value Realization', phase: 1, status: 'In Progress', maestro: 'Anand S.', value: '$94M', priority: 'Critical', progress: 45, sponsor: 'Dr. Sarah Chen · CMO', function: 'Revenue Cycle' },
  { id: 'E002', client: 'Meridian Health', name: 'Technology Modernization', type: 'Solutions', phase: 2, status: 'In Progress', maestro: 'Anand S.', value: '$38M', priority: 'High', progress: 62, sponsor: 'Mark Rivera · CTO', function: 'Technology' },
  { id: 'E003', client: 'Meridian Health', name: 'Margin Optimization', type: 'Solutions', phase: 0, status: 'Backlog', maestro: '—', value: '$28M', priority: 'Normal', progress: 0, sponsor: '—', function: 'Finance' },
  { id: 'E004', client: 'Arcturus Financial', name: 'Cost-to-Income Reduction', type: 'AI Value Realization', phase: 0, status: 'Backlog', maestro: '—', value: '$840M', priority: 'Critical', progress: 0, sponsor: 'Victoria Hargreaves · CEO', function: 'Finance' },
  { id: 'E005', client: 'Arcturus Financial', name: 'MAS FEAT Compliance', type: 'Solutions', phase: 0, status: 'Assigned', maestro: 'TBD', value: '$0 (regulatory)', priority: 'Critical', progress: 8, sponsor: 'Raj Malhotra · CIO', function: 'Technology' },
]

const APPROVALS = [
  { doc: 'Phase 1 Situation Brief', engagement: 'RCM AI — Denial Prevention', from: 'Dr. Sarah Chen, CMO', status: 'pending' },
  { doc: 'Epic Integration Architecture', engagement: 'Technology Modernization', from: 'Mark Rivera, CTO', status: 'pending' },
  { doc: 'Data Upload: Payer Contract Analysis', engagement: 'RCM AI — Denial Prevention', from: 'Finance Team', status: 'overdue' },
]

const DATA_FILES = [
  { name: 'Meridian Financial Statements FY2025', owner: 'CFO Office', date: '2026-03-15', confidence: 96, status: 'approved' },
  { name: 'Technology Landscape Assessment', owner: 'IT Dept', date: '2026-03-20', confidence: 88, status: 'approved' },
  { name: 'Epic EHR Implementation Plan', owner: 'CTO', date: '2026-04-01', confidence: 91, status: 'approved' },
  { name: 'Payer Contract Analysis', owner: '—', date: '—', confidence: 0, status: 'missing' },
  { name: 'CDO Profile + Org Chart', owner: '—', date: '—', confidence: 0, status: 'missing' },
]

const USERS = [
  { name: 'Anand Sundaram', email: 'anand@abarva.ai', role: 'Admin', engCount: '2 active', lastActive: 'Today' },
  { name: 'Investor Demo', email: 'investor@demo.ai', role: 'Viewer', engCount: '0', lastActive: 'Today' },
]

const AUDIT_LOG = [
  { time: '2026-04-16 09:42', user: 'Anand Sundaram', action: 'Phase 1 Approved', detail: 'Meridian — RCM AI engagement' },
  { time: '2026-04-15 14:20', user: 'Anand Sundaram', action: 'Data file uploaded', detail: 'Epic EHR Implementation Plan (91%)' },
  { time: '2026-04-15 11:05', user: 'Anand Sundaram', action: 'User invited', detail: 'sarah.chen@meridian.org — Viewer' },
]

const PRIORITY_COLOR: Record<string, string> = { Critical: RED, High: ORG, Normal: MUTED }
const STATUS_COLOR: Record<string, string>   = { 'In Progress': TEAL, Backlog: MUTED, Assigned: ORG, Complete: GRN }
const STATUS_BG: Record<string, string>      = { 'In Progress': 'rgba(45,212,200,0.12)', Backlog: '#F3F4F6', Assigned: 'rgba(245,158,11,0.1)', Complete: 'rgba(52,211,153,0.12)' }

// ── Chat questions ─────────────────────────────────────────────────────────────
const CHAT_QUESTIONS = [
  {
    step: 0,
    ai: `Tell me about the project.\n\nWhat has your leadership asked you to solve? Don't filter it — just describe it as it was given to you.`,
    freeText: true,
    options: [] as Array<{ letter: string; text: string }>,
  },
  {
    step: 1,
    ai: `Understood. Supply chain optimisation.\n\nFrom Meridian's data I can already see:\nSupply expense is $168M vs $137M peer median — a $31M annual gap. Contract renewal process is flagged in the Technology Landscape Assessment.\n\nSource: Financial Statements FY2025 · Technology Landscape Assessment · 88% conf\n\nIs this the gap the CSO needs to close?`,
    freeText: false,
    options: [
      { letter: 'A', text: 'Yes — reduce supply expense to peer median. $31M is the target.' },
      { letter: 'B', text: 'The vendor governance issue is bigger than the spend gap' },
      { letter: 'C', text: "It's a full procurement transformation — demand planning, contracts, and spend" },
      { letter: 'D', text: "Show me all supply chain gaps in Meridian's data" },
    ],
  },
  {
    step: 2,
    ai: `Good. What does success look like for the CSO — and for the board?\n\nThe Genome shows comparable IDNs achieved:\nSupply spend: $8–18M reduction in Year 1\nContract cycle time: -40% in 6 months\nVendor reduction: 15–25% rationalisation\n\nSource: Genome F022, F031 · 23 comparable engagements\n\nWhat will the CSO be measured on?`,
    freeText: false,
    options: [
      { letter: 'A', text: 'Dollar savings — specific $ reduction' },
      { letter: 'B', text: 'Process speed — contract cycle time' },
      { letter: 'C', text: 'Vendor rationalisation — fewer, better' },
      { letter: 'D', text: 'All three — show me the combined scorecard' },
    ],
  },
  {
    step: 3,
    ai: `Before we define the metrics, let me share what 'good' looks like at this level.\n\nFor a supply chain programme at a $4.2B IDN:\n\nBOARD LEVEL: CFO can defend supply spend with a verified reduction trajectory. Neither the board nor bondholders question it.\n\nCSO LEVEL: Vendor scorecard visible. Contract SLAs tracked. Agency spend declining quarter over quarter with a credible plan.\n\nOPERATIONAL: Procurement team freed from manual process by 30%+. Staff focused on strategic sourcing, not paperwork.\n\nDoes this match what the CSO and their boss need to see?`,
    freeText: false,
    options: [
      { letter: 'A', text: 'Yes — this is exactly the right framing' },
      { letter: 'B', text: 'The CFO framing is more important — make it a margin story' },
      { letter: 'C', text: 'The operational metric is what the CSO cares about most' },
      { letter: 'D', text: 'We have regulatory constraints too — vendor audit compliance matters' },
    ],
  },
  {
    step: 4,
    ai: `What is the timeline?\n\nMeridian's next major milestone is the Q3 board meeting. The FY2026 budget cycle closes in October.\n\nThe Genome shows F022 pattern achieves initial results in 90 days and full programme maturity in 9 months.`,
    freeText: false,
    options: [
      { letter: 'A', text: '90-day quick win — board meeting deadline' },
      { letter: 'B', text: '6-month programme — next planning cycle' },
      { letter: 'C', text: '12-month transformation — full redesign' },
      { letter: 'D', text: 'No hard deadline — quality over speed' },
    ],
  },
  {
    step: 5,
    ai: `Who owns this programme?\n\nThe F002 failure pattern — the single biggest predictor of disengagement — is a missing or powerless sponsor.\n\nI need a named CXO who: has budget authority, can unblock cross-functional resistance, and will stand in front of the board on results.\n\nWho is the named executive sponsor for this engagement?`,
    freeText: false,
    options: [
      { letter: 'A', text: 'CEO — this is a board-level mandate' },
      { letter: 'B', text: 'CFO — it is a margin and P&L programme' },
      { letter: 'C', text: 'COO / CSO — operational ownership' },
      { letter: 'D', text: 'CTO / CIO — technology-led transformation' },
    ],
  },
  {
    step: 6,
    ai: `Final question. How do you want to run this?\n\nBased on the scope and data available:\n\nA: Solutions → Supply Chain Intelligence\nPre-configured. 6-12 weeks. Genome-validated. Fastest to value.\n\nB: AI Value Realization → Full diagnostic\nPhase 0 through 4. 12-18 weeks. More thorough. Full prescription.\n\nC: Hybrid — Solutions for quick wins now, expand via AI Value Realization after.\n\nGiven the 90-day pressure and the $31M known gap, I recommend Option A.`,
    freeText: false,
    options: [
      { letter: 'A', text: 'Solutions — fast, Genome-validated' },
      { letter: 'B', text: 'AI Value Realization — full diagnostic' },
      { letter: 'C', text: 'Hybrid — quick wins then expand' },
      { letter: 'D', text: 'Show me what each option delivers' },
    ],
  },
]

const CANVAS_LABELS = ['LEADERSHIP DIRECTIVE', 'PRIMARY PROBLEM', 'SUCCESS CRITERIA', 'WHAT GOOD LOOKS LIKE', 'TIMELINE', 'CXO SPONSOR', 'EXECUTION PATH']

// ── Section: Programme Dashboard ───────────────────────────────────────────────
function ProgrammeDashboard() {
  const router = useRouter()
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Admin Console · Programme Dashboard</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 40px', lineHeight: 1.15 }}>
        Everything in motion.<br />Everything tracked.
      </h1>

      {/* 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'ACTIVE ENGAGEMENTS', value: '2', color: TEXT },
          { label: 'TOTAL VALUE TRACKED', value: '$960M+', color: TEXT },
          { label: 'PHASES APPROVED', value: '3', color: GRN },
          { label: 'FEE EARNED TO DATE', value: '$0', color: TEAL, sub: 'Fee activates on verified outcomes' },
        ].map((m, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 32 }}>
            <div style={{ fontFamily: SERIF, fontSize: 72, fontWeight: 700, color: m.color, lineHeight: 1, marginBottom: 10 }}>{m.value}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{m.label}</div>
            {m.sub && <div style={{ fontFamily: SANS, fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* All Engagements table */}
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BDR}` }}>
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT }}>All Engagements</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BDR}` }}>
              {['Client', 'Engagement', 'Sponsor', 'Function', 'Phase', 'Status', 'Maestro', 'Value', 'Priority'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left' as const, fontFamily: SANS, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ENGAGEMENTS.map((e, i) => (
              <tr key={e.id} style={{ borderTop: `1px solid ${BDR}`, background: i % 2 === 0 ? CARD : PAGE }}>
                <td style={{ padding: '14px 20px', fontFamily: SANS, fontSize: 15, color: TEXT2 }}>{e.client}</td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT }}>{e.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>{e.type === 'AI Value Realization' ? 'AVR' : 'SOL'}</div>
                </td>
                <td style={{ padding: '14px 20px', fontFamily: SANS, fontSize: 13, color: TEXT2 }}>{e.sponsor}</td>
                <td style={{ padding: '14px 20px', fontFamily: MONO, fontSize: 11, color: TEAL }}>{e.function}</td>
                <td style={{ padding: '14px 20px', fontFamily: MONO, fontSize: 13, color: MUTED }}>Ph {e.phase}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: STATUS_COLOR[e.status] ?? MUTED, background: STATUS_BG[e.status] ?? '#F3F4F6', padding: '4px 10px', borderRadius: 4 }}>
                    {e.status}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontFamily: SANS, fontSize: 15, color: TEXT2 }}>{e.maestro}</td>
                <td style={{ padding: '14px 20px', fontFamily: SERIF, fontSize: 15, color: TEXT }}>{e.value}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: PRIORITY_COLOR[e.priority] ?? MUTED }}>● {e.priority}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom 2 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Approval Queue */}
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8 }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BDR}` }}>
            <div style={{ fontFamily: SERIF, fontSize: 24, color: TEXT }}>Approval Queue</div>
          </div>
          {APPROVALS.map((a, i) => (
            <div key={i} style={{ padding: '20px 24px', borderBottom: i < APPROVALS.length - 1 ? `1px solid ${BDR}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: TEXT }}>{a.doc}</div>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: a.status === 'overdue' ? RED : ORG, background: a.status === 'overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: 4, flexShrink: 0, marginLeft: 8 }}>
                  {a.status === 'overdue' ? 'OVERDUE' : 'PENDING'}
                </span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, marginBottom: 12 }}>{a.engagement} · From: {a.from}</div>
              <button style={{ fontFamily: SANS, fontSize: 14, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Review →</button>
            </div>
          ))}
        </div>

        {/* Data Health */}
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, cursor: 'pointer' }} onClick={() => router.push('/admin?section=data')}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BDR}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: SERIF, fontSize: 24, color: TEXT }}>Data Health</div>
            <span style={{ fontFamily: SANS, fontSize: 13, color: TEAL }}>View all →</span>
          </div>
          {[
            { client: 'Meridian Health System', score: 42, sub: '2 files missing' },
            { client: 'Arcturus Financial', score: 68, sub: 'All files present' },
          ].map((c, i) => (
            <div key={i} style={{ padding: '20px 24px', borderBottom: i === 0 ? `1px solid ${BDR}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: TEXT }}>{c.client}</div>
                <div style={{ fontFamily: SANS, fontSize: 48, fontWeight: 700, color: c.score < 60 ? RED : c.score < 80 ? ORG : GRN, lineHeight: 1 }}>{c.score}</div>
              </div>
              <div style={{ height: 6, background: BDR, borderRadius: 3, marginBottom: 8 }}>
                <div style={{ height: 6, borderRadius: 3, width: `${c.score}%`, background: c.score < 60 ? RED : c.score < 80 ? ORG : TEAL }} />
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: '#9CA3AF' }}>AI Readiness Score · {c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section: Client Profile ────────────────────────────────────────────────────
function SetupSection() {
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', fontFamily: SANS, fontSize: 17, color: TEXT, background: 'transparent', border: 'none', borderBottom: `1px solid ${BDR}`, padding: '8px 0', outline: 'none' }
  const lblStyle: React.CSSProperties  = { display: 'block', fontFamily: SANS, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Setup & Configuration</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>Client Profile</h1>
      <div style={{ fontFamily: SANS, fontSize: 17, color: TEXT2, marginBottom: 40 }}>Step 1 of 4 setup steps</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 40 }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, color: TEXT, marginBottom: 28 }}>Organisation Details</div>
          {[
            { label: 'Client Name', value: 'Meridian Health System' },
            { label: 'Vertical', value: 'Healthcare — IDN' },
            { label: 'Sub-type', value: 'Integrated Delivery Network' },
            { label: 'Annual Revenue', value: '$4.2B' },
            { label: 'Headquarters', value: 'Chicago, IL' },
            { label: 'Engagement Start', value: '2026-01-15' },
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: 22 }}>
              <label style={lblStyle}>{f.label}</label>
              <input type="text" defaultValue={f.value} style={inputStyle} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 40 }}>
            <div style={{ fontFamily: SERIF, fontSize: 24, color: TEXT, marginBottom: 24 }}>Fee Model</div>
            {[
              { label: 'Platform fee (monthly)', value: '$25,000' },
              { label: 'Engagement fee (per phase)', value: '$150,000' },
              { label: 'Outcome share', value: '8%' },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 6 }}>{f.label}</div>
                <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color: TEXT }}>{f.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 40 }}>
            <div style={{ fontFamily: SERIF, fontSize: 24, color: TEXT, marginBottom: 24 }}>Primary Contact</div>
            {[
              { label: 'Name', value: 'Dr. Sarah Chen' },
              { label: 'Title', value: 'Chief Medical Officer' },
              { label: 'Email', value: 'sarah.chen@meridian.org' },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 22 }}>
                <label style={lblStyle}>{f.label}</label>
                <input type="text" defaultValue={f.value} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <button style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: '#FFFFFF', background: TEXT, border: 'none', borderRadius: 6, padding: '0 28px', height: 44, cursor: 'pointer', width: '100%' }}>
          Save & Continue →
        </button>
      </div>
    </div>
  )
}

// ── Section: Data Uploads ──────────────────────────────────────────────────────
function DataSection() {
  const approved = DATA_FILES.filter(f => f.confidence > 0)
  const avgConf  = Math.round(approved.reduce((a, b) => a + b.confidence, 0) / approved.length)
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Setup & Configuration</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 32px' }}>Data Uploads</h1>

      {/* Dark readiness banner */}
      <div style={{ background: '#0C0C0C', borderRadius: 8, padding: 40, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 96, fontWeight: 700, color: TEAL, lineHeight: 1 }}>42</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 14 }}>/ 100 · AI Readiness Score</div>
          <div style={{ height: 6, background: '#1A1A1A', borderRadius: 3, marginBottom: 12 }}>
            <div style={{ height: 6, borderRadius: 3, width: '42%', background: TEAL }} />
          </div>
          <div style={{ fontFamily: SANS, fontSize: 16, color: '#FFFFFF' }}>Below 60-point deployment threshold</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: 20 }}>
          {[
            { value: `${avgConf}%`, label: 'AVG CONFIDENCE', color: '#FFFFFF' },
            { value: '3 / 5', label: 'FILES APPROVED', color: GRN },
            { value: '2', label: 'MISSING', color: RED },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: SANS, fontSize: 48, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings panel */}
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderLeft: `4px solid ${ORG}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: ORG, textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 12 }}>Missing Data Warnings</div>
        {[
          { name: 'Payer Contract Analysis', reason: 'Required for SLA intelligence' },
          { name: 'CDO Profile + Org Chart', reason: 'Required for leadership intelligence' },
        ].map((w, i) => (
          <div key={i} style={{ marginBottom: i === 0 ? 10 : 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 15, color: TEXT }}>⚠ {w.name}</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>{w.reason}</div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div style={{ background: CARD, border: `2px dashed ${BDR}`, borderRadius: 8, padding: 60, textAlign: 'center' as const, marginBottom: 24, cursor: 'pointer' }}>
        <div style={{ fontFamily: SANS, fontSize: 17, color: MUTED, marginBottom: 8 }}>↑ Drag files here or click to upload</div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: '#9CA3AF' }}>PDF, Excel, CSV, Word — max 50MB per file</div>
      </div>

      {/* File table */}
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BDR}` }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, color: TEXT }}>Meridian Health System · Uploaded Files</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BDR}` }}>
              {['File', 'Owner', 'Date', 'Confidence', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left' as const, fontFamily: SANS, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATA_FILES.map((f, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${BDR}` }}>
                <td style={{ padding: '14px 20px', fontFamily: SANS, fontSize: 15, color: f.status === 'missing' ? MUTED : TEXT, fontStyle: f.status === 'missing' ? 'italic' : 'normal' }}>{f.name}</td>
                <td style={{ padding: '14px 20px', fontFamily: SANS, fontSize: 15, color: TEXT2 }}>{f.owner}</td>
                <td style={{ padding: '14px 20px', fontFamily: MONO, fontSize: 13, color: MUTED }}>{f.date}</td>
                <td style={{ padding: '14px 20px' }}>
                  {f.confidence > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: BDR, borderRadius: 2 }}>
                        <div style={{ height: 4, borderRadius: 2, width: `${f.confidence}%`, background: TEAL }} />
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: TEAL }}>{f.confidence}%</span>
                    </div>
                  ) : <span style={{ fontFamily: MONO, fontSize: 12, color: RED }}>—</span>}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 4, color: f.status === 'approved' ? GRN : f.status === 'missing' ? ORG : MUTED, background: f.status === 'approved' ? 'rgba(52,211,153,0.12)' : f.status === 'missing' ? 'rgba(245,158,11,0.1)' : '#F3F4F6' }}>
                    {f.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  {f.status === 'missing' && (
                    <button style={{ fontFamily: SANS, fontSize: 14, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Request →</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section: Engagement Setup (Kanban + Smart Chat) ───────────────────────────
type ChatMsg = { type: 'ai' | 'user'; content: string }
type CanvasItem = { value: string; confirmedAt: number }
type Domain = 'rcm' | 'ai_tech' | 'supply_chain' | 'generic'

function detectDomain(text: string): Domain {
  const t = text.toLowerCase()
  if (/denial|rcm|revenue cycle|claims|ensemble|prior auth|payer|coding|remittance/.test(t)) return 'rcm'
  if (/ai\b|artificial intelligence|technology|digital|epic|ehr|portfolio|tech stack/.test(t)) return 'ai_tech'
  if (/supply chain|vendor|procurement|supply expense|contract|purchasing/.test(t)) return 'supply_chain'
  return 'generic'
}

function getDomainQ2(domain: Domain): { ai: string; options: Array<{ letter: string; text: string }> } {
  if (domain === 'rcm') return {
    ai: `Got it. You're focused on RCM and revenue cycle performance.\n\nFrom Meridian's data I can already see:\nDenial rate: 18.2% vs 11.4% benchmark — a $94M annual revenue gap. This compounds every quarter.\nPrior auth automation: 23% vs 62% peer average — manual drag measurable and growing.\n\nSource: RCM Performance Report · Mar 2026 · 94% confidence\n\nIs this the gap your leadership needs to close?`,
    options: [
      { letter: 'A', text: 'Yes — reduce denial rate to peer median. $94M is the target.' },
      { letter: 'B', text: 'Prior auth is the bigger lever — the manual process is the real problem' },
      { letter: 'C', text: "Full revenue cycle redesign — denial prevention, coding, and collections" },
      { letter: 'D', text: "Show me all revenue cycle gaps in Meridian's data" },
    ],
  }
  if (domain === 'ai_tech') return {
    ai: `Understood. You're focused on AI and technology performance.\n\nFrom Meridian's data:\nAI portfolio: $42M invested with $0 verified ROI tracked — the board can't see what the spend is delivering.\nEpic go-live: Q3 2026 with no verified AI integration path — the window to act is narrowing.\n\nSource: Technology Assessment · AI Initiative Register · 88% confidence\n\nWhich is the core problem leadership needs to solve?`,
    options: [
      { letter: 'A', text: '$42M AI portfolio with zero verified ROI — prove what we have is working' },
      { letter: 'B', text: 'Epic go-live risk — AI must be native at go-live, not retrofitted after' },
      { letter: 'C', text: 'Full digital transformation — AI, Epic, and data platform together' },
      { letter: 'D', text: "Show me all AI and technology gaps in the data" },
    ],
  }
  if (domain === 'supply_chain') return {
    ai: `Understood. Supply chain optimisation.\n\nFrom Meridian's data:\nSupply expense: $168M vs $137M peer median — a $31M annual gap. Contract renewal process flagged in the Technology Assessment.\n\nSource: Financial Statements FY2025 · Technology Landscape Assessment · 88% confidence\n\nIs this the gap your CSO needs to close?`,
    options: [
      { letter: 'A', text: 'Yes — reduce supply expense to peer median. $31M is the target.' },
      { letter: 'B', text: 'Vendor governance is the bigger issue — spend is a symptom' },
      { letter: 'C', text: 'Full procurement transformation — demand planning, contracts, and spend' },
      { letter: 'D', text: "Show me all supply chain gaps in Meridian's data" },
    ],
  }
  return {
    ai: `Let me map your directive to Meridian's data.\n\nMeridian's five largest dollar exposures:\n1. RCM denial rate 18.2% vs 11.4% — $94M/yr\n2. AI portfolio $42M with zero verified ROI\n3. Travel nurse cost $340M — $140M above peer\n4. Supply expense $168M vs $137M — $31M gap\n5. MA Star Rating 3.2 vs 4.0 — $34M CMS risk\n\nBased on what you described, which finding is most relevant to your leadership's directive?`,
    options: [
      { letter: 'A', text: 'Revenue cycle — the $94M denial rate gap' },
      { letter: 'B', text: 'AI ROI — proving the $42M portfolio is delivering' },
      { letter: 'C', text: 'Workforce — the $140M travel nurse cost gap' },
      { letter: 'D', text: 'Quality — the MA Star Rating and $34M CMS bonus at risk' },
    ],
  }
}

const GENOME_BY_DOMAIN: Record<Domain, Array<{ code: string; rate: string; label: string }>> = {
  rcm:          [{ code: 'F011', rate: '71%', label: 'AI Deployment After EHR Go-Live' }, { code: 'F007', rate: '84%', label: 'Denial Rate Widens in EHR Transition' }],
  ai_tech:      [{ code: 'F002', rate: '79%', label: 'Missing or Powerless Sponsor' }, { code: 'F011', rate: '71%', label: 'AI Post Go-Live Deployment' }],
  supply_chain: [{ code: 'F022', rate: '58%', label: 'Supply Chain Fragmentation' }, { code: 'F031', rate: '55%', label: 'Vendor Dependency' }],
  generic:      [{ code: 'F002', rate: '79%', label: 'Missing or Powerless Sponsor' }, { code: 'F011', rate: '71%', label: 'AI Deployment Failure Pattern' }],
}

const DOMAIN_DOLLAR: Record<Domain, string> = {
  rcm: '$94M/yr', ai_tech: '$42M portfolio', supply_chain: '$31M gap', generic: '$94M+',
}

function deriveName(domain: Domain): string {
  if (domain === 'rcm')          return 'RCM Denial Prevention — Meridian Health'
  if (domain === 'ai_tech')      return 'AI ROI Verification — Meridian Health'
  if (domain === 'supply_chain') return 'Supply Chain Optimisation — Meridian Health'
  return 'Strategic Engagement — Meridian Health'
}

function EngagementsSection() {
  const [addMode, setAddMode]         = useState(false)
  const [chatStep, setChatStep]       = useState(0)
  const [canvasItems, setCanvasItems] = useState<Record<number, CanvasItem>>({})
  const [userInput, setUserInput]     = useState('')
  const [messages, setMessages]       = useState<ChatMsg[]>([{ type: 'ai', content: CHAT_QUESTIONS[0].ai }])
  const [domain, setDomain]           = useState<Domain>('generic')
  const [dynamicQ2, setDynamicQ2]     = useState<{ ai: string; options: Array<{ letter: string; text: string }> } | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const resetChat = () => {
    setAddMode(false); setChatStep(0); setCanvasItems({}); setUserInput('')
    setDomain('generic'); setDynamicQ2(null)
    setMessages([{ type: 'ai', content: CHAT_QUESTIONS[0].ai }])
  }

  const currentOptions = (): Array<{ letter: string; text: string }> => {
    if (chatStep === 1 && dynamicQ2) return dynamicQ2.options
    return CHAT_QUESTIONS[chatStep]?.options ?? []
  }

  const handleAnswer = (step: number, rawText: string) => {
    const cleanValue = step === 0 ? rawText : rawText.replace(/^[A-D]:\s*/, '')
    setCanvasItems(prev => ({ ...prev, [step]: { value: cleanValue, confirmedAt: Date.now() } }))

    const next: ChatMsg[] = [...messages, { type: 'user', content: rawText }]

    if (step === 0) {
      const d = detectDomain(rawText)
      setDomain(d)
      const q2 = getDomainQ2(d)
      setDynamicQ2(q2)
      next.push({ type: 'ai', content: q2.ai })
      setChatStep(1)
    } else if (step < CHAT_QUESTIONS.length - 1) {
      next.push({ type: 'ai', content: CHAT_QUESTIONS[step + 1].ai })
      setChatStep(step + 1)
    } else {
      next.push({ type: 'ai', content: 'All context captured. Your engagement canvas is complete on the right. Review and launch when ready.' })
      setChatStep(CHAT_QUESTIONS.length)
    }
    setMessages(next)
    setUserInput('')
  }

  const sendFreeText = () => {
    if (!userInput.trim()) return
    handleAnswer(chatStep, userInput.trim())
  }

  const handleLaunch = () => {
    const engagementId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)
    const ctx = {
      engagement_id: engagementId,
      client_id: 'meridian',
      name: canvasItems[0] ? deriveName(domain) : 'New Engagement',
      directive:              canvasItems[0]?.value ?? '',
      primary_problem:        canvasItems[1]?.value ?? '',
      primary_problem_dollar: DOMAIN_DOLLAR[domain],
      success_criteria:       canvasItems[2]?.value ?? '',
      what_good_looks_like:   canvasItems[3]?.value ?? '',
      timeline:               canvasItems[4]?.value ?? '',
      cxo_sponsor_name:       canvasItems[5]?.value ?? '',
      cxo_sponsor_title:      '',
      execution_path:         canvasItems[6]?.value ?? '',
      genome_patterns:        GENOME_BY_DOMAIN[domain].map(g => g.code),
      genome_success_rate:    domain === 'rcm' ? 74 : 68,
      skip_setup:             true,
      chat_history:           messages,
      created_at:             new Date().toISOString(),
    }
    try { localStorage.setItem('abarva_engagement_context', JSON.stringify(ctx)) } catch { /* ignore */ }
    router.push(`/ai-strategy?client=meridian&engagement_id=${engagementId}&skip_setup=true`)
  }

  const engagementName = canvasItems[0] ? deriveName(domain) : '[Engagement name auto-generates from your input]'

  if (addMode) {
    const showOpts    = chatStep >= 1 && chatStep < CHAT_QUESTIONS.length && messages[messages.length - 1]?.type === 'ai'
    const showLaunch  = chatStep >= CHAT_QUESTIONS.length

    return (
      <div>
        <button onClick={resetChat} style={{ fontFamily: SANS, fontSize: 15, color: TEXT2, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          ← Back to Engagements
        </button>

        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Setup & Configuration</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>Define the engagement.</h1>
        <div style={{ fontFamily: SANS, fontSize: 17, color: TEXT2, marginBottom: 32 }}>
          Tell me what your leadership wants to solve. I'll help you frame it into a structured engagement with clear outcomes and a Genome-validated success framework.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: 20, minHeight: 640 }}>
          {/* LEFT — Chat */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', minHeight: 640 }}>
            {/* Context banner */}
            <div style={{ background: PAGE, borderBottom: `1px solid ${BDR}`, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Engagement Assistant</div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT2 }}>Meridian Health · 5 files loaded · AI Readiness 42/100</div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  {m.type === 'ai' ? (
                    <div style={{ maxWidth: '92%' }}>
                      <div style={{ background: PAGE, borderRadius: '0 12px 12px 12px', padding: '20px 24px', marginBottom: 10 }}>
                        {m.content.split('\n\n').map((para, pi) => (
                          <p key={pi} style={{ fontFamily: SANS, fontSize: 16, color: TEXT, margin: pi === 0 ? 0 : '10px 0 0', lineHeight: 1.6 }}>{para}</p>
                        ))}
                      </div>
                      {/* Options on last AI message */}
                      {i === messages.length - 1 && showOpts && (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                          {currentOptions().map(opt => (
                            <button key={opt.letter} onClick={() => handleAnswer(chatStep, `${opt.letter}: ${opt.text}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 14, background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: '14px 18px', cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PAGE; (e.currentTarget as HTMLElement).style.borderColor = TEAL }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = CARD; (e.currentTarget as HTMLElement).style.borderColor = BDR }}
                            >
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: '#0C0C0C', flexShrink: 0 }}>{opt.letter}</div>
                              <div style={{ fontFamily: SANS, fontSize: 15, color: TEXT }}>{opt.text}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ background: TEXT, borderRadius: '12px 0 12px 12px', padding: '14px 18px', maxWidth: '80%' }}>
                        <div style={{ fontFamily: SANS, fontSize: 15, color: '#FFFFFF' }}>{m.content}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Text input (always visible, primary for Q1) */}
            {!showLaunch && (
              <div style={{ borderTop: `1px solid ${BDR}`, padding: '12px 20px', display: 'flex', gap: 10, flexShrink: 0 }}>
                <input value={userInput} onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendFreeText()}
                  placeholder={chatStep === 0 ? 'Describe the project in your own words...' : 'Or describe in your own words...'}
                  style={{ flex: 1, fontFamily: SANS, fontSize: 15, border: 'none', outline: 'none', background: 'transparent', color: TEXT }}
                />
                <button onClick={sendFreeText} style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: '#FFFFFF', background: TEXT, border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>Send</button>
              </div>
            )}
          </div>

          {/* RIGHT — Canvas */}
          <div style={{ background: PAGE, border: `1px solid ${BDR}`, borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 8 }}>Engagement Being Defined</div>
              <div style={{ fontFamily: SERIF, fontSize: 22, color: TEXT, lineHeight: 1.3 }}>{engagementName}</div>
            </div>

            {/* Canvas items */}
            {CANVAS_LABELS.map((label, idx) => {
              const item = canvasItems[idx]
              const isDirective = idx === 0
              return (
                <div key={idx} style={{ background: item ? CARD : 'transparent', border: item ? `1px solid ${BDR}` : `1px dashed ${BDR}`, borderLeft: item ? `3px solid ${TEAL}` : `1px dashed ${BDR}`, borderRadius: 8, padding: '14px 16px', opacity: item ? 1 : 0.45, transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{label}</div>
                    {item && <span style={{ fontFamily: MONO, fontSize: 9, color: TEAL }}>✓ confirmed</span>}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 15, color: item ? TEXT : MUTED, fontStyle: isDirective && item ? 'italic' : 'normal' }}>
                    {item ? (isDirective ? `"${item.value}"` : item.value) : 'Awaiting your answer...'}
                  </div>
                </div>
              )
            })}

            {/* Genome validation — updates based on detected domain */}
            <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT }}>Genome Validation</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const }}>
                  {domain === 'rcm' ? '31 Comparable Engagements' : domain === 'ai_tech' ? '18 Comparable Engagements' : '23 Comparable Engagements'}
                </div>
              </div>
              {GENOME_BY_DOMAIN[domain].map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${BDR}` }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL }}>{p.code}</div>
                    <div style={{ fontFamily: SANS, fontSize: 14, color: TEXT2 }}>{p.label}</div>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: RED }}>{p.rate} failure rate</div>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 10, marginTop: 4 }}>
                <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT2, marginBottom: 6 }}>{domain === 'rcm' ? 74 : 68}% success rate for this type</div>
                <div style={{ height: 6, background: BDR, borderRadius: 3 }}>
                  <div style={{ height: 6, borderRadius: 3, width: `${domain === 'rcm' ? 74 : 68}%`, background: TEAL }} />
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            {showLaunch && (
              <div>
                <button onClick={handleLaunch}
                  style={{ width: '100%', background: TEXT, color: '#FFFFFF', fontFamily: SANS, fontSize: 16, fontWeight: 600, height: 52, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  SAVE & LAUNCH ENGAGEMENT →
                </button>
                <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, textAlign: 'center' as const, marginTop: 8 }}>
                  Saves to Supabase · Writes context to AVR · Opens Phase 0 pre-populated
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Kanban default view
  const columns = ['Backlog', 'Assigned', 'In Progress', 'Complete']
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Setup & Configuration</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: 0 }}>Engagement Setup</h1>
        <button onClick={() => setAddMode(true)} style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: '#FFFFFF', background: TEXT, border: 'none', borderRadius: 6, height: 44, padding: '0 20px', cursor: 'pointer' }}>
          + Add Engagement
        </button>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 17, color: TEXT2, marginBottom: 32 }}>Define what you need to solve. The AI will help you frame it properly.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {columns.map(col => (
          <div key={col}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 12 }}>
              <span>{col}</span>
              <span>{ENGAGEMENTS.filter(e => e.status === col).length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {ENGAGEMENTS.filter(e => e.status === col).map(e => (
                <div key={e.id} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: PRIORITY_COLOR[e.priority] }}>● {e.priority}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, background: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>{e.type === 'AI Value Realization' ? 'AVR' : 'SOL'}</span>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 4, lineHeight: 1.3 }}>{e.name}</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, marginBottom: 12 }}>{e.client}</div>
                  {e.progress > 0 && (
                    <div style={{ height: 4, background: BDR, borderRadius: 2, marginBottom: 12 }}>
                      <div style={{ height: 4, borderRadius: 2, width: `${e.progress}%`, background: TEAL }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>{e.maestro}</span>
                    <button style={{ fontFamily: SANS, fontSize: 13, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Open in Maestro →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section: Users & Roles ─────────────────────────────────────────────────────
function UsersSection() {
  const [rolesOpen, setRolesOpen] = useState(false)
  const roleBadge = (role: string) =>
    role === 'Admin'   ? { bg: '#0C0C0C', color: '#FFFFFF' } :
    role === 'Maestro' ? { bg: 'rgba(45,212,200,0.15)', color: TEAL } :
                        { bg: '#F3F4F6', color: MUTED }
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>People & Access</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: 0 }}>Users & Roles</h1>
        <button style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: '#FFFFFF', background: TEXT, border: 'none', borderRadius: 6, height: 44, padding: '0 20px', cursor: 'pointer' }}>+ Invite User</button>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BDR}` }}>
              {['Name', 'Email', 'Role', 'Engagements', 'Last Active', ''].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left' as const, fontFamily: SANS, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {USERS.map((u, i) => {
              const b = roleBadge(u.role)
              return (
                <tr key={i} style={{ borderTop: `1px solid ${BDR}`, height: 64 }}>
                  <td style={{ padding: '0 20px', fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT }}>{u.name}</td>
                  <td style={{ padding: '0 20px', fontFamily: SANS, fontSize: 15, color: TEXT2 }}>{u.email}</td>
                  <td style={{ padding: '0 20px' }}>
                    <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 4, background: b.bg, color: b.color }}>{u.role.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '0 20px', fontFamily: SANS, fontSize: 15, color: TEXT2 }}>{u.engCount}</td>
                  <td style={{ padding: '0 20px', fontFamily: MONO, fontSize: 13, color: MUTED }}>{u.lastActive}</td>
                  <td style={{ padding: '0 20px' }}>
                    <button style={{ fontFamily: SANS, fontSize: 13, color: TEXT, background: CARD, border: `1px solid ${BDR}`, borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, overflow: 'hidden' }}>
        <button onClick={() => setRolesOpen(v => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT }}>Role Definitions</div>
          <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>{rolesOpen ? '▲' : '▼'}</span>
        </button>
        {rolesOpen && (
          <div style={{ borderTop: `1px solid ${BDR}`, padding: 20 }}>
            {[
              { role: 'Admin', desc: 'Full access — manages clients, engagements, data uploads, users, and billing.' },
              { role: 'Maestro', desc: 'Manages assigned engagements — runs AI modules, reviews situation intelligence, approves deliverables.' },
              { role: 'Viewer', desc: 'Read-only access — can view dashboards, reports, and engagement progress. Cannot edit or approve.' },
              { role: 'Client', desc: 'Client-facing portal access — sees their engagement progress, approves specific documents.' },
            ].map((r, i) => {
              const b = roleBadge(r.role)
              return (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: i < 3 ? `1px solid ${BDR}` : 'none' }}>
                  <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 4, background: b.bg, color: b.color, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>{r.role.toUpperCase()}</span>
                  <div style={{ fontFamily: SANS, fontSize: 15, color: TEXT2 }}>{r.desc}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section: Security ──────────────────────────────────────────────────────────
function SecuritySection() {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>People & Access</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 40px' }}>Security & Access</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BDR}` }}>
            <div style={{ fontFamily: SERIF, fontSize: 24, color: TEXT }}>Audit Log</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BDR}` }}>
                {['Timestamp', 'User', 'Action', 'Detail'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left' as const, fontFamily: SANS, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((e, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BDR}` }}>
                  <td style={{ padding: '14px 20px', fontFamily: MONO, fontSize: 12, color: MUTED, whiteSpace: 'nowrap' as const }}>{e.time}</td>
                  <td style={{ padding: '14px 20px', fontFamily: SANS, fontSize: 15, color: TEXT2 }}>{e.user}</td>
                  <td style={{ padding: '14px 20px', fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT }}>{e.action}</td>
                  <td style={{ padding: '14px 20px', fontFamily: SANS, fontSize: 14, color: MUTED }}>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 32 }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, color: TEXT, marginBottom: 20 }}>API Access</div>
          <div style={{ fontFamily: SANS, fontSize: 17, color: TEXT2, marginBottom: 24, lineHeight: 1.6 }}>
            Programmatic access to AbarVa data via authenticated API endpoints. Use for external dashboards, data pipelines, and integrations.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: PAGE, border: `1px solid ${BDR}`, borderRadius: 6, padding: '12px 16px', marginBottom: 20 }}>
            <span style={{ fontFamily: MONO, fontSize: 13, color: MUTED, flex: 1 }}>abv_live_••••••••••••••••••••••••••••</span>
            <button style={{ fontFamily: SANS, fontSize: 13, color: TEXT2, background: 'none', border: 'none', cursor: 'pointer' }}>Copy</button>
          </div>
          <button style={{ fontFamily: SANS, fontSize: 15, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View API docs →</button>
        </div>
      </div>
    </div>
  )
}

// ── Section: Backlog ───────────────────────────────────────────────────────────
function BacklogSection() {
  const [filterClient,   setFilterClient]   = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterStatus,   setFilterStatus]   = useState('All')

  const filtered = ENGAGEMENTS.filter(e => {
    if (e.status === 'Complete') return false
    if (filterClient   !== 'All' && e.client   !== filterClient)   return false
    if (filterPriority !== 'All' && e.priority  !== filterPriority) return false
    if (filterStatus   !== 'All' && e.status    !== filterStatus)   return false
    return true
  })

  const selStyle: React.CSSProperties = { fontFamily: SANS, fontSize: 15, color: TEXT, background: CARD, border: `1px solid ${BDR}`, borderRadius: 6, padding: '10px 14px', cursor: 'pointer', outline: 'none' }

  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Workload Management</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 32px' }}>Engagement Backlog</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select style={selStyle} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="All">All Clients</option>
          <option>Meridian Health</option>
          <option>Arcturus Financial</option>
        </select>
        <select style={selStyle} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="All">All Priorities</option>
          <option>Critical</option><option>High</option><option>Normal</option>
        </select>
        <select style={selStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option>Backlog</option><option>Assigned</option><option>In Progress</option>
        </select>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BDR}` }}>
              {['Engagement', 'Client', 'Sponsor', 'Function', 'Type', 'Priority', 'Maestro', 'Value', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left' as const, fontFamily: SANS, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const unassigned = e.maestro === '—' || e.maestro === 'TBD'
              return (
                <tr key={e.id} style={{ borderTop: `1px solid ${BDR}`, height: 64, borderLeft: unassigned ? `4px solid ${ORG}` : '4px solid transparent' }}>
                  <td style={{ padding: '0 20px', fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT }}>{e.name}</td>
                  <td style={{ padding: '0 20px', fontFamily: SANS, fontSize: 15, color: TEXT2 }}>{e.client}</td>
                  <td style={{ padding: '0 20px', fontFamily: SANS, fontSize: 13, color: TEXT2 }}>{e.sponsor}</td>
                  <td style={{ padding: '0 20px', fontFamily: MONO, fontSize: 11, color: TEAL }}>{e.function}</td>
                  <td style={{ padding: '0 20px', fontFamily: MONO, fontSize: 12, color: MUTED }}>{e.type === 'AI Value Realization' ? 'AVR' : 'SOL'}</td>
                  <td style={{ padding: '0 20px' }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: PRIORITY_COLOR[e.priority] ?? MUTED }}>● {e.priority}</span>
                  </td>
                  <td style={{ padding: '0 20px', fontFamily: SANS, fontSize: 15, color: unassigned ? ORG : TEXT2 }}>
                    {unassigned ? '⚠ Unassigned' : e.maestro}
                  </td>
                  <td style={{ padding: '0 20px', fontFamily: SERIF, fontSize: 15, color: TEXT }}>{e.value}</td>
                  <td style={{ padding: '0 20px' }}>
                    <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 4, color: STATUS_COLOR[e.status] ?? MUTED, background: STATUS_BG[e.status] ?? '#F3F4F6' }}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: '32px 20px', textAlign: 'center' as const, fontFamily: SANS, fontSize: 15, color: MUTED }}>No items match the current filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section: Assignment ────────────────────────────────────────────────────────
function AssignSection() {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Workload Management</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 40px' }}>Assignment</h1>

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 40, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 8 }}>Maestro</div>
            <div style={{ fontFamily: SERIF, fontSize: 32, color: TEXT }}>Anand Sundaram</div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 700, color: ORG, lineHeight: 1 }}>72%</div>
        </div>
        <div style={{ height: 8, background: BDR, borderRadius: 4, marginBottom: 10 }}>
          <div style={{ height: 8, borderRadius: 4, width: '72%', background: ORG }} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 15, color: MUTED, marginBottom: 32 }}>72% · 2 slots available</div>

        <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 14 }}>Active Engagements</div>
        {ENGAGEMENTS.filter(e => e.maestro === 'Anand S.' && e.status === 'In Progress').map((e, i) => (
          <div key={i} style={{ background: PAGE, border: `1px solid ${BDR}`, borderRadius: 8, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{e.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED }}>{e.client} · Phase {e.phase}</div>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 14, color: TEAL }}>{e.value}</div>
          </div>
        ))}

        <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.06em', marginTop: 28, marginBottom: 14 }}>Unassigned — Drag to Assign</div>
        {ENGAGEMENTS.filter(e => e.maestro === '—' || e.maestro === 'TBD').map((e, i) => (
          <div key={i} style={{ background: CARD, border: `2px dashed ${BDR}`, borderRadius: 8, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab' }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{e.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED }}>{e.client}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: PRIORITY_COLOR[e.priority] }}>● {e.priority}</span>
              <button style={{ fontFamily: SANS, fontSize: 14, color: TEAL, background: 'none', border: 'none', cursor: 'pointer' }}>Assign →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section: Capacity ──────────────────────────────────────────────────────────
function CapacitySection() {
  const capacity = 72
  const active   = ENGAGEMENTS.filter(e => e.status === 'In Progress' && e.maestro === 'Anand S.')
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Workload Management</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 40px' }}>Maestro Capacity</h1>

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 48, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 8 }}>Maestro</div>
            <div style={{ fontFamily: SERIF, fontSize: 32, color: TEXT }}>Anand Sundaram</div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 96, fontWeight: 700, color: ORG, lineHeight: 1 }}>{capacity}%</div>
        </div>
        <div style={{ height: 12, background: BDR, borderRadius: 6, marginBottom: 12 }}>
          <div style={{ height: 12, borderRadius: 6, width: `${capacity}%`, background: ORG }} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 15, color: MUTED, marginBottom: 32 }}>Capacity utilization · {100 - capacity}% headroom remaining</div>

        <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 14 }}>Active Engagements</div>
        {active.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: PAGE, borderRadius: 8, border: `1px solid ${BDR}`, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT }}>{e.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 2 }}>{e.client} · Phase {e.phase}</div>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 14, color: TEAL }}>{e.value}</div>
          </div>
        ))}
      </div>

      {active.length >= 2 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', borderLeft: `6px solid ${ORG}`, borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: ORG, textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 8 }}>⚠ Capacity Warning</div>
          <div style={{ fontFamily: SANS, fontSize: 16, color: TEXT2 }}>
            {active.length} active engagements at {capacity}% utilization. Recommend no more than {Math.max(0, 3 - active.length)} additional engagement before review.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Nav groups + section map ───────────────────────────────────────────────────
const NAV_GROUPS = [
  { label: 'SETUP & CONFIGURATION', items: [
    { key: 'setup'       as Section, label: 'Client Profile',   icon: '◉' },
    { key: 'data'        as Section, label: 'Data Uploads',     icon: '⊞' },
    { key: 'engagements' as Section, label: 'Engagement Setup', icon: '◈' },
  ]},
  { label: 'PEOPLE & ACCESS', items: [
    { key: 'users'    as Section, label: 'Users & Roles', icon: '◎' },
    { key: 'security' as Section, label: 'Security',      icon: '⬖' },
  ]},
  { label: 'WORKLOAD MANAGEMENT', items: [
    { key: 'backlog'  as Section, label: 'Backlog',    icon: '≡' },
    { key: 'assign'   as Section, label: 'Assignment', icon: '⊕' },
    { key: 'capacity' as Section, label: 'Capacity',   icon: '▦' },
  ]},
  { label: 'PROGRAMME DASHBOARD', items: [
    { key: 'programme' as Section, label: 'Progress & Metrics', icon: '⬡' },
  ]},
]

const SECTION_MAP: Record<Section, () => React.JSX.Element> = {
  programme:   ProgrammeDashboard,
  setup:       SetupSection,
  data:        DataSection,
  engagements: EngagementsSection,
  users:       UsersSection,
  security:    SecuritySection,
  backlog:     BacklogSection,
  assign:      AssignSection,
  capacity:    CapacitySection,
}

// ── Admin portal ───────────────────────────────────────────────────────────────
function AdminPortalInner() {
  const { user, isLoaded } = useUser()
  const router   = useRouter()
  const params   = useSearchParams()
  const [section, setSection] = useState<Section>((params.get('section') as Section) ?? 'programme')

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    const role = user.publicMetadata?.role as string
    if (role !== 'admin' && role !== 'investor') { router.push('/'); return }
  }, [isLoaded, user, router])

  if (!isLoaded || !user) return <div style={{ minHeight: '100vh', background: PAGE }} />

  const SectionComponent = SECTION_MAP[section]

  return (
    <div style={{ minHeight: '100vh', background: PAGE, fontFamily: SANS, color: TEXT }}>
      <AbarvaNav activePage="admin" />

      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* ── Dark sidebar ── */}
        <div style={{ width: 220, flexShrink: 0, background: SB, display: 'flex', flexDirection: 'column' as const, overflowY: 'auto' }}>
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 4 }}>AbarVa</div>
            <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Admin Portal</div>
          </div>

          <div style={{ padding: '12px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 8 }}>Active Clients</div>
            {[
              { id: 'meridian', name: 'Meridian Health', color: '#4DA3FF', status: 'Active' },
              { id: 'arcturus', name: 'Arcturus',         color: '#818CF8', status: 'Setup' },
            ].map(c => (
              <a key={c.id} href={`/admin/client/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, marginBottom: 2, textDecoration: 'none' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <span style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{c.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)', marginLeft: 'auto' }}>{c.status}</span>
              </a>
            ))}
          </div>

          <div style={{ flex: 1, padding: '8px 0 20px' }}>
            {NAV_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 4 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' as const, letterSpacing: '.1em', padding: '10px 18px 6px' }}>
                  {group.label}
                </div>
                {group.items.map(item => (
                  <button key={item.key} onClick={() => setSection(item.key)} style={{
                    width: '100%', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 18px', background: section === item.key ? 'rgba(45,212,200,0.08)' : 'none',
                    border: 'none', borderLeft: section === item.key ? `3px solid ${TEAL}` : '3px solid transparent', cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 13, color: section === item.key ? TEAL : 'rgba(255,255,255,0.35)', width: 18, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontFamily: SANS, fontSize: 13, color: section === item.key ? '#FFFFFF' : 'rgba(255,255,255,0.55)', fontWeight: section === item.key ? 600 : 400 }}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '48px 48px 80px' }}>
          <SectionComponent />
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: PAGE }} />}>
      <AdminPortalInner />
    </Suspense>
  )
}
