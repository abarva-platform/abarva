'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { CLIENT_REGISTRY, type ClientEntry, type DataCategory } from '@/lib/client-registry'

const T = {
  bg: '#060A12', surface: '#0D1520', surface2: '#162030',
  border: '#1C2D45', border2: '#2D3748',
  text: '#EFF6FF', text2: '#94A3B8',
  teal: '#2DD4C8', blue: '#4DA3FF', amber: '#F59E0B',
  red: '#EF4444', green: '#10B981', purple: '#A371F7',
  mono: 'JetBrains Mono, Menlo, monospace',
  sans: 'DM Sans, Inter, system-ui, sans-serif',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'ok'

interface MetricTile { label: string; value: string; context: string; benchmark: string; severity: Severity }
interface Approval   { file: string; category: string; uploadedBy: string; uploadedAt: string; size: string; hoursAgo: number }
interface Gap        { category: string; confidence: string; reason: string; unlocks: string }
interface AuditEntry { time: string; user: string; action: string; category: string }

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getMetricTiles(client: ClientEntry): MetricTile[] {
  if (client.id === 'meridian') return [
    { label: 'RCM DENIAL RATE',   value: '18.2%',    context: '↑ Critical',          benchmark: 'BM: 11.4%',       severity: 'critical' },
    { label: 'OPERATING MARGIN',  value: '1.8%',     context: '↓ Falling',           benchmark: 'Target: 4.0%',    severity: 'critical' },
    { label: 'EPIC OPTIMIZATION', value: '58/100',   context: '↓ Below target',      benchmark: 'Target: 85',      severity: 'warning'  },
    { label: 'AI PILOTS LIVE',    value: '0/6',      context: 'All stalled',         benchmark: '$42M committed',  severity: 'critical' },
    { label: 'PRIOR AUTH',        value: '23%',      context: '↓ Below peers',       benchmark: 'Peers: 62%',      severity: 'warning'  },
    { label: 'MA STAR RATING',    value: '3.5',      context: 'Below bonus tier',    benchmark: 'Need: 4.0',       severity: 'warning'  },
  ]
  if (client.id === 'firstcapital') return [
    { label: 'DIGITAL ADOPTION',  value: '41%',      context: '↓ Critical',          benchmark: 'BM: 67%',         severity: 'critical' },
    { label: 'CORE SYSTEM AGE',   value: '22 yrs',   context: 'FIS HORIZON',         benchmark: 'Urgent',          severity: 'critical' },
    { label: 'FEDNOW COMPLIANT',  value: 'No',       context: 'Jan 2027 deadline',   benchmark: '9 months',        severity: 'warning'  },
    { label: 'AI INITIATIVES',    value: '28 active',context: '$0 tracked outcomes', benchmark: 'No accountability',severity: 'critical' },
    { label: 'C/I RATIO',         value: '68%',      context: '↓ Above target',      benchmark: 'BM: 55%',         severity: 'warning'  },
    { label: 'IT BUDGET',         value: '$168M',    context: '0.93% of AUM',        benchmark: 'vs 1.2% peer',    severity: 'warning'  },
  ]
  if (client.id === 'apexretail') return [
    { label: 'EINSTEIN AI',       value: '$248M',    context: 'Idle · Not delivering',benchmark: 'Fully licensed', severity: 'critical' },
    { label: 'CART ABANDONMENT',  value: '72%',      context: 'BM: 58%',             benchmark: '$31M gap',        severity: 'critical' },
    { label: 'INVENTORY TURNS',   value: '4.2x',     context: 'BM: 6.1x',            benchmark: 'Below peers',     severity: 'warning'  },
    { label: 'SHADOW IT',         value: '$38M',     context: 'Untracked SaaS',       benchmark: 'Procurement risk',severity: 'warning'  },
    { label: 'eCOMM CONVERSION',  value: '2.3%',     context: 'BM: 3.8%',            benchmark: '$18M gap',        severity: 'critical' },
    { label: 'IT BUDGET',         value: '$285M',    context: '2.4% of revenue',      benchmark: 'vs 2.8% peers',  severity: 'ok'       },
  ]
  return client.keyMetrics.map(m => ({
    label: m.label.toUpperCase(),
    value: m.value,
    context: m.status === 'critical' ? '↑ Critical' : m.status === 'warning' ? '↓ Below target' : 'On track',
    benchmark: m.target,
    severity: m.status,
  }))
}

function getPendingApprovals(client: ClientEntry): Approval[] {
  if (client.id === 'meridian') return [
    { file: 'meridian_payer_contracts_2026.xlsx',   category: 'VENDORS',    uploadedBy: 'James Whitfield (COO)',     uploadedAt: 'Apr 12, 9:42 AM',  size: '3.2 MB',  hoursAgo: 29 },
    { file: 'meridian_claims_denial_90d.csv',        category: 'FINANCIALS', uploadedBy: 'Robert Chen (CFO)',         uploadedAt: 'Apr 13, 8:15 AM',  size: '18.7 MB', hoursAgo: 3  },
    { file: 'meridian_physician_survey_q1.docx',     category: 'LEADERSHIP', uploadedBy: 'Dr. Sarah Okonkwo (CMIO)', uploadedAt: 'Apr 13, 11:30 AM', size: '1.4 MB',  hoursAgo: 1  },
  ]
  if (client.id === 'firstcapital') return [
    { file: 'firstcapital_occ_mra_2026.pdf',          category: 'FINANCIALS', uploadedBy: 'Sandra Williams (COO)',  uploadedAt: 'Apr 11, 2:14 PM',  size: '4.1 MB',  hoursAgo: 50 },
    { file: 'firstcapital_fraud_transactions_q1.csv', category: 'TECHNOLOGY', uploadedBy: 'James Okafor (CTO)',     uploadedAt: 'Apr 12, 4:05 PM',  size: '22.3 MB', hoursAgo: 20 },
    { file: 'firstcapital_competitor_rates.xlsx',     category: 'FINANCIALS', uploadedBy: 'Robert Martinez (CFO)',  uploadedAt: 'Apr 13, 9:00 AM',  size: '0.8 MB',  hoursAgo: 4  },
  ]
  return [
    { file: 'apex_store_traffic_90d.csv',             category: 'TECHNOLOGY', uploadedBy: 'Lisa Thompson (CSCO)',   uploadedAt: 'Apr 13, 10:00 AM', size: '6.2 MB',  hoursAgo: 2  },
    { file: 'apex_cdp_segment_sample.xlsx',           category: 'FINANCIALS', uploadedBy: 'Marco Reyes (CMO)',      uploadedAt: 'Apr 13, 9:30 AM',  size: '1.1 MB',  hoursAgo: 3  },
    { file: 'apex_supplier_contracts_2026.xlsx',      category: 'VENDORS',    uploadedBy: 'Lisa Thompson (CSCO)',   uploadedAt: 'Apr 12, 3:00 PM',  size: '2.8 MB',  hoursAgo: 22 },
  ]
}

function getDataGaps(client: ClientEntry): Gap[] {
  if (client.id === 'meridian') return [
    { category: 'Payer Contract Terms',       confidence: '+4% confidence', reason: 'Payer-specific clauses enable contract risk analysis and targeted renegotiation playbooks vs generic benchmarks.',               unlocks: 'Select Intelligence — payer contract scoring'    },
    { category: 'Claims Denial Codes (90d)',  confidence: '+3% confidence', reason: 'Granular denial codes enable root cause analysis beyond aggregate rate — required to prioritize prior auth automation vendors.', unlocks: 'Situation Intelligence — denial root cause'       },
    { category: 'Physician Satisfaction',     confidence: '+2% confidence', reason: 'Structured physician sentiment improves change readiness scoring and clinical champion identification.',                         unlocks: 'Stakeholder Intelligence — champion map'         },
  ]
  if (client.id === 'firstcapital') return [
    { category: 'Competitor Rate Sheet',      confidence: '+5% confidence', reason: 'Competitor deposit pricing data improves deposit pricing optimization ROI model accuracy by 40%.',                              unlocks: 'AI Investment Intelligence — deposit pricing'    },
    { category: 'OCC MRA Full Text',          confidence: '+4% confidence', reason: 'Full MRA documentation enables AML remediation prioritization and timeline estimation.',                                        unlocks: 'Select Intelligence — AML vendor scoring'        },
    { category: 'Fraud Transaction Sample',   confidence: '+3% confidence', reason: 'Anonymized fraud transactions enable fraud model training readiness assessment before vendor selection.',                        unlocks: 'Data Intelligence — fraud model readiness'       },
  ]
  return [
    { category: 'Store Traffic Data (90d)',   confidence: '+4% confidence', reason: 'Granular traffic data improves labor optimization and loss prevention AI scoping.',                                              unlocks: 'AI Investment Intelligence — labor optimization'  },
    { category: 'CDP Segment Export Sample',  confidence: '+3% confidence', reason: 'Segment identity resolution scope requires sample of fragmented customer profiles.',                                            unlocks: 'Data Intelligence — identity resolution scope'   },
    { category: 'Supplier Contract Terms',    confidence: '+2% confidence', reason: 'Supplier contract data enables procurement AI opportunity sizing for demand chain optimization.',                               unlocks: 'Select Intelligence — procurement AI'            },
  ]
}

function getAuditLog(client: ClientEntry): AuditEntry[] {
  return [
    { time: 'Today 11:31', user: 'Anand Sundaram',    action: 'Viewed Data & Files tab',          category: 'ALL'       },
    { time: 'Today 11:29', user: client.id === 'meridian' ? 'Dr. Sarah Okonkwo' : client.id === 'firstcapital' ? 'Sandra Williams' : 'Lisa Thompson', action: 'Uploaded file', category: 'LEADERSHIP' },
    { time: 'Today 09:15', user: client.id === 'meridian' ? 'Robert Chen' : client.id === 'firstcapital' ? 'Robert Martinez' : 'David Kim', action: 'Approved outcomes file', category: 'OUTCOMES'  },
    { time: 'Today 08:15', user: client.id === 'meridian' ? 'Robert Chen' : 'Robert Martinez',   action: 'Uploaded file',                    category: 'FINANCIALS' },
    { time: 'Yesterday',   user: 'Anand Sundaram',    action: 'Ran Situation Intelligence',       category: 'AI'        },
    { time: 'Yesterday',   user: client.id === 'meridian' ? 'Marcus Webb' : client.id === 'firstcapital' ? 'James Okafor' : 'Margaret Chen', action: 'Viewed Intelligence tab', category: 'ALL' },
    { time: 'Apr 12',      user: 'Anand Sundaram',    action: 'Generated board deck',             category: 'AI'        },
    { time: 'Apr 12',      user: 'Anand Sundaram',    action: 'Loaded technology data',           category: 'TECHNOLOGY'},
    { time: 'Apr 11',      user: 'Anand Sundaram',    action: 'Loaded clinical data',             category: 'CLINICAL'  },
    { time: 'Apr 10',      user: 'System',            action: `Confidence updated: ${client.dataCompleteness}%`, category: 'SYSTEM' },
  ]
}

// ─── Intelligence products ────────────────────────────────────────────────────

const ALL_PRODUCTS = [
  { name: 'Situation Intelligence',       href: '/diagnose',          question: 'What is actually broken — and what is it costing us?' },
  { name: 'AI Investment Intelligence',   href: '/ai-strategy',       question: 'Where should we place our AI bets?' },
  { name: 'Select Intelligence',          href: '/select',            question: 'Which vendor wins for this decision?' },
  { name: 'Blueprint Intelligence',       href: '/blueprint',         question: 'What is the right architecture for our constraints?' },
  { name: 'Business Case Intelligence',   href: '/justify',           question: 'How do we build the CFO-grade business case?' },
  { name: 'Architecture Intelligence',    href: '/architecture',      question: 'How do we future-proof the data foundation?' },
  { name: 'Data Intelligence',            href: '/data-intelligence', question: 'What is our data actually ready to support?' },
  { name: 'Domain Strategy Intelligence', href: '/domain-strategy',   question: 'How does this fit our long-term strategy?' },
  { name: 'Outcome Intelligence',         href: '/outcomes',          question: 'Are our AI investments actually working?' },
]

const TABS = ['Overview', 'Data & Files', 'Gaps & Needs', 'Approvals', 'Audit Log', 'Intelligence', 'Team Access']

// ─── Access pill helper ───────────────────────────────────────────────────────

function getAccessPill(key: string): { label: string; color: string } {
  if (key === 'financials' || key === 'vendors')
    return { label: 'Role-restricted', color: '#EF4444' }
  if (key === 'leadership' || key === 'interviews')
    return { label: 'Maestro only', color: '#6366F1' }
  return { label: 'All users', color: '#2DD4C8' }
}

// ─── CSS animations (injected once at the root) ───────────────────────────────

const ANIM_CSS = `
  @keyframes urgent-pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 5px #EF4444; }
    50%       { opacity: 0.35; box-shadow: 0 0 10px #EF4444; }
  }
  .urgent-dot { animation: urgent-pulse 1.4s ease-in-out infinite; }
`

// ─── Components ───────────────────────────────────────────────────────────────

function MetricCard({ tile }: { tile: MetricTile }) {
  const c = tile.severity === 'critical' ? T.red : tile.severity === 'warning' ? T.amber : T.green
  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c }} />
      <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: T.mono, marginBottom: '8px' }}>{tile.label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: tile.severity === 'ok' ? T.text : c, fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1, marginBottom: '6px' }}>{tile.value}</div>
      <div style={{ fontSize: '11px', color: c, marginBottom: '3px', fontFamily: T.sans }}>{tile.context}</div>
      <div style={{ fontSize: '10px', color: T.text2, fontFamily: T.sans }}>{tile.benchmark}</div>
    </div>
  )
}

function CategoryRow({ cat, color }: { cat: DataCategory; color: string }) {
  const [open, setOpen] = useState(false)
  const pct = cat.status === 'loaded' ? 100 : cat.status === 'pending' ? 50 : 10
  const barC = pct >= 80 ? T.teal : pct >= 40 ? T.amber : T.red
  const badgeC = cat.status === 'loaded' ? T.green : cat.status === 'pending' ? T.amber : T.red
  const badgeL = cat.status === 'loaded' ? 'Active' : cat.status === 'pending' ? 'Pending' : 'Missing'

  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', marginBottom: '8px', overflow: 'hidden' }}>
      <div style={{ height: '3px', background: T.border }}>
        <div style={{ height: '100%', width: pct + '%', background: barC, transition: 'width 600ms' }} />
      </div>
      <div onClick={() => setOpen(!open)} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: T.text, fontFamily: T.sans }}>{cat.label}</div>
          <div style={{ fontSize: '11px', color: T.text2, marginTop: '2px', fontFamily: T.sans }}>
            {cat.fileName ? cat.fileName + ' · ' : ''}{cat.loadedDate ? 'Loaded ' + cat.loadedDate : 'Not loaded'}
          </div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 600, color: badgeC, background: badgeC + '18', border: '1px solid ' + badgeC + '40', borderRadius: '20px', padding: '2px 10px' }}>{badgeL}</span>
        <span style={{ color: open ? T.teal : T.text2, fontSize: '16px', display: 'inline-block', transition: 'transform 200ms', transform: open ? 'rotate(90deg)' : 'none' }}>›</span>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid ' + T.border, padding: '14px 16px' }}>
          {cat.fileName && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 160px 100px', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid ' + T.border, marginBottom: '8px' }}>
                {['File', 'Uploaded by', 'Approved by', 'Access'].map(h => (
                  <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: T.text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono }}>{h}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 160px 100px', gap: '8px', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: T.text, fontFamily: T.sans }}>{cat.fileName}</div>
                <div>
                  <div style={{ fontSize: '11px', color: T.text, fontFamily: T.sans }}>{cat.approvedBy?.split('(')[0].trim() ?? 'Maestro'}</div>
                  <div style={{ fontSize: '10px', color: T.text2 }}>{cat.loadedDate}</div>
                </div>
                <div style={{ fontSize: '11px', color: cat.approvedBy ? T.text : T.amber, fontFamily: T.sans }}>
                  {cat.approvedBy ?? '⏳ Pending approval'}
                </div>
                {(() => { const ap = getAccessPill(cat.key); return <span style={{ fontSize: '10px', fontWeight: 600, color: ap.color, background: ap.color + '18', border: '1px solid ' + ap.color + '40', borderRadius: '20px', padding: '2px 8px', width: 'fit-content' }}>{ap.label}</span> })()}
              </div>
            </>
          )}
          {cat.keyPoints.length > 0 && (
            <div style={{ background: T.bg, borderRadius: '8px', border: '1px solid ' + T.border, padding: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: T.mono, marginBottom: '6px' }}>KEY POINTS</div>
              {cat.keyPoints.map((kp, i) => (
                <div key={i} style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans, padding: '2px 0', display: 'flex', gap: '8px' }}>
                  <span style={{ color: T.teal }}>·</span><span>{kp}</span>
                </div>
              ))}
            </div>
          )}
          {cat.powers.length > 0 && (
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: T.text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono, marginBottom: '6px' }}>POWERS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {cat.powers.map((p, i) => (
                  <span key={i} style={{ fontSize: '10px', color, background: color + '15', border: '1px solid ' + color + '40', borderRadius: '4px', padding: '2px 7px', fontFamily: T.sans }}>{p.split(' — ')[0]}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function TabOverview({ client }: { client: ClientEntry }) {
  const tiles = getMetricTiles(client)
  const approvals = getPendingApprovals(client)
  const gaps = getDataGaps(client)
  const auditLog = getAuditLog(client)
  const relevantCats = client.dataCategories.filter(c => c.status !== 'na')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      {/* Left */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {tiles.map(t => <MetricCard key={t.label} tile={t} />)}
        </div>

        <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: T.mono, marginBottom: '10px' }}>DATA CATEGORIES</div>
        {relevantCats.map(cat => <CategoryRow key={cat.key} cat={cat} color={client.color} />)}

        <div style={{ marginTop: '12px', border: '1px dashed ' + T.border, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: '13px', color: T.text2, fontFamily: T.sans, marginBottom: '4px' }}>Upload a new data file</div>
          <div style={{ fontSize: '11px', color: T.text2, opacity: 0.7, fontFamily: T.sans, marginBottom: '12px' }}>Excel, CSV, Word, PDF · All uploads logged and require approval</div>
          <button style={{ padding: '8px 20px', background: T.teal, border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: T.bg, cursor: 'pointer', fontFamily: T.sans }}>Choose File</button>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Pending Approvals */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: T.mono, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            PENDING APPROVALS
            <span style={{ background: T.red, color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '9px' }}>{approvals.length}</span>
          </div>
          {approvals.map((a, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < approvals.length - 1 ? '1px solid ' + T.border : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '3px' }}>
                {a.hoursAgo > 48 && <span className="urgent-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.red, flexShrink: 0, marginTop: '3px' }} />}
                <div style={{ fontSize: '12px', fontWeight: 500, color: T.text, fontFamily: T.sans, wordBreak: 'break-all', lineHeight: 1.4 }}>{a.file}</div>
              </div>
              <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans, marginBottom: '8px' }}>{a.uploadedBy} · {a.uploadedAt}</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button style={{ flex: 1, padding: '5px', background: T.teal + '20', border: '1px solid ' + T.teal + '40', borderRadius: '5px', fontSize: '10px', fontWeight: 600, color: T.teal, cursor: 'pointer', fontFamily: T.sans }}>✓ Approve</button>
                <button style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid ' + T.border2, borderRadius: '5px', fontSize: '10px', fontWeight: 600, color: T.text, cursor: 'pointer', fontFamily: T.sans }}>Restrict</button>
                <button style={{ flex: 1, padding: '5px', background: T.red + '15', border: '1px solid ' + T.red + '40', borderRadius: '5px', fontSize: '10px', fontWeight: 600, color: T.red, cursor: 'pointer', fontFamily: T.sans }}>Reject</button>
              </div>
            </div>
          ))}
        </div>

        {/* Data Gaps */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: T.mono, marginBottom: '12px' }}>DATA GAPS</div>
          {gaps.map((g, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < gaps.length - 1 ? '1px solid ' + T.border : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: T.text, fontFamily: T.sans }}>{g.category}</div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: T.amber, fontFamily: T.mono, flexShrink: 0 }}>{g.confidence}</span>
              </div>
              <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans, marginBottom: '6px', lineHeight: 1.5 }}>{g.reason}</div>
              <div style={{ fontSize: '10px', color: T.text2, fontFamily: T.sans, marginBottom: '8px' }}>Unlocks: <span style={{ color: T.teal }}>{g.unlocks}</span></div>
              <button style={{ padding: '4px 12px', background: 'transparent', border: '1px solid ' + T.teal + '50', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: T.teal, cursor: 'pointer', fontFamily: T.sans }}>Download Template</button>
            </div>
          ))}
        </div>

        {/* Audit Log */}
        <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: T.mono, marginBottom: '12px' }}>AUDIT LOG</div>
          {auditLog.slice(0, 7).map((e, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 56px', gap: '6px', padding: '5px 0', borderBottom: i < 6 ? '1px solid ' + T.border : 'none', alignItems: 'baseline' }}>
              <div style={{ fontSize: '10px', color: T.text2, fontFamily: T.sans }}>{e.time}</div>
              <div>
                <div style={{ fontSize: '11px', color: T.teal, fontFamily: T.sans }}>{e.user}</div>
                <div style={{ fontSize: '10px', color: T.text2, fontFamily: T.sans }}>{e.action}</div>
              </div>
              <div style={{ fontSize: '9px', color: T.text2, fontFamily: T.mono, textAlign: 'right' }}>{e.category}</div>
            </div>
          ))}
          <div style={{ marginTop: '10px', fontSize: '11px', color: T.teal, fontFamily: T.sans, cursor: 'pointer' }}>View full log →</div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Data & Files ────────────────────────────────────────────────────────

function TabDataFiles({ client }: { client: ClientEntry }) {
  const [filter, setFilter] = useState('All')
  const cats = client.dataCategories.filter(c => c.status !== 'na')
  const filters = ['All', ...cats.map(c => c.label)]
  const shown = filter === 'All' ? cats : cats.filter(c => c.label === filter)

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: filter === f ? T.teal : 'transparent', color: filter === f ? T.bg : T.text, border: '1px solid ' + (filter === f ? T.teal : T.border), cursor: 'pointer', fontFamily: T.sans }}>{f}</button>
        ))}
      </div>
      {shown.map(cat => (
        <div key={cat.key} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: T.text, fontFamily: T.sans }}>{cat.label}</div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: T.green, background: T.green + '18', border: '1px solid ' + T.green + '30', borderRadius: '10px', padding: '2px 8px' }}>Active</span>
          </div>
          {cat.fileName ? (
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px 100px', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid ' + T.border, marginBottom: '8px' }}>
                {['File', 'Uploaded by', 'Approved by', 'Access'].map(h => (
                  <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: T.text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono }}>{h}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px 100px', gap: '8px', alignItems: 'start' }}>
                <div style={{ fontSize: '12px', color: T.text, fontFamily: T.sans }}>{cat.fileName}</div>
                <div>
                  <div style={{ fontSize: '11px', color: T.text, fontFamily: T.sans }}>{cat.approvedBy?.split('(')[0].trim() ?? 'Maestro'}</div>
                  <div style={{ fontSize: '10px', color: T.text2 }}>{cat.loadedDate}</div>
                </div>
                <div style={{ fontSize: '11px', color: T.text, fontFamily: T.sans }}>{cat.approvedBy ?? '—'}</div>
                {(() => { const ap = getAccessPill(cat.key); return <span style={{ fontSize: '10px', fontWeight: 600, color: ap.color, background: ap.color + '18', border: '1px solid ' + ap.color + '40', borderRadius: '10px', padding: '2px 8px', width: 'fit-content' }}>{ap.label}</span> })()}
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', fontSize: '12px', color: T.text2, fontFamily: T.sans }}>No files uploaded yet</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Gaps & Needs ────────────────────────────────────────────────────────

function TabGapsNeeds({ client }: { client: ClientEntry }) {
  const gaps = getDataGaps(client)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {gaps.map((g, i) => (
        <div key={i} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: T.text, fontFamily: T.sans }}>{g.category}</div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: T.amber, fontFamily: T.mono, flexShrink: 0 }}>{g.confidence}</span>
          </div>
          <div style={{ fontSize: '13px', color: T.text2, fontFamily: T.sans, lineHeight: 1.7, marginBottom: '10px' }}>{g.reason}</div>
          <div style={{ fontSize: '12px', color: T.text2, fontFamily: T.sans, marginBottom: '14px' }}>Unlocks: <span style={{ color: T.teal }}>{g.unlocks}</span></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ padding: '7px 16px', background: 'transparent', border: '1px solid ' + T.teal, borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: T.teal, cursor: 'pointer', fontFamily: T.sans }}>Download Template</button>
            <button style={{ padding: '7px 16px', background: T.teal + '15', border: '1px solid ' + T.teal + '40', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: T.teal, cursor: 'pointer', fontFamily: T.sans }}>Mark as In Progress</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Approvals ───────────────────────────────────────────────────────────

function TabApprovals({ client }: { client: ClientEntry }) {
  const approvals = getPendingApprovals(client)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      {[
        { label: 'Pending', color: T.amber, count: approvals.length },
        { label: 'Approved', color: T.green, count: 0 },
        { label: 'Rejected', color: T.red, count: 0 },
      ].map((col, ci) => (
        <div key={col.label}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: col.color, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: T.mono, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {col.label}
            {ci === 0 && <span style={{ background: T.red, color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '9px' }}>{col.count}</span>}
          </div>
          {ci === 0 && approvals.map((a, i) => (
            <div key={i} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: T.text, fontFamily: T.sans, wordBreak: 'break-all', marginBottom: '4px', lineHeight: 1.4 }}>{a.file}</div>
              <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans, marginBottom: '2px' }}>{a.category} · {a.size}</div>
              <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans, marginBottom: '10px' }}>{a.uploadedBy} · {a.uploadedAt}</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button style={{ flex: 1, padding: '6px', background: T.teal + '20', border: '1px solid ' + T.teal + '40', borderRadius: '5px', fontSize: '10px', fontWeight: 600, color: T.teal, cursor: 'pointer', fontFamily: T.sans }}>✓ Approve</button>
                <button style={{ flex: 1, padding: '6px', background: 'transparent', border: '1px solid ' + T.border2, borderRadius: '5px', fontSize: '10px', fontWeight: 600, color: T.text, cursor: 'pointer', fontFamily: T.sans }}>Restrict</button>
                <button style={{ flex: 1, padding: '6px', background: T.red + '15', border: '1px solid ' + T.red + '40', borderRadius: '5px', fontSize: '10px', fontWeight: 600, color: T.red, cursor: 'pointer', fontFamily: T.sans }}>Reject</button>
              </div>
            </div>
          ))}
          {ci > 0 && (
            <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '16px', fontSize: '12px', color: T.text2, fontFamily: T.sans }}>
              {ci === 1 ? 'All approved files are visible in Data & Files.' : 'No rejected files.'}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Audit Log ───────────────────────────────────────────────────────────

function TabAuditLog({ client }: { client: ClientEntry }) {
  const log = getAuditLog(client)
  const cols = ['Timestamp', 'User', 'Role', 'Action', 'Category']
  const tpl = '120px 160px 120px 1fr 100px'
  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: tpl, gap: '12px', padding: '12px 16px', borderBottom: '1px solid ' + T.border }}>
        {cols.map(h => <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: T.text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono }}>{h}</div>)}
      </div>
      {log.map((e, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: tpl, gap: '12px', padding: '10px 16px', borderBottom: i < log.length - 1 ? '1px solid ' + T.border : 'none', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans }}>{e.time}</div>
          <div style={{ fontSize: '11px', color: T.teal, fontFamily: T.sans }}>{e.user}</div>
          <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans }}>Maestro</div>
          <div style={{ fontSize: '11px', color: T.text, fontFamily: T.sans }}>{e.action}</div>
          <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.mono }}>{e.category}</div>
        </div>
      ))}
      <div style={{ padding: '12px 16px', borderTop: '1px solid ' + T.border }}>
        <button style={{ padding: '6px 14px', background: 'transparent', border: '1px solid ' + T.border2, borderRadius: '5px', fontSize: '11px', fontWeight: 600, color: T.text, cursor: 'pointer', fontFamily: T.sans }}>Download CSV</button>
      </div>
    </div>
  )
}

// ─── Tab: Intelligence ────────────────────────────────────────────────────────

function TabIntelligence({ client }: { client: ClientEntry }) {
  const readyHrefs = new Set(client.intelligence.ready.map(r => r.href.split('?')[0]))
  const color = client.color
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
      {ALL_PRODUCTS.map(p => {
        const ready = readyHrefs.has(p.href)
        const avail = !ready && client.dataCompleteness >= 80
        const sc = ready ? T.green : avail ? T.amber : T.text2
        const label = ready ? 'READY' : avail ? 'AVAILABLE' : 'NEEDS DATA'
        return (
          <div key={p.name} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc, display: 'inline-block' }} />
              <span style={{ fontSize: '9px', fontWeight: 700, color: sc, letterSpacing: '0.1em', fontFamily: T.mono }}>{label}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: T.text, fontFamily: T.sans }}>{p.name}</div>
            <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans, flex: 1, lineHeight: 1.5 }}>{p.question}</div>
            {(ready || avail) && (
              <Link href={p.href + '?client=' + client.id} style={{ display: 'block', textAlign: 'center', padding: '7px', background: ready ? color + '20' : 'transparent', border: '1px solid ' + (ready ? color + '50' : T.border2), borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: ready ? color : T.text, textDecoration: 'none' }}>
                {ready ? 'Run →' : 'Preview →'}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Team Access ─────────────────────────────────────────────────────────

function TabTeamAccess({ client }: { client: ClientEntry }) {
  const cxo = client.id === 'meridian' ? { name: 'Marcus Webb', role: 'CIO' }
    : client.id === 'firstcapital' ? { name: 'James Okafor', role: 'CTO' }
    : { name: 'Margaret Chen', role: 'CEO' }
  const cfo = client.id === 'meridian' ? 'Robert Chen' : client.id === 'firstcapital' ? 'Robert Martinez' : 'David Kim'
  const team = [
    { name: 'Anand Sundaram', role: 'Lead Maestro', access: 'Maestro',   assignedBy: 'System',          date: client.startDate, last: 'Today'      },
    { name: cxo.name,         role: cxo.role,       access: 'View only', assignedBy: 'Anand Sundaram',  date: client.startDate, last: 'Apr 12'     },
    { name: cfo,              role: 'CFO',          access: 'View only', assignedBy: 'Anand Sundaram',  date: client.startDate, last: 'Yesterday'  },
  ]
  const ac: Record<string, string> = { Maestro: T.teal, 'View only': T.text2 }
  const tpl = '1fr 140px 110px 150px 120px 100px'
  const hdrs = ['Name', 'Role', 'Access Level', 'Assigned By', 'Date', 'Last Active']
  return (
    <div>
      <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: tpl, gap: '12px', padding: '12px 16px', borderBottom: '1px solid ' + T.border }}>
          {hdrs.map(h => <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: T.text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono }}>{h}</div>)}
        </div>
        {team.map((m, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: tpl, gap: '12px', padding: '12px 16px', borderBottom: i < team.length - 1 ? '1px solid ' + T.border : 'none', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: T.text, fontFamily: T.sans }}>{m.name}</div>
            <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans }}>{m.role}</div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: ac[m.access] ?? T.text2, background: (ac[m.access] ?? T.text2) + '18', border: '1px solid ' + (ac[m.access] ?? T.text2) + '40', borderRadius: '10px', padding: '2px 8px', width: 'fit-content' }}>{m.access}</span>
            <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans }}>{m.assignedBy}</div>
            <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.sans }}>{m.date}</div>
            <div style={{ fontSize: '11px', color: T.teal, fontFamily: T.sans }}>{m.last}</div>
          </div>
        ))}
      </div>
      <button style={{ padding: '8px 20px', background: 'transparent', border: '1px solid ' + T.teal, borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: T.teal, cursor: 'pointer', fontFamily: T.sans }}>+ Add Team Member</button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDashboard({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params)
  const [activeTab, setActiveTab] = useState(0)
  const client = CLIENT_REGISTRY.find(c => c.id === clientId)

  if (!client) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: T.text, marginBottom: '8px' }}>Client not found</div>
          <Link href="/admin" style={{ color: T.teal, textDecoration: 'none', fontSize: '14px' }}>← Back to Engagements</Link>
        </div>
      </div>
    )
  }

  const color = client.color
  const approvalCount = getPendingApprovals(client).length

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
      {/* Color strip */}
      <div style={{ height: '4px', background: color }} />

      {/* Header */}
      <div style={{ borderBottom: '1px solid ' + T.border, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', border: '1px solid ' + T.border, borderRadius: '6px', fontSize: '13px', color: T.text, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          ← Engagements
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: 500, color: T.text, marginBottom: '3px' }}>{client.name}</div>
          <div style={{ fontSize: '12px', color: T.text2 }}>{client.vertical} · {client.revenue} · {client.employees} employees · Lead Maestro: {client.maestro}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.teal, background: T.teal + '18', border: '1px solid ' + T.teal + '30', borderRadius: '20px', padding: '4px 12px', fontFamily: T.mono, letterSpacing: '0.1em' }}>LEAD MAESTRO</span>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '8px', padding: '6px 14px', textAlign: 'center', minWidth: '72px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: T.text, lineHeight: 1, fontFamily: "'Fraunces', Georgia, serif" }}>{client.dataCompleteness}%</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono }}>CONFIDENCE</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid ' + T.border, padding: '0 32px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{ padding: '14px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === i ? '2px solid ' + T.teal : '2px solid transparent', color: activeTab === i ? T.teal : 'rgba(239,246,255,0.7)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: T.sans, whiteSpace: 'nowrap', transition: 'color 150ms' }}>
            {tab}
            {tab === 'Approvals' && approvalCount > 0 && (
              <span style={{ marginLeft: '6px', background: T.red, color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '9px', fontFamily: T.mono }}>{approvalCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 32px 80px' }}>
        {activeTab === 0 && <TabOverview  client={client} />}
        {activeTab === 1 && <TabDataFiles client={client} />}
        {activeTab === 2 && <TabGapsNeeds client={client} />}
        {activeTab === 3 && <TabApprovals client={client} />}
        {activeTab === 4 && <TabAuditLog  client={client} />}
        {activeTab === 5 && <TabIntelligence client={client} />}
        {activeTab === 6 && <TabTeamAccess  client={client} />}
      </div>
    </div>
  )
}
