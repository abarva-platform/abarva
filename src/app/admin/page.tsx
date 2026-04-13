'use client'
import { useState, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { CLIENT_REGISTRY, getTotalPortfolioValue, type ClientEntry, type DataCategory } from '@/lib/client-registry'

const T = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#1C2128',
  border: '#21262D',
  border2: '#30363D',
  text: '#E6EDF3',
  text2: '#C9D1D9',
  text3: '#8B949E',
  teal: '#2DD4C8',
  blue: '#4DA3FF',
  green: '#6EE7B7',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#A78BFA',
}

const LINKS = [
  { href: '/admin', label: 'Engagement Hub', active: true },
  { href: '/admin/new-client', label: 'New Engagement' },
  { href: '/admin/playbook', label: 'Playbook' },
  { href: '/admin/data', label: 'Data Loader' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/outcomes', label: 'Outcome Tracker' },
  { href: '/admin/intelligence', label: 'Intelligence' },
  { href: '/admin/revenue', label: 'Revenue' },
]

const ACTIVITY = [
  { time: '2h', action: 'AI Strategy Step 4 completed', client: 'Meridian', type: 'product' },
  { time: '3h', action: 'Einstein business case exported', client: 'Apex Retail', type: 'export' },
  { time: '5h', action: 'Q2 financials uploaded', client: 'First Capital', type: 'data' },
  { time: '8h', action: 'Regulatory alert — CMS Prior Auth rule', client: 'Meridian', type: 'alert' },
  { time: '1d', action: 'FedNow architecture review scheduled', client: 'First Capital', type: 'milestone' },
]

const ALERTS = [
  { label: 'CMS Prior Auth mandate — Jan 2026', color: T.red },
  { label: 'First Capital OCC exam — Q2 2026', color: T.amber },
  { label: 'Apex SAP ECC EOS — 2027', color: T.amber },
  { label: 'Meridian MA Stars deadline — Sep 2025', color: T.red },
]

const STEPS = [
  { n: 1, label: 'Create engagement', desc: 'Client name, vertical, team roster' },
  { n: 2, label: 'Load data', desc: 'Upload files by category, steward approves' },
  { n: 3, label: 'Intelligence activates', desc: 'Dashboard populates with findings' },
  { n: 4, label: 'Run workflows', desc: 'Diagnose → Strategize → Select → Track' },
  { n: 5, label: 'Outcomes verified', desc: 'Outcome fee triggered on verified savings' },
]

function fmtPortfolio(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  return `$${Math.round(n / 1e6)}M`
}

// ─── Data Category Badge ──────────────────────────────────────────────────────

function DataBadge({ cat, onClick }: { cat: DataCategory; onClick: () => void }) {
  const statusConfig = {
    loaded: { bg: '#0D2B1A', border: '#166534', text: '#6EE7B7', icon: '✓' },
    pending: { bg: '#2B1D00', border: '#78350F', text: '#F59E0B', icon: '⏳' },
    missing: { bg: '#1C1C1C', border: '#30363D', text: '#8B949E', icon: '✗' },
    na: { bg: '#161B22', border: '#21262D', text: '#4B5563', icon: '—' },
  }[cat.status]

  return (
    <button
      onClick={cat.status !== 'na' ? onClick : undefined}
      title={cat.status === 'na' ? 'Not applicable' : `${cat.label} — click for details`}
      style={{
        padding: '4px 8px', borderRadius: '6px', border: '1px solid ' + statusConfig.border,
        background: statusConfig.bg, cursor: cat.status !== 'na' ? 'pointer' : 'default',
        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
        transition: 'all 120ms',
      }}
      onMouseEnter={e => { if (cat.status !== 'na') (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
    >
      <span style={{ fontSize: '9px', color: statusConfig.text }}>{statusConfig.icon}</span>
      <span style={{ fontSize: '9px', fontWeight: 700, color: statusConfig.text, letterSpacing: '0.06em' }}>{cat.label}</span>
    </button>
  )
}

// ─── Data Detail Panel ────────────────────────────────────────────────────────

function DataDetailPanel({
  client, categoryKey, onClose,
}: { client: ClientEntry; categoryKey: string; onClose: () => void }) {
  const cat = client.dataCategories.find(c => c.key === categoryKey)
  if (!cat) return null

  const statusLabel = { loaded: '✓ Active', pending: '⏳ Pending approval', missing: '✗ Missing', na: '— Not applicable' }[cat.status]
  const statusColor = { loaded: T.green, pending: T.amber, missing: T.text3, na: T.text3 }[cat.status]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      {/* Panel */}
      <div style={{ width: '420px', background: T.surface, borderLeft: '1px solid ' + T.border, overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + T.border, background: T.surface2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{client.shortName}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: T.text }}>{cat.label} DATA</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: '18px', padding: '0', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: statusColor }}>{statusLabel}</span>
            {cat.status === 'loaded' && cat.powers.length > 0 && (
              <span style={{ fontSize: '11px', color: T.text3 }}>— powering {cat.powers.length} intelligence modules</span>
            )}
          </div>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>
          {cat.status === 'na' ? (
            <div style={{ padding: '16px', background: T.bg, borderRadius: '8px', border: '1px solid ' + T.border }}>
              <p style={{ fontSize: '13px', color: T.text3, margin: 0 }}>{cat.missingUnlocks?.[0] ?? 'Not applicable for this engagement type.'}</p>
            </div>
          ) : cat.status === 'missing' ? (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>WHAT UPLOADING WOULD UNLOCK</div>
                {cat.missingUnlocks?.map((u, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', padding: '8px 10px', background: T.bg, borderRadius: '6px', marginBottom: '6px', border: '1px solid ' + T.border }}>
                    <span style={{ color: T.teal, flexShrink: 0, fontSize: '11px' }}>◈</span>
                    <span style={{ fontSize: '12px', color: T.text2 }}>{u}</span>
                  </div>
                ))}
                {cat.missingValue && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: '#0D2B1A', border: '1px solid #166534', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: T.green }}>Estimated value unlock: {cat.missingValue}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, padding: '10px', background: T.teal, color: '#0D1117', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Upload {cat.label} Data →
                </button>
                <button style={{ padding: '10px 14px', background: T.surface2, color: T.text3, border: '1px solid ' + T.border2, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  File format →
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Loaded', value: cat.loadedDate ?? '—' },
                  { label: 'Approved by', value: cat.approvedBy ?? '—' },
                  { label: 'File', value: cat.fileName ?? '—' },
                  { label: 'Status', value: 'Active — verified' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '10px', background: T.bg, borderRadius: '6px', border: '1px solid ' + T.border }}>
                    <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: T.text2, wordBreak: 'break-word' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Key data points */}
              {cat.keyPoints.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>KEY DATA POINTS ACTIVE</div>
                  {cat.keyPoints.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '7px 10px', background: T.bg, borderRadius: '6px', marginBottom: '5px', border: '1px solid ' + T.border }}>
                      <span style={{ color: T.teal, flexShrink: 0, fontSize: '10px', marginTop: '1px' }}>•</span>
                      <span style={{ fontSize: '12px', color: T.text2 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* What it powers */}
              {cat.powers.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>WHAT THIS POWERS</div>
                  {cat.powers.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', padding: '7px 10px', background: '#0D1E2B', borderRadius: '6px', marginBottom: '5px', border: '1px solid #1E3A5F' }}>
                      <span style={{ color: T.blue, flexShrink: 0, fontSize: '10px', marginTop: '1px' }}>◈</span>
                      <span style={{ fontSize: '12px', color: T.text2 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Intelligence Summary Overlay ─────────────────────────────────────────────

function IntelligenceSummary({ client, onClose }: { client: ClientEntry; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: T.surface, border: '1px solid ' + T.border, borderTop: '3px solid ' + client.color, borderRadius: '16px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid ' + T.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>INTELLIGENCE SUMMARY</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: T.text }}>{client.name}</div>
              <div style={{ fontSize: '12px', color: T.text3, marginTop: '4px' }}>
                {client.vertical} · {client.dataCompleteness}% data completeness · {client.intelligence.contradictions} contradictions mapped
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: '20px', padding: '0', lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Critical issues */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px' }}>🔴</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {client.intelligence.critical.length} CRITICAL ISSUES DETECTED
              </span>
            </div>
            {client.intelligence.critical.map((issue, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 14px', background: '#1A0A0A', border: '1px solid ' + T.red + '30', borderRadius: '8px', marginBottom: '8px' }}>
                <span style={{ color: T.red, flexShrink: 0, fontSize: '12px', marginTop: '1px' }}>✕</span>
                <div>
                  <div style={{ fontSize: '13px', color: T.text, marginBottom: '2px' }}>{issue.text}</div>
                  {issue.metric && <div style={{ fontSize: '11px', fontWeight: 700, color: T.red }}>{issue.metric}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Intelligence ready */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px' }}>📊</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: client.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>INTELLIGENCE READY</span>
            </div>
            {client.intelligence.ready.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: T.surface2, border: '1px solid ' + T.border, borderRadius: '8px', marginBottom: '8px', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.text, marginBottom: '2px' }}>{item.product}</div>
                  <div style={{ fontSize: '11px', color: T.text3 }}>{item.summary}</div>
                </div>
                <a href={item.href} style={{ flexShrink: 0, padding: '7px 14px', background: client.color, color: '#0D1117', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Open →
                </a>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href={client.intelligence.ready[0]?.href ?? `/diagnose?client=${client.id}`}
              style={{ flex: 1, display: 'block', padding: '14px', background: client.color, color: '#0D1117', borderRadius: '10px', fontSize: '14px', fontWeight: 800, textDecoration: 'none', textAlign: 'center' }}>
              Start with {client.intelligence.ready[0]?.product ?? 'Situation Intelligence'} →
            </a>
            <a href={`/diagnose?client=${client.id}`}
              style={{ padding: '14px 18px', background: T.surface2, color: T.text3, border: '1px solid ' + T.border2, borderRadius: '10px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}>
              See all 9 products →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Engagement Card ──────────────────────────────────────────────────────────

function EngagementCard({
  client, onOpenSummary, onOpenPanel,
}: {
  client: ClientEntry
  onOpenSummary: () => void
  onOpenPanel: (key: string) => void
}) {
  const statusColor = { critical: T.red, warning: T.amber, ok: T.green }
  const loadedCount = client.dataCategories.filter(c => c.status === 'loaded').length
  const totalCount = client.dataCategories.filter(c => c.status !== 'na').length

  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderLeft: '4px solid ' + client.color, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid ' + T.border }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: T.text }}>{client.name}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: client.color, background: client.color + '18', border: '1px solid ' + client.color + '40', borderRadius: '4px', padding: '1px 7px' }}>{client.vertical.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: '11px', color: T.text3 }}>
              {client.revenue} · {client.employees} employees · Maestro: {client.maestro} · Since {client.startDate}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '10px', color: T.text3, marginBottom: '2px' }}>Data loaded</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: client.color }}>{loadedCount}/{totalCount}</div>
          </div>
        </div>

        {/* Completeness bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Completeness</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: T.text2 }}>{client.dataCompleteness}%</span>
          </div>
          <div style={{ height: '4px', background: T.border2, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: client.dataCompleteness + '%', background: client.dataCompleteness >= 90 ? T.green : client.dataCompleteness >= 70 ? T.amber : T.red, borderRadius: '2px', transition: 'width 1s ease' }} />
          </div>
        </div>
      </div>

      {/* Key metrics (4) */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + T.border }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {client.keyMetrics.map((m, i) => (
            <div key={i} style={{ background: T.surface2, border: '1px solid ' + (m.status === 'critical' ? T.red + '30' : m.status === 'warning' ? T.amber + '30' : T.border), borderRadius: '6px', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: T.text3, marginBottom: '2px', lineHeight: 1.2 }}>{m.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: m.status === 'critical' ? T.red : m.status === 'warning' ? T.amber : T.green }}>{m.value}</div>
              <div style={{ fontSize: '10px', color: T.text3 }}>{m.target}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data category status row */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid ' + T.border, background: T.bg }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>DATA CATEGORIES</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {client.dataCategories.map(cat => (
            <DataBadge key={cat.key} cat={cat} onClick={() => onOpenPanel(cat.key)} />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '14px 20px', display: 'flex', gap: '8px' }}>
        <a
          href={'/admin/client/' + client.id}
          style={{ flex: 1, padding: '10px', background: client.color, color: '#0D1117', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', textAlign: 'center' }}
        >
          Open Intelligence →
        </a>
        <button
          onClick={() => onOpenPanel('financials')}
          style={{ padding: '10px 18px', background: T.surface2, color: T.text, border: '1px solid ' + T.border2, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          View Data →
        </button>
      </div>
    </div>
  )
}

// ─── How This Works ───────────────────────────────────────────────────────────

function HowItWorks({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, background: T.teal + '20', color: T.teal, border: '1px solid ' + T.teal + '40', borderRadius: '4px', padding: '2px 8px', letterSpacing: '0.06em' }}>HOW ABARVA WORKS</span>
          <span style={{ fontSize: '13px', color: T.text2, fontWeight: 500 }}>Five steps from first meeting to verified outcome</span>
        </div>
        <span style={{ fontSize: '16px', color: T.text3, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid ' + T.border }}>
          <div style={{ paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: '16px', left: '50%', width: '100%', height: '1px', background: T.border2, zIndex: 0 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: T.teal, color: '#0D1117', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>{s.n}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '11px', color: T.text3, lineHeight: 1.3 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid ' + T.border }}>
            <a href="/admin/new-client" style={{ padding: '8px 18px', background: T.teal, color: '#0D1117', borderRadius: '7px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
              Start with a test client →
            </a>
            <a href="/admin/data" style={{ padding: '8px 18px', background: T.surface2, color: T.text3, border: '1px solid ' + T.border2, borderRadius: '7px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              See sample data files →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PORTFOLIO_TOTAL = getTotalPortfolioValue()

export default function AdminHub() {
  const [activePanel, setActivePanel] = useState<{ clientId: string; categoryKey: string } | null>(null)
  const [openSummary, setOpenSummary] = useState<string | null>(null)
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
  const [alertIdx, setAlertIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setAlertIdx(i => (i + 1) % ALERTS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const activePanelClient = activePanel ? CLIENT_REGISTRY.find(c => c.id === activePanel.clientId) ?? null : null
  const summaryClient = openSummary ? CLIENT_REGISTRY.find(c => c.id === openSummary) ?? null : null

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.text }}>

      {/* Demo mode banner */}
      <div style={{ background: '#0D2B1A', borderBottom: '1px solid ' + T.green + '30', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.green, flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: T.green, fontWeight: 600 }}>
          Demo environment · Meridian, First Capital, and Apex Retail have pre-loaded data. Click any client to explore their intelligence.
        </span>
      </div>

      <AbarvaNav clientId="meridian" activePage="admin" />

      {/* Subnav */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '0 24px', display: 'flex', gap: '0', overflowX: 'auto' }}>
        {LINKS.map(link => (
          <a key={link.href} href={link.href} style={{ display: 'block', padding: '0 16px', height: '44px', lineHeight: '44px', fontSize: '13px', fontWeight: link.active ? 700 : 500, textDecoration: 'none', color: link.active ? T.teal : T.text3, borderBottom: link.active ? '2px solid ' + T.teal : '2px solid transparent', whiteSpace: 'nowrap' }}>
            {link.label}
          </a>
        ))}
      </div>

      {/* Zone 1 — Command Header */}
      <div style={{ background: T.surface2, borderBottom: '1px solid ' + T.border, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Anand Sundaram · Lead Maestro</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: T.text }}>Engagement Hub</span>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#0D4A3A', color: T.green, border: '1px solid ' + T.green + '40', borderRadius: '4px', padding: '2px 8px' }}>{CLIENT_REGISTRY.length} ACTIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Portfolio Value', value: fmtPortfolio(PORTFOLIO_TOTAL), color: T.teal },
            { label: 'Avg Completeness', value: `${Math.round(CLIENT_REGISTRY.reduce((s, c) => s + c.dataCompleteness, 0) / CLIENT_REGISTRY.length)}%`, color: T.green },
            { label: 'Active Clients', value: String(CLIENT_REGISTRY.length), color: T.blue },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: T.text3, marginBottom: '2px' }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
        <a href="/admin/new-client" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: T.teal, color: '#0D1117', textDecoration: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 800, flexShrink: 0, whiteSpace: 'nowrap' }}>
          + New Engagement
        </a>
      </div>

      {/* Zone 2 + 3 */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

        {/* Zone 2 — Engagement Cards + How This Works */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active Engagements</div>

          {CLIENT_REGISTRY.map(client => (
            <EngagementCard
              key={client.id}
              client={client}
              onOpenSummary={() => setOpenSummary(client.id)}
              onOpenPanel={(key) => setActivePanel({ clientId: client.id, categoryKey: key })}
            />
          ))}

          <HowItWorks open={howItWorksOpen} onToggle={() => setHowItWorksOpen(v => !v)} />
        </div>

        {/* Zone 3 — Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Portfolio summary */}
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Portfolio Summary</div>
            {[
              { label: 'Total value identified', value: fmtPortfolio(PORTFOLIO_TOTAL), color: T.teal },
              { label: 'Active engagements', value: String(CLIENT_REGISTRY.length), color: T.blue },
              { label: 'Avg data completeness', value: `${Math.round(CLIENT_REGISTRY.reduce((s, c) => s + c.dataCompleteness, 0) / CLIENT_REGISTRY.length)}%`, color: T.green },
              { label: 'Contradictions mapped', value: String(CLIENT_REGISTRY.reduce((s, c) => s + c.intelligence.contradictions, 0)), color: T.amber },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid ' + T.border : 'none' }}>
                <span style={{ fontSize: '12px', color: T.text3 }}>{m.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Regulatory alert ticker */}
          <div style={{ background: T.surface, border: '1px solid ' + T.amber + '40', borderRadius: '12px', padding: '12px 16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.amber, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Regulatory Alerts</div>
            <div style={{ minHeight: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ALERTS[alertIdx].color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: T.text2 }}>{ALERTS[alertIdx].label}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {ALERTS.map((_, i) => (
                <span key={i} style={{ width: '6px', height: '2px', borderRadius: '1px', background: i === alertIdx ? T.amber : T.border2 }} />
              ))}
            </div>
          </div>

          {/* Quick access */}
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Quick Access</div>
            {CLIENT_REGISTRY.map(client => (
              <a key={client.id}
                href={'/admin/client/' + client.id}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 0', textDecoration: 'none', borderBottom: '1px solid ' + T.border, marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: client.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: T.text2, textAlign: 'left' }}>{client.shortName}</span>
                <span style={{ fontSize: '11px', color: T.text3 }}>{client.dataCompleteness}%</span>
                <span style={{ fontSize: '11px', color: client.color }}>→</span>
              </a>
            ))}
          </div>

          {/* Activity feed */}
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Activity Feed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ACTIVITY.map((act, i) => {
                const dotColor: Record<string, string> = { product: T.blue, export: T.green, data: T.purple, alert: T.red, milestone: T.teal }
                return (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor[act.type] ?? T.text3, flexShrink: 0, marginTop: '5px' }} />
                    <div>
                      <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.4 }}>{act.action}</div>
                      <div style={{ fontSize: '11px', color: T.text3 }}>{act.client} · {act.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Data Detail Panel */}
      {activePanel && activePanelClient && (
        <DataDetailPanel
          client={activePanelClient}
          categoryKey={activePanel.categoryKey}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Intelligence Summary Overlay */}
      {openSummary && summaryClient && (
        <IntelligenceSummary
          client={summaryClient}
          onClose={() => setOpenSummary(null)}
        />
      )}
    </div>
  )
}
